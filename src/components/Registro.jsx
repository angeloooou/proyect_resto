import bcrypt from "bcryptjs";
import { v4 as uuidv4 } from "uuid";
import axios from "axios";
import { useForm } from "react-hook-form";
import "../styles/Registro.css";
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";

const Formulario = () => {
  const [correo, setCorreo] = useState("");
  const navigate = useNavigate();

  const {
    register,
    formState: { errors },
    handleSubmit,
    reset,
    watch,
  } = useForm();

  const password = watch("password", "");

  const onSubmit = async (data) => {
    console.log("Form data:", data);

    if (data.confirmPassword !== data.password) {
      Swal.fire({
        title: "Error",
        text: "Las contraseñas no coinciden",
        icon: "error",
        confirmButtonText: "Aceptar",
      });
      return;
    }

    try {
      const hashedPassword = await bcrypt.hash(data.password, 10);

      const newIDPersona = {
        ...data,
        IDPersona: uuidv4(),
        HashContrasena: hashedPassword,
      };

      delete newIDPersona.password;
      delete newIDPersona.confirmPassword;

      const response = await axios.post(
        "http://localhost:3001/gen/personas",
        newIDPersona
      );

      if (response.status === 200) {
        Swal.fire({
          title: "Registro Exitoso",
          text: "El registro se ha completado satisfactoriamente.",
          icon: "success",
          confirmButtonText: "Aceptar",
        });

        reset();
        navigate("/Login");
      }
    } catch (error) {
      Swal.fire({
        title: "Error",
        text: "Hubo un problema al registrar los datos.",
        icon: "error",
        confirmButtonText: "Aceptar",
      });
      console.error(error);
    }
  };

  return (
    <div className="container mt-5">
      <div className="row justify-content-center">
        <div className="col-md-8 col-lg-6">
          <div className="card shadow border-0">
            <div className="card-header bg-primary text-white text-center py-3">
              <h4 className="mb-0">Registro de Usuarios</h4>
            </div>
            <div className="card-body px-5 py-4">
              <form
                onSubmit={handleSubmit(onSubmit)}
                className="needs-validation"
                noValidate
              >
                <div className="mb-3">
                  <label className="form-label">Nombre</label>
                  <input
                    type="text"
                    className={`form-control ${errors.Nombre ? "is-invalid" : ""}`}
                    {...register("Nombre", {
                      required: "El campo Nombre es obligatorio",
                      maxLength: {
                        value: 20,
                        message:
                          "El campo Nombre debe tener menos de 20 caracteres",
                      },
                    })}
                    placeholder="Ingrese un Nombre"
                  />
                  {errors.Nombre && (
                    <div className="invalid-feedback">{errors.Nombre.message}</div>
                  )}
                </div>

                <div className="mb-3">
                  <label className="form-label">Apellido</label>
                  <input
                    type="text"
                    className={`form-control ${errors.Apellido ? "is-invalid" : ""}`}
                    {...register("Apellido", {
                      required: "El campo Apellido es obligatorio",
                      maxLength: {
                        value: 20,
                        message:
                          "El campo Apellido debe tener menos de 20 caracteres",
                      },
                    })}
                    placeholder="Ingrese un Apellido"
                  />
                  {errors.Apellido && (
                    <div className="invalid-feedback">{errors.Apellido.message}</div>
                  )}
                </div>

                <div className="mb-3">
                  <label className="form-label">Teléfono</label>
                  <input
                    type="tel"
                    className={`form-control ${errors.NumeroTelefono ? "is-invalid" : ""}`}
                    onInput={(e) => {
                      e.target.value = e.target.value.replace(/[^0-9]/g, "");
                    }}
                    {...register("NumeroTelefono", {
                      required: "El campo Teléfono es obligatorio",
                      pattern: {
                        value: /^\d{9}$/,
                        message:
                          "El teléfono debe contener solo números y tener exactamente 9 dígitos",
                      },
                    })}
                    maxLength={9}
                    placeholder="Ingrese un Teléfono"
                  />
                  {errors.NumeroTelefono && (
                    <div className="invalid-feedback">
                      {errors.NumeroTelefono.message}
                    </div>
                  )}
                </div>

                <div className="mb-3">
                  <label className="form-label">Correo electrónico</label>
                  <input
                    type="email"
                    className={`form-control ${errors.Correo ? "is-invalid" : ""}`}
                    {...register("Correo", {
                      required: "El campo Correo electrónico es obligatorio",
                      pattern: {
                        value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                        message:
                          "El correo electrónico debe ser una dirección válida",
                      },
                    })}
                    placeholder="Ingrese un Correo"
                  />
                  {errors.Correo && (
                    <div className="invalid-feedback">{errors.Correo.message}</div>
                  )}
                </div>

                <div className="mb-3">
                  <label className="form-label">Contraseña</label>
                  <input
                    type="password"
                    className={`form-control ${errors.password ? "is-invalid" : ""}`}
                    {...register("password", {
                      required: "El campo Contraseña es obligatorio",
                      minLength: {
                        value: 8,
                        message:
                          "La contraseña debe tener al menos 8 caracteres",
                      },
                      maxLength: {
                        value: 20,
                        message:
                          "La contraseña debe tener menos de 20 caracteres",
                      },
                    })}
                    placeholder="Ingrese una Contraseña"
                  />
                  {errors.password && (
                    <div className="invalid-feedback">{errors.password.message}</div>
                  )}
                </div>

                <div className="mb-3">
                  <label className="form-label">Confirma contraseña</label>
                  <input
                    type="password"
                    className={`form-control ${errors.confirmPassword ? "is-invalid" : ""}`}
                    {...register("confirmPassword", {
                      required: "El campo Confirma contraseña es obligatorio",
                      validate: (value) =>
                        value === password || "Las contraseñas no coinciden",
                    })}
                    placeholder="Confirme su Contraseña"
                  />
                  {errors.confirmPassword && (
                    <div className="invalid-feedback">
                      {errors.confirmPassword.message}
                    </div>
                  )}
                </div>

                <div className="d-flex justify-content-center">
                  <button type="submit" className="btn btn-primary btn-lg mt-3">
                    Registrarse
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Formulario;
