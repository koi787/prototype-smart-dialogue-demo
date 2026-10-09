import type { EmployeeStoreScenario } from './types/store'
import type { RecordingMethod } from './types/record'

export const recordFeedbackNoticeKey = 'prototype-smart-dialogue-demo.record-feedback'

export type DemoMode = 'mobile' | 'admin'

export const demoRoutes = {
  home: '#/home',
  records: '#/records',
  recordHistory: (status: 'all' | 'processing' | 'pending' | 'submitted' = 'all') => `#/records/history?status=${status}`,
  mobileRecords: '#/mobile/records',
  memberCenter: '#/member-center',
  mobileMemberDetail: (memberId: string, tab?: 'follow-up', source?: 'records') => `#/member-center/members/${memberId}${tab || source ? `?${[tab ? 'tab=follow-up' : '', source ? 'from=records' : ''].filter(Boolean).join('&')}` : ''}`,
  mobileMemberDialogueDetail: (memberId: string, recordId: string) => `#/member-center/members/${memberId}/dialogue/${recordId}`,
  create: '#/records/new',
  createWithMethod: (method: RecordingMethod) => `#/records/new?method=${method}`,
  createForCustomer: (customerId: string, method?: RecordingMethod) => `#/records/new?customerId=${encodeURIComponent(customerId)}${method ? `&method=${method}` : ''}`,
  recording: (recordId: string) => `#/records/${recordId}/recording`,
  organizing: (recordId: string) => `#/records/${recordId}/organizing`,
  confirm: (recordId: string) => `#/records/${recordId}/confirm`,
  edit: (recordId: string, moduleKey: string) => `#/records/${recordId}/edit/${moduleKey}`,
  detail: (recordId: string) => `#/records/${recordId}/detail`,
  adminRecords: '#/admin/records',
  adminDetail: (recordId: string) => `#/admin/records/${recordId}/detail`,
  adminDialogueRecords: '#/admin/dialogue-records',
  adminDialogueDetail: (recordId: string) => `#/admin/dialogue-records/${recordId}`,
  adminMemberList: '#/admin/member-center',
  memberDetail: (memberId: string) => `#/admin/member-center/members/${memberId}`,
} as const

export type AppRoute =
  | { kind: 'home' }
  | { kind: 'records'; storeScenario?: EmployeeStoreScenario }
  | { kind: 'record-history'; storeScenario?: EmployeeStoreScenario; initialStatus?: 'all' | 'processing' | 'pending' | 'submitted' }
  | { kind: 'member-center'; initialPhone?: string }
  | { kind: 'mobile-member-detail'; memberId: string; initialTab?: 'follow-up'; backToRecords?: boolean }
  | { kind: 'mobile-member-dialogue-detail'; memberId: string; recordId: string }
  | { kind: 'create'; preselectedCustomerId?: string; initialMethod?: RecordingMethod }
  | { kind: 'recording'; recordId: string }
  | { kind: 'organizing'; recordId: string }
  | { kind: 'confirm'; recordId: string }
  | { kind: 'edit'; recordId: string; moduleKey: string }
  | { kind: 'detail'; recordId: string; admin: boolean }
  | { kind: 'admin-records' }
  | { kind: 'admin-dialogue-records' }
  | { kind: 'admin-dialogue-detail'; recordId: string }
  | { kind: 'admin-customer-list' }
  | { kind: 'member-detail'; memberId: string }

