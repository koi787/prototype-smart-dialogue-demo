import { useEffect, useMemo, useState } from 'react'
import { MobileShell } from '../components/MobileShell'
import { RecordingFloatingWindow } from '../components/RecordingFloatingWindow'
import { StatusTag } from '../components/StatusTag'
import { mockTranscriptLines } from '../data/mockTranscript'
import { findMemberById } from '../data/mockMembers'
import { formatMaskedPhone } from '../data/phoneDisplay'
import { matchesReceptionRecordSearch } from '../data/recordSearch'
import { demoRoutes, navigate } from '../routes'
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

function recordPhone(record: ReceptionRecord) {
  const historicalPhone = record.customerPhone || record.customerInfo.phone
  const linkedMember = record.customerBindingStatus === 'bound'
    ? findMemberById(record.memberId, record.customerId)
    : undefined
  return formatMaskedPhone(historicalPhone || linkedMember?.phone, record.customerBindingStatus === 'bound' ? '手机号未填写' : '未关联客户')
}

function timeFilterLabel(filter: TimeFilter) {
  if (filter.range === 'last7') return '近7天'
  if (filter.range === 'last30') return '近30天'
  if (filter.range === 'all') return '全部时间'
  if (filter.startDate || filter.endDate) return `${filter.startDate || '开始日期'} ～ ${filter.endDate || '结束日期'}`
  return '自定义时间'
}

export function RecordListPage({ storeScenario, initialStatus }: { storeScenario?: EmployeeStoreScenario; initialStatus?: StatusFilter }) {
  const { records, updateRecord, startOrganizing } = useReceptionRecords()
  const { currentStore, setScenario } = useStoreContext()
  const [statusFilter, setStatusFilter] = useState<StatusFilter>(initialStatus ?? listFilterMemory.status)
  const [timeFilter, setTimeFilter] = useState<TimeFilter>(listFilterMemory.time)
  const [searchQuery, setSearchQuery] = useState('')
  const [isTimeSheetOpen, setTimeSheetOpen] = useState(false)
  useEffect(() => {
    if (storeScenario) setScenario(storeScenario)
  }, [setScenario, storeScenario])

  useEffect(() => {
    const nextStatus = initialStatus ?? 'all'
    listFilterMemory.status = nextStatus
    setStatusFilter(nextStatus)
  }, [initialStatus])

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
    () => scopedRecords.filter((record) => {
      if (!matchesStatus(record, statusFilter)) return false
      const linkedMemberPhone = record.customerBindingStatus === 'bound'
        ? findMemberById(record.memberId, record.customerId)?.phone
        : undefined
      return matchesReceptionRecordSearch(record, searchQuery, linkedMemberPhone)
    }),
    [scopedRecords, searchQuery, statusFilter],
  )
  const selectStatus = (nextStatus: StatusFilter) => {
    listFilterMemory.status = nextStatus
    setStatusFilter(nextStatus)
    navigate(demoRoutes.recordHistory(nextStatus))
  }

  const updateTimeFilter = (next: Partial<TimeFilter>) => {
    const merged = { ...timeFilter, ...next }
    listFilterMemory.time = merged
    setTimeFilter(merged)
  }

  return (
    <MobileShell title="接待记录" onBack={() => navigate(demoRoutes.records)} backLabel="返回智能对话">
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

      <div className="record-filter-row">
        <button className="record-filter-date" type="button" aria-label={`日期筛选：${timeFilterLabel(timeFilter)}`} onClick={() => setTimeSheetOpen(true)}>
          <strong>{timeFilterLabel(timeFilter)}</strong><span aria-hidden="true">⌄</span>
        </button>
        <label className="record-filter-search">
          <span aria-hidden="true">⌕</span>
          <input aria-label="搜索姓名或手机号" value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} placeholder="姓名 / 手机号" />
        </label>
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
              <p className="record-card__status-note">{recordPhone(record)}</p>
              <p className="record-card__time">{record.receptionTime}</p>
              <div className="record-card__meta">
                <span>{record.storeName.replace('奥本瑜伽 · ', '')} · {record.primaryReceptionist || record.receptionistName || '--'}</span>
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

    </MobileShell>
  )
}
