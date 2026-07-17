import { BrowserRouter, Routes, Route } from 'react-router-dom'

import Login from './pages/Login'
import Sueldos from './pages/Sueldos'


function App() {

  return (

    <BrowserRouter>

      <Routes>

        <Route path="/" element={<Login />} />

        <Route path="/sueldos" element={<Sueldos />} />

      </Routes>

    </BrowserRouter>

  )

}


export default App