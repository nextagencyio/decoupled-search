import { ApolloClient, InMemoryCache, createHttpLink } from '@apollo/client'

const isServer = typeof window === 'undefined'

const httpLink = createHttpLink({
  uri: `${process.env.DRUPAL_BASE_URL || process.env.NEXT_PUBLIC_DRUPAL_BASE_URL}/graphql`,
  // On the server, tag fetch requests so revalidateTag('drupal') clears the Data Cache
  ...(isServer && {
    fetch: (uri: RequestInfo | URL, options?: RequestInit) =>
      fetch(uri, { ...options, next: { tags: ['drupal'] } } as RequestInit),
  }),
})

export const client = new ApolloClient({
  link: httpLink,
  cache: new InMemoryCache(),
  defaultOptions: {
    query: {
      fetchPolicy: 'no-cache',
    },
  },
})

export default client
