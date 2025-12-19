// biome-ignore lint/correctness/noUnusedImports: <explanation>
import * as React from 'react'

import {
  Body,
  Button,
  Column,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Img,
  Preview,
  Row,
  Section,
  Tailwind,
  Text,
} from '@react-email/components'
import { EmailSecurityNotice } from '../components/email-security-notice'
import { Logo } from '../components/logo'
import type { Organization, User } from '../lib/types'
import { getInitials } from '../lib/utils'

export function OrganizationInvitationEmail({
  organization,
  inviter,
  user,
  url,
  expiresIn,
}: {
  organization: Organization
  inviter: User
  user: {
    email: string
    role: string
    name?: string | null
    image?: string | null
  }
  url: string
  expiresIn: string
}) {
  const [firstName] = user.name ? user.name.split(' ') : user.email.split('@')

  return (
    <Html>
      <Head />
      <Tailwind>
        <Body className="mx-auto my-auto bg-white px-2 font-sans">
          <Preview>
            You've been invited to join {organization.name} on Niceyup
          </Preview>
          <Container className="mx-auto my-10 max-w-lg rounded border border-[#eaeaea] border-solid p-5">
            <Section className="mt-8">
              <Logo />
            </Section>

            <Heading className="mx-0 my-8 p-0 text-center font-normal text-2xl text-black">
              Join <strong>{organization.name}</strong> on{' '}
              <strong>Niceyup</strong>
            </Heading>

            <Text className="text-black text-sm leading-6">
              Hello <strong>{firstName}</strong>,
            </Text>

            <Text className="mt-4 text-black text-sm leading-6">
              <strong>{inviter.name}</strong> ({inviter.email}) has invited you
              the <strong>{organization.name}</strong> organization on{' '}
              <strong>Niceyup</strong> with the <strong>{user.role}</strong>{' '}
              role.
            </Text>

            <Section className="mt-8 mb-8">
              <Row>
                <Column align="right">
                  {user.image ? (
                    <Img
                      className="rounded-full"
                      src={user.image}
                      width="64"
                      height="64"
                      alt={`${firstName}'s profile picture`}
                    />
                  ) : (
                    <Section className="m-0 h-[64px] w-[64px] rounded-full bg-[rgba(0,0,0,.05)] align-middle">
                      <Text className="mx-auto my-0 text-center text-2xl">
                        {getInitials(user.email)}
                      </Text>
                    </Section>
                  )}
                </Column>
                <Column align="center">
                  <Img
                    src={'https://assets.niceyup.com/assets/arrow-right.png'}
                    width="12"
                    height="9"
                    alt="Arrow indicating invitation"
                  />
                </Column>
                <Column align="left">
                  {organization.logo ? (
                    <Img
                      className="rounded-full"
                      src={organization.logo}
                      width="64"
                      height="64"
                      alt={`${organization.name} organization logo`}
                    />
                  ) : (
                    <Section className="m-0 h-[64px] w-[64px] rounded-full bg-[rgba(0,0,0,.05)] align-middle">
                      <Text className="mx-auto my-0 text-center text-2xl">
                        {getInitials(organization.name)}
                      </Text>
                    </Section>
                  )}
                </Column>
              </Row>
            </Section>

            <Text className="text-black text-sm leading-6">
              You can accept or decline this invitation by clicking the button
              below:
            </Text>

            <Section className="mt-8 mb-8 text-center">
              <Button
                className="rounded bg-black px-5 py-3 text-center font-semibold text-white text-xs no-underline"
                href={url}
              >
                View invitation
              </Button>
            </Section>

            <Text className="text-black text-sm leading-6">
              This invitation is valid for {expiresIn} and should not be shared.
            </Text>

            <Hr className="mx-0 my-7 w-full border border-black/30 border-solid" />

            <EmailSecurityNotice />
          </Container>
        </Body>
      </Tailwind>
    </Html>
  )
}
