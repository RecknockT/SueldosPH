import { useState } from 'react'
import { supabase } from '../services/supabase'
import { useNavigate } from 'react-router-dom'

function Login() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [mensaje, setMensaje] = useState('')

  async function ingresar() {

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password
    })

    if (error) {
  setMensaje('Usuario o contraseña incorrectos')
  return
}

navigate('/sueldos')
  }


  return (
    <div className="login-container">

      <div className="login-box">

        <h1>SueldosPH</h1>

        <p>Sistema de liquidación de sueldos</p>


        <label>Usuario</label>
        <input
          type="email"
          placeholder="Ingrese usuario"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />


        <label>Contraseña</label>
        <input
          type="password"
          placeholder="Ingrese contraseña"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />


        <button onClick={ingresar}>
          Ingresar
        </button>


        {mensaje && (
          <p>{mensaje}</p>
        )}

      </div>

    </div>
  )
}

export default Login