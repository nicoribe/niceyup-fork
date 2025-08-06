'use client'

import { authClient } from '@/lib/auth/client'
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
import { Loader2 } from 'lucide-react'
import { useRouter, useSearchParams } from 'next/navigation'
import * as React from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'

const formSchema = z.object({
  email: z.string().trim().email(),
})

export function RequestPasswordResetForm() {
  const router = useRouter()
  const searchParams = useSearchParams()

  React.useEffect(() => {
    if (!form.getValues('email')) {
      form.setValue('email', searchParams.get('email') || '')
      const params = new URLSearchParams(searchParams)
      params.delete('email')
      router.replace(`?${params.toString()}`)
    }
  }, [])

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
    },
  })

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    const { data, error } = await authClient.requestPasswordReset({
      email: values.email,
      redirectTo: '/auth/reset-password',
    })

    if (data) {
      toast.success(
        <div className="flex flex-1 flex-col text-sm">
          <h1 className="font-semibold">Check your email</h1>
          <span className="block w-full font-normal leading-5">
            We sent you instructions to reset your password.
          </span>
        </div>,
      )
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
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="davy.jones@example.com" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button type="submit" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting && (
              <Loader2 className="mr-2 size-4 animate-spin" />
            )}
            Send reset instructions
          </Button>
        </div>
      </form>
    </Form>
  )
}
