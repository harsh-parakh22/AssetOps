terraform {
  required_version = ">= 1.8.0"
  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 5.0"
    }
  }
  backend "gcs" {
    bucket = "assetops-tf-state"
    prefix = "terraform/state"
  }
}

provider "google" {
  project = var.project_id
  region  = var.region
}

# ─── Variables ────────────────────────────────────────────────
variable "project_id" { type = string }
variable "region" { default = "asia-south1" }
variable "db_password" {
  type      = string
  sensitive = true
}
variable "redis_password" {
  type      = string
  sensitive = true
}
variable "jwt_secret" {
  type      = string
  sensitive = true
}

# ─── APIs ────────────────────────────────────────────────────
resource "google_project_service" "apis" {
  for_each = toset([
    "run.googleapis.com",
    "sqladmin.googleapis.com",
    "redis.googleapis.com",
    "secretmanager.googleapis.com",
    "artifactregistry.googleapis.com",
    "pubsub.googleapis.com",
    "vpcaccess.googleapis.com",
    "cloudscheduler.googleapis.com"
  ])
  service            = each.value
  disable_on_destroy = false
}

# ─── VPC ─────────────────────────────────────────────────────
resource "google_compute_network" "vpc" {
  name                    = "assetops-vpc"
  auto_create_subnetworks = false
}

resource "google_compute_subnetwork" "subnet" {
  name          = "assetops-subnet"
  ip_cidr_range = "10.10.0.0/24"
  region        = var.region
  network       = google_compute_network.vpc.id
}

resource "google_vpc_access_connector" "connector" {
  name          = "assetops-vpc-connector"
  region        = var.region
  ip_cidr_range = "10.8.0.0/28"
  network       = google_compute_network.vpc.name
}

# ─── Artifact Registry ───────────────────────────────────────
resource "google_artifact_registry_repository" "repo" {
  location      = var.region
  repository_id = "assetops"
  format        = "DOCKER"
  description   = "AssetOps Docker images"
}

# ─── Cloud SQL (PostgreSQL) ──────────────────────────────────
resource "google_sql_database_instance" "postgres" {
  name             = "assetops-db"
  database_version = "POSTGRES_16"
  region           = var.region
  deletion_protection = false

  settings {
    tier              = "db-g1-small"
    availability_type = "ZONAL"
    disk_size         = 20
    disk_type         = "PD_SSD"
    disk_autoresize   = true

    backup_configuration {
      enabled                        = true
      start_time                     = "02:00"
      point_in_time_recovery_enabled = true
    }

    ip_configuration {
      ipv4_enabled    = false
      private_network = google_compute_network.vpc.id
    }

    database_flags {
      name  = "max_connections"
      value = "100"
    }
  }

  depends_on = [google_project_service.apis]
}

resource "google_sql_database" "db" {
  name     = "assetops"
  instance = google_sql_database_instance.postgres.name
}

resource "google_sql_user" "user" {
  name     = "assetops"
  instance = google_sql_database_instance.postgres.name
  password = var.db_password
}

# ─── Redis (Memorystore) ─────────────────────────────────────
resource "google_redis_instance" "cache" {
  name           = "assetops-cache"
  tier           = "BASIC"
  memory_size_gb = 1
  region         = var.region

  authorized_network = google_compute_network.vpc.id
  connect_mode       = "PRIVATE_SERVICE_ACCESS"

  redis_configs = {
    maxmemory-policy = "allkeys-lru"
  }
}

# ─── Secret Manager ──────────────────────────────────────────
locals {
  secrets = {
    "assetops-db-url"      = "jdbc:postgresql:///${google_sql_database.db.name}?cloudSqlInstance=${google_sql_database_instance.postgres.connection_name}&socketFactory=com.google.cloud.sql.postgres.SocketFactory"
    "assetops-db-user"     = google_sql_user.user.name
    "assetops-db-password" = var.db_password
    "assetops-redis-host"  = google_redis_instance.cache.host
    "assetops-redis-password" = var.redis_password
    "assetops-jwt-secret"  = var.jwt_secret
  }
}

