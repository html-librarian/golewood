export type MaxUpdateType =
  | 'bot_started'
  | 'bot_stopped'
  | 'message_created'
  | 'message_callback'
  | string

export interface MaxUser {
  user_id: number
  name?: string
  username?: string
  is_bot?: boolean
}

export interface MaxMessageBody {
  text?: string
}

export interface MaxMessage {
  body?: MaxMessageBody
  sender?: MaxUser
}

export interface MaxUpdate {
  update_type: MaxUpdateType
  timestamp?: number
  chat_id?: number
  user?: MaxUser
  message?: MaxMessage
  /** Deep link / start parameter (bot_started, message_callback) */
  payload?: string
}

export interface MaxLinkStatus {
  linked: boolean
  maxUserId: number | null
  linkedAt: string | null
  botUsername: string | null
  enabled: boolean
}

export interface MaxLinkStart {
  code: string
  botUrl: string | null
  expiresIn: number
  instructions: string
}

export type MaxInlineLinkButton = {
  type: 'link'
  text: string
  url: string
}

export type MaxOutgoingMessage = {
  text: string
  notify?: boolean
  attachments?: Array<{
    type: 'inline_keyboard'
    payload: { buttons: MaxInlineLinkButton[][] }
  }>
}
