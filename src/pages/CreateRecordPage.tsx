import { useState } from 'react'
import { MobileShell } from '../components/MobileShell'
import { demoRoutes, navigate } from '../routes'
import { useReceptionRecords } from '../store/ReceptionRecordsContext'
import { useStoreContext } from '../store/StoreContext'

type RecordingMethod = 'face-to-face' | 'afterwards'

export function CreateRecordPage() {
  const { createRecord } = useReceptionRecords()
  const { currentStore } = useStoreContext()
  const [selectedMethod, setSelectedMethod] = useState<RecordingMethod | null>(null)

  const startRecord = () => {
    if (!selectedMethod) return
    const record = createRecord(selectedMethod, currentStore)
    navigate(demoRoutes.recording(record.id))
  }

  return (
    <MobileShell
      title="新建记录"
      onBack={() => navigate(demoRoutes.records)}
      fixedFooter={
        <button className="primary-button primary-button--large create-next-button" type="button" disabled={!selectedMethod} onClick={startRecord}>
          下一步
        </button>
      }
    >
      <section className="page-section create-record-heading">
        <h2>这次接待属于哪种场景？</h2>
      </section>

      <div className="method-list">
        <button className={selectedMethod === 'face-to-face' ? 'method-card method-card--selected' : 'method-card'} type="button" onClick={() => setSelectedMethod('face-to-face')}>
          <span className="method-card__icon">♧</span>
          <span className="method-card__copy">
            <strong>面客模式</strong>
            <small>客户在场，实时记录沟通内容</small>
          </span>
          {selectedMethod === 'face-to-face' && <span className="method-card__check">✓</span>}
        </button>

        <button className={selectedMethod === 'afterwards' ? 'method-card method-card--selected' : 'method-card'} type="button" onClick={() => setSelectedMethod('afterwards')}>
          <span className="method-card__icon method-card__icon--gray">▤</span>
          <span className="method-card__copy">
            <strong>事后补录</strong>
            <small>接待结束后，由员工语音复盘</small>
          </span>
          {selectedMethod === 'afterwards' && <span className="method-card__check">✓</span>}
        </button>
      </div>

    </MobileShell>
  )
}
