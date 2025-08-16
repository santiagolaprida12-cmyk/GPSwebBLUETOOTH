let map, marker;

function initMap() {
  map = L.map('map').setView([-34.61, -58.38], 18);

  L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
    attribution: 'Tiles &copy; Esri',
    maxZoom: 23
  }).addTo(map);

  marker = L.marker([-34.61, -58.38]).addTo(map)
    .bindPopup('Carro GPS')
    .openPopup();
}

function actualizarPos(lat, lon) {
  if (!marker) return;
  marker.setLatLng([lat, lon]);
  map.setView([lat, lon]);
  document.getElementById('lat').innerText = lat.toFixed(6);
  document.getElementById('lon').innerText = lon.toFixed(6);
}

async function conectarBLE() {
  try {
    const device = await navigator.bluetooth.requestDevice({
      filters: [{ namePrefix: 'MLT-BT05' }],
      optionalServices: ['0000ffe0-0000-1000-8000-00805f9b34fb']
    });

    const server = await device.gatt.connect();
    const service = await server.getPrimaryService('0000ffe0-0000-1000-8000-00805f9b34fb');
    const characteristic = await service.getCharacteristic('0000ffe1-0000-1000-8000-00805f9b34fb');

    await characteristic.startNotifications();
    characteristic.addEventListener('characteristicvaluechanged', event => {
      const value = new TextDecoder().decode(event.target.value);
      recibirDatosBLE(value);
    });

    console.log('Conectado a BLE');
    alert('BLE conectado correctamente');
  } catch (error) {
    console.error('Error al conectar BLE:', error);
    alert('Error al conectar BLE');
  }
}

function recibirDatosBLE(data) {
  data = data.trim();
  const partes = data.split(' ');
  if (partes[0] === 'POS' && partes.length === 3) {
    const lat = parseFloat(partes[1]);
    const lon = parseFloat(partes[2]);
    actualizarPos(lat, lon);
  }
}

window.onload = function() {
  initMap();
  document.getElementById('btnConnect').addEventListener('click', conectarBLE);
};
