import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../utils/api';
import type { Post, Page } from '@shared/types';

function Dashboard() {
  const [stats, setStats] = useState({
    posts: 0,
    pages: 0,
    media: 0
  });
  const [recentPosts, setRecentPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [postsRes, pagesRes, mediaRes] = await Promise.all([
          api.get('/posts?limit=5'),
          api.get('/pages?limit=5'),
          api.get('/media?limit=1')
        ]);

        if (postsRes.data.success) {
          setStats(prev => ({ ...prev, posts: postsRes.data.data.total }));
          setRecentPosts(postsRes.data.data.items);
        }

        if (pagesRes.data.success) {
          setStats(prev => ({ ...prev, pages: pagesRes.data.data.total }));
        }

        if (mediaRes.data.success) {
          setStats(prev => ({ ...prev, media: mediaRes.data.data.total }));
        }
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) {
    return <div className="loading">Loading dashboard...</div>;
  }

  return (
    <div>
      <h1>Dashboard</h1>
      
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
        gap: '1.5rem', 
        marginBottom: '2rem' 
      }}>
        <div className="post-card">
          <h3>{stats.posts}</h3>
          <p>Posts</p>
          <Link to="/posts" className="btn">Manage Posts</Link>
        </div>
        
        <div className="post-card">
          <h3>{stats.pages}</h3>
          <p>Pages</p>
          <Link to="/pages" className="btn">Manage Pages</Link>
        </div>
        
        <div className="post-card">
          <h3>{stats.media}</h3>
          <p>Media Files</p>
          <Link to="/media" className="btn">Manage Media</Link>
        </div>
      </div>

      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h2>Recent Posts</h2>
          <Link to="/posts/new" className="btn">Create New Post</Link>
        </div>
        
        {recentPosts.length > 0 ? (
          <div className="posts-grid">
            {recentPosts.map(post => (
              <div key={post.id} className="post-card">
                <h3>{post.title}</h3>
                <p>{post.excerpt || 'No excerpt available'}</p>
                <div className="post-meta">
                  <span>Status: {post.status}</span>
                  <span> • </span>
                  <span>By {post.author?.username}</span>
                  <span> • </span>
                  <span>{new Date(post.createdAt).toLocaleDateString()}</span>
                </div>
                <div className="post-actions">
                  <Link to={`/posts/${post.id}/edit`} className="btn btn-secondary">
                    Edit
                  </Link>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="post-card">
            <p>No posts yet. <Link to="/posts/new">Create your first post</Link>!</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default Dashboard;
