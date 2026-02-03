import { Suspense } from 'react'
import Header from '../components/Header'
import SearchResultsWithParams from '../components/SearchResultsWithParams'
import SetupGuide from '../components/SetupGuide'
import { isDemoMode } from '@/lib/demo-mode'

// Check if required environment variables are set
function isConfigured() {
  return !!(
    process.env.DRUPAL_BASE_URL || process.env.NEXT_PUBLIC_DRUPAL_BASE_URL
  ) && !!(
    process.env.PINECONE_API_KEY
  )
}

export default function SearchPage() {
  // Demo mode bypasses configuration check
  const configured = isDemoMode() || isConfigured()

  return (
    <>
      <Header />
      <main className="py-12 px-4 sm:px-6 lg:px-8">
        {configured ? (
          <Suspense fallback={<SearchLoadingSkeleton />}>
            <SearchResultsWithParams />
          </Suspense>
        ) : (
          <SetupGuide />
        )}
      </main>
    </>
  )
}

function SearchLoadingSkeleton() {
  return (
    <div className="max-w-3xl mx-auto">
      <div className="text-center mb-8">
        <div className="h-12 bg-slate-200 dark:bg-slate-700 rounded-lg w-3/4 mx-auto mb-4 animate-pulse" />
        <div className="h-6 bg-slate-200 dark:bg-slate-700 rounded w-1/2 mx-auto animate-pulse" />
      </div>
      <div className="h-14 bg-slate-200 dark:bg-slate-700 rounded-xl mb-8 animate-pulse" />
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-32 bg-slate-200 dark:bg-slate-700 rounded-xl animate-pulse" />
        ))}
      </div>
    </div>
  )
}
