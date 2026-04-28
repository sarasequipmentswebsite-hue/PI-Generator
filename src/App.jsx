import { useState, useEffect } from 'react';
import InvoiceForm    from './components/InvoiceForm';
import InvoicePreview from './components/InvoicePreview';
import LoginPage      from './pages/LoginPage';
import HistoryPage    from './pages/HistoryPage';
import {
  checkSession,
  logoutUser,
  fetchNextNo,
  saveInvoice,
} from './utils/storage';
import './App.css';

// ── helpers ──────────────────────────────────────────────────────
function getToday() {
  const d = new Date();
  return [
    String(d.getDate()).padStart(2, '0'),
    String(d.getMonth() + 1).padStart(2, '0'),
    d.getFullYear(),
  ].join('-');
}

function blankForm() {
  return {
    invoiceSuffix:     '',
    invoiceDate:       getToday(),
    deliveryNote:      '',
    deliveryNoteDate:  '',
    referenceNo:       '',
    referenceDate:     '',
    buyersOrderNo:     '',
    buyersOrderDate:   '',
    dispatchDocNo:     '',
    dispatchedThrough: '',
    destination:       '',
    otherReferences:   '',
    buyer:         { name: '', address: '', pan: '', gstin: '' },
    consigneeType: 'same',
    consignee:     { name: '', address: '', pan: '', gstin: '' },
    currency:      'INR',
    items: [
      { id: 1, description: '', hsn: '', quantity: '', rate: '', per: 'Set', amount: 0 },
    ],
    discount:    { type: 'none', value: '' },
    bankDetails: {
      name:       'ICICI Bank Limited',
      accountNo:  '235405500611',
      branch:     'Nangloi',
      ifsc:       'ICIC0002354',
    },
    companyPan: 'ABMCS6189C',
  };
}

