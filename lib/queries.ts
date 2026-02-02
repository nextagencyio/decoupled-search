import { gql } from '@apollo/client'
import type { Article } from './types'

export const GET_ALL_ARTICLES = gql`
  query GetAllArticles {
    nodeArticles(first: 100) {
      nodes {
        id
        title
        path
        created {
          time
        }
        body {
          processed
        }
        summary {
          value
        }
        category
        tags
        readTime
        image {
          url
          alt
          width
          height
        }
      }
    }
  }
`

export const GET_ARTICLE_BY_SLUG = gql`
  query GetArticleBySlug($path: String!) {
    route(path: $path) {
      ... on RouteInternal {
        entity {
          ... on NodeArticle {
            id
            title
            path
            created {
              time
            }
            body {
              processed
            }
            summary {
              value
            }
            category
            tags
            readTime
            image {
              url
              alt
              width
              height
            }
          }
        }
      }
    }
  }
`

export function transformArticle(node: any): Article | null {
  if (!node) return null

  const slug = node.path?.replace(/^\/articles\//, '') || node.id

  return {
    id: node.id,
    title: node.title,
    slug,
    body: node.body?.processed || '',
    summary: node.summary?.value || '',
    category: node.category || 'General',
    tags: node.tags ? node.tags.split(',').map((t: string) => t.trim()) : [],
    readTime: node.readTime || '5 min read',
    publishedAt: node.created?.time || new Date().toISOString(),
    image: node.image ? {
      url: node.image.url,
      alt: node.image.alt || node.title,
      width: node.image.width || 1200,
      height: node.image.height || 630,
    } : undefined,
  }
}
