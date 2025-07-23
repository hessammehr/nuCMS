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

  const handleSaveQuick = () => {
    handleSave(page.status);
  };

  return (
    <div className="fullscreen-editor-wrapper">
      {error && (
        <div className="error-message" style={{ position: 'fixed', top: '10px', left: '50%', transform: 'translateX(-50%)', zIndex: 1000, maxWidth: '500px' }}>
          {error}
        </div>
      )}

      {success && (
        <div className="success-message" style={{ position: 'fixed', top: '10px', left: '50%', transform: 'translateX(-50%)', zIndex: 1000, maxWidth: '500px' }}>
          {success}
        </div>
      )}

      <GutenbergEditor
        content={page.content || ''}
        onChange={(content) => setPage(prev => ({ ...prev, content }))}
        title={page.title || ''}
        onTitleChange={handleTitleChange}
        onSave={handleSaveQuick}
        saving={saving}
        slug={page.slug || ''}
        status={page.status || 'DRAFT'}
        onSlugChange={(slug) => setPage(prev => ({ ...prev, slug }))}
        onStatusChange={(status) => setPage(prev => ({ ...prev, status: status as any }))}
        onExit={() => navigate('/pages')}
      />
    </div>
  );
}

export default PageEditor;
