// ════════════════════════════════════════════════════════════════
//  STORAGE LAYER  —  Phase 1: localStorage
// ════════════════════════════════════════════════════════════════

const USERS_KEY    = 'sepl_users';
const SESSION_KEY  = 'sepl_session';
const INVOICES_KEY = 'sepl_invoices';

// ── Generate 2-letter employee ID from full name ─────────────────
// Rule: First initial of first name + First initial of last name
// If no last name: first two letters of first name
export function getEmployeeId(fullName) {
  if (!fullName) return 'XX';
  const parts = fullName.trim().split(/\s+/);
  if (parts.length === 1) {
    // Only one name — take first two letters
    return parts[0].substring(0, 2).toUpperCase();
  }
  // First letter of first name + First letter of LAST name
  // (ignores middle names like "Kumar" in "Dilip Kumar Gupta")
  const first = parts[0][0];
  const last  = parts[parts.length - 1][0];
  return (first + last).toUpperCase();
}

// ── Seed default employees ───────────────────────────────────────
function seedUsers() {
  const existing = localStorage.getItem(USERS_KEY);
  if (existing) return;
  const defaultUsers = [
    { id: 1,  username: 'Neelam',   password: 'SARAS', full_name: 'Neelam Sager'          },
    { id: 2,  username: 'Dilip',    password: 'SARAS', full_name: 'Dilip Kumar Gupta'      },
    { id: 3,  username: 'Barkha',   password: 'SARAS', full_name: 'Barkha Gautam'          },
    { id: 4,  username: 'Sourabh',  password: 'SARAS', full_name: 'Sourabh Poddar'         },
    { id: 5,  username: 'Vishal',   password: 'SARAS', full_name: 'Vishal Rathore'         },
    { id: 6,  username: 'Ankit',    password: 'SARAS', full_name: 'Ankit Chourasia'        },
    { id: 7,  username: 'Satnam',   password: 'SARAS', full_name: 'Satnam Mam'             },
    { id: 8,  username: 'Viplabh',  password: 'SARAS', full_name: 'Viplabh'               },
    { id: 9,  username: 'Kuldeep',  password: 'SARAS', full_name: 'Kuldeep Singh Chauhan'  },
    { id: 10, username: 'Rajendra', password: 'SARAS', full_name: 'Rajendra Anand'         },
    { id: 11, username: 'Abhishek', password: 'SARAS', full_name: 'Abhishek'           },
  ];
  localStorage.setItem(USERS_KEY, JSON.stringify(defaultUsers));
}

// ── Auth ─────────────────────────────────────────────────────────
export function checkSession() {
  seedUsers();
  const s = localStorage.getItem(SESSION_KEY);
  if (!s) return { logged_in: false };
  const session = JSON.parse(s);
  // Always attach employee_id to session
  session.employee_id = getEmployeeId(session.full_name);
  return { logged_in: true, ...session };
}

export function loginUser(username, password) {
  seedUsers();
  const users = JSON.parse(localStorage.getItem(USERS_KEY) || '[]');
  const user  = users.find(u => u.username === username && u.password === password);
  if (!user) return { success: false, error: 'Invalid username or password' };

  const employee_id = getEmployeeId(user.full_name);
  const session = {
    user_id:     user.id,
    username:    user.username,
    full_name:   user.full_name,
    employee_id,
  };
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  return { success: true, ...session };
}

export function logoutUser() {
  localStorage.removeItem(SESSION_KEY);
  return { success: true };
}

// ── Invoice Number ────────────────────────────────────────────────
// Format: SEPL/PI/{EMPLOYEE_ID}/26-27/{NUMBER}
// e.g.  : SEPL/PI/NS/26-27/1  for Neelam Sager
export function fetchNextNo(employeeId) {
  const invoices = JSON.parse(localStorage.getItem(INVOICES_KEY) || '[]');
  // Find highest suffix for THIS employee only
  const myInvoices = invoices.filter(inv => inv.employee_id === employeeId);
  const max        = myInvoices.reduce((m, inv) => Math.max(m, inv.invoice_suffix), 0);
  return { success: true, next_suffix: max + 1 };
}

