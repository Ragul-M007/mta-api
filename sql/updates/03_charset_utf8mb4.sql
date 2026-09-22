-- =====================================================================
-- MTA DB — Update 03: convert latin1 / utf8mb3 tables to utf8mb4
-- For an EXISTING database with data (incremental). MySQL 8.0.33.
--
-- ⚠ BEHAVIOR-SENSITIVE — review before running:
--   • New collation utf8mb4_0900_ai_ci makes text comparison & sorting
--     case- AND accent-insensitive. Verify login/lookup/search/ORDER BY
--     still behave the same (esp. anything comparing text exactly).
--   • VARCHAR unique keys grow to 4 bytes/char (VARCHAR(255) unique =
--     1020 bytes — within InnoDB's 3072-byte limit, OK).
--   • CONVERT rewrites & locks the whole table. Run on a COPY first, then
--     production in a maintenance window. Big tables are flagged below.
--   • This only fixes CHARSET (so emoji/full Unicode store correctly in
--     comments, names, etc.). Column types/names are unchanged.
-- =====================================================================

ALTER TABLE available_categories  CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;
ALTER TABLE categories            CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;
ALTER TABLE category_project_xref CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;
ALTER TABLE comments              CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;
ALTER TABLE master_data           CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;
ALTER TABLE newsfeed              CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;
ALTER TABLE notifications         CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;  -- ~172k rows: slow + long lock
ALTER TABLE otp_verification      CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;
ALTER TABLE project_documents     CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;  -- ~17k rows
ALTER TABLE projects              CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;
ALTER TABLE user_attendances      CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;  -- ~8k rows
ALTER TABLE user_devices          CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;
ALTER TABLE user_roles            CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;
ALTER TABLE users                 CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;
ALTER TABLE utilities             CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;
-- migration tracker (utf8mb3 -> utf8mb4), harmless:
ALTER TABLE SequelizeMeta         CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;
