import { apiRequest } from './client'

export interface Education {
  school: string
  grade: string
}

export interface Project {
  name: string
  description: string
}

export interface ResumeData {
  education: Education
  activities: string[]
  projects: Project[]
  skills: string[]
  interestedJobs: string[]
}

export interface StrengthKeyword {
  keyword: string
  color: string
  reasoning: string
}

export interface GapFilling {
  learnings: string[]
  projects: string[]
  postings: string[]
}

export interface RecommendedJob {
  jobName: string
  matchPercentage: number
  strengths: string[]
  gaps?: string[]
  gapFilling: GapFilling
}

export interface AnalyzeResult {
  strengths: StrengthKeyword[]
  recommendedJobs: RecommendedJob[]
}

export interface ParseResumeResult {
  resumeData: ResumeData
  rawTextPreview: string
}

export async function parseResume(file: File): Promise<ParseResumeResult> {
  const form = new FormData()
  form.append('resume', file)
  return apiRequest<ParseResumeResult>('/api/parse-resume', {
    method: 'POST',
    body: form,
  })
}

export async function validateResume(data: ResumeData): Promise<ResumeData> {
  return apiRequest<ResumeData>('/api/resume/validate', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export async function analyzeResume(data: ResumeData): Promise<AnalyzeResult> {
  return apiRequest<AnalyzeResult>('/api/analyze', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}
