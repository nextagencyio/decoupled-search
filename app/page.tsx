import Header from './components/Header'
import SearchResults from './components/SearchResults'
import SetupGuide from './components/SetupGuide'
import { isDemoMode } from '@/lib/demo-mode'

// Check if required environment variables are set
function isConfigured() {
  return !!(
    process.env.DRUPAL_BASE_URL || process.env.NEXT_PUBLIC_DRUPAL_BASE_URL
  ) && !!(
    process.env.PINECONE_API_KEY
  )
}

export default function HomePage() {
  // Demo mode bypasses configuration check
  const configured = isDemoMode() || isConfigured()

  return (
    <>
      <Header />
      <main className="py-12 px-4 sm:px-6 lg:px-8">
        {configured ? <SearchResults /> : <SetupGuide />}
      </main>
    </>
  )
}
