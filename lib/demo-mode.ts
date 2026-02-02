/**
 * Demo Mode Module
 *
 * This file contains ALL demo/mock mode functionality.
 * To remove demo mode from a real project:
 * 1. Delete this file (lib/demo-mode.ts)
 * 2. Delete the data/mock/ directory
 * 3. Delete app/components/DemoModeBanner.tsx
 * 4. Remove DemoModeBanner from app/layout.tsx
 * 5. Remove demo mode checks from app/page.tsx and app/api/search/route.ts
 */

// Import mock data for serverless compatibility
import articlesData from '@/data/mock/articles.json'

import type { Article, SearchResult } from './types'

/**
 * Check if demo mode is enabled via environment variable
 */
export function isDemoMode(): boolean {
  return process.env.NEXT_PUBLIC_DEMO_MODE === 'true'
}

/**
 * Get all mock articles
 */
export function getMockArticles(): Article[] {
  return articlesData.articles as Article[]
}

/**
 * Get mock article by slug
 */
export function getMockArticleBySlug(slug: string): Article | null {
  const articles = getMockArticles()
  return articles.find(a => a.slug === slug) || null
}

/**
 * Perform mock semantic search
 * Simulates semantic search by matching query terms against article content
 */
export function mockSearch(query: string, limit: number = 10): SearchResult[] {
  const articles = getMockArticles()
  const queryLower = query.toLowerCase()
  const queryWords = queryLower.split(/\s+/).filter(w => w.length > 2)

  // Score each article based on relevance to query
  const scored = articles.map(article => {
    let score = 0
    const searchableContent = [
      article.title,
      article.summary,
      article.body,
      article.category,
      ...(article.tags || [])
    ].join(' ').toLowerCase()

    // Exact phrase match (highest score)
    if (searchableContent.includes(queryLower)) {
      score += 0.5
    }

    // Word matches
    for (const word of queryWords) {
      if (searchableContent.includes(word)) {
        score += 0.1
        // Title matches are worth more
        if (article.title.toLowerCase().includes(word)) {
          score += 0.2
        }
      }
    }

    // Normalize score to 0-1 range
    score = Math.min(score, 1)

    return {
      id: article.id,
      score,
      article
    }
  })

  // Filter articles with score > 0 and sort by score
  return scored
    .filter(item => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
}
