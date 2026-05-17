import { apiRequest } from './client'

export interface Posting {
  id: string
  company: string
  title: string
  tags: string[]
  matchScore?: number
}

export async function getPostings(tags?: string, limit = 5): Promise<Posting[]> {
  const params = new URLSearchParams()
  if (tags) params.set('tags', tags)
  params.set('limit', String(limit))
  return apiRequest<Posting[]>(`/api/postings?${params.toString()}`)
}

export async function getPosting(id: string): Promise<Posting> {
  return apiRequest<Posting>(`/api/postings/${id}`)
}
