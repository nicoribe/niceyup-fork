export function stripSpecialCharacters(inputString: string) {
  // Remove special characters and spaces, keep alphanumeric, hyphens/underscores, and dots
  return inputString
    .replace(/[^a-zA-Z0-9-_\s.]/g, '') // Remove special chars except hyphen/underscore/dot
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .toLowerCase() // Convert to lowercase for consistency
}

export function validateSlug(inputString: string): boolean {
  return /^[a-z0-9-]+$/.test(inputString)
}

export async function consumeStream<T>({
  stream,
  onChunk,
  delimiter = '\n',
  onError,
}: {
  stream: ReadableStreamDefaultReader<Uint8Array>
  onChunk: (data: T) => void
  delimiter?: string
  onError?: (err: unknown, raw: string) => void
}) {
  const decoder = new TextDecoder()
  let buf = ''

  while (true) {
    const { value, done } = await stream.read()

    if (done) {
      break
    }

    buf += decoder.decode(value, { stream: true })

    if (delimiter) {
      const parts = buf.split(delimiter)
      buf = parts.pop() ?? ''

      for (const part of parts) {
        if (!part.trim()) {
          continue
        }
        try {
          onChunk(JSON.parse(part) as T)
        } catch (err) {
          onError?.(err, part)
        }
      }
    }
  }

  if (buf.trim()) {
    try {
      onChunk(JSON.parse(buf) as T)
    } catch (err) {
      onError?.(err, buf)
    }
  }
}
