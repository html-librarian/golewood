/** Tailwind gradient classes for discovery chip backgrounds (scanned by Tailwind). */
export const HOME_DISCOVERY_TONE_PRESETS = [
  { id: 'sky-cyan', labelRu: 'Небесный', labelEn: 'Sky', tone: 'from-sky-400 to-cyan-600' },
  { id: 'emerald-teal', labelRu: 'Изумруд', labelEn: 'Emerald', tone: 'from-emerald-500 to-teal-700' },
  { id: 'lime-green', labelRu: 'Лайм', labelEn: 'Lime', tone: 'from-lime-500 to-green-700' },
  { id: 'teal-emerald', labelRu: 'Бирюза', labelEn: 'Teal', tone: 'from-teal-600 to-emerald-800' },
  { id: 'indigo-violet', labelRu: 'Индиго', labelEn: 'Indigo', tone: 'from-indigo-500 to-violet-700' },
  { id: 'slate', labelRu: 'Серый', labelEn: 'Slate', tone: 'from-slate-500 to-slate-700' },
  { id: 'stone', labelRu: 'Камень', labelEn: 'Stone', tone: 'from-stone-500 to-stone-700' },
  { id: 'amber-orange', labelRu: 'Янтарь', labelEn: 'Amber', tone: 'from-amber-400 to-orange-600' },
  { id: 'amber-orange-deep', labelRu: 'Оранж', labelEn: 'Orange', tone: 'from-amber-500 to-orange-600' },
  { id: 'rose-red', labelRu: 'Роза', labelEn: 'Rose', tone: 'from-rose-500 to-red-700' },
  { id: 'blue', labelRu: 'Синий', labelEn: 'Blue', tone: 'from-blue-400 to-blue-700' },
  { id: 'orange-amber', labelRu: 'Тёплый', labelEn: 'Warm', tone: 'from-orange-500 to-amber-700' },
  { id: 'pink-rose', labelRu: 'Розовый', labelEn: 'Pink', tone: 'from-pink-400 to-rose-600' },
  { id: 'red-orange', labelRu: 'Красный', labelEn: 'Red', tone: 'from-red-500 to-orange-700' },
  { id: 'slate-light', labelRu: 'Светло-серый', labelEn: 'Light slate', tone: 'from-slate-400 to-slate-600' },
  { id: 'brand', labelRu: 'Бренд', labelEn: 'Brand', tone: 'from-brand-500 to-brand-700' },
  { id: 'cyan-blue', labelRu: 'Циан', labelEn: 'Cyan', tone: 'from-cyan-400 to-blue-600' },
  { id: 'sky-blue', labelRu: 'Морской', labelEn: 'Sea', tone: 'from-sky-300 to-blue-600' },
  { id: 'violet-purple', labelRu: 'Фиолет', labelEn: 'Violet', tone: 'from-violet-500 to-purple-800' },
  { id: 'green-emerald', labelRu: 'Лес', labelEn: 'Forest', tone: 'from-green-600 to-emerald-900' },
] as const

export const isValidDiscoveryTone = (tone: string) =>
  HOME_DISCOVERY_TONE_PRESETS.some(preset => preset.tone === tone)
    || /^from-[\w-]+ to-[\w-]+$/.test(tone.trim())
