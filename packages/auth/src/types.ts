import type { auth } from './auth'

export type Session = typeof auth.$Infer.Session.session
export type User = typeof auth.$Infer.Session.user

export type Organization = typeof auth.$Infer.Organization
export type Team = typeof auth.$Infer.Team
