'use client'

import { streamAnswerMessage } from '@/actions/messages'
import { env } from '@/lib/env'
import type {
  ChatParams,
  MessageNode,
  OrganizationTeamParams,
} from '@/lib/types'
import type { MessageRole } from '@/lib/types'
import { useChatMessageRealtime } from '@workspace/realtime/hooks'
import { Action, Actions } from '@workspace/ui/components/actions'
import {
  Branch,
  BranchMessages,
  BranchNext,
  BranchPage,
  BranchPrevious,
  BranchSelector,
} from '@workspace/ui/components/branch'
import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from '@workspace/ui/components/conversation'
import { Message, MessageContent } from '@workspace/ui/components/message'
import {
  PromptInput,
  PromptInputButton,
  PromptInputSubmit,
  PromptInputTextarea,
  PromptInputToolbar,
  PromptInputTools,
} from '@workspace/ui/components/prompt-input'
import { Response } from '@workspace/ui/components/response'
import { Skeleton } from '@workspace/ui/components/skeleton'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@workspace/ui/components/tooltip'
import {
  type FileMetadata,
  type FileWithPreview,
  useFileUpload,
} from '@workspace/ui/hooks/use-file-upload'
import { cn } from '@workspace/ui/lib/utils'
import {
  CopyIcon,
  FileIcon,
  HeartIcon,
  Loader,
  LoaderCircle,
  type LucideIcon,
  Paperclip,
  PencilIcon,
  RefreshCcwIcon,
  ShareIcon,
  Sparkles,
  ThumbsDownIcon,
  ThumbsUpIcon,
  X,
  XCircle,
} from 'lucide-react'
import { useParams } from 'next/navigation'
import * as React from 'react'
import { toast } from 'sonner'
import { useStickToBottomContext } from 'use-stick-to-bottom'
import { type ChatMessageNode, isStream, useChat } from '../_hooks/use-chat'

type Params = OrganizationTeamParams & { agentId: string } & ChatParams

type ChatContextType = { params: Params; authorId?: string } & ReturnType<
  typeof useChat
>

const ChatContext = React.createContext<ChatContextType | undefined>(undefined)

export function useChatContext(): ChatContextType {
  const context = React.useContext(ChatContext)

  if (context === undefined) {
    throw new Error('useChatContext must be used within a ChatProvider')
  }

  return context
}

export function ChatProvider({
  params,
  authorId,
  initialMessages,
  children,
}: {
  params: Params
  authorId?: string
  initialMessages?: MessageNode[]
  children: React.ReactNode
}) {
  const chatHook = useChat({
    params,
    initialMessages,
    // explorerNode: {
    //   visibility: 'private',
    //   folderId: null,
    // },
  })

  const contextValue: ChatContextType = { params, authorId, ...chatHook }

  return (
    <ChatContext.Provider value={contextValue}>{children}</ChatContext.Provider>
  )
}

