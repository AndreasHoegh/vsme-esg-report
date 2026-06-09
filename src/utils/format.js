// Number formatting helpers — European style: '.' thousands separator, ',' decimals.
// Example: 1234.5 → "1.234,5",  1000000 → "1.000.000"
// Used everywhere numbers are shown to the user (report pages + form calc fields)
// so the whole app stays consistent.

// Parse a value into a finite number, accepting both '.' and ',' as the decimal
// mark on input (form fields may contain either). Returns null when not numeric.
function toNumber(value) {
  if (typeof value === 'number') return isFinite(value) ? value : null
  if (value === null || value === undefined) return null
  const str = String(value).trim()
  if (str === '') return null
  // If the string already looks like a European-formatted number, normalise it:
  // strip '.' thousands separators and turn ',' into the decimal point.
  const normalised = /,/.test(str) ? str.replace(/\./g, '').replace(',', '.') : str
  const num = parseFloat(normalised)
  return isFinite(num) ? num : null
}

// Format a number with European separators. Returns '' for non-numeric input.
export function fmtNum(value, maxDecimals = 2) {
  const num = toNumber(value)
  if (num === null) return ''
  return num.toLocaleString('de-DE', { maximumFractionDigits: maxDecimals })
}

// Format a percentage value (already in percent units) — e.g. 12.5 → "12,5 %".
export function fmtPct(value, maxDecimals = 1) {
  const s = fmtNum(value, maxDecimals)
  return s === '' ? '' : `${s} %`
}

// Format a monetary amount with an optional currency suffix — e.g. "1.000.000 EUR".
export function fmtMoney(value, currency = '', maxDecimals = 0) {
  const s = fmtNum(value, maxDecimals)
  if (s === '') return ''
  return currency ? `${s} ${currency}` : s
}
