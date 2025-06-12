import React from 'react'
import LoginForm from '../components/Login.jsx'
import "../styles/LoginPage.css";

const InicioSesion = () => {
  return (
    <div className='bodyLogin'>
     <div className="custom-container">
      <LoginForm/>

     </div>
    </div>
  )
}

export default InicioSesion