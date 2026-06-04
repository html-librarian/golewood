import type {
  BlogAuthorSummary,
  BlogPost,
  BlogPostCard,
  BlogPostSearchResult,
} from '#shared/types/blog'
import { authorizationHeaders } from '#shared/utils/auth-headers'
import type {
  CreateBlogPostInput,
  UpdateBlogPostInput,
  UserCreateBlogPostInput,
} from '#shared/schemas/blog'

export interface BlogSearchQuery {
  authorId?: string
  listingId?: string
  city?: string
  q?: string
  authorQ?: string
  following?: boolean
  page?: number
  pageSize?: number
}

export const useBlog = () => {
  const { fetchMe } = useAuth()

  const authHeaders = () => authorizationHeaders(useCookie('auth-access-token').value)

  const fetchPosts = (query?: BlogSearchQuery) =>
    $fetch<BlogPostSearchResult>('/api/blog/posts', { query })

  const fetchPostBySlug = (slug: string) => $fetch<BlogPost>(`/api/blog/posts/${slug}`)

  const fetchCities = () => $fetch<string[]>('/api/blog/cities')

  const searchAuthors = (q: string) =>
    $fetch<BlogAuthorSummary[]>('/api/blog/authors', { query: { q } })

  const fetchPopularAuthors = (limit = 8) =>
    $fetch<BlogAuthorSummary[]>('/api/blog/authors/popular', { query: { limit } })

  const fetchAuthor = (id: string) =>
    $fetch<{ author: BlogAuthorSummary, posts: BlogPostCard[] }>(`/api/blog/authors/${id}`)

  const followAuthor = async (id: string) => {
    await fetchMe()
    return $fetch<{ following: boolean }>(`/api/blog/authors/${id}/follow`, {
      method: 'POST',
      headers: authHeaders(),
    })
  }

  const unfollowAuthor = async (id: string) => {
    await fetchMe()
    return $fetch<{ following: boolean }>(`/api/blog/authors/${id}/follow`, {
      method: 'DELETE',
      headers: authHeaders(),
    })
  }

  const fetchMyPosts = async () => {
    await fetchMe()
    return $fetch<BlogPost[]>('/api/blog/my/posts', { headers: authHeaders() })
  }

  const fetchMyPost = async (id: string) => {
    await fetchMe()
    return $fetch<BlogPost>(`/api/blog/my/posts/${id}`, { headers: authHeaders() })
  }

  const createUserPost = async (input: UserCreateBlogPostInput) => {
    await fetchMe()
    return $fetch<BlogPost>('/api/blog/posts', {
      method: 'POST',
      headers: authHeaders(),
      body: input,
    })
  }

  const updateUserPost = async (id: string, input: UpdateBlogPostInput) => {
    await fetchMe()
    return $fetch<BlogPost>(`/api/blog/my/posts/${id}`, {
      method: 'PATCH',
      headers: authHeaders(),
      body: input,
    })
  }

  const fetchAdminPosts = async (listingId?: string) => {
    await fetchMe()
    return $fetch<BlogPost[]>('/api/admin/blog/posts', {
      headers: authHeaders(),
      query: listingId ? { listingId } : undefined,
    })
  }

  const createPost = async (input: CreateBlogPostInput) => {
    await fetchMe()
    return $fetch<BlogPost>('/api/admin/blog/posts', {
      method: 'POST',
      headers: authHeaders(),
      body: input,
    })
  }

  const updatePost = async (id: string, input: UpdateBlogPostInput) =>
    $fetch<BlogPost>(`/api/admin/blog/posts/${id}`, {
      method: 'PATCH',
      headers: authHeaders(),
      body: input,
    })

  return {
    fetchPosts,
    fetchPostBySlug,
    fetchCities,
    searchAuthors,
    fetchPopularAuthors,
    fetchAuthor,
    followAuthor,
    unfollowAuthor,
    fetchMyPosts,
    fetchMyPost,
    createUserPost,
    updateUserPost,
    fetchAdminPosts,
    createPost,
    updatePost,
  }
}
