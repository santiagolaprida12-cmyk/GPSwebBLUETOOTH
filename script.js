// ===== Estado =====
let lat = -34.4052646;
let lon = -59.8514714;
let rumbo = 0;

// ===== Mapa Esri World Imagery =====
const map = L.map('map').setView([lat, lon], 17);
L.tileLayer(
  'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
  {
    attribution: 'Tiles &copy; Esri &mdash; Source: Esri, Maxar, Earthstar Geographics',
    maxZoom: 20
  }
).addTo(map);

const marker = L.marker([lat, lon]).addTo(map).bindPopup('Carro GPS');

// ===== DOM =====
const latVal = document.getElementById('latVal');
const lonVal = document.getElementById('lonVal');
const rumboVal = document.getElementById('rumboVal');
const testOutput = document.getElementById('testOutput');

function actualizarInfo() {
  latVal.textContent = lat.toFixed(6);
  lonVal.textContent = lon.toFixed(6);
  rumboVal.textContent = `${rumbo.toFixed(1)}°`;
}
function actualizarPosicion() {
  marker.setLatLng([lat, lon]);
  actualizarInfo();
}

// ===== BLE =====
let bluetoothDevice, gattServer, uartService, txCharacteristic, rxCharacteristic;
const UART_SERVICE = 0xFFE0;
const UART_CHAR_RX = 0xFFE1;
const UART_CHAR_TX = 0xFFE1;

document.getElementById('connectBLE').addEventListener('click', async () => {
  try {
    bluetoothDevice = await navigator.bluetooth.requestDevice({
      filters: [{ namePrefix: 'MLT-BT05' }, { namePrefix: 'BT05' }],
      optionalServices: [UART_SERVICE]
    });

    gattServer = await bluetoothDevice.gatt.connect();
    uartService = await gattServer.getPrimaryService(UART_SERVICE);
    rxCharacteristic = await uartService.getCharacteristic(UART_CHAR_RX);
    txCharacteristic = rxCharacteristic;

    await rxCharacteristic.startNotifications();
    rxCharacteristic.addEventListener('characteristicvaluechanged', manejarDatos);

    logOk(`Conectado a ${bluetoothDevice.name}`);
  } catch (e) {
    logErr(`Error BLE: ${e}`);
  }
});

async function enviarComando(cmd) {
  if (!txCharacteristic) { logWarn('No conectado al BLE'); return; }
  const data = new TextEncoder().encode(cmd + '\n');
  try {
    await txCharacteristic.writeValue(data);
    logInfo(`→ ${cmd}`);
  } catch (e) {
    logErr(`No se pudo enviar: ${e}`);
  }
}

// ===== Botones =====
document.getElementById('btnTest').addEventListener('click', () => enviarComando('TEST'));
document.getElementById('btnCheckGPS').addEventListener('click', () => enviarComando('CHECK GPS'));
document.getElementById('btnClear').addEventListener('click', () => (testOutput.innerHTML = ''));

// Enviar coordenadas
document.getElementById('btnEnviarCoords').addEventListener('click', () => {
  const nlat = parseFloat(document.getElementById('inputLat').value);
  const nlon = parseFloat(document.getElementById('inputLon').value);
  if (!isNaN(nlat) && !isNaN(nlon)) {
    enviarComando(`GO ${nlat} ${nlon}`);
    logInfo(`Coordenadas enviadas: ${nlat}, ${nlon}`);
  } else logWarn('Lat o Lon inválidos');
});

// Enviar PID
document.getElementById('btnEnviarPID').addEventListener('click', () => {
  const kp = parseFloat(document.getElementById('inputKp').value);
  const ki = parseFloat(document.getElementById('inputKi').value);
  const kd = parseFloat(document.getElementById('inputKd').value);
  if (!isNaN(kp) && !isNaN(ki) && !isNaN(kd)) {
    enviarComando(`PID ${kp} ${ki} ${kd}`);
    logInfo(`PID enviado: Kp=${kp}, Ki=${ki}, Kd=${kd}`);
  } else logWarn('Valores PID inválidos');
});

// ===== Recepción de datos =====
function manejarDatos(event) {
  const text = new TextDecoder('utf-8').decode(event.target.value).trim();
  const lineas = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  lineas.forEach(parseLinea);
}

let enBloqueTest = false;
function parseLinea(line) {
  // POS lat,lon
  if (line.startsWith('POS ')) {
    const payload = line.slice(4).split(',');
    if (payload.length === 2) {
      const nlat = parseFloat(payload[0]);
      const nlon = parseFloat(payload[1]);
      if (!isNaN(nlat) && !isNaN(nlon)) {
        lat = nlat; lon = nlon;
        actualizarPosicion();
        map.panTo([lat, lon]);
      }
    }
    return;
  }

  // Bloques TEST
  if (line === '=== TEST BEGIN ===') {
    enBloqueTest = true;
    appendLine('⟪ TEST BEGIN ⟫', 'test-begin');
    return;
  }
  if (line === '=== TEST END ===') {
    enBloqueTest = false;
    appendLine('⟪ TEST END ⟫', 'test-end');
    return;
  }

  // INFO / CHECK
  if (line.startsWith('GPS OK:')) appendLine(line, 'test-info');
  else if (line.startsWith('GPS ERROR')) appendLine(line, 'test-err');
  else if (line.startsWith('INFO')) appendLine(line, 'test-info');
  else if (line.startsWith('CHECK') || enBloqueTest) appendLine(line, 'test-info');
  else appendLine(line);
}

// ===== Utilidades UI =====
function appendLine(text, cls = '') {
  const div = document.createElement('div');
  if (cls) div.className = cls;
  div.textContent = text;
  testOutput.appendChild(div);
  testOutput.scrollTop = testOutput.scrollHeight;
}

function logOk(msg)   { appendLine(`✅ ${msg}`, 'test-info'); }
function logInfo(msg) { appendLine(`${msg}`, 'test-info'); }
function logWarn(msg) { appendLine(`⚠️ ${msg}`, 'test-warn'); }
function logErr(msg)  { appendLine(`❌ ${msg}`, 'test-err'); }

// ===== Inicio =====
actualizarInfo();
