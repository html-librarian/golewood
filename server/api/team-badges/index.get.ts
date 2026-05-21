import { teamBadgeService } from '../../services/team-badge.service'

export default defineEventHandler(() => teamBadgeService.list(true))
