import { useMemo, useState } from 'react'
import { AdminShell } from '../components/AdminShell'
import { AdminDialogueDetailDrawer } from './AdminDialogueDetailPage'
import { useReceptionRecords } from '../store/ReceptionRecordsContext'
import {
  formatBindingStatus,
  getBindingStatus,
  type DialogueBindingStatus,
} from '../data/dialogueRecordView'
import type { RecordingMethod } from '../types/record'

type FilterValue = 'all'
type ReceptionDateFilter = 'last-7-days' | 'last-30-days' | 'last-90-days' | 'custom' | FilterValue

type AdminFilters = {
  receptionDate: ReceptionDateFilter
  customStartDate: string
  customEndDate: string
  store: string
  receptionist: string
  method: FilterValue | RecordingMethod
  phone: string
  bindingStatus: FilterValue | DialogueBindingStatus
}

const allOption: FilterValue = 'all'

const emptyFilters: AdminFilters = {
  receptionDate: 'last-30-days',
  customStartDate: '',
  customEndDate: '',
  store: allOption,
  receptionist: allOption,
  method: allOption,
  phone: '',
  bindingStatus: allOption,
}

const demoToday = '2026-09-15'

function isReceptionDateInRange(receptionTime: string, filters: AdminFilters) {
  const date = receptionTime.slice(0, 10)
  if (filters.receptionDate === 'all') return true
  if (filters.receptionDate === 'last-7-days') return date >= '2026-09-09' && date <= demoToday
  if (filters.receptionDate === 'last-30-days') return date >= '2026-08-17' && date <= demoToday
  if (filters.receptionDate === 'last-90-days') return date >= '2026-06-18' && date <= demoToday
  return (!filters.customStartDate || date >= filters.customStartDate) && (!filters.customEndDate || date <= filters.customEndDate)
}

function receptionDateLabel(filters: AdminFilters) {
  if (filters.receptionDate === 'last-7-days') return '近7天'
  if (filters.receptionDate === 'last-30-days') return '近30天'
  if (filters.receptionDate === 'last-90-days') return '近90天'
  if (filters.receptionDate === 'all') return '全部时间'
  if (filters.customStartDate || filters.customEndDate) return `${filters.customStartDate || '开始日期'} ～ ${filters.customEndDate || '结束日期'}`
  return '自定义时间'
}

type DatePopoverMode = 'quick' | 'custom'

function formatCoReceptionists(names: string[]) {
  if (names.length === 0) return '--'
  if (names.length <= 2) return names.join('、')
  return `${names[0]}等${names.length}人`
}

function StatusPill({ label, tone }: { label: string; tone: string }) {
  return <span className={`admin-status-pill admin-status-pill--${tone}`}>{label}</span>
}

