# ECS Service Module - frameworkTicketing
# Target group, ALB listener rule, ECS task definition, and ECS service
# on the shared ECS cluster / ALB.

variable "project_name" {
  type = string
}

variable "environment" {
  type = string
}

variable "vpc_id" {
  type = string
}

variable "ecs_cluster_name" {
  type = string
}

variable "ecs_cluster_arn" {
  type = string
}

variable "alb_listener_arn" {
  type        = string
  description = "ARN of the shared ALB HTTP listener"
}

variable "host_header" {
  type        = string
  description = "Host header for ALB routing (e.g., ticketing.dev.vacso.com)"
}

variable "ecr_repository_url" {
  type = string
}

variable "execution_role_arn" {
  type = string
}

variable "task_role_arn" {
  type = string
}

variable "log_group_name" {
  type = string
}

variable "aws_region" {
  type    = string
  default = "us-east-2"
}

variable "db_credentials_secret_arn" {
  type = string
}

variable "app_secrets_arn" {
  type = string
}

variable "frontend_url" {
  type        = string
  description = "Public URL of the frontend (used by backend for email links)"
}

variable "container_port" {
  type    = number
  default = 3001
}

variable "cpu" {
  type    = number
  default = 256
}

variable "memory" {
  type    = number
  default = 512
}

variable "desired_count" {
  type    = number
  default = 1
}

variable "listener_rule_priority" {
  type        = number
  default     = 110
  description = "Priority for the ALB listener rule (must be unique across consumers on the shared ALB; casenet uses 100)"
}

# ------------------------------------------------------------------------------
# ALB Target Group
# ------------------------------------------------------------------------------

resource "aws_lb_target_group" "app" {
  name        = "${var.project_name}-${var.environment}-tg"
  port        = var.container_port
  protocol    = "HTTP"
  vpc_id      = var.vpc_id
  target_type = "instance"

  health_check {
    path                = "/api/core/healthcheck/status"
    port                = "traffic-port"
    healthy_threshold   = 2
    unhealthy_threshold = 3
    timeout             = 5
    interval            = 30
    matcher             = "200"
  }

  tags = {
    Name        = "${var.project_name}-${var.environment}-tg"
    Environment = var.environment
  }
}

# ------------------------------------------------------------------------------
# ALB Listener Rule (host-based routing on shared ALB)
# ------------------------------------------------------------------------------

resource "aws_lb_listener_rule" "app" {
  listener_arn = var.alb_listener_arn
  priority     = var.listener_rule_priority

  action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.app.arn
  }

  condition {
    host_header {
      values = [var.host_header]
    }
  }

  tags = {
    Name        = "${var.project_name}-${var.environment}-rule"
    Environment = var.environment
  }
}

# ------------------------------------------------------------------------------
# ECS Task Definition (EC2 launch type, bridge networking)
# ------------------------------------------------------------------------------

