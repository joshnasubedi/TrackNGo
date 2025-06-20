import React, { useEffect } from "react";

const HomeLayout = ({ children }) => {
  useEffect(() => {
    if (!localStorage.getItem("user")) {
      window.location.href = "/login";
    }
  });
  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col">
      <header className="bg-[#ff105f] px-8 py-4 shadow-md">
        <h1 className="text-3xl font-bold">Welcome to TrackU</h1>
      </header>

      <main className="flex-grow p-8">{children}</main>

      <footer className="bg-[#263043] text-center py-4">
        <p>© 2025 TrackU. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default HomeLayout;
