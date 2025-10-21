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

export function VerifyEmail({
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
          <Preview>Verify your email address for Niceyup</Preview>
          <Container className="mx-auto my-10 max-w-md rounded border border-black/30 border-solid p-5">
            <Section className="mt-8">
              <Logo />
            </Section>

            <Heading className="mx-0 my-8 p-0 text-center font-normal text-2xl text-black">
              Verify your email address for <strong>Niceyup</strong>
            </Heading>

            <Text className="text-black text-sm leading-6">
              Hello <strong>{firstName}</strong>,
            </Text>

            <Text className="mt-4 text-black text-sm leading-6">
              Thank you for signing up! We're excited to have you with us and
              look forward to helping you get started.
            </Text>

            <Text className="mt-4 text-black text-sm leading-6">
              Please verify your email address by clicking the button below:
            </Text>

            <Section className="mt-8 mb-8 text-center">
              <Button
                className="rounded bg-black px-5 py-3 text-center font-semibold text-white text-xs no-underline"
                href={url}
              >
                Verify your email address
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
