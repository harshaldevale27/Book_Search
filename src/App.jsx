import React, { useState } from 'react';

const COVER_URL = (coverId, size = 'M') =>
  `https://covers.openlibrary.org/b/id/${coverId}-${size}.jpg`;

export default function App() {
  const [query, setQuery] = useState('');
  const [books, setBooks] = useState([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [dark, setDark] = useState(false);   // 🌙 NEW

  const hasMore = total !== null && books.length < total;

  async function fetchBooks(newSearch = false) {
    const trimmed = query.trim();
    if (!trimmed) {
      setError('⚠️ Please enter a book title.');
      return;
    }

    setLoading(true);
    setError(null);

    const nextPage = newSearch ? 1 : page;
    const url = `https://openlibrary.org/search.json?title=${encodeURIComponent(trimmed)}&page=${nextPage}`;

    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();

      if (newSearch) {
        setBooks(data.docs || []);
        setTotal(data.numFound || null);
        setPage(2);
      } else {
        setBooks(prev => [...prev, ...(data.docs || [])]);
        setPage(prev => prev + 1);
        if (total === null) setTotal(data.numFound || null);
      }

      if ((data.docs?.length ?? 0) === 0 && nextPage === 1) {
        setError('📭 No results found. Try another title!');
      }
    } catch (e) {
      console.error(e);
      setError('🚨 Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  function onSubmit(e) {
    e.preventDefault();
    fetchBooks(true);
  }

  return (
    <div className={`app ${dark ? 'dark' : ''}`}>
      <header className="header" role="banner">
        <h1>📚 Alex’s Book Search</h1>
        {/* <p className="subtitle">Find books with the Open Library API</p> */}
        <button className="dark-toggle" onClick={() => setDark(!dark)}>
          {dark ? '☀️ Light Mode' : '🌙 Dark Mode'}
        </button>
      </header>

      <main className="container">
        <form className="search" onSubmit={onSubmit}>
          <input
            type="text"
            placeholder="🔍 Search books by title, author, or ISBN"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <button type="submit" disabled={loading}>Search</button>
        </form>
        {error && (
          <div className="alert alert-error">
            {error}
            {error.includes('Network') && (
              <button onClick={() => fetchBooks(true)}>Retry</button>
            )}
          </div>
        )}
        {(!error && total !== null) && (
          <div className="results-meta">
            Showing <strong>{books.length}</strong> of <strong>{total}</strong> results
          </div>
        )}
        {loading && books.length === 0 && <div className="loading">⏳ Loading…</div>}

        <section className="grid">
          {books.map((b, idx) => (
            <article className="card" key={`${b.key || b.cover_i}-${idx}`}>
              <div className="thumb">
                {b.cover_i ? (
                  <img
                    src={COVER_URL(b.cover_i, 'M')}
                    alt={`Cover of ${b.title}`}
                    loading="lazy"
                  />
                ) : (
                  <div className="no-cover">No Cover</div>
                )}
              </div>
              <div className="info">
                <h2 className="title">{b.title}</h2>
                <p className="line"><span className="label">Authors:</span> {b.author_name?.join(', ') || 'Unknown'}</p>
                <p className="line"><span className="label">First Published:</span> {b.first_publish_year || 'N/A'}</p>
              </div>
            </article>
          ))}
        </section>
        {books.length > 0 && (
          <div className="load-more">
            <button
              onClick={() => fetchBooks(false)}
              disabled={loading || !hasMore}
            >
              {hasMore ? (loading ? 'Loading…' : 'Load More') : 'No More Results'}
            </button>
          </div>
        )}
      </main>

      <footer className="footer">
        <small>Data: <a href="https://openlibrary.org/developers/api">Open Library</a></small>
      </footer>
    </div>
  );
}
