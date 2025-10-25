'use client';

import { useEffect, useState } from 'react';
import { FileText, Clock } from 'lucide-react';
import { documentApi } from '@/lib/api';
import type { Document } from '@/types';
import { getRatingInfo } from '@/types';

interface DocumentListProps {
  onSelectDocument: (id: string) => void;
}

export default function DocumentList({ onSelectDocument }: DocumentListProps) {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDocuments = async () => {
      try {
        const data = await documentApi.list();
        setDocuments(data.documents);
      } catch (err) {
        console.error('Failed to load documents:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDocuments();
    const interval = setInterval(fetchDocuments, 5000);

    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Recent Documents
        </h3>
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        Recent Documents
      </h3>

      {documents.length === 0 ? (
        <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-8">
          No documents yet. Upload your first document to get started.
        </p>
      ) : (
        <div className="space-y-3">
          {documents.map((doc) => (
            <button
              key={doc.id}
              onClick={() => doc.status === 'COMPLETED' && onSelectDocument(doc.id)}
              disabled={doc.status !== 'COMPLETED'}
              className={`
                w-full text-left p-4 rounded-lg border transition-all
                ${
                  doc.status === 'COMPLETED'
                    ? 'border-gray-200 dark:border-gray-700 hover:border-blue-500 dark:hover:border-blue-400 hover:shadow-md cursor-pointer'
                    : 'border-gray-100 dark:border-gray-800 opacity-60 cursor-not-allowed'
                }
              `}
            >
              <div className="flex items-start space-x-3">
                <FileText className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />

                <div className="flex-grow min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                    {doc.filename}
                  </p>

                  <div className="flex items-center space-x-2 mt-1">
                    <Clock className="w-3 h-3 text-gray-400" />
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {new Date(doc.uploadedAt).toLocaleDateString()}
                    </span>
                  </div>

                  <div className="mt-2 flex items-center space-x-2">
                    {doc.status === 'COMPLETED' && doc.overallRating !== undefined ? (
                      <>
                        <span
                          className={`px-2 py-0.5 text-xs font-medium text-white rounded ${
                            getRatingInfo(doc.overallRating).color
                          }`}
                        >
                          {doc.overallRating}/5
                        </span>
                        {doc.confidence !== undefined && (
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {(doc.confidence * 100).toFixed(0)}% conf.
                          </span>
                        )}
                      </>
                    ) : (
                      <span
                        className={`text-xs px-2 py-0.5 rounded ${
                          doc.status === 'PROCESSING'
                            ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                            : doc.status === 'FAILED'
                            ? 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300'
                            : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                        }`}
                      >
                        {doc.status}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
