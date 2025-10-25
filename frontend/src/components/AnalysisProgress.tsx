'use client';

import { useEffect, useState } from 'react';
import { FileText, CheckCircle2, Loader2, XCircle } from 'lucide-react';
import { documentApi } from '@/lib/api';
import type { DocumentStatus } from '@/types';

interface AnalysisProgressProps {
  documentId: string;
  onComplete: () => void;
  onReset: () => void;
}

export default function AnalysisProgress({
  documentId,
  onComplete,
  onReset,
}: AnalysisProgressProps) {
  const [status, setStatus] = useState<DocumentStatus | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const pollStatus = async () => {
      try {
        const data = await documentApi.getStatus(documentId);
        setStatus(data);

        if (data.status === 'COMPLETED') {
          setTimeout(() => onComplete(), 1000);
        } else if (data.status === 'FAILED') {
          setError('Analysis failed. Please try again.');
        }
      } catch (err: any) {
        setError(err.response?.data?.error || 'Failed to fetch status');
      }
    };

    pollStatus();
    const interval = setInterval(pollStatus, 2000);

    return () => clearInterval(interval);
  }, [documentId, onComplete]);

  if (error) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
        <div className="flex items-center space-x-3 text-red-600 dark:text-red-400 mb-4">
          <XCircle className="w-8 h-8" />
          <h2 className="text-2xl font-semibold">Analysis Failed</h2>
        </div>
        <p className="text-gray-600 dark:text-gray-300 mb-6">{error}</p>
        <button
          onClick={onReset}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Try Another Document
        </button>
      </div>
    );
  }

  if (!status) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
        <div className="flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
      <div className="flex items-center space-x-3 mb-6">
        <FileText className="w-8 h-8 text-blue-500" />
        <div>
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
            Analyzing Document
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-300">
            {status.filename}
          </p>
        </div>
      </div>

      {/* Overall Progress */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Overall Progress
          </span>
          <span className="text-sm font-semibold text-blue-600 dark:text-blue-400">
            {status.overallProgress}%
          </span>
        </div>
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
          <div
            className="bg-blue-600 h-3 rounded-full transition-all duration-500 ease-out"
            style={{ width: `${status.overallProgress}%` }}
          />
        </div>
      </div>

      {/* Job Steps */}
      <div className="space-y-4">
        {status.jobs.map((job, index) => (
          <div
            key={index}
            className="flex items-center space-x-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
          >
            <div className="flex-shrink-0">
              {job.status === 'COMPLETED' ? (
                <CheckCircle2 className="w-6 h-6 text-green-500" />
              ) : job.status === 'RUNNING' ? (
                <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />
              ) : job.status === 'FAILED' ? (
                <XCircle className="w-6 h-6 text-red-500" />
              ) : (
                <div className="w-6 h-6 rounded-full border-2 border-gray-300 dark:border-gray-600" />
              )}
            </div>

            <div className="flex-grow">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  {formatJobType(job.type)}
                </span>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {job.progress}%
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-1.5">
                <div
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    job.status === 'COMPLETED'
                      ? 'bg-green-500'
                      : job.status === 'RUNNING'
                      ? 'bg-blue-500'
                      : job.status === 'FAILED'
                      ? 'bg-red-500'
                      : 'bg-gray-300 dark:bg-gray-600'
                  }`}
                  style={{ width: `${job.progress}%` }}
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      {status.pageCount && (
        <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <p className="text-sm text-blue-800 dark:text-blue-300">
            Processing {status.pageCount} pages...
          </p>
        </div>
      )}
    </div>
  );
}

function formatJobType(type: string): string {
  return type
    .split('_')
    .map((word) => word.charAt(0) + word.slice(1).toLowerCase())
    .join(' ');
}
