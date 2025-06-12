"use client"

import { useEffect, useState } from "react"
import { useLocation } from "react-router-dom"
import "bootstrap/dist/css/bootstrap.min.css"

const PagoResultado = () => {
  const [resultado, setResultado] = useState(null)
  const location = useLocation()

  useEffect(() => {
    const params = new URLSearchParams(location.search)
    const status = params.get("status")
    const order = params.get("order")
    const amount = params.get("amount")
    const auth = params.get("auth")
    const message = params.get("message")

    setResultado({
      status,
      order,
      amount,
      auth,
      message,
    })
  }, [location])

  const getStatusInfo = (status) => {
    switch (status) {
      case "success":
        return {
          title: "¡Pago Exitoso!",
          icon: "✅",
          class: "alert-success",
          message: "Tu pago ha sido procesado correctamente.",
        }
      case "failed":
        return {
          title: "Pago Rechazado",
          icon: "❌",
          class: "alert-danger",
          message: "El pago no pudo ser procesado.",
        }
      case "error":
        return {
          title: "Error en el Pago",
          icon: "⚠️",
          class: "alert-warning",
          message: "Ocurrió un error durante el proceso de pago.",
        }
      default:
        return {
          title: "Procesando...",
          icon: "⏳",
          class: "alert-info",
          message: "Procesando información del pago...",
        }
    }
  }

  if (!resultado) {
    return (
      <div className="container mt-5">
        <div className="row justify-content-center">
          <div className="col-md-6">
            <div className="text-center">
              <div className="spinner-border" role="status">
                <span className="visually-hidden">Cargando...</span>
              </div>
              <p className="mt-3">Procesando resultado del pago...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const statusInfo = getStatusInfo(resultado.status)

  return (
    <div className="container mt-5">
      <div className="row justify-content-center">
        <div className="col-md-8">
          <div className={`alert ${statusInfo.class}`} role="alert">
            <div className="text-center">
              <h1 className="display-4">{statusInfo.icon}</h1>
              <h2 className="alert-heading">{statusInfo.title}</h2>
              <p className="lead">{statusInfo.message}</p>
              <hr />

              {resultado.order && (
                <p>
                  <strong>Número de Orden:</strong> {resultado.order}
                </p>
              )}

              {resultado.amount && (
                <p>
                  <strong>Monto:</strong> ${Number(resultado.amount).toLocaleString()}
                </p>
              )}

              {resultado.auth && (
                <p>
                  <strong>Código de Autorización:</strong> {resultado.auth}
                </p>
              )}

              {resultado.message && resultado.status === "error" && (
                <p>
                  <strong>Detalle del Error:</strong> {decodeURIComponent(resultado.message)}
                </p>
              )}

              <div className="mt-4">
                <button className="btn btn-primary me-3" onClick={() => (window.location.href = "/")}>
                  Volver al Inicio
                </button>

                {resultado.status === "success" && (
                  <button className="btn btn-success" onClick={() => window.print()}>
                    Imprimir Comprobante
                  </button>
                )}
              </div>
            </div>
          </div>

          {resultado.status === "success" && (
            <div className="card mt-4">
              <div className="card-header">
                <h5>Comprobante de Pago</h5>
              </div>
              <div className="card-body">
                <div className="row">
                  <div className="col-6">
                    <p>
                      <strong>Fecha:</strong> {new Date().toLocaleDateString()}
                    </p>
                    <p>
                      <strong>Hora:</strong> {new Date().toLocaleTimeString()}
                    </p>
                  </div>
                  <div className="col-6">
                    <p>
                      <strong>Estado:</strong> <span className="badge bg-success">Aprobado</span>
                    </p>
                    <p>
                      <strong>Método:</strong> WebPay Plus
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default PagoResultado
