// import { useState, useEffect } from 'react';
// import InvoiceForm    from './components/InvoiceForm';
// import InvoicePreview from './components/InvoicePreview';
// import LoginPage      from './pages/LoginPage';
// import HistoryPage    from './pages/HistoryPage';

// import {
//   checkSession,
//   logoutUser,
//   fetchNextNo,
//   saveInvoice,
// } from './utils/storage';
// import './App.css';
// import { downloadPDF } from './utils/pdfExport';

// // ── helpers ───────────────────────────────────────────────────────
// function getToday() {
//   const d = new Date();
//   return [
//     String(d.getDate()).padStart(2, '0'),
//     String(d.getMonth() + 1).padStart(2, '0'),
//     d.getFullYear(),
//   ].join('-');
// }

// function blankForm(employeeId = 'SL') {
//   return {
//     invoiceSuffix:     '',
//     employeeId:        employeeId,
//     invoiceDate:       getToday(),
//     deliveryNote:      '',
//     deliveryNoteDate:  '',
//     referenceNo:       '',
//     referenceDate:     '',
//     buyersOrderNo:     '',
//     buyersOrderDate:   '',
//     dispatchDocNo:     '',
//     dispatchedThrough: '',
//     destination:       '',
//     otherReferences:   '',
//     buyer:         { name: '', address: '', pan: '', gstin: '' },
//     consigneeType: 'same',
//     consignee:     { name: '', address: '', pan: '', gstin: '' },
//     currency:      'INR',
//     items: [
//       { id: 1, description: '', hsn: '', quantity: '', rate: '', per: 'Set', amount: 0 },
//     ],
//     discount:    { type: 'none', value: '' },
//     bankDetails: {
//       name:      'ICICI Bank Limited',
//       accountNo: '235405500611',
//       branch:    'Nangloi',
//       ifsc:      'ICIC0002354',
//     },
//     companyPan: 'ABMCS6189C',
//   };
// }

// // ─────────────────────────────────────────────────────────────────
// export default function App() {

//   const [user,       setUser]       = useState(null);
//   const [checking,   setChecking]   = useState(true);
//   const [view,       setView]       = useState('invoice');
//   const [activeTab,  setActiveTab]  = useState('form');
//   const [formData,   setFormData]   = useState(blankForm());
//   const [isEdit,     setIsEdit]     = useState(false);
//   const [pdfLoading, setPdfLoading] = useState(false);
//   const [saveMsg,    setSaveMsg]    = useState('');

//   // ── Restore session on mount ──────────────────────────────────
//   useEffect(() => {
//     const session = checkSession();
//     if (session.logged_in) {
//       setUser({
//         user_id:     session.user_id,
//         username:    session.username,
//         full_name:   session.full_name,
//         employee_id: session.employee_id,
//       });
//     }
//     setChecking(false);
//   }, []);

//   // ── Load next invoice number when user is set ─────────────────
//   useEffect(() => {
//     if (user && !isEdit) {
//       loadNextNo(user.employee_id);
//     }
//   }, [user]);

//   function loadNextNo(employeeId) {
//     const empId = employeeId || 'SL';
//     const res   = fetchNextNo(empId);
//     if (res.success) {
//       setFormData(prev => ({
//         ...prev,
//         invoiceSuffix: String(res.next_suffix),
//         employeeId:    empId,
//       }));
//     }
//   }

//   // ── Login ─────────────────────────────────────────────────────
//   const handleLogin = (userData) => {
//     setUser({
//       user_id:     userData.user_id,
//       username:    userData.username,
//       full_name:   userData.full_name,
//       employee_id: userData.employee_id,
//     });
//   };

//   // ── Logout ────────────────────────────────────────────────────
//   const handleLogout = () => {
//     logoutUser();
//     setUser(null);
//     setFormData(blankForm());
//     setIsEdit(false);
//     setView('invoice');
//     setActiveTab('form');
//     setSaveMsg('');
//   };

