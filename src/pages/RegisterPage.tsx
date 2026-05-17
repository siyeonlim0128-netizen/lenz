import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { signup } from '../api/auth'
import { getProfile } from '../api/user'

const JOB_OPTIONS = ['마케팅', '서비스기획', '개발', '디자인', '브랜드', '콘텐츠', 'PM', '데이터분석', '영업', 'HR']
const YEAR_OPTIONS = ['1학년', '2학년', '3학년', '4학년', '졸업예정', '졸업']

export default function RegisterPage() {
  const navigate = useNavigate()
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    school: '',
    major: '',
    year: '',
    interests: [] as string[],
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const toggleInterest = (job: string) => {
    setForm((prev) => ({
      ...prev,
      interests: prev.interests.includes(job)
        ? prev.interests.filter((j) => j !== job)
        : [...prev.interests, job],
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name || !form.email || !form.password || !form.school) {
      setError('필수 항목을 입력해주세요.')
      return
    }
    if (form.password.length < 8) {
      setError('비밀번호는 8자 이상이어야 합니다.')
      return
    }
    setLoading(true)
    setError('')

    const localUser = {
      id: 'local-' + Date.now(),
      name: form.name,
      email: form.email,
      school: form.school,
      major: form.major,
      grade: form.year,
      interestedJobs: form.interests,
    }

    try {
      const res = await signup({
        email: form.email,
        password: form.password,
        name: form.name,
        school: form.school,
        major: form.major,
        grade: form.year,
        interestedJobs: form.interests,
      })
      localStorage.setItem('lenz_token', res.access_token)
      try {
        const profile = await getProfile()
        localStorage.setItem('lenz_user', JSON.stringify(profile))
      } catch {
        localStorage.setItem('lenz_user', JSON.stringify(localUser))
      }
      navigate('/mypage')
    } catch {
      // 백엔드 오류 시 로컬 모드로 진행
      localStorage.setItem('lenz_token', 'local-demo-token')
      localStorage.setItem('lenz_user', JSON.stringify(localUser))
      navigate('/mypage')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* Left brand panel */}
      <div className="hidden md:flex w-1/2 bg-gradient-to-br from-[#5B9BD5] to-[#2E6DA4] flex-col justify-center px-16 text-white relative">
        <Link to="/" className="absolute top-6 left-8 text-white text-xl font-bold opacity-90 hover:opacity-100">← Lenz</Link>
        <p className="text-sm font-semibold mb-4 opacity-80 tracking-widest uppercase">AI 커리어 코치</p>
        <h1 className="text-4xl font-bold leading-tight mb-6">
          취준의 방향을<br />찾아드릴게요
        </h1>
        <p className="text-base opacity-80 leading-relaxed">
          이력서 한 장으로 사자 강점을 진단하고,<br />
          적속하는 직무를 추천하고, 부족한 것 있을 채워주는 방법까지<br />
          한 번에 알려드립니다.
        </p>
      </div>

      {/* Right form */}
      <div className="flex-1 flex items-center justify-center px-8 bg-white py-10">
        <div className="w-full max-w-sm">
          <Link to="/" className="flex items-center gap-1 text-sm text-gray-400 hover:text-[#5B9BD5] mb-6 md:hidden">← 메인으로</Link>
          {/* Tab */}
          <div className="flex mb-6 border-b border-gray-200">
            <div className="flex-1 text-center py-3 text-sm font-bold text-[#2E6DA4] border-b-2 border-[#2E6DA4]">회원가입</div>
            <Link to="/login" className="flex-1 text-center py-3 text-sm text-gray-400 hover:text-gray-600">로그인</Link>
          </div>

          <h2 className="text-xl font-bold text-gray-800 mb-6">취준의 방향을<br />찾아드릴게요</h2>

          {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="flex gap-2">
              <div className="flex-1">
                <label className="block text-xs text-gray-500 mb-1">이름</label>
                <input
                  type="text"
                  placeholder="홍길동"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-[#5B9BD5]"
                />
              </div>
              <div className="flex-1">
                <label className="block text-xs text-gray-500 mb-1">이메일</label>
                <input
                  type="email"
                  placeholder="user@email.com"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-[#5B9BD5]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs text-gray-500 mb-1">비밀번호</label>
              <input
                type="password"
                placeholder="한국 비밀번호 입력하세요"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-[#5B9BD5]"
              />
            </div>

            <div className="flex gap-2">
              <div className="flex-1">
                <label className="block text-xs text-gray-500 mb-1">학교</label>
                <input
                  type="text"
                  placeholder="00 대학교"
                  value={form.school}
                  onChange={(e) => setForm({ ...form, school: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-[#5B9BD5]"
                />
              </div>
              <div className="flex-1">
                <label className="block text-xs text-gray-500 mb-1">학과</label>
                <input
                  type="text"
                  placeholder="00학과"
                  value={form.major}
                  onChange={(e) => setForm({ ...form, major: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-[#5B9BD5]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs text-gray-500 mb-1">학년</label>
              <select
                value={form.year}
                onChange={(e) => setForm({ ...form, year: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-[#5B9BD5] bg-white"
              >
                <option value="">선택</option>
                {YEAR_OPTIONS.map((y) => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-xs text-gray-500 mb-2">관심 직무</label>
              <div className="flex flex-wrap gap-2">
                {JOB_OPTIONS.map((job) => (
                  <button
                    key={job}
                    type="button"
                    onClick={() => toggleInterest(job)}
                    className={`px-3 py-1 rounded-full text-xs border transition-colors ${
                      form.interests.includes(job)
                        ? 'bg-[#5B9BD5] text-white border-[#5B9BD5]'
                        : 'bg-white text-gray-600 border-gray-300 hover:border-[#5B9BD5]'
                    }`}
                  >
                    {job}
                  </button>
                ))}
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#2E6DA4] hover:bg-[#1d5480] disabled:bg-gray-300 text-white py-3 rounded-lg font-semibold text-sm transition-colors mt-2"
            >
              {loading ? '가입 중...' : 'Lenz 시작하기 →'}
            </button>
          </form>

          <div className="mt-4 text-center">
            <button
              onClick={() => navigate('/resume')}
              className="text-xs text-gray-400 hover:text-[#5B9BD5] underline"
            >
              비회원으로 1회 무료 분석하기
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
