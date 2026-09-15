export type Member = {
  id: string
  customerId: string
  name: string
  phone: string
  membershipLabel: string
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
  },
  {
    id: 'member-chen',
    customerId: 'customer-chen',
    name: '陈榛',
    phone: '18344639949',
    membershipLabel: '瑜伽年卡会员',
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

export function findMemberById(memberId?: string, customerId?: string) {
  return mockMembers.find((member) => member.id === memberId || member.customerId === customerId)
}
