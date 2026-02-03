import { notFound } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowLeft, Clock, Tag, Calendar } from 'lucide-react'
import Header from '@/app/components/Header'
import client from '@/lib/apollo-client'
import { GET_ARTICLE_BY_SLUG, transformArticle } from '@/lib/queries'
import { isDemoMode, getMockArticleBySlug } from '@/lib/demo-mode'

interface ArticlePageProps {
  params: Promise<{ slug: string }>
}

async function getArticle(slug: string) {
  // Demo mode: use mock data
  if (isDemoMode()) {
    return getMockArticleBySlug(slug)
  }

  try {
    const { data } = await client.query({
      query: GET_ARTICLE_BY_SLUG,
      variables: { path: `/articles/${slug}` },
    })

    return transformArticle(data?.route?.entity)
  } catch (error) {
    console.error('Error fetching article:', error)
    return null
  }
}

export default async function ArticlePage({ params }: ArticlePageProps) {
  const { slug } = await params
  const article = await getArticle(slug)

  if (!article) {
    notFound()
  }

  const publishDate = new Date(article.publishedAt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  return (
    <>
      <Header />
      <main className="py-8 px-4 sm:px-6 lg:px-8">
        <article className="max-w-3xl mx-auto">
          {/* Back Link */}
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-slate-500 dark:text-slate-400 hover:text-sky-600 dark:hover:text-sky-400 transition-colors mb-8"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to search
          </Link>

          {/* Article Header */}
          <header className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-sky-100 text-sky-700 dark:bg-sky-900/50 dark:text-sky-300">
                {article.category}
              </span>
            </div>

            <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white mb-4">
              {article.title}
            </h1>

            <div className="flex flex-wrap items-center gap-4 text-sm text-slate-500 dark:text-slate-400">
              <span className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4" />
                {publishDate}
              </span>
              <span className="flex items-center gap-1.5">
                <Clock className="w-4 h-4" />
                {article.readTime}
              </span>
              {article.tags.length > 0 && (
                <span className="flex items-center gap-1.5">
                  <Tag className="w-4 h-4" />
                  {article.tags.join(', ')}
                </span>
              )}
            </div>
          </header>

          {/* Featured Image */}
          {article.image && (
            <div className="relative aspect-video mb-8 rounded-xl overflow-hidden">
              <Image
                src={article.image.url}
                alt={article.image.alt}
                fill
                className="object-cover"
                priority
              />
            </div>
          )}

          {/* Summary */}
          {article.summary && (
            <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-6 mb-8">
              <p className="text-lg text-slate-700 dark:text-slate-300 italic">
                {article.summary}
              </p>
            </div>
          )}

          {/* Article Body */}
          <div
            className="prose prose-slate dark:prose-invert prose-lg max-w-none prose-headings:font-semibold prose-a:text-sky-600 dark:prose-a:text-sky-400 prose-img:rounded-xl"
            dangerouslySetInnerHTML={{ __html: article.body }}
          />

          {/* Tags Footer */}
          {article.tags.length > 0 && (
            <footer className="mt-12 pt-8 border-t border-slate-200 dark:border-slate-700">
              <h3 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-3">
                Related Topics
              </h3>
              <div className="flex flex-wrap gap-2">
                {article.tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-lg text-sm"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </footer>
          )}
        </article>
      </main>
    </>
  )
}
