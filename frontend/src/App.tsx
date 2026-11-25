import { useState, useEffect, useMemo } from 'react'
import './App.css'
import { Anime, FilterState, FilterValue } from './types'
import { UNRATED_MATURITY, formatLocale } from './utils'
import {
  Header,
  SearchBar,
  FilterControls,
  Pagination,
  AnimeCard
} from './components'

// Maturity ratings ordered from least to most restrictive (Crunchyroll cr-tv system)
const MATURITY_RATING_ORDER = ['ALL', 'PG', '12', '14', '16', '18']

// Built fresh on every call: clearFilters must hand React a new object even
// when no filter is active, or the state update bails out and the effect that
// returns the user to page 1 never runs.
const createDefaultFilter = (): FilterState => ({
  dubbed: 'default',
  subbed: 'default',
  minRating: 0,
  audioLocales: {},
  subtitleLocales: {},
  maturityRatings: {},
  contentDescriptors: {},
  genres: {},
  tags: {},
  status: {},
  studios: {},
  sortBy: 'alphabetical',
  sortDirection: 'asc'
})

function App() {
  const [anime, setAnime] = useState<Anime[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [searchTerm, setSearchTerm] = useState<string>('')
  const [currentPage, setCurrentPage] = useState<number>(1)
  const [itemsPerPage, setItemsPerPage] = useState<number>(16)
  const [dataTimestamp, setDataTimestamp] = useState<string>('')
  const [filter, setFilter] = useState<FilterState>(createDefaultFilter)

  const clearFilters = () => {
    setFilter(createDefaultFilter())
    setSearchTerm('')
  }

  useEffect(() => {
    // Add cache-busting parameter to force fetch of latest version
    const cacheBuster = import.meta.env.DEV
      ? `?v=${Date.now()}`
      : `?v=${import.meta.env.VITE_BUILD_TIME || Date.now()}`

    const animeJsonUrl = `${import.meta.env.BASE_URL}anime.json`

    // Fetch anime data
    fetch(`${animeJsonUrl}${cacheBuster}`)
      .then(res => res.json())
      .then(data => {
        setAnime(data)
        setLoading(false)
      })
      .catch(err => {
        console.error('Error loading anime:', err)
        setLoading(false)
      })

    // Fetch file timestamp
    fetch(animeJsonUrl, { method: 'HEAD' })
      .then(res => {
        const lastModified = res.headers.get('Last-Modified')
        if (lastModified) {
          const date = new Date(lastModified)
          setDataTimestamp(date.toLocaleString())
        }
      })
      .catch(err => {
        console.error('Error fetching timestamp:', err)
      })
  }, [])

  // Extract unique genres, content descriptors, tags, statuses, and studios from loaded data
  const availableGenres = Array.from(
    new Set(
      anime.flatMap(item => item.anilist?.genres || [])
    )
  ).sort()

  const availableContentDescriptors = Array.from(
    new Set(
      anime.flatMap(item => item.series_metadata?.content_descriptors || [])
    )
  ).sort()

  const availableTags = Array.from(
    new Set(
      anime.flatMap(item => item.anilist?.tags || [])
    )
  ).sort()

  const availableStatuses = Array.from(
    new Set(
      anime.map(item => item.anilist?.status).filter(Boolean) as string[]
    )
  ).sort()

  const availableStudios = Array.from(
    new Set(
      anime.flatMap(item => item.anilist?.studios || [])
    )
  ).sort()

  // Locale codes are sorted by their display name so the option order stays
  // stable while facet counts shift. Blank codes appear in the data for a
  // handful of titles and are not offerable options.
  const collectLocales = (getLocales: (item: Anime) => string[]) =>
    Array.from(new Set(anime.flatMap(getLocales).filter(Boolean)))
      .sort((a, b) => formatLocale(a).localeCompare(formatLocale(b)))

  const availableAudioLocales = collectLocales(
    item => item.series_metadata?.audio_locales || []
  )

  const availableSubtitleLocales = collectLocales(
    item => item.series_metadata?.subtitle_locales || []
  )

  const availableMaturityRatings = Array.from(
    new Set(
      anime
        .map(item => item.series_metadata?.extended_maturity_rating?.rating)
        .filter(Boolean) as string[]
    )
  ).sort((a, b) => {
    const indexA = MATURITY_RATING_ORDER.indexOf(a)
    const indexB = MATURITY_RATING_ORDER.indexOf(b)
    // Unknown ratings sort after known ones, alphabetically
    if (indexA === -1 && indexB === -1) return a.localeCompare(b)
    if (indexA === -1) return 1
    if (indexB === -1) return -1
    return indexA - indexB
  })

  // Offer an "Unrated" option last if any title lacks a maturity rating
  if (anime.some(item => !item.series_metadata?.extended_maturity_rating?.rating)) {
    availableMaturityRatings.push(UNRATED_MATURITY)
  }

  const { filteredAnime, facetCounts } = useMemo(() => {
    const matchesSearch = (item: Anime) =>
      item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.description.toLowerCase().includes(searchTerm.toLowerCase())

    // Basic filters: dubbed/subbed tri-state + minimum star rating
    const matchesBasic = (item: Anime) => {
      const matchesDubbed = filter.dubbed === 'default' ||
        (filter.dubbed === 'include' && item.series_metadata?.is_dubbed) ||
        (filter.dubbed === 'exclude' && !item.series_metadata?.is_dubbed)
      const matchesSubbed = filter.subbed === 'default' ||
        (filter.subbed === 'include' && item.series_metadata?.is_subbed) ||
        (filter.subbed === 'exclude' && !item.series_metadata?.is_subbed)
      const matchesRating = parseFloat(item.rating?.average || '0') >= filter.minRating
      return Boolean(matchesDubbed && matchesSubbed && matchesRating)
    }

    // Maturity rating: each title has a single rating (unrated titles use the
    // UNRATED_MATURITY key), so included levels use OR semantics (match any
    // selected level) while excluded levels are removed.
    const matchesMaturity = (item: Anime) => {
      const itemKey = item.series_metadata?.extended_maturity_rating?.rating ?? UNRATED_MATURITY
      const included = Object.entries(filter.maturityRatings)
        .filter(([, value]) => value === 'include').map(([rating]) => rating)
      const excluded = Object.entries(filter.maturityRatings)
        .filter(([, value]) => value === 'exclude').map(([rating]) => rating)
      return (included.length === 0 || included.includes(itemKey)) && !excluded.includes(itemKey)
    }

    // Audio/subtitle languages: a title carries a list of locales, so included
    // languages use OR semantics (match a title offering any selected language)
    // while a title offering an excluded language is dropped. Membership is
    // tested per locale code -- the lists themselves are never compared.
    const matchesLocales = (
      locales: string[],
      filterObj: Record<string, FilterValue>
    ) => {
      const included = Object.entries(filterObj)
        .filter(([, value]) => value === 'include').map(([locale]) => locale)
      const excluded = Object.entries(filterObj)
        .filter(([, value]) => value === 'exclude').map(([locale]) => locale)
      return (included.length === 0 || included.some(locale => locales.includes(locale))) &&
        !excluded.some(locale => locales.includes(locale))
    }

    const matchesAudioLocales = (item: Anime) =>
      matchesLocales(item.series_metadata?.audio_locales || [], filter.audioLocales)
    const matchesSubtitleLocales = (item: Anime) =>
      matchesLocales(item.series_metadata?.subtitle_locales || [], filter.subtitleLocales)

    // Generic tri-state matcher for the multi-value record filters
    const matchesRecord = (
      item: Anime,
      filterObj: Record<string, FilterValue>,
      has: (item: Anime, key: string) => boolean
    ) => Object.entries(filterObj).every(([key, value]) => {
      if (value === 'default') return true
      return value === 'include' ? has(item, key) : !has(item, key)
    })

    const matchesGenres = (item: Anime) =>
      matchesRecord(item, filter.genres, (i, k) => i.anilist?.genres?.includes(k) ?? false)
    const matchesContentDescriptors = (item: Anime) =>
      matchesRecord(item, filter.contentDescriptors, (i, k) => i.series_metadata?.content_descriptors?.includes(k) ?? false)
    const matchesTags = (item: Anime) =>
      matchesRecord(item, filter.tags, (i, k) => i.anilist?.tags?.includes(k) ?? false)
    const matchesStatus = (item: Anime) =>
      matchesRecord(item, filter.status, (i, k) => i.anilist?.status === k)
    const matchesStudios = (item: Anime) =>
      matchesRecord(item, filter.studios, (i, k) => i.anilist?.studios?.includes(k) ?? false)

    // Tally how many of `items` carry each value, for the funnel facet counts
    const countValues = (items: Anime[], getValues: (item: Anime) => string[]) => {
      const counts: Record<string, number> = {}
      for (const item of items) {
        for (const value of getValues(item)) {
          counts[value] = (counts[value] || 0) + 1
        }
      }
      return counts
    }

    // Funnel: apply each filter section in the order it appears in the UI, so
    // each section's option counts reflect the titles that survived every
    // section above it (search + basic filters first, studios last).
    const afterSearch = anime.filter(matchesSearch)
    const afterBasic = afterSearch.filter(matchesBasic)
    const afterAudioLocales = afterBasic.filter(matchesAudioLocales)
    const afterSubtitleLocales = afterAudioLocales.filter(matchesSubtitleLocales)
    const afterMaturity = afterSubtitleLocales.filter(matchesMaturity)
    const afterGenres = afterMaturity.filter(matchesGenres)
    const afterContentDescriptors = afterGenres.filter(matchesContentDescriptors)
    const afterTags = afterContentDescriptors.filter(matchesTags)
    const afterStatus = afterTags.filter(matchesStatus)
    const afterStudios = afterStatus.filter(matchesStudios)

    // Each facet is counted against its section's input (the set from above),
    // ignoring that section's own selections, so its counts always sum to the
    // funnel total entering the section.
    const counts = {
      audioLocaleCounts: countValues(afterBasic, item => (item.series_metadata?.audio_locales || []).filter(Boolean)),
      subtitleLocaleCounts: countValues(afterAudioLocales, item => (item.series_metadata?.subtitle_locales || []).filter(Boolean)),
      maturityRatingCounts: countValues(afterSubtitleLocales, item => [
        item.series_metadata?.extended_maturity_rating?.rating ?? UNRATED_MATURITY,
      ]),
      genreCounts: countValues(afterMaturity, item => item.anilist?.genres || []),
      contentDescriptorCounts: countValues(afterGenres, item => item.series_metadata?.content_descriptors || []),
      tagCounts: countValues(afterContentDescriptors, item => item.anilist?.tags || []),
      statusCounts: countValues(afterTags, item => (item.anilist?.status ? [item.anilist.status] : [])),
      studioCounts: countValues(afterStatus, item => item.anilist?.studios || []),
    }

    const sorted = [...afterStudios].sort((a, b) => {
      const direction = filter.sortDirection === 'asc' ? 1 : -1

      let comparison = 0
      switch (filter.sortBy) {
        case 'alphabetical':
          comparison = a.title.localeCompare(b.title)
          break
        case 'year':
          comparison = (a.series_metadata?.series_launch_year || 0) - (b.series_metadata?.series_launch_year || 0)
          break
        case 'rating':
          comparison = parseFloat(a.rating?.average || '0') - parseFloat(b.rating?.average || '0')
          break
        case 'anilist_rating':
          comparison = (a.anilist?.average_score || 0) - (b.anilist?.average_score || 0)
          break
      }

      // If values are equal (or for alphabetical), sort by title ascending (always)
      if (comparison === 0) {
        return a.title.localeCompare(b.title)
      }

      return comparison * direction
    })

    return { filteredAnime: sorted, facetCounts: counts }
  }, [anime, filter, searchTerm])

  const totalPages = Math.ceil(filteredAnime.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const paginatedAnime = filteredAnime.slice(startIndex, startIndex + itemsPerPage)

  // Reset to page 1 when filters, items per page, or sorting change
  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm, filter, itemsPerPage])

  if (loading) {
    return <div className="loading">Loading anime...</div>
  }

  return (
    <div className="container">
      <Header totalCount={anime.length} dataTimestamp={dataTimestamp} />

      <div className="controls">
        <SearchBar value={searchTerm} onChange={setSearchTerm} />
        <FilterControls
          filter={filter}
          onFilterChange={setFilter}
          itemsPerPage={itemsPerPage}
          onItemsPerPageChange={setItemsPerPage}
          onClearFilters={clearFilters}
          availableGenres={availableGenres}
          availableContentDescriptors={availableContentDescriptors}
          availableTags={availableTags}
          availableStatuses={availableStatuses}
          availableStudios={availableStudios}
          availableMaturityRatings={availableMaturityRatings}
          availableAudioLocales={availableAudioLocales}
          availableSubtitleLocales={availableSubtitleLocales}
          audioLocaleCounts={facetCounts.audioLocaleCounts}
          subtitleLocaleCounts={facetCounts.subtitleLocaleCounts}
          maturityRatingCounts={facetCounts.maturityRatingCounts}
          genreCounts={facetCounts.genreCounts}
          contentDescriptorCounts={facetCounts.contentDescriptorCounts}
          tagCounts={facetCounts.tagCounts}
          statusCounts={facetCounts.statusCounts}
          studioCounts={facetCounts.studioCounts}
        />
      </div>

      <p className="results-count">
        {filteredAnime.length} results (Page {currentPage} of {totalPages})
      </p>

      <div className="anime-grid">
        {paginatedAnime.map(item => (
          <AnimeCard
            key={item.id}
            anime={item}
            onFilterChange={setFilter}
            currentFilter={filter}
          />
        ))}
      </div>

      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
      />
    </div>
  )
}

export default App
