require("dotenv").config()
const express = require("express")
const cors = require("cors")
const bodyParser = require("body-parser")
const { Pool } = require("pg")
const nodemailer = require("nodemailer")

const app = express()
const port = process.env.PORT || 5001

// Middleware
app.use(cors())
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))

// Configurar conexión con PostgreSQL
const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
})

// Configurar nodemailer
const transporter = nodemailer.createTransport({
  service: "gmail", // o tu proveedor de email
  auth: {
    user: process.env.EMAIL_USER, // tu email
    pass: process.env.EMAIL_PASS, // tu contraseña de aplicación
  },
})

//verificar conexion con el servidor
pool
  .connect()
  .then(() => {
    console.log("Conexión a la base de datos establecida con éxito")
  })
  .catch((err) => {
    console.error("Error al conectar con la base de datos:", err)
    process.exit(1) // Salir con error si no se puede conectar
  })

// Rutas API existentes...

// Obtener todos los empleados
app.get("/empleados", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM empleado ORDER BY id_empleado ASC")
    res.json(result.rows)
  } catch (err) {
    console.error(err)
    res.status(500).send("Error al obtener empleados")
  }
})

//Agregar un nuevo empleado
app.post("/empleados", async (req, res) => {
  const { nombre, apellido, edad, fecha_nacimiento, telefono, correo, cargo } = req.body

  if (!nombre || !apellido || !edad || !fecha_nacimiento || !telefono || !correo || !cargo) {
    return res.status(400).json({ error: "Todos los campos son obligatorios" })
  }

  try {
    const result = await pool.query(
      `INSERT INTO empleado (nombre, apellido, edad, fecha_nacimiento, telefono, correo, cargo, fecha_contratacion) 
          VALUES ($1, $2, $3, $4, $5, $6, $7, NOW()) RETURNING *`,
      [nombre, apellido, edad, fecha_nacimiento, telefono, correo, cargo],
    )
    res.status(201).json(result.rows[0])
  } catch (err) {
    console.error("Error en el servidor:", err)
    res.status(500).json({ error: "Error interno del servidor al agregar empleado" })
  }
})

// Actualizar un empleado existente
app.patch("/empleados/:id_empleado", async (req, res) => {
  const { id_empleado } = req.params
  const { telefono, correo, cargo } = req.body

  try {
    const result = await pool.query(
      `UPDATE empleado
       SET telefono = $1,
           correo = $2,
           cargo = $3
       WHERE id_empleado = $4
       RETURNING *`,
      [telefono, correo, cargo, id_empleado],
    )

    if (result.rowCount === 0) {
      return res.status(404).send("Empleado no encontrado")
    }
    res.json(result.rows[0])
  } catch (err) {
    console.error(err)
    res.status(500).send("Error al actualizar el empleado")
  }
})

//Obtener todos los platos del menú
app.get("/menu", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM menu")
    res.json(result.rows)
  } catch (err) {
    console.error(err)
    res.status(500).send("Error al obtener el menú")
  }
})

//obtener todas las comandas
app.get("/comandas", async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT 
        c.id_numero_orden,
        e.nombre AS nombre_empleado,
        ms.numero AS numero_mesa,
        c.id_estado AS estado_comanda,
        c.fecha_pedido,
        c.fecha_entrega,
        c.detalles
      FROM 
        comanda c
      JOIN 
        empleado e ON c.id_empleado = e.id_empleado
      JOIN
        mesa ms ON c.id_mesa = ms.id_mesa`,
    )
    res.json(result.rows)
  } catch (err) {
    console.error(err)
    res.status(500).send("Error al obtener las comandas")
  }
})

//Agregar nueva comanda - CORREGIDO: Sin offset de tiempo
app.post("/comandas", async (req, res) => {
  const { id_empleado, id_mesa, id_estado, detalles } = req.body
  try {
    // Usar NOW() que toma la hora exacta del sistema del servidor
    const query = `INSERT INTO comanda (id_empleado, id_mesa, id_estado, fecha_pedido, fecha_entrega, detalles) VALUES ($1, $2, $3, NOW(), NULL, $4) RETURNING *;`
    const result = await pool.query(query, [id_empleado, id_mesa, id_estado, detalles])

    // Log para verificar la hora
    console.log("Comanda creada a las:", new Date().toLocaleString("es-ES"))
    console.log("Hora en BD:", result.rows[0].fecha_pedido)

    res.status(201).json(result.rows[0])
  } catch (err) {
    console.error(err)
    res.status(500).send("Error al agregar la comanda")
  }
})

// Ruta para actualizar el estado de la comanda
app.put("/comandas/:id_numero_orden", (req, res) => {
  const { id_numero_orden } = req.params
  const { id_estado } = req.body

  if (typeof id_estado !== "number") {
    return res.status(400).json({ error: "Estado inválido" })
  }

  const query = "UPDATE comanda SET id_estado = $1 WHERE id_numero_orden = $2"

  pool.query(query, [id_estado, id_numero_orden], (error, results) => {
    if (error) {
      console.error("Error al actualizar el estado:", error)
      return res.status(500).json({ error: "Error al actualizar el estado" })
    }

    if (results.rowCount > 0) {
      res.status(200).json({ message: `Estado de la comanda actualizado a ${id_estado}` })
    } else {
      res.status(404).json({ message: "Comanda no encontrada" })
    }
  })
})

// Eliminar comanda por id
app.delete("/comandas/:id", async (req, res) => {
  const { id } = req.params
  try {
    const result = await pool.query("DELETE FROM comanda WHERE id_numero_orden = $1 RETURNING *", [id])

    if (result.rowCount > 0) {
      res.status(200).json({ message: `Comanda con id ${id} eliminada` })
    } else {
      res.status(404).json({ message: `Comanda con id ${id} no encontrada` })
    }
  } catch (err) {
    console.error(err)
    res.status(500).send("Error al eliminar la comanda")
  }
})

//Obtener todos los empleados que son "Meseros/as"
app.get("/meseros", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM empleado WHERE cargo = 'Mesero'")
    res.json(result.rows)
  } catch (err) {
    console.error(err)
    res.status(500).send("Error al obtener empleados")
  }
})

// Obtener ventas por mesero
app.get("/reporte/ventas-meseros", async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT e.nombre, COUNT(c.id_numero_orden) AS total_ventas
       FROM comanda c
       JOIN empleado e ON c.id_empleado = e.id_empleado
       GROUP BY e.nombre
       ORDER BY total_ventas DESC`,
    )
    res.json(result.rows)
  } catch (err) {
    console.error("Error obteniendo ventas por mesero:", err)
    res.status(500).send("Error al obtener las ventas por mesero")
  }
})

