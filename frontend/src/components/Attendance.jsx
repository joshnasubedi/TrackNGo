import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import './Dashboard.css'; // Make sure this CSS has fallback colors

const Attendance = () => {
  const navigate = useNavigate();

  const students = ["Ram", "Hari", "Sita", "Gita"];
  const [presentStudents, setPresentStudents] = useState([]);

  const toggleAttendance = (student) => {
    if (presentStudents.includes(student)) {
      setPresentStudents(presentStudents.filter((s) => s !== student));
    } else {
      setPresentStudents([...presentStudents, student]);
    }
  };

  const handleSubmit = () => {
    alert(`Attendance taken for: ${presentStudents.join(", ")}`);
    navigate("/driver-homepage", { state: { count: presentStudents.length } });
  };

  return (
    <div className="attendance-page" style={{ padding: "2rem", background: "white", minHeight: "100vh" }}>
      <h2 style={{ marginBottom: "1.5rem", color: "#333" }}>✅ Take Attendance</h2>
      <ul className="student-list" style={{ listStyle: "none", padding: 0 }}>
        {students.map((student) => (
          <li
            key={student}
            onClick={() => toggleAttendance(student)}
            style={{
              padding: "1rem",
              marginBottom: "0.75rem",
              border: "2px solid #38bdf8",
              borderRadius: "10px",
              cursor: "pointer",
              backgroundColor: presentStudents.includes(student) ? "#38bdf8" : "#f9f9f9",
              color: presentStudents.includes(student) ? "#fff" : "#222",
              fontWeight: "bold",
              transition: "0.3s",
            }}
          >
            {student}
          </li>
        ))}
      </ul>

      <p style={{ marginTop: "1.5rem", fontSize: "1.1rem", color: "#444" }}>
        Students Present: <strong>{presentStudents.length}</strong>
      </p>

      <button
        onClick={handleSubmit}
        style={{
          marginTop: "1rem",
          padding: "0.75rem 2rem",
          backgroundColor: "#38bdf8",
          color: "#fff",
          border: "none",
          borderRadius: "8px",
          fontWeight: "bold",
          cursor: "pointer",
        }}
      >
        ✅ Submit Attendance
      </button>
    </div>
  );
};

export default Attendance;
