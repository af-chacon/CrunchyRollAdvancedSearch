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
        {anime.poster && (
          <img
            src={anime.poster}
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
            <span className="rating">⭐ {anime.rating}</span>
            <span className="year">📺 {anime.series_launch_year}</span>
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
          <span>{anime.episode_count} eps</span>
        </div>
        <p className="description">{anime.description}</p>
        <div className="tags">
          {anime.is_mature && (
            <span className="tag mature clickable" onClick={handleMatureClick}>
              Mature
            </span>
          )}
          {anime.is_dubbed && (
            <span className="tag clickable" onClick={handleDubbedClick}>
              Dubbed
            </span>
          )}
          {anime.is_subbed && (
            <span className="tag clickable" onClick={handleSubbedClick}>
              Subbed
            </span>
          )}
          {anime.content_descriptors?.map(desc => (
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
