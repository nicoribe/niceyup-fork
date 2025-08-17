'use server'

const chats = [
  {
    id: 'foo',
    title: '(untitled)',
    path: [
      { id: 'my-chats', title: 'My Chats' },
      { id: 'untitled', title: '(untitled)' },
    ],
  },
]

export async function getChat(chatId: string) {
  if (chatId === 'new') {
    return null
  }

  const chat = chats.find((chat) => chat.id === chatId)

  return chat || null
}
