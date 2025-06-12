import { createContext, useContext, useState } from "react";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState({ roles: ["admin"] }); // Simula un usuario con un rol permitido

  const hasRole = () => true; // Permite todos los roles temporalmente

  return (
    <AuthContext.Provider value={{ user, hasRole }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