// Obtener platos más pedidos
app.get("/reporte/platos-mas-pedidos", async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT m.nombre_plato, COUNT(c.id_plato) AS total_pedidos
       FROM comanda c
       JOIN menu m ON c.id_plato = m.id_plato
       GROUP BY m.nombre_plato
       ORDER BY total_pedidos DESC
       LIMIT 10`,
    )
    res.json(result.rows)
  } catch (err) {
    console.error("Error obteniendo platos más pedidos:", err)
    res.status(500).send("Error al obtener los platos más pedidos")
  }
})

// Obtener ventas totales por día
app.get("/reporte/ventas-totales", async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT CAST(c.fecha_pedido AS DATE) AS fecha, 
              SUM(m.precio * c.cantidad) AS total_ventas
       FROM comanda c
       JOIN menu m ON c.id_plato = m.id_plato
       GROUP BY fecha
       ORDER BY fecha DESC`,
    )
    res.json(result.rows)
  } catch (err) {
    console.error("Error obteniendo ventas totales:", err)
    res.status(500).send("Error al obtener las ventas totales")
  }
})

app.get("/mesa", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM mesa ORDER BY id_mesa ASC")
    res.json(result.rows)
  } catch (err) {
    console.error(err)
    res.status(500).send("Error al obtener mesas")
  }
})

app.post("/mesa", async (req, res) => {
  const { numero, capacidad } = req.body
  try {
    const result = await pool.query("INSERT INTO mesa (numero, capacidad) VALUES ($1, $2) RETURNING *", [
      numero,
      capacidad,
    ])
    res.status(201).json(result.rows[0])
  } catch (err) {
    console.error(err)
    res.status(500).send("Error al agregar la mesa")
  }
})

app.get("/estado", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM estado ORDER BY id_estado ASC")
    res.json(result.rows)
  } catch (err) {
    console.error(err)
    res.status(500).send("Error al obtener estados")
  }
})

app.get("/empleados1", async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id_empleado, nombre, apellido, edad, fecha_nacimiento, telefono, correo, cargo, 
      TO_CHAR(fecha_contratacion, 'YYYY-MM-DD') AS fecha_contratacion FROM empleado ORDER BY id_empleado ASC`,
    )
    res.json(result.rows)
  } catch (err) {
    console.error(err)
    res.status(500).send("Error al obtener empleados")
  }
})

// Actualizar un empleado existente
app.patch("/empleados1/:id_empleado", async (req, res) => {
  const { id_empleado } = req.params
  const { nombre, apellido, edad, fecha_nacimiento, telefono, correo, cargo } = req.body

  try {
    const result = await pool.query(
      `UPDATE empleado
       SET nombre = $1,
           apellido = $2,
           edad = $3,
           fecha_nacimiento = $4,
           telefono = $5,
           correo = $6,
           cargo = $7
       WHERE id_empleado = $8
       RETURNING *`,
      [nombre, apellido, edad, fecha_nacimiento, telefono, correo, cargo, id_empleado],
    )

    if (result.rowCount === 0) {
      return res.status(404).send("Empleado no encontrado")
    }
    res.json(result.rows[0])
  } catch (err) {
    console.error(err)
    res.status(500).send("Error al actualizar el empleado")
  }
})

app.get("/comandas1", async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT 
        c.id_numero_orden,
        c.id_estado,
        e.nombre AS nombre_empleado,
        mn.nombre_plato,
        ms.numero AS numero_mesa,
        d.cantidad,
        c.fecha_pedido,
        c.fecha_entrega,
        est.nombre_estado AS estado
      FROM 
        comanda c
      JOIN 
        empleado e ON c.id_empleado = e.id_empleado
      JOIN
        detalle d ON c.id_numero_orden = d.id_numero_orden
      JOIN
        menu mn ON d.id_plato = mn.id_plato
      JOIN
        mesa ms ON c.id_mesa = ms.id_mesa
      JOIN
        estado est ON c.id_estado = est.id_estado
      ORDER BY c.fecha_pedido DESC`,
    )
    res.json(result.rows)
  } catch (err) {
    console.error(err)
    res.status(500).send("Error al obtener las comandas")
  }
})

