import { useState, useEffect, useCallback, useRef } from "react";
import "./App.css";

const BASE_URL = "https://api.disneyapi.dev";

const getFavorites = () => JSON.parse(localStorage.getItem("disney-favorites") || "[]");
const saveFavorites = (list) => localStorage.setItem("disney-favorites", JSON.stringify(list));

function TagList({ label, items }) {
  if (!items || items.length === 0) return null;
  return (
    <div className="tag-group">
      <span className="label">{label}</span>
      <div className="tag-list">
        {items.slice(0, 6).map((item) => (
          <span key={item} className="tag">{item}</span>
        ))}
        {items.length > 6 && <span className="tag muted">+{items.length - 6} more</span>}
      </div>
    </div>
  );
}

function MovieCard({ character, onSelect, onToggleFavorite, isFavorite }) {
  return (
    <div className="card" onClick={() => onSelect(character._id)}>
      <div className="card-poster">
        {character.imageUrl ? (
          <img src={character.imageUrl} alt={character.name} loading="lazy" />
        ) : (
          <div className="no-poster"><span>🎬</span><p>No Image</p></div>
        )}
        <div className="card-overlay">
          <button
            className={`watchlist-btn ${isFavorite ? "added" : ""}`}
            onClick={(e) => { e.stopPropagation(); onToggleFavorite(character); }}
          >
            {isFavorite ? "♥ Saved" : "♡ Favorite"}
          </button>
        </div>
      </div>
      <div className="card-body">
        {character.films?.length > 0 && (
          <span className="card-type">🎬 {character.films.length} film{character.films.length !== 1 ? "s" : ""}</span>
        )}
        <h3 className="card-title">{character.name}</h3>
        {character.films?.[0] && <p className="card-year">{character.films[0]}</p>}
      </div>
    </div>
  );
}

function MovieModal({ characterId, onClose, onToggleFavorite, favorites }) {
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`${BASE_URL}/character/${characterId}`)
      .then((r) => r.json())
      .then((data) => { setDetail(data.data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [characterId]);

  const isFavorite = favorites.some((c) => c._id === characterId);

  useEffect(() => {
    const handleKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose]);

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>✕</button>
        {loading ? (
          <div className="modal-loading"><div className="spinner" /></div>
        ) : detail ? (
          <div className="modal-inner">
            <div className="modal-poster">
              {detail.imageUrl ? (
                <img src={detail.imageUrl} alt={detail.name} />
              ) : (
                <div className="no-poster large"><span>🎬</span></div>
              )}
              <button
                className={`watchlist-btn big ${isFavorite ? "added" : ""}`}
                onClick={() => onToggleFavorite({
                  _id: detail._id, name: detail.name,
                  imageUrl: detail.imageUrl, films: detail.films,
                  tvShows: detail.tvShows
                })}
              >
                {isFavorite ? "♥ In Favorites" : "♡ Add to Favorites"}
              </button>
              {detail.sourceUrl && (
                <a className="wiki-link" href={detail.sourceUrl} target="_blank" rel="noreferrer">
                  View on Disney Wiki ↗
                </a>
              )}
            </div>
            <div className="modal-info">
              <h2 className="modal-title">{detail.name}</h2>
              <TagList label="🎬 Films" items={detail.films} />
              <TagList label="📺 TV Shows" items={detail.tvShows} />
              <TagList label="🎞 Short Films" items={detail.shortFilms} />
              <TagList label="🎮 Video Games" items={detail.videoGames} />
              <TagList label="🎡 Park Attractions" items={detail.parkAttractions} />
              <TagList label="🤝 Allies" items={detail.allies} />
              <TagList label="⚔️ Enemies" items={detail.enemies} />
            </div>
          </div>
        ) : (
          <p style={{ padding: "2rem", color: "var(--muted)" }}>Could not load details.</p>
        )}
      </div>
    </div>
  );
}

