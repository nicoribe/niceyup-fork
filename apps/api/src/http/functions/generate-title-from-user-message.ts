import { generateText } from '@workspace/ai'
import { openai } from '@workspace/ai/providers'

export async function generateTitleFromUserMessage({
  message,
}: { message: string }) {
  const generatedTitle = await generateText({
    model: openai('gpt-5'),
    messages: [
      {
        role: 'system',
        content: `
- You will generate a short title based on the first message a user begins a conversation with
- Ensure it is not more than 80 characters long
- The title should be a summary of the user's message
- Do not use quotes or colons`,
      },
      {
        role: 'user',
        content: message,
      },
    ],
  })

  return generatedTitle.text
}
