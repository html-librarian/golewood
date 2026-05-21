export default {
  title: 'Listings',
  intro: 'The Listings section is where you manage properties from draft to publication and extra content.',
  cta: 'Open listings',
  sections: [
    {
      title: 'Create and draft',
      body: 'Click “Create listing” to run the four-step wizard: basics, details (price, rules, amenities), photos and documents, then submit for moderation. You can save a draft and continue later.',
    },
    {
      title: 'Moderation and publish',
      body: 'After submit the status is “In moderation”. An admin reviews copy and photos; once approved the listing appears in search. At least one photo is required. Rejected listings can be fixed and resubmitted.',
    },
    {
      title: 'Editing',
      body: 'On an active listing use the pencil icon to reopen the wizard with existing data. Major changes may go through moderation again.',
    },
    {
      title: 'Card actions',
      body: 'Published listings show icon shortcuts: calendar, stories, property news, promotion. Archive hides the listing from search; restore brings it back.',
    },
    {
      title: 'News and stories',
      body: 'News posts are short updates about the property (text and gallery). Stories are vertical photo/video for guests in the app feed. Both are only available for published listings.',
    },
  ],
} as const
