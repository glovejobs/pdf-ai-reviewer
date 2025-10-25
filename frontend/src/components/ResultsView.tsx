'use client';

import { useEffect, useState } from 'react';
import { Download, FileText, AlertTriangle, ArrowLeft } from 'lucide-react';
import { documentApi, reportApi } from '@/lib/api';
import type { DocumentResult } from '@/types';
import { getRatingInfo } from '@/types';

interface ResultsViewProps {
  documentId: string;
  onReset: () => void;
}

export default function ResultsView({ documentId, onReset }: ResultsViewProps) {
  const [result, setResult] = useState<DocumentResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    const fetchResult = async () => {
      try {
        const data = await documentApi.getResult(documentId);
        setResult(data);
      } catch (err: any) {
        setError(err.response?.data?.error || 'Failed to load results');
      } finally {
        setLoading(false);
      }
    };

    fetchResult();
  }, [documentId]);

  const handleExport = async (format: string) => {
    setExporting(true);
    try {
      const blob = await reportApi.export(documentId, format);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${result?.filename}_report.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      alert('Export failed. Please try again.');
    } finally {
      setExporting(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }

  if (error || !result) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
        <p className="text-red-600 dark:text-red-400">{error || 'No results found'}</p>
        <button
          onClick={onReset}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Back
        </button>
      </div>
    );
  }

  const ratingInfo = getRatingInfo(result.result.overallRating);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={onReset}
          className="flex items-center space-x-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>New Analysis</span>
        </button>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => handleExport('json')}
            disabled={exporting}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            <Download className="w-4 h-4" />
            <span>JSON</span>
          </button>
          <button
            onClick={() => handleExport('csv')}
            disabled={exporting}
            className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
          >
            <Download className="w-4 h-4" />
            <span>CSV</span>
          </button>
          <button
            onClick={() => handleExport('markdown')}
            disabled={exporting}
            className="flex items-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 transition-colors"
          >
            <Download className="w-4 h-4" />
            <span>Markdown</span>
          </button>
        </div>
      </div>

      {/* Document Info */}
      <div className="flex items-center space-x-3 mb-6">
        <FileText className="w-8 h-8 text-blue-500" />
        <div>
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
            {result.filename}
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-300">
            {result.pageCount} pages • Analyzed{' '}
            {new Date(result.analyzedAt).toLocaleString()}
          </p>
        </div>
      </div>

      {/* Overall Rating */}
      <div className="mb-8 p-6 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-600 rounded-lg">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">
              Overall Content Rating
            </p>
            <h3 className="text-3xl font-bold text-gray-900 dark:text-white">
              {result.result.overallRating}/5 - {result.result.ratingName}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-300 mt-2">
              Confidence: {(result.result.confidence * 100).toFixed(1)}%
            </p>
          </div>
          <div className={`px-6 py-3 ${ratingInfo.color} rounded-lg`}>
            <span className="text-4xl font-bold text-white">
              {result.result.overallRating}
            </span>
          </div>
        </div>
      </div>

      {/* Category Scores */}
      <div className="mb-8">
        <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Category Breakdown
        </h4>
        <div className="grid grid-cols-2 gap-4">
          <ScoreCard
            label="Violence"
            score={result.result.scores.violence}
          />
          <ScoreCard
            label="Sexual Content"
            score={result.result.scores.sexualContent}
          />
          <ScoreCard
            label="Profanity"
            score={result.result.scores.profanity}
          />
          {result.result.scores.hate !== undefined && (
            <ScoreCard label="Hate Speech" score={result.result.scores.hate} />
          )}
        </div>
      </div>

      {/* Flagged Terms */}
      <div className="mb-8">
        <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Flagged Content
        </h4>
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <AlertTriangle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
            <div className="flex-grow">
              <p className="text-sm font-medium text-yellow-800 dark:text-yellow-300 mb-2">
                Total Flagged Terms: {result.result.flaggedTerms.total}
              </p>
              <div className="grid grid-cols-2 gap-2 text-sm text-yellow-700 dark:text-yellow-400">
                {Object.entries(result.result.flaggedTerms.byCategory).map(
                  ([category, count]) => (
                    <div key={category} className="flex justify-between">
                      <span className="capitalize">{category}:</span>
                      <span className="font-medium">{count as number}</span>
                    </div>
                  )
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Summary */}
      <div className="mb-8">
        <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Analysis Summary
        </h4>
        <div className="prose dark:prose-invert max-w-none">
          <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
            {result.result.summary}
          </p>
        </div>
      </div>

      {/* Evidence */}
      {result.result.evidence && result.result.evidence.length > 0 && (
        <div>
          <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Evidence Examples
          </h4>
          <div className="space-y-3">
            {result.result.evidence.slice(0, 5).map((evidence, idx) => (
              <div
                key={idx}
                className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-gray-600 dark:text-gray-400 uppercase">
                    {evidence.category}
                  </span>
                  {evidence.page && (
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      Page {evidence.page}
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-700 dark:text-gray-300 italic">
                  "{evidence.quote}"
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function ScoreCard({ label, score }: { label: string; score: number }) {
  const percentage = (score / 5) * 100;

  return (
    <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
          {label}
        </span>
        <span className="text-sm font-bold text-gray-900 dark:text-white">
          {score.toFixed(2)}/5
        </span>
      </div>
      <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
        <div
          className={`h-2 rounded-full transition-all ${
            score < 1.5
              ? 'bg-green-500'
              : score < 3
              ? 'bg-yellow-500'
              : score < 4
              ? 'bg-orange-500'
              : 'bg-red-500'
          }`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
