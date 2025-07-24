import React, { useState, useEffect } from 'react';
import { Modal, Button, SearchControl, Spinner, TabPanel } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { getMediaLibrary, uploadMedia, MediaItem } from '../utils/media';

interface MediaBrowserProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (media: MediaItem) => void;
  allowedTypes?: string[];
  multiple?: boolean;
}

interface MediaGridProps {
  items: MediaItem[];
  onSelect: (media: MediaItem) => void;
  selectedId?: number;
}

const MediaGrid: React.FC<MediaGridProps> = ({ items, onSelect, selectedId }) => (
  <div className="media-browser-grid">
    {items.length === 0 ? (
      <div className="media-browser-empty">
        <p>{__('No media files found.')}</p>
      </div>
    ) : (
      <div className="media-browser-items">
        {items.map((item) => (
          <div
            key={item.id}
            className={`media-browser-item ${selectedId === item.id ? 'selected' : ''}`}
            onClick={() => onSelect(item)}
          >
            {item.mimeType.startsWith('image/') ? (
              <img src={item.url} alt={item.alt || item.originalName} />
            ) : (
              <div className="media-browser-file-icon">
                <span>{item.mimeType.split('/')[1].toUpperCase()}</span>
              </div>
            )}
            <div className="media-browser-item-info">
              <div className="media-browser-item-title">{item.originalName}</div>
              <div className="media-browser-item-meta">
                {item.mimeType} • {Math.round(item.size / 1024)}KB
              </div>
            </div>
          </div>
        ))}
      </div>
    )}
  </div>
);

export const MediaBrowser: React.FC<MediaBrowserProps> = ({
  isOpen,
  onClose,
  onSelect,
  allowedTypes,
  multiple = false,
}) => {
  const [loading, setLoading] = useState(false);
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedItem, setSelectedItem] = useState<MediaItem | null>(null);
  const [uploading, setUploading] = useState(false);
  const [currentTab, setCurrentTab] = useState('library');

  const loadMediaLibrary = async (search = '') => {
    setLoading(true);
    try {
      const response = await getMediaLibrary({
        search,
        limit: 50,
        type: allowedTypes?.[0]?.split('/')[0], // e.g., 'image' from 'image/jpeg'
      });
      
      if (response.success && response.data) {
        setMediaItems(response.data.items || []);
      } else {
        console.error('Failed to load media library:', response.error);
      }
    } catch (error) {
      console.error('Error loading media library:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadMediaLibrary();
    }
  }, [isOpen]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (isOpen) {
        loadMediaLibrary(searchTerm);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const handleFileUpload = async (files: FileList) => {
    if (!files || files.length === 0) return;

    setUploading(true);
    try {
      const uploadPromises = Array.from(files).map(uploadMedia);
      const results = await Promise.all(uploadPromises);
      
      const successfulUploads = results
        .filter(result => result.success && result.data)
        .map(result => result.data!);
      
      if (successfulUploads.length > 0) {
        // Refresh the media library
        await loadMediaLibrary(searchTerm);
        
        // If single file, auto-select it
        if (successfulUploads.length === 1 && !multiple) {
          setSelectedItem(successfulUploads[0]);
        }
      }
    } catch (error) {
      console.error('Upload error:', error);
    } finally {
      setUploading(false);
    }
  };

  const handleItemSelect = (item: MediaItem) => {
    setSelectedItem(item);
  };

  const handleConfirmSelection = () => {
    if (selectedItem) {
      onSelect(selectedItem);
      onClose();
    }
  };

  const tabs = [
    {
      name: 'library',
      title: __('Media Library'),
      className: 'media-browser-tab-library',
    },
    {
      name: 'upload',
      title: __('Upload Files'),
      className: 'media-browser-tab-upload',
    },
  ];

  if (!isOpen) return null;

  return (
    <Modal
      title={__('Select or Upload Media')}
      onRequestClose={onClose}
      className="media-browser-modal"
      shouldCloseOnClickOutside={false}
      style={{ width: '80vw', height: '80vh' }}
    >
      <div className="media-browser-content">
        <TabPanel
          className="media-browser-tabs"
          activeClass="is-active"
          tabs={tabs}
          initialTabName="library"
          onSelect={(tabName) => setCurrentTab(tabName)}
        >
          {(tab) => (
            <div className="media-browser-tab-content">
              {tab.name === 'library' && (
                <>
                  <div className="media-browser-toolbar">
                    <SearchControl
                      value={searchTerm}
                      onChange={setSearchTerm}
                      placeholder={__('Search media files...')}
                    />
                  </div>
                  {loading ? (
                    <div className="media-browser-loading">
                      <Spinner />
                      <p>{__('Loading media library...')}</p>
                    </div>
                  ) : (
                    <MediaGrid
                      items={mediaItems}
                      onSelect={handleItemSelect}
                      selectedId={selectedItem?.id}
                    />
                  )}
                </>
              )}
              
              {tab.name === 'upload' && (
                <div className="media-browser-upload">
                  <div className="media-browser-upload-area">
                    <input
                      type="file"
                      id="media-browser-file-input"
                      multiple={multiple}
                      accept={allowedTypes?.join(',')}
                      onChange={(e) => e.target.files && handleFileUpload(e.target.files)}
                      style={{ display: 'none' }}
                    />
                    <label htmlFor="media-browser-file-input" className="media-browser-upload-label">
                      {uploading ? (
                        <>
                          <Spinner />
                          <p>{__('Uploading...')}</p>
                        </>
                      ) : (
                        <>
                          <div className="media-browser-upload-icon">📁</div>
                          <p>{__('Select files to upload')}</p>
                          <p className="media-browser-upload-hint">
                            {__('Or drag and drop files here')}
                          </p>
                        </>
                      )}
                    </label>
                  </div>
                  
                  {allowedTypes && (
                    <div className="media-browser-upload-info">
                      <p>{__('Allowed file types:')} {allowedTypes.join(', ')}</p>
                      <p>{__('Maximum file size: 10MB')}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </TabPanel>
        
        {selectedItem && (
          <div className="media-browser-selection">
            <div className="media-browser-selected-item">
              <div className="media-browser-selected-preview">
                {selectedItem.mimeType.startsWith('image/') ? (
                  <img src={selectedItem.url} alt={selectedItem.alt || selectedItem.originalName} />
                ) : (
                  <div className="media-browser-file-icon">
                    <span>{selectedItem.mimeType.split('/')[1].toUpperCase()}</span>
                  </div>
                )}
              </div>
              <div className="media-browser-selected-details">
                <h4>{selectedItem.originalName}</h4>
                <p>{selectedItem.mimeType}</p>
                <p>{Math.round(selectedItem.size / 1024)}KB</p>
                {selectedItem.alt && <p><strong>{__('Alt text:')}</strong> {selectedItem.alt}</p>}
                {selectedItem.caption && <p><strong>{__('Caption:')}</strong> {selectedItem.caption}</p>}
              </div>
            </div>
          </div>
        )}
      </div>
      
      <div className="media-browser-actions">
        <Button variant="tertiary" onClick={onClose}>
          {__('Cancel')}
        </Button>
        <Button
          variant="primary"
          onClick={handleConfirmSelection}
          disabled={!selectedItem}
        >
          {__('Select')}
        </Button>
      </div>
    </Modal>
  );
};