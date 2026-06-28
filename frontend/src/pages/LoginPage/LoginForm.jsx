import '../LoginPage/LoginForm.css'
import placeholder from '../../assets/Rectangle.png'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

function normalizeApiBase(rawValue) {
  const trimmed = String(rawValue || '').trim().replace(/\/$/, '')
  if (!trimmed) return ''
  return trimmed.replace(/\/api$/i, '')
}

function normalizeUser(user) {
  if (!user || typeof user !== 'object') return null
  return {
    accountId: user.accountId ?? user.account_id ?? null,
    email: user.email ?? '',
    firstName: user.firstName ?? user.first_name ?? '',
    lastName: user.lastName ?? user.last_name ?? '',
    role: user.role ?? '',
    studentId: user.studentId ?? user.student_id ?? null,
    adminId: user.adminId ?? user.admin_id ?? null,
  }
}

export default function LoginForm() {
  const navigate = useNavigate()
  const configuredApiBase = normalizeApiBase(import.meta.env.VITE_API_BASE_URL)
  const [inputs, setInputs] = useState({
    email: '',
    password: ''
  })

  function candidateApiBases() {
    const candidates = [
      configuredApiBase,
      'http://localhost:3001',
    ].filter(Boolean)
    return [...new Set(candidates)]
  }

  function handleChange(event) {
    const { name, value } = event.target
    setInputs((values) => ({ ...values, [name]: value }))
  }

  async function handleSubmit(event) {
    event.preventDefault()

    try {
      let response = null
      for (const base of candidateApiBases()) {
        try {
          response = await fetch(`${base}/api/auth/login`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              email: inputs.email,
              password: inputs.password
            })
          })
          if (response.ok || response.status === 401 || response.status === 403) {
            break
          }
        } catch {
          response = null
        }
      }

      if (!response) {
        throw new Error('Unable to reach the login server.')
      }

      if (!response.ok) {
        alert('Invalid Email or Password. Please Try Again.')
        return
      }

      const payload = await response.json()
      const authData = payload.data || payload
      if (authData.token) {
        localStorage.setItem('token', authData.token)
      }
      const normalizedUser = normalizeUser(authData.user)
      if (normalizedUser) {
        localStorage.setItem('currentUser', JSON.stringify(normalizedUser))
      }
      navigate('/dashboard')
    } catch (error) {
      alert('Something Went Wrong. Try Again Later.')
      console.error(error)
    }
  }

  return (
    <div id='login-container'>
      <div id='login-form'>
        <form onSubmit={handleSubmit}>
          <fieldset>
            <legend>
              Welcome to Registration
              <br />
              Please enter your school credentials
            </legend>
            <label htmlFor='f-email'>School Email</label>
            <input
              type='text'
              id='f-email'
              name='email'
              value={inputs.email}
              onChange={handleChange}
            />
            <label htmlFor='f-password'>Password</label>
            <input
              type='password'
              id='f-password'
              name='password'
              value={inputs.password}
              onChange={handleChange}
            />
            <a href=''>Forgot my password</a>
            <div id='button-row'>
              <button type='submit' id='login-student'>Sign In As Student</button>
              <button type='button' id='login-admin'>Sign In As Admin</button>
            </div>
          </fieldset>
        </form>
        <img id='login-image' src={placeholder} />
      </div>
    </div>
  )
}