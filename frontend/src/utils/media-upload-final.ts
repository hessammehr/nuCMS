import { uploadMedia } from './media';

/**
 * Final WordPress media upload callback that handles the complete flow:
 * 1. File selection
 * 2. Upload to server  
 * 3. Call callback with uploaded media objects
 */
export function createFinalMediaUpload() {
  return (options: any) => {
    console.log('🔄 createFinalMediaUpload called with options:', options);
    console.log('🔄 Available callbacks:', {
      onFileChange: typeof options.onFileChange,
      onSelect: typeof options.onSelect,
      onError: typeof options.onError
    });
    
    // Determine which callback to use
    const successCallback = options.onFileChange || options.onSelect;
    
    // If files are already provided (from filesList), upload them immediately
    if (options.filesList && options.filesList.length > 0) {
      console.log('📄 Files provided in options, uploading:', options.filesList.length);
      uploadFilesAndCallback(Array.from(options.filesList), successCallback, options.onError, options.multiple);
      return;
    }
    
    try {
      const input = document.createElement('input');
      input.type = 'file';
      input.multiple = options.multiple || false;
      input.style.display = 'none';
      
      if (options.allowedTypes) {
        input.accept = options.allowedTypes.join(',');
      }
      
      // Add to DOM temporarily
      document.body.appendChild(input);
      
      const handleFiles = async (files: FileList) => {
        console.log('📄 Files selected, uploading:', files.length);
        await uploadFilesAndCallback(Array.from(files), successCallback, options.onError, options.multiple);
        // Clean up
        document.body.removeChild(input);
      };
      
      // Event handlers for file selection
      input.addEventListener('change', async (event) => {
        console.log('📄 Input change event triggered');
        const files = (event.target as HTMLInputElement).files;
        if (files && files.length > 0) {
          await handleFiles(files);
        }
      });

      input.addEventListener('input', async (event) => {
        console.log('📄 Input input event triggered');
        const files = (event.target as HTMLInputElement).files;
        if (files && files.length > 0) {
          await handleFiles(files);
        }
      });

      // Click to open file dialog
      console.log('🖱️ Clicking input to open file dialog');
      input.click();
      
    } catch (error) {
      console.error('Media upload setup error:', error);
      if (options.onError) {
        options.onError('Upload setup failed');
      }
    }
  };
}

async function uploadFilesAndCallback(
  files: File[], 
  successCallback: any, 
  errorCallback: any, 
  multiple: boolean
) {
  try {
    console.log('🔄 Starting upload process for files:', files.length);
    
    const uploadPromises = files.map(async (file) => {
      console.log('🔄 Uploading file:', file.name, file.type, file.size);
      const result = await uploadMedia(file);
      
      if (result.success && result.data) {
        // Return WordPress-compatible media object
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
              width: 0,
              height: 0,
            }
          } : undefined,
        };
      } else {
        console.error('Upload failed for file:', file.name, result.error);
        if (errorCallback) {
          errorCallback(result.error || 'Upload failed');
        }
        return null;
      }
    });

    const uploadedMedia = await Promise.all(uploadPromises);
    const validMedia = uploadedMedia.filter(media => media !== null);
    
    if (validMedia.length > 0) {
      console.log('✅ Upload successful, calling callback with:', validMedia);
      if (typeof successCallback === 'function') {
        // Always pass array to the callback - let WordPress handle single vs multiple
        successCallback(validMedia);
      } else {
        console.error('❌ No valid callback function available');
      }
    } else {
      console.error('❌ No valid media uploaded');
      if (errorCallback) {
        errorCallback('No files were uploaded successfully');
      }
    }
  } catch (error) {
    console.error('Upload process error:', error);
    if (errorCallback) {
      errorCallback('Upload process failed');
    }
  }
}