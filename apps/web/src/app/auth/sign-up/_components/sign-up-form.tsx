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
import { CheckIcon, EyeIcon, EyeOffIcon, Loader2, XIcon } from 'lucide-react'
import { redirect, useRouter, useSearchParams } from 'next/navigation'
import * as React from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'

const formSchema = z.object({
  name: z.string().trim().min(3).max(255),
  email: z.string().trim().email(),
  password: z.string().trim().min(1, '').max(128),
})

export function SignUpForm() {
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
      name: '',
      email: '',
      password: '',
    },
  })

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (strengthScore < 4) {
      return
    }
    const redirectTo = redirectUrl || '/'

    const { data, error } = await authClient.signUp.email({
      name: values.name,
      email: values.email,
      password: values.password,
      callbackURL: redirectTo,
    })

    if (data) {
      toast.success(
        <div className="flex flex-1 flex-col text-sm">
          <h1 className="font-semibold">Check your email</h1>
          <span className="block w-full font-normal leading-5">
            We just sent a verification link to {values.email}.
          </span>
        </div>,
      )

      const params = new URLSearchParams()
      params.set('email', values.email)
      if (redirectUrl) {
        params.set('redirectUrl', redirectUrl)
      }

      redirect(`/auth?${params.toString()}`)
    }

    if (error) {
      toast.error(error.message)
    }
  }
  const [isVisible, setIsVisible] = React.useState<boolean>(false)

  const toggleVisibility = () => setIsVisible((prevState) => !prevState)

  const checkStrength = (pass: string) => {
    const requirements = [
      { regex: /.{8,}/, text: 'At least 8 characters' },
      { regex: /[0-9]/, text: 'At least 1 number' },
      { regex: /[a-z]/, text: 'At least 1 lowercase letter' },
      { regex: /[A-Z]/, text: 'At least 1 uppercase letter' },
    ]

    return requirements.map((req) => ({
      met: req.regex.test(pass),
      text: req.text,
    }))
  }

  const strength = checkStrength(form.watch('password'))

  const strengthScore = React.useMemo(() => {
    return strength.filter((req) => req.met).length
  }, [strength])

  const getStrengthColor = (score: number) => {
    if (score === 0) {
      return 'bg-border'
    }
    if (score <= 1) {
      return 'bg-red-500'
    }
    if (score <= 2) {
      return 'bg-orange-500'
    }
    if (score === 3) {
      return 'bg-amber-500'
    }
    return 'bg-emerald-500'
  }

  const getStrengthText = (score: number) => {
    if (score === 0) {
      return 'Enter a password'
    }
    if (score <= 2) {
      return 'Weak password'
    }
    if (score === 3) {
      return 'Medium password'
    }
    return 'Strong password'
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
                <FormLabel>Name</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="Davy Jones" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

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

                <div className="mt-3 mb-4 h-1 w-full overflow-hidden rounded-full bg-border">
                  <div
                    className={`h-full ${getStrengthColor(strengthScore)} transition-all duration-500 ease-out`}
                    style={{ width: `${(strengthScore / 4) * 100}%` }}
                  />
                </div>

                {/* Password strength description */}
                <p className="mb-2 font-medium text-foreground text-sm">
                  {getStrengthText(strengthScore)}. Must contain:
                </p>

                {/* Password requirements list */}
                <ul className="space-y-1.5">
                  {strength.map((req) => (
                    <li key={req.text} className="flex items-center gap-2">
                      {req.met ? (
                        <CheckIcon size={16} className="text-emerald-500" />
                      ) : (
                        <XIcon size={16} className="text-muted-foreground/80" />
                      )}
                      <span
                        className={`text-xs ${req.met ? 'text-emerald-600' : 'text-muted-foreground'}`}
                      >
                        {req.text}
                      </span>
                    </li>
                  ))}
                </ul>
              </FormItem>
            )}
          />

          <Button type="submit" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting && (
              <Loader2 className="mr-2 size-4 animate-spin" />
            )}
            Create account
          </Button>
        </div>
      </form>
    </Form>
  )
}
