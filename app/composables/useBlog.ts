import type { BlogPost, BlogPostCard } from '#shared/types/blog'
import { authorizationHeaders } from '#shared/utils/auth-headers'
import type { CreateBlogPostInput, UpdateBlogPostInput } from '#shared/schemas/blog'

export const useBlog = () => {
  const { fetchMe } = useAuth()

  const authHeaders = () => authorizationHeaders(useCookie('auth-access-token').value)

  const fetchPosts = () => $fetch<BlogPostCard[]>('/api/blog/posts')

  const fetchPostBySlug = (slug: string) => $fetch<BlogPost>(`/api/blog/posts/${slug}`)

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
    fetchAdminPosts,
    createPost,
    updatePost,
  }
}
