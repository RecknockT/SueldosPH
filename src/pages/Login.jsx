import { useState, useEffect } from 'react'
import { supabase } from '../services/supabase'
import { useNavigate } from 'react-router-dom'
import "../styles/Login.css";

function Login() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [mensaje, setMensaje] = useState('')
  const [recordarme, setRecordarme] = useState(false)
  useEffect(() => {

  const emailGuardado = localStorage.getItem("emailRecordado");

  if (emailGuardado) {

    setEmail(emailGuardado);

    setRecordarme(true);

  }

}, []);

  async function ingresar() {

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password
    })

    if (error) {
  setMensaje('Usuario o contraseña incorrectos')
  return
}
if (recordarme) {

  localStorage.setItem("emailRecordado", email);

} else {

  localStorage.removeItem("emailRecordado");

}
navigate('/sueldos')
  }


  return (
    <div className="login-container">

      <div className="login-box">
        <div className="logo-login">

  

</div>
        <h1>SueldosPH</h1>

        <p className="subtitulo-login">
  Liquidación Profesional para Propiedad Horizontal
</p>
<div className="linea-login"></div>

       <div className="input-group">

  <label>Correo electrónico</label>

  <input
    type="email"
    placeholder="nombre@empresa.com"
    value={email}
    onChange={(e) => setEmail(e.target.value)}
  />

</div>


        <div className="input-group">

  <label>Contraseña</label>

  <input
    type="password"
    placeholder="••••••••"
    value={password}
    onChange={(e) => setPassword(e.target.value)}
  />

</div>

<div className="login-opciones">

  <label className="recordarme">

    <input
  type="checkbox"
  checked={recordarme}
  onChange={(e) => setRecordarme(e.target.checked)}
/>

    Recordarme

  </label>

  <a href="#" onClick={(e) => e.preventDefault()}>
    ¿Olvidaste tu contraseña?
  </a>

</div>

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