app.get("/comandas2", async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT 
        d.id_detalle,
        d.id_numero_orden,
        c.id_estado,
        est.nombre_estado AS estado,
        e.nombre AS nombre_empleado,
        mn.nombre_plato,
        ms.numero AS numero_mesa,
        d.cantidad,
        c.fecha_pedido,
        c.fecha_entrega,
        COALESCE(c.detalles, 'Sin detalles') AS detalles
      FROM 
        detalle d
      JOIN 
        comanda c ON d.id_numero_orden = c.id_numero_orden
      JOIN 
        empleado e ON c.id_empleado = e.id_empleado
      JOIN
        menu mn ON d.id_plato = mn.id_plato
      JOIN
        mesa ms ON c.id_mesa = ms.id_mesa
      JOIN
        estado est ON c.id_estado = est.id_estado
      ORDER BY c.fecha_pedido DESC`,
    )
    res.json(result.rows)
  } catch (err) {
    console.error(err)
    res.status(500).send("Error al obtener las comandas con detalles")
  }
})

// CORREGIDO: Endpoint para comandas3 sin offset de tiempo
app.get("/comandas3", async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT 
        d.id_detalle,
        d.id_numero_orden,
        e.nombre AS nombre_empleado,
        mn.nombre_plato,
        ms.numero AS numero_mesa,
        d.cantidad,
        d.id_estado AS estado_detalle,
        c.fecha_pedido,
        c.fecha_entrega,
        c.detalles
      FROM detalle d
      JOIN
        comanda c ON d.id_numero_orden = c.id_numero_orden
      JOIN 
        empleado e ON c.id_empleado = e.id_empleado
      JOIN
        menu mn ON d.id_plato = mn.id_plato
      JOIN
        mesa ms ON c.id_mesa = ms.id_mesa
      ORDER BY c.fecha_pedido DESC, d.id_detalle ASC`,
    )

    // Log para debugging
    console.log("Comandas obtenidas:", result.rows.length)
    if (result.rows.length > 0) {
      console.log("Primera comanda - Fecha BD:", result.rows[0].fecha_pedido)
      console.log("Hora actual sistema:", new Date().toLocaleString("es-ES"))
    }

    res.json(result.rows)
  } catch (err) {
    console.error(err)
    res.status(500).send("Error al obtener detalles")
  }
})

//guardar fecha de entrega comanda
app.put("/comandas3/:id", async (req, res) => {
  const { id } = req.params
  const { estado_detalle } = req.body

  try {
    const result = await pool.query(
      `UPDATE detalle 
       SET id_estado = $1
       WHERE id_detalle = $2 RETURNING *`,
      [estado_detalle, id],
    )

    if (result.rowCount === 0) {
      return res.status(404).json({ message: "Comanda no encontrada" })
    }

    res.json({ message: "Estado actualizado correctamente", comanda: result.rows[0] })
  } catch (error) {
    console.error("Error al actualizar la comanda:", error)
    res.status(500).json({ message: "Error interno del servidor" })
  }
})

app.get("/detalle", async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT 
        d.id_detalle,
        d.id_numero_orden,
        e.nombre || ' ' || e.apellido AS nombre_empleado,
        mn.nombre_plato,
        ms.numero AS numero_mesa,
        d.cantidad,
        d.id_estado AS estado_detalle,
        c.fecha_pedido,
        c.fecha_entrega,
        c.detalles
      FROM detalle d
      JOIN
        comanda c ON d.id_numero_orden = c.id_numero_orden
      JOIN 
        empleado e ON c.id_empleado = e.id_empleado
      JOIN
        menu mn ON d.id_plato = mn.id_plato
      JOIN
        mesa ms ON c.id_mesa = ms.id_mesa
      ORDER BY c.fecha_pedido DESC, d.id_detalle ASC`,
    )
    res.json(result.rows)
  } catch (err) {
    console.error(err)
    res.status(500).send("Error al obtener detalles")
  }
})

app.post("/detalle", async (req, res) => {
  const { id_numero_orden, id_plato, cantidad, id_estado } = req.body
  try {
    const result = await pool.query(
      "INSERT INTO detalle (id_plato, id_numero_orden, cantidad, id_estado) VALUES ($1, $2, $3, $4) RETURNING *",
      [id_plato, id_numero_orden, cantidad, id_estado],
    )
    res.status(201).json(result.rows[0])
  } catch (err) {
    console.error(err)
    res.status(500).send("Error al agregar el detalle")
  }
})

// Actualizar detalle con hora del sistema
app.put("/detalle/:id_detalle", async (req, res) => {
  const { id_detalle } = req.params
  const { id_estado } = req.body

  try {
    const query1 = `
      UPDATE detalle
      SET id_estado = $1
      WHERE id_detalle = $2;
    `

    const values1 = [id_estado, id_detalle]
    await pool.query(query1, values1)

    // Actualizar fecha de entrega usando NOW() (hora del sistema)
    const query2 = `
      UPDATE comanda
      SET fecha_entrega = NOW()
      WHERE id_numero_orden = (
        SELECT id_numero_orden FROM detalle WHERE id_detalle = $1
      )
      RETURNING *;
    `
    const values2 = [id_detalle]
    const result = await pool.query(query2, values2)

    console.log("Detalle actualizado a las:", new Date().toLocaleString("es-ES"))
    res.status(200).json(result.rows[0])
  } catch (err) {
    console.error(err)
    res.status(500).send("Error al actualizar el detalle")
  }
})

app.put("/detalle", async (req, res) => {
  const { id_numero_orden } = req.body

  try {
    const result = await pool.query(
      `UPDATE detalle
       SET id_estado = 5
       WHERE id_numero_orden = $1
       AND id_estado <> 6
       RETURNING *;
       `,
      [id_numero_orden],
    )

    res.json(result.rows)
  } catch (err) {
    console.error(err)
    res.status(500).send("Error al actualizar el detalle")
  }
})

// Comandas con todos sus detalles "Entregados" o "Cancelados"
app.get("/comandas/pagar", async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT 
        c.id_numero_orden,
        e.nombre || ' ' || e.apellido AS nombre_empleado,
        c.id_mesa,
        c.id_estado
       FROM comanda c
       JOIN empleado e ON c.id_empleado = e.id_empleado
       WHERE NOT EXISTS (
        SELECT 1
        FROM detalle d
        WHERE d.id_numero_orden = c.id_numero_orden
        AND d.id_estado NOT IN (3, 6)
       )
       AND c.id_estado NOT IN (5, 6)
       AND NOT EXISTS (
        SELECT 1
        FROM detalle d
        WHERE d.id_numero_orden = c.id_numero_orden
        GROUP BY d.id_numero_orden
        HAVING COUNT(DISTINCT d.id_estado) = 1 AND MAX(d.id_estado) = 6
      );`,
    )
    res.json(result.rows)
  } catch (err) {
    console.error(err)
    res.status(500).send("Error al obtener las comandas")
  }
})

