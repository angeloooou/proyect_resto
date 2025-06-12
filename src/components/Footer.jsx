import React from 'react';

function Footer() {
  return (
    <footer className="footer mt-auto py-2" style={{ backgroundColor: '#212529', color: '#f8f9fa' }}>
      <div className="container text-center">
        <h5 className="text-uppercase" style={{ fontWeight: 'bold', fontSize: '1rem' }}>Restaurante Enacción</h5>
        <hr style={{ borderColor: '#6c757d', margin: '5px 0' }} />
        <p style={{ fontSize: '0.75rem', color: '#adb5bd', marginBottom: '0' }}>
          &copy; {new Date().getFullYear()} Restaurante Enacción. Todos los derechos reservados.
        </p>
      </div>
    </footer>
  );
}

export default Footer;
