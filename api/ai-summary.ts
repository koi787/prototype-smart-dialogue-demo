import type { StructuredContent } from '../src/types/record'

declare const process: {
  env: Record<string, string | undefined>
}

const MAX_TRANSCRIPT_LENGTH = 12_000
const DEFAULT_TIMEOUT_MS = 120_000
const PUBLIC_ERROR_MESSAGE = '识别异常，请稍后重试或联系技术人员。'

type ApiRequest = {
  method?: string
  body?: unknown
}

type ApiResponse = {
  status: (code: number) => ApiResponse
  json: (payload: unknown) => unknown
}

type ModelField = {
  modelKey: string
  recordKey: keyof StructuredContent
}

const MODEL_FIELDS: ModelField[] = [
  { modelKey: 'summary', recordKey: 'summary' },
  { modelKey: 'customer_info', recordKey: 'customerProfile' },
  { modelKey: 'body_condition', recordKey: 'bodyCondition' },
  { modelKey: 'customer_need', recordKey: 'customerNeeds' },
  { modelKey: 'intention_project', recordKey: 'intendedProject' },
  { modelKey: 'concern', recordKey: 'concerns' },
  { modelKey: 'communication_result', recordKey: 'communicationResult' },
  { modelKey: 'follow_up_suggestion', recordKey: 'followUpSuggestion' },
]

type TokenHubConfig = {
  apiKey: string
  baseUrl: string
  model: string
  timeoutMs: number
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function parseJson(value: string): unknown | null {
  try {
    return JSON.parse(value) as unknown
  } catch {
    return null
  }
}

export function extractJsonValue(content: string): unknown | null {
  const trimmed = content.trim()
  const codeBlockMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)\s*```/i)
  if (codeBlockMatch?.[1]) {
    const codeBlockValue = parseJson(codeBlockMatch[1].trim())
    if (codeBlockValue !== null) return codeBlockValue
  }

  const directValue = parseJson(trimmed)
  if (directValue !== null) return directValue

  const firstBrace = trimmed.indexOf('{')
  const lastBrace = trimmed.lastIndexOf('}')
  if (firstBrace < 0 || lastBrace <= firstBrace) return null
  return parseJson(trimmed.slice(firstBrace, lastBrace + 1))
}

export function normalizeStructuredContent(value: unknown): StructuredContent | null {
  if (!isRecord(value)) return null

  const normalized = {} as StructuredContent
  for (const field of MODEL_FIELDS) {
    const rawValue = value[field.modelKey]
    if (typeof rawValue !== 'string') return null
    normalized[field.recordKey] = rawValue.trim() || '未明确提及'
  }
  return normalized
}

function buildSystemPrompt() {
  return `你是门店接待记录整理助手。

请严格根据输入的接待文字稿，整理出一个 JSON 对象。只能使用文字稿中明确出现的信息，不得编造客户身份、年龄、项目、金额、时间、结论或承诺。没有明确提及时，字段值使用“未明确提及”。

只返回合法 JSON，不要返回 Markdown、解释或 JSON 以外的文字。JSON 必须包含且只需包含以下 8 个字符串字段：
{
  "summary": "一句话总结",
  "customer_info": "客户基础信息",
  "body_condition": "身体情况",
  "customer_need": "客户需求",
  "intention_project": "意向项目",
  "concern": "主要顾虑",
  "communication_result": "沟通结果",
  "follow_up_suggestion": "后续建议"
}`
}

function buildUserPrompt(transcript: string) {
  return `接待文字稿：
---
${transcript}
---

请根据以上文字稿输出指定 JSON。`
}

function readConfig(): TokenHubConfig | null {
  const apiKey = process.env.TOKENHUB_API_KEY?.trim()
  const baseUrl = process.env.TOKENHUB_BASE_URL?.trim().replace(/\/+$/, '')
  const model = process.env.TOKENHUB_MODEL?.trim()
  const configuredTimeout = Number(process.env.TOKENHUB_TIMEOUT_MS?.trim() || DEFAULT_TIMEOUT_MS)

  if (!apiKey || !baseUrl || !model) return null
  return {
    apiKey,
    baseUrl,
    model,
    timeoutMs: Number.isFinite(configuredTimeout) && configuredTimeout > 0 ? configuredTimeout : DEFAULT_TIMEOUT_MS,
  }
}

function requestBody(body: unknown): unknown {
  if (typeof body !== 'string') return body
  return parseJson(body)
}

function readTranscript(body: unknown): string | null {
  const parsed = requestBody(body)
  if (!isRecord(parsed) || typeof parsed.transcript !== 'string') return null
  const transcript = parsed.transcript.trim()
  if (!transcript || transcript.length > MAX_TRANSCRIPT_LENGTH) return null
  return transcript
}

async function callTokenHub(transcript: string, config: TokenHubConfig): Promise<StructuredContent> {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), config.timeoutMs)

  try {
    const response = await fetch(`${config.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${config.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: config.model,
        stream: false,
        temperature: 0.2,
        messages: [
          { role: 'system', content: buildSystemPrompt() },
          { role: 'user', content: buildUserPrompt(transcript) },
        ],
      }),
      signal: controller.signal,
    })

    if (!response.ok) throw new Error('TokenHub request failed')

    const data = await response.json() as {
      choices?: Array<{ message?: { content?: unknown } }>
    }
    const content = data.choices?.[0]?.message?.content
    if (typeof content !== 'string') throw new Error('TokenHub response missing content')

    const parsed = extractJsonValue(content)
    const normalized = normalizeStructuredContent(parsed)
    if (!normalized) throw new Error('TokenHub response has invalid fields')
    return normalized
  } finally {
    clearTimeout(timeoutId)
  }
}

export default async function handler(request: ApiRequest, response: ApiResponse) {
  if (request.method !== 'POST') {
    return response.status(405).json({ error: PUBLIC_ERROR_MESSAGE })
  }

  const transcript = readTranscript(request.body)
  if (!transcript) {
    return response.status(400).json({ error: PUBLIC_ERROR_MESSAGE })
  }

  const config = readConfig()
  if (!config) {
    return response.status(503).json({ error: PUBLIC_ERROR_MESSAGE })
  }

  try {
    const aiContent = await callTokenHub(transcript, config)
    return response.status(200).json({ aiContent })
  } catch {
    return response.status(502).json({ error: PUBLIC_ERROR_MESSAGE })
  }
}

