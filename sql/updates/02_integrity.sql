-- =====================================================================
-- MTA DB — Update 02: integrity (primary keys + foreign keys)
-- Against production schema (mta_db, MySQL 8.0.33) 2026-09-11
--
-- ⚠ READ FIRST — this is NOT purely safe like update 01:
--   • A FOREIGN KEY changes DELETE behavior. With ON DELETE CASCADE (used
--     below, matching the schema's existing convention) deleting a parent
--     now also deletes its children. With RESTRICT it BLOCKS deletes that
--     currently succeed. Review against the app's delete flows first.
--   • A FK cannot be added while orphan rows exist — run PART 1 first;
--     every check must return 0.
--   • Adding a surrogate PRIMARY-KEY column breaks any INSERT that omits the
--     column list (`INSERT INTO t VALUES (...)`). Those are left commented.
--   • Run on a COPY first. Apply AFTER update 01 (FKs need the column index).
-- =====================================================================


-- =====================================================================
-- PART 1 — ORPHAN CHECKS (safe, SELECT only). Each MUST return 0 before
--          adding the matching FK in PART 3.
-- =====================================================================
SELECT COUNT(*) AS orphan_comments_project FROM comments c
  LEFT JOIN projects p ON c.project_id=p.project_id WHERE c.project_id IS NOT NULL AND p.project_id IS NULL;

-- notifications (~172k rows — orphans very likely on historical data)
SELECT COUNT(*) AS orphan_notif_user FROM notifications n
  LEFT JOIN users u ON n.user_id=u.user_id WHERE n.user_id IS NOT NULL AND u.user_id IS NULL;
SELECT COUNT(*) AS orphan_notif_project FROM notifications n
  LEFT JOIN projects p ON n.project_id=p.project_id WHERE n.project_id IS NOT NULL AND p.project_id IS NULL;
SELECT COUNT(*) AS orphan_notif_document FROM notifications n
  LEFT JOIN project_documents d ON n.document_id=d.document_id WHERE n.document_id IS NOT NULL AND d.document_id IS NULL;

SELECT COUNT(*) AS orphan_curproj_project FROM current_project c
  LEFT JOIN projects p ON c.project_id=p.project_id WHERE p.project_id IS NULL;
SELECT COUNT(*) AS orphan_curproj_user FROM current_project c
  LEFT JOIN users u ON c.user_id=u.user_id WHERE u.user_id IS NULL;

SELECT COUNT(*) AS orphan_tp_project FROM teams_project t
  LEFT JOIN projects p ON t.project_id=p.project_id WHERE t.project_id IS NOT NULL AND p.project_id IS NULL;
SELECT COUNT(*) AS orphan_tp_team FROM teams_project t
  LEFT JOIN teams tm ON t.team_id=tm.team_id WHERE t.team_id IS NOT NULL AND tm.team_id IS NULL;

SELECT COUNT(*) AS orphan_tu_user FROM teams_users t
  LEFT JOIN users u ON t.user_id=u.user_id WHERE t.user_id IS NOT NULL AND u.user_id IS NULL;
SELECT COUNT(*) AS orphan_tu_team FROM teams_users t
  LEFT JOIN teams tm ON t.team_id=tm.team_id WHERE t.team_id IS NOT NULL AND tm.team_id IS NULL;

SELECT COUNT(*) AS orphan_gm_group FROM group_members g
  LEFT JOIN group_details gd ON g.group_id=gd.group_id WHERE gd.group_id IS NULL;

SELECT COUNT(*) AS orphan_cpx_category FROM category_project_xref c
  LEFT JOIN available_categories a ON c.category_id=a.category_id WHERE c.category_id IS NOT NULL AND a.category_id IS NULL;
SELECT COUNT(*) AS orphan_cpx_user FROM category_project_xref c
  LEFT JOIN users u ON c.user_id=u.user_id WHERE c.user_id IS NOT NULL AND u.user_id IS NULL;

SELECT COUNT(*) AS orphan_aws_project FROM aws_folders a
  LEFT JOIN projects p ON a.project_id=p.project_id WHERE p.project_id IS NULL;
SELECT COUNT(*) AS orphan_s3_project FROM s3_uploaded_files s
  LEFT JOIN projects p ON s.project_id=p.project_id WHERE s.project_id IS NOT NULL AND p.project_id IS NULL;
SELECT COUNT(*) AS orphan_s3_category FROM s3_uploaded_files s
  LEFT JOIN available_categories a ON s.category_id=a.category_id WHERE s.category_id IS NOT NULL AND a.category_id IS NULL;

SELECT COUNT(*) AS orphan_uld_user FROM user_login_details l
  LEFT JOIN users u ON l.user_id=u.user_id WHERE l.user_id IS NOT NULL AND u.user_id IS NULL;

SELECT COUNT(*) AS orphan_unread_project FROM un_read_message_details r
  LEFT JOIN projects p ON r.project_id=p.project_id WHERE r.project_id IS NOT NULL AND p.project_id IS NULL;
SELECT COUNT(*) AS orphan_unread_team FROM un_read_message_details r
  LEFT JOIN teams t ON r.team_id=t.team_id WHERE r.team_id IS NOT NULL AND t.team_id IS NULL;

SELECT COUNT(*) AS orphan_att_project FROM user_attendances a
  LEFT JOIN projects p ON a.project_id=p.project_id WHERE a.project_id IS NOT NULL AND p.project_id IS NULL;

SELECT COUNT(*) AS orphan_avail_role FROM available_categories a
  LEFT JOIN user_roles r ON a.role_id=r.role_id WHERE r.role_id IS NULL;

SELECT COUNT(*) AS orphan_pd_user FROM project_documents d
  LEFT JOIN users u ON d.user_id=u.user_id WHERE u.user_id IS NULL;

SELECT COUNT(*) AS orphan_meet_calendar FROM meetings m
  LEFT JOIN imeetify_calendar c ON m.calendar_id=c.calendar_id WHERE c.calendar_id IS NULL;

SELECT COUNT(*) AS orphan_imconf_user FROM imeetify_configuration i
  LEFT JOIN users u ON i.user_id=u.user_id WHERE i.user_id IS NOT NULL AND u.user_id IS NULL;


-- =====================================================================
-- PART 2 — DUPLICATE CHECKS for the missing primary keys (safe, SELECT)
-- =====================================================================
-- user_devices: rows below must be EMPTY to add the composite PK
SELECT user_id, device_token, COUNT(*) c FROM user_devices GROUP BY user_id, device_token HAVING c > 1;
-- master_data: inspect before choosing a key
SELECT COUNT(*) rows_total, COUNT(duration_id) non_null_duration_id, COUNT(DISTINCT duration_id) distinct_duration_id FROM master_data;


-- =====================================================================
-- PART 3 — APPLY (only after PART 1 all return 0 and you've accepted the
--          DELETE-behavior note). Swap CASCADE→RESTRICT if you do NOT want
--          cascade deletes.
-- =====================================================================

-- ---- Primary keys ----
ALTER TABLE user_devices ADD PRIMARY KEY (user_id, device_token);   -- run only if PART 2 dup-check is empty

-- ⚠ Surrogate PKs add a column → left commented; first grep models for
--   positional `INSERT INTO <t> VALUES(...)`, then uncomment if safe:
-- ALTER TABLE category_project_xref ADD COLUMN xref_id   INT NOT NULL AUTO_INCREMENT PRIMARY KEY;
-- ALTER TABLE master_data           ADD COLUMN master_id INT NOT NULL AUTO_INCREMENT PRIMARY KEY;

-- ---- Foreign keys (ON DELETE CASCADE ON UPDATE CASCADE) ----
ALTER TABLE comments              ADD CONSTRAINT fk_comments_project FOREIGN KEY (project_id)  REFERENCES projects (project_id)              ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE current_project       ADD CONSTRAINT fk_curproj_project  FOREIGN KEY (project_id)  REFERENCES projects (project_id)              ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE current_project       ADD CONSTRAINT fk_curproj_user     FOREIGN KEY (user_id)     REFERENCES users (user_id)                    ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE teams_project         ADD CONSTRAINT fk_tp_project       FOREIGN KEY (project_id)  REFERENCES projects (project_id)              ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE teams_project         ADD CONSTRAINT fk_tp_team          FOREIGN KEY (team_id)     REFERENCES teams (team_id)                    ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE teams_users           ADD CONSTRAINT fk_tu_user          FOREIGN KEY (user_id)     REFERENCES users (user_id)                    ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE teams_users           ADD CONSTRAINT fk_tu_team          FOREIGN KEY (team_id)     REFERENCES teams (team_id)                    ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE group_members         ADD CONSTRAINT fk_gm_group         FOREIGN KEY (group_id)    REFERENCES group_details (group_id)           ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE category_project_xref ADD CONSTRAINT fk_cpx_category     FOREIGN KEY (category_id) REFERENCES available_categories (category_id)  ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE category_project_xref ADD CONSTRAINT fk_cpx_user         FOREIGN KEY (user_id)     REFERENCES users (user_id)                    ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE aws_folders           ADD CONSTRAINT fk_aws_project      FOREIGN KEY (project_id)  REFERENCES projects (project_id)              ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE s3_uploaded_files     ADD CONSTRAINT fk_s3_project       FOREIGN KEY (project_id)  REFERENCES projects (project_id)              ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE s3_uploaded_files     ADD CONSTRAINT fk_s3_category      FOREIGN KEY (category_id) REFERENCES available_categories (category_id)  ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE user_login_details    ADD CONSTRAINT fk_uld_user         FOREIGN KEY (user_id)     REFERENCES users (user_id)                    ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE un_read_message_details ADD CONSTRAINT fk_unread_project FOREIGN KEY (project_id)  REFERENCES projects (project_id)              ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE un_read_message_details ADD CONSTRAINT fk_unread_team    FOREIGN KEY (team_id)     REFERENCES teams (team_id)                    ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE user_attendances      ADD CONSTRAINT fk_att_project      FOREIGN KEY (project_id)  REFERENCES projects (project_id)              ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE available_categories  ADD CONSTRAINT fk_avail_role       FOREIGN KEY (role_id)     REFERENCES user_roles (role_id)               ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE project_documents     ADD CONSTRAINT fk_pd_user          FOREIGN KEY (user_id)     REFERENCES users (user_id)                    ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE meetings              ADD CONSTRAINT fk_meet_calendar    FOREIGN KEY (calendar_id) REFERENCES imeetify_calendar (calendar_id)    ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE imeetify_configuration ADD CONSTRAINT fk_imconf_user     FOREIGN KEY (user_id)     REFERENCES users (user_id)                    ON DELETE CASCADE ON UPDATE CASCADE;

-- notifications FKs are held back (172k rows, historical orphans very likely).
-- Add ONLY after the PART 1 notification checks return 0 (or you null/clean orphans):
-- ALTER TABLE notifications ADD CONSTRAINT fk_notif_user     FOREIGN KEY (user_id)     REFERENCES users (user_id)                 ON DELETE CASCADE ON UPDATE CASCADE;
-- ALTER TABLE notifications ADD CONSTRAINT fk_notif_project  FOREIGN KEY (project_id)  REFERENCES projects (project_id)           ON DELETE CASCADE ON UPDATE CASCADE;
-- ALTER TABLE notifications ADD CONSTRAINT fk_notif_document FOREIGN KEY (document_id) REFERENCES project_documents (document_id) ON DELETE CASCADE ON UPDATE CASCADE;
