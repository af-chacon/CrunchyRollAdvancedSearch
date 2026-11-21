// Sentinel key for titles that have no maturity rating, so they can be
// filtered on and counted alongside the real rating values.
export const UNRATED_MATURITY = '__unrated__'

// Format a Crunchyroll maturity rating (cr-tv system) for display.
// e.g. 'ALL' -> 'All Ages', '14' -> '14+', 'PG' -> 'PG'
export function formatMaturityRating(rating: string): string {
  if (rating === UNRATED_MATURITY) return 'Unrated'
  if (rating === 'ALL') return 'All Ages'
  if (/^\d+$/.test(rating)) return `${rating}+`
  return rating
}

// A CSS-safe slug for a maturity rating, used for color-coding badges.
// e.g. 'ALL' -> 'all', '14' -> '14', 'PG' -> 'pg'
export function maturityRatingSlug(rating: string): string {
  if (rating === UNRATED_MATURITY) return 'unrated'
  return rating.toLowerCase()
}

// Display names for the audio/subtitle locale codes Crunchyroll uses. Region is
// kept whenever the same language ships as more than one track (es-419 vs es-ES,
// pt-BR vs pt-PT), and Chinese entries are named by region rather than script so
// we don't mislabel a track. Codes missing here fall back to the raw code, so a
// locale introduced by a future data update still renders — add it below.
const LANGUAGE_NAMES: Record<string, string> = {
  'ar-SA': 'Arabic',
  'ca-ES': 'Catalan',
  'de-DE': 'German',
  'en-IN': 'English (India)',
  'en-US': 'English',
  'es-419': 'Spanish (Latin America)',
  'es-ES': 'Spanish (Spain)',
  'fr-FR': 'French',
  'hi-IN': 'Hindi',
  'id-ID': 'Indonesian',
  'it-IT': 'Italian',
  'ja-JP': 'Japanese',
  'ko-KR': 'Korean',
  'ms-MY': 'Malay',
  'pl-PL': 'Polish',
  'pt-BR': 'Portuguese (Brazil)',
  'pt-PT': 'Portuguese (Portugal)',
  'ru-RU': 'Russian',
  'ta-IN': 'Tamil',
  'te-IN': 'Telugu',
  'th-TH': 'Thai',
  'tr-TR': 'Turkish',
  'vi-VN': 'Vietnamese',
  'zh-CN': 'Chinese (Simplified)',
  'zh-HK': 'Chinese (Hong Kong)',
  'zh-TW': 'Chinese (Taiwan)',
}

// Format a locale code for display. e.g. 'ja-JP' -> 'Japanese'
export function formatLocale(code: string): string {
  return LANGUAGE_NAMES[code] ?? code
}
