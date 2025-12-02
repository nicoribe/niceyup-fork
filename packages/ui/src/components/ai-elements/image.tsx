import { cn } from '@workspace/ui/lib/utils'

type GeneratedImage = {
  base64: string
  uint8Array: Uint8Array
  mediaType: string
}

export type ImageProps = GeneratedImage & {
  className?: string
  alt?: string
}

export const Image = ({
  base64,
  uint8Array,
  mediaType,
  ...props
}: ImageProps) => (
  <img
    {...props}
    alt={props.alt}
    className={cn(
      'h-auto max-w-full overflow-hidden rounded-md',
      props.className,
    )}
    src={`data:${mediaType};base64,${base64}`}
  />
)
