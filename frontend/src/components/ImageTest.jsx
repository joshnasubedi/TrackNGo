// frontend/src/components/ImageTest.jsx
import React from "react";
import busRed from "../img/bus-red.png";
import busBlue from "../img/bus-blue.png";
import childMarker from "../img/child-marker.png";

const ImageTest = () => {
  console.log("Bus Red URL:", busRed);
  console.log("Bus Blue URL:", busBlue);
  console.log("Child Marker URL:", childMarker);

  return (
    <div style={{ padding: "20px" }}>
      <h2>Image Test</h2>
      <div style={{ display: "flex", gap: "20px" }}>
        <div>
          <h3>Bus Red</h3>
          <img src={busRed} alt="Bus Red" style={{ width: "100px", border: "2px solid red" }} />
          <p>Path: {busRed}</p>
        </div>
        <div>
          <h3>Bus Blue</h3>
          <img src={busBlue} alt="Bus Blue" style={{ width: "100px", border: "2px solid blue" }} />
          <p>Path: {busBlue}</p>
        </div>
        <div>
          <h3>Child Marker</h3>
          <img src={childMarker} alt="Child Marker" style={{ width: "100px", border: "2px solid green" }} />
          <p>Path: {childMarker}</p>
        </div>
      </div>
    </div>
  );
};

export default ImageTest;