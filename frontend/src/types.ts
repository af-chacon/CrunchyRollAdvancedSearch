export interface Anime {
  id: string
  title: string
  description: string
  rating: string
  total_ratings: number
  episode_count: number
  season_count: number
  series_launch_year: number
  is_mature: boolean
  is_dubbed: boolean
  is_subbed: boolean
  audio_locales: string[]
  subtitle_locales: string[]
  content_descriptors: string[]
  tenant_categories: string[]
  poster: string | null
}

export interface FilterState {
  mature: boolean
  dubbed: boolean
  subbed: boolean
}
