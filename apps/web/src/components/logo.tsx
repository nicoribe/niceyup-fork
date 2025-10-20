import { cn } from '@workspace/ui/lib/utils'
import Image from 'next/image'

export async function Logo({
  className,
  ...props
}: React.ComponentProps<'div'>) {
  return (
    <div className={cn('relative', className)} {...props}>
      <Image
        className="absolute flex p-1 dark:hidden"
        src="/logo-light.png"
        alt="Niceyup"
        fill
      />
      <Image
        className="absolute hidden p-1 dark:flex"
        src="/logo-dark.png"
        alt="Niceyup"
        fill
      />
    </div>
  )
}
