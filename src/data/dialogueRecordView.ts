import type { AiStatus, CustomerBindingStatus, ReceptionRecord, TranscriptionStatus } from '../types/record'

export type DialogueBindingStatus = CustomerBindingStatus
export type DialogueTranscriptionStatus = TranscriptionStatus
export type DialogueAiStatus = AiStatus

/** 关联状态只读取 Mock 事实，不根据手机号存在与否推断。 */
export function getBindingStatus(record: ReceptionRecord): DialogueBindingStatus {
  return record.customerBindingStatus
}

export function getTranscriptionStatus(record: ReceptionRecord): DialogueTranscriptionStatus {
  return record.transcriptionStatus
}

export function getAiOrganizationStatus(record: ReceptionRecord): DialogueAiStatus {
  return record.aiStatus
}

export function formatBindingStatus(status: DialogueBindingStatus) {
  return status === 'bound' ? '已关联' : '未关联'
}

export function formatTranscriptionStatus(status: DialogueTranscriptionStatus) {
  if (status === 'processing') return '处理中'
  if (status === 'failed') return '失败'
  return '成功'
}

export function formatAiStatus(status: DialogueAiStatus) {
  if (status === 'pending') return '待整理'
  if (status === 'processing') return '整理中'
  if (status === 'failed') return '失败'
  return '成功'
}
