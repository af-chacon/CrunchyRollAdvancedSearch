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

function App() {
  const [anime, setAnime] = useState<Anime[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [searchTerm, setSearchTerm] = useState<string>('')
  const [currentPage, setCurrentPage] = useState<number>(1)
  const [itemsPerPage, setItemsPerPage] = useState<number>(16)
  const [dataTimestamp, setDataTimestamp] = useState<string>('')
  const [filter, setFilter] = useState<FilterState>({
    mature: 'default',
    dubbed: 'default',
    subbed: 'default',
    minRating: 0,
    contentDescriptors: {},
    genres: {},
    tags: {},
    status: {},
    studios: {}
  })

  const clearFilters = () => {
    setFilter({
      mature: 'default',
      dubbed: 'default',
      subbed: 'default',
      minRating: 0,
      contentDescriptors: {},
      genres: {},
      tags: {},
      status: {},
      studios: {}
    })
    setSearchTerm('')
  }

  useEffect(() => {
    // Add cache-busting parameter to force fetch of latest version
    const cacheBuster = import.meta.env.DEV
      ? `?v=${Date.now()}`
      : `?v=${import.meta.env.VITE_BUILD_TIME || Date.now()}`

    // Fetch anime data
    fetch(`/anime.json${cacheBuster}`)
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
    fetch(`/anime.json`, { method: 'HEAD' })
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
      anime.flatMap(item => item.content_descriptors || [])
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

  const filteredAnime = anime.filter(item => {
    const matchesSearch = item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.description.toLowerCase().includes(searchTerm.toLowerCase())

    // Tri-state filter logic: default = any, include = must have, exclude = must not have
    const matchesMature = filter.mature === 'default' ||
                         (filter.mature === 'include' && item.is_mature) ||
                         (filter.mature === 'exclude' && !item.is_mature)

    const matchesDubbed = filter.dubbed === 'default' ||
                         (filter.dubbed === 'include' && item.is_dubbed) ||
                         (filter.dubbed === 'exclude' && !item.is_dubbed)

    const matchesSubbed = filter.subbed === 'default' ||
                         (filter.subbed === 'include' && item.is_subbed) ||
                         (filter.subbed === 'exclude' && !item.is_subbed)

    const matchesRating = parseFloat(item.rating) >= filter.minRating

    // Content descriptor filters
    const matchesContentDescriptors = Object.entries(filter.contentDescriptors).every(([descriptor, filterValue]) => {
      if (filterValue === 'default') return true
      const hasDescriptor = item.content_descriptors.includes(descriptor)
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

    return matchesSearch && matchesMature && matchesDubbed && matchesSubbed && matchesRating && matchesContentDescriptors && matchesGenres && matchesTags && matchesStatus && matchesStudios
  })

  const totalPages = Math.ceil(filteredAnime.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const paginatedAnime = filteredAnime.slice(startIndex, startIndex + itemsPerPage)

  // Reset to page 1 when filters or items per page change
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
