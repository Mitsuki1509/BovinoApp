import { useState } from 'react'
import './App.css'
import './fonts/fonts.css'
function App() {
  const [count, setCount] = useState(0)

  return (
    <>
   
    <div className="login-container">
      <div className="logo">
        <h1>Agrícola <b>San Pablo S.A.</b></h1>
      </div>
      
      <div className="login-inputs">
        <label htmlFor="email">Email</label>
        <input type="email" placeholder="email@ejemplo.com" id="email"/>
      
        <label htmlFor="password">Contraseña</label>
        <input type="password" placeholder="contraseña" id="password"/>
      
        <label className="checkbox">
          <input type="checkbox" name="save_password"/>
          Guardar contraseña
        </label>
        
        <button className="restore">
          ¿Olvidó su contraseña?
        </button>
        
        <button className="login">
          Iniciar sesión
        </button> 
      </div>
      </div>
      
    </>
  )
}

export default App