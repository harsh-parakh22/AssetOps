-- V1__init_schema.sql
-- AssetOps complete database schema

CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Users
CREATE TABLE users (
    id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id     VARCHAR(20) NOT NULL UNIQUE,
    name            VARCHAR(100) NOT NULL,
    email           VARCHAR(150) NOT NULL UNIQUE,
    password        VARCHAR(255) NOT NULL,
    department      VARCHAR(100),
    job_title       VARCHAR(100),
    phone_number    VARCHAR(20),
    role            VARCHAR(20)  NOT NULL DEFAULT 'EMPLOYEE'
                    CHECK (role IN ('EMPLOYEE','IT_ADMIN','SUPER_ADMIN')),
    enabled         BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMP    NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMP,
    created_by      VARCHAR(150),
    updated_by      VARCHAR(150),
    version         BIGINT       DEFAULT 0
);

CREATE INDEX idx_users_email       ON users(email);
CREATE INDEX idx_users_employee_id ON users(employee_id);
CREATE INDEX idx_users_role        ON users(role);
CREATE INDEX idx_users_name_trgm   ON users USING gin(name gin_trgm_ops);

-- Assets
CREATE TABLE assets (
    id              UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    asset_tag       VARCHAR(30)  NOT NULL UNIQUE,
    name            VARCHAR(150) NOT NULL,
    description     VARCHAR(500),
    category        VARCHAR(20)  NOT NULL
                    CHECK (category IN ('LAPTOP','DESKTOP','MONITOR','MOBILE','TABLET','PERIPHERAL','LICENSE','NETWORKING','SERVER','OTHER')),
    manufacturer    VARCHAR(100),
    model           VARCHAR(100),
    serial_number   VARCHAR(100),
    status          VARCHAR(20)  NOT NULL DEFAULT 'AVAILABLE'
                    CHECK (status IN ('AVAILABLE','ASSIGNED','MAINTENANCE','RETIRED','DISPOSED','PENDING_RETURN')),
    lifecycle_stage VARCHAR(20)  DEFAULT 'ACTIVE'
                    CHECK (lifecycle_stage IN ('ACTIVE','NEAR_EOL','EOL','RETIRED')),
    purchase_date   DATE,
    purchase_cost   NUMERIC(12,2),
    refresh_date    DATE,
    warranty_expiry DATE,
    location        VARCHAR(100),
    notes           VARCHAR(1000),
    assigned_to_id  UUID         REFERENCES users(id) ON DELETE SET NULL,
    assigned_date   DATE,
    created_at      TIMESTAMP    NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMP,
    created_by      VARCHAR(150),
    updated_by      VARCHAR(150),
    version         BIGINT       DEFAULT 0
);

CREATE INDEX idx_assets_asset_tag    ON assets(asset_tag);
CREATE INDEX idx_assets_status       ON assets(status);
CREATE INDEX idx_assets_category     ON assets(category);
CREATE INDEX idx_assets_assigned_to  ON assets(assigned_to_id);
CREATE INDEX idx_assets_refresh_date ON assets(refresh_date);
CREATE INDEX idx_assets_name_trgm    ON assets USING gin(name gin_trgm_ops);

-- Asset Requests
CREATE TABLE asset_requests (
    id                    UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    request_number        VARCHAR(40)  NOT NULL UNIQUE,
    requested_by_id       UUID         NOT NULL REFERENCES users(id),
    asset_id              UUID         REFERENCES assets(id),
    requested_asset_type  VARCHAR(200),
    reason                VARCHAR(500) NOT NULL,
    priority              VARCHAR(10)  NOT NULL DEFAULT 'MEDIUM'
                          CHECK (priority IN ('LOW','MEDIUM','HIGH','CRITICAL')),
    status                VARCHAR(20)  NOT NULL DEFAULT 'PENDING'
                          CHECK (status IN ('PENDING','APPROVED','REJECTED','ALLOCATED','CANCELLED','RETURNED')),
    reviewed_by_id        UUID         REFERENCES users(id),
    reviewed_at           TIMESTAMP,
    reviewer_notes        VARCHAR(500),
    allocated_at          TIMESTAMP,
    return_due_date       TIMESTAMP,
    returned_at           TIMESTAMP,
    created_at            TIMESTAMP    NOT NULL DEFAULT NOW(),
    updated_at            TIMESTAMP,
    created_by            VARCHAR(150),
    updated_by            VARCHAR(150),
    version               BIGINT       DEFAULT 0
);

CREATE INDEX idx_requests_status       ON asset_requests(status);
CREATE INDEX idx_requests_requested_by ON asset_requests(requested_by_id);
CREATE INDEX idx_requests_asset        ON asset_requests(asset_id);
CREATE INDEX idx_requests_created_at   ON asset_requests(created_at DESC);

-- Audit Logs
CREATE TABLE audit_logs (
    id            UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    entity_type   VARCHAR(50)  NOT NULL,
    entity_id     UUID         NOT NULL,
    action        VARCHAR(100) NOT NULL,
    old_value     TEXT,
    new_value     TEXT,
    performed_by  VARCHAR(150),
    ip_address    VARCHAR(45),
    user_agent    VARCHAR(500),
    asset_id      UUID         REFERENCES assets(id) ON DELETE SET NULL,
    created_at    TIMESTAMP    NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_audit_entity     ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_by         ON audit_logs(performed_by);
CREATE INDEX idx_audit_created_at ON audit_logs(created_at DESC);

-- Notifications
CREATE TABLE notifications (
    id          UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID         NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type        VARCHAR(50)  NOT NULL,
    title       VARCHAR(200) NOT NULL,
    message     VARCHAR(500) NOT NULL,
    entity_id   UUID,
    entity_type VARCHAR(50),
    is_read     BOOLEAN      NOT NULL DEFAULT FALSE,
    created_at  TIMESTAMP    NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_notif_user_read ON notifications(user_id, is_read);
CREATE INDEX idx_notif_created   ON notifications(created_at DESC);
