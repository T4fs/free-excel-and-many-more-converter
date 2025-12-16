import React from 'react';
import { ProcessedFile, ProcessingStatus } from '../types';
import { FileSpreadsheet, Loader2, CheckCircle, XCircle, Trash2, Download, Tag } from 'lucide-react';

interface FilePreviewListProps {
  files: ProcessedFile[];
  onRemove: (id: string) => void;
  onDownload: (file: ProcessedFile) => void;
}

export const FilePreviewList: React.FC<FilePreviewListProps> = ({ files, onRemove, onDownload }) => {
  if (files.length === 0) return null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-8">
      {files.map((file) => (
        <div 
          key={file.id} 
          className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col group hover:shadow-md transition-shadow"
        >
          <div className="relative h-32 bg-slate-100 border-b border-slate-100">
            <img 
              src={file.previewUrl} 
              alt={file.file.name} 
              className="w-full h-full object-cover"
            />
            <div className="absolute top-2 right-2 flex gap-1">
              {file.status === ProcessingStatus.COMPLETED && (
                <button 
                  onClick={() => onDownload(file)}
                  className="p-1.5 bg-white/90 text-emerald-600 rounded-full hover:bg-emerald-50 transition-colors shadow-sm"
                  title="Download Excel"
                >
                  <Download size={16} />
                </button>
              )}
               {file.status === ProcessingStatus.IDLE && (
                <button 
                  onClick={() => onRemove(file.id)}
                  className="p-1.5 bg-white/90 text-red-500 rounded-full hover:bg-red-50 transition-colors shadow-sm"
                  title="Remove"
                >
                  <Trash2 size={16} />
                </button>
              )}
            </div>
          </div>

          <div className="p-4 flex-1 flex flex-col justify-between">
            <div>
              <div className="flex items-start justify-between gap-2">
                <h4 className="font-medium text-slate-900 truncate" title={file.file.name}>
                  {file.file.name}
                </h4>
                <StatusIcon status={file.status} />
              </div>
              <p className="text-xs text-slate-500 mt-1">
                {(file.file.size / 1024).toFixed(1)} KB
              </p>
              
              {/* Subject Tag */}
              {file.result?.subject && (
                <div className="mt-2 flex items-center gap-1.5 text-xs text-indigo-600 bg-indigo-50 w-fit px-2 py-1 rounded-md">
                  <Tag size={12} />
                  <span className="font-medium">{file.result.subject}</span>
                </div>
              )}
            </div>
            
            <div className="mt-4 flex items-center justify-between">
              <div>
                {file.status === ProcessingStatus.ERROR && (
                  <p className="text-xs text-red-600 bg-red-50 p-2 rounded border border-red-100">
                    {file.error || "Failed to process"}
                  </p>
                )}
                {file.status === ProcessingStatus.COMPLETED && (
                  <div className="flex items-center gap-2 text-xs text-green-700 bg-green-50 p-2 rounded border border-green-100">
                    <FileSpreadsheet size={14} />
                    <span>
                      {file.result?.rows.length || 0} rows extracted
                    </span>
                  </div>
                )}
                 {file.status === ProcessingStatus.PROCESSING && (
                  <div className="text-xs text-indigo-600 flex items-center gap-2 animate-pulse">
                     Processing...
                  </div>
                )}
              </div>
              
              {/* Secondary Download Action in footer for visibility */}
              {file.status === ProcessingStatus.COMPLETED && (
                 <button
                   onClick={() => onDownload(file)}
                   className="text-xs font-medium text-emerald-600 hover:text-emerald-700 flex items-center gap-1 hover:underline"
                 >
                   Download
                 </button>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

const StatusIcon = ({ status }: { status: ProcessingStatus }) => {
  switch (status) {
    case ProcessingStatus.PROCESSING:
      return <Loader2 size={18} className="text-indigo-500 animate-spin" />;
    case ProcessingStatus.COMPLETED:
      return <CheckCircle size={18} className="text-emerald-500" />;
    case ProcessingStatus.ERROR:
      return <XCircle size={18} className="text-red-500" />;
    default:
      return <div className="w-4 h-4 rounded-full border-2 border-slate-300" />;
  }
};