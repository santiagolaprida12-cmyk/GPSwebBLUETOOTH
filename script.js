// Coordenadas iniciales
let lat = -34.6037;
let lon = -58.3816;
let rumbo = 0;

// Inicializar mapa Leaflet
const map = L.map('map').setView([lat, lon], 17);

// Capa OpenStreetMap
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

// Función para mover marcador
function actualizarPosicion() {
    marker.setLatLng([lat, lon]);
    actualizarInfo();
}

// Controles interactivos
document.getElementById('zoomIn').onclick = () => map.zoomIn();
document.getElementById('zoomOut').onclick = () => map.zoomOut();
document.getElementById('center').onclick = () => map.panTo([lat, lon]);

// ===== Bluetooth BLE =====
let bluetoothDevice;
let rxCharacteristic;

// Conectar al módulo BLE
document.getElementById("connectBLE").addEventListener("click", async () => {
    try {
        bluetoothDevice = await navigator.bluetooth.requestDevice({
            filters: [{ namePrefix: "MLT-BT05" }], // cambia el nombre según tu módulo
            optionalServices: [0xFFE0]            // servicio UART típico
        });

        const server = await bluetoothDevice.gatt.connect();
        const service = await server.getPrimaryService(0xFFE0);
        rxCharacteristic = await service.getCharacteristic(0xFFE1);

        await rxCharacteristic.startNotifications();
        rxCharacteristic.addEventListener("characteristicvaluechanged", manejarDatos);

        alert("✅ Conectado al módulo BLE");
    } catch (error) {
        console.error("Error BLE:", error);
        alert("❌ Error al conectar BLE");
    }
});

// Manejar datos entrantes del Arduino
function manejarDatos(event) {
    const decoder = new TextDecoder("utf-8");
    const value = decoder.decode(event.target.value);
    console.log("Datos recibidos:", value);

    // Espera datos en formato: LAT,LON,RUMBO
    const partes = value.trim().split(",");
    if (partes.length === 3) {
        const nuevaLat = parseFloat(partes[0]);
        const nuevaLon = parseFloat(partes[1]);
        const nuevoRumbo = parseFloat(partes[2]);

        if (!isNaN(nuevaLat) && !isNaN(nuevaLon) && !isNaN(nuevoRumbo)) {
            lat = nuevaLat;
            lon = nuevaLon;
            rumbo = nuevoRumbo;

            actualizarPosicion();
            map.panTo([lat, lon]);
        }
    }
}

// Inicializar pantalla
actualizarInfo();
