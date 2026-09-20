import { useEffect, useRef, useState } from 'react'
import { MobileShell } from '../components/MobileShell'
import { demoRoutes, navigate, submitSuccessNoticeKey } from '../routes'
import { RecordDetailPage } from './RecordDetailPage'
import { useReceptionRecords } from '../store/ReceptionRecordsContext'
import { createMockMember, findMemberById, findMembersByPhone, updateMockMemberName, type Member } from '../data/mockMembers'
import { mockCurrentEmployee, mockEmployeeReceptionistPermissionIds, mockReceptionists } from '../data/mockStaff'
import { structuredContentLabels, type CustomerLookupStatus, type StructuredContent } from '../types/record'
import { useStoreContext } from '../store/StoreContext'

const phonePattern = /^1[3-9]\d{9}$/

function lookupStatusMessage(status: CustomerLookupStatus) {
  if (status === 'querying') return '正在查询客户...'
  if (status === 'not-found') return '未查询到该客户，保存后将新增客户信息。'
  if (status === 'ambiguous' || status === 'error') return '客户查询异常，请稍后重试'
  return ''
}

function toDatetimeLocal(value: string) {
  return value ? value.replace(' ', 'T').slice(0, 16) : ''
}

function fromDatetimeLocal(value: string) {
  return value.replace('T', ' ')
}

