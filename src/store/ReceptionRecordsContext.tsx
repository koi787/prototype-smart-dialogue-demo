import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { mockRecords } from '../data/mockRecords'
import { findMemberById, findMembersByPhone } from '../data/mockMembers'
import { findMockStoreByName } from '../data/mockStores'
import { mockCurrentEmployee } from '../data/mockStaff'
import type { ReceptionRecord } from '../types/record'
import type { Store } from '../types/store'

const storageKey = 'prototype-smart-dialogue-demo.records'

type ReceptionRecordsContextValue = {
  records: ReceptionRecord[]
  getRecord: (recordId: string) => ReceptionRecord | undefined
  createRecord: (method: ReceptionRecord['method'], store: Store) => ReceptionRecord
  updateRecord: (recordId: string, patch: Partial<ReceptionRecord>) => void
  startOrganizing: (recordId: string) => void
}

const ReceptionRecordsContext = createContext<ReceptionRecordsContextValue | null>(null)

function readInitialRecords() {
  const saved = window.localStorage.getItem(storageKey)
  if (!saved) return mockRecords

  try {
    const parsed = JSON.parse(saved) as ReceptionRecord[]
    if (!Array.isArray(parsed) || parsed.length === 0) return mockRecords
    const normalized = parsed.map(normalizeRecord)
    const existingIds = new Set(normalized.map((record) => record.id))
    const missingMocks = mockRecords.filter((record) => !existingIds.has(record.id)).map(normalizeRecord)
    return [...normalized, ...missingMocks]
  } catch {
    return mockRecords
  }
}

function normalizeRecord(record: ReceptionRecord): ReceptionRecord {
  const mockFallback = mockRecords.find((item) => item.id === record.id)
  const hasStructuredContent = Object.values(record.aiContent ?? {}).some((value) => value.trim().length > 0)
  const normalizedAiStatus = record.aiStatus ?? mockFallback?.aiStatus ?? (hasStructuredContent ? 'success' : 'failed')
  let associatedMember = findMemberById(record.memberId, record.customerId)
  if (!associatedMember && record.customerBindingStatus === 'bound' && record.customerInfo.phone) {
    try {
      associatedMember = findMembersByPhone(record.customerInfo.phone).length === 1
        ? findMembersByPhone(record.customerInfo.phone)[0]
        : undefined
    } catch {
      associatedMember = undefined
    }
  }
  return {
    ...record,
    storeId: record.storeId ?? mockFallback?.storeId ?? findMockStoreByName(record.storeName)?.id ?? 'guomao',
    creator: record.creator ?? mockFallback?.creator ?? record.receptionistName,
    submitter: record.submitter ?? mockFallback?.submitter ?? '',
    primaryReceptionist: record.primaryReceptionist ?? mockFallback?.primaryReceptionist ?? record.receptionistName,
    coReceptionists: record.coReceptionists ?? mockFallback?.coReceptionists ?? [],
    recordingStartedAt: record.recordingStartedAt ?? mockFallback?.recordingStartedAt ?? record.receptionTime,
    recordingMethod: record.recordingMethod ?? mockFallback?.recordingMethod ?? record.method,
    status: normalizedAiStatus === 'failed' ? 'failed' : record.status,
    customerBindingStatus: record.customerBindingStatus ?? mockFallback?.customerBindingStatus ?? 'unbound',
    memberId: record.memberId ?? mockFallback?.memberId ?? associatedMember?.id,
    customerId: record.customerId ?? mockFallback?.customerId ?? associatedMember?.customerId,
    transcriptionStatus: record.transcriptionStatus ?? mockFallback?.transcriptionStatus ?? (record.transcript.length > 0 ? 'success' : 'failed'),
    aiStatus: normalizedAiStatus,
    recordingState: record.recordingState ?? 'idle',
    organizingProgress: record.organizingProgress ?? 100,
  }
}

