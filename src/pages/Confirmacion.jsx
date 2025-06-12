import React, { useEffect } from 'react';

const Confirmacion = () => {
  useEffect(() => {
    const confirmarPago = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const token_ws = urlParams.get('token_ws');

      try {
        const response = await fetch('http://localhost:3001/gen/confirmar', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ token_ws }),
        });

        const data = await response.json();
        console.log('Confirmación de pago:', data);
        // Manejar la respuesta
      } catch (error) {
        console.error('Error al confirmar el pago:', error);
      }
    };

    confirmarPago();
  }, []);

  return <div>Procesando confirmación del pago...</div>;
};

export default Confirmacion;
