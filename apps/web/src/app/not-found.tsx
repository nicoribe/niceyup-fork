import { Button } from '@workspace/ui/components/button'
import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="flex h-screen flex-col items-center justify-center space-y-4">
      <h2 className="font-bold text-xl">404 - Page Not Found</h2>
      <p className="text-muted-foreground">
        Oops! The page you are looking for does not exist.
      </p>

      <Button asChild>
        <Link href="/">Back to Home</Link>
      </Button>
    </div>
  )
}