export function ConfirmRecordPage({ recordId }: { recordId: string }) {
  const { getRecord, updateRecord } = useReceptionRecords()
  const { accessibleStores } = useStoreContext()
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
  const [phoneError, setPhoneError] = useState('')
  const [lookupStatus, setLookupStatus] = useState<CustomerLookupStatus>('empty')
  const [matchedMember, setMatchedMember] = useState<Member | undefined>()
  const [editingModuleKey, setEditingModuleKey] = useState<keyof StructuredContent | null>(null)
  const [moduleDraft, setModuleDraft] = useState('')
  const [editNotice, setEditNotice] = useState('')
  const isSubmittingRef = useRef(false)
  const coCandidates = availableReceptionists.filter((teacher) => teacher.name !== primaryReceptionist && !coReceptionists.includes(teacher.name) && teacher.name.includes(coSearch.trim()))

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
    setMatchedMember(findMemberById(record.memberId, record.customerId))
  }, [record?.id])

  useEffect(() => {
    const phone = customerPhone.trim()
    setMatchedMember(undefined)
    setPhoneError('')
    if (!phone) {
      setLookupStatus('empty')
      return
    }
    if (!phonePattern.test(phone)) {
      setLookupStatus('invalid')
      setPhoneError('请输入正确的手机号，或清空后继续')
      return
    }

    setPhoneError('')
    setLookupStatus('querying')
    const timer = window.setTimeout(() => {
      try {
        const matches = findMembersByPhone(phone)
        if (matches.length === 1) {
          setMatchedMember(matches[0])
          setCustomerName(matches[0].name)
          setLookupStatus('matched')
          return
        }
        if (matches.length > 1) {
          setLookupStatus('ambiguous')
          return
        }
        setLookupStatus('not-found')
      } catch {
        setLookupStatus('error')
      }
    }, 520)
    return () => window.clearTimeout(timer)
  }, [customerPhone])

  if (!record) {
    return (
      <MobileShell title="确认接待记录" onBack={() => navigate(demoRoutes.records)}>
        <section className="empty-state"><h2>记录不存在</h2><p>请返回列表重新开始记录。</p></section>
      </MobileShell>
    )
  }

  if (record.status === 'submitted' && !isSubmittingRef.current) return <RecordDetailPage recordId={record.id} />

  const methodLabel = record.method === 'face-to-face' ? '面客模式' : '事后补录'
  const selectedReceptionStore = accessibleStores.find((store) => store.id === receptionStoreId)
  const validPhone = phonePattern.test(customerPhone.trim())
  const lookupInProgress = lookupStatus === 'querying'
  const customerDirty = editingCustomer && (customerName !== record.customerInfo.name || customerPhone !== record.customerInfo.phone)
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
    if (!canSwitchEditTarget()) return
    setEditingCustomer(true)
    setEditingReceptionInfo(false)
    setEditingModuleKey(null)
    setCoSearchOpen(false)
    setCoSearch('')
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
    setPhoneError('')
    setEditingCustomer(false)
    setEditNotice('')
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
    if (!allowCurrentEdit && hasUnsavedEdit) {
      setEditNotice('当前卡片有未保存修改，请先点击当前卡片的“保存”或“取消”。')
      return false
    }
    if (!validPhone) {
      setPhoneError(customerPhone.trim() ? '请输入正确的手机号，或清空后继续' : '请输入手机号')
      setEditingCustomer(true)
      return false
    }
    if (lookupInProgress) {
      setPhoneError('正在查询客户，请稍候')
      setEditingCustomer(true)
      return false
    }
    if (lookupStatus === 'ambiguous' || lookupStatus === 'error') {
      setPhoneError(lookupStatusMessage(lookupStatus))
      setEditingCustomer(true)
      return false
    }
    if (lookupStatus !== 'matched' && lookupStatus !== 'not-found') {
      setPhoneError('请先完成客户查询')
      setEditingCustomer(true)
      return false
    }
    if (!customerName.trim()) {
      setPhoneError('请输入客户姓名')
      setEditingCustomer(true)
      return false
    }
    if (!allowCurrentEdit && (!matchedMember || lookupStatus !== 'matched')) {
      setEditNotice('请先保存客户信息，完成用户关联。')
      setEditingCustomer(true)
      return false
    }
    return true
  }

  const customerPatch = (member = matchedMember) => ({
    customerInfo: {
      name: customerName.trim(),
      phone: customerPhone.trim(),
    },
    customerName: customerName.trim(),
    customerPhone: customerPhone.trim(),
    customerBindingStatus: 'bound' as const,
    customerRelationStatus: 'bound' as const,
    memberId: member?.id,
    customerId: member?.customerId,
  })

  const saveCustomer = () => {
    if (!ensureCanSave(true)) return
    let member = matchedMember
    if (!member && lookupStatus === 'not-found') {
      member = createMockMember(customerName.trim(), customerPhone.trim())
    }
    if (!member) {
      setPhoneError('客户查询未完成，请稍后重试')
      return
    }
    if (lookupStatus === 'matched' && customerName.trim() !== member.name) {
      member = updateMockMemberName(member.id, customerName.trim()) ?? member
    }
    setMatchedMember(member)
    setCustomerName(member.name)
    setLookupStatus('matched')
    updateRecord(record.id, { ...customerPatch(member), status: 'draft' })
    setEditingCustomer(false)
    setPhoneError('')
    setEditNotice('')
  }

  const saveDraft = () => {
    if (!ensureCanSave()) return
    updateRecord(record.id, { ...customerPatch(), status: 'draft' })
    navigate(demoRoutes.records)
  }

  const submitRecord = () => {
    if (!ensureCanSave()) return
    isSubmittingRef.current = true
    window.sessionStorage.setItem(submitSuccessNoticeKey, '1')
    updateRecord(record.id, { ...customerPatch(), status: 'submitted', recordingState: 'idle', submitter: mockCurrentEmployee.name })
    navigate(demoRoutes.records)
  }

  return (
    <MobileShell
      title="确认接待记录"
      onBack={() => navigate(demoRoutes.records)}
      fixedFooter={
        <div className="confirm-actions">
          <button className="secondary-button" type="button" disabled={lookupInProgress} onClick={saveDraft}>保存草稿</button>
          <button className="primary-button primary-button--large" type="button" disabled={lookupInProgress} onClick={submitRecord}>确认提交</button>
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
        <div className="info-card__heading"><h3>客户信息</h3>{!editingCustomer && <button className="inline-action" type="button" onClick={openCustomerEdit}>编辑</button>}</div>
        {editingCustomer ? (
          <div className="customer-form">
            <label>手机号（必填）<input inputMode="numeric" value={customerPhone} onChange={(event) => { const nextPhone = event.target.value; setCustomerPhone(nextPhone); setPhoneError(''); if (nextPhone !== customerPhone && (Boolean(matchedMember) || lookupStatus !== 'empty' || Boolean(customerName))) { setMatchedMember(undefined); setCustomerName(''); setLookupStatus('empty') } }} placeholder="请输入手机号" /></label>
            {lookupStatus === 'matched' && matchedMember && (
              <div className="customer-lookup-state customer-lookup-state--matched"><strong>✓ 客户已存在</strong></div>
            )}
            {(lookupStatus === 'querying' || lookupStatus === 'ambiguous' || lookupStatus === 'error') && (
              <div className={`customer-lookup-state customer-lookup-state--${lookupStatus}`}><span>{lookupStatusMessage(lookupStatus)}</span></div>
            )}
            {lookupStatus === 'invalid' && <p className="field-error">请输入正确的手机号，或清空后继续</p>}
            <label>姓名（必填）<input value={customerName} onChange={(event) => setCustomerName(event.target.value)} placeholder={lookupStatus === 'matched' || lookupStatus === 'not-found' ? '请输入客户姓名' : '请先输入手机号'} disabled={lookupStatus !== 'matched' && lookupStatus !== 'not-found'} /></label>
            {lookupStatus === 'matched' && matchedMember && customerName.trim() !== matchedMember.name && <p className="customer-lookup-helper">姓名已修改，保存后将同步更新客户信息。</p>}
            {lookupStatus === 'not-found' && <p className="customer-lookup-helper">未查询到该客户，保存后将新增客户信息。</p>}
            {phoneError && lookupStatus !== 'invalid' && <p className="field-error">{phoneError}</p>}
            <div className="inline-actions"><button className="text-button" type="button" onClick={cancelCustomerEdit}>取消</button><button className="small-primary-button" type="button" disabled={lookupInProgress} onClick={saveCustomer}>保存</button></div>
          </div>
        ) : (
          <>
            <dl className="info-grid info-grid--customer">
              <div><dt>手机号</dt><dd>{customerPhone || '未填写'}</dd></div>
              <div><dt>姓名</dt><dd>{customerName || '未填写'}</dd></div>
            </dl>
            {record.customerBindingStatus === 'bound' ? <div className="customer-lookup-state customer-lookup-state--matched"><strong>✓ 客户已关联</strong></div> : lookupStatus === 'not-found' ? <p className="customer-lookup-helper">未查询到该客户，保存后将新增客户信息。</p> : lookupStatus !== 'empty' && lookupStatus !== 'invalid' && <div className={`customer-lookup-state customer-lookup-state--${lookupStatus}`}><span>{lookupStatusMessage(lookupStatus)}</span></div>}
            {lookupStatus === 'invalid' && <p className="field-error">请输入正确的手机号，或清空后继续</p>}
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
    </MobileShell>
  )
}
