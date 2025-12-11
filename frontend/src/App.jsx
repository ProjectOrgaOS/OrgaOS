import { useState, useEffect } from 'react'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'

function App() {
  const [page, setPage] = useState('login')
  const [isLoggedIn, setIsLoggedIn] = useState(false)

  // Check if user is logged in on app load
  useEffect(() => {
    const token = localStorage.getItem('token')
    if (token) {
      setIsLoggedIn(true)
    }
  }, [])

  // Called after successful login
  const handleLoginSuccess = () => {
    setIsLoggedIn(true)
  }

  // Called when user logs out
  const handleLogout = () => {
    setIsLoggedIn(false)
    setPage('login')
  }

  // Show Dashboard if logged in
  if (isLoggedIn) {
    return <Dashboard onLogout={handleLogout} />
  }

  // Show Login/Register if not logged in
  return (
    <div>
      {page === 'login' ? (
        <Login onSuccess={handleLoginSuccess} />
      ) : (
        <Register onSuccess={() => setPage('login')} />
      )}

      {/* Toggle button */}
      <div className="text-center mt-4">
        {page === 'login' ? (
          <p className="text-gray-600">
            No account?{' '}
            <button
              onClick={() => setPage('register')}
              className="text-blue-500 hover:underline"
            >
              Register here
            </button>
          </p>
        ) : (
          <p className="text-gray-600">
            Already have an account?{' '}
            <button
              onClick={() => setPage('login')}
              className="text-blue-500 hover:underline"
            >
              Login here
            </button>
          </p>
        )}
      </div>
    </div>
  )
}

export default App
