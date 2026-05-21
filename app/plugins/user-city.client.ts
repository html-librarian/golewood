export default defineNuxtPlugin(() => {
  const { detectCity } = useUserCity()

  void detectCity()
})
