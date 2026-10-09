import type { ReceptionRecord, StructuredContent } from '../types/record'

const structuredContentKeys: Array<keyof StructuredContent> = [
  'summary', 'customerProfile', 'bodyCondition', 'customerNeeds',
  'intendedProject', 'concerns', 'communicationResult', 'followUpSuggestion',
]

type NormalizeOptions = {
  findMember?: (memberId?: string, customerId?: string, phone?: string, isBound?: boolean) => { id: string; customerId: string } | undefined
  findStoreId?: (storeName: string) => string | undefined
}

/** Normalizes persisted Demo records without inventing missing business values. */
export function normalizeReceptionRecord(
  record: Partial<ReceptionRecord>,
  fallback?: ReceptionRecord,
  options: NormalizeOptions = {},
): ReceptionRecord {
  const rawCustomerInfo = record.customerInfo && typeof record.customerInfo === 'object'
    ? record.customerInfo
    : undefined
  const customerName = typeof rawCustomerInfo?.name === 'string'
    ? rawCustomerInfo.name
    : typeof record.customerName === 'string'
      ? record.customerName
      : fallback?.customerInfo.name ?? ''
  const customerPhone = typeof rawCustomerInfo?.phone === 'string'
    ? rawCustomerInfo.phone
    : typeof record.customerPhone === 'string'
      ? record.customerPhone
      : fallback?.customerInfo.phone ?? ''
  const rawContent = record.aiContent && typeof record.aiContent === 'object'
    ? record.aiContent as Partial<StructuredContent>
    : {}
  const aiContent = Object.fromEntries(structuredContentKeys.map((key) => {
    const value = rawContent[key]
    return [key, typeof value === 'string' ? value : '']
  })) as StructuredContent
  const hasStructuredContent = Object.values(aiContent).some((value) => value.trim().length > 0)
  const aiStatus = record.aiStatus ?? fallback?.aiStatus ?? (hasStructuredContent ? 'success' : 'failed')
  const customerBindingStatus = record.customerRelationStatus
    ?? record.customerBindingStatus
    ?? fallback?.customerBindingStatus
    ?? 'unbound'
  const status = aiStatus === 'failed'
    ? 'failed'
    : record.status === 'submitted' && customerBindingStatus !== 'bound'
      ? 'draft'
      : record.status ?? fallback?.status ?? 'draft'
  const customerInfo = { name: customerName, phone: customerPhone }
  const method = record.method ?? record.recordingMethod ?? fallback?.method ?? 'afterwards'
  const transcript = Array.isArray(record.transcript) ? record.transcript : fallback?.transcript ?? []
  const associatedMember = options.findMember?.(
    record.memberId ?? fallback?.memberId,
    record.customerId ?? fallback?.customerId,
    customerPhone,
    customerBindingStatus === 'bound',
  )

  return {
    ...fallback,
    ...record,
    id: record.id ?? fallback?.id ?? '',
    creationSource: record.creationSource ?? fallback?.creationSource ?? 'direct',
    title: record.title ?? fallback?.title ?? '新接待记录',
    storeId: record.storeId ?? fallback?.storeId ?? options.findStoreId?.(record.storeName ?? fallback?.storeName ?? '') ?? 'guomao',
    storeName: record.storeName ?? fallback?.storeName ?? '未填写',
    creator: record.creator ?? fallback?.creator ?? record.receptionistName ?? '',
    submitter: status === 'draft' ? '' : record.submitter ?? fallback?.submitter ?? '',
    primaryReceptionist: record.primaryReceptionist ?? fallback?.primaryReceptionist ?? record.receptionistName ?? '',
    coReceptionists: Array.isArray(record.coReceptionists) ? record.coReceptionists : fallback?.coReceptionists ?? [],
    receptionistName: record.receptionistName ?? fallback?.receptionistName ?? record.primaryReceptionist ?? '',
    receptionTime: record.receptionTime ?? fallback?.receptionTime ?? '',
    recordingStartedAt: record.recordingStartedAt ?? fallback?.recordingStartedAt ?? record.receptionTime ?? '',
    method,
    recordingMethod: record.recordingMethod ?? method,
    status,
    customerBindingStatus,
    memberId: record.memberId ?? fallback?.memberId ?? associatedMember?.id,
    customerId: record.customerId ?? fallback?.customerId ?? associatedMember?.customerId,
    customerName,
    customerPhone,
    customerRelationStatus: customerBindingStatus,
    transcriptionStatus: record.transcriptionStatus
      ?? fallback?.transcriptionStatus
      ?? (transcript.length > 0 ? 'success' : 'failed'),
    aiStatus,
    recordingState: record.recordingState ?? fallback?.recordingState ?? 'idle',
    organizingProgress: record.organizingProgress ?? fallback?.organizingProgress ?? 0,
    durationSeconds: record.durationSeconds ?? fallback?.durationSeconds ?? 0,
    customerInfo,
    transcript,
    aiContent,
  }
}
