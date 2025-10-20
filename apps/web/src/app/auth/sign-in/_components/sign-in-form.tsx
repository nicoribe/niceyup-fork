'use client'

import { authClient } from '@/lib/auth/client'
import { env } from '@/lib/env'
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
import { EyeIcon, EyeOffIcon, Loader2 } from 'lucide-react'
import { redirect, useRouter, useSearchParams } from 'next/navigation'
import * as React from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'

const formSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().trim().min(3).max(255),
})

export function SignInForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectUrl = searchParams?.get('redirectUrl')

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
      password: '',
    },
  })

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    const redirectTo = redirectUrl || '/'

    const { data, error } = await authClient.signIn.email({
      email: values.email,
      password: values.password,
      callbackURL: new URL(redirectTo, env.NEXT_PUBLIC_WEB_URL).toString(),
    })

    if (data) {
      redirect(redirectTo)
    }

    if (error) {
      if (error.code === 'EMAIL_NOT_VERIFIED') {
        toast.error(
          <div className="flex flex-1 flex-col text-sm">
            <h1 className="font-semibold">Email not confirmed</h1>
            <span className="block w-full font-normal leading-5">
              We just sent a verification link to {values.email}.
            </span>
          </div>,
        )
      } else {
        toast.error(error.message)
      }
    }
  }

  const [isVisible, setIsVisible] = React.useState<boolean>(false)

  const toggleVisibility = () => setIsVisible((prevState) => !prevState)

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

          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Password</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Input
                      {...field}
                      className="pe-9"
                      placeholder="••••••••••••"
                      type={isVisible ? 'text' : 'password'}
                    />
                    <button
                      className="absolute inset-y-0 end-0 flex h-full w-9 items-center justify-center rounded-e-md text-muted-foreground/80 outline-none transition-[color,box-shadow] hover:text-foreground focus:z-10 focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50"
                      type="button"
                      onClick={toggleVisibility}
                    >
                      {isVisible ? (
                        <EyeOffIcon size={16} />
                      ) : (
                        <EyeIcon size={16} />
                      )}
                    </button>
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
            Sign In
          </Button>
        </div>
      </form>
    </Form>
  )
}
