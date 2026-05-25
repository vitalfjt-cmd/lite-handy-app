import { AppView } from './types'

export const VIEWS: { id: AppView; label: string; caption: string }[] = [
  { id: 'staff', label: 'Staff', caption: '伝票対応' },
  { id: 'kds', label: 'KDS', caption: '調理キュー' },
  { id: 'admin', label: 'Admin', caption: 'メニュー管理' },
]

export const PROTOTYPE_STAFF_SESSION_STORAGE_KEY = 'lite-pos.prototype-staff-session'

export const EMPTY_ACTIVE_STORE = {
  name: '',
  tableName: '',
  ticketNo: '',
}
