import React, { useEffect, useState, useRef } from 'react';
import { api } from '../utils/api';
import type { Media as MediaType } from '@shared/types';
import { Card, CardBody, CardHeader, Button, Flex, FlexItem, Icon, __experimentalHeading as Heading, __experimentalText as Text, SearchControl, SelectControl, TextControl, Notice } from '@wordpress/components';
import { media, upload, copy, trash, image } from '@wordpress/icons';

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
    <div className="wp-admin-page">
      <div className="wp-admin-page__header">
        <Flex justify="space-between" align="center">
          <Heading level={1} className="wp-admin-page__title">
            Media Library
          </Heading>
          <div>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*,application/pdf,text/plain"
              onChange={handleFileUpload}
              style={{ display: 'none' }}
            />
            <Button 
              variant="primary"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
            >
              <Icon icon={upload} />
              {uploading ? 'Uploading...' : 'Upload Files'}
            </Button>
          </div>
        </Flex>
      </div>

      {error && (
        <Notice status="error" isDismissible={false}>
          {error}
        </Notice>
      )}

      {success && (
        <Notice status="success" isDismissible={false}>
          {success}
        </Notice>
      )}

      <Card className="wp-admin-filters">
        <CardBody>
          <Flex gap={4} align="end">
            <FlexItem>
              <SelectControl
                label="Type Filter"
                value={typeFilter}
                options={[
                  { label: 'All Types', value: '' },
                  { label: 'Images', value: 'image' },
                  { label: 'Documents', value: 'application' },
                  { label: 'Text Files', value: 'text' }
                ]}
                onChange={(value) => setTypeFilter(value || '')}
              />
            </FlexItem>
            <FlexItem style={{ flex: 1 }}>
              <SearchControl
                label="Search media"
                value={search}
                onChange={(value) => setSearch(value)}
                placeholder="Search media..."
              />
            </FlexItem>
          </Flex>
        </CardBody>
      </Card>

      {media.length > 0 ? (
        <>
          <div className="wp-admin-media-grid">
            {media.map(item => (
              <Card key={item.id} className="wp-admin-media-item">
                <CardBody>
                  <Flex direction="column" gap={3}>
                    <div className="wp-admin-media-item__preview">
                      {isImage(item.mimeType) ? (
                        <img 
                          src={item.url} 
                          alt={item.alt || item.originalName}
                          style={{ 
                            width: '100%', 
                            height: '150px', 
                            objectFit: 'cover', 
                            borderRadius: '4px'
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
                          borderRadius: '4px'
                        }}>
                          <Icon icon={media} size={48} />
                        </div>
                      )}
                    </div>
                    
                    <Heading level={4} className="wp-admin-media-item__title">
                      {item.originalName}
                    </Heading>
                    
                    <Flex className="wp-admin-media-item__meta" gap={2}>
                      <Text size="small">{formatFileSize(item.size)}</Text>
                      <Text size="small">{item.mimeType}</Text>
                      <Text size="small">{new Date(item.createdAt).toLocaleDateString()}</Text>
                    </Flex>

                    <div className="wp-admin-media-item__metadata">
                      <TextControl
                        label="Alt text"
                        value={item.alt || ''}
                        onChange={(value) => {
                          const newMedia = media.map(m => 
                            m.id === item.id ? { ...m, alt: value } : m
                          );
                          setMedia(newMedia);
                        }}
                        onBlur={(e: React.FocusEvent<HTMLInputElement>) => 
                          handleUpdateMetadata(item.id, e.target.value, item.caption || '')}
                        size="__unstable-large"
                      />
                      <TextControl
                        label="Caption"
                        value={item.caption || ''}
                        onChange={(value) => {
                          const newMedia = media.map(m => 
                            m.id === item.id ? { ...m, caption: value } : m
                          );
                          setMedia(newMedia);
                        }}
                        onBlur={(e: React.FocusEvent<HTMLInputElement>) => 
                          handleUpdateMetadata(item.id, item.alt || '', e.target.value)}
                        size="__unstable-large"
                      />
                    </div>

                    <Flex className="wp-admin-media-item__actions" gap={2}>
                      <Button 
                        variant="secondary"
                        size="small"
                        onClick={() => navigator.clipboard.writeText(item.url)}
                      >
                        <Icon icon={copy} />
                        Copy URL
                      </Button>
                      <Button 
                        variant="secondary"
                        size="small"
                        isDestructive
                        onClick={() => handleDelete(item.id)}
                      >
                        <Icon icon={trash} />
                        Delete
                      </Button>
                    </Flex>
                  </Flex>
                </CardBody>
              </Card>
            ))}
          </div>

          {totalPages > 1 && (
            <Card className="wp-admin-pagination">
              <CardBody>
                <Flex justify="center" gap={2}>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                    <Button
                      key={page}
                      variant={page === currentPage ? "primary" : "secondary"}
                      size="small"
                      onClick={() => fetchMedia(page)}
                      disabled={loading}
                    >
                      {page}
                    </Button>
                  ))}
                </Flex>
              </CardBody>
            </Card>
          )}
        </>
      ) : (
        <Card className="wp-admin-empty-state">
          <CardBody>
            <Flex direction="column" align="center" gap={4}>
              <Icon icon={media} size={48} className="wp-admin-empty-state__icon" />
              <Text>No media files found.</Text>
              <Button 
                variant="primary"
                onClick={() => fileInputRef.current?.click()}
              >
                <Icon icon={upload} />
                Upload some files to get started
              </Button>
            </Flex>
          </CardBody>
        </Card>
      )}
    </div>
  );
}

export default Media;
