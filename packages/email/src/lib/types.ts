export type User = {
  id: string
  email: string
  name: string
  image?: string | null
}

export type Organization = {
  id: string
  name: string
  slug: string
  logo?: string | null
}
