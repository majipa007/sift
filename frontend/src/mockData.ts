import type { InboxData, Profile } from './types'

export const profileData: Profile = {
  role: 'Freelance product designer',
  important: ['Client inquiries', 'Project approvals', 'Invoices'],
  junkRules: ['Cold sales outreach', 'Promotional newsletters', 'Event blasts'],
  keySenders: ['clients@northstar.studio', 'finance@acme.co', 'maria@northstar.studio'],
  defaultTone: 'formal',
}

export const inboxData: InboxData = {
  needs_reply: [
    {
      id: 'email-1',
      bucket: 'needs_reply',
      priority: 4,
      sender: 'Maria Chen <maria@northstar.studio>',
      subject: 'Can we confirm the revised launch copy today?',
      snippet: 'We are aligned on the structure. Need your sign-off before I send the final deck.',
      classifyReason: 'Direct client request that requires approval today.',
      receivedAt: 'Today, 10:24',
      body: [
        'Hi Sulav,',
        'We have incorporated the comments from yesterday and the launch deck is ready. Can you confirm the revised copy today so I can send it to the client before 3 PM?',
        'If you want, I can also adjust the opening section to be slightly more conservative.',
        'Maria',
      ],
      draft: {
        version: 2,
        currentText:
          'Hi Maria,\n\nThe revised launch copy looks good to me. Please go ahead and send the deck to the client today. If you make one more pass, tighten the opening section slightly so the tone lands a bit more conservatively.\n\nThanks,\nSulav',
      },
    },
    {
      id: 'email-2',
      bucket: 'needs_reply',
      priority: 3,
      sender: 'Finance Team <finance@acme.co>',
      subject: 'Invoice details needed for June processing',
      snippet: 'Please confirm the billing address and tax note before Friday.',
      classifyReason: 'Finance request tied to invoicing and deadline.',
      receivedAt: 'Today, 08:10',
      body: [
        'Hello Sulav,',
        'We are preparing the June processing batch and need your billing address confirmation, along with any tax note you want included on the invoice.',
        'Please reply before Friday noon.',
      ],
      draft: {
        version: 1,
        currentText:
          'Hello,\n\nPlease use the same billing address as on the May invoice. I will send the tax note separately later today so you can include it in the June processing batch.\n\nBest,\nSulav',
      },
    },
  ],
  fyi: [
    {
      id: 'email-3',
      bucket: 'fyi',
      priority: 2,
      sender: 'Nikhil Rao <nikhil@partnerops.io>',
      subject: 'Weekly rollout report',
      snippet: 'Sharing the latest metrics and launch notes for review.',
      classifyReason: 'Useful project update, but no explicit response requested.',
      receivedAt: 'Yesterday, 18:42',
      body: [
        'Hi Sulav,',
        'Attaching the weekly rollout report. The onboarding completion rate improved by 11%, and the support backlog is down again this week.',
        'No action needed unless you want to adjust the reporting format for next Monday.',
      ],
      draft: null,
    },
  ],
  junk: [
    {
      id: 'email-4',
      bucket: 'junk',
      priority: 1,
      sender: 'Outbound Growth <hello@hyperpipeline.ai>',
      subject: 'Double your response rate this quarter',
      snippet: 'We noticed your company could benefit from our outbound engine.',
      classifyReason: 'Cold sales outreach that matches the junk rules.',
      receivedAt: 'Yesterday, 11:06',
      body: [
        'Hi there,',
        'We help teams double their response rates in under thirty days with a fully managed outbound engine and intent tracking layer.',
        'Would you be open to a quick call next week?',
      ],
      draft: null,
    },
  ],
}
