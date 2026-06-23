import '../LoginPage/LoginForm.css'
import placeholder from '../../assets/Rectangle.png'
export default function LoginForm(){
    return ( <div id='login-container'>
    
        <div id='login-form'>
            <form>
                <fieldset>
                    <legend>
                        Welcome to Registration<br/>
                        Please enter your school credentials
                    </legend>
                    <label htmlFor="f-email"> 
                        School Email
                    </label>
                    <input type="text" id="f-email"/>
                    <label htmlFor="f-password"> 
                        Password
                    </label>
                    <input type="password" id="f-password"/>
                    <a href="">Forgot my password</a>
                    <div id = "button-row">
                    <button type="submit" id="login-student">Sign In As Student</button>
                    <button type="submit" id="login-admin">Sign In As Admin</button>
                    </div>
                </fieldset>
            </form>
            <img id="login-image" src={placeholder}/>
        </div>
    </div>
    );
}