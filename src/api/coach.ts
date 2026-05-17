import { apiRequest } from './client'
import type { ResumeData } from './resume'

export interface CoachRequest {
  resumeData?: ResumeData
  jobTitle: string
  jobPosting: string
}

export interface CoachGuide {
  section: string
  content: string
}

export interface CoachResult {
  jobTitle?: string
  coreRequirements: unknown[]
  guides: CoachGuide[]
  questions: unknown[]
  // 하위호환 (예전 키로 보내도 화면이 그대로 동작하도록)
  keyPoints?: unknown[]
  tips?: unknown[]
}// src/api/coach.ts

import { apiRequest } from './client'
import type { ResumeData } from './resume'

export interface CoachRequest {
  resumeData?: ResumeData
  jobTitle: string
  jobPosting: string
}

export interface CoachGuide {
  section: string
  keyMessage: string
  exampleParagraph: string
}

export interface CoachResult {
  jobTitle?: string
  coreRequirements: unknown[]
  guides: CoachGuide[]
  questions: unknown[]
  // 하위호환
  keyPoints?: unknown[]
  tips?: CoachGuide[]
}

// ─── 정규화 헬퍼 ─────────────────────────────────
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

const normalizeGuide = (raw: unknown, idx: number): CoachGuide => {
  // 백엔드가 객체를 JSON 문자열로 보내는 경우가 있어서 한 번 파싱 시도
  const parsed = safeParse(raw)

  if (typeof parsed === 'string') {
    return { section: `항목 ${idx + 1}`, keyMessage: parsed, exampleParagraph: '' }
  }
  if (parsed && typeof parsed === 'object') {
    const o = parsed as Record<string, unknown>
    return {
      section: String(o.section ?? o.title ?? o.name ?? `항목 ${idx + 1}`),
      keyMessage: String(o.keyMessage ?? o.message ?? o.content ?? o.summary ?? ''),
      exampleParagraph: String(o.exampleParagraph ?? o.example ?? o.paragraph ?? o.description ?? ''),
    }
  }
  return { section: `항목 ${idx + 1}`, keyMessage: String(parsed ?? ''), exampleParagraph: '' }
}

const normalizeCoach = (raw: unknown): CoachResult => {
  let data: any = typeof raw === 'string' ? safeParse(raw) : raw
  if (data && typeof data === 'object' && typeof data.result === 'string') {
    const inner = safeParse(data.result)
    if (inner && typeof inner === 'object') data = inner
  }

  const coreRaw = data?.coreRequirements ?? data?.keyPoints ?? data?.requirements ?? []
  const guidesRaw = data?.guides ?? data?.tips ?? []
  const questionsRaw = data?.questions ?? []

  const core = ensureArray(coreRaw)
  const guides = ensureArray(guidesRaw).map((g, i) => normalizeGuide(g, i))
  const questions = ensureArray(questionsRaw)

  return {
    jobTitle: typeof data?.jobTitle === 'string' ? data.jobTitle : undefined,
    coreRequirements: core,
    guides,
    questions,
    keyPoints: core,
    tips: guides,
  }
}
// ─────────────────────────────────────────────────

export async function coachCoverLetter(data: CoachRequest): Promise<CoachResult> {
  const raw = await apiRequest<unknown>('/api/coach', {
    method: 'POST',
    body: JSON.stringify(data),
  })
  console.log('🔍 raw coach response:', raw)  // 확인 후 지움
  return normalizeCoach(raw)
}

export async function crawlPosting(url: string): Promise<{ title: string; content: string; url: string }> {
  const raw = await apiRequest<unknown>('/api/crawl/posting', {
    method: 'POST',
    body: JSON.stringify({ url }),
  })
  const data: any = typeof raw === 'string' ? safeParse(raw) : raw
  return {
    title: String(data?.title ?? ''),
    content: String(data?.content ?? data?.text ?? ''),
    url: String(data?.url ?? url),
  }
}

// ─── 응답 정규화 헬퍼 ──────────────────────────────────
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

const normalizeGuide = (raw: unknown, idx: number): CoachGuide => {
  if (typeof raw === 'string') return { section: `항목 ${idx + 1}`, content: raw }
  if (raw && typeof raw === 'object') {
    const o = raw as Record<string, unknown>
    return {
      section: String(o.section ?? o.title ?? o.name ?? `항목 ${idx + 1}`),
      content: String(o.content ?? o.message ?? o.text ?? o.description ?? ''),
    }
  }
  return { section: `항목 ${idx + 1}`, content: String(raw ?? '') }
}

const normalizeCoach = (raw: unknown): CoachResult => {
  let data: any = typeof raw === 'string' ? safeParse(raw) : raw
  if (data && typeof data === 'object' && typeof data.result === 'string') {
    const inner = safeParse(data.result)
    if (inner && typeof inner === 'object') data = inner
  }

  // 실제 키(coreRequirements/guides) ↔ 예전 키(keyPoints/tips) 둘 다 흡수
  const coreRaw = data?.coreRequirements ?? data?.keyPoints ?? data?.requirements ?? []
  const guidesRaw = data?.guides ?? data?.tips ?? []
  const questionsRaw = data?.questions ?? []

  const core = ensureArray(coreRaw)
  const guides = ensureArray(guidesRaw).map((g, i) => normalizeGuide(g, i))
  const questions = ensureArray(questionsRaw)

  return {
    jobTitle: typeof data?.jobTitle === 'string' ? data.jobTitle : undefined,
    coreRequirements: core,
    guides,
    questions,
    keyPoints: core,    // 하위호환
    tips: guides,        // 하위호환
  }
}
// ──────────────────────────────────────────────────────

export async function coachCoverLetter(data: CoachRequest): Promise<CoachResult> {
  const raw = await apiRequest<unknown>('/api/coach', {
    method: 'POST',
    body: JSON.stringify(data),
  })
  console.log('🔍 raw coach response:', raw)  // 확인 후 지움
  return normalizeCoach(raw)
}

export async function crawlPosting(url: string): Promise<{ title: string; content: string; url: string }> {
  const raw = await apiRequest<unknown>('/api/crawl/posting', {
    method: 'POST',
    body: JSON.stringify({ url }),
  })
  const data: any = typeof raw === 'string' ? safeParse(raw) : raw
  return {
    title: String(data?.title ?? ''),
    content: String(data?.content ?? data?.text ?? ''),
    url: String(data?.url ?? url),
  }
}
