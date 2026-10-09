export type Member = {
  id: string
  customerId: string
  name: string
  phone: string
  membershipLabel: string
  storeId?: string
  gender?: string
  birthday?: string
  isNewMember?: string
  consumptionLevel?: string
  growthValue?: string
  carriedBalance?: string
  storedBalance?: string
  points?: string
  storeName?: string
  source?: string
  registeredAt?: string
  note?: string
}

export const mockMembers: Member[] = [
  {
    id: 'member-001',
    customerId: 'customer-001',
    name: '李女士',
    phone: '13800000000',
    membershipLabel: '瑜伽年卡会员',
    storeId: 'guomao',
    storeName: '奥本瑜伽 · 国贸店',
  },
  {
    id: 'member-chen',
    customerId: 'customer-chen',
    name: '陈榛',
    phone: '18344639949',
    membershipLabel: '瑜伽年卡会员',
    storeId: 'guomao',
    gender: '女',
    birthday: '1992-08-16',
    isNewMember: '否',
    consumptionLevel: '成熟会员',
    growthValue: '860',
    carriedBalance: '¥0.00',
    storedBalance: '¥2,680.00',
    points: '1,280',
    storeName: '奥本瑜伽 · 国贸店',
    source: '小红书',
    registeredAt: '2026-06-22 11:04:49',
    note: '关注体态改善与肩颈放松。',
  },
  {
    id: 'member-wang',
    customerId: 'customer-wang',
    name: '王女士',
    phone: '13910002001',
    membershipLabel: '瑜伽体验会员',
    storeId: 'sanlitun',
    storeName: '奥本瑜伽 · 三里屯店',
    registeredAt: '2026-08-18 10:20:00',
  },
  {
    id: 'member-zhao',
    customerId: 'customer-zhao',
    name: '赵女士',
    phone: '13710002002',
    membershipLabel: '瑜伽体验会员',
    storeId: 'guomao',
    storeName: '奥本瑜伽 · 国贸店',
    registeredAt: '2026-08-21 14:05:00',
  },
  {
    id: 'member-zhou',
    customerId: 'customer-zhou',
    name: '周女士',
    phone: '13610002003',
    membershipLabel: '瑜伽体验会员',
    storeId: 'wanxiangcheng',
    storeName: '奥本瑜伽 · 万象城店',
    registeredAt: '2026-08-25 16:40:00',
  },
  {
    id: 'member-liu',
    customerId: 'customer-liu',
    name: '刘女士',
    phone: '13510002004',
    membershipLabel: '瑜伽年卡会员',
    storeId: 'sanlitun',
    storeName: '奥本瑜伽 · 三里屯店',
    registeredAt: '2026-08-29 09:15:00',
  },
  {
    id: 'member-sun',
    customerId: 'customer-sun',
    name: '孙女士',
    phone: '13310002005',
    membershipLabel: '瑜伽年卡会员',
    storeId: 'guomao',
    storeName: '奥本瑜伽 · 国贸店',
    registeredAt: '2026-09-01 11:30:00',
  },
  {
    id: 'member-wu',
    customerId: 'customer-wu',
    name: '吴女士',
    phone: '18910002006',
    membershipLabel: '瑜伽会员',
    storeId: 'guomao',
    storeName: '奥本瑜伽 · 国贸店',
    registeredAt: '2026-09-03 13:10:00',
  },
  {
    id: 'member-zheng',
    customerId: 'customer-zheng',
    name: '郑女士',
    phone: '18810002007',
    membershipLabel: '瑜伽体验会员',
    storeId: 'sanlitun',
    storeName: '奥本瑜伽 · 三里屯店',
    registeredAt: '2026-09-06 17:20:00',
  },
  {
    id: 'member-xu',
    customerId: 'customer-xu',
    name: '徐女士',
    phone: '18710002008',
    membershipLabel: '瑜伽体验会员',
    storeId: 'wanxiangcheng',
    storeName: '奥本瑜伽 · 万象城店',
    registeredAt: '2026-09-09 10:00:00',
  },
]

export function findMembersByPhone(phone: string) {
  if (phone === '13800000001') {
    return [
      mockMembers[0],
      { ...mockMembers[0], id: 'member-002', customerId: 'customer-002', name: '李女士（重复匹配演示）' },
    ]
  }
  if (phone === '13800000002') throw new Error('mock member lookup failed')
  return mockMembers.filter((member) => member.phone === phone)
}

export function searchMembers(query: string, candidates: Member[]) {
  const normalizedQuery = query.trim().toLocaleLowerCase()
  if (!normalizedQuery) return []

  const isPhoneQuery = /^[+\d\s()-]+$/.test(normalizedQuery)
  const phoneDigits = normalizedQuery.replace(/\D/g, '')
  const matchFullPhone = isPhoneQuery && phoneDigits.length === 11
  const matchPhoneSuffix = isPhoneQuery && phoneDigits.length === 4

  return candidates.filter((member) => {
    const nameMatches = member.name.toLocaleLowerCase().includes(normalizedQuery)
    const phoneMatches = (matchFullPhone && member.phone === phoneDigits)
      || (matchPhoneSuffix && member.phone.endsWith(phoneDigits))
    return nameMatches || phoneMatches
  })
}

export function isMemberInCandidateSet(member: Member, candidates: Member[]) {
  return candidates.some((candidate) => candidate.id === member.id && candidate.customerId === member.customerId)
}

export function createMockMember(name: string, phone: string) {
  const idSuffix = Date.now()
  const member: Member = {
    id: `member-demo-${idSuffix}`,
    customerId: `customer-demo-${idSuffix}`,
    name,
    phone,
    membershipLabel: '待完善会员',
  }
  mockMembers.push(member)
  return member
}

export function updateMockMemberName(memberId: string, name: string) {
  const index = mockMembers.findIndex((member) => member.id === memberId)
  if (index < 0) return undefined
  const updatedMember = { ...mockMembers[index], name }
  mockMembers[index] = updatedMember
  return updatedMember
}

export function findMemberById(memberId?: string, customerId?: string) {
  return mockMembers.find((member) => member.id === memberId || member.customerId === customerId)
}
