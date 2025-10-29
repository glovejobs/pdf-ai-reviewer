'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import UploadZone from '@/components/UploadZone';
import AnalysisProgress from '@/components/AnalysisProgress';
import ResultsView from '@/components/ResultsView';
import DocumentList from '@/components/DocumentList';
import AuthModal from '@/components/AuthModal';

export default function Home() {
  const { user, isAdmin, logout } = useAuth();
  const [activeDocumentId, setActiveDocumentId] = useState<string | null>(null);
  const [view, setView] = useState<'upload' | 'progress' | 'results'>('upload');
  const [activeTab, setActiveTab] = useState<'upload' | 'history' | 'training'>('upload');
  const [documentMode, setDocumentMode] = useState<'single' | 'multiple'>('single');
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

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
              {isAdmin && (
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
              )}
            </nav>

            {/* User Profile / Login */}
            {user ? (
              <div className="relative">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center gap-3 hover:bg-gray-50 rounded-lg px-3 py-2 transition-colors"
                >
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-lg font-semibold text-white shadow-md">
                    {user.name?.charAt(0).toUpperCase() || user.email.charAt(0).toUpperCase()}
                  </div>
                  <div className="text-left hidden md:block">
                    <p className="text-sm font-semibold text-gray-900">{user.name || 'User'}</p>
                    <p className="text-xs text-gray-500">{user.role}</p>
                  </div>
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {/* Dropdown Menu */}
                {showUserMenu && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-2xl border border-gray-200 py-2 z-50">
                    <div className="px-4 py-3 border-b border-gray-100">
                      <p className="text-sm font-semibold text-gray-900">{user.name || 'User'}</p>
                      <p className="text-xs text-gray-500 truncate">{user.email}</p>
                      {isAdmin && (
                        <span className="inline-block mt-2 px-2 py-1 bg-blue-100 text-blue-700 text-xs font-semibold rounded">
                          Admin
                        </span>
                      )}
                    </div>
                    <button
                      onClick={() => {
                        logout();
                        setShowUserMenu(false);
                      }}
                      className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors flex items-center gap-2"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                      </svg>
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={() => setShowAuthModal(true)}
                className="px-6 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg font-semibold hover:from-blue-700 hover:to-blue-800 transition-all shadow-md hover:shadow-lg"
              >
                Sign In
              </button>
            )}
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
          <div className="bg-white rounded-lg shadow-sm p-8 text-center">
            {isAdmin ? (
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Content Training</h2>
                <p className="text-gray-600 mb-6">
                  Configure rating guidelines, term lists, and AI prompts to train the content review system.
                </p>
                <div className="bg-blue-50 border-l-4 border-blue-500 p-6 rounded text-left">
                  <p className="text-blue-700 font-medium mb-2">Admin Feature - Under Development</p>
                  <p className="text-blue-600 text-sm">
                    This feature will allow you to:
                  </p>
                  <ul className="list-disc list-inside text-blue-600 text-sm mt-2 space-y-1">
                    <li>Edit rating guidelines and criteria</li>
                    <li>Manage custom term lists</li>
                    <li>Configure AI analysis prompts</li>
                    <li>Adjust system sensitivity thresholds</li>
                    <li>Upload training documents</li>
                  </ul>
                </div>
              </div>
            ) : (
              <div className="text-gray-500">
                <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                <p className="text-lg font-semibold mb-2">Admin Access Required</p>
                <p className="text-sm">This feature is only available to administrators.</p>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Auth Modal */}
      <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />
    </div>
  );
}
