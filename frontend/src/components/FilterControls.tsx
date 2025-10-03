import { useState, useMemo } from 'react'
import { FilterState, FilterValue, Anime } from '../types'
import { TriStateFilter } from './TriStateFilter'

interface FilterControlsProps {
  filter: FilterState
  onFilterChange: (filter: FilterState) => void
  itemsPerPage: number
  onItemsPerPageChange: (value: number) => void
  onClearFilters: () => void
  availableGenres: string[]
  availableContentDescriptors: string[]
  availableTags: string[]
  availableStatuses: string[]
  availableStudios: string[]
  anime: Anime[]
}

export function FilterControls({
  filter,
  onFilterChange,
  itemsPerPage,
  onItemsPerPageChange,
  onClearFilters,
  availableGenres,
  availableContentDescriptors,
  availableTags,
  availableStatuses,
  availableStudios,
  anime
}: FilterControlsProps) {
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    basic: true,
    genres: false,
    contentWarnings: false,
    tags: false,
    status: false,
    studios: false
  })
  const [tagSearch, setTagSearch] = useState('')
  const [studioSearch, setStudioSearch] = useState('')

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }))
  }

  const filteredTags = availableTags.filter(tag =>
    tag.toLowerCase().includes(tagSearch.toLowerCase())
  )

  const filteredStudios = availableStudios.filter(studio =>
    studio.toLowerCase().includes(studioSearch.toLowerCase())
  )

  const formatLabel = (label: string) => {
    return label
      .split('_')
      .map(word => word.charAt(0) + word.slice(1).toLowerCase())
      .join(' ')
  }

  const getFilterCounts = (filterObj: Record<string, FilterValue>) => {
    const included = Object.values(filterObj).filter(v => v === 'include').length
    const excluded = Object.values(filterObj).filter(v => v === 'exclude').length
    return { included, excluded }
  }

  const getBasicFilterCount = () => {
    let count = 0
    if (filter.mature !== 'default') count++
    if (filter.dubbed !== 'default') count++
    if (filter.subbed !== 'default') count++
    if (filter.minRating > 0) count++
    return count
  }

  // Calculate count for a specific filter option
  const getCountForTag = useMemo(() => (tag: string) => {
    return anime.filter(item => item.anilist?.tags?.includes(tag)).length
  }, [anime])

  const getCountForGenre = useMemo(() => (genre: string) => {
    return anime.filter(item => item.anilist?.genres?.includes(genre)).length
  }, [anime])

  const getCountForStudio = useMemo(() => (studio: string) => {
    return anime.filter(item => item.anilist?.studios?.includes(studio)).length
  }, [anime])

  const getCountForStatus = useMemo(() => (status: string) => {
    return anime.filter(item => item.anilist?.status === status).length
  }, [anime])

  const getCountForContentDescriptor = useMemo(() => (descriptor: string) => {
    return anime.filter(item => item.content_descriptors?.includes(descriptor)).length
  }, [anime])

  const handleContentDescriptorChange = (descriptor: string, value: FilterValue) => {
    const newDescriptors = { ...filter.contentDescriptors }
    if (value === 'default') {
      delete newDescriptors[descriptor]
    } else {
      newDescriptors[descriptor] = value
    }
    onFilterChange({ ...filter, contentDescriptors: newDescriptors })
  }

  const handleGenreChange = (genre: string, value: FilterValue) => {
    const newGenres = { ...filter.genres }
    if (value === 'default') {
      delete newGenres[genre]
    } else {
      newGenres[genre] = value
    }
    onFilterChange({ ...filter, genres: newGenres })
  }

  const handleTagChange = (tag: string, value: FilterValue) => {
    const newTags = { ...filter.tags }
    if (value === 'default') {
      delete newTags[tag]
    } else {
      newTags[tag] = value
    }
    onFilterChange({ ...filter, tags: newTags })
  }

  const handleStatusChange = (status: string, value: FilterValue) => {
    const newStatuses = { ...filter.status }
    if (value === 'default') {
      delete newStatuses[status]
    } else {
      newStatuses[status] = value
    }
    onFilterChange({ ...filter, status: newStatuses })
  }

  const handleStudioChange = (studio: string, value: FilterValue) => {
    const newStudios = { ...filter.studios }
    if (value === 'default') {
      delete newStudios[studio]
    } else {
      newStudios[studio] = value
    }
    onFilterChange({ ...filter, studios: newStudios })
  }

  return (
    <>
      <div className="filter-section">
        <button
          type="button"
          className="section-toggle"
          onClick={() => toggleSection('basic')}
        >
          <div className="section-header">
            <span className="section-label">Basic Filters</span>
            {getBasicFilterCount() > 0 && (
              <span className="filter-count"> ({getBasicFilterCount()} active)</span>
            )}
          </div>
          <span className="toggle-icon">{expandedSections.basic ? '▼' : '▶'}</span>
        </button>
        {expandedSections.basic && (
          <div className="basic-filters-content">
            <div className="filters">
              <TriStateFilter
                label="Mature"
                value={filter.mature}
                onChange={(value) => onFilterChange({ ...filter, mature: value })}
              />
              <TriStateFilter
                label="Dubbed"
                value={filter.dubbed}
                onChange={(value) => onFilterChange({ ...filter, dubbed: value })}
              />
              <TriStateFilter
                label="Subbed"
                value={filter.subbed}
                onChange={(value) => onFilterChange({ ...filter, subbed: value })}
              />
            </div>
            <div className="rating-filter">
              <span className="rating-label">Min Rating:</span>
              <div className="star-rating">
                {[1, 2, 3, 4, 5].map(star => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => star < 5 && onFilterChange({ ...filter, minRating: star })}
                    className={`star-btn ${filter.minRating >= star && filter.minRating > 0 ? 'filled' : ''} ${star === 5 ? 'disabled' : ''}`}
                    title={star === 5 ? 'Not available (max rating is 4 stars)' : `${star} stars or higher`}
                    disabled={star === 5}
                  >
                    {filter.minRating >= star && filter.minRating > 0 ? '⭐' : '☆'}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
      {availableGenres.length > 0 && (
        <div className="filter-section">
          <button
            type="button"
            className="section-toggle"
            onClick={() => toggleSection('genres')}
          >
            <div className="section-header">
              <span className="section-label">Genres ({availableGenres.length})</span>
              {(() => {
                const { included, excluded } = getFilterCounts(filter.genres)
                if (included > 0 || excluded > 0) {
                  return (
                    <span className="filter-count">
                      {included > 0 && `${included} inc`}
                      {included > 0 && excluded > 0 && ', '}
                      {excluded > 0 && `${excluded} exc`}
                    </span>
                  )
                }
                return null
              })()}
            </div>
            <span className="toggle-icon">{expandedSections.genres ? '▼' : '▶'}</span>
          </button>
          {expandedSections.genres && (
            <div className="content-descriptors">
              {availableGenres.map(genre => (
                <TriStateFilter
                  key={genre}
                  label={`${genre} (${getCountForGenre(genre)})`}
                  value={filter.genres[genre] || 'default'}
                  onChange={(value) => handleGenreChange(genre, value)}
                />
              ))}
            </div>
          )}
        </div>
      )}
      {availableContentDescriptors.length > 0 && (
        <div className="filter-section">
          <button
            type="button"
            className="section-toggle"
            onClick={() => toggleSection('contentWarnings')}
          >
            <div className="section-header">
              <span className="section-label">Content Warnings ({availableContentDescriptors.length})</span>
              {(() => {
                const { included, excluded } = getFilterCounts(filter.contentDescriptors)
                if (included > 0 || excluded > 0) {
                  return (
                    <span className="filter-count">
                      {included > 0 && `${included} inc`}
                      {included > 0 && excluded > 0 && ', '}
                      {excluded > 0 && `${excluded} exc`}
                    </span>
                  )
                }
                return null
              })()}
            </div>
            <span className="toggle-icon">{expandedSections.contentWarnings ? '▼' : '▶'}</span>
          </button>
          {expandedSections.contentWarnings && (
            <div className="content-descriptors">
              {availableContentDescriptors.map(descriptor => (
                <TriStateFilter
                  key={descriptor}
                  label={`${descriptor} (${getCountForContentDescriptor(descriptor)})`}
                  value={filter.contentDescriptors[descriptor] || 'default'}
                  onChange={(value) => handleContentDescriptorChange(descriptor, value)}
                />
              ))}
            </div>
          )}
        </div>
      )}
      {availableTags.length > 0 && (
        <div className="filter-section">
          <button
            type="button"
            className="section-toggle"
            onClick={() => toggleSection('tags')}
          >
            <div className="section-header">
              <span className="section-label">Tags ({availableTags.length})</span>
              {(() => {
                const { included, excluded } = getFilterCounts(filter.tags)
                if (included > 0 || excluded > 0) {
                  return (
                    <span className="filter-count">
                      {included > 0 && `${included} inc`}
                      {included > 0 && excluded > 0 && ', '}
                      {excluded > 0 && `${excluded} exc`}
                    </span>
                  )
                }
                return null
              })()}
            </div>
            <span className="toggle-icon">{expandedSections.tags ? '▼' : '▶'}</span>
          </button>
          {expandedSections.tags && (
            <>
              <input
                type="text"
                className="filter-search"
                placeholder="Search tags..."
                value={tagSearch}
                onChange={(e) => setTagSearch(e.target.value)}
              />
              <div className="content-descriptors">
                {filteredTags.map(tag => (
                  <TriStateFilter
                    key={tag}
                    label={`${tag} (${getCountForTag(tag)})`}
                    value={filter.tags[tag] || 'default'}
                    onChange={(value) => handleTagChange(tag, value)}
                  />
                ))}
              </div>
            </>
          )}
        </div>
        
      )}
      {availableStatuses.length > 0 && (
        <div className="filter-section">
          <button
            type="button"
            className="section-toggle"
            onClick={() => toggleSection('status')}
          >
            <div className="section-header">
              <span className="section-label">Status ({availableStatuses.length})</span>
              {(() => {
                const { included, excluded } = getFilterCounts(filter.status)
                if (included > 0 || excluded > 0) {
                  return (
                    <span className="filter-count">
                      {included > 0 && `${included} inc`}
                      {included > 0 && excluded > 0 && ', '}
                      {excluded > 0 && `${excluded} exc`}
                    </span>
                  )
                }
                return null
              })()}
            </div>
            <span className="toggle-icon">{expandedSections.status ? '▼' : '▶'}</span>
          </button>
          {expandedSections.status && (
            <div className="content-descriptors">
              {availableStatuses.map(status => (
                <TriStateFilter
                  key={status}
                  label={`${formatLabel(status)} (${getCountForStatus(status)})`}
                  value={filter.status[status] || 'default'}
                  onChange={(value) => handleStatusChange(status, value)}
                />
              ))}
            </div>
          )}
        </div>
      )}
      {availableStudios.length > 0 && (
        <div className="filter-section">
          <button
            type="button"
            className="section-toggle"
            onClick={() => toggleSection('studios')}
          >
            <div className="section-header">
              <span className="section-label">Studios ({availableStudios.length})</span>
              {(() => {
                const { included, excluded } = getFilterCounts(filter.studios)
                if (included > 0 || excluded > 0) {
                  return (
                    <span className="filter-count">
                      {included > 0 && `${included} inc`}
                      {included > 0 && excluded > 0 && ', '}
                      {excluded > 0 && `${excluded} exc`}
                    </span>
                  )
                }
                return null
              })()}
            </div>
            <span className="toggle-icon">{expandedSections.studios ? '▼' : '▶'}</span>
          </button>
          {expandedSections.studios && (
            <>
              <input
                type="text"
                className="filter-search"
                placeholder="Search studios..."
                value={studioSearch}
                onChange={(e) => setStudioSearch(e.target.value)}
              />
              <div className="content-descriptors">
                {filteredStudios.map(studio => (
                  <TriStateFilter
                    key={studio}
                    label={`${studio} (${getCountForStudio(studio)})`}
                    value={filter.studios[studio] || 'default'}
                    onChange={(value) => handleStudioChange(studio, value)}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      )}
      <div className="controls-row">
        <button
          type="button"
          onClick={onClearFilters}
          className="clear-filters-btn"
        >
          Clear Filters
        </button>
        <div className="per-page-selector">
          <label htmlFor="itemsPerPage">Show per page:</label>
          <select
            id="itemsPerPage"
            value={itemsPerPage}
            onChange={(e) => onItemsPerPageChange(Number(e.target.value))}
          >
            <option value="16">16</option>
            <option value="32">32</option>
            <option value="64">64</option>
            <option value="128">128</option>
          </select>
        </div>
      </div>
    </>
  )
}
