import type { RecordStatus } from '../types/record'

export type RecordFeedbackNotice = {
  recordId: string
  status: 'draft' | 'submitted'
  createdAt: number
}

export function getRecordFeedbackMessage(
  record: { id: string; status: RecordStatus },
  notice: RecordFeedbackNotice,
) {
  if (record.id !== notice.recordId || record.status !== notice.status) return undefined
  return notice.status === 'submitted' ? '接待记录提交成功' : '草稿已保存'
}
