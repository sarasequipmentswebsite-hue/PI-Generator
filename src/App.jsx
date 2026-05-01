import { useState, useEffect } from 'react';
import InvoiceForm    from './components/InvoiceForm';
import InvoicePreview from './components/InvoicePreview';
import LoginPage      from './pages/LoginPage';
import HistoryPage    from './pages/HistoryPage';
import { downloadPDF } from './utils/pdfExport';
import {
  checkSession,
  logoutUser,
  fetchNextNo,
  saveInvoice,
} from './utils/storage';
import './App.css';

// ── helpers ───────────────────────────────────────────────────────
function getToday() {
  const d = new Date();
  return [
    String(d.getDate()).padStart(2, '0'),
    String(d.getMonth() + 1).padStart(2, '0'),
    d.getFullYear(),
  ].join('-');
}

function blankForm(employeeId = 'SL') {
  return {
    invoiceSuffix:     '',
    employeeId:        employeeId,
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
      name:      'ICICI Bank Limited',
      accountNo: '235405500611',
      branch:    'Nangloi',
      ifsc:      'ICIC0002354',
    },
    companyPan: 'ABMCS6189C',
  };
}

// ─────────────────────────────────────────────────────────────────
export default function App() {

  const [user,       setUser]       = useState(null);
  const [checking,   setChecking]   = useState(true);
  const [view,       setView]       = useState('invoice');
  const [activeTab,  setActiveTab]  = useState('form');
  const [formData,   setFormData]   = useState(blankForm());
  const [isEdit,     setIsEdit]     = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [saveMsg,    setSaveMsg]    = useState('');

  // ── Restore session on mount ──────────────────────────────────
  useEffect(() => {
    const session = checkSession();
    if (session.logged_in) {
      setUser({
        user_id:     session.user_id,
        username:    session.username,
        full_name:   session.full_name,
        employee_id: session.employee_id,
      });
    }
    setChecking(false);
  }, []);

  // ── Load next invoice number when user is set ─────────────────
  useEffect(() => {
    if (user && !isEdit) {
      loadNextNo(user.employee_id);
    }
  }, [user]);

  function loadNextNo(employeeId) {
    const empId = employeeId || 'SL';
    const res   = fetchNextNo(empId);
    if (res.success) {
      setFormData(prev => ({
        ...prev,
        invoiceSuffix: String(res.next_suffix),
        employeeId:    empId,
      }));
    }
  }

  // ── Login ─────────────────────────────────────────────────────
  const handleLogin = (userData) => {
    setUser({
      user_id:     userData.user_id,
      username:    userData.username,
      full_name:   userData.full_name,
      employee_id: userData.employee_id,
    });
  };

  // ── Logout ────────────────────────────────────────────────────
  const handleLogout = () => {
    logoutUser();
    setUser(null);
    setFormData(blankForm());
    setIsEdit(false);
    setView('invoice');
    setActiveTab('form');
    setSaveMsg('');
  };

  // ── New PI ────────────────────────────────────────────────────
  const handleNewPI = () => {
    const empId = user?.employee_id || 'SL';
    const res   = fetchNextNo(empId);
    const form  = blankForm(empId);
    if (res.success) form.invoiceSuffix = String(res.next_suffix);
    setFormData(form);
    setIsEdit(false);
    setSaveMsg('');
    setView('invoice');
    setActiveTab('form');
  };

  // ── Edit invoice from history ─────────────────────────────────
  const handleEditInvoice = (savedFormData) => {
    setFormData(savedFormData);
    setIsEdit(true);
    setSaveMsg('');
    setView('invoice');
    setActiveTab('form');
  };

  // ── Download + Save ───────────────────────────────────────────
  // FIND the entire handleDownload function and REPLACE WITH:
const handleDownload = async () => {
  setSaveMsg('');
  setActiveTab('preview');
  setPdfLoading(true);

  // Let React render the preview
  await new Promise(r => setTimeout(r, 400));

  const empId     = formData.employeeId || user?.employee_id || 'SL';
  const buyerSafe = (formData.buyer?.name || 'unknown')
    .replace(/[^A-Za-z0-9\s]/g, '')
    .replace(/\s+/g, '_');
  const filename  = `SEPL-PI-${empId}-26-27-${formData.invoiceSuffix}_${buyerSafe}.pdf`;

  try {
    // Opens browser print dialog — user clicks Save as PDF
    // Result: real text PDF, copyable, tiny file size
    await downloadPDF(filename);

    // Save record to storage after download initiated
    const saveRes = saveInvoice(formData, isEdit);
    if (saveRes.success) {
      setSaveMsg('✅ Saved — use "Save as PDF" in print dialog');
      if (!isEdit) setIsEdit(true);
    } else {
      setSaveMsg('⚠️ ' + saveRes.error);
    }
  } catch (err) {
    setSaveMsg('❌ Error: ' + err.message);
  } finally {
    setPdfLoading(false);
  }
};
  // ── Render: splash ────────────────────────────────────────────
  if (checking) {
    return (
      <div className="app-splash">
        <div className="app-splash-logo">SE</div>
      </div>
    );
  }

  // ── Render: login ─────────────────────────────────────────────
  if (!user) {
    return <LoginPage onLogin={handleLogin} />;
  }

  // ── Render: app ───────────────────────────────────────────────
  const empId     = formData.employeeId || user.employee_id || 'SL';
  const invoiceNo = `SEPL/PI/${empId}/26-27/${formData.invoiceSuffix || ''}`;

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
                ? `✏️ Editing — ${invoiceNo}`
                : `New Proforma Invoice — ${invoiceNo}`
              }
            </span>
          </div>
        </div>

        <div className="topbar-right">

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

          <button className="tb-btn" onClick={handleNewPI}>
            + New PI
          </button>

          <button
            className={`tb-btn ${view === 'history' ? 'tb-btn-active' : ''}`}
            onClick={() => setView(view === 'history' ? 'invoice' : 'history')}
          >
            📋 History
          </button>

          <div className="topbar-user">
            <span className="topbar-user-name">
              {user.full_name}
              <span className="topbar-emp-id">[{user.employee_id}]</span>
            </span>
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
            <div className={`panel panel-form ${activeTab === 'form' ? 'panel-visible' : 'panel-hidden'}`}>
              <div className="panel-scroll">
                <InvoiceForm formData={formData} setFormData={setFormData} />
              </div>
            </div>
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