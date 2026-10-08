import type { Member } from './mockMembers'

export type MockCourseCompletion = {
  customerId: string
  courseType: 'experience' | 'formal'
  status: 'completed' | 'booked' | 'cancelled'
}

export type MockCoursePurchase = {
  customerId: string
  courseType: 'experience' | 'formal'
  status: 'valid' | 'cancelled'
}

// 活动明细按客户 ID 归属；首页状态始终由明细推导，不保存硬编码状态。
export const mockCourseCompletions: MockCourseCompletion[] = [
  { customerId: 'customer-001', courseType: 'experience', status: 'completed' },
  { customerId: 'customer-chen', courseType: 'formal', status: 'completed' },
  { customerId: 'customer-wang', courseType: 'experience', status: 'booked' },
  { customerId: 'customer-zhou', courseType: 'experience', status: 'completed' },
  { customerId: 'customer-sun', courseType: 'formal', status: 'completed' },
  { customerId: 'customer-zheng', courseType: 'experience', status: 'cancelled' },
  { customerId: 'customer-xu', courseType: 'experience', status: 'completed' },
]

export const mockCoursePurchases: MockCoursePurchase[] = [
  { customerId: 'customer-chen', courseType: 'formal', status: 'valid' },
  { customerId: 'customer-zhao', courseType: 'experience', status: 'valid' },
  { customerId: 'customer-liu', courseType: 'formal', status: 'valid' },
  { customerId: 'customer-sun', courseType: 'formal', status: 'valid' },
]

export type CustomerBusinessStatus = { visited: boolean; converted: boolean }
export type CustomerVisitFilter = 'all' | 'visited' | 'not-visited'
export type CustomerDealFilter = 'all' | 'converted' | 'not-converted'

export function getCustomerBusinessStatus(customerId: string): CustomerBusinessStatus {
  return {
    visited: mockCourseCompletions.some((row) => row.customerId === customerId && row.status === 'completed'),
    converted: mockCoursePurchases.some((row) => row.customerId === customerId && row.courseType === 'formal' && row.status === 'valid'),
  }
}

export function filterAssignedCustomers(
  members: Member[],
  filters: { storeId: string; query?: string; visit?: CustomerVisitFilter; deal?: CustomerDealFilter },
) {
  const query = filters.query?.trim().toLocaleLowerCase() ?? ''
  return members.filter((member) => {
    if (member.storeId !== filters.storeId) return false
    if (query && !member.name.toLocaleLowerCase().includes(query) && !member.phone.includes(query)) return false
    const status = getCustomerBusinessStatus(member.customerId)
    if (filters.visit === 'visited' && !status.visited) return false
    if (filters.visit === 'not-visited' && status.visited) return false
    if (filters.deal === 'converted' && !status.converted) return false
    if (filters.deal === 'not-converted' && status.converted) return false
    return true
  })
}
