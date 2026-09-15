import type { EmployeeStoreScenario, Store } from '../types/store'

export const mockStores: Store[] = [
  { id: 'guomao', name: '奥本瑜伽 · 国贸店' },
  { id: 'sanlitun', name: '奥本瑜伽 · 三里屯店' },
  { id: 'wanxiangcheng', name: '奥本瑜伽 · 万象城店' },
]

export const mockEmployeeStorePermissions: Record<EmployeeStoreScenario, { accessibleStoreIds: string[]; primaryStoreId: string }> = {
  single: {
    accessibleStoreIds: ['guomao'],
    primaryStoreId: 'guomao',
  },
  multi: {
    accessibleStoreIds: ['guomao', 'sanlitun', 'wanxiangcheng'],
    primaryStoreId: 'guomao',
  },
}

export const defaultStoreScenario: EmployeeStoreScenario = 'multi'

export function findMockStoreByName(name: string) {
  return mockStores.find((store) => store.name === name)
}
