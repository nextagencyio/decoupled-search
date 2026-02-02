'use client'

import { isDemoMode } from '@/lib/demo-mode'

export function DemoModeBanner() {
  if (!isDemoMode()) {
    return null
  }

  return (
    <div className="bg-gradient-to-r from-sky-600 to-blue-600 text-white text-center py-2 px-4 text-sm font-medium">
      <span className="inline-flex items-center gap-2">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        Demo Mode - Showing simulated semantic search results.
        <a href="https://decoupled.io" target="_blank" rel="noopener noreferrer" className="underline hover:no-underline">
          Connect to Pinecone
        </a>
      </span>
    </div>
  )
}

export default DemoModeBanner
