import { useEffect, useMemo, useState } from 'react'
import { MobileShell } from '../components/MobileShell'
import { RecordingFloatingWindow } from '../components/RecordingFloatingWindow'
import { StatusTag } from '../components/StatusTag'
import { mockTranscriptLines } from '../data/mockTranscript'
import { demoRoutes, navigate, submitSuccessNoticeKey } from '../routes'
import { useReceptionRecords } from '../store/ReceptionRecordsContext'
import type { ReceptionRecord, RecordStatus } from '../types/record'
import type { EmployeeStoreScenario } from '../types/store'
import { useStoreContext } from '../store/StoreContext'

type StatusFilter = 'all' | 'processing' | 'pending' | 'submitted'
type TimeRange = 'last7' | 'last30' | 'custom' | 'all'
type TimeFilter = { range: TimeRange; startDate: string; endDate: string }

const listFilterMemory: { status: StatusFilter; time: TimeFilter } = {
  status: 'all',
  time: { range: 'last30', startDate: '', endDate: '' },
}

const statusFilters: Array<{ key: StatusFilter; label: string }> = [
  { key: 'all', label: '全部' },
  { key: 'processing', label: '整理中' },
  { key: 'pending', label: '待提交' },
  { key: 'submitted', label: '已提交' },
]

function recordRoute(record: { id: string; status: RecordStatus; recordingState: ReceptionRecord['recordingState'] }) {
  if (record.recordingState === 'recording' || record.recordingState === 'paused') return demoRoutes.recording(record.id)
  if (record.status === 'processing' || record.status === 'failed') return demoRoutes.organizing(record.id)
  if (record.status === 'ready-for-review' || record.status === 'draft') return demoRoutes.confirm(record.id)
  return demoRoutes.detail(record.id)
}

function statusDescription(status: RecordStatus) {
  if (status === 'processing') return 'AI正在整理接待内容'
  if (status === 'ready-for-review') return 'AI整理完成，请确认并提交'
  if (status === 'draft') return '已保存草稿'
  if (status === 'submitted') return '员工已完成确认提交'
  return '识别异常，请稍后重试或联系技术人员。'
}

function displayTitle(record: ReceptionRecord) {
  const methodLabel = record.method === 'face-to-face' ? '面客记录' : '事后补录'
  return record.customerInfo.name.trim() ? `${record.customerInfo.name.trim()} · ${methodLabel}` : `新接待 · ${record.method === 'face-to-face' ? '面客模式' : '事后补录'}`
}

