import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { PageHeader, Card, CardRow, PageGrid } from '../components/Card'
import { Modal } from '../components/Modal'
import { Button } from '../components/Button'
import { Input } from '../components/Input'
import { Loader } from '../components/Loader'
import { userService } from '../services/user.service'
import { useFetchData } from '../hooks/useFetchData'
import useToast from '../../../hooks/useToast'
import {
  DocumentTextIcon,
  ShieldCheckIcon,
  PhoneIcon,
  MegaphoneIcon,
  LightbulbIcon,
} from '../components/Icons'
import type { HelpArticle } from '../types/user.types'

export default function Help() {
  const navigate = useNavigate()
  const { showToast } = useToast()
  const { data: articles, isLoading } = useFetchData(() => userService.getHelpArticles())

  const [selectedArticle, setSelectedArticle] = useState<HelpArticle | null>(null)
  const [findPhoneModalOpen, setFindPhoneModalOpen] = useState(false)
  const [feedbackModalOpen, setFeedbackModalOpen] = useState(false)
  const [feedbackType, setFeedbackType] = useState<'issue' | 'suggestion'>('issue')
  const [feedbackSubject, setFeedbackSubject] = useState('')
  const [feedbackBody, setFeedbackBody] = useState('')
  const [isRinging, setIsRinging] = useState(false)

  const handleOpenFeedback = (type: 'issue' | 'suggestion') => {
    setFeedbackType(type)
    setFeedbackSubject('')
    setFeedbackBody('')
    setFeedbackModalOpen(true)
  }

  const handleSubmitFeedback = (e: React.FormEvent) => {
    e.preventDefault()
    if (!feedbackSubject.trim()) return
    showToast(
      feedbackType === 'issue'
        ? 'Issue reported! Our engineering team has received your ticket.'
        : 'Thank you for your suggestion! We review all feedback.',
      'success'
    )
    setFeedbackModalOpen(false)
  }

  const handleRingPhone = () => {
    setIsRinging(true)
    showToast('Ringing your iPhone 14 Pro at maximum volume for 5 minutes...', 'info')
    setTimeout(() => setIsRinging(false), 4000)
  }

  if (isLoading) {
    return <Loader text="Loading help center..." />
  }

  return (
    <>
      <PageHeader title="Help" subtitle="Answers to common questions, expert advice, and a way to provide feedback" />

      <div style={{ maxWidth: 900, margin: '0 auto', display: 'grid', gap: 20 }}>
        <Card
          title="Help with common issues"
          description="A list of help articles with answers and tips for your LetGetIn account"
          footer={
            <button
              type="button"
              className="link-btn"
              onClick={() => navigate('/support')}
            >
              Visit the help center
            </button>
          }
        >
          {articles?.map((article: HelpArticle) => (
            <CardRow
              key={article.id}
              icon={<DocumentTextIcon />}
              label={article.title}
              onClick={() => setSelectedArticle(article)}
              chevron={true}
            />
          ))}
        </Card>

        <Card
          title="Guided steps"
          footer={
            <button
              type="button"
              className="link-btn"
              onClick={() => setFindPhoneModalOpen(true)}
            >
              Find lost device & guided security
            </button>
          }
        >
          <CardRow
            icon={<ShieldCheckIcon />}
            label="Take the Privacy Checkup"
            value="Choose the privacy settings that are right for you"
            onClick={() => navigate('/profile/data')}
          />
          <CardRow
            icon={<ShieldCheckIcon />}
            label="We keep your account protected"
            value="Personalized recommendations to secure your account"
            onClick={() => navigate('/profile/security')}
          />
          <CardRow
            icon={<PhoneIcon />}
            label="Find your phone"
            value="Secure your lost or stolen device"
            onClick={() => setFindPhoneModalOpen(true)}
          />
        </Card>

        <PageGrid>
          <Card
            title="Ask a community expert"
            description="Ask questions and get advice on account features and settings"
            footer={
              <button
                type="button"
                className="link-btn"
                onClick={() => navigate('/support')}
              >
                Visit the community
              </button>
            }
          />
          <Card
            title="Share feedback"
            footer={
              <button
                type="button"
                className="link-btn"
                onClick={() => handleOpenFeedback('suggestion')}
              >
                Submit feedback or issue
              </button>
            }
          >
            <CardRow
              icon={<MegaphoneIcon />}
              label="Report an issue"
              value="Let us know if something is not working"
              onClick={() => handleOpenFeedback('issue')}
              chevron={true}
            />
            <CardRow
              icon={<LightbulbIcon />}
              label="Make a suggestion"
              value="Help improve LetGetIn services"
              onClick={() => handleOpenFeedback('suggestion')}
              chevron={true}
            />
          </Card>
        </PageGrid>
      </div>

      {/* Article Viewer Modal */}
      <Modal
        isOpen={!!selectedArticle}
        title={selectedArticle?.title || 'Help Article'}
        onClose={() => setSelectedArticle(null)}
        footer={
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', width: '100%' }}>
            <Button variant="secondary" onClick={() => setSelectedArticle(null)}>
              Close
            </Button>
            <Button
              variant="primary"
              onClick={() => {
                showToast('Thank you for your feedback!', 'success')
                setSelectedArticle(null)
              }}
            >
              Yes, this helped
            </Button>
          </div>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <p style={{ margin: 0, fontSize: 13, color: '#334155', lineHeight: 1.6 }}>
            {(selectedArticle as any)?.summary || (selectedArticle as any)?.content ||
              'Follow the guided instructions in your Account Settings to manage preferences, change credentials, or troubleshoot connection problems.'}
          </p>
          <div style={{ padding: 12, background: '#f8fafc', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 12, color: '#475569' }}>
            <strong style={{ display: 'block', marginBottom: 4, color: '#0f172a' }}>Step-by-step checklist:</strong>
            <ul style={{ margin: 0, paddingLeft: 18 }}>
              <li>Open your account profile navigation tab</li>
              <li>Review the security status and recent activity log</li>
              <li>Follow the recommended actions to verify your identity</li>
              <li>Contact support team if you experience unexpected access issues</li>
            </ul>
          </div>
          <p style={{ margin: 0, fontSize: 12, color: '#64748b' }}>
            Need further help?{' '}
            <button
              type="button"
              className="link-btn"
              onClick={() => {
                setSelectedArticle(null)
                navigate('/support')
              }}
            >
              Go to Support Center
            </button>
          </p>
        </div>
      </Modal>

      {/* Find My Phone Modal */}
      <Modal
        isOpen={findPhoneModalOpen}
        title="Find & Secure Your Device"
        onClose={() => setFindPhoneModalOpen(false)}
        footer={
          <Button variant="secondary" onClick={() => setFindPhoneModalOpen(false)}>
            Close
          </Button>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', background: '#f0fdf4', borderRadius: 10, border: '1px solid #bbf7d0' }}>
            <div>
              <strong style={{ fontSize: 13, color: '#166534' }}>📱 iPhone 14 Pro</strong>
              <p style={{ margin: '2px 0 0', fontSize: 12, color: '#15803d' }}>
                Online · Battery: 84% · Location: New York, NY (accurate to 10m)
              </p>
            </div>
            <span style={{ fontSize: 11, background: '#22c55e', color: '#fff', padding: '3px 8px', borderRadius: 12, fontWeight: 600 }}>
              Connected
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
            <Button
              variant="primary"
              disabled={isRinging}
              onClick={handleRingPhone}
            >
              {isRinging ? '🔊 Ringing...' : '🔊 Play Sound / Ring'}
            </Button>
            <Button
              variant="outline"
              onClick={() => showToast('Device screen locked with PIN code.', 'warning')}
            >
              🔒 Lock Device
            </Button>
          </div>

          <div style={{ padding: 12, background: '#fef2f2', borderRadius: 8, fontSize: 12, color: '#991b1b' }}>
            ⚠️ If your device was stolen, you can remotely sign out your LetGetIn account under the{' '}
            <button
              type="button"
              className="link-btn"
              style={{ color: '#dc2626', fontWeight: 600 }}
              onClick={() => {
                setFindPhoneModalOpen(false)
                navigate('/profile/security')
              }}
            >
              Security tab
            </button>.
          </div>
        </div>
      </Modal>

      {/* Share Feedback / Report Issue Modal */}
      <Modal
        isOpen={feedbackModalOpen}
        title={feedbackType === 'issue' ? 'Report an Issue' : 'Make a Suggestion'}
        onClose={() => setFeedbackModalOpen(false)}
        footer={
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', width: '100%' }}>
            <Button variant="secondary" onClick={() => setFeedbackModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleSubmitFeedback}>
              Submit
            </Button>
          </div>
        }
      >
        <form onSubmit={handleSubmitFeedback} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <p style={{ margin: 0, fontSize: 13, color: '#64748b' }}>
            {feedbackType === 'issue'
              ? 'Tell us what went wrong. We will look into it promptly.'
              : 'Share your ideas on how to make LetGetIn better.'}
          </p>
          <Input
            label={feedbackType === 'issue' ? 'Issue Summary' : 'Suggestion Title'}
            value={feedbackSubject}
            onChange={(e) => setFeedbackSubject(e.target.value)}
            placeholder={feedbackType === 'issue' ? 'e.g. Could not update phone number' : 'e.g. Dark mode option'}
            required
          />
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 6 }}>
              Details
            </label>
            <textarea
              rows={4}
              value={feedbackBody}
              onChange={(e) => setFeedbackBody(e.target.value)}
              placeholder="Describe what happened or your suggestion..."
              style={{
                width: '100%',
                padding: '8px 12px',
                borderRadius: 8,
                border: '1px solid #cbd5e1',
                fontSize: 13,
                fontFamily: 'inherit',
                boxSizing: 'border-box',
              }}
            />
          </div>
        </form>
      </Modal>
    </>
  )
}
