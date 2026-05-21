import { catalogService } from '../../services/catalog.service'

export default defineEventHandler(async () => catalogService.listAccommodationTypes())
