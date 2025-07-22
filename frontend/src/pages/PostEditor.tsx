import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../utils/api';
import GutenbergEditor from '../components/GutenbergEditor';
import type { Post, CreatePostRequest, UpdatePostRequest } from '@shared/types';

function PostEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = Boolean(id);

  const [post, setPost] = useState<Partial<Post>>({
    title: '',
    slug: '',
    content: '',
    excerpt: '',
    status: 'DRAFT'
  });
  const [loading, setLoading] = useState(isEditing);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (isEditing && id) {
      fetchPost(parseInt(id));
    }
  }, [id, isEditing]);

  const fetchPost = async (postId: number) => {
    try {
      const response = await api.get(`/posts/${postId}`);
      if (response.data.success) {
        setPost(response.data.data);
      } else {
        setError(response.data.error || 'Failed to fetch post');
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to fetch post');
    } finally {
      setLoading(false);
    }
  };

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9 -]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
  };

  const handleTitleChange = (title: string) => {
    setPost(prev => ({
      ...prev,
      title,
      slug: prev.slug || generateSlug(title)
    }));
  };

  const handleSave = async (status?: 'DRAFT' | 'PUBLISHED' | 'PRIVATE') => {
    if (!post.title || !post.slug) {
      setError('Title and slug are required');
      return;
    }

    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const postData = {
        ...post,
        status: status || post.status
      };

      let response;
      if (isEditing) {
        response = await api.put(`/posts/${id}`, postData);
      } else {
        response = await api.post('/posts', postData);
      }

      if (response.data.success) {
        setSuccess(isEditing ? 'Post updated successfully!' : 'Post created successfully!');
        setPost(response.data.data);
        
        if (!isEditing) {
          // Redirect to edit mode after creating
          navigate(`/posts/${response.data.data.id}/edit`, { replace: true });
        }
      } else {
        setError(response.data.error || 'Failed to save post');
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to save post');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="loading">Loading post...</div>;
  }

  const handleSaveQuick = () => {
    handleSave(post.status);
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1>{isEditing ? 'Edit Post' : 'Create New Post'}</h1>
        <button 
          onClick={() => navigate('/posts')}
          className="btn btn-secondary"
        >
          Back to Posts
        </button>
      </div>

      {error && (
        <div className="error-message" style={{ marginBottom: '1rem' }}>
          {error}
        </div>
      )}

      {success && (
        <div className="success-message" style={{ marginBottom: '1rem' }}>
          {success}
        </div>
      )}

      <div className="editor-container">
        <div className="editor-header">
          <input
            type="text"
            placeholder="Post title"
            value={post.title || ''}
            onChange={(e) => handleTitleChange(e.target.value)}
            disabled={saving}
          />

          <div className="editor-meta">
            <div style={{ flex: 1 }}>
              <label>Slug:</label>
              <input
                type="text"
                value={post.slug || ''}
                onChange={(e) => setPost(prev => ({ ...prev, slug: e.target.value }))}
                disabled={saving}
                style={{ width: '100%' }}
              />
            </div>
            
            <div style={{ flex: 1, marginLeft: '1rem' }}>
              <label>Excerpt:</label>
              <input
                type="text"
                value={post.excerpt || ''}
                onChange={(e) => setPost(prev => ({ ...prev, excerpt: e.target.value }))}
                disabled={saving}
                style={{ width: '100%' }}
              />
            </div>
            
            <div>
              <label>Status:</label>
              <select
                value={post.status || 'DRAFT'}
                onChange={(e) => setPost(prev => ({ ...prev, status: e.target.value as any }))}
                disabled={saving}
              >
                <option value="DRAFT">Draft</option>
                <option value="PUBLISHED">Published</option>
                <option value="PRIVATE">Private</option>
              </select>
            </div>
          </div>

          <div className="editor-actions">
            <button 
              onClick={() => handleSave('DRAFT')}
              disabled={saving}
              className="btn btn-secondary"
            >
              {saving ? 'Saving...' : 'Save Draft'}
            </button>
            <button 
              onClick={() => handleSave('PUBLISHED')}
              disabled={saving}
              className="btn"
            >
              {saving ? 'Publishing...' : 'Publish'}
            </button>
          </div>
        </div>

        <div className="editor-content">
          <GutenbergEditor
            content={post.content || ''}
            onChange={(content) => setPost(prev => ({ ...prev, content }))}
          />
        </div>
      </div>
    </div>
  );
}

export default PostEditor;