// ── Save / Update Invoice ─────────────────────────────────────────
export function saveInvoice(formData, isEdit = false) {
  const session = JSON.parse(localStorage.getItem(SESSION_KEY) || '{}');
  const userId  = session.user_id;
  if (!userId) return { success: false, error: 'Not logged in' };

  const suffix      = parseInt(formData.invoiceSuffix);
  const employeeId  = formData.employeeId || getEmployeeId(session.full_name);
  if (!suffix)      return { success: false, error: 'Invalid invoice number' };

  const invoices   = JSON.parse(localStorage.getItem(INVOICES_KEY) || '[]');
  const buyerName  = formData.buyer?.name || 'unknown';
  const safeBuyer  = buyerName.replace(/[^A-Za-z0-9\s]/g, '').replace(/\s+/g, '_');
  const invoiceNo  = `SEPL/PI/${employeeId}/26-27/${suffix}`;
  const filename   = `SEPL-PI-${employeeId}-26-27-${suffix}_${safeBuyer}.pdf`;

  if (isEdit) {
    const idx = invoices.findIndex(
      inv => inv.invoice_suffix === suffix && inv.employee_id === employeeId
    );
    if (idx === -1) return { success: false, error: 'Invoice not found or access denied' };
    invoices[idx] = {
      ...invoices[idx],
      buyer_name:   buyerName,
      pdf_filename: filename,
      form_data:    { ...formData, invoiceNo },
      updated_at:   new Date().toISOString(),
    };
  } else {
    // Check duplicate only within this employee's invoices
    const exists = invoices.find(
      inv => inv.invoice_suffix === suffix && inv.employee_id === employeeId
    );
    if (exists) return { success: false, error: `Invoice #${suffix} already exists for ${employeeId}. Click + New PI.` };
    invoices.push({
      id:             Date.now(),
      invoice_suffix: suffix,
      invoice_no:     invoiceNo,
      employee_id:    employeeId,
      buyer_name:     buyerName,
      pdf_filename:   filename,
      form_data:      { ...formData, invoiceNo },
      created_by:     userId,
      created_at:     new Date().toISOString(),
    });
  }

  localStorage.setItem(INVOICES_KEY, JSON.stringify(invoices));
  return { success: true, filename, invoiceNo };
}

// ── History for current user ──────────────────────────────────────
export function fetchMyHistory() {
  const session  = JSON.parse(localStorage.getItem(SESSION_KEY) || '{}');
  const userId   = session.user_id;
  const invoices = JSON.parse(localStorage.getItem(INVOICES_KEY) || '[]');
  const mine     = invoices
    .filter(inv => inv.created_by === userId)
    .sort((a, b) => b.invoice_suffix - a.invoice_suffix)
    .map(({ id, invoice_suffix, invoice_no, buyer_name, pdf_filename, created_at }) =>
      ({ id, invoice_suffix, invoice_no, buyer_name, pdf_filename, created_at })
    );
  return { success: true, invoices: mine };
}

// ── Get one invoice for editing ───────────────────────────────────
export function fetchOneInvoice(suffix, employeeId) {
  const session  = JSON.parse(localStorage.getItem(SESSION_KEY) || '{}');
  const userId   = session.user_id;
  const invoices = JSON.parse(localStorage.getItem(INVOICES_KEY) || '[]');
  const inv      = invoices.find(
    i => i.invoice_suffix === parseInt(suffix) && i.created_by === userId
  );
  if (!inv) return { success: false, error: 'Not found or access denied' };
  return { success: true, form_data: inv.form_data };
}

// ── Admin: all invoices ───────────────────────────────────────────
export function fetchAdminAll(adminPassword) {
  if (adminPassword !== 'Saras@Admin2024') {
    return { success: false, error: 'Wrong admin password' };
  }
  const invoices = JSON.parse(localStorage.getItem(INVOICES_KEY) || '[]');
  const users    = JSON.parse(localStorage.getItem(USERS_KEY) || '[]');
  const result   = invoices
    .sort((a, b) => b.invoice_suffix - a.invoice_suffix)
    .map(inv => {
      const user = users.find(u => u.id === inv.created_by);
      return { ...inv, created_by_name: user?.full_name || 'Unknown' };
    });
  return { success: true, invoices: result };
}