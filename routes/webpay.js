const express = require("express")
const router = express.Router()

// Simulación de WebPay Plus - En producción usar el SDK oficial de Transbank
class WebPayPlus {
  static async create(amount, buyOrder, sessionId, returnUrl) {
    // Simulación para desarrollo - reemplazar con SDK real
    return {
      token: `token_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      url: "https://webpay3gint.transbank.cl/webpayserver/initTransaction",
    }
  }

  static async commit(token) {
    // Simulación para desarrollo - reemplazar con SDK real
    return {
      vci: "TSY",
      amount: 25000,
      status: "AUTHORIZED",
      buy_order: token.split("_")[2] || "COMANDA-TEST",
      session_id: `SESSION-${Date.now()}`,
      card_detail: { card_number: "6623" },
      accounting_date: "0111",
      transaction_date: new Date().toISOString(),
      authorization_code: "1213",
      payment_type_code: "VN",
      response_code: 0,
      installments_number: 0,
    }
  }
}

// Ruta para iniciar transacción WebPay
router.post("/webpay/iniciar", async (req, res) => {
  try {
    const { monto, ordenCompra, sessionId, urlRetorno, detalles } = req.body

    // Validaciones
    if (!monto || !ordenCompra || !sessionId || !urlRetorno) {
      return res.status(400).json({
        success: false,
        message: "Faltan parámetros requeridos",
      })
    }

    console.log("Iniciando transacción WebPay:", {
      monto,
      ordenCompra,
      sessionId,
      detalles: detalles?.length || 0,
    })

    // Crear transacción en WebPay
    const transaction = await WebPayPlus.create(monto, ordenCompra, sessionId, urlRetorno)

    // Aquí podrías guardar la transacción en tu base de datos
    // await guardarTransaccionPendiente(transaction, ordenCompra, monto, detalles);

    res.json({
      success: true,
      token: transaction.token,
      url: transaction.url,
      message: "Transacción iniciada correctamente",
    })
  } catch (error) {
    console.error("Error al iniciar transacción WebPay:", error)
    res.status(500).json({
      success: false,
      message: "Error interno del servidor",
    })
  }
})

// Ruta para confirmar transacción WebPay
router.post("/webpay/confirmar", async (req, res) => {
  try {
    const { token_ws } = req.body

    if (!token_ws) {
      return res.status(400).json({
        success: false,
        message: "Token requerido",
      })
    }

    console.log("Confirmando transacción WebPay:", token_ws)

    // Confirmar transacción con WebPay
    const result = await WebPayPlus.commit(token_ws)

    // Actualizar estado de la comanda en base de datos
    if (result.response_code === 0) {
      // Extraer número de orden del buy_order
      const numeroOrden = result.buy_order.replace("COMANDA-", "")

      // Aquí actualizarías el estado en tu base de datos
      // await actualizarEstadoComanda(numeroOrden, 'PAGADO');

      console.log("Pago exitoso para comanda:", numeroOrden)
    }

    res.json({
      success: result.response_code === 0,
      transaction: result,
      message: result.response_code === 0 ? "Pago exitoso" : "Pago rechazado",
    })
  } catch (error) {
    console.error("Error al confirmar transacción WebPay:", error)
    res.status(500).json({
      success: false,
      message: "Error al confirmar el pago",
    })
  }
})

module.exports = router
