// biome-ignore lint/correctness/noUnusedImports: <explanation>
import * as React from 'react'

import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Section,
  Tailwind,
  Text,
} from '@react-email/components'
import { EmailSecurityNotice } from '../components/email-security-notice'
import { Logo } from '../components/logo'
import type { User } from '../lib/types'

export function ResetPassword({
  user,
  url,
}: {
  user: User
  url: string
}) {
  const [firstName] = user.name.split(' ')

  return (
    <Html>
      <Head />
      <Tailwind>
        <Body className="mx-auto my-auto bg-white px-2 font-sans">
          <Preview>Reset your password for Niceyup</Preview>
          <Container className="mx-auto my-10 max-w-lg rounded border border-[#eaeaea] border-solid p-5">
            <Section className="mt-8">
              <Logo />
            </Section>

            <Heading className="mx-0 my-8 p-0 text-center font-normal text-2xl text-black">
              Reset your password for <strong>Niceyup</strong>
            </Heading>

            <Text className="text-black text-sm leading-6">
              Hello <strong>{firstName}</strong>,
            </Text>

            <Text className="mt-4 text-black text-sm leading-6">
              We received a request to reset the password for your account
              associated with this email address.
            </Text>

            <Text className="mt-4 text-black text-sm leading-6">
              To reset your password, please click the button below:
            </Text>

            <Section className="mt-8 mb-8 text-center">
              <Button
                className="rounded bg-black px-5 py-3 text-center font-semibold text-white text-xs no-underline"
                href={url}
              >
                Reset Password
              </Button>
            </Section>

            <Hr className="mx-0 my-7 w-full border border-black/30 border-solid" />

            <EmailSecurityNotice />
          </Container>
        </Body>
      </Tailwind>
    </Html>
  )
}
