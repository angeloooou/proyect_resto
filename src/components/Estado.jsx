import React, { Component } from "react";
import axios from "axios";
import styled from "styled-components";
import { format } from "date-fns";
import { FaCheckCircle, FaTools, FaClipboardList, FaExclamationCircle } from "react-icons/fa";

// Estilo personalizado para el título
const Titulo = styled.h1`
  color: blue;
  font-size: 2.5rem;
  font-weight: bold;
  margin-bottom: 20px;
`;

// Estilo para el contenedor principal
const Contenedor = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
  padding: 20px;
  height: 90vh;
  margin-top: 40px;
`;

// Contenedor del mensaje
const MensajeContenedor = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  margin-top: 20px;
  padding: 20px;
  border-radius: 10px;
  width: 100%;
  max-width: 500px;
  background-color: ${({ estado }) =>
    estado === "Listo"
      ? "#d4edda"
      : estado === "En Reparación"
      ? "#fff3cd"
      : estado === "En Presupuesto"
      ? "#d1ecf1"
      : "#f8d7da"};
  color: ${({ estado }) =>
    estado === "Listo"
      ? "#155724"
      : estado === "En Reparación"
      ? "#856404"
      : estado === "En Presupuesto"
      ? "#0c5460"
      : "#721c24"};
  border: 1px solid
    ${({ estado }) =>
      estado === "Listo"
        ? "#c3e6cb"
        : estado === "En Reparación"
        ? "#ffeeba"
        : estado === "En Presupuesto"
        ? "#bee5eb"
        : "#f5c6cb"};
`;

// Contenedor del ícono
const IconoEstado = styled.div`
  font-size: 3rem;
  margin-bottom: 10px;
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
`;

// Texto destacado del estado
const EstadoTitulo = styled.h2`
  font-size: 1.5rem;
  font-weight: bold;
  margin-bottom: 10px;
`;

class ClockStatus extends Component {
  constructor(props) {
    super(props);
    this.state = {
      searchValue: "", // Valor ingresado por el usuario
      resultado: null, // Resultado detallado del backend
      estado: "", // Estado del reloj (para definir el color y contenido)
      errorMessage: "", // Mensaje de error para estados no encontrados
    };
  }

  // Actualizar el estado con el valor ingresado por el usuario
  handleSearchChange = (event) => {
    this.setState({ searchValue: event.target.value });
  };

  // Manejar la búsqueda del estado del reloj
  handleSearchSubmit = async (event) => {
    event.preventDefault();
    const { searchValue } = this.state;
    const trimmedValue = searchValue.trim(); // Quitar espacios adicionales

    // Validar que el campo no esté vacío
    if (!trimmedValue) {
      this.setState({
        resultado: null,
        estado: "Error",
        errorMessage: "Por favor, ingresa un número de orden válido.",
      });
      return;
    }

    try {
      // Hacer la solicitud al backend
      const response = await axios.get(
        `http://localhost:3001/gen/estado/${trimmedValue}`
      );

      if (!response.data) {
        // Si no se encuentra el estado
        this.setState({
          resultado: null,
          estado: "Error",
          errorMessage: "No se encontró un estado para el número de orden proporcionado.",
        });
      } else {
        const resultado = response.data;

        this.setState({
          resultado,
          estado: resultado.Estado, // Utilizar el estado del backend
          errorMessage: "",
        });
      }
    } catch (error) {
      // Manejo de errores
      this.setState({
        resultado: null,
        estado: "Error",
        errorMessage: "Hubo un error al buscar el estado Posiblemente Aun no existe. Inténtalo nuevamente.",
      });
    }
  };

