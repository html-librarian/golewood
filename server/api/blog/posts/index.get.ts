import { blogService } from '../../../services/blog.service'

export default defineEventHandler(() => blogService.listPublished())
