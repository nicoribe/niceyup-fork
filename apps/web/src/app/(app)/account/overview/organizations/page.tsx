import { listOrganizations } from '@/actions/organizations'
import { OrganizationList } from './_components/organization-list'

export default async function Page() {
  const organizations = await listOrganizations()

  return <OrganizationList organizations={organizations} />
}
