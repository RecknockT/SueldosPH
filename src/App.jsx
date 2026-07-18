import { BrowserRouter, Routes, Route } from 'react-router-dom'

import Home from './pages/Home'
import Login from './pages/Login'
import Sueldos from './pages/Sueldos'

function App() {

  return (

    <BrowserRouter>

      <Routes>

        <Route path="/" element={<Home />} />

        <Route path="/login" element={<Login />} />

        <Route path="/sueldos" element={<Sueldos />} />

      </Routes>

    </BrowserRouter>

  )

}


export default App