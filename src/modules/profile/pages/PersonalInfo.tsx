import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { PageHeader, Card, CardRow } from '../components/Card'
import { Modal } from '../components/Modal'
import { Input } from '../components/Input'
import { Button } from '../components/Button'
import { Loader } from '../components/Loader'
import { userService } from '../services/user.service'
import { useFetchData } from '../hooks/useFetchData'
import useToast from '../../../hooks/useToast'
import { GlobeIcon } from '../components/Icons'

export default function PersonalInfo() {
  const navigate = useNavigate()
  const { showToast } = useToast()
  const { data: profile, isLoading, setData } = useFetchData(() => userService.getUserProfile())

  const [editModalOpen, setEditModalOpen] = useState(false)
  const [fieldToEdit, setFieldToEdit] = useState<string>('')
  const [fieldValue, setFieldValue] = useState<string>('')
  const [isSaving, setIsSaving] = useState(false)

  const [photoModalOpen, setPhotoModalOpen] = useState(false)
  const [avatarChar, setAvatarChar] = useState('')

  const handleOpenEdit = (fieldName: string, currentVal: string) => {
    setFieldToEdit(fieldName)
    setFieldValue(currentVal)
    setEditModalOpen(true)
  }

  const handleSaveAvatar = async (initial: string) => {
    try {
      const updated = await userService.updateUserProfile({ avatarText: initial })
      setData(updated)
      showToast('Profile photo updated successfully', 'success')
      setPhotoModalOpen(false)
    } catch {
      showToast('Failed to update avatar photo', 'error')
    }
  }

  const handleSave = async () => {
    if (!profile) return
    setIsSaving(true)
    try {
      const fieldKeyMap: Record<string, string> = {
        Name: 'name',
        Nickname: 'nickname',
        Birthday: 'birthday',
        Gender: 'gender',
      }

      const key = fieldKeyMap[fieldToEdit]
      if (key) {
        const updated = await userService.updateUserProfile({ [key]: fieldValue })
        setData(updated)
        showToast(`${fieldToEdit} updated successfully`, 'success')
      }
      setEditModalOpen(false)
    } catch {
      showToast(`Failed to update ${fieldToEdit}`, 'error')
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return <Loader text="Loading personal info..." />
  }

  return (
    <>
      <PageHeader title="Personal info" subtitle="Basic info, like your name and photo, that you use on LetGetIn" />

      <div style={{ maxWidth: 900, margin: '0 auto', display: 'grid', gap: 20 }}>
        <Card
          title="Profile"
          description={
            <span>
              Some info may be visible to other people using LetGetIn.{' '}
              <button
                type="button"
                className="link-btn"
                onClick={() => navigate('/profile/help')}
              >
                Learn more
              </button>
            </span>
          }
          footer={
            <button
              type="button"
              className="link-btn"
              onClick={() => navigate('/profile/security')}
            >
              Manage password & sign-in security
            </button>
          }
        >
          <div
            className="profile-photo-row"
            onClick={() => setPhotoModalOpen(true)}
            style={{ cursor: 'pointer' }}
            title="Click to update profile avatar photo"
          >
            <div>
              <p className="field-label">Photo</p>
              <p className="field-value">Add a photo to personalize your account</p>
            </div>
            <div className="avatar-sm">{profile?.avatarText || 'U'}</div>
          </div>
          <CardRow
            label="Name"
            value={profile?.name || ''}
            onClick={() => handleOpenEdit('Name', profile?.name || '')}
          />
          <CardRow
            label="Nickname"
            value={profile?.nickname || ''}
            onClick={() => handleOpenEdit('Nickname', profile?.nickname || '')}
          />
          <CardRow
            label="Birthday"
            value={profile?.birthday || ''}
            onClick={() => handleOpenEdit('Birthday', profile?.birthday || '')}
          />
          <CardRow
            label="Gender"
            value={profile?.gender || ''}
            onClick={() => handleOpenEdit('Gender', profile?.gender || '')}
          />
          <CardRow
            label={`Password — Last changed ${profile?.passwordLastChanged}`}
            onClick={() => navigate('/profile/security')}
          />
        </Card>

        <Card
          title="Contact info"
          footer={
            <button
              type="button"
              className="link-btn"
              onClick={() => handleOpenEdit('Email', profile?.email || '')}
            >
              Update contact details
            </button>
          }
        >
          <CardRow
            label="Email"
            value={profile?.email}
            onClick={() => handleOpenEdit('Email', profile?.email || '')}
          />
          <CardRow
            label="Phone Number"
            value={profile?.phone}
            onClick={() => handleOpenEdit('Phone', profile?.phone || '')}
          />
        </Card>

        <Card
          title="Choose what others see"
          description="You decide what personal info you make visible to others across LetGetIn"
          graphic={<GlobeIcon />}
          footer={
            <button
              type="button"
              className="link-btn"
              onClick={() => navigate('/profile/people')}
            >
              Go to About me
            </button>
          }
        />
      </div>

      {/* Profile Photo / Avatar Modal */}
      <Modal
        isOpen={photoModalOpen}
        title="Change Profile Photo"
        onClose={() => setPhotoModalOpen(false)}
        footer={
          <Button variant="secondary" onClick={() => setPhotoModalOpen(false)}>
            Close
          </Button>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <p style={{ margin: 0, fontSize: 13, color: '#64748b' }}>
            Choose an avatar monogram or type a custom initial:
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', margin: '8px 0' }}>
            {['A', 'J', 'S', 'M', 'R', 'E'].map((char) => (
              <button
                key={char}
                type="button"
                onClick={() => handleSaveAvatar(char)}
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: '50%',
                  background: profile?.avatarText === char ? '#004848' : '#e2e8f0',
                  color: profile?.avatarText === char ? '#fff' : '#1e293b',
                  fontWeight: 600,
                  fontSize: 16,
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'transform 0.1s',
                }}
              >
                {char}
              </button>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <Input
              label="Custom Avatar Initial"
              value={avatarChar}
              onChange={(e) => setAvatarChar(e.target.value.toUpperCase().slice(0, 2))}
              placeholder="e.g. AD"
            />
            <div style={{ alignSelf: 'flex-end', paddingBottom: 2 }}>
              <Button
                variant="primary"
                disabled={!avatarChar.trim()}
                onClick={() => handleSaveAvatar(avatarChar.trim())}
              >
                Apply
              </Button>
            </div>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={editModalOpen}
        title={`Edit ${fieldToEdit}`}
        onClose={() => setEditModalOpen(false)}
        footer={
          <>
            <Button variant="secondary" onClick={() => setEditModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleSave} disabled={isSaving}>
              {isSaving ? 'Saving...' : 'Save'}
            </Button>
          </>
        }
      >
        <Input
          label={fieldToEdit}
          value={fieldValue}
          onChange={(e) => setFieldValue(e.target.value)}
          placeholder={`Enter new ${fieldToEdit}`}
        />
      </Modal>
    </>
  )
}
