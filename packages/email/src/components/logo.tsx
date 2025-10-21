// biome-ignore lint/correctness/noUnusedImports: <explanation>
import * as React from 'react'

import { Img } from '@react-email/components'

export function Logo() {
  return (
    <Img
      src="https://assets.niceyup.com/logo-light.png"
      width="48"
      height="48"
      alt="Niceyup Logo"
      className="mx-auto my-0"
    />
  )
}
