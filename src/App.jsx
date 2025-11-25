import './App.css'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Dashboard from './pages/Dashboard'
import ApplicationsPage from './pages/ApplicationsPage'

function App() {
  return (
    <BrowserRouter>
      <div className="app-shell">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/applications" element={<ApplicationsPage />} />
        </Routes>
      </div>
    </BrowserRouter>
  )
}

export default App
