import { useEffect, useMemo, useState, KeyboardEvent, useCallback } from 'react'
import { AppSidebar } from './components/AppSidebar'
import { AppLauncher } from './components/AppLauncher'
import { PROTOTYPE_STAFF_SESSION_STORAGE_KEY, VIEWS } from './constants'
import { buildAdminBookCategories, buildAdminBookCategorySubcategories, buildAdminPlacements, buildAdminTopCategories, buildAdminVisibleItems } from './lib/adminSelectors'
import {
  buildCustomerUrl,
  composeScopedCategoryId,
  formatError,
  formatTime,
  messageTone,
  normalizeAppLocation,
  readCustomerAccessParams,
  readViewFromHash,
  syncCustomerTicketInUrl,
  yen,
} from './lib/appUtils'
import { customerApiSupportsTicketBootstrap, fetchPublicMenu } from './lib/publicCustomerApi'
import {
  staffReadApiEnabled,
  staffReadStoreSlugOverride,
} from './lib/staffReadApi'
import { kdsStatusLabel } from './lib/staffUtils'
import { AdminScreen } from './screens/AdminScreen'
import { KdsScreen } from './screens/KdsScreen'
import { StaffScreen } from './screens/StaffScreen'
import { LoginScreen } from './screens/LoginScreen'
import type {
  ActiveStoreSummary,
  AppView,
  ReceiptSummaryLine,
  StaffProfile,
} from './types'





import { useAuth } from './hooks/useAuth'
import { useAdminForm } from './hooks/useAdminForm'
import { useStaffData } from './hooks/useStaffData'
import { useDataLoading } from './hooks/useDataLoading'
import { useAdminOperations } from './hooks/useAdminOperations'
// import { useCustomerFlow } from './hooks/useCustomerFlow'
import { useStaffOperations } from './hooks/useStaffOperations'
import { useNativeSetup } from './hooks/useNativeSetup'
import { SetupScreen } from './screens/SetupScreen'

