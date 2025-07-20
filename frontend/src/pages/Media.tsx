import React, { useEffect, useState, useRef } from 'react';
import { api } from '../utils/api';
import type { Media as MediaType } from '@shared/types';

function Media() {
  const [media, setMedia] = useState<MediaType[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [typeFilter, setTypeFilter] = useState('');
  const [search, setSearch] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchMedia = async (page = 1) => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20'
      });
      
      if (typeFilter) params.append('type', typeFilter);
      if (search) params.append('search', search);

      const response = await api.get(`/media?${params}`);
      
      if (response.data.success) {
        setMedia(response.data.data.items);
        setTotalPages(response.data.data.totalPages);
        setCurrentPage(response.data.data.page);
      } else {
        setError(response.data.error || 'Failed to fetch media');
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to fetch media');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMedia(1);
  }, [typeFilter, search]);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    setError('');
    setSuccess('');

    try {
      const uploadPromises = Array.from(files).map(async (file) => {
        const formData = new FormData();
        formData.append('file', file);

        const response = await api.post('/media/upload', formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        });

        return response.data;
      });

      const results = await Promise.all(uploadPromises);
      const successfulUploads = results.filter(result => result.success);
      
      if (successfulUploads.length > 0) {
        setSuccess(`Successfully uploaded ${successfulUploads.length} file(s)`);
        fetchMedia(currentPage); // Refresh the current page
      }

      const failedUploads = results.filter(result => !result.success);
      if (failedUploads.length > 0) {
        setError(`Failed to upload ${failedUploads.length} file(s): ${failedUploads.map(r => r.error).join(', ')}`);
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Upload failed');
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this media file?')) return;
    
    try {
      const response = await api.delete(`/media/${id}`);
      if (response.data.success) {
        setMedia(media.filter(item => item.id !== id));
        setSuccess('Media file deleted successfully');
      } else {
        setError(response.data.error || 'Failed to delete media');
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to delete media');
    }
  };

  const handleUpdateMetadata = async (id: number, alt: string, caption: string) => {
    try {
      const response = await api.put(`/media/${id}`, { alt, caption });
      if (response.data.success) {
        setMedia(media.map(item => 
          item.id === id ? { ...item, alt, caption } : item
        ));
        setSuccess('Media metadata updated successfully');
      } else {
        setError(response.data.error || 'Failed to update media');
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to update media');
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const isImage = (mimeType: string) => mimeType.startsWith('image/');

  if (loading && media.length === 0) {
    return <div className="loading">Loading media...</div>;
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1>Media Library</h1>
        <div>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*,application/pdf,text/plain"
            onChange={handleFileUpload}
            style={{ display: 'none' }}
          />
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="btn"
            disabled={uploading}
          >
            {uploading ? 'Uploading...' : 'Upload Files'}
          </button>
        </div>
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

      <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', alignItems: 'center' }}>
        <div>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            style={{ padding: '0.5rem', border: '1px solid #ddd', borderRadius: '4px' }}
          >
            <option value="">All Types</option>
            <option value="image">Images</option>
            <option value="application">Documents</option>
            <option value="text">Text Files</option>
          </select>
        </div>
        
        <div style={{ flex: 1 }}>
          <input
            type="text"
            placeholder="Search media..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ width: '100%', padding: '0.5rem', border: '1px solid #ddd', borderRadius: '4px' }}
          />
        </div>
      </div>

      {media.length > 0 ? (
        <>
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', 
            gap: '1rem',
            marginBottom: '2rem'
          }}>
            {media.map(item => (
              <div key={item.id} className="post-card">
                {isImage(item.mimeType) ? (
                  <img 
                    src={item.url} 
                    alt={item.alt || item.originalName}
                    style={{ 
                      width: '100%', 
                      height: '150px', 
                      objectFit: 'cover', 
                      borderRadius: '4px',
                      marginBottom: '1rem'
                    }}
                  />
                ) : (
                  <div style={{ 
                    width: '100%', 
                    height: '150px', 
                    backgroundColor: '#f6f7f7', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    borderRadius: '4px',
                    marginBottom: '1rem',
                    fontSize: '2rem'
                  }}>
                    📄
                  </div>
                )}
                
                <h4 style={{ marginBottom: '0.5rem', fontSize: '0.875rem' }}>
                  {item.originalName}
                </h4>
                
                <div className="post-meta" style={{ marginBottom: '1rem' }}>
                  <span>{formatFileSize(item.size)}</span>
                  <span> • </span>
                  <span>{item.mimeType}</span>
                  <span> • </span>
                  <span>{new Date(item.createdAt).toLocaleDateString()}</span>
                </div>

                <div style={{ marginBottom: '1rem' }}>
                  <input
                    type="text"
                    placeholder="Alt text"
                    value={item.alt || ''}
                    onChange={(e) => {
                      const newMedia = media.map(m => 
                        m.id === item.id ? { ...m, alt: e.target.value } : m
                      );
                      setMedia(newMedia);
                    }}
                    onBlur={(e) => handleUpdateMetadata(item.id, e.target.value, item.caption || '')}
                    style={{ 
                      width: '100%', 
                      padding: '0.25rem', 
                      fontSize: '0.75rem',
                      marginBottom: '0.5rem'
                    }}
                  />
                  <input
                    type="text"
                    placeholder="Caption"
                    value={item.caption || ''}
                    onChange={(e) => {
                      const newMedia = media.map(m => 
                        m.id === item.id ? { ...m, caption: e.target.value } : m
                      );
                      setMedia(newMedia);
                    }}
                    onBlur={(e) => handleUpdateMetadata(item.id, item.alt || '', e.target.value)}
                    style={{ 
                      width: '100%', 
                      padding: '0.25rem', 
                      fontSize: '0.75rem'
                    }}
                  />
                </div>

                <div className="post-actions">
                  <button 
                    onClick={() => navigator.clipboard.writeText(item.url)}
                    className="btn btn-secondary"
                    style={{ fontSize: '0.75rem' }}
                  >
                    Copy URL
                  </button>
                  <button 
                    onClick={() => handleDelete(item.id)}
                    className="btn btn-danger"
                    style={{ fontSize: '0.75rem' }}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>

          {totalPages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem' }}>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                <button
                  key={page}
                  onClick={() => fetchMedia(page)}
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
          <p>No media files found. Upload some files to get started!</p>
        </div>
      )}
    </div>
  );
}

export default Media;
