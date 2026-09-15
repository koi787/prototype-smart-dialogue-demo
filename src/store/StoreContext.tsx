import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { defaultStoreScenario, mockEmployeeStorePermissions, mockStores } from '../data/mockStores'
import type { EmployeeStoreScenario, Store } from '../types/store'

const currentStoreStorageKey = 'prototype-smart-dialogue-demo.current-store-id'

type StoreContextValue = {
  accessibleStores: Store[]
  currentStore: Store
  currentStoreId: string
  scenario: EmployeeStoreScenario
  setScenario: (scenario: EmployeeStoreScenario) => void
  selectStore: (storeId: string) => void
}

const StoreContext = createContext<StoreContextValue | null>(null)

function readStoredStoreId() {
  return window.localStorage.getItem(currentStoreStorageKey)
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [scenario, setScenario] = useState<EmployeeStoreScenario>(defaultStoreScenario)
  const [currentStoreId, setCurrentStoreId] = useState(() => readStoredStoreId() ?? mockEmployeeStorePermissions[defaultStoreScenario].primaryStoreId)
  const accessibleStores = useMemo(() => {
    const allowedIds = new Set(mockEmployeeStorePermissions[scenario].accessibleStoreIds)
    return mockStores.filter((store) => allowedIds.has(store.id))
  }, [scenario])

  useEffect(() => {
    const permission = mockEmployeeStorePermissions[scenario]
    if (accessibleStores.some((store) => store.id === currentStoreId)) return
    const fallbackId = [currentStoreId, permission.primaryStoreId, accessibleStores[0]?.id].find((id) => id && accessibleStores.some((store) => store.id === id))
    if (fallbackId) setCurrentStoreId(fallbackId)
  }, [accessibleStores, currentStoreId, scenario])

  useEffect(() => {
    window.localStorage.setItem(currentStoreStorageKey, currentStoreId)
  }, [currentStoreId])

  const selectStore = useCallback((storeId: string) => {
    if (accessibleStores.some((store) => store.id === storeId)) setCurrentStoreId(storeId)
  }, [accessibleStores])

  const currentStore = accessibleStores.find((store) => store.id === currentStoreId) ?? accessibleStores[0] ?? mockStores[0]
  const value = useMemo(() => ({ accessibleStores, currentStore, currentStoreId: currentStore.id, scenario, setScenario, selectStore }), [accessibleStores, currentStore, scenario, selectStore])

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
}

export function useStoreContext() {
  const context = useContext(StoreContext)
  if (!context) throw new Error('useStoreContext must be used inside StoreProvider')
  return context
}
