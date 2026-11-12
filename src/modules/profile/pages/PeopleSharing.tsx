import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { PageHeader, Card, CardRow, PageGrid } from '../components/Card'
import { Loader } from '../components/Loader'
import { EmptyState } from '../components/EmptyState'
import { Modal } from '../components/Modal'
import { Button } from '../components/Button'
import { Input } from '../components/Input'
import { userService } from '../services/user.service'
import { useFetchData } from '../hooks/useFetchData'
import useToast from '../../../hooks/useToast'
import {
  UserCircleIcon,
  SavedInteractionsIcon,
  PhoneIcon,
  BlockIcon,
  StarIcon,
} from '../components/Icons'
import type { ContactItem } from '../types/user.types'

export default function PeopleSharing() {
  const navigate = useNavigate()
  const { showToast } = useToast()
  const { data: contacts, isLoading, setData: setContacts } = useFetchData(() => userService.getContacts())

  const [locationModalOpen, setLocationModalOpen] = useState(false)
  const [contactsModalOpen, setContactsModalOpen] = useState(false)
  const [endorsementsModalOpen, setEndorsementsModalOpen] = useState(false)
  const [blockedModalOpen, setBlockedModalOpen] = useState(false)
  const [endorsementsEnabled, setEndorsementsEnabled] = useState(true)
  const [blockedUsers, setBlockedUsers] = useState<string[]>(['spammer@suspicious-domain.com'])
  const [isLocationSharing, setIsLocationSharing] = useState(false)
  const [newContactName, setNewContactName] = useState('')
  const [newContactEmail, setNewContactEmail] = useState('')
  const [showAddContact, setShowAddContact] = useState(false)

  const handleAddContact = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newContactName.trim()) return
    const newC: ContactItem = {
      id: `c-${Date.now()}`,
      name: newContactName.trim(),
      email: newContactEmail.trim() || `${newContactName.toLowerCase().replace(/\s+/g, '.')}@example.com`,
      avatarText: (newContactName.trim()[0] || 'U').toUpperCase(),
    }
    setContacts([...(contacts || []), newC])
    setNewContactName('')
    setNewContactEmail('')
    setShowAddContact(false)
    showToast(`Contact "${newC.name}" added successfully!`, 'success')
  }

  const handleSaveLocation = () => {
    showToast(`Location sharing turned ${isLocationSharing ? 'On' : 'Off'}`, isLocationSharing ? 'success' : 'info')
    setLocationModalOpen(false)
  }

  if (isLoading) {
    return <Loader text="Loading contacts & sharing info..." />
  }

  return (
    <>
      <PageHeader
        title="People & Sharing"
        subtitle="People you interact with and the info you make visible on LetGetIn services"
      />

      <div style={{ maxWidth: 900, margin: '0 auto', display: 'grid', gap: 20 }}>
        <Card
          title="Contacts"
          description="Organize your LetGetIn contacts so you can connect with people on LetGetIn services, like Mail"
          footer={
            <button
              type="button"
              className="link-btn"
              onClick={() => setContactsModalOpen(true)}
            >
              Manage contacts
            </button>
          }
        >
          {contacts && contacts.length > 0 ? (
            <CardRow
              icon={<UserCircleIcon />}
              label={`Contacts (${contacts.length})`}
              value={contacts.map((c: ContactItem) => c.name).join(', ')}
              onClick={() => setContactsModalOpen(true)}
              chevron={true}
            />
          ) : (
            <EmptyState
              icon={<UserCircleIcon />}
              title="No contacts found"
              description="You have no saved contacts in your LetGetIn account."
            />
          )}
          <CardRow
            icon={<SavedInteractionsIcon />}
            label="Contact info from saved interactions"
            value="On"
            onClick={() => showToast('Saved interactions sync is ON', 'info')}
          />
          <CardRow
            icon={<PhoneIcon />}
            label="Contact info from your devices"
            value="On"
            onClick={() => showToast('Device contacts sync is active', 'info')}
          />
          <CardRow
            icon={<BlockIcon />}
            label="Blocked"
            value={blockedUsers.length > 0 ? `${blockedUsers.length} blocked` : 'No blocked users'}
            onClick={() => setBlockedModalOpen(true)}
          />
        </Card>

        <PageGrid>
          <Card
            title="Location sharing"
            description="You aren't sharing your real-time location with anyone on LetGetIn"
            footer={
              <button
                type="button"
                className="link-btn"
                onClick={() => setLocationModalOpen(true)}
              >
                Manage location sharing
              </button>
            }
          />
          <Card
            title="Choose what others see"
            footer={
              <button
                type="button"
                className="link-btn"
                onClick={() => navigate('/profile/info')}
              >
                Go to About me
              </button>
            }
          >
            <CardRow
              icon={<UserCircleIcon />}
              label="About me"
              value="What personal info you make visible to others"
              onClick={() => navigate('/profile/info')}
              chevron={true}
            />
          </Card>
        </PageGrid>

        <Card
          title="Share recommendations in ads"
          description="You can choose to show your name, profile photo, and activity in shared endorsements in ads to help others find things you're interested in"
          footer={
            <button
              type="button"
              className="link-btn"
              onClick={() => setEndorsementsModalOpen(true)}
            >
              Manage shared endorsements
            </button>
          }
        >
          <CardRow
            icon={<StarIcon />}
            label="Shared endorsements in ads"
            value={endorsementsEnabled ? 'On' : 'Off'}
            onClick={() => setEndorsementsModalOpen(true)}
          />
        </Card>
      </div>

      {/* Location Sharing Modal */}
      <Modal
        isOpen={locationModalOpen}
        title="Location Sharing Manager"
        onClose={() => setLocationModalOpen(false)}
        footer={
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', width: '100%' }}>
            <Button variant="secondary" onClick={() => setLocationModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleSaveLocation}>
              Save Preference
            </Button>
          </div>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <p style={{ fontSize: 13, color: '#64748b', margin: 0 }}>
            Share your real-time location with family, coworkers, or team members.
          </p>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', border: '1px solid #e2e8f0', borderRadius: 12 }}>
            <div>
              <strong style={{ fontSize: 13 }}>Share Real-Time Location</strong>
              <p style={{ margin: '2px 0 0', fontSize: 12, color: '#64748b' }}>
                Status: {isLocationSharing ? 'Actively Sharing' : 'Off'}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsLocationSharing(!isLocationSharing)}
              className={`status-dot ${isLocationSharing ? 'status-on' : 'status-off'}`}
              style={{ border: 'none', cursor: 'pointer' }}
            />
          </div>
          {isLocationSharing && (
            <div style={{ padding: 12, background: '#f0fdf4', borderRadius: 10, fontSize: 12, color: '#166534' }}>
              📍 Location will be shared with designated emergency & team contacts for the next 24 hours.
            </div>
          )}
        </div>
      </Modal>

      {/* Contacts Modal */}
      <Modal
        isOpen={contactsModalOpen}
        title="Manage Contacts"
        onClose={() => {
          setContactsModalOpen(false)
          setShowAddContact(false)
        }}
        footer={
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', width: '100%' }}>
            {!showAddContact ? (
              <>
                <Button variant="secondary" onClick={() => setContactsModalOpen(false)}>
                  Done
                </Button>
                <Button variant="primary" onClick={() => setShowAddContact(true)}>
                  + Add Contact
                </Button>
              </>
            ) : (
              <Button variant="secondary" onClick={() => setShowAddContact(false)}>
                Cancel
              </Button>
            )}
          </div>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {contacts?.map((c) => (
            <div
              key={c.id}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '10px 12px',
                border: '1px solid #e2e8f0',
                borderRadius: 10,
              }}
            >
              <div>
                <strong style={{ fontSize: 13 }}>{c.name}</strong>
                <p style={{ margin: '2px 0 0', fontSize: 12, color: '#64748b' }}>{c.email}</p>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setContacts((contacts || []).filter((item) => item.id !== c.id))
                  showToast(`Removed ${c.name}`, 'info')
                }}
              >
                Delete
              </Button>
            </div>
          ))}

          {showAddContact && (
            <form onSubmit={handleAddContact} style={{ display: 'flex', flexDirection: 'column', gap: 10, padding: 12, border: '1px dashed #004848', borderRadius: 10 }}>
              <strong style={{ fontSize: 13, color: '#004848' }}>New Contact</strong>
              <Input
                label="Full Name"
                value={newContactName}
                onChange={(e) => setNewContactName(e.target.value)}
                placeholder="Jane Doe"
                required
              />
              <Input
                label="Email"
                value={newContactEmail}
                onChange={(e) => setNewContactEmail(e.target.value)}
                placeholder="jane.doe@company.com"
                type="email"
              />
              <Button variant="primary" type="submit">
                Save Contact
              </Button>
            </form>
          )}
        </div>
      </Modal>

      {/* Shared Endorsements Modal */}
      <Modal
        isOpen={endorsementsModalOpen}
        title="Shared Endorsements in Ads"
        onClose={() => setEndorsementsModalOpen(false)}
        footer={
          <Button
            variant="primary"
            onClick={() => {
              showToast('Endorsement settings updated!', 'success')
              setEndorsementsModalOpen(false)
            }}
          >
            Save Setting
          </Button>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <p style={{ margin: 0, fontSize: 13, color: '#64748b' }}>
            Help friends and coworkers discover recommendations by allowing your name and photo to appear in reviews or endorsements.
          </p>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', border: '1px solid #e2e8f0', borderRadius: 8 }}>
            <div>
              <strong style={{ fontSize: 13 }}>Show Shared Endorsements</strong>
              <p style={{ margin: '2px 0 0', fontSize: 12, color: '#64748b' }}>Status: {endorsementsEnabled ? 'Active' : 'Disabled'}</p>
            </div>
            <button
              type="button"
              onClick={() => setEndorsementsEnabled(!endorsementsEnabled)}
              className={`status-dot ${endorsementsEnabled ? 'status-on' : 'status-off'}`}
              style={{ border: 'none', cursor: 'pointer' }}
            />
          </div>
        </div>
      </Modal>

      {/* Blocked Users Modal */}
      <Modal
        isOpen={blockedModalOpen}
        title="Blocked Users"
        onClose={() => setBlockedModalOpen(false)}
        footer={
          <Button variant="secondary" onClick={() => setBlockedModalOpen(false)}>
            Close
          </Button>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <p style={{ margin: 0, fontSize: 13, color: '#64748b' }}>
            Blocked people cannot message you or view your real-time status.
          </p>
          {blockedUsers.length === 0 ? (
            <div style={{ padding: 12, background: '#f8fafc', borderRadius: 8, fontSize: 13, color: '#64748b', textAlign: 'center' }}>
              No blocked users in your account.
            </div>
          ) : (
            blockedUsers.map((email) => (
              <div
                key={email}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '10px 14px',
                  border: '1px solid #e2e8f0',
                  borderRadius: 8,
                }}
              >
                <span style={{ fontSize: 13, color: '#0f172a' }}>🚫 {email}</span>
                <button
                  type="button"
                  className="link-btn"
                  onClick={() => {
                    setBlockedUsers((prev) => prev.filter((u) => u !== email))
                    showToast(`Unblocked ${email}`, 'success')
                  }}
                >
                  Unblock
                </button>
              </div>
            ))
          )}
        </div>
      </Modal>
    </>
  )
}

