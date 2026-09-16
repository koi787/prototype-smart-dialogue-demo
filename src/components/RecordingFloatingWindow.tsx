import type { RecordingState } from '../types/record'

type RecordingFloatingWindowProps = {
  state: RecordingState
  durationSeconds: number
  onExpand: () => void
  onPause: () => void
  onResume: () => void
  onEnd: () => void
}

function stateLabel(state: RecordingState) {
  if (state === 'paused') return '已暂停'
  if (state === 'processing') return '整理中'
  return '录音中'
}

export function RecordingFloatingWindow({
  state,
  durationSeconds,
  onExpand,
  onPause,
  onResume,
  onEnd,
}: RecordingFloatingWindowProps) {
  const isRecording = state === 'recording'

  return (
    <aside className="recording-float" aria-label="录音悬浮窗">
      <button className="recording-float__main" type="button" onClick={onExpand}>
        <span className={isRecording ? 'recording-pulse is-on' : 'recording-pulse'} />
        <span>
          <strong>{formatDuration(durationSeconds)}</strong>
          <small>{stateLabel(state)}</small>
        </span>
      </button>
      {state !== 'processing' && (
        <button className="recording-float__action" type="button" onClick={isRecording ? onPause : onResume}>
          {isRecording ? '暂停' : '继续录音'}
        </button>
      )}
      {state !== 'processing' && (
        <button className="recording-float__action recording-float__action--end" type="button" onClick={onEnd}>
          结束录音
        </button>
      )}
    </aside>
  )
}

export function formatDuration(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60).toString().padStart(2, '0')
  const seconds = (totalSeconds % 60).toString().padStart(2, '0')
  return `${minutes}:${seconds}`
}
