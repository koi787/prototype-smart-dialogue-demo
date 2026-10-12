import { useEffect, useMemo, useRef, useState } from 'react'
import { MobileShell } from '../components/MobileShell'
import { demoRoutes, navigate, recordFeedbackNoticeKey } from '../routes'
import { RecordDetailPage } from './RecordDetailPage'
import { useReceptionRecords } from '../store/ReceptionRecordsContext'
import { createAndAssociateMockMember, findMemberById, isMemberInCandidateSet, mockMembers, searchMembers, type Member } from '../data/mockMembers'
import { filterAssignedCustomers } from '../data/mockCustomerActivity'
import { mockCurrentEmployee, mockEmployeeReceptionistPermissionIds, mockReceptionists } from '../data/mockStaff'
import { structuredContentLabels, type StructuredContent } from '../types/record'
import { useStoreContext } from '../store/StoreContext'
import { canEditCustomerInformation, isPreselectedCustomerRelationIntact } from '../data/preselectedCustomer'
import { formatMaskedPhone } from '../data/phoneDisplay'

function toDatetimeLocal(value: string) {
  return value ? value.replace(' ', 'T').slice(0, 16) : ''
}

function fromDatetimeLocal(value: string) {
  return value.replace('T', ' ')
}

export function ConfirmRecordPage({ recordId }: { recordId: string }) {
  const { getRecord, updateRecord } = useReceptionRecords()
  const { accessibleStores, currentStore } = useStoreContext()
  const record = getRecord(recordId)
  const availableReceptionists = mockReceptionists.filter((teacher) => mockEmployeeReceptionistPermissionIds.includes(teacher.id))
  const [editingReceptionInfo, setEditingReceptionInfo] = useState(false)
  const [receptionStoreId, setReceptionStoreId] = useState('')
  const [primaryReceptionist, setPrimaryReceptionist] = useState('')
  const [coReceptionists, setCoReceptionists] = useState<string[]>([])
  const [coSearchOpen, setCoSearchOpen] = useState(false)
  const [coSearch, setCoSearch] = useState('')
  const [receptionTime, setReceptionTime] = useState('')
  const [editingCustomer, setEditingCustomer] = useState(false)
  const [customerName, setCustomerName] = useState('')
  const [customerPhone, setCustomerPhone] = useState('')
  const [customerSearchQuery, setCustomerSearchQuery] = useState('')
  const [customerSelectionError, setCustomerSelectionError] = useState('')
  const [matchedMember, setMatchedMember] = useState<Member | undefined>()
  const [newMemberDialogOpen, setNewMemberDialogOpen] = useState(false)
  const [newMemberName, setNewMemberName] = useState('')
  const [newMemberPhone, setNewMemberPhone] = useState('')
  const [newMemberError, setNewMemberError] = useState('')
  const [creatingMember, setCreatingMember] = useState(false)
  const [editingModuleKey, setEditingModuleKey] = useState<keyof StructuredContent | null>(null)
  const [moduleDraft, setModuleDraft] = useState('')
  const [editNotice, setEditNotice] = useState('')
  const isSubmittingRef = useRef(false)
  const isCreatingMemberRef = useRef(false)
  const coCandidates = availableReceptionists.filter((teacher) => teacher.name !== primaryReceptionist && !coReceptionists.includes(teacher.name) && teacher.name.includes(coSearch.trim()))
  const currentStoreMembers = useMemo(
    () => filterAssignedCustomers(mockMembers, { storeId: currentStore.id }),
    [currentStore.id, mockMembers.length],
  )

  useEffect(() => {
    if (!record) return
    setReceptionStoreId(record.storeId)
    setPrimaryReceptionist(record.primaryReceptionist || record.receptionistName)
    setCoReceptionists(record.coReceptionists)
    setCoSearchOpen(false)
    setCoSearch('')
    setReceptionTime(toDatetimeLocal(record.receptionTime))
    setCustomerName(record.customerInfo.name)
    setCustomerPhone(record.customerInfo.phone)
    const member = findMemberById(record.memberId, record.customerId)
    const relationIsBound = record.customerBindingStatus === 'bound'
      && Boolean(member)
      && member?.id === record.memberId
      && member?.customerId === record.customerId
      && member?.name === record.customerInfo.name
      && member?.phone === record.customerInfo.phone
    setMatchedMember(relationIsBound ? member : undefined)
    setCustomerSelectionError('')
    setCustomerSearchQuery('')
  }, [record?.id])

  useEffect(() => {
    if (!record || record.creationSource !== 'customer-list') return
    const selectedMember = findMemberById(record.memberId, record.customerId)
    if (isPreselectedCustomerRelationIntact(record, selectedMember, record.customerInfo.name, record.customerInfo.phone)) {
      setMatchedMember(selectedMember)
      setCustomerName(record.customerInfo.name)
      setCustomerPhone(record.customerInfo.phone)
      setCustomerSelectionError('')
      return
    }
    setMatchedMember(undefined)
    setCustomerSelectionError('预选客户信息无法验证，请返回客户列表重新发起。')
  }, [record?.id])

  useEffect(() => {
    if (!record || !editingCustomer || !matchedMember) return
    const isPersistedRelation = record.customerBindingStatus === 'bound'
      && matchedMember.id === record.memberId
      && matchedMember.customerId === record.customerId
    if (isPersistedRelation || isMemberInCandidateSet(matchedMember, currentStoreMembers)) return

    setMatchedMember(undefined)
    setCustomerName('')
    setCustomerPhone('')
    setCustomerSelectionError('当前门店已切换，请重新搜索并选择客户。')
  }, [currentStoreMembers, editingCustomer, matchedMember, record])

  if (!record) {
    return (
      <MobileShell title="确认接待记录" onBack={() => navigate(demoRoutes.records)}>
        <section className="empty-state"><h2>记录不存在</h2><p>请返回列表重新开始记录。</p></section>
      </MobileShell>
    )
  }

  if (record.status === 'submitted' && !isSubmittingRef.current) return <RecordDetailPage recordId={record.id} />

  const methodLabel = record.method === 'face-to-face' ? '面客模式' : '事后补录'
  const customerInformationEditable = canEditCustomerInformation(record)
  const selectedReceptionStore = accessibleStores.find((store) => store.id === receptionStoreId)
  const customerDirty = editingCustomer && (
    customerName !== record.customerInfo.name
    || customerPhone !== record.customerInfo.phone
    || matchedMember?.id !== record.memberId
    || matchedMember?.customerId !== record.customerId
  )
  const customerSearchResults = searchMembers(customerSearchQuery, currentStoreMembers)
  const moduleDirty = editingModuleKey !== null && moduleDraft !== record.aiContent[editingModuleKey]
  const receptionInfoDirty = editingReceptionInfo && (
    receptionStoreId !== record.storeId ||
    primaryReceptionist !== (record.primaryReceptionist || record.receptionistName) ||
    coReceptionists.join('|') !== record.coReceptionists.join('|') ||
    receptionTime !== toDatetimeLocal(record.receptionTime)
  )
  const hasUnsavedEdit = receptionInfoDirty || customerDirty || moduleDirty

  const canSwitchEditTarget = () => {
    if (hasUnsavedEdit) {
      setEditNotice('当前卡片有未保存修改，请先点击当前卡片的“保存”或“取消”。')
      return false
    }
    setEditNotice('')
    return true
  }

  const openCustomerEdit = () => {
    if (!customerInformationEditable) return
    if (!canSwitchEditTarget()) return
    setEditingCustomer(true)
    setEditingReceptionInfo(false)
    setEditingModuleKey(null)
    setCoSearchOpen(false)
    setCoSearch('')
    setCustomerSearchQuery('')
    setCustomerSelectionError('')
    setEditNotice('')
  }

  const openReceptionInfoEdit = () => {
    if (!canSwitchEditTarget()) return
    setEditingReceptionInfo(true)
    setEditingCustomer(false)
    setEditingModuleKey(null)
    setCoSearchOpen(false)
    setCoSearch('')
    setEditNotice('')
  }

  const openModuleEdit = (key: keyof StructuredContent) => {
    if (!canSwitchEditTarget()) return
    setEditingCustomer(false)
    setEditingReceptionInfo(false)
    setEditingModuleKey(key)
    setCoSearchOpen(false)
    setCoSearch('')
    setModuleDraft(record.aiContent[key])
    setEditNotice('')
  }

  const cancelCustomerEdit = () => {
    setCustomerName(record.customerInfo.name)
    setCustomerPhone(record.customerInfo.phone)
    setMatchedMember(findMemberById(record.memberId, record.customerId))
    setCustomerSearchQuery('')
    setCustomerSelectionError('')
    setEditingCustomer(false)
    setEditNotice('')
  }

  const searchForCustomer = (query: string) => {
    setCustomerSearchQuery(query)
    setCustomerSelectionError('')
    if (query !== customerSearchQuery) {
      setMatchedMember(undefined)
      setCustomerName('')
      setCustomerPhone('')
    }
  }

  const selectCustomer = (member: Member) => {
    const allowedMember = currentStoreMembers.find((candidate) => candidate.id === member.id && candidate.customerId === member.customerId)
    if (!allowedMember || !isMemberInCandidateSet(member, currentStoreMembers)) {
      setMatchedMember(undefined)
      setCustomerName('')
      setCustomerPhone('')
      setCustomerSelectionError('该客户不属于当前门店，无法选择。')
      return
    }
    setMatchedMember(allowedMember)
    setCustomerName(allowedMember.name)
    setCustomerPhone(allowedMember.phone)
    setCustomerSearchQuery('')
    setCustomerSelectionError('')
  }

  const openCreateMemberDialog = () => {
    const query = customerSearchQuery.trim()
    const isFullPhone = /^1[3-9]\d{9}$/.test(query)
    setNewMemberName(query && !/^\d+$/.test(query) ? query : '')
    setNewMemberPhone(isFullPhone ? query : '')
    setNewMemberError('')
    setNewMemberDialogOpen(true)
  }

  const closeCreateMemberDialog = () => {
    if (creatingMember) return
    setNewMemberDialogOpen(false)
    setNewMemberError('')
  }

  const createAndAssociateMember = () => {
    if (isCreatingMemberRef.current) return
    const name = newMemberName.trim()
    const phone = newMemberPhone.trim()
    if (!name) {
      setNewMemberError('请输入用户姓名')
      return
    }
    if (!phone) {
      setNewMemberError('请输入手机号')
      return
    }
    if (!/^1[3-9]\d{9}$/.test(phone)) {
      setNewMemberError('请输入正确的手机号')
      return
    }

    isCreatingMemberRef.current = true
    setCreatingMember(true)
    let createdMember: Member | undefined
    try {
      const result = createAndAssociateMockMember(name, phone, currentStore.id, currentStore.name, (member) => {
        createdMember = member
        if (member.storeId !== currentStore.id || !member.id || !member.customerId) {
          throw new Error('新用户信息无法验证，暂时不能关联接待记录。')
        }
        updateRecord(record.id, { ...customerPatch(member) })
      })
      createdMember = result.member
      if (result.associationError) throw new Error('新用户已创建，但暂未关联此接待记录。请点击保存重试；请勿再次新增。')
      setMatchedMember(createdMember)
      setCustomerName(createdMember.name)
      setCustomerPhone(createdMember.phone)
      setCustomerSearchQuery('')
      setCustomerSelectionError('')
      setEditingCustomer(false)
      setNewMemberDialogOpen(false)
      setNewMemberError('')
    } catch (error) {
      if (createdMember) {
        setMatchedMember(createdMember)
        setCustomerName(createdMember.name)
        setCustomerPhone(createdMember.phone)
        setCustomerSearchQuery('')
        setCustomerSelectionError('用户已新增，但暂未关联此接待记录。请点击保存重试；请勿再次新增。')
        setNewMemberDialogOpen(false)
      } else {
        setNewMemberError(error instanceof Error ? error.message : '新增失败，请稍后重试。')
      }
    } finally {
      isCreatingMemberRef.current = false
      setCreatingMember(false)
    }
  }

  const cancelReceptionInfoEdit = () => {
    setReceptionStoreId(record.storeId)
    setPrimaryReceptionist(record.primaryReceptionist || record.receptionistName)
    setCoReceptionists(record.coReceptionists)
    setCoSearchOpen(false)
    setCoSearch('')
    setReceptionTime(toDatetimeLocal(record.receptionTime))
    setEditingReceptionInfo(false)
    setEditNotice('')
  }

  const saveReceptionInfo = () => {
    if (!selectedReceptionStore || !primaryReceptionist || !receptionTime) {
      setEditNotice('请选择门店、主接待人并填写接待时间。')
      return
    }
    updateRecord(record.id, {
      storeId: selectedReceptionStore.id,
      storeName: selectedReceptionStore.name,
      primaryReceptionist,
      coReceptionists,
      receptionistName: primaryReceptionist,
      receptionTime: fromDatetimeLocal(receptionTime),
    })
    setEditingReceptionInfo(false)
    setEditNotice('')
  }

  const addCoReceptionist = (name: string) => {
    if (name === primaryReceptionist || coReceptionists.includes(name)) return
    setCoReceptionists((current) => [...current, name])
  }

  const saveModule = () => {
    if (!editingModuleKey) return
    updateRecord(record.id, { aiContent: { ...record.aiContent, [editingModuleKey]: moduleDraft }, status: 'draft' })
    setEditingModuleKey(null)
    setModuleDraft('')
    setEditNotice('')
  }

  const cancelModuleEdit = () => {
    setEditingModuleKey(null)
    setModuleDraft('')
    setEditNotice('')
  }

  const ensureCanSave = (allowCurrentEdit = false) => {
    if (!isPreselectedCustomerRelationIntact(record, matchedMember, customerName, customerPhone)) {
      setEditNotice('当前记录已关联所选客户，本阶段暂不支持更换客户。请取消客户信息修改后继续；完整客户信息锁定将在后续阶段完善。')
      setEditingCustomer(true)
      return false
    }
    if (!allowCurrentEdit && hasUnsavedEdit) {
      setEditNotice('当前卡片有未保存修改，请先点击当前卡片的“保存”或“取消”。')
      return false
    }
    if (!matchedMember || !matchedMember.id || !matchedMember.customerId) {
      setCustomerSelectionError('请搜索并选择客户后继续。')
      setEditingCustomer(true)
      return false
    }
    if (!matchedMember.name.trim() || !matchedMember.phone.trim()) {
      setCustomerSelectionError('所选客户信息不完整，请重新选择客户。')
      setEditingCustomer(true)
      return false
    }
    const isPersistedRelation = record.customerBindingStatus === 'bound'
      && matchedMember.id === record.memberId
      && matchedMember.customerId === record.customerId
    if (!isPersistedRelation && !isMemberInCandidateSet(matchedMember, currentStoreMembers)) {
      setCustomerSelectionError('所选客户不属于当前门店，请重新搜索并选择。')
      setEditingCustomer(true)
      return false
    }
    return true
  }

  const customerPatch = (member = matchedMember) => ({
    customerInfo: {
      name: member?.name ?? customerName.trim(),
      phone: member?.phone ?? customerPhone.trim(),
    },
    customerName: member?.name ?? customerName.trim(),
    customerPhone: member?.phone ?? customerPhone.trim(),
    customerBindingStatus: 'bound' as const,
    customerRelationStatus: 'bound' as const,
    memberId: member?.id,
    customerId: member?.customerId,
  })

  const saveCustomer = () => {
    if (!customerInformationEditable) return
    if (!ensureCanSave(true)) return
    const member = matchedMember
    if (!member) {
      setCustomerSelectionError('请搜索并选择客户后继续。')
      return
    }
    setMatchedMember(member)
    setCustomerName(member.name)
    setCustomerPhone(member.phone)
    updateRecord(record.id, { ...customerPatch(member), status: 'draft' })
    setEditingCustomer(false)
    setCustomerSelectionError('')
    setEditNotice('')
  }

  const saveDraft = () => {
    if (!ensureCanSave()) return
    try {
      updateRecord(record.id, { ...customerPatch(), status: 'draft' })
    } catch {
      setEditNotice('草稿保存失败，请稍后重试。')
      return
    }
    try {
      window.sessionStorage.setItem(recordFeedbackNoticeKey, JSON.stringify({ recordId: record.id, status: 'draft', createdAt: Date.now() }))
    } catch {
      // Keep the existing return-to-list behavior if browser storage is unavailable.
    }
    navigate(demoRoutes.records)
  }

  const submitRecord = () => {
    if (isSubmittingRef.current) return
    if (!ensureCanSave()) return
    isSubmittingRef.current = true
    try {
      updateRecord(record.id, { ...customerPatch(), status: 'submitted', recordingState: 'idle', submitter: mockCurrentEmployee.name })
    } catch {
      isSubmittingRef.current = false
      setEditNotice('接待记录提交失败，请稍后重试。')
      return
    }
    try {
      window.sessionStorage.setItem(recordFeedbackNoticeKey, JSON.stringify({ recordId: record.id, status: 'submitted', createdAt: Date.now() }))
    } catch {
      // Keep the existing return-to-list behavior if browser storage is unavailable.
    }
    navigate(demoRoutes.records)
  }

  return (
    <MobileShell
      title="确认接待记录"
      onBack={() => navigate(demoRoutes.records)}
      fixedFooter={
        <div className="confirm-actions">
          <button className="secondary-button" type="button" onClick={saveDraft}>保存草稿</button>
          <button className="primary-button primary-button--large" type="button" onClick={submitRecord}>确认提交</button>
        </div>
      }
    >
      <div className="complete-banner"><span className="complete-banner__icon">✓</span><div><strong>AI 整理完成</strong><p>请确认内容准确，再提交本次接待记录。</p></div></div>
      {editNotice && <p className="inline-edit-notice" role="alert">{editNotice}</p>}

      <section className="info-card">
        <div className="info-card__heading"><h3>接待基础信息</h3>{!editingReceptionInfo && <button className="inline-action" type="button" onClick={openReceptionInfoEdit}>编辑</button>}</div>
        {editingReceptionInfo ? (
          <div className="customer-form reception-info-form">
            <label>门店<select value={receptionStoreId} onChange={(event) => setReceptionStoreId(event.target.value)}>{accessibleStores.map((store) => <option key={store.id} value={store.id}>{store.name}</option>)}</select></label>
            <label>主接待人<select value={primaryReceptionist} onChange={(event) => { setPrimaryReceptionist(event.target.value); setCoReceptionists((current) => current.filter((name) => name !== event.target.value)) }}>{availableReceptionists.map((teacher) => <option key={teacher.id} value={teacher.name}>{teacher.name}</option>)}</select></label>
            <div className="reception-co-field">
              <span>协同接待人</span>
              <div className="reception-co-list">
                {coReceptionists.map((name) => (
                  <span className="reception-co-item" key={name}>
                    {name}
                    <button type="button" onClick={() => setCoReceptionists((current) => current.filter((item) => item !== name))} aria-label={`移除${name}`}>×</button>
                  </span>
                ))}
                <button className="reception-add-co" type="button" onClick={() => { setCoSearchOpen(true); setCoSearch('') }}>＋ 添加老师</button>
              </div>
              {coSearchOpen && (
                <div className="reception-co-picker">
                  <input value={coSearch} onChange={(event) => setCoSearch(event.target.value)} placeholder="搜索老师姓名" autoFocus />
                  <div className="reception-co-candidates">
                    {coCandidates.map((teacher) => <button type="button" key={teacher.id} onClick={() => addCoReceptionist(teacher.name)}>{teacher.name}</button>)}
                    {coCandidates.length === 0 && <span>暂无可添加老师</span>}
                  </div>
                  <button className="text-button reception-co-picker__done" type="button" onClick={() => { setCoSearchOpen(false); setCoSearch('') }}>收起</button>
                </div>
              )}
            </div>
            <label>接待时间<input type="datetime-local" value={receptionTime} onChange={(event) => setReceptionTime(event.target.value)} /></label>
            <div className="reception-readonly-field"><span>记录方式</span><strong>{methodLabel}</strong></div>
            <div className="inline-actions"><button className="text-button" type="button" onClick={cancelReceptionInfoEdit}>取消</button><button className="small-primary-button" type="button" onClick={saveReceptionInfo}>保存</button></div>
          </div>
        ) : (
          <dl className="info-grid">
            <div><dt>门店</dt><dd>{record.storeName}</dd></div>
            <div><dt>主接待人</dt><dd>{record.primaryReceptionist || record.receptionistName}</dd></div>
            <div><dt>协同接待人</dt><dd>{record.coReceptionists.length > 0 ? record.coReceptionists.join('、') : '--'}</dd></div>
            <div><dt>接待时间</dt><dd>{record.receptionTime || '--'}</dd></div>
            <div><dt>记录方式</dt><dd>{methodLabel}</dd></div>
          </dl>
        )}
      </section>

      <section className="info-card customer-edit-card">
        <div className="info-card__heading"><h3>客户信息</h3>{customerInformationEditable && !editingCustomer && <button className="inline-action" type="button" onClick={openCustomerEdit}>编辑</button>}</div>
        {editingCustomer && customerInformationEditable ? (
          <div className="customer-form">
            <label>搜索客户<input aria-label="搜索客户姓名或手机号" autoComplete="off" value={customerSearchQuery} onChange={(event) => searchForCustomer(event.target.value)} placeholder="搜索客户姓名 / 手机号" /></label>
            <p className="customer-create-helper">系统中没有该客户？请先新增用户，再继续操作。</p>
            {customerSearchQuery.trim() && (
              <div className="customer-search-results" role="listbox" aria-label="匹配客户列表">
                {customerSearchResults.map((member) => (
                  <button
                    className="customer-search-result"
                    type="button"
                    role="option"
                    aria-selected={matchedMember?.id === member.id}
                    key={member.id}
                    onClick={() => selectCustomer(member)}
                  >
                    <strong>{member.name}</strong><span>{formatMaskedPhone(member.phone, '手机号未填写')}</span>
                  </button>
                ))}
                {customerSearchResults.length === 0 && <p className="customer-search-empty">未找到匹配客户</p>}
              </div>
            )}
            <button className="customer-create-trigger" type="button" onClick={openCreateMemberDialog}>＋ 新增用户</button>
            {matchedMember && (
              <div className="customer-search-selected">
                <span>已选择客户</span>
                <strong>{matchedMember.name}</strong>
                <span>{formatMaskedPhone(matchedMember.phone, '手机号未填写')}</span>
              </div>
            )}
            {customerSelectionError && <p className="field-error" role="alert">{customerSelectionError}</p>}
            <div className="inline-actions"><button className="text-button" type="button" onClick={cancelCustomerEdit}>取消</button><button className="small-primary-button" type="button" onClick={saveCustomer}>保存</button></div>
          </div>
        ) : (
          <>
            <dl className="info-grid info-grid--customer">
              <div><dt>手机号</dt><dd>{formatMaskedPhone(customerPhone, '未填写')}</dd></div>
              <div><dt>姓名</dt><dd>{customerName || '未填写'}</dd></div>
            </dl>
            {record.customerBindingStatus === 'bound' ? <div className="customer-lookup-state customer-lookup-state--matched"><strong>✓ 客户已关联</strong></div> : <p className="customer-lookup-helper">尚未关联客户</p>}
          </>
        )}
      </section>

      <section className="content-section confirm-content-section">
        <div className="section-heading"><div><span className="section-kicker">AI 整理结果</span><h2>请逐项确认</h2></div><span className="content-count">8 项</span></div>
        <div className="structured-list">
          {structuredContentLabels.map(({ key, label }) => (
            <article className="structured-card" key={key}>
              <div className="structured-card__heading"><span className="module-dot" aria-hidden="true" /><h3>{label}</h3>{editingModuleKey !== key && <button className="inline-action" type="button" onClick={() => openModuleEdit(key)}>编辑</button>}</div>
              {editingModuleKey === key ? (
                <div className="module-editor module-editor--inline">
                  <textarea aria-label={`${label}内容`} value={moduleDraft} onChange={(event) => setModuleDraft(event.target.value)} rows={5} />
                  <div className="inline-actions"><button className="text-button" type="button" onClick={cancelModuleEdit}>取消</button><button className="small-primary-button" type="button" onClick={saveModule}>保存</button></div>
                </div>
              ) : <p>{record.aiContent[key] || '未提及'}</p>}
            </article>
          ))}
        </div>
      </section>

      {newMemberDialogOpen && (
        <div className="customer-create-overlay" onClick={closeCreateMemberDialog}>
          <section
            className="customer-create-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="customer-create-title"
            onClick={(event) => event.stopPropagation()}
          >
            <h2 id="customer-create-title">新增用户</h2>
            <label>
              用户姓名
              <input autoFocus value={newMemberName} onChange={(event) => setNewMemberName(event.target.value)} placeholder="请输入用户姓名" />
            </label>
            <label>
              手机号
              <input inputMode="tel" autoComplete="tel" value={newMemberPhone} onChange={(event) => setNewMemberPhone(event.target.value)} placeholder="请输入手机号" />
            </label>
            {newMemberError && <p className="field-error" role="alert">{newMemberError}</p>}
            <div className="customer-create-dialog__actions">
              <button className="secondary-button" type="button" onClick={closeCreateMemberDialog} disabled={creatingMember}>取消</button>
              <button className="primary-button" type="button" onClick={createAndAssociateMember} disabled={creatingMember}>{creatingMember ? '新增中…' : '确认新增'}</button>
            </div>
          </section>
        </div>
      )}
    </MobileShell>
  )
}
