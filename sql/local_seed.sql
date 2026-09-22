-- =====================================================================
-- MTA local dev seed — roles + one test user (LOCAL ONLY)
-- Run against the local construction_db AFTER loading schema_current.sql.
--   Test login:  email = test@mta.com   password = test123   pin = 1234
-- =====================================================================
USE construction_db;

-- Role names the mobile app maps (ADMIN=1 … STAFF=2 … CLIENT=6 … PUBLICUSER=7)
INSERT INTO user_roles (role_id, role, role_desc) VALUES
  (1,'ADMIN','Admin'),
  (2,'STAFF','Staff'),
  (3,'VENDOR','Vendor'),
  (4,'CONSULTANTS','Consultants'),
  (5,'CONTRACTORS','Contractors'),
  (6,'CLIENT','Client'),
  (7,'PUBLICUSER','Public User')
ON DUPLICATE KEY UPDATE role=VALUES(role), role_desc=VALUES(role_desc);

-- Test STAFF user (idempotent — only inserts if not already present).
-- Passwords are plaintext in this app, so this is directly usable.
INSERT INTO users (email, password, name, mobile_no, city, state, area,
                   role_id, status, public_user, loginpin, created_by)
SELECT 'test@mta.com','test123','Test User','9999999999','Chennai','TN','Central',
       2,'active',0,1234,'seed'
FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'test@mta.com');

SELECT user_id, email, name, role_id, loginpin FROM users WHERE email = 'test@mta.com';
