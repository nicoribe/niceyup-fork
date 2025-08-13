'use client'

import { AppProgressProvider as ProgressProvider } from '@bprogress/next'
import { Toaster } from '@workspace/ui/components/sonner'
import { ThemeProvider } from 'next-themes'
import type * as React from 'react'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      enableColorScheme
      disableTransitionOnChange
    >
      <ProgressProvider
        color="currentColor"
        options={{ showSpinner: false }}
        shallowRouting
      >
        {children}
        <Toaster />
      </ProgressProvider>
    </ThemeProvider>
  )
}
