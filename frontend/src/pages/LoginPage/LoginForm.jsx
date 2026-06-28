import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import './LoginForm.css'

export default function LoginForm() {
  const navigate = useNavigate()
  const [inputs, setInputs] = useState({
    email: '',
    password: ''
  })

  function handleChange(e) {
    const { name, value } = e.target
    setInputs((values) => ({ ...values, [name]: value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()

    try {
      const response = await fetch('http://localhost:3000/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: inputs.email,
          password: inputs.password
        })
      })

      if (!response.ok) {
        alert('Invalid email or password. Please try again.')
        return
      }

      const data = await response.json()
      localStorage.setItem('token', data.token)
      navigate('/courses')
    } catch (err) {
      alert('Something went wrong. Try again later.')
      console.error(err)
    }
  }

  return (
    <div className='login-shell'>
      <div className='login-card'>
        <form className='login-form' onSubmit={handleSubmit}>
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
            <a href='#forgot-password'>Forgot my password</a>
            <div className='button-row'>
              <button type='submit' id='login-student'>Sign In As Student</button>
              <button type='button' id='login-admin'>Sign In As Admin</button>
            </div>
          </fieldset>
        </form>
        <div className='login-illustration' aria-hidden='true'>
          <div className='login-illustration__card'>
            <span>Alex frontend restored</span>
            <strong>Course registration</strong>
          </div>
        </div>
      </div>
    </div>
  )
}