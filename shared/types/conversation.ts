export interface ConversationParticipant {
  id: string
  name: string | null
  phone: string
}

export interface Message {
  id: string
  conversationId: string
  senderId: string
  body: string
  isSystem: boolean
  createdAt: string
}

export interface ConversationSummary {
  id: string
  listingId: string
  listingTitle: string
  guest: ConversationParticipant
  host: ConversationParticipant
  lastMessage: Message | null
  unreadCount: number
  updatedAt: string
}

export interface ConversationDetail extends ConversationSummary {
  messages: Message[]
}