function dateValue(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function matchesStatus(record: ReceptionRecord, filter: StatusFilter) {
  if (filter === 'all') return true
  if (filter === 'processing') return record.status === 'processing'
  if (filter === 'pending') return record.status === 'ready-for-review' || record.status === 'draft'
  return record.status === 'submitted'
}

function matchesTime(record: ReceptionRecord, filter: TimeFilter) {
  const recordDate = record.receptionTime.slice(0, 10)
  if (filter.range === 'all') return true
  if (filter.range === 'custom') {
    return (!filter.startDate || recordDate >= filter.startDate) && (!filter.endDate || recordDate <= filter.endDate)
  }
  const end = new Date()
  const start = new Date()
  start.setDate(start.getDate() - (filter.range === 'last7' ? 6 : 29))
  return recordDate >= dateValue(start) && recordDate <= dateValue(end)
}

function formatCount(count: number) {
  return count > 99 ? '99+' : String(count)
}

function timeFilterLabel(filter: TimeFilter) {
  if (filter.range === 'last7') return '近7天'
  if (filter.range === 'last30') return '近30天'
  if (filter.range === 'all') return '全部时间'
  if (filter.startDate || filter.endDate) return `${filter.startDate || '开始日期'} ～ ${filter.endDate || '结束日期'}`
  return '自定义时间'
}

export function RecordListPage({ storeScenario }: { storeScenario?: EmployeeStoreScenario }) {
  const { records, updateRecord, startOrganizing } = useReceptionRecords()
  const { accessibleStores, currentStore, selectStore, setScenario } = useStoreContext()
  const [statusFilter, setStatusFilter] = useState<StatusFilter>(listFilterMemory.status)
  const [timeFilter, setTimeFilter] = useState<TimeFilter>(listFilterMemory.time)
  const [isTimeSheetOpen, setTimeSheetOpen] = useState(false)
  const [isStoreSheetOpen, setStoreSheetOpen] = useState(false)
  const [showSubmitToast, setShowSubmitToast] = useState(false)
  const [recordingConflictOpen, setRecordingConflictOpen] = useState(false)
  useEffect(() => {
    if (storeScenario) setScenario(storeScenario)
  }, [setScenario, storeScenario])

  useEffect(() => {
    if (window.sessionStorage.getItem(submitSuccessNoticeKey) !== '1') return
    window.sessionStorage.removeItem(submitSuccessNoticeKey)
    setShowSubmitToast(true)
    const timer = window.setTimeout(() => setShowSubmitToast(false), 1200)
    return () => window.clearTimeout(timer)
  }, [])

  const scopedRecords = useMemo(
    () => records.filter((record) => record.storeId === currentStore.id && matchesTime(record, timeFilter)),
    [currentStore.id, records, timeFilter],
  )
  const activeRecordingRecord = useMemo(
    () => records.find((record) => record.recordingState === 'recording' || record.recordingState === 'paused'),
    [records],
  )
  const [floatingDurationSeconds, setFloatingDurationSeconds] = useState(activeRecordingRecord?.durationSeconds ?? 0)
  useEffect(() => {
    setFloatingDurationSeconds(activeRecordingRecord?.durationSeconds ?? 0)
    if (!activeRecordingRecord || activeRecordingRecord.recordingState !== 'recording') return
    const timer = window.setInterval(() => setFloatingDurationSeconds((current) => current + 1), 1000)
    return () => window.clearInterval(timer)
  }, [activeRecordingRecord?.id, activeRecordingRecord?.recordingState, activeRecordingRecord?.durationSeconds])

  useEffect(() => {
    if (!activeRecordingRecord || activeRecordingRecord.recordingState !== 'recording') return
    const timer = window.setInterval(() => {
      const currentRecord = records.find((record) => record.id === activeRecordingRecord.id)
      const nextLine = currentRecord && mockTranscriptLines[currentRecord.transcript.length]
      if (!currentRecord || !nextLine) return
      updateRecord(currentRecord.id, { transcript: [...currentRecord.transcript, nextLine] })
    }, 1600)
    return () => window.clearInterval(timer)
  }, [activeRecordingRecord?.id, activeRecordingRecord?.recordingState, records, updateRecord])
  const statusCounts = useMemo(() => ({
    all: scopedRecords.length,
    processing: scopedRecords.filter((record) => record.status === 'processing').length,
    pending: scopedRecords.filter((record) => record.status === 'ready-for-review' || record.status === 'draft').length,
    submitted: scopedRecords.filter((record) => record.status === 'submitted').length,
  }), [scopedRecords])
  const visibleRecords = useMemo(
    () => scopedRecords.filter((record) => matchesStatus(record, statusFilter)),
    [scopedRecords, statusFilter],
  )

  const selectStatus = (nextStatus: StatusFilter) => {
    listFilterMemory.status = nextStatus
    setStatusFilter(nextStatus)
  }

  const updateTimeFilter = (next: Partial<TimeFilter>) => {
    const merged = { ...timeFilter, ...next }
    listFilterMemory.time = merged
    setTimeFilter(merged)
  }

  const handleCreateRecord = () => {
    if (activeRecordingRecord) {
      setRecordingConflictOpen(true)
      return
    }
    navigate(demoRoutes.create)
  }

  const storeContext = (
    <button className="store-context-select" type="button" onClick={() => setStoreSheetOpen(true)}>
      {currentStore.name}<span aria-hidden="true">›</span>
    </button>
  )

  return (
    <MobileShell title="智能对话" onBack={() => navigate(demoRoutes.home)} backLabel="返回奥本中台">
      <div className="record-list-store-context">{storeContext}</div>
      <div className="page-intro page-intro--record-list">
        <h2>接待记录</h2>
      </div>

      <button className="primary-button primary-button--large" type="button" onClick={handleCreateRecord}>
        <span aria-hidden="true">＋</span> 新建记录
      </button>

      <div className="filter-tabs" role="tablist" aria-label="接待记录状态筛选">
        {statusFilters.map((item) => (
          <button
            className={`filter-tab${statusFilter === item.key ? ' is-active' : ''}${item.key === 'pending' ? ' filter-tab--pending' : ''}`}
            key={item.key}
            type="button"
            role="tab"
            aria-selected={statusFilter === item.key}
            onClick={() => selectStatus(item.key)}
          >
            <span>{item.label}</span><em>{formatCount(statusCounts[item.key])}</em>
          </button>
        ))}
      </div>

      <div className="time-filter-row">
        <span>时间</span>
        <button type="button" onClick={() => setTimeSheetOpen(true)}>
          <strong>{timeFilterLabel(timeFilter)}</strong><span aria-hidden="true">›</span>
        </button>
      </div>

      <div className="record-list">
        {visibleRecords.length === 0 ? (
          <section className="empty-state">
            <span className="empty-state__icon">○</span>
            <h3>暂无记录</h3>
            <p>当前筛选条件下没有接待记录。</p>
          </section>
        ) : (
          visibleRecords.map((record) => (
            <button
              className="record-card"
              key={record.id}
              type="button"
              onClick={() => navigate(recordRoute(record))}
            >
              <div className="record-card__topline">
                <span className="record-card__title">{displayTitle(record)}</span>
                <StatusTag status={record.status} />
              </div>
              <p className="record-card__status-note">{statusDescription(record.status)}</p>
              <p className="record-card__time">{record.receptionTime}</p>
              <div className="record-card__meta">
                <span>{record.storeName.replace('奥本瑜伽 · ', '')} · {record.receptionistName}</span>
              </div>
            </button>
          ))
        )}
      </div>

      {activeRecordingRecord && (
        <RecordingFloatingWindow
          state={activeRecordingRecord.recordingState}
          durationSeconds={floatingDurationSeconds}
          onExpand={() => navigate(demoRoutes.recording(activeRecordingRecord.id))}
          onPause={() => updateRecord(activeRecordingRecord.id, { recordingState: 'paused', durationSeconds: floatingDurationSeconds })}
          onResume={() => updateRecord(activeRecordingRecord.id, { recordingState: 'recording' })}
          onEnd={() => {
            updateRecord(activeRecordingRecord.id, { recordingState: 'processing', durationSeconds: floatingDurationSeconds })
            startOrganizing(activeRecordingRecord.id)
            navigate(demoRoutes.organizing(activeRecordingRecord.id))
          }}
        />
      )}

      {isTimeSheetOpen && (
        <div className="mobile-sheet-overlay" role="presentation" onClick={() => setTimeSheetOpen(false)}>
          <section className="mobile-bottom-sheet" role="dialog" aria-modal="true" aria-labelledby="time-filter-title" onClick={(event) => event.stopPropagation()}>
            <div className="mobile-bottom-sheet__handle" />
            <div className="mobile-bottom-sheet__heading"><h2 id="time-filter-title">选择时间</h2><button type="button" onClick={() => setTimeSheetOpen(false)} aria-label="关闭时间筛选">×</button></div>
            <div className="time-range-options">
              {([['last7', '近7天'], ['last30', '近30天'], ['custom', '自定义时间'], ['all', '全部时间']] as Array<[TimeRange, string]>).map(([range, label]) => (
                <button className={timeFilter.range === range ? 'time-range-option is-active' : 'time-range-option'} key={range} type="button" onClick={() => { updateTimeFilter({ range }); if (range !== 'custom') setTimeSheetOpen(false) }}>
                  <span>{label}</span>{timeFilter.range === range && <b>✓</b>}
                </button>
              ))}
            </div>
            {timeFilter.range === 'custom' && (
              <div className="custom-date-fields">
                <label>开始日期<input type="date" value={timeFilter.startDate} onChange={(event) => updateTimeFilter({ startDate: event.target.value })} /></label>
                <span>～</span>
                <label>结束日期<input type="date" value={timeFilter.endDate} onChange={(event) => updateTimeFilter({ endDate: event.target.value })} /></label>
                <button className="primary-button" type="button" onClick={() => setTimeSheetOpen(false)}>应用</button>
              </div>
            )}
          </section>
        </div>
      )}

      {isStoreSheetOpen && (
        <div className="mobile-sheet-overlay" role="presentation" onClick={() => setStoreSheetOpen(false)}>
          <section className="mobile-bottom-sheet" role="dialog" aria-modal="true" aria-labelledby="store-select-title" onClick={(event) => event.stopPropagation()}>
            <div className="mobile-bottom-sheet__handle" />
            <div className="mobile-bottom-sheet__heading"><h2 id="store-select-title">选择当前门店</h2><button type="button" onClick={() => setStoreSheetOpen(false)} aria-label="关闭门店选择">×</button></div>
            <div className="time-range-options">
              {accessibleStores.map((store) => <button className={currentStore.id === store.id ? 'time-range-option is-active' : 'time-range-option'} key={store.id} type="button" onClick={() => { selectStore(store.id); setStoreSheetOpen(false) }}><span>{store.name}</span>{currentStore.id === store.id && <b>✓</b>}</button>)}
            </div>
          </section>
        </div>
      )}
      {recordingConflictOpen && activeRecordingRecord && (
        <div className="mobile-sheet-overlay" role="presentation" onClick={() => setRecordingConflictOpen(false)}>
          <section className="mobile-bottom-sheet" role="dialog" aria-modal="true" aria-labelledby="recording-conflict-title" onClick={(event) => event.stopPropagation()}>
            <div className="mobile-bottom-sheet__handle" />
            <div className="mobile-bottom-sheet__heading">
              <h2 id="recording-conflict-title">当前无法新建记录</h2>
              <button type="button" onClick={() => setRecordingConflictOpen(false)} aria-label="关闭提示">×</button>
            </div>
            <p>当前正在录音中，请结束后继续操作</p>
            <div className="recording-fixed-actions">
              <button className="secondary-button" type="button" onClick={() => setRecordingConflictOpen(false)}>取消</button>
              <button className="primary-button primary-button--large" type="button" onClick={() => { setRecordingConflictOpen(false); navigate(demoRoutes.recording(activeRecordingRecord.id)) }}>返回当前录音</button>
            </div>
          </section>
        </div>
      )}
      {showSubmitToast && <div className="mobile-toast" role="status" aria-live="polite">提交成功</div>}
    </MobileShell>
  )
}
