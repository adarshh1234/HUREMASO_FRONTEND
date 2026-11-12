import { useState } from 'react'
import { PageHeader, Card, CardRow } from '../components/Card'
import { Loader } from '../components/Loader'
import { Modal } from '../components/Modal'
import { Button } from '../components/Button'
import { Input } from '../components/Input'
import { userService } from '../services/user.service'
import { useFetchData } from '../hooks/useFetchData'
import useToast from '../../../hooks/useToast'
import {
  CreditCardIcon,
  ShoppingBagIcon,
  FilmIcon,
  CalendarTicketIcon,
} from '../components/Icons'
import type { SubscriptionItem } from '../types/user.types'

export default function PaymentsSubscription() {
  const { showToast } = useToast()
  const { data: subscriptions, isLoading, setData: setSubs } = useFetchData(() => userService.getSubscriptions())

  const [paymentModalOpen, setPaymentModalOpen] = useState(false)
  const [purchasesModalOpen, setPurchasesModalOpen] = useState(false)
  const [subscriptionModalOpen, setSubscriptionModalOpen] = useState(false)
  const [reservationsModalOpen, setReservationsModalOpen] = useState(false)

  // Payment methods state
  const [cards, setCards] = useState([
    { id: 'c1', type: 'Visa', last4: '4242', exp: '12/28', isDefault: true },
    { id: 'c2', type: 'Mastercard', last4: '8821', exp: '09/27', isDefault: false },
  ])
  const [newCardNumber, setNewCardNumber] = useState('')
  const [newCardExp, setNewCardExp] = useState('')
  const [showAddCard, setShowAddCard] = useState(false)

  const handleAddCard = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newCardNumber.trim() || newCardNumber.length < 4) {
      showToast('Please enter a valid card number', 'error')
      return
    }
    const last4 = newCardNumber.slice(-4)
    setCards([
      ...cards,
      { id: `c-${Date.now()}`, type: 'Visa', last4, exp: newCardExp || '12/29', isDefault: false },
    ])
    setNewCardNumber('')
    setNewCardExp('')
    setShowAddCard(false)
    showToast(`Card ending in •••• ${last4} added successfully!`, 'success')
  }

  const handleRemoveCard = (id: string) => {
    setCards(cards.filter((c) => c.id !== id))
    showToast('Payment card removed', 'info')
  }

  if (isLoading) {
    return <Loader text="Loading payments & subscriptions..." />
  }

  return (
    <>
      <PageHeader
        title="Payments & subscriptions"
        subtitle="Your payment info, transactions, recurring payments, and reservations"
      />

      <div style={{ maxWidth: 900, margin: '0 auto', display: 'grid', gap: 20 }}>
        {/* 1. Payment methods */}
        <Card
          title="Payment methods"
          description="Save payment info for more secure payments online, for your Assistant and in store"
          graphic={<CreditCardIcon />}
          footer={
            <button
              type="button"
              className="link-btn"
              onClick={() => setPaymentModalOpen(true)}
            >
              Manage payment methods
            </button>
          }
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 4 }}>
            {cards.map((c) => (
              <div
                key={c.id}
                style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 13, padding: '6px 0', cursor: 'pointer' }}
                onClick={() => setPaymentModalOpen(true)}
                title="Click to manage card"
              >
                <span>💳 {c.type} ending in •••• {c.last4} {c.isDefault && <strong style={{ color: '#004848' }}>(Default)</strong>}</span>
                <span style={{ color: '#64748b' }}>Expires {c.exp}</span>
              </div>
            ))}
          </div>
        </Card>

        {/* 2. Purchases */}
        <Card
          title="Purchases"
          description="Your purchases, including deliveries and other online orders"
          graphic={<ShoppingBagIcon />}
          footer={
            <button
              type="button"
              className="link-btn"
              onClick={() => setPurchasesModalOpen(true)}
            >
              Manage purchases
            </button>
          }
        />

        {/* 3. Subscriptions */}
        <Card
          title="Subscriptions"
          description="Your recurring payments for subscription services, like news and streaming media"
          graphic={<FilmIcon />}
          footer={
            <button
              type="button"
              className="link-btn"
              onClick={() => setSubscriptionModalOpen(true)}
            >
              Manage subscription
            </button>
          }
        >
          {subscriptions?.map((sub: SubscriptionItem) => (
            <CardRow
              key={sub.id}
              icon={<FilmIcon />}
              label={sub.title}
              value={`${sub.cost} (${sub.status})`}
              onClick={() => setSubscriptionModalOpen(true)}
            />
          ))}
        </Card>

        {/* 4. Reservations */}
        <Card
          title="Reservations"
          description="Your past and upcoming reservations for flights, hotels, and events"
          graphic={<CalendarTicketIcon />}
          footer={
            <button
              type="button"
              className="link-btn"
              onClick={() => setReservationsModalOpen(true)}
            >
              Manage reservations
            </button>
          }
        />
      </div>

      {/* Payment Methods Modal */}
      <Modal
        isOpen={paymentModalOpen}
        title="Payment Methods"
        onClose={() => {
          setPaymentModalOpen(false)
          setShowAddCard(false)
        }}
        footer={
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', width: '100%' }}>
            {!showAddCard ? (
              <>
                <Button variant="secondary" onClick={() => setPaymentModalOpen(false)}>
                  Close
                </Button>
                <Button variant="primary" onClick={() => setShowAddCard(true)}>
                  + Add Payment Method
                </Button>
              </>
            ) : (
              <Button variant="secondary" onClick={() => setShowAddCard(false)}>
                Cancel
              </Button>
            )}
          </div>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {cards.map((c) => (
            <div
              key={c.id}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '12px 14px',
                border: '1px solid #e2e8f0',
                borderRadius: 12,
                background: c.isDefault ? '#f0fdf4' : '#ffffff',
              }}
            >
              <div>
                <div style={{ fontWeight: 600, fontSize: 14 }}>
                  {c.type} •••• {c.last4}
                </div>
                <div style={{ fontSize: 12, color: '#64748b' }}>Expires: {c.exp}</div>
              </div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                {c.isDefault ? (
                  <span style={{ fontSize: 12, fontWeight: 700, color: '#16a34a' }}>Default</span>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleRemoveCard(c.id)}
                    style={{ border: 'none', background: 'transparent', color: '#dc2626', fontSize: 12, cursor: 'pointer', fontWeight: 600 }}
                  >
                    Remove
                  </button>
                )}
              </div>
            </div>
          ))}

          {showAddCard && (
            <form onSubmit={handleAddCard} style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 8, padding: 14, border: '1px dashed #004848', borderRadius: 12 }}>
              <strong style={{ fontSize: 13, color: '#004848' }}>Add New Credit/Debit Card</strong>
              <Input
                label="Card Number"
                value={newCardNumber}
                onChange={(e) => setNewCardNumber(e.target.value)}
                placeholder="4532 0159 8821 4242"
                required
              />
              <Input
                label="Expiration (MM/YY)"
                value={newCardExp}
                onChange={(e) => setNewCardExp(e.target.value)}
                placeholder="08/29"
                required
              />
              <Button variant="primary" type="submit">
                Save Card
              </Button>
            </form>
          )}
        </div>
      </Modal>

      {/* Purchases Modal */}
      <Modal
        isOpen={purchasesModalOpen}
        title="Purchase & Invoice History"
        onClose={() => setPurchasesModalOpen(false)}
        footer={
          <div style={{ display: 'flex', justifyContent: 'flex-end', width: '100%' }}>
            <Button variant="primary" onClick={() => setPurchasesModalOpen(false)}>
              Done
            </Button>
          </div>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {[
            { id: 'ORD-8821', item: 'Cloud Storage Upgrade (100GB)', date: 'Sep 12, 2026', price: '$19.99', status: 'Paid' },
            { id: 'ORD-7540', item: 'Executive Workspace License', date: 'Aug 01, 2026', price: '$29.00', status: 'Paid' },
            { id: 'ORD-6120', item: 'Global VPN & Remote Work Pack', date: 'Jul 15, 2026', price: '$9.99', status: 'Paid' },
          ].map((ord) => (
            <div
              key={ord.id}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '12px 14px',
                border: '1px solid #e2e8f0',
                borderRadius: 12,
              }}
            >
              <div>
                <strong style={{ fontSize: 13 }}>{ord.item}</strong>
                <p style={{ margin: '2px 0 0', fontSize: 12, color: '#64748b' }}>
                  {ord.id} • {ord.date}
                </p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span style={{ fontWeight: 700, fontSize: 13 }}>{ord.price}</span>
                <div>
                  <button
                    type="button"
                    onClick={() => showToast(`Invoice ${ord.id} downloaded!`, 'success')}
                    style={{ border: 'none', background: 'transparent', color: '#004848', fontSize: 11, cursor: 'pointer', fontWeight: 600 }}
                  >
                    Download PDF
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Modal>

      {/* Subscription Modal */}
      <Modal
        isOpen={subscriptionModalOpen}
        title="Active Subscriptions"
        onClose={() => setSubscriptionModalOpen(false)}
        footer={
          <div style={{ display: 'flex', justifyContent: 'flex-end', width: '100%' }}>
            <Button variant="primary" onClick={() => setSubscriptionModalOpen(false)}>
              Close
            </Button>
          </div>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {subscriptions?.map((sub) => (
            <div
              key={sub.id}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '12px 14px',
                border: '1px solid #e2e8f0',
                borderRadius: 12,
              }}
            >
              <div>
                <strong style={{ fontSize: 13 }}>{sub.title}</strong>
                <p style={{ margin: '2px 0 0', fontSize: 12, color: '#64748b' }}>
                  Billing: {sub.cost} • Renews automatically
                </p>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  showToast(`${sub.title} subscription plan settings updated!`, 'info')
                  setSubscriptionModalOpen(false)
                }}
              >
                Change Plan
              </Button>
            </div>
          ))}
        </div>
      </Modal>

      {/* Reservations Modal */}
      <Modal
        isOpen={reservationsModalOpen}
        title="Reservations & Bookings"
        onClose={() => setReservationsModalOpen(false)}
        footer={
          <div style={{ display: 'flex', justifyContent: 'flex-end', width: '100%' }}>
            <Button variant="primary" onClick={() => setReservationsModalOpen(false)}>
              Done
            </Button>
          </div>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {[
            { type: '✈️ Flight', dest: 'London Heathrow (LHR)', date: 'Oct 15, 2026', code: 'BA-249', status: 'Confirmed' },
            { type: '🏨 Hotel', dest: 'Marriott Marquis City Center', date: 'Oct 15 - 19, 2026', code: 'RES-8901', status: 'Confirmed' },
            { type: '🎟️ Conference', dest: 'Global HR Leadership Summit', date: 'Nov 04, 2026', code: 'CONF-442', status: 'Registered' },
          ].map((res) => (
            <div
              key={res.code}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '12px 14px',
                border: '1px solid #e2e8f0',
                borderRadius: 12,
              }}
            >
              <div>
                <strong style={{ fontSize: 13 }}>{res.type} — {res.dest}</strong>
                <p style={{ margin: '2px 0 0', fontSize: 12, color: '#64748b' }}>
                  {res.date} • Ref: {res.code}
                </p>
              </div>
              <span style={{ fontSize: 12, fontWeight: 700, color: '#004848', padding: '4px 8px', background: '#f0fdf4', borderRadius: 999 }}>
                {res.status}
              </span>
            </div>
          ))}
        </div>
      </Modal>
    </>
  )
}

