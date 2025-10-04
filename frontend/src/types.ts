export interface Anime {
  id: string
  title: string
  description: string
  rating?: {
    average: string
    total: number
    '1s': { displayed: string; percentage: number; unit: string }
    '2s': { displayed: string; percentage: number; unit: string }
    '3s': { displayed: string; percentage: number; unit: string }
    '4s': { displayed: string; percentage: number; unit: string }
    '5s': { displayed: string; percentage: number; unit: string }
  }
  series_metadata?: {
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
  }
  images?: {
    poster_tall?: Array<Array<{
      height: number
      source: string
      type: string
      width: number
    }>>
  }
  anilist?: {
    anilist_id: number
    mal_id: number
    matched_title: string
    match_score: number
    start_date: { year: number; month: number; day: number }
    end_date: { year: number; month: number; day: number }
    format: string
    status: string
    episodes: number
    duration: number
    genres: string[]
    tags: string[]
    popularity: number
    average_score: number
    mean_score: number
    studios: string[]
    season: string
    season_year: number
  }
}

export type FilterValue = 'include' | 'exclude' | 'default'

export interface FilterState {
  mature: FilterValue
  dubbed: FilterValue
  subbed: FilterValue
  minRating: number
  contentDescriptors: Record<string, FilterValue>
  genres: Record<string, FilterValue>
  tags: Record<string, FilterValue>
  status: Record<string, FilterValue>
  studios: Record<string, FilterValue>
}
