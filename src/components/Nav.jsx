/* eslint-disable jsx-a11y/alt-text */
import React from "react";
import { Link, Outlet } from "react-router-dom";
import imagenes from "../assets/img/imagenes";

const Nav = () => {
  return (
    <div>
      <nav className="navbar navbar-expand-lg navbar-dark bg-dark shadow-sm">
        <div className="container-fluid">
          {/* Logo a la izquierda */}
          <Link to="/" className="navbar-brand d-flex align-items-center">
            <img
              src={imagenes.img2}
              className="img-fluid"
              style={{ maxWidth: "60px", maxHeight: "60px", marginRight: "10px" }}
            />
            <span className="fs-4 fw-bold text-uppercase">Relojería HM Geneve</span>
          </Link>

          {/* Botón del menú desplegable para móviles */}
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
          <div className="collapse navbar-collapse" id="navbarNav">
            <ul className="navbar-nav ms-auto">
              <li className="nav-item dropdown">
                <button
                  className="btn btn-outline-light dropdown-toggle"
                  type="button"
                  id="dropdownMenuButton"
                  data-bs-toggle="dropdown"
                  aria-expanded="false"
                >
                  ¡Hola! Inicia Sesión o Regístrate
                </button>
                <ul
                  className="dropdown-menu dropdown-menu-end p-4"
                  aria-labelledby="dropdownMenuButton"
                  style={{
                    width: "300px",
                    borderRadius: "10px",
                    boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
                  }}
                >
                  <li>
                    <Link
                      to="/Login"
                      className="btn btn-primary w-100 mb-3"
                    >
                      Iniciar sesión
                    </Link>
                  </li>
                  <li>
                    <span>
                      ¿No tienes cuenta?{" "}
                      <Link to="/Registro" className="text-decoration-none">
                        Regístrate
                      </Link>
                    </span>
                  </li>
                  <hr />
                </ul>
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

export default Nav;
