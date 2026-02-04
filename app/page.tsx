import Header from './components/Header'
import SearchResults from './components/SearchResults'
import SetupGuide from './components/SetupGuide'
import AlmostThere from './components/AlmostThere'
import { isDemoMode } from '@/lib/demo-mode'

// Check configuration status
function getConfigStatus() {
  const hasDrupal = !!(
    process.env.DRUPAL_BASE_URL || process.env.NEXT_PUBLIC_DRUPAL_BASE_URL
  )
  const hasPinecone = !!process.env.PINECONE_API_KEY

  return { hasDrupal, hasPinecone, isFullyConfigured: hasDrupal && hasPinecone }
}

export default function HomePage() {
  // Demo mode bypasses configuration check
  if (isDemoMode()) {
    return (
      <>
        <Header />
        <main className="py-12 px-4 sm:px-6 lg:px-8">
          <SearchResults />
        </main>
      </>
    )
  }

  const { hasDrupal, isFullyConfigured } = getConfigStatus()

  // Show "Almost There" if Drupal is configured but Pinecone is missing
  if (hasDrupal && !isFullyConfigured) {
    return (
      <>
        <Header />
        <main className="py-12 px-4 sm:px-6 lg:px-8">
          <AlmostThere />
        </main>
      </>
    )
  }

  // Show full setup guide if nothing is configured
  if (!isFullyConfigured) {
    return (
      <>
        <Header />
        <main className="py-12 px-4 sm:px-6 lg:px-8">
          <SetupGuide />
        </main>
      </>
    )
  }

  return (
    <>
      <Header />
      <main className="py-12 px-4 sm:px-6 lg:px-8">
        <SearchResults />
      </main>
    </>
  )
}
