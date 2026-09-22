/**
 * LOCAL DEV seed generator — sample projects + teams (dynamic, idempotent, additive).
 *
 * Generates realistic construction projects and teams, links them to the local
 * test user (and a seeded ADMIN for the web panel) exactly the way the app's own
 * queries expect (projects -> category_project_xref + created_by tenant key;
 * teams -> teams_users; teams<->projects -> teams_project).
 *
 * Re-runnable: everything is checked before insert, so running twice adds nothing.
 * Does NOT touch app code or existing production data — inserts only.
 *
 *   node sql/seed_sample_data.js                 # 6 projects, 4 teams (defaults)
 *   node sql/seed_sample_data.js --projects=10 --teams=6
 *   node sql/seed_sample_data.js --user=1078 --tenant=seed
 */
require('dotenv').config();
const mysql = require('mysql2/promise');

const argv = process.argv.slice(2);
const arg = (name, def) => {
  const hit = argv.find(a => a.startsWith(`--${name}=`));
  return hit ? hit.split('=').slice(1).join('=') : def;
};
const PROJECT_COUNT = parseInt(arg('projects', '6'), 10);
const TEAM_COUNT    = parseInt(arg('teams', '4'), 10);
const STAFF_USER_ID = parseInt(arg('user', '1078'), 10);
const TENANT        = arg('tenant', 'seed');           // created_by org key
const ADMIN_EMAIL   = arg('adminEmail', 'admin@mta.com');
const ADMIN_PW      = arg('adminPass', 'admin123');

// --- realistic pools ------------------------------------------------------
const LOCATIONS = [
  { city: 'Chennai',    state: 'Tamil Nadu',   lat: 13.0827, lng: 80.2707 },
  { city: 'Bengaluru',  state: 'Karnataka',    lat: 12.9716, lng: 77.5946 },
  { city: 'Hyderabad',  state: 'Telangana',    lat: 17.3850, lng: 78.4867 },
  { city: 'Mumbai',     state: 'Maharashtra',  lat: 19.0760, lng: 72.8777 },
  { city: 'Pune',       state: 'Maharashtra',  lat: 18.5204, lng: 73.8567 },
  { city: 'Coimbatore', state: 'Tamil Nadu',   lat: 11.0168, lng: 76.9558 },
  { city: 'Kochi',      state: 'Kerala',       lat: 9.9312,  lng: 76.2673 },
  { city: 'Ahmedabad',  state: 'Gujarat',      lat: 23.0225, lng: 72.5714 },
];
const PROJECT_NAMES = [
  'Skyline Residency Tower', 'Green Valley Villas', 'Metro Mall Complex',
  'Harbor Business Park', 'Riverside Apartments', 'Sunrise IT Campus',
  'Coastal Highway Bridge', 'Orchid Gardens Township', 'Silver Oak Commercial Plaza',
  'Lakeview Luxury Condos', 'Northgate Logistics Hub', 'Emerald Heights Phase II',
];
const PROJECT_BLURBS = [
  'Multi-storey residential development with clubhouse and landscaped podium.',
  'Gated community of premium villas with solar and rainwater harvesting.',
  'Mixed-use retail and office complex with three levels of basement parking.',
  'Grade-A office park built to LEED Gold specification.',
  'Riverside apartment blocks with amenity deck and jogging track.',
  'Corporate IT campus with two towers and a central atrium.',
  'Cable-stayed highway bridge across the estuary, 1.2 km span.',
  'Integrated township with schools, retail and 1,200 dwelling units.',
];
const STATUSES = ['Active', 'Ongoing', 'Planning', 'Completed']; // never 'Cancelled'
const TEAM_DEFS = [
  ['Site Engineers',        'On-site execution and daily progress tracking'],
  ['Architecture & Design', 'Drawings, BIM models and design coordination'],
  ['Procurement',           'Vendor management, purchase orders and logistics'],
  ['Safety & Quality',      'HSE compliance, audits and quality assurance'],
  ['Electrical & MEP',      'Electrical, mechanical and plumbing services'],
  ['Civil Works',           'Structural, foundation and finishing works'],
];

const pick = (arr, i) => arr[i % arr.length];
const daysFromNow = d => {
  const t = new Date(); t.setDate(t.getDate() + d);
  return t.toISOString().slice(0, 19).replace('T', ' ');
};

async function scalarExists(conn, sql, params) {
  const [rows] = await conn.query(sql, params);
  return rows.length ? rows[0] : null;
}

async function ensureAdmin(conn) {
  const found = await scalarExists(conn, 'SELECT user_id FROM users WHERE email=?', [ADMIN_EMAIL]);
  if (found) return found.user_id;
  const [res] = await conn.query(
    `INSERT INTO users (email, password, name, mobile_no, city, state, area,
                        role_id, status, public_user, loginpin, created_by)
     VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`,
    [ADMIN_EMAIL, ADMIN_PW, 'Admin User', '8888888888', 'Chennai', 'Tamil Nadu', 'Central',
     1, 'active', 0, 4321, TENANT]);
  return res.insertId;
}

