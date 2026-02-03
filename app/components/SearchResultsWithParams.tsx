'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Search, Sparkles, AlertCircle } from 'lucide-react'
import SearchInput from './SearchInput'
import SearchResultCard from './SearchResultCard'
import type { SearchResult } from '@/lib/types'

interface SearchState {
  results: SearchResult[]
  isLoading: boolean
  error: string | null
  hasSearched: boolean
}

export default function SearchResultsWithParams() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const initialQuery = searchParams.get('q') || ''

  const [query, setQuery] = useState(initialQuery)
  const [state, setState] = useState<SearchState>({
    results: [],
    isLoading: !!initialQuery,
    error: null,
    hasSearched: false,
  })

  const search = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setState({ results: [], isLoading: false, error: null, hasSearched: false })
      return
    }

    setState((prev) => ({ ...prev, isLoading: true, error: null }))

    try {
      const response = await fetch(`/api/search?q=${encodeURIComponent(searchQuery)}&limit=10`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Search failed')
      }

      setState({
        results: data.results,
        isLoading: false,
        error: null,
        hasSearched: true,
      })
    } catch (error: any) {
      setState({
        results: [],
        isLoading: false,
        error: error.message || 'Search failed. Please try again.',
        hasSearched: true,
      })
    }
  }, [])

  // Handle query changes and update URL
  const handleQueryChange = useCallback((newQuery: string) => {
    setQuery(newQuery)
    // Update URL without navigation for better UX
    const url = newQuery ? `/search?q=${encodeURIComponent(newQuery)}` : '/search'
    window.history.replaceState({}, '', url)
  }, [])

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      search(query)
    }, 300)

    return () => clearTimeout(timer)
  }, [query, search])

  // Run initial search if query param exists
  useEffect(() => {
    if (initialQuery) {
      search(initialQuery)
    }
  }, []) // Only run once on mount

  const handleClear = () => {
    setQuery('')
    setState({ results: [], isLoading: false, error: null, hasSearched: false })
    window.history.replaceState({}, '', '/search')
  }

  return (
    <div className="max-w-3xl mx-auto">
      {/* Hero Section */}
      <div className="text-center mb-8">
        <h1 className="text-4xl sm:text-5xl font-bold text-slate-900 dark:text-white mb-4">
          Search Our Knowledge Base
        </h1>
        <p className="text-lg text-slate-600 dark:text-slate-300">
          Ask questions naturally. Our AI-powered search understands what you mean, not just what you type.
        </p>
      </div>

      {/* Search Input */}
      <div className="mb-8">
        <SearchInput
          value={query}
          onChange={handleQueryChange}
          onClear={handleClear}
          isLoading={state.isLoading}
          placeholder="Try: How do I build a search interface? or What is TypeScript?"
        />
      </div>

      {/* Results or Empty State */}
      {state.error ? (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-6 text-center">
          <AlertCircle className="w-10 h-10 text-red-500 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-red-800 dark:text-red-200 mb-2">
            Search Error
          </h3>
          <p className="text-red-600 dark:text-red-300">{state.error}</p>
        </div>
      ) : state.hasSearched && state.results.length === 0 ? (
        <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-8 text-center">
          <Search className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-300 mb-2">
            No results found
          </h3>
          <p className="text-slate-500 dark:text-slate-400">
            Try different keywords or check your spelling.
          </p>
        </div>
      ) : state.results.length > 0 ? (
        <div>
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Found <span className="font-semibold text-slate-700 dark:text-slate-200">{state.results.length}</span> results for "{query}"
            </p>
          </div>
          <div className="space-y-4">
            {state.results.map((result, index) => (
              <SearchResultCard
                key={result.id}
                result={result}
                rank={index + 1}
              />
            ))}
          </div>
        </div>
      ) : !state.hasSearched ? (
        <div className="bg-gradient-to-br from-sky-50 to-blue-50 dark:from-sky-900/20 dark:to-blue-900/20 rounded-xl p-8">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-sky-100 dark:bg-sky-900/50 rounded-xl flex items-center justify-center flex-shrink-0">
              <Sparkles className="w-6 h-6 text-sky-600 dark:text-sky-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                Semantic Search Powered by AI
              </h3>
              <p className="text-slate-600 dark:text-slate-300 mb-4">
                This search uses vector embeddings to understand the meaning of your query, not just match keywords. Try asking questions naturally!
              </p>
              <div className="flex flex-wrap gap-2">
                {[
                  'How to use TypeScript',
                  'What is a vector database',
                  'Best practices for React',
                  'Authentication patterns',
                ].map((suggestion) => (
                  <button
                    key={suggestion}
                    onClick={() => handleQueryChange(suggestion)}
                    className="px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-600 dark:text-slate-300 hover:border-sky-300 dark:hover:border-sky-600 hover:text-sky-600 dark:hover:text-sky-400 transition-colors"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}
