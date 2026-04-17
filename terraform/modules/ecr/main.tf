# ECR Module
# Creates container registry for Docker images

variable "project_name" {
  type = string
}

variable "environment" {
  type = string
}

variable "image_retention_count" {
  type    = number
  default = 10
}

# ------------------------------------------------------------------------------
# ECR Repository
# ------------------------------------------------------------------------------

resource "aws_ecr_repository" "api" {
  name                 = "${var.project_name}-${var.environment}-api"
  image_tag_mutability = "MUTABLE"

  image_scanning_configuration {
    scan_on_push = true
  }

  encryption_configuration {
    encryption_type = "AES256"
  }

  tags = {
    Name        = "${var.project_name}-${var.environment}-api"
    Environment = var.environment
  }
}

# ------------------------------------------------------------------------------
# Lifecycle Policy - Keep last N images
# ------------------------------------------------------------------------------

resource "aws_ecr_lifecycle_policy" "api" {
  repository = aws_ecr_repository.api.name

  policy = jsonencode({
    rules = [
      {
        rulePriority = 1
        description  = "Keep last ${var.image_retention_count} images"
        selection = {
          tagStatus     = "any"
          countType     = "imageCountMoreThan"
          countNumber   = var.image_retention_count
        }
        action = {
          type = "expire"
        }
      }
    ]
  })
}

# ------------------------------------------------------------------------------
# Outputs
# ------------------------------------------------------------------------------

output "repository_url" {
  value = aws_ecr_repository.api.repository_url
}

output "repository_arn" {
  value = aws_ecr_repository.api.arn
}

output "registry_id" {
  value = aws_ecr_repository.api.registry_id
}
