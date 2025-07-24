import { api } from './api';

export interface MediaItem {
  id: number;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  url: string;
  alt?: string;
  caption?: string;
  author: {
    id: number;
    username: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface MediaUploadResponse {
  success: boolean;
  data?: MediaItem;
  error?: string;
}

/**
 * Upload a file to the media library
 */
export async function uploadMedia(file: File): Promise<MediaUploadResponse> {
  try {
    const formData = new FormData();
    formData.append('file', file);

    const response = await api.post('/media/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return response.data;
  } catch (error: any) {
    console.error('Media upload error:', error);
    return {
      success: false,
      error: error.response?.data?.error || 'Upload failed',
    };
  }
}

/**
 * Get media library items
 */
export async function getMediaLibrary(params?: {
  page?: number;
  limit?: number;
  type?: string;
  search?: string;
}) {
  try {
    const response = await api.get('/media', { params });
    return response.data;
  } catch (error: any) {
    console.error('Media library error:', error);
    return {
      success: false,
      error: error.response?.data?.error || 'Failed to load media',
    };
  }
}

/**
 * Update media metadata
 */
export async function updateMedia(id: number, data: { alt?: string; caption?: string }) {
  try {
    const response = await api.put(`/media/${id}`, data);
    return response.data;
  } catch (error: any) {
    console.error('Media update error:', error);
    return {
      success: false,
      error: error.response?.data?.error || 'Update failed',
    };
  }
}

/**
 * Delete media item
 */
export async function deleteMedia(id: number) {
  try {
    const response = await api.delete(`/media/${id}`);
    return response.data;
  } catch (error: any) {
    console.error('Media delete error:', error);
    return {
      success: false,
      error: error.response?.data?.error || 'Delete failed',
    };
  }
}

/**
 * WordPress media upload callback for Gutenberg blocks
 */
export function createMediaUpload() {
  return (options: {
    allowedTypes?: string[];
    multiple?: boolean;
    onSelect: (media: any) => void;
    onError?: (error: string) => void;
  }) => {
    console.log('🔄 createMediaUpload called with options:', options);
    
    try {
      console.log('🔧 Creating file input element');
      const input = document.createElement('input');
      input.type = 'file';
      input.multiple = options.multiple || false;
      
      if (options.allowedTypes) {
        input.accept = options.allowedTypes.join(',');
        console.log('🔧 Set accept types:', input.accept);
      }
      
      console.log('🔧 Input element created:', input);

      const handleFileSelection = async (files: FileList | null) => {
        console.log('📄 File selection handler triggered');
        try {
          console.log('📄 Files from input:', files, files?.length);
          if (!files || files.length === 0) {
            console.log('❌ No files selected or files is null');
            return;
          }

          console.log('🔄 Files selected for upload:', files.length);

          const uploadPromises = Array.from(files).map(async (file) => {
            console.log('🔄 Uploading file:', file.name, file.type, file.size);
            const result = await uploadMedia(file);
            
            if (result.success && result.data) {
              return {
                id: result.data.id,
                url: result.data.url,
                alt: result.data.alt || '',
                caption: result.data.caption || '',
                title: result.data.originalName,
                filename: result.data.filename,
                mime: result.data.mimeType,
                type: result.data.mimeType.startsWith('image/') ? 'image' : 'file',
                subtype: result.data.mimeType.split('/')[1],
                sizes: result.data.mimeType.startsWith('image/') ? {
                  full: {
                    url: result.data.url,
                    width: 0, // We don't have dimensions yet
                    height: 0,
                  }
                } : undefined,
              };
            } else {
              console.error('Upload failed for file:', file.name, result.error);
              if (options.onError) {
                options.onError(result.error || 'Upload failed');
              }
              return null;
            }
          });

          const uploadedMedia = await Promise.all(uploadPromises);
          const validMedia = uploadedMedia.filter(media => media !== null);
          
          if (validMedia.length > 0) {
            console.log('✅ Upload successful, calling onSelect with:', validMedia);
            options.onSelect(options.multiple ? validMedia : validMedia[0]);
          } else {
            console.error('❌ No valid media uploaded');
            if (options.onError) {
              options.onError('No files were uploaded successfully');
            }
          }
        } catch (error) {
          console.error('Upload process error:', error);
          if (options.onError) {
            options.onError('Upload process failed');
          }
        }
      };

      input.onchange = async (event) => {
        console.log('📄 Input onchange event triggered');
        const files = (event.target as HTMLInputElement).files;
        await handleFileSelection(files);
      };

      // Also listen for input event as a fallback
      input.oninput = async (event) => {
        console.log('📄 Input oninput event triggered');
        const files = (event.target as HTMLInputElement).files;
        await handleFileSelection(files);
      };

      // Add mutation observer to detect programmatic file changes
      let checkInterval: NodeJS.Timeout;
      const startPolling = () => {
        checkInterval = setInterval(() => {
          if (input.files && input.files.length > 0) {
            console.log('📄 Files detected via polling:', input.files.length);
            clearInterval(checkInterval);
            handleFileSelection(input.files);
          }
        }, 100);
        
        // Stop polling after 10 seconds
        setTimeout(() => {
          if (checkInterval) {
            clearInterval(checkInterval);
          }
        }, 10000);
      };

      // Use a timeout to avoid potential timing issues
      setTimeout(() => {
        console.log('🖱️ Attempting to click input element');
        input.click();
        console.log('🖱️ Input click completed');
        
        // Start polling for file changes
        startPolling();
      }, 100);
      
    } catch (error) {
      console.error('Media upload setup error:', error);
      if (options.onError) {
        options.onError('Upload setup failed');
      }
    }
  };
}

/**
 * WordPress media library callback for Gutenberg blocks
 */
export function createMediaSelect() {
  return (options: {
    allowedTypes?: string[];
    multiple?: boolean;
    onSelect: (media: any) => void;
    onClose?: () => void;
  }) => {
    console.log('🔄 createMediaSelect called with options:', options);
    
    // Dispatch a custom event to open the media browser
    const event = new CustomEvent('nuCMS:openMediaBrowser', {
      detail: {
        allowedTypes: options.allowedTypes,
        multiple: options.multiple,
        onSelect: options.onSelect,
        onClose: options.onClose,
      }
    });
    
    window.dispatchEvent(event);
  };
}