async function ensureProject(conn, name, i) {
  const loc = pick(LOCATIONS, i);
  const existing = await scalarExists(conn, 'SELECT project_id FROM projects WHERE project_name=?', [name]);
  if (existing) return { id: existing.project_id, created: false };
  const [res] = await conn.query(
    `INSERT INTO projects (project_name, description, state, city, address, status,
                           project_img, start_date, end_date, created_by, latitude, longitude)
     VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`,
    [name, pick(PROJECT_BLURBS, i), loc.state, loc.city,
     `${100 + i} ${loc.city} Main Road, ${loc.city}`, pick(STATUSES, i),
     '', daysFromNow(-30 - i * 10), daysFromNow(120 + i * 20), // project_img '' (not null): dashboard.dart does projectImg! and falls back to a default image
     TENANT, String(loc.lat), String(loc.lng)]);
  return { id: res.insertId, created: true };
}

async function ensureXref(conn, userId, projectId) {
  const existing = await scalarExists(conn,
    'SELECT project_id FROM category_project_xref WHERE user_id=? AND project_id=? LIMIT 1',
    [userId, projectId]);
  if (existing) return false;
  await conn.query(
    'INSERT INTO category_project_xref (category_id, user_id, project_id, project_role) VALUES (?,?,?,?)',
    [null, userId, projectId, 'Owner']);
  return true;
}

async function ensureTeam(conn, name, desc) {
  const existing = await scalarExists(conn,
    'SELECT team_id FROM teams WHERE team_name=? AND created_by=?', [name, TENANT]);
  if (existing) return { id: existing.team_id, created: false };
  const [res] = await conn.query(
    'INSERT INTO teams (team_name, description, created_by) VALUES (?,?,?)', [name, desc, TENANT]);
  return { id: res.insertId, created: true };
}

async function ensureTeamUser(conn, userId, teamId) {
  const existing = await scalarExists(conn,
    'SELECT id FROM teams_users WHERE user_id=? AND team_id=? AND project_id IS NULL', [userId, teamId]);
  if (existing) return false;
  await conn.query('INSERT INTO teams_users (user_id, team_id, project_id) VALUES (?,?,?)',
    [userId, teamId, null]);
  return true;
}

async function ensureTeamProject(conn, teamId, projectId) {
  const existing = await scalarExists(conn,
    'SELECT id FROM teams_project WHERE team_id=? AND project_id=?', [teamId, projectId]);
  if (existing) return false;
  await conn.query('INSERT INTO teams_project (team_id, project_id) VALUES (?,?)', [teamId, projectId]);
  return true;
}

(async () => {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST, user: process.env.DB_USER,
    password: process.env.DB_PASS, database: process.env.DB_NAME, multipleStatements: false,
  });
  const stat = { projects: 0, teams: 0, xref: 0, teamUsers: 0, teamProjects: 0 };
  try {
    const adminId = await ensureAdmin(conn);
    console.log(`ADMIN user: ${ADMIN_EMAIL} (user_id=${adminId}, pw=${ADMIN_PW}, role=ADMIN)`);

    const projectIds = [];
    for (let i = 0; i < PROJECT_COUNT; i++) {
      const name = i < PROJECT_NAMES.length ? PROJECT_NAMES[i] : `${pick(PROJECT_NAMES, i)} #${i + 1}`;
      const p = await ensureProject(conn, name, i);
      projectIds.push(p.id);
      if (p.created) stat.projects++;
      // map both the staff user and the admin so it shows in app AND web
      if (await ensureXref(conn, STAFF_USER_ID, p.id)) stat.xref++;
      if (await ensureXref(conn, adminId, p.id)) stat.xref++;
    }

    for (let i = 0; i < TEAM_COUNT; i++) {
      const [tname, tdesc] = pick(TEAM_DEFS, i);
      const t = await ensureTeam(conn, tname, tdesc);
      if (t.created) stat.teams++;
      if (await ensureTeamUser(conn, STAFF_USER_ID, t.id)) stat.teamUsers++;
      if (await ensureTeamUser(conn, adminId, t.id)) stat.teamUsers++;
      // link each team to ~2 projects
      for (const pid of [projectIds[i % projectIds.length], projectIds[(i + 1) % projectIds.length]]) {
        if (pid && await ensureTeamProject(conn, t.id, pid)) stat.teamProjects++;
      }
    }

    console.log('Seed complete (new rows):', JSON.stringify(stat));
    const [[{ pc }]] = await conn.query(
      `SELECT COUNT(*) pc FROM category_project_xref x JOIN projects p ON p.project_id=x.project_id
       WHERE x.user_id=? AND p.created_by=? AND p.status!='Cancelled'`, [STAFF_USER_ID, TENANT]);
    const [[{ tc }]] = await conn.query('SELECT COUNT(*) tc FROM teams_users WHERE user_id=?', [STAFF_USER_ID]);
    console.log(`Visible to user ${STAFF_USER_ID}: projects=${pc}, teams=${tc}`);
  } catch (e) {
    console.error('SEED ERROR:', e.code || '', e.sqlMessage || e.message);
    process.exitCode = 1;
  } finally {
    await conn.end();
  }
})();
