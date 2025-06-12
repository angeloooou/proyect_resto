import React from "react";
import { Link, Outlet } from "react-router-dom";
import imagenes from "../assets/img/imagenes";

const Nav2 = () => {
  return (
    <div>
      <nav className="navbar navbar-expand-lg navbar-dark bg-dark shadow-sm">
        <div className="container">
          {/* Logo a la izquierda */}
          <Link to="/" className="navbar-brand d-flex align-items-center">
            <img
              src={imagenes.img2}
              alt="Logo Restaurante Enacción"
              className="img-fluid"
              style={{ maxWidth: "50px", maxHeight: "50px", marginRight: "10px" }}
            />
            <span className="fs-5 fw-bold text-uppercase">Restaurante Enacción</span>
          </Link>

          {/* Botón de colapsar para móviles */}
          <button
            className="navbar-toggler"
            type="button"
            data-bs-toggle="collapse"
            data-bs-target="#navbarNav"
            aria-controls="navbarNav"
            aria-expanded="false"
            aria-label="Toggle navigation"
          >
            <span className="navbar-toggler-icon"></span>
          </button>

          {/* Contenido del menú */}
          <div className="collapse navbar-collapse justify-content-end" id="navbarNav">
            <ul className="navbar-nav">
              <li className="nav-item">
                <Link to="/" className="nav-link">Menú</Link>
              </li>
              <li className="nav-item">
                <Link to="/Comanda" className="nav-link">Comandas</Link>
              </li>
              <li className="nav-item">
                <Link to="/ListaComanda" className="nav-link">Lista Comandas</Link>
              </li>
              <li className="nav-item">
                <Link to="/Comanda2" className="nav-link">Registro Comanda</Link>
              </li>
              <li className="nav-item">
                <Link to="/RegistroPersonas" className="nav-link">Registro Empleados</Link>
              </li>
              <li className="nav-item">
                <Link to="/Reportes" className="nav-link">Reportes</Link>
              </li>
            </ul>
          </div>
        </div>
      </nav>

      {/* Contenido principal */}
      <div className="container mt-4">
        <Outlet />
      </div>
    </div>
  );
};

export default Nav2;
