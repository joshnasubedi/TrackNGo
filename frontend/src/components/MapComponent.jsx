import React from "react";

const MapComponent = () => {
  const websiteUrl = "http://localhost:3000/"; // You can change this URL dynamically

  return (
    <div style={{ height: "100vh", width: "100%" }}>
      <iframe
        src={websiteUrl}
        title="Embedded Website"
        width="100%"
        height="100%"
        style={{ border: "none" }}
        allow="geolocation"
      />
    </div>
  );
};

export default MapComponent;
