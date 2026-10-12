import assert from 'node:assert/strict'
import test from 'node:test'
import { createAndAssociateMockMember, createMockMember, mockMembers } from '../src/data/mockMembers.ts'

test('新增 Mock 用户生成双身份 ID 并保存门店归属', () => {
  const member = createMockMember('  新增体验用户  ', '13123456789', 'guomao', '奥本瑜伽 · 国贸店')

  try {
    assert.ok(member.id)
    assert.ok(member.customerId)
    assert.equal(member.name, '新增体验用户')
    assert.equal(member.phone, '13123456789')
    assert.equal(member.storeId, 'guomao')
    assert.equal(mockMembers.includes(member), true)
  } finally {
    const index = mockMembers.findIndex((item) => item.id === member.id)
    if (index >= 0) mockMembers.splice(index, 1)
  }
})

test('新增用户手机号跨门店全局唯一，重复号码不创建新用户', () => {
  assert.throws(
    () => createMockMember('其他门店重复手机号', '13910002001', 'guomao', '奥本瑜伽 · 国贸店'),
    /手机号已存在/,
  )
})

test('创建校验失败时不产生用户记录', () => {
  const countBefore = mockMembers.length

  assert.throws(
    () => createMockMember('格式错误测试', '12345', 'guomao', '奥本瑜伽 · 国贸店'),
    /请输入正确的手机号/,
  )
  assert.equal(mockMembers.length, countBefore)
})

test('创建成功但关联异常时保留新用户身份，重复尝试不会再次创建', () => {
  const phone = '13234567890'
  const result = createAndAssociateMockMember('关联异常测试', phone, 'guomao', '奥本瑜伽 · 国贸店', () => {
    throw new Error('record update failed')
  })

  try {
    assert.equal(result.associationError instanceof Error, true)
    assert.ok(result.member.id)
    assert.ok(result.member.customerId)
    assert.equal(mockMembers.includes(result.member), true)
    assert.throws(
      () => createMockMember('关联异常测试', phone, 'guomao', '奥本瑜伽 · 国贸店'),
      /手机号已存在/,
    )
  } finally {
    const index = mockMembers.findIndex((item) => item.id === result.member.id)
    if (index >= 0) mockMembers.splice(index, 1)
  }
})
