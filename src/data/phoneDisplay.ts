/** Formats a stored phone number for read-only display without changing its source value. */
export function formatMaskedPhone(phone: string | null | undefined, fallback = '--') {
  const value = phone?.trim() ?? ''
  if (!value) return fallback

  // Historical snapshots may already be masked. Keep them intact rather than masking twice.
  if (/\d{3}[*xX]{2,}\d{2,4}/.test(value)) return value

  let digits = value.replace(/\D/g, '')
  if (digits.length === 13 && digits.startsWith('86')) digits = digits.slice(2)
  if (digits.length !== 11) return fallback

  return `${digits.slice(0, 3)}****${digits.slice(-4)}`
}
