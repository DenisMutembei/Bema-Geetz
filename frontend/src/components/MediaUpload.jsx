import { useRef, useState } from 'react';
import api from '../services/api';

// Helper to convert relative image paths to full URLs
const getBaseUrl = () => {
  const apiUrl = import.meta.env.VITE_API_URL || '/api';
  return apiUrl.replace(/\/api\/?$/, '').replace(/\/$/, '');
};

const getFullImageUrl = (path) => {
  if (!path) return null;
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  if (path.startsWith('/uploads/')) return `${getBaseUrl()}${path}`;
  return path;
};

export default function MediaUpload({ value = [], onChange, maxFiles = 10 }) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const fileRef = useRef();

  const handleFiles = async (files) => {
    if (!files.length) return;
    setUploading(true);
    setProgress(0);

    try {
      const formData = new FormData();
      Array.from(files).slice(0, maxFiles).forEach((f) => formData.append('files', f));
      const res = await api.post('/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (e) => setProgress(Math.round((e.loaded * 100) / e.total))
      });
      onChange([...value, ...res.data.urls].slice(0, maxFiles));
    } catch (err) {
      alert(`Upload failed: ${err.response?.data?.error || err.message}`);
    } finally {
      setUploading(false);
      setProgress(0);
    }
  };

  const remove = (url) => onChange(value.filter((u) => u !== url));
  const isVideo = (url) => /\.(mp4|mov|avi|webm)$/i.test(url);

  return (
    <div className="space-y-3">
      <div
        onClick={() => fileRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); e.currentTarget.classList.add('border-gold'); }}
        onDragLeave={(e) => e.currentTarget.classList.remove('border-gold')}
        onDrop={(e) => { e.preventDefault(); e.currentTarget.classList.remove('border-gold'); handleFiles(e.dataTransfer.files); }}
        className="border-2 border-dashed border-dark-border hover:border-gold rounded-xl p-8 text-center cursor-pointer transition-colors"
      >
        {uploading ? (
          <div className="space-y-2">
            <div className="text-gold text-sm">Uploading... {progress}%</div>
            <div className="w-full bg-dark-border rounded-full h-2">
              <div className="bg-gold h-2 rounded-full transition-all" style={{ width: `${progress}%` }} />
            </div>
          </div>
        ) : (
          <>
            <svg className="w-10 h-10 text-gold mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            <p className="text-gray-400 text-sm">Drop images or videos here, or <span className="text-gold">browse</span></p>
            <p className="text-gray-600 text-xs mt-1">JPG, PNG, WebP, MP4, MOV, AVI, WEBM - max 50MB each</p>
          </>
        )}
        <input
          ref={fileRef}
          type="file"
          multiple
          accept="image/*,video/mp4,video/quicktime,video/x-msvideo,video/webm,.mov,.avi,.webm"
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
      </div>

      {value.length > 0 && (
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
          {value.map((url, i) => (
            <div key={i} className="relative group aspect-square rounded-lg overflow-hidden border border-dark-border">
              {isVideo(url) ? (
                <video src={getFullImageUrl(url)} className="w-full h-full object-cover" />
              ) : (
                <img src={getFullImageUrl(url)} alt={`media-${i}`} className="w-full h-full object-cover" />
              )}
              <button
                type="button"
                onClick={() => remove(url)}
                className="absolute top-1 right-1 bg-red-600 text-white rounded-full w-5 h-5 text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              >
                x
              </button>
              {i === 0 && <span className="absolute bottom-1 left-1 badge-gold px-1.5 py-0.5 rounded text-xs">Cover</span>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
