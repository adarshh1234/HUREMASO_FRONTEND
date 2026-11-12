import { useState } from 'react'
import { PageHeader, Card, CardRow } from '../components/Card'
import { Modal } from '../components/Modal'
import { Input } from '../components/Input'
import { Button } from '../components/Button'
import { Loader } from '../components/Loader'
import { userService } from '../services/user.service'
import { useFetchData } from '../hooks/useFetchData'
import useToast from '../../../hooks/useToast'
import {
  KeyIcon,
  PhoneIcon,
  ShieldCheckIcon,
  MailIcon,
  MonitorIcon,
  LockIcon,
  LinkIcon,
} from '../components/Icons'
import type { SecurityIssue } from '../types/user.types'

export default function Security() {
  const { showToast } = useToast()
  const { data: issues, isLoading, setData: setIssues } = useFetchData(() => userService.getSecurityIssues())
  const { data: profile } = useFetchData(() => userService.getUserProfile())
  const { data: secSettings, setData: setSecSettings } = useFetchData(() =>
    userService.getSecuritySettings()
  )

  // ── Password change modal ──────────────────────────────────────────────
  const [pwdModalOpen, setPwdModalOpen] = useState(false)
  const [currentPwd, setCurrentPwd] = useState('')
  const [newPwd, setNewPwd] = useState('')
  const [confirmPwd, setConfirmPwd] = useState('')
  const [isSavingPwd, setIsSavingPwd] = useState(false)

  const handleOpenPasswordModal = () => {
    setCurrentPwd('')
    setNewPwd('')
    setConfirmPwd('')
    setPwdModalOpen(true)
  }

  const handleSavePassword = async () => {
    if (!newPwd || newPwd.length < 6) {
      showToast('New password must be at least 6 characters', 'error')
      return
    }
    if (newPwd !== confirmPwd) {
      showToast('Passwords do not match', 'error')
      return
    }
    setIsSavingPwd(true)
    try {
      await userService.changePassword(currentPwd, newPwd)
      showToast('Password changed successfully', 'success')
      setPwdModalOpen(false)
    } catch (err: any) {
      showToast(err?.message || 'Failed to change password', 'error')
    } finally {
      setIsSavingPwd(false)
    }
  }

  const handleResolveIssues = () => {
    setIssues([])
    showToast('All security issues resolved! Your account is now fully protected.', 'success')
  }

  // ── Security toggles ──────────────────────────────────────────────────
  const handleToggle2FA = async () => {
    const next = !secSettings?.twoStepVerification
    try {
      await userService.updateSecuritySettings({ twoStepVerification: next })
      setSecSettings((prev: any) => ({ ...prev, twoStepVerification: next }))
      showToast(`2-Step Verification turned ${next ? 'On' : 'Off'}`, next ? 'success' : 'warning')
    } catch {
      showToast('Failed to update 2-Step Verification', 'error')
    }
  }

  const handleToggleLessSecure = async () => {
    const next = !secSettings?.lessSecureApps
    try {
      await userService.updateSecuritySettings({ lessSecureApps: next })
      setSecSettings((prev: any) => ({ ...prev, lessSecureApps: next }))
      showToast(`Less secure app access turned ${next ? 'On' : 'Off'}`, next ? 'warning' : 'info')
    } catch {
      showToast('Failed to update less secure app access', 'error')
    }
  }

  // ── Modals state ───────────────────────────────────────────────────
  const [recoveryModalOpen, setRecoveryModalOpen] = useState(false)
  const [recEmail, setRecEmail] = useState('')
  const [recPhone, setRecPhone] = useState('')
  const [eventsModalOpen, setEventsModalOpen] = useState(false)
  const [devicesModalOpen, setDevicesModalOpen] = useState(false)
  const [thirdPartyModalOpen, setThirdPartyModalOpen] = useState(false)
  const [connectedApps, setConnectedApps] = useState([
    { id: '1', name: 'Slack Workplace', scope: 'Basic profile & email', connectedOn: 'Jan 12, 2026' },
    { id: '2', name: 'GitHub Enterprise', scope: 'Repository and user identity', connectedOn: 'Feb 03, 2026' },
    { id: '3', name: 'Figma Design Suite', scope: 'Single Sign-On', connectedOn: 'Mar 15, 2026' },
  ])
  const [devices, setDevices] = useState([
    { id: 'd1', name: 'Windows PC (Chrome)', location: 'New York, USA', time: 'Active now (This device)', current: true },
    { id: 'd2', name: 'iPhone 14 Pro (Safari)', location: 'New York, USA', time: '2 hours ago', current: false },
    { id: 'd3', name: 'MacBook Pro (Firefox)', location: 'Boston, USA', time: '5 days ago', current: false },
  ])

  const handleOpenRecoveryModal = () => {
    setRecEmail(profile?.email || '')
    setRecPhone(profile?.phone || '')
    setRecoveryModalOpen(true)
  }

  const handleSaveRecovery = async () => {
    try {
      await userService.updateUserProfile({ email: recEmail, phone: recPhone })
      showToast('Recovery info updated successfully', 'success')
      setRecoveryModalOpen(false)
    } catch {
      showToast('Failed to save recovery info', 'error')
    }
  }

  const handleRevokeApp = (appId: string, appName: string) => {
    setConnectedApps((prev) => prev.filter((a) => a.id !== appId))
    showToast(`Revoked access for ${appName}`, 'warning')
  }

  const handleSignOutDevice = (devId: string, devName: string) => {
    setDevices((prev) => prev.filter((d) => d.id !== devId))
    showToast(`Signed out from ${devName}`, 'info')
  }

  if (isLoading) {
    return <Loader text="Loading security settings..." />
  }

  return (
    <>
      <PageHeader title="Security" subtitle="Settings and recommendations to help you keep your account secure" />

      <div style={{ maxWidth: 900, margin: '0 auto', display: 'grid', gap: 20 }}>
        <Card
          title="Security issues found"
          description="Protect your account now by resolving these issues"
          graphic={<ShieldCheckIcon />}
          footer={
            <button
              type="button"
              className="link-btn"
              onClick={handleResolveIssues}
            >
              Secure account
            </button>
          }
        >
          {issues?.length === 0 ? (
            <div style={{ fontSize: 13, color: 'var(--text-secondary)', margin: '8px 0' }}>
              ✅ No security issues found
            </div>
          ) : (
            issues?.map((issue: SecurityIssue) => (
              <div key={issue.id} style={{ margin: '8px 0', fontSize: '13px', color: 'var(--text-secondary)' }}>
                <strong>{issue.title}:</strong> {issue.description}
              </div>
            ))
          )}
        </Card>

        <Card
          title="Signing in to Google"
          footer={
            <button
              type="button"
              className="link-btn"
              onClick={handleOpenPasswordModal}
            >
              Change password
            </button>
          }
        >
          <CardRow
            icon={<KeyIcon />}
            label="Password"
            value={`Last changed ${profile?.passwordLastChanged || 'recently'}`}
            onClick={handleOpenPasswordModal}
          />
          <CardRow
            icon={<PhoneIcon />}
            label="Use your phone to sign in"
            value={secSettings?.phoneSignIn ? 'On' : 'Off'}
            onClick={async () => {
              const next = !secSettings?.phoneSignIn
              try {
                await userService.updateSecuritySettings({ phoneSignIn: next })
                setSecSettings((prev: any) => ({ ...prev, phoneSignIn: next }))
                showToast(`Phone sign-in turned ${next ? 'On' : 'Off'}`, next ? 'success' : 'info')
              } catch {
                showToast('Failed to update phone sign-in', 'error')
              }
            }}
          />
          <CardRow
            icon={<ShieldCheckIcon />}
            label="2-Step verification"
            value={secSettings?.twoStepVerification ? 'On' : 'Off'}
            onClick={handleToggle2FA}
          />
        </Card>

        <Card
          title="Ways we can verify it's you"
          description="These can be used to make sure it's really you signing in or to reach you if there's suspicious activity in your account"
          footer={
            <button
              type="button"
              className="link-btn"
              onClick={handleOpenRecoveryModal}
            >
              Update recovery methods
            </button>
          }
        >
          <CardRow
            icon={<PhoneIcon />}
            label="Recovery phone"
            value={profile?.phone}
            onClick={handleOpenRecoveryModal}
          />
          <CardRow
            icon={<MailIcon />}
            label="Recovery email"
            value={profile?.email}
            onClick={handleOpenRecoveryModal}
          />
        </Card>

        <Card
          title="Recent security events"
          footer={
            <button
              type="button"
              className="link-btn"
              onClick={() => setEventsModalOpen(true)}
            >
              Review security events
            </button>
          }
        >
          <CardRow
            icon={<MonitorIcon />}
            label="Your recent activity"
            value="New York, USA (Active now)"
            onClick={() => setEventsModalOpen(true)}
          />
        </Card>

        <Card
          title="Your devices"
          description="You're currently signed in to your account on these devices"
          footer={
            <button
              type="button"
              className="link-btn"
              onClick={() => setDevicesModalOpen(true)}
            >
              Manage devices
            </button>
          }
        >
          {devices.slice(0, 2).map((dev) => (
            <CardRow
              key={dev.id}
              icon={<MonitorIcon />}
              label={dev.name}
              value={dev.time}
              onClick={() => setDevicesModalOpen(true)}
            />
          ))}
        </Card>

        <Card
          title="Less secure app access"
          description="To protect your account, apps and devices that use less secure sign-in technology are blocked. This setting will automatically be turned off if it's not being used."
          footer={
            <button
              type="button"
              className="link-btn"
              onClick={handleToggleLessSecure}
            >
              {secSettings?.lessSecureApps
                ? 'Turn off access (Recommended)'
                : 'Turn on access (Not recommended)'}
            </button>
          }
        >
          <div className="toggle-row" style={{ margin: '8px 0' }}>
            <span className={`status-dot ${secSettings?.lessSecureApps ? 'status-on' : 'status-off'}`} />{' '}
            {secSettings?.lessSecureApps ? 'On' : 'Off'}
          </div>
        </Card>

        <Card
          title="Signing in to other sites"
          footer={
            <button
              type="button"
              className="link-btn"
              onClick={() => setThirdPartyModalOpen(true)}
            >
              Manage third-party access & saved passwords
            </button>
          }
        >
          <CardRow
            icon={<LockIcon />}
            label="Signing in with Google"
            value={`Connected to ${connectedApps.length} sites and apps`}
            onClick={() => setThirdPartyModalOpen(true)}
          />
          <CardRow
            icon={<KeyIcon />}
            label="Password Manager"
            value="30 passwords saved"
            onClick={() => setThirdPartyModalOpen(true)}
          />
          <CardRow
            icon={<LinkIcon />}
            label="Linked Accounts"
            value="GitHub, Slack"
            onClick={() => setThirdPartyModalOpen(true)}
          />
        </Card>
      </div>

      {/* Recovery Methods Modal */}
      <Modal
        isOpen={recoveryModalOpen}
        title="Account Recovery Methods"
        onClose={() => setRecoveryModalOpen(false)}
        footer={
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', width: '100%' }}>
            <Button variant="secondary" onClick={() => setRecoveryModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleSaveRecovery}>
              Save Recovery Info
            </Button>
          </div>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <p style={{ margin: 0, fontSize: 13, color: '#64748b' }}>
            We'll use these contact methods to verify your identity if you ever lose access to your account.
          </p>
          <Input
            label="Recovery Phone Number"
            value={recPhone}
            onChange={(e) => setRecPhone(e.target.value)}
            placeholder="+1 555-0199"
          />
          <Input
            label="Recovery Email Address"
            value={recEmail}
            onChange={(e) => setRecEmail(e.target.value)}
            placeholder="recovery@example.com"
          />
        </div>
      </Modal>

      {/* Security Events Modal */}
      <Modal
        isOpen={eventsModalOpen}
        title="Recent Security Events"
        onClose={() => setEventsModalOpen(false)}
        footer={
          <Button variant="secondary" onClick={() => setEventsModalOpen(false)}>
            Close
          </Button>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ padding: '10px 14px', background: '#f8fafc', borderRadius: 8, border: '1px solid #e2e8f0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <strong style={{ fontSize: 13, color: '#0f172a' }}>Chrome on Windows (Current session)</strong>
              <span style={{ fontSize: 11, color: '#16a34a', fontWeight: 600 }}>Active now</span>
            </div>
            <p style={{ margin: '4px 0 0', fontSize: 12, color: '#64748b' }}>New York, United States · IP: 192.0.2.14</p>
          </div>
          <div style={{ padding: '10px 14px', background: '#f8fafc', borderRadius: 8, border: '1px solid #e2e8f0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <strong style={{ fontSize: 13, color: '#0f172a' }}>Safari on iPhone 14 Pro</strong>
              <span style={{ fontSize: 11, color: '#64748b' }}>2 hours ago</span>
            </div>
            <p style={{ margin: '4px 0 0', fontSize: 12, color: '#64748b' }}>New York, United States · IP: 192.0.2.55</p>
          </div>
          <div style={{ padding: '10px 14px', background: '#f8fafc', borderRadius: 8, border: '1px solid #e2e8f0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <strong style={{ fontSize: 13, color: '#0f172a' }}>2-Step Verification turned ON</strong>
              <span style={{ fontSize: 11, color: '#64748b' }}>Yesterday</span>
            </div>
            <p style={{ margin: '4px 0 0', fontSize: 12, color: '#64748b' }}>Security status updated</p>
          </div>
        </div>
      </Modal>

      {/* Devices Management Modal */}
      <Modal
        isOpen={devicesModalOpen}
        title="Your Devices"
        onClose={() => setDevicesModalOpen(false)}
        footer={
          <Button variant="secondary" onClick={() => setDevicesModalOpen(false)}>
            Close
          </Button>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {devices.map((d) => (
            <div
              key={d.id}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '12px 14px',
                border: '1px solid #e2e8f0',
                borderRadius: 8,
              }}
            >
              <div>
                <strong style={{ fontSize: 13, color: '#0f172a' }}>{d.name}</strong>
                <p style={{ margin: '2px 0 0', fontSize: 12, color: '#64748b' }}>
                  {d.location} · {d.time}
                </p>
              </div>
              {!d.current ? (
                <button
                  type="button"
                  className="link-btn"
                  style={{ color: '#ef4444', fontSize: 12 }}
                  onClick={() => handleSignOutDevice(d.id, d.name)}
                >
                  Sign out
                </button>
              ) : (
                <span style={{ fontSize: 12, color: '#16a34a', fontWeight: 600 }}>This device</span>
              )}
            </div>
          ))}
        </div>
      </Modal>

      {/* Third Party Apps Modal */}
      <Modal
        isOpen={thirdPartyModalOpen}
        title="Third-Party Apps & Saved Passwords"
        onClose={() => setThirdPartyModalOpen(false)}
        footer={
          <Button variant="secondary" onClick={() => setThirdPartyModalOpen(false)}>
            Done
          </Button>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <p style={{ margin: 0, fontSize: 13, color: '#64748b' }}>
            Apps and services with access to your LetGetIn account:
          </p>
          {connectedApps.map((app) => (
            <div
              key={app.id}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '10px 14px',
                border: '1px solid #e2e8f0',
                borderRadius: 8,
              }}
            >
              <div>
                <strong style={{ fontSize: 13, color: '#0f172a' }}>{app.name}</strong>
                <p style={{ margin: '2px 0 0', fontSize: 12, color: '#64748b' }}>
                  {app.scope} · Connected {app.connectedOn}
                </p>
              </div>
              <button
                type="button"
                className="link-btn"
                style={{ color: '#ef4444', fontSize: 12 }}
                onClick={() => handleRevokeApp(app.id, app.name)}
              >
                Revoke access
              </button>
            </div>
          ))}
          <div style={{ marginTop: 8, padding: 12, background: '#f8fafc', borderRadius: 8, fontSize: 12, color: '#475569' }}>
            🔐 <strong>Password Manager:</strong> 30 credentials safely encrypted with zero-knowledge vault protection.
          </div>
        </div>
      </Modal>

      {/* Change Password Modal */}
      <Modal
        isOpen={pwdModalOpen}
        title="Change Password"
        onClose={() => setPwdModalOpen(false)}
        footer={
          <>
            <Button variant="secondary" onClick={() => setPwdModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleSavePassword} disabled={isSavingPwd}>
              {isSavingPwd ? 'Saving...' : 'Save Password'}
            </Button>
          </>
        }
      >
        <div style={{ display: 'grid', gap: 16 }}>
          <Input
            label="Current Password"
            type="password"
            value={currentPwd}
            onChange={(e) => setCurrentPwd(e.target.value)}
            placeholder="Enter current password"
          />
          <Input
            label="New Password"
            type="password"
            value={newPwd}
            onChange={(e) => setNewPwd(e.target.value)}
            placeholder="At least 6 characters"
          />
          <Input
            label="Confirm New Password"
            type="password"
            value={confirmPwd}
            onChange={(e) => setConfirmPwd(e.target.value)}
            placeholder="Re-enter new password"
          />
        </div>
      </Modal>
    </>
  )
}
