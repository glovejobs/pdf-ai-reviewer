'use client';

import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, FileText, AlertCircle } from 'lucide-react';
import { documentApi } from '@/lib/api';

interface UploadZoneProps {
  onUploadComplete: (documentId: string) => void;
}

export default function UploadZone({ onUploadComplete }: UploadZoneProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      setError('Only PDF files are supported');
      return;
    }

    setUploading(true);
    setError(null);

    try {
      const response = await documentApi.upload(file);
      onUploadComplete(response.id);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  }, [onUploadComplete]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf']
    },
    maxFiles: 1,
    disabled: uploading
  });

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
      <h2 className="text-2xl font-semibold mb-6 text-gray-900 dark:text-white">
        Upload Document
      </h2>

      <div
        {...getRootProps()}
        className={`
          border-2 border-dashed rounded-lg p-12 text-center cursor-pointer
          transition-all duration-200 ease-in-out
          ${isDragActive
            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
            : 'border-gray-300 dark:border-gray-600 hover:border-blue-400 dark:hover:border-blue-500'
          }
          ${uploading ? 'opacity-50 cursor-not-allowed' : ''}
        `}
      >
        <input {...getInputProps()} />

        <div className="flex flex-col items-center space-y-4">
          {uploading ? (
            <>
              <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500"></div>
              <p className="text-lg text-gray-600 dark:text-gray-300">
                Uploading...
              </p>
            </>
          ) : (
            <>
              {isDragActive ? (
                <FileText className="w-16 h-16 text-blue-500" />
              ) : (
                <Upload className="w-16 h-16 text-gray-400 dark:text-gray-500" />
              )}

              <div className="space-y-2">
                <p className="text-lg font-medium text-gray-900 dark:text-white">
                  {isDragActive
                    ? 'Drop the PDF file here'
                    : 'Drag & drop a PDF file here'}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  or click to browse
                </p>
              </div>

              <div className="text-xs text-gray-400 dark:text-gray-500 space-y-1">
                <p>Supported: PDF files up to 100MB</p>
                <p>Maximum 1000 pages</p>
              </div>
            </>
          )}
        </div>
      </div>

      {error && (
        <div className="mt-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-start space-x-3">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-red-800 dark:text-red-300">
              Upload Error
            </p>
            <p className="text-sm text-red-700 dark:text-red-400 mt-1">
              {error}
            </p>
          </div>
        </div>
      )}

      <div className="mt-8 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
        <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-300 mb-2">
          How it works:
        </h3>
        <ol className="text-sm text-blue-800 dark:text-blue-400 space-y-1 list-decimal list-inside">
          <li>Upload your PDF document</li>
          <li>AI analyzes content for explicit material, violence, and profanity</li>
          <li>Receive a 0-5 rating with detailed evidence</li>
          <li>Export results in multiple formats</li>
        </ol>
      </div>
    </div>
  );
}
