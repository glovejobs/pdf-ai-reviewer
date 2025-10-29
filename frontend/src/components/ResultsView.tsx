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
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-10 max-w-5xl mx-auto">
        {/* Go Back Button */}
        <button
          onClick={onReset}
          className="flex items-center gap-2 text-gray-500 hover:text-gray-900 mb-8 transition-all hover:gap-3 group"
        >
          <ArrowLeft className="w-5 h-5 transition-transform group-hover:-translate-x-1" />
          <span className="font-semibold">Back</span>
        </button>

        {/* Rating Summary Title */}
        <div className="mb-12 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Content Rating Summary</h2>
          <p className="text-gray-500 text-lg">Comprehensive analysis and safety evaluation</p>
        </div>

        {/* Content Rating Gauge */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-6 text-center">Content Rating</h3>

          <div className="bg-gradient-to-br from-gray-50 to-white rounded-2xl p-10 max-w-lg mx-auto border border-gray-100 shadow-sm">
            {/* Gauge SVG */}
            <div className="relative w-full" style={{ paddingBottom: '50%' }}>
              <svg viewBox="0 0 200 110" className="w-full h-full absolute top-0 left-0">
                {/* Background arc - perfect semicircle divided into 5 equal segments */}
                {/* Each segment is exactly 36 degrees (180/5 = 36°) */}

                {/* Green segment (0-1) - 180° to 144° */}
                <path
                  d="M 20 100 A 80 80 0 0 1 35.28 52.98"
                  fill="none"
                  stroke="#22c55e"
                  strokeWidth="16"
                  strokeLinecap="butt"
                />

                {/* Lime segment (1-2) - 144° to 108° */}
                <path
                  d="M 35.28 52.98 A 80 80 0 0 1 75.28 23.92"
                  fill="none"
                  stroke="#84cc16"
                  strokeWidth="16"
                  strokeLinecap="butt"
                />

                {/* Yellow segment (2-3) - 108° to 72° */}
                <path
                  d="M 75.28 23.92 A 80 80 0 0 1 124.72 23.92"
                  fill="none"
                  stroke="#facc15"
                  strokeWidth="16"
                  strokeLinecap="butt"
                />

                {/* Orange segment (3-4) - 72° to 36° */}
                <path
                  d="M 124.72 23.92 A 80 80 0 0 1 164.72 52.98"
                  fill="none"
                  stroke="#f97316"
                  strokeWidth="16"
                  strokeLinecap="butt"
                />

                {/* Red segment (4-5) - 36° to 0° */}
                <path
                  d="M 164.72 52.98 A 80 80 0 0 1 180 100"
                  fill="none"
                  stroke="#ef4444"
                  strokeWidth="16"
                  strokeLinecap="butt"
                />

                {/* Needle - BLACK and accurately points to rating position */}
                <line
                  x1="100"
                  y1="100"
                  x2={100 + 65 * Math.cos(Math.PI - (result.result.overallRating / 5) * Math.PI)}
                  y2={100 - 65 * Math.sin(Math.PI - (result.result.overallRating / 5) * Math.PI)}
                  stroke="#1f2937"
                  strokeWidth="3"
                  strokeLinecap="round"
                />

                {/* Center dot */}
                <circle cx="100" cy="100" r="5" fill="#1f2937" />

                {/* Scale labels */}
                <text x="20" y="110" fontSize="10" fill="#6b7280" textAnchor="middle" fontWeight="600">0</text>
                <text x="180" y="110" fontSize="10" fill="#6b7280" textAnchor="middle" fontWeight="600">5</text>
              </svg>
            </div>

            {/* Score Display with color matching gauge */}
            <div className="text-center mt-4">
              <div className={`text-5xl font-bold ${
                result.result.overallRating === 0 ? 'text-green-500' :
                result.result.overallRating === 1 ? 'text-lime-500' :
                result.result.overallRating === 2 ? 'text-yellow-400' :
                result.result.overallRating === 3 ? 'text-orange-500' :
                result.result.overallRating === 4 ? 'text-red-500' : 'text-red-600'
              }`}>
                {result.result.overallRating}
                <span className="text-3xl text-gray-500">/5</span>
              </div>
              <p className="text-xl font-semibold text-gray-700 mt-2">{result.result.ratingName}</p>
              <p className="text-sm text-gray-500 mt-1">
                {Math.round(result.result.confidence * 100)}% confidence
              </p>
            </div>

            {/* Additional Info Cards */}
            <div className="grid grid-cols-2 gap-3 mt-6 pt-6 border-t border-gray-200">
              <div className="text-center">
                <p className="text-xs text-gray-500 uppercase tracking-wide">Status</p>
                <p className="text-sm font-semibold text-gray-900 mt-1">
                  {result.result.overallRating <= 1 ? 'Safe' :
                   result.result.overallRating <= 3 ? 'Advisory' : 'Restricted'}
                </p>
              </div>
              <div className="text-center">
                <p className="text-xs text-gray-500 uppercase tracking-wide">Total Flags</p>
                <p className="text-sm font-semibold text-gray-900 mt-1">
                  {result.result.evidence?.length || 0}
                </p>
              </div>
            </div>
          </div>

          {/* Rating Scale Legend - Full Width Alignment */}
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200 mt-6">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Rating Scale Guide</p>
            <div className="grid grid-cols-6 gap-2">
              {[
                {
                  rating: 0,
                  label: 'All Ages',
                  color: 'bg-green-500',
                  description: 'Content appropriate for all ages',
                  details: 'Mild, inexplicit violence • No profanity or slurs • No hate speech • No nudity or sexual content • No drugs or alcohol references'
                },
                {
                  rating: 1,
                  label: 'Juvenile Advisory',
                  color: 'bg-lime-500',
                  description: 'Some content may not be appropriate for young children',
                  details: 'Mild violence and bullying • Mild/infrequent profanity • Mild hate speech references • Non-sexual nudity • No drugs/alcohol • Infrequent death references'
                },
                {
                  rating: 2,
                  label: 'Youth Advisory',
                  color: 'bg-yellow-400',
                  description: 'Some content may not be appropriate for children under 13',
                  details: 'Moderate violence and bullying • Moderate profanity • Moderate hate justification • Non-sexual nudity including genitalia • Inexplicit sexual content • Moderate drug/alcohol references'
                },
                {
                  rating: 3,
                  label: 'Youth Restricted',
                  color: 'bg-orange-500',
                  description: 'Under 18 requires guidance of parent or guardian',
                  details: 'Excessive/explicit violence and gore • Excessive profanity • Extreme hate justification • Sexual nudity • Sexual activity descriptions (not penetrative) • Frequent drug/alcohol use • Self-harm references'
                },
                {
                  rating: 4,
                  label: 'Adults Only',
                  color: 'bg-red-500',
                  description: 'Adult content. No child under 18 years of age',
                  details: 'Graphic violence and gore • Extreme profanity • Explicit sexual nudity and organs • Sexual activities (penetrative) • Obscene religious content • BDSM, sex toys, kinks references'
                },
                {
                  rating: 5,
                  label: 'Deviant Content',
                  color: 'bg-red-600',
                  description: 'Adult only - aberrant content',
                  details: 'Animal cruelty, cannibalism, body horror • Obscene profanity • Aberrant sexual activities (assault, bestiality, abuse) • Excessive graphic sex acts • BDSM (bondage, discipline, dominance)'
                },
              ].map(item => {
                // Get color hex values for the colored strip
                const colorMap: Record<string, string> = {
                  'bg-green-500': '#22c55e',
                  'bg-lime-500': '#84cc16',
                  'bg-yellow-400': '#facc15',
                  'bg-orange-500': '#f97316',
                  'bg-red-500': '#ef4444',
                  'bg-red-600': '#dc2626',
                };
                const hexColor = colorMap[item.color] || '#22c55e';

                return (
                  <div
                    key={item.rating}
                    className={`group relative flex flex-col items-center gap-2 px-2 py-2 rounded cursor-help transition-all ${
                      result.result.overallRating === item.rating ? 'bg-white border-2 border-gray-400 shadow-sm' : 'bg-transparent hover:bg-white/50'
                    }`}
                  >
                    <div className={`w-6 h-6 rounded-full ${item.color} z-10 relative`}></div>
                    <div className="text-center">
                      <div className="text-sm font-bold text-gray-900">{item.rating}</div>
                      <div className="text-xs text-gray-600 leading-tight">{item.label}</div>
                    </div>

                    {/* Connector Line on Hover */}
                    <div
                      className="absolute top-0 left-1/2 -translate-x-1/2 w-0.5 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-40"
                      style={{
                        height: 'calc(100% - 24px)',
                        background: hexColor,
                        top: '-45px'
                      }}
                    ></div>

                    {/* Tooltip - Modern Light Design */}
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-12 w-80 bg-white rounded-xl shadow-2xl border border-gray-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 pointer-events-none overflow-hidden">
                      {/* Colored Left Border */}
                      <div
                        className="absolute left-0 top-0 bottom-0 w-1"
                        style={{ backgroundColor: hexColor }}
                      ></div>

                      {/* Content */}
                      <div className="p-5 pl-6">
                        <div className="flex items-center gap-2 mb-3">
                          <div className={`w-3 h-3 rounded-full ${item.color}`}></div>
                          <div className="font-bold text-base text-gray-900">{item.label}</div>
                        </div>
                        <div className="text-sm text-gray-600 mb-3 font-medium">{item.description}</div>
                        <div className="text-xs text-gray-700 leading-relaxed space-y-1">
                          {item.details.split(' • ').map((detail, idx) => (
                            <div key={idx} className="flex items-start gap-2">
                              <span className="text-gray-400 mt-1">•</span>
                              <span>{detail}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Arrow at Bottom */}
                      <div
                        className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 w-0 h-0 border-l-6 border-r-6 border-t-6 border-l-transparent border-r-transparent border-t-white"
                        style={{
                          filter: 'drop-shadow(0 2px 1px rgba(0,0,0,0.1))'
                        }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
            <p className="text-xs text-gray-500 text-center mt-3 italic">Hover over each rating for details</p>
          </div>
        </div>

        {/* Word Count Category */}
        <div className="mb-12">
          <h3 className="text-xl font-semibold text-gray-900 mb-6">Flagged Content by Category</h3>
          <div className="grid grid-cols-4 gap-5">
            {[
              { label: 'Violence', count: wordCounts.violence, category: 'violence' as CategoryFilter, gradient: 'from-red-50 to-red-100/50' },
              { label: 'Nudity', count: wordCounts.nudity, category: 'nudity' as CategoryFilter, gradient: 'from-purple-50 to-purple-100/50' },
              { label: 'Profanity', count: wordCounts.profanity, category: 'profanity' as CategoryFilter, gradient: 'from-orange-50 to-orange-100/50' },
              { label: 'Offensive', count: wordCounts.offensive, category: 'offensive' as CategoryFilter, gradient: 'from-yellow-50 to-yellow-100/50' },
            ].map(item => (
              <div key={item.label} className={`bg-gradient-to-br ${item.gradient} rounded-xl p-6 text-center border border-gray-100 hover:shadow-md transition-all group`}>
                <p className="text-sm font-semibold text-gray-600 mb-3 uppercase tracking-wide">{item.label}</p>
                <p className="text-4xl font-bold text-gray-900 mb-4">{item.count}</p>
                <button
                  onClick={() => handleCategoryClick(item.category)}
                  className="text-blue-600 text-sm font-semibold hover:text-blue-700 transition-colors flex items-center gap-1 mx-auto group-hover:gap-2"
                >
                  View details
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Rationale Summary */}
        <div className="mb-12">
          <div className="bg-blue-50/50 border-l-4 border-blue-500 rounded-r-xl p-6">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div className="flex-1">
                <h4 className="text-lg font-bold text-gray-900 mb-3">Analysis Summary</h4>
                <p className="text-gray-700 leading-relaxed text-base">
                  {result.result.summary || 'No summary available.'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Keyword Frequency Chart */}
        {result.result.flaggedTerms && result.result.flaggedTerms.total > 0 && (
          <div className="mb-12">
            <h3 className="text-xl font-semibold text-gray-900 mb-6">Flagged Terms Distribution</h3>
            <div className="bg-gradient-to-br from-gray-50 to-white rounded-2xl p-8 border border-gray-100 shadow-sm">
              <div className="flex items-end justify-around h-72 gap-6">
                {Object.entries(result.result.flaggedTerms.byCategory).map(([category, count]) => {
                  const percentage = Math.round((count as number / result.result.flaggedTerms.total) * 100);

                  // Category-specific colors matching the design system
                  const categoryColors: Record<string, { bar: string, hover: string, gradient: string }> = {
                    violence: { bar: 'bg-red-500', hover: 'hover:bg-red-600', gradient: 'from-red-500 to-red-600' },
                    sexual: { bar: 'bg-purple-500', hover: 'hover:bg-purple-600', gradient: 'from-purple-500 to-purple-600' },
                    profanity: { bar: 'bg-orange-500', hover: 'hover:bg-orange-600', gradient: 'from-orange-500 to-orange-600' },
                    hate: { bar: 'bg-yellow-500', hover: 'hover:bg-yellow-600', gradient: 'from-yellow-500 to-yellow-600' },
                    selfharm: { bar: 'bg-pink-500', hover: 'hover:bg-pink-600', gradient: 'from-pink-500 to-pink-600' },
                  };

                  const colors = categoryColors[category.toLowerCase()] || { bar: 'bg-blue-500', hover: 'hover:bg-blue-600', gradient: 'from-blue-500 to-blue-600' };

                  return (
                    <div key={category} className="flex flex-col items-center flex-1 group">
                      {/* Count Badge on Top */}
                      <div className={`mb-2 px-3 py-1 bg-gradient-to-r ${colors.gradient} text-white rounded-lg text-sm font-bold shadow-sm opacity-0 group-hover:opacity-100 transition-opacity`}>
                        {count}
                      </div>

                      {/* Bar Container */}
                      <div className="w-full flex flex-col justify-end h-full relative">
                        <div
                          className={`${colors.bar} ${colors.hover} rounded-t-xl transition-all shadow-md group-hover:shadow-lg transform group-hover:scale-105 relative`}
                          style={{
                            height: `${Math.max(percentage, 5)}%`,
                            minHeight: '20px'
                          }}
                        >
                          {/* Percentage Label Inside Bar */}
                          <div className="absolute inset-0 flex items-center justify-center">
                            <span className="text-white font-bold text-sm">
                              {percentage}%
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Category Label */}
                      <p className="text-sm font-semibold text-gray-700 mt-3 capitalize">
                        {category.replace('_', ' ')}
                      </p>
                    </div>
                  );
                })}
              </div>

              {/* Total Count Footer */}
              <div className="mt-8 pt-6 border-t border-gray-200 text-center">
                <p className="text-gray-600">
                  <span className="font-semibold text-gray-900 text-lg">{result.result.flaggedTerms.total}</span>
                  <span className="text-sm ml-2">total flagged terms across all categories</span>
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Generate Report Button */}
        <div className="flex justify-center pt-4">
          <button
            onClick={handleGenerateReport}
            className="px-8 py-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-blue-800 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Generate Detailed Report
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
