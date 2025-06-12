import React from "react";
import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import imagenes from "../assets/img/imagenes";

const LoginForm = () => {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();
  const navigate = useNavigate();

  const onSubmit = async (data) => {
    try {
      const response = await axios.post("http://localhost:3001/gen/login", {
        Correo: data.Correo,
        HashContrasena: data.HashContrasena,
      });
      if (response.data.message === "Inicio de sesión exitoso") {
        const { IDRol } = response.data;
        localStorage.setItem("userRole", IDRol);
        navigate(IDRol === "Administrador" ? "/admin-dashboard" : "/Catalogo");
      }
    } catch (error) {
      console.error("Error al iniciar sesión:", error);
    }
  };

  return (
    <div
      className="container d-flex justify-content-center align-items-center vh-100"
      style={{
        background: "linear-gradient(to right, #243B55, #141E30)",
      }}
    >
      <div
        className="card shadow-lg border-0"
        style={{
          maxWidth: "900px",
          width: "100%",
          borderRadius: "15px",
          overflow: "hidden",
        }}
      >
        <div className="row g-0">
          {/* Imagen lateral */}
          <div
            className="col-lg-6 d-none d-lg-flex align-items-center justify-content-center"
            style={{
              backgroundImage: `url(${imagenes.img2})`,
              backgroundSize: "contain",
              backgroundRepeat: "no-repeat",
              backgroundPosition: "center",
              height: "400px",
            }}
          ></div>

          {/* Formulario */}
          <div className="col-lg-6 bg-white p-5">
            <div className="text-center mb-4">
              <Link to="/">
                <img
                  src={imagenes.img2}
                  alt="Logo"
                  className="mb-3"
                  style={{ width: "80px" }}
                />
              </Link>
              <h3 className="fw-bold text-primary">Iniciar Sesión</h3>
              <p className="text-muted">
                Bienvenido de nuevo, por favor inicia sesión
              </p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)}>
              <div className="form-group mb-3">
                <label htmlFor="Correo" className="form-label">
                  Correo Electrónico
                </label>
                <input
                  type="email"
                  className={`form-control ${
                    errors.Correo ? "is-invalid" : ""
                  }`}
                  {...register("Correo", {
                    required: "El correo es obligatorio",
                    pattern: {
                      value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                      message: "Correo no válido",
                    },
                  })}
                  placeholder="Ingresa tu correo"
                />
                {errors.Correo && (
                  <div className="invalid-feedback">{errors.Correo.message}</div>
                )}
              </div>

              <div className="form-group mb-3">
                <label htmlFor="HashContrasena" className="form-label">
                  Contraseña
                </label>
                <input
                  type="password"
                  className={`form-control ${
                    errors.HashContrasena ? "is-invalid" : ""
                  }`}
                  {...register("HashContrasena", {
                    required: "La contraseña es obligatoria",
                    minLength: {
                      value: 8,
                      message: "Debe tener al menos 8 caracteres",
                    },
                  })}
                  placeholder="Ingresa tu contraseña"
                />
                {errors.HashContrasena && (
                  <div className="invalid-feedback">
                    {errors.HashContrasena.message}
                  </div>
                )}
              </div>

              <div className="d-grid mb-3">
                <button type="submit" className="btn btn-primary btn-lg">
                  Iniciar Sesión
                </button>
              </div>

              <p className="text-center">
                ¿No tienes una cuenta?{" "}
                <Link to="/Registro" className="text-primary fw-bold">
                  Regístrate
                </Link>
              </p>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginForm;
