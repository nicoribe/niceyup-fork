'use client'

import { authClient } from '@/lib/auth/client'
import { zodResolver } from '@hookform/resolvers/zod'
import { env } from '@workspace/env'
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
import { stripSpecialCharacters, validateSlug } from '@workspace/utils'
import { Loader2 } from 'lucide-react'
import { redirect } from 'next/navigation'
import * as React from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'

const formSchema = z.object({
  name: z.string().trim().min(3).max(255),
  slug: z
    .string()
    .trim()
    .min(3)
    .max(255)
    .refine(
      validateSlug,
      'The slug can only contain lowercase letters, numbers, and hyphens',
    ),
})

export function CreateOrganizationForm() {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      slug: '',
    },
  })

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    const { data, error } = await authClient.organization.create({
      name: values.name,
      slug: values.slug,
      keepCurrentActiveOrganization: false,
    })

    if (data) {
      redirect(`/orgs/${data.slug}`)
    }

    if (error) {
      toast.error(error.message)
    }
  }

  React.useEffect(() => {
    form.setValue('slug', stripSpecialCharacters(form.getValues('name')))
  }, [form.watch('name')])

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <div className="flex flex-col items-stretch justify-center gap-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Organization name</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="Acme Inc." />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="slug"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Organization URL</FormLabel>
                <FormControl>
                  <div className="flex rounded-md shadow-xs">
                    <span className="inline-flex items-center rounded-s-md border border-input bg-background px-3 text-muted-foreground text-sm">
                      {new URL(env.NEXT_PUBLIC_WEB_URL).hostname}/orgs/
                    </span>
                    <Input
                      {...field}
                      className="-ms-px rounded-s-none shadow-none"
                      placeholder="acme-inc"
                    />
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button type="submit" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting && (
              <Loader2 className="mr-2 size-4 animate-spin" />
            )}
            Create
          </Button>
        </div>
      </form>
    </Form>
  )
}
