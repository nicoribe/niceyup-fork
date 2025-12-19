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
  FormMessage,
} from '@workspace/ui/components/form'
import { Input } from '@workspace/ui/components/input'
import { Spinner } from '@workspace/ui/components/spinner'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'

type Params = {
  organizationSlug: OrganizationTeamParams['organizationSlug']
  organizationId: string
  teamId: string
}

const formSchema = z.object({
  name: z.string().trim().min(3).max(255),
})

export function EditTeamNameForm({
  params,
  name,
  isAdmin,
}: {
  params: Params
  name: string
  isAdmin?: boolean
}) {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name,
    },
  })

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    const { data, error } = await authClient.organization.updateTeam({
      teamId: params.teamId,
      data: {
        organizationId: params.organizationId,
        name: values.name,
      },
    })

    if (data) {
      toast.success('Team name updated successfully')
      await updateTag('update-team')
    }

    if (error) {
      toast.error(error.message)
    }
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="rounded-lg border border-border bg-background"
      >
        <div className="relative flex flex-col space-y-6 p-5 sm:p-10">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <div className="flex flex-col space-y-3">
                  <h2 className="font-medium text-xl">Team Name</h2>
                  <p className="text-muted-foreground text-sm">
                    This is your team's visible name within your organization.
                  </p>
                  <FormControl>
                    <Input
                      {...field}
                      className="w-full max-w-md"
                      placeholder="Development Team"
                      readOnly={!isAdmin}
                    />
                  </FormControl>
                  <FormMessage />
                </div>
              </FormItem>
            )}
          />
        </div>
        <div className="flex items-center justify-between space-x-4 rounded-b-lg border-border border-t bg-foreground/2 p-3 sm:px-10">
          {isAdmin ? (
            <>
              <p className="text-muted-foreground text-sm">
                Please use 255 characters at maximum.
              </p>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting && <Spinner className="mr-2" />}
                Save
              </Button>
            </>
          ) : (
            <div className="h-9" />
          )}
        </div>
      </form>
    </Form>
  )
}
