import { useState, useEffect } from 'react'
import './App.css'
import { Anime, FilterState } from './types'

function App() {
  const [anime, setAnime] = useState<Anime[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [searchTerm, setSearchTerm] = useState<string>('')
  const [currentPage, setCurrentPage] = useState<number>(1)
  const [itemsPerPage, setItemsPerPage] = useState<number>(16)
  const [filter, setFilter] = useState<FilterState>({
    mature: false,
    dubbed: false,
    subbed: false
  })

  useEffect(() => {
    fetch('/anime.json', {
      cache: 'force-cache'
    })
      .then(res => res.json())
      .then(data => {
        setAnime(data)
        setLoading(false)
      })
      .catch(err => {
        console.error('Error loading anime:', err)
        setLoading(false)
      })
  }, [])

  const filteredAnime = anime.filter(item => {
    const matchesSearch = item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.description.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesMature = !filter.mature || item.is_mature
    const matchesDubbed = !filter.dubbed || item.is_dubbed
    const matchesSubbed = !filter.subbed || item.is_subbed
    return matchesSearch && matchesMature && matchesDubbed && matchesSubbed
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
      <header>
        <h1>Crunchyroll Advanced Search</h1>
        <p className="subtitle">{anime.length} anime available</p>
      </header>

      <div className="controls">
        <input
          type="text"
          placeholder="Search anime..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input"
        />
        <div className="controls-row">
          <div className="filters">
          <label>
            <input
              type="checkbox"
              checked={filter.mature}
              onChange={(e) => setFilter({...filter, mature: e.target.checked})}
            />
            Mature Only
          </label>
          <label>
            <input
              type="checkbox"
              checked={filter.dubbed}
              onChange={(e) => setFilter({...filter, dubbed: e.target.checked})}
            />
            Dubbed
          </label>
          <label>
            <input
              type="checkbox"
              checked={filter.subbed}
              onChange={(e) => setFilter({...filter, subbed: e.target.checked})}
            />
            Subbed
          </label>
        </div>
        <div className="per-page-selector">
          <label htmlFor="itemsPerPage">Show per page:</label>
          <select
            id="itemsPerPage"
            value={itemsPerPage}
            onChange={(e) => setItemsPerPage(Number(e.target.value))}
          >
            <option value="8">8</option>
            <option value="16">16</option>
            <option value="32">32</option>
            <option value="64">64</option>
            <option value="100">100</option>
          </select>
        </div>
      </div>
      </div>

      <p className="results-count">{filteredAnime.length} results (Page {currentPage} of {totalPages})</p>

      <div className="anime-grid">
        {paginatedAnime.map(item => (
          <div key={item.id} className="anime-card">
            {item.poster && (
              <img
                src={item.poster}
                alt={item.title}
                className="anime-poster"
                loading="lazy"
                decoding="async"
              />
            )}
            <div className="anime-info">
              <h3>{item.title}</h3>
              <div className="anime-meta">
                <span className="rating">⭐ {item.rating}</span>
                <span className="year">{item.series_launch_year}</span>
                <span className="episodes">{item.episode_count} eps</span>
              </div>
              <p className="description">{item.description}</p>
              <div className="tags">
                {item.is_mature && <span className="tag mature">Mature</span>}
                {item.is_dubbed && <span className="tag">Dubbed</span>}
                {item.is_subbed && <span className="tag">Subbed</span>}
                {item.content_descriptors?.map(desc => (
                  <span key={desc} className="tag descriptor">{desc}</span>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      {totalPages > 1 && (
        <div className="pagination">
          <button
            type="button"
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
          >
            Previous
          </button>
          <span className="page-info">
            Page {currentPage} of {totalPages}
          </span>
          <button
            type="button"
            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
            disabled={currentPage === totalPages}
          >
            Next
          </button>
        </div>
      )}
    </div>
  )
}

export default App
