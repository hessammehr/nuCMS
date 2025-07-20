import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../utils/api';
import type { Page } from '@shared/types';

function Pages() {
  const [pages, setPages] = useState<Page[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');

  const fetchPages = async (page = 1) => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '10'
      });
      
      if (statusFilter) params.append('status', statusFilter);
      if (search) params.append('search', search);

      const response = await api.get(`/pages?${params}`);
      
      if (response.data.success) {
        setPages(response.data.data.items);
        setTotalPages(response.data.data.totalPages);
        setCurrentPage(response.data.data.page);
      } else {
        setError(response.data.error || 'Failed to fetch pages');
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to fetch pages');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPages(1);
  }, [statusFilter, search]);

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this page?')) return;
    
    try {
      const response = await api.delete(`/pages/${id}`);
      if (response.data.success) {
        setPages(pages.filter(page => page.id !== id));
      } else {
        setError(response.data.error || 'Failed to delete page');
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to delete page');
    }
  };

  if (loading && pages.length === 0) {
    return <div className="loading">Loading pages...</div>;
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1>Pages</h1>
        <Link to="/pages/new" className="btn">Create New Page</Link>
      </div>

      {error && (
        <div className="error-message" style={{ marginBottom: '1rem' }}>
          {error}
        </div>
      )}

      <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', alignItems: 'center' }}>
        <div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{ padding: '0.5rem', border: '1px solid #ddd', borderRadius: '4px' }}
          >
            <option value="">All Statuses</option>
            <option value="PUBLISHED">Published</option>
            <option value="DRAFT">Draft</option>
            <option value="PRIVATE">Private</option>
          </select>
        </div>
        
        <div style={{ flex: 1 }}>
          <input
            type="text"
            placeholder="Search pages..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ width: '100%', padding: '0.5rem', border: '1px solid #ddd', borderRadius: '4px' }}
          />
        </div>
      </div>

      {pages.length > 0 ? (
        <>
          <div className="posts-grid">
            {pages.map(page => (
              <div key={page.id} className="post-card">
                <h3>{page.title}</h3>
                <div className="post-meta">
                  <span>Status: <strong>{page.status}</strong></span>
                  <span> • </span>
                  <span>By {page.author?.username}</span>
                  <span> • </span>
                  <span>{new Date(page.createdAt).toLocaleDateString()}</span>
                </div>
                <div className="post-actions">
                  <Link to={`/pages/${page.id}/edit`} className="btn btn-secondary">
                    Edit
                  </Link>
                  <button 
                    onClick={() => handleDelete(page.id)}
                    className="btn btn-danger"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>

          {totalPages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', marginTop: '2rem' }}>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                <button
                  key={page}
                  onClick={() => fetchPages(page)}
                  className={`btn ${page === currentPage ? '' : 'btn-secondary'}`}
                  disabled={loading}
                >
                  {page}
                </button>
              ))}
            </div>
          )}
        </>
      ) : (
        <div className="post-card">
          <p>No pages found. <Link to="/pages/new">Create your first page</Link>!</p>
        </div>
      )}
    </div>
  );
}

export default Pages;
