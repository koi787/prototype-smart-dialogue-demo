import { useEffect, useRef, useState, type ReactElement } from 'react'
import { getEmbedEntryRoute, getEmbedMode, isRouteAllowedInMode, parseRoute, type AppRoute, type DemoMode } from './routes'
import { CreateRecordPage } from './pages/CreateRecordPage'
import { RecordDetailPage } from './pages/RecordDetailPage'
import { RecordListPage } from './pages/RecordListPage'
import { RecordingPage } from './pages/RecordingPage'
import { OrganizingPage } from './pages/OrganizingPage'
import { ConfirmRecordPage } from './pages/ConfirmRecordPage'
import { ModuleEditPage } from './pages/ModuleEditPage'
import { AdminRecordsPage } from './pages/AdminRecordsPage'
import { AdminDialogueRecordsPage } from './pages/AdminDialogueRecordsPage'
import { AdminCustomerListPage } from './pages/AdminCustomerListPage'
import { AobenHomePage } from './pages/AobenHomePage'
import { MemberCenterPage } from './pages/MemberCenterPage'
import { MobileMemberDetailPage } from './pages/MobileMemberDetailPage'
import { MobileMemberDialogueDetailPage } from './pages/MobileMemberDialogueDetailPage'
import { DemoTopSwitcher } from './components/DemoTopSwitcher'
import { ReceptionRecordsProvider } from './store/ReceptionRecordsContext'
import { StoreProvider } from './store/StoreContext'
import './styles.css'

function AppContent() {
  const embedModeRef = useRef<DemoMode | null>(getEmbedMode())

  const getSafeRoute = () => {
    const embedMode = embedModeRef.current
    if (embedMode && !isRouteAllowedInMode(window.location.hash, embedMode)) {
      const entryRoute = getEmbedEntryRoute(embedMode)
      window.location.hash = entryRoute
      return parseRoute(entryRoute)
    }
    return parseRoute(window.location.hash)
  }

  const [route, setRoute] = useState<AppRoute>(getSafeRoute)

  useEffect(() => {
    const handleHashChange = () => setRoute(getSafeRoute())
    window.addEventListener('hashchange', handleHashChange)
    return () => window.removeEventListener('hashchange', handleHashChange)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const isAdminMode = route.kind === 'admin-records' || route.kind === 'admin-dialogue-records' || route.kind === 'admin-dialogue-detail' || route.kind === 'admin-customer-list' || route.kind === 'member-detail'
  const mode: DemoMode = isAdminMode ? 'admin' : 'mobile'

  let page: ReactElement
  switch (route.kind) {
    case 'home':
      page = <AobenHomePage />
      break
    case 'records':
      page = <RecordListPage storeScenario={route.storeScenario} />
      break
    case 'member-center':
      page = <MemberCenterPage initialPhone={route.initialPhone} />
      break
    case 'mobile-member-detail':
      page = <MobileMemberDetailPage memberId={route.memberId} initialTab={route.initialTab} />
      break
    case 'mobile-member-dialogue-detail':
      page = <MobileMemberDialogueDetailPage memberId={route.memberId} recordId={route.recordId} />
      break
    case 'create':
      page = <CreateRecordPage />
      break
    case 'detail':
      page = <RecordDetailPage recordId={route.recordId} admin={route.admin} />
      break
    case 'recording':
      page = <RecordingPage recordId={route.recordId} />
      break
    case 'organizing':
      page = <OrganizingPage recordId={route.recordId} />
      break
    case 'confirm':
      page = <ConfirmRecordPage recordId={route.recordId} />
      break
    case 'edit':
      page = <ModuleEditPage recordId={route.recordId} moduleKey={route.moduleKey} />
      break
    case 'admin-records':
      page = <AdminRecordsPage />
      break
    case 'admin-dialogue-records':
      page = <AdminDialogueRecordsPage />
      break
    case 'admin-dialogue-detail':
      page = <AdminDialogueRecordsPage initialRecordId={route.recordId} />
      break
    case 'admin-customer-list':
      page = <AdminCustomerListPage />
      break
    case 'member-detail':
      page = <AdminCustomerListPage initialMemberId={route.memberId} />
      break
  }

  return <div className={isAdminMode ? 'demo-root demo-root--admin' : 'demo-root demo-root--mobile'}><DemoTopSwitcher mode={mode} embedded={embedModeRef.current !== null} />{page}</div>
}

function App() {
  return (
    <StoreProvider>
      <ReceptionRecordsProvider>
        <AppContent />
      </ReceptionRecordsProvider>
    </StoreProvider>
  )
}

export default App
