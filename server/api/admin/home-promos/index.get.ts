import { homePromoService } from '../../../services/home-promo.service'

export default defineEventHandler(() => homePromoService.listAdmin())
