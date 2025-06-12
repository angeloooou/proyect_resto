import React from "react";

const ProtectedRoute = ({ children }) => {
  console.log("Protección desactivada temporalmente.");
  return children; // Permite acceso sin restricciones
};

export default ProtectedRoute;