export function ChatPromptInput({
  suggestion,
}: {
  suggestion?: string
}) {
  const { sendMessage, promptInputStatus, uploading, uploadFiles } =
    useChatContext()

  const onFilesAdded = async (addedFiles: FileWithPreview[]) => {
    try {
      const { data, error } = await uploadFiles({
        files: addedFiles.map((file) => file.file as File),
      })

      if (error) {
        toast.error(error.message)
        return
      }

      for (const file of data.files) {
        const existingFile = addedFiles.find(
          (existingFile) => existingFile.file.name === file.fileName,
        )

        if (existingFile) {
          existingFile.file = {
            id: file.id,
            name: file.fileName,
            type: file.fileMimeType,
            url: new URL(file.filePath, env.NEXT_PUBLIC_STORAGE_URL).toString(),
          }
        }
      }

      setFileUploadState((prev) => {
        const updatedFiles = prev.files.map((file) => {
          const existingFile = addedFiles.find(({ id }) => id === file.id)
          return existingFile ? existingFile : file
        })
        return { ...prev, files: updatedFiles }
      })
    } catch {
      toast.error('Error uploading files, please try again')
    }
  }

  const [
    fileUploadState,
    {
      setFileUploadState,
      removeFile,
      clearFiles,
      openFileDialog,
      getInputProps,
    },
  ] = useFileUpload({
    accept: 'application/pdf,image/*,video/*,audio/*',
    multiple: true,
    maxFiles: 10,
    maxSize: 15 * 1024 * 1024, // 15 MB
    onFilesAdded,
  })

  React.useEffect(() => {
    if (fileUploadState.errors.length) {
      toast.error(fileUploadState.errors[0])
    }
  }, [fileUploadState.errors])

  const [text, setText] = React.useState<string>('')

  React.useEffect(() => {
    if (suggestion) {
      setText(suggestion)
    }
  }, [suggestion])

  const handleSubmit: React.FormEventHandler<HTMLFormElement> = async (
    event,
  ) => {
    event.preventDefault()

    if (
      uploading ||
      !text.trim() ||
      promptInputStatus === 'submitted' ||
      promptInputStatus === 'streaming'
    ) {
      return
    }

    setText('')
    clearFiles()

    const textPart = { type: 'text' as const, text }

    const fileParts = fileUploadState.files
      .filter(({ file }) => 'url' in file && file.url)
      .map((f) => {
        const file = f.file as FileMetadata
        return {
          type: 'file' as const,
          mediaType: file.type,
          filename: file.name,
          url: file.url,
        }
      })

    await sendMessage({ parts: [textPart, ...fileParts] })
  }

  return (
    <PromptInput className="divide-none" onSubmit={handleSubmit}>
      <input {...getInputProps()} className="sr-only" tabIndex={-1} />

      {!!fileUploadState.files.length && (
        <div className="flex flex-row gap-2 px-3 pt-3 sm:flex-wrap">
          {fileUploadState.files.map(({ file, id, preview }) => {
            const isImage = file.type.includes('image/')
            const isUploading = file instanceof File

            return (
              <Tooltip key={id}>
                <TooltipTrigger asChild>
                  <div className="group/card-file relative flex flex-row items-center rounded-md border bg-foreground/3 p-0.5">
                    <div
                      className="-right-2 -top-2 absolute z-10 rounded-full border bg-background p-0.5 opacity-0 transition-opacity hover:bg-accent group-hover/card-file:opacity-100"
                      onClick={() => removeFile(id)}
                    >
                      <X className="size-3 text-foreground" />
                    </div>

                    <div className="relative flex size-10 items-center justify-center">
                      {isImage && (
                        <>
                          {isUploading && (
                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                              <LoaderCircle className="size-4 animate-spin" />
                            </div>
                          )}
                          <img
                            className={cn(
                              'size-full rounded-sm',
                              isUploading && 'opacity-50',
                            )}
                            src={preview}
                            alt=""
                          />
                        </>
                      )}

                      {!isImage &&
                        (isUploading ? (
                          <LoaderCircle className="size-4 animate-spin" />
                        ) : (
                          <FileIcon className="size-4 text-muted-foreground" />
                        ))}
                    </div>

                    {!isImage && (
                      <div className="max-w-40 truncate px-2 text-sm">
                        {file.name}
                      </div>
                    )}
                  </div>
                </TooltipTrigger>
                <TooltipContent side="bottom">{file.name}</TooltipContent>
              </Tooltip>
            )
          })}
        </div>
      )}

      <PromptInputTextarea
        onChange={(e) => setText(e.target.value)}
        value={text}
      />

      <PromptInputToolbar>
        <PromptInputTools>
          <PromptInputButton onClick={openFileDialog} disabled={uploading}>
            <Paperclip size={16} />
          </PromptInputButton>
        </PromptInputTools>

        <PromptInputSubmit
          status={promptInputStatus}
          disabled={
            uploading ||
            (!text.trim() &&
              (promptInputStatus === 'ready' || promptInputStatus === 'error'))
          }
        />
      </PromptInputToolbar>
    </PromptInput>
  )
}

export function ChatConversation() {
  const { messages, getMessageNodeById } = useChatContext()

  return (
    <Conversation>
      <ConversationContent className="mx-auto max-w-3xl">
        {messages.map((message) => {
          const parentNode = message?.isBranch
            ? getMessageNodeById(message.parentId)
            : undefined

          if (parentNode) {
            return (
              <ChatMessageBranch
                key={message.id}
                message={message}
                parentMessage={parentNode}
              />
            )
          }

          return <ChatMessage key={message.id} message={message} />
        })}

        <ChatLoadingMessages />
      </ConversationContent>
      <ConversationScroll />
    </Conversation>
  )
}

function ConversationScroll() {
  const { refConversationScroll } = useChatContext()

  return (
    <ConversationScrollButton refConversationScroll={refConversationScroll} />
  )
}

