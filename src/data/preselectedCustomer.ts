import type { Member } from './mockMembers'
import type { ReceptionRecord } from '../types/record'

export function isPreselectedCustomerRelationIntact(
  record: ReceptionRecord,
  matchedMember: Member | undefined,
  customerName: string,
  customerPhone: string,
) {
  if (record.creationSource !== 'customer-list') return true

  return Boolean(
    record.memberId &&
    record.customerId &&
    matchedMember?.id === record.memberId &&
    matchedMember.customerId === record.customerId &&
    customerName.trim() === record.customerInfo.name &&
    customerPhone.trim() === record.customerInfo.phone &&
    record.customerName === record.customerInfo.name &&
    record.customerPhone === record.customerInfo.phone,
  )
}
