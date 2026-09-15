import { useState } from 'react'
import { MobileShell } from '../components/MobileShell'
import { demoRoutes, navigate } from '../routes'
import { useReceptionRecords } from '../store/ReceptionRecordsContext'
import { structuredContentLabels } from '../types/record'
import { RecordDetailPage } from './RecordDetailPage'

export function ModuleEditPage({ recordId, moduleKey }: { recordId: string; moduleKey: string }) {
  const { getRecord, updateRecord } = useReceptionRecords()
  const record = getRecord(recordId)
  const module = structuredContentLabels.find((item) => item.key === moduleKey)
  const contentKey = module?.key ?? 'summary'
  const [value, setValue] = useState(record?.aiContent[contentKey] ?? '')

  if (!record || !module) {
    return (
      <MobileShell title="编辑模块" onBack={() => navigate(demoRoutes.records)}>
        <section className="empty-state"><h2>模块不存在</h2><p>请返回确认页重新选择需要编辑的内容。</p></section>
      </MobileShell>
    )
  }

  if (record.status === 'submitted') return <RecordDetailPage recordId={record.id} />

  const save = () => {
    updateRecord(record.id, { aiContent: { ...record.aiContent, [module.key]: value } })
    navigate(demoRoutes.confirm(record.id))
  }

  return (
    <MobileShell
      title={`编辑${module.label}`}
      onBack={() => navigate(demoRoutes.confirm(record.id))}
      fixedFooter={
        <div className="module-edit-actions">
          <button className="secondary-button" type="button" onClick={() => navigate(demoRoutes.confirm(record.id))}>取消</button>
          <button className="primary-button primary-button--large" type="button" onClick={save}>保存</button>
        </div>
      }
    >
      <section className="module-edit-page">
        <div className="module-edit-meta"><span className="section-kicker">人工修正</span><span>草稿记录</span></div>
        <h2>{module.label}</h2>
        <p className="muted-copy">请根据实际接待情况修正 AI 整理内容，保存后返回确认页。</p>
        <textarea className="module-edit-textarea" aria-label={`${module.label}内容`} value={value} onChange={(event) => setValue(event.target.value)} rows={9} />
      </section>
    </MobileShell>
  )
}
