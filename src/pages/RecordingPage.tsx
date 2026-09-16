import { useEffect, useMemo, useRef, useState } from 'react'
import { MobileShell } from '../components/MobileShell'
import { formatDuration } from '../components/RecordingFloatingWindow'
import { mockTranscriptLines } from '../data/mockTranscript'
import { demoRoutes, navigate } from '../routes'
import { useReceptionRecords } from '../store/ReceptionRecordsContext'
import type { RecordingState } from '../types/record'

export function RecordingPage({ recordId }: { recordId: string }) {
  const { getRecord, updateRecord, startOrganizing } = useReceptionRecords()
  const record = getRecord(recordId)
  const initialDuration = record?.durationSeconds ?? 0
  const [durationSeconds, setDurationSeconds] = useState(initialDuration)
  const durationRef = useRef(initialDuration)
  const transcriptIndexRef = useRef(record?.transcript.length ?? 0)
  const state: RecordingState = record?.recordingState ?? 'idle'

  useEffect(() => {
    transcriptIndexRef.current = record?.transcript.length ?? 0
  }, [record?.id])

  useEffect(() => {
    if (state !== 'recording') return
    const timer = window.setInterval(() => {
      durationRef.current += 1
      setDurationSeconds(durationRef.current)
    }, 1000)
    return () => window.clearInterval(timer)
  }, [state])

  useEffect(() => {
    if (!record || state !== 'recording') return
    const appendTranscript = () => {
      const nextLine = mockTranscriptLines[transcriptIndexRef.current]
      if (!nextLine) return
      const currentRecord = getRecord(record.id)
      if (!currentRecord) return
      transcriptIndexRef.current += 1
      updateRecord(record.id, { transcript: [...currentRecord.transcript, nextLine] })
    }
    const timer = window.setInterval(appendTranscript, 1600)
    return () => window.clearInterval(timer)
  }, [getRecord, record?.id, state, updateRecord])

  const visibleTranscript = useMemo(() => {
    if (!record) return []
    return state === 'recording' || state === 'paused' ? record.transcript : []
  }, [record, state])

  const speakerLabels = useMemo(() => {
    const labels = new Map<string, string>()
    record?.transcript.forEach((line) => {
      if (!labels.has(line.speaker)) labels.set(line.speaker, `说话人${labels.size + 1}`)
    })
    return labels
  }, [record])

  if (!record) {
    return (
      <MobileShell title="录音采集" onBack={() => navigate(demoRoutes.create)}>
        <section className="empty-state"><h2>记录不存在</h2><p>请返回列表重新开始记录。</p></section>
      </MobileShell>
    )
  }

  const methodLabel = record.method === 'face-to-face' ? '面客模式' : '事后补录'
  const isRecording = state === 'recording'
  const isPaused = state === 'paused'
  const isProcessing = state === 'processing'

  const startRecording = () => {
    const recordingStartedAt = record.recordingStartedAt || formatDateTime(new Date())
    transcriptIndexRef.current = 0
    updateRecord(record.id, { recordingState: 'recording', recordingStartedAt, receptionTime: recordingStartedAt, transcriptionStatus: 'processing', aiStatus: 'pending', transcript: [] })
  }
  const pauseRecording = () => updateRecord(record.id, { recordingState: 'paused', durationSeconds: durationRef.current })
  const resumeRecording = () => updateRecord(record.id, { recordingState: 'recording' })
  const endRecording = () => {
    updateRecord(record.id, { durationSeconds: durationRef.current })
    startOrganizing(record.id)
    navigate(demoRoutes.organizing(record.id))
  }
  const minimizeRecording = () => {
    updateRecord(record.id, { durationSeconds: durationRef.current })
    navigate(demoRoutes.records)
  }

  return (
    <MobileShell
      title="录音采集"
      onBack={() => navigate(demoRoutes.create)}
      topbarAction={(isRecording || isPaused) ? <button className="topbar-text-action" type="button" onClick={minimizeRecording}>收起</button> : undefined}
      fixedFooter={
        state === 'idle' ? (
          <button className="primary-button primary-button--large" type="button" onClick={startRecording}>开始录音</button>
        ) : (isRecording || isPaused) ? (
          <div className="recording-fixed-actions">
            <button className="secondary-button" type="button" onClick={isRecording ? pauseRecording : resumeRecording}>{isRecording ? '暂停' : '继续录音'}</button>
            <button className="primary-button primary-button--large" type="button" onClick={endRecording}>结束录音</button>
          </div>
        ) : (
          <div className="processing-note">录音已结束，即将进入 AI 整理…</div>
        )
      }
    >
      <section className={`recording-hero recording-hero--${state}`}>
        <p className="recording-context">{methodLabel} · {record.storeName}</p>
        <div className="recording-hero__status">
          <span className={isRecording ? 'recording-pulse is-on' : 'recording-pulse'} />
          <strong>{isProcessing ? '正在整理' : isPaused ? '已暂停' : isRecording ? '正在录音' : '准备开始'}</strong>
        </div>
        <div className="recording-timer">{formatDuration(durationSeconds)}</div>
        <p>{isProcessing ? '正在准备 AI 整理结果…' : '智能对话采集中，内容将用于生成接待记录'}</p>
        <div className={`waveform ${isRecording ? 'is-animated' : ''}`} aria-label="录音声波">
          {Array.from({ length: 24 }, (_, index) => <i key={index} style={{ height: `${16 + ((index * 17) % 42)}px` }} />)}
        </div>
      </section>

      <section className="transcript-section">
        <div className="section-heading">
          <div><span className="section-kicker">实时转写</span><h2>沟通内容</h2></div>
        </div>
        {visibleTranscript.length === 0 ? (
          <div className="transcript-empty">点击“开始录音”后显示实时转写</div>
        ) : (
          <div className="transcript-container">
            <div className="transcript-list">
              {visibleTranscript.map((line, index) => (
                <article className="transcript-line" key={`${line.speaker}-${index}`}>
                  <time>{formatTranscriptTime(Math.min(durationSeconds, index * 2 + 1))}</time>
                  <strong className="speaker">{speakerLabels.get(line.speaker) ?? '说话人1'}</strong>
                  <p>{line.text}</p>
                </article>
              ))}
            </div>
          </div>
        )}
      </section>

    </MobileShell>
  )
}

function formatTranscriptTime(totalSeconds: number) {
  return `${String(Math.floor(totalSeconds / 60)).padStart(2, '0')}:${String(totalSeconds % 60).padStart(2, '0')}`
}

function formatDateTime(date: Date) {
  const datePart = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
  const timePart = `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
  return `${datePart} ${timePart}`
}
