# Decoupled Search

AI-powered semantic search built with Next.js, Drupal (via Decoupled.io), and Pinecone. Search your content using natural language queries that understand meaning, not just keywords.

![Decoupled Search Screenshot](screenshot.png)

## Features

- **Semantic Search**: Uses AI embeddings to understand the meaning of queries
- **Real-time Results**: Instant search as you type with debounced queries
- **Relevance Scoring**: Results ranked by semantic similarity
- **Decoupled Architecture**: Content managed in Drupal, search powered by Pinecone
- **No OpenAI Required**: Uses Pinecone's built-in inference for embeddings
- **Beautiful UI**: Clean, responsive interface with dark mode support

## How It Works

1. **Content Storage**: Articles are stored and managed in Drupal (via Decoupled.io)
2. **Embedding Generation**: Article content is converted to vector embeddings using Pinecone's inference API
3. **Vector Storage**: Embeddings are stored in Pinecone for fast similarity search
4. **Semantic Queries**: User queries are embedded and matched against content vectors

## Quick Start

### 1. Run the Setup Script

The interactive setup script will guide you through:
- Creating a Drupal space on Decoupled.io
- Importing sample articles
- Configuring Pinecone
- Indexing content for search

```bash
npm install
npm run setup
```

### 2. Start Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to start searching.

## Prerequisites

You'll need accounts and API keys from:

### Decoupled.io (Content Management)
- Sign up at [decoupled.io](https://decoupled.io)
- Authenticate via CLI: `npx decoupled-cli@latest auth login`

### Pinecone (Vector Database + Embeddings)
- Sign up at [pinecone.io](https://pinecone.io)
- Create a free account and get your API key
- Pinecone provides both storage AND embeddings - no OpenAI needed!

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `DRUPAL_BASE_URL` | Your Drupal space URL | Yes |
| `DRUPAL_CLIENT_ID` | OAuth client ID | Yes |
| `DRUPAL_CLIENT_SECRET` | OAuth client secret | Yes |
| `PINECONE_API_KEY` | Pinecone API key | Yes |
| `PINECONE_INDEX` | Pinecone index name | No (default: decoupled-search) |

## Project Structure

```
decoupled-search/
├── app/
│   ├── api/
│   │   ├── graphql/         # Drupal GraphQL proxy
│   │   ├── revalidate/      # Cache revalidation
│   │   └── search/          # Search API endpoint
│   ├── articles/[slug]/     # Article detail pages
│   ├── components/
│   │   ├── Header.tsx
│   │   ├── SearchInput.tsx
│   │   ├── SearchResults.tsx
│   │   ├── SearchResultCard.tsx
│   │   └── SetupGuide.tsx
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx             # Search homepage
├── lib/
│   ├── apollo-client.ts     # GraphQL client
│   ├── pinecone.ts          # Pinecone operations + inference
│   ├── queries.ts           # GraphQL queries
│   └── types.ts             # TypeScript types
├── data/
│   └── search-content.json  # Sample articles
└── scripts/
    ├── setup.ts             # Interactive setup
    └── index-content.ts     # Content indexer
```

## Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run setup` | Interactive setup wizard |
| `npm run setup-content` | Import sample content to Drupal |
| `npm run index` | Index content in Pinecone |
| `npm run index:reset` | Clear index and re-index all content |

## Re-indexing Content

When you add or update content in Drupal, re-index to update search:

```bash
npm run index
```

## Customization

### Adding More Content

1. Add articles via the Drupal admin interface
2. Or modify `data/search-content.json` and run `npm run setup-content`
3. Re-index with `npm run index`

### Styling

The project uses Tailwind CSS with a sky/blue color scheme. Modify `tailwind.config.js` for custom colors.

### Search Behavior

Adjust search parameters in `lib/pinecone.ts`:
- `topK`: Number of results to return (default: 10)
- Embedding model: Uses `llama-text-embed-v2` via Pinecone inference

## Deployment

### Vercel

1. Push to GitHub
2. Import in Vercel
3. Add environment variables
4. Deploy

### Important Notes

- Run `npm run index` after deploying to index content
- Pinecone indexes persist - you don't need to re-index on every deploy
- Pinecone's free tier includes inference API calls

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    User Search Query                         │
└─────────────────────────┬───────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                    Next.js Frontend                          │
│  ┌───────────────────────────────────────────────────────┐  │
│  │                   /api/search                          │  │
│  │  1. Receive query                                      │  │
│  │  2. Generate embedding via Pinecone inference          │  │
│  │  3. Query Pinecone for similar vectors                 │  │
│  │  4. Return ranked results                              │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                       Pinecone                               │
│  ┌───────────────────┐    ┌───────────────────────────────┐ │
│  │  Inference API    │    │     Vector Database           │ │
│  │  (llama-text-     │───▶│     (Serverless)              │ │
│  │   embed-v2)       │    │                               │ │
│  └───────────────────┘    └───────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

## Support

- [Decoupled.io Documentation](https://decoupled.io/docs)
- [Pinecone Documentation](https://docs.pinecone.io)
- [Pinecone Inference Guide](https://docs.pinecone.io/guides/inference/understanding-inference)
- [Next.js Documentation](https://nextjs.org/docs)

## License

MIT
