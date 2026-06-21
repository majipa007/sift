import type { Bucket } from './types'

export const bucketOrder: Bucket[] = ['needs_reply', 'fyi', 'junk']

export const bucketLabels: Record<Bucket, string> = {
  needs_reply: 'Needs Reply',
  fyi: 'FYI',
  junk: 'Junk',
}
