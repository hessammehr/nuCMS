import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../utils/api';
import GutenbergEditor from '../components/GutenbergEditor';
import type { Page, CreatePageRequest, UpdatePageRequest } from '@shared/types';

function PageEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = Boolean(id);

  const [page, setPage] = useState<Partial<Page>>({
    title: '',
    slug: '',
    content: '',
    status: 'DRAFT'
  });
  const [loading, setLoading] = useState(isEditing);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (isEditing && id) {
      fetchPage(parseInt(id));
    }
  }, [id, isEditing]);

  const fetchPage = async (pageId: number) => {
    try {
      const response = await api.get(`/pages/${pageId}`);
      if (response.data.success) {
        setPage(response.data.data);
      } else {
        setError(response.data.error || 'Failed to fetch page');
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to fetch page');
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
    setPage(prev => ({
      ...prev,
      title,
      slug: prev.slug || generateSlug(title)
    }));
  };

  const handleSave = async (status?: 'DRAFT' | 'PUBLISHED' | 'PRIVATE') => {
    if (!page.title || !page.slug) {
      setError('Title and slug are required');
      return;
    }

    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const pageData = {
        ...page,
        status: status || page.status
      };

      let response;
      if (isEditing) {
        response = await api.put(`/pages/${id}`, pageData);
      } else {
        response = await api.post('/pages', pageData);
      }

      if (response.data.success) {
        setSuccess(isEditing ? 'Page updated successfully!' : 'Page created successfully!');
        setPage(response.data.data);
        
        if (!isEditing) {
          // Redirect to edit mode after creating
          navigate(`/pages/${response.data.data.id}/edit`, { replace: true });
        }
      } else {
        setError(response.data.error || 'Failed to save page');
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to save page');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="loading">Loading page...</div>;
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1>{isEditing ? 'Edit Page' : 'Create New Page'}</h1>
        <button 
          onClick={() => navigate('/pages')}
          className="btn btn-secondary"
        >
          Back to Pages
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
            placeholder="Page title"
            value={page.title || ''}
            onChange={(e) => handleTitleChange(e.target.value)}
            disabled={saving}
          />

          <div className="editor-meta">
            <div style={{ flex: 1 }}>
              <label>Slug:</label>
              <input
                type="text"
                value={page.slug || ''}
                onChange={(e) => setPage(prev => ({ ...prev, slug: e.target.value }))}
                disabled={saving}
                style={{ width: '100%' }}
              />
            </div>
            
            <div>
              <label>Status:</label>
              <select
                value={page.status || 'DRAFT'}
                onChange={(e) => setPage(prev => ({ ...prev, status: e.target.value as any }))}
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
            content={page.content || ''}
            onChange={(content) => setPage(prev => ({ ...prev, content }))}
          />
        </div>
      </div>
    </div>
  );
}

export default PageEditor;
