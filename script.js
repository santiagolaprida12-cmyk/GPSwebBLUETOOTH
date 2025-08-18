// Coordenadas iniciales
let lat = -34.6037;
let lon = -58.3816;
let rumbo = 0;

// Inicializar mapa Leaflet
const map = L.map('map').setView([lat, lon], 17);

// Capa satelital/OSM
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19
}).addTo(map);

// Marcador
const marker = L.marker([lat, lon]).addTo(map)
    .bindPopup('Carro GPS')
    .openPopup();

// Actualizar panel de info
function actualizarInfo() {
    document.getElementById('lat').innerText = `Lat: ${lat.toFixed(6)}`;
    document.getElementById('lon').innerText = `Lon: ${lon.toFixed(6)}`;
    document.getElementById('rumbo').innerText = `Rumbo: ${rumbo.toFixed(1)}°`;
}

// Simulación de movimiento
function actualizarPosicion() {
    lat += (Math.random() - 0.5) * 0.0005;
    lon += (Math.random() - 0.5) * 0.0005;
    rumbo = Math.random() * 360;

    marker.setLatLng([lat, lon]);
    map.panTo([lat, lon]);
    actualizarInfo();
}

// Controles interactivos
document.getElementById('zoomIn').onclick = () => map.zoomIn();
document.getElementById('zoomOut').onclick = () => map.zoomOut();
document.getElementById('center').onclick = () => map.panTo([lat, lon]);

// Actualizar cada 2 segundos
setInterval(actualizarPosicion, 2000);
actualizarInfo();
