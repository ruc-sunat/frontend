import { NextResponse } from 'next/server'

const HASHNODE_HOST = 'consultaperuapi.hashnode.dev'

const GQL_QUERY = `
  query GetPosts($host: String!, $first: Int!) {
    publication(host: $host) {
      posts(first: $first) {
        edges {
          node {
            id title slug brief publishedAt readTimeInMinutes
            coverImage { url }
            tags { name }
            url
          }
        }
      }
    }
  }
`

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=7200',
}

function parseCDATA(s: string): string {
  return s.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1').trim()
}

function extractTag(xml: string, tag: string): string {
  const m = xml.match(new RegExp(`<${tag}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${tag}>`))
  return m ? parseCDATA(m[1]).trim() : ''
}

function extractAttr(xml: string, tag: string, attr: string): string {
  const m = xml.match(new RegExp(`<${tag}[^>]*\\s${attr}="([^"]*)"[^>]*>`))
  return m ? m[1] : ''
}

async function fetchViaGraphQL(limit: number) {
  const pat = process.env.HASHNODE_PAT
  if (!pat) throw new Error('HASHNODE_PAT not configured')

  const res = await fetch('https://gql.hashnode.com', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: pat,
    },
    body: JSON.stringify({ query: GQL_QUERY, variables: { host: HASHNODE_HOST, first: limit } }),
    next: { revalidate: 3600 },
  })

  const data = await res.json()
  if (data.errors) throw new Error(JSON.stringify(data.errors))

  const edges: { node: unknown }[] = data?.data?.publication?.posts?.edges ?? []
  if (edges.length === 0) throw new Error('No posts returned from GraphQL')
  return edges.map((e) => e.node)
}

async function fetchViaRSS(limit: number) {
  const res = await fetch(`https://${HASHNODE_HOST}/rss.xml`, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
      Accept: 'application/rss+xml, application/xml, text/xml, */*',
    },
    next: { revalidate: 3600 },
  })

  if (!res.ok) throw new Error(`RSS fetch failed: ${res.status}`)

  const xml = await res.text()
  const items = xml.match(/<item>([\s\S]*?)<\/item>/g) ?? []

  return items.slice(0, limit).map((item) => {
    const title = extractTag(item, 'title')
    const url = extractTag(item, 'link') || extractTag(item, 'guid')
    const rawBrief = extractTag(item, 'description').replace(/<[^>]+>/g, '')
    const brief = rawBrief.slice(0, 280)
    const pubDate = extractTag(item, 'pubDate')
    const coverUrl = extractAttr(item, 'enclosure', 'url')

    return {
      title,
      url,
      brief,
      publishedAt: pubDate ? new Date(pubDate).toISOString() : new Date().toISOString(),
      coverImage: coverUrl ? { url: coverUrl } : null,
      readTimeInMinutes: Math.max(1, Math.ceil(rawBrief.split(/\s+/).length / 200)),
      tags: [] as { name: string }[],
    }
  })
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const limit = Math.min(parseInt(searchParams.get('limit') ?? '3', 10), 20)

  try {
    let posts: unknown[]
    try {
      posts = await fetchViaGraphQL(limit)
    } catch (gqlErr) {
      console.warn('[Blog] GraphQL failed, falling back to RSS:', gqlErr)
      posts = await fetchViaRSS(limit)
    }
    return NextResponse.json({ posts }, { headers: CORS_HEADERS })
  } catch (err) {
    console.error('[Blog] All fetch strategies failed:', err)
    return NextResponse.json({ posts: [] }, { headers: CORS_HEADERS })
  }
}

export async function OPTIONS() {
  return new NextResponse(null, { headers: CORS_HEADERS })
}