export function AdminDialogueRecordsPage({ initialRecordId }: { initialRecordId?: string }) {
  const { records } = useReceptionRecords()
  const [selectedRecordId, setSelectedRecordId] = useState<string | null>(initialRecordId ?? null)
  const [draftFilters, setDraftFilters] = useState<AdminFilters>(emptyFilters)
  const [appliedFilters, setAppliedFilters] = useState<AdminFilters>(emptyFilters)
  const [isDateFilterOpen, setDateFilterOpen] = useState(false)
  const [datePopoverMode, setDatePopoverMode] = useState<DatePopoverMode>('quick')
  const [datePopoverDraft, setDatePopoverDraft] = useState({ startDate: '', endDate: '' })
  const [dateFilterError, setDateFilterError] = useState('')

  const submittedRecords = useMemo(() => records
    .filter((record) => record.status === 'submitted')
    .sort((left, right) => right.receptionTime.localeCompare(left.receptionTime)), [records])
  const stores = useMemo(() => [...new Set(submittedRecords.map((record) => record.storeName))], [submittedRecords])
  const receptionists = useMemo(() => [...new Set(submittedRecords.map((record) => record.primaryReceptionist || record.receptionistName))], [submittedRecords])

  const visibleRecords = useMemo(() => submittedRecords.filter((record) => {
    const binding = getBindingStatus(record)
    return (
      isReceptionDateInRange(record.receptionTime, appliedFilters) &&
      (appliedFilters.store === allOption || record.storeName === appliedFilters.store) &&
      (appliedFilters.receptionist === allOption || (record.primaryReceptionist || record.receptionistName) === appliedFilters.receptionist) &&
      (appliedFilters.method === allOption || record.method === appliedFilters.method) &&
      (!appliedFilters.phone || record.customerInfo.phone.includes(appliedFilters.phone)) &&
      (appliedFilters.bindingStatus === allOption || binding === appliedFilters.bindingStatus)
    )
  }), [appliedFilters, submittedRecords])

  const updateFilter = <K extends keyof AdminFilters>(key: K, value: AdminFilters[K]) => {
    setDraftFilters((current) => ({ ...current, [key]: value }))
  }

  const resetFilters = () => {
    setDraftFilters(emptyFilters)
    setAppliedFilters(emptyFilters)
    setDateFilterOpen(false)
    setDatePopoverMode('quick')
    setDatePopoverDraft({ startDate: '', endDate: '' })
    setDateFilterError('')
  }

  const openDateFilter = () => {
    setDatePopoverMode(draftFilters.receptionDate === 'custom' ? 'custom' : 'quick')
    setDatePopoverDraft({ startDate: draftFilters.customStartDate, endDate: draftFilters.customEndDate })
    setDateFilterError('')
    setDateFilterOpen(true)
  }

  const selectQuickDateFilter = (value: Exclude<ReceptionDateFilter, 'custom'>) => {
    setDraftFilters((current) => ({
      ...current,
      receptionDate: value,
      customStartDate: '',
      customEndDate: '',
    }))
    setDateFilterError('')
    setDateFilterOpen(false)
  }

  const enterCustomDateFilter = () => {
    setDatePopoverMode('custom')
    setDatePopoverDraft({ startDate: draftFilters.customStartDate, endDate: draftFilters.customEndDate })
    setDateFilterError('')
  }

  const confirmCustomDateFilter = () => {
    const { startDate, endDate } = datePopoverDraft
    if (!startDate || !endDate) {
      setDateFilterError('请选择开始日期和结束日期')
      return
    }
    if (startDate > endDate) {
      setDateFilterError('开始日期不能晚于结束日期')
      return
    }
    setDraftFilters((current) => ({
      ...current,
      receptionDate: 'custom',
      customStartDate: startDate,
      customEndDate: endDate,
    }))
    setDateFilterError('')
    setDateFilterOpen(false)
  }

  return (
    <AdminShell>
      <div className="admin-breadcrumb">SCRM <span>/</span> 潜客管理 <span>/</span> 智能对话记录</div>
      <div className="admin-page-header">
        <div>
          <span className="admin-page-kicker">潜客管理</span>
          <h1>智能对话记录</h1>
        </div>
      </div>

      <section className="admin-filter-panel" aria-labelledby="dialogue-filter-title">
        <div className="admin-filter-panel__heading">
          <h2 id="dialogue-filter-title">筛选条件</h2>
        </div>
        <div className="admin-filter-grid">
          <div className="admin-filter-field">
            <span>接待时间</span>
            <button className="admin-filter-select" type="button" onClick={openDateFilter} aria-expanded={isDateFilterOpen} aria-haspopup="dialog">
              <span>{receptionDateLabel(draftFilters)}</span><span aria-hidden="true">⌄</span>
            </button>
            {isDateFilterOpen && (
              <div className="admin-date-filter-popover" role="dialog" aria-label="接待时间筛选">
                <div className="admin-date-filter-options">
                  {([
                    ['last-7-days', '近7天'],
                    ['last-30-days', '近30天'],
                    ['last-90-days', '近90天'],
                    ['all', '全部时间'],
                  ] as const).map(([value, label]) => (
                    <button className={datePopoverMode === 'quick' && draftFilters.receptionDate === value ? 'is-active' : ''} type="button" key={value} onClick={() => selectQuickDateFilter(value)}>{label}</button>
                  ))}
                  <button className={datePopoverMode === 'custom' ? 'is-active' : ''} type="button" onClick={enterCustomDateFilter}>自定义时间 <span aria-hidden="true">›</span></button>
                </div>
                {datePopoverMode === 'custom' && (
                  <div className="admin-date-filter-custom">
                    <label>开始日期<input type="date" value={datePopoverDraft.startDate} onChange={(event) => setDatePopoverDraft((current) => ({ ...current, startDate: event.target.value }))} /></label>
                    <span>至</span>
                    <label>结束日期<input type="date" value={datePopoverDraft.endDate} onChange={(event) => setDatePopoverDraft((current) => ({ ...current, endDate: event.target.value }))} /></label>
                  </div>
                )}
                {datePopoverMode === 'custom' && (
                  <>
                    {dateFilterError && <p className="admin-date-filter-error" role="alert">{dateFilterError}</p>}
                    <div className="admin-date-filter-actions">
                      <button type="button" onClick={() => setDateFilterOpen(false)}>取消</button>
                      <button type="button" onClick={confirmCustomDateFilter}>确定</button>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
          <label>门店<select value={draftFilters.store} onChange={(event) => updateFilter('store', event.target.value)}><option value="all">全部门店</option>{stores.map((item) => <option value={item} key={item}>{item}</option>)}</select></label>
          <label>主接待人<select value={draftFilters.receptionist} onChange={(event) => updateFilter('receptionist', event.target.value)}><option value="all">全部接待人</option>{receptionists.map((item) => <option value={item} key={item}>{item}</option>)}</select></label>
          <label>记录方式<select value={draftFilters.method} onChange={(event) => updateFilter('method', event.target.value as AdminFilters['method'])}><option value="all">全部方式</option><option value="face-to-face">面客模式</option><option value="afterwards">事后补录</option></select></label>
          <label>客户手机号<input value={draftFilters.phone} onChange={(event) => updateFilter('phone', event.target.value)} inputMode="numeric" placeholder="请输入手机号" /></label>
          <label>客户关联状态<select value={draftFilters.bindingStatus} onChange={(event) => updateFilter('bindingStatus', event.target.value as AdminFilters['bindingStatus'])}><option value="all">全部状态</option><option value="bound">已关联</option><option value="unbound">未关联</option></select></label>
        </div>
        <div className="admin-filter-actions">
          <button className="admin-secondary-button" type="button" onClick={resetFilters}>重置</button>
          <button className="admin-primary-button" type="button" onClick={() => setAppliedFilters(draftFilters)}>搜索</button>
        </div>
      </section>

      <section className="admin-table-panel" aria-label="智能对话记录表格">
        <div className="admin-table-panel__heading"><div><h2>记录列表</h2><span>共 {visibleRecords.length} 条记录</span></div></div>
        {visibleRecords.length === 0 ? (
          <div className="admin-empty-state"><span>○</span><strong>暂无符合条件的记录</strong><p>请调整筛选条件后重试。</p></div>
        ) : (
          <div className="admin-table-scroll">
            <table className="admin-record-table">
              <thead><tr><th>接待时间</th><th>客户姓名</th><th>客户手机号</th><th>客户关联状态</th><th>门店</th><th>主接待人</th><th>协同接待人</th><th>记录方式</th><th>操作</th></tr></thead>
              <tbody>
                {visibleRecords.map((record) => {
                  const binding = getBindingStatus(record)
                  return (
                    <tr key={record.id}>
                      <td className="admin-table-time">{record.receptionTime}</td>
                      <td className="admin-table-strong">{record.customerInfo.name || '--'}</td>
                      <td>{record.customerInfo.phone || '--'}</td>
                      <td><StatusPill label={formatBindingStatus(binding)} tone={binding} /></td>
                      <td>{record.storeName}</td>
                      <td>{record.primaryReceptionist || record.receptionistName || '--'}</td>
                      <td>{formatCoReceptionists(record.coReceptionists)}</td>
                      <td>{record.method === 'face-to-face' ? '面客模式' : '事后补录'}</td>
                      <td><button className="admin-view-button" type="button" onClick={() => setSelectedRecordId(record.id)}>查看</button></td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
        <div className="admin-pagination"><span>共 {visibleRecords.length} 条</span><button type="button" disabled>上一页</button><strong>1</strong><button type="button" disabled>下一页</button></div>
      </section>

      {selectedRecordId && <AdminDialogueDetailDrawer recordId={selectedRecordId} onClose={() => setSelectedRecordId(null)} />}
    </AdminShell>
  )
}
