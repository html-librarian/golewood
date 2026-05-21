import { catalogService } from '../../../services/catalog.service'

export default defineEventHandler(() => catalogService.listAmenities(false))
