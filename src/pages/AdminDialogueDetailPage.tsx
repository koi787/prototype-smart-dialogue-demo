import { StructuredContentList } from '../components/StructuredContentList'
import { useReceptionRecords } from '../store/ReceptionRecordsContext'
import { formatBindingStatus, getBindingStatus } from '../data/dialogueRecordView'
import { useState } from 'react'

function transcriptTime(index: number) {
  return `14:30:${String(12 + index * 6).padStart(2, '0')}`
}

type AdminDialogueDetailDrawerProps = {
  recordId: string
  onClose: () => void
}

export function AdminDialogueDetailDrawer({ recordId, onClose }: AdminDialogueDetailDrawerProps) {
  const { getRecord } = useReceptionRecords()
  const [showTranscriptViewer, setShowTranscriptViewer] = useState(false)
  const record = getRecord(recordId)

  if (!record || record.status !== 'submitted') {
    return (
      <div className="admin-drawer-overlay" role="presentation" onClick={onClose}>
        <aside className="admin-drawer" role="dialog" aria-modal="true" aria-labelledby="admin-drawer-title" onClick={(event) => event.stopPropagation()}>
          <header className="admin-drawer__header"><h2 id="admin-drawer-title">智能对话记录详情</h2><button className="admin-drawer__close" type="button" onClick={onClose} aria-label="关闭详情">×</button></header>
          <div className="admin-drawer__body"><div className="admin-empty-state admin-empty-state--page"><span>⊘</span><strong>记录不可查看</strong><p>当前记录不存在或已不可用。</p></div></div>
        </aside>
      </div>
    )
  }

  const canReadTranscript = record.transcript.length > 0

  return (
    <div className="admin-drawer-overlay" role="presentation" onClick={onClose}>
      <aside className="admin-drawer" role="dialog" aria-modal="true" aria-labelledby="admin-drawer-title" onClick={(event) => event.stopPropagation()}>
        <header className="admin-drawer__header">
          <h2 id="admin-drawer-title">智能对话记录详情</h2>
          <button className="admin-drawer__close" type="button" onClick={onClose} aria-label="关闭详情">×</button>
        </header>

        <div className="admin-drawer__body">
          <section className="admin-detail-section" aria-labelledby="admin-base-info-title">
            <div className="admin-detail-section__heading"><h3 id="admin-base-info-title">接待信息</h3></div>
            <div className="admin-detail-info-grid">
              <div><dt>客户姓名</dt><dd>{record.customerInfo.name || '--'}</dd></div>
              <div><dt>客户手机号</dt><dd>{record.customerInfo.phone || '--'}</dd></div>
              <div><dt>客户关联状态</dt><dd><span className={`admin-status-pill admin-status-pill--${getBindingStatus(record)}`}>{formatBindingStatus(getBindingStatus(record))}</span></dd></div>
              <div><dt>接待时间</dt><dd>{record.receptionTime || '--'}</dd></div>
              <div><dt>门店</dt><dd>{record.storeName}</dd></div>
              <div><dt>记录方式</dt><dd>{record.method === 'face-to-face' ? '面客模式' : '事后补录'}</dd></div>
              <div><dt>主接待人</dt><dd>{record.primaryReceptionist || record.receptionistName || '--'}</dd></div>
              <div><dt>协同接待人</dt><dd>{record.coReceptionists.length > 0 ? record.coReceptionists.join('、') : '--'}</dd></div>
            </div>
          </section>

          <section className="admin-detail-section" aria-labelledby="admin-analysis-title">
            <div className="admin-detail-section__heading"><h3 id="admin-analysis-title">智能对话分析</h3><button className="admin-transcript-trigger" type="button" disabled={!canReadTranscript} onClick={() => setShowTranscriptViewer(true)} title={canReadTranscript ? '查看原始逐字稿' : '暂无原始逐字稿'}>查看原始逐字稿</button></div>
            <div className="admin-dialogue-analysis-list"><StructuredContentList content={record.aiContent} /></div>
          </section>
        </div>
      </aside>
      {showTranscriptViewer && (
        <div className="admin-drawer-overlay admin-transcript-drawer-overlay" role="presentation" onClick={() => setShowTranscriptViewer(false)}>
          <aside className="admin-drawer admin-transcript-drawer" role="dialog" aria-modal="true" aria-labelledby="admin-transcript-viewer-title" onClick={(event) => event.stopPropagation()}>
            <header className="admin-drawer__header">
              <h2 id="admin-transcript-viewer-title">原始逐字稿</h2>
              <button className="admin-drawer__close" type="button" onClick={() => setShowTranscriptViewer(false)} aria-label="关闭原始逐字稿">×</button>
            </header>
            <div className="admin-drawer__body admin-transcript-viewer-body">
              {record.transcript.length === 0 ? <div className="admin-empty-state admin-empty-state--page"><strong>暂无原始逐字稿</strong></div> : (
                <div className="admin-transcript-viewer">
                  {record.transcript.map((line, index) => (
                    <article className="admin-transcript-viewer__line" key={`${line.speaker}-${index}`}>
                      <time>{transcriptTime(index)}</time>
                      <strong>{line.speaker}</strong>
                      <p>{line.text}</p>
                    </article>
                  ))}
                </div>
              )}
            </div>
          </aside>
        </div>
      )}
    </div>
  )
}
