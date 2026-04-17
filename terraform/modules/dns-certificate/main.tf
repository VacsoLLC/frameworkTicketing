# DNS Certificate Module
# Creates ACM certificate with automatic DNS validation via Route 53
#
# IMPORTANT: CloudFront requires certificates in us-east-1, so this module
# must be called with providers that include an aws.us_east_1 alias.

terraform {
  required_providers {
    aws = {
      source                = "hashicorp/aws"
      configuration_aliases = [aws.us_east_1]
    }
  }
}

variable "project_name" {
  type = string
}

variable "environment" {
  type = string
}

variable "domain_name" {
  type        = string
  description = "The domain name for the certificate (e.g., cases.dev.vacso.com)"
}

variable "hosted_zone_id" {
  type        = string
  description = "The Route 53 hosted zone ID to use for DNS validation"
}

# ------------------------------------------------------------------------------
# ACM Certificate (must be in us-east-1 for CloudFront)
# ------------------------------------------------------------------------------

# Certificate for CloudFront (us-east-1)
resource "aws_acm_certificate" "cloudfront" {
  provider = aws.us_east_1

  domain_name       = var.domain_name
  validation_method = "DNS"

  lifecycle {
    create_before_destroy = true
  }

  tags = {
    Name        = "${var.project_name}-${var.environment}-cloudfront-cert"
    Environment = var.environment
  }
}

# DNS validation records for CloudFront certificate
resource "aws_route53_record" "cloudfront_validation" {
  for_each = {
    for dvo in aws_acm_certificate.cloudfront.domain_validation_options : dvo.domain_name => {
      name   = dvo.resource_record_name
      record = dvo.resource_record_value
      type   = dvo.resource_record_type
    }
  }

  allow_overwrite = true
  name            = each.value.name
  records         = [each.value.record]
  ttl             = 60
  type            = each.value.type
  zone_id         = var.hosted_zone_id
}

# Wait for CloudFront certificate validation
resource "aws_acm_certificate_validation" "cloudfront" {
  provider = aws.us_east_1

  certificate_arn         = aws_acm_certificate.cloudfront.arn
  validation_record_fqdns = [for record in aws_route53_record.cloudfront_validation : record.fqdn]
}

# ------------------------------------------------------------------------------
# Outputs
# ------------------------------------------------------------------------------

output "certificate_arn" {
  description = "ARN of the validated ACM certificate (for CloudFront)"
  value       = aws_acm_certificate_validation.cloudfront.certificate_arn
}

output "domain_name" {
  description = "The domain name"
  value       = var.domain_name
}

output "hosted_zone_id" {
  description = "Route 53 hosted zone ID used for validation"
  value       = var.hosted_zone_id
}
