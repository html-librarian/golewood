import { homeDiscoveryService } from '../../../services/home-discovery.service'

export default defineEventHandler(() => homeDiscoveryService.listAdminGroups())
