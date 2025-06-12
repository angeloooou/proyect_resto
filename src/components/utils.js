import { format } from "date-fns";

// Función para obtener la fecha actual en formato yyyy-MM-dd
export const obtenerFechaActual = () => {
  const today = new Date();
  return format(today, "yyyy-MM-dd");
};

// Validación de número de teléfono
export const validarTelefono = (telefono) => {
  const regex = /^[0-9]{9}$/;
  return regex.test(telefono);
};

// Configuración de validaciones centralizadas
export const registerConfig = {
  telefono: {
    required: "El número de teléfono es obligatorio",
    pattern: {
      value: /^[0-9]{9}$/,
      message: "El número debe contener exactamente 9 dígitos",
    },
  },
  modelo: {
    required: "El modelo es obligatorio",
    maxLength: {
      value: 50,
      message: "El modelo no debe exceder los 50 caracteres",
    },
  },
  fechaIngreso: {
    required: "La fecha de ingreso es obligatoria",
  },
  precio: {
    required: "El precio es obligatorio",
  },
};
