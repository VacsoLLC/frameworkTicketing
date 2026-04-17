# frameworkTicketing Dev Environment
# Deploys the ticketing app onto the shared vacso dev infrastructure
# (shared ECS cluster, shared ALB, shared MariaDB RDS, dev.vacso.com zone).

terraform {
  required_version = ">= 1.5.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    random = {
      source  = "hashicorp/random"
      version = "~> 3.0"
    }
  }

  backend "s3" {
    bucket         = "vacso-dev-tfstate"
    key            = "frameworkticketing/terraform.tfstate"
    region         = "us-east-2"
    dynamodb_table = "terraform-locks"
    encrypt        = true
  }
}

provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Project     = var.project_name
      Environment = var.environment
      ManagedBy   = "terraform"
    }
  }
}

# Secondary provider in us-east-1 for CloudFront ACM certificates
provider "aws" {
  alias  = "us_east_1"
  region = "us-east-1"

  default_tags {
    tags = {
      Project     = var.project_name
      Environment = var.environment
      ManagedBy   = "terraform"
    }
  }
}

# ------------------------------------------------------------------------------
# Variables
# ------------------------------------------------------------------------------

variable "aws_region" {
  type    = string
  default = "us-east-2"
}

variable "project_name" {
  type    = string
  default = "frameworkticketing"
}

variable "environment" {
  type    = string
  default = "dev"
}

variable "domain_name" {
  type        = string
  default     = "ticketing.dev.vacso.com"
  description = "Public hostname for the ticketing app"
}

# ------------------------------------------------------------------------------
# Remote State (shared infrastructure)
# ------------------------------------------------------------------------------

data "terraform_remote_state" "shared" {
  backend = "s3"
  config = {
    bucket = "vacso-dev-tfstate"
    key    = "shared/terraform.tfstate"
    region = "us-east-2"
  }
}

# ------------------------------------------------------------------------------
# Data Sources
# ------------------------------------------------------------------------------

data "aws_caller_identity" "current" {}

data "aws_route53_zone" "dev" {
  name = "dev.vacso.com"
}

# ------------------------------------------------------------------------------
# Application Secrets
# ------------------------------------------------------------------------------
# SECRET  - JWT/token signing key (generated)
# ADMIN_PASSWORD - seeded admin user password (generated)
# MICROSOFT_* / GOOGLE_* - email + SSO credentials (empty stubs; fill in later)

resource "random_password" "app_secret" {
  length  = 64
  special = false
}

resource "random_password" "admin_password" {
  length  = 24
  special = false
}

resource "aws_secretsmanager_secret" "app_secrets" {
  name                    = "${var.project_name}-${var.environment}-app-secrets"
  recovery_window_in_days = 0

  tags = {
    Name        = "${var.project_name}-${var.environment}-app-secrets"
    Environment = var.environment
  }
}

resource "aws_secretsmanager_secret_version" "app_secrets" {
  secret_id = aws_secretsmanager_secret.app_secrets.id
  secret_string = jsonencode({
    SECRET         = random_password.app_secret.result
    ADMIN_PASSWORD = random_password.admin_password.result

    MICROSOFT_CLIENT_ID     = ""
    MICROSOFT_CLIENT_SECRET = ""
    MICROSOFT_TENANT_ID     = ""
    MICROSOFT_EMAIL_ADDRESS = ""

    GOOGLE_PROJECT_ID     = ""
    GOOGLE_PRIVATE_KEY_ID = ""
    GOOGLE_PRIVATE_KEY    = ""
    GOOGLE_CLIENT_EMAIL   = ""
    GOOGLE_CLIENT_ID      = ""
    GOOGLE_EMAIL_ADDRESS  = ""
  })

  lifecycle {
    ignore_changes = [secret_string]
  }
}

# Grant the shared ECS execution role access to this app's secrets
# (ECS injects env vars from both our app_secrets and the shared RDS secret).
resource "aws_iam_role_policy" "app_secrets_access" {
  name = "${var.project_name}-${var.environment}-secrets-access"
  role = element(
    split("/", data.terraform_remote_state.shared.outputs.ecs_execution_role_arn),
    length(split("/", data.terraform_remote_state.shared.outputs.ecs_execution_role_arn)) - 1
  )

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = ["secretsmanager:GetSecretValue"]
        Resource = [
          aws_secretsmanager_secret.app_secrets.arn,
          data.terraform_remote_state.shared.outputs.rds_credentials_secret_arn,
        ]
      }
    ]
  })
}

# ------------------------------------------------------------------------------
# ECR (Container Registry)
# ------------------------------------------------------------------------------

module "ecr" {
  source = "../../modules/ecr"

  project_name = var.project_name
  environment  = var.environment
}

# ------------------------------------------------------------------------------
# DNS Certificate (ACM + Route 53 validation, us-east-1 for CloudFront)
# ------------------------------------------------------------------------------

