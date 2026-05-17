import { BrowserRouter, Routes, Route } from 'react-router-dom'
import MainPage from './pages/MainPage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import ResumeInputPage from './pages/ResumeInputPage'
import AnalysisResultPage from './pages/AnalysisResultPage'
import CoverLetterCoachPage from './pages/CoverLetterCoachPage'
import MyPage from './pages/MyPage'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<MainPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/resume" element={<ResumeInputPage />} />
        <Route path="/result" element={<AnalysisResultPage />} />
        <Route path="/coach" element={<CoverLetterCoachPage />} />
        <Route path="/mypage" element={<MyPage />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
