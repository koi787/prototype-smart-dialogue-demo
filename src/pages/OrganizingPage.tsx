import { useEffect, useRef, useState } from 'react'
import { MobileShell } from '../components/MobileShell'
import { demoRoutes, navigate } from '../routes'
import { useReceptionRecords } from '../store/ReceptionRecordsContext'
import { structuredContentLabels } from '../types/record'

function RecordsActionButton({ label = '返回列表', primary = false }: { label?: string; primary?: boolean }) {
  return (
    <button className={primary ? 'primary-button primary-button--large' : 'secondary-button'} type="button" onClick={() => navigate(demoRoutes.records)}>
      {label}
    </button>
  )
}

export function OrganizingPage({ recordId }: { recordId: string }) {
  const { getRecord, startOrganizing } = useReceptionRecords()
  const record = getRecord(recordId)
  const [showWaitNotice, setShowWaitNotice] = useState(false)
  const waitNoticeTimerRef = useRef<number | null>(null)

  const handleProcessingConfirm = () => {
    setShowWaitNotice(true)
    if (waitNoticeTimerRef.current !== null) {
      window.clearTimeout(waitNoticeTimerRef.current)
    }
    waitNoticeTimerRef.current = window.setTimeout(() => {
      setShowWaitNotice(false)
      waitNoticeTimerRef.current = null
    }, 2200)
  }

  useEffect(() => () => {
    if (waitNoticeTimerRef.current !== null) {
      window.clearTimeout(waitNoticeTimerRef.current)
    }
  }, [])

  useEffect(() => {
    if (!record || (record.status !== 'processing' && record.recordingState !== 'processing')) return
    startOrganizing(record.id)
  }, [record?.id, record?.status, startOrganizing])

  if (!record) {
    return (
      <MobileShell title="AI整理" onBack={() => navigate(demoRoutes.records)}>
        <section className="empty-state"><h2>记录不存在</h2><p>请返回列表重新开始记录。</p></section>
      </MobileShell>
    )
  }

  if (record.status === 'failed' || record.aiStatus === 'failed') {
    return (
      <MobileShell title="AI整理" onBack={() => navigate(demoRoutes.records)} fixedFooter={<RecordsActionButton primary />}>
        <section className="organizing-status-card organizing-status-card--failed">
          <div className="organizing-status-icon">!</div>
          <h2>AI整理失败</h2>
          <p>本次接待记录整理失败，请稍后处理。</p>
        </section>
      </MobileShell>
    )
  }

  const hasStructuredResult = structuredContentLabels.every(({ key }) => Boolean(record.aiContent[key]?.trim()))

  if (record.status === 'ready-for-review') {
    return (
      <MobileShell
        title="AI整理"
        onBack={() => navigate(demoRoutes.records)}
        fixedFooter={
          <div className="organizing-actions">
            <RecordsActionButton label="稍后处理" />
            <button className="primary-button primary-button--large organizing-confirm-button" type="button" disabled={!hasStructuredResult} onClick={() => navigate(demoRoutes.confirm(record.id))}>去确认</button>
          </div>
        }
      >
        <section className="organizing-status-card organizing-status-card--ready">
          <div className="organizing-status-icon">✓</div>
          <h2>AI整理完成</h2>
          <p>接待记录已经整理完成，请检查内容后确认提交。</p>
        </section>
      </MobileShell>
    )
  }

  return (
    <MobileShell
      title="AI整理"
      onBack={() => navigate(demoRoutes.records)}
      fixedFooter={
        <div className="organizing-actions">
          <RecordsActionButton />
          <button
            className="primary-button primary-button--large organizing-confirm-button"
            type="button"
            aria-disabled="true"
            onClick={handleProcessingConfirm}
            onKeyDown={(event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault()
                handleProcessingConfirm()
              }
            }}
          >
            去确认
          </button>
        </div>
      }
    >
      <section className="organizing-status-card organizing-status-card--processing">
        <div className="organizing-status-icon">✓</div>
        <strong className="organizing-status-label">文字稿已生成</strong>
        <h2>AI正在整理接待记录</h2>
        <p>AI正在根据本次接待文字稿整理接待记录。</p>
        <p>整理完成后，请检查内容并确认提交。</p>
        <p>你可以先返回列表，整理将在后台继续进行。</p>
      </section>
      {showWaitNotice && (
        <div className="organizing-toast" role="status" aria-live="polite">
          请等待 AI 整理记录后继续操作
        </div>
      )}
    </MobileShell>
  )
}
