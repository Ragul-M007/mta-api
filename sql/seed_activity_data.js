/**
 * LOCAL DEV seed — attendance records + newsfeed/highlights (dynamic, idempotent, additive).
 *
 * Attendance: for the given user, an IN (09:00) + OUT (18:00) pair per day for the last
 * N days, using the user's own seeded projects for project_id / location.
 * Newsfeed: company-style items, feed_type 'N' (News) and 'H' (Highlights) — the exact
 * values the mobile app filters on (newshighlights.dart).
 *
 * Re-runnable: checks before every insert. Inserts only; no app code / prod data touched.
 *
 *   node sql/seed_activity_data.js                       # user 1078, 7 days, 5 news, 4 highlights
 *   node sql/seed_activity_data.js --days=14 --news=6 --highlights=5
 */
require('dotenv').config();
const mysql = require('mysql2/promise');

const argv = process.argv.slice(2);
const arg = (n, d) => { const h = argv.find(a => a.startsWith(`--${n}=`)); return h ? h.split('=').slice(1).join('=') : d; };
const USER_ID   = parseInt(arg('user', '1078'), 10);
const DAYS      = parseInt(arg('days', '7'), 10);
const NEWS_N    = parseInt(arg('news', '5'), 10);
const HIGH_N    = parseInt(arg('highlights', '4'), 10);
const TENANT    = arg('tenant', 'seed');

const NEWS = [
  ['Q3 Safety Milestone Achieved', 'Zero lost-time incidents recorded across all active sites this quarter. Great work by every site team.'],
  ['New Tower Crane Commissioned', 'A 12-tonne tower crane is now operational at Skyline Residency, accelerating the structural phase.'],
  ['Monsoon Readiness Drive Completed', 'Dewatering pumps, covered storage and drainage checks finished ahead of the season across all projects.'],
  ['Company Wins Green Building Award', 'Sunrise IT Campus received a regional award for sustainable design and energy-efficient systems.'],
  ['Quarterly Town Hall Scheduled', 'Join the all-hands on the last Friday of the month for project updates and the safety recognition ceremony.'],
  ['Procurement Portal Upgraded', 'Faster vendor onboarding and PO tracking are now live in the procurement module.'],
];
const HIGHLIGHTS = [
  ['Employee of the Month', 'Congratulations to the Site Engineers team for outstanding progress on Metro Mall Complex.'],
  ['Riverside Apartments Tops Out', 'The final slab was cast this week — the structure has reached its full height.'],
  ['Safety Training at 100%', 'All field staff have completed the updated height-work and fire-safety certification.'],
  ['Festive Holiday Calendar Released', 'The holiday schedule for the upcoming quarter is now available in the app.'],
  ['Client Appreciation', 'Harbor Business Park client praised the finishing quality during the latest walkthrough.'],
];

const dateAt = (daysAgo, hh, mm) => {
  const t = new Date(); t.setDate(t.getDate() - daysAgo); t.setHours(hh, mm, 0, 0);
  return t.toISOString().slice(0, 19).replace('T', ' ');
};
const dayKey = daysAgo => { const t = new Date(); t.setDate(t.getDate() - daysAgo); return t.toISOString().slice(0, 10); };
const to12h = (hh, mm) => { const ap = hh >= 12 ? 'PM' : 'AM'; const h = ((hh + 11) % 12) + 1; return `${String(h).padStart(2, '0')}:${String(mm).padStart(2, '0')} ${ap}`; };

(async () => {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST, user: process.env.DB_USER,
    password: process.env.DB_PASS, database: process.env.DB_NAME,
  });
  const stat = { news: 0, highlights: 0, attendanceDays: 0, attendanceRows: 0 };
  try {
    // --- newsfeed (idempotent by title_text) ---
    const addFeed = async (title, desc, type) => {
      const [ex] = await conn.query('SELECT id FROM newsfeed WHERE title_text=?', [title]);
      if (ex.length) return false;
      await conn.query('INSERT INTO newsfeed (title_text, description, img_url, feed_type) VALUES (?,?,?,?)',
        [title, desc, null, type]);
      return true;
    };
    for (let i = 0; i < NEWS_N; i++) {
      const [t, d] = NEWS[i % NEWS.length];
      const title = i < NEWS.length ? t : `${t} (${i + 1})`;
      if (await addFeed(title, d, 'N')) stat.news++;
    }
    for (let i = 0; i < HIGH_N; i++) {
      const [t, d] = HIGHLIGHTS[i % HIGHLIGHTS.length];
      const title = i < HIGHLIGHTS.length ? t : `${t} (${i + 1})`;
      if (await addFeed(title, d, 'H')) stat.highlights++;
    }

    // --- attendance for the user's own seeded projects ---
    const [projects] = await conn.query(
      `SELECT p.project_id, p.project_name, p.city, p.latitude, p.longitude
       FROM category_project_xref x JOIN projects p ON p.project_id = x.project_id
       WHERE x.user_id=? AND p.created_by=? AND p.status!='Cancelled'
       GROUP BY p.project_id ORDER BY p.project_id`, [USER_ID, TENANT]);
    if (!projects.length) {
      console.warn(`No projects mapped to user ${USER_ID}; run seed_sample_data.js first. Skipping attendance.`);
    } else {
      const addPunch = async (daysAgo, checkType, hh, mm, proj) => {
        const [ex] = await conn.query(
          "SELECT id FROM user_attendances WHERE user_id=? AND checkType=? AND created_at LIKE ?",
          [USER_ID, checkType, dayKey(daysAgo) + '%']);
        if (ex.length) return false;
        await conn.query(
          `INSERT INTO user_attendances
             (checkType, checkTime, latLng, location_name, created_at, user_id, project_id, counts)
           VALUES (?,?,?,?,?,?,?,?)`,
          [checkType, to12h(hh, mm),
           `${proj.latitude || '13.0827'},${proj.longitude || '80.2707'}`,
           `${proj.city || 'Chennai'} Site Office`, dateAt(daysAgo, hh, mm),
           USER_ID, proj.project_id, 1]);
        return true;
      };
      for (let d = 0; d < DAYS; d++) {
        const day = new Date(); day.setDate(day.getDate() - d);
        if (day.getDay() === 0) continue;                 // skip Sundays
        const proj = projects[d % projects.length];
        let any = false;
        if (await addPunch(d, 'IN', 9, 0, proj)) { stat.attendanceRows++; any = true; }
        if (await addPunch(d, 'OUT', 18, 0, proj)) { stat.attendanceRows++; any = true; }
        if (any) stat.attendanceDays++;
      }
    }

    console.log('Activity seed complete (new rows):', JSON.stringify(stat));
    const [[{ nc }]] = await conn.query('SELECT COUNT(*) nc FROM newsfeed');
    const [[{ ac }]] = await conn.query('SELECT COUNT(*) ac FROM user_attendances WHERE user_id=?', [USER_ID]);
    console.log(`Totals now: newsfeed rows=${nc}, attendance rows for user ${USER_ID}=${ac}`);
  } catch (e) {
    console.error('SEED ERROR:', e.code || '', e.sqlMessage || e.message);
    process.exitCode = 1;
  } finally {
    await conn.end();
  }
})();