function FavoritesSidebar({ favorites, onSelect, onRemove, onClose }) {
  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <h2>My Favorites</h2>
        <button className="icon-btn" onClick={onClose}>✕</button>
      </div>
      {favorites.length === 0 ? (
        <p className="sidebar-empty">No movies saved yet.<br />Click "♡ Favorite" on any result.</p>
      ) : (
        <ul className="sidebar-list">
          {favorites.map((c) => (
            <li key={c._id} className="sidebar-item" onClick={() => onSelect(c._id)}>
              {c.imageUrl
                ? <img src={c.imageUrl} alt={c.name} />
                : <div className="sidebar-no-poster">🎬</div>
              }
              <div className="sidebar-meta">
                <p className="sidebar-title">{c.name}</p>
                {c.films?.[0] && <p className="sidebar-year">{c.films[0]}</p>}
              </div>
              <button
                className="sidebar-remove"
                onClick={(e) => { e.stopPropagation(); onRemove(c._id); }}
              >✕</button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default function App() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [selectedID, setSelectedID] = useState(null);
  const [favorites, setFavorites] = useState(getFavorites);
  const [showFavorites, setShowFavorites] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [searched, setSearched] = useState("");
  const [browsing, setBrowsing] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => { inputRef.current?.focus(); }, []);
  useEffect(() => { saveFavorites(favorites); }, [favorites]);

  const browseMovies = useCallback(async (p) => {
    setLoading(true); setError(""); setBrowsing(true);
    try {
      const res = await fetch(`${BASE_URL}/character?page=${p}`);
      const data = await res.json();
      const withFilms = (data.data || []).filter((c) => c.films && c.films.length > 0);
      setResults(withFilms);
      setTotalPages(data.info?.totalPages || 1);
      setTotalCount(data.info?.count || 0);
      setSearched("");
    } catch {
      setError("Network error. Please check your connection.");
    } finally {
      setLoading(false);
    }
  }, []);

  const searchByMovie = useCallback(async (q, p) => {
    if (!q.trim()) return browseMovies(1);
    setLoading(true); setError(""); setBrowsing(false);
    try {
      const res = await fetch(`${BASE_URL}/character?films=${encodeURIComponent(q)}&page=${p}`);
      const data = await res.json();
      const items = Array.isArray(data.data) ? data.data : data.data ? [data.data] : [];
      if (items.length > 0) {
        setResults(items);
        setTotalPages(data.info?.totalPages || 1);
        setTotalCount(data.info?.count || items.length);
        setSearched(q);
      } else {
        setResults([]);
        setError(`No results found for "${q}". Try "Aladdin", "Moana", or "Frozen".`);
        setTotalPages(0); setTotalCount(0);
      }
    } catch {
      setError("Network error. Please check your connection.");
    } finally {
      setLoading(false);
    }
  }, [browseMovies]);

  useEffect(() => { browseMovies(1); }, [browseMovies]);

  const handleSubmit = (e) => { e.preventDefault(); setPage(1); searchByMovie(query, 1); };

  const handlePageChange = (newPage) => {
    setPage(newPage);
    if (browsing) browseMovies(newPage); else searchByMovie(searched, newPage);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleToggleFavorite = (character) => {
    setFavorites((prev) => {
      const exists = prev.some((c) => c._id === character._id);
      return exists ? prev.filter((c) => c._id !== character._id) : [...prev, character];
    });
  };

  const suggestions = ["Aladdin", "Moana", "Encanto", "The Lion King", "Frozen", "Lilo & Stitch"];

  return (
    <div className={`app ${showFavorites ? "sidebar-open" : ""}`}>
      <div className="grain" aria-hidden="true" />

      <header className="header">
        <div className="header-brand">
          <div className="logo-mark">✦</div>
          <div>
            <h1 className="logo">DISNEY VAULT</h1>
            <p className="tagline">Search Disney movies & their characters</p>
          </div>
        </div>
        <button className="watchlist-toggle" onClick={() => setShowFavorites((s) => !s)}>
          <span className="wl-icon">♥</span>
          Favorites
          {favorites.length > 0 && <span className="wl-badge">{favorites.length}</span>}
        </button>
      </header>

      <section className="search-section">
        <form className="search-form" onSubmit={handleSubmit}>
          <div className="search-bar">
            <span className="search-icon">⌕</span>
            <input
              ref={inputRef}
              type="text"
              className="search-input"
              placeholder='Search by movie title e.g. "Aladdin", "Moana", "Frozen"...'
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <button type="submit" className="search-btn" disabled={loading}>
              {loading ? <span className="btn-spinner" /> : "Search"}
            </button>
          </div>
          <div className="filter-row">
            {suggestions.map((s) => (
              <button
                key={s}
                type="button"
                className={`filter-btn ${searched === s ? "active" : ""}`}
                onClick={() => { setQuery(s); setPage(1); searchByMovie(s, 1); }}
              >
                {s}
              </button>
            ))}
          </div>
          {query && (
            <button type="button" className="clear-btn"
              onClick={() => { setQuery(""); setPage(1); browseMovies(1); }}>
              ✕ Clear — Browse all
            </button>
          )}
        </form>
      </section>

      <main className="main">
        {error && <p className="error-msg">{error}</p>}
        {results.length > 0 && (
          <>
            <p className="results-count">
              {browsing
                ? <>Browsing Disney movie characters — Page <strong>{page}</strong> of <strong>{totalPages}</strong></>
                : <>Found <strong>{totalCount}</strong> character{totalCount !== 1 ? "s" : ""} in "<em>{searched}</em>"</>
              }
            </p>
            <div className="grid">
              {results.map((character) => (
                <MovieCard
                  key={character._id}
                  character={character}
                  onSelect={setSelectedID}
                  onToggleFavorite={handleToggleFavorite}
                  isFavorite={favorites.some((c) => c._id === character._id)}
                />
              ))}
            </div>
            {totalPages > 1 && (
              <div className="pagination">
                <button className="page-btn" onClick={() => handlePageChange(page - 1)} disabled={page === 1}>← Prev</button>
                <span className="page-info">Page {page} / {totalPages}</span>
                <button className="page-btn" onClick={() => handlePageChange(page + 1)} disabled={page === totalPages}>Next →</button>
              </div>
            )}
          </>
        )}
        {!loading && results.length === 0 && !error && (
          <div className="empty-state">
            <div className="empty-icon">✦</div>
            <h2>Find Your Favorite Film</h2>
            <p>Type a Disney movie title to see all its characters.</p>
          </div>
        )}
      </main>

      {selectedID && (
        <MovieModal
          characterId={selectedID}
          onClose={() => setSelectedID(null)}
          onToggleFavorite={handleToggleFavorite}
          favorites={favorites}
        />
      )}
      {showFavorites && (
        <>
          <div className="sidebar-backdrop" onClick={() => setShowFavorites(false)} />
          <FavoritesSidebar
            favorites={favorites}
            onSelect={(id) => { setSelectedID(id); setShowFavorites(false); }}
            onRemove={(id) => setFavorites((prev) => prev.filter((c) => c._id !== id))}
            onClose={() => setShowFavorites(false)}
          />
        </>
      )}
    </div>
  );
}