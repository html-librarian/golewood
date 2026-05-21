export const authorizationHeaders = (accessToken: string | null | undefined): HeadersInit | undefined =>
  accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined
