const socket = io();

const map = L.map("map").setView([27.7172, 85.324], 16); // Default center

L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  attribution: "OpenStreetMap",
}).addTo(map);

const markers = {};
let routingControl;
const DESTINATION = [27.7172, 85.324]; // Kathmandu Durbar Square (example)

if (navigator.geolocation) {
  navigator.geolocation.watchPosition(
    (position) => {
      const { latitude, longitude } = position.coords;
      socket.emit("send-location", { latitude, longitude });
    },
    (error) => {
      console.error("Geolocation error:", error);
    },
    {
      enableHighAccuracy: true,
      timeout: 5000,
      maximumAge: 0,
    }
  );
} else {
  alert("Geolocation is not supported by your browser.");
}

socket.on("receive-location", (data) => {
  const { id, latitude, longitude } = data;
  if (!latitude || !longitude) return;

  if (markers[id]) {
    markers[id].setLatLng([latitude, longitude]);
  } else {
    markers[id] = L.marker([latitude, longitude]).addTo(map);
  }

  if (id === socket.id) {
    map.setView([latitude, longitude]);

    if (routingControl) {
      map.removeControl(routingControl);
    }

    routingControl = L.Routing.control({
      waypoints: [L.latLng(latitude, longitude), L.latLng(...DESTINATION)],
      routeWhileDragging: false,
      addWaypoints: false,
      draggableWaypoints: false,
      show: false,
      createMarker: () => null,
    }).addTo(map);
  }
});

socket.on("user-disconnected", (id) => {
  if (markers[id]) {
    map.removeLayer(markers[id]);
    delete markers[id];
  }
});
