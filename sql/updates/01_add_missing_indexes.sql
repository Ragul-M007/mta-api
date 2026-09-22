-- =====================================================================
-- MTA DB — Update 01: add missing indexes
-- Reconstructed against production schema (mta_db, MySQL 8.0.33) 2026-09-11
--
-- SAFETY: additive and behavior-neutral. These only speed up queries;
--   they do NOT change any result the app returns. Reversible via DROP INDEX.
--
-- BEFORE RUNNING:
--   1. Run on a COPY/staging first, then production in a maintenance window.
--   2. MySQL has no "CREATE INDEX IF NOT EXISTS" — if an index already
--      exists you'll get "Duplicate key name"; skip that line if so.
--   3. Building the index on `notifications` (~172k rows) briefly locks it.
-- =====================================================================

-- --- Auth / login (hot path) -----------------------------------------
CREATE INDEX idx_users_email            ON users (email);
CREATE INDEX idx_otp_email              ON otp_verification (email_id);

-- --- notifications (~172k rows, currently NO secondary indexes) -------
CREATE INDEX idx_notifications_user     ON notifications (user_id);
CREATE INDEX idx_notifications_project  ON notifications (project_id);
CREATE INDEX idx_notifications_document ON notifications (document_id);

-- --- comments (project_id added later, unindexed) ---------------------
CREATE INDEX idx_comments_project       ON comments (project_id);

-- --- projects: current project + attendance ---------------------------
CREATE INDEX idx_current_project_proj   ON current_project (project_id);
CREATE INDEX idx_current_project_user   ON current_project (user_id);
CREATE INDEX idx_attendance_project     ON user_attendances (project_id);
CREATE INDEX idx_project_documents_user ON project_documents (user_id);

-- --- teams (junction tables, all unindexed) --------------------------
CREATE INDEX idx_teams_project_project  ON teams_project (project_id);
CREATE INDEX idx_teams_project_team     ON teams_project (team_id);
CREATE INDEX idx_teams_users_user       ON teams_users (user_id);
CREATE INDEX idx_teams_users_team       ON teams_users (team_id);

-- --- chat -------------------------------------------------------------
CREATE INDEX idx_group_members_group    ON group_members (group_id);
CREATE INDEX idx_messages_parent        ON messages (parent_message_id);
CREATE INDEX idx_unread_project         ON un_read_message_details (project_id);
CREATE INDEX idx_unread_team            ON un_read_message_details (team_id);

-- --- categories / file access ----------------------------------------
CREATE INDEX idx_cpx_category           ON category_project_xref (category_id);
CREATE INDEX idx_cpx_user               ON category_project_xref (user_id);
CREATE INDEX idx_avail_cat_role         ON available_categories (role_id);

-- --- S3 / storage -----------------------------------------------------
CREATE INDEX idx_aws_folders_project    ON aws_folders (project_id);
CREATE INDEX idx_s3_files_project       ON s3_uploaded_files (project_id);
CREATE INDEX idx_s3_files_category      ON s3_uploaded_files (category_id);

-- --- meetings ---------------------------------------------------------
CREATE INDEX idx_meetings_calendar      ON meetings (calendar_id);
CREATE INDEX idx_imeetify_config_user   ON imeetify_configuration (user_id);

-- --- misc -------------------------------------------------------------
CREATE INDEX idx_user_login_user        ON user_login_details (user_id);

-- To revert any line:  DROP INDEX <index_name> ON <table>;
