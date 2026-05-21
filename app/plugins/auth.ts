export default defineNuxtPlugin(async () => {
  const { fetchMe, user, accessToken } = useAuth()

  if (accessToken.value && !user.value) {
    await fetchMe()
  }
})
