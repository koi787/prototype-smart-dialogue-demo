import type { RecordStatus } from '../types/record'

export function StatusTag({ status }: { status: RecordStatus }) {
  const label = status === 'draft'
    ? '待提交'
    : status === 'submitted'
      ? '已提交'
      : status === 'processing'
        ? '整理中'
        : status === 'ready-for-review'
          ? '待提交'
          : '整理失败'
  return <span className={`status-tag status-tag--${status}`}>{label}</span>
}
