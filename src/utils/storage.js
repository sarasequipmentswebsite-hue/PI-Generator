// ════════════════════════════════════════════════════════════════
//  STORAGE LAYER  —  Phase 1: localStorage
//  In Phase 2, replace this entire file with API calls to XAMPP.
//  All function signatures stay identical so nothing else breaks.
// ════════════════════════════════════════════════════════════════

const USERS_KEY    = 'sepl_users';
const SESSION_KEY  = 'sepl_session';
const INVOICES_KEY = 'sepl_invoices';

// ── Seed default employees on first run ─────────────────────────
function seedUsers() {
  const existing = localStorage.getItem(USERS_KEY);
  if (existing) return;
  const defaultUsers = [
    { id: 1,  username: 'Neelam',   password: 'SARAS', full_name: 'Neelam' },
    { id: 2,  username: 'Dilip',   password: 'SARAS', full_name: 'Dilip Kumar Gupta'  },
    { id: 3,  username: 'Barkha',    password: 'SARAS', full_name: 'Barkha'   },
    { id: 4,  username: 'Sourabh',   password: 'SARAS', full_name: 'Sourabh'  },
    { id: 5,  username: 'Vishal',  password: 'SARAS', full_name: 'Vishal' },
    { id: 6,  username: 'Ankit',   password: 'SARAS', full_name: 'Ankit'  },
    { id: 7,  username: 'Satnam',   password: 'SARAS', full_name: 'Satnam'  },
    { id: 8,  username: 'Viplabh',   password: 'SARAS', full_name: 'Viplabh'   },
    { id: 9,  username: 'Kuldeep',   password: 'SARAS', full_name: 'Kuldeep Singh Chauhan'    },
    // { id: 10, username: 'meena',   password: 'SARAS', full_name: 'Meena Joshi'  },
  ];
  localStorage.setItem(USERS_KEY, JSON.stringify(defaultUsers));
}

// ── Auth ─────────────────────────────────────────────────────────
export function checkSession() {
  seedUsers();
  const s = localStorage.getItem(SESSION_KEY);
  if (!s) return { logged_in: false };
  return { logged_in: true, ...JSON.parse(s) };
}

export function loginUser(username, password) {
  seedUsers();
  const users = JSON.parse(localStorage.getItem(USERS_KEY) || '[]');
  const user  = users.find(u => u.username === username && u.password === password);
  if (!user) return { success: false, error: 'Invalid username or password' };
  const session = { user_id: user.id, username: user.username, full_name: user.full_name };
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  return { success: true, ...session };
}

export function logoutUser() {
  localStorage.removeItem(SESSION_KEY);
  return { success: true };
}

// ── Invoice Number ────────────────────────────────────────────────
export function fetchNextNo() {
  const invoices = JSON.parse(localStorage.getItem(INVOICES_KEY) || '[]');
  const max      = invoices.reduce((m, inv) => Math.max(m, inv.invoice_suffix), 0);
  return { success: true, next_suffix: max + 1 };
}

// ── Save / Update Invoice ─────────────────────────────────────────
export function saveInvoice(formData, isEdit = false) {
  const session  = JSON.parse(localStorage.getItem(SESSION_KEY) || '{}');
  const userId   = session.user_id;
  if (!userId) return { success: false, error: 'Not logged in' };

  const suffix   = parseInt(formData.invoiceSuffix);
  if (!suffix)   return { success: false, error: 'Invalid invoice number' };

  const invoices = JSON.parse(localStorage.getItem(INVOICES_KEY) || '[]');

  const buyerName  = formData.buyer?.name || 'unknown';
  const safeBuyer  = buyerName.replace(/[^A-Za-z0-9\s]/g, '').replace(/\s+/g, '_');
  const filename   = `SEPL-PI-SL-26-27-${suffix}_${safeBuyer}.pdf`;
  const invoiceNo  = `SEPL/PI/SL/26-27/${suffix}`;

  if (isEdit) {
    const idx = invoices.findIndex(
      inv => inv.invoice_suffix === suffix && inv.created_by === userId
    );
    if (idx === -1) return { success: false, error: 'Invoice not found or access denied' };
    invoices[idx] = {
      ...invoices[idx],
      buyer_name:   buyerName,
      pdf_filename: filename,
      form_data:    formData,
      updated_at:   new Date().toISOString(),
    };
  } else {
    const exists = invoices.find(inv => inv.invoice_suffix === suffix);
    if (exists) return { success: false, error: `Invoice #${suffix} already exists. Click + New PI.` };
    invoices.push({
      id:             Date.now(),
      invoice_suffix: suffix,
      invoice_no:     invoiceNo,
      buyer_name:     buyerName,
      pdf_filename:   filename,
      form_data:      formData,
      created_by:     userId,
      created_at:     new Date().toISOString(),
    });
  }

  localStorage.setItem(INVOICES_KEY, JSON.stringify(invoices));
  return { success: true, filename };
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
export function fetchOneInvoice(suffix) {
  const session  = JSON.parse(localStorage.getItem(SESSION_KEY) || '{}');
  const userId   = session.user_id;
  const invoices = JSON.parse(localStorage.getItem(INVOICES_KEY) || '[]');
  const inv      = invoices.find(
    i => i.invoice_suffix === parseInt(suffix) && i.created_by === userId
  );
  if (!inv) return { success: false, error: 'Not found or access denied' };
  return { success: true, form_data: inv.form_data };
}

// ── Admin: all invoices (Phase 2 will add password check server-side)
export function fetchAdminAll(adminPassword) {
  // Phase 1: simple client-side password check
  // Phase 2: this becomes an API call with server-side validation
  if (adminPassword !== 'Saras@Admin2024') {
    return { success: false, error: 'Wrong admin password' };
  }
  const invoices = JSON.parse(localStorage.getItem(INVOICES_KEY) || '[]');
  const users    = JSON.parse(localStorage.getItem(USERS_KEY) || '[]');
  const result   = invoices
    .sort((a, b) => b.invoice_suffix - a.invoice_suffix)
    .map(inv => {
      const user = users.find(u => u.id === inv.created_by);
      return {
        ...inv,
        created_by_name: user?.full_name || 'Unknown',
      };
    });
  return { success: true, invoices: result };
}