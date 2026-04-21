const ones = [
  '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
  'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen',
  'Seventeen', 'Eighteen', 'Nineteen',
];
const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

function twoDigits(n) {
  if (n < 20) return ones[n];
  return tens[Math.floor(n / 10)] + (n % 10 ? ' ' + ones[n % 10] : '');
}

function threeDigits(n) {
  if (n >= 100) return ones[Math.floor(n / 100)] + ' Hundred' + (n % 100 ? ' ' + twoDigits(n % 100) : '');
  return twoDigits(n);
}

export function numberToWordsINR(amount) {
  if (!amount || isNaN(amount)) return 'Zero Rupees Only';
  const n = Math.round(parseFloat(amount) * 100);
  const intPart = Math.floor(n / 100);
  const decPart = n % 100;

  if (intPart === 0) return 'Zero Rupees Only';

  let words = '';
  let rem = intPart;

  if (rem >= 10000000) { words += threeDigits(Math.floor(rem / 10000000)) + ' Crore '; rem %= 10000000; }
  if (rem >= 100000)   { words += threeDigits(Math.floor(rem / 100000)) + ' Lakh ';  rem %= 100000; }
  if (rem >= 1000)     { words += twoDigits(Math.floor(rem / 1000)) + ' Thousand '; rem %= 1000; }
  if (rem >= 100)      { words += ones[Math.floor(rem / 100)] + ' Hundred '; rem %= 100; }
  if (rem > 0)         { words += twoDigits(rem); }

  let result = 'Rupees ' + words.trim();
  if (decPart > 0) result += ' and ' + twoDigits(decPart) + ' Paise';
  return result + ' Only';
}

export function numberToWordsUSD(amount) {
  if (!amount || isNaN(amount)) return 'Zero Dollars Only';
  const n = Math.round(parseFloat(amount) * 100);
  const intPart = Math.floor(n / 100);
  const decPart = n % 100;

  if (intPart === 0) return 'Zero Dollars Only';

  let words = '';
  let rem = intPart;

  if (rem >= 1000000000) { words += threeDigits(Math.floor(rem / 1000000000)) + ' Billion '; rem %= 1000000000; }
  if (rem >= 1000000)    { words += threeDigits(Math.floor(rem / 1000000)) + ' Million ';  rem %= 1000000; }
  if (rem >= 1000)       { words += threeDigits(Math.floor(rem / 1000)) + ' Thousand '; rem %= 1000; }
  if (rem > 0)           { words += threeDigits(rem); }

  let result = 'US Dollars ' + words.trim();
  if (decPart > 0) result += ' and ' + twoDigits(decPart) + ' Cents';
  return result + ' Only';
}
