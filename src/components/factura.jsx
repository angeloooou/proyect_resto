"use client"

import { useState, useEffect } from "react"
import Axios from "axios"
import Swal from "sweetalert2"
import jsPDF from "jspdf"
import "bootstrap/dist/css/bootstrap.css"

const FacturaPopUp = ({
  popUp,
  closePopUp,
  idNumeroOrden,
  actualizarComandas,
  detallesPreparacion,
  setDetallesPreparacion,
  actualizarDetalle1,
}) => {
  const [factura, setFactura] = useState(null)

  useEffect(() => {
    if (popUp && idNumeroOrden) {
      Axios.get(`http://localhost:5001/ventas/${idNumeroOrden}`)
        .then((response) => {
          const detallesFiltrados = response.data.detalles.filter(
            (detalle) => Number.parseInt(detalle.estado_detalle, 10) !== 6,
          )
          const totalFactura = detallesFiltrados.reduce((acc, detalle) => acc + detalle.total_parcial, 0)
          setFactura({
            ...response.data,
            detalles: detallesFiltrados,
            totalFactura,
          })
        })
        .catch((error) => console.error("Error al obtener la factura:", error))
    }
  }, [popUp, idNumeroOrden])

  const generarPDF = () => {
    if (!factura) return
    const doc = new jsPDF()

    doc.setFont("courier", "bold")
    doc.setFontSize(12)
    doc.text("RUT: 11.111.111-1", 10, 10)
    doc.text("BOLETA ELECTRONICA", 10, 15)
    doc.text(`N° Boleta: ${idNumeroOrden}`, 10, 20)
    doc.setFont("courier", "normal")
    doc.text("ENACCION RESTAURANT", 10, 30)
    doc.text(`FECHA EMISION: ${new Date().toLocaleDateString()}`, 10, 35)
    doc.text("-------------------------------------------------", 10, 40)
    doc.setFont("courier", "bold")
    doc.text("CANTIDAD   DESCRIPCION            VALOR", 10, 45)
    doc.setFont("courier", "normal")
    let y = 55
    factura.detalles.forEach((detalle) => {
      doc.text(`${detalle.cantidad}          ${detalle.nombre_plato}         $${detalle.total_parcial}`, 20, y)
      y += 10
    })
    doc.text("-------------------------------------------------", 10, y)
    doc.setFont("courier", "bold")
    doc.text(`Total: $${factura.totalFactura}`, 100, y + 10)
    doc.setFontSize(10)
    doc.setFont("courier", "normal")
    doc.text(`El IVA de la Boleta: $${Math.round(factura.totalFactura * 0.19)}`, 77, y + 15)
    doc.setFontSize(12)
    doc.text("-------------------------------------------------", 10, y + 20)
    doc.setFontSize(10)
    doc.text("Timbre Electronico SII", 10, y + 25)
    doc.text("Res.74 de 2025", 10, y + 30)
    doc.text("DTE Generada con Rjc Software", 10, y + 35)
    doc.save(`Boleta ${idNumeroOrden}.pdf`)
  }

  const actualizarDetalle = async (idNumeroOrden) => {
    try {
      const response = await Axios.put("http://localhost:5001/detalle", {
        id_numero_orden: idNumeroOrden,
      })
      if (response.status === 200) {
        setDetallesPreparacion((prevDetalles) => prevDetalles.filter((detalle) => detalle.estado_detalle !== 5))
        actualizarDetalle1()
        console.log("Estado actualizado")
      }
    } catch (error) {
      console.error("Error al actualizar el estado")
    }
  }

  const iniciarPagoWebPay = async (numeroOrden, monto) => {
    try {
      // Mostrar loading
      Swal.fire({
        title: "Procesando...",
        text: "Iniciando pago con WebPay",
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading()
        },
      })

      console.log("Iniciando pago WebPay:", { numeroOrden, monto })

      const response = await Axios.post("http://localhost:5001/api/webpay/iniciar", {
        monto: monto,
        ordenCompra: `COMANDA-${numeroOrden}`,
        sessionId: `SESSION-${numeroOrden}-${Date.now()}`,
      })

      console.log("Respuesta WebPay:", response.data)

      if (response.data.success) {
        // Cerrar loading
        Swal.close()

        // Mostrar información antes de redirigir
        Swal.fire({
          title: "Redirigiendo a WebPay",
          text: "Serás redirigido al portal de pagos simulado",
          icon: "info",
          timer: 2000,
          showConfirmButton: false,
        })

        // Cerrar modal antes de redirigir
        closePopUp()

        // Redirigir a WebPay después de 2 segundos
        setTimeout(() => {
          window.open(`${response.data.url}?token_ws=${response.data.token}`, "_blank")
        }, 2000)
      } else {
        Swal.fire({
          title: "Error",
          text: response.data.message || "Error al iniciar el pago con WebPay",
          icon: "error",
        })
      }
    } catch (error) {
      console.error("Error completo:", error)
      Swal.fire({
        title: "Error de Conexión",
        text: `No se pudo conectar con el servidor: ${error.message}`,
        icon: "error",
      })
    }
  }

  const marcarBoletaPagada = async (id_numero_orden) => {
    try {
      const response = await Axios.put(`http://localhost:5001/comandas/${id_numero_orden}`, { id_estado: 5 })
      if (response.status === 200) {
        Swal.fire({
          title: "Éxito",
          text: "Factura pagada correctamente.",
          icon: "success",
        })
        actualizarComandas()
        closePopUp()
        actualizarDetalle(id_numero_orden)
      }
    } catch (error) {
      console.error("Error al marcar la factura como pagada:", error)
      Swal.fire({
        title: "Error",
        text: "Error al pagar la factura.",
        icon: "error",
      })
    }
  }

  // OPCIÓN MEJORADA: Generar Link y Mostrar Opciones
  const generarLinkPago = async () => {
    try {
      Swal.fire({
        title: "Generando link...",
        text: "Creando link de pago seguro",
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading()
        },
      })

      const response = await Axios.post("http://localhost:5001/api/webpay/iniciar", {
        monto: factura.totalFactura,
        ordenCompra: `COMANDA-${idNumeroOrden}`,
        sessionId: `SESSION-${idNumeroOrden}-${Date.now()}`,
      })

      if (response.data.success) {
        const linkPago = `${response.data.url}?token_ws=${response.data.token}`
        const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(linkPago)}`

        // Mostrar opciones para compartir el link
        const { value: opcion } = await Swal.fire({
          title: "🔗 Link de Pago Generado",
          html: `
            <div style="text-align: center; padding: 20px;">
              <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin: 15px 0;">
                <strong>Orden #${idNumeroOrden}</strong><br>
                <span style="color: #28a745; font-size: 18px; font-weight: bold;">
                  Total: $${factura.totalFactura.toLocaleString("es-CL")}
                </span>
              </div>
              
              <div style="margin: 20px 0;">
                <img src="${qrUrl}" alt="QR Code" style="border: 2px solid #ddd; border-radius: 8px; max-width: 200px;">
              </div>
              
              <p style="font-size: 14px; color: #666; margin: 15px 0;">
                ¿Cómo quieres compartir el link de pago?
              </p>
            </div>
          `,
          input: "radio",
          inputOptions: {
            whatsapp: "💬 Enviar a WhatsApp",
            email: "📧 Enviar por email",
            mostrar: "👁️ Solo mostrar el link",
          },
          inputValue: "copiar",
          showCancelButton: true,
          confirmButtonText: "Continuar",
          cancelButtonText: "Cerrar",
          confirmButtonColor: "#28a745",
          width: 500,
          inputValidator: (value) => {
            if (!value) {
              return "¡Selecciona una opción!"
            }
          },
        })

        if (opcion) {
          switch (opcion) {
            case "whatsapp":
              abrirWhatsApp(linkPago)
              break
            case "email":
              await enviarPorEmail(linkPago)
              break
            case "mostrar":
              mostrarLink(linkPago)
              break
          }
        }
      } else {
        throw new Error(response.data.message || "Error al generar el link")
      }
    } catch (error) {
      console.error("Error generando link:", error)
      Swal.fire({
        title: "Error ❌",
        text: "No se pudo generar el link de pago. Verifica tu conexión.",
        icon: "error",
        confirmButtonText: "Entendido",
      })
    }
  }

  const copiarAlPortapapeles = async (link) => {
    try {
      await navigator.clipboard.writeText(link)
      Swal.fire({
        title: "¡Copiado! 📋",
        html: `
          <div style="text-align: center;">
            <p>El link ha sido copiado al portapapeles</p>
            <div style="background: #e8f5e8; padding: 10px; border-radius: 5px; margin: 15px 0; font-family: monospace; font-size: 12px; word-break: break-all;">
              ${link}
            </div>
            <p style="color: #666; font-size: 14px;">
              Ahora puedes pegarlo en WhatsApp, SMS o donde prefieras
            </p>
          </div>
        `,
        icon: "success",
        confirmButtonText: "Perfecto",
        confirmButtonColor: "#28a745",
      })
    } catch (error) {
      // Fallback si no funciona clipboard
      mostrarLink(link)
    }
  }

  const abrirWhatsApp = (link) => {
    const mensaje = `🍽️ *ENACCION RESTAURANT*\n\n📋 *Orden #${idNumeroOrden}*\n💰 *Total: $${factura.totalFactura.toLocaleString("es-CL")}*\n\n🔗 Link de pago seguro:\n${link}\n\n✅ Paga fácil y seguro desde tu celular`
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(mensaje)}`

    window.open(whatsappUrl, "_blank")

    Swal.fire({
      title: "WhatsApp Abierto 💬",
      text: "Se abrió WhatsApp con el mensaje listo para enviar",
      icon: "success",
      confirmButtonText: "Perfecto",
      timer: 3000,
    })
  }

  const enviarPorEmail = async (link) => {
    const { value: email } = await Swal.fire({
      title: "📧 Enviar por Email",
      input: "email",
      inputPlaceholder: "cliente@ejemplo.com",
      inputAttributes: {
        autocapitalize: "off",
        autocorrect: "off",
      },
      showCancelButton: true,
      confirmButtonText: "Enviar",
      cancelButtonText: "Cancelar",
      inputValidator: (value) => {
        if (!value) return "¡Ingresa un email!"
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return "¡Email inválido!"
      },
    })

    if (email) {
      try {
        Swal.fire({
          title: "Enviando...",
          text: `Enviando a ${email}`,
          allowOutsideClick: false,
          didOpen: () => Swal.showLoading(),
        })

        const emailResponse = await Axios.post("http://localhost:5001/api/enviar-link-pago", {
          email: email,
          linkPago: link,
          numeroOrden: idNumeroOrden,
          monto: factura.totalFactura,
          detalles: factura.detalles,
        })

        if (emailResponse.data.success) {
          Swal.fire({
            title: "¡Enviado! ✅",
            text: `Email enviado exitosamente a ${email}`,
            icon: "success",
            confirmButtonText: "Perfecto",
          })
        } else {
          throw new Error(emailResponse.data.message)
        }
      } catch (error) {
        console.error("Error enviando email:", error)
        Swal.fire({
          title: "Error de Email ⚠️",
          html: `
            <p>No se pudo enviar el email automáticamente.</p>
            <p><strong>Alternativa:</strong> Copia el link y envíalo manualmente</p>
          `,
          icon: "warning",
          showCancelButton: true,
          confirmButtonText: "Copiar Link",
          cancelButtonText: "Cerrar",
        }).then((result) => {
          if (result.isConfirmed) {
            copiarAlPortapapeles(link)
          }
        })
      }
    }
  }

  const mostrarLink = (link) => {
    Swal.fire({
      title: "🔗 Link de Pago",
      html: `
        <div style="text-align: center;">
          <p>Comparte este link con el cliente:</p>
          <div style="background: #f8f9fa; padding: 15px; border-radius: 5px; margin: 15px 0; word-break: break-all; font-family: monospace; font-size: 12px; border: 1px solid #ddd;">
            ${link}
          </div>
          <button onclick="navigator.clipboard.writeText('${link}').then(() => alert('¡Copiado!'))" 
                  style="background: #28a745; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer;">
            📋 Copiar
          </button>
        </div>
      `,
      width: 600,
      confirmButtonText: "Cerrar",
    })
  }

  return (
    popUp && (
      <div className="modal show d-block" tabIndex="-1" role="dialog">
        <div className="modal-dialog" role="document">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">Boleta</h5>
              <button type="button" className="btn-close" onClick={closePopUp}></button>
            </div>
            <div className="modal-body">
              <p>
                <strong>RUT:</strong> 11.111.111-1
              </p>
              <p>
                <strong>BOLETA ELECTRONICA</strong>
              </p>
              <p>
                <strong>N° de Comanda:</strong> {idNumeroOrden}
              </p>
              <p>
                <strong>Fecha Emisión:</strong> {new Date().toLocaleDateString()}
              </p>
              <hr />
              {factura ? (
                <>
                  {factura.detalles.map((detalle) => (
                    <p key={detalle.id_detalle}>
                      {detalle.cantidad} x {detalle.nombre_plato} - ${detalle.total_parcial}
                    </p>
                  ))}
                  <hr />
                  <p className="fw-bold">Total: ${factura.totalFactura}</p>
                </>
              ) : (
                <p>Cargando factura...</p>
              )}
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={closePopUp}>
                Cerrar
              </button>
              {factura && (
                <>
                  <button type="button" className="btn btn-info" onClick={generarLinkPago}>
                    🔗 Compartir Pago
                  </button>
                  <button type="button" className="btn btn-success" onClick={generarPDF}>
                    📄 Descargar PDF
                  </button>
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={() => iniciarPagoWebPay(idNumeroOrden, factura.totalFactura)}
                  >
                    💳 Pagar
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    )
  )
}

export default FacturaPopUp
