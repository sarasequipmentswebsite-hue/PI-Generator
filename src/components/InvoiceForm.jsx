import { calcItemAmount } from '../utils/calculations';
import './InvoiceForm.css';

const PER_OPTIONS = ['Set', 'Pair', 'Nos', 'Other'];

export default function InvoiceForm({ formData, setFormData }) {
  const upd = (field, value) => setFormData(p => ({ ...p, [field]: value }));
  const updBuyer = (f, v) => setFormData(p => ({ ...p, buyer: { ...p.buyer, [f]: v } }));
  const updConsignee = (f, v) => setFormData(p => ({ ...p, consignee: { ...p.consignee, [f]: v } }));

  const updItem = (id, field, value) => {
    setFormData(p => ({
      ...p,
      items: p.items.map(item => {
        if (item.id !== id) return item;
        const updated = { ...item, [field]: value };
        const q = field === 'quantity' ? value : item.quantity;
        const r = field === 'rate' ? value : item.rate;
        updated.amount = calcItemAmount(q, r);
        return updated;
      })
    }));
  };

  const addItem = () => {
    setFormData(p => ({
      ...p,
      items: [...p.items, {
        id: p.items.length ? Math.max(...p.items.map(i => i.id)) + 1 : 1,
        description: '', hsn: '', quantity: '', rate: '', per: 'Set', amount: 0,
      }]
    }));
  };

  const removeItem = (id) => {
    setFormData(p => ({
      ...p,
      items: p.items.filter(i => i.id !== id).map((item, idx) => ({ ...item, id: idx + 1 }))
    }));
  };

  const f = formData;

  return (
    <div className="form-wrap">

      {/* ── SECTION: Invoice Details ── */}
      <div className="form-section">
        <h3 className="sec-title">Invoice Details</h3>
        <div className="grid-2">
          <div className="field">
            <label>Invoice No.</label>
            <div className="prefix-input">
              <span className="prefix">SEPL/PI/SL/26-27/</span>
              <input
                type="text" placeholder="45"
                value={f.invoiceSuffix}
                onChange={e => upd('invoiceSuffix', e.target.value)}
              />
            </div>
          </div>
          <div className="field">
            <label>Dated (Auto)</label>
            <input type="text" value={f.invoiceDate} readOnly className="readonly" />
          </div>
          <div className="field">
            <label>Mode / Terms of Payment</label>
            <input type="text" value="100% Advance" readOnly className="readonly" />
          </div>
          <div className="field">
            <label>Delivery Note</label>
            <input type="text" placeholder="Delivery note number" value={f.deliveryNote} onChange={e => upd('deliveryNote', e.target.value)} />
          </div>
          <div className="field">
            <label>Delivery Note Date</label>
            <input type="text" placeholder="DD-MM-YYYY" value={f.deliveryNoteDate} onChange={e => upd('deliveryNoteDate', e.target.value)} />
          </div>
          <div className="field">
            <label>Reference No.</label>
            <input type="text" placeholder="Reference number" value={f.referenceNo} onChange={e => upd('referenceNo', e.target.value)} />
          </div>
          <div className="field">
            <label>Reference Date</label>
            <input type="text" placeholder="DD-MM-YYYY" value={f.referenceDate} onChange={e => upd('referenceDate', e.target.value)} />
          </div>
          <div className="field">
            <label>Buyer's Order No.</label>
            <input type="text" placeholder="e.g. PO1460003717" value={f.buyersOrderNo} onChange={e => upd('buyersOrderNo', e.target.value)} />
          </div>
          <div className="field">
            <label>Buyer's Order Date</label>
            <input type="text" placeholder="DD-MM-YYYY" value={f.buyersOrderDate} onChange={e => upd('buyersOrderDate', e.target.value)} />
          </div>
          <div className="field">
            <label>Dispatch Doc No.</label>
            <input type="text" placeholder="Dispatch document number" value={f.dispatchDocNo} onChange={e => upd('dispatchDocNo', e.target.value)} />
          </div>
          <div className="field">
            <label>Dispatched Through</label>
            <input type="text" placeholder="e.g. Surface" value={f.dispatchedThrough} onChange={e => upd('dispatchedThrough', e.target.value)} />
          </div>
          <div className="field">
            <label>Destination</label>
            <input type="text" placeholder="e.g. Delhi" value={f.destination} onChange={e => upd('destination', e.target.value)} />
          </div>
          <div className="field span-2">
            <label>Other References</label>
            <input type="text" placeholder="Other references" value={f.otherReferences} onChange={e => upd('otherReferences', e.target.value)} />
          </div>
        </div>
      </div>

      {/* ── SECTION: Buyer ── */}
      <div className="form-section">
        <h3 className="sec-title">Buyer (Bill To)</h3>
        <div className="grid-2">
          <div className="field span-2">
            <label>Company Name</label>
            <input type="text" placeholder="Buyer company name" value={f.buyer.name} onChange={e => updBuyer('name', e.target.value)} />
          </div>
          <div className="field span-2">
            <label>Address</label>
            <textarea rows={3} placeholder="Full address, City, State, Pincode" value={f.buyer.address} onChange={e => updBuyer('address', e.target.value)} />
          </div>
          <div className="field">
            <label>PAN No.</label>
            <input type="text" placeholder="e.g. AAACB7293D" value={f.buyer.pan} onChange={e => updBuyer('pan', e.target.value)} />
          </div>
          <div className="field">
            <label>GSTIN No.</label>
            <input type="text" placeholder="e.g. 07AAACB7293D1ZS" value={f.buyer.gstin} onChange={e => updBuyer('gstin', e.target.value)} />
          </div>
        </div>
      </div>

      {/* ── SECTION: Consignee ── */}
      <div className="form-section">
        <h3 className="sec-title">Consignee (Ship To)</h3>
        <div className="toggle-row">
          <button
            className={`tog-btn ${f.consigneeType === 'same' ? 'active' : ''}`}
            onClick={() => upd('consigneeType', 'same')}
          >Same as Buyer</button>
          <button
            className={`tog-btn ${f.consigneeType === 'other' ? 'active' : ''}`}
            onClick={() => upd('consigneeType', 'other')}
          >Other Address</button>
        </div>
        {f.consigneeType === 'other' && (
          <div className="grid-2" style={{ marginTop: '1rem' }}>
            <div className="field span-2">
              <label>Company Name</label>
              <input type="text" placeholder="Consignee company name" value={f.consignee.name} onChange={e => updConsignee('name', e.target.value)} />
            </div>
            <div className="field span-2">
              <label>Address</label>
              <textarea rows={3} placeholder="Full address, City, State, Pincode" value={f.consignee.address} onChange={e => updConsignee('address', e.target.value)} />
            </div>
            <div className="field">
              <label>PAN No.</label>
              <input type="text" placeholder="PAN number" value={f.consignee.pan} onChange={e => updConsignee('pan', e.target.value)} />
            </div>
            <div className="field">
              <label>GSTIN No.</label>
              <input type="text" placeholder="GSTIN number" value={f.consignee.gstin} onChange={e => updConsignee('gstin', e.target.value)} />
            </div>
          </div>
        )}
      </div>

      {/* ── SECTION: Currency ── */}
      <div className="form-section">
        <h3 className="sec-title">Currency</h3>
        <div className="toggle-row">
          <button className={`tog-btn ${f.currency === 'INR' ? 'active' : ''}`} onClick={() => upd('currency', 'INR')}>₹ INR (Indian Rupee)</button>
          <button className={`tog-btn ${f.currency === 'USD' ? 'active' : ''}`} onClick={() => upd('currency', 'USD')}>$ USD (US Dollar)</button>
        </div>
        {f.currency === 'USD' && <p className="note">GST (18%) will not be applied for USD invoices.</p>}
      </div>

      {/* ── SECTION: Items ── */}
      <div className="form-section">
        <h3 className="sec-title">Goods &amp; Services</h3>
        {f.items.map((item, idx) => (
          <div key={item.id} className="item-card">
            <div className="item-card-head">
              <span className="item-label">Item #{idx + 1}</span>
              {f.items.length > 1 && (
                <button className="remove-item-btn" onClick={() => removeItem(item.id)}>Remove</button>
              )}
            </div>
            <div className="grid-2">
              <div className="field span-2">
                <label>Description of Goods &amp; Services</label>
                <textarea
                  rows={3}
                  placeholder="Enter full item description..."
                  value={item.description}
                  onChange={e => updItem(item.id, 'description', e.target.value)}
                />
              </div>
              <div className="field">
                <label>HSN / SAC Code</label>
                <input type="text" placeholder="e.g. 8431" value={item.hsn} onChange={e => updItem(item.id, 'hsn', e.target.value)} />
              </div>
              <div className="field">
                <label>Quantity</label>
                <input type="number" min="0" placeholder="0" value={item.quantity} onChange={e => updItem(item.id, 'quantity', e.target.value)} />
              </div>
              <div className="field">
                <label>Rate ({f.currency === 'INR' ? '₹' : '$'})</label>
                <input type="number" min="0" step="0.01" placeholder="0.00" value={item.rate} onChange={e => updItem(item.id, 'rate', e.target.value)} />
              </div>
              <div className="field">
                <label>Per</label>
                <select value={item.per} onChange={e => updItem(item.id, 'per', e.target.value)}>
                  {PER_OPTIONS.map(p => <option key={p}>{p}</option>)}
                </select>
              </div>
              <div className="field span-2">
                <label>Amount (Auto-calculated)</label>
                <input
                  type="text" readOnly className="readonly amount-display"
                  value={
                    f.currency === 'INR'
                      ? '₹ ' + (item.amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })
                      : '$ ' + (item.amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })
                  }
                />
              </div>
            </div>
          </div>
        ))}
        <button className="add-item-btn" onClick={addItem}>+ Add Item</button>
      </div>

      {/* ── SECTION: Discount ── */}
      <div className="form-section">
        <h3 className="sec-title">Discount (Optional)</h3>
        <div className="grid-2">
          <div className="field">
            <label>Discount Type</label>
            <select
              value={f.discount.type}
              onChange={e => upd('discount', { type: e.target.value, value: '' })}
            >
              <option value="none">No Discount</option>
              <option value="percent">Percentage (%)</option>
              <option value="amount">Fixed Amount ({f.currency === 'INR' ? '₹' : '$'})</option>
            </select>
          </div>
          {f.discount.type !== 'none' && (
            <div className="field">
              <label>
                {f.discount.type === 'percent' ? 'Discount %' : `Discount Amount (${f.currency === 'INR' ? '₹' : '$'})`}
              </label>
              <input
                type="number" min="0" step="0.01"
                placeholder={f.discount.type === 'percent' ? '10' : '500'}
                value={f.discount.value}
                onChange={e => upd('discount', { ...f.discount, value: e.target.value })}
              />
            </div>
          )}
        </div>
      </div>

    </div>
  );
}
