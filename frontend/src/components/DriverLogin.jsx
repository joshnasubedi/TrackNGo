import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const DriverLogin = () => {
  const [loginData, setLoginData] = useState({ email: "", password: "" });
  const navigate = useNavigate();

  const handleLoginChange = (e) => {
    setLoginData({ ...loginData, [e.target.name]: e.target.value });
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch("http://localhost:1337/api/auth/local", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          identifier: loginData.email,
          password: loginData.password,
        }),
      });

      const data = await response.json();

      if (data.jwt) {
        localStorage.setItem("jwt", data.jwt);
        localStorage.setItem("driver", JSON.stringify(data.user));
        navigate("/driver-dashboard");
      } else {
        alert(data.error?.message || "Invalid login");
      }
    } catch (error) {
      console.error("Login error:", error);
      alert("Something went wrong");
    }
  };

  return (
    <div
      className="min-h-screen w-full flex flex-col items-center py-8"
      style={{ background: "var(--background)", color: "var(--text)" }}
    >
      <header className="navbar flex items-center justify-between w-full shadow-md">
        <a href="/" className="text-2xl font-bold tracking-wide">
          TrackNGo
        </a>
      </header>

      <div
        className="w-[360px] h-[500px] mt-6 rounded-[25px] p-5 relative overflow-hidden"
        style={{ background: "var(--white)" }}
      >
        <h2 className="text-xl font-semibold text-center mb-4">Driver Login</h2>

        <form
          onSubmit={handleLogin}
          className="w-[280px] mx-auto mt-8"
        >
          <input
            type="text"
            name="email"
            value={loginData.email}
            onChange={handleLoginChange}
            className="w-full border-b py-2 my-2 outline-none"
            style={{ background: "transparent", borderColor: "#ccc" }}
            placeholder="Email"
            required
          />
          <input
            type="password"
            name="password"
            value={loginData.password}
            onChange={handleLoginChange}
            className="w-full border-b py-2 my-2 outline-none"
            style={{ background: "transparent", borderColor: "#ccc" }}
            placeholder="Password"
            required
          />

          <button
            className="w-[85%] py-2 px-4 rounded-[30px] mx-auto block mt-6"
            style={{
              background:
                "linear-gradient(to right, var(--primary), var(--tertiary))",
              color: "var(--text)",
            }}
          >
            Log In
          </button>
        </form>
      </div>
    </div>
  );
};

export default DriverLogin;