//   // ── New PI ────────────────────────────────────────────────────
//   const handleNewPI = () => {
//     const empId = user?.employee_id || 'SL';
//     const res   = fetchNextNo(empId);
//     const form  = blankForm(empId);
//     if (res.success) form.invoiceSuffix = String(res.next_suffix);
//     setFormData(form);
//     setIsEdit(false);
//     setSaveMsg('');
//     setView('invoice');
//     setActiveTab('form');
//   };

//   // ── Edit invoice from history ─────────────────────────────────
//   const handleEditInvoice = (savedFormData) => {
//     setFormData(savedFormData);
//     setIsEdit(true);
//     setSaveMsg('');
//     setView('invoice');
//     setActiveTab('form');
//   };

//   // ── Download + Save ───────────────────────────────────────────
//   // FIND the entire handleDownload function and REPLACE WITH:
// const handleDownload = async () => {
//   setSaveMsg('');
//   setActiveTab('preview');
//   setPdfLoading(true);

//   // Let React render the preview panel fully
//   await new Promise(r => setTimeout(r, 500));

//   const empId     = formData.employeeId || user?.employee_id || 'SL';
//   const buyerSafe = (formData.buyer?.name || 'unknown')
//     .replace(/[^A-Za-z0-9\s]/g, '')
//     .replace(/\s+/g, '_');
//   const filename  = `SEPL-PI-${empId}-26-27-${formData.invoiceSuffix}_${buyerSafe}.pdf`;

//   try {
//     // Direct download — no print dialog
//     await downloadPDF('invoice-preview-content', filename);

//     // Save record to localStorage
//     const saveRes = saveInvoice(formData, isEdit);
//     if (saveRes.success) {
//       setSaveMsg('✅ Downloaded & Saved');
//       if (!isEdit) setIsEdit(true);
//     } else {
//       setSaveMsg('⚠️ Downloaded but: ' + saveRes.error);
//     }
//   } catch (err) {
//     // Fallback: if foreignObjectRendering fails in some browsers,
//     // fall back to standard canvas render
//     console.warn('Primary PDF method failed, trying fallback:', err.message);
//     try {
//       await fallbackDownload(filename);
//       const saveRes = saveInvoice(formData, isEdit);
//       if (saveRes.success && !isEdit) setIsEdit(true);
//       setSaveMsg('✅ Downloaded');
//     } catch (err2) {
//       setSaveMsg('❌ PDF Error: ' + err2.message);
//     }
//   } finally {
//     setPdfLoading(false);
//   }
// };

// // Fallback using html2pdf if jsPDF fails
// const fallbackDownload = async (filename) => {
//   const element = document.getElementById('invoice-preview-content');
//   if (!element) throw new Error('Element not found');
//   const html2pdf = (await import('html2pdf.js')).default;
//   const opt = {
//     margin:      [6, 6, 6, 6],
//     filename,
//     image:       { type: 'jpeg', quality: 0.85 },
//     html2canvas: { scale: 2, useCORS: true, scrollY: 0 },
//     jsPDF:       { unit: 'mm', format: 'a4', orientation: 'portrait', compress: true },
//     pagebreak:   { mode: ['css', 'legacy'] },
//   };
//   return html2pdf().set(opt).from(element).save();
// };
//   // ── Render: splash ────────────────────────────────────────────
//   if (checking) {
//     return (
//       <div className="app-splash">
//         <div className="app-splash-logo">SE</div>
//       </div>
//     );
//   }

//   // ── Render: login ─────────────────────────────────────────────
//   if (!user) {
//     return <LoginPage onLogin={handleLogin} />;
//   }

//   // ── Render: app ───────────────────────────────────────────────
//   const empId     = formData.employeeId || user.employee_id || 'SL';
//   const invoiceNo = `SEPL/PI/${empId}/26-27/${formData.invoiceSuffix || ''}`;

