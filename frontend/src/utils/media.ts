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
    const input = document.createElement('input');
    input.type = 'file';
    input.multiple = options.multiple || false;
    
    if (options.allowedTypes) {
      input.accept = options.allowedTypes.join(',');
    }

    input.onchange = async (event) => {
      const files = (event.target as HTMLInputElement).files;
      if (!files || files.length === 0) return;

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
          if (options.onError) {
            options.onError(result.error || 'Upload failed');
          }
          return null;
        }
      });

      try {
        const uploadedMedia = await Promise.all(uploadPromises);
        const validMedia = uploadedMedia.filter(media => media !== null);
        
        if (validMedia.length > 0) {
          options.onSelect(options.multiple ? validMedia : validMedia[0]);
        }
      } catch (error) {
        console.error('Upload error:', error);
        if (options.onError) {
          options.onError('Upload failed');
        }
      }
    };

    input.click();
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
    // For now, we'll use the upload dialog
    // In the future, this could open a media library modal
    const mediaUpload = createMediaUpload();
    mediaUpload(options);
  };
}