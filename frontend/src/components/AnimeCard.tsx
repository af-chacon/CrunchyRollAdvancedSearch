import { useState } from 'react'
import { Anime, FilterState } from '../types'

interface AnimeCardProps {
  anime: Anime
  onFilterChange: (filter: FilterState) => void
  currentFilter: FilterState
}

export function AnimeCard({ anime, onFilterChange, currentFilter }: AnimeCardProps) {
  const [tagsExpanded, setTagsExpanded] = useState(false)
  const crunchyrollUrl = `https://www.crunchyroll.com/series/${anime.id}`

  // Extract poster URL from images.poster_tall array (use 480x720 size)
  const getPosterUrl = () => {
    const posterTall = anime.images?.poster_tall?.[0]
    if (!posterTall || posterTall.length === 0) return null
    // Try to find 480x720, or fallback to any available size
    const preferred = posterTall.find(img => img.width === 480 && img.height === 720)
    return preferred?.source || posterTall[posterTall.length - 1]?.source || null
  }

  const posterUrl = getPosterUrl()

  const handleTagClick = (tag: string, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    const newTags = { ...currentFilter.tags }
    newTags[tag] = 'include'
    onFilterChange({ ...currentFilter, tags: newTags })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleContentDescriptorClick = (descriptor: string, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    const newDescriptors = { ...currentFilter.contentDescriptors }
    newDescriptors[descriptor] = 'include'
    onFilterChange({ ...currentFilter, contentDescriptors: newDescriptors })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleDubbedClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    onFilterChange({ ...currentFilter, dubbed: 'include' })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleSubbedClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    onFilterChange({ ...currentFilter, subbed: 'include' })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleMatureClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    onFilterChange({ ...currentFilter, mature: 'include' })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <div className="anime-card">
      <a href={crunchyrollUrl} target="_blank" rel="noopener noreferrer" className="anime-card-link">
        {posterUrl && (
          <img
            src={posterUrl}
            alt={anime.title}
            className="anime-poster"
            loading="lazy"
            decoding="async"
          />
        )}
        <div className="anime-info">
          <h3>{anime.title}</h3>
          {anime.anilist?.studios && anime.anilist.studios.length > 0 && (
            <div className="anime-studios">
              {anime.anilist.studios.join(', ')}
            </div>
          )}
        <div className="anime-meta-container">
          <div className="anime-meta crunchyroll">
            <span className="meta-source">Crunchyroll:</span>
            <span className="rating">⭐ {anime.rating?.average || 'N/A'}</span>
            <span className="year">📺 {anime.series_metadata?.series_launch_year || 'N/A'}</span>
          </div>
          {anime.anilist && (
            <div className="anime-meta anilist">
              <span className="meta-source">AniList:</span>
              {anime.anilist.average_score && (
                <span className="rating">📊 {anime.anilist.average_score}%</span>
              )}
              {anime.anilist.start_date?.year && (
                <span className="year">📅 {anime.anilist.start_date.year}</span>
              )}
            </div>
          )}
        </div>
        <div className="anime-episodes">
          <span>{anime.series_metadata?.episode_count || 0} eps</span>
        </div>
        <p className="description">{anime.description}</p>
        <div className="tags">
          {anime.series_metadata?.is_mature && (
            <span className="tag mature clickable" onClick={handleMatureClick}>
              Mature
            </span>
          )}
          {anime.series_metadata?.is_dubbed && (
            <span className="tag clickable" onClick={handleDubbedClick}>
              Dubbed
            </span>
          )}
          {anime.series_metadata?.is_subbed && (
            <span className="tag clickable" onClick={handleSubbedClick}>
              Subbed
            </span>
          )}
          {anime.series_metadata?.content_descriptors?.map(desc => (
            <span
              key={desc}
              className="tag descriptor clickable"
              onClick={(e) => handleContentDescriptorClick(desc, e)}
            >
              {desc}
            </span>
          ))}
        </div>
        </div>
      </a>
      {anime.anilist?.tags && anime.anilist.tags.length > 0 && (
        <div className="anime-card-tags-section">
          <button
            type="button"
            className="tags-toggle"
            onClick={(e) => {
              e.preventDefault()
              setTagsExpanded(!tagsExpanded)
            }}
          >
            <span>Tags ({anime.anilist.tags.length})</span>
            <span className="toggle-icon">{tagsExpanded ? '▼' : '▶'}</span>
          </button>
          {tagsExpanded && (
            <div className="anilist-tags">
              {anime.anilist.tags.map(tag => (
                <span
                  key={tag}
                  className="anilist-tag clickable"
                  onClick={(e) => handleTagClick(tag, e)}
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
