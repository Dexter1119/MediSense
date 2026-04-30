////////////////////////////////////////////////////////////////////
//
// File Name : AuthContext.jsx
// Description : Global authentication context with JWT decoding
// Author      : Pradhumnya Changdev Kalsait
// Date        : 17/01/26
//
////////////////////////////////////////////////////////////////////

import { createContext, useState } from "react";
import { jwtDecode } from "jwt-decode";

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  console.log("AuthContext LOADED");

  const storedToken = localStorage.getItem("accessToken");

  const decodedToken = storedToken ? jwtDecode(storedToken) : null;

  const [accessToken, setAccessToken] = useState(storedToken);
  const [userRole, setUserRole] = useState(decodedToken?.role || null);

  function login(token) {
  console.log("LOGIN FUNCTION CALLED");
  console.log("TOKEN RECEIVED:", token);

  const decoded = jwtDecode(token);
  console.log("DECODED TOKEN:", decoded);

  localStorage.setItem("accessToken", token);
  setAccessToken(token);
  setUserRole(decoded.role);
}


  function logout() {
    localStorage.removeItem("accessToken");
    setAccessToken(null);
    setUserRole(null);
  }

  const contextValue = {
    accessToken,
    userRole,
    isAuthenticated: Boolean(accessToken),
    login,
    logout,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}
