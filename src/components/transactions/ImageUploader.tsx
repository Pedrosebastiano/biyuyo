// components/ImageUploader.jsx
import React, { useState } from 'react';
import { Upload, X, Image as ImageIcon } from 'lucide-react';
import { uploadImage } from '../../../supabase'; // Asegúrate de importar desde la ubicación correcta

export function ImageUploader({ onImageUploaded, label = "Subir imagen" }) {
  const [imagePreview, setImagePreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);

  const handleFileChange = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Validar tipo de archivo
    if (!file.type.match('image.*')) {
      setError('Solo se permiten archivos de imagen (JPEG, PNG, etc.)');
      return;
    }

    // Validar tamaño (ej: máximo 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('La imagen no debe superar los 5MB');
      return;
    }

    // Crear preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result);
    };
    reader.readAsDataURL(file);

    // Subir a Supabase
    setUploading(true);
    setError(null);

    try {
      const imageUrl = await uploadImage(file, 'factura', 'imagenes');
      onImageUploaded(imageUrl);
      setUploading(false);
    } catch (err) {
      setError(err.message);
      setUploading(false);
    }
  };

  const handleRemoveImage = () => {
    setImagePreview(null);
    onImageUploaded(null);
  };

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">
        {label}
      </label>
      
      {imagePreview ? (
        <div className="relative">
          <img
            src={imagePreview}
            alt="Preview"
            className="w-full h-48 object-cover rounded-lg border"
          />
          <button
            type="button"
            onClick={handleRemoveImage}
            className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full hover:bg-red-600"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <label className="cursor-pointer">
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
            <Upload className="h-8 w-8 mx-auto text-gray-400 mb-2" />
            <p className="text-sm text-gray-600">
              {uploading ? 'Subiendo imagen...' : 'Haz clic para subir una imagen'}
            </p>
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
              disabled={uploading}
            />
          </div>
        </label>
      )}
      
      {error && (
        <p className="text-sm text-red-500">{error}</p>
      )}
    </div>
  );
}