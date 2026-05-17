import { Link, useNavigate } from 'react-router-dom'

export default function Header() {
  const navigate = useNavigate()
  const isLoggedIn = !!localStorage.getItem('lenz_user')

  const handleLogout = () => {
    localStorage.removeItem('lenz_user')
    navigate('/')
  }

  return (
    <header className="w-full bg-white border-b border-gray-200 px-8 py-4 flex items-center justify-between sticky top-0 z-50">
      <Link to="/" className="text-2xl font-bold text-[#2E6DA4] tracking-wide">
        Lenz
      </Link>
      <nav className="flex items-center gap-8 text-sm font-medium text-gray-700">
        <Link to="/" className="hover:text-[#2E6DA4] transition-colors">소개</Link>
        <Link to="/resume" className="hover:text-[#2E6DA4] transition-colors">시작</Link>
        {isLoggedIn ? (
          <>
            <Link to="/mypage" className="hover:text-[#2E6DA4] transition-colors">마이페이지</Link>
            <button
              onClick={handleLogout}
              className="text-gray-500 hover:text-[#2E6DA4] transition-colors"
            >
              로그아웃
            </button>
          </>
        ) : (
          <Link to="/mypage" className="hover:text-[#2E6DA4] transition-colors">마이페이지</Link>
        )}
      </nav>
    </header>
  )
}