app.get("/comandas/pagar1", async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT 
        c.id_numero_orden,
        e.nombre || ' ' || e.apellido AS nombre_empleado,
        c.id_mesa,
        c.id_estado
       FROM comanda c
       JOIN empleado e ON c.id_empleado = e.id_empleado
       WHERE c.id_estado NOT IN(5,6)
       AND NOT EXISTS (
        SELECT 1
        FROM detalle d
        WHERE d.id_numero_orden = c.id_numero_orden
        GROUP BY d.id_numero_orden
        HAVING COUNT(DISTINCT d.id_estado) = 1 AND MAX(d.id_estado) = 6
      );`,
    )
    res.json(result.rows)
  } catch (err) {
    console.error(err)
    res.status(500).send("Error al obtener las comandas")
  }
})

app.get("/ventas/:id_numero_orden", async (req, res) => {
  const { id_numero_orden } = req.params

  try {
    const query = `
    SELECT 
        d.id_detalle,
        e.nombre || ' ' || e.apellido AS nombre_empleado,
        c.id_mesa AS numero_mesa,
        d.id_estado,
        d.cantidad,
        m.nombre_plato,
        m.precio_unitario,
        CAST((d.cantidad * m.precio_unitario) AS INT) AS total_parcial
    FROM detalle d
    JOIN menu m ON d.id_plato = m.id_plato
    JOIN comanda c ON d.id_numero_orden = c.id_numero_orden
    JOIN empleado e ON c.id_empleado = e.id_empleado
    WHERE d.id_numero_orden = $1 AND d.id_estado != 6;`

    const result = await pool.query(query, [id_numero_orden])

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "No se encontraron detalles para esta comanda." })
    }

    const totalFactura = result.rows.reduce((acc, item) => acc + item.total_parcial, 0)

    res.status(200).json({
      id_numero_orden,
      detalles: result.rows,
      totalFactura,
    })
  } catch (error) {
    console.error("Error al generar la factura:", error)
    res.status(500).json({ error: "Error interno del servidor" })
  }
})

app.post("/ventas", async (req, res) => {
  const { id_numero_orden, comanda } = req.body
  try {
    const venta = await pool.query(`INSERT INTO venta (id_numero_orden, comanda) VALUES ($1, 0) RETURNING *`, [
      id_numero_orden,
    ])

    const ventaId = venta.rows[0].id
    let total = 0

    for (const item of comanda) {
      const subtotal = item.cantidad * item.precio_unitario
      total += subtotal

      await pool.query(
        `INSERT INTO detalles_venta (factura_id, producto, cantidad, precio , subtotal) VALUES ($1, $2, $3, $4, $5)`,
        [ventaId, item.producto, item.cantidad, item.precio_unitario, subtotal],
      )
    }

    await pool.query(`UPDATE ventas SET total = $1 WHERE id = $2`, [total, ventaId])

    res.json({ message: "Factura creada", ventaId })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

app.get("/comandas4", async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT 
        d.id_detalle,
        d.id_numero_orden,
        c.id_estado,
        est.nombre_estado AS estado,
        CONCAT(e.nombre, ' ', e.apellido ) AS nombre_empleado,
        mn.nombre_plato,
        ms.numero AS numero_mesa,
        d.cantidad,
        c.fecha_pedido,
        mn.precio_unitario,
        c.fecha_entrega,
        COALESCE(c.detalles, 'Sin detalles') AS detalles
      FROM 
        detalle d
      JOIN 
        comanda c ON d.id_numero_orden = c.id_numero_orden
      JOIN 
        empleado e ON c.id_empleado = e.id_empleado
      JOIN
        menu mn ON d.id_plato = mn.id_plato
      JOIN
        mesa ms ON c.id_mesa = ms.id_mesa
      JOIN
        estado est ON c.id_estado = est.id_estado
      ORDER BY c.fecha_pedido DESC`,
    )
    res.json(result.rows)
  } catch (err) {
    console.error(err)
    res.status(500).send("Error al obtener las comandas con detalles")
  }
})