export function ReceptionRecordsProvider({ children }: { children: ReactNode }) {
  const [records, setRecords] = useState<ReceptionRecord[]>(readInitialRecords)
  const recordsRef = useRef(records)
  const organizingJobsRef = useRef(new Map<string, number[]>())

  useEffect(() => {
    recordsRef.current = records
  }, [records])

  const getRecord = useCallback(
    (recordId: string) => records.find((record) => record.id === recordId),
    [records],
  )

  const createRecord = useCallback((method: ReceptionRecord['method'], store: Store) => {
    const record: ReceptionRecord = {
      id: `record-${Date.now()}`,
      title: method === 'face-to-face' ? '新接待 · 面客模式' : '新接待 · 事后补录',
      storeId: store.id,
      storeName: store.name,
      creator: mockCurrentEmployee.name,
      submitter: '',
      primaryReceptionist: mockCurrentEmployee.name,
      coReceptionists: [],
      receptionistName: mockCurrentEmployee.name,
      receptionTime: '',
      recordingStartedAt: '',
      method,
      recordingMethod: method,
      status: 'draft',
      customerBindingStatus: 'unbound',
      transcriptionStatus: 'processing',
      aiStatus: 'pending',
      recordingState: 'idle',
      organizingProgress: 0,
      durationSeconds: 0,
      customerInfo: { name: '', phone: '' },
      transcript: [],
      aiContent: {
        summary: '客户提到肩颈酸痛和久坐情况，希望进一步了解适合自己的改善方式。',
        customerProfile: '客户提及工作久坐，其他基础信息未提及。',
        bodyCondition: '客户自述肩颈经常酸痛。',
        customerNeeds: '希望改善久坐带来的肩颈不适，寻找适合自己的方式。',
        intendedProject: '未明确提及。',
        concerns: '未提及。',
        communicationResult: '完成基础情况沟通，尚未形成具体预约。',
        followUpSuggestion: '未明确提出后续安排。',
      },
    }
    setRecords((current) => [record, ...current])
    return record
  }, [])

  const updateRecord = useCallback((recordId: string, patch: Partial<ReceptionRecord>) => {
    setRecords((current) => current.map((record) => (
      record.id === recordId ? { ...record, ...patch } : record
    )))
  }, [])

  const scheduleOrganizing = useCallback((recordId: string) => {
    if (organizingJobsRef.current.has(recordId)) return
    const currentRecord = recordsRef.current.find((record) => record.id === recordId)
    const startingProgress = currentRecord?.organizingProgress ?? 0
    const steps = [
      { progress: 28, delay: 1200 },
      { progress: 62, delay: 2800 },
      { progress: 88, delay: 4400 },
    ]
    const timers = steps
      .filter((step) => step.progress > startingProgress)
      .map((step) => window.setTimeout(() => updateRecord(recordId, { organizingProgress: step.progress }), step.delay))
    timers.push(window.setTimeout(() => {
      updateRecord(recordId, { transcriptionStatus: 'success', aiStatus: 'processing' })
    }, 1200))
    timers.push(window.setTimeout(() => {
      updateRecord(recordId, {
        status: 'ready-for-review',
        recordingState: 'idle',
        organizingProgress: 100,
        transcriptionStatus: 'success',
        aiStatus: 'success',
      })
      organizingJobsRef.current.delete(recordId)
    }, startingProgress >= 88 ? 1000 : 6000))
    organizingJobsRef.current.set(recordId, timers)
  }, [updateRecord])

  const startOrganizing = useCallback((recordId: string) => {
    const currentRecord = recordsRef.current.find((record) => record.id === recordId)
    if (currentRecord?.status !== 'processing') {
      updateRecord(recordId, {
        status: 'processing',
        recordingState: 'processing',
        organizingProgress: 0,
        transcriptionStatus: 'processing',
        aiStatus: 'processing',
      })
    }
    scheduleOrganizing(recordId)
  }, [scheduleOrganizing, updateRecord])

  useEffect(() => {
    records.filter((record) => record.status === 'processing').forEach((record) => scheduleOrganizing(record.id))
  }, [records, scheduleOrganizing])

  useEffect(() => {
    window.localStorage.setItem(storageKey, JSON.stringify(records))
  }, [records])

  const value = useMemo(
    () => ({
      records,
      getRecord,
      createRecord,
      updateRecord,
      startOrganizing,
    }),
    [createRecord, getRecord, records, startOrganizing, updateRecord],
  )

  return <ReceptionRecordsContext.Provider value={value}>{children}</ReceptionRecordsContext.Provider>
}

export function useReceptionRecords() {
  const context = useContext(ReceptionRecordsContext)
  if (!context) throw new Error('useReceptionRecords must be used inside ReceptionRecordsProvider')
  return context
}