module "dns_certificate" {
  source = "../../modules/dns-certificate"

  providers = {
    aws           = aws
    aws.us_east_1 = aws.us_east_1
  }

  project_name   = var.project_name
  environment    = var.environment
  domain_name    = var.domain_name
  hosted_zone_id = data.aws_route53_zone.dev.zone_id
}

# ------------------------------------------------------------------------------
# S3 + CloudFront (React frontend, /api/* routed to shared ALB)
# ------------------------------------------------------------------------------

module "frontend" {
  source = "../../modules/s3-cloudfront"

  project_name    = var.project_name
  environment     = var.environment
  api_domain      = data.terraform_remote_state.shared.outputs.alb_dns_name
  domain_name     = var.domain_name
  certificate_arn = module.dns_certificate.certificate_arn
  price_class     = "PriceClass_100"
}

# ------------------------------------------------------------------------------
# ECS Service (task def + service + ALB routing on shared cluster/ALB)
# ------------------------------------------------------------------------------

module "ecs_service" {
  source = "../../modules/ecs-service"

  project_name = var.project_name
  environment  = var.environment
  vpc_id       = data.terraform_remote_state.shared.outputs.vpc_id
  aws_region   = var.aws_region

  ecs_cluster_name = data.terraform_remote_state.shared.outputs.ecs_cluster_name
  ecs_cluster_arn  = data.terraform_remote_state.shared.outputs.ecs_cluster_arn

  alb_listener_arn = data.terraform_remote_state.shared.outputs.alb_listener_arn
  host_header      = var.domain_name

  ecr_repository_url = module.ecr.repository_url

  execution_role_arn = data.terraform_remote_state.shared.outputs.ecs_execution_role_arn
  task_role_arn      = data.terraform_remote_state.shared.outputs.ecs_task_role_arn

  log_group_name = data.terraform_remote_state.shared.outputs.ecs_log_group_name

  db_credentials_secret_arn = data.terraform_remote_state.shared.outputs.rds_credentials_secret_arn
  app_secrets_arn           = aws_secretsmanager_secret.app_secrets.arn

  frontend_url = "https://${var.domain_name}"

  container_port         = 3001
  cpu                    = 256
  memory                 = 512
  desired_count          = 1
  listener_rule_priority = 110
}

# ------------------------------------------------------------------------------
# Route 53 DNS Records (domain → CloudFront)
# ------------------------------------------------------------------------------

resource "aws_route53_record" "frontend_a" {
  zone_id = data.aws_route53_zone.dev.zone_id
  name    = var.domain_name
  type    = "A"

  alias {
    name                   = module.frontend.cloudfront_domain_name
    zone_id                = module.frontend.cloudfront_hosted_zone_id
    evaluate_target_health = false
  }
}

resource "aws_route53_record" "frontend_aaaa" {
  zone_id = data.aws_route53_zone.dev.zone_id
  name    = var.domain_name
  type    = "AAAA"

  alias {
    name                   = module.frontend.cloudfront_domain_name
    zone_id                = module.frontend.cloudfront_hosted_zone_id
    evaluate_target_health = false
  }
}

# ------------------------------------------------------------------------------
# Outputs
# ------------------------------------------------------------------------------

output "frontend_url" {
  description = "Public URL for the ticketing app"
  value       = module.frontend.website_url
}

output "api_url" {
  description = "Direct ALB URL (HTTP, for debugging only)"
  value       = "http://${data.terraform_remote_state.shared.outputs.alb_dns_name}"
}

output "ecr_repository_url" {
  description = "ECR repository URL for pushing Docker images"
  value       = module.ecr.repository_url
}

output "s3_bucket_name" {
  description = "S3 bucket for uploading the frontend build"
  value       = module.frontend.bucket_name
}

output "cloudfront_distribution_id" {
  description = "CloudFront distribution ID (for cache invalidation)"
  value       = module.frontend.cloudfront_distribution_id
}

output "ecs_cluster_name" {
  description = "Shared ECS cluster name"
  value       = data.terraform_remote_state.shared.outputs.ecs_cluster_name
}

output "ecs_service_name" {
  description = "ECS service name"
  value       = module.ecs_service.service_name
}

output "app_secrets_arn" {
  description = "Secrets Manager ARN for this app's secrets (edit to set email/SSO creds)"
  value       = aws_secretsmanager_secret.app_secrets.arn
}

output "admin_password_command" {
  description = "Command to retrieve the generated admin password"
  value       = "aws secretsmanager get-secret-value --secret-id ${aws_secretsmanager_secret.app_secrets.name} --query SecretString --output text | jq -r '.ADMIN_PASSWORD'"
}

output "aws_region" {
  description = "AWS region this stack is deployed in (read by scripts/deploy.sh)"
  value       = var.aws_region
}
