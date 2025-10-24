import { Providers } from '@/components/providers'
import type { Metadata } from 'next'
import '@workspace/ui/globals.css'
import { fontVariables } from '@/lib/fonts'
import { generateMeta } from '@/lib/generate-meta'

export const metadata: Metadata = generateMeta()

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={fontVariables}>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