function ChatMessageBranch({
  message,
  parentMessage,
}: {
  message: ChatMessageNode
  parentMessage: ChatMessageNode
}) {
  const { getMessageNodeById, handleBranchChange } = useChatContext()

  return (
    <Branch
      key={message.id}
      defaultBranch={parentMessage.children?.indexOf(message.id)}
      onBranchChange={async (branchIndex) => {
        const targetNodeId = parentMessage.children?.at(branchIndex)

        if (!targetNodeId) {
          return
        }

        await handleBranchChange({
          previousNodeId: message.id,
          targetNodeId,
          role: message.role,
        })
      }}
    >
      <BranchMessages>
        {parentMessage.children?.map((id) => {
          if (id === message.id) {
            return <ChatMessage key={id} message={message} />
          }

          // Message node is already loaded
          const branchMessageNode = getMessageNodeById(id)
          if (branchMessageNode) {
            return <ChatMessage key={id} message={branchMessageNode} />
          }

          return <ChatLoadingMessage key={id} role={message.role} />
        })}
      </BranchMessages>
    </Branch>
  )
}

function ChatMessage({
  message,
}: {
  message: ChatMessageNode
}) {
  if (message.role === 'assistant' && isStream(message)) {
    return <ChatMessageContentStream message={message} />
  }

  return <ChatMessageContent message={message} />
}

function ChatMessageContentStream({
  message: initialMessage,
}: {
  message: ChatMessageNode
}) {
  const { organizationSlug, teamId, agentId, chatId } = useParams<Params>()

  const { authorId, setPromptInputStatus } = useChatContext()

  const { message: messageRealtime, error: errorRealtime } =
    useChatMessageRealtime({
      params: { organizationSlug, teamId, agentId, chatId },
      messageId: initialMessage.id,
      streamMessageAction: streamAnswerMessage,
    })

  const { scrollToBottom } = useStickToBottomContext()

  const messageNode = { ...initialMessage, ...messageRealtime }

  React.useEffect(() => {
    if (authorId && authorId === initialMessage.metadata?.authorId) {
      switch (messageNode.status) {
        case 'queued':
          setPromptInputStatus('submitted')
          break
        case 'processing':
          setPromptInputStatus('streaming')
          break
        case 'stopped':
        case 'finished':
          setPromptInputStatus('ready')
          break
        case 'failed':
          setPromptInputStatus('error')
          break
      }
    }

    if (messageRealtime) {
      scrollToBottom({ preserveScrollPosition: true })
    }
  }, [messageNode])

  if (errorRealtime) {
    return (
      <Message from={messageNode.role}>
        <MessageContent>
          <div className="flex flex-row items-center gap-2">
            <XCircle className="size-4 shrink-0 text-destructive" />
            {messageRealtime
              ? messageNode.role === 'assistant'
                ? 'An error occurred while generating the response.'
                : 'An error occurred while loading the message.'
              : 'An error occurred while retrieving the message.'}
          </div>
          {messageRealtime && (
            <ChatErrorResponse errorMessage={errorRealtime} />
          )}
        </MessageContent>
      </Message>
    )
  }

  if (messageNode.status === 'queued') {
    return (
      <Message from={messageNode.role}>
        <MessageContent>
          <LoaderCircle className="size-4 shrink-0 animate-spin" />
        </MessageContent>
      </Message>
    )
  }

  return <ChatMessageContent message={messageNode} />
}

type ItemAction = {
  icon: LucideIcon
  label: string
  onClick: () => void
  disabled?: boolean
}