resource "google_secret_manager_secret" "secrets" {
  for_each  = local.secrets
  secret_id = each.key
  replication { auto {} }
}

resource "google_secret_manager_secret_version" "values" {
  for_each    = local.secrets
  secret      = google_secret_manager_secret.secrets[each.key].id
  secret_data = each.value
}

# ─── Cloud Run: Backend ──────────────────────────────────────
resource "google_cloud_run_v2_service" "backend" {
  name     = "assetops-backend"
  location = var.region

  template {
    scaling {
      min_instance_count = 1
      max_instance_count = 10
    }

    vpc_access {
      connector = google_vpc_access_connector.connector.id
      egress    = "PRIVATE_RANGES_ONLY"
    }

    containers {
      image = "${var.region}-docker.pkg.dev/${var.project_id}/assetops/backend:latest"

      resources {
        limits = { cpu = "1", memory = "1Gi" }
      }

      env {
        name  = "SPRING_PROFILES_ACTIVE"
        value = "prod"
      }
      env {
        name  = "GCP_PROJECT_ID"
        value = var.project_id
      }

      dynamic "env" {
        for_each = local.secrets
        content {
          name = upper(replace(replace(env.key, "assetops-", ""), "-", "_"))
          value_source {
            secret_key_ref {
              secret  = google_secret_manager_secret.secrets[env.key].secret_id
              version = "latest"
            }
          }
        }
      }

      liveness_probe {
        http_get { path = "/api/actuator/health" }
        initial_delay_seconds = 30
        period_seconds        = 30
      }
    }

    cloud_sql_instance {
      instances = [google_sql_database_instance.postgres.connection_name]
    }
  }

  depends_on = [google_project_service.apis]
}

# ─── Cloud Run: Frontend ─────────────────────────────────────
resource "google_cloud_run_v2_service" "frontend" {
  name     = "assetops-frontend"
  location = var.region

  template {
    scaling {
      min_instance_count = 1
      max_instance_count = 5
    }

    containers {
      image = "${var.region}-docker.pkg.dev/${var.project_id}/assetops/frontend:latest"
      resources {
        limits = { cpu = "1", memory = "256Mi" }
      }
    }
  }
}

# Allow public access
resource "google_cloud_run_service_iam_member" "backend_public" {
  service  = google_cloud_run_v2_service.backend.name
  location = var.region
  role     = "roles/run.invoker"
  member   = "allUsers"
}

resource "google_cloud_run_service_iam_member" "frontend_public" {
  service  = google_cloud_run_v2_service.frontend.name
  location = var.region
  role     = "roles/run.invoker"
  member   = "allUsers"
}

# ─── Pub/Sub Topics ──────────────────────────────────────────
resource "google_pubsub_topic" "topics" {
  for_each = toset([
    "asset-events", "request-events", "notification-events", "audit-events"
  ])
  name = each.value
}

# ─── Cloud Scheduler (EOL check) ─────────────────────────────
resource "google_cloud_scheduler_job" "eol_check" {
  name      = "assetops-eol-check"
  schedule  = "0 8 * * 1"  # Every Monday 8 AM
  time_zone = "Asia/Kolkata"
  region    = var.region

  http_target {
    uri         = "${google_cloud_run_v2_service.backend.uri}/api/actuator/health"
    http_method = "GET"
  }
}

# ─── Outputs ─────────────────────────────────────────────────
output "backend_url"  { value = google_cloud_run_v2_service.backend.uri }
output "frontend_url" { value = google_cloud_run_v2_service.frontend.uri }
output "db_instance"  { value = google_sql_database_instance.postgres.connection_name }
output "redis_host"   { value = google_redis_instance.cache.host }
