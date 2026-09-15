export type RecordStatus = 'processing' | 'ready-for-review' | 'failed' | 'draft' | 'submitted'

export type RecordingMethod = 'face-to-face' | 'afterwards'

export type RecordingState = 'idle' | 'recording' | 'paused' | 'processing'

export type CustomerBindingStatus = 'bound' | 'unbound'

export type CustomerLookupStatus = 'empty' | 'invalid' | 'querying' | 'matched' | 'not-found' | 'ambiguous' | 'error'

export type TranscriptionStatus = 'processing' | 'success' | 'failed'

export type AiStatus = 'pending' | 'processing' | 'success' | 'failed'

export type StructuredContent = {
  summary: string
  customerProfile: string
  bodyCondition: string
  customerNeeds: string
  intendedProject: string
  concerns: string
  communicationResult: string
  followUpSuggestion: string
}

export type CustomerInfo = {
  name: string
  phone: string
}

export type TranscriptLine = {
  speaker: '老师' | '客户'
  text: string
}

export type ReceptionRecord = {
  id: string
  title: string
  storeId: string
  storeName: string
  creator: string
  submitter: string
  primaryReceptionist: string
  coReceptionists: string[]
  receptionistName: string
  receptionTime: string
  recordingStartedAt: string
  method: RecordingMethod
  recordingMethod: RecordingMethod
  status: RecordStatus
  customerBindingStatus: CustomerBindingStatus
  memberId?: string
  customerId?: string
  transcriptionStatus: TranscriptionStatus
  aiStatus: AiStatus
  recordingState: RecordingState
  organizingProgress: number
  durationSeconds: number
  customerInfo: CustomerInfo
  transcript: TranscriptLine[]
  aiContent: StructuredContent
}

export const structuredContentLabels: Array<{
  key: keyof StructuredContent
  label: string
}> = [
  { key: 'summary', label: '一句话总结' },
  { key: 'customerProfile', label: '客户基础信息' },
  { key: 'bodyCondition', label: '身体情况' },
  { key: 'customerNeeds', label: '客户需求' },
  { key: 'intendedProject', label: '意向项目' },
  { key: 'concerns', label: '主要顾虑' },
  { key: 'communicationResult', label: '沟通结果' },
  { key: 'followUpSuggestion', label: '后续建议' },
]
