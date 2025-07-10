'use client'

import { Toaster } from '@workspace/ui/components/sonner'
import { ThemeProvider } from 'next-themes'
import type * as React from 'react'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
      enableColorScheme
    >
      {children}
      <Toaster />
    </ThemeProvider>
  )
}
