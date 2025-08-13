import { Button } from '@workspace/ui/components/button'
import Link from 'next/link'

export async function PermissionDenied() {
  return (
    <div className="flex flex-col items-center justify-center space-y-4">
      <h1 className="font-bold text-xl">Permission Denied</h1>
      <span className="text-muted-foreground text-sm">
        Oops! You don&apos;t have access to this page.
      </span>

      <Button asChild>
        <Link href="/">Back to home</Link>
      </Button>
    </div>
  )
}
