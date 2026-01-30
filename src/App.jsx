import { Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout'
import Home from './pages/Home'
import ContestView from './pages/ContestView'
import CompetitionsList from './pages/CompetitionsList'
import UniversitiesList from './pages/UniversitiesList'
import UniversityPage from './pages/UniversityPage'
import AdminLogin from './pages/AdminLogin'
import AdminContests from './pages/AdminContests'
import AdminUniversities from './pages/AdminUniversities'
import AdminLayout from './components/AdminLayout'
import './App.css'

function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="competitions" element={<CompetitionsList />} />
        <Route path="competition/:year" element={<ContestView />} />
        <Route path="universities" element={<UniversitiesList />} />
        <Route path="university/:slug" element={<UniversityPage />} />
      </Route>
      <Route path="/admin" element={<AdminLayout />}>
        <Route index element={<AdminLogin />} />
        <Route path="competitions" element={<AdminContests />} />
        <Route path="universities" element={<AdminUniversities />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App
