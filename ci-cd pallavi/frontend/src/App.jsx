import { Routes, Route, Navigate } from 'react-router-dom'
import Dashboard from './pages/Dashboard'

function App() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-200">
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="*" element={
          <div className="flex flex-col items-center justify-center min-h-screen">
            <h1 className="text-4xl font-bold">404</h1>
            <p className="text-slate-400">Page not found</p>
          </div>
        } />
      </Routes>
    </div>
  )
}

export default App
