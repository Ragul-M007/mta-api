/**
 * LOCAL DEV seed — available_categories reference data (idempotent, additive).
 *
 * Fixes the admin panel's "Available Categories" dialog (GET /categories/avail_cats),
 * which returns an error when this lookup table is empty. Production ships ~190 rows;
 * a fresh construction_db has none.
 *
 * Includes the two SPECIAL category names the backend logic references
 * (utils/chat.js -> 'CAD-GFC', 'OFFER & CONTACT DETAILS') plus a general
 * construction document-category set. Inserts only; no app code / prod data touched.
 *
 *   node sql/seed_reference_data.js
 */
require('dotenv').config();
const mysql = require('mysql2/promise');

// [category_name, description, role_id]  (role_id 2 = STAFF, the primary app user)
const CATEGORIES = [
  // --- special categories the app has dedicated handling for ---
  ['CAD-GFC',                 'Good For Construction (GFC) CAD drawings', 2],
  ['OFFER & CONTACT DETAILS', 'Commercial offer and contact details',     2],
  // --- general construction document categories ---
  ['Architectural Drawings',  'Floor plans, elevations and sections',      2],
  ['Structural Drawings',     'Structural design and detailing drawings',  2],
  ['MEP Drawings',            'Mechanical, electrical and plumbing layouts',2],
  ['Bill of Quantities',      'Quantity take-offs and BOQ sheets',         2],
  ['Tender Documents',        'Tender notices, bids and evaluations',      2],
  ['Contracts & Agreements',  'Signed contracts and legal agreements',     2],
  ['Purchase Orders',         'Material and service purchase orders',      2],
  ['Material Approvals',      'Material submittals and approvals',         2],
  ['Inspection Reports',      'Site inspection and checklist reports',     2],
  ['Quality Reports',         'Quality assurance and test reports',        2],
  ['Safety Documents',        'HSE plans, permits and incident reports',   2],
  ['Site Photos',             'Progress and site condition photographs',   2],
  ['Progress Reports',        'Daily and weekly progress reports',         2],
  ['Meeting Minutes',         'Minutes of meetings and action items',      2],
];

(async () => {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST, user: process.env.DB_USER,
    password: process.env.DB_PASS, database: process.env.DB_NAME,
  });
  let added = 0;
  try {
    for (const [name, desc, role] of CATEGORIES) {
      const [ex] = await conn.query('SELECT category_id FROM available_categories WHERE category_name=?', [name]);
      if (ex.length) continue;
      await conn.query(
        'INSERT INTO available_categories (category_name, description, role_id) VALUES (?,?,?)',
        [name, desc, role]);
      added++;
    }
    const [[{ n }]] = await conn.query('SELECT COUNT(*) n FROM available_categories');
    console.log(`available_categories seed complete: ${added} new, ${n} total.`);
  } catch (e) {
    console.error('SEED ERROR:', e.code || '', e.sqlMessage || e.message);
    process.exitCode = 1;
  } finally {
    await conn.end();
  }
})();
