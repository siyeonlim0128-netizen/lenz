import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import Header from '../components/Header'
import StepIndicator from '../components/StepIndicator'
import { parseResume, analyzeResume, type ResumeData, type AnalyzeResult } from '../api/resume'

function buildMockResult(data: ResumeData): AnalyzeResult {
  const jobs = data.interestedJobs?.slice(0, 3) || ['서비스기획', '마케팅', 'PM']
  return {
    strengths: [
      { keyword: '사용자 중심 사고', color: 'blue', reasoning: `${data.activities?.[0] || '활동'} 경험 기반` },
      { keyword: '기획력', color: 'green', reasoning: `${data.projects?.[0]?.name || '프로젝트'} 기반` },
      { keyword: '커뮤니케이션', color: 'purple', reasoning: '다양한 협업 경험' },
      { keyword: '데이터 분석', color: 'orange', reasoning: `${data.skills?.[0] || '스킬'} 활용` },
      { keyword: '문제 해결력', color: 'pink', reasoning: '프로젝트 경험 기반' },
    ],
    recommendedJobs: jobs.map((job, i) => ({
      jobName: job,
      matchPercentage: 85 - i * 8,
      strengths: ['관련 경험 보유', '핵심 역량 보유', '높은 잠재력'],
      gaps: ['실무 경험 보강 필요', '관련 자격증 취득 권장'],
      gapFilling: {
        learnings: [`${job} 실무 강의`, '관련 자격증 준비'],
        projects: [`${job} 관련 사이드 프로젝트`, '포트폴리오 보강'],
        postings: [],
      },
    })),
  }
}

const JOB_OPTIONS = ['마케팅', '서비스기획', '개발', '디자인', '브랜드', '콘텐츠', 'PM', '데이터분석', '영업', 'HR']

interface Activity {
  id: number
  value: string
}

interface Project {
  id: number
  name: string
  desc: string
}

