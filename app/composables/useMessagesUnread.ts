export const useMessagesUnread = () => {
  const { isAuthenticated } = useAuth()
  const { fetchUnreadCount } = useConversations()
  const route = useRoute()

  const { data, refresh } = useAsyncData(
    'messages-unread-count',
    async () => {
      if (!isAuthenticated.value) {
        return { count: 0 }
      }

      return fetchUnreadCount()
    },
    {
      watch: [isAuthenticated, () => route.path],
      default: () => ({ count: 0 }),
    },
  )

  const unreadCount = computed(() => data.value?.count ?? 0)

  return {
    unreadCount,
    refreshUnreadCount: refresh,
  }
}
