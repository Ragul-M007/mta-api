/**
 * LOCAL DEV seed generator — user "professions" for the web admin user form
 * (idempotent, additive). The admin panel reads GET /mta/categories/avail_cats
 * and buckets `available_categories` rows by role_id to fill the Profession
 * dropdown per User Type:
 *   role_id 2 = STAFF (already seeded as document categories),
 *   3 = VENDOR, 4 = CONSULTANTS, 5 = CONTRACTORS, 6 = CLIENT.
 * Only STAFF (2) had rows, so Vendor/Consultant/Contractor/Client dropdowns were
 * empty. This adds sensible profession rows for 3-6 (the app's original intended
 * lists). Inserts only; guarded by (category_name, role_id) so re-runs add nothing.
 *
 *   node sql/seed_professions.js
 */
require('dotenv').config();
const mysql = require('mysql2/promise');

// role_id -> [ [name, description], ... ]
const PROFESSIONS = {
  3: [ // VENDOR
    ['Airconditioning', 'HVAC and air-conditioning supply'],
    ['Curtains / Fabrics', 'Curtains, blinds and soft furnishings'],
    ['Lights', 'Lighting fixtures and fittings'],
    ['Wallpaper', 'Wallpaper and wall coverings'],
    ['CCTV / PA / Telecom', 'Surveillance, public address and telecom'],
    ['Glass / Mirror Work', 'Glass, mirror and glazing supply'],
    ['UPVC Window', 'UPVC windows and doors'],
    ['Furniture / Chair', 'Furniture and seating supply'],
    ['Acoustics', 'Acoustic panels and treatment'],
    ['CVS', 'Closed vision / signage systems'],
    ['PEB', 'Pre-engineered building supply'],
  ],
  4: [ // CONSULTANTS
    ['Structural', 'Structural design consultancy'],
    ['Plumbing', 'Plumbing design consultancy'],
    ['Electrical', 'Electrical design consultancy'],
    ['3D Design', '3D visualisation and design'],
    ['Landscape', 'Landscape design consultancy'],
  ],
  5: [ // CONTRACTORS  (category_name is globally UNIQUE, so names that also exist
      //                 for consultants/vendors are suffixed to stay distinct)
    ['Plumbing Works', 'Plumbing works'],
    ['Electrical Works', 'Electrical works'],
    ['Carpenter', 'Carpentry works'],
    ['Tile / Marble Flooring', 'Tile and marble flooring'],
    ['Wooden Flooring', 'Wooden flooring works'],
    ['Rubber Flooring', 'Rubber flooring works'],
    ['False Ceiling', 'False ceiling works'],
    ['Polish / Painting', 'Polishing and painting works'],
    ['AC Installation', 'Air-conditioning installation'],
    ['MS Work', 'Mild-steel fabrication works'],
    ['Civil', 'Civil and structural works'],
    ['Display Counter', 'Display and counter fabrication'],
    ['Garden Work', 'Landscaping and garden works'],
    ['Overall Contractor', 'Turnkey / overall contracting'],
    ['Interior Carpenter', 'Interior carpentry works'],
  ],
  6: [ // CLIENT
    ['Individual', 'Individual / personal client'],
    ['Corporate', 'Corporate / company client'],
    ['Government', 'Government / public body client'],
    ['Builder / Developer', 'Builder or property developer'],
    ['Architect', 'Architect / design firm client'],
    ['Interior Designer', 'Interior design firm client'],
  ],
};

(async () => {
  const c = await mysql.createConnection({
    host: process.env.DB_HOST, user: process.env.DB_USER,
    password: process.env.DB_PASS, database: process.env.DB_NAME,
  });
  const added = {};
  try {
    for (const roleId of Object.keys(PROFESSIONS)) {
      added[roleId] = 0;
      for (const [name, desc] of PROFESSIONS[roleId]) {
        // category_name is globally UNIQUE, so guard by name alone (a name can live under only one role_id).
        const [[row]] = await c.query(
          'SELECT category_id FROM available_categories WHERE category_name=? LIMIT 1',
          [name]);
        if (!row) {
          await c.query(
            'INSERT INTO available_categories (category_name, description, role_id) VALUES (?,?,?)',
            [name, desc, roleId]);
          added[roleId]++;
        }
      }
    }
    console.log('Seeded professions (new rows by role_id):');
    console.table(added);
    const [byrole] = await c.query(
      'SELECT role_id, COUNT(*) n FROM available_categories GROUP BY role_id ORDER BY role_id');
    console.log('available_categories totals by role_id:');
    console.table(byrole);
  } catch (e) {
    console.error('SEED ERROR:', e.code || '', e.sqlMessage || e.message);
    process.exitCode = 1;
  } finally {
    await c.end();
  }
})();