export default function ResumeInputPage() {
  const navigate = useNavigate()
  const fileRef = useRef<HTMLInputElement>(null)
  const [inputMode, setInputMode] = useState<'pdf' | 'form'>('form')
  const [dragOver, setDragOver] = useState(false)
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [parsing, setParsing] = useState(false)
  const [analyzing, setAnalyzing] = useState(false)
  const [skillInput, setSkillInput] = useState('')
  const [skills, setSkills] = useState<string[]>([])
  const [interests, setInterests] = useState<string[]>([])
  const [activities, setActivities] = useState<Activity[]>([{ id: 1, value: '' }])
  const [projects, setProjects] = useState<Project[]>([{ id: 1, name: '', desc: '' }])
  const [school, setSchool] = useState('')
  const [year, setYear] = useState('')
  const [error, setError] = useState('')

  const applyParsedData = (data: ResumeData) => {
    if (data.education) {
      setSchool(data.education.school || '')
      setYear(data.education.grade || '')
    }
    if (data.activities?.length) {
      setActivities(data.activities.map((v, i) => ({ id: i + 1, value: v })))
    }
    if (data.projects?.length) {
      setProjects(data.projects.map((p, i) => ({ id: i + 1, name: p.name, desc: p.description })))
    }
    if (data.skills?.length) setSkills(data.skills)
    if (data.interestedJobs?.length) setInterests(data.interestedJobs)
  }

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file && file.type === 'application/pdf') {
      setUploadedFile(file)
      await runParse(file)
    }
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setUploadedFile(file)
      await runParse(file)
    }
  }

  const runParse = async (file: File) => {
    setParsing(true)
    setError('')
    try {
      const result = await parseResume(file)
      applyParsedData(result.resumeData)
      setInputMode('form')
    } catch {
      setInputMode('form')
      setError('PDF 자동 파싱을 사용할 수 없습니다. 아래 양식에 직접 입력해주세요.')
    } finally {
      setParsing(false)
    }
  }

  const addSkill = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && skillInput.trim()) {
      e.preventDefault()
      if (!skills.includes(skillInput.trim())) setSkills([...skills, skillInput.trim()])
      setSkillInput('')
    }
  }

  const removeSkill = (s: string) => setSkills(skills.filter((sk) => sk !== s))

  const toggleInterest = (job: string) => {
    setInterests((prev) =>
      prev.includes(job) ? prev.filter((j) => j !== job) : [...prev, job]
    )
  }

  const addActivity = () => setActivities([...activities, { id: Date.now(), value: '' }])
  const updateActivity = (id: number, value: string) =>
    setActivities(activities.map((a) => (a.id === id ? { ...a, value } : a)))
  const removeActivity = (id: number) => setActivities(activities.filter((a) => a.id !== id))

  const addProject = () => setProjects([...projects, { id: Date.now(), name: '', desc: '' }])
  const updateProject = (id: number, field: 'name' | 'desc', value: string) =>
    setProjects(projects.map((p) => (p.id === id ? { ...p, [field]: value } : p)))
  const removeProject = (id: number) => setProjects(projects.filter((p) => p.id !== id))

  const validate = () => {
    if (!school) return '학력을 입력해주세요.'
    if (activities.every((a) => !a.value.trim()) && projects.every((p) => !p.name.trim())) return '활동 또는 프로젝트를 최소 1개 입력해주세요.'
    if (interests.length === 0) return '관심 직무를 최소 1개 선택해주세요.'
    return ''
  }

  const handleAnalyze = async () => {
    const err = validate()
    if (err) { setError(err); return }

    const resumeData: ResumeData = {
      education: { school, grade: year },
      activities: activities.map((a) => a.value).filter(Boolean),
      projects: projects.filter((p) => p.name.trim()).map((p) => ({ name: p.name, description: p.desc })),
      skills,
      interestedJobs: interests,
    }

    setAnalyzing(true)
    setError('')
    try {
      const result = await analyzeResume(resumeData)
      sessionStorage.setItem('lenz_resume', JSON.stringify(resumeData))
      sessionStorage.setItem('lenz_result', JSON.stringify(result))
      navigate('/result')
    } catch (err: unknown) {
      // 백엔드 오류 시 목 데이터로 진행 (시연용)
      const mockResult = buildMockResult(resumeData)
      sessionStorage.setItem('lenz_resume', JSON.stringify(resumeData))
      sessionStorage.setItem('lenz_result', JSON.stringify(mockResult))
      navigate('/result')
    } finally {
      setAnalyzing(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#F4F6F8]">
      <Header />

      <div className="max-w-5xl mx-auto px-4 py-8">
        <StepIndicator currentStep={1} />

        {error && (
          <div className="bg-red-50 text-red-600 border border-red-200 rounded-lg px-4 py-3 mb-4 text-sm">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Left column */}
          <div className="space-y-4">
            {/* Input mode */}
            <div className="bg-white rounded-2xl p-5 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <span className="text-sm">📋</span>
                <h3 className="font-bold text-gray-800 text-sm">입력 방식</h3>
              </div>
              <div className="flex gap-2 mb-4">
                <button
                  onClick={() => setInputMode('pdf')}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-colors ${
                    inputMode === 'pdf'
                      ? 'bg-[#5B9BD5] text-white border-[#5B9BD5]'
                      : 'bg-white text-gray-600 border-gray-300 hover:border-[#5B9BD5]'
                  }`}
                >
                  PDF업로드
                </button>
                <button
                  onClick={() => setInputMode('form')}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-colors ${
                    inputMode === 'form'
                      ? 'bg-[#5B9BD5] text-white border-[#5B9BD5]'
                      : 'bg-white text-gray-600 border-gray-300 hover:border-[#5B9BD5]'
                  }`}
                >
                  직접 입력
                </button>
              </div>

              {inputMode === 'pdf' ? (
                <div
                  onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={handleDrop}
                  onClick={() => fileRef.current?.click()}
                  className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
                    dragOver ? 'border-[#5B9BD5] bg-[#EEF6FC]' : 'border-gray-300 hover:border-[#5B9BD5]'
                  }`}
                >
                  <input ref={fileRef} type="file" accept=".pdf" className="hidden" onChange={handleFileChange} />
                  {parsing ? (
                    <div>
                      <p className="text-sm text-[#5B9BD5] font-medium mb-1">AI가 이력서를 읽는 중...</p>
                      <p className="text-xs text-gray-400">학력/활동/프로젝트를 자동 추출합니다</p>
                    </div>
                  ) : uploadedFile ? (
                    <div>
                      <p className="text-[#2E6DA4] font-semibold text-sm">✓ {uploadedFile.name}</p>
                      <p className="text-xs text-gray-400 mt-1">정보가 아래 폼에 자동 입력됩니다 · 클릭해서 변경</p>
                    </div>
                  ) : (
                    <div>
                      <p className="text-4xl mb-2">📄</p>
                      <p className="text-sm text-gray-500">이력서 PDF를 드래그하거나 클릭해서 업로드</p>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-xs text-gray-400 text-center py-2">아래 폼을 직접 채워주세요.</p>
              )}
            </div>

            {/* 학력 */}
            <div className="bg-white rounded-2xl p-5 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <span className="text-sm">🎓</span>
                <h3 className="font-bold text-gray-800 text-sm">학력</h3>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-xs text-gray-400 mb-1">학교</label>
                  <input
                    value={school}
                    onChange={(e) => setSchool(e.target.value)}
                    placeholder="00 대학교"
                    className="w-full border border-gray-200 rounded-lg px-2 py-2 text-xs focus:outline-none focus:border-[#5B9BD5]"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">학년</label>
                  <select
                    value={year}
                    onChange={(e) => setYear(e.target.value)}
                    className="w-full border border-gray-200 rounded-lg px-2 py-2 text-xs focus:outline-none focus:border-[#5B9BD5] bg-white"
                  >
                    <option value="">학년</option>
                    {['1학년', '2학년', '3학년', '4학년', '졸업예정', '졸업'].map((y) => (
                      <option key={y} value={y}>{y}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* 활동 */}
            <div className="bg-white rounded-2xl p-5 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-sm">✏️</span>
                  <h3 className="font-bold text-gray-800 text-sm">활동</h3>
                </div>
                <button onClick={addActivity} className="text-xs text-[#5B9BD5] hover:text-[#2E6DA4]">+ 활동추가</button>
              </div>
              <div className="space-y-2">
                {activities.map((a) => (
                  <div key={a.id} className="flex gap-2">
                    <input
                      value={a.value}
                      onChange={(e) => updateActivity(a.id, e.target.value)}
                      placeholder="예: UX 동아리"
                      className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-[#5B9BD5]"
                    />
                    {activities.length > 1 && (
                      <button onClick={() => removeActivity(a.id)} className="text-gray-300 hover:text-red-400 text-sm">✕</button>
                    )}
                  </div>
                ))}
                <p className="text-xs text-gray-400 mt-1">이런 활동을 찾는 거야? 관련하는 것들을 관련하세요</p>
              </div>
            </div>
          </div>

          {/* Right column */}
          <div className="space-y-4">
            {/* 프로젝트 */}
            <div className="bg-white rounded-2xl p-5 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-sm">🔧</span>
                  <h3 className="font-bold text-gray-800 text-sm">프로젝트</h3>
                </div>
                <button onClick={addProject} className="text-xs text-[#5B9BD5] hover:text-[#2E6DA4]">+ 프로젝트추가</button>
              </div>
              <div className="space-y-3">
                {projects.map((p) => (
                  <div key={p.id} className="border border-gray-100 rounded-xl p-3 space-y-2">
                    <div className="flex gap-2">
                      <input
                        value={p.name}
                        onChange={(e) => updateProject(p.id, 'name', e.target.value)}
                        placeholder="예: AI기반 취업 포부이 앱 개발"
                        className="flex-1 border border-gray-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:border-[#5B9BD5]"
                      />
                      {projects.length > 1 && (
                        <button onClick={() => removeProject(p.id)} className="text-gray-300 hover:text-red-400 text-sm">✕</button>
                      )}
                    </div>
                    <input
                      value={p.desc}
                      onChange={(e) => updateProject(p.id, 'desc', e.target.value)}
                      placeholder="역할과 결과를 간략하게요"
                      className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:border-[#5B9BD5]"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* 보유 스킬 */}
            <div className="bg-white rounded-2xl p-5 shadow-sm">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-sm">💡</span>
                <h3 className="font-bold text-gray-800 text-sm">보유 스킬</h3>
                <span className="text-xs text-gray-400 ml-auto">스킬 입력 후 Enter</span>
              </div>
              <div className="flex flex-wrap gap-2 mb-2 min-h-8">
                {skills.map((s) => (
                  <span key={s} className="bg-[#D6E9F8] text-[#2E6DA4] text-xs px-2 py-1 rounded-full flex items-center gap-1">
                    {s}
                    <button onClick={() => removeSkill(s)} className="text-[#5B9BD5] hover:text-red-400">✕</button>
                  </span>
                ))}
              </div>
              <input
                value={skillInput}
                onChange={(e) => setSkillInput(e.target.value)}
                onKeyDown={addSkill}
                placeholder="스킬 입력 후 Enter"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-[#5B9BD5]"
              />
            </div>

            {/* 관심 직무 */}
            <div className="bg-white rounded-2xl p-5 shadow-sm">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-sm">🎯</span>
                <h3 className="font-bold text-gray-800 text-sm">관심 직무</h3>
                <button className="text-xs text-[#5B9BD5] ml-auto">+ 관심직무 추가</button>
              </div>
              <div className="flex flex-wrap gap-2">
                {JOB_OPTIONS.map((job) => (
                  <button
                    key={job}
                    onClick={() => toggleInterest(job)}
                    className={`px-3 py-1.5 rounded-lg text-xs border transition-colors ${
                      interests.includes(job)
                        ? 'bg-[#5B9BD5] text-white border-[#5B9BD5]'
                        : 'bg-white text-gray-600 border-gray-200 hover:border-[#5B9BD5]'
                    }`}
                  >
                    {job}
                  </button>
                ))}
              </div>
              <p className="text-xs text-gray-400 mt-2">예: 마케팅, 기획, 개발, 디자인</p>
            </div>
          </div>
        </div>

        {/* Bottom action */}
        <div className="flex items-center justify-between mt-6">
          <div className="text-sm text-gray-400">1 / 2 단계</div>
          <button
            onClick={handleAnalyze}
            disabled={analyzing || parsing}
            className="bg-[#5B9BD5] hover:bg-[#2E6DA4] disabled:bg-gray-300 text-white px-8 py-2.5 rounded-lg font-semibold text-sm transition-colors shadow-sm flex items-center gap-2"
          >
            {analyzing ? (
              <>
                <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                AI 분석 중...
              </>
            ) : 'AI분석 시작하기'}
          </button>
        </div>
      </div>
    </div>
  )
}
