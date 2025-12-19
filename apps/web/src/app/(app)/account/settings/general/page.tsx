import { authenticatedUser } from '@/lib/auth/server'
import { DeleteUserForm } from './_components/delete-user-form'
import { EditUserImageForm } from './_components/edit-user-image-form'
import { EditUserNameForm } from './_components/edit-user-name-form'
import { ViewUserId } from './_components/view-user-id'

export default async function Page() {
  const { user } = await authenticatedUser()

  return (
    <div className="flex w-full flex-col gap-4">
      <EditUserNameForm name={user.name} />

      <EditUserImageForm image={user.image} />

      <ViewUserId id={user.id} />

      <DeleteUserForm />
    </div>
  )
}
