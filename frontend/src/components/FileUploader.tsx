import React, { useState, useCallback } from 'react';

interface FileUploaderProps {
  onFileUpload: (file: File) => void;
  label: string;
}

const FileUploader: React.FC<FileUploaderProps> = ({ onFileUpload, label }) => {
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      onFileUpload(e.dataTransfer.files[0]);
    }
  }, [onFileUpload]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onFileUpload(e.target.files[0]);
    }
  };

  const handleClick = () => {
    document.getElementById(`fileInput-${label}`)?.click();
  };

  return (
    <div
      onClick={handleClick}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
        isDragOver ? 'border-blue-500 bg-blue-50' : 'border-gray-400 hover:border-blue-400'
      }`}
    >
      <input
        type="file"
        id={`fileInput-${label}`}
        className="hidden"
        onChange={handleFileChange}
        accept="image/*"
      />
      <p className="text-gray-500">{label}</p>
    </div>
  );
};

export default FileUploader;
