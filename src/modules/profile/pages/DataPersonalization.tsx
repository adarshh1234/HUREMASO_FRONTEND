import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { PageHeader, Card, CardRow, PageGrid } from '../components/Card'
import { Loader } from '../components/Loader'
import { Modal } from '../components/Modal'
import { Button } from '../components/Button'
import { userService } from '../services/user.service'
import { useFetchData } from '../hooks/useFetchData'
import useToast from '../../../hooks/useToast'
import {
  GlobeIcon,
  MapPinIcon,
  PlayVideoIcon,
  TagIcon,
  ActivityChartIcon,
  CloudDownloadIcon,
  PlanPlugIcon,
  TrashIcon,
  KeyboardIcon,
  UserAccessibilityIcon,
  SearchIcon,
  HistoryIcon,
  GridIcon,
  BellIcon,
  LockIcon,
} from '../components/Icons'
import type { ActivityControl } from '../types/user.types'

export default function DataPersonalization() {
  const navigate = useNavigate()
  const { showToast } = useToast()
  const { data: storage, setData: setStorageData } = useFetchData(() => userService.getStorageUsage())
  const { data: activityControls, isLoading, setData: setActivityData } = useFetchData(() =>
    userService.getActivityControls()
  )

  const [businessPersonalization, setBusinessPersonalization] = useState(false)
  const [privacyModalOpen, setPrivacyModalOpen] = useState(false)
  const [activityModalOpen, setActivityModalOpen] = useState(false)
  const [storageModalOpen, setStorageModalOpen] = useState(false)
  const [isCleaningStorage, setIsCleaningStorage] = useState(false)

  // Checkup state
  const [webActivity, setWebActivity] = useState(true)
  const [locationHistory, setLocationHistory] = useState(false)
  const [personalizedAds, setPersonalizedAds] = useState(true)

  // Additional modals state
  const [adModalOpen, setAdModalOpen] = useState(false)
  const [timelineModalOpen, setTimelineModalOpen] = useState(false)
  const [downloadModalOpen, setDownloadModalOpen] = useState(false)
  const [webPrefsModalOpen, setWebPrefsModalOpen] = useState(false)
  const [selectedLanguage, setSelectedLanguage] = useState('English (United States)')
  const [safeSearchActive, setSafeSearchActive] = useState(true)

  const handleToggleActivity = async (id: string, currentStatus: 'On' | 'Off' | 'Paused') => {
    if (!activityControls) return
    const nextStatus = currentStatus === 'On' ? 'Off' : 'On'
    const updated = activityControls.map((item) =>
      item.id === id ? { ...item, status: nextStatus as 'On' | 'Off' } : item
    )
    setActivityData(updated)
    const item = activityControls.find((i) => i.id === id)
    showToast(`${item?.title} turned ${nextStatus}`, 'info')
    try {
      await userService.updateActivityControls(updated)
    } catch {
      // Revert on failure
      setActivityData(activityControls)
      showToast(`Failed to update ${item?.title}`, 'error')
    }
  }

  const handleBusinessToggle = () => {
    setBusinessPersonalization((prev) => {
      const next = !prev
      showToast(`Business personalization turned ${next ? 'On' : 'Off'}`, 'info')
      return next
    })
  }

  const handleCleanStorage = () => {
    setIsCleaningStorage(true)
    setTimeout(() => {
      setIsCleaningStorage(false)
      if (storage) {
        const cleanedGb = Math.max(0.1, Number((storage.usedGb - 0.15).toFixed(2)))
        const cleanedPct = Math.max(1, Math.round((cleanedGb / storage.totalGb) * 100))
        setStorageData({
          ...storage,
          usedGb: cleanedGb,
          usedPercentage: cleanedPct,
        })
      }
      showToast('Cleaned 0.15 GB of temporary cached data!', 'success')
      setStorageModalOpen(false)
    }, 600)
  }

  const getActivityIcon = (title: string) => {
    if (title.includes('Web')) return <GlobeIcon />
    if (title.includes('Location')) return <MapPinIcon />
    return <PlayVideoIcon />
  }

  if (isLoading) {
    return <Loader text="Loading data & personalization settings..." />
  }

  return (
    <>
      <PageHeader
        title="Data & personalization"
        subtitle="Your data, activity, and preferences that help make LetGetIn services more useful to you"
      />

      <div style={{ maxWidth: 900, margin: '0 auto', display: 'grid', gap: 20 }}>
        <Card
          title="Take the Privacy Checkup"
          description="This step-by-step guide helps you choose the privacy settings that are right for you"
          graphic={<LockIcon />}
          footer={
            <button
              type="button"
              className="link-btn"
              onClick={() => setPrivacyModalOpen(true)}
            >
              Get Started
            </button>
          }
        />

        <Card
          title="Activity controls"
          description="You can choose to save your activity for better personalization across LetGetIn. Turn on or pause these settings at any time."
          footer={
            <button
              type="button"
              className="link-btn"
              onClick={() => setActivityModalOpen(true)}
            >
              Manage your activity controls
            </button>
          }
        >
          {activityControls?.map((ctrl: ActivityControl) => (
            <CardRow
              key={ctrl.id}
              icon={getActivityIcon(ctrl.title)}
              label={ctrl.title}
              value={ctrl.status}
              onClick={() => handleToggleActivity(ctrl.id, ctrl.status)}
            />
          ))}
        </Card>

        <PageGrid>
          <Card
            title="Ad personalization"
            description="You can make ads more useful to you"
            footer={
              <button
                type="button"
                className="link-btn"
                onClick={() => setAdModalOpen(true)}
              >
                Manage ad personalization
              </button>
            }
          >
            <CardRow
              icon={<TagIcon />}
              label="Ad personalization"
              value={personalizedAds ? 'On' : 'Off'}
              onClick={() => setAdModalOpen(true)}
              chevron={true}
            />
          </Card>
          <Card
            title="Activity and timeline"
            description="See the activity saved in your account and the places you've been. You can delete any or all your past activity."
            footer={
              <button
                type="button"
                className="link-btn"
                onClick={() => setTimelineModalOpen(true)}
              >
                Manage history & timeline
              </button>
            }
          >
            <CardRow
              icon={<ActivityChartIcon />}
              label="My Activity"
              value="View history"
              onClick={() => setTimelineModalOpen(true)}
              chevron={true}
            />
            <CardRow
              icon={<MapPinIcon />}
              label="Timeline"
              value="12 locations"
              onClick={() => setTimelineModalOpen(true)}
              chevron={true}
            />
          </Card>
        </PageGrid>

        <Card
          title="Things you create and do"
          description="Check your Dashboard to see a summary of your services and the data saved in your account"
          footer={
            <button
              type="button"
              className="link-btn"
              onClick={() => navigate('/dashboard')}
            >
              Go to Dashboard
            </button>
          }
        >
          <div style={{ display: 'flex', gap: 24, padding: '16px 0', overflowX: 'auto' }}>
            <div
              style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--text-secondary)', cursor: 'pointer' }}
              onClick={() => setTimelineModalOpen(true)}
              title="Search activity"
            >
              <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#f0f4f9', color: '#1a73e8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <HistoryIcon />
              </div>
              <span>Search activity</span>
            </div>
            <div
              style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--text-secondary)', cursor: 'pointer' }}
              onClick={() => setTimelineModalOpen(true)}
              title="Maps timeline"
            >
              <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#f0f4f9', color: '#1a73e8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <MapPinIcon />
              </div>
              <span>Maps</span>
            </div>
            <div
              style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--text-secondary)', cursor: 'pointer' }}
              onClick={() => navigate('/dashboard')}
              title="Dashboard apps"
            >
              <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#f0f4f9', color: '#1a73e8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <GridIcon />
              </div>
              <span>Play Store</span>
            </div>
            <div
              style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--text-secondary)', cursor: 'pointer' }}
              onClick={() => navigate('/dashboard')}
              title="YouTube integration"
            >
              <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#f0f4f9', color: '#1a73e8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <PlayVideoIcon />
              </div>
              <span>YouTube</span>
            </div>
            <div
              style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--text-secondary)', cursor: 'pointer' }}
              onClick={() => navigate('/support')}
              title="Company Mail & Support"
            >
              <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#f0f4f9', color: '#1a73e8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <BellIcon />
              </div>
              <span>Mail</span>
            </div>
          </div>
        </Card>

        <Card
          title="Account Storage"
          description="Your account storage is shared across LetGetIn services, like Mail and Files"
          footer={
            <button
              type="button"
              className="link-btn"
              onClick={() => setStorageModalOpen(true)}
            >
              Manage Storage
            </button>
          }
        >
          <p className="storage-line">
            {storage?.usedPercentage}% used — {storage?.usedGb} GB of {storage?.totalGb} GB
          </p>
        </Card>

        <Card
          title="Download, delete, or make a plan for your data"
          footer={
            <button
              type="button"
              className="link-btn"
              onClick={() => setDownloadModalOpen(true)}
            >
              Manage your data archive & account
            </button>
          }
        >
          <CardRow
            icon={<CloudDownloadIcon />}
            label="Download your data"
            value="Make a copy of your data"
            onClick={() => setDownloadModalOpen(true)}
          />
          <CardRow
            icon={<PlanPlugIcon />}
            label="Make a plan for your account"
            value="Plan what happens if you stop using your account"
            onClick={() => setDownloadModalOpen(true)}
          />
          <CardRow
            icon={<TrashIcon />}
            label="Delete a service or your account"
            value="Remove a service or your account"
            onClick={() => setDownloadModalOpen(true)}
          />
        </Card>

        <Card
          title="General Preferences for the web"
          description="Manage settings for LetGetIn services on the web"
          footer={
            <button
              type="button"
              className="link-btn"
              onClick={() => setWebPrefsModalOpen(true)}
            >
              Manage web preferences
            </button>
          }
        >
          <CardRow
            icon={<GlobeIcon />}
            label="Language"
            value={selectedLanguage}
            onClick={() => setWebPrefsModalOpen(true)}
          />
          <CardRow
            icon={<KeyboardIcon />}
            label="Input Tools"
            value="English / Keyboard"
            onClick={() => setWebPrefsModalOpen(true)}
          />
          <CardRow
            icon={<UserAccessibilityIcon />}
            label="Accessibility"
            value="Standard"
            onClick={() => setWebPrefsModalOpen(true)}
          />
          <CardRow
            icon={<SearchIcon />}
            label="Search Settings"
            value={safeSearchActive ? 'SafeSearch active' : 'SafeSearch off'}
            onClick={() => setWebPrefsModalOpen(true)}
            chevron={true}
          />
        </Card>

        <Card
          title="Reservations"
          description="Your past and upcoming reservations for flights, hotels, and events"
          footer={
            <button
              type="button"
              className="link-btn"
              onClick={() => navigate('/profile/payments')}
            >
              Manage reservations
            </button>
          }
        />

        <Card
          title="Business personalization"
          description="See personalized features to grow your local business."
        >
          <div className="toggle-row" style={{ margin: '12px 0' }}>
            <button
              type="button"
              className={`status-dot ${businessPersonalization ? 'status-on' : 'status-off'}`}
              onClick={handleBusinessToggle}
              style={{ border: 'none', cursor: 'pointer' }}
            />
            <span>{businessPersonalization ? 'On' : 'Off'}</span>
          </div>
          <button
            type="button"
            className="link-btn"
            onClick={handleBusinessToggle}
          >
            Set up business personalization
          </button>
        </Card>
      </div>

      {/* Storage Management Modal */}
      <Modal
        isOpen={storageModalOpen}
        title="Account Storage Manager"
        onClose={() => setStorageModalOpen(false)}
        footer={
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', width: '100%' }}>
            <Button variant="secondary" onClick={() => setStorageModalOpen(false)}>
              Close
            </Button>
            <Button
              variant="outline"
              onClick={handleCleanStorage}
              disabled={isCleaningStorage}
            >
              {isCleaningStorage ? 'Cleaning...' : 'Clean Trash & Cache'}
            </Button>
            <Button
              variant="primary"
              onClick={() => {
                setStorageModalOpen(false)
                navigate('/profile/payments')
              }}
            >
              Get More Storage
            </Button>
          </div>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 14 }}>
              <strong>Total Usage</strong>
              <span>{storage?.usedGb || 0.68} GB of {storage?.totalGb || 15} GB ({storage?.usedPercentage || 4}%)</span>
            </div>
            <div style={{ height: 10, width: '100%', background: '#e2e8f0', borderRadius: 999, overflow: 'hidden' }}>
              <div
                style={{
                  height: '100%',
                  width: `${Math.min(100, storage?.usedPercentage || 4)}%`,
                  background: 'linear-gradient(90deg, #004848, #007878)',
                  borderRadius: 999,
                  transition: 'width 0.3s ease',
                }}
              />
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, fontSize: 13 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 12px', background: '#f8fafc', borderRadius: 10 }}>
              <span>📁 Google Drive & Shared Documents</span>
              <strong>0.42 GB</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 12px', background: '#f8fafc', borderRadius: 10 }}>
              <span>✉️ Gmail & Email Attachments</span>
              <strong>0.21 GB</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 12px', background: '#f8fafc', borderRadius: 10 }}>
              <span>🖼️ Media & Photo Files</span>
              <strong>0.05 GB</strong>
            </div>
          </div>
        </div>
      </Modal>

      {/* Privacy Checkup Modal */}
      <Modal
        isOpen={privacyModalOpen}
        title="Privacy Checkup Guide"
        onClose={() => setPrivacyModalOpen(false)}
        footer={
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', width: '100%' }}>
            <Button variant="secondary" onClick={() => setPrivacyModalOpen(false)}>
              Close
            </Button>
            <Button
              variant="primary"
              onClick={() => {
                showToast('Privacy Checkup completed and saved!', 'success')
                setPrivacyModalOpen(false)
              }}
            >
              Save & Apply
            </Button>
          </div>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <p style={{ fontSize: 13, color: '#64748b', margin: 0 }}>
            Choose how your data and account preferences are applied.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', border: '1px solid #e2e8f0', borderRadius: 12 }}>
              <div>
                <strong style={{ fontSize: 13 }}>Web & App Activity</strong>
                <p style={{ margin: '2px 0 0', fontSize: 12, color: '#64748b' }}>Saves your searches and browsing</p>
              </div>
              <button
                type="button"
                onClick={() => setWebActivity(!webActivity)}
                className={`status-dot ${webActivity ? 'status-on' : 'status-off'}`}
                style={{ border: 'none', cursor: 'pointer' }}
              />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', border: '1px solid #e2e8f0', borderRadius: 12 }}>
              <div>
                <strong style={{ fontSize: 13 }}>Location History</strong>
                <p style={{ margin: '2px 0 0', fontSize: 12, color: '#64748b' }}>Saves places you visit</p>
              </div>
              <button
                type="button"
                onClick={() => setLocationHistory(!locationHistory)}
                className={`status-dot ${locationHistory ? 'status-on' : 'status-off'}`}
                style={{ border: 'none', cursor: 'pointer' }}
              />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', border: '1px solid #e2e8f0', borderRadius: 12 }}>
              <div>
                <strong style={{ fontSize: 13 }}>Personalized Ads</strong>
                <p style={{ margin: '2px 0 0', fontSize: 12, color: '#64748b' }}>Personalized marketing based on activity</p>
              </div>
              <button
                type="button"
                onClick={() => setPersonalizedAds(!personalizedAds)}
                className={`status-dot ${personalizedAds ? 'status-on' : 'status-off'}`}
                style={{ border: 'none', cursor: 'pointer' }}
              />
            </div>
          </div>
        </div>
      </Modal>

      {/* Activity Controls Modal */}
      <Modal
        isOpen={activityModalOpen}
        title="Activity Controls Manager"
        onClose={() => setActivityModalOpen(false)}
        footer={
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', width: '100%' }}>
            <Button variant="primary" onClick={() => setActivityModalOpen(false)}>
              Done
            </Button>
          </div>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <p style={{ fontSize: 13, color: '#64748b', margin: 0 }}>
            Toggle active services logging below.
          </p>
          {activityControls?.map((ctrl) => (
            <div
              key={ctrl.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 14px',
                border: '1px solid #e2e8f0',
                borderRadius: 12,
              }}
            >
              <div>
                <strong style={{ fontSize: 13 }}>{ctrl.title}</strong>
                <p style={{ margin: '2px 0 0', fontSize: 12, color: '#64748b' }}>{(ctrl as any).description || (ctrl as any).desc || ''}</p>
              </div>
              <Button
                variant={ctrl.status === 'On' ? 'primary' : 'outline'}
                size="sm"
                onClick={() => handleToggleActivity(ctrl.id, ctrl.status)}
              >
                {ctrl.status === 'On' ? 'Active (Turn Off)' : 'Paused (Turn On)'}
              </Button>
            </div>
          ))}
        </div>
      </Modal>

      {/* Ad Personalization Modal */}
      <Modal
        isOpen={adModalOpen}
        title="Ad Personalization Settings"
        onClose={() => setAdModalOpen(false)}
        footer={
          <Button variant="primary" onClick={() => {
            showToast('Ad personalization settings saved', 'success')
            setAdModalOpen(false)
          }}>
            Save Preferences
          </Button>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <p style={{ margin: 0, fontSize: 13, color: '#64748b' }}>
            Choose whether ads are personalized based on your info and activity across LetGetIn services.
          </p>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', border: '1px solid #e2e8f0', borderRadius: 8 }}>
            <div>
              <strong style={{ fontSize: 13 }}>Personalized Ads</strong>
              <p style={{ margin: '2px 0 0', fontSize: 12, color: '#64748b' }}>Show tailored ads relevant to your interests</p>
            </div>
            <button
              type="button"
              onClick={() => setPersonalizedAds(!personalizedAds)}
              className={`status-dot ${personalizedAds ? 'status-on' : 'status-off'}`}
              style={{ border: 'none', cursor: 'pointer' }}
            />
          </div>
          <div style={{ padding: 12, background: '#f8fafc', borderRadius: 8, fontSize: 12, color: '#475569' }}>
            💡 <strong>Topics you like:</strong> Technology, Cloud Computing, Productivity Software, HR Management.
          </div>
        </div>
      </Modal>

      {/* Activity and Timeline Modal */}
      <Modal
        isOpen={timelineModalOpen}
        title="Activity and Timeline Manager"
        onClose={() => setTimelineModalOpen(false)}
        footer={
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', width: '100%' }}>
            <Button
              variant="outline"
              onClick={() => {
                showToast('All recent browsing and search activity cleared!', 'success')
                setTimelineModalOpen(false)
              }}
            >
              Clear Recent Activity
            </Button>
            <Button variant="primary" onClick={() => setTimelineModalOpen(false)}>
              Done
            </Button>
          </div>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <p style={{ margin: 0, fontSize: 13, color: '#64748b' }}>
            Review searches, videos watched, and locations visited recorded in your account.
          </p>
          <div style={{ padding: '10px 14px', background: '#f8fafc', borderRadius: 8, border: '1px solid #e2e8f0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <strong style={{ fontSize: 13, color: '#0f172a' }}>Web & App Activity</strong>
              <span style={{ fontSize: 12, color: '#16a34a', fontWeight: 600 }}>Enabled</span>
            </div>
            <p style={{ margin: '4px 0 0', fontSize: 12, color: '#64748b' }}>43 searches and site interactions saved this week</p>
          </div>
          <div style={{ padding: '10px 14px', background: '#f8fafc', borderRadius: 8, border: '1px solid #e2e8f0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <strong style={{ fontSize: 13, color: '#0f172a' }}>Location Timeline</strong>
              <span style={{ fontSize: 12, color: '#64748b' }}>Paused</span>
            </div>
            <p style={{ margin: '4px 0 0', fontSize: 12, color: '#64748b' }}>12 places saved in New York</p>
          </div>
        </div>
      </Modal>

      {/* Data Archive & Account Plan Modal */}
      <Modal
        isOpen={downloadModalOpen}
        title="Download Data & Plan for Your Account"
        onClose={() => setDownloadModalOpen(false)}
        footer={
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', width: '100%' }}>
            <Button variant="secondary" onClick={() => setDownloadModalOpen(false)}>
              Close
            </Button>
            <Button
              variant="primary"
              onClick={() => {
                showToast('Archive export scheduled! Download link will be sent to your email.', 'success')
                setDownloadModalOpen(false)
              }}
            >
              Request Export Archive (.ZIP)
            </Button>
          </div>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <p style={{ margin: 0, fontSize: 13, color: '#64748b' }}>
            Export a copy of content in your LetGetIn account to back it up or use it with a service outside of LetGetIn.
          </p>
          <div style={{ padding: 12, border: '1px solid #e2e8f0', borderRadius: 8 }}>
            <strong style={{ fontSize: 13, display: 'block', marginBottom: 6 }}>Included Services:</strong>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 6, fontSize: 12, color: '#475569' }}>
              <span>✓ Profile & Contacts</span>
              <span>✓ Mail & Messages</span>
              <span>✓ Cloud Drive Files</span>
              <span>✓ Activity History</span>
            </div>
          </div>
          <div style={{ padding: 12, background: '#fef2f2', borderRadius: 8, fontSize: 12, color: '#991b1b' }}>
            ⚠️ <strong>Inactive Account Manager:</strong> You can designate a trusted contact to be notified if your account becomes inactive for 6 months.
          </div>
        </div>
      </Modal>

      {/* Web Preferences Modal */}
      <Modal
        isOpen={webPrefsModalOpen}
        title="Web Preferences"
        onClose={() => setWebPrefsModalOpen(false)}
        footer={
          <Button
            variant="primary"
            onClick={() => {
              showToast('Web preferences updated successfully!', 'success')
              setWebPrefsModalOpen(false)
            }}
          >
            Save Preferences
          </Button>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 6 }}>Preferred Language</label>
            <select
              value={selectedLanguage}
              onChange={(e) => setSelectedLanguage(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 12px',
                borderRadius: 8,
                border: '1px solid #cbd5e1',
                fontSize: 13,
                background: '#fff',
              }}
            >
              <option value="English (United States)">English (United States)</option>
              <option value="English (United Kingdom)">English (United Kingdom)</option>
              <option value="Spanish (Español)">Spanish (Español)</option>
              <option value="French (Français)">French (Français)</option>
              <option value="German (Deutsch)">German (Deutsch)</option>
              <option value="Japanese (日本語)">Japanese (日本語)</option>
            </select>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', border: '1px solid #e2e8f0', borderRadius: 8 }}>
            <div>
              <strong style={{ fontSize: 13 }}>SafeSearch Filter</strong>
              <p style={{ margin: '2px 0 0', fontSize: 12, color: '#64748b' }}>Filter explicit results from searches</p>
            </div>
            <button
              type="button"
              onClick={() => setSafeSearchActive(!safeSearchActive)}
              className={`status-dot ${safeSearchActive ? 'status-on' : 'status-off'}`}
              style={{ border: 'none', cursor: 'pointer' }}
            />
          </div>
        </div>
      </Modal>
    </>
  )
}
