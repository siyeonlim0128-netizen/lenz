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
  color?: string
  reasoning?: string
}
export interface GapFilling {
  learnings: unknown[]
  projects: unknown[]
  postings: unknown[]
}
export interface RecommendedJob {
  jobName: string
  matchPercentage: number
  strengths: unknown[]
  gaps?: unknown[]
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

// ─── 응답 정규화 헬퍼 ──────────────────────────────────
// 문자열인데 JSON이면 파싱, 코드펜스(```json) 감싸져 있으면 떼고 파싱
const safeParse = (val: unknown): unknown => {
  if (typeof val !== 'string') return val
  const trimmed = val
    .trim()
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/, '')
    .trim()
  if (!trimmed) return val
  if (!['{', '['].includes(trimmed[0])) return val
  try { return JSON.parse(trimmed) } catch { return val }
}

const ensureArray = (val: unknown): unknown[] => {
  const parsed = safeParse(val)
  return Array.isArray(parsed) ? parsed : []
}

const normalizeAnalyze = (raw: unknown): AnalyzeResult => {
  // 응답 전체가 문자열로 감겨왔으면 풀기
  let data: any = typeof raw === 'string' ? safeParse(raw) : raw
  // { result: "..." } 같이 한 번 더 감싸진 경우
  if (data && typeof data === 'object' && typeof data.result === 'string') {
    const inner = safeParse(data.result)
    if (inner && typeof inner === 'object') data = inner
  }

  const strengthsRaw = ensureArray(data?.strengths)
  const jobsRaw = ensureArray(data?.recommendedJobs)

  return {
    strengths: strengthsRaw.map((s: any) => {
      if (typeof s === 'string') return { keyword: s }
      return {
        keyword: String(s?.keyword ?? s?.name ?? s?.title ?? ''),
        color: s?.color,
        reasoning: s?.reasoning ?? s?.reason ?? s?.description,
      }
    }),
    recommendedJobs: jobsRaw.map((j: any) => ({
      jobName: String(j?.jobName ?? j?.name ?? j?.title ?? ''),
      matchPercentage: Number(j?.matchPercentage ?? j?.match ?? 0),
      strengths: ensureArray(j?.strengths),
      gaps: ensureArray(j?.gaps),
      gapFilling: {
        learnings: ensureArray(j?.gapFilling?.learnings),
        projects: ensureArray(j?.gapFilling?.projects),
        postings: ensureArray(j?.gapFilling?.postings),
      },
    })),
  }
}
// ──────────────────────────────────────────────────────

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
  // 백엔드가 wrap된 형태({resumeData: ...})를 기대할 수도 있어서 먼저 그걸로 시도
  // 실패하면 raw payload로 재시도
  let raw: unknown
  try {
    raw = await apiRequest<unknown>('/api/analyze', {
      method: 'POST',
      body: JSON.stringify({ resumeData: data }),
    })
  } catch (e1) {
    console.warn('🔍 analyze: wrapped 실패, raw로 재시도', e1)
    raw = await apiRequest<unknown>('/api/analyze', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }
  console.log('🔍 raw analyze response:', raw)  // 진짜 응답 확인 후 지워도 됨
  return normalizeAnalyze(raw)
}
