import { useState } from 'react'
import Login from './pages/Login'
import Register from './pages/Register'

function App() {
  const [page, setPage] = useState('login')

  return (
    <div>
      {page === 'login' ? <Login /> : <Register />}

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
