import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../utils/api';
import type { Post } from '@shared/types';

function Posts() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');

  const fetchPosts = async (page = 1) => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '10'
      });
      
      if (statusFilter) params.append('status', statusFilter);
      if (search) params.append('search', search);

      const response = await api.get(`/posts?${params}`);
      
      if (response.data.success) {
        setPosts(response.data.data.items);
        setTotalPages(response.data.data.totalPages);
        setCurrentPage(response.data.data.page);
      } else {
        setError(response.data.error || 'Failed to fetch posts');
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to fetch posts');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts(1);
  }, [statusFilter, search]);

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this post?')) return;
    
    try {
      const response = await api.delete(`/posts/${id}`);
      if (response.data.success) {
        setPosts(posts.filter(post => post.id !== id));
      } else {
        setError(response.data.error || 'Failed to delete post');
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to delete post');
    }
  };

  if (loading && posts.length === 0) {
    return <div className="loading">Loading posts...</div>;
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1>Posts</h1>
        <Link to="/posts/new" className="btn">Create New Post</Link>
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
            placeholder="Search posts..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ width: '100%', padding: '0.5rem', border: '1px solid #ddd', borderRadius: '4px' }}
          />
        </div>
      </div>

      {posts.length > 0 ? (
        <>
          <div className="posts-grid">
            {posts.map(post => (
              <div key={post.id} className="post-card">
                <h3>{post.title}</h3>
                <p>{post.excerpt || 'No excerpt available'}</p>
                <div className="post-meta">
                  <span>Status: <strong>{post.status}</strong></span>
                  <span> • </span>
                  <span>By {post.author?.username}</span>
                  <span> • </span>
                  <span>{new Date(post.createdAt).toLocaleDateString()}</span>
                  {post.publishedAt && (
                    <>
                      <span> • </span>
                      <span>Published: {new Date(post.publishedAt).toLocaleDateString()}</span>
                    </>
                  )}
                </div>
                <div className="post-actions">
                  <Link to={`/posts/${post.id}/edit`} className="btn btn-secondary">
                    Edit
                  </Link>
                  <button 
                    onClick={() => handleDelete(post.id)}
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
                  onClick={() => fetchPosts(page)}
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
          <p>No posts found. <Link to="/posts/new">Create your first post</Link>!</p>
        </div>
      )}
    </div>
  );
}

export default Posts;
