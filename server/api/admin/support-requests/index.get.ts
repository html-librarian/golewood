import { supportRequestService } from '../../../services/support-request.service'

export default defineEventHandler(async () => supportRequestService.listOpen())
