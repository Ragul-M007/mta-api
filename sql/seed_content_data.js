/**
 * LOCAL DEV seed generator — content for the empty screens (dynamic, idempotent,
 * additive): per-project categories + documents, chat groups + members +
 * messages, notifications, and a document-level comment. Linked to the local
 * test staff user (1078) and admin (1079) and their existing projects/teams.
 *
 * Re-runnable: every insert is guarded, so running twice adds nothing.
 * Inserts only — never touches app code or existing rows.
 *
 *   node sql/seed_content_data.js
 */
require('dotenv').config();
const mysql = require('mysql2/promise');

const STAFF = 1078;
const ADMIN = 1079;
const CAT_NAMES = ['Structural', 'Electrical', 'Plumbing'];
const DOC_SPECS = [
  { file: 'uploads/documents/site-plan.pdf', name: 'Site Plan.pdf', desc: 'Approved site layout plan' },
  { file: 'uploads/documents/floor-drawing.jpg', name: 'Floor Drawing.jpg', desc: 'Ground floor structural drawing' },
  { file: 'uploads/documents/boq.xlsx', name: 'BOQ.xlsx', desc: 'Bill of quantities' },
];
const MSGS = ['Hi team, work started on site today.', 'Please share the latest drawings.', 'Noted, uploading them now.'];

(async () => {
  const c = await mysql.createConnection({
    host: process.env.DB_HOST, user: process.env.DB_USER,
    password: process.env.DB_PASS, database: process.env.DB_NAME,
  });
  const q = (sql, v) => c.query(sql, v);
  const one = async (sql, v) => (await q(sql, v))[0][0];

  const [prRows] = await q('SELECT DISTINCT project_id FROM category_project_xref WHERE user_id=? ORDER BY project_id', [STAFF]);
  const projects = prRows.map(r => r.project_id);
  const [tmRows] = await q('SELECT team_id FROM teams_users WHERE user_id=?', [STAFF]);
  const teams = tmRows.map(r => r.team_id);
  const pName = {};
  for (const p of projects) pName[p] = (await one('SELECT project_name n FROM projects WHERE project_id=?', [p]))?.n || `Project ${p}`;
  const tName = {};
  for (const t of teams) tName[t] = (await one('SELECT team_name n FROM teams WHERE team_id=?', [t]))?.n || `Team ${t}`;
  // project_documents.category_id references available_categories (FK)
  const [acRows] = await q('SELECT category_id FROM available_categories ORDER BY category_id');
  const availCats = acRows.map(r => r.category_id);

  let added = { categories: 0, project_documents: 0, group_details: 0, group_members: 0, messages: 0, notifications: 0, comments: 0 };

  // 1) categories (per project) + capture ids
  const catByProject = {};
  for (const p of projects) {
    catByProject[p] = [];
    for (const name of CAT_NAMES) {
      let row = await one('SELECT category_id id FROM categories WHERE project_id=? AND category_name=? LIMIT 1', [p, name]);
      if (!row) {
        const [r] = await q('INSERT INTO categories (project_id, category_name, description) VALUES (?,?,?)',
          [p, name, `${name} works for ${pName[p]}`]);
        row = { id: r.insertId }; added.categories++;
      }
      catByProject[p].push(row.id);
    }
  }

  // 2) project_documents (per project)
  const docByProject = {};
  for (const p of projects) {
    docByProject[p] = [];
    for (let i = 0; i < DOC_SPECS.length; i++) {
      const d = DOC_SPECS[i];
      let row = await one('SELECT document_id id FROM project_documents WHERE project_id=? AND file_name=? LIMIT 1', [p, d.name]);
      if (!row) {
        const catId = availCats.length ? availCats[i % availCats.length] : null;
        const [r] = await q(
          'INSERT INTO project_documents (project_id, category_id, file, file_name, user_id, description) VALUES (?,?,?,?,?,?)',
          [p, catId, d.file, d.name, STAFF, d.desc]);
        row = { id: r.insertId }; added.project_documents++;
      }
      docByProject[p].push(row.id);
    }
  }

  // 3) chat groups: one per team (team-type) + one per project (project-type)
  const groupIds = [];
  const ensureGroup = async (name, type, projectId, teamId) => {
    let row = await one('SELECT group_id id FROM group_details WHERE group_name=? AND group_created_by=? LIMIT 1', [name, STAFF]);
    if (!row) {
      const [r] = await q(
        'INSERT INTO group_details (group_name, group_description, group_type, project_id, team_id, group_created_by) VALUES (?,?,?,?,?,?)',
        [name, `${name} discussion`, type, projectId, teamId, STAFF]);
      row = { id: r.insertId }; added.group_details++;
    }
    groupIds.push(row.id);
    // members: staff + admin
    for (const u of [STAFF, ADMIN]) {
      const m = await one('SELECT group_member_id id FROM group_members WHERE group_id=? AND user_id=? LIMIT 1', [row.id, u]);
      if (!m) { await q('INSERT INTO group_members (group_id, user_id) VALUES (?,?)', [row.id, u]); added.group_members++; }
    }
    // messages
    const [[mc]] = await q('SELECT COUNT(*) n FROM messages WHERE group_id=?', [row.id]);
    if (mc.n === 0) {
      for (let i = 0; i < MSGS.length; i++) {
        await q('INSERT INTO messages (message, group_id, user_id, message_readed_users, file_downloaded_users, all_users_readed) VALUES (?,?,?,?,?,?)',
          [MSGS[i], row.id, i % 2 === 0 ? STAFF : ADMIN, `[${STAFF},${ADMIN}]`, '[]', 1]);
        added.messages++;
      }
    }
    return row.id;
  };
  for (const t of teams) await ensureGroup(`${tName[t]} Group`, 'team', null, t);
  for (const p of projects) await ensureGroup(`${pName[p]} Group`, 'project', p, null);

  // 4) notifications for the staff user
  const NOTIS = [
    { title: 'New Document Uploaded', desc: 'A new document was added to your project.' },
    { title: 'Meeting Scheduled', desc: 'You have an upcoming site meeting.' },
    { title: 'New Comment', desc: 'Someone commented on a project document.' },
    { title: 'Added to Group', desc: 'You were added to a chat group.' },
    { title: 'Attendance Reminder', desc: 'Do not forget to mark your attendance.' },
  ];
  for (const n of NOTIS) {
    const row = await one('SELECT noti_id id FROM notifications WHERE title=? AND user_id=? LIMIT 1', [n.title, STAFF]);
    if (!row) {
      await q('INSERT INTO notifications (title, description, user_id, user_type, read_status) VALUES (?,?,?,?,?)',
        [n.title, n.desc, STAFF, 2, 0]);
      added.notifications++;
    }
  }

  // 5) a document-level comment (so document comments screen has content)
  const firstProject = projects[0];
  const firstDoc = docByProject[firstProject]?.[0];
  if (firstDoc) {
    const row = await one('SELECT comment_id id FROM comments WHERE document_id=? LIMIT 1', [firstDoc]);
    if (!row) {
      await q('INSERT INTO comments (document_id, user_id, comment, project_id, recipient, category_id_list, category_list, recipient_id) VALUES (?,?,?,?,?,?,?,?)',
        [firstDoc, STAFF, 'Please review this document.', firstProject, '[]', '[]', '[]', '[]']);
      added.comments++;
    }
  }

  console.log('Seeded content (added rows):');
  console.table(added);
  console.log(`Projects: ${projects.join(',')}  Teams: ${teams.join(',')}  Chat groups: ${groupIds.length}`);
  await c.end();
})().catch(e => { console.error('SEED ERROR:', e.message); process.exit(1); });
