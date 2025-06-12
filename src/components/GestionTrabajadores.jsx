import React, { useState, useEffect } from "react";
import Axios from "axios";
import Swal from "sweetalert2";

Axios.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error("Error de solicitud:", error.message);
    return Promise.reject(error);
  }
);

const GestionTrabajadores = () => {
  // Declaración de estados
  const [nombre, setNombre] = useState("");
  const [apellido, setApellido] = useState("");
  const [edad, setEdad] = useState("");
  const [telefono, setTelefono] = useState("");
  const [correo, setCorreo] = useState("");
  const [cargo, setCargo] = useState("");
  const [anios, setAnios] = useState("");
  const [id, setId] = useState("");
  const [fechaNacimiento, setFechaNacimiento] = useState("");
  const [editar, setEditar] = useState(false);
  const [empleadosList, setEmpleados] = useState([]);

  // Estados para errores
  const [errorNombre, setErrorNombre] = useState("");
  const [errorApellido, setErrorApellido] = useState("");
  const [errorTelefono, setErrorTelefono] = useState("");
  const [errorCorreo, setErrorCorreo] = useState("");
  const [errorCargo, setErrorCargo] = useState("");
  const [errorAnios, setErrorAnios] = useState("");
  const [errorCampos, setErrorCampos] = useState("");

  // Función para calcular la edad a partir de la fecha de nacimiento
  const calcularEdad = (fecha) => {
    const hoy = new Date();
    const cumpleanos = new Date(fecha);
    let edadCalculada = hoy.getFullYear() - cumpleanos.getFullYear();
    const m = hoy.getMonth() - cumpleanos.getMonth();
    if (m < 0 || (m === 0 && hoy.getDate() < cumpleanos.getDate())) {
      edadCalculada--;
    }
    return edadCalculada;
  };

  // Validaciones de los campos
  const validarCamposObligatorios = () => {
    if (!nombre || !apellido || !telefono || !correo || !cargo) {
      setErrorCampos("Todos los campos son obligatorios.");
      return false;
    } else {
      setErrorCampos("");
      return true;
    }
  };

  const validarNombre = () => {
    if (/[^a-zA-ZáéíóúÁÉÍÓÚñÑ ]/.test(nombre)) {
      setErrorNombre("El nombre solo puede contener letras.");
      return false;
    }
    setErrorNombre("");
    return true;
  };

  const validarApellido = () => {
    if (/[^a-zA-ZáéíóúÁÉÍÓÚñÑ ]/.test(apellido)) {
      setErrorApellido("El apellido solo puede contener letras.");
      return false;
    } else {
      setErrorApellido("");
      return true;
    }
  };

  const validarTelefono = () => {
    if (telefono.length !== 9) {
      setErrorTelefono("El número de teléfono debe tener exactamente 9 dígitos.");
      return false;
    } else {
      setErrorTelefono("");
      return true;
    }
  };

  const validarCorreo = () => {
    if (!correo.includes("@")) {
      setErrorCorreo("El correo debe contener el símbolo @.");
      return false;
    } else {
      setErrorCorreo("");
      return true;
    }
  };

  const validarCargo = () => {
    if (!cargo) {
      setErrorCargo("El cargo es obligatorio.");
      return false;
    } else {
      setErrorCargo("");
      return true;
    }
  };

  const validarAnios = () => {
    if (anios && isNaN(parseInt(anios, 10))) {
      setErrorAnios("Los años deben ser un número.");
      return false;
    } else {
      setErrorAnios("");
      return true;
    }
  };

  // Función para obtener los empleados
  const getEmpleados = async () => {
    try {
      const response = await Axios.get("http://localhost:5001/empleados1");
      if (response.status === 200) {
        setEmpleados(response.data);
      }
    } catch (error) {
      console.error("Error al obtener empleados:", error);
    }
  };

  useEffect(() => {
    getEmpleados();
  }, []);

  // Función para limpiar los datos del formulario
  const limpiarDatos = () => {
    setNombre("");
    setApellido("");
    setFechaNacimiento("");
    setEdad("");
    setTelefono("");
    setCorreo("");
    setCargo("");
    setAnios("");
    setEditar(false);
    setId("");
  };


  const addEmpleado = async () => {
    if (!nombre || !apellido || !fechaNacimiento || !telefono || !correo || !cargo) {
        Swal.fire("Error", "Todos los campos son obligatorios.", "error");
        return;
    }

    const nuevoEmpleado = {
        nombre,
        apellido,
        edad: calcularEdad(fechaNacimiento),  // Calcula la edad correctamente
        fecha_nacimiento: fechaNacimiento,
        telefono,
        correo,
        cargo,
    };

    console.log("Datos enviados al servidor:", nuevoEmpleado); // Para depuración

    try {
        const response = await Axios.post("http://localhost:5001/empleados", nuevoEmpleado);
        if (response.status === 201) {
            await getEmpleados();
            limpiarDatos();
            Swal.fire("Empleado registrado", "El empleado fue registrado con éxito", "success");
        }
    } catch (error) {
        console.error("Error al agregar empleado:", error);
        Swal.fire("Error", "No se logró registrar el empleado.", "error");
    }
};


  const updateEmpleado = async () => {
    if (!nombre || !apellido || !fechaNacimiento || !telefono || !correo || !cargo) {
      Swal.fire("Error", "Todos los campos son obligatorios.", "error");
      return;
    }
    try {
      const datosParaActualizar = {
        id,
        nombre,
        apellido,
        fecha_nacimiento: fechaNacimiento,
        edad: parseInt(edad, 10),
        telefono,
        correo,
        cargo,
        anios: parseInt(anios, 10),
      };

      const response = await Axios.patch(`http://localhost:5001/empleados1/${id}`, datosParaActualizar);
      if (response.status === 200) {
        await getEmpleados();
        limpiarDatos();
        Swal.fire("Actualización exitosa", `El empleado ${nombre} fue actualizado con éxito`, "success");
      }
    } catch (error) {
      console.error("Error al actualizar empleado:", error);
      Swal.fire({
        icon: "error",
        title: "Oops...",
        text: "No se logró actualizar el empleado!",
      });
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validarCamposObligatorios() && validarNombre() && validarApellido() && validarTelefono() && validarCorreo() && validarCargo()) {
      alert("Formulario enviado correctamente");
    }
  };

  return (
    <div className="container mt-5">
      <div className="card shadow">
        <div className="card-header bg-primary text-white text-center">
          <h4>Gestión de Empleados</h4>
        </div>
        <div className="card-body">
        <form onSubmit={handleSubmit}>
  <div className="row g-3">
    <div className="col-md-6">
      <label className="form-label fw-bold">Nombre</label>
      <input
        type="text"
        value={nombre}
        onChange={(e) => {
          const value = e.target.value;
          if (/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]*$/.test(value)) {
            setNombre(value);
          }
        }}
        className="form-control"
        placeholder="Ingrese un Nombre"
      />
      {errorNombre && <div className="text-danger mt-1">{errorNombre}</div>}
    </div>

    <div className="col-md-6">
      <label className="form-label fw-bold">Apellido</label>
      <input
        type="text"
        value={apellido}
        onChange={(e) => {
          const value = e.target.value;
          if (/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]*$/.test(value)) {
            setApellido(value);
          }
        }}
        className="form-control"
        placeholder="Ingrese un Apellido"
      />
      {errorApellido && <div className="text-danger mt-1">{errorApellido}</div>}
    </div>

    <div className="col-md-6">
      <label className="form-label fw-bold">Fecha de Nacimiento</label>
      <input
        type="date"
        value={fechaNacimiento}
        onChange={(e) => {
          const fechaSeleccionada = e.target.value;
          const fechaMin = "1900-01-01";
          const fechaMax = new Date().toISOString().split("T")[0];

          if (fechaSeleccionada >= fechaMin && fechaSeleccionada <= fechaMax) {
            setFechaNacimiento(fechaSeleccionada);
            setEdad(calcularEdad(fechaSeleccionada));
          }
        }}
        min="1900-01-01"
        max={new Date().toISOString().split("T")[0]}
        className="form-control"
      />
    </div>

    <div className="col-md-6">
      <label className="form-label fw-bold">Edad</label>
      <input
        type="number"
        value={edad}
        onChange={(e) => {
          const value = e.target.value;
          if (value >= 0) {
            setEdad(value);
          }
        }}
        className="form-control"
      />
      {edad < 0 && <div className="text-danger mt-1">La edad no puede ser negativa</div>}
    </div>

    <div className="col-md-6">
      <label className="form-label fw-bold">Teléfono</label>
      <input
        type="text"
        value={telefono}
        onChange={(e) => {
          const value = e.target.value;
          if (/^\d{0,9}$/.test(value)) {
            setTelefono(value);
          }
        }}
        onBlur={() => {
          if (telefono.length !== 9) {
            setErrorTelefono("El número de teléfono debe tener exactamente 9 dígitos.");
          } else {
            setErrorTelefono("");
          }
        }}
        className="form-control"
        placeholder="Ingrese un Teléfono"
      />
      {errorTelefono && <div className="text-danger mt-1">{errorTelefono}</div>}
    </div>

    <div className="col-md-6">
      <label className="form-label fw-bold">Correo</label>
      <input
        type="email"
        value={correo}
        onChange={(e) => setCorreo(e.target.value)}
        onBlur={() => {
          if (!/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(correo)) {
            setErrorCorreo("Ingrese un correo válido (ejemplo@dominio.com)");
          } else {
            setErrorCorreo("");
          }
        }}
        className="form-control"
        placeholder="Ingrese un Correo"
      />
      {errorCorreo && <div className="text-danger mt-1">{errorCorreo}</div>}
    </div>

    <div className="col-md-6">
      <label className="form-label fw-bold">Cargo</label>
      <select value={cargo} onChange={(e) => setCargo(e.target.value)} className="form-select">
        <option value="">Seleccione un Cargo</option>
        <option value="Mesero">Mesero</option>
        <option value="Chef">Chef</option>
        <option value="Asistente Cocina">Asistente Cocina</option>
      </select>
      {errorCargo && <div className="text-danger mt-1">{errorCargo}</div>}
    </div>
  </div>