function ChatMessageContent({
  message,
}: {
  message: ChatMessageNode
}) {
  const { authorId, regenerate } = useChatContext()

  // Messages from the system are not displayed
  if (message.role !== 'user' && message.role !== 'assistant') {
    return null
  }

  const parts = message.parts || []

  const { textPart, filesParts } = React.useMemo(() => {
    const textPart = parts.find((part) => part.type === 'text')

    const filesParts = parts.filter((part) => part.type === 'file')
    return { textPart, filesParts }
  }, [parts])

  // Check if the message is not empty
  const messageNotEmpty = React.useMemo(() => {
    if (message.status === 'queued' || message.status === 'processing') {
      return Boolean(textPart?.text)
    }

    return Boolean(parts.length)
  }, [message.status, parts.length, textPart?.text])

  const actions = React.useMemo(() => {
    const listActions: ItemAction[] = [
      {
        icon: HeartIcon,
        label: 'Favorite',
        onClick: () => console.log('Favoriting...'),
      },
      {
        icon: CopyIcon,
        label: 'Copy',
        onClick: () => {
          const content = textPart?.text

          navigator.clipboard.writeText(content || '')

          toast.success('Copied to clipboard')
        },
      },
      {
        icon: ShareIcon,
        label: 'Share',
        onClick: () => console.log('Sharing...'),
      },
    ]

    if (message.role === 'assistant') {
      listActions.push(
        ...[
          {
            icon: ThumbsUpIcon,
            label: 'Like',
            onClick: () => console.log('Liking...'),
          },
          {
            icon: ThumbsDownIcon,
            label: 'Dislike',
            onClick: () => console.log('Disliking...'),
          },
          {
            icon: RefreshCcwIcon,
            label: 'Retry',
            onClick: async () => {
              await regenerate({ messageId: message.id })
            },
          },
        ],
      )
    }

    if (message.role === 'user') {
      listActions.push({
        icon: PencilIcon,
        label: 'Edit message',
        onClick: () => console.log('Editing...'),
      })
    }

    return listActions
  }, [message.role, message.id, textPart?.text])

  const isStreaming = isStream(message)
  const isFailed = message.status === 'failed'

  return (
    <Message
      className={cn(
        'gap-1 py-0.5',
        'group flex flex-col',
        message.role === 'assistant' ? 'items-start' : 'items-end',
      )}
      from={message.role}
    >
      <MessageContent
        className={cn(
          message.role === 'assistant' && 'rounded-none px-0 py-0',
          message.authorId &&
            authorId !== message.authorId &&
            'group-[.is-user]:bg-secondary',
        )}
      >
        {isFailed && !messageNotEmpty && (
          <div className="flex flex-row items-center gap-2 not-only:p-2">
            <XCircle className="size-4 shrink-0 text-destructive" />
            {message.role === 'assistant'
              ? 'An error occurred while generating the response.'
              : 'An error occurred while loading the message.'}
          </div>
        )}

        {isStreaming && !messageNotEmpty && (
          <div className="flex flex-row items-center gap-2">
            <Sparkles className="size-4 shrink-0 animate-pulse" />
            <AnimatedDots
              text={message.role === 'assistant' ? 'Generating' : 'Loading'}
            />
          </div>
        )}

        {parts.map((part, i) => {
          switch (part.type) {
            case 'text':
              if (isStreaming && !part.text) {
                return (
                  <div
                    key={`${part.type}-${i}`}
                    className="flex flex-row items-center gap-2"
                  >
                    <Sparkles className="size-4 shrink-0 animate-pulse" />
                    <AnimatedDots
                      text={
                        message.role === 'assistant'
                          ? 'Generating response'
                          : 'Loading message'
                      }
                    />
                  </div>
                )
              }

              if (!part.text) {
                return null
              }

              return (
                <Response
                  key={`${part.type}-${i}`}
                  className="[&_[data-streamdown='code-block']]:bg-background"
                >
                  {part.text}
                </Response>
              )

            case 'tool-image_generation':
              const isGenerating = (part as any).state !== 'output-available'
              const base64 = (part as any).output?.result

              return (
                <div
                  key={`${part.type}-${i}`}
                  className={cn(
                    'relative rounded-md border bg-foreground/3 p-0.5',
                    isGenerating && 'size-50',
                  )}
                >
                  {isGenerating && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <LoaderCircle className="size-4 animate-spin" />
                    </div>
                  )}
                  {base64 && (
                    <img
                      className="size-full rounded-md"
                      src={`data:image/png;base64,${base64}`}
                      alt=""
                    />
                  )}
                </div>
              )
            default:
              return null
          }
        })}

        {isFailed && message.metadata?.error && (
          <ChatErrorResponse errorMessage={message.metadata?.error} />
        )}
      </MessageContent>

      {!!filesParts.length && (
        <div
          className={cn(
            'flex flex-wrap gap-2',
            message.role === 'assistant' ? 'justify-start' : 'justify-end',
          )}
        >
          {filesParts.map((part, i) => {
            const isImage = part.mediaType.includes('image/')

            return (
              <Tooltip key={`${part.type}-${i}`}>
                <TooltipTrigger asChild>
                  <div className="group/card-file flex flex-row items-center rounded-md border bg-foreground/3 p-0.5">
                    <div className="relative flex size-10 items-center justify-center">
                      {isImage && (
                        <img
                          className="size-full rounded-sm"
                          src={part.url}
                          alt=""
                        />
                      )}

                      {!isImage && (
                        <FileIcon className="size-4 text-muted-foreground" />
                      )}
                    </div>

                    {!isImage && (
                      <div className="max-w-40 truncate px-2 text-sm">
                        {part.filename || 'untitled file'}
                      </div>
                    )}
                  </div>
                </TooltipTrigger>
                <TooltipContent side="bottom">
                  {part.filename || 'untitled file'}
                </TooltipContent>
              </Tooltip>
            )
          })}
        </div>
      )}

      <Actions>
        {actions.map((action) => (
          <Action
            key={action.label}
            className={cn(
              message.role === 'user' &&
                'opacity-0 transition-opacity disabled:opacity-0 group-hover:opacity-100 disabled:group-hover:opacity-50',
            )}
            label={action.label}
            tooltip={action.label}
            disabled={action.disabled}
            onClick={action.onClick}
          >
            <action.icon className="size-3" />
          </Action>
        ))}

        {message.isBranch && (
          <BranchSelector
            className={cn(
              'self-center px-0',
              message.role !== 'user' && '-order-1',
            )}
            from={message.role}
          >
            <BranchPrevious />
            <BranchPage />
            <BranchNext />
          </BranchSelector>
        )}
      </Actions>
    </Message>
  )
}

