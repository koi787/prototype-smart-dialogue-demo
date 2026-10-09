import type { ReceptionRecord } from '../types/record'

function phoneMatches(phone: string, queryDigits: string) {
  const digits = phone.replace(/\D/g, '')
  if (queryDigits.length === 11 && digits.length === 11) return digits === queryDigits
  if (queryDigits.length === 4) return digits.endsWith(queryDigits)

  const masked = phone.match(/^(\d{3})\*{2,}(\d{2,4})$/)
  return queryDigits.length === 11 && Boolean(masked && masked[1] === queryDigits.slice(0, 3) && queryDigits.endsWith(masked[2]))
}

export function matchesReceptionRecordSearch(record: ReceptionRecord, query: string, linkedMemberPhone?: string) {
  const normalizedQuery = query.trim().toLocaleLowerCase()
  if (!normalizedQuery) return true

  const names = [record.customerInfo.name, record.customerName].filter((name): name is string => Boolean(name))
  if (names.some((name) => name.toLocaleLowerCase().includes(normalizedQuery))) return true

  if (!/^[+\d\s()-]+$/.test(normalizedQuery)) return false
  const queryDigits = normalizedQuery.replace(/\D/g, '')
  if (queryDigits.length !== 4 && queryDigits.length !== 11) return false

  const phones = [record.customerPhone, record.customerInfo.phone, linkedMemberPhone].filter((phone): phone is string => Boolean(phone))
  return phones.some((phone) => phoneMatches(phone, queryDigits))
}
