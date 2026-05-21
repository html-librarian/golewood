import type { ConversationDetail, ConversationSummary, Message } from '#shared/types/conversation'
import { authorizationHeaders } from '#shared/utils/auth-headers'
import type { SendMessageInput, StartConversationInput } from '#shared/schemas/conversation'

export const useConversations = () => {
  const authHeaders = () => authorizationHeaders(useCookie('auth-access-token').value)

  const fetchConversations = () =>
    $fetch<ConversationSummary[]>('/api/conversations', { headers: authHeaders() })

  const fetchConversation = (id: string) =>
    $fetch<ConversationDetail>(`/api/conversations/${id}`, { headers: authHeaders() })

  const startConversation = (input: StartConversationInput) =>
    $fetch<ConversationDetail>('/api/conversations', {
      method: 'POST',
      headers: authHeaders(),
      body: input,
    })

  const sendMessage = (conversationId: string, input: SendMessageInput) =>
    $fetch<Message>(`/api/conversations/${conversationId}/messages`, {
      method: 'POST',
      headers: authHeaders(),
      body: input,
    })

  const fetchUnreadCount = () =>
    $fetch<{ count: number }>('/api/conversations/unread-count', { headers: authHeaders() })

  return {
    fetchConversations,
    fetchConversation,
    startConversation,
    sendMessage,
    fetchUnreadCount,
  }
}
