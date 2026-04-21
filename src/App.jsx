import { useState } from 'react';
import InvoiceForm from './components/InvoiceForm';
import InvoicePreview from './components/InvoicePreview';
import './App.css';

function getToday() {
  const d = new Date();
  return [
    String(d.getDate()).padStart(2, '0'),
    String(d.getMonth() + 1).padStart(2, '0'),
    d.getFullYear(),
  ].join('-');
}

function initialState() {
  return {
    invoiceSuffix: '',
    invoiceDate: getToday(),
    deliveryNote: '',
    deliveryNoteDate: '',
    referenceNo: '',
    referenceDate: '',
    buyersOrderNo: '',
    buyersOrderDate: '',
    dispatchDocNo: '',
    dispatchedThrough: '',
    destination: '',
    otherReferences: '',
    buyer:         { name: '', address: '', pan: '', gstin: '' },
    consigneeType: 'same',
    consignee:     { name: '', address: '', pan: '', gstin: '' },
    currency: 'INR',
    items: [
      { id: 1, description: '', hsn: '', quantity: '', rate: '', per: 'Set', amount: 0 },
    ],
    discount:    { type: 'none', value: '' },
    bankDetails: { name: 'ICICI Bank Limited', accountNo: '235405500611', branch: 'Nangloi', ifsc: 'ICIC0002354' },
    companyPan:  'ABMCS6189C',
  };
}

export default function App() {
  const [formData, setFormData]   = useState(initialState());
  const [activeTab, setActiveTab] = useState('form');
  const [pdfLoading, setPdfLoading] = useState(false);

  const handleDownload = async () => {
    // Switch to preview first so the DOM node exists
    setActiveTab('preview');
    setPdfLoading(true);
    await new Promise(r => setTimeout(r, 350));

    const element = document.getElementById('invoice-preview-content');
    if (!element) { setPdfLoading(false); return; }

    const html2pdf = (await import('html2pdf.js')).default;
    const filename = `SEPL-PI-SL-26-27-${formData.invoiceSuffix || 'draft'}.pdf`;

    html2pdf()
      .set({
        margin:      [6, 6, 6, 6],
        filename,
        image:       { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, scrollY: 0 },
        jsPDF:       { unit: 'mm', format: 'a4', orientation: 'portrait' },
        pagebreak:   { mode: ['css', 'legacy'] },
      })
      .from(element)
      .save()
      .finally(() => setPdfLoading(false));
  };

  return (
    <div className="app-root">

      {/* ── TOP BAR ── */}
      <header className="topbar">
        <div className="topbar-left">
          <div className="topbar-logo">SE</div>
          <div className="topbar-title">
            <span className="topbar-company">Saras Equipments Pvt. Ltd.</span>
            <span className="topbar-subtitle">Proforma Invoice Generator</span>
          </div>
        </div>
        <div className="topbar-right">
          <div className="tabs">
            <button
              className={`tab ${activeTab === 'form' ? 'tab-active' : ''}`}
              onClick={() => setActiveTab('form')}
            >
              ✏️&nbsp; Edit Invoice
            </button>
            <button
              className={`tab ${activeTab === 'preview' ? 'tab-active' : ''}`}
              onClick={() => setActiveTab('preview')}
            >
              👁&nbsp; Live Preview
            </button>
          </div>
          <button
            className={`dl-btn ${pdfLoading ? 'loading' : ''}`}
            onClick={handleDownload}
            disabled={pdfLoading}
          >
            {pdfLoading ? '⏳ Generating…' : '⬇ Download PDF'}
          </button>
        </div>
      </header>

      {/* ── MAIN PANELS ── */}
      <main className="main-area">

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

      </main>
    </div>
  );
}
