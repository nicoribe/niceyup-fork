export function SignOutLink({
  ...props
}: Omit<React.ComponentProps<'a'>, 'href'>) {
  return <a {...props} href="/auth/sign-out" />
}
