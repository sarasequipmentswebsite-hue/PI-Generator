export function calcItemAmount(quantity, rate) {
  return (parseFloat(quantity) || 0) * (parseFloat(rate) || 0);
}

export function calcSubtotal(items) {
  return items.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);
}

export function calcDiscountAmount(subtotal, discount) {
  if (!discount || discount.type === 'none' || !discount.value) return 0;
  const val = parseFloat(discount.value) || 0;
  if (discount.type === 'percent') return (subtotal * val) / 100;
  if (discount.type === 'amount') return Math.min(val, subtotal);
  return 0;
}

export function calcTaxableValue(subtotal, discountAmt) {
  return Math.max(0, subtotal - discountAmt);
}

export function calcGST(taxableValue, currency) {
  if (currency === 'USD') return 0;
  return taxableValue * 0.18;
}

export function calcGrandTotal(taxableValue, gst) {
  return taxableValue + gst;
}

export function calcTotalQuantity(items) {
  return items.reduce((sum, item) => sum + (parseFloat(item.quantity) || 0), 0);
}

export function fmtCurrency(amount, currency) {
  const num = parseFloat(amount) || 0;
  if (currency === 'USD') {
    return '$ ' + num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }
  return '₹ ' + num.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function getInvoiceTotals(formData) {
  const subtotal     = calcSubtotal(formData.items);
  const discountAmt  = calcDiscountAmount(subtotal, formData.discount);
  const taxableValue = calcTaxableValue(subtotal, discountAmt);
  const gst          = calcGST(taxableValue, formData.currency);
  const grandTotal   = calcGrandTotal(taxableValue, gst);
  const totalQty     = calcTotalQuantity(formData.items);
  return { subtotal, discountAmt, taxableValue, gst, grandTotal, totalQty };
}
