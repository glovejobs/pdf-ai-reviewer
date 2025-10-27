'use client';

import { useEffect, useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { documentApi } from '@/lib/api';
import type { DocumentResult } from '@/types';
import { getRatingInfo } from '@/types';

interface ResultsViewProps {
  documentId: string;
  onReset: () => void;
}

type CategoryFilter = 'all' | 'violence' | 'nudity' | 'profanity' | 'offensive';
type ViewMode = 'summary' | 'excerpts';

export default function ResultsView({ documentId, onReset }: ResultsViewProps) {
  const [result, setResult] = useState<DocumentResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('summary');
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('all');
  const [excerptsTab, setExcerptsTab] = useState<'raw' | 'summary'>('raw');

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

  const handleCategoryClick = (category: CategoryFilter) => {
    setCategoryFilter(category);
    setViewMode('excerpts');
  };

  const handleGenerateReport = () => {
    alert('Report generation feature coming soon!');
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-8">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }

  if (error || !result) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-8">
        <p className="text-red-600">{error || 'No results found'}</p>
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

  // Get filtered excerpts
  const filteredExcerpts = categoryFilter === 'all'
    ? result.result.evidence || []
    : (result.result.evidence || []).filter(e =>
        e.category.toLowerCase() === categoryFilter.toLowerCase() ||
        (categoryFilter === 'offensive' && e.category.toLowerCase().includes('offensive'))
      );

  // Calculate word counts by category
  const wordCounts = {
    violence: (result.result.evidence || []).filter(e => e.category.toLowerCase().includes('violence')).length,
    nudity: (result.result.evidence || []).filter(e => e.category.toLowerCase().includes('sexual') || e.category.toLowerCase().includes('nudity')).length,
    profanity: (result.result.evidence || []).filter(e => e.category.toLowerCase().includes('profanity')).length,
    offensive: (result.result.evidence || []).filter(e => e.category.toLowerCase().includes('offensive') || e.category.toLowerCase().includes('hate')).length,
  };

  if (viewMode === 'summary') {
    return (
      <div className="bg-white rounded-lg shadow-sm p-8 max-w-4xl mx-auto">
        {/* Go Back Button */}
        <button
          onClick={onReset}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="font-medium">Go Back</span>
        </button>

        {/* Rating Summary Title */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-1">Rating Summary</h2>
          <p className="text-gray-600">Final content rating and insights</p>
        </div>

        {/* Content Rating Badge */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Content Rating</h3>
          <div className="flex items-center gap-4">
            <div className={`w-24 h-24 rounded-2xl flex items-center justify-center ${
              result.result.overallRating === 0 ? 'bg-green-500' :
              result.result.overallRating === 1 ? 'bg-green-400' :
              result.result.overallRating === 2 ? 'bg-yellow-400' :
              result.result.overallRating === 3 ? 'bg-orange-500' :
              result.result.overallRating === 4 ? 'bg-red-500' : 'bg-red-600'
            }`}>
              <span className="text-5xl font-bold text-white">{result.result.overallRating}</span>
            </div>
            <div>
              <p className="text-xl font-bold text-gray-900">{result.result.ratingName}</p>
              <p className="text-gray-600">{ratingInfo.description}</p>
            </div>
          </div>
        </div>

        {/* Rating Scale Reference */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Rating Scale Reference</h3>
          <div className="flex gap-2 overflow-x-auto pb-2">
            {[
              { rating: 0, label: 'All Ages', color: 'border-green-500' },
              { rating: 1, label: 'Juvenile Advisory', color: 'border-green-400' },
              { rating: 2, label: 'Youth Advisory', color: 'border-yellow-400' },
              { rating: 3, label: 'Youth Restricted', color: 'border-orange-500' },
              { rating: 4, label: 'Adults Only', color: 'border-red-500' },
              { rating: 5, label: 'Deviant Content', color: 'border-red-600' },
            ].map(item => (
              <div
                key={item.rating}
                className={`flex-shrink-0 px-6 py-4 border-2 rounded-lg text-center ${item.color} ${
                  result.result.overallRating === item.rating ? 'bg-gray-50' : ''
                }`}
              >
                <div className="text-3xl font-bold text-gray-900 mb-1">{item.rating}</div>
                <div className="text-sm font-medium text-gray-700 whitespace-nowrap">{item.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Word Count Category */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Word Count Category</h3>
          <div className="grid grid-cols-4 gap-4">
            {[
              { label: 'Violence', count: wordCounts.violence, category: 'violence' as CategoryFilter },
              { label: 'Nudity', count: wordCounts.nudity, category: 'nudity' as CategoryFilter },
              { label: 'Profanity', count: wordCounts.profanity, category: 'profanity' as CategoryFilter },
              { label: 'Offensive', count: wordCounts.offensive, category: 'offensive' as CategoryFilter },
            ].map(item => (
              <div key={item.label} className="bg-gray-50 rounded-lg p-4 text-center">
                <p className="text-sm text-gray-600 mb-2">{item.label}</p>
                <p className="text-3xl font-bold text-gray-900 mb-2">{item.count}</p>
                <button
                  onClick={() => handleCategoryClick(item.category)}
                  className="text-blue-600 text-sm hover:underline"
                >
                  See details
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Rationale Summary */}
        <div className="mb-8">
          <div className="flex items-start gap-3 bg-gray-50 rounded-lg p-6">
            <svg className="w-6 h-6 text-gray-700 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">Rationale Summary</h4>
              <p className="text-gray-700 leading-relaxed">
                {result.result.summary || 'No summary available.'}
              </p>
            </div>
          </div>
        </div>

        {/* Keyword Frequency Chart */}
        {result.result.flaggedTerms && result.result.flaggedTerms.total > 0 && (
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Keyword Frequency</h3>
            <div className="bg-gray-50 rounded-lg p-6">
              <div className="flex items-end justify-around h-64 gap-4">
                {Object.entries(result.result.flaggedTerms.byCategory).map(([category, count]) => (
                  <div key={category} className="flex flex-col items-center flex-1">
                    <div className="w-full flex flex-col justify-end h-full">
                      <div
                        className="bg-blue-500 rounded-t-lg transition-all hover:bg-blue-600"
                        style={{ height: `${Math.min((count as number / result.result.flaggedTerms.total) * 100, 100)}%` }}
                      ></div>
                    </div>
                    <p className="text-sm text-gray-700 mt-2 capitalize">{category}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Generate Report Button */}
        <div className="flex justify-center">
          <button
            onClick={handleGenerateReport}
            className="px-8 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            Generate Report
          </button>
        </div>
      </div>
    );
  }

  // Raw Excerpts View
  return (
    <div className="bg-white rounded-lg shadow-sm p-8 max-w-5xl mx-auto">
      {/* Go Back Button */}
      <button
        onClick={() => setViewMode('summary')}
        className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 transition-colors"
      >
        <ArrowLeft className="w-5 h-5" />
        <span className="font-medium">Go Back</span>
      </button>

      {/* Analysis Results Title */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-1">Analysis Results</h2>
        <p className="text-gray-600">Review flagged content and detailed findings</p>
      </div>

      {/* Flagged Content Analysis Header */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-semibold text-gray-900">Flagged Content Analysis</h3>
        <div className="flex gap-2">
          <button
            onClick={() => setExcerptsTab('raw')}
            className={`px-6 py-2 rounded-lg font-medium transition-colors ${
              excerptsTab === 'raw'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Raw Excerpts
          </button>
          <button
            onClick={() => setExcerptsTab('summary')}
            className={`px-6 py-2 rounded-lg font-medium transition-colors ${
              excerptsTab === 'summary'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Summary
          </button>
        </div>
      </div>

      {/* Category Filters */}
      <div className="flex gap-2 mb-6 flex-wrap">
        <button
          onClick={() => setCategoryFilter('all')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            categoryFilter === 'all'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          View All ({(result.result.evidence || []).length})
        </button>
        <button
          onClick={() => setCategoryFilter('violence')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            categoryFilter === 'violence'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Violence ({wordCounts.violence})
        </button>
        <button
          onClick={() => setCategoryFilter('nudity')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            categoryFilter === 'nudity'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Nudity ({wordCounts.nudity})
        </button>
        <button
          onClick={() => setCategoryFilter('profanity')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            categoryFilter === 'profanity'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Profanity ({wordCounts.profanity})
        </button>
        <button
          onClick={() => setCategoryFilter('offensive')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            categoryFilter === 'offensive'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Offensive ({wordCounts.offensive})
        </button>
      </div>

      {/* Excerpts List */}
      {excerptsTab === 'raw' ? (
        <div className="space-y-4 mb-8">
          {filteredExcerpts.length > 0 ? (
            filteredExcerpts.map((evidence, idx) => (
              <div key={idx} className="bg-gray-50 rounded-lg p-6 border border-gray-200">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-semibold text-gray-900">
                    {evidence.category.replace('_', ' ')}
                  </span>
                  {evidence.page && (
                    <span className="text-sm text-gray-600">Page {evidence.page}</span>
                  )}
                </div>
                <p className="text-gray-700 italic leading-relaxed">"{evidence.quote}"</p>
              </div>
            ))
          ) : (
            <div className="text-center py-12 text-gray-500">
              <p>No excerpts found for this category.</p>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-gray-50 rounded-lg p-8 mb-8 text-center">
          <p className="text-gray-700">{result.result.summary || 'No summary available.'}</p>
        </div>
      )}

      {/* View Rating Summary Button */}
      <div className="flex justify-center">
        <button
          onClick={() => setViewMode('summary')}
          className="px-8 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
        >
          View Rating Summary
        </button>
      </div>
    </div>
  );
}
