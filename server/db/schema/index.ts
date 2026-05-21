import { type AnyPgColumn, pgEnum, pgTable, uuid, varchar, timestamp, integer, bigint, text, doublePrecision, jsonb, customType, unique, boolean } from 'drizzle-orm/pg-core'

const geographyPoint = customType<{ data: unknown, driverData: unknown }>({
  dataType: () => 'geography(Point,4326)',
})

export const userRoleEnum = pgEnum('user_role', ['guest', 'host', 'admin', 'support', 'content_manager'])
export const listingStatusEnum = pgEnum('listing_status', ['draft', 'moderation', 'published', 'archived'])
export const listingKindEnum = pgEnum('listing_kind', ['standalone', 'property', 'unit'])
export const cancellationPolicyEnum = pgEnum('cancellation_policy', ['flexible', 'moderate', 'strict'])
export const bookingStatusEnum = pgEnum('booking_status', ['pending', 'confirmed', 'cancelled', 'completed'])
export const paymentStatusEnum = pgEnum('payment_status', ['pending', 'waiting_for_capture', 'succeeded', 'cancelled', 'refunded'])
export const reviewStatusEnum = pgEnum('review_status', ['pending', 'approved', 'rejected'])
export const bonusTransactionTypeEnum = pgEnum('bonus_transaction_type', ['review_reward', 'booking_payment', 'booking_refund'])
export const hostPromoTransactionTypeEnum = pgEnum('host_promo_transaction_type', ['booking_reward', 'promotion_purchase', 'points_purchase', 'refund', 'admin_adjust'])
export const hostPayoutStatusEnum = pgEnum('host_payout_status', ['not_started', 'pending', 'active', 'rejected'])
export const hostLegalTypeEnum = pgEnum('host_legal_type', ['company', 'individual'])
export const reportStatusEnum = pgEnum('report_status', ['open', 'in_progress', 'resolved', 'dismissed'])
export const reportTypeEnum = pgEnum('report_type', ['listing', 'booking', 'user', 'other'])
export const oauthProviderEnum = pgEnum('oauth_provider', ['yandex', 'vk'])
export const spotlightPhotoStatusEnum = pgEnum('spotlight_photo_status', ['pending', 'approved', 'rejected'])
export const storyMediaTypeEnum = pgEnum('story_media_type', ['image', 'video'])
export const listingClaimStatusEnum = pgEnum('listing_claim_status', ['pending', 'approved', 'rejected'])
export const giftCertificatePurchaseStatusEnum = pgEnum('gift_certificate_purchase_status', ['pending', 'paid', 'redeemed', 'cancelled'])

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  phone: varchar('phone', { length: 20 }).notNull().unique(),
  email: varchar('email', { length: 255 }),
  name: varchar('name', { length: 100 }),
  hostProfileDescription: text('host_profile_description').notNull().default(''),
  role: userRoleEnum('role').notNull().default('guest'),
  bonusBalance: integer('bonus_balance').notNull().default(0),
  hostPromoBalance: integer('host_promo_balance').notNull().default(0),
  maxUserId: bigint('max_user_id', { mode: 'number' }),
  maxLinkedAt: timestamp('max_linked_at', { withTimezone: true }),
  twoFactorEnabled: boolean('two_factor_enabled').notNull().default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

