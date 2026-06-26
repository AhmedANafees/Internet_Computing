import '../LoginPage/LoginForm.css'
import placeholder from '../../assets/Rectangle.png'
import { useState } from 'react'


export default function LoginForm() {
    const [inputs, setInputs] = useState({
        email: '',
        password: ''
    });
    function handleChange(e) {
        const name = e.target.name;
        const value = e.target.value;
        setInputs(values => ({ ...values, [name]: value }))
    }
    async function handleSubmit(e) {
        e.preventDefault();
        try{
        const response = await fetch("http://localhost:3000/api/auth/login", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                email: inputs.email,
                password: inputs.password
            })
        })

        if (response.ok) {
            data = JSON.parse(response.json()).data;
            localStorage.setItem("token", data.token);
        }
        else {
            alert("Invalid Email or Password. Please Try Again.")
        }
    }
    catch {
        alert("Something Went Wrong. Try Again Later.")
    }
    }

    return (<div id='login-container'>

        <div id='login-form'>
            <form>
                <fieldset>
                    <legend>
                        Welcome to Registration<br />
                        Please enter your school credentials
                    </legend>
                    <label htmlFor="f-email">
                        School Email
                    </label>
                    <input type="text"
                        id="f-email"
                        name="email"
                        value={inputs.email}
                        onChange={handleChange} />
                    <label htmlFor="f-password">
                        Password
                    </label>
                    <input
                        type="password"
                        id="f-password"
                        name="password"
                        value={inputs.password}
                        onChange={handleChange} />
                    <a href="">Forgot my password</a>
                    <div id="button-row">
                        <button type="submit" id="login-student" onClick={handleSubmit}>Sign In As Student</button>
                        <button type="submit" id="login-admin">Sign In As Admin</button>
                    </div>
                </fieldset>
            </form>
            <img id="login-image" src={placeholder} />
        </div>
    </div>
    );
}