//   return (
//     <div className="app-root">

//       {/* ── TOP BAR ── */}
//       <header className="topbar">
//         <div className="topbar-left">
//           <div className="topbar-logo">SE</div>
//           <div className="topbar-title">
//             <span className="topbar-company">Saras Equipments Pvt. Ltd.</span>
//             <span className="topbar-subtitle">
//               {isEdit
//                 ? `✏️ Editing — ${invoiceNo}`
//                 : `New Proforma Invoice — ${invoiceNo}`
//               }
//             </span>
//           </div>
//         </div>

//         <div className="topbar-right">

//           {view === 'invoice' && (
//             <>
//               <div className="tabs">
//                 <button
//                   className={`tab ${activeTab === 'form' ? 'tab-active' : ''}`}
//                   onClick={() => setActiveTab('form')}
//                 >✏️ Edit</button>
//                 <button
//                   className={`tab ${activeTab === 'preview' ? 'tab-active' : ''}`}
//                   onClick={() => setActiveTab('preview')}
//                 >👁 Preview</button>
//               </div>
//               <button
//                 className="dl-btn"
//                 onClick={handleDownload}
//                 disabled={pdfLoading}
//               >
//                 {pdfLoading ? '⏳ Generating…' : '⬇ Download & Save'}
//               </button>
//               {saveMsg && <span className="topbar-save-msg">{saveMsg}</span>}
//             </>
//           )}

//           <button className="tb-btn" onClick={handleNewPI}>
//             + New PI
//           </button>

//           <button
//             className={`tb-btn ${view === 'history' ? 'tb-btn-active' : ''}`}
//             onClick={() => setView(view === 'history' ? 'invoice' : 'history')}
//           >
//             📋 History
//           </button>

//           <div className="topbar-user">
//             <span className="topbar-user-name">
//               {user.full_name}
//               <span className="topbar-emp-id">[{user.employee_id}]</span>
//             </span>
//             <button className="tb-logout" onClick={handleLogout}>Logout</button>
//           </div>

//         </div>
//       </header>

//       {/* ── MAIN CONTENT ── */}
//       <main className="app-main">
//         {view === 'history' ? (
//           <HistoryPage
//             user={user}
//             onEditInvoice={handleEditInvoice}
//             onNewInvoice={handleNewPI}
//           />
//         ) : (
//           <>
//             <div className={`panel panel-form ${activeTab === 'form' ? 'panel-visible' : 'panel-hidden'}`}>
//               <div className="panel-scroll">
//                 <InvoiceForm formData={formData} setFormData={setFormData} />
//               </div>
//             </div>
//             <div className={`panel panel-preview ${activeTab === 'preview' ? 'panel-visible' : 'panel-hidden'}`}>
//               <div className="panel-scroll preview-bg">
//                 <div className="preview-shadow-wrap">
//                   <InvoicePreview formData={formData} />
//                 </div>
//               </div>
//             </div>
//           </>
//         )}
//       </main>

//     </div>
//   );
// }


