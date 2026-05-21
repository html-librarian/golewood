export default {
  title: 'Calendar',
  intro: 'The listing calendar shows Golewood bookings, manual blocks, and dates from external services.',
  cta: 'Go to listings',
  sections: [
    {
      title: 'Where to open it',
      body: 'In the listings list click the calendar icon on a published property. The page is only available for published listings.',
    },
    {
      title: 'Manual blocks',
      body: 'Block dates for maintenance or personal use with a date range or by selecting days in the grid. Platform bookings block dates automatically — no need to duplicate them.',
    },
    {
      title: 'iCal import',
      body: 'Add an iCal URL from Avito, daily-rental sites, etc. — busy dates sync into Golewood. Run “Sync” or “Sync all” regularly.',
    },
    {
      title: 'Export to other services',
      body: 'Copy the Golewood iCal URL and add it as calendar import elsewhere so other platforms see your bookings and blocks.',
    },
    {
      title: 'Google Calendar',
      body: 'You can connect a Google account directly — busy times sync without a manual URL. Unlinking or re-syncing refreshes imported dates.',
    },
  ],
} as const
