import React, { useState, useEffect, useRef } from 'react';
import { PhotoIcon, TrashIcon, PencilSquareIcon, StarIcon, ArrowUpTrayIcon, XMarkIcon } from '../components/icons';
import Modal from '../components/Modal';
import * as api from '../services/apiService';
import LoadingSpinner from '../components/LoadingSpinner';
import toast from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';

interface GalleryImage {
  id: number;
  image_url: string;
  image_type: 'bus' | 'station' | 'office' | 'team' | 'other';
  title?: string;
  description?: string;
  display_order: number;
  is_featured: boolean;
  created_at: string;
}

const CompanyGallery: React.FC = () => {
  const { user } = useAuth();
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [currentImage, setCurrentImage] = useState<GalleryImage | null>(null);
  const [selectedType, setSelectedType] = useState<string>('all');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadData, setUploadData] = useState({
    imageUrl: '',
    imageType: 'other' as 'bus' | 'station' | 'office' | 'team' | 'other',
    title: '',
    description: '',
    displayOrder: 0,
    isFeatured: false
  });

  useEffect(() => {
    fetchGallery();
  }, [selectedType]);

  const fetchGallery = async () => {
    setIsLoading(true);
    try {
      const filters: any = {};
      if (selectedType !== 'all') {
        filters.imageType = selectedType;
      }
      const data = await api.companyGetGallery(filters);
      setImages(data || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load gallery');
      toast.error(err.message || 'Failed to load gallery');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size must be less than 5MB');
      return;
    }

    // Convert to base64 for upload
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      setUploadData({ ...uploadData, imageUrl: base64String });
    };
    reader.readAsDataURL(file);
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadData.imageUrl) {
      toast.error('Please select an image');
      return;
    }

    setIsLoading(true);
    try {
      const response = await api.companyUploadGalleryImage(uploadData);
      if (response.success) {
        toast.success('Image uploaded successfully!');
        setIsUploadModalOpen(false);
        setUploadData({
          imageUrl: '',
          imageType: 'other',
          title: '',
          description: '',
          displayOrder: 0,
          isFeatured: false
        });
        fetchGallery();
      } else {
        throw new Error(response.message || 'Failed to upload image');
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to upload image');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (image: GalleryImage) => {
    setCurrentImage(image);
    setIsEditModalOpen(true);
  };

  const handleUpdate = async (updates: Partial<GalleryImage>) => {
    if (!currentImage) return;

    setIsLoading(true);
    try {
      const response = await api.companyUpdateGalleryImage(currentImage.id, updates);
      if (response.success) {
        toast.success('Image updated successfully!');
        setIsEditModalOpen(false);
        setCurrentImage(null);
        fetchGallery();
      } else {
        throw new Error(response.message || 'Failed to update image');
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to update image');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (imageId: number) => {
    if (!confirm('Are you sure you want to delete this image?')) return;

    setIsLoading(true);
    try {
      const response = await api.companyDeleteGalleryImage(imageId);
      if (response.success) {
        toast.success('Image deleted successfully!');
        fetchGallery();
      } else {
        throw new Error(response.message || 'Failed to delete image');
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete image');
    } finally {
      setIsLoading(false);
    }
  };

  const imageTypeLabels: Record<string, string> = {
    all: 'All Images',
    bus: 'Bus Images',
    station: 'Station Images',
    office: 'Office Images',
    team: 'Team Images',
    other: 'Other Images'
  };

  const filteredImages = selectedType === 'all' 
    ? images 
    : images.filter(img => img.image_type === selectedType);

  if (isLoading && images.length === 0) {
    return <LoadingSpinner />;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold dark:text-white mb-2">Company Gallery</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Manage your company's image gallery
          </p>
        </div>
        <button
          onClick={() => setIsUploadModalOpen(true)}
          className="flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg font-semibold hover:from-blue-700 hover:to-blue-800 transition-all shadow-lg"
        >
          <ArrowUpTrayIcon className="w-5 h-5 mr-2" />
          Upload Image
        </button>
      </div>

      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex space-x-2 overflow-x-auto pb-2">
        {Object.keys(imageTypeLabels).map(type => (
          <button
            key={type}
            onClick={() => setSelectedType(type)}
            className={`px-4 py-2 rounded-lg font-semibold whitespace-nowrap transition ${
              selectedType === type
                ? 'bg-blue-600 text-white'
                : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            {imageTypeLabels[type]} ({type === 'all' ? images.length : images.filter(img => img.image_type === type).length})
          </button>
        ))}
      </div>

      {/* Gallery Grid */}
      {filteredImages.length === 0 ? (
        <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-xl">
          <PhotoIcon className="w-16 h-16 mx-auto text-gray-400 mb-4" />
          <p className="text-gray-500 dark:text-gray-400">No images found. Upload your first image to get started.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredImages.map((image) => (
            <div
              key={image.id}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-all group"
            >
              <div className="relative aspect-video bg-gray-100 dark:bg-gray-700">
                <img
                  src={image.image_url}
                  alt={image.title || 'Gallery image'}
                  className="w-full h-full object-cover"
                />
                {image.is_featured && (
                  <div className="absolute top-2 right-2 bg-yellow-500 text-white px-2 py-1 rounded-full text-xs font-semibold flex items-center">
                    <StarIcon className="w-3 h-3 mr-1" />
                    Featured
                  </div>
                )}
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleEdit(image)}
                      className="p-2 bg-white rounded-full hover:bg-gray-100 transition"
                      title="Edit"
                    >
                      <PencilSquareIcon className="w-5 h-5 text-blue-600" />
                    </button>
                    <button
                      onClick={() => handleDelete(image.id)}
                      className="p-2 bg-white rounded-full hover:bg-gray-100 transition"
                      title="Delete"
                    >
                      <TrashIcon className="w-5 h-5 text-red-600" />
                    </button>
                  </div>
                </div>
              </div>
              <div className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold px-2 py-1 bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-300 rounded">
                    {image.image_type.charAt(0).toUpperCase() + image.image_type.slice(1)}
                  </span>
                </div>
                {image.title && (
                  <h3 className="font-semibold dark:text-white mb-1">{image.title}</h3>
                )}
                {image.description && (
                  <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">{image.description}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Upload Modal */}
      <Modal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        title="Upload Gallery Image"
      >
        <form onSubmit={handleUpload} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Select Image <span className="text-red-500">*</span>
            </label>
            <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 dark:border-gray-600 border-dashed rounded-lg hover:border-blue-500 transition">
              <div className="space-y-1 text-center">
                {uploadData.imageUrl ? (
                  <div className="relative">
                    <img
                      src={uploadData.imageUrl}
                      alt="Preview"
                      className="max-h-64 mx-auto rounded-lg"
                    />
                    <button
                      type="button"
                      onClick={() => setUploadData({ ...uploadData, imageUrl: '' })}
                      className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                    >
                      <XMarkIcon className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <>
                    <PhotoIcon className="mx-auto h-12 w-12 text-gray-400" />
                    <div className="flex text-sm text-gray-600 dark:text-gray-400">
                      <label className="relative cursor-pointer rounded-md font-medium text-blue-600 hover:text-blue-500">
                        <span>Upload a file</span>
                        <input
                          ref={fileInputRef}
                          type="file"
                          className="sr-only"
                          accept="image/*"
                          onChange={handleFileSelect}
                        />
                      </label>
                      <p className="pl-1">or drag and drop</p>
                    </div>
                    <p className="text-xs text-gray-500">PNG, JPG, GIF up to 5MB</p>
                  </>
                )}
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Image Type <span className="text-red-500">*</span>
            </label>
            <select
              value={uploadData.imageType}
              onChange={(e) => setUploadData({ ...uploadData, imageType: e.target.value as any })}
              className="w-full p-3 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              required
            >
              <option value="bus">Bus</option>
              <option value="station">Station</option>
              <option value="office">Office</option>
              <option value="team">Team</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Title (Optional)
            </label>
            <input
              type="text"
              value={uploadData.title}
              onChange={(e) => setUploadData({ ...uploadData, title: e.target.value })}
              className="w-full p-3 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              placeholder="Enter image title..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Description (Optional)
            </label>
            <textarea
              value={uploadData.description}
              onChange={(e) => setUploadData({ ...uploadData, description: e.target.value })}
              rows={3}
              className="w-full p-3 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              placeholder="Enter image description..."
            />
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="isFeatured"
              checked={uploadData.isFeatured}
              onChange={(e) => setUploadData({ ...uploadData, isFeatured: e.target.checked })}
              className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
            />
            <label htmlFor="isFeatured" className="ml-2 text-sm text-gray-700 dark:text-gray-300">
              Mark as featured image
            </label>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={() => setIsUploadModalOpen(false)}
              className="px-6 py-3 border border-gray-300 dark:border-gray-600 rounded-lg font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading || !uploadData.imageUrl}
              className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg font-semibold hover:from-blue-700 hover:to-blue-800 transition-all shadow-lg disabled:opacity-50"
            >
              {isLoading ? 'Uploading...' : 'Upload Image'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit Modal */}
      {currentImage && (
        <Modal
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false);
            setCurrentImage(null);
          }}
          title="Edit Gallery Image"
        >
          <div className="space-y-6">
            <div>
              <img
                src={currentImage.image_url}
                alt={currentImage.title || 'Gallery image'}
                className="w-full rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Title
              </label>
              <input
                type="text"
                defaultValue={currentImage.title || ''}
                onBlur={(e) => {
                  if (e.target.value !== currentImage.title) {
                    handleUpdate({ title: e.target.value });
                  }
                }}
                className="w-full p-3 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                placeholder="Enter image title..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Description
              </label>
              <textarea
                defaultValue={currentImage.description || ''}
                onBlur={(e) => {
                  if (e.target.value !== currentImage.description) {
                    handleUpdate({ description: e.target.value });
                  }
                }}
                rows={3}
                className="w-full p-3 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                placeholder="Enter image description..."
              />
            </div>
            <div className="flex items-center">
              <input
                type="checkbox"
                id="editIsFeatured"
                defaultChecked={currentImage.is_featured}
                onChange={(e) => handleUpdate({ is_featured: e.target.checked })}
                className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
              />
              <label htmlFor="editIsFeatured" className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                Mark as featured image
              </label>
            </div>
            <div className="flex justify-end pt-4">
              <button
                onClick={() => {
                  setIsEditModalOpen(false);
                  setCurrentImage(null);
                }}
                className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg font-semibold hover:from-blue-700 hover:to-blue-800 transition-all"
              >
                Close
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default CompanyGallery;

