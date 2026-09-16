import type { EmployeeStoreScenario } from './types/store'

export const submitSuccessNoticeKey = 'prototype-smart-dialogue-demo.submit-success'

export const demoRoutes = {
  home: '#/home',
  records: '#/records',
  mobileRecords: '#/mobile/records',
  memberCenter: '#/member-center',
  mobileMemberDetail: (memberId: string, tab?: 'follow-up') => `#/member-center/members/${memberId}${tab ? '?tab=follow-up' : ''}`,
  mobileMemberDialogueDetail: (memberId: string, recordId: string) => `#/member-center/members/${memberId}/dialogue/${recordId}`,
  create: '#/records/new',
  recording: (recordId: string) => `#/records/${recordId}/recording`,
  organizing: (recordId: string) => `#/records/${recordId}/organizing`,
  confirm: (recordId: string) => `#/records/${recordId}/confirm`,
  edit: (recordId: string, moduleKey: string) => `#/records/${recordId}/edit/${moduleKey}`,
  detail: (recordId: string) => `#/records/${recordId}/detail`,
  adminRecords: '#/admin/records',
  adminDetail: (recordId: string) => `#/admin/records/${recordId}/detail`,
  adminDialogueRecords: '#/admin/dialogue-records',
  adminDialogueDetail: (recordId: string) => `#/admin/dialogue-records/${recordId}`,
  memberDetail: (memberId: string) => `#/admin/member-center/members/${memberId}`,
} as const

export type AppRoute =
  | { kind: 'home' }
  | { kind: 'records'; storeScenario?: EmployeeStoreScenario }
  | { kind: 'member-center'; initialPhone?: string }
  | { kind: 'mobile-member-detail'; memberId: string; initialTab?: 'follow-up' }
  | { kind: 'mobile-member-dialogue-detail'; memberId: string; recordId: string }
  | { kind: 'create' }
  | { kind: 'recording'; recordId: string }
  | { kind: 'organizing'; recordId: string }
  | { kind: 'confirm'; recordId: string }
  | { kind: 'edit'; recordId: string; moduleKey: string }
  | { kind: 'detail'; recordId: string; admin: boolean }
  | { kind: 'admin-records' }
  | { kind: 'admin-dialogue-records' }
  | { kind: 'admin-dialogue-detail'; recordId: string }
  | { kind: 'member-detail'; memberId: string }

export function parseRoute(hash: string): AppRoute {
  const path = (hash || demoRoutes.home).replace(/^#/, '')

  const [pathname, search = ''] = path.split('?')

  if (pathname === '/home' || pathname === '/') return { kind: 'home' }
  if (pathname === '/member-center') {
    const phone = new URLSearchParams(search).get('phone') ?? undefined
    return { kind: 'member-center', initialPhone: phone }
  }
  if (pathname === '/records') {
    const employee = new URLSearchParams(search).get('employee')
    return { kind: 'records', ...(employee === 'single' ? { storeScenario: 'single' as const } : {}) }
  }
  if (path === '/mobile/records') return { kind: 'records' }
  if (path === '/records/new') return { kind: 'create' }
  if (path === '/admin/records') return { kind: 'admin-records' }
  if (path === '/admin/dialogue-records') return { kind: 'admin-dialogue-records' }

  const mobileDialogueDetailMatch = pathname.match(/^\/member-center\/members\/([^/]+)\/dialogue\/([^/]+)$/)
  if (mobileDialogueDetailMatch) return { kind: 'mobile-member-dialogue-detail', memberId: mobileDialogueDetailMatch[1], recordId: mobileDialogueDetailMatch[2] }

  const mobileMemberDetailMatch = pathname.match(/^\/member-center\/members\/([^/]+)$/)
  if (mobileMemberDetailMatch) {
    const tab = new URLSearchParams(search).get('tab')
    return { kind: 'mobile-member-detail', memberId: mobileMemberDetailMatch[1], ...(tab === 'follow-up' ? { initialTab: 'follow-up' as const } : {}) }
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
  window.location.hash = route.replace(/^#/, '')
}
