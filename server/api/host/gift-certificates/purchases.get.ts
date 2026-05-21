import { requireAuth } from '../../../utils/auth'
import { giftCertificateService } from '../../../services/gift-certificate.service'

export default defineEventHandler(async (event) => {
  const user = requireAuth(event)

  return giftCertificateService.listSalesForHost(user.id)
})
