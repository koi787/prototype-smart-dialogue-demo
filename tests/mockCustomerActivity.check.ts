import assert from 'node:assert/strict'
import test from 'node:test'
import { findMemberById, isMemberInCandidateSet, mockMembers, searchMembers } from '../src/data/mockMembers.ts'
import { filterAssignedCustomers, getCustomerBusinessStatus } from '../src/data/mockCustomerActivity.ts'
import { canEditCustomerInformation, isPreselectedCustomerRelationIntact } from '../src/data/preselectedCustomer.ts'
import { createReceptionRecord } from '../src/data/createReceptionRecord.ts'
import { mockStores } from '../src/data/mockStores.ts'
import { getRecordFeedbackMessage } from '../src/data/recordFeedback.ts'
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

test('手动绑定搜索复用当前门店归属范围，并支持姓名、完整手机号和后四位匹配', () => {
  const guomaoMembers = filterAssignedCustomers(mockMembers, { storeId: 'guomao' })
  assert.deepEqual(searchMembers('李', guomaoMembers).map((member) => member.customerId), ['customer-001'])
  assert.deepEqual(searchMembers('陈', guomaoMembers).map((member) => member.customerId), ['customer-chen'])
  assert.deepEqual(searchMembers('18344639949', guomaoMembers).map((member) => member.id), ['member-chen'])
  assert.deepEqual(searchMembers('9949', guomaoMembers).map((member) => member.id), ['member-chen'])
  assert.equal(searchMembers('女士', guomaoMembers).length > 1, true)
  assert.equal(searchMembers('女士', guomaoMembers).every((member) => guomaoMembers.some((source) => source.id === member.id)), true)
  assert.deepEqual(searchMembers('王', guomaoMembers), [])
  assert.deepEqual(searchMembers('不存在的客户', guomaoMembers), [])
})

test('手动绑定选择校验阻止跨门店或伪造的 customerId，切换门店后候选范围更新', () => {
  const guomaoMembers = filterAssignedCustomers(mockMembers, { storeId: 'guomao' })
  const sanlitunMembers = filterAssignedCustomers(mockMembers, { storeId: 'sanlitun' })
  const wang = mockMembers.find((member) => member.customerId === 'customer-wang')!
  const forgedWang = { ...wang, customerId: 'customer-forged' }

  assert.equal(isMemberInCandidateSet(wang, guomaoMembers), false)
  assert.equal(isMemberInCandidateSet(wang, sanlitunMembers), true)
  assert.equal(isMemberInCandidateSet(forgedWang, sanlitunMembers), false)
  assert.deepEqual(searchMembers('王', guomaoMembers), [])
  assert.deepEqual(searchMembers('王', sanlitunMembers).map((member) => member.customerId), ['customer-wang'])
})

test('同名及手机号后四位相同的候选仍分别返回，门店过滤不删除历史客户主档', () => {
  const sameNameAndSuffix = [
    { ...mockMembers[2], id: 'test-member-a', customerId: 'test-customer-a', name: '同名客户', phone: '13910002001' },
    { ...mockMembers[3], id: 'test-member-b', customerId: 'test-customer-b', name: '同名客户', phone: '13710002001' },
  ]
  assert.deepEqual(searchMembers('同名', sameNameAndSuffix).map((member) => member.id), ['test-member-a', 'test-member-b'])
  assert.deepEqual(searchMembers('2001', sameNameAndSuffix).map((member) => member.id), ['test-member-a', 'test-member-b'])

  const chen = mockMembers.find((member) => member.customerId === 'customer-chen')!
  const sanlitunMembers = filterAssignedCustomers(mockMembers, { storeId: 'sanlitun' })
  assert.equal(isMemberInCandidateSet(chen, sanlitunMembers), false)
  assert.equal(findMemberById(chen.id, chen.customerId)?.customerId, chen.customerId)
})

test('客户经营首页、历史记录状态入口和客户详情返回来源路由可解析', () => {
  assert.equal(parseRoute('#/records').kind, 'records')
  assert.deepEqual(parseRoute('#/records/history?status=pending'), { kind: 'record-history', initialStatus: 'pending' })
  assert.deepEqual(parseRoute('#/member-center/members/member-chen?from=records'), { kind: 'mobile-member-detail', memberId: 'member-chen', backToRecords: true })
})

test('客户列表新增接待通过 customerId 进入模式选择页', () => {
  assert.deepEqual(parseRoute('#/records/new?customerId=customer-wang'), {
    kind: 'create',
    preselectedCustomerId: 'customer-wang',
  })
})

test('全新记录默认不携带模式，录音返回路由可恢复当前模式及预选客户', () => {
  assert.deepEqual(parseRoute('#/records/new'), { kind: 'create' })
  assert.deepEqual(parseRoute('#/records/new?method=face-to-face'), { kind: 'create', initialMethod: 'face-to-face' })
  assert.deepEqual(parseRoute('#/records/new?customerId=customer-wang'), { kind: 'create', preselectedCustomerId: 'customer-wang' })
  assert.deepEqual(parseRoute('#/records/new?customerId=customer-wang&method=face-to-face'), {
    kind: 'create',
    preselectedCustomerId: 'customer-wang',
    initialMethod: 'face-to-face',
  })
  assert.deepEqual(parseRoute('#/records/new?method=unsupported'), { kind: 'create' })
})

