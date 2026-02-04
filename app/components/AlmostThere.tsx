import { CheckCircle2, Circle, Database, ExternalLink } from 'lucide-react'

export default function AlmostThere() {
  return (
    <div className="max-w-xl mx-auto">
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-sky-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <CheckCircle2 className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-3">
          Almost There!
        </h1>
        <p className="text-slate-600 dark:text-slate-300">
          Drupal is connected. Just add your Pinecone API key to enable semantic search.
        </p>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
        {/* Status checklist */}
        <div className="p-5 border-b border-slate-200 dark:border-slate-700">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-500" />
              <span className="text-slate-900 dark:text-white">Drupal connected</span>
            </div>
            <div className="flex items-center gap-3">
              <Circle className="w-5 h-5 text-slate-400" />
              <span className="text-slate-500 dark:text-slate-400">Pinecone API key</span>
            </div>
          </div>
        </div>

        {/* Pinecone instructions */}
        <div className="p-5">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900/50 rounded-lg flex items-center justify-center flex-shrink-0">
              <Database className="w-4 h-4 text-purple-600 dark:text-purple-400" />
            </div>
            <div className="flex-1">
              <h4 className="font-medium text-slate-900 dark:text-white mb-1">
                Get Pinecone API Key
              </h4>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-2">
                Free tier includes 100K vectors and built-in embeddings - no separate embedding API needed!
              </p>
              <a
                href="https://app.pinecone.io"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-sm text-sky-600 hover:text-sky-500 transition-colors"
              >
                Open Pinecone Console
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        </div>

        {/* Environment variable hint */}
        <div className="p-5 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-200 dark:border-slate-700">
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">
            Add this to your <code className="text-emerald-600 dark:text-emerald-400 bg-slate-200 dark:bg-slate-800 px-1.5 py-0.5 rounded">.env.local</code> file:
          </p>
          <div className="bg-slate-900 rounded-lg p-3 font-mono text-sm overflow-x-auto">
            <div className="text-slate-100">
              <span className="text-purple-400">PINECONE_API_KEY</span>=your-key-here
            </div>
          </div>
        </div>
      </div>

      <p className="text-center text-sm text-slate-500 dark:text-slate-400 mt-6">
        Restart your dev server after adding the key.
      </p>
    </div>
  )
}
