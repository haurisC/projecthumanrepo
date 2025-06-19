import React, { createContext, useState, useContext } from 'react';
const AuthContext = createContext(null);


//CHANGE
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null); 

  return (
    <AuthContext.Provider value={{ user, setUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  return useContext(AuthContext);
};
