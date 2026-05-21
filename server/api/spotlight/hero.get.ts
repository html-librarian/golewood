import { spotlightService } from '../../services/spotlight.service'

export default defineEventHandler(() => spotlightService.getHero())
