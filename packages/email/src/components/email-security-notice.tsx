// biome-ignore lint/correctness/noUnusedImports: <explanation>
import * as React from 'react'

import { Text } from '@react-email/components'

export function EmailSecurityNotice() {
  return (
    <Text className="text-black/60 text-xs leading-6">
      If you didn’t expect this email, you can safely ignore it. If you’re
      concerned about your account’s security, please reply to this email to get
      in touch with us.
    </Text>
  )
}
