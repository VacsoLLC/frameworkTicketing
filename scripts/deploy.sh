#!/usr/bin/env bash
set -euo pipefail

# frameworkTicketing deployment script
# Usage:
#   ./scripts/deploy.sh --all           # Deploy both backend + frontend
#   ./scripts/deploy.sh --backend-only  # API container only
#   ./scripts/deploy.sh --frontend-only # React frontend only

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
TF_DIR="$PROJECT_DIR/terraform/environments/dev"
REGION="us-east-2"

DEPLOY_BACKEND=false
DEPLOY_FRONTEND=false

usage() {
  cat <<EOF
Usage: ./scripts/deploy.sh [OPTIONS]

Deploy frameworkTicketing (backend API and/or frontend) to the shared
vacso dev environment.

Options:
  --all            Deploy both backend and frontend
  --backend-only   Build & push Docker image, force-redeploy ECS service
  --frontend-only  Build React app, sync to S3, invalidate CloudFront
  -h, --help       Show this help message and exit

Prerequisites:
  - AWS CLI configured with credentials for the vacso dev account
  - terraform outputs available in $TF_DIR (run 'terraform apply' first)
  - Docker installed (for backend deployment)
  - yarn installed (for frontend deployment)
EOF
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    -h|--help)       usage; exit 0 ;;
    --all)           DEPLOY_BACKEND=true; DEPLOY_FRONTEND=true; shift ;;
    --backend-only)  DEPLOY_BACKEND=true; shift ;;
    --frontend-only) DEPLOY_FRONTEND=true; shift ;;
    *) echo "Unknown option: $1"; echo "Run './scripts/deploy.sh --help' for usage."; exit 1 ;;
  esac
done

if [ "$DEPLOY_BACKEND" = false ] && [ "$DEPLOY_FRONTEND" = false ]; then
  usage
  exit 1
fi

echo "Reading terraform outputs..."
cd "$TF_DIR"
ECR_URL=$(terraform output -raw ecr_repository_url)
CLUSTER_NAME=$(terraform output -raw ecs_cluster_name)
SERVICE_NAME=$(terraform output -raw ecs_service_name)
S3_BUCKET=$(terraform output -raw s3_bucket_name)
CF_DIST_ID=$(terraform output -raw cloudfront_distribution_id)
cd "$PROJECT_DIR"

AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
ECR_REGISTRY="${AWS_ACCOUNT_ID}.dkr.ecr.${REGION}.amazonaws.com"

# --- Backend deployment ---
if [ "$DEPLOY_BACKEND" = true ]; then
  echo ""
  echo "=== Deploying Backend ==="

  echo "Logging in to ECR..."
  aws ecr get-login-password --region "$REGION" \
    | docker login --username AWS --password-stdin "$ECR_REGISTRY"

  echo "Building Docker image..."
  docker build -t "$ECR_URL:latest" -f docker/Dockerfile.ecs .

  echo "Pushing Docker image..."
  docker push "$ECR_URL:latest"

  echo "Forcing ECS service redeploy..."
  aws ecs update-service \
    --cluster "$CLUSTER_NAME" \
    --service "$SERVICE_NAME" \
    --force-new-deployment \
    --region "$REGION" \
    --no-cli-pager

  echo "Waiting for deployment to stabilize (up to 10 min)..."
  aws ecs wait services-stable \
    --cluster "$CLUSTER_NAME" \
    --services "$SERVICE_NAME" \
    --region "$REGION"

  echo "Backend deployment complete."
fi

# --- Frontend deployment ---
if [ "$DEPLOY_FRONTEND" = true ]; then
  echo ""
  echo "=== Deploying Frontend ==="

  echo "Installing frontend dependencies..."
  cd "$PROJECT_DIR/frontend"
  yarn install --frozen-lockfile

  echo "Building frontend..."
  yarn build

  echo "Syncing assets to S3 (long cache)..."
  aws s3 sync dist/ "s3://$S3_BUCKET/" \
    --delete \
    --region "$REGION" \
    --exclude "index.html" \
    --cache-control "max-age=31536000, immutable"

  echo "Uploading index.html (no cache)..."
  aws s3 cp dist/index.html "s3://$S3_BUCKET/index.html" \
    --region "$REGION" \
    --cache-control "no-cache, no-store, must-revalidate"

  echo "Writing version.txt..."
  echo "$(date +%s)" > /tmp/ticketing-version.txt
  aws s3 cp /tmp/ticketing-version.txt "s3://$S3_BUCKET/version.txt" \
    --region "$REGION" \
    --cache-control "no-cache, no-store, must-revalidate" \
    --content-type "text/plain"
  rm -f /tmp/ticketing-version.txt

  echo "Invalidating CloudFront cache..."
  aws cloudfront create-invalidation \
    --distribution-id "$CF_DIST_ID" \
    --paths "/index.html" "/version.txt" \
    --no-cli-pager

  cd "$PROJECT_DIR"
  echo "Frontend deployed."
fi

echo ""
echo "=== Deployment complete ==="
