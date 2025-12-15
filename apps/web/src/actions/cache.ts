'use server'

import { updateTag as updateTagNext } from 'next/cache'

export async function updateTag(tag: string) {
  updateTagNext(tag)
}
