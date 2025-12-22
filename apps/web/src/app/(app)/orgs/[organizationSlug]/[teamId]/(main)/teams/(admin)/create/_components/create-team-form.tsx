'use client'

import { updateTag } from '@/actions/cache'
import { authClient } from '@/lib/auth/client'
import type { OrganizationTeamParams } from '@/lib/types'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@workspace/ui/components/button'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@workspace/ui/components/form'
import { Input } from '@workspace/ui/components/input'
import { Spinner } from '@workspace/ui/components/spinner'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'

const formSchema = z.object({
  name: z.string().trim().min(3).max(255),
})

type CreateTeamFormProps = {
  modal?: boolean
  organizationSlug: OrganizationTeamParams['organizationSlug']
  organizationId: string
}

export function CreateTeamForm({
  modal,
  organizationSlug,
  organizationId,
}: CreateTeamFormProps) {
  const router = useRouter()

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
    },
  })

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    const { data, error } = await authClient.organization.createTeam({
      organizationId,
      name: values.name,
    })

    if (data) {
      if (modal) {
        // Dismiss the modal
        router.back()
      } else {
        router.push(`/orgs/${organizationSlug}/~/teams/${data.id}`)
      }

      await updateTag('create-team')
    }

    if (error) {
      toast.error(error.message)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <div className="flex flex-col items-stretch justify-center gap-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Team Name</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="Development Team" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button type="submit" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting && <Spinner />}
            Create
          </Button>
        </div>
      </form>
    </Form>
  )
}
