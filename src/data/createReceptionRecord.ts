import type { Member } from './mockMembers'
import type { ReceptionRecord, RecordingMethod } from '../types/record'
import type { Store } from '../types/store'

export function createReceptionRecord(
  method: RecordingMethod,
  store: Store,
  receptionistName: string,
  preselectedMember?: Member,
  recordId = `record-${Date.now()}`,
): ReceptionRecord | undefined {
  if (preselectedMember && preselectedMember.storeId !== store.id) return undefined

  const customerName = preselectedMember?.name ?? ''
  const customerPhone = preselectedMember?.phone ?? ''

  return {
    id: recordId,
    creationSource: preselectedMember ? 'customer-list' : 'direct',
    title: method === 'face-to-face' ? '新接待 · 面客模式' : '新接待 · 事后补录',
    storeId: store.id,
    storeName: store.name,
    creator: receptionistName,
    submitter: '',
    primaryReceptionist: receptionistName,
    coReceptionists: [],
    receptionistName,
    receptionTime: '',
    recordingStartedAt: '',
    method,
    recordingMethod: method,
    status: 'draft',
    customerBindingStatus: preselectedMember ? 'bound' : 'unbound',
    memberId: preselectedMember?.id,
    customerId: preselectedMember?.customerId,
    transcriptionStatus: 'processing',
    aiStatus: 'pending',
    recordingState: 'idle',
    organizingProgress: 0,
    durationSeconds: 0,
    customerInfo: { name: customerName, phone: customerPhone },
    customerName,
    customerPhone,
    customerRelationStatus: preselectedMember ? 'bound' : 'unbound',
    transcript: [],
    aiContent: {
      summary: '客户提到肩颈酸痛和久坐情况，希望进一步了解适合自己的改善方式。',
      customerProfile: '客户提及工作久坐，其他基础信息未提及。',
      bodyCondition: '客户自述肩颈经常酸痛。',
      customerNeeds: '希望改善久坐带来的肩颈不适，寻找适合自己的方式。',
      intendedProject: '未明确提及。',
      concerns: '未提及。',
      communicationResult: '完成基础情况沟通，尚未形成具体预约。',
      followUpSuggestion: '未明确提出后续安排。',
    },
  }
}