function ChatErrorResponse({ errorMessage }: { errorMessage?: unknown }) {
  return (
    <Response className="rounded-md bg-destructive/50 px-3 pt-3 [&_[data-streamdown='code-block']]:bg-background">
      {`**Error message:**\n\`\`\`json\n${JSON.stringify(errorMessage, null, 2)}\n\`\`\``}
    </Response>
  )
}

function ChatLoadingMessage({ role }: { role: MessageRole }) {
  return (
    <Message from={role}>
      <MessageContent className="*:h-5 *:opacity-5 *:group-[.is-assistant]:bg-primary *:group-[.is-user]:bg-secondary">
        <Skeleton className="w-35" />
        {role === 'assistant' && (
          <>
            <Skeleton className="w-60" />
            <Skeleton className="w-50" />
          </>
        )}
      </MessageContent>
    </Message>
  )
}

function ChatLoadingMessages() {
  const { loadingMessage } = useChatContext()

  if (!loadingMessage) {
    return null
  }

  // const isUser = loadingMessage.role === 'user'

  // return (
  //   <>
  //     <Message from={isUser ? 'assistant' : 'user'}>
  //       <MessageContent className="*:h-5 *:opacity-5 *:group-[.is-assistant]:bg-primary *:group-[.is-user]:bg-secondary">
  //         <Skeleton className="w-40" />
  //         <Skeleton className="w-70" />
  //         <Skeleton className="w-50" />
  //       </MessageContent>
  //     </Message>
  //     <Message from={isUser ? 'user' : 'assistant'}>
  //       <MessageContent className="*:h-5 *:opacity-5 *:group-[.is-assistant]:bg-primary *:group-[.is-user]:bg-secondary">
  //         <Skeleton className="w-25" />
  //         <Skeleton className="w-40" />
  //       </MessageContent>
  //     </Message>
  //     <Message from={isUser ? 'assistant' : 'user'}>
  //       <MessageContent className="*:h-5 *:opacity-5 *:group-[.is-assistant]:bg-primary *:group-[.is-user]:bg-secondary">
  //         <Skeleton className="w-40" />
  //         <Skeleton className="w-30" />
  //         <Skeleton className="w-60" />
  //       </MessageContent>
  //     </Message>
  //   </>
  // )

  return (
    <div className="flex flex-col items-center justify-center px-2 py-10">
      <Loader className="size-4 animate-spin" />
    </div>
  )
}

function AnimatedDots({ text }: { text: string }) {
  const [step, setStep] = React.useState(0)

  React.useEffect(() => {
    const interval = setInterval(() => {
      setStep((prev) => (prev + 1) % 4)
    }, 500)

    return () => clearInterval(interval)
  }, [])

  const dots = ['...', '..', '.', '..'][step]

  return (
    <span className="flex flex-row items-center gap-1">
      {text}
      <span className="w-4 select-none">{dots}</span>
    </span>
  )
}
