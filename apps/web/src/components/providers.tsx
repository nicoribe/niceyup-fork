'use client'

import { queryClient } from '@/lib/react-query'
import { AppProgressProvider as ProgressProvider } from '@bprogress/next'
import { QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from '@workspace/ui/components/sonner'
import { ThemeProvider } from 'next-themes'
import type * as React from 'react'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
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
    </QueryClientProvider>
  )
}
