import type { Member } from './mockMembers'
import type { ReceptionRecord } from '../types/record'

export function canEditCustomerInformation(record: ReceptionRecord) {
  return record.creationSource !== 'customer-list'
}

export function isRecordAssociatedWithMember(record: ReceptionRecord, member: Member) {
  if (record.status !== 'submitted' || record.customerBindingStatus !== 'bound') return false
  if (record.memberId && record.customerId) {
    return record.memberId === member.id && record.customerId === member.customerId
  }
  if (record.memberId) return record.memberId === member.id
  if (record.customerId) return record.customerId === member.customerId
  return false
}

export function getMemberDialogueRecords(records: ReceptionRecord[], member: Member | undefined) {
  if (!member) return []

  return records
    .filter((record) => isRecordAssociatedWithMember(record, member))
    .sort((left, right) => right.receptionTime.localeCompare(left.receptionTime))
}

export function isPreselectedCustomerRelationIntact(
  record: ReceptionRecord,
  matchedMember: Member | undefined,
  customerName: string,
  customerPhone: string,
) {
  if (canEditCustomerInformation(record)) return true

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
