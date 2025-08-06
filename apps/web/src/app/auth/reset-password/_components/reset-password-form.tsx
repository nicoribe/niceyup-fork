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
import { redirect } from 'next/navigation'
import * as React from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'

const formSchema = z
  .object({
    newPassword: z.string().trim().min(1, '').max(128),
    confirmNewPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmNewPassword, {
    path: ['confirmNewPassword'],
    message: 'Passwords do not match',
  })

export function ResetPasswordForm({ token }: { token: string }) {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      newPassword: '',
      confirmNewPassword: '',
    },
  })

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (strengthScore < 4) {
      return
    }

    const { data, error } = await authClient.resetPassword({
      newPassword: values.newPassword,
      token,
    })

    if (data) {
      redirect('/')
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

  const strength = checkStrength(form.watch('newPassword'))

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
            name="newPassword"
            render={({ field }) => (
              <FormItem>
                <FormLabel>New password</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Input
                      {...field}
                      className="pe-9"
                      placeholder="Enter your password"
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

          <FormField
            control={form.control}
            name="confirmNewPassword"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Confirm new password</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Input
                      {...field}
                      className="pe-9"
                      placeholder="Enter your password again"
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
            Update password
          </Button>
        </div>
      </form>
    </Form>
  )
}
