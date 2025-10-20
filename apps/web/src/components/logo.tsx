import { cn } from '@workspace/ui/lib/utils'
import Image from 'next/image'

export async function Logo({
  className,
  ...props
}: React.ComponentProps<'div'>) {
  return (
    <div className={cn('relative', className)} {...props}>
      <Image
        className="absolute flex dark:hidden"
        src="/logo-light.svg"
        alt="Niceyup"
        fill
      />
      <Image
        className="absolute hidden dark:flex"
        src="/logo-dark.svg"
        alt="Niceyup"
        fill
      />
    </div>
  )
}
