import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Header from '../components/Header'
import StepIndicator from '../components/StepIndicator'
import { coachCoverLetter, crawlPosting, type CoachResult } from '../api/coach'
import type { ResumeData } from '../api/resume'
import { addBookmark } from '../api/user'

// 객체/문자열 안전 렌더링
const renderItem = (item: unknown): string => {
  if (item == null) return ''
  if (typeof item === 'string') return item
  if (typeof item === 'number' || typeof item === 'boolean') return String(item)
  if (typeof item === 'object') {
    const obj = item as Record<string, unknown>
    const candidate =
      obj.title ?? obj.name ?? obj.text ?? obj.content ??
      obj.description ?? obj.label ?? obj.value ?? obj.message
    if (candidate != null) return String(candidate)
    try { return JSON.stringify(obj) } catch { return '' }
  }
  return String(item)
}

export default function CoverLetterCoachPage() {
  const navigate = useNavigate()
  const [inputTab, setInputTab] = useState<'text' | 'url'>('text')
  const [jobText, setJobText] = useState('')
  const [jobUrl, setJobUrl] = useState('')
  const [jobTitle, setJobTitle] = useState('')
  const [loading, setLoading] = useState(false)
  const [crawling, setCrawling] = useState(false)
  const [result, setResult] = useState<CoachResult | null>(null)
  const [error, setError] = useState('')
  const [copiedAll, setCopiedAll] = useState(false)
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null)

  const getResumeData = (): ResumeData | undefined => {
    const stored = sessionStorage.getItem('lenz_resume')
    if (!stored) return undefined
    try {
      return JSON.parse(stored) as ResumeData
    } catch {
      return undefined
    }
  }

  const handleCrawlAndFill = async () => {
    if (!jobUrl.trim()) return
    setCrawling(true)
    setError('')
    try {
      const crawled = await crawlPosting(jobUrl.trim())
      setJobText(crawled.content)
      if (crawled.title) setJobTitle(crawled.title)
      setInputTab('text')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'URL 스크래핑에 실패했습니다.')
    } finally {
      setCrawling(false)
    }
  }

  const handleAnalyze = async () => {
    const content = inputTab === 'text' ? jobText : jobUrl
    if (!content.trim()) { setError('공고 내용을 입력해주세요.'); return }
    if (content.length < 10) { setError('공고 내용이 너무 짧습니다.'); return }
    if (!jobTitle.trim()) { setError('직무명을 입력해주세요.'); return }

    setLoading(true)
    setResult(null)
    setError('')
    try {
      const resumeData = getResumeData()
      const res = await coachCoverLetter({
        resumeData,
        jobTitle: jobTitle.trim(),
        jobPosting: content.trim(),
      })
      // 디버깅용 — 진짜 응답 구조 확인. 확인 후 지워도 됨.
      console.log('🔍 coach response:', res)
      setResult(res)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : '분석 중 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  // 응답 키가 뭐로 오든 안전하게 정규화
  // coreRequirements (실제) ↔ keyPoints (예전) 둘 다 받음
  const getKeyPoints = (r: CoachResult | null): unknown[] => {
    if (!r) return []
    const raw =
      (r as any).coreRequirements ??
      (r as any).keyPoints ??
      (r as any).requirements ??
      []
    return Array.isArray(raw) ? raw : []
  }

  // guides (실제) ↔ tips (예전) 둘 다 받음, 객체/문자열 모두 정규화
  const getGuides = (r: CoachResult | null): Array<{ section: string; content: string }> => {
    if (!r) return []
    const raw =
      (r as any).guides ??
      (r as any).tips ??
      []
    if (!Array.isArray(raw)) return []
    return raw.map((t, i) => {
      if (typeof t === 'string') return { section: `항목 ${i + 1}`, content: t }
      if (t && typeof t === 'object') {
        const obj = t as Record<string, unknown>
        return {
          section: renderItem(obj.section ?? obj.title ?? obj.name) || `항목 ${i + 1}`,
          content: renderItem(obj.content ?? obj.message ?? obj.text ?? obj.description ?? obj),
        }
      }
      return { section: `항목 ${i + 1}`, content: renderItem(t) }
    })
  }

  const getQuestions = (r: CoachResult | null): unknown[] => {
    if (!r) return []
    const raw = (r as any).questions ?? []
    return Array.isArray(raw) ? raw : []
  }

  const handleCopyTip = (idx: number, text: string) => {
    navigator.clipboard.writeText(text)
    setCopiedIdx(idx)
    setTimeout(() => setCopiedIdx(null), 2000)
  }

  const handleCopyAll = () => {
    if (!result) return
    const guides = getGuides(result)
    const keyPoints = getKeyPoints(result)
    const parts: string[] = []
    if (keyPoints.length) {
      parts.push('=== 핵심 요구사항 ===\n' + keyPoints.map((k, i) => `${i + 1}. ${renderItem(k)}`).join('\n'))
    }
    if (guides.length) {
      parts.push('=== 자소서 가이드 ===\n' + guides.map((t) => `[${t.section}]\n${t.content}`).join('\n\n'))
    }
    navigator.clipboard.writeText(parts.join('\n\n'))
    setCopiedAll(true)
    setTimeout(() => setCopiedAll(false), 2000)
  }

  const handleSaveAd = async () => {
    const token = localStorage.getItem('lenz_token')
    if (!token) {
      alert('공고 저장은 로그인 후 이용 가능합니다.')
      navigate('/login')
      return
    }
    try {
      await addBookmark({
        postingId: `manual-${Date.now()}`,
        postingData: { company: jobTitle, title: jobTitle, tags: [] },
      })
      alert('공고가 저장되었습니다!')
    } catch {
      alert('저장 중 오류가 발생했습니다.')
    }
  }

  const keyPoints = getKeyPoints(result)
  const guides = getGuides(result)
  const questions = getQuestions(result)

  return (
    <div className="min-h-screen bg-[#F4F6F8]">
      <Header />
      <div className="max-w-5xl mx-auto px-4 py-8">
        <StepIndicator currentStep={3} />

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 rounded-lg px-4 py-3 mb-4 text-sm">{error}</div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Left */}
          <div className="space-y-4">
            <div className="bg-white rounded-2xl p-5 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <span className="text-sm">📋</span>
                <h3 className="font-bold text-gray-800 text-sm">공고 입력</h3>
              </div>

              {/* Job title */}
              <div className="mb-3">
                <label className="block text-xs text-gray-500 mb-1">직무명 <span className="text-red-400">*</span></label>
                <input
                  value={jobTitle}
                  onChange={(e) => setJobTitle(e.target.value)}
                  placeholder="예: 서비스 기획자"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-[#5B9BD5]"
                />
              </div>

              <div className="flex gap-2 mb-3">
                <button
                  onClick={() => setInputTab('text')}
                  className={`flex-1 py-2 rounded-lg text-xs font-medium border transition-colors ${
                    inputTab === 'text' ? 'bg-[#5B9BD5] text-white border-[#5B9BD5]' : 'bg-white text-gray-600 border-gray-200 hover:border-[#5B9BD5]'
                  }`}
                >
                  텍스트 붙여넣기
                </button>
                <button
                  onClick={() => setInputTab('url')}
                  className={`flex-1 py-2 rounded-lg text-xs font-medium border transition-colors ${
                    inputTab === 'url' ? 'bg-[#5B9BD5] text-white border-[#5B9BD5]' : 'bg-white text-gray-600 border-gray-200 hover:border-[#5B9BD5]'
                  }`}
                >
                  URL 입력
                </button>
              </div>

              {inputTab === 'text' ? (
                <textarea
                  value={jobText}
                  onChange={(e) => setJobText(e.target.value)}
                  placeholder={`공고 전문을 복사해서 붙여넣기 해주세요.\n예) [채용 공고] 서비스 기획자 모집\n담당 업무 ...\n자격 요건 ...\n우대 사항 ...`}
                  className="w-full border border-gray-200 rounded-xl p-3 text-xs text-gray-700 leading-relaxed resize-none focus:outline-none focus:border-[#5B9BD5] min-h-48"
                />
              ) : (
                <div className="flex gap-2">
                  <input
                    value={jobUrl}
                    onChange={(e) => setJobUrl(e.target.value)}
                    placeholder="사람인 / 원티드 공고 URL을 입력하세요"
                    className="flex-1 border border-gray-200 rounded-xl px-3 py-3 text-xs text-gray-700 focus:outline-none focus:border-[#5B9BD5]"
                  />
                  <button
                    onClick={handleCrawlAndFill}
                    disabled={crawling}
                    className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-2 rounded-xl text-xs font-medium transition-colors flex-shrink-0"
                  >
                    {crawling ? '읽는 중...' : '불러오기'}
                  </button>
                </div>
              )}

              <button
                onClick={handleAnalyze}
                disabled={loading || crawling}
                className="w-full mt-3 bg-[#5B9BD5] hover:bg-[#2E6DA4] disabled:bg-gray-300 text-white py-2.5 rounded-lg font-semibold text-sm transition-colors flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    분석 중...
                  </>
                ) : '✦ 분석 실행'}
              </button>
            </div>

            {/* Key requirements */}
            {loading && (
              <div className="bg-white rounded-2xl p-5 shadow-sm flex flex-col items-center py-10">
                <div className="flex gap-2 mb-3">
                  {[0, 1, 2].map((i) => (
                    <div key={i} className="w-2 h-2 rounded-full bg-[#5B9BD5]" style={{ animation: `bounce 1.2s ease-in-out ${i * 0.2}s infinite` }} />
                  ))}
                </div>
                <p className="text-xs text-gray-400">공고를 분석하고 있어요...</p>
                <style>{`@keyframes bounce{0%,100%{transform:translateY(0)}50%{transform:translateY(-8px)}}`}</style>
              </div>
            )}

            {keyPoints.length > 0 ? (
              <div className="bg-white rounded-2xl p-5 shadow-sm">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-sm">🎯</span>
                  <h3 className="font-bold text-gray-800 text-sm">핵심 요구사항</h3>
                </div>
                <ol className="space-y-2">
                  {keyPoints.map((req, i) => (
                    <li key={i} className="flex gap-3 bg-[#F4F6F8] rounded-xl px-3 py-2.5">
                      <span className="w-5 h-5 rounded-full bg-[#5B9BD5] text-white text-xs flex items-center justify-center flex-shrink-0 font-bold">{i + 1}</span>
                      <p className="text-xs text-gray-700 leading-relaxed">{renderItem(req)}</p>
                    </li>
                  ))}
                </ol>
              </div>
            ) : null}

            {questions.length > 0 ? (
              <div className="bg-white rounded-2xl p-5 shadow-sm">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-sm">❓</span>
                  <h3 className="font-bold text-gray-800 text-sm">예상 자소서 문항</h3>
                </div>
                <ol className="space-y-2">
                  {questions.map((q, i) => (
                    <li key={i} className="flex gap-3 bg-[#F4F6F8] rounded-xl px-3 py-2.5">
                      <span className="w-5 h-5 rounded-full bg-[#A8C8E8] text-[#2E6DA4] text-xs flex items-center justify-center flex-shrink-0 font-bold">{i + 1}</span>
                      <p className="text-xs text-gray-700 leading-relaxed">{renderItem(q)}</p>
                    </li>
                  ))}
                </ol>
              </div>
            ) : null}
          </div>

          {/* Right: Guide */}
          <div className="space-y-4">
            {guides.length > 0 ? (
              <div className="bg-white rounded-2xl p-5 shadow-sm">
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-sm">✏️</span>
                  <h3 className="font-bold text-gray-800 text-sm">자소서 가이드</h3>
                </div>

                <div className="space-y-4">
                  {guides.map((item, idx) => (
                    <div key={idx} className="border border-gray-100 rounded-xl overflow-hidden">
                      <div className="bg-[#F4F6F8] px-4 py-2.5 flex items-center justify-between">
                        <span className="text-xs font-bold text-gray-700">{item.section}</span>
                      </div>
                      <div className="px-4 py-3">
                        <p className="text-xs text-gray-600 leading-relaxed whitespace-pre-wrap">{item.content}</p>
                        <button
                          onClick={() => handleCopyTip(idx, `[${item.section}]\n${item.content}`)}
                          className="mt-2 text-xs text-[#5B9BD5] hover:text-[#2E6DA4] flex items-center gap-1"
                        >
                          {copiedIdx === idx ? '✓ 복사됨' : '📋 복사'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex gap-2 mt-4">
                  <button
                    onClick={handleCopyAll}
                    className="flex-1 border border-[#5B9BD5] text-[#5B9BD5] hover:bg-[#EEF6FC] py-2.5 rounded-lg text-sm font-semibold transition-colors"
                  >
                    {copiedAll ? '✓ 전체 복사됨!' : '📋 가이드 전체 복사'}
                  </button>
                  <button
                    onClick={handleSaveAd}
                    className="border border-gray-300 text-gray-600 hover:border-[#5B9BD5] px-4 py-2.5 rounded-lg text-sm transition-colors"
                  >
                    공고 저장
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-2xl p-5 shadow-sm flex flex-col items-center justify-center py-16 text-center">
                <p className="text-4xl mb-3">✏️</p>
                <p className="text-sm text-gray-500 font-medium">공고를 입력하고 분석을 실행하면</p>
                <p className="text-sm text-gray-400">자소서 가이드가 여기에 나타납니다.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
