import { useState, useEffect } from 'react'
import './App.css'
import { Anime, FilterState } from './types'
import {
  Header,
  SearchBar,
  FilterControls,
  Pagination,
  AnimeCard
} from './components'

// Maturity ratings ordered from least to most restrictive (Crunchyroll cr-tv system)
const MATURITY_RATING_ORDER = ['ALL', 'PG', '12', '14', '16', '18']

function App() {
  const [anime, setAnime] = useState<Anime[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [searchTerm, setSearchTerm] = useState<string>('')
  const [currentPage, setCurrentPage] = useState<number>(1)
  const [itemsPerPage, setItemsPerPage] = useState<number>(16)
  const [dataTimestamp, setDataTimestamp] = useState<string>('')
  const [filter, setFilter] = useState<FilterState>({
    dubbed: 'default',
    subbed: 'default',
    minRating: 0,
    maturityRatings: {},
    contentDescriptors: {},
    genres: {},
    tags: {},
    status: {},
    studios: {},
    sortBy: 'alphabetical',
    sortDirection: 'asc'
  })

  const clearFilters = () => {
    setFilter({
      mature: 'default',
      dubbed: 'default',
      subbed: 'default',
      minRating: 0,
      maturityRatings: {},
      contentDescriptors: {},
      genres: {},
      tags: {},
      status: {},
      studios: {},
      sortBy: 'alphabetical',
      sortDirection: 'asc'
    })
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

  const filteredAnime = anime.filter(item => {
    const matchesSearch = item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.description.toLowerCase().includes(searchTerm.toLowerCase())

    // Tri-state filter logic: default = any, include = must have, exclude = must not have
    const matchesDubbed = filter.dubbed === 'default' ||
                         (filter.dubbed === 'include' && item.series_metadata?.is_dubbed) ||
                         (filter.dubbed === 'exclude' && !item.series_metadata?.is_dubbed)

    const matchesSubbed = filter.subbed === 'default' ||
                         (filter.subbed === 'include' && item.series_metadata?.is_subbed) ||
                         (filter.subbed === 'exclude' && !item.series_metadata?.is_subbed)

    const matchesRating = parseFloat(item.rating?.average || '0') >= filter.minRating

    // Maturity rating filter. Each title has a single rating, so included
    // levels use OR semantics (match any selected level) while excluded
    // levels are always removed.
    const itemMaturityRating = item.series_metadata?.extended_maturity_rating?.rating
    const includedMaturityRatings = Object.entries(filter.maturityRatings)
      .filter(([, value]) => value === 'include')
      .map(([rating]) => rating)
    const excludedMaturityRatings = Object.entries(filter.maturityRatings)
      .filter(([, value]) => value === 'exclude')
      .map(([rating]) => rating)
    const matchesMaturityRatings =
      (includedMaturityRatings.length === 0 ||
        (itemMaturityRating !== undefined && includedMaturityRatings.includes(itemMaturityRating))) &&
      (itemMaturityRating === undefined || !excludedMaturityRatings.includes(itemMaturityRating))

    // Content descriptor filters
    const matchesContentDescriptors = Object.entries(filter.contentDescriptors).every(([descriptor, filterValue]) => {
      if (filterValue === 'default') return true
      const hasDescriptor = item.series_metadata?.content_descriptors?.includes(descriptor) || false
      if (filterValue === 'include') return hasDescriptor
      if (filterValue === 'exclude') return !hasDescriptor
      return true
    })

    // Genre filters
    const matchesGenres = Object.entries(filter.genres).every(([genre, filterValue]) => {
      if (filterValue === 'default') return true
      const hasGenre = item.anilist?.genres?.includes(genre) || false
      if (filterValue === 'include') return hasGenre
      if (filterValue === 'exclude') return !hasGenre
      return true
    })

    // Tag filters
    const matchesTags = Object.entries(filter.tags).every(([tag, filterValue]) => {
      if (filterValue === 'default') return true
      const hasTag = item.anilist?.tags?.includes(tag) || false
      if (filterValue === 'include') return hasTag
      if (filterValue === 'exclude') return !hasTag
      return true
    })

    // Status filters
    const matchesStatus = Object.entries(filter.status).every(([status, filterValue]) => {
      if (filterValue === 'default') return true
      const hasStatus = item.anilist?.status === status
      if (filterValue === 'include') return hasStatus
      if (filterValue === 'exclude') return !hasStatus
      return true
    })

    // Studio filters
    const matchesStudios = Object.entries(filter.studios).every(([studio, filterValue]) => {
      if (filterValue === 'default') return true
      const hasStudio = item.anilist?.studios?.includes(studio) || false
      if (filterValue === 'include') return hasStudio
      if (filterValue === 'exclude') return !hasStudio
      return true
    })

    return matchesSearch && matchesDubbed && matchesSubbed && matchesRating && matchesMaturityRatings && matchesContentDescriptors && matchesGenres && matchesTags && matchesStatus && matchesStudios
  }).sort((a, b) => {
    const direction = filter.sortDirection === 'asc' ? 1 : -1
    
    let comparison = 0
    switch (filter.sortBy) {
      case 'alphabetical':
        comparison = a.title.localeCompare(b.title)
        break
      case 'year':
        const yearA = a.series_metadata?.series_launch_year || 0
        const yearB = b.series_metadata?.series_launch_year || 0
        comparison = yearA - yearB
        break
      case 'rating':
        const ratingA = parseFloat(a.rating?.average || '0')
        const ratingB = parseFloat(b.rating?.average || '0')
        comparison = ratingA - ratingB
        break
      case 'anilist_rating':
        const anilistA = a.anilist?.average_score || 0
        const anilistB = b.anilist?.average_score || 0
        comparison = anilistA - anilistB
        break
    }

    // If values are equal (or for alphabetical), sort by title ascending (always)
    if (comparison === 0) {
      return a.title.localeCompare(b.title)
    }

    return comparison * direction
  })

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
          anime={anime}
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
