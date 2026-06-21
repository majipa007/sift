import { useEffect, useState } from 'react'
import type { EmailRecord, UiState } from '../types'

interface EmailDetailProps {
  email: EmailRecord
  uiState: UiState
  onArchive: () => void
  onDismiss: () => void
  onSend: () => void
  onRedraft: (emailId: string, nextDraftText: string) => void
}

export function EmailDetail({
  email,
  uiState,
  onArchive,
  onDismiss,
  onSend,
  onRedraft,
}: EmailDetailProps) {
  const [draftText, setDraftText] = useState(email.draft?.currentText ?? '')
  const [instruction, setInstruction] = useState(
    'Make this slightly more formal and mention Thursday morning.',
  )
  const [isRedrafting, setIsRedrafting] = useState(false)

  useEffect(() => {
    setDraftText(email.draft?.currentText ?? '')
    setInstruction('Make this slightly more formal and mention Thursday morning.')
    setIsRedrafting(false)
  }, [email])

  function handleRedraft() {
    if (!email.draft) {
      return
    }

    const trimmedInstruction = instruction.trim()
    const nextDraftText = trimmedInstruction
      ? `${draftText}\n\n[Updated for mock review: ${trimmedInstruction}]`
      : draftText

    setIsRedrafting(true)

    window.setTimeout(() => {
      setDraftText(nextDraftText)
      onRedraft(email.id, nextDraftText)
      setIsRedrafting(false)
    }, 700)
  }

  return (
    <>
      <div className="panel-heading detail-heading">
        <div>
          <p className="eyebrow">Selected Email</p>
          <h2>{email.subject}</h2>
        </div>
        <div className="detail-metadata">
          <p>{email.sender}</p>
          <p>{email.receivedAt}</p>
        </div>
      </div>

      <div className="detail-scroll">
        <div className="detail-section detail-section-note">
          <div className="detail-label-row">
            <span className="section-label">Why Sift Surfaced This</span>
            <span>{email.bucket === 'needs_reply' ? `Priority ${email.priority}/5` : 'Review only'}</span>
          </div>
          <p className="sift-reason">{email.classifyReason}</p>
        </div>

        <div className="detail-section">
          <div className="detail-label-row">
            <span className="section-label">Original Email</span>
            <span>{email.bucket === 'needs_reply' ? `Priority ${email.priority}/5` : 'Read only'}</span>
          </div>
          <div className="email-body">
            {email.body.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </div>
        </div>

        {email.draft ? (
          <>
            <div className="detail-section detail-section-note">
              <label className="instruction-block instruction-block-prominent">
                <span className="section-label">Revise This Draft</span>
                <p className="instruction-helper">
                  Give one clear instruction. Sift rewrites the current draft in place.
                </p>
                <input
                  type="text"
                  value={instruction}
                  onChange={(event) => setInstruction(event.target.value)}
                />
              </label>
            </div>

            <div className="detail-section detail-section-draft">
              <div className="detail-label-row">
                <span className="section-label">Draft</span>
                <span>{isRedrafting ? 'Generating revision...' : 'Editable reply'}</span>
              </div>
              <textarea
                className="draft-textarea"
                value={draftText}
                onChange={(event) => setDraftText(event.target.value)}
                aria-label="Draft reply"
              />
            </div>
          </>
        ) : null}

        {uiState === 'syncing' ? (
          <div className="detail-section status-note">
            <p>Refreshing queue data and checking for newly classified emails.</p>
          </div>
        ) : null}

        {uiState === 'auth_expired' ? (
          <div className="detail-section status-note">
            <p>Gmail needs to be reconnected before any action can reach the mailbox.</p>
          </div>
        ) : null}

        {uiState === 'error' ? (
          <div className="detail-section status-note">
            <p>The last request failed. Keep the draft text, then retry when the connection is stable.</p>
          </div>
        ) : null}
      </div>

      <div className="detail-action-bar">
        <div>
          <p className="section-label">Next Action</p>
          <p className="action-summary">
            {email.draft
              ? 'Review the reply, revise if needed, then send.'
              : email.bucket === 'fyi'
                ? 'Keep it for reference or clear it from the queue.'
                : 'Archive this message and move on.'}
          </p>
        </div>
        <div className="action-row action-row-sticky">
          {email.draft ? (
            <>
              <button
                type="button"
                onClick={handleRedraft}
                disabled={isRedrafting || uiState !== 'ready'}
              >
                {isRedrafting ? 'Redrafting...' : 'Redraft'}
              </button>
              <button type="button" onClick={onArchive} disabled={uiState !== 'ready'}>
                Archive
              </button>
              <button
                type="button"
                className="primary-button"
                onClick={onSend}
                disabled={uiState !== 'ready'}
              >
                Send
              </button>
            </>
          ) : (
            <>
              {email.bucket === 'fyi' ? (
                <button type="button" onClick={onDismiss} disabled={uiState !== 'ready'}>
                  Dismiss
                </button>
              ) : null}
              <button
                type="button"
                className="primary-button"
                onClick={onArchive}
                disabled={uiState !== 'ready'}
              >
                Archive
              </button>
            </>
          )}
        </div>
      </div>
    </>
  )
}
