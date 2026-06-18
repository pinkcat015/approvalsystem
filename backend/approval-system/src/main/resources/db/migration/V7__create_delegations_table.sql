-- ── BẢNG 11: ỦY QUYỀN DUYỆT ──────────────────────────────────
CREATE TABLE delegations (
    id              BIGSERIAL       PRIMARY KEY,
    from_user_id    BIGINT          NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    to_user_id      BIGINT          NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    start_date      TIMESTAMP       NOT NULL,
    end_date        TIMESTAMP       NOT NULL,
    is_active       BOOLEAN         NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_delegations_from ON delegations(from_user_id);
CREATE INDEX idx_delegations_to ON delegations(to_user_id);
CREATE INDEX idx_delegations_active ON delegations(is_active);