export default function App() {
  normalizeAppLocation()
  const {
    email, setEmail,
    password, setPassword,
    authStoreSlug, setAuthStoreSlug,
    session, setSession,
    profile, setProfile,
    authBusy,
    authError,
    handleSignIn,
    handleSignOut
  } = useAuth()

  const nativeSetup = useNativeSetup()
  const [view, setView] = useState<AppView>(() => {
    const hashView = readViewFromHash()
    if (hashView) return hashView
    if (nativeSetup.isConfigured && nativeSetup.config) return nativeSetup.config.view
    return 'setup'
  })
  const [adminTab, setAdminTab] = useState<string>(() => {
    const params = new URLSearchParams(window.location.search)
    return params.get('tab') || ''
  })
  // const custFlow = useCustomerFlow(view)
  const [customerAccess, setCustomerAccess] = useState(() => readCustomerAccessParams())
  const [customerBusy, setCustomerBusy] = useState(false)
  const [customerMessage, setCustomerMessage] = useState<string | null>(null)
  const [publicMenuReady, setPublicMenuReady] = useState(false)
  const [publicStore, setPublicStore] = useState<any>(null)
  const [publicTable, setPublicTable] = useState<any>(null)
  const [publicOpenTicket, setPublicOpenTicket] = useState<any>(null)
  const [publicCategories, setPublicCategories] = useState<any[]>([])
  const [publicItems, setPublicItems] = useState<any[]>([])
  const [ticketReceipt, setTicketReceipt] = useState<any>(null)
  const publicStoreSlug = customerAccess.storeSlug
  const publicQrToken = customerAccess.qrToken
  const publicTicketToken = customerAccess.ticketToken
  const hasPublicCustomerAccess = Boolean(publicStoreSlug && publicQrToken)
  const effectivePublicTicketToken = publicTicketToken || publicOpenTicket?.customer_access_token || null

  const adminForm = useAdminForm()
  const staffData = useStaffData()

  const {
    liveStore, setLiveStore,
    liveTickets, setLiveTickets,
    liveLines, setLiveLines,
    livePaymentEntries, setLivePaymentEntries,
    liveTables, setLiveTables,
    liveMenuBooks, setLiveMenuBooks,
    liveCategories, setLiveCategories,
    liveSubcategories, setLiveSubcategories,
    liveBookCategories, setLiveBookCategories,
    liveBookCategorySubcategories, setLiveBookCategorySubcategories,
    liveBookSubcategoryItems, setLiveBookSubcategoryItems,
    liveStaffUsers, setLiveStaffUsers,
    liveItems, setLiveItems,
    selectedTicketId, setSelectedTicketId,
    staffDirectAction, setStaffDirectAction,
    staffHandyTopCategories, setStaffHandyTopCategories,
    staffHandySubCategories, setStaffHandySubCategories,
    staffHandyItems, setStaffHandyItems,
    selectedTicket,
    selectedLines,
    selectedPaymentEntries,
    cancelledLines,
    activeLines,
    selectedSummary,
    activeLiveTickets,
    liveTicketSummaries,
  } = staffData

  // Global UI State
  const [loadBusy, setLoadBusy] = useState(false)
  const [mutationBusy, setMutationBusy] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [adminMessage, setAdminMessage] = useState<string | null>(null)
  const [staffMessage, setStaffMessage] = useState<string | null>(null)
  const [isLauncherOpen, setIsLauncherOpen] = useState(false)
  const [wasLoggingIn, setWasLoggingIn] = useState(false)

  // Staff UI State
  const [handyItemId, setHandyItemId] = useState('')
  const [handyQty, setHandyQty] = useState('1')
  const [draftQuantities, setDraftQuantities] = useState<Record<string, number>>({})
  const [newTicketMenuBookId, setNewTicketMenuBookId] = useState('')

  // KDS UI State
  const [kdsMode, setKdsMode] = useState<'all' | 'table'>('all')
  const [kdsSelectedTableName, setKdsSelectedTableName] = useState<string | null>(null)

  const {
    loadOperationalData,
    loadAdminPrototypeData,
    loadLiveData,
    loadPublicMenu
  } = useDataLoading({
    setLoadBusy, setError, setProfile, setLiveStore, setLiveTickets, setLiveLines, setLivePaymentEntries,
    setLiveTables, setLiveMenuBooks, setLiveCategories, setLiveSubcategories,
    setLiveBookCategories, setLiveBookCategorySubcategories, setLiveBookSubcategoryItems, setLiveItems, setLiveStaffUsers,
    setNewTicketMenuBookId,
    setAdminMenuBookId: adminForm.setAdminMenuBookId,
    setAdminPlacementMenuBookId: adminForm.setAdminPlacementMenuBookId,
    setAdminCategoryParentId: adminForm.setAdminCategoryParentId,
    setAdminItemCategoryId: adminForm.setAdminItemCategoryId,
    setAdminPlacementTopCategoryId: adminForm.setAdminPlacementTopCategoryId,
    setAdminPlacementCategoryId: adminForm.setAdminPlacementCategoryId,
    setAdminPlacementItemId: adminForm.setAdminPlacementItemId,
    setAdminStoreName: adminForm.setAdminStoreName,
    setAdminStoreSlug: adminForm.setAdminStoreSlug,
    setAdminStoreTimezone: adminForm.setAdminStoreTimezone,
    setAdminStoreBusinessOffsetMinutes: (min) => adminForm.setAdminStoreBusinessOffsetMinutes(Number(min)),
    setAdminStorePaymentTimingMode: adminForm.setAdminStorePaymentTimingMode,
    setAdminStoreTicketNoResetMode: adminForm.setAdminStoreTicketNoResetMode,
    setAdminStoreTicketNoDigits: (digits) => adminForm.setAdminStoreTicketNoDigits(Number(digits)),
    setPublicStore, setPublicTable, setPublicOpenTicket, setPublicCategories, setPublicItems,
    setPublicMenuReady, setCustomerBusy, setCustomerMessage, setCustomerAccess, setSession
  })

  const adminPlacements = useMemo(
    () => buildAdminPlacements(liveBookSubcategoryItems, liveMenuBooks, liveBookCategorySubcategories, liveCategories, liveSubcategories, liveItems),
    [liveBookCategorySubcategories, liveBookSubcategoryItems, liveCategories, liveItems, liveMenuBooks, liveSubcategories],
  )
  const adminBookCategories = useMemo(
    () => buildAdminBookCategories(liveBookCategories, liveMenuBooks, liveCategories),
    [liveBookCategories, liveCategories, liveMenuBooks],
  )
  const adminBookCategorySubcategories = useMemo(
    () => buildAdminBookCategorySubcategories(liveBookCategorySubcategories, liveMenuBooks, liveCategories, liveSubcategories),
    [liveBookCategorySubcategories, liveCategories, liveMenuBooks, liveSubcategories],
  )
  const adminTopCategories = useMemo(() => buildAdminTopCategories(liveCategories), [liveCategories])
  const adminVisibleItems = useMemo(
    () => buildAdminVisibleItems(liveBookSubcategoryItems, liveItems, adminForm.adminMenuBookId),
    [adminForm.adminMenuBookId, liveBookSubcategoryItems, liveItems],
  )

  const adminTables = useMemo(
    () =>
      liveTables.map((table) => ({
        ...table,
        customer_url: buildCustomerUrl(window.location, liveStore?.slug || publicStoreSlug, table.qr_token),
      })),
    [liveStore?.slug, liveTables, publicStoreSlug],
  )

  const adminOps = useAdminOperations({
    profile,
    liveStore,
    adminForm,
    liveItems,
    liveBookCategoryRows: adminBookCategories,
    liveBookCategorySubcategoryRows: adminBookCategorySubcategories,
    livePlacements: adminPlacements,
    setMutationBusy,
    setItemImageUploadBusy: adminForm.setItemImageUploadBusy,
    setAdminMessage,
    setError,
    refreshAdminData: async () => {
      const storeSlug = staffReadStoreSlugOverride || liveStore?.slug
      if (storeSlug) await loadAdminPrototypeData(storeSlug)
    }
  })

  const staffOps = useStaffOperations({
    session, profile, liveLines, liveStore, liveTickets, liveTables, liveMenuBooks,
    staffHandyItems, selectedTicketId, selectedTicket, handyItemId, handyQty, draftQuantities,
    setMutationBusy, setError, setStaffMessage, setLiveLines, setDraftQuantities, setLiveTickets,
    setLivePaymentEntries, setSelectedTicketId, setHandyQty,
    terminalName: nativeSetup.config?.terminalName,
    loadLiveData: (s) => loadLiveData(s, view, PROTOTYPE_STAFF_SESSION_STORAGE_KEY)
  })

  const {
    changeLineQuantity, submitLineQuantityUpdate, cancelLine, advanceLineStatus,
    createHandyOrder, createStaffTicket, savePaymentEntry, settleTicket
  } = staffOps




  // useEffect(() => {
  //   document.body.classList.toggle('customer-browser-bg', view === 'customer')
  //   return () => {
  //     document.body.classList.remove('customer-browser-bg')
  //   }
  // }, [view])

  useEffect(() => {
    const syncLocationState = () => {
      normalizeAppLocation()
      const hashView = readViewFromHash()
      if (hashView) {
        setView(hashView)
      } else if (!nativeSetup.isConfigured) {
        setView('setup')
      } else if (nativeSetup.config) {
        setView(nativeSetup.config.view)
      }
      const nextCustomerAccess = readCustomerAccessParams()
      if (hashView !== 'cust-tablet') {
        setCustomerAccess(nextCustomerAccess)
      } else if (nextCustomerAccess.storeSlug && nextCustomerAccess.qrToken) {
        setCustomerAccess(nextCustomerAccess)
      }
      const params = new URLSearchParams(window.location.search)
      setAdminTab(params.get('tab') || '')
    }
    window.addEventListener('hashchange', syncLocationState)
    window.addEventListener('popstate', syncLocationState)
    return () => {
      window.removeEventListener('hashchange', syncLocationState)
      window.removeEventListener('popstate', syncLocationState)
    }
  }, [])

  useEffect(() => {
    // Isolated source of truth based on view mode
    if (view === 'cust-tablet') {
      if (nativeSetup.isConfigured && nativeSetup.config) {
        setCustomerAccess({
          storeSlug: nativeSetup.config.storeSlug,
          qrToken: nativeSetup.config.qrToken,
          ticketToken: nativeSetup.config.ticketToken || ''
        })
      }
    }
  }, [view, nativeSetup.isConfigured, nativeSetup.config])

  useEffect(() => {
    if (!session) {
      setProfile(null)
      setLiveStore(null)
      setLiveCategories([])
      setLiveMenuBooks([])
      setLiveSubcategories([])
      setLiveBookCategories([])
      setLiveBookCategorySubcategories([])
      setLiveBookSubcategoryItems([])
      setLiveItems([])
      setLiveTickets([])
      setLiveTables([])
      setLiveStaffUsers([])
      setLiveLines([])
      setLivePaymentEntries([])
      setSelectedTicketId(null)
      setNewTicketMenuBookId('')
      setPublicOpenTicket(null)
      return
    }
    void loadLiveData(session, view, PROTOTYPE_STAFF_SESSION_STORAGE_KEY)
  }, [session])

  useEffect(() => {
    if (!customerApiSupportsTicketBootstrap || publicMenuReady || customerBusy || !hasPublicCustomerAccess) return
    void loadPublicMenu(publicStoreSlug, publicQrToken, publicTicketToken, hasPublicCustomerAccess)
  }, [customerBusy, hasPublicCustomerAccess, publicMenuReady, publicQrToken, publicStoreSlug, publicTicketToken])

  useEffect(() => {
    if (!session) return
    if (!profile) return
    if (staffReadApiEnabled && (view === 'admin' || view === 'sales')) return
    const timer = window.setInterval(() => void loadOperationalData(profile, liveStore?.slug), 5000)
    return () => window.clearInterval(timer)
  }, [liveStore?.slug, profile, session, view])

  useEffect(() => {
    if (!staffReadApiEnabled || (view !== 'admin' && view !== 'sales' && view !== 'staff' && view !== 'kds') || !profile) return
    const storeSlug = staffReadStoreSlugOverride || liveStore?.slug
    if (!storeSlug) return
    void loadAdminPrototypeData(storeSlug).catch((err) => setError(formatError(err)))
  }, [liveStore?.slug, profile, view])

  // Customer は定期 polling を行わない。初回表示と明示操作時のみ再取得する。


  useEffect(() => {
    const nextDrafts = Object.fromEntries(
      liveLines
        .filter((line) => line.order_ticket_id === selectedTicketId && line.kds_status !== 'CANCELLED')
        .map((line) => [line.id, line.quantity]),
    )
    setDraftQuantities(nextDrafts)
  }, [liveLines, selectedTicketId])

  useEffect(() => {
    const firstAvailableItem = liveItems.find((item) => item.is_active && !item.is_sold_out)
    if (firstAvailableItem && !handyItemId) setHandyItemId(firstAvailableItem.id)
  }, [handyItemId, liveItems])

  useEffect(() => {
    if (!customerMessage) return
    const timer = window.setTimeout(() => setCustomerMessage(null), 10000)
    return () => window.clearTimeout(timer)
  }, [customerMessage, setCustomerMessage])

  useEffect(() => {
    if (!adminMessage) return
    const timer = window.setTimeout(() => setAdminMessage(null), 4000)
    return () => window.clearTimeout(timer)
  }, [adminMessage, setAdminMessage])

  useEffect(() => {
    if (!staffMessage) return
    const timer = window.setTimeout(() => setStaffMessage(null), 4000)
    return () => window.clearTimeout(timer)
  }, [staffMessage, setStaffMessage])

  useEffect(() => {
    if (!session && (view === 'staff' || view === 'handy' || view === 'kds' || view === 'admin' || view === 'sales')) {
      setWasLoggingIn(true)
    }
  }, [session, view])

  useEffect(() => {
    if (session && wasLoggingIn) {
      setWasLoggingIn(false)
      setView('staff')
    }
  }, [session, wasLoggingIn])

  // Customer ordering logic removed for Handy-only version
  const customerOrderingEnabled = false


  const availableTables = useMemo(() => {
    const occupiedTableIds = new Set(activeLiveTickets.map((ticket) => ticket.table_ref_id))
    return liveTables.filter((table) => !occupiedTableIds.has(table.id))
  }, [activeLiveTickets, liveTables])

  const selectedCustomerTable = useMemo(() => {
    const normalizedTableName = selectedSummary?.tableName?.trim().toLowerCase() ?? ''
    return (
      (selectedTicket ? liveTables.find((table) => table.id === selectedTicket.table_ref_id) : null) ??
      (selectedSummary
        ? liveTables.find((table) => {
            const label = table.label.trim().toLowerCase()
            return label === normalizedTableName || label.includes(normalizedTableName) || normalizedTableName.includes(label)
          })
        : null) ??
      null
    )
  }, [liveTables, selectedSummary, selectedTicket])

  const selectedCustomerQrToken = selectedCustomerTable?.qr_token ?? null

  const selectedCustomerUrl = useMemo(() => {
    // If we have a ticket with an access token, use it to build a full URL
    const ticketToken = selectedTicket?.customer_access_token || (selectedSummary?.customerUrl?.length && selectedSummary.customerUrl.length > 20 ? selectedSummary.customerUrl : null)
    
    const storeSlugForCustomer = liveStore?.slug || publicStoreSlug
    if (storeSlugForCustomer && selectedCustomerQrToken) {
      return buildCustomerUrl(window.location, storeSlugForCustomer, selectedCustomerQrToken, ticketToken)
    }
    
    // Fallback to summary's URL only if it looks like a full URL
    if (selectedSummary?.customerUrl && (selectedSummary.customerUrl.startsWith('http') || selectedSummary.customerUrl.startsWith('/'))) {
      if (selectedSummary.customerUrl.startsWith('/')) {
        return window.location.origin + selectedSummary.customerUrl
      }
      return selectedSummary.customerUrl
    }
    
    return null
  }, [liveStore?.slug, publicStoreSlug, selectedCustomerQrToken, selectedSummary, selectedTicket])


  useEffect(() => {
    if (!staffReadApiEnabled) {
      setStaffHandyTopCategories([])
      setStaffHandySubCategories([])
      setStaffHandyItems([])
      return
    }

    const storeSlug = staffReadStoreSlugOverride || liveStore?.slug
    if (!storeSlug || !selectedCustomerQrToken || !selectedTicket?.customer_access_token) {
      setStaffHandyTopCategories([])
      setStaffHandySubCategories([])
      setStaffHandyItems([])
      return
    }

    let disposed = false

    void (async () => {
      try {
        const data = await fetchPublicMenu(storeSlug, selectedCustomerQrToken, selectedTicket.customer_access_token)
        if (disposed) return
        setStaffHandyTopCategories(
          data.top_categories
            .slice()
            .sort((a, b) => a.sort_order - b.sort_order)
            .map((category) => ({ id: category.id, name: category.name })),
        )
        setStaffHandySubCategories(
          data.subcategories
            .slice()
            .sort((a, b) => a.sort_order - b.sort_order)
            .map((category) => ({
              id: composeScopedCategoryId(category.parent_category_id ?? '', category.id),
              name: category.name,
              parentId: category.parent_category_id ?? '',
              sortOrder: category.sort_order,
            })),
        )
        setStaffHandyItems(
          data.items
            .filter((item) => !item.is_sold_out)
            .slice()
            .sort((a, b) => a.sort_order - b.sort_order)
            .map((item) => ({
              id: item.id,
              name: item.name,
              price: item.price,
              isActive: true,
              isSoldOut: item.is_sold_out,
              subcategoryId: composeScopedCategoryId(item.parent_category_id ?? null, item.category_id),
            })),
        )
      } catch {
        if (disposed) return
        setStaffHandyTopCategories([])
        setStaffHandySubCategories([])
        setStaffHandyItems([])
      }
    })()

    return () => {
      disposed = true
    }
  }, [liveStore?.slug, selectedCustomerQrToken, selectedTicket?.customer_access_token, staffReadApiEnabled])

  const loginCandidates = useMemo(
    () =>
      liveStaffUsers
        .filter((staffUser) => staffUser.is_active && Boolean(staffUser.email))
        .map((staffUser) => ({
          email: staffUser.email ?? '',
          displayName: staffUser.display_name,
          roleType: staffUser.role_type,
        }))
        .sort((a, b) => a.displayName.localeCompare(b.displayName, 'ja')),
    [liveStaffUsers],
  )

  const kdsQueue = useMemo(() => {
    if (liveLines.length === 0 || activeLiveTickets.length === 0) {
      return []
    }
    const openTicketIds = new Set(activeLiveTickets.map((ticket) => ticket.id))
    return liveLines
      .filter((line) => openTicketIds.has(line.order_ticket_id))
      .filter((line) => line.kds_status !== 'SERVED' && line.kds_status !== 'CANCELLED')
      .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
      .map((line) => {
        const ticket = activeLiveTickets.find((item) => item.id === line.order_ticket_id)
        const table = liveTables.find((item) => item.id === ticket?.table_ref_id)
        const item = liveItems.find((i) => i.id === line.item_id)
        const relation = liveBookSubcategoryItems.find((r) => r.menu_book_id === ticket?.menu_book_id && r.menu_item_id === line.item_id)
          || liveBookSubcategoryItems.find((r) => r.menu_item_id === line.item_id)
        const subcategory = relation
          ? liveSubcategories.find((s) => s.id === relation.menu_subcategory_id)
          : undefined
        const qty = line.quantity
        return {
          id: line.id,
          itemName: line.item_name_snapshot,
          qty,
          name: item?.name ?? 'Unknown Item',
          price: item?.price ?? 0,
          soldOut: item?.is_sold_out ?? false,
          imageUrl: item?.image_url ?? null,
          status: line.kds_status as any,
          ticketNo: ticket?.ticket_no ?? '-',
          tableName: table?.label ?? '-',
          createdAt: line.created_at,
          subcategoryName: subcategory?.name ?? 'その他',
          subcategorySortOrder: subcategory?.sort_order ?? 9999,
        }
      })
  }, [activeLiveTickets, liveLines, liveTables, liveItems, liveSubcategories, liveBookSubcategoryItems, session])

  const kdsTableOptions = useMemo(
    () =>
      [...new Set(kdsQueue.map((item) => item.tableName))]
        .filter(Boolean)
        .sort((a, b) => a.localeCompare(b, 'ja')),
    [kdsQueue],
  )

  useEffect(() => {
    if (kdsTableOptions.length === 0) {
      setKdsSelectedTableName(null)
      if (kdsMode === 'table') setKdsMode('all')
      return
    }
    if (!kdsSelectedTableName || !kdsTableOptions.includes(kdsSelectedTableName)) {
      setKdsSelectedTableName(kdsTableOptions[0])
    }
  }, [kdsMode, kdsSelectedTableName, kdsTableOptions])

  const visibleKdsQueue = useMemo(() => {
    if (kdsMode === 'table' && kdsSelectedTableName) {
      return kdsQueue.filter((item) => item.tableName === kdsSelectedTableName)
    }
    return kdsQueue
  }, [kdsMode, kdsQueue, kdsSelectedTableName])


  const activeStore: ActiveStoreSummary = {
    name: publicStore?.name ?? liveStore?.name ?? '',
    tableName: publicTable?.label ?? liveTables[0]?.label ?? '',
    ticketNo: ticketReceipt?.ticketNo ?? publicOpenTicket?.ticket_no ?? selectedTicket?.ticket_no ?? '',
  }
  const lastUpdatedText = new Intl.DateTimeFormat('ja-JP', { hour: '2-digit', minute: '2-digit', second: '2-digit' }).format(new Date())
  const ticketSummaryLines: ReceiptSummaryLine[] = []



  function moveTo(nextView: AppView, tab?: string) {
    if (nextView === 'customer' || nextView === 'cust-tablet') return

    const url = new URL(window.location.href)
    url.searchParams.set('view', nextView)
    if (tab) {
      url.searchParams.set('tab', tab)
      setAdminTab(tab)
    } else {
      url.searchParams.delete('tab')
      setAdminTab('')
    }
    url.hash = ''
    window.history.pushState({}, '', url)
    setView(nextView)
  }


  function handleSelectableCardKey(event: KeyboardEvent<HTMLElement>, ticketId: string) {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      setSelectedTicketId(ticketId)
    }
  }

  return (
    <div
      className={`shell ${view === 'customer' ? 'customer-only' : ''} ${view === 'cust-tablet' ? 'cust-tablet-shell' : ''} ${(view === 'admin' || view === 'sales') ? 'admin-mode' : ''} ${(view === 'staff' || view === 'handy') ? 'staff-mode' : ''} ${view === 'kds' ? 'kds-mode' : ''}`}
    >
      <AppLauncher
        isOpen={isLauncherOpen}
        onClose={() => setIsLauncherOpen(false)}
        currentView={view}
        activeTab={adminTab}
        onMove={moveTo}
        onSignOut={() => void handleSignOut()}
        session={session}
        email={email}
        password={password}
        onEmailChange={setEmail}
        onPasswordChange={setPassword}
        onSignIn={(event) => { if (event && (event as any).preventDefault) (event as any).preventDefault(); handleSignIn() }}
        authBusy={authBusy}
        error={error}
        loginCandidates={loginCandidates}
        onPickLoginCandidate={setEmail}
      />

      {false && (
        <AppSidebar
          view={view}
          views={VIEWS}
          session={session}
          authEnabled={staffReadApiEnabled}
          authModeLabel={staffReadApiEnabled ? 'D1 Staff Login' : 'Auth Disabled'}
          publicMenuReady={publicMenuReady}
          loginCandidates={loginCandidates}
          email={email}
          password={password}
          authBusy={authBusy}
          profile={profile}
          liveStoreName={liveStore?.name ?? activeStore.name}
          error={error}
          onMove={moveTo}
          onPickLoginCandidate={setEmail}
          onEmailChange={setEmail}
          onPasswordChange={setPassword}
          onSignIn={(event) => { if (event && (event as any).preventDefault) (event as any).preventDefault(); handleSignIn() }}
          onSignOut={() => void handleSignOut()}
          authError={authError}
          authStoreSlug={authStoreSlug}
          onAuthStoreSlugChange={setAuthStoreSlug}
          onDirectAction={(action) => {
            setView('staff')
            setStaffDirectAction(action)
          }}
        />
      )}
      <main className="content">
        {!session && (view === 'staff' || view === 'handy' || view === 'kds' || view === 'admin' || view === 'sales') ? (
          <LoginScreen
            email={email}
            onEmailChange={setEmail}
            password={password}
            onPasswordChange={setPassword}
            onSignIn={async (event) => { if (event && (event as any).preventDefault) (event as any).preventDefault(); await handleSignIn() }}
            authBusy={authBusy}
            error={authError || error}
            authStoreSlug={authStoreSlug}
            onAuthStoreSlugChange={setAuthStoreSlug}
          />
        ) : (
          <>
            {/* Customer and Tablet screens removed */}
        {view === 'staff' || view === 'handy' ? (
          <StaffScreen
            staffReadOnlyMode={staffReadApiEnabled}
            staffPrototypeDebug={null}
            storeName={liveStore?.name ?? activeStore.name}
            lastUpdatedText={lastUpdatedText}
            ticketCount={liveTicketSummaries.length}
            selectedTicketExists={!!selectedTicket}
            handyItemId={handyItemId}
            handyQty={handyQty}
            staffMessage={staffMessage}
            selectedSummary={selectedSummary}
            isHandyMode={view === 'handy'}
            selectedTicketId={selectedTicketId}
            liveTicketSummaries={liveTicketSummaries}
            selectedLines={selectedLines}
            cancelledLineCount={cancelledLines.length}
            draftQuantities={draftQuantities}
            liveItems={liveItems.map(item => ({
              id: item.id,
              name: item.name,
              price: item.price,
              isActive: item.is_active,
              isSoldOut: item.is_sold_out,
              subcategoryId: item.category_id,
            }))}
            handyTopCategories={staffHandyTopCategories}
            handySubCategories={staffHandySubCategories}
            handyItems={staffHandyItems}
            roleType={profile?.role_type ?? null}
            mutationBusy={mutationBusy}
            selectedPaymentEntries={selectedPaymentEntries}
            availableTables={availableTables}
            liveMenuBooks={liveMenuBooks}
            newTicketMenuBookId={newTicketMenuBookId}
            selectedCustomerUrl={selectedCustomerUrl}
            yen={yen}
            kdsStatusLabel={kdsStatusLabel}
            messageTone={messageTone}
            onSelectTicket={setSelectedTicketId}
            onTicketKeyDown={(event, ticketId) => handleSelectableCardKey(event, ticketId)}
            onChangeLineQuantity={changeLineQuantity}
            onSubmitLineQuantityUpdate={(lineId) => void submitLineQuantityUpdate(lineId)}
            onCancelLine={(lineId) => void cancelLine(lineId)}
            onHandyItemChange={setHandyItemId}
            onHandyQtyChange={setHandyQty}
            onCreateHandyOrder={(itemId, qty) => void createHandyOrder(itemId, qty)}
            onNewTicketMenuBookChange={setNewTicketMenuBookId}
            onCreateTicket={(tableRefId, menuBookId, customerCount) => createStaffTicket(tableRefId, menuBookId, customerCount)}
            onSavePaymentEntry={async (payload) => { const res = await savePaymentEntry(payload); return Boolean(res) }}
            onCloseTicket={async (ticketId?: string) => { await settleTicket(ticketId); return true }}
            liveLines={liveLines}
            directAction={staffDirectAction}
            onClearDirectAction={() => setStaffDirectAction(null)}
            terminalName={nativeSetup.config?.terminalName}
            onOpenLauncher={() => setIsLauncherOpen(true)}
          />
        ) : null}
        {view === 'kds' ? (
          <KdsScreen
            queue={visibleKdsQueue}
            tableOptions={kdsTableOptions}
            mode={kdsMode}
            selectedTableName={kdsSelectedTableName}
            mutationBusy={mutationBusy}
            formatTime={formatTime}
            kdsStatusLabel={kdsStatusLabel}
            onModeChange={setKdsMode}
            onSelectTable={setKdsSelectedTableName}
            onAdvanceStatus={(lineId) => void advanceLineStatus(lineId)}
            onOpenLauncher={() => setIsLauncherOpen(true)}
          />
        ) : null}
        {view === 'admin' || view === 'sales' ? (
          <AdminScreen
            key={view}
            mode={view === 'sales' ? 'sales' : 'master'}
            activeTab={adminTab as any}
            onTabChange={(tab) => {
              setAdminTab(tab)
              const url = new URL(window.location.href)
              url.searchParams.set('tab', tab)
              window.history.replaceState({}, '', url)
            }}
            storeName={liveStore?.name ?? activeStore.name}
            categoryCount={liveCategories.length}
            itemCount={adminVisibleItems.length}
            roleType={profile?.role_type ?? null}
            adminReadOnlyMode={staffReadApiEnabled}
            adminMessage={adminMessage}
            mutationBusy={mutationBusy}
            liveStoreSettings={liveStore}
            liveMenuBooks={liveMenuBooks}
            liveParentCategories={adminTopCategories}
            liveCategories={liveSubcategories.map((subcategory) => ({ id: subcategory.id, name: subcategory.name, sort_order: subcategory.sort_order, parent_category_id: subcategory.parent_category_id ?? null }))}
            liveMenuItems={liveItems.map((item) => ({ ...item }))}
            visibleItems={adminVisibleItems}
            liveBookCategoryRows={adminBookCategories}
            liveBookCategorySubcategoryRows={adminBookCategorySubcategories}
            livePlacements={adminPlacements}
            liveTables={adminTables}
            liveStaffUsers={liveStaffUsers}
            adminMenuBookName={adminForm.adminMenuBookName}
            adminMenuBookCode={adminForm.adminMenuBookCode}
            adminMenuBookDescription={adminForm.adminMenuBookDescription}
            adminMenuBookSortOrder={adminForm.adminMenuBookSortOrder}
            adminMenuBookIsActive={adminForm.adminMenuBookIsActive}
            adminMenuBookAvailableFromTime={adminForm.adminMenuBookAvailableFromTime}
            adminMenuBookAvailableToTime={adminForm.adminMenuBookAvailableToTime}
            adminMenuBookValidFrom={adminForm.adminMenuBookValidFrom}
            adminMenuBookValidTo={adminForm.adminMenuBookValidTo}
            editingMenuBookId={adminForm.editingMenuBookId}
            adminCategoryName={adminForm.adminCategoryName}
            adminCategorySortOrder={adminForm.adminCategorySortOrder}
            editingCategoryId={adminForm.editingCategoryId}
            adminSubCategoryName={adminForm.adminSubCategoryName}
            adminSubCategorySortOrder={adminForm.adminSubCategorySortOrder}
            adminSubCategoryParentCategoryId={adminForm.adminCategoryParentId}
            editingSubCategoryId={adminForm.editingSubCategoryId}
            adminMenuBookId={adminForm.adminMenuBookId}
            adminItemCategoryId={adminForm.adminItemCategoryId}
            adminItemCode={adminForm.adminItemCode}
            adminItemName={adminForm.adminItemName}
            adminItemPrice={adminForm.adminItemPrice}
            adminItemTaxType={adminForm.adminItemTaxType}
            adminItemImageUrl={adminForm.adminItemImageUrl}
            itemImageUploadBusy={adminForm.itemImageUploadBusy}
            adminItemSortOrder={adminForm.adminItemSortOrder}
            adminItemIsActive={adminForm.adminItemIsActive}
            adminItemIsSoldOut={adminForm.adminItemIsSoldOut}
            editingMenuItemId={adminForm.editingMenuItemId}
            adminPlacementMenuBookId={adminForm.adminPlacementMenuBookId}
            adminPlacementTopCategoryId={adminForm.adminPlacementTopCategoryId}
            adminPlacementCategoryId={adminForm.adminPlacementCategoryId}
            adminPlacementItemId={adminForm.adminPlacementItemId}
            adminPlacementDisplayNameOverride={adminForm.adminPlacementDisplayNameOverride}
            adminPlacementDescriptionOverride={adminForm.adminPlacementDescriptionOverride}
            editingPlacementId={adminForm.editingPlacementId}
            adminStoreName={adminForm.adminStoreName}
            adminStoreSlug={adminForm.adminStoreSlug}
            adminStoreTimezone={adminForm.adminStoreTimezone}
            adminStoreBusinessOffsetMinutes={String(adminForm.adminStoreBusinessOffsetMinutes)}
            adminStorePaymentTimingMode={adminForm.adminStorePaymentTimingMode}
            adminStoreTicketNoResetMode={adminForm.adminStoreTicketNoResetMode}
            adminStoreTicketNoDigits={String(adminForm.adminStoreTicketNoDigits)}
            adminTableLabel={adminForm.adminTableLabel}
            adminTableQrToken={adminForm.adminTableQrToken}
            adminTableGroupName={adminForm.adminTableGroupName}
            adminTableSortOrder={adminForm.adminTableSortOrder}
            adminTableIsActive={adminForm.adminTableIsActive}
            editingTableId={adminForm.editingTableId}
            adminStaffEmail={adminForm.adminStaffEmail}
            adminStaffPassword={adminForm.adminStaffPassword}
            adminStaffDisplayName={adminForm.adminStaffDisplayName}
            adminStaffRoleType={adminForm.adminStaffRoleType}
            adminStaffIsActive={adminForm.adminStaffIsActive}
            editingStaffUserId={adminForm.editingStaffUserId}
            yen={yen}
            messageTone={messageTone}
            onMenuBookNameChange={adminForm.setAdminMenuBookName}
            onMenuBookCodeChange={adminForm.setAdminMenuBookCode}
            onMenuBookDescriptionChange={adminForm.setAdminMenuBookDescription}
            onMenuBookSortOrderChange={adminForm.setAdminMenuBookSortOrder}
            onMenuBookIsActiveChange={adminForm.setAdminMenuBookIsActive}
            onMenuBookAvailableFromTimeChange={adminForm.setAdminMenuBookAvailableFromTime}
            onMenuBookAvailableToTimeChange={adminForm.setAdminMenuBookAvailableToTime}
            onMenuBookValidFromChange={adminForm.setAdminMenuBookValidFrom}
            onMenuBookValidToChange={adminForm.setAdminMenuBookValidTo}
            onCreateMenuBook={adminOps.createMenuBook}
            onCancelMenuBookEdit={adminForm.resetBook}
            onCategoryNameChange={adminForm.setAdminCategoryName}
            onCategorySortOrderChange={adminForm.setAdminCategorySortOrder}
            onCreateCategory={adminOps.createCategory}
            onCancelCategoryEdit={adminForm.resetCategory}
            onSubCategoryNameChange={adminForm.setAdminSubCategoryName}
            onSubCategorySortOrderChange={adminForm.setAdminSubCategorySortOrder}
            onSubCategoryParentCategoryChange={adminForm.setAdminCategoryParentId}
            onCreateSubCategory={adminOps.createSubCategory}
            onCancelSubCategoryEdit={adminForm.resetSubCategory}
            onMenuBookChange={adminForm.setAdminMenuBookId}
            onItemCategoryChange={adminForm.setAdminItemCategoryId}
            onItemCodeChange={adminForm.setAdminItemCode}
            onItemNameChange={adminForm.setAdminItemName}
            onItemPriceChange={adminForm.setAdminItemPrice}
            onItemTaxTypeChange={adminForm.setAdminItemTaxType}
            onItemImageUrlChange={adminForm.setAdminItemImageUrl}
            onUploadItemImage={adminOps.uploadMenuItemImage}
            onClearItemImage={adminOps.clearMenuItemImage}
            onItemSortOrderChange={adminForm.setAdminItemSortOrder}
            onItemIsActiveChange={adminForm.setAdminItemIsActive}
            onItemIsSoldOutChange={adminForm.setAdminItemIsSoldOut}
            onCreateMenuItem={adminOps.createMenuItem}
            onCancelMenuItemEdit={adminForm.resetItem}
            onPlacementMenuBookChange={adminForm.setAdminPlacementMenuBookId}
            onPlacementTopCategoryChange={adminForm.setAdminPlacementTopCategoryId}
            onPlacementCategoryChange={adminForm.setAdminPlacementCategoryId}
            onPlacementItemChange={adminForm.setAdminPlacementItemId}
            onPlacementDisplayNameOverrideChange={adminForm.setAdminPlacementDisplayNameOverride}
            onPlacementDescriptionOverrideChange={adminForm.setAdminPlacementDescriptionOverride}
            onCreatePlacement={adminOps.createMenuPlacement}
            onCreateBookCategory={adminOps.createBookCategoryPlacement}
            onCreateBookCategorySubcategory={adminOps.createBookCategorySubcategoryPlacement}
            onCancelPlacementEdit={adminForm.resetPlacement}
            onStoreNameChange={adminForm.setAdminStoreName}
            onStoreSlugChange={adminForm.setAdminStoreSlug}
            onStoreTimezoneChange={adminForm.setAdminStoreTimezone}
            onStoreBusinessOffsetMinutesChange={(v) => adminForm.setAdminStoreBusinessOffsetMinutes(Number(v))}
            onStorePaymentTimingModeChange={adminForm.setAdminStorePaymentTimingMode}
            onStoreTicketNoResetModeChange={adminForm.setAdminStoreTicketNoResetMode}
            onStoreTicketNoDigitsChange={(v) => adminForm.setAdminStoreTicketNoDigits(Number(v))}
            onSaveStoreSettings={adminOps.saveStoreSettings}
            onTableLabelChange={adminForm.setAdminTableLabel}
            onTableQrTokenChange={adminForm.setAdminTableQrToken}
            onTableGroupNameChange={adminForm.setAdminTableGroupName}
            onTableSortOrderChange={adminForm.setAdminTableSortOrder}
            onTableIsActiveChange={adminForm.setAdminTableIsActive}
            onSaveTableRef={adminOps.saveTableRef}
            onCancelTableEdit={adminForm.resetTable}
            onStaffEmailChange={adminForm.setAdminStaffEmail}
            onStaffPasswordChange={adminForm.setAdminStaffPassword}
            onStaffDisplayNameChange={adminForm.setAdminStaffDisplayName}
            onStaffRoleTypeChange={adminForm.setAdminStaffRoleType}
            onStaffIsActiveChange={adminForm.setAdminStaffIsActive}
            onSaveStaffUser={adminOps.saveStaffUser}
            onCancelStaffUserEdit={adminForm.resetStaffUser}
            onToggleSoldOut={adminOps.toggleSoldOut}
            onEditMenuBook={(id) => {
              const book = liveMenuBooks.find((b) => b.id === id)
              if (book) adminForm.beginEditMenuBook(book)
            }}
            onDeleteMenuBook={adminOps.deleteMenuBook}
            onEditCategory={(id) => {
              const cat = liveCategories.find((c) => c.id === id)
              if (cat) adminForm.beginEditCategory(cat)
            }}
            onDeleteCategory={adminOps.deleteCategory}
            onEditSubCategory={(id) => {
              const sub = liveSubcategories.find((s) => s.id === id)
              if (sub) adminForm.beginEditSubCategory(sub)
            }}
            onDeleteSubCategory={adminOps.deleteSubcategory}
            onEditMenuItem={(id) => {
              const item = liveItems.find((i) => i.id === id)
              if (item) adminForm.beginEditMenuItem(item)
            }}
            onDeleteMenuItem={adminOps.deleteMenuItem}
            onDeleteBookCategory={adminOps.deleteBookCategory}
            onDeleteBookCategorySubcategory={adminOps.deleteBookCategorySubcategory}
            onSaveBookCategorySort={adminOps.saveBookCategorySort}
            onSaveBookCategorySubcategorySort={adminOps.saveBookCategorySubcategorySort}
            onSavePlacementSort={adminOps.savePlacementSort}
            onEditPlacement={(id) => {
              const p = adminPlacements.find((x) => x.id === id)
              if (p) adminForm.beginEditPlacement(p)
            }}
            onDeletePlacement={adminOps.deletePlacement}
            onEditTable={(id) => {
              const table = availableTables.find((t) => t.id === id)
              if (table) adminForm.beginEditTable(table)
            }}
            onDeleteTable={adminOps.deleteTable}
            onEditStaffUser={(id) => {
              const user = liveStaffUsers.find((u) => u.id === id)
              if (user) adminForm.beginEditStaffUser(user)
            }}
            onDeleteStaffUser={adminOps.deleteStaffUser}
            setAdminMessage={setAdminMessage}
            setError={setError}
            onOpenLauncher={() => setIsLauncherOpen(true)}
          />
        ) : null}
        {view === 'setup' ? (
          <SetupScreen 
            initialConfig={nativeSetup.config}
            liveStores={liveStore ? [liveStore] : []}
            liveTables={liveTables}
            isStaffLoggedIn={Boolean(session && profile)}
            email={email}
            password={password}
            onEmailChange={setEmail}
            onPasswordChange={setPassword}
            onSignIn={handleSignIn}
            authStoreSlug={authStoreSlug}
            onAuthStoreSlugChange={setAuthStoreSlug}
            authError={authError}
            authBusy={authBusy}
            onSave={(cfg) => {
              nativeSetup.saveConfig(cfg)
              setCustomerAccess({
                storeSlug: cfg.storeSlug,
                qrToken: cfg.qrToken,
                ticketToken: cfg.ticketToken || ''
              })
              moveTo(cfg.view)
            }}
            onCancel={nativeSetup.isConfigured ? () => moveTo(nativeSetup.config!.view) : undefined}
          />
        ) : null}
          </>
        )}
      </main>
    </div>
  )
}

