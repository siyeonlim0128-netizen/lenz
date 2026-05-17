import { apiRequest } from './client'
import type { ResumeData } from './resume'

export interface CoachRequest {
  resumeData?: ResumeData
  jobTitle: string
  jobPosting: string
}

export interface CoachResult {
  questions: string[]
  tips: string[] | { title?: string; section?: string; content?: string; message?: string }[]
  keyPoints: string[]
}

export async function coachCoverLetter(data: CoachRequest): Promise<CoachResult> {
  return apiRequest<CoachResult>('/api/coach', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export async function crawlPosting(url: string): Promise<{ title: string; content: string; url: string }> {
  return apiRequest('/api/crawl/posting', {
    method: 'POST',
    body: JSON.stringify({ url }),
  })
}
