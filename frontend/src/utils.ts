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
