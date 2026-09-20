import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { mockRecords } from '../data/mockRecords'
import { findMemberById, findMembersByPhone } from '../data/mockMembers'
import { findMockStoreByName } from '../data/mockStores'
import { mockCurrentEmployee } from '../data/mockStaff'
import { structuredContentLabels, type ReceptionRecord, type StructuredContent } from '../types/record'
import type { Store } from '../types/store'

const storageKey = 'prototype-smart-dialogue-demo.records'
const demoAiSummaryEnabled = true

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
  const normalizedBindingStatus = record.customerRelationStatus ?? record.customerBindingStatus ?? mockFallback?.customerBindingStatus ?? 'unbound'
  const normalizedStatus = normalizedAiStatus === 'failed'
    ? 'failed'
    : record.status === 'submitted' && normalizedBindingStatus !== 'bound'
      ? 'draft'
      : record.status
  let associatedMember = findMemberById(record.memberId, record.customerId)
  if (!associatedMember && normalizedBindingStatus === 'bound' && record.customerInfo.phone) {
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
    submitter: normalizedStatus === 'draft' ? '' : record.submitter ?? mockFallback?.submitter ?? '',
    primaryReceptionist: record.primaryReceptionist ?? mockFallback?.primaryReceptionist ?? record.receptionistName,
    coReceptionists: record.coReceptionists ?? mockFallback?.coReceptionists ?? [],
    recordingStartedAt: record.recordingStartedAt ?? mockFallback?.recordingStartedAt ?? record.receptionTime,
    recordingMethod: record.recordingMethod ?? mockFallback?.recordingMethod ?? record.method,
    status: normalizedStatus,
    customerBindingStatus: normalizedBindingStatus,
    memberId: record.memberId ?? mockFallback?.memberId ?? associatedMember?.id,
    customerId: record.customerId ?? mockFallback?.customerId ?? associatedMember?.customerId,
    customerName: record.customerName ?? record.customerInfo.name,
    customerPhone: record.customerPhone ?? record.customerInfo.phone,
    customerRelationStatus: normalizedBindingStatus,
    transcriptionStatus: record.transcriptionStatus ?? mockFallback?.transcriptionStatus ?? (record.transcript.length > 0 ? 'success' : 'failed'),
    aiStatus: normalizedAiStatus,
    recordingState: record.recordingState ?? 'idle',
    organizingProgress: record.organizingProgress ?? 100,
  }
}

function transcriptText(record: ReceptionRecord) {
  return record.transcript
    .map((line) => `${line.speaker}：${line.text}`)
    .join('\n')
}

function isStructuredContent(value: unknown): value is StructuredContent {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return false
  const content = value as Partial<StructuredContent>
  return structuredContentLabels.every(({ key }) => typeof content[key] === 'string' && Boolean(content[key]?.trim()))
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
      customerName: '',
      customerPhone: '',
      customerRelationStatus: 'unbound',
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

  const requestAiSummary = useCallback(async (recordId: string) => {
    const currentRecord = recordsRef.current.find((record) => record.id === recordId)
    if (!currentRecord) return

    if (demoAiSummaryEnabled) {
      updateRecord(recordId, {
        status: 'ready-for-review',
        recordingState: 'idle',
        organizingProgress: 100,
        transcriptionStatus: 'success',
        aiStatus: 'success',
      })
      organizingJobsRef.current.delete(recordId)
      return
    }

    try {
      const response = await fetch('/api/ai-summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transcript: transcriptText(currentRecord) }),
      })
      if (!response.ok) throw new Error('AI summary request failed')

      const payload = await response.json() as { aiContent?: unknown }
      if (!isStructuredContent(payload.aiContent)) throw new Error('AI summary response is invalid')

      updateRecord(recordId, {
        aiContent: payload.aiContent,
        status: 'ready-for-review',
        recordingState: 'idle',
        organizingProgress: 100,
        transcriptionStatus: 'success',
        aiStatus: 'success',
      })
    } catch {
      updateRecord(recordId, {
        status: 'failed',
        recordingState: 'idle',
        organizingProgress: 100,
        transcriptionStatus: 'success',
        aiStatus: 'failed',
      })
    } finally {
      organizingJobsRef.current.delete(recordId)
    }
  }, [updateRecord])

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
      updateRecord(recordId, { transcriptionStatus: 'success', aiStatus: 'pending' })
    }, 1200))
    timers.push(window.setTimeout(() => {
      updateRecord(recordId, { aiStatus: 'processing' })
      void requestAiSummary(recordId)
    }, 2200))
    organizingJobsRef.current.set(recordId, timers)
  }, [requestAiSummary, updateRecord])

  const startOrganizing = useCallback((recordId: string) => {
    const currentRecord = recordsRef.current.find((record) => record.id === recordId)
    if (currentRecord?.status !== 'processing') {
      updateRecord(recordId, {
        status: 'processing',
        recordingState: 'processing',
        organizingProgress: 0,
        transcriptionStatus: 'processing',
        aiStatus: 'pending',
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
