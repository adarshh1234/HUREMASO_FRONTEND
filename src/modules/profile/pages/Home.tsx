import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { PageGrid, Card } from '../components/Card'
import { Loader } from '../components/Loader'
import { Modal } from '../components/Modal'
import { Button } from '../components/Button'
import { userService } from '../services/user.service'
import { useFetchData } from '../hooks/useFetchData'
import useToast from '../../../hooks/useToast'
import { LockIcon, ShieldCheckIcon, StorageIcon, UserCheckIcon } from '../components/Icons'

export default function Home() {
  const navigate = useNavigate()
  const { showToast } = useToast()
  const { data: profile, isLoading: isProfileLoading } = useFetchData(() => userService.getUserProfile())
  const { data: storage, isLoading: isStorageLoading, setData: setStorageData } = useFetchData(() => userService.getStorageUsage())

  // Interactive Modals for Storage & Privacy Checkup
  const [storageModalOpen, setStorageModalOpen] = useState(false)
  const [privacyModalOpen, setPrivacyModalOpen] = useState(false)
  const [isCleaningStorage, setIsCleaningStorage] = useState(false)

  // Privacy Checkup options state
  const [webActivity, setWebActivity] = useState(true)
  const [locationHistory, setLocationHistory] = useState(false)
  const [personalizedAds, setPersonalizedAds] = useState(true)

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
      showToast('Freed 0.15 GB from temporary system cache and trash!', 'success')
      setStorageModalOpen(false)
    }, 600)
  }

  const handleCompletePrivacyCheckup = () => {
    showToast('Privacy Checkup completed successfully! Preferences saved.', 'success')
    setPrivacyModalOpen(false)
  }

  if (isProfileLoading || isStorageLoading) {
    return <Loader text="Loading your home dashboard..." />
  }

  return (
    <div className="home-page">
      <div className="home-avatar">{profile?.avatarText || 'U'}</div>
      <h1 className="home-welcome">Welcome, {profile?.name || 'User'}</h1>
      <p className="home-subtitle">
        Manage your info, privacy, and security to make LetGetIn work better for you
      </p>

      <PageGrid>
        {/* 1. Privacy & personalization */}
        <Card
          title="Privacy & personalization"
          description="See the data in your LetGetIn account and choose what activity is saved to personalize your experience"
          graphic={<LockIcon />}
          footer={
            <button
              type="button"
              className="link-btn"
              onClick={() => navigate('/profile/data')}
            >
              Manage your data and personalization
            </button>
          }
        />

        {/* 2. Security issues found */}
        <Card
          title="Security issues found"
          description="Protect your account now by resolving these issues"
          graphic={<ShieldCheckIcon />}
          footer={
            <button
              type="button"
              className="link-btn"
              onClick={() => navigate('/profile/security')}
            >
              Secure account
            </button>
          }
        />

        {/* 3. Account storage */}
        <Card
          title="Account storage"
          description="Your account storage is shared across LetGetIn services, like Mail and Files"
          graphic={<StorageIcon />}
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

        {/* 4. Take the Privacy Checkup */}
        <Card
          title="Take the Privacy Checkup"
          description="This step-by-step guide helps you choose the privacy settings that are right for you"
          graphic={<UserCheckIcon />}
          footer={
            <button
              type="button"
              className="link-btn"
              onClick={() => setPrivacyModalOpen(true)}
            >
              Get started
            </button>
          }
        />
      </PageGrid>

      <p className="home-footnote">
        Only you can see your settings. You might also want to review your settings for other services you use.
        LetGetIn keeps your data private, safe, and secure.{' '}
        <button
          type="button"
          className="link-btn"
          onClick={() => navigate('/profile/help')}
        >
          Learn more
        </button>
      </p>

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
            <Button
              variant="outline"
              onClick={() => {
                setPrivacyModalOpen(false)
                navigate('/profile/data')
              }}
            >
              All Privacy Settings
            </Button>
            <Button variant="primary" onClick={handleCompletePrivacyCheckup}>
              Save & Finish Checkup
            </Button>
          </div>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <p style={{ fontSize: 13, color: '#64748b', margin: 0 }}>
            Review key privacy controls to customize how your account data is saved and used across services.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', border: '1px solid #e2e8f0', borderRadius: 12 }}>
              <div>
                <strong style={{ fontSize: 13 }}>Web & App Activity</strong>
                <p style={{ margin: '2px 0 0', fontSize: 12, color: '#64748b' }}>Saves your searches and browsing for faster search</p>
              </div>
              <button
                type="button"
                onClick={() => setWebActivity(!webActivity)}
                className={`status-dot ${webActivity ? 'status-on' : 'status-off'}`}
                style={{ border: 'none', cursor: 'pointer' }}
                title="Toggle Web & App Activity"
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', border: '1px solid #e2e8f0', borderRadius: 12 }}>
              <div>
                <strong style={{ fontSize: 13 }}>Location History</strong>
                <p style={{ margin: '2px 0 0', fontSize: 12, color: '#64748b' }}>Saves where you go with your devices</p>
              </div>
              <button
                type="button"
                onClick={() => setLocationHistory(!locationHistory)}
                className={`status-dot ${locationHistory ? 'status-on' : 'status-off'}`}
                style={{ border: 'none', cursor: 'pointer' }}
                title="Toggle Location History"
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', border: '1px solid #e2e8f0', borderRadius: 12 }}>
              <div>
                <strong style={{ fontSize: 13 }}>Personalized Ads</strong>
                <p style={{ margin: '2px 0 0', fontSize: 12, color: '#64748b' }}>Ads shown based on your account activity</p>
              </div>
              <button
                type="button"
                onClick={() => setPersonalizedAds(!personalizedAds)}
                className={`status-dot ${personalizedAds ? 'status-on' : 'status-off'}`}
                style={{ border: 'none', cursor: 'pointer' }}
                title="Toggle Personalized Ads"
              />
            </div>
          </div>
        </div>
      </Modal>
    </div>
  )
}

