////////////////////////////////////////////////////////////////////
//
// File Name : Unauthorized.jsx
// Description : Unauthorized access page
// Author      : Pradhumnya Changdev Kalsait
// Date        : 17/01/26
//
////////////////////////////////////////////////////////////////////

import { Link } from "react-router-dom";

/**
 * ////////////////////////////////////////////////////////////////
 *
 * Function Name : Unauthorized
 * Description   : Informs user of insufficient permissions
 * Author        : Pradhumnya Changdev Kalsait
 * Date          : 17/01/26
 *
 * ////////////////////////////////////////////////////////////////
 */
function Unauthorized() {

  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-appbg relative overflow-hidden">
      {/* Background accent */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-96 h-96 bg-danger/5 rounded-full blur-3xl"></div>

      <div className="relative bg-white/80 backdrop-blur-xl rounded-2xl shadow-card border border-cardborder/40 p-10 text-center max-w-md animate-fade-in">
        <div className="w-16 h-16 mx-auto mb-5 rounded-full bg-red-50 flex items-center justify-center text-3xl">
          🚫
        </div>

        <h1 className="text-3xl font-bold text-danger mb-2">
          Access Denied
        </h1>

        <p className="text-textsecondary">
          You do not have permission to view this page.
        </p>

        <Link
          to="/dashboard"
          className="inline-block mt-6 btn-primary"
        >
          Go back to dashboard
        </Link>
      </div>
    </div>
  );
}

export default Unauthorized;
