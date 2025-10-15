import React, { useState } from 'react';

export interface ArtworkMetadata {
  title: string;
  artist: string;
  year: string;
  width: string;
  height: string;
}

interface ArtworkFormProps {
  onFormSubmit: (metadata: ArtworkMetadata) => void;
  onCancel: () => void;
}

const ArtworkForm: React.FC<ArtworkFormProps> = ({ onFormSubmit, onCancel }) => {
  const [metadata, setMetadata] = useState<ArtworkMetadata>({
    title: '',
    artist: '',
    year: '',
    width: '',
    height: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setMetadata(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Basic validation
    if (Object.values(metadata).some(val => val.trim() === '')) {
        alert('Please fill out all fields.');
        return;
    }
    onFormSubmit(metadata);
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex justify-center items-center z-50">
      <div className="relative mx-auto p-6 border w-full max-w-md shadow-lg rounded-md bg-white">
        <h2 className="text-2xl font-bold mb-4">Artwork Details</h2>
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 gap-4">
            <input type="text" name="title" placeholder="Title" value={metadata.title} onChange={handleChange} className="p-2 border rounded" required />
            <input type="text" name="artist" placeholder="Artist" value={metadata.artist} onChange={handleChange} className="p-2 border rounded" required />
            <input type="number" name="year" placeholder="Year" value={metadata.year} onChange={handleChange} className="p-2 border rounded" required />
            <div className="grid grid-cols-2 gap-4">
                <input type="number" name="width" placeholder="Width (cm)" value={metadata.width} onChange={handleChange} className="p-2 border rounded" required />
                <input type="number" name="height" placeholder="Height (cm)" value={metadata.height} onChange={handleChange} className="p-2 border rounded" required />
            </div>
          </div>
          <div className="flex justify-end items-center mt-6">
            <button type="button" onClick={onCancel} className="mr-4 bg-gray-300 text-gray-800 py-2 px-4 rounded hover:bg-gray-400">
              Cancel
            </button>
            <button type="submit" className="bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600">
              Save Artwork
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ArtworkForm;
