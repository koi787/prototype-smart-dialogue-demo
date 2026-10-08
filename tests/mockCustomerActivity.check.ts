import assert from 'node:assert/strict'
import test from 'node:test'
import { mockMembers } from '../src/data/mockMembers.ts'
import { filterAssignedCustomers, getCustomerBusinessStatus } from '../src/data/mockCustomerActivity.ts'
import { parseRoute } from '../src/routes.ts'

test('到店与成交状态按课程完成、正式课程购买分别推导', () => {
  assert.deepEqual(getCustomerBusinessStatus('customer-001'), { visited: true, converted: false })
  assert.deepEqual(getCustomerBusinessStatus('customer-chen'), { visited: true, converted: true })
  assert.deepEqual(getCustomerBusinessStatus('customer-wang'), { visited: false, converted: false })
  assert.deepEqual(getCustomerBusinessStatus('customer-zhao'), { visited: false, converted: false })
  assert.deepEqual(getCustomerBusinessStatus('customer-liu'), { visited: false, converted: true })
  assert.deepEqual(getCustomerBusinessStatus('customer-zheng'), { visited: false, converted: false })
})

test('门店、姓名/手机号搜索、到店与成交条件组合筛选', () => {
  const matched = filterAssignedCustomers(mockMembers, {
    storeId: 'guomao',
    query: '李',
    visit: 'visited',
    deal: 'not-converted',
  })
  assert.deepEqual(matched.map((member) => member.customerId), ['customer-001'])

  const phoneMatch = filterAssignedCustomers(mockMembers, {
    storeId: 'guomao',
    query: '18344639949',
    visit: 'all',
    deal: 'all',
  })
  assert.deepEqual(phoneMatch.map((member) => member.id), ['member-chen'])
})

test('客户列表严格限定当前门店，体验课购买不计为成交', () => {
  const storeMembers = filterAssignedCustomers(mockMembers, { storeId: 'guomao' })
  assert.ok(storeMembers.every((member) => member.storeId === 'guomao'))
  assert.deepEqual(getCustomerBusinessStatus('customer-zhao'), { visited: false, converted: false })
})

test('客户经营首页、历史记录状态入口和客户详情返回来源路由可解析', () => {
  assert.equal(parseRoute('#/records').kind, 'records')
  assert.deepEqual(parseRoute('#/records/history?status=pending'), { kind: 'record-history', initialStatus: 'pending' })
  assert.deepEqual(parseRoute('#/member-center/members/member-chen?from=records'), { kind: 'mobile-member-detail', memberId: 'member-chen', backToRecords: true })
})
