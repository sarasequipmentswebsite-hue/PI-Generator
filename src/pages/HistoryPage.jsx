import { useState, useEffect } from 'react';
import { fetchMyHistory, fetchOneInvoice } from '../utils/storage';
import './HistoryPage.css';

export default function HistoryPage({ user, onEditInvoice, onNewInvoice }) {
  const [invoices, setInvoices] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [search,   setSearch]   = useState('');
  const [selected, setSelected] = useState(null);  // invoice clicked for detail view
  const [editing,  setEditing]  = useState(false);

  useEffect(() => {
    const res = fetchMyHistory();
    if (res.success) setInvoices(res.invoices);
    setLoading(false);
  }, []);

  const filtered = invoices.filter(inv =>
    inv.invoice_no.toLowerCase().includes(search.toLowerCase()) ||
    (inv.buyer_name || '').toLowerCase().includes(search.toLowerCase())
  );

  const handleEdit = (suffix) => {
    setEditing(true);
    const res = fetchOneInvoice(suffix);
    setEditing(false);
    if (res.success) {
      onEditInvoice(res.form_data);
    } else {
      alert(res.error);
    }
  };

  return (
    <div className="hp-root">
      {/* Header */}
      <div className="hp-header">
        <div className="hp-header-left">
          <h2>My Invoice History</h2>
          <p>{user.full_name} &nbsp;·&nbsp; {invoices.length} PI{invoices.length !== 1 ? 's' : ''} created</p>
        </div>
        <div className="hp-header-right">
          <input
            className="hp-search"
            placeholder="🔍  Search invoice no. or buyer..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          <button className="hp-new-btn" onClick={onNewInvoice}>
            + New PI
          </button>
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="hp-empty">Loading...</div>
      ) : filtered.length === 0 ? (
        <div className="hp-empty">
          {invoices.length === 0
            ? 'No invoices yet. Click + New PI to create your first one.'
            : 'No invoices match your search.'}
        </div>
      ) : (
        <div className="hp-table-wrap">
          <table className="hp-tbl">
            <thead>
              <tr>
                <th>#</th>
                <th>Invoice No.</th>
                <th>Buyer Name</th>
                <th>Date Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((inv, idx) => (
                <tr key={inv.invoice_suffix}>
                  <td className="hp-idx">{idx + 1}</td>
                  <td className="hp-inv-no">{inv.invoice_no}</td>
                  <td className="hp-buyer">{inv.buyer_name || '—'}</td>
                  <td className="hp-date">
                    {new Date(inv.created_at).toLocaleDateString('en-IN', {
                      day: '2-digit', month: 'short', year: 'numeric'
                    })}
                  </td>
                  <td className="hp-actions">
                    <button
                      className="hp-edit-btn"
                      onClick={() => handleEdit(inv.invoice_suffix)}
                      disabled={editing}
                    >
                      ✏️ Edit &amp; Re-download
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}