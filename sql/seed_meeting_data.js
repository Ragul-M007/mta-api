/**
 * LOCAL DEV seed — meeting data (idempotent, additive).
 *
 * Fixes the two Meeting endpoints that 400 on a fresh DB (empty data):
 *   GET /meeting/accessdetails/:user_id  -> 400 until an imeetify_configuration
 *                                            row exists for the user (then access:true)
 *   GET /meeting/getupcomingmeeting       -> 400/empty until a future meeting has
 *                                            the user as invitee_email
 *
 * NOTE: this only makes those two read endpoints return data. Creating meetings
 * through the app still calls the external imeetify.com API with a real key, so
 * that deeper flow needs a genuine iMeetify account — out of scope for local dev.
 *
 * Inserts only; no app code / prod data touched.
 *
 *   node sql/seed_meeting_data.js                 # user 1078 / test@mta.com
 *   node sql/seed_meeting_data.js --user=1078 --email=test@mta.com
 */
require('dotenv').config();
const mysql = require('mysql2/promise');

const argv = process.argv.slice(2);
const arg = (n, d) => { const h = argv.find(a => a.startsWith(`--${n}=`)); return h ? h.split('=').slice(1).join('=') : d; };
const USER_ID = parseInt(arg('user', '1078'), 10);
const EMAIL = arg('email', 'test@mta.com');

const dtAt = (daysFromNow, hh) => {
  const t = new Date();
  t.setDate(t.getDate() + daysFromNow);
  t.setHours(hh, 0, 0, 0);
  return t.toISOString().slice(0, 19).replace('T', ' ');
};

// type: 1=inperson 2=online 3=phone ; provider: 1=zoom 2=google_meet 3=ms_teams 4=custom
// linkType: 'Project' -> meeting_type_id is a project_id ; 'team' -> a team_id
// (getupcomingmeeting resolves meeting_type + meeting_type_id via meetingModel.meetingDetails)
const MEETINGS = [
  ['Weekly Site Progress Review', 'Review progress across all active construction projects.', 1, 10, 11, '2', '2', 'https://meet.google.com/local-dev-abc', 'Project'],
  ['Safety & Quality Sync',       'HSE compliance and QA coordination for the week.',         3, 15, 16, '2', '3', 'https://teams.microsoft.com/l/meetup-join/local-dev-xyz', 'team'],
];

(async () => {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST, user: process.env.DB_USER,
    password: process.env.DB_PASS, database: process.env.DB_NAME,
  });
  const stat = { config: 0, meetings: 0 };
  try {
    // imeetify_configuration -> accessdetails returns {access:true}
    const [cfg] = await conn.query(
      'SELECT configuration_id FROM imeetify_configuration WHERE user_id=?', [USER_ID]);
    if (cfg.length === 0) {
      await conn.query(
        'INSERT INTO imeetify_configuration (api_key, user_id, user_email) VALUES (?,?,?)',
        ['local-dev-api-key', USER_ID, EMAIL]);
      stat.config++;
    }

    // Resolve a real project_id and team_id for the user so getupcomingmeeting's
    // meetingDetails() lookup (projects/teams by id) succeeds.
    const [[proj]] = await conn.query(
      `SELECT x.project_id FROM category_project_xref x JOIN projects p ON p.project_id=x.project_id
       WHERE x.user_id=? AND p.status!='Cancelled' ORDER BY x.project_id LIMIT 1`, [USER_ID]);
    const [[team]] = await conn.query(
      'SELECT team_id FROM teams_users WHERE user_id=? AND project_id IS NULL ORDER BY team_id LIMIT 1',
      [USER_ID]);
    const projectId = proj && proj.project_id;
    const teamId = team && team.team_id;
    if (!projectId || !teamId) {
      console.warn('No seeded project/team for user; run seed_sample_data.js first. Skipping meetings.');
    } else {
      // meetings -> getupcomingmeeting. Delete+reinsert so re-runs self-correct
      // (an earlier run may have left meeting_type_id NULL).
      for (const [title, desc, dstart, sh, eh, type, provider, link, linkType] of MEETINGS) {
        const typeId = linkType === 'Project' ? projectId : teamId;
        await conn.query('DELETE FROM meetings WHERE title=? AND user_id=?', [title, USER_ID]);
        await conn.query(
          `INSERT INTO meetings
             (title, description, start, end, type, invitee_timezone, provider, location,
              calendar_id, invitee_email, guest_email, meeting_type, meeting_type_id,
              user_id, meeting_link)
           VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
          [title, desc, dtAt(dstart, sh), dtAt(dstart, eh), type, 'Asia/Kolkata', provider,
           'Online', 1, EMAIL, JSON.stringify([]), linkType, JSON.stringify([typeId]),
           USER_ID, link]);
        stat.meetings++;
      }
    }

    console.log('Meeting seed complete (new rows):', JSON.stringify(stat));
    const [[{ cc }]] = await conn.query(
      'SELECT COUNT(*) cc FROM imeetify_configuration WHERE user_id=?', [USER_ID]);
    const [[{ mc }]] = await conn.query(
      'SELECT COUNT(*) mc FROM meetings WHERE invitee_email=? AND end >= NOW()', [EMAIL]);
    console.log(`For user ${USER_ID}: imeetify_config rows=${cc}, upcoming meetings=${mc}`);
  } catch (e) {
    console.error('SEED ERROR:', e.code || '', e.sqlMessage || e.message);
    process.exitCode = 1;
  } finally {
    await conn.end();
  }
})();