// ─────────────────────────────────────────────────────────────────
export default function App() {
  // ── state ──────────────────────────────────────────────────────
  const [user,       setUser]       = useState(null);     // logged-in user object
  const [checking,   setChecking]   = useState(true);     // initial session check
  const [view,       setView]       = useState('invoice'); // 'invoice' | 'history'
  const [activeTab,  setActiveTab]  = useState('form');    // 'form' | 'preview'
  const [formData,   setFormData]   = useState(blankForm());
  const [isEdit,     setIsEdit]     = useState(false);     // editing existing PI
  const [pdfLoading, setPdfLoading] = useState(false);
  const [saveMsg,    setSaveMsg]    = useState('');        // feedback after save

  // ── on mount: restore session ───────────────────────────────────
  useEffect(() => {
    const session = checkSession();
    if (session.logged_in) {
      setUser({ user_id: session.user_id, username: session.username, full_name: session.full_name });
    }
    setChecking(false);
  }, []);

  // ── when user logs in: load next invoice number ─────────────────
useEffect(() => {
  if (user && !isEdit) {
    loadNextNo(user.employee_id);
  }
}, [user]);

function loadNextNo(employeeId) {
  const res = fetchNextNo(employeeId);
  if (res.success) {
    setFormData(prev => ({
      ...prev,
      invoiceSuffix: String(res.next_suffix),
      employeeId:    employeeId,   // store in formData so preview uses it
    }));
  }
}

  // ── auth handlers ───────────────────────────────────────────────
 const handleLogin = (userData) => {
  // employee_id comes from loginUser() in storage.js
  setUser(userData);
};

  const handleLogout = () => {
    logoutUser();
    setUser(null);
    setFormData(blankForm());
    setIsEdit(false);
    setView('invoice');
    setActiveTab('form');
    setSaveMsg('');
  };

  // ── new PI ──────────────────────────────────────────────────────
  const handleNewPI = () => {
  const empId = user?.employee_id || 'XX';
  const res   = fetchNextNo(empId);
  const form  = blankForm();
  if (res.success) form.invoiceSuffix = String(res.next_suffix);
  form.employeeId = empId;
  setFormData(form);
  setIsEdit(false);
  setSaveMsg('');
  setView('invoice');
  setActiveTab('form');
};

  // ── edit existing PI (called from HistoryPage) ──────────────────
  const handleEditInvoice = (savedFormData) => {
    setFormData(savedFormData);
    setIsEdit(true);
    setSaveMsg('');
    setView('invoice');
    setActiveTab('form');
  };

  // ── download + save ─────────────────────────────────────────────
  const handleDownload = async () => {
    setSaveMsg('');
    setActiveTab('preview');
    setPdfLoading(true);

    // Let React render the preview first
    await new Promise(r => setTimeout(r, 400));

    const element = document.getElementById('invoice-preview-content');
    if (!element) { setPdfLoading(false); return; }

    const buyerSafe = (formData.buyer?.name || 'unknown')
      .replace(/[^A-Za-z0-9\s]/g, '')
      .replace(/\s+/g, '_');
    const filename  = `SEPL-PI-SL-26-27-${formData.invoiceSuffix}_${buyerSafe}.pdf`;

    const html2pdf = (await import('html2pdf.js')).default;
   // REPLACE WITH:
const opt = {
  margin:      [6, 6, 6, 6],
  filename,
  // Use 'png' not 'jpeg' — better text rendering
  image:       { type: 'png', quality: 1 },
  html2canvas: {
    scale:         3,        // higher scale = sharper text
    useCORS:       true,
    scrollY:       0,
    letterRendering: true,   // renders each letter individually = copyable
    allowTaint:    false,
  },
  jsPDF: {
    unit:        'mm',
    format:      'a4',
    orientation: 'portrait',
    compress:    false,      // no compression = text stays selectable
  },
  pagebreak: { mode: ['css', 'legacy'] },
};

    try {
      // Generate blob → download to browser
      const pdfBlob = await html2pdf().set(opt).from(element).outputPdf('blob');
      const url  = URL.createObjectURL(pdfBlob);
      const link = document.createElement('a');
      link.href = url; link.download = filename; link.click();
      URL.revokeObjectURL(url);

      // Save record to storage
      const saveRes = saveInvoice(formData, isEdit);
      if (saveRes.success) {
        setSaveMsg('✅ Saved');
        if (!isEdit) setIsEdit(true); // prevent duplicate on next download
      } else {
        setSaveMsg('⚠️ ' + saveRes.error);
      }
    } catch (err) {
      setSaveMsg('❌ Error: ' + err.message);
    } finally {
      setPdfLoading(false);
    }
  };

  // ── render ──────────────────────────────────────────────────────

  // Still checking session
  if (checking) {
    return (
      <div className="app-splash">
        <div className="app-splash-logo">SE</div>
      </div>
    );
  }

  // Not logged in
  if (!user) {
    return <LoginPage onLogin={handleLogin} />;
  }

  // Logged in
  return (
    <div className="app-root">

      {/* ── TOP BAR ── */}
      <header className="topbar">
        <div className="topbar-left">
          <div className="topbar-logo">SE</div>
          <div className="topbar-title">
            <span className="topbar-company">Saras Equipments Pvt. Ltd.</span>
            <span className="topbar-subtitle">
              {isEdit
                ? `✏️ Editing — ${formData.invoiceSuffix ? 'SEPL/PI/SL/26-27/' + formData.invoiceSuffix : ''}`
                : `New Proforma Invoice`
              }
            </span>
          </div>
        </div>

        <div className="topbar-right">

          {/* Edit/Preview tabs — only in invoice view */}
          {view === 'invoice' && (
            <>
              <div className="tabs">
                <button
                  className={`tab ${activeTab === 'form' ? 'tab-active' : ''}`}
                  onClick={() => setActiveTab('form')}
                >✏️ Edit</button>
                <button
                  className={`tab ${activeTab === 'preview' ? 'tab-active' : ''}`}
                  onClick={() => setActiveTab('preview')}
                >👁 Preview</button>
              </div>
              <button
                className="dl-btn"
                onClick={handleDownload}
                disabled={pdfLoading}
              >
                {pdfLoading ? '⏳ Generating…' : '⬇ Download & Save'}
              </button>
              {saveMsg && <span className="topbar-save-msg">{saveMsg}</span>}
            </>
          )}

          {/* New PI button */}
          <button className="tb-btn" onClick={handleNewPI}>
            + New PI
          </button>

          {/* History toggle */}
          <button
            className={`tb-btn ${view === 'history' ? 'tb-btn-active' : ''}`}
            onClick={() => setView(view === 'history' ? 'invoice' : 'history')}
          >
            📋 History
          </button>

          {/* User info + logout */}
          <div className="topbar-user">
            <span className="topbar-user-name">{user.full_name}</span>
            <button className="tb-logout" onClick={handleLogout}>Logout</button>
          </div>

        </div>
      </header>

      {/* ── MAIN CONTENT ── */}
      <main className="app-main">

        {view === 'history' ? (

          <HistoryPage
            user={user}
            onEditInvoice={handleEditInvoice}
            onNewInvoice={handleNewPI}
          />

        ) : (
          <>
            {/* FORM PANEL */}
            <div className={`panel panel-form ${activeTab === 'form' ? 'panel-visible' : 'panel-hidden'}`}>
              <div className="panel-scroll">
                <InvoiceForm formData={formData} setFormData={setFormData} />
              </div>
            </div>

            {/* PREVIEW PANEL */}
            <div className={`panel panel-preview ${activeTab === 'preview' ? 'panel-visible' : 'panel-hidden'}`}>
              <div className="panel-scroll preview-bg">
                <div className="preview-shadow-wrap">
                  <InvoicePreview formData={formData} />
                </div>
              </div>
            </div>
          </>
        )}

      </main>
    </div>
  );
}