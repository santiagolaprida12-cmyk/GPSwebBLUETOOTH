// Coordenadas iniciales
let lat = -34.6037;
let lon = -58.3816;

const map = L.map('map').setView([lat, lon], 15);

// Capa satelital
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19
}).addTo(map);

// Marcador
const marker = L.marker([lat, lon]).addTo(map)
    .bindPopup('Carro GPS')
    .openPopup();

// Función para simular movimiento
function actualizarPosicion() {
    // Simulamos un pequeño cambio en lat/lon
    lat += (Math.random() - 0.5) * 0.0005;
    lon += (Math.random() - 0.5) * 0.0005;
    
    marker.setLatLng([lat, lon]);
    map.panTo([lat, lon]);
}

// Actualiza cada 2 segundos
setInterval(actualizarPosicion, 2000);
