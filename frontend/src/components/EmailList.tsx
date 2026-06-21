import { bucketLabels } from '../constants'
import type { Bucket, EmailRecord, UiState } from '../types'
import { StatusBanner } from './StatusBanner'

interface EmailListProps {
  selectedBucket: Bucket
  emails: EmailRecord[]
  selectedEmailId: string | null
  uiState: UiState
  onRefresh: () => void
  onSelectEmail: (emailId: string) => void
}

export function EmailList({
  selectedBucket,
  emails,
  selectedEmailId,
  uiState,
  onRefresh,
  onSelectEmail,
}: EmailListProps) {
  return (
    <section className="panel list-panel" aria-label="Email list">
      <div className="panel-heading panel-heading-tight">
        <div>
          <h2>{bucketLabels[selectedBucket]}</h2>
          <p>{emails.length} emails awaiting review</p>
        </div>
        <button type="button" className="text-button" onClick={onRefresh}>
          {uiState === 'syncing' ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>
      {uiState === 'auth_expired' ? (
        <StatusBanner
          title="Reconnect Gmail"
          message="Your testing-mode token expired. Reconnect before sending or archiving."
        />
      ) : null}
      {uiState === 'error' ? (
        <StatusBanner
          title="Temporary Error"
          message="The last sync failed. Check Gmail auth and retry the ingest request."
          alert
        />
      ) : null}
      <div className="email-list">
        {emails.length ? (
          emails.map((email) => (
            <button
              key={email.id}
              type="button"
              className={`email-row${email.id === selectedEmailId ? ' is-selected' : ''}`}
              onClick={() => onSelectEmail(email.id)}
            >
              <div className="email-row-meta">
                <p className="email-row-sender">{email.sender}</p>
                <time>{email.receivedAt}</time>
              </div>
              <h3>{email.subject}</h3>
              <p className="email-row-snippet">{email.snippet}</p>
            </button>
          ))
        ) : (
          <div className="empty-state">
            <p className="section-label">Empty</p>
            <h3>No emails in {bucketLabels[selectedBucket]}.</h3>
            <p>Nothing here right now. The next ingest will populate this queue.</p>
          </div>
        )}
      </div>
    </section>
  )
}
