'use client';

import { useState } from 'react';
import UploadZone from '@/components/UploadZone';
import AnalysisProgress from '@/components/AnalysisProgress';
import ResultsView from '@/components/ResultsView';
import DocumentList from '@/components/DocumentList';

export default function Home() {
  const [activeDocumentId, setActiveDocumentId] = useState<string | null>(null);
  const [view, setView] = useState<'upload' | 'progress' | 'results'>('upload');

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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            AI Content Review System
          </h1>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
            Comprehensive content analysis and rating using AI
          </p>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
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
          </div>

          <div className="lg:col-span-1">
            <DocumentList onSelectDocument={(id) => {
              setActiveDocumentId(id);
              setView('results');
            }} />
          </div>
        </div>
      </main>

      <footer className="mt-12 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <p className="text-center text-sm text-gray-500 dark:text-gray-400">
            AI Content Review System - Powered by OpenAI and Anthropic
          </p>
        </div>
      </footer>
    </div>
  );
}
