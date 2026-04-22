import { getInvoiceTotals, fmtCurrency } from '../utils/calculations';
import { numberToWordsINR, numberToWordsUSD } from '../utils/numberToWords';
import './InvoicePreview.css';

/* ──────────────────────────────────────────────────────────────
   CONSTANTS — how many items fit on each page before we paginate.
   Page 1: header+meta+party takes ~105mm, items area ~105mm.
   Each item row ≈ 14mm. So first page fits ~7 items safely.
   Continuation pages: header+meta+party ~105mm, items ~135mm ≈ 9 items.
   Tune ITEMS_PER_FIRST_PAGE / ITEMS_PER_CONT_PAGE if needed.
────────────────────────────────────────────────────────────── */
const ITEMS_PER_FIRST_PAGE = 30;
const ITEMS_PER_CONT_PAGE  = 30;

/* ── Repeating page header: letterhead + meta + buyer/consignee ── */
function PageHeader({ f, invoiceNo }) {
  return (
    <>
      <div className="letterhead">
        <div className="lh-left">
          <div className="lh-company">Saras Equipments Pvt. Ltd.</div>
          <div className="lh-addr">Khasra No. 124/1 and 124/2, Plot No.12, Naresh Park, Nangloi, New Delhi - 110041</div>
          <div className="lh-addr">GSTIN/UIN: 07ABMCS6189C1ZY &nbsp;|&nbsp; State: Delhi, Code: 07</div>
          <div className="lh-addr">E-Mail: sarasequipments@gmail.com</div>
        </div>
        <div className="lh-right">
          <div className="lh-title">Proforma Invoice</div>
          <div className="lh-orig">(ORIGINAL FOR RECIPIENT)</div>
        </div>
      </div>

      <table className="meta-tbl">
        <colgroup>
          <col className="meta-col-lbl" /><col className="meta-col-val" />
          <col className="meta-col-lbl" /><col className="meta-col-val" />
        </colgroup>
        <tbody>
          <tr>
            <td className="ml">Invoice No.</td>
            <td className="mv">{invoiceNo}</td>
            <td className="ml">Dated</td>
            <td className="mv">{f.invoiceDate}</td>
          </tr>
          <tr>
            <td className="ml">Delivery Note</td>
            <td className="mv">{f.deliveryNote}</td>
            <td className="ml">Mode / Terms of Payment</td>
            <td className="mv mv-bold">100% Advance</td>
          </tr>
          <tr>
            <td className="ml">Supplier's Ref.</td>
            <td className="mv">{f.referenceNo}{f.referenceDate ? ` / ${f.referenceDate}` : ''}</td>
            <td className="ml">Other References</td>
            <td className="mv">{f.otherReferences}</td>
          </tr>
          <tr>
            <td className="ml">Buyer's Order No.</td>
            <td className="mv mv-bold">{f.buyersOrderNo}</td>
            <td className="ml">Dated</td>
            <td className="mv mv-bold">{f.buyersOrderDate}</td>
          </tr>
          <tr>
            <td className="ml">Dispatch Doc No.</td>
            <td className="mv">{f.dispatchDocNo}</td>
            <td className="ml">Delivery Note Date</td>
            <td className="mv">{f.deliveryNoteDate}</td>
          </tr>
          <tr>
            <td className="ml">Dispatched through</td>
            <td className="mv mv-bold">{f.dispatchedThrough}</td>
            <td className="ml">Destination</td>
            <td className="mv mv-bold">{f.destination}</td>
          </tr>
        </tbody>
      </table>

      <table className="party-tbl">
        <colgroup>
          <col style={{ width: '50%' }} /><col style={{ width: '50%' }} />
        </colgroup>
        <tbody>
          <tr>
            <td className="party-hdr">BUYER (BILL TO)</td>
            <td className="party-hdr party-hdr-r">CONSIGNEE (SHIP TO)</td>
          </tr>
          <tr>
            <td className="party-body">
              <div className="party-name">{f.buyer.name}</div>
              <div className="party-addr">{f.buyer.address}</div>
              {f.buyer.pan   && <div className="party-meta">PAN NO. - {f.buyer.pan}</div>}
              {f.buyer.gstin && <div className="party-meta">GSTIN NO. - {f.buyer.gstin}</div>}
            </td>
            <td className="party-body party-body-r">
              <div className="party-name">{f.consigneeType==='same'?f.buyer.name:f.consignee.name}</div>
              <div className="party-addr">{f.consigneeType==='same'?f.buyer.address:f.consignee.address}</div>
              {(f.consigneeType==='same'?f.buyer.pan:f.consignee.pan) && <div className="party-meta">PAN NO. - {f.consigneeType==='same'?f.buyer.pan:f.consignee.pan}</div>}
              {(f.consigneeType==='same'?f.buyer.gstin:f.consignee.gstin) && <div className="party-meta">GSTIN NO. - {f.consigneeType==='same'?f.buyer.gstin:f.consignee.gstin}</div>}
            </td>
          </tr>
        </tbody>
      </table>
    </>
  );
}

