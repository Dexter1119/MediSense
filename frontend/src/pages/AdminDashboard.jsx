////////////////////////////////////////////////////////////////////
//
// File Name : AdminDashboard.jsx
// Description : Admin-only dashboard page
// Author      : Pradhumnya Changdev Kalsait
// Date        : 17/01/26
//
////////////////////////////////////////////////////////////////////

import Navbar from "../components/Navbar";


/**
 * ////////////////////////////////////////////////////////////////
 *
 * Function Name : AdminDashboard
 * Description   : Displays administrative controls and statistics
 * Author        : Pradhumnya Changdev Kalsait
 * Date          : 17/01/26
 *
 * ////////////////////////////////////////////////////////////////
*/

function AdminDashboard() {

  const adminCards = [
    {
      title: "User Management",
      desc: "View and manage registered users",
      emoji: "👥",
      color: "from-indigo-500 to-violet-500",
    },
    {
      title: "Model Status",
      desc: "Monitor ML model health",
      emoji: "🤖",
      color: "from-teal-500 to-emerald-500",
    },
    {
      title: "System Logs",
      desc: "Review audit and access logs",
      emoji: "📋",
      color: "from-amber-500 to-orange-500",
    },
  ];

  return (
    <>
      <Navbar />

      <div className="min-h-screen bg-appbg relative overflow-hidden">
        {/* Background accents */}
        <div className="absolute top-20 right-0 w-72 h-72 bg-primary/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 left-0 w-56 h-56 bg-accent/8 rounded-full blur-3xl"></div>

        <div className="max-w-7xl mx-auto px-6 py-14">
          <h1 className="text-3xl font-bold mb-2 text-textprimary">
            Admin Dashboard
          </h1>

          <p className="text-textsecondary mb-10">
            Manage users, models, and system configuration.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {adminCards.map((card, idx) => (
              <div
                key={idx}
                className="group bg-white/90 backdrop-blur-xl p-6 rounded-2xl shadow-card border border-cardborder/30 hover:shadow-card-hover hover:-translate-y-1 transition-all duration-300"
              >
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-white text-xl bg-gradient-to-br ${card.color} shadow-sm mb-4`}>
                  {card.emoji}
                </div>
                <h3 className="font-semibold text-lg text-textprimary">{card.title}</h3>
                <p className="text-sm text-textsecondary mt-2 leading-relaxed">
                  {card.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}

export default AdminDashboard;
