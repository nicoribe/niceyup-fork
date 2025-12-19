import { redirect } from 'next/navigation'

export default async function Page() {
  return redirect('/account/settings/general')
}
