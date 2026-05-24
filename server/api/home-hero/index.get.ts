import { homeHeroService } from '../../services/home-hero.service'

export default defineEventHandler(() => homeHeroService.getHero())
