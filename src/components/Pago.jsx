import React from 'react';

const Pago = () => {
  const iniciarPago = async () => {
    try {
      const response = await fetch('http://localhost:3001/gen/iniciar', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          monto: 35000,
          ordenCompra: 'OC12345',
          urlRetorno: 'http://localhost:3000/Catalogo',
        }),
      });

      const data = await response.json();
      window.location.href = `${data.url}?token_ws=${data.token}`;
    } catch (error) {
      console.error('Error al iniciar el pago:', error);
    }
  };

  return (
    <div className="container my-5">
      <div className="card mx-auto text-center" style={{ maxWidth: '500px', borderRadius: '10px' }}>
        <div className="card-header bg-primary text-white" style={{ borderTopLeftRadius: '10px', borderTopRightRadius: '10px' }}>
          <h4>Suscripción Premium</h4>
          <h2 className="mt-3">$35.000</h2>
          <p className="mb-0">Accede a beneficios unicos mensualmente</p>
        </div>
        <div className="card-body">
          <button
            className="btn btn-primary btn-lg btn-block"
            style={{ fontSize: '18px', fontWeight: 'bold', padding: '10px 20px' }}
            onClick={iniciarPago}
          >
            ¡Suscribirme Ahora!
          </button>
          <ul className="list-group list-group-flush text-left mt-4">
            <li className="list-group-item d-flex align-items-center">
              <i className="bi bi-check-circle-fill text-success mr-3"></i>
              Descuentos de un 20% en tus Reparaciones
            </li>
            <li className="list-group-item d-flex align-items-center">
              <i className="bi bi-check-circle-fill text-success mr-3"></i>
              Aclaraciones de Soporte técnico 24/7 
            </li>
            <li className="list-group-item d-flex align-items-center">
              <i className="bi bi-check-circle-fill text-success mr-3"></i>
              Cursos intensivos sobre reparaciones
            </li>
            <li className="list-group-item d-flex align-items-center">
              <i className="bi bi-check-circle-fill text-success mr-3"></i>
              Trato Personal con El Tecnico Relojero
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Pago;
