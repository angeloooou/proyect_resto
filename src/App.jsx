import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Layout from "./pages/Layout";
import Registro from "./pages/Registro";
import Login from "./pages/Login.page";
import IngresoR from "./pages/IngresoR";
import Ventas from "./pages/Ventas";
import Footer from "./components/Footer";
import Formulario from "./pages/FormularioLive";
import Stats from "./pages/Stats";
import ProtectedRoute from "./ProtectedRoute";
import { UserProvider } from "./context/UserContext";
import "bootstrap/dist/css/bootstrap.min.css";
import Pago from "./components/Pago";
import Confirmacion from './pages/Confirmacion';
import Suscripcion from "./pages/Suscripcion";
import Comanda from "./pages/Comanda";
import Comanda2 from "./pages/Comanda2";
import ListaComanda from "./pages/ListaComanda";
import Reportes1 from "./pages/ReporteBI";



function App() {
  return (
    <UserProvider>
        <div>
          <Routes>
            <Route path="/Login" element={<Login />} />
            <Route path="/Comanda" element={<Comanda />} />
            <Route path="/Comanda2" element={<Comanda2 />} />
            <Route path="/Registro" element={<Registro />} />
            <Route path="/Presupuesto" element={<IngresoR />} />
            <Route path="/ListaComanda" element={<ListaComanda />} />
            <Route path="/" element={<Ventas />} />
            <Route path="/RegistroPersonas" element={<Formulario />} />
            <Route path="/Estado" element={<Stats />} />
            <Route path="/reportes" element={<Reportes1 />} />
            <Route path="/suscripcion" element={<Suscripcion />} />
            <Route path="/confirmacion" element={<Confirmacion />} />
          </Routes>
          <div className="footer">
            <Footer />
          </div>
        </div>
    </UserProvider>
  );
}

export default App;
