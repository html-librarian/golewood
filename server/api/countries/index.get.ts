import { catalogService } from '../../services/catalog.service'

export default defineEventHandler(() => catalogService.listCountries(true))
