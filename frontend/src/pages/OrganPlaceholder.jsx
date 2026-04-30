////////////////////////////////////////////////////////////////////
//
// File Name : OrganPlaceholder.jsx
// Description : Organ-specific placeholder page with navbar
// Author : Pradhumnya Changdev Kalsait
// Date : 17/01/26
//
////////////////////////////////////////////////////////////////////

import { useParams } from "react-router-dom";
import Navbar from "../components/Navbar";

function OrganPlaceholder() {
  const { organName } = useParams();

  return (
    <>
      <Navbar />

      <div className="min-h-screen flex items-center justify-center bg-appbg relative overflow-hidden">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-80 h-80 bg-primary/5 rounded-full blur-3xl"></div>

        <div className="relative bg-white/80 backdrop-blur-xl rounded-2xl shadow-card border border-cardborder/40 p-10 text-center animate-fade-in">
          <div className="w-16 h-16 mx-auto mb-5 rounded-full bg-primary-light flex items-center justify-center text-3xl">
            🔬
          </div>
          <h2 className="text-2xl font-bold text-textprimary">
            {organName.toUpperCase()} Form Coming Soon
          </h2>
          <p className="mt-2 text-textsecondary text-sm">
            This module is under development
          </p>
        </div>
      </div>
    </>
  );
}

export default OrganPlaceholder;
