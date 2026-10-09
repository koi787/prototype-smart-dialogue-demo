import { useState } from 'react'
import { MobileShell } from '../components/MobileShell'
import { demoRoutes, navigate } from '../routes'
import { useReceptionRecords } from '../store/ReceptionRecordsContext'
import { useStoreContext } from '../store/StoreContext'
import { findMemberById } from '../data/mockMembers'
import type { RecordingMethod } from '../types/record'

export function CreateRecordPage({ preselectedCustomerId, initialMethod }: { preselectedCustomerId?: string; initialMethod?: RecordingMethod }) {
  const { createRecord } = useReceptionRecords()
  const { currentStore, accessibleStores } = useStoreContext()
  const [selectedMethod, setSelectedMethod] = useState<RecordingMethod>(initialMethod ?? 'afterwards')
  const [creationError, setCreationError] = useState('')
  const preselectedMember = preselectedCustomerId ? findMemberById(undefined, preselectedCustomerId) : undefined
  const invalidPreselection = Boolean(preselectedCustomerId) && (
    !preselectedMember ||
    preselectedMember.storeId !== currentStore.id ||
    !accessibleStores.some((store) => store.id === currentStore.id)
  )

  const startRecord = () => {
    if (!selectedMethod || invalidPreselection) return
    const record = createRecord(selectedMethod, currentStore, preselectedCustomerId)
    if (!record) {
      setCreationError('所选客户不属于当前门店，无法创建接待记录。')
      return
    }
    navigate(demoRoutes.recording(record.id))
  }

  return (
    <MobileShell
      title="新建记录"
      onBack={() => navigate(demoRoutes.records)}
      fixedFooter={
        <button className="primary-button primary-button--large create-next-button" type="button" disabled={!selectedMethod || invalidPreselection} onClick={startRecord}>
          下一步
        </button>
      }
    >
      <section className="page-section create-record-heading">
        <h2>选择场景</h2>
      </section>
      {invalidPreselection && <p className="field-error" role="alert">所选客户无效或不属于当前门店，请返回客户列表重新选择。</p>}
      {creationError && <p className="field-error" role="alert">{creationError}</p>}

      <div className="method-list">
        <button className={selectedMethod === 'afterwards' ? 'method-card method-card--selected' : 'method-card'} type="button" onClick={() => setSelectedMethod('afterwards')}>
          <span className="method-card__icon method-card__icon--gray" aria-hidden="true">✎</span>
          <span className="method-card__copy">
            <strong>事后补录</strong>
            <small>接待结束后，由员工语音复盘</small>
          </span>
          {selectedMethod === 'afterwards' && <span className="method-card__check">✓</span>}
        </button>

        <button className={selectedMethod === 'face-to-face' ? 'method-card method-card--selected' : 'method-card'} type="button" onClick={() => setSelectedMethod('face-to-face')}>
          <span className="method-card__icon" aria-hidden="true">♧</span>
          <span className="method-card__copy">
            <strong>面客模式</strong>
            <small>客户在场，实时记录沟通内容</small>
          </span>
          {selectedMethod === 'face-to-face' && <span className="method-card__check">✓</span>}
        </button>
      </div>

    </MobileShell>
  )
}
