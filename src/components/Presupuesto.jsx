import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import { useState } from "react";
import Select from "react-select";
import axios from "axios";
import Swal from "sweetalert2";
import { format } from "date-fns";
import { obtenerFechaActual } from "./utils";
import { registerConfig } from "./utils";

const Presupuesto = () => {
  const {
    register,
    handleSubmit: handleFormSubmit,
    setValue,
    reset,
    formState: { errors },
    watch,
    getValues,
  } = useForm();

  const [personaOptions, setPersonaOptions] = useState([]);
  const [optionsGenero, setOptionsGenero] = useState([]);
  const [optionsTipoMaterial, setOptionsTipoMaterial] = useState([]);
  const [optionsTipoIngreso, setOptionsTipoIngreso] = useState([]);
  const [optionsTipoReloj, setOptionsTipoReloj] = useState([]);
  const [optionsTipoPulsera, setOptionsTipoPulsera] = useState([]);
  const [optionsTipoEstado, setOptionsTipoEstado] = useState([]);
  const [selectedPersona, setSelectedPersona] = useState(null);
  const [selectedGenero, setSelectedGenero] = useState(null);
  const [selectedTipoMaterial, setSelectedTipoMaterial] = useState(null);
  const [selectedTipoIngreso, setSelectedTipoIngreso] = useState(null);
  const [selectedTipoReloj, setSelectedTipoReloj] = useState(null);
  const [selectedTipoPulsera, setSelectedTipoPulsera] = useState(null);
  const [selectedTipoEstado, setSelectedTipoEstado] = useState(null);
  const [orderNumber, setOrderNumber] = useState(null);
  const [presupuestos, setPresupuestos] = useState([]);
  const [editar, setEditar] = useState(false);
  const [id, setId] = useState(null);
  //const [errorTelefono, setErrorTelefono] = useState('');
  //const [errorCorreo, setErrorCorreo] = useState('');
  //const [telefono, setTelefono] = useState('');
  //const [correo, setCorreo] = useState('');
  const [searchTerm, setSearchTerm] = useState("");
  const [searchFilter, setSearchFilter] = useState("");
  const [filteredPresupuestos, setFilteredPresupuestos] = useState([]);
  const [optionsRelojero, setOptionsRelojero] = useState([]);
  const [selectedRelojero, setSelectedRelojero] = useState(null);


  // Función para obtener presupuestos
  const obtenerPresupuestos = async () => {
    try {
      const response = await axios.get("http://localhost:3001/gen/presupuesto");
      if (response.status === 200 && Array.isArray(response.data)) {
        setPresupuestos(response.data);
        setFilteredPresupuestos(response.data);
      } else {
        throw new Error("Formato inesperado de datos");
      }
    } catch (error) {
      console.error("Error al obtener presupuestos:", error);
      Swal.fire({
        title: "Error al cargar presupuestos",
        text: "No se pudieron cargar los presupuestos. Inténtelo más tarde.",
        icon: "error",
      });
    }
  };

  const enviarCorreoPresupuesto = async (presupuesto) => {
    // Validar datos mínimos
    if (!presupuesto?.IDPresupuesto || !presupuesto?.CorreoCliente) {
      Swal.fire({
        title: "Error",
        text: "El presupuesto no tiene información suficiente para enviar el correo.",
        icon: "error",
      });
      return;
    }
  
    try {
      // Llamada al backend
      const response = await axios.post(
        "http://localhost:3001/gen/presupuesto/enviar",
        {
          id: presupuesto.IDPresupuesto,
          CorreoCliente: presupuesto.CorreoCliente,
          NombreCliente: presupuesto.NombreCliente,
        }
      );
  
      // Manejo de la respuesta
      if (response.status === 200) {
        Swal.fire({
          title: "Correo enviado",
          text: `El presupuesto fue enviado exitosamente a ${presupuesto.NombreCliente}`,
          icon: "success",
        });
      }
    } catch (error) {
      // Manejo de errores
      console.error("Error al enviar correo:", error);
      Swal.fire({
        title: "Error",
        text: `Hubo un problema al enviar el correo. Detalles: ${
          error.response?.data?.error || "Desconocido"
        }`,
        icon: "error",
      });
    }
  };
  

  const cargarOpciones = async () => {
    try {
      const endpoints = [
        {
          url: "http://localhost:3001/gen/personas",
          setState: setPersonaOptions,
          labelFn: (item) => `${item.Nombre} ${item.Apellido}`,
          idKey: "IDPersona",
        },
        {
          url: "http://localhost:3001/gen/generoReloj",
          setState: setOptionsGenero,
          labelFn: (item) => item.Genero,
          idKey: "IDGenero",
        },
        {
          url: "http://localhost:3001/gen/tipoMaterial",
          setState: setOptionsTipoMaterial,
          labelFn: (item) => item.Material,
          idKey: "IDTipoMaterial",
        },
        {
          url: "http://localhost:3001/gen/tipoIngreso",
          setState: setOptionsTipoIngreso,
          labelFn: (item) => item.TipoIngreso,
          idKey: "IDTipoIngreso",
        },
        {
          url: "http://localhost:3001/gen/tipoReloj",
          setState: setOptionsTipoReloj,
          labelFn: (item) => item.TipoReloj,
          idKey: "IDTipoReloj",
        },
        {
          url: "http://localhost:3001/gen/estado",
          setState: setOptionsTipoEstado,
          labelFn: (item) => item.TipoEstados,
          idKey: "IDEstado",
        },
        {
          url: "http://localhost:3001/gen/empleados",
          setState: setOptionsRelojero,
          labelFn: (item) => `${item.nombre} ${item.apellido}`,
          idKey: "id",
        },
      ];

      const responses = await Promise.all(
        endpoints.map(({ url }) => axios.get(url))
      );

      responses.forEach((response, index) => {
        if (response.status === 200 && Array.isArray(response.data)) {
          const { setState, labelFn, idKey } = endpoints[index];
          setState(
            response.data.map((item) => ({
              value: item[idKey],
              label: labelFn(item),
            }))
          );
        } else {
          throw new Error(`Error en el endpoint: ${endpoints[index].url}`);
        }
      });
    } catch (error) {
      console.error("Error al cargar las opciones:", error);
      Swal.fire({
        title: "Error",
        text: "Ocurrió un problema al cargar los datos. Intente nuevamente.",
        icon: "error",
      });
    }
  };

  useEffect(() => {
    const cargarDatosIniciales = async () => {
      try {
        await cargarOpciones();
        await obtenerPresupuestos();
      } catch (error) {
        console.error("Error al cargar datos iniciales:", error);
      }
    };

    cargarDatosIniciales();
  }, []);

  const onSubmit = async (data) => {
    if (!selectedPersona?.value) {
      Swal.fire({
        title: "Error",
        text: "Por favor selecciona un cliente.",
        icon: "error",
      });
      return;
    }

    const fechaIngresoSQL = format(new Date(data.FechaIngreso), "yyyy-MM-dd");
    const fechaEntregaSQL = data.FechaEntrega
      ? format(new Date(data.FechaEntrega), "yyyy-MM-dd")
      : null;

    const precio = parseFloat(data.PrecioCLP || 0);
    const abono = parseFloat(data.Abono || 0);
    const saldoPendiente = precio - abono;

    const presupuestoData = {
      IDPersona: selectedPersona?.value,
      FechaIngreso: fechaIngresoSQL,
      FechaEntrega: fechaEntregaSQL,
      TipoMaterial: selectedTipoMaterial?.value || null,
      TipoIngreso: selectedTipoIngreso?.value || null,
      TipoReloj: selectedTipoReloj?.value || null,
      EstadoReloj: selectedTipoEstado?.value || null,
      GeneroReloj: selectedGenero?.value || null,
      IDRelojero: selectedRelojero?.value || null,
      Modelo: data.Modelo || null,
      NumeroTelefono: data.NumeroTelefono,
      PrecioCLP: precio,
      Abono: abono,
      SaldoPendiente: saldoPendiente,
      Observaciones: data.Observaciones || null,
      Detalles: data.Detalles || null,
    };

    try {
      const response = editar
        ? await axios.put(
            `http://localhost:3001/gen/presupuesto/${id}`,
            presupuestoData
          )
        : await axios.post(
            "http://localhost:3001/gen/presupuesto",
            presupuestoData
          );

      if (response.status === 200) {
        Swal.fire({
          title: editar ? "Presupuesto actualizado" : "Presupuesto creado",
          text: "El presupuesto se ha guardado exitosamente.",
          icon: "success",
        });

        setEditar(false); // Cambiar a modo creación
        handleReset(); // Limpiar formulario
        await obtenerPresupuestos(); // Refrescar lista
      }
    } catch (error) {
      console.error("Error al guardar el presupuesto:", error);
      Swal.fire({
        title: "Error",
        text: `Hubo un problema al guardar el presupuesto: ${
          error.response?.data?.message || "Desconocido"
        }`,
        icon: "error",
      });
    }
    console.log("Datos enviados al backend:", presupuestoData);

  };

  const handleReset = () => {
    reset(); // Resetea el formulario
    setSelectedPersona(null);
    setSelectedGenero(null);
    setSelectedTipoMaterial(null);
    setSelectedTipoIngreso(null);
    setSelectedTipoReloj(null);
    setSelectedTipoEstado(null);
    setOrderNumber(null);
    setEditar(false);
    setId(null);
    setSelectedRelojero(null);
  };

  const editarPresupuesto = (presupuesto) => {
    setEditar(true); // Activa el modo edición
    setId(presupuesto.IDPresupuesto); // Asigna el ID del presupuesto
    setOrderNumber(presupuesto.IDPresupuesto); // Asigna el número de orden

    // Asignar valores al formulario
    setSelectedPersona(
      personaOptions.find((option) => option.value === presupuesto.IDPersona) ||
        null
    );
    setValue(
      "FechaIngreso",
      presupuesto.FechaIngreso
        ? format(new Date(presupuesto.FechaIngreso), "yyyy-MM-dd")
        : ""
    );
    setValue(
      "FechaEntrega",
      presupuesto.FechaEntrega
        ? format(new Date(presupuesto.FechaEntrega), "yyyy-MM-dd")
        : ""
    );
    setValue("NumeroTelefono", presupuesto.NumeroTelefono || "");
    setValue("Modelo", presupuesto.Modelo || "");

    setSelectedTipoMaterial(
      optionsTipoMaterial.find(
        (option) => option.value === presupuesto.TipoMaterial
      ) || null
    );
    setSelectedTipoIngreso(
      optionsTipoIngreso.find(
        (option) => option.value === presupuesto.TipoIngreso
      ) || null
    );
    setSelectedGenero(
      optionsGenero.find(
        (option) => option.value === presupuesto.GeneroReloj
      ) || null
    );
    setSelectedTipoReloj(
      optionsTipoReloj.find(
        (option) => option.value === presupuesto.TipoReloj
      ) || null
    );
    setSelectedTipoEstado(
      optionsTipoEstado.find(
        (option) => option.value === presupuesto.EstadoReloj
      ) || null
    );
    setSelectedRelojero(
      optionsRelojero.find(
        (option) => option.value === presupuesto.IDRelojero
      ) || null
    );

    setValue("PrecioCLP", Math.round(presupuesto.PrecioCLP) || 0);
    setValue("Abono", Math.round(presupuesto.Abono) || 0); // Asignar Abono
    setValue("SaldoPendiente", Math.round(presupuesto.SaldoPendiente) || 0); // Asignar Saldo Pendiente
    setValue("Observaciones", presupuesto.Observaciones || "");
    setValue("Detalles", presupuesto.Detalles || "");
  };

  const handleSearch = () => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) {
      setFilteredPresupuestos(presupuestos); // Si no hay término, muestra todo
      return;
    }

    const filtered = presupuestos.filter((presupuesto) => {
      const fields = {
        ID: presupuesto.IDPresupuesto?.toString(),
        "Nombre Cliente": presupuesto.NombreCliente?.toLowerCase(),
        Teléfono: presupuesto.NumeroTelefono?.toString(),
        Modelo: presupuesto.Modelo?.toLowerCase(),
        Estado: presupuesto.EstadoNombre?.toLowerCase(),
      };

      return searchFilter
        ? fields[searchFilter]?.includes(term)
        : Object.values(fields).some((field) => field?.includes(term));
    });

    setFilteredPresupuestos(filtered);
  };

  useEffect(() => {
    const today = new Date();
    const formattedDate = format(today, "dd-MM-yyyy");
    setValue("FechaIngreso", formattedDate);
  }, [setValue]);

  useEffect(() => {
    // Inicializar la fecha de ingreso
    setValue("FechaIngreso", obtenerFechaActual());
  }, [setValue]);

  useEffect(() => {
    // Sincronizar la lista filtrada
    if (Array.isArray(presupuestos)) {
      setFilteredPresupuestos(presupuestos);
    } else {
      console.error("Presupuestos no es un arreglo válido.");
    }
  }, [presupuestos]);

  const handleClear = () => {
    handleReset(); // Limpia todos los estados
    setFilteredPresupuestos(presupuestos); // Restaura la lista completa
    Swal.fire({
      title: "Búsqueda limpiada",
      text: "Se han restablecido los resultados.",
      icon: "info",
      timer: 2000,
    });
  };
  const [currentPage, setCurrentPage] = useState(1); // Página actual
  const rowsPerPage = 10; // Número de filas por página
  
  // Calcula los índices para la paginación
  const indexOfLastRow = currentPage * rowsPerPage;
  const indexOfFirstRow = indexOfLastRow - rowsPerPage;
  
  // Filtrar los presupuestos para mostrar solo los de la página actual
  const currentRows = filteredPresupuestos.slice(indexOfFirstRow, indexOfLastRow);
  
  // Cambiar de página
  const paginate = (pageNumber) => setCurrentPage(pageNumber);
  
  // Generar botones de paginación
  const totalPages = Math.ceil(filteredPresupuestos.length / rowsPerPage);
  return (
<div className="container mt-4 p-4 rounded shadow bg-light">
  <h2 className="text-center mb-4 text-primary">Presupuesto de Clientes</h2>
  <form onSubmit={handleFormSubmit(onSubmit)} className="needs-validation">
    <div className="row">
      <div className="col-md-6 mb-3">
        <label htmlFor="id_presupuesto" className="form-label fw-bold">
          N° Orden
        </label>
        <input
          type="text"
          className="form-control"
          value={id || ""}
          readOnly // Solo lectura para evitar modificaciones manuales
        />
      </div>

      <div className="col-md-6 mb-3">
        <label htmlFor="fecha_ingreso" className="form-label fw-bold">
          Fecha de Ingreso
        </label>
        <input
          type="text"
          className="form-control"
          value={
            watch("FechaIngreso")
              ? format(new Date(watch("FechaIngreso")), "dd-MM-yyyy")
              : ""
          }
          readOnly // Solo lectura para evitar modificaciones manuales
        />
      </div>
    </div>

    <div className="row">
    <div className="col-md-6 mb-3">
    <label htmlFor="fecha_entrega" className="form-label fw-bold">
      Fecha de Entrega
    </label>
    <input
      type="date"
      className="form-control"
      min={new Date().toISOString().split("T")[0]} // Fecha mínima: el día actual
      {...register("FechaEntrega", {
        validate: (value) => {
          const selectedDate = new Date(value);
          const today = new Date();
          today.setHours(0, 0, 0, 0); // Asegúrate de comparar solo fechas
          return selectedDate >= today || "La fecha debe ser el día actual o posterior";
        },
      })}
    />
    {errors.FechaEntrega && (
      <p className="text-danger">{errors.FechaEntrega.message}</p>
    )}
  </div>

      <div className="col-md-6 mb-3">
        <label htmlFor="nombre_cliente" className="form-label fw-bold">
          Nombre Cliente
        </label>
        <Select
          options={personaOptions}
          value={selectedPersona}
          onChange={(option) => {
            setSelectedPersona(option);
            setValue("IDPersona", option?.value || "");
          }}
          placeholder="Seleccione un cliente"
        />
      </div>
    </div>

    <div className="row">
      <div className="col-md-6 mb-3">
        <label htmlFor="numero_telefono" className="form-label fw-bold">
          Número de Teléfono
        </label>
        <input
          type="text"
          className="form-control"
          maxLength="9"
          {...register("NumeroTelefono", {
            required: "El número de teléfono es obligatorio",
            validate: (value) =>
              value.length === 9 || "El número debe tener 9 dígitos",
            pattern: {
              value: /^[0-9]+$/,
              message: "Solo se permiten números",
            },
          })}
          onInput={(e) =>
            (e.target.value = e.target.value.replace(/[^0-9]/g, ""))
          }
          placeholder="Ingrese Teléfono"
        />
        {errors.NumeroTelefono && (
          <p className="text-danger">{errors.NumeroTelefono.message}</p>
        )}
      </div>

      <div className="col-md-6 mb-3">
        <label htmlFor="modelo" className="form-label fw-bold">Modelo</label>
        <input
          type="text"
          className="form-control"
          {...register("Modelo", {
            required: "El modelo es obligatorio",
          })}
          placeholder="Ingrese modelo de reloj"
        />
        {errors.Modelo && (
          <p className="text-danger">{errors.Modelo.message}</p>
        )}
      </div>
    </div>

    <div className="row">
      <div className="col-md-6 mb-3">
        <label htmlFor="genero_reloj" className="form-label fw-bold">
          Género Reloj
        </label>
        <Select
          options={optionsGenero}
          value={selectedGenero}
          onChange={(option) => {
            setSelectedGenero(option);
            setValue("GeneroReloj", option?.value || "");
          }}
          placeholder="Seleccione el género del reloj"
        />
      </div>

      <div className="col-md-6 mb-3">
        <label htmlFor="tipo_material" className="form-label fw-bold">
          Tipo de Material
        </label>
        <Select
          options={optionsTipoMaterial}
          value={selectedTipoMaterial}
          onChange={(option) => {
            setSelectedTipoMaterial(option);
            setValue("TipoMaterial", option?.value || "");
          }}
          placeholder="Seleccione tipo de material"
        />
      </div>
    </div>

    <div className="row">
      <div className="col-md-6 mb-3">
        <label htmlFor="tipo_ingreso" className="form-label fw-bold">
          Tipo Ingreso
        </label>
        <Select
          options={optionsTipoIngreso}
          value={selectedTipoIngreso}
          onChange={(option) => {
            setSelectedTipoIngreso(option);
            setValue("TipoIngreso", option?.value || "");
          }}
          placeholder="Seleccione tipo de ingreso"
        />
      </div>

      <div className="col-md-6 mb-3">
        <label htmlFor="tipo_estado" className="form-label fw-bold">
          Estado Reloj
        </label>
        <Select
          options={optionsTipoEstado}
          value={selectedTipoEstado}
          onChange={(option) => {
            setSelectedTipoEstado(option);
            setValue("EstadoReloj", option?.value || "");
          }}
          placeholder="Seleccione el estado del reloj"
        />
      </div>
    </div>

    <div className="row">
      <div className="col-md-6 mb-3">
        <label htmlFor="observaciones" className="form-label fw-bold">
          Observaciones
        </label>
        <textarea
          className="form-control"
          {...register("Observaciones", {
            maxLength: {
              value: 255,
              message: "Las observaciones no pueden exceder los 255 caracteres",
            },
          })}
          rows="3"
          placeholder="Ingrese observaciones"
        ></textarea>
        {errors.Observaciones && (
          <p className="text-danger">{errors.Observaciones.message}</p>
        )}
      </div>

      <div className="col-md-6 mb-3">
        <label htmlFor="detalles" className="form-label fw-bold">
          Detalles
        </label>
        <textarea
          className="form-control"
          {...register("Detalles", {
            maxLength: {
              value: 255,
              message: "Los detalles no pueden exceder los 255 caracteres",
            },
          })}
          rows="3"
          placeholder="Ingrese detalles del presupuesto"
        ></textarea>
        {errors.Detalles && (
          <p className="text-danger">{errors.Detalles.message}</p>
        )}
      </div>
    </div>

    <div className="row">
      <div className="col-md-6 mb-3">
        <label htmlFor="precio_clp" className="form-label fw-bold">
          Precio (CLP)
        </label>
        <div className="input-group">
          <span className="input-group-text">$</span>
          <input
            type="number"
            className="form-control"
            {...register("PrecioCLP", {
              required: "El precio es obligatorio",
              min: { value: 0, message: "El precio no puede ser negativo" },
            })}
          />
        </div>
        {errors.PrecioCLP && (
          <p className="text-danger">{errors.PrecioCLP.message}</p>
        )}
      </div>

      <div className="col-md-6 mb-3">
        <label htmlFor="abono_clp" className="form-label fw-bold">
          Abono (CLP)
        </label>
        <div className="input-group">
          <span className="input-group-text">$</span>
          <input
            type="number"
            className="form-control"
            {...register("Abono", {
              required: "El abono es obligatorio",
              min: { value: 0, message: "El abono no puede ser negativo" },
            })}
            onChange={(e) => {
              const abono = Math.max(0, parseFloat(e.target.value) || 0); // Asegura que no sea negativo
              setValue("Abono", abono);
              const precio = parseFloat(watch("PrecioCLP")) || 0;
              setValue("SaldoPendiente", precio - abono);
            }}
          />
        </div>
        {errors.Abono && (
          <p className="text-danger">{errors.Abono.message}</p>
        )}
      </div>

      <div className="col-md-6 mb-3">
        <label htmlFor="saldo_pendiente" className="form-label fw-bold">
          Saldo Pendiente
        </label>
        <div className="input-group">
          <span className="input-group-text">$</span>
          <input
            type="number"
            className="form-control"
            {...register("SaldoPendiente", {
              min: { value: 0, message: "El saldo pendiente no puede ser negativo" },
            })}
            readOnly
          />
        </div>
      </div>
      <div className="col-md-6 mb-3">
            <label htmlFor="relojero_a_cargo" className="form-label fw-bold">
              Relojero a Cargo
            </label>
            <Select
              options={optionsRelojero}
              value={selectedRelojero}
              onChange={(option) => {
                setSelectedRelojero(option);
                setValue("RelojeroACargo", option?.value || "");
              }}
              placeholder="Seleccione un relojero"
            />
          </div>
    </div>

    <div className="row mt-4">
  <div className="col-md-6">
    <button
      type="submit"
      className="btn btn-primary w-100 py-2 fw-bold shadow-sm rounded"
    >
      {editar ? "Actualizar" : "Registrar"}
    </button>
  </div>
  <div className="col-md-6">
    <button
      type="button"
      className="btn btn-secondary w-100 py-2 fw-bold shadow-sm rounded"
      onClick={handleClear}
    >
      Limpiar
    </button>
  </div>


    </div>
  </form>

  <div className="container mt-3 p-3 border rounded shadow-sm bg-light">
  <div className="row align-items-center">
    <div className="col-lg-6 col-md-6 col-sm-12 mb-2">
      <input
        type="text"
        placeholder="Buscar por modelo, teléfono o precio"
        className="form-control"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />
    </div>
    <div className="col-lg-4 col-md-4 col-sm-6 mb-2">
      <select
        value={searchFilter}
        className="form-select"
        onChange={(e) => setSearchFilter(e.target.value)}
      >
        <option value="">Seleccionar Filtro</option>
        <option value="ID">ID</option>
        <option value="Nombre Cliente">Nombre Cliente</option>
        <option value="Teléfono">Teléfono</option>
        <option value="Modelo">Modelo</option>
        <option value="Estado">Estado</option>
      </select>
    </div>
    <div className="col-lg-2 col-md-2 col-sm-6 d-flex justify-content-end gap-2">
      <button className="btn btn-primary w-100" onClick={handleSearch}>
        Buscar
      </button>
      <button className="btn btn-secondary w-100" onClick={handleClear}>
        Limpiar
      </button>
    </div>
  </div>
</div>

<table className="table table-hover table-bordered text-center align-middle">
  <thead className="table-primary">
    <tr>
      <th>N° de Orden</th>
      <th>Fecha Ingreso</th>
      <th>Fecha Entrega</th>
      <th>Nombre Cliente</th>
      <th>Teléfono</th>
      <th>Correo</th>
      <th>Modelo</th>
      <th>Estado</th>
      <th>Precio CLP</th>
      <th>Abono CLP</th>
      <th>Saldo Pendiente</th>
      <th>Acciones</th>
    </tr>
  </thead>
  <tbody>
    {currentRows.map((presupuesto) => (
      <tr key={presupuesto.IDPresupuesto}>
        <td>{presupuesto.IDPresupuesto}</td>
        <td>{new Date(presupuesto.FechaIngreso).toLocaleDateString()}</td>
        <td>
          {presupuesto.FechaEntrega
            ? new Date(presupuesto.FechaEntrega).toLocaleDateString()
            : "N/A"}
        </td>
        <td>{presupuesto.NombreCliente}</td>
        <td>{presupuesto.NumeroTelefono}</td>
        <td>{presupuesto.CorreoCliente}</td>
        <td>{presupuesto.Modelo}</td>
        <td>{presupuesto.EstadoNombre}</td>
        <td>
          {new Intl.NumberFormat("es-CL", {
            style: "currency",
            currency: "CLP",
          }).format(presupuesto.PrecioCLP ?? 0)}
        </td>
        <td>
          {new Intl.NumberFormat("es-CL", {
            style: "currency",
            currency: "CLP",
          }).format(presupuesto.Abono ?? 0)}
        </td>
        <td>
          {new Intl.NumberFormat("es-CL", {
            style: "currency",
            currency: "CLP",
          }).format(presupuesto.SaldoPendiente ?? 0)}
        </td>
        <td>
        <button
              className="btn btn-outline-info btn"
              onClick={() => editarPresupuesto(presupuesto)}
            >
              Editar
            </button>
            <button
              className="btn btn-outline-primary btn-sm"
              onClick={() => enviarCorreoPresupuesto(presupuesto)}
            >
              Enviar Correo
            </button>
        </td>
      </tr>
    ))}
  </tbody>
</table>

{/* Paginación */}
<div className="d-flex justify-content-center mt-3">
  <nav aria-label="Tabla de Paginación">
    <ul className="pagination">
      {[...Array(totalPages)].map((_, index) => (
        <li
          key={index}
          className={`page-item ${currentPage === index + 1 ? "active" : ""}`}
        >
          <button
            className="page-link"
            onClick={() => paginate(index + 1)}
          >
            {index + 1}
          </button>
        </li>
      ))}
    </ul>
  </nav>
</div>

    </div>
  );
};

export default Presupuesto;
