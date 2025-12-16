import React, { useCallback } from 'react';
import { UploadCloud } from 'lucide-react';

interface FileUploadProps {
  onFilesSelected: (files: File[]) => void;
  disabled?: boolean;
}

export const FileUpload: React.FC<FileUploadProps> = ({ onFilesSelected, disabled }) => {
  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (disabled) return;
    
    const droppedFiles = Array.from(e.dataTransfer.files).filter((file: File) => 
      file.type.startsWith('image/')
    );
    if (droppedFiles.length > 0) {
      onFilesSelected(droppedFiles);
    }
  }, [onFilesSelected, disabled]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (disabled || !e.target.files) return;
    
    const selectedFiles = Array.from(e.target.files).filter((file: File) => 
      file.type.startsWith('image/')
    );
    if (selectedFiles.length > 0) {
      onFilesSelected(selectedFiles);
    }
    // Reset value to allow selecting same files again if needed
    e.target.value = '';
  }, [onFilesSelected, disabled]);

  return (
    <div
      onDrop={handleDrop}
      onDragOver={(e) => e.preventDefault()}
      className={`
        relative border-2 border-dashed rounded-xl p-10 text-center transition-all duration-200
        ${disabled ? 'border-slate-200 bg-slate-50 cursor-not-allowed' : 'border-indigo-300 bg-indigo-50/30 hover:bg-indigo-50 hover:border-indigo-400 cursor-pointer'}
      `}
    >
      <input
        type="file"
        multiple
        accept="image/png, image/jpeg, image/webp"
        onChange={handleFileInput}
        disabled={disabled}
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
      />
      <div className="flex flex-col items-center justify-center space-y-4">
        <div className={`p-4 rounded-full ${disabled ? 'bg-slate-100 text-slate-300' : 'bg-indigo-100 text-indigo-600'}`}>
          <UploadCloud size={32} />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-slate-700">
            {disabled ? 'Processing in progress...' : 'Click or Drag PNGs here'}
          </h3>
          <p className="text-sm text-slate-500 mt-1">
            Supports multiple PNG, JPG, or WEBP files at once
          </p>
        </div>
      </div>
    </div>
  );
};