// Login.jsx with Strapi integration using auth table and CSS variables
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { fetchDataFromApi, postDataToApi } from "../api/api";

const Login = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [loginData, setLoginData] = useState({ email: "", password: "" });
  const [registerData, setRegisterData] = useState({
    name: "",
    email: "",
    password: "",
    childName: "",
    childClass: "",
    childRoll: "",
  });
  const navigate = useNavigate();
 const handleDriverClick = () => {
    navigate("/driver-login"); 
  };
  const switchToRegister = () => setIsLogin(false);
  const switchToLogin = () => setIsLogin(true);

  const handleLoginChange = (e) => {
    setLoginData({ ...loginData, [e.target.name]: e.target.value });
  };

  const handleRegisterChange = (e) => {
    setRegisterData({ ...registerData, [e.target.name]: e.target.value });
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const users = await fetchDataFromApi(
        `/auths?filters[email][$eq]=${loginData.email}&filters[password][$eq]=${loginData.password}`
      );
      if (users && users.data && users.data.length > 0) {
        localStorage.setItem("user", JSON.stringify(users.data[0].email));
        navigate("/dashboard");
      } else {
        alert("Invalid login credentials");
      }
    } catch (error) {
      console.error("Login error:", error);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    const payload = {
      name: registerData.name,
      email: registerData.email,
      password: registerData.password,
    };
    try {
      const response = await postDataToApi("/auths", { data: payload });
      alert("Registered Successfully");
      console.log(response);
    } catch (error) {
      console.error("Registration failed:", error);
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
        className="w-[360px] h-[600px] mt-6 rounded-[25px] p-5 relative overflow-hidden"
        style={{ background: "var(--white)" }}
      >
        <div className="w-[220px] mx-auto relative shadow-[0_0_20px_9px_rgba(56,189,248,0.12)]">
          <div
            className="absolute top-0 h-full w-[110px] rounded-[30px] transition-all duration-500"
            style={{
              left: isLogin ? "0px" : "110px",
              background: "linear-gradient(to right, var(--primary), var(--tertiary))",
            }}
          ></div>
          <button className="py-2 px-6 relative z-10" onClick={switchToLogin}>
            Log In
          </button>
          <button className="py-2 px-6 relative z-10" onClick={switchToRegister}>
            Register
          </button>
        </div>

        {/* Login Form */}
        <form
          onSubmit={handleLogin}
          className={`absolute w-[280px] mt-4 transition-all duration-500 top-[120px] ${
            isLogin ? "left-[50px]" : "-left-[400px]"
          }`}
        >
          <input
            type="text"
            name="email"
            value={loginData.email}
            onChange={handleLoginChange}
            className="w-[91%] border-b py-2 my-1 outline-none"
            style={{ background: "transparent", borderColor: "#ccc" }}
            placeholder="Email"
            required
          />
          <input
            type="password"
            name="password"
            value={loginData.password}
            onChange={handleLoginChange}
            className="w-[91%] border-b py-2 my-1 outline-none"
            style={{ background: "transparent", borderColor: "#ccc" }}
            placeholder="Password"
            required
          />
          <div className="my-4">
            <input type="checkbox" className="mr-2" required />
            <span className="text-sm">I agree to the terms and conditions.</span>
          </div>
          <button
            className="w-[85%] py-2 px-4 rounded-[30px] mx-auto block"
            style={{
              background: "linear-gradient(to right, var(--primary), var(--tertiary))",
              color: "var(--text)",
            }}
          >
            Log In
          </button>
          <p className="mt-6 text-sm">Forgot Your Password?? No worry.</p>
          <a href="#" className="text-sm underline">
            Click here
          </a>
        </form>

        {/* Register Form */}
        <form
          onSubmit={handleRegister}
          className={`absolute w-[280px] mt-4 transition-all duration-500 top-[120px] ${
            !isLogin ? "left-[50px]" : "left-[450px]"
          }`}
        >
          <input
            type="text"
            name="name"
            value={registerData.name}
            onChange={handleRegisterChange}
            className="w-[91%] border-b py-2 my-1 outline-none"
            style={{ background: "transparent", borderColor: "#ccc" }}
            placeholder="Your Name"
            required
          />
          <input
            type="email"
            name="email"
            value={registerData.email}
            onChange={handleRegisterChange}
            className="w-[91%] border-b py-2 my-1 outline-none"
            style={{ background: "transparent", borderColor: "#ccc" }}
            placeholder="Email address"
            required
          />
          <input
            type="password"
            name="password"
            value={registerData.password}
            onChange={handleRegisterChange}
            className="w-[91%] border-b py-2 my-1 outline-none"
            style={{ background: "transparent", borderColor: "#ccc" }}
            placeholder="Password"
            required
          />
          <input
            type="text"
            name="childName"
            value={registerData.childName}
            onChange={handleRegisterChange}
            className="w-[91%] border-b py-2 my-1 outline-none"
            style={{ background: "transparent", borderColor: "#ccc" }}
            placeholder="Child's Name"
            required
          />
          <input
            type="number"
            name="childClass"
            value={registerData.childClass}
            onChange={handleRegisterChange}
            className="w-[91%] border-b py-2 my-1 outline-none"
            style={{ background: "transparent", borderColor: "#ccc" }}
            placeholder="Class"
            required
          />
          <input
            type="number"
            name="childRoll"
            value={registerData.childRoll}
            onChange={handleRegisterChange}
            className="w-[91%] border-b py-2 my-1 outline-none"
            style={{ background: "transparent", borderColor: "#ccc" }}
            placeholder="Roll no."
            required
          />
          <div className="my-4">
            <input type="checkbox" className="mr-2" required />
            <span className="text-sm">I agree to the terms and conditions.</span>
          </div>
          <button
            className="w-[85%] py-2 px-4 rounded-[30px] mx-auto block"
            style={{
              background: "linear-gradient(to right, var(--primary), var(--tertiary))",
              color: "var(--text)",
            }}
          >
            Register
          </button>
          <p className="mt-6 text-sm">Forgot Your Password?? No worry.</p>
          <a href="#" className="text-sm underline">
            Click here
          </a>
        </form>

        <button
          className="mt-6 py-3 px-6 rounded-[30px] mx-auto block"
          onClick={() => navigate("/driver-login")}
          style={{
            background: "linear-gradient(to right, var(--primary), var(--tertiary))",
            color: "var(--text)",
          }}
        >
          Continue as driver.
        </button>
      </div>
    </div>
  );
};

export default Login;
