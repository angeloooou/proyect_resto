import React, { useState, useEffect } from "react";
import Axios from "axios";
import Swal from "sweetalert2";

const handleBuyClick = () => {
  Swal.fire({
    title: "Pedido",
    text: "Pedido Añadido.",
    imageHeight: 150,
    imageWidth: 150,
  });
};

const Catalogo = () => {
  const [menu, setMenu] = useState([]);

  // Obtener el menú desde la API
  useEffect(() => {
    const fetchMenu = async () => {
      try {
        const response = await Axios.get("http://localhost:5001/menu");
        setMenu(response.data); // Guardamos la respuesta en el estado
      } catch (error) {
        console.error("Error al obtener el menú:", error);
        Swal.fire("Error", "No se pudo cargar el menú.", "error");
      }
    };

    fetchMenu();
  }, []);

  return (
    <div
      style={{
        background: "linear-gradient(to bottom,rgb(130, 131, 133),rgb(0, 0, 0))",
        padding: "20px 0",
        minHeight: "100vh",
      }}
    >
      <div className="container my-5">
        <h1 className="text-center text-dark mb-4" style={{ fontWeight: "700" }}>
          Menú Restaurante
        </h1>
        <p className="text-center text-muted mb-5">
          Platos increíbles, experimenta nuestra sazón y recetas especiales de la casa!
        </p>

        {/* Menú dinámico */}
        <div className="row g-4">
          {menu.map((plato, index) => (
            <div className="col-md-4" key={index}>
              <div className="card h-100 shadow-sm" style={{ borderRadius: "10px" }}>
                <img
                  src={plato.link_imagen}
                  className="card-img-top"
                  alt={plato.nombre_plato}
                  style={{ borderTopLeftRadius: "10px", borderTopRightRadius: "10px" }}
                />
                <div className="card-body text-center">
                  <h5 className="card-title" style={{ fontWeight: "600" }}>
                    {plato.nombre_plato}
                  </h5>
                  <p className="card-text text-muted">{plato.descripcion}</p>
                  <p className="card-text text-muted">${plato.precio_unitario}</p>
                  
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Mensaje si el menú está vacío */}
        {menu.length === 0 && (
          <p className="text-center text-light mt-4">No hay platos disponibles en este momento.</p>
        )}
      </div>
    </div>
  );
};

export default Catalogo;
