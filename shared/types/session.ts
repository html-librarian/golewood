/** Максимум активных refresh-сессий на пользователя (остальные удаляются при новом входе). */
export const MAX_ACTIVE_SESSIONS_PER_USER = 10

/** Сколько «чужих» сессий показывать до кнопки «ещё». */
export const SESSION_LIST_PREVIEW_OTHERS = 3

export type SessionClientMeta = {
  userAgent: string | null
}