</form>

        </div>
        <div className="card-footer text-center">
          {editar ? (
            <button onClick={updateEmpleado} className="btn btn-success">
              Actualizar
            </button>
          ) : (
            <button onClick={addEmpleado} className="btn btn-success">Registrar</button>
          )}
        </div>
        <div className="card-body">
          <div className="table-responsive">
            <table className="table table-hover table-bordered text-center align-middle mt-4">
              <thead className="table-primary">
                <tr>
                  <th>ID</th>
                  <th>Nombre</th>
                  <th>Apellido</th>
                  <th>Edad</th>
                  <th>Teléfono</th>
                  <th>Correo</th>
                  <th>Cargo</th>
                  <th>Fecha Contratación</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {empleadosList.map((empleado, index) => (
                  <tr key={empleado.id_empleado || index}>
                    <td>{empleado.id_empleado}</td>
                    <td>{empleado.nombre}</td>
                    <td>{empleado.apellido}</td>
                    <td>{empleado.edad}</td>
                    <td>{empleado.telefono}</td>
                    <td>{empleado.correo}</td>
                    <td>{empleado.cargo}</td>
                    <td>
  {empleado.fecha_contratacion 
    ? new Date(empleado.fecha_contratacion).toLocaleDateString('es-ES') 
    : "No disponible"}
</td>

                    <td>
<button className="btn btn-outline-info btn-sm" 
  onClick={() => { 
    setEditar(true);
    setId(empleado.id_empleado);
    setNombre(empleado.nombre);
    setApellido(empleado.apellido);
    setEdad(empleado.edad);
    setTelefono(empleado.telefono);
    setCorreo(empleado.correo);
    setCargo(empleado.cargo);
    setFechaNacimiento(empleado.fecha_nacimiento ? empleado.fecha_nacimiento.split("T")[0] : ""); // Corregido
  }}>
  Editar
</button>

                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GestionTrabajadores;