resource "aws_ecs_task_definition" "app" {
  family                   = "${var.project_name}-${var.environment}"
  requires_compatibilities = ["EC2"]
  network_mode             = "bridge"
  execution_role_arn       = var.execution_role_arn
  task_role_arn            = var.task_role_arn
  cpu                      = var.cpu
  memory                   = var.memory

  container_definitions = jsonencode([
    {
      name      = "${var.project_name}-api"
      image     = "${var.ecr_repository_url}:latest"
      essential = true
      cpu       = var.cpu
      memory    = var.memory

      portMappings = [
        {
          containerPort = var.container_port
          hostPort      = 0
          protocol      = "tcp"
        }
      ]

      environment = [
        { name = "NODE_ENV", value = "production" },
        { name = "PORT", value = tostring(var.container_port) },
        { name = "FRONTEND_BASE_URL", value = var.frontend_url },
        { name = "SYNC_USERS", value = "0" },
        { name = "SIGNUP_ENABLED", value = "false" },
        { name = "FORGOT_PASSWORD_ENABLED", value = "false" },
      ]

      secrets = [
        { name = "MARIADB_HOST", valueFrom = "${var.db_credentials_secret_arn}:host::" },
        { name = "MARIADB_USER", valueFrom = "${var.db_credentials_secret_arn}:username::" },
        { name = "MARIADB_PASSWORD", valueFrom = "${var.db_credentials_secret_arn}:password::" },
        { name = "SECRET", valueFrom = "${var.app_secrets_arn}:SECRET::" },
        { name = "ADMIN_PASSWORD", valueFrom = "${var.app_secrets_arn}:ADMIN_PASSWORD::" },
        { name = "MICROSOFT_CLIENT_ID", valueFrom = "${var.app_secrets_arn}:MICROSOFT_CLIENT_ID::" },
        { name = "MICROSOFT_CLIENT_SECRET", valueFrom = "${var.app_secrets_arn}:MICROSOFT_CLIENT_SECRET::" },
        { name = "MICROSOFT_TENANT_ID", valueFrom = "${var.app_secrets_arn}:MICROSOFT_TENANT_ID::" },
        { name = "MICROSOFT_EMAIL_ADDRESS", valueFrom = "${var.app_secrets_arn}:MICROSOFT_EMAIL_ADDRESS::" },
        { name = "GOOGLE_PROJECT_ID", valueFrom = "${var.app_secrets_arn}:GOOGLE_PROJECT_ID::" },
        { name = "GOOGLE_PRIVATE_KEY_ID", valueFrom = "${var.app_secrets_arn}:GOOGLE_PRIVATE_KEY_ID::" },
        { name = "GOOGLE_PRIVATE_KEY", valueFrom = "${var.app_secrets_arn}:GOOGLE_PRIVATE_KEY::" },
        { name = "GOOGLE_CLIENT_EMAIL", valueFrom = "${var.app_secrets_arn}:GOOGLE_CLIENT_EMAIL::" },
        { name = "GOOGLE_CLIENT_ID", valueFrom = "${var.app_secrets_arn}:GOOGLE_CLIENT_ID::" },
        { name = "GOOGLE_EMAIL_ADDRESS", valueFrom = "${var.app_secrets_arn}:GOOGLE_EMAIL_ADDRESS::" },
      ]

      logConfiguration = {
        logDriver = "awslogs"
        options = {
          "awslogs-group"         = var.log_group_name
          "awslogs-region"        = var.aws_region
          "awslogs-stream-prefix" = var.project_name
        }
      }

      healthCheck = {
        command     = ["CMD-SHELL", "curl -f http://localhost:${var.container_port}/api/core/healthcheck/status || exit 1"]
        interval    = 30
        timeout     = 5
        retries     = 3
        startPeriod = 60
      }
    }
  ])

  tags = {
    Name        = "${var.project_name}-${var.environment}-task"
    Environment = var.environment
  }
}

# ------------------------------------------------------------------------------
# ECS Service
# ------------------------------------------------------------------------------

resource "aws_ecs_service" "app" {
  name            = "${var.project_name}-${var.environment}"
  cluster         = var.ecs_cluster_arn
  task_definition = aws_ecs_task_definition.app.arn
  desired_count   = var.desired_count
  launch_type     = "EC2"

  deployment_maximum_percent         = 200
  deployment_minimum_healthy_percent = 100

  deployment_circuit_breaker {
    enable   = true
    rollback = true
  }

  load_balancer {
    target_group_arn = aws_lb_target_group.app.arn
    container_name   = "${var.project_name}-api"
    container_port   = var.container_port
  }

  # Target group must be attached to the shared ALB (via the listener
  # rule) before CreateService accepts it, otherwise first apply races
  # with "target group does not have an associated load balancer".
  depends_on = [aws_lb_listener_rule.app]

  tags = {
    Name        = "${var.project_name}-${var.environment}-service"
    Environment = var.environment
  }
}

# ------------------------------------------------------------------------------
# Outputs
# ------------------------------------------------------------------------------

output "service_name" {
  value = aws_ecs_service.app.name
}

output "task_definition_arn" {
  value = aws_ecs_task_definition.app.arn
}

output "target_group_arn" {
  value = aws_lb_target_group.app.arn
}
