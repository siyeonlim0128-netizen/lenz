import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Header from '../components/Header'

const steps = [
  {
    label: '진단',
    subtitle: '나의 사용자입니다',
    desc: '이력서와 경험을 기반으로 AI가 나의 강점을 정확히 진단합니다.',
  },
  {
    label: '방향',
    subtitle: '나에게 맞는 직무는?',
    desc: '강점과 경험을 바탕으로 가장 적합한 직무를 추천해 드립니다.',
  },
  {
    label: '갭',
    subtitle: '아직은 부족한 것들',
    desc: '목표 직무와의 갭을 분석하고 채워야 할 부분을 알려드립니다.',
  },
  {
    label: '실행',
    subtitle: '이렇게 준비하면 된다!',
    desc: '강의, 프로젝트, 공고 추천으로 실행 가능한 로드맵을 제시합니다.',
  },
]

const reviews = [
  {
    name: '김민지',
    school: '연세대 경영학과',
    text: '막연하게 마케팅이 하고 싶었는데, AI가 제 경험에서 강점을 찾아줬어요. 방향이 생겼습니다!',
    role: '마케팅 직무 준비 중',
  },
  {
    name: '박준혁',
    school: '성균관대 컴퓨터공학과',
    text: '포트폴리오에 뭘 더 넣어야 할지 몰랐는데 갭 분석이 정말 도움됐어요.',
    role: '개발자 취준생',
  },
  {
    name: '이수연',
    school: '한양대 산업공학과',
    text: '자소서 코치 기능으로 지원동기를 완전히 새로 썼는데 서류 합격했어요.',
    role: '서비스기획 지원',
  },
  {
    name: '최동현',
    school: '고려대 경제학과',
    text: '비전공자인데 서비스기획으로 전환할 수 있다고 해줘서 자신감이 생겼어요.',
    role: '기획직군 전환 준비',
  },
]

function useIntersection(threshold = 0.15) {
  const ref = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisible(true) },
      { threshold }
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [threshold])

  return { ref, visible }
}

export default function MainPage() {
  const navigate = useNavigate()
  const flow1 = useIntersection()
  const reviews1 = useIntersection()

  return (
    <div className="flex flex-col min-h-screen bg-white">
      <Header />

      {/* Hero */}
      <section className="flex flex-col items-center justify-center text-center py-24 px-4 bg-gradient-to-b from-[#F4F8FC] to-white">
        <p className="text-sm text-[#5B9BD5] font-semibold mb-3 tracking-widest uppercase">AI 커리어 코치</p>
        <h1 className="text-4xl md:text-5xl font-bold text-gray-900 leading-tight mb-4">
          "AI로 취준생의 자기 의심을<br />없앤다면"
        </h1>
        <p className="text-gray-500 text-base md:text-lg max-w-md mb-8">
          이력서 한 장으로 나의 경험을 진단하고,<br />
          어울리는 직무와 가소여가 된 길을 함께 찾아드립니다.
        </p>
        <button
          onClick={() => navigate('/resume')}
          className="bg-[#5B9BD5] hover:bg-[#2E6DA4] text-white px-8 py-3 rounded-full text-base font-semibold transition-colors shadow-md"
        >
          AI 분석 시작하기 →
        </button>
      </section>

      {/* 4-step mini preview */}
      <section className="bg-[#F4F6F8] py-6 px-4">
        <div className="max-w-4xl mx-auto grid grid-cols-4 gap-3">
          {steps.map((s) => (
            <div key={s.label} className="bg-white rounded-xl p-4 text-center shadow-sm border border-gray-100">
              <p className="text-sm font-bold text-[#2E6DA4] mb-1">{s.label}</p>
              <p className="text-xs text-gray-500">{s.subtitle}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 4-step flow detail */}
      <section ref={flow1.ref} className={`py-20 px-4 transition-all duration-700 ${flow1.visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl font-bold text-center text-gray-800 mb-12">서비스 흐름 4단계</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {steps.map((s, i) => (
              <div
                key={s.label}
                className="bg-white border border-[#D6E9F8] rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow"
                style={{ transitionDelay: `${i * 100}ms` }}
              >
                <div className="w-10 h-10 rounded-full bg-[#D6E9F8] flex items-center justify-center text-[#2E6DA4] font-bold text-sm mb-4">
                  {i + 1}
                </div>
                <h3 className="font-bold text-gray-800 mb-2">{s.label}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Reviews */}
      <section
        ref={reviews1.ref}
        className={`py-20 px-4 bg-[#F4F6F8] transition-all duration-700 ${reviews1.visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
      >
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-bold text-gray-800">사용자 후기</h2>
            <span className="text-xs text-gray-400 bg-white px-3 py-1 rounded-full border">베타 테스트 후기</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {reviews.map((r) => (
              <div key={r.name} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                <div className="w-10 h-10 rounded-full bg-[#5B9BD5] flex items-center justify-center text-white font-bold text-sm mb-3">
                  {r.name[0]}
                </div>
                <p className="text-sm text-gray-700 leading-relaxed mb-3">"{r.text}"</p>
                <p className="text-xs font-semibold text-gray-800">{r.name}</p>
                <p className="text-xs text-gray-400">{r.school} · {r.role}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 py-10 px-8">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <p className="text-xl font-bold text-[#2E6DA4] mb-1">Lenz</p>
            <p className="text-sm text-gray-500">멋사 14기 팀 · AI 커리어 코치 서비스</p>
          </div>
          <div className="flex gap-6 text-sm text-gray-500">
            <a href="https://github.com" target="_blank" rel="noreferrer" className="hover:text-[#2E6DA4]">GitHub</a>
            <a href="mailto:team@lenz.kr" className="hover:text-[#2E6DA4]">문의하기</a>
          </div>
        </div>
      </footer>
    </div>
  )
}