app.get("/detalle/:id_numero_orden", async (req, res) => {
  const { id_numero_orden } = req.params

  try {
    const result = await pool.query("SELECT * FROM detalle WHERE id_numero_orden = $1", [id_numero_orden])

    res.json(result.rows)
  } catch (err) {
    console.error(err)
    res.status(500).send("Error al obtener detalles")
  }
})

// ==================== SIMULACIÓN WEBPAY PARA PRUEBAS ====================

// Almacén temporal para transacciones (en producción usar base de datos)
const transacciones = new Map()

// Función para generar comprobante HTML
function generarComprobanteHTML(transaccion, detalles) {
  const fecha = new Date().toLocaleDateString("es-ES")
  const hora = new Date().toLocaleTimeString("es-ES")

  return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background: #f5f5f5; }
        .comprobante { background: white; max-width: 600px; margin: 0 auto; padding: 30px; border-radius: 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
        .header { text-align: center; border-bottom: 2px solid #1e3a8a; padding-bottom: 20px; margin-bottom: 30px; }
        .logo { font-size: 28px; font-weight: bold; color: #1e3a8a; margin-bottom: 10px; }
        .subtitle { color: #666; font-size: 16px; }
        .info-section { margin-bottom: 25px; }
        .info-row { display: flex; justify-content: space-between; margin-bottom: 8px; padding: 5px 0; }
        .label { font-weight: bold; color: #333; }
        .value { color: #666; }
        .success-badge { background: #10b981; color: white; padding: 8px 16px; border-radius: 20px; font-weight: bold; display: inline-block; margin: 10px 0; }
        .items-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        .items-table th, .items-table td { padding: 12px; text-align: left; border-bottom: 1px solid #e5e7eb; }
        .items-table th { background: #f9fafb; font-weight: bold; }
        .total-section { background: #f9fafb; padding: 20px; border-radius: 8px; margin-top: 20px; }
        .total-amount { font-size: 24px; font-weight: bold; color: #1e3a8a; text-align: right; }
        .footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #666; font-size: 14px; }
    </style>
</head>
<body>
    <div class="comprobante">
        <div class="header">
            <div class="logo">ENACCION RESTAURANT</div>
            <div class="subtitle">Comprobante de Pago Electrónico</div>
            <div class="success-badge">✓ PAGO EXITOSO</div>
        </div>
        
        <div class="info-section">
            <div class="info-row">
                <span class="label">Número de Orden:</span>
                <span class="value">${transaccion.ordenCompra}</span>
            </div>
            <div class="info-row">
                <span class="label">Fecha de Pago:</span>
                <span class="value">${fecha}</span>
            </div>
            <div class="info-row">
                <span class="label">Hora de Pago:</span>
                <span class="value">${hora}</span>
            </div>
            <div class="info-row">
                <span class="label">Método de Pago:</span>
                <span class="value">WebPay Plus</span>
            </div>
            <div class="info-row">
                <span class="label">Código de Autorización:</span>
                <span class="value">${transaccion.resultado?.authorization_code || "N/A"}</span>
            </div>
        </div>
        
        <table class="items-table">
            <thead>
                <tr>
                    <th>Producto</th>
                    <th>Cantidad</th>
                    <th>Precio Unit.</th>
                    <th>Total</th>
                </tr>
            </thead>
            <tbody>
                ${detalles
                  .map(
                    (item) => `
                    <tr>
                        <td>${item.nombre_plato}</td>
                        <td>${item.cantidad}</td>
                        <td>$${item.precio_unitario.toLocaleString("es-ES")}</td>
                        <td>$${item.total_parcial.toLocaleString("es-ES")}</td>
                    </tr>
                `,
                  )
                  .join("")}
            </tbody>
        </table>
        
        <div class="total-section">
            <div class="info-row">
                <span class="label">Subtotal:</span>
                <span class="value">$${transaccion.monto.toLocaleString("es-ES")}</span>
            </div>
            <div class="info-row">
                <span class="label">IVA (19%):</span>
                <span class="value">$${Math.round(transaccion.monto * 0.19).toLocaleString("es-ES")}</span>
            </div>
            <div class="total-amount">
                Total: $${transaccion.monto.toLocaleString("es-ES")}
            </div>
        </div>
        
        <div class="footer">
            <p>Gracias por su preferencia</p>
            <p>Este es un comprobante electrónico válido</p>
            <p>RUT: 11.111.111-1 | ENACCION RESTAURANT</p>
        </div>
    </div>
</body>
</html>
  `
}

// Función para enviar email
async function enviarComprobantePorEmail(email, transaccion, detalles) {
  try {
    const htmlContent = generarComprobanteHTML(transaccion, detalles)

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: `Comprobante de Pago - Orden ${transaccion.ordenCompra}`,
      html: htmlContent,
    }

    const info = await transporter.sendMail(mailOptions)
    console.log("Email enviado:", info.messageId)
    return { success: true, messageId: info.messageId }
  } catch (error) {
    console.error("Error enviando email:", error)
    return { success: false, error: error.message }
  }
}

// Ruta para iniciar transacción WebPay SIMULADA
app.post("/api/webpay/iniciar", async (req, res) => {
  try {
    const { monto, ordenCompra, sessionId } = req.body

    // Validaciones
    if (!monto || !ordenCompra || !sessionId) {
      return res.status(400).json({
        success: false,
        message: "Faltan parámetros requeridos",
      })
    }

    console.log("Iniciando transacción WebPay SIMULADA:", {
      monto,
      ordenCompra,
      sessionId,
    })

    // Generar token único para la transacción
    const token = `token_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    // Guardar transacción en memoria (en producción usar BD)
    transacciones.set(token, {
      monto,
      ordenCompra,
      sessionId,
      estado: "PENDIENTE",
      fechaCreacion: new Date(),
    })

    // URL de la simulación de WebPay
    const webpayUrl = `http://localhost:5001/webpay-simulacion`

    res.json({
      success: true,
      token: token,
      url: webpayUrl,
      message: "Transacción iniciada correctamente",
    })
  } catch (error) {
    console.error("Error al iniciar transacción WebPay:", error)
    res.status(500).json({
      success: false,
      message: "Error interno del servidor: " + error.message,
    })
  }
})

// Página de simulación de WebPay
app.get("/webpay-simulacion", (req, res) => {
  const { token_ws } = req.query

  if (!token_ws) {
    return res.status(400).send("Token requerido")
  }

  const transaccion = transacciones.get(token_ws)

  if (!transaccion) {
    return res.status(404).send("Transacción no encontrada")
  }

  // HTML que simula la interfaz de WebPay
  const html = `
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>WebPay Plus - Simulación</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: Arial, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            display: flex;
            justify-content: center;
            align-items: center;
        }
        
        .webpay-container {
            background: white;
            border-radius: 10px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.3);
            max-width: 500px;
            width: 90%;
            overflow: hidden;
        }
        
        .webpay-header {
            background: #1e3a8a;
            color: white;
            padding: 20px;
            text-align: center;
        }
        
        .webpay-logo {
            font-size: 24px;
            font-weight: bold;
            margin-bottom: 5px;
        }
        
        .webpay-subtitle {
            font-size: 14px;
            opacity: 0.9;
        }
        
        .transaction-info {
            padding: 30px;
            background: #f8fafc;
        }
        
        .info-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 15px;
            padding-bottom: 10px;
            border-bottom: 1px solid #e2e8f0;
        }
        
        .info-label {
            font-weight: bold;
            color: #374151;
        }
        
        .info-value {
            color: #1f2937;
        }
        
        .amount {
            font-size: 24px;
            font-weight: bold;
            color: #059669;
        }
        
        .payment-form {
            padding: 30px;
        }
        
        .form-group {
            margin-bottom: 20px;
        }
        
        .form-label {
            display: block;
            margin-bottom: 5px;
            font-weight: bold;
            color: #374151;
        }
        
        .form-input {
            width: 100%;
            padding: 12px;
            border: 2px solid #d1d5db;
            border-radius: 5px;
            font-size: 16px;
            transition: border-color 0.3s;
        }
        
        .form-input:focus {
            outline: none;
            border-color: #3b82f6;
        }
        
        .card-row {
            display: flex;
            gap: 15px;
        }
        
        .card-row .form-group {
            flex: 1;
        }
        
        .btn-container {
            display: flex;
            gap: 15px;
            margin-top: 30px;
        }
        
        .btn {
            flex: 1;
            padding: 15px;
            border: none;
            border-radius: 5px;
            font-size: 16px;
            font-weight: bold;
            cursor: pointer;
            transition: all 0.3s;
        }
        
        .btn-success {
            background: #059669;
            color: white;
        }
        
        .btn-success:hover {
            background: #047857;
        }
        
        .btn-danger {
            background: #dc2626;
            color: white;
        }
        
        .btn-danger:hover {
            background: #b91c1c;
        }
        
        .security-info {
            background: #fef3c7;
            padding: 15px;
            margin: 20px 0;
            border-radius: 5px;
            border-left: 4px solid #f59e0b;
        }
        
        .security-text {
            font-size: 14px;
            color: #92400e;
        }
        
        .loading {
            display: none;
            text-align: center;
            padding: 20px;
        }
        
        .spinner {
            border: 4px solid #f3f4f6;
            border-top: 4px solid #3b82f6;
            border-radius: 50%;
            width: 40px;
            height: 40px;
            animation: spin 1s linear infinite;
            margin: 0 auto 15px;
        }
        
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
    </style>
</head>
<body>
    <div class="webpay-container">
        <div class="webpay-header">
            <div class="webpay-logo">WebPay Plus</div>
            <div class="webpay-subtitle">Transbank - Simulación de Pago</div>
        </div>
        
        <div class="transaction-info">
            <div class="info-row">
                <span class="info-label">Comercio:</span>
                <span class="info-value">ENACCION RESTAURANT</span>
            </div>
            <div class="info-row">
                <span class="info-label">Orden de Compra:</span>
                <span class="info-value">${transaccion.ordenCompra}</span>
            </div>
            <div class="info-row">
                <span class="info-label">Monto a Pagar:</span>
                <span class="info-value amount">$${transaccion.monto.toLocaleString("es-ES")}</span>
            </div>
        </div>
        
        <div class="payment-form" id="paymentForm">
            <div class="security-info">
                <div class="security-text">
                    🔒 Esta es una simulación de WebPay para pruebas. Usa cualquier número de tarjeta.
                </div>
            </div>
            
            <form id="cardForm">
                <div class="form-group">
                    <label class="form-label">Número de Tarjeta</label>
                    <input type="text" class="form-input" id="cardNumber" placeholder="4051 8856 0044 6623" maxlength="19" value="4051 8856 0044 6623">
                </div>
                
                <div class="card-row">
                    <div class="form-group">
                        <label class="form-label">Vencimiento</label>
                        <input type="text" class="form-input" id="expiry" placeholder="MM/AA" maxlength="5" value="12/25">
                    </div>
                    <div class="form-group">
                        <label class="form-label">CVV</label>
                        <input type="text" class="form-input" id="cvv" placeholder="123" maxlength="3" value="123">
                    </div>
                </div>
                
                <div class="form-group">
                    <label class="form-label">Nombre del Titular</label>
                    <input type="text" class="form-input" id="cardName" placeholder="JUAN PEREZ" value="JUAN PEREZ">
                </div>
                
                <div class="btn-container">
                    <button type="button" class="btn btn-danger" onclick="cancelarPago()">Cancelar</button>
                    <button type="button" class="btn btn-success" onclick="procesarPago()">Pagar $${transaccion.monto.toLocaleString("es-ES")}</button>
                </div>
            </form>
        </div>
        
        <div class="loading" id="loading">
            <div class="spinner"></div>
            <div>Procesando pago...</div>
        </div>
    </div>

    <script>
        // Formatear número de tarjeta
        document.getElementById('cardNumber').addEventListener('input', function(e) {
            let value = e.target.value.replace(/\s/g, '').replace(/[^0-9]/gi, '');
            let formattedValue = value.match(/.{1,4}/g)?.join(' ') || value;
            e.target.value = formattedValue;
        });
        
        // Formatear fecha de vencimiento
        document.getElementById('expiry').addEventListener('input', function(e) {
            let value = e.target.value.replace(/\D/g, '');
            if (value.length >= 2) {
                value = value.substring(0,2) + '/' + value.substring(2,4);
            }
            e.target.value = value;
        });
        
        // Solo números en CVV
        document.getElementById('cvv').addEventListener('input', function(e) {
            e.target.value = e.target.value.replace(/[^0-9]/g, '');
        });
        
        function procesarPago() {
            document.getElementById('paymentForm').style.display = 'none';
            document.getElementById('loading').style.display = 'block';
            
            // Simular procesamiento de pago
            setTimeout(() => {
                // Simular pago exitoso (90% de probabilidad)
                const exito = Math.random() > 0.1;
                
                if (exito) {
                    window.location.href = '/api/webpay/retorno?token_ws=${token_ws}&status=success';
                } else {
                    window.location.href = '/api/webpay/retorno?token_ws=${token_ws}&status=failed';
                }
            }, 3000);
        }
        
        function cancelarPago() {
            if (confirm('¿Estás seguro de que deseas cancelar el pago?')) {
                window.location.href = '/api/webpay/retorno?token_ws=${token_ws}&status=cancelled';
            }
        }
    </script>
</body>
</html>
  `

  res.send(html)
})

// Ruta de retorno de WebPay SIMULADA
app.get("/api/webpay/retorno", async (req, res) => {
  try {
    const { token_ws, status } = req.query

    if (!token_ws) {
      return res.redirect("http://localhost:3000/pago-exitoso?error=token_requerido")
    }

    console.log("Procesando retorno de WebPay simulado:", { token_ws, status })

    const transaccion = transacciones.get(token_ws)

    if (!transaccion) {
      return res.redirect("http://localhost:3000/pago-exitoso?error=transaccion_no_encontrada")
    }

    // Simular respuesta de WebPay según el status
    const resultado = {
      response_code: status === "success" ? 0 : status === "failed" ? -1 : -2,
      buy_order: transaccion.ordenCompra,
      amount: transaccion.monto,
      authorization_code: status === "success" ? Math.random().toString(36).substr(2, 6).toUpperCase() : null,
      transaction_date: new Date().toISOString(),
      card_number: "6623",
      status: status === "success" ? "AUTHORIZED" : status === "failed" ? "FAILED" : "CANCELLED",
    }

    // Si el pago fue exitoso, actualizar estado de la comanda
    if (resultado.response_code === 0) {
      const numeroOrden = resultado.buy_order.replace("COMANDA-", "")

      try {
        await pool.query("UPDATE comanda SET id_estado = 5 WHERE id_numero_orden = $1", [numeroOrden])
        console.log("Comanda marcada como pagada:", numeroOrden)
      } catch (dbError) {
        console.error("Error al actualizar estado de comanda:", dbError)
      }
    }

    // Actualizar transacción
    transacciones.set(token_ws, {
      ...transaccion,
      estado: resultado.status,
      resultado: resultado,
    })

    // Redirigir al frontend con el resultado
    const redirectUrl = `http://localhost:3000/pago-exitoso?status=${status}&order=${resultado.buy_order}&amount=${resultado.amount}&auth=${resultado.authorization_code || "N/A"}&token=${token_ws}`

    res.redirect(redirectUrl)
  } catch (error) {
    console.error("Error al procesar retorno de WebPay:", error)
    res.redirect(`http://localhost:3000/pago-exitoso?error=${encodeURIComponent(error.message)}`)
  }
})

// Ruta para enviar comprobante por email
app.post("/api/enviar-comprobante", async (req, res) => {
  try {
    const { email, token } = req.body

    if (!email || !token) {
      return res.status(400).json({
        success: false,
        message: "Email y token son requeridos",
      })
    }

    // Obtener transacción
    const transaccion = transacciones.get(token)

    if (!transaccion) {
      return res.status(404).json({
        success: false,
        message: "Transacción no encontrada",
      })
    }

    // Obtener detalles de la comanda
    const numeroOrden = transaccion.ordenCompra.replace("COMANDA-", "")
    const detallesQuery = await pool.query(
      `SELECT 
        d.cantidad,
        m.nombre_plato,
        m.precio_unitario,
        CAST((d.cantidad * m.precio_unitario) AS INT) AS total_parcial
      FROM detalle d
      JOIN menu m ON d.id_plato = m.id_plato
      WHERE d.id_numero_orden = $1 AND d.id_estado != 6`,
      [numeroOrden],
    )

    const detalles = detallesQuery.rows

    // Enviar email
    const resultado = await enviarComprobantePorEmail(email, transaccion, detalles)

    if (resultado.success) {
      res.json({
        success: true,
        message: "Comprobante enviado exitosamente",
        messageId: resultado.messageId,
      })
    } else {
      res.status(500).json({
        success: false,
        message: "Error al enviar el comprobante",
        error: resultado.error,
      })
    }
  } catch (error) {
    console.error("Error al enviar comprobante:", error)
    res.status(500).json({
      success: false,
      message: "Error interno del servidor",
    })
  }
})

// Ruta para enviar link de pago por email
app.post("/api/enviar-link-pago", async (req, res) => {
  try {
    const { email, linkPago, numeroOrden, monto, detalles } = req.body

    if (!email || !linkPago || !numeroOrden || !monto) {
      return res.status(400).json({
        success: false,
        message: "Faltan parámetros requeridos",
      })
    }

    // Generar HTML para el email con el link de pago
    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background: #f5f5f5; }
        .email-container { background: white; max-width: 600px; margin: 0 auto; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
        .header { background: #1e3a8a; color: white; padding: 30px; text-align: center; }
        .logo { font-size: 28px; font-weight: bold; margin-bottom: 10px; }
        .subtitle { font-size: 16px; opacity: 0.9; }
        .content { padding: 30px; }
        .order-info { background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0; }
        .info-row { display: flex; justify-content: space-between; margin-bottom: 10px; }
        .label { font-weight: bold; color: #374151; }
        .value { color: #1f2937; }
        .amount { font-size: 24px; font-weight: bold; color: #059669; text-align: center; margin: 20px 0; }
        .pay-button { display: block; width: 100%; max-width: 300px; margin: 30px auto; padding: 15px 30px; background: #059669; color: white; text-decoration: none; border-radius: 8px; text-align: center; font-weight: bold; font-size: 18px; }
        .pay-button:hover { background: #047857; color: white; text-decoration: none; }
        .items-list { margin: 20px 0; }
        .item { padding: 10px 0; border-bottom: 1px solid #e5e7eb; }
        .footer { background: #f9fafb; padding: 20px; text-align: center; color: #666; font-size: 14px; }
        .security-note { background: #fef3c7; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #f59e0b; }
        .security-text { color: #92400e; font-size: 14px; }
    </style>
</head>
<body>
    <div class="email-container">
        <div class="header">
            <div class="logo">🍽️ ENACCION RESTAURANT</div>
            <div class="subtitle">Link de Pago - Orden #${numeroOrden}</div>
        </div>
        
        <div class="content">
            <h2>¡Hola! 👋</h2>
            <p>Te enviamos el link para que puedas pagar tu orden de manera fácil y segura desde cualquier dispositivo.</p>
            
            <div class="order-info">
                <div class="info-row">
                    <span class="label">Número de Orden:</span>
                    <span class="value">#${numeroOrden}</span>
                </div>
                <div class="info-row">
                    <span class="label">Fecha:</span>
                    <span class="value">${new Date().toLocaleDateString("es-ES")}</span>
                </div>
            </div>
            
            <div class="items-list">
                <h4>Detalles de tu orden:</h4>
                ${detalles
                  .map(
                    (item) => `
                    <div class="item">
                        ${item.cantidad}x ${item.nombre_plato} - $${item.total_parcial.toLocaleString("es-ES")}
                    </div>
                `,
                  )
                  .join("")}
            </div>
            
            <div class="amount">
                Total a Pagar: $${monto.toLocaleString("es-ES")}
            </div>
            
            <a href="${linkPago}" class="pay-button">
                💳 PAGAR AHORA
            </a>
            
            <div class="security-note">
                <div class="security-text">
                    🔒 <strong>Pago Seguro:</strong> Este link te llevará a nuestro portal de pagos seguro. 
                    Tu información está protegida con encriptación de nivel bancario.
                </div>
            </div>
            
            <p><strong>¿Necesitas ayuda?</strong></p>
            <p>Si tienes alguna pregunta o problema con el pago, no dudes en contactarnos.</p>
        </div>
        
        <div class="footer">
            <p>Gracias por elegir ENACCION RESTAURANT</p>
            <p>Este email fue enviado automáticamente, por favor no respondas a este mensaje.</p>
        </div>
    </div>
</body>
</html>
    `

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: `🍽️ Link de Pago - Orden #${numeroOrden} - ENACCION RESTAURANT`,
      html: htmlContent,
    }

    const info = await transporter.sendMail(mailOptions)
    console.log("Link de pago enviado por email:", info.messageId)

    res.json({
      success: true,
      message: "Link de pago enviado exitosamente",
      messageId: info.messageId,
    })
  } catch (error) {
    console.error("Error enviando link de pago:", error)
    res.status(500).json({
      success: false,
      message: "Error al enviar el link de pago",
      error: error.message,
    })
  }
})

// ==================== FIN SIMULACIÓN WEBPAY ====================

app.listen(port, () => {
  console.log(`Servidor corriendo en http://localhost:${port}`)
  console.log("WebPay configurado en modo SIMULACIÓN para pruebas")
  console.log("URL de simulación: http://localhost:5001/webpay-simulacion")
  console.log("Usando hora del sistema:", new Date().toLocaleString("es-ES"))
})