function isAdminPath(path: string) {
  return path.replace(/^#/, '').split('?')[0].startsWith('/admin/')
}

export function isEmbedMode(search = window.location.search) {
  return new URLSearchParams(search).get('embed') === '1'
}

export function getEmbedMode(hash = window.location.hash, search = window.location.search): DemoMode | null {
  if (!isEmbedMode(search)) return null
  return isAdminPath(hash) ? 'admin' : 'mobile'
}

export function getHashMode(hash: string): DemoMode {
  return isAdminPath(hash) ? 'admin' : 'mobile'
}

export function getEmbedEntryRoute(mode: DemoMode) {
  return mode === 'admin' ? demoRoutes.adminDialogueRecords : demoRoutes.records
}

export function isRouteAllowedInMode(route: string, mode: DemoMode) {
  return getHashMode(route) === mode
}

export function parseRoute(hash: string): AppRoute {
  const path = (hash || demoRoutes.home).replace(/^#/, '')

  const [pathname, search = ''] = path.split('?')

  if (pathname === '/home' || pathname === '/') return { kind: 'home' }
  if (pathname === '/member-center') {
    const phone = new URLSearchParams(search).get('phone') ?? undefined
    return { kind: 'member-center', initialPhone: phone }
  }
  if (pathname === '/records/history') {
    const params = new URLSearchParams(search)
    const employee = params.get('employee')
    const status = params.get('status')
    const validStatus = status === 'all' || status === 'processing' || status === 'pending' || status === 'submitted' ? status : undefined
    return { kind: 'record-history', ...(employee === 'single' ? { storeScenario: 'single' as const } : {}), initialStatus: validStatus ?? 'all' }
  }
  if (pathname === '/records') {
    const employee = new URLSearchParams(search).get('employee')
    return { kind: 'records', ...(employee === 'single' ? { storeScenario: 'single' as const } : {}) }
  }
  if (path === '/mobile/records') return { kind: 'records' }
  if (pathname === '/records/new') {
    const params = new URLSearchParams(search)
    const customerId = params.get('customerId') ?? undefined
    const method = params.get('method')
    const initialMethod = method === 'face-to-face' || method === 'afterwards' ? method : undefined
    return { kind: 'create', ...(customerId ? { preselectedCustomerId: customerId } : {}), ...(initialMethod ? { initialMethod } : {}) }
  }
  if (path === '/admin/records') return { kind: 'admin-records' }
  if (path === '/admin/dialogue-records') return { kind: 'admin-dialogue-records' }
  if (path === '/admin/member-center') return { kind: 'admin-customer-list' }

  const mobileDialogueDetailMatch = pathname.match(/^\/member-center\/members\/([^/]+)\/dialogue\/([^/]+)$/)
  if (mobileDialogueDetailMatch) return { kind: 'mobile-member-dialogue-detail', memberId: mobileDialogueDetailMatch[1], recordId: mobileDialogueDetailMatch[2] }

  const mobileMemberDetailMatch = pathname.match(/^\/member-center\/members\/([^/]+)$/)
  if (mobileMemberDetailMatch) {
    const params = new URLSearchParams(search)
    const tab = params.get('tab')
    return { kind: 'mobile-member-detail', memberId: mobileMemberDetailMatch[1], ...(tab === 'follow-up' ? { initialTab: 'follow-up' as const } : {}), ...(params.get('from') === 'records' ? { backToRecords: true } : {}) }
  }

  const memberDetailMatch = pathname.match(/^\/admin\/member-center\/members\/([^/]+)$/)
  if (memberDetailMatch) return { kind: 'member-detail', memberId: memberDetailMatch[1] }

  const dialogueDetailMatch = pathname.match(/^\/admin\/dialogue-records\/([^/]+)$/)
  if (dialogueDetailMatch) return { kind: 'admin-dialogue-detail', recordId: dialogueDetailMatch[1] }

  const recordMatch = pathname.match(/^\/(admin\/)?records\/([^/]+)\/(recording|organizing|confirm|edit|detail)(?:\/([^/]+))?$/)
  if (recordMatch) {
    if (recordMatch[3] === 'recording') return { kind: 'recording', recordId: recordMatch[2] }
    if (recordMatch[3] === 'organizing') return { kind: 'organizing', recordId: recordMatch[2] }
    if (recordMatch[3] === 'confirm') return { kind: 'confirm', recordId: recordMatch[2] }
    if (recordMatch[3] === 'edit' && recordMatch[4]) return { kind: 'edit', recordId: recordMatch[2], moduleKey: recordMatch[4] }
    return { kind: 'detail', recordId: recordMatch[2], admin: Boolean(recordMatch[1]) }
  }

  return { kind: 'home' }
}

export function navigate(route: string) {
  const embedMode = getEmbedMode()
  if (embedMode && !isRouteAllowedInMode(route, embedMode)) return
  window.location.hash = route.replace(/^#/, '')
}
