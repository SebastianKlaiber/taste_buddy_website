// DEV ONLY. Sample shared-taste responses for exercising /taste/<id> locally
// with `npm run dev`. Imported only behind `import.meta.env.DEV`, so it is
// not part of production builds. Try /taste/sample, /taste/sample-de and
// /taste/sample-noimage.

const sampleImage = `data:image/svg+xml,${encodeURIComponent(
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1080 1920"><rect width="1080" height="1920" fill="#00340E"/><text x="540" y="860" font-size="260" text-anchor="middle">🌶️</text><text x="540" y="1080" font-family="sans-serif" font-size="96" font-weight="700" fill="#fff" text-anchor="middle">Spice Explorer</text><text x="540" y="1200" font-family="sans-serif" font-size="48" fill="#00CE31" text-anchor="middle">DEV SAMPLE IMAGE</text></svg>`,
)}`;

const payload = {
  v: 1,
  taste_type: 'spice_explorer',
  recipe_count: 84,
  cuisine_count: 9,
  top_cuisines: [
    { name: 'Asian', count: 39 },
    { name: 'Mexican', count: 14 },
    { name: 'Indian', count: 11 },
    { name: 'Italian', count: 8 },
    { name: 'Middle Eastern', count: 5 },
  ],
  top_ingredients: [
    { name: 'Onion', count: 41 },
    { name: 'Garlic', count: 38 },
    { name: 'Chili', count: 27 },
    { name: 'Ginger', count: 22 },
    { name: 'Coriander', count: 19 },
    { name: 'Lime', count: 15 },
    { name: 'Rice', count: 14 },
    { name: 'Coconut milk', count: 12 },
    { name: 'Tomato', count: 11 },
    { name: '<b>Escaped</b> & safe', count: 3 },
  ],
  locale: 'en',
};

export const DEV_SAMPLE_SHARED_TASTES: Record<string, unknown> = {
  sample: { payload, image_url: sampleImage, created_at: '2026-11-16T10:00:00Z' },
  'sample-de': {
    payload: {
      ...payload,
      taste_type: 'baker',
      locale: 'de',
      top_cuisines: [{ name: 'Deutsch', count: 30 }, { name: 'Französisch', count: 12 }],
      top_ingredients: [{ name: 'Mehl', count: 44 }, { name: 'Butter', count: 40 }, { name: 'Zucker', count: 35 }],
    },
    image_url: null,
    created_at: '2026-11-16T10:00:00Z',
  },
  'sample-noimage': {
    payload: { v: 1, taste_type: 'not_a_real_type', recipe_count: 3 },
    image_url: null,
    created_at: '2026-11-16T10:00:00Z',
  },
};
