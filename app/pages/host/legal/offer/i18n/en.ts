export default {
  title: 'Host terms',
  updated: 'Effective when you publish a listing on Golewood.',
  payoutLink: 'Set up payouts →',
  sections: [
    {
      title: '1. Platform role',
      paragraphs: [
        'Golewood is a marketplace: you set the stay price, guests book and pay on the site. The platform charges a 10% service fee on top of your price.',
        'Booking payments go through YooKassa with split settlement: you receive the stay amount (excluding the service fee), the platform receives the service fee.',
      ],
    },
    {
      title: '2. Payouts and bank details',
      paragraphs: [
        'You do not need your own YooKassa shop. You provide tax ID (INN), bank account and BIK; after review a payout recipient (YooKassa account_id) is enabled.',
        'Until payouts are active, guests cannot pay for bookings on the site for your listings.',
      ],
    },
    {
      title: '3. Host responsibilities',
      paragraphs: [
        'Publish accurate listings, follow house rules and applicable law. Do not move booking payments off-platform — booking protection and payouts apply only for payments through Golewood.',
        'Promotion points are purchased separately and are paid 100% to the platform; they are not part of booking split.',
      ],
    },
    {
      title: '4. Cancellations and disputes',
      paragraphs: [
        'Cancellation terms follow the listing policy. Refunds are calculated according to booking rules and the payment provider.',
        'Booking disputes are handled via Golewood support using on-platform messages and booking status.',
      ],
    },
  ],
} as const
