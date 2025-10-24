import { env } from '@/lib/env'
import type { Metadata } from 'next'

export const generateMeta = (): Metadata => {
  const title = 'Niceyup'
  const excerpt = 'Your AI-Powered Personal Assistant'
  const description =
    'Not just another chat tool — it’s reimagined so humans and AI work together as true teammates. Built for power users and teams, with memory, collaboration, and effortless integration.'

  return {
    title: { default: `${title} — ${excerpt}`, template: `%s | ${title}` },
    description,
    keywords: ['AI', 'assistant', 'productivity', 'team collaboration'],
    creator: 'Niceyup Team',
    authors: [{ name: 'Niceyup Team', url: 'https://niceyup.com' }],
    icons: [
      {
        url: 'https://assets.niceyup.com/logo-light.png',
        media: '(prefers-color-scheme: light)',
      },
      {
        url: 'https://assets.niceyup.com/logo-dark.png',
        media: '(prefers-color-scheme: dark)',
      },
    ],
    openGraph: {
      type: 'website',
      url: env.WEB_URL,
      title,
      siteName: title,
      description,
      images: [
        {
          url: 'https://assets.niceyup.com/og-image.png',
          alt: `${title} Open Graph`,
        },
      ],
      emails: ['hello@niceyup.team'],
    },
  }
}