// Updated


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
  const handleDownload = async () => {
    setSaveMsg('');
    setActiveTab('preview');
    setPdfLoading(true);

    // Let React render the preview fully
    await new Promise(r => setTimeout(r, 500));

    const empId     = formData.employeeId || user?.employee_id || 'SL';
    const buyerSafe = (formData.buyer?.name || 'unknown')
      .replace(/[^A-Za-z0-9\s]/g, '')
      .replace(/\s+/g, '_');
    const filename  = `SEPL-PI-${empId}-26-27-${formData.invoiceSuffix}_${buyerSafe}.pdf`;

    try {
      await generateAndDownloadPDF(filename);

      const saveRes = saveInvoice(formData, isEdit);
      if (saveRes.success) {
        setSaveMsg('✅ Downloaded & Saved');
        if (!isEdit) setIsEdit(true);
      } else {
        setSaveMsg('⚠️ Downloaded but: ' + saveRes.error);
      }
    } catch (err) {
      setSaveMsg('❌ PDF Error: ' + err.message);
      console.error('PDF generation failed:', err);
    } finally {
      setPdfLoading(false);
    }
  };

  // ── Core PDF generator ────────────────────────────────────────
  const generateAndDownloadPDF = async (filename) => {
    const element = document.getElementById('invoice-preview-content');
    if (!element) throw new Error('Preview element not found');

    // Dynamically import — keeps initial bundle small
    const html2canvas = (await import('html2canvas')).default;
    const { jsPDF }   = await import('jspdf');

    const pdf         = new jsPDF({
      unit:        'mm',
      format:      'a4',
      orientation: 'portrait',
      compress:    true,
    });

    const pageWidthMM  = 210;
    const pageHeightMM = 297;
    const marginMM     = 5;
    const contentW     = pageWidthMM  - marginMM * 2;
    const contentH     = pageHeightMM - marginMM * 2;

    // Get individual page divs — one canvas per page
    const pageDivs = element.querySelectorAll('.inv-page');
    const targets  = pageDivs.length > 0 ? Array.from(pageDivs) : [element];

    for (let i = 0; i < targets.length; i++) {
      if (i > 0) pdf.addPage();

      const target = targets[i];

      // Temporarily override height so canvas captures full content
      const originalHeight   = target.style.height;
      const originalOverflow = target.style.overflow;
      target.style.height   = 'auto';
      target.style.overflow = 'visible';

      const canvas = await html2canvas(target, {
        scale:           2,
        useCORS:         true,
        allowTaint:      false,
        backgroundColor: '#ffffff',
        logging:         false,
        onclone: (clonedDoc, clonedEl) => {
          // Fix height in clone so it renders fully
          clonedEl.style.height   = 'auto';
          clonedEl.style.overflow = 'visible';
          clonedEl.style.width    = '794px';

          // Remove any elements with broken image sources
          clonedEl.querySelectorAll('img').forEach(img => {
            if (!img.src || img.src === window.location.href) {
              img.remove();
            }
          });
        },
      });

      // Restore original styles
      target.style.height   = originalHeight;
      target.style.overflow = originalOverflow;

      const imgData   = canvas.toDataURL('image/jpeg', 0.75);
      const imgH      = (canvas.height / canvas.width) * contentW;

      if (imgH <= contentH) {
        // Fits on one page
        pdf.addImage(
          imgData, 'JPEG',
          marginMM, marginMM,
          contentW, imgH,
          `page-${i}`, 'FAST'
        );
      } else {
        // Taller than one page — slice into chunks
        const pxPerMM   = canvas.width / contentW;
        const sliceH_px = contentH * pxPerMM;
        let   sliceY    = 0;
        let   pageNum   = 0;

        while (sliceY < canvas.height) {
          if (pageNum > 0) pdf.addPage();

          const remainH  = canvas.height - sliceY;
          const thisH_px = Math.min(sliceH_px, remainH);
          const thisH_mm = thisH_px / pxPerMM;

          // Create a slice canvas
          const sliceCanvas        = document.createElement('canvas');
          sliceCanvas.width        = canvas.width;
          sliceCanvas.height       = thisH_px;
          const ctx                = sliceCanvas.getContext('2d');
          ctx.drawImage(canvas, 0, sliceY, canvas.width, thisH_px, 0, 0, canvas.width, thisH_px);

          const sliceData = sliceCanvas.toDataURL('image/jpeg', 0.75);
          pdf.addImage(
            sliceData, 'JPEG',
            marginMM, marginMM,
            contentW, thisH_mm,
            `page-${i}-slice-${pageNum}`, 'FAST'
          );

          sliceY  += sliceH_px;
          pageNum += 1;
        }
      }
    }

    pdf.save(filename);
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

  // ── Render: main app ──────────────────────────────────────────
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