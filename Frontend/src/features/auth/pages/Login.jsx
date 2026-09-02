import {useState} from 'react'
import {useNavigate, Link} from 'react-router'
import '../auth.form.scss'
import { useAuth } from '../hooks/useAuth.js'

const Login = () => {
  const { loading,handleLogin } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault();
    const success = await handleLogin(email, password)
    if (success) navigate('/')
} 
  if (loading) {
    return (<main><h1>Loading....</h1></main>)
  }
  return (
   <main> 
    <div className="form-container">
      <h1>Login</h1>
      <form onSubmit={handleSubmit}> 
       <div className="input-group">
        <label htmlFor="email">Email</label>
        <input 
        onChange={(e) =>{ setEmail(e.target.value)}}
        type="email" id="email" name="email" placeholder="Enter your email" />
        </div> 
        <div className="input-group">
  <label htmlFor="password">Password</label>

  <div className="password-wrapper">
    <input
      onChange={(e) => setPassword(e.target.value)}
      type={showPassword ? "text" : "password"}
      id="password"
      name="password"
      placeholder="Enter your password"
    />

    <button
      type="button"
      className="password-toggle"
      onClick={() => setShowPassword(!showPassword)}
      aria-label={showPassword ? "Hide password" : "Show password"}
    >
      {showPassword ? (
        // eye-off
        <svg viewBox="0 0 24 24" width="20" height="20" fill="none">
          <path
            d="M3 3l18 18M10.6 10.6a2 2 0 002.8 2.8M9.9 4.2A10.5 10.5 0 0112 4c5 0 9 4 10 8a11 11 0 01-2.3 4.2M6.2 6.2C4.2 7.6 2.7 9.6 2 12c1 4 5 8 10 8 1.7 0 3.3-.5 4.7-1.2"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      ) : (
        // eye
        <svg viewBox="0 0 24 24" width="20" height="20" fill="none">
          <path
            d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"
            stroke="currentColor"
            strokeWidth="2"
          />
          <circle
            cx="12"
            cy="12"
            r="3"
            stroke="currentColor"
            strokeWidth="2"
          />
        </svg>
      )}
    </button>
  </div>
</div>
        <button className="button primary-button">Login</button>
      </form>
      <p>Don't have an account? <Link to={"/register"}>Register</Link></p>
    </div>
   </main>
  )
}

export default Login