export type Bucket = 'needs_reply' | 'fyi' | 'junk'

export type UiState = 'ready' | 'syncing' | 'auth_expired' | 'error'

export type Tone = 'formal' | 'friendly' | 'concise'

export interface Draft {
  version: number
  currentText: string
}

export interface EmailRecord {
  id: string
  bucket: Bucket
  priority: number
  sender: string
  subject: string
  snippet: string
  classifyReason: string
  receivedAt: string
  body: string[]
  draft: Draft | null
}

export interface InboxData {
  needs_reply: EmailRecord[]
  fyi: EmailRecord[]
  junk: EmailRecord[]
}

export interface Profile {
  role: string
  important: string[]
  junkRules: string[]
  keySenders: string[]
  defaultTone: Tone
}
