import { Button } from '@workspace/ui/components/button'
import Link from 'next/link'

export default async function NotFound() {
  return (
    <div className="flex h-screen flex-col items-center justify-center space-y-4">
      <h1 className="font-bold text-xl">404 - Page Not Found</h1>
      <span className="text-muted-foreground text-sm">
        Oops! The page you are looking for does not exist.
      </span>

      <Button asChild>
        <Link href="/">Back to Home</Link>
      </Button>
    </div>
  )
}