test('提交与草稿只在记录状态更新匹配后生成对应成功反馈', () => {
  const submittedNotice = { recordId: 'record-1', status: 'submitted' as const, createdAt: 1 }
  const draftNotice = { recordId: 'record-2', status: 'draft' as const, createdAt: 1 }

  assert.equal(getRecordFeedbackMessage({ id: 'record-1', status: 'submitted' }, submittedNotice), '接待记录提交成功')
  assert.equal(getRecordFeedbackMessage({ id: 'record-1', status: 'draft' }, submittedNotice), undefined)
  assert.equal(getRecordFeedbackMessage({ id: 'record-2', status: 'draft' }, draftNotice), '草稿已保存')
  assert.equal(getRecordFeedbackMessage({ id: 'record-2', status: 'submitted' }, draftNotice), undefined)
  assert.equal(getRecordFeedbackMessage({ id: 'record-1', status: 'failed' }, submittedNotice), undefined)
})

test('预选客户关联校验要求 memberId、customerId 与客户快照一致', () => {
  const wang = mockMembers.find((member) => member.customerId === 'customer-wang')!
  const preselectedRecord = {
    creationSource: 'customer-list' as const,
    memberId: wang.id,
    customerId: wang.customerId,
    customerInfo: { name: wang.name, phone: wang.phone },
    customerName: wang.name,
    customerPhone: wang.phone,
  } as Parameters<typeof isPreselectedCustomerRelationIntact>[0]

  assert.equal(isPreselectedCustomerRelationIntact(preselectedRecord, wang, wang.name, wang.phone), true)
  assert.equal(canEditCustomerInformation(preselectedRecord), false)
  assert.equal(isPreselectedCustomerRelationIntact(preselectedRecord, mockMembers.find((member) => member.customerId === 'customer-chen'), wang.name, wang.phone), false)
  assert.equal(isPreselectedCustomerRelationIntact(preselectedRecord, wang, '陈女士', wang.phone), false)
  assert.equal(isPreselectedCustomerRelationIntact({ ...preselectedRecord, creationSource: 'direct' }, undefined, '新姓名', '13900000000'), true)
  assert.equal(canEditCustomerInformation({ ...preselectedRecord, creationSource: 'direct' }), true)
})

test('两种接待方式均将预选客户 ID 与来源写入独立记录并可序列化恢复', () => {
  const wang = mockMembers.find((member) => member.customerId === 'customer-wang')!
  const chen = mockMembers.find((member) => member.customerId === 'customer-chen')!
  const sanlitun = mockStores.find((store) => store.id === 'sanlitun')!
  const guomao = mockStores.find((store) => store.id === 'guomao')!

  const wangFaceToFace = createReceptionRecord('face-to-face', sanlitun, '张老师', wang, 'record-wang-1')!
  const chenAfterwards = createReceptionRecord('afterwards', guomao, '张老师', chen, 'record-chen-1')!
  const wangSecondRecord = createReceptionRecord('afterwards', sanlitun, '张老师', wang, 'record-wang-2')!
  const directRecord = createReceptionRecord('face-to-face', guomao, '张老师', undefined, 'record-direct')!
  const directAfterwardsRecord = createReceptionRecord('afterwards', guomao, '张老师', undefined, 'record-direct-afterwards')!

  assert.equal(wangFaceToFace.creationSource, 'customer-list')
  assert.equal(wangFaceToFace.memberId, wang.id)
  assert.equal(wangFaceToFace.customerId, wang.customerId)
  assert.equal(wangFaceToFace.method, 'face-to-face')
  assert.deepEqual(wangFaceToFace.customerInfo, { name: wang.name, phone: wang.phone })
  assert.equal(wangFaceToFace.customerBindingStatus, 'bound')
  assert.equal(chenAfterwards.creationSource, 'customer-list')
  assert.equal(chenAfterwards.method, 'afterwards')
  assert.equal(chenAfterwards.memberId, chen.id)
  assert.equal(chenAfterwards.customerId, chen.customerId)
  assert.equal(wangSecondRecord.customerId, wang.customerId)
  assert.notEqual(wangSecondRecord.id, wangFaceToFace.id)
  assert.equal(directRecord.creationSource, 'direct')
  assert.equal(directRecord.method, 'face-to-face')
  assert.equal(directRecord.customerBindingStatus, 'unbound')
  assert.equal(directAfterwardsRecord.creationSource, 'direct')
  assert.equal(directAfterwardsRecord.method, 'afterwards')
  assert.equal(directAfterwardsRecord.customerBindingStatus, 'unbound')

  const restored = JSON.parse(JSON.stringify(wangFaceToFace))
  assert.equal(restored.creationSource, 'customer-list')
  assert.equal(restored.customerId, wang.customerId)
  assert.equal(restored.memberId, wang.id)
  assert.equal(isPreselectedCustomerRelationIntact(restored, wang, wang.name, wang.phone), true)
  assert.equal(createReceptionRecord('face-to-face', guomao, '张老师', wang, 'record-out-of-store'), undefined)
})
