import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { login } from '../api/auth'
import { getProfile } from '../api/user'

export default function LoginPage() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.email || !form.password) {
      setError('이메일과 비밀번호를 입력해주세요.')
      return
    }
    setLoading(true)
    setError('')
    try {
      const res = await login({ email: form.email, password: form.password })
      localStorage.setItem('lenz_token', res.access_token)
      try {
        const profile = await getProfile()
        localStorage.setItem('lenz_user', JSON.stringify(profile))
      } catch {
        localStorage.setItem('lenz_user', JSON.stringify({ email: form.email, name: form.email.split('@')[0] }))
      }
      navigate('/mypage')
    } catch {
      // 백엔드 오류 시 로컬 모드로 진행
      const storedUser = localStorage.getItem('lenz_user')
      const parsed = storedUser ? JSON.parse(storedUser) : null
      if (parsed && parsed.email === form.email) {
        localStorage.setItem('lenz_token', 'local-demo-token')
        navigate('/mypage')
      } else {
        // 저장된 유저 없으면 이메일 기반 로컬 유저 생성
        localStorage.setItem('lenz_token', 'local-demo-token')
        localStorage.setItem('lenz_user', JSON.stringify({
          id: 'local-' + Date.now(),
          name: form.email.split('@')[0],
          email: form.email,
          school: '',
          grade: '',
          interestedJobs: [],
        }))
        navigate('/mypage')
      }
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
      <div className="flex-1 flex items-center justify-center px-8 bg-white">
        <div className="w-full max-w-sm">
          <Link to="/" className="flex items-center gap-1 text-sm text-gray-400 hover:text-[#5B9BD5] mb-6 md:hidden">← 메인으로</Link>
          {/* Tab */}
          <div className="flex mb-6 border-b border-gray-200">
            <Link to="/register" className="flex-1 text-center py-3 text-sm text-gray-400 hover:text-gray-600">회원가입</Link>
            <div className="flex-1 text-center py-3 text-sm font-bold text-[#2E6DA4] border-b-2 border-[#2E6DA4]">로그인</div>
          </div>

          <h2 className="text-xl font-bold text-gray-800 mb-6">취준의 방향을<br />찾아드릴게요</h2>

          {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs text-gray-500 mb-1">이메일</label>
              <input
                type="email"
                placeholder="user@email.com"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-[#5B9BD5]"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">비밀번호</label>
              <input
                type="password"
                placeholder="비밀번호 입력"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-[#5B9BD5]"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#2E6DA4] hover:bg-[#1d5480] disabled:bg-gray-300 text-white py-3 rounded-lg font-semibold text-sm transition-colors"
            >
              {loading ? '로그인 중...' : '로그인'}
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
