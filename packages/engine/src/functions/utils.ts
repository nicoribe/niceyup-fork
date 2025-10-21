import { createHash } from 'node:crypto'
import { v5 as uuidv5 } from 'uuid'

const NAMESPACE = '00000000-0000-0000-0000-000000000000' as const

export function deterministicUuid(content: string): string {
  const hashHex = createHash('sha256').update(content).digest('hex')
  return uuidv5(hashHex, NAMESPACE)
}
