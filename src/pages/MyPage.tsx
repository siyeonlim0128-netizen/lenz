import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import Header from '../components/Header'
import { getProfile, updateProfile, getBookmarks, deleteBookmark, getHistory, getCoverLetters } from '../api/user'
import type { UserProfile } from '../api/user'

export default function MyPage() {
  const navigate = useNavigate()
  const [user, setUser] = useState<UserProfile | null>(null)
  const [editMode, setEditMode] = useState(false)
  const [editForm, setEditForm] = useState<Partial<UserProfile>>({})
  const [history, setHistory] = useState<Record<string, unknown>[]>([])
  const [bookmarks, setBookmarks] = useState<Record<string, unknown>[]>([])
  const [coverLetters, setCoverLetters] = useState<Record<string, unknown>[]>([])
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const token = localStorage.getItem('lenz_token')
    if (!token) {
      navigate('/login')
      return
    }
    const loadAll = async () => {
      const isLocalToken = token === 'local-demo-token'

      if (isLocalToken) {
        // 로컬 모드: localStorage에서 유저 정보 사용
        const stored = localStorage.getItem('lenz_user')
        if (stored) {
          const u = JSON.parse(stored)
          setUser(u)
          setEditForm(u)
        }
        setLoading(false)
        return
      }

      try {
        const [profile, hist, bk, cl] = await Promise.all([
          getProfile(),
          getHistory().catch(() => []),
          getBookmarks().catch(() => []),
          getCoverLetters().catch(() => []),
        ])
        setUser(profile)
        setEditForm(profile)
        setHistory(hist)
        setBookmarks(bk)
        setCoverLetters(cl)
        localStorage.setItem('lenz_user', JSON.stringify(profile))
      } catch {
        // API 실패 시 localStorage 유저 사용
        const stored = localStorage.getItem('lenz_user')
        if (stored) {
          const u = JSON.parse(stored)
          setUser(u)
          setEditForm(u)
        } else {
          navigate('/login')
        }
      } finally {
        setLoading(false)
      }
    }
    loadAll()
  }, [navigate])

  const handleLogout = () => {
    localStorage.removeItem('lenz_token')
    localStorage.removeItem('lenz_user')
    navigate('/')
  }

  const handleSaveEdit = async () => {
    if (!editForm) return
    try {
      await updateProfile({
        name: editForm.name,
        school: editForm.school,
        grade: editForm.grade,
        interestedJobs: editForm.interestedJobs,
      })
      const updated = { ...user, ...editForm } as UserProfile
      setUser(updated)
      localStorage.setItem('lenz_user', JSON.stringify(updated))
      setEditMode(false)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : '수정에 실패했습니다.')
    }
  }

  const handleDeleteBookmark = async (postingId: string) => {
    try {
      await deleteBookmark(postingId)
      setBookmarks(bookmarks.filter((b) => (b as { postingId?: string }).postingId !== postingId))
    } catch {}
  }

  const handleDeleteAccount = () => {
    localStorage.removeItem('lenz_token')
    localStorage.removeItem('lenz_user')
    navigate('/')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F4F6F8]">
        <Header />
        <div className="flex items-center justify-center py-24">
          <p className="text-gray-400 text-sm">불러오는 중...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-[#F4F6F8]">
        <Header />
        <div className="flex flex-col items-center justify-center py-24 gap-3">
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <button onClick={() => navigate('/login')} className="text-sm text-[#5B9BD5] underline">로그인 페이지로</button>
        </div>
      </div>
    )
  }

  // Extract history items for display
  const historyItems = history.slice(0, 5).map((h) => {
    const item = h as { id?: string; createdAt?: string; date?: string; result?: { recommendedJobs?: { jobName: string; matchPercentage: number }[] }; recommendedJobs?: { jobName: string; matchPercentage: number }[] }
    const jobs = item.result?.recommendedJobs || item.recommendedJobs || []
    const dateStr = item.createdAt
      ? new Date(item.createdAt).toLocaleDateString('ko-KR', { month: '2-digit', day: '2-digit' })
      : item.date || ''
    return { id: item.id || String(Math.random()), date: dateStr, jobs: jobs.slice(0, 3) }
  })

  const allJobs = historyItems[0]?.jobs || []

  return (
    <div className="min-h-screen bg-[#F4F6F8]">
      <Header />

      {/* Delete confirm modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl">
            <h3 className="font-bold text-gray-800 mb-2">정말 탈퇴하시겠어요?</h3>
            <p className="text-sm text-gray-500 mb-5">계정과 저장된 모든 데이터가 삭제됩니다.</p>
            <div className="flex gap-2">
              <button onClick={() => setShowDeleteModal(false)} className="flex-1 border border-gray-300 text-gray-600 py-2.5 rounded-lg text-sm">취소</button>
              <button onClick={handleDeleteAccount} className="flex-1 bg-red-500 text-white py-2.5 rounded-lg text-sm font-semibold">탈퇴하기</button>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-xl font-bold text-gray-800">마이페이지</h1>
          <button onClick={handleLogout} className="border border-gray-300 text-gray-600 px-4 py-2 rounded-lg text-sm hover:border-gray-400">로그아웃</button>
        </div>

        {error && <div className="bg-red-50 border border-red-200 text-red-600 rounded-lg px-4 py-3 mb-4 text-sm">{error}</div>}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Profile */}
          <div className="bg-white rounded-2xl p-6 shadow-sm flex flex-col items-center text-center">
            <div className="w-16 h-16 rounded-full bg-[#2E6DA4] flex items-center justify-center text-white text-2xl font-bold mb-3">
              {user.name?.[0] || '?'}
            </div>
            {editMode ? (
              <div className="w-full space-y-2 text-left">
                {[
                  { label: '이름', key: 'name' as const },
                  { label: '학교', key: 'school' as const },
                  { label: '학년', key: 'grade' as const },
                ].map(({ label, key }) => (
                  <div key={key}>
                    <label className="text-xs text-gray-400">{label}</label>
                    <input
                      value={(editForm[key] as string) || ''}
                      onChange={(e) => setEditForm({ ...editForm, [key]: e.target.value })}
                      className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-sm mt-0.5"
                    />
                  </div>
                ))}
                <div className="flex gap-2 mt-2">
                  <button onClick={() => setEditMode(false)} className="flex-1 border border-gray-300 text-gray-600 py-2 rounded-lg text-xs">취소</button>
                  <button onClick={handleSaveEdit} className="flex-1 bg-[#5B9BD5] text-white py-2 rounded-lg text-xs font-semibold">저장</button>
                </div>
              </div>
            ) : (
              <>
                <p className="font-bold text-gray-800 text-base">{user.name}</p>
                <p className="text-sm text-gray-500 mt-0.5">{user.school}</p>
                <p className="text-sm text-gray-500">{user.grade}</p>
                <div className="flex flex-wrap justify-center gap-1 mt-3">
                  {(user.interestedJobs || []).map((job) => (
                    <span key={job} className="bg-[#D6E9F8] text-[#2E6DA4] text-xs px-2 py-1 rounded-full">{job}</span>
                  ))}
                </div>
                <button onClick={() => setEditMode(true)} className="mt-4 w-full border border-gray-300 text-gray-600 py-2 rounded-lg text-sm hover:border-[#5B9BD5] transition-colors">내 정보 수정</button>
              </>
            )}
          </div>

          {/* Analysis history */}
          <div className="bg-white rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-gray-800 text-sm">분석 이력</h3>
              <Link to="/result" className="text-xs text-[#5B9BD5] hover:underline">전체 보기</Link>
            </div>

            {historyItems.length > 0 ? (
              <div className="space-y-3 mb-4">
                {historyItems.map((item) => (
                  <div key={item.id} className="border-b border-gray-100 pb-3 last:border-0">
                    <div className="flex items-start gap-2">
                      <span className="text-xs text-gray-400 w-10 flex-shrink-0">{item.date}</span>
                      <div className="flex-1">
                        <div className="flex flex-wrap gap-1 mb-1">
                          {item.jobs.map((j, ji) => (
                            <span key={ji} className="bg-[#D6E9F8] text-[#2E6DA4] text-xs px-2 py-0.5 rounded-full">
                              {j.jobName} {j.matchPercentage}%
                            </span>
                          ))}
                        </div>
                      </div>
                      <Link to="/result" className="text-xs border border-gray-200 text-gray-600 px-2.5 py-1 rounded-lg hover:border-[#5B9BD5] flex-shrink-0">결과 보기</Link>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6">
                <p className="text-xs text-gray-400 mb-2">아직 분석 이력이 없습니다.</p>
                <Link to="/resume" className="text-xs text-[#5B9BD5] hover:underline">첫 분석 시작하기 →</Link>
              </div>
            )}

            {allJobs.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-gray-600 mb-2">강점 변화 그래프</p>
                <div className="space-y-2">
                  {allJobs.map((j, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <span className="text-xs text-gray-600 w-20 flex-shrink-0 truncate">{j.jobName}</span>
                      <div className="flex-1 bg-gray-100 rounded-full h-2">
                        <div className="bg-[#5B9BD5] h-2 rounded-full transition-all duration-700" style={{ width: `${j.matchPercentage}%` }} />
                      </div>
                      <span className="text-xs font-bold text-[#2E6DA4] w-8 text-right">{j.matchPercentage}%</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right column */}
          <div className="space-y-4">
            {/* 자소서 가이드 보관함 */}
            <div className="bg-white rounded-2xl p-5 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-gray-800 text-sm">자소서 가이드 보관함</h3>
                <Link to="/coach" className="text-xs text-[#5B9BD5] hover:underline">전체 보기</Link>
              </div>
              {coverLetters.length > 0 ? (
                <div className="space-y-2">
                  {coverLetters.slice(0, 3).map((cl, i) => {
                    const item = cl as { id?: string; jobTitle?: string; createdAt?: string }
                    return (
                      <div key={item.id || i} className="flex items-center gap-2">
                        <span className="text-sm">📝</span>
                        <div className="flex-1">
                          <p className="text-xs text-gray-700">{item.jobTitle || '자소서 가이드'}</p>
                          <p className="text-xs text-gray-400">
                            {item.createdAt ? new Date(item.createdAt).toLocaleDateString('ko-KR') : ''}
                          </p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <p className="text-xs text-gray-400 py-2">저장된 가이드가 없습니다.</p>
              )}
              <Link to="/coach" className="block text-xs text-[#5B9BD5] hover:underline mt-2">+ 새 자소서 가이드 받기</Link>
            </div>

            {/* 저장한 공고 */}
            <div className="bg-white rounded-2xl p-5 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-gray-800 text-sm">저장한 공고</h3>
                <span className="text-xs text-gray-400">{bookmarks.length}개</span>
              </div>
              {bookmarks.length > 0 ? (
                <div className="space-y-2">
                  {bookmarks.slice(0, 4).map((bk, i) => {
                    const item = bk as { postingId?: string; postingData?: { company?: string; title?: string }; createdAt?: string }
                    return (
                      <div key={item.postingId || i} className="flex items-center gap-2 py-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#5B9BD5] flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-gray-700 truncate">
                            {item.postingData?.company ? `${item.postingData.company} - ` : ''}{item.postingData?.title || '공고'}
                          </p>
                          <p className="text-xs text-gray-400">
                            {item.createdAt ? new Date(item.createdAt).toLocaleDateString('ko-KR') : ''}
                          </p>
                        </div>
                        <button
                          onClick={() => handleDeleteBookmark(item.postingId || '')}
                          className="text-gray-300 hover:text-red-400 text-sm flex-shrink-0"
                        >
                          ✕
                        </button>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <p className="text-xs text-gray-400 py-2">저장된 공고가 없습니다.</p>
              )}
            </div>

            {/* 회원탈퇴 */}
            <button
              onClick={() => setShowDeleteModal(true)}
              className="w-full bg-white border border-red-200 text-red-500 hover:bg-red-50 py-3 rounded-2xl text-sm transition-colors shadow-sm"
            >
              회원 탈퇴 - 계정 및 저장 데이터 삭제
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