/* ── Items column header row ── */
function ItemsColHeader() {
  return (
    <tr className="items-hdr-row">
      <th className="ih ih-center">Sl<br/>No.</th>
      <th className="ih ih-center">Description of Goods and Services</th>
      <th className="ih ih-center">HSN/SAC</th>
      <th className="ih ih-center">Quantity</th>
      <th className="ih ih-center">Rate</th>
      <th className="ih ih-center">Unit</th>
      <th className="ih ih-right">Amount</th>
    </tr>
  );
}

/* ── Single item row ── */
function ItemRow({ item, idx, fmt, currency }) {
  return (
    <tr key={item.id} className="item-row">
      <td className="ib ib-center">{idx + 1}</td>
      <td className="ib ib-left ib-desc">{item.description}</td>
      <td className="ib ib-center">{item.hsn}</td>
      <td className="ib ib-center">{item.quantity}</td>
      <td className="ib ib-right">
        {item.rate
          ? parseFloat(item.rate).toLocaleString(
              currency === 'INR' ? 'en-IN' : 'en-US',
              { minimumFractionDigits: 2 }
            )
          : ''}
      </td>
      <td className="ib ib-center">{item.Unit}</td>
      <td className="ib ib-right">{item.amount ? fmt(item.amount) : ''}</td>
    </tr>
  );
}

/* ── Stretch row: 7 cells each with side borders to complete column lines ── */
function StretchRow() {
  return (
    <tr className="stretch-row">
      {Array.from({length:7}).map((_,i) => (
        <td key={i} className="stretch-cell"></td>
      ))}
    </tr>
  );
}

