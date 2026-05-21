import { listingService } from '../../../services/listing.service'

export default defineEventHandler(() => listingService.listPublishedForAdmin())
