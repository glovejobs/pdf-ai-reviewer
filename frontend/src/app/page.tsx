'use client';

import { useState } from 'react';
import UploadZone from '@/components/UploadZone';
import AnalysisProgress from '@/components/AnalysisProgress';
import ResultsView from '@/components/ResultsView';
import DocumentList from '@/components/DocumentList';

export default function Home() {
  const [activeDocumentId, setActiveDocumentId] = useState<string | null>(null);
  const [view, setView] = useState<'upload' | 'progress' | 'results'>('upload');
  const [activeTab, setActiveTab] = useState<'upload' | 'history' | 'training'>('upload');
  const [documentMode, setDocumentMode] = useState<'single' | 'multiple'>('single');

  const handleUploadComplete = (documentId: string) => {
    setActiveDocumentId(documentId);
    setView('progress');
  };

  const handleAnalysisComplete = () => {
    setView('results');
  };

  const handleReset = () => {
    setActiveDocumentId(null);
    setView('upload');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation Bar */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Logo and Title */}
            <div className="flex items-center gap-2">
              <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <h1 className="text-xl font-semibold text-gray-900">Content Review</h1>
            </div>

            {/* Navigation Tabs */}
            <nav className="flex items-center gap-8">
              <button
                onClick={() => setActiveTab('upload')}
                className={`flex items-center gap-2 text-sm font-medium transition-colors ${
                  activeTab === 'upload' ? 'text-blue-600' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                Upload File
              </button>
              <button
                onClick={() => setActiveTab('history')}
                className={`flex items-center gap-2 text-sm font-medium transition-colors ${
                  activeTab === 'history' ? 'text-blue-600' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                History
              </button>
              <button
                onClick={() => setActiveTab('training')}
                className={`flex items-center gap-2 text-sm font-medium transition-colors ${
                  activeTab === 'training' ? 'text-blue-600' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
                Content Training
              </button>
            </nav>

            {/* Profile Avatar */}
            <div className="w-10 h-10 rounded-full bg-yellow-400 flex items-center justify-center text-lg font-semibold text-gray-900">
              GC
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8">
        {activeTab === 'upload' && (
          <>
            {/* Document Mode Tabs */}
            <div className="flex items-center justify-center gap-4 mb-8">
              <button
                onClick={() => setDocumentMode('single')}
                className={`px-8 py-3 rounded-lg text-sm font-medium transition-all ${
                  documentMode === 'single'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'bg-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Single Document
              </button>
              <button
                onClick={() => setDocumentMode('multiple')}
                className={`px-8 py-3 rounded-lg text-sm font-medium transition-all ${
                  documentMode === 'multiple'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'bg-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Multiple Document
              </button>
            </div>

            {/* Main Content */}
            {view === 'upload' && (
              <UploadZone onUploadComplete={handleUploadComplete} />
            )}

            {view === 'progress' && activeDocumentId && (
              <AnalysisProgress
                documentId={activeDocumentId}
                onComplete={handleAnalysisComplete}
                onReset={handleReset}
              />
            )}

            {view === 'results' && activeDocumentId && (
              <ResultsView
                documentId={activeDocumentId}
                onReset={handleReset}
              />
            )}
          </>
        )}

        {activeTab === 'history' && (
          <div className="bg-white rounded-lg shadow-sm p-8">
            <DocumentList onSelectDocument={(id) => {
              setActiveDocumentId(id);
              setView('results');
              setActiveTab('upload');
            }} />
          </div>
        )}

        {activeTab === 'training' && (
          <div className="bg-white rounded-lg shadow-sm p-8 text-center text-gray-500">
            <p>Content Training feature coming soon...</p>
          </div>
        )}
      </main>
    </div>
  );
}
