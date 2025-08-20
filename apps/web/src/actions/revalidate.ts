'use server'

import {
  revalidatePath as revalidatePathNext,
  revalidateTag as revalidateTagNext,
} from 'next/cache'

export async function revalidatePath(path: string) {
  revalidatePathNext(path)
}

export async function revalidateTag(tag: string) {
  revalidateTagNext(tag)
}