export const hostLegalProfiles = pgTable('host_legal_profiles', {
  userId: uuid('user_id').primaryKey().references(() => users.id, { onDelete: 'cascade' }),
  isVerified: boolean('is_verified').notNull().default(false),
  legalType: hostLegalTypeEnum('legal_type').notNull().default('company'),
  legalName: varchar('legal_name', { length: 255 }).notNull().default(''),
  inn: varchar('inn', { length: 12 }).notNull().default(''),
  ogrn: varchar('ogrn', { length: 15 }),
  legalAddress: text('legal_address').notNull().default(''),
  workingHoursNote: text('working_hours_note').notNull().default(''),
  verifiedAt: timestamp('verified_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

export const refreshTokens = pgTable('refresh_tokens', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  tokenHash: varchar('token_hash', { length: 64 }).notNull().unique(),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  userAgent: text('user_agent'),
  lastUsedAt: timestamp('last_used_at', { withTimezone: true }).notNull().defaultNow(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

export const blogPostStatusEnum = pgEnum('blog_post_status', ['draft', 'published'])

export const teamBadgeCatalog = pgTable('team_badge_catalog', {
  id: uuid('id').primaryKey().defaultRandom(),
  slug: varchar('slug', { length: 64 }).notNull().unique(),
  icon: varchar('icon', { length: 128 }).notNull(),
  titleRu: varchar('title_ru', { length: 128 }).notNull(),
  titleEn: varchar('title_en', { length: 128 }).notNull(),
  descriptionRu: text('description_ru').notNull().default(''),
  descriptionEn: text('description_en').notNull().default(''),
  requiresBlogPost: boolean('requires_blog_post').notNull().default(false),
  active: boolean('active').notNull().default(true),
  sortOrder: integer('sort_order').notNull().default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

export const accommodationTypeCatalog = pgTable('accommodation_type_catalog', {
  slug: varchar('slug', { length: 64 }).primaryKey(),
  icon: varchar('icon', { length: 128 }).notNull(),
  labelRu: varchar('label_ru', { length: 128 }).notNull(),
  labelEn: varchar('label_en', { length: 128 }).notNull(),
  sortOrder: integer('sort_order').notNull().default(0),
  active: boolean('active').notNull().default(true),
})

export const listings = pgTable('listings', {
  id: uuid('id').primaryKey().defaultRandom(),
  hostId: uuid('host_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  kind: listingKindEnum('kind').notNull().default('standalone'),
  propertyListingId: uuid('property_listing_id').references((): AnyPgColumn => listings.id, { onDelete: 'cascade' }),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description').notNull().default(''),
  status: listingStatusEnum('status').notNull().default('draft'),
  pricePerNight: integer('price_per_night').notNull(),
  city: varchar('city', { length: 128 }).notNull(),
  address: varchar('address', { length: 255 }).notNull().default(''),
  latitude: doublePrecision('latitude').notNull().default(0),
  longitude: doublePrecision('longitude').notNull().default(0),
  maxGuests: integer('max_guests').notNull().default(1),
  extraGuestsOffered: boolean('extra_guests_offered').notNull().default(false),
  maxGuestsWithExtra: integer('max_guests_with_extra'),
  extraGuestPricePerNight: integer('extra_guest_price_per_night'),
  bedrooms: integer('bedrooms').notNull().default(1),
  amenities: jsonb('amenities').$type<string[]>().notNull().default([]),
  accommodationType: varchar('accommodation_type', { length: 64 }).references(() => accommodationTypeCatalog.slug, { onDelete: 'set null' }),
  houseRules: text('house_rules').notNull().default(''),
  checkInTime: varchar('check_in_time', { length: 5 }).notNull().default('15:00'),
  checkOutTime: varchar('check_out_time', { length: 5 }).notNull().default('12:00'),
  minNights: integer('min_nights').notNull().default(1),
  cancellationPolicy: cancellationPolicyEnum('cancellation_policy').notNull().default('moderate'),
  cleaningFee: integer('cleaning_fee').notNull().default(0),
  transferOffered: boolean('transfer_offered').notNull().default(false),
  transferPrice: integer('transfer_price'),
  transferPriceOnRequest: boolean('transfer_price_on_request').notNull().default(false),
  teamBadgeId: uuid('team_badge_id').references(() => teamBadgeCatalog.id, { onDelete: 'set null' }),
  teamBadgeBlogPostId: uuid('team_badge_blog_post_id'),
  managedByTeam: boolean('managed_by_team').notNull().default(false),
  calendarExportToken: uuid('calendar_export_token').notNull().defaultRandom(),
  location: geographyPoint('location'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

export const blogPosts = pgTable('blog_posts', {
  id: uuid('id').primaryKey().defaultRandom(),
  slug: varchar('slug', { length: 128 }).notNull().unique(),
  titleRu: varchar('title_ru', { length: 255 }).notNull(),
  titleEn: varchar('title_en', { length: 255 }).notNull(),
  excerptRu: text('excerpt_ru').notNull().default(''),
  excerptEn: text('excerpt_en').notNull().default(''),
  bodyRu: text('body_ru').notNull(),
  bodyEn: text('body_en').notNull().default(''),
  coverImageUrl: varchar('cover_image_url', { length: 512 }),
  listingId: uuid('listing_id').references(() => listings.id, { onDelete: 'set null' }),
  status: blogPostStatusEnum('status').notNull().default('draft'),
  publishedAt: timestamp('published_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

export const listingNews = pgTable('listing_news', {
  id: uuid('id').primaryKey().defaultRandom(),
  listingId: uuid('listing_id').notNull().references(() => listings.id, { onDelete: 'cascade' }),
  hostId: uuid('host_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  title: varchar('title', { length: 255 }).notNull(),
  body: text('body').notNull(),
  excerpt: text('excerpt').notNull().default(''),
  previewImageUrl: varchar('preview_image_url', { length: 512 }),
  showBookingButton: boolean('show_booking_button').notNull().default(false),
  likesCount: integer('likes_count').notNull().default(0),
  dislikesCount: integer('dislikes_count').notNull().default(0),
  status: blogPostStatusEnum('status').notNull().default('draft'),
  publishedAt: timestamp('published_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

export const listingNewsMedia = pgTable('listing_news_media', {
  id: uuid('id').primaryKey().defaultRandom(),
  newsId: uuid('news_id').notNull().references(() => listingNews.id, { onDelete: 'cascade' }),
  url: varchar('url', { length: 512 }).notNull(),
  mediaType: varchar('media_type', { length: 16 }).notNull().default('photo'),
  embedUrl: varchar('embed_url', { length: 512 }),
  provider: varchar('provider', { length: 32 }),
  sortOrder: integer('sort_order').notNull().default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

export const listingNewsReactions = pgTable('listing_news_reactions', {
  newsId: uuid('news_id').notNull().references(() => listingNews.id, { onDelete: 'cascade' }),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  reaction: varchar('reaction', { length: 8 }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, table => ({
  pk: unique().on(table.newsId, table.userId),
}))

export const hostGoogleCalendarCredentials = pgTable('host_google_calendar_credentials', {
  userId: uuid('user_id').primaryKey().references(() => users.id, { onDelete: 'cascade' }),
  refreshToken: text('refresh_token').notNull(),
  googleEmail: varchar('google_email', { length: 255 }),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

export const listingCalendarFeeds = pgTable('listing_calendar_feeds', {
  id: uuid('id').primaryKey().defaultRandom(),
  listingId: uuid('listing_id').notNull().references(() => listings.id, { onDelete: 'cascade' }),
  label: varchar('label', { length: 128 }).notNull(),
  feedUrl: text('feed_url').notNull(),
  feedType: varchar('feed_type', { length: 16 }).notNull().default('ical'),
  googleCalendarId: varchar('google_calendar_id', { length: 255 }),
  active: boolean('active').notNull().default(true),
  lastSyncedAt: timestamp('last_synced_at', { withTimezone: true }),
  lastSyncError: text('last_sync_error').notNull().default(''),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

export const listingBlocks = pgTable('listing_blocks', {
  id: uuid('id').primaryKey().defaultRandom(),
  listingId: uuid('listing_id').notNull().references(() => listings.id, { onDelete: 'cascade' }),
  startDate: timestamp('start_date', { withTimezone: true, mode: 'date' }).notNull(),
  endDate: timestamp('end_date', { withTimezone: true, mode: 'date' }).notNull(),
  source: varchar('source', { length: 16 }).notNull().default('manual'),
  feedId: uuid('feed_id').references(() => listingCalendarFeeds.id, { onDelete: 'cascade' }),
  externalUid: varchar('external_uid', { length: 255 }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, table => ({
  listingExternalUidUnique: unique().on(table.listingId, table.externalUid),
}))

export const countries = pgTable('countries', {
  id: uuid('id').primaryKey().defaultRandom(),
  code: varchar('code', { length: 2 }).notNull().unique(),
  nameRu: varchar('name_ru', { length: 128 }).notNull(),
  nameEn: varchar('name_en', { length: 128 }).notNull(),
  active: boolean('active').notNull().default(false),
  sortOrder: integer('sort_order').notNull().default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

export const cities = pgTable('cities', {
  id: uuid('id').primaryKey().defaultRandom(),
  countryId: uuid('country_id').notNull().references(() => countries.id, { onDelete: 'restrict' }),
  name: varchar('name', { length: 128 }).notNull(),
  nameEn: varchar('name_en', { length: 128 }),
  active: boolean('active').notNull().default(true),
  sortOrder: integer('sort_order').notNull().default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, table => ({
  countryNameUnique: unique().on(table.countryId, table.name),
}))

export const amenityCatalog = pgTable('amenity_catalog', {
  id: uuid('id').primaryKey().defaultRandom(),
  slug: varchar('slug', { length: 64 }).notNull().unique(),
  icon: varchar('icon', { length: 128 }).notNull(),
  labelRu: varchar('label_ru', { length: 128 }).notNull(),
  labelEn: varchar('label_en', { length: 128 }).notNull(),
  category: varchar('category', { length: 32 }).notNull().default('comfort'),
  active: boolean('active').notNull().default(true),
  sortOrder: integer('sort_order').notNull().default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

export const listingDocuments = pgTable('listing_documents', {
  id: uuid('id').primaryKey().defaultRandom(),
  listingId: uuid('listing_id').notNull().references(() => listings.id, { onDelete: 'cascade' }),
  title: varchar('title', { length: 255 }).notNull(),
  fileUrl: varchar('file_url', { length: 512 }).notNull(),
  fileName: varchar('file_name', { length: 255 }).notNull(),
  sortOrder: integer('sort_order').notNull().default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

export const listingPhotos = pgTable('listing_photos', {
  id: uuid('id').primaryKey().defaultRandom(),
  listingId: uuid('listing_id').notNull().references(() => listings.id, { onDelete: 'cascade' }),
  url: varchar('url', { length: 512 }).notNull(),
  mediaType: varchar('media_type', { length: 16 }).notNull().default('photo'),
  embedUrl: varchar('embed_url', { length: 512 }),
  provider: varchar('provider', { length: 32 }),
  sortOrder: integer('sort_order').notNull().default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

export const bookings = pgTable('bookings', {
  id: uuid('id').primaryKey().defaultRandom(),
  listingId: uuid('listing_id').notNull().references(() => listings.id, { onDelete: 'cascade' }),
  guestId: uuid('guest_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  checkIn: timestamp('check_in', { withTimezone: true, mode: 'date' }).notNull(),
  checkOut: timestamp('check_out', { withTimezone: true, mode: 'date' }).notNull(),
  guests: integer('guests').notNull().default(1),
  totalPrice: integer('total_price').notNull(),
  hostAmount: integer('host_amount').notNull(),
  platformFee: integer('platform_fee').notNull(),
  bonusApplied: integer('bonus_applied').notNull().default(0),
  giftCertificatePurchaseId: uuid('gift_certificate_purchase_id').references(() => giftCertificatePurchases.id, { onDelete: 'set null' }),
  giftCertificateCredit: integer('gift_certificate_credit').notNull().default(0),
  transferRequested: boolean('transfer_requested').notNull().default(false),
  transferPrice: integer('transfer_price').notNull().default(0),
  status: bookingStatusEnum('status').notNull().default('pending'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

export const payments = pgTable('payments', {
  id: uuid('id').primaryKey().defaultRandom(),
  bookingId: uuid('booking_id').notNull().references(() => bookings.id, { onDelete: 'cascade' }),
  yookassaPaymentId: varchar('yookassa_payment_id', { length: 64 }),
  amount: integer('amount').notNull(),
  currency: varchar('currency', { length: 3 }).notNull().default('RUB'),
  status: paymentStatusEnum('status').notNull().default('pending'),
  confirmationUrl: varchar('confirmation_url', { length: 512 }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

export const reviews = pgTable('reviews', {
  id: uuid('id').primaryKey().defaultRandom(),
  bookingId: uuid('booking_id').notNull().references(() => bookings.id, { onDelete: 'cascade' }).unique(),
  listingId: uuid('listing_id').notNull().references(() => listings.id, { onDelete: 'cascade' }),
  authorId: uuid('author_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  rating: integer('rating').notNull(),
  ratingCleanliness: integer('rating_cleanliness').notNull(),
  ratingCheckIn: integer('rating_check_in').notNull(),
  ratingLocation: integer('rating_location').notNull(),
  ratingPhotoMatch: integer('rating_photo_match').notNull(),
  ratingValue: integer('rating_value').notNull(),
  ratingService: integer('rating_service').notNull(),
  text: text('text').notNull(),
  status: reviewStatusEnum('status').notNull().default('pending'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

export const bonusTransactions = pgTable('bonus_transactions', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  amount: integer('amount').notNull(),
  type: bonusTransactionTypeEnum('type').notNull(),
  bookingId: uuid('booking_id').references(() => bookings.id, { onDelete: 'set null' }),
  reviewId: uuid('review_id').references(() => reviews.id, { onDelete: 'set null' }),
  balanceAfter: integer('balance_after').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

export const listingPromotions = pgTable('listing_promotions', {
  id: uuid('id').primaryKey().defaultRandom(),
  listingId: uuid('listing_id').notNull().references(() => listings.id, { onDelete: 'cascade' }),
  hostId: uuid('host_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  productSlug: varchar('product_slug', { length: 32 }).notNull(),
  pricePoints: integer('price_points').notNull(),
  startsAt: timestamp('starts_at', { withTimezone: true }).notNull(),
  endsAt: timestamp('ends_at', { withTimezone: true }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

export const hostPromoTransactions = pgTable('host_promo_transactions', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  amount: integer('amount').notNull(),
  type: hostPromoTransactionTypeEnum('type').notNull(),
  listingId: uuid('listing_id').references(() => listings.id, { onDelete: 'set null' }),
  promotionId: uuid('promotion_id').references(() => listingPromotions.id, { onDelete: 'set null' }),
  balanceAfter: integer('balance_after').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

export const hostPayoutProfiles = pgTable('host_payout_profiles', {
  userId: uuid('user_id').primaryKey().references(() => users.id, { onDelete: 'cascade' }),
  status: hostPayoutStatusEnum('status').notNull().default('not_started'),
  inn: varchar('inn', { length: 12 }),
  bankAccount: varchar('bank_account', { length: 20 }),
  bik: varchar('bik', { length: 9 }),
  yookassaRecipientId: varchar('yookassa_recipient_id', { length: 64 }),
  rejectionReason: text('rejection_reason'),
  submittedAt: timestamp('submitted_at', { withTimezone: true }),
  activatedAt: timestamp('activated_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

export const hostPromoPurchases = pgTable('host_promo_purchases', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  packageSlug: varchar('package_slug', { length: 32 }).notNull(),
  points: integer('points').notNull(),
  amountRub: integer('amount_rub').notNull(),
  yookassaPaymentId: varchar('yookassa_payment_id', { length: 64 }),
  status: paymentStatusEnum('status').notNull().default('pending'),
  confirmationUrl: varchar('confirmation_url', { length: 512 }),
  promoTransactionId: uuid('promo_transaction_id').references(() => hostPromoTransactions.id, { onDelete: 'set null' }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

export const giftCertificateOffers = pgTable('gift_certificate_offers', {
  id: uuid('id').primaryKey().defaultRandom(),
  listingId: uuid('listing_id').notNull().references(() => listings.id, { onDelete: 'cascade' }),
  hostId: uuid('host_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  amountRub: integer('amount_rub').notNull(),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, table => ({
  listingAmountUnique: unique('gift_certificate_offers_listing_amount_idx').on(table.listingId, table.amountRub),
}))

export const giftCertificatePurchases = pgTable('gift_certificate_purchases', {
  id: uuid('id').primaryKey().defaultRandom(),
  offerId: uuid('offer_id').notNull().references(() => giftCertificateOffers.id, { onDelete: 'restrict' }),
  listingId: uuid('listing_id').notNull().references(() => listings.id, { onDelete: 'cascade' }),
  hostId: uuid('host_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  buyerId: uuid('buyer_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  recipientName: varchar('recipient_name', { length: 100 }),
  totalPrice: integer('total_price').notNull(),
  hostAmount: integer('host_amount').notNull(),
  platformFee: integer('platform_fee').notNull(),
  code: varchar('code', { length: 16 }),
  status: giftCertificatePurchaseStatusEnum('status').notNull().default('pending'),
  yookassaPaymentId: varchar('yookassa_payment_id', { length: 64 }),
  confirmationUrl: varchar('confirmation_url', { length: 512 }),
  expiresAt: timestamp('expires_at', { withTimezone: true }),
  redeemedAt: timestamp('redeemed_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

export const listingClaimRequests = pgTable('listing_claim_requests', {
  id: uuid('id').primaryKey().defaultRandom(),
  listingId: uuid('listing_id').notNull().references(() => listings.id, { onDelete: 'cascade' }),
  requesterName: varchar('requester_name', { length: 100 }).notNull(),
  requesterPhone: varchar('requester_phone', { length: 20 }).notNull(),
  requesterEmail: varchar('requester_email', { length: 255 }),
  message: text('message'),
  status: listingClaimStatusEnum('status').notNull().default('pending'),
  assignedHostId: uuid('assigned_host_id').references(() => users.id, { onDelete: 'set null' }),
  resolvedBy: uuid('resolved_by').references(() => users.id, { onDelete: 'set null' }),
  resolvedAt: timestamp('resolved_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

export const listingClaimAttachments = pgTable('listing_claim_attachments', {
  id: uuid('id').primaryKey().defaultRandom(),
  claimId: uuid('claim_id').notNull().references(() => listingClaimRequests.id, { onDelete: 'cascade' }),
  fileName: varchar('file_name', { length: 255 }).notNull(),
  fileUrl: text('file_url').notNull(),
  mimeType: varchar('mime_type', { length: 128 }),
  byteSize: integer('byte_size'),
  sortOrder: integer('sort_order').notNull().default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

export const reviewReplies = pgTable('review_replies', {
  id: uuid('id').primaryKey().defaultRandom(),
  reviewId: uuid('review_id').notNull().references(() => reviews.id, { onDelete: 'cascade' }),
  parentReplyId: uuid('parent_reply_id'),
  authorId: uuid('author_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  text: text('text').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

export const reviewPhotos = pgTable('review_photos', {
  id: uuid('id').primaryKey().defaultRandom(),
  reviewId: uuid('review_id').notNull().references(() => reviews.id, { onDelete: 'cascade' }),
  url: varchar('url', { length: 512 }).notNull(),
  sortOrder: integer('sort_order').notNull().default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

export const supportRequests = pgTable('support_requests', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 100 }).notNull(),
  email: varchar('email', { length: 255 }).notNull(),
  contextUrl: varchar('context_url', { length: 512 }),
  message: text('message').notNull(),
  status: reportStatusEnum('status').notNull().default('open'),
  staffNote: text('staff_note').notNull().default(''),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

export const reports = pgTable('reports', {
  id: uuid('id').primaryKey().defaultRandom(),
  reporterId: uuid('reporter_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  type: reportTypeEnum('type').notNull(),
  listingId: uuid('listing_id').references(() => listings.id, { onDelete: 'set null' }),
  bookingId: uuid('booking_id').references(() => bookings.id, { onDelete: 'set null' }),
  targetUserId: uuid('target_user_id').references(() => users.id, { onDelete: 'set null' }),
  reason: text('reason').notNull(),
  status: reportStatusEnum('status').notNull().default('open'),
  adminNote: text('admin_note').notNull().default(''),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

export const oauthAccounts = pgTable('oauth_accounts', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  provider: oauthProviderEnum('provider').notNull(),
  providerUserId: varchar('provider_user_id', { length: 128 }).notNull(),
  profileName: varchar('profile_name', { length: 255 }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, table => ({
  providerUserUnique: unique().on(table.provider, table.providerUserId),
}))

export const favorites = pgTable('favorites', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  listingId: uuid('listing_id').notNull().references(() => listings.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, table => ({
  userListingUnique: unique().on(table.userId, table.listingId),
}))

export const conversations = pgTable('conversations', {
  id: uuid('id').primaryKey().defaultRandom(),
  listingId: uuid('listing_id').notNull().references(() => listings.id, { onDelete: 'cascade' }),
  guestId: uuid('guest_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  hostId: uuid('host_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  lastMessageAt: timestamp('last_message_at', { withTimezone: true }),
  guestLastReadAt: timestamp('guest_last_read_at', { withTimezone: true }),
  hostLastReadAt: timestamp('host_last_read_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, table => ({
  listingGuestUnique: unique().on(table.listingId, table.guestId),
}))

export const messages = pgTable('messages', {
  id: uuid('id').primaryKey().defaultRandom(),
  conversationId: uuid('conversation_id').notNull().references(() => conversations.id, { onDelete: 'cascade' }),
  senderId: uuid('sender_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  body: text('body').notNull(),
  isSystem: boolean('is_system').notNull().default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

export const spotlightPhotos = pgTable('spotlight_photos', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  listingId: uuid('listing_id').notNull().references(() => listings.id, { onDelete: 'cascade' }),
  imageUrl: varchar('image_url', { length: 512 }).notNull(),
  caption: text('caption').notNull().default(''),
  status: spotlightPhotoStatusEnum('status').notNull().default('pending'),
  monthKey: varchar('month_key', { length: 7 }).notNull(),
  voteCount: integer('vote_count').notNull().default(0),
  consentGiven: boolean('consent_given').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

export const spotlightMonths = pgTable('spotlight_months', {
  monthKey: varchar('month_key', { length: 7 }).primaryKey(),
  winnerPhotoId: uuid('winner_photo_id').references(() => spotlightPhotos.id, { onDelete: 'set null' }),
  closedAt: timestamp('closed_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

export const spotlightVotes = pgTable('spotlight_votes', {
  id: uuid('id').primaryKey().defaultRandom(),
  photoId: uuid('photo_id').notNull().references(() => spotlightPhotos.id, { onDelete: 'cascade' }),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  monthKey: varchar('month_key', { length: 7 }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, table => ({
  userMonthUnique: unique().on(table.userId, table.monthKey),
}))

export const userStories = pgTable('user_stories', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  listingId: uuid('listing_id').notNull().references(() => listings.id, { onDelete: 'cascade' }),
  mediaUrl: varchar('media_url', { length: 512 }).notNull(),
  mediaType: storyMediaTypeEnum('media_type').notNull().default('image'),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

export const listingStoryPins = pgTable('listing_story_pins', {
  listingId: uuid('listing_id').notNull().references(() => listings.id, { onDelete: 'cascade' }),
  storyId: uuid('story_id').notNull().references(() => userStories.id, { onDelete: 'cascade' }),
  sortOrder: integer('sort_order').notNull().default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, table => ({
  listingStoryUnique: unique().on(table.listingId, table.storyId),
}))
