import React, { createContext, useContext, useState } from "react";

const UserContext = createContext();

export const UserProvider = ({ children }) => {
  // Permitir acceso sin restricciones temporalmente
  const [user, setUser] = useState({ roles: ["admin"] }); // Cambiar "admin" por el rol deseado

  return (
    <UserContext.Provider value={{ user, setUser }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => useContext(UserContext);
