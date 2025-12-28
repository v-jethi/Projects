'use client';

/**
 * Main Page - Itinerary Generator Test Interface
 * 
 * This is a simple test interface to try out the AI itinerary generator.
 * You can use this to test the API before building the full UI.
 */

import { useState } from 'react';
import { ItineraryInput } from '@/types';
import { useTheme } from '@/contexts/ThemeContext';
import DestinationInput from '@/components/DestinationInput';

export default function Home() {
  const { theme, toggleTheme } = useTheme();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [aiRawResponse, setAiRawResponse] = useState<string | null>(null);
  const [lastPayload, setLastPayload] = useState<ItineraryInput | null>(null);
  const [pdfLoading, setPdfLoading] = useState(false);

  const [formData, setFormData] = useState<ItineraryInput>({
    destination: 'Tokyo, Japan',
    duration: 5,
    budget: {
      min: 500,
      max: 2000,
      currency: 'USD'
    },
    travelStyle: 'mid-range',
    groupSize: 2,
  });

  // Raw text inputs for comma-separated fields
  const [dietaryText, setDietaryText] = useState('');
  const [allergyText, setAllergyText] = useState('');
  const [interestsText, setInterestsText] = useState('');
  const [commentsText, setCommentsText] = useState('');

  // Budget validation
  const minBudget = formData.budget?.min ?? 0;
  const maxBudget = formData.budget?.max ?? 0;
  const isBudgetInvalid = maxBudget < minBudget;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setAiRawResponse(null);

    try {
      // Build payload using user inputs (backend will turn this into a plain-text prompt)
      const payload: ItineraryInput = {
        ...formData,
        dietaryRestrictions: dietaryText
          ? dietaryText.split(',').map(s => s.trim()).filter(Boolean)
          : undefined,
        allergies: allergyText
          ? allergyText.split(',').map(s => s.trim()).filter(Boolean)
          : undefined,
        interests: interestsText
          ? interestsText.split(',').map(s => s.trim()).filter(Boolean)
          : undefined,
        comments: commentsText.trim() || undefined,
      };

      const response = await fetch('/api/generate-itinerary', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const text = await response.text();

      if (!response.ok) {
        throw new Error(text || 'Failed to call AI');
      }

      // Store the plain-text AI response
      setAiRawResponse(text);
      setLastPayload(payload);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const downloadPdf = async () => {
    if (!lastPayload) return;
    setPdfLoading(true);
    setError(null);

    try {
      const body = { ...lastPayload, rawText: aiRawResponse } as any;
      const res = await fetch('/api/generate-itinerary?format=pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const txt = await res.text();
        throw new Error(txt || 'Failed to generate PDF');
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const dest = lastPayload.destination || 'itinerary';
      const firstPart = dest.split(',')[0].trim();
      const safeName = firstPart.replace(/\s+/g, '_').replace(/[^A-Za-z0-9_\-]/g, '') || 'itinerary';
      a.download = `${safeName}_itinerary.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error downloading PDF');
      console.error('PDF download error:', err);
    } finally {
      setPdfLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-tan-bg to-tan-light dark:from-gray-900 dark:to-gray-800 py-12 px-4 transition-colors duration-300">
      {/* Theme Toggle - Top Right */}
      <div className="fixed top-4 right-4 z-50">
        <button
          onClick={toggleTheme}
          className="p-3 rounded-full bg-tan-lighter dark:bg-gray-800 shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-200 dark:border-gray-700"
          aria-label="Toggle theme"
        >
          {theme === 'light' ? (
            <svg className="w-6 h-6 text-gray-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
            </svg>
          ) : (
            <svg className="w-6 h-6 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          )}
        </button>
      </div>

      {/* Page Title */}
      <div className="max-w-7xl mx-auto mb-8">
        <h1 className="text-5xl font-bold text-gray-800 dark:text-gray-100 text-center">
          Itinerary Generator
        </h1>
      </div>

      {/* Two Column Layout */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Side - Input Form */}
        <div className="bg-tan-lighter dark:bg-gray-800 rounded-lg shadow-xl p-8 border border-gray-200 dark:border-gray-700 transition-colors duration-300">

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Destination */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Destination *
              </label>
              <DestinationInput
                value={formData.destination}
                onChange={(value) => setFormData({ ...formData, destination: value })}
                placeholder="e.g., Tokyo, Japan"
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-tan-lighter dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 transition-colors duration-300"
              />
            </div>

            {/* Duration */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                How many days are you traveling for? *
              </label>
              <input
                type="text"
                inputMode="numeric"
                required
                value={formData.duration || ''}
                onChange={(e) => {
                  // Strip all non-digit characters
                  const numeric = e.target.value.replace(/\D/g, '');
                  setFormData({
                    ...formData,
                    duration: numeric === '' ? 0 : parseInt(numeric, 10),
                  });
                }}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-tan-lighter dark:bg-gray-700 text-gray-900 dark:text-gray-100 transition-colors duration-300"
                placeholder="e.g., 5"
              />
            </div>

            {/* Budget */}
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Min Budget
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="\d*"
                  value={formData.budget?.min ?? ''}
                  onKeyDown={(e) => {
                    // allow ctrl/cmd shortcuts
                    if (e.ctrlKey || e.metaKey) return;
                    const allowed = ['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'Home', 'End', 'Tab'];
                    if (allowed.includes(e.key)) return;
                    if (!/^[0-9]$/.test(e.key)) e.preventDefault();
                  }}
                  onChange={(e) => {
                    // strip non-digits
                    const raw = e.target.value.replace(/\D/g, '');
                    const parsed = raw === '' ? undefined : parseInt(raw, 10);
                    setFormData({
                      ...formData,
                      budget: {
                        ...(formData.budget || {}),
                        min: parsed as any,
                      }
                    });
                  }}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-tan-lighter dark:bg-gray-700 text-gray-900 dark:text-gray-100 transition-colors duration-300"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Max Budget
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="\d*"
                  value={formData.budget?.max ?? ''}
                  onKeyDown={(e) => {
                    if (e.ctrlKey || e.metaKey) return;
                    const allowed = ['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'Home', 'End', 'Tab'];
                    if (allowed.includes(e.key)) return;
                    if (!/^[0-9]$/.test(e.key)) e.preventDefault();
                  }}
                  onChange={(e) => {
                    const raw = e.target.value.replace(/\D/g, '');
                    const parsed = raw === '' ? undefined : parseInt(raw, 10);
                    setFormData({
                      ...formData,
                      budget: {
                        ...(formData.budget || {}),
                        max: parsed as any,
                      }
                    });
                  }}
                  className="w-full px-4 py-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-tan-lighter dark:bg-gray-700 text-gray-900 dark:text-gray-100 transition-colors duration-300"
                  style={isBudgetInvalid ? { backgroundColor: '#B91C1C', color: '#ffffff' } : undefined}
                  title={isBudgetInvalid ? 'Please make sure the Max budget is greater than the Min budget.' : undefined}
                  aria-invalid={isBudgetInvalid}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Currency
                </label>
                <select
                  value={formData.budget?.currency || 'USD'}
                  onChange={(e) => setFormData({
                    ...formData,
                    budget: { ...(formData.budget || {}), currency: e.target.value }
                  })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-tan-lighter dark:bg-gray-700 text-gray-900 dark:text-gray-100 transition-colors duration-300"
                >
                  <option value="USD">USD ($)</option>
                  <option value="EUR">EUR (€)</option>
                  <option value="GBP">GBP (£)</option>
                  <option value="JPY">JPY (¥)</option>
                  <option value="CAD">CAD (C$)</option>
                </select>
              </div>
            </div>

            {/* Travel Style */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Travel Style
              </label>
              <select
                value={formData.travelStyle || 'mid-range'}
                onChange={(e) => setFormData({ ...formData, travelStyle: e.target.value as any })}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              >
                <option value="budget">Budget</option>
                <option value="mid-range">Mid-Range</option>
                <option value="luxury">Luxury</option>
              </select>
            </div>

            {/* Dietary Restrictions */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Dietary Restrictions
              </label>
              <input
                type="text"
                value={dietaryText}
                onChange={(e) => setDietaryText(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-tan-lighter dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 transition-colors duration-300"
                placeholder="e.g., vegetarian, vegan, halal"
              />
            </div>

            {/* Allergies */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Allergies
              </label>
              <input
                type="text"
                value={allergyText}
                onChange={(e) => setAllergyText(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-tan-lighter dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 transition-colors duration-300"
                placeholder="e.g., peanuts, shellfish, dairy"
              />
            </div>

            {/* Interests */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Interests
              </label>
              <input
                type="text"
                value={interestsText}
                onChange={(e) => setInterestsText(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-tan-lighter dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 transition-colors duration-300"
                placeholder="e.g., food, culture, history, nature, art"
              />
            </div>

            {/* Additional Comments */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Additional Comments
              </label>
              <textarea
                value={commentsText}
                onChange={(e) => setCommentsText(e.target.value)}
                rows={4}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-tan-lighter dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 transition-colors duration-300 resize-y"
                placeholder="Any other information you'd like the AI to consider when creating your itinerary..."
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || isBudgetInvalid}
              className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Generating Itinerary... (This may take 30-60 seconds)
                </>
              ) : (
                'Generate Itinerary'
              )}
            </button>
          </form>

          {/* Error Display */}
          {error && (
            <div className="mt-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
              <h3 className="text-red-800 dark:text-red-400 font-semibold mb-2">❌ Error</h3>
              <p className="text-red-600 dark:text-red-300">{error}</p>
              {error.includes('API key') && (
                <div className="mt-4 p-4 bg-red-100 rounded">
                  <p className="text-sm text-red-800">
                    <strong>Setup Required:</strong> Make sure your <code className="bg-red-200 px-2 py-1 rounded">.env.local</code> file exists in the P1 folder with:
                    <br />
                    <code className="bg-red-200 px-2 py-1 rounded mt-2 inline-block">OPENAI_API_KEY=your_key_here</code>
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Side - Generated Itinerary */}
        <div className="bg-tan-lighter dark:bg-gray-800 rounded-lg shadow-xl p-8 border border-gray-200 dark:border-gray-700 transition-colors duration-300 flex flex-col max-h-[80vh]">
          <div className="mb-6 flex items-center justify-between gap-4 flex-shrink-0">
            <h2 className="text-3xl font-bold text-gray-800 dark:text-gray-100">
              Generated Itinerary
            </h2>
            <div>
              <button
                onClick={downloadPdf}
                disabled={!lastPayload || pdfLoading}
                className="ml-4 inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
              >
                {pdfLoading ? 'Preparing PDF…' : 'Download PDF'}
              </button>
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto min-h-0 pr-2">
            {aiRawResponse ? (
              <div className="whitespace-pre-wrap text-gray-800 dark:text-gray-100 text-sm">
                {aiRawResponse}
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-gray-500 dark:text-gray-400">
                  Your generated itinerary will appear here
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

