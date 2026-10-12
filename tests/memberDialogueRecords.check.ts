import assert from 'node:assert/strict'
import test from 'node:test'
import { getMemberDialogueRecords } from '../src/data/preselectedCustomer.ts'
import { mockMembers } from '../src/data/mockMembers.ts'
import { mockRecords } from '../src/data/mockRecords.ts'

test('客户跟进信息只选取当前客户已提交且双 ID 一致的智能对话，并按接待时间倒序', () => {
  const member = mockMembers.find((item) => item.id === 'member-001')!
  const records = getMemberDialogueRecords(mockRecords, member)

  assert.deepEqual(records.map((record) => record.id), ['record-001', 'record-005'])
  assert.ok(records.every((record) => record.status === 'submitted'))
  assert.ok(records.every((record) => record.memberId === member.id && record.customerId === member.customerId))
})

test('客户跟进信息过滤排除草稿、未关联记录和其他客户记录，同时兼容单 ID 旧记录', () => {
  const member = mockMembers.find((item) => item.id === 'member-001')!
  const base = mockRecords[0]
  const records = getMemberDialogueRecords([
    { ...base, id: 'draft', status: 'draft' },
    { ...base, id: 'ready-for-review', status: 'ready-for-review' },
    { ...base, id: 'processing', status: 'processing' },
    { ...base, id: 'failed', status: 'failed' },
    { ...base, id: 'unbound', customerBindingStatus: 'unbound' },
    { ...base, id: 'foreign', memberId: 'member-chen', customerId: 'customer-chen' },
    { ...base, id: 'mismatched', memberId: member.id, customerId: 'customer-chen' },
    { ...base, id: 'legacy-member-only', customerId: undefined },
  ], member)

  assert.deepEqual(records.map((record) => record.id), ['legacy-member-only'])
  assert.deepEqual(getMemberDialogueRecords(mockRecords, undefined), [])
})
