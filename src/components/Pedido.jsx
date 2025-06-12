"use client"

import { useState, useEffect } from "react"
import Axios from "axios"

const ComandasCocina = () => {
  const [comandas, setComandas] = useState([])
  const [comandasPreparacion, setComandasPreparacion] = useState([])
  const [comandasEntregadas, setComandasEntregadas] = useState([])
  const [isUserActive, setIsUserActive] = useState(true)
  const [ultimaActualizacion, setUltimaActualizacion] = useState(new Date())
  const [nuevasComandas, setNuevasComandas] = useState([])
  const [sonidoHabilitado, setSonidoHabilitado] = useState(true)

  // Función para reproducir sonido de notificación
  const reproducirSonido = () => {
    if (sonidoHabilitado) {
      // Crear un sonido simple usando Web Audio API
      const audioContext = new (window.AudioContext || window.webkitAudioContext)()
      const oscillator = audioContext.createOscillator()
      const gainNode = audioContext.createGain()

      oscillator.connect(gainNode)
      gainNode.connect(audioContext.destination)

      oscillator.frequency.setValueAtTime(800, audioContext.currentTime)
      oscillator.frequency.setValueAtTime(600, audioContext.currentTime + 0.1)
      oscillator.frequency.setValueAtTime(800, audioContext.currentTime + 0.2)

      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime)
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3)

      oscillator.start(audioContext.currentTime)
      oscillator.stop(audioContext.currentTime + 0.3)
    }
  }

  // Función para mostrar notificación del navegador
  const mostrarNotificacion = (titulo, mensaje) => {
    if (Notification.permission === "granted") {
      new Notification(titulo, {
        body: mensaje,
        icon: "/favicon.ico",
        badge: "/favicon.ico",
      })
    }
  }

  // Solicitar permisos de notificación al cargar
  useEffect(() => {
    if (Notification.permission === "default") {
      Notification.requestPermission()
    }
  }, [])

  const obtenerComandas = async (mostrarNotificaciones = false) => {
    try {
      const response = await Axios.get("http://localhost:5001/comandas3")
      console.log("Respuesta de la API:", response.data)

      if (response.status === 200 && Array.isArray(response.data)) {
        const nuevasComandasData = response.data.filter((comanda) => comanda.estado_detalle === 1)
        const comandasPreparacionData = response.data.filter((comanda) => comanda.estado_detalle === 2)
        const comandasEntregadasData = response.data.filter((comanda) => comanda.estado_detalle === 3)

        // Detectar nuevas comandas si no es la primera carga
        if (mostrarNotificaciones && comandas.length > 0) {
          const comandasAnteriores = comandas.map((c) => c.id_detalle)
          const comandasNuevasDetectadas = nuevasComandasData.filter(
            (comanda) => !comandasAnteriores.includes(comanda.id_detalle),
          )

          if (comandasNuevasDetectadas.length > 0) {
            // Reproducir sonido
            reproducirSonido()

            // Mostrar notificación
            mostrarNotificacion("🍳 Nueva Comanda!", `${comandasNuevasDetectadas.length} nueva(s) comanda(s) en cocina`)

            // Marcar comandas como nuevas temporalmente
            setNuevasComandas(comandasNuevasDetectadas.map((c) => c.id_detalle))
            setTimeout(() => setNuevasComandas([]), 5000) // Quitar highlight después de 5 segundos
          }
        }

        setComandas(nuevasComandasData)
        setComandasPreparacion(comandasPreparacionData)
        setComandasEntregadas(comandasEntregadasData)
        setUltimaActualizacion(new Date())
      }
    } catch (error) {
      console.error("Error al obtener comandas:", error)
    }
  }

  // Efecto principal para cargar comandas
  useEffect(() => {
    // Carga inicial
    obtenerComandas(false)

    // Configurar intervalo de actualización
    const interval = setInterval(() => {
      obtenerComandas(true) // Habilitar notificaciones en actualizaciones automáticas
    }, 3000) // Actualizar cada 3 segundos

    return () => clearInterval(interval)
  }, [])

  // Detectar actividad del usuario
  useEffect(() => {
    let activityTimeout

    const resetActivity = () => {
      setIsUserActive(true)
      clearTimeout(activityTimeout)
      activityTimeout = setTimeout(() => setIsUserActive(false), 30000)
    }

    window.addEventListener("mousemove", resetActivity)
    window.addEventListener("keydown", resetActivity)
    window.addEventListener("scroll", resetActivity)
    window.addEventListener("click", resetActivity)

    activityTimeout = setTimeout(() => setIsUserActive(false), 30000)

    return () => {
      window.removeEventListener("mousemove", resetActivity)
      window.removeEventListener("keydown", resetActivity)
      window.removeEventListener("scroll", resetActivity)
      window.removeEventListener("click", resetActivity)
      clearTimeout(activityTimeout)
    }
  }, [])

  const cambiarEstadoComanda = async (id, nuevoEstado) => {
    try {
      const requestBody = { estado_detalle: nuevoEstado }
      if (nuevoEstado === 3) {
        requestBody.fecha_entrega = new Date().toISOString().slice(0, 19).replace("T", " ")
      }
      await Axios.put(`http://localhost:5001/comandas3/${id}`, requestBody)

      // Actualizar inmediatamente después del cambio
      obtenerComandas(false)
    } catch (error) {
      console.error("Error al cambiar el estado de la comanda:", error)
    }
  }

  const marcarComandaEntregada = async (id) => {
    try {
      const fechaEntrega = new Date().toISOString().slice(0, 19).replace("T", " ")

      const response = await Axios.put(`http://localhost:5001/comandas3/${id}`, {
        estado_detalle: 3,
        fecha_entrega: fechaEntrega,
      })

      if (response.status === 200) {
        // Actualizar inmediatamente después del cambio
        obtenerComandas(false)
      }
    } catch (error) {
      console.error("Error al marcar la comanda como entregada:", error)
    }
  }

  const formatearTiempo = (fecha) => {
    const ahora = new Date()
    const fechaComanda = new Date(fecha)
    const diferencia = Math.floor((ahora - fechaComanda) / 1000 / 60) // en minutos

    if (diferencia < 1) return "Recién llegada"
    if (diferencia < 60) return `${diferencia} min`
    const horas = Math.floor(diferencia / 60)
    const minutos = diferencia % 60
    return `${horas}h ${minutos}m`
  }

  return (
    <div className="container mt-4">
      {/* Header con información de estado */}
      <div className="row mb-3">
        <div className="col-md-8">
          <h2>🍳 Comandas en Preparación</h2>
        </div>
        <div className="col-md-4 text-end">
          <div className="d-flex align-items-center justify-content-end gap-3">
            {/* Indicador de conexión */}
            <div className="d-flex align-items-center">
              <div
                className={`rounded-circle me-2`}
                style={{
                  width: "10px",
                  height: "10px",
                  backgroundColor: isUserActive ? "#28a745" : "#ffc107",
                }}
              ></div>
              <small className="text-muted">{isUserActive ? "Activo" : "Inactivo"}</small>
            </div>
            {/* Última actualización */}
            <small className="text-muted">Actualizado: {ultimaActualizacion.toLocaleTimeString()}</small>

            {/* Botón de actualización manual */}
            <button
              className="btn btn-sm btn-outline-primary"
              onClick={() => obtenerComandas(false)}
              title="Actualizar manualmente"
            >
              🔄
            </button>
          </div>
        </div>
      </div>

      {/* Contador de comandas */}
      <div className="row mb-3">
        <div className="col-md-12">
          <div className="alert alert-info d-flex justify-content-between align-items-center">
            <div>
              <strong>📊 Resumen:</strong>
              <span className="ms-2">
                🔥 En preparación: <span className="badge bg-warning text-dark">{comandas.length}</span>
              </span>
              <span className="ms-3">
                ✅ Listas: <span className="badge bg-success">{comandasPreparacion.length}</span>
              </span>
              <span className="ms-3">
                🚚 Entregadas: <span className="badge bg-secondary">{comandasEntregadas.length}</span>
              </span>
            </div>
            <div>
              <small>🔄 Actualización automática cada 3 segundos</small>
            </div>
          </div>
        </div>
      </div>

      {/* Tabla de comandas */}
      <table className="table table-bordered mt-3">
        <thead className="table-dark">
          <tr>
            <th>⏰ Tiempo</th>
            <th>👨‍🍳 Mesero</th>
            <th>🪑 Mesa</th>
            <th>🍽️ Pedido</th>
            <th>📊 Cantidad</th>
            <th>📝 Detalles</th>
            <th>⚡ Acciones</th>
          </tr>
        </thead>
        <tbody>
          {comandas.length === 0 ? (
            <tr>
              <td colSpan="7" className="text-center py-4">
                <div className="text-muted">
                  <h5>🎉 ¡No hay comandas pendientes!</h5>
                  <p>Todas las comandas están al día</p>
                </div>
              </td>
            </tr>
          ) : (
            comandas.map((comanda) => (
              <tr
                key={comanda.id_detalle}
                className={`${nuevasComandas.includes(comanda.id_detalle) ? "table-warning animate__animated animate__pulse" : ""}`}
                style={{
                  backgroundColor: nuevasComandas.includes(comanda.id_detalle) ? "#fff3cd" : "inherit",
                  transition: "background-color 0.5s ease",
                }}
              >
                <td>
                  <div>
                    <strong>{comanda.fecha_pedido?.slice(11, 19)}</strong>
                    <br />
                    <small className="text-muted">{formatearTiempo(comanda.fecha_pedido)}</small>
                  </div>
                </td>
                <td>
                  <strong>{comanda.nombre_empleado}</strong>
                </td>
                <td>
                  <span className="badge bg-primary fs-6">Mesa {comanda.numero_mesa}</span>
                </td>
                <td>
                  <strong>{comanda.nombre_plato}</strong>
                </td>
                <td>
                  <span className="badge bg-info fs-6">{comanda.cantidad}</span>
                </td>
                <td>
                  <small>{comanda.detalles || "Sin detalles"}</small>
                </td>
                <td>
                  <button
                    className="btn btn-success btn-sm"
                    onClick={() => cambiarEstadoComanda(comanda.id_detalle, 2)}
                    title="Marcar como lista"
                  >
                    ✅ Lista
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      {/* Información adicional */}
      <div className="row mt-4">
        <div className="col-md-12">
          <div className="card">
            <div className="card-body">
              <h6 className="card-title">ℹ️ Información del Sistema</h6>
              <ul className="list-unstyled mb-0">
                <li>
                  🔄 <strong>Actualización automática:</strong> Cada 3 segundos
                </li>
                <li>
                  🔊 <strong>Notificaciones de sonido:</strong> {sonidoHabilitado ? "Activadas" : "Desactivadas"}
                </li>
                <li>
                  📱 <strong>Notificaciones del navegador:</strong>{" "}
                  {Notification.permission === "granted" ? "Permitidas" : "No permitidas"}
                </li>
                <li>
                  ⚡ <strong>Estado de actividad:</strong> {isUserActive ? "Usuario activo" : "Usuario inactivo"}
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ComandasCocina
