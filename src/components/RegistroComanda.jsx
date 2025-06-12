"use client"

import { useEffect } from "react"
import { useForm } from "react-hook-form"
import { useState } from "react"
import FacturaPopUp from "./factura"
import Select from "react-select"
import Axios from "axios"
import Swal from "sweetalert2"
import "../styles/RegistroComanda.css"

const RegistroComanda = () => {
  const {
    register,
    handleSubmit: handleFormSubmit,
    setValue,
    reset,
    formState: { errors },
    watch,
    getValues,
  } = useForm()

  const [meseroOptions, setMeseroOptions] = useState([])
  const [selectedMesero, setSelectedMesero] = useState(null)
  const [menuOptions, setMenuOptions] = useState([])
  const [menuSeleccionado, setMenuSeleccionado] = useState("")
  const [mesaOptions, setMesaOptions] = useState([])
  const [mesaSeleccionada, setMesaSeleccionada] = useState("")
  const [cantidad, setCantidad] = useState(1)
  const [orden, setOrden] = useState([])
  const [comandas, setComandas] = useState([])
  const [filteredComandas, setFilteredComanda] = useState([])
  const [detallesPreparacion, setDetallesPreparacion] = useState([])
  const [pagarComanda, setPagarComanda] = useState([])
  const [popUp, setPopUp] = useState(false)
  const [idNumeroOrden, setIdNumeroOrden] = useState(null)
  const [comandaEditada, setComandaEditada] = useState(null)
  const [botonHabilitado, setBotonHabilitado] = useState(false)
  const [horaActual, setHoraActual] = useState("")

  // Función para obtener la hora actual de Chile
  const obtenerHoraChile = () => {
    const ahora = new Date()
    const horaChile = new Intl.DateTimeFormat("es-CL", {
      timeZone: "America/Santiago",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    }).format(ahora)

    return horaChile
  }

  // Función para obtener timestamp de Chile para la base de datos
  const obtenerTimestampChile = () => {
    const ahora = new Date()
    // Convertir a hora de Chile
    const horaChile = new Date(ahora.toLocaleString("en-US", { timeZone: "America/Santiago" }))
    return horaChile.toISOString()
  }

  // Actualizar hora cada segundo
  useEffect(() => {
    const actualizarHora = () => {
      setHoraActual(obtenerHoraChile())
    }

    // Actualizar inmediatamente
    actualizarHora()

    // Actualizar cada segundo
    const intervalo = setInterval(actualizarHora, 1000)

    return () => clearInterval(intervalo)
  }, [])

  const cargarEmpleados = async () => {
    try {
      const endpoints = [
        {
          url: "http://localhost:5001/meseros",
          setState: setMeseroOptions,
          labelFn: (item) => `${item.nombre} ${item.apellido}`,
          idKey: "id_empleado",
        },
      ]

      const responses = await Promise.all(endpoints.map(({ url }) => Axios.get(url)))

      responses.forEach((response, index) => {
        if (response.status === 200 && Array.isArray(response.data)) {
          const { setState, labelFn, idKey } = endpoints[index]
          setState(
            response.data.map((item) => ({
              value: item[idKey],
              label: labelFn(item),
            })),
          )
        } else {
          throw new Error(`Error en el endpoint: ${endpoints[index].url}`)
        }
      })
    } catch (error) {
      console.error("Error al cargar las opciones:", error)
      Swal.fire({
        title: "Error",
        text: "Ocurrió un problema al cargar los datos. Intente nuevamente.",
        icon: "error",
      })
    }
  }

  const cargarMenu = async () => {
    try {
      const endpoints = [
        {
          url: "http://localhost:5001/menu",
          setState: setMenuOptions,
          labelFn: (item) => `${item.id_plato} - ${item.nombre_plato}`,
          idKey: "id_plato",
        },
      ]

      const responses = await Promise.all(endpoints.map(({ url }) => Axios.get(url)))

      responses.forEach((response, index) => {
        if (response.status === 200 && Array.isArray(response.data)) {
          const { setState, labelFn, idKey } = endpoints[index]
          setState(
            response.data.map((item) => ({
              value: item[idKey],
              label: labelFn(item),
            })),
          )
        } else {
          throw new Error(`Error en el endpoint: ${endpoints[index].url}`)
        }
      })
    } catch (error) {
      console.error("Error al cargar las opciones:", error)
      Swal.fire({
        title: "Error",
        text: "Ocurrió un problema al cargar los datos. Intente nuevamente.",
        icon: "error",
      })
    }
  }

  const cargarMesas = async () => {
    try {
      const response = await Axios.get("http://localhost:5001/mesa")
      if (response.status === 200) {
        setMesaOptions(response.data.map((item) => ({ value: item.id_mesa, label: item.numero })))
      } else {
        throw new Error("Error al cargar las mesas")
      }
    } catch (error) {
      console.error("Error al cargar las mesas:", error)
      Swal.fire({
        title: "Error",
        text: "Ocurrió un problema al cargar las mesas. Intente nuevamente.",
        icon: "error",
      })
    }
  }

  const obtenerDetalles = async () => {
    try {
      const response = await Axios.get("http://localhost:5001/detalle")
      console.log("Respuesta de la API:", response.data)
      if (response.status === 200) {
        // Filtrar comandas según el estado
        setDetallesPreparacion(
          response.data.filter((detalle) => detalle.estado_detalle === 2 || detalle.estado_detalle === 3),
        )
      }
    } catch (error) {
      console.error("Error al obtener comandas:", error)
    }
  }

  const obtenerComandasListas = async () => {
    try {
      const response = await Axios.get("http://localhost:5001/comandas/pagar1")
      console.log("Respuesta de la API:", response.data)
      if (response.status === 200) {
        setPagarComanda(response.data)
      }
    } catch (error) {
      console.error("Error al obtener comandas:", error)
    }
  }

  useEffect(() => {
    const cargarDatosIniciales = async () => {
      try {
        await cargarEmpleados()
        await cargarMenu()
        await cargarMesas()
        await obtenerDetalles()
        await obtenerComandasListas()
      } catch (error) {
        console.error("Error al cargar datos iniciales:", error)
      }
    }

    cargarDatosIniciales()
  }, [])

  const onSubmit = async (data) => {
    if (!selectedMesero) {
      Swal.fire({ title: "Error", text: "Seleccione un mesero.", icon: "error" })
      return
    }

    try {
      let numeroOrden = comandaEditada ? comandaEditada.id_numero_orden : null

      if (!comandaEditada) {
        // Si es una nueva comanda, primero la crea con la hora de Chile
        const comandaResponse = await Axios.post("http://localhost:5001/comandas", {
          id_empleado: selectedMesero.value,
          id_mesa: mesaSeleccionada,
          id_estado: 4,
          detalles: data.detalles || "Sin Detalles",
          fecha_hora: obtenerTimestampChile(), // Agregar timestamp de Chile
        })

        numeroOrden = comandaResponse.data.id_numero_orden
      }

      // Enviar los detalles
      for (const item of orden) {
        await Axios.post("http://localhost:5001/detalle", {
          id_plato: item.id_plato,
          id_numero_orden: numeroOrden,
          cantidad: item.cantidad,
          id_estado: 1,
          fecha_hora: obtenerTimestampChile(), // Agregar timestamp de Chile también a los detalles
        })
      }

      Swal.fire({
        title: "Éxito",
        text: `Comanda registrada a las ${obtenerHoraChile()}`,
        icon: "success",
      })
      obtenerDetalles()
      obtenerComandasListas()
      handleReset()
    } catch (error) {
      console.error("Error al enviar comanda:", error)
      Swal.fire({ title: "Error", text: "Hubo un problema.", icon: "error" })
    }
  }

  const handleReset = () => {
    reset() // Resetea el formulario
    setSelectedMesero(null)
    setOrden([])
  }

  const agregarOrden = () => {
    if (!menuSeleccionado || cantidad < 1) return
    const menu = menuOptions.find((item) => item.label === menuSeleccionado)
    const nuevaOrden = [...orden, { id_plato: menu.value, menu: menuSeleccionado, cantidad }]
    setOrden(nuevaOrden)
    setMenuSeleccionado("")
    setCantidad(1)
  }

  const eliminarOrden = (index) => {
    const nuevaOrden = orden.filter((_, i) => i !== index)
    setOrden(nuevaOrden)
  }

  const handleClear = () => {
    handleReset() // Limpia todos los estados
    setFilteredComanda(comandas) // Restaura la lista completa
    Swal.fire({
      title: "Comanda limpia",
      text: "Se han restablecido los resultados.",
      icon: "info",
      timer: 2000,
    })
  }

  const marcarDetalleEntregado = async (id_detalle) => {
    try {
      const response = await Axios.put(`http://localhost:5001/detalle/${id_detalle}`, {
        id_estado: 3,
        fecha_entrega: obtenerTimestampChile(), // Registrar hora de entrega
      })
      if (response.status === 200) {
        obtenerDetalles()
        obtenerComandasListas()
        Swal.fire({
          title: "Éxito",
          text: `Comanda entregada a las ${obtenerHoraChile()}`,
          icon: "success",
        })
      }
    } catch (error) {
      console.error("Error al marcar la comanda como entregada:", error)
      Swal.fire({
        title: "Error",
        text: "Error al entregar la comanda.",
        icon: "error",
      })
    }
  }

  const marcarDetalleCancelado = async (id) => {
    try {
      obtenerDetalles()
      Swal.fire({
        title: "¿Quieres cancelar el pedido?",
        showDenyButton: true,
        showCancelButton: false,
        confirmButtonText: "Sí",
        denyButtonText: `No`,
      }).then((result) => {
        if (result.isConfirmed) {
          Axios.put(`http://localhost:5001/detalle/${id}`, {
            id_estado: 6,
            fecha_cancelacion: obtenerTimestampChile(), // Registrar hora de cancelación
          })
          Swal.fire(`Pedido cancelado a las ${obtenerHoraChile()}!`, "", "success")
          obtenerDetalles()
          obtenerComandasListas()
        } else if (result.isDenied) {
        }
      })
    } catch (error) {
      console.error("Error al marcar la comanda como cancelada:", error)
    }
  }

  const openPopUp = () => {
    setPopUp(true)
  }

  const closePopUp = () => {
    setPopUp(false)
  }
  const editarComanda = (comanda) => {
    setComandaEditada(comanda)
    setSelectedMesero({
      value: comanda.id_empleado,
      label: comanda.nombre_empleado,
    })
    setMesaSeleccionada(comanda.id_mesa)
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  const verificarYAbrirPopUp = async (numeroOrden) => {
    try {
      const response = await Axios.get(`http://localhost:5001/detalle/${numeroOrden}`)

      // Verificar si todos los detalles cumplen la condición
      const habilitado = response.data.every((detalle) => detalle.id_estado === 3 || detalle.id_estado === 6)

      if (habilitado) {
        setIdNumeroOrden(numeroOrden)
        setPopUp(true)
      } else {
        Swal.fire({
          title: "Atención",
          text: "Los platos deben estar entregados o cancelados para generar una boleta.",
          icon: "warning",
          confirmButtonText: "Aceptar",
        })
      }
    } catch (error) {
      console.error("Error al obtener detalles:", error)
      Swal.fire({
        title: "Error",
        text: "Hubo un error al verificar la comanda.",
        icon: "error",
        confirmButtonText: "Aceptar",
      })
    }
  }

  return (
    <div className="container mt-4 p-4 rounded shadow bg-light">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="text-primary mb-0">Registrar comanda</h2>
        <div className="text-end">
          <div className="badge bg-primary fs-6 p-2">🕐 {horaActual}</div>
          <div className="text-muted small mt-1">Hora de Chile (Santiago)</div>
        </div>
      </div>

      <form onSubmit={handleFormSubmit(onSubmit)} className="needs-validation">
        <div className="row">
          <div className="col-md-6 mb-3">
            <label htmlFor="nombre_cliente" className="form-label fw-bold">
              Nombre Mesero
            </label>
            <Select
              options={meseroOptions}
              value={selectedMesero}
              onChange={(option) => {
                setSelectedMesero(option)
                setValue("id_empleado", option?.value || "")
              }}
              placeholder="Seleccione un mesero"
            />
          </div>

          <div className="col-md-6 mb-3">
            <label htmlFor="numero_telefono" className="form-label fw-bold">
              N° de Mesa
            </label>
            <select
              className="form-select"
              value={mesaSeleccionada}
              onChange={(e) => setMesaSeleccionada(e.target.value)}
            >
              <option value="">Seleccione una mesa</option>
              {mesaOptions.map((mesa) => (
                <option key={mesa.value} value={mesa.label}>
                  {mesa.label}
                </option>
              ))}
            </select>
            {errors.NumeroMesa && <p className="text-danger">{errors.NumeroMesa.message}</p>}
          </div>

          <div className="container mt-4">
            <h2>Seleccionar Menú</h2>
            <div className="d-flex gap-2">
              <select
                className="form-select"
                value={menuSeleccionado}
                onChange={(e) => setMenuSeleccionado(e.target.value)}
              >
                <option value="">Seleccione un menú</option>
                {menuOptions.map((menu) => (
                  <option key={menu.value} value={menu.label}>
                    {menu.label}
                  </option>
                ))}
              </select>
              <div className="d-flex gap-2">
                <input
                  type="number"
                  className="form-control"
                  value={cantidad}
                  min="1"
                  onChange={(e) => setCantidad(Number(e.target.value))}
                />
                <button type="button" className="btn btn-success" onClick={agregarOrden}>
                  Agregar
                </button>
              </div>
            </div>

            <h3 className="mt-4">Orden Actual</h3>
            {orden.length === 0 ? (
              <p>No hay items en la orden.</p>
            ) : (
              <ul className="list-group">
                {orden.map((item, index) => (
                  <li key={index} className="list-group-item d-flex justify-content-between">
                    {item.menu} x {item.cantidad}
                    <button className="btn btn-danger btn-sm" onClick={() => eliminarOrden(index)}>
                      Eliminar
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="col-md-6 mb-3">
            <label htmlFor="detalles" className="form-label fw-bold">
              Detalles
            </label>
            <textarea
              className="form-control"
              {...register("detalles", {
                maxLength: {
                  value: 255,
                  message: "Los detalles no pueden exceder los 255 caracteres",
                },
              })}
              rows="3"
              placeholder="Ingrese detalles de la orden"
            ></textarea>
            {errors.Detalles && <p className="text-danger">{errors.Detalles.message}</p>}
          </div>
        </div>

        <div className="row mt-4">
          <div className="col-md-6">
            <button type="submit" className="btn btn-primary w-100 py-2 fw-bold shadow-sm rounded">
              📝 Enviar comanda ({horaActual.split(" ")[1]})
            </button>
          </div>
          <div className="col-md-6">
            <button
              type="button"
              className="btn btn-secondary w-100 py-2 fw-bold shadow-sm rounded"
              onClick={handleClear}
            >
              🧹 Limpiar
            </button>
          </div>
        </div>
        <div className="table-responsive mt-4">
          <h2>Pedidos Listos</h2>
          <table className="table table-bordered mt-3">
            <thead className="table-dark">
              <tr>
                <th>Mesa</th>
                <th>Pedido</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {detallesPreparacion.map((detalle, index) => (
                <tr key={index} style={{ backgroundColor: "yellow" }}>
                  <td>{detalle.numero_mesa}</td>
                  <td>
                    {detalle.cantidad} x {detalle.nombre_plato}
                  </td>
                  <td>
                    <button
                      type="button"
                      className="btn btn-primary mx-2"
                      onClick={() => marcarDetalleEntregado(detalle.id_detalle, 3)}
                      disabled={detalle.estado_detalle === 3}
                    >
                      {detalle.estado_detalle === 2 ? "Entregar" : "Entregada"}
                    </button>
                    <button
                      type="button"
                      className="btn btn-primary mx-2"
                      onClick={() => marcarDetalleCancelado(detalle.id_detalle, 6)}
                    >
                      Anular
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="table-responsive mt-4 ml-4">
          <h2>Pagar</h2>
          <table className="table table-bordered mt-3">
            <thead className="table-dark">
              <tr>
                <th>Mesa</th>
                <th>Mesero</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {pagarComanda.map((comanda, index) => (
                <tr key={index} style={{ backgroundColor: "yellow" }}>
                  <td>{comanda.id_mesa}</td>
                  <td>{comanda.nombre_empleado}</td>
                  <td>
                    <button
                      type="button"
                      className="btn btn-success mx-2"
                      onClick={() => {
                        setIdNumeroOrden(comanda.id_numero_orden)
                        verificarYAbrirPopUp(comanda.id_numero_orden)
                      }}
                    >
                      Boleta
                    </button>
                    <button type="button" className="btn btn-success mx-2" onClick={() => editarComanda(comanda)}>
                      Editar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </form>
      <FacturaPopUp
        popUp={popUp}
        closePopUp={() => setPopUp(false)}
        idNumeroOrden={idNumeroOrden}
        actualizarComandas={obtenerComandasListas}
        detallesPreparacion={detallesPreparacion}
        setDetallesPreparacion={setDetallesPreparacion}
        actualizarDetalle1={obtenerDetalles}
      />
    </div>
  )
}

export default RegistroComanda
