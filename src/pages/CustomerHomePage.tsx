import { useEffect, useMemo, useState } from 'react'
import { MobileShell } from '../components/MobileShell'
import { RecordingFloatingWindow } from '../components/RecordingFloatingWindow'
import { mockMembers } from '../data/mockMembers'
import { filterAssignedCustomers, getCustomerBusinessStatus, type CustomerDealFilter, type CustomerVisitFilter } from '../data/mockCustomerActivity'
import { mockTranscriptLines } from '../data/mockTranscript'
import { getRecordFeedbackMessage, type RecordFeedbackNotice } from '../data/recordFeedback'
import { demoRoutes, navigate, recordFeedbackNoticeKey } from '../routes'
import { useReceptionRecords } from '../store/ReceptionRecordsContext'
import { useStoreContext } from '../store/StoreContext'
import type { EmployeeStoreScenario } from '../types/store'

function countLabel(count: number) {
  return count > 99 ? '99+' : String(count)
}

function maskPhone(phone: string) {
  return phone.replace(/^(\d{3})\d{4}(\d{4})$/, '$1****$2')
}

export function CustomerHomePage({ storeScenario }: { storeScenario?: EmployeeStoreScenario }) {
  const { records, updateRecord, startOrganizing } = useReceptionRecords()
  const { accessibleStores, currentStore, selectStore, setScenario } = useStoreContext()
  const [storeSheetOpen, setStoreSheetOpen] = useState(false)
  const [recordingConflictOpen, setRecordingConflictOpen] = useState(false)
  const [recordFeedbackMessage, setRecordFeedbackMessage] = useState('')
  const [query, setQuery] = useState('')
  const [visitFilter, setVisitFilter] = useState<CustomerVisitFilter>('all')
  const [dealFilter, setDealFilter] = useState<CustomerDealFilter>('all')

  useEffect(() => {
    if (storeScenario) setScenario(storeScenario)
  }, [setScenario, storeScenario])

  useEffect(() => {
    const notice = window.sessionStorage.getItem(recordFeedbackNoticeKey)
    if (!notice) return

    try {
      const payload = JSON.parse(notice) as Partial<RecordFeedbackNotice>
      const record = records.find((item) => item.id === payload.recordId)
      if (!record) {
        window.sessionStorage.removeItem(recordFeedbackNoticeKey)
        return
      }
      if (!payload.recordId || !payload.status || !payload.createdAt) {
        window.sessionStorage.removeItem(recordFeedbackNoticeKey)
        return
      }
      const message = getRecordFeedbackMessage(record, payload as RecordFeedbackNotice)
      if (!message) {
        if (!payload.createdAt || Date.now() - payload.createdAt > 5000) window.sessionStorage.removeItem(recordFeedbackNoticeKey)
        return
      }

      window.sessionStorage.removeItem(recordFeedbackNoticeKey)
      setRecordFeedbackMessage(message)
    } catch {
      window.sessionStorage.removeItem(recordFeedbackNoticeKey)
    }
  }, [records])

  useEffect(() => {
    if (!recordFeedbackMessage) return
    const timer = window.setTimeout(() => setRecordFeedbackMessage(''), 2000)
    return () => window.clearTimeout(timer)
  }, [recordFeedbackMessage])

  const storeRecords = useMemo(() => records.filter((record) => record.storeId === currentStore.id), [currentStore.id, records])
  const counts = useMemo(() => ({
    all: storeRecords.length,
    processing: storeRecords.filter((record) => record.status === 'processing').length,
    pending: storeRecords.filter((record) => record.status === 'ready-for-review' || record.status === 'draft').length,
    submitted: storeRecords.filter((record) => record.status === 'submitted').length,
  }), [storeRecords])
  const customers = useMemo(() => filterAssignedCustomers(mockMembers, {
    storeId: currentStore.id,
    query,
    visit: visitFilter,
    deal: dealFilter,
  }), [currentStore.id, dealFilter, query, visitFilter])

  const activeRecording = useMemo(
    () => records.find((record) => record.recordingState === 'recording' || record.recordingState === 'paused'),
    [records],
  )
  const [durationSeconds, setDurationSeconds] = useState(activeRecording?.durationSeconds ?? 0)

  useEffect(() => {
    setDurationSeconds(activeRecording?.durationSeconds ?? 0)
    if (!activeRecording || activeRecording.recordingState !== 'recording') return
    const timer = window.setInterval(() => setDurationSeconds((current) => current + 1), 1000)
    return () => window.clearInterval(timer)
  }, [activeRecording?.id, activeRecording?.recordingState, activeRecording?.durationSeconds])

  useEffect(() => {
    if (!activeRecording || activeRecording.recordingState !== 'recording') return
    const timer = window.setInterval(() => {
      const current = records.find((record) => record.id === activeRecording.id)
      const nextLine = current && mockTranscriptLines[current.transcript.length]
      if (current && nextLine) updateRecord(current.id, { transcript: [...current.transcript, nextLine] })
    }, 1600)
    return () => window.clearInterval(timer)
  }, [activeRecording?.id, activeRecording?.recordingState, records, updateRecord])

  const handleCreate = (preselectedCustomerId?: string) => {
    if (activeRecording) {
      setRecordingConflictOpen(true)
      return
    }
    navigate(preselectedCustomerId ? demoRoutes.createForCustomer(preselectedCustomerId) : demoRoutes.create)
  }

  return (
    <MobileShell
      title="智能对话"
      onBack={() => navigate(demoRoutes.home)}
      backLabel="返回奥本中台"
      fixedFooter={<button className="primary-button primary-button--large" type="button" onClick={() => handleCreate()}>＋ 新建记录</button>}
    >
      <div className="customer-home-store-row">
        <span>当前门店</span>
        <button className="store-context-select" type="button" onClick={() => setStoreSheetOpen(true)}>
          {currentStore.name}<span aria-hidden="true">›</span>
        </button>
      </div>

      <section className="customer-home-record-panel" aria-labelledby="customer-home-records-title">
        <div className="customer-home-section-heading">
          <h2 id="customer-home-records-title">接待记录</h2>
          <button className="customer-home-history" type="button" onClick={() => navigate(demoRoutes.recordHistory())}>
            <svg viewBox="0 0 20 20" aria-hidden="true"><path d="M4.1 6.4A6.7 6.7 0 1 1 3.4 10M4.1 3.7v3.1h3.1M10 6.1v4.2l2.7 1.6" /></svg>
            <span>历史记录</span><b aria-hidden="true">›</b>
          </button>
        </div>
        <div className="customer-home-counts">
          <button type="button" onClick={() => navigate(demoRoutes.recordHistory('all'))}><small>全部</small><strong>{countLabel(counts.all)}</strong></button>
          <button type="button" onClick={() => navigate(demoRoutes.recordHistory('processing'))}><small>整理中</small><strong>{countLabel(counts.processing)}</strong></button>
          <button className="is-pending" type="button" onClick={() => navigate(demoRoutes.recordHistory('pending'))}><small>待提交</small><strong>{countLabel(counts.pending)}</strong></button>
          <button type="button" onClick={() => navigate(demoRoutes.recordHistory('submitted'))}><small>已提交</small><strong>{countLabel(counts.submitted)}</strong></button>
        </div>
        <button className="customer-home-pending-link" type="button" onClick={() => navigate(demoRoutes.recordHistory('pending'))}>
          <span><strong>待提交记录</strong><b>{countLabel(counts.pending)} 条</b></span>
          <strong>去处理 <i aria-hidden="true">›</i></strong>
        </button>
      </section>

      <section className="customer-home-customers" aria-labelledby="customer-home-customers-title">
        <div className="customer-home-section-heading customer-home-section-heading--customers">
          <div><h2 id="customer-home-customers-title">客户列表</h2></div>
        </div>
        <div className="customer-home-filters">
          <label className="customer-home-search">
            <span aria-hidden="true">⌕</span>
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="搜索姓名 / 手机号" aria-label="搜索客户姓名或手机号" />
          </label>
          <select aria-label="按到店状态筛选" value={visitFilter} onChange={(event) => setVisitFilter(event.target.value as CustomerVisitFilter)}>
            <option value="all">全部到店</option><option value="visited">已到店</option><option value="not-visited">未到店</option>
          </select>
          <select aria-label="按成交状态筛选" value={dealFilter} onChange={(event) => setDealFilter(event.target.value as CustomerDealFilter)}>
            <option value="all">全部成交</option><option value="converted">已成交</option><option value="not-converted">未成交</option>
          </select>
        </div>

        <div className="customer-home-list">
          {customers.length === 0 ? <div className="customer-home-empty">没有符合条件的客户<button type="button" onClick={() => { setQuery(''); setVisitFilter('all'); setDealFilter('all') }}>重置筛选</button></div> : customers.map((member) => {
            const status = getCustomerBusinessStatus(member.customerId)
            return <article className="customer-home-row" key={member.customerId}>
              <div className="customer-home-row-top">
                <div className="customer-home-identity"><strong>{member.name}</strong><small>{maskPhone(member.phone)}</small></div>
                <button className="customer-home-detail-link" type="button" onClick={() => navigate(demoRoutes.mobileMemberDetail(member.id, undefined, 'records'))}>客户详情 <span aria-hidden="true">›</span></button>
              </div>
              <div className="customer-home-row-bottom">
                <span className="customer-home-statuses"><em className={status.visited ? 'is-on' : ''}>{status.visited ? '已到店' : '未到店'}</em><em className={status.converted ? 'is-on' : ''}>{status.converted ? '已成交' : '未成交'}</em></span>
                <button className="customer-home-new-reception" type="button" onClick={() => handleCreate(member.customerId)}><span>新增接待</span></button>
              </div>
            </article>
          })}
        </div>
      </section>

      {activeRecording && <RecordingFloatingWindow
        state={activeRecording.recordingState}
        durationSeconds={durationSeconds}
        onExpand={() => navigate(demoRoutes.recording(activeRecording.id))}
        onPause={() => updateRecord(activeRecording.id, { recordingState: 'paused', durationSeconds })}
        onResume={() => updateRecord(activeRecording.id, { recordingState: 'recording' })}
        onEnd={() => {
          updateRecord(activeRecording.id, { recordingState: 'processing', durationSeconds })
          startOrganizing(activeRecording.id)
          navigate(demoRoutes.organizing(activeRecording.id))
        }}
      />}

      {storeSheetOpen && <div className="mobile-sheet-overlay" role="presentation" onClick={() => setStoreSheetOpen(false)}>
        <section className="mobile-bottom-sheet" role="dialog" aria-modal="true" aria-labelledby="customer-home-store-title" onClick={(event) => event.stopPropagation()}>
          <div className="mobile-bottom-sheet__handle" />
          <div className="mobile-bottom-sheet__heading"><h2 id="customer-home-store-title">选择当前门店</h2><button type="button" onClick={() => setStoreSheetOpen(false)} aria-label="关闭门店选择">×</button></div>
          <div className="time-range-options">{accessibleStores.map((store) => <button className={currentStore.id === store.id ? 'time-range-option is-active' : 'time-range-option'} key={store.id} type="button" onClick={() => { selectStore(store.id); setStoreSheetOpen(false) }}><span>{store.name}</span>{currentStore.id === store.id && <b>✓</b>}</button>)}</div>
        </section>
      </div>}

      {recordingConflictOpen && activeRecording && <div className="mobile-sheet-overlay" role="presentation" onClick={() => setRecordingConflictOpen(false)}>
        <section className="mobile-bottom-sheet" role="dialog" aria-modal="true" aria-labelledby="customer-home-recording-conflict" onClick={(event) => event.stopPropagation()}>
          <div className="mobile-bottom-sheet__handle" />
          <div className="mobile-bottom-sheet__heading"><h2 id="customer-home-recording-conflict">当前无法新建记录</h2><button type="button" onClick={() => setRecordingConflictOpen(false)} aria-label="关闭提示">×</button></div>
          <p>当前正在录音中，请结束后继续操作</p>
          <div className="recording-fixed-actions"><button className="secondary-button" type="button" onClick={() => setRecordingConflictOpen(false)}>取消</button><button className="primary-button primary-button--large" type="button" onClick={() => { setRecordingConflictOpen(false); navigate(demoRoutes.recording(activeRecording.id)) }}>返回当前录音</button></div>
        </section>
      </div>}

      {recordFeedbackMessage && <div className="mobile-toast mobile-toast--success" role="status" aria-live="polite"><span className="mobile-toast__icon" aria-hidden="true">✓</span><span>{recordFeedbackMessage}</span></div>}
    </MobileShell>
  )
}
