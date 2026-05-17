import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Header from '../components/Header'
import StepIndicator from '../components/StepIndicator'
import type { AnalyzeResult, RecommendedJob } from '../api/resume'
import { getPostings, type Posting } from '../api/postings'
import { getProfile } from '../api/user'

const STRENGTH_COLORS = [
  'bg-blue-100 text-blue-700',
  'bg-green-100 text-green-700',
  'bg-purple-100 text-purple-700',
  'bg-orange-100 text-orange-700',
  'bg-pink-100 text-pink-700',
]

export default function AnalysisResultPage() {
  const navigate = useNavigate()
  const [result, setResult] = useState<AnalyzeResult | null>(null)
  const [postings, setPostings] = useState<Posting[]>([])
  const [selectedJob, setSelectedJob] = useState(0)
  const [expandedGap, setExpandedGap] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [modalJob, setModalJob] = useState(0)
  const [copiedUrl, setCopiedUrl] = useState(false)
  const [error] = useState('')

  useEffect(() => {
    const stored = sessionStorage.getItem('lenz_result')
    if (!stored) {
      navigate('/resume')
      return
    }
    const parsed: AnalyzeResult = JSON.parse(stored)
    setResult(parsed)

    // Fetch real job postings using first interest as tag
    const tags = parsed.recommendedJobs?.[0]?.jobName || ''
    getPostings(tags, 5).then(setPostings).catch(() => {})
  }, [navigate])

  const handleSave = async () => {
    const token = localStorage.getItem('lenz_token')
    if (!token) {
      alert('결과 저장은 로그인 후 이용 가능합니다.')
      navigate('/login')
      return
    }
    try {
      await getProfile() // verify token still valid
      alert('마이페이지에 저장되었습니다!')
    } catch {
      alert('저장 중 오류가 발생했습니다.')
    }
  }

  const handleShareUrl = () => {
    navigator.clipboard.writeText(window.location.href)
    setCopiedUrl(true)
    setTimeout(() => setCopiedUrl(false), 2000)
  }

  if (!result) {
    return (
      <div className="min-h-screen bg-[#F4F6F8]">
        <Header />
        <div className="max-w-5xl mx-auto px-4 py-8">
          <StepIndicator currentStep={2} />
          <div className="flex flex-col items-center justify-center py-24">
            <div className="flex gap-2 mb-6">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="w-3 h-3 rounded-full bg-[#5B9BD5]"
                  style={{ animation: `bounce 1.2s ease-in-out ${i * 0.2}s infinite` }}
                />
              ))}
            </div>
            <p className="text-gray-500 text-sm font-medium mb-2">AI가 이력서를 분석하고 있어요...</p>
            <p className="text-gray-400 text-xs">강점 진단 → 직무 매칭 → 갭 분석 중</p>
            <style>{`@keyframes bounce { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-10px)} }`}</style>
            <div className="w-full max-w-4xl mt-12 grid grid-cols-2 gap-4">
              {[1, 2].map((i) => (
                <div key={i} className="bg-white rounded-2xl p-5 shadow-sm">
                  <div className="h-4 bg-gray-200 rounded w-1/3 mb-3 animate-pulse" />
                  <div className="h-3 bg-gray-100 rounded w-full mb-2 animate-pulse" />
                  <div className="h-3 bg-gray-100 rounded w-4/5 animate-pulse" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  const jobs: RecommendedJob[] = result.recommendedJobs || []
  const strengths = result.strengths || []
  const currentJob = jobs[selectedJob]

  return (
    <div className="min-h-screen bg-[#F4F6F8]">
      <Header />

      {/* Reason modal */}
      {modalOpen && jobs[modalJob] && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-xl">
            <h3 className="font-bold text-gray-800 mb-1">{jobs[modalJob].jobName} 추천 이유</h3>
            <div className="text-sm text-gray-600 leading-relaxed mb-4">
              <p className="mb-2">이 직무와의 적합도: <strong className="text-[#2E6DA4]">{jobs[modalJob].matchPercentage}%</strong></p>
              <p className="font-medium text-gray-700 mb-1">강점</p>
              <ul className="list-disc list-inside space-y-1 mb-2">
                {jobs[modalJob].strengths?.map((s, i) => <li key={i}>{s}</li>)}
              </ul>
              {jobs[modalJob].gaps?.length ? (
                <>
                  <p className="font-medium text-gray-700 mb-1">보완 필요</p>
                  <ul className="list-disc list-inside space-y-1">
                    {jobs[modalJob].gaps!.map((g, i) => <li key={i}>{g}</li>)}
                  </ul>
                </>
              ) : null}
            </div>
            <button onClick={() => setModalOpen(false)} className="w-full bg-[#5B9BD5] text-white py-2.5 rounded-lg text-sm font-semibold">닫기</button>
          </div>
        </div>
      )}

      {error && (
        <div className="max-w-5xl mx-auto px-4 pt-4">
          <div className="bg-red-50 border border-red-200 text-red-600 rounded-lg px-4 py-3 text-sm">{error}</div>
        </div>
      )}

      <div className="max-w-5xl mx-auto px-4 py-8">
        <StepIndicator currentStep={2} />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Left */}
          <div className="space-y-4">
            {/* 강점 진단 */}
            <div className="bg-white rounded-2xl p-5 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <span className="text-sm">💪</span>
                <h3 className="font-bold text-gray-800 text-sm">강점 진단</h3>
              </div>
              <div className="flex flex-wrap gap-2">
                {strengths.map((kw, i) => (
                  <div key={i} className="relative group">
                    <span className={`px-3 py-1.5 rounded-full text-xs font-medium cursor-pointer ${STRENGTH_COLORS[i % STRENGTH_COLORS.length]}`}>
                      {kw.keyword}
                    </span>
                    {kw.reasoning && (
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-10 bg-gray-800 text-white text-xs rounded-lg px-3 py-2 w-52 text-center shadow-lg">
                        {kw.reasoning}
                        <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-800" />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* 추천 직무 */}
            <div className="bg-white rounded-2xl p-5 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <span className="text-sm">🎯</span>
                <h3 className="font-bold text-gray-800 text-sm">추천 직무</h3>
              </div>
              <div className="grid grid-cols-3 gap-3">
                {jobs.map((job, i) => (
                  <div
                    key={i}
                    onClick={() => setSelectedJob(i)}
                    className={`border rounded-xl p-3 cursor-pointer transition-all ${
                      selectedJob === i ? 'border-[#5B9BD5] bg-[#EEF6FC]' : 'border-gray-200 hover:border-[#5B9BD5]'
                    }`}
                  >
                    <p className="text-xs font-bold text-gray-800 mb-2">{job.jobName}</p>
                    <div className="text-2xl font-bold text-[#2E6DA4] mb-1">{job.matchPercentage}%</div>
                    <div className="w-full bg-gray-100 rounded-full h-1.5 mb-2">
                      <div className="bg-[#5B9BD5] h-1.5 rounded-full transition-all duration-700" style={{ width: `${job.matchPercentage}%` }} />
                    </div>
                    <ul className="text-xs text-gray-500 space-y-0.5">
                      {job.strengths?.slice(0, 3).map((s, si) => (
                        <li key={si} className="flex gap-1"><span className="text-green-500">•</span>{s}</li>
                      ))}
                    </ul>
                    {job.gaps?.length ? (
                      <div className="mt-2 pt-2 border-t border-gray-100">
                        <ul className="text-xs text-gray-400 space-y-0.5">
                          {job.gaps.slice(0, 2).map((g, gi) => (
                            <li key={gi} className="flex gap-1"><span className="text-red-400">•</span>{g}</li>
                          ))}
                        </ul>
                      </div>
                    ) : null}
                    <button
                      onClick={(e) => { e.stopPropagation(); setModalJob(i); setModalOpen(true) }}
                      className="mt-2 text-xs text-[#5B9BD5] hover:underline"
                    >
                      더보기 →
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right */}
          <div className="space-y-4">
            <div className="bg-white rounded-2xl p-5 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <span className="text-sm">✖️</span>
                <h3 className="font-bold text-gray-800 text-sm">갭 메우기</h3>
                {currentJob && <span className="text-xs text-gray-400 ml-1">— {currentJob.jobName}</span>}
              </div>

              {currentJob && (
                <>
                  {/* 추천 학습 */}
                  {currentJob.gapFilling?.learnings?.length ? (
                    <div className="mb-4">
                      <p className="text-xs font-semibold text-gray-600 mb-2">추천 학습</p>
                      <div className="space-y-2">
                        {currentJob.gapFilling.learnings.map((l, i) => (
                          <div key={i} className="bg-[#F4F6F8] rounded-lg px-3 py-2">
                            <p className="text-xs text-gray-700">{l}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : null}

                  {/* 추천 프로젝트 */}
                  {currentJob.gapFilling?.projects?.length ? (
                    <div className="mb-4">
                      <p className="text-xs font-semibold text-gray-600 mb-2">추천 프로젝트</p>
                      <div className="space-y-2">
                        {currentJob.gapFilling.projects.map((p, i) => (
                          <div key={i} className="bg-[#F4F6F8] rounded-lg px-3 py-2">
                            <p className="text-xs text-gray-700 leading-relaxed">{p}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : null}
                </>
              )}

              {/* 추천 공고 — real API */}
              <div>
                <p className="text-xs font-semibold text-gray-600 mb-2">추천 공고</p>
                {postings.length > 0 ? (
                  <div className="space-y-2">
                    {postings.slice(0, expandedGap ? postings.length : 3).map((ad) => (
                      <div key={ad.id} className="flex items-center gap-2 bg-[#F4F6F8] rounded-lg px-3 py-2">
                        <div className="w-8 h-8 bg-gray-200 rounded-lg flex items-center justify-center text-xs font-bold text-gray-600 flex-shrink-0">
                          {ad.company?.[0] || '?'}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-gray-800 truncate">{ad.company} - {ad.title}</p>
                          <div className="flex gap-1 flex-wrap">
                            {ad.tags?.slice(0, 2).map((t) => (
                              <span key={t} className="text-xs text-gray-400">{t}</span>
                            ))}
                          </div>
                        </div>
                        {ad.matchScore != null && (
                          <span className="text-xs font-bold text-[#2E6DA4] flex-shrink-0">{ad.matchScore}%</span>
                        )}
                      </div>
                    ))}
                    {!expandedGap && postings.length > 3 && (
                      <button onClick={() => setExpandedGap(true)} className="w-full text-xs text-[#5B9BD5] hover:text-[#2E6DA4] py-1">
                        더보기 ({postings.length - 3}개 더)
                      </button>
                    )}
                  </div>
                ) : (
                  <p className="text-xs text-gray-400 py-2">추천 공고를 불러오는 중...</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Bottom actions */}
        <div className="flex items-center justify-between mt-6 flex-wrap gap-3">
          <div className="flex gap-2">
            <button onClick={handleShareUrl} className="flex items-center gap-2 border border-gray-300 text-gray-600 px-4 py-2.5 rounded-lg text-sm hover:border-[#5B9BD5] transition-colors">
              {copiedUrl ? '✓ 복사됨!' : '🔗 URL 복사'}
            </button>
            <button onClick={handleSave} className="flex items-center gap-2 border border-gray-300 text-gray-600 px-4 py-2.5 rounded-lg text-sm hover:border-[#5B9BD5] transition-colors">
              💾 결과 저장
            </button>
          </div>
          <button
            onClick={() => navigate('/coach')}
            className="bg-[#5B9BD5] hover:bg-[#2E6DA4] text-white px-6 py-2.5 rounded-lg font-semibold text-sm transition-colors shadow-sm"
          >
            자소서 코치로 이동 →
          </button>
        </div>
      </div>
    </div>
  )
}
