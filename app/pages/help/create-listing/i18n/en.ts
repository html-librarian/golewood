export default {
  title: 'How to publish a listing',
  intro: 'The Golewood listing wizard has four steps from draft to moderation.',
  cta: 'Open wizard',
  steps: [
    {
      title: 'Step 1. Basics',
      body: 'Enter a title, pick a city from the directory, address, and description. Cities must exist in the catalog — admins can add new ones.',
    },
    {
      title: 'Step 2. Details',
      body: 'Set nightly price, cancellation policy, capacity, and house rules. Select amenities from the catalog — each has an icon in search.',
    },
    {
      title: 'Step 3. Photos & media',
      body: 'Upload photos (up to 10 MB, compressed server-side), add Rutube/VK/YouTube videos, attach guest documents (rules, agreements).',
    },
    {
      title: 'Step 4. Publish',
      body: 'Review the summary and submit for moderation. At least one photo is required. After approval, the listing appears in search and on the map.',
    },
  ],
} as const
