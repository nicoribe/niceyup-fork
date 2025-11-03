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
        } catch (error) {
          onError?.(error, part)
        }
      }
    }
  }

  if (buf.trim()) {
    try {
      onChunk(JSON.parse(buf) as T)
    } catch (error) {
      onError?.(error, buf)
    }
  }
}