  render() {
    const { searchValue, resultado, estado, errorMessage } = this.state;

    // Determinar el ícono según el estado
    const icono =
      estado === "Listo" ? (
        <FaCheckCircle color="green" />
      ) : estado === "En Reparación" ? (
        <FaTools color="orange" />
      ) : estado === "En Presupuesto" ? (
        <FaClipboardList color="deepskyblue" />
      ) : (
        <FaExclamationCircle color="red" />
      );

    // Formato del mensaje para "En Presupuesto"
    const generarMensaje = (resultado) => {
      if (resultado.Estado === "En Reparación") {
        return (
          <>
            Bienvenido Estimado/a <strong>{resultado.NombreCliente}</strong>. <br /><br/>
            Nos complace informarle que su reloj ha sido ingresado a nuestro sistema el día{" "}
            <strong>{format(new Date(resultado.FechaIngreso), "dd/MM/yyyy")}</strong>. Un relojero especializado ha sido asignado para realizar el diagnóstico y las reparaciones necesarias. <br />
            El estado actual de su reloj es el siguiente: <strong>{resultado.Observaciones || "Sin observaciones"}</strong>. <br />
            Por lo tanto, se llevarán a cabo las siguientes reparaciones y/o ajustes:{" "}
            <strong>{resultado.Detalles || "Sin detalles"}</strong>. <br />Su reloj ha sido asignado al siguiente relojero: <strong>{resultado.NombreRelojero || "Relojero no Asignado"}</strong>. <br />
            Según nuestra estimación, su reloj estará listo para su entrega el día{" "}
            <strong>{resultado.FechaEntrega ? format(new Date(resultado.FechaEntrega), "dd/MM/yyyy") : "Por definir"}</strong>. <br /><br />
            Le agradecemos su confianza y preferencia. Estamos comprometidos con brindarle el mejor servicio posible. <br /><br />
            Atentamente, <br />
            <strong>HMGENEVE</strong>
          </>
        );
      } else if (resultado.Estado === "En Presupuesto") {
        return (
          <>
            Bienvenido Estimado/a <strong>{resultado.NombreCliente}</strong>. <br /><br/>
            Nos complace informarle que su reloj ha sido ingresado a nuestro sistema el día{" "}
            <strong>{format(new Date(resultado.FechaIngreso), "dd/MM/yyyy")}</strong>. Un relojero especializado ha sido asignado para realizar el diagnóstico y las reparaciones necesarias. <br />
            El estado actual de su reloj es el siguiente: <strong>{resultado.Observaciones || "Sin observaciones"}</strong>. <br />
            Se llevarán a cabo las siguientes reparaciones y/o ajustes:{" "}
            <strong>{resultado.Detalles || "Sin detalles"}</strong>.
            Según nuestra estimación, su reloj estará listo para su entrega el día{" "}
            <strong>{resultado.FechaEntrega ? format(new Date(resultado.FechaEntrega), "dd/MM/yyyy") : "Por definir"}</strong>. <br /><br/>
            Le agradecemos su confianza y preferencia. Estamos comprometidos con brindarle el mejor servicio posible. <br />
            <br />
            Atentamente, <strong>HMGENEVE</strong>
          </>
        );
      } else if (resultado.Estado === "Listo") {
        return (
          <>
            Bienvenido Estimado/a <strong>{resultado.NombreCliente}</strong>. <br /><br/>
            Nos complace informarle que su reloj está listo para ser retirado. Fue ingresado a nuestro sistema el día{" "}
            <strong>{format(new Date(resultado.FechaIngreso), "dd/MM/yyyy")}</strong> y todas las reparaciones necesarias se han completado con éxito. <br /><br />
            Puede pasar a retirarlo en nuestras oficinas a partir del día{" "}
            <strong>{resultado.FechaEntrega ? format(new Date(resultado.FechaEntrega), "dd/MM/yyyy") : "Hoy"}</strong>. <br /><br />
            Muchas gracias por confiar en HMGENEVE para el cuidado de su reloj. <br /><br />
            Atentamente, <br />
            <strong>HMGENEVE</strong>
          </>
        );
      } else {
        return (
          <>
            El estado de su reloj no está definido en nuestro sistema. Por favor, póngase en contacto con nuestro equipo para más detalles. <br /><br />
            Muchas gracias por su comprensión. <br /><br />
            Atentamente, <br />
            <strong>HMGENEVE</strong>
          </>
        );
      }
    };

    return (
      <Contenedor>
        <Titulo>Consulte el Estado de los Relojes</Titulo>
        <p className="text-muted text-center mb-4">
          Ingresa el número de orden para consultar el estado de su reloj.
        </p>
        <form
          onSubmit={this.handleSearchSubmit}
          style={{ width: "100%", maxWidth: "400px" }}
        >
          <div className="input-group mb-3">
            <input
              id="searchValue"
              type="text"
              className="form-control"
              placeholder="Número de orden"
              value={searchValue}
              onChange={this.handleSearchChange}
            />
            <button
              type="submit"
              className="btn btn-primary"
              style={{ minWidth: "120px" }}
            >
              Buscar
            </button>
          </div>
        </form>
        {/* Mostrar error */}
        {errorMessage && (
          <MensajeContenedor estado="Error">
            <IconoEstado>
              <FaExclamationCircle color="red" />
            </IconoEstado>
            <EstadoTitulo>Error</EstadoTitulo>
            <p>{errorMessage}</p>
          </MensajeContenedor>
        )}
        {/* Mostrar resultado si se encuentra */}
        {resultado && (
          <MensajeContenedor estado={estado}>
            <IconoEstado>{icono}</IconoEstado>
            <EstadoTitulo>{estado}</EstadoTitulo>
            <p>{generarMensaje(resultado)}</p>
          </MensajeContenedor>
        )}
      </Contenedor>
    );
  }
}

export default ClockStatus;
