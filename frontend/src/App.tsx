import { useEffect, useState } from 'react'
import { Route, Routes } from 'react-router-dom'
import './App.css'
import { AppHeader } from './components/AppHeader'
import { EmailDetail } from './components/EmailDetail'
import { EmailList } from './components/EmailList'
import { OnboardingForm } from './components/OnboardingForm'
import { Sidebar } from './components/Sidebar'
import { inboxData } from './mockData'
import type { Bucket, UiState } from './types'

function App() {
  return (
    <Routes>
      <Route path="/" element={<TriagePage />} />
      <Route path="/onboarding" element={<OnboardingPage />} />
    </Routes>
  )
}

function TriagePage() {
  const [queues, setQueues] = useState(inboxData)
  const [selectedBucket, setSelectedBucket] = useState<Bucket>('needs_reply')
  const [selectedEmailId, setSelectedEmailId] = useState<string | null>(
    inboxData.needs_reply[0]?.id ?? null,
  )
  const [uiState, setUiState] = useState<UiState>('ready')

  const selectedEmails = queues[selectedBucket]
  const selectedEmail =
    selectedEmails.find((email) => email.id === selectedEmailId) ?? selectedEmails[0] ?? null

  useEffect(() => {
    if (!selectedEmails.length) {
      setSelectedEmailId(null)
      return
    }

    if (!selectedEmail || !selectedEmails.some((email) => email.id === selectedEmail.id)) {
      setSelectedEmailId(selectedEmails[0].id)
    }
  }, [selectedBucket, selectedEmail, selectedEmails])

  function handleBucketChange(bucket: Bucket) {
    setSelectedBucket(bucket)
    setSelectedEmailId(queues[bucket][0]?.id ?? null)
  }

  function handleRefresh() {
    setUiState('syncing')

    window.setTimeout(() => {
      setUiState('ready')
    }, 900)
  }

  function removeEmail(emailId: string) {
    setQueues((currentQueues) => ({
      ...currentQueues,
      [selectedBucket]: currentQueues[selectedBucket].filter((email) => email.id !== emailId),
    }))
  }

  function updateDraft(emailId: string, nextDraftText: string) {
    setQueues((currentQueues) => ({
      ...currentQueues,
      [selectedBucket]: currentQueues[selectedBucket].map((email) => {
        if (email.id !== emailId || !email.draft) {
          return email
        }

        return {
          ...email,
          draft: {
            version: email.draft.version + 1,
            currentText: nextDraftText,
          },
        }
      }),
    }))
  }

  return (
    <div className="site-shell">
      <AppHeader title="Inbox triage for the emails that actually matter." />

      <main className="triage-grid">
        <Sidebar
          queues={queues}
          selectedBucket={selectedBucket}
          onBucketChange={handleBucketChange}
          onSetUiState={setUiState}
          onRefresh={handleRefresh}
        />

        <EmailList
          selectedBucket={selectedBucket}
          emails={selectedEmails}
          selectedEmailId={selectedEmail?.id ?? null}
          uiState={uiState}
          onRefresh={handleRefresh}
          onSelectEmail={setSelectedEmailId}
        />

        <section className="panel detail-panel" aria-label="Selected email detail">
          {selectedEmail ? (
            <EmailDetail
              email={selectedEmail}
              onArchive={() => removeEmail(selectedEmail.id)}
              onDismiss={() => removeEmail(selectedEmail.id)}
              onSend={() => removeEmail(selectedEmail.id)}
              onRedraft={updateDraft}
              uiState={uiState}
            />
          ) : (
            <div className="empty-state empty-state-detail">
              <p className="section-label">Clear</p>
              <h3>This queue is empty.</h3>
              <p>Select another bucket or wait for the next ingest.</p>
            </div>
          )}
        </section>
      </main>
    </div>
  )
}

function OnboardingPage() {
  return (
    <div className="site-shell onboarding-shell">
      <AppHeader title="A short profile keeps the sorting personal." compact />

      <main className="onboarding-grid">
        <section className="panel onboarding-intro">
          <p className="eyebrow">Profile</p>
          <h2>Define what matters before the model starts guessing.</h2>
          <p>
            Keep this structured. The agent should classify against specific signal,
            not a vague paragraph about your work.
          </p>
        </section>

        <OnboardingForm />
      </main>
    </div>
  )
}

export default App
