import type {
  UserProfile,
  StorageUsage,
  SecurityIssue,
  ActivityControl,
  ContactItem,
  SubscriptionItem,
  HelpArticle,
} from '../types/user.types'

const API_BASE = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1').replace(/\/$/, '')
const PROFILE_URL = `${API_BASE}/profile`

// Helper – normalise a raw backend record to a UserProfile shape
function normaliseProfile(raw: any): UserProfile {
  return {
    id: raw.id || raw._id || 'usr_1',
    name: raw.name || 'Alex Morgan',
    nickname: raw.nickname || 'Alex',
    email: raw.email || 'alex.morgan@example.com',
    phone: raw.phone || '+1 (555) 019-2834',
    avatarText: raw.avatarText || (raw.name ? raw.name.charAt(0).toUpperCase() : 'A'),
    birthday: raw.birthday || 'October 14, 1994',
    gender: raw.gender || 'Rather not say',
    passwordLastChanged: raw.passwordLastChanged || 'Aug 8, 2023',
  }
}

class UserService {
  // ─── Profile ─────────────────────────────────────────────────────────────

  async getUserProfile(): Promise<UserProfile> {
    try {
      const res = await fetch(`${PROFILE_URL}`)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const json = await res.json()
      return normaliseProfile(json.data)
    } catch (err) {
      console.warn('[userService] getUserProfile fallback (backend unreachable):', err)
      return normaliseProfile({})
    }
  }

  async updateUserProfile(updates: Partial<UserProfile>): Promise<UserProfile> {
    const res = await fetch(`${PROFILE_URL}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    })
    if (!res.ok) {
      const errJson = await res.json().catch(() => ({}))
      throw new Error(errJson?.error?.message || `HTTP ${res.status}: Failed to update profile`)
    }
    const json = await res.json()
    return normaliseProfile(json.data)
  }

  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    const res = await fetch(`${PROFILE_URL}/password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ currentPassword, newPassword }),
    })
    if (!res.ok) {
      const errJson = await res.json().catch(() => ({}))
      throw new Error(errJson?.error?.message || `HTTP ${res.status}: Failed to change password`)
    }
  }

  // ─── Storage ─────────────────────────────────────────────────────────────

  async getStorageUsage(): Promise<StorageUsage> {
    try {
      const res = await fetch(`${PROFILE_URL}/storage`)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const json = await res.json()
      return json.data as StorageUsage
    } catch {
      return { usedGb: 0.68, totalGb: 15, usedPercentage: 4 }
    }
  }

  // ─── Security ─────────────────────────────────────────────────────────────

  async getSecurityIssues(): Promise<SecurityIssue[]> {
    try {
      const res = await fetch(`${PROFILE_URL}/security`)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const json = await res.json()
      return (json.data?.issues || []) as SecurityIssue[]
    } catch {
      return [{ id: 'sec_1', title: '2-Step Verification disabled', description: 'Add an extra layer of security.', severity: 'medium' }]
    }
  }

  async getSecuritySettings(): Promise<{ twoStepVerification: boolean; lessSecureApps: boolean; phoneSignIn: boolean }> {
    try {
      const res = await fetch(`${PROFILE_URL}/security`)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const json = await res.json()
      return {
        twoStepVerification: json.data?.twoStepVerification ?? false,
        lessSecureApps: json.data?.lessSecureApps ?? false,
        phoneSignIn: json.data?.phoneSignIn ?? false,
      }
    } catch {
      return { twoStepVerification: false, lessSecureApps: false, phoneSignIn: false }
    }
  }

  async updateSecuritySettings(updates: { twoStepVerification?: boolean; lessSecureApps?: boolean; phoneSignIn?: boolean }): Promise<void> {
    const res = await fetch(`${PROFILE_URL}/security`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    })
    if (!res.ok) {
      const errJson = await res.json().catch(() => ({}))
      throw new Error(errJson?.error?.message || `HTTP ${res.status}: Failed to update security settings`)
    }
  }

  // ─── Activity Controls / Preferences ─────────────────────────────────────

  async getActivityControls(): Promise<ActivityControl[]> {
    try {
      const res = await fetch(`${PROFILE_URL}/preferences`)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const json = await res.json()
      return (json.data?.activityControls || []) as ActivityControl[]
    } catch {
      return [
        { id: 'act_1', title: 'Web & App Activity', status: 'On' },
        { id: 'act_2', title: 'Location History', status: 'On' },
        { id: 'act_3', title: 'Usage History', status: 'On' },
      ]
    }
  }

  async updateActivityControls(activityControls: ActivityControl[]): Promise<void> {
    const res = await fetch(`${PROFILE_URL}/preferences`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ activityControls }),
    })
    if (!res.ok) {
      const errJson = await res.json().catch(() => ({}))
      throw new Error(errJson?.error?.message || `HTTP ${res.status}: Failed to update activity controls`)
    }
  }

  // ─── Contacts ─────────────────────────────────────────────────────────────

  async getContacts(): Promise<ContactItem[]> {
    try {
      const res = await fetch(`${PROFILE_URL}/contacts`)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const json = await res.json()
      return (json.data || []) as ContactItem[]
    } catch {
      return [
        { id: 'c_1', name: 'Sarah Connor', email: 'sarah@example.com', avatarText: 'S' },
        { id: 'c_2', name: 'John Doe', email: 'john@example.com', avatarText: 'J' },
        { id: 'c_3', name: 'Emma Watson', email: 'emma@example.com', avatarText: 'E' },
      ]
    }
  }

  // ─── Subscriptions ────────────────────────────────────────────────────────

  async getSubscriptions(): Promise<SubscriptionItem[]> {
    try {
      const res = await fetch(`${PROFILE_URL}/subscriptions`)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const json = await res.json()
      return (json.data || []) as SubscriptionItem[]
    } catch {
      return [
        { id: 'sub_1', title: 'HRMS Storage Plus', description: '100 GB Cloud Storage', cost: '$1.99/mo', status: 'Active' },
        { id: 'sub_2', title: 'HRMS Security Pass', description: 'Advanced protection suite', cost: '$4.99/mo', status: 'Active' },
      ]
    }
  }

  // ─── Help Articles ────────────────────────────────────────────────────────

  async getHelpArticles(): Promise<HelpArticle[]> {
    try {
      const res = await fetch(`${PROFILE_URL}/help`)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const json = await res.json()
      return (json.data || []) as HelpArticle[]
    } catch {
      return [
        { id: 'h_1', title: 'See and control the data in your account', category: 'Privacy' },
        { id: 'h_2', title: 'Manage your HRMS settings', category: 'Account' },
        { id: 'h_3', title: 'Secure an account that has suspicious activity', category: 'Security' },
      ]
    }
  }
}

export const userService = new UserService()