/* ─────────────────────────────────────────────────────────────
   MAIN COMPONENT
───────────────────────────────────────────────────────────── */
export default function InvoicePreview({ formData }) {
  const f = formData;
  const { discountAmt, taxableValue, gst, grandTotal, totalQty } = getInvoiceTotals(f);
  const fmt       = (n) => fmtCurrency(n, f.currency);
  const invoiceNo = `SEPL/PI/SL/26-27/${f.invoiceSuffix || ''}`;

  const amountInWords = f.currency === 'INR'
    ? numberToWordsINR(grandTotal)
    : numberToWordsUSD(grandTotal);

  // Discount display: "Less: Discount" in desc col, value in rate col
  const discountRateDisplay = f.discount.type === 'percent'
    ? `${f.discount.value}%`
    : f.discount.value ? fmt(parseFloat(f.discount.value)) : '';

  /* ── Split items across pages ─────────────────────────────── */
  const items = f.items;
  const pages = [];           // array of item arrays per page

  if (items.length <= ITEMS_PER_FIRST_PAGE) {
    // All fits on one page
    pages.push(items);
  } else {
    // First page chunk
    pages.push(items.slice(0, ITEMS_PER_FIRST_PAGE));
    // Remaining items → continuation pages
    let start = ITEMS_PER_FIRST_PAGE;
    while (start < items.length) {
      pages.push(items.slice(start, start + ITEMS_PER_CONT_PAGE));
      start += ITEMS_PER_CONT_PAGE;
    }
  }

  const isLastPage = (pageIdx) => pageIdx === pages.length - 1;

  return (
    <div id="invoice-preview-content">

      {pages.map((pageItems, pageIdx) => (
        <div
          key={pageIdx}
          className="inv-page"
        >

            {/* Top border line for pages after first — prevents
              it from appearing at bottom of previous page */}
          {pageIdx > 0 && (
            <div className="page-top-border"></div>
          )}

          
          {/* ── HEADER on EVERY page ── */}
          <PageHeader f={f} invoiceNo={invoiceNo} />

          {/* ── ITEMS TABLE: flex:1 so it fills remaining page height ── */}
          <table className="items-tbl">
            <colgroup>
              <col className="ic-sl" />
              <col className="ic-desc" />
              <col className="ic-hsn" />
              <col className="ic-qty" />
              <col className="ic-rate" />
              <col className="ic-per" />
              <col className="ic-amt" />
            </colgroup>
            <thead>
              <ItemsColHeader />
            </thead>
            <tbody>

              {/* Item rows for this page */}
              {pageItems.map((item, i) => {
                // global index = items before this page + i
                const globalIdx = pages
                  .slice(0, pageIdx)
                  .reduce((sum, pg) => sum + pg.length, 0) + i;
                return (
                  <ItemRow
                    key={item.id}
                    item={item}
                    idx={globalIdx}
                    fmt={fmt}
                    currency={f.currency}
                  />
                );
              })}

              {/*
                STRETCH ROW — fills all unused vertical space and draws
                all 7 column borders down to the summary rows.
                On non-last pages this just fills the rest of the page.
              */}
              <StretchRow />

              {/* Summary rows only on the LAST page */}
              {isLastPage(pageIdx) && (
                <>
                  {/* DISCOUNT ROW */}
                  {f.discount.type !== 'none' && discountAmt > 0 && (
                    <tr className="discount-row">
                      <td className="ib ib-center"></td>
                      <td className="ib ib-left dr-desc">Less: Discount</td>
                      <td className="ib"></td>
                      <td className="ib"></td>
                      <td className="ib ib-right dr-rate">{discountRateDisplay}</td>
                      <td className="ib"></td>
                      <td className="ib ib-right dr-amt">- {fmt(discountAmt)}</td>
                    </tr>
                  )}

                  {/* GST ROW */}
                  {f.currency === 'INR' && (
                    <tr className="gst-line-row">
                      <td className="ib ib-center"></td>
                      <td className="ib ib-right"><strong>GST</strong></td>
                      <td className="ib"></td>
                      <td className="ib"></td>
                      <td className="ib ib-right">18</td>
                      <td className="ib ib-center">%</td>
                      <td className="ib ib-right">{fmt(gst)}</td>
                    </tr>
                  )}

                  {/* TOTAL ROW */}
                  <tr className="total-row">
                    <td className="tr-blank"></td>
                    <td className="tr-blank"></td>
                    <td className="tr-label">Total</td>
                    <td className="tr-qty">{totalQty > 0 ? totalQty : ''}</td>
                    <td className="tr-blank"></td>
                    <td className="tr-blank"></td>
                    <td className="tr-amt">{fmt(grandTotal)}</td>
                  </tr>
                </>
              )}

            </tbody>
          </table>

           {!isLastPage(pageIdx) && (
          <div className="continued-bar">
            <span>Continued on next page...</span>
          </div>
        )}

          {/* ── Footer sections only on LAST page ── */}
          {isLastPage(pageIdx) && (
            <>
              {/* AMOUNT IN WORDS */}
              <div className="words-bar">
                <span className="words-label">Amount Chargeable (in words):</span>
                <span className="words-val">
                  <em>{f.currency === 'INR' ? 'INR' : 'USD'} {amountInWords}</em>
                </span>
                <span className="words-eo">E. &amp; O.E</span>
              </div>

              {/* GST SUMMARY */}
              <table className="gst-sum-tbl">
                <colgroup>
                  <col className="gsc-empty" />
                  <col className="gsc-taxable" />
                  <col className="gsc-rate" />
                  <col className="gsc-amount" />
                  <col className="gsc-total" />
                </colgroup>
                <thead>
                  <tr>
                    <th className="gsh gsh-left"></th>
                    <th className="gsh">Taxable Value</th>
                    <th className="gsh">Rate</th>
                    <th className="gsh">Amount</th>
                    <th className="gsh">Total Tax Amount</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="gsd-row">
                    <td className="gsd"></td>
                    <td className="gsd gsd-right">{fmt(taxableValue)}</td>
                    <td className="gsd gsd-center">18%</td>
                    <td className="gsd gsd-right">{fmt(gst)}</td>
                    <td className="gsd gsd-right">{fmt(gst)}</td>
                  </tr>
                  <tr className="gsd-total-row">
                    <td className="gsd gsd-right"><strong>Total:</strong></td>
                    <td className="gsd gsd-right"><strong>{fmt(taxableValue)}</strong></td>
                    <td className="gsd"></td>
                    <td className="gsd gsd-right"><strong>{fmt(gst)}</strong></td>
                    <td className="gsd gsd-right"><strong>{fmt(gst)}</strong></td>
                  </tr>
                </tbody>
              </table>

              {/* DECLARATION + BANK — always at bottom of last page */}
              <table className="bottom-tbl">
                <colgroup>
                  <col style={{ width: '55%' }} />
                  <col style={{ width: '45%' }} />
                </colgroup>
                <tbody>
                  <tr>
                    <td className="bot-left">
                      <div className="bot-decl-hdr">Declaration</div>
                      <p className="bot-decl-body">
                        1. We declare that this invoice shows the actual price of the goods described
                        and that all particulars are true and correct.<br />
                        2. No changes are valid after 15 days from the date mentioned in the Invoice.
                        <br />
                        3. Cheque returned unpaid from the bank are subjected to return charges Rs.500.
                        <br />
                        4. All Dispute subject to delhi juridiction.
                        <br />
                        5. Interest @24% P.A. will be charged if the payment is not made within the stipulated time.
                      </p>
                      <div className="bot-pan"><u>Company's PAN:</u></div>
                      <div className="bot-pan-val"><em>{f.companyPan}</em></div>
                      <div className="bot-cgi"><u><em>This is a Computer Generated Invoice</em></u></div>
                    </td>
                    <td className="bot-right">
                      <div className="bot-bank-hdr">Company's Bank Details</div>
                      <div className="bot-bank-row">
                        <span className="bk-key">Bank Name</span>
                        <span className="bk-val">: <strong>{f.bankDetails.name}</strong></span>
                      </div>
                      <div className="bot-bank-row">
                        <span className="bk-key">A/c No.</span>
                        <span className="bk-val">: <strong>{f.bankDetails.accountNo}</strong></span>
                      </div>
                      <div className="bot-bank-row">
                        <span className="bk-key">Branch &amp; IFSC</span>
                        <span className="bk-val">: <strong>{f.bankDetails.branch} &amp; {f.bankDetails.ifsc}</strong></span>
                      </div>
                      <div className="bot-signatory">
                        <div>for <strong>Saras Equipments Pvt. Ltd.</strong></div>
                        <div className="sig-gap"></div>
                        <div><strong>Authorised Signatory</strong></div>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </>
          )}

        </div> /* end .inv-page */
      ))}

    </div>
  );
}
