import assert from 'node:assert/strict'
import test from 'node:test'
import handler from './ai-summary.ts'

type TestResponse = {
  statusCode: number
  payload: unknown
  status: (code: number) => TestResponse
  json: (value: unknown) => TestResponse
}

function createResponse(): TestResponse {
  const response = {
    statusCode: 200,
    payload: undefined as unknown,
    status(code: number) {
      response.statusCode = code
      return response
    },
    json(value: unknown) {
      response.payload = value
      return response
    },
  }
  return response
}

function setTokenHubEnv() {
  process.env.TOKENHUB_API_KEY = 'test-key'
  process.env.TOKENHUB_BASE_URL = 'https://tokenhub.example/v1'
  process.env.TOKENHUB_MODEL = 'hy3'
}

function clearTokenHubEnv() {
  delete process.env.TOKENHUB_API_KEY
  delete process.env.TOKENHUB_BASE_URL
  delete process.env.TOKENHUB_MODEL
}

const modelContent = JSON.stringify({
  summary: '客户希望改善肩颈不适。',
  customer_info: '未明确提及',
  body_condition: '久坐后肩颈酸痛。',
  customer_need: '希望改善肩颈不适。',
  intention_project: '未明确提及',
  concern: '未明确提及',
  communication_result: '完成基础沟通。',
  follow_up_suggestion: '未明确提及',
})

test('正常 JSON 返回时映射 8 个页面字段', async () => {
  setTokenHubEnv()
  const originalFetch = globalThis.fetch
  globalThis.fetch = async () => new Response(JSON.stringify({ choices: [{ message: { content: modelContent } }] }), { status: 200 })

  try {
    const response = createResponse()
    await handler({ method: 'POST', body: { transcript: '客户说肩颈酸痛。' } }, response)
    assert.equal(response.statusCode, 200)
    assert.deepEqual(response.payload, {
      aiContent: {
        summary: '客户希望改善肩颈不适。',
        customerProfile: '未明确提及',
        bodyCondition: '久坐后肩颈酸痛。',
        customerNeeds: '希望改善肩颈不适。',
        intendedProject: '未明确提及',
        concerns: '未明确提及',
        communicationResult: '完成基础沟通。',
        followUpSuggestion: '未明确提及',
      },
    })
  } finally {
    globalThis.fetch = originalFetch
    clearTokenHubEnv()
  }
})

test('模型返回字段缺失时返回统一失败', async () => {
  setTokenHubEnv()
  const originalFetch = globalThis.fetch
  globalThis.fetch = async () => new Response(JSON.stringify({ choices: [{ message: { content: JSON.stringify({ summary: '只有一项' }) } }] }), { status: 200 })

  try {
    const response = createResponse()
    await handler({ method: 'POST', body: { transcript: '一段文字稿' } }, response)
    assert.equal(response.statusCode, 502)
    assert.deepEqual(response.payload, { error: '识别异常，请稍后重试或联系技术人员。' })
  } finally {
    globalThis.fetch = originalFetch
    clearTokenHubEnv()
  }
})

test('模型返回非法 JSON 时返回统一失败', async () => {
  setTokenHubEnv()
  const originalFetch = globalThis.fetch
  globalThis.fetch = async () => new Response(JSON.stringify({ choices: [{ message: { content: '不是 JSON' } }] }), { status: 200 })

  try {
    const response = createResponse()
    await handler({ method: 'POST', body: { transcript: '一段文字稿' } }, response)
    assert.equal(response.statusCode, 502)
    assert.deepEqual(response.payload, { error: '识别异常，请稍后重试或联系技术人员。' })
  } finally {
    globalThis.fetch = originalFetch
    clearTokenHubEnv()
  }
})

test('空 transcript 被拒绝且不会调用 TokenHub', async () => {
  const originalFetch = globalThis.fetch
  let callCount = 0
  globalThis.fetch = async () => {
    callCount += 1
    return new Response('{}', { status: 500 })
  }

  try {
    const response = createResponse()
    await handler({ method: 'POST', body: { transcript: '   ' } }, response)
    assert.equal(response.statusCode, 400)
    assert.equal(callCount, 0)
  } finally {
    globalThis.fetch = originalFetch
  }
})

test('TokenHub 请求失败时返回统一失败', async () => {
  setTokenHubEnv()
  const originalFetch = globalThis.fetch
  globalThis.fetch = async () => {
    throw new Error('network failure')
  }

  try {
    const response = createResponse()
    await handler({ method: 'POST', body: { transcript: '一段文字稿' } }, response)
    assert.equal(response.statusCode, 502)
    assert.deepEqual(response.payload, { error: '识别异常，请稍后重试或联系技术人员。' })
  } finally {
    globalThis.fetch = originalFetch
    clearTokenHubEnv()
  }
})

