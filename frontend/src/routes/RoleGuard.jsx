////////////////////////////////////////////////////////////////////
//
// File Name : RoleGuard.jsx
// Description : Restricts routes based on user role
// Author      : Pradhumnya Changdev Kalsait
// Date        : 17/01/26
//
////////////////////////////////////////////////////////////////////

import { useContext } from "react";
import { Navigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";


/**
 * ////////////////////////////////////////////////////////////////
 *
 * Function Name : RoleGuard
 * Description   : Allows access only if user role is permitted
 * Author        : Pradhumnya Changdev Kalsait
 * Date          : 17/01/26
 *
 * ////////////////////////////////////////////////////////////////
 */

function RoleGuard({ allowedRoles, children }) 
{

  const { userRole, isAuthenticated } = useContext(AuthContext);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (!allowedRoles.includes(userRole)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
}

export default RoleGuard;
