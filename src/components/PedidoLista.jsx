"use client"

import { useState, useEffect } from "react"
import Axios from "axios"
import "../styles/ListaPedido.css"

const ComandasVendidas = () => {
  const [comandas, setComandas] = useState([])
  const [comandasOriginales, setComandasOriginales] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  // Estados de filtros
  const [filtros, setFiltros] = useState({
    fechaSeleccionada: new Date().toISOString().split("T")[0],
    fechaDesde: "",
    fechaHasta: "",
  })

  // Estados de configuración
  const [paginaActual, setPaginaActual] = useState(1)
  const [comandasPorPagina, setComandasPorPagina] = useState(15)
  const [ordenamiento, setOrdenamiento] = useState("fecha_desc")
  const [vistaCompacta, setVistaCompacta] = useState(false)

  // Estados del sistema
  const [ultimaActualizacion, setUltimaActualizacion] = useState(new Date())
  const [sonidoHabilitado, setSonidoHabilitado] = useState(true)
  const [comandaSeleccionada, setComandaSeleccionada] = useState(null)

  // Estados de estadísticas
  const [estadisticas, setEstadisticas] = useState({
    totalVentas: 0,
    totalComandas: 0,
    promedioVenta: 0,
    comandasPagadas: 0,
    comandasPorPagar: 0,
    tasaPago: 0,
  })

  // Función para reproducir sonido
  const reproducirSonido = (tipo = "success") => {
    if (!sonidoHabilitado) return

    const audioContext = new (window.AudioContext || window.webkitAudioContext)()
    const oscillator = audioContext.createOscillator()
    const gainNode = audioContext.createGain()

    oscillator.connect(gainNode)
    gainNode.connect(audioContext.destination)

    if (tipo === "success") {
      oscillator.frequency.setValueAtTime(800, audioContext.currentTime)
      oscillator.frequency.setValueAtTime(600, audioContext.currentTime + 0.1)
      oscillator.frequency.setValueAtTime(800, audioContext.currentTime + 0.2)
    }

    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime)
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3)

    oscillator.start(audioContext.currentTime)
    oscillator.stop(audioContext.currentTime + 0.3)
  }

  // Obtener comandas del servidor
  const obtenerComandas = async () => {
    try {
      setLoading(true)
      setError("")
      const response = await Axios.get("http://localhost:5001/comandas4")

      if (response.status === 200 && Array.isArray(response.data)) {
        setComandasOriginales(response.data)
        setUltimaActualizacion(new Date())
        calcularEstadisticas(response.data)
      }
    } catch (error) {
      console.error("Error al obtener comandas:", error)
      setError("Error al cargar las comandas vendidas. Intenta nuevamente.")
      reproducirSonido("warning")
    } finally {
      setLoading(false)
    }
  }

  // Calcular estadísticas
  const calcularEstadisticas = (todasComandas) => {
    const totalComandas = todasComandas.length
    const totalVentas = todasComandas.reduce((total, comanda) => {
      return total + (comanda.precio_unitario || 0) * (comanda.cantidad || 1)
    }, 0)

    const promedioVenta = totalComandas > 0 ? totalVentas / totalComandas : 0

    // Contar por estados de pago
    const comandasPagadas = todasComandas.filter((c) => c.estado === "Pagado").length
    const comandasPorPagar = todasComandas.filter((c) => c.estado === "Por pagar").length

    // Calcular tasa de pago
    const tasaPago = totalComandas > 0 ? Math.round((comandasPagadas / totalComandas) * 100) : 0

    setEstadisticas({
      totalVentas,
      totalComandas,
      promedioVenta,
      comandasPagadas,
      comandasPorPagar,
      tasaPago,
    })
  }

  // Aplicar filtros
  const aplicarFiltros = () => {
    let comandasFiltradas = [...comandasOriginales]

    // Filtro por fecha específica
    if (filtros.fechaSeleccionada) {
      comandasFiltradas = comandasFiltradas.filter((comanda) => {
        const fechaComanda = new Date(comanda.fecha_pedido).toISOString().split("T")[0]
        return fechaComanda === filtros.fechaSeleccionada
      })
    }

    // Filtro por rango de fechas
    if (filtros.fechaDesde && filtros.fechaHasta) {
      comandasFiltradas = comandasFiltradas.filter((comanda) => {
        const fechaComanda = new Date(comanda.fecha_pedido).toISOString().split("T")[0]
        return fechaComanda >= filtros.fechaDesde && fechaComanda <= filtros.fechaHasta
      })
    }

    // Aplicar ordenamiento
    comandasFiltradas.sort((a, b) => {
      switch (ordenamiento) {
        case "fecha_asc":
          return new Date(a.fecha_pedido) - new Date(b.fecha_pedido)
        case "fecha_desc":
          return new Date(b.fecha_pedido) - new Date(a.fecha_pedido)
        case "precio_desc":
          return b.precio_unitario * b.cantidad - a.precio_unitario * a.cantidad
        case "precio_asc":
          return a.precio_unitario * a.cantidad - b.precio_unitario * a.cantidad
        case "mesa_asc":
          return a.numero_mesa - b.numero_mesa
        case "mesa_desc":
          return b.numero_mesa - a.numero_mesa
        case "orden_asc":
          return a.id_numero_orden - b.id_numero_orden
        case "orden_desc":
          return b.id_numero_orden - a.id_numero_orden
        default:
          return new Date(b.fecha_pedido) - new Date(a.fecha_pedido)
      }
    })

    setComandas(comandasFiltradas)
    setPaginaActual(1)
    calcularEstadisticas(comandasFiltradas)
  }

  // Funciones de utilidad
  const formatearTiempo = (fechaPedido, fechaEntrega) => {
    if (!fechaEntrega) return { texto: "No entregado", clase: "text-muted" }

    const tiempoMs = new Date(fechaEntrega) - new Date(fechaPedido)
    if (tiempoMs < 0) return { texto: "Tiempo inválido", clase: "text-danger" }

    const minutos = Math.floor(tiempoMs / (1000 * 60))
    const horas = Math.floor(minutos / 60)
    const mins = minutos % 60

    if (horas > 0) {
      return {
        texto: `${horas}h ${mins}m`,
        clase: horas > 1 ? "text-warning" : "text-info",
      }
    } else {
      return {
        texto: `${minutos}m`,
        clase: minutos > 30 ? "text-warning" : "text-success",
      }
    }
  }

  const obtenerBadgeEstado = (estado) => {
    switch (estado) {
      case "Pagado":
        return { class: "bg-success text-white", text: "💰 Pagado" }
      case "Por pagar":
        return { class: "bg-warning text-dark", text: "⏳ Por Pagar" }
      default:
        return { class: "bg-secondary text-white", text: "❓ Desconocido" }
    }
  }

  const formatearPrecio = (precio) => {
    return new Intl.NumberFormat("es-CL", {
      style: "currency",
      currency: "CLP",
    }).format(precio)
  }

  // Funciones para filtros rápidos de fecha
  const establecerFechaRapida = (tipo) => {
    const hoy = new Date()
    const ayer = new Date(hoy)
    ayer.setDate(hoy.getDate() - 1)

    const formatearFecha = (fecha) => fecha.toISOString().split("T")[0]

    switch (tipo) {
      case "hoy":
        setFiltros((prev) => ({
          ...prev,
          fechaSeleccionada: formatearFecha(hoy),
          fechaDesde: "",
          fechaHasta: "",
        }))
        break
      case "ayer":
        setFiltros((prev) => ({
          ...prev,
          fechaSeleccionada: formatearFecha(ayer),
          fechaDesde: "",
          fechaHasta: "",
        }))
        break
      case "semana":
        const inicioSemana = new Date(hoy)
        inicioSemana.setDate(hoy.getDate() - 7)
        setFiltros((prev) => ({
          ...prev,
          fechaSeleccionada: "",
          fechaDesde: formatearFecha(inicioSemana),
          fechaHasta: formatearFecha(hoy),
        }))
        break
      case "mes":
        const inicioMes = new Date(hoy)
        inicioMes.setDate(hoy.getDate() - 30)
        setFiltros((prev) => ({
          ...prev,
          fechaSeleccionada: "",
          fechaDesde: formatearFecha(inicioMes),
          fechaHasta: formatearFecha(hoy),
        }))
        break
      case "limpiar":
        setFiltros((prev) => ({
          ...prev,
          fechaSeleccionada: "",
          fechaDesde: "",
          fechaHasta: "",
        }))
        break
    }
  }

  // Effects
  useEffect(() => {
    obtenerComandas()
  }, [])

  useEffect(() => {
    aplicarFiltros()
  }, [comandasOriginales, filtros, ordenamiento])

  // Paginación
  const indiceUltimo = paginaActual * comandasPorPagina
  const indicePrimero = indiceUltimo - comandasPorPagina
  const comandasActuales = comandas.slice(indicePrimero, indiceUltimo)
  const totalPaginas = Math.ceil(comandas.length / comandasPorPagina)

  if (loading) {
    return (
      <div className="container mt-4">
        <div className="text-center py-5">
          <div className="spinner-border text-primary" style={{ width: "3rem", height: "3rem" }}>
            <span className="visually-hidden">Cargando...</span>
          </div>
          <h4 className="mt-3 text-primary">🔄 Cargando comandas vendidas...</h4>
          <p className="text-muted">Obteniendo información de ventas del servidor</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container-fluid mt-4">
      {/* Header Principal */}
      <div className="row mb-4">
        <div className="col-md-8">
          <h1 className="display-6 mb-2">
            💰 Lista de Comandas Vendidas
            <span className="badge bg-success ms-3">{comandas.length}</span>
          </h1>
          <p className="text-muted">
            Historial comandas • Última actualización: {ultimaActualizacion.toLocaleTimeString()}
          </p>
        </div>
        <div className="col-md-4 text-end">
          <div className="btn-group me-2">
            <button className="btn btn-primary" onClick={obtenerComandas}>
              <i className="fas fa-sync-alt me-1"></i> Actualizar
            </button>
            <button
              className={`btn ${sonidoHabilitado ? "btn-warning" : "btn-outline-secondary"}`}
              onClick={() => setSonidoHabilitado(!sonidoHabilitado)}
            >
              <i className={`fas ${sonidoHabilitado ? "fa-volume-up" : "fa-volume-mute"}`}></i>
            </button>
          </div>
        </div>
      </div>

      {/* Dashboard de Estadísticas */}
      <div className="row mb-4">
        <div className="col-lg-2 col-md-4 col-sm-6 mb-3">
          <div className="card bg-success text-white h-100">
            <div className="card-body text-center">
              <i className="fas fa-dollar-sign fa-2x mb-2"></i>
              <h4 className="mb-1">{formatearPrecio(estadisticas.totalVentas)}</h4>
              <small>Total Ventas</small>
            </div>
          </div>
        </div>
        <div className="col-lg-2 col-md-4 col-sm-6 mb-3">
          <div className="card bg-primary text-white h-100">
            <div className="card-body text-center">
              <i className="fas fa-receipt fa-2x mb-2"></i>
              <h3 className="mb-1">{estadisticas.totalComandas}</h3>
              <small>Total Comandas</small>
            </div>
          </div>
        </div>
        <div className="col-lg-2 col-md-4 col-sm-6 mb-3">
          <div className="card bg-info text-white h-100">
            <div className="card-body text-center">
              <i className="fas fa-chart-line fa-2x mb-2"></i>
              <h4 className="mb-1">{formatearPrecio(estadisticas.promedioVenta)}</h4>
              <small>Promedio Venta</small>
            </div>
          </div>
        </div>
        <div className="col-lg-2 col-md-4 col-sm-6 mb-3">
          <div className="card bg-dark text-white h-100">
            <div className="card-body text-center">
              <i className="fas fa-check-circle fa-2x mb-2"></i>
              <h3 className="mb-1">{estadisticas.comandasPagadas}</h3>
              <small>Pagadas</small>
            </div>
          </div>
        </div>
        <div className="col-lg-2 col-md-4 col-sm-6 mb-3">
          <div className="card bg-warning text-dark h-100">
            <div className="card-body text-center">
              <i className="fas fa-clock fa-2x mb-2"></i>
              <h3 className="mb-1">{estadisticas.comandasPorPagar}</h3>
              <small>Por Pagar</small>
            </div>
          </div>
        </div>
        <div className="col-lg-2 col-md-4 col-sm-6 mb-3">
          <div className="card bg-secondary text-white h-100">
            <div className="card-body text-center">
              <i className="fas fa-percentage fa-2x mb-2"></i>
              <h4 className="mb-1">{estadisticas.tasaPago}%</h4>
              <small>Tasa Pago</small>
            </div>
          </div>
        </div>
      </div>

      {/* Panel de Filtros de Fecha Prominente */}
      <div className="card mb-4 border-success">
        <div className="card-header bg-success text-white">
          <h5 className="mb-0">
            <i className="fas fa-calendar-alt me-2"></i>
            Filtros por Fecha
          </h5>
        </div>
        <div className="card-body">
          <div className="row align-items-end">
            <div className="col-md-3">
              <label className="form-label fw-bold">📅 Fecha Específica</label>
              <input
                type="date"
                className="form-control"
                value={filtros.fechaSeleccionada}
                onChange={(e) =>
                  setFiltros((prev) => ({
                    ...prev,
                    fechaSeleccionada: e.target.value,
                    fechaDesde: "",
                    fechaHasta: "",
                  }))
                }
                max={new Date().toISOString().split("T")[0]}
              />
            </div>
            <div className="col-md-2">
              <label className="form-label fw-bold">📅 Desde</label>
              <input
                type="date"
                className="form-control"
                value={filtros.fechaDesde}
                onChange={(e) =>
                  setFiltros((prev) => ({
                    ...prev,
                    fechaDesde: e.target.value,
                    fechaSeleccionada: "",
                  }))
                }
                max={new Date().toISOString().split("T")[0]}
              />
            </div>
            <div className="col-md-2">
              <label className="form-label fw-bold">📅 Hasta</label>
              <input
                type="date"
                className="form-control"
                value={filtros.fechaHasta}
                onChange={(e) =>
                  setFiltros((prev) => ({
                    ...prev,
                    fechaHasta: e.target.value,
                    fechaSeleccionada: "",
                  }))
                }
                max={new Date().toISOString().split("T")[0]}
              />
            </div>
            <div className="col-md-5">
              <label className="form-label fw-bold">⚡ Filtros Rápidos</label>
              <div className="btn-group w-100" role="group">
                <button className="btn btn-outline-success btn-sm" onClick={() => establecerFechaRapida("hoy")}>
                  Hoy
                </button>
                <button className="btn btn-outline-success btn-sm" onClick={() => establecerFechaRapida("ayer")}>
                  Ayer
                </button>
                <button className="btn btn-outline-success btn-sm" onClick={() => establecerFechaRapida("semana")}>
                  7 días
                </button>
                <button className="btn btn-outline-success btn-sm" onClick={() => establecerFechaRapida("mes")}>
                  30 días
                </button>
                <button className="btn btn-outline-secondary btn-sm" onClick={() => establecerFechaRapida("limpiar")}>
                  <i className="fas fa-times"></i>
                </button>
              </div>
            </div>
          </div>

          {(filtros.fechaSeleccionada || filtros.fechaDesde || filtros.fechaHasta) && (
            <div className="mt-3">
              <div className="alert alert-success mb-0">
                <i className="fas fa-info-circle me-2"></i>
                <strong>Filtro de fecha activo:</strong>
                {filtros.fechaSeleccionada
                  ? ` ${new Date(filtros.fechaSeleccionada).toLocaleDateString()}`
                  : filtros.fechaDesde && filtros.fechaHasta
                    ? ` Del ${new Date(filtros.fechaDesde).toLocaleDateString()} al ${new Date(filtros.fechaHasta).toLocaleDateString()}`
                    : filtros.fechaDesde
                      ? ` Desde ${new Date(filtros.fechaDesde).toLocaleDateString()}`
                      : ` Hasta ${new Date(filtros.fechaHasta).toLocaleDateString()}`}
                <button
                  className="btn btn-sm btn-outline-success ms-2"
                  onClick={() => establecerFechaRapida("limpiar")}
                >
                  Quitar filtro
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Indicadores de Filtros Activos */}
      {(filtros.fechaSeleccionada || filtros.fechaDesde || filtros.fechaHasta || ordenamiento !== "fecha_desc") && (
        <div className="alert alert-info mb-4">
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <i className="fas fa-filter me-2"></i>
              <strong>Filtros activos:</strong>
              {(filtros.fechaSeleccionada || filtros.fechaDesde || filtros.fechaHasta) && (
                <span className="badge bg-primary ms-1">Fechas</span>
              )}
              {ordenamiento !== "fecha_desc" && <span className="badge bg-secondary ms-1">Ordenamiento</span>}
            </div>
            <span className="badge bg-success fs-6">{comandas.length} resultados</span>
          </div>
        </div>
      )}

      {error && (
        <div className="alert alert-danger mb-4">
          <i className="fas fa-exclamation-triangle me-2"></i>
          {error}
        </div>
      )}

      {/* Tabla de Comandas Vendidas */}
      <div className="card">
        <div className="card-header bg-dark text-white">
          <div className="d-flex justify-content-between align-items-center">
            <h5 className="mb-0">
              <i className="fas fa-cash-register me-2"></i>
              Lista de Comandas Vendidas
            </h5>
            <div>
              <span className="badge bg-light text-dark me-2">{comandas.length} comandas</span>
              <small>
                Página {paginaActual} de {totalPaginas}
              </small>
            </div>
          </div>
        </div>
        <div className="card-body p-0">
          <div className="table-responsive">
            <table className="table table-hover mb-0">
              <thead className="table-dark">
                <tr>
                  <th style={{ width: "8%" }}>📋 N° Orden</th>
                  <th style={{ width: "15%" }}>👨‍🍳 Mesero</th>
                  <th style={{ width: "8%" }}>🪑 Mesa</th>
                  <th style={{ width: "20%" }}>🍽️ Pedido</th>
                  <th style={{ width: "8%" }}>📊 Cant.</th>
                  <th style={{ width: "10%" }}>⏰ H. Pedido</th>
                  {!vistaCompacta && <th style={{ width: "10%" }}>🚚 H. Entrega</th>}
                  {!vistaCompacta && <th style={{ width: "10%" }}>⏱️ Tiempo</th>}
                  <th style={{ width: "11%" }}>💰 Total</th>
                  <th style={{ width: "10%" }}>🏷️ Estado</th>
                </tr>
              </thead>
              <tbody>
                {comandasActuales.length === 0 ? (
                  <tr>
                    <td colSpan={vistaCompacta ? "7" : "9"} className="text-center py-5">
                      <div className="text-muted">
                        <i className="fas fa-search fa-3x mb-3 opacity-50"></i>
                        <h4>No se encontraron comandas vendidas</h4>
                        <p>No hay comandas que coincidan con los filtros seleccionados</p>
                        <button
                          className="btn btn-primary"
                          onClick={() => {
                            setFiltros({
                              fechaSeleccionada: new Date().toISOString().split("T")[0],
                              fechaDesde: "",
                              fechaHasta: "",
                            })
                          }}
                        >
                          <i className="fas fa-filter-circle-xmark me-1"></i> Limpiar filtros
                        </button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  comandasActuales.map((comanda) => {
                    const tiempo = formatearTiempo(comanda.fecha_pedido, comanda.fecha_entrega)
                    const estadoBadge = obtenerBadgeEstado(comanda.estado)
                    const precioTotal = (comanda.precio_unitario || 0) * (comanda.cantidad || 1)

                    return (
                      <tr
                        key={`${comanda.id_numero_orden}-${comanda.id_detalle}`}
                        className={`
                          ${comanda.estado === "Por pagar" ? "table-warning" : ""}
                          ${comandaSeleccionada === comanda.id_detalle ? "table-info" : ""}
                        `}
                        onClick={() =>
                          setComandaSeleccionada(comandaSeleccionada === comanda.id_detalle ? null : comanda.id_detalle)
                        }
                        style={{ cursor: "pointer" }}
                      >
                        <td className="text-center">
                          <span className="badge bg-primary fs-6">#{comanda.id_numero_orden}</span>
                        </td>
                        <td>
                          <div className="d-flex align-items-center">
                            <div
                              className="avatar-sm bg-success text-white rounded-circle d-flex align-items-center justify-content-center me-2"
                              style={{ width: "32px", height: "32px", fontSize: "12px" }}
                            >
                              {comanda.nombre_empleado?.charAt(0) || "?"}
                            </div>
                            <div>
                              <strong>
                                {comanda.nombre_empleado} {comanda.apellido}
                              </strong>
                              {comandaSeleccionada === comanda.id_detalle && (
                                <div>
                                  <small className="text-muted">ID: #{comanda.id_detalle}</small>
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="text-center">
                          <span className="badge bg-info fs-6">Mesa {comanda.numero_mesa}</span>
                        </td>
                        <td>
                          <div>
                            <strong className="d-block">{comanda.nombre_plato}</strong>
                            <small className="text-muted">{formatearPrecio(comanda.precio_unitario)} c/u</small>
                          </div>
                        </td>
                        <td className="text-center">
                          <span className="badge bg-secondary fs-6">{comanda.cantidad}</span>
                        </td>
                        <td>
                          <strong>{comanda.fecha_pedido?.slice(11, 19)}</strong>
                        </td>
                        {!vistaCompacta && (
                          <td>
                            <span className={tiempo.clase}>
                              {comanda.fecha_entrega ? comanda.fecha_entrega.slice(11, 19) : "No entregado"}
                            </span>
                          </td>
                        )}
                        {!vistaCompacta && (
                          <td>
                            <span
                              className={`badge ${tiempo.clase.includes("success") ? "bg-success" : tiempo.clase.includes("warning") ? "bg-warning text-dark" : "bg-secondary"}`}
                            >
                              {tiempo.texto}
                            </span>
                          </td>
                        )}
                        <td>
                          <div className="fw-bold text-success fs-6">{formatearPrecio(precioTotal)}</div>
                        </td>
                        <td>
                          <span className={`badge ${estadoBadge.class}`}>{estadoBadge.text}</span>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer con Paginación */}
        <div className="card-footer bg-light">
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <small className="text-muted">
                Mostrando {comandasActuales.length > 0 ? indicePrimero + 1 : 0} a{" "}
                {Math.min(indiceUltimo, comandas.length)} de {comandas.length} comandas
              </small>
            </div>

            {totalPaginas > 1 && (
              <nav>
                <ul className="pagination pagination-sm mb-0">
                  <li className={`page-item ${paginaActual === 1 ? "disabled" : ""}`}>
                    <button className="page-link" onClick={() => setPaginaActual(1)} disabled={paginaActual === 1}>
                      <i className="fas fa-angle-double-left"></i>
                    </button>
                  </li>
                  <li className={`page-item ${paginaActual === 1 ? "disabled" : ""}`}>
                    <button
                      className="page-link"
                      onClick={() => setPaginaActual(paginaActual - 1)}
                      disabled={paginaActual === 1}
                    >
                      <i className="fas fa-angle-left"></i>
                    </button>
                  </li>

                  {Array.from({ length: Math.min(5, totalPaginas) }, (_, i) => {
                    const startPage = Math.max(1, paginaActual - 2)
                    const endPage = Math.min(totalPaginas, startPage + 4)
                    const adjustedStartPage = Math.max(1, endPage - 4)
                    const pageNum = adjustedStartPage + i

                    if (pageNum <= totalPaginas) {
                      return (
                        <li key={pageNum} className={`page-item ${paginaActual === pageNum ? "active" : ""}`}>
                          <button className="page-link" onClick={() => setPaginaActual(pageNum)}>
                            {pageNum}
                          </button>
                        </li>
                      )
                    }
                    return null
                  })}

                  <li className={`page-item ${paginaActual === totalPaginas ? "disabled" : ""}`}>
                    <button
                      className="page-link"
                      onClick={() => setPaginaActual(paginaActual + 1)}
                      disabled={paginaActual === totalPaginas}
                    >
                      <i className="fas fa-angle-right"></i>
                    </button>
                  </li>
                  <li className={`page-item ${paginaActual === totalPaginas ? "disabled" : ""}`}>
                    <button
                      className="page-link"
                      onClick={() => setPaginaActual(totalPaginas)}
                      disabled={paginaActual === totalPaginas}
                    >
                      <i className="fas fa-angle-double-right"></i>
                    </button>
                  </li>
                </ul>
              </nav>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default ComandasVendidas
