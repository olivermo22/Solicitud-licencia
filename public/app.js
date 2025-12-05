// app.js - Frontend principal del formulario de Gestoría Virtual

const ADMIN_WHATSAPP_NUMBER = "527225600905";

// ===============================
// REFERENCIAS
// ===============================
const btnAdmin = document.getElementById("btnAdmin");
const form = document.getElementById("solicitudForm");
const globalLoader = document.getElementById("globalLoader");

// Datos personales
const inputNombre = document.getElementById("nombre");
const inputApellidos = document.getElementById("apellidos");
const inputCurp = document.getElementById("curp");
const inputTelefono = document.getElementById("telefono");
const inputTipoLicencia = document.getElementById("tipoLicencia");
const inputVigencia = document.getElementById("vigencia");
const inputDomicilioGuerrero = document.getElementById("domicilioGuerrero");
const inputAlergias = document.getElementById("alergias");
const inputTipoSangre = document.getElementById("tipoSangre");

// Contacto emergencia
const inputEmergenciaNombre = document.getElementById("emergenciaNombre");
const inputEmergenciaTelefono = document.getElementById("emergenciaTelefono");

// Datos de envío
const inputEnvioNombreDest = document.getElementById("envioNombreDestinatario");
const inputEnvioTelefonoDest = document.getElementById("envioTelefonoDestinatario");
const inputEnvioCalle = document.getElementById("envioCalle");
const inputEnvioNumero = document.getElementById("envioNumero");
const inputEnvioColonia = document.getElementById("envioColonia");
const inputEnvioCP = document.getElementById("envioCP");
const inputEnvioCiudadEstado = document.getElementById("envioCiudadEstado");

// Fotos y firma
const btnPersonaCamera = document.getElementById("btnPersonaCamera");
const btnPersonaFile = document.getElementById("btnPersonaFile");
const fotoPersonaInput = document.getElementById("fotoPersonaInput");
const fotoPersonaPreview = document.getElementById("fotoPersonaPreview");
const fotoPersonaActions = document.getElementById("fotoPersonaActions");
const btnPersonaUsar = document.getElementById("btnPersonaUsar");
const btnPersonaCambiar = document.getElementById("btnPersonaCambiar");
const inputPersonaPhotoUrl = document.getElementById("personaPhotoUrl");

const btnIdCamera = document.getElementById("btnIdCamera");
const btnIdFile = document.getElementById("btnIdFile");
const fotoIdInput = document.getElementById("fotoIdInput");
const fotoIdPreview = document.getElementById("fotoIdPreview");
const fotoIdActions = document.getElementById("fotoIdActions");
const btnIdUsar = document.getElementById("btnIdUsar");
const btnIdCambiar = document.getElementById("btnIdCambiar");
const inputIdPhotoUrl = document.getElementById("idPhotoUrl");

const tabFirmaSubir = document.getElementById("tabFirmaSubir");
const tabFirmaDibujar = document.getElementById("tabFirmaDibujar");
const firmaSubirPanel = document.getElementById("firmaSubirPanel");
const firmaDibujarPanel = document.getElementById("firmaDibujarPanel");

const fotoFirmaInput = document.getElementById("fotoFirmaInput");
const firmaPreview = document.getElementById("firmaPreview");
const inputFirmaUrl = document.getElementById("firmaUrl");
const firmaActions = document.getElementById("firmaActions");
const btnFirmaCambiar = document.getElementById("btnFirmaCambiar");

// Firma dibujada
const signaturePad = document.getElementById("signaturePad");
const btnLimpiarFirma = document.getElementById("btnLimpiarFirma");
const btnConfirmarFirmaCanvas = document.getElementById("btnConfirmarFirmaCanvas");

let firmaCtx = null;
let drawing = false;

// Cámara
const cameraModal = document.getElementById("cameraModal");
const cameraVideo = document.getElementById("cameraVideo");
const takePhotoBtn = document.getElementById("takePhotoBtn");
const closeCameraBtn = document.getElementById("closeCameraBtn");
let cameraStream = null;
let cameraCallback = null;

// Estado interno
let personaUrl = "";
let idUrl = "";
let firmaUrl = "";

// ===============================
// BOTÓN ADMIN
// ===============================
if (btnAdmin) {
  btnAdmin.addEventListener("click", () => {
    window.location.href = "/login.html";
  });
}

// ===============================
// HELPERS UI
// ===============================
function showGlobalLoader(show) {
  if (!globalLoader) return;
  globalLoader.style.display = show ? "flex" : "none";
}

function setPreviewLoading(container) {
  container.classList.add("loading");
  container.innerHTML = `<span class="placeholder">Procesando...</span>`;
}

function setPreviewImage(container, url) {
  container.classList.remove("loading");
  container.innerHTML = `<img src="${url}" alt="preview"/>`;
}

function resetPreview(container, text) {
  container.classList.remove("loading");
  container.innerHTML = `<span class="placeholder">${text}</span>`;
}

// ===============================
// CÁMARA
// ===============================
async function openCamera(callback, options = { silhouette: true, rearCamera: false }) {
  cameraCallback = callback;
  cameraModal.style.display = "flex";

  try {
    const constraints = {
      video: { facingMode: options.rearCamera ? { exact: "environment" } : "user" }
    };

    cameraStream = await navigator.mediaDevices.getUserMedia(constraints);
    cameraVideo.srcObject = cameraStream;

  } catch (err) {
    alert("No se pudo acceder a la cámara.");
    closeCamera();
  }
}

function closeCamera() {
  cameraModal.style.display = "none";
  if (cameraStream) cameraStream.getTracks().forEach(t => t.stop());
  cameraStream = null;
}

takePhotoBtn.addEventListener("click", async () => {
  const canvas = document.createElement("canvas");
  canvas.width = cameraVideo.videoWidth;
  canvas.height = cameraVideo.videoHeight;

  const ctx = canvas.getContext("2d");
  ctx.drawImage(cameraVideo, 0, 0, canvas.width, canvas.height);

  const blob = await new Promise(r => canvas.toBlob(r, "image/jpeg", 0.95));
  if (cameraCallback) await cameraCallback(blob);

  closeCamera();
});

closeCameraBtn.addEventListener("click", closeCamera);

// ===============================
// SUBIR IMAGEN AL SERVIDOR
// ===============================
async function uploadImage(fileOrBlob, type) {
  const fd = new FormData();
  fd.append("image", fileOrBlob);

  const res = await fetch(`/api/upload/image?type=${type}`, {
    method: "POST",
    body: fd
  });

  const data = await res.json();
  if (!data.url) throw new Error("Error al subir imagen");

  return data.url;
}

// ===============================
// FOTO PERSONA
// ===============================
btnPersonaFile.addEventListener("click", () => fotoPersonaInput.click());

fotoPersonaInput.addEventListener("change", async () => {
  if (fotoPersonaInput.files.length) {
    await handlePersonaImage(fotoPersonaInput.files[0]);
  }
});

btnPersonaCamera.addEventListener("click", () => {
  openCamera(blob => handlePersonaImage(blob), { silhouette: true, rearCamera: false });
});

async function handlePersonaImage(fileOrBlob) {
  try {
    setPreviewLoading(fotoPersonaPreview);
    showGlobalLoader(true);

    const url = await uploadImage(fileOrBlob, "persona");
    personaUrl = url;
    inputPersonaPhotoUrl.value = url;

    setPreviewImage(fotoPersonaPreview, url);
    fotoPersonaActions.style.display = "flex";

    btnPersonaUsar.onclick = () => {};
    btnPersonaCambiar.onclick = () => {
      personaUrl = "";
      inputPersonaPhotoUrl.value = "";
      resetPreview(fotoPersonaPreview, "Aún no hay foto");
      fotoPersonaActions.style.display = "none";
    };

  } catch (err) {
    alert("Error procesando la foto.");
  } finally {
    showGlobalLoader(false);
  }
}

// ===============================
// FOTO IDENTIFICACIÓN
// ===============================
btnIdFile.addEventListener("click", () => fotoIdInput.click());

fotoIdInput.addEventListener("change", async () => {
  if (fotoIdInput.files.length) {
    await handleIdImage(fotoIdInput.files[0]);
  }
});

btnIdCamera.addEventListener("click", () => {
  openCamera(blob => handleIdImage(blob), { silhouette: false, rearCamera: true });
});

async function handleIdImage(fileOrBlob) {
  try {
    setPreviewLoading(fotoIdPreview);
    showGlobalLoader(true);

    const url = await uploadImage(fileOrBlob, "identificacion");
    idUrl = url;
    inputIdPhotoUrl.value = url;

    setPreviewImage(fotoIdPreview, url);
    fotoIdActions.style.display = "flex";

    btnIdCambiar.onclick = () => {
      idUrl = "";
      inputIdPhotoUrl.value = "";
      resetPreview(fotoIdPreview, "Aún no hay foto");
      fotoIdActions.style.display = "none";
    };

  } catch (err) {
    alert("Error procesando la identificación.");
  } finally {
    showGlobalLoader(false);
  }
}

// ===============================
// FIRMA
// ===============================
tabFirmaSubir.addEventListener("click", () => {
  tabFirmaSubir.classList.add("active");
  tabFirmaDibujar.classList.remove("active");
  firmaSubirPanel.style.display = "block";
  firmaDibujarPanel.style.display = "none";
});

tabFirmaDibujar.addEventListener("click", () => {
  tabFirmaSubir.classList.remove("active");
  tabFirmaDibujar.classList.add("active");
  firmaSubirPanel.style.display = "none";
  firmaDibujarPanel.style.display = "block";
  initSignaturePad();
});

// SUBIR FIRMA
fotoFirmaInput.addEventListener("change", async () => {
  if (!fotoFirmaInput.files.length) return;

  try {
    setPreviewLoading(firmaPreview);
    showGlobalLoader(true);

    const url = await uploadImage(fotoFirmaInput.files[0], "firma");
    firmaUrl = url;
    inputFirmaUrl.value = url;

    setPreviewImage(firmaPreview, url);
    firmaActions.style.display = "flex";

  } catch (err) {
    alert("Error procesando firma.");
  } finally {
    showGlobalLoader(false);
  }
});

// DIBUJAR FIRMA
function initSignaturePad() {
  const rect = signaturePad.getBoundingClientRect();
  const dpr = window.devicePixelRatio || 1;

  signaturePad.width = rect.width * dpr;
  signaturePad.height = rect.height * dpr;

  firmaCtx = signaturePad.getContext("2d");
  firmaCtx.setTransform(dpr, 0, 0, dpr, 0, 0);

  firmaCtx.fillStyle = "#fff";
  firmaCtx.fillRect(0, 0, rect.width, rect.height);

  firmaCtx.lineWidth = 2;
  firmaCtx.strokeStyle = "#000";
  firmaCtx.lineCap = "round";
}

function getPos(e) {
  const rect = signaturePad.getBoundingClientRect();
  const clientX = e.touches ? e.touches[0].clientX : e.clientX;
  const clientY = e.touches ? e.touches[0].clientY : e.clientY;
  return { x: clientX - rect.left, y: clientY - rect.top };
}

["mousedown","touchstart"].forEach(ev=>{
  signaturePad.addEventListener(ev, e=>{
    drawing = true;
    const {x,y}=getPos(e);
    firmaCtx.beginPath();
    firmaCtx.moveTo(x,y);
  });
});

["mousemove","touchmove"].forEach(ev=>{
  signaturePad.addEventListener(ev, e=>{
    if(!drawing) return;
    const {x,y}=getPos(e);
    firmaCtx.lineTo(x,y);
    firmaCtx.stroke();
  });
});

["mouseup","mouseleave","touchend","touchcancel"].forEach(ev=>{
  signaturePad.addEventListener(ev, ()=> drawing=false);
});

btnLimpiarFirma.addEventListener("click", ()=> initSignaturePad());

btnConfirmarFirmaCanvas.addEventListener("click", ()=>{
  signaturePad.toBlob(async blob=>{
    try{
      setPreviewLoading(firmaPreview);
      showGlobalLoader(true);

      const url = await uploadImage(blob, "firma");
      firmaUrl = url;
      inputFirmaUrl.value = url;

      setPreviewImage(firmaPreview, url);
      firmaActions.style.display = "flex";

    } catch(err){
      alert("Error subiendo firma.");
    } finally {
      showGlobalLoader(false);
    }
  });
});

btnFirmaCambiar.addEventListener("click", ()=>{
  firmaUrl="";
  inputFirmaUrl.value="";
  resetPreview(firmaPreview,"Aún no hay firma");
  firmaActions.style.display="none";
});

// ===============================
// ENVÍO DEL FORMULARIO
// ===============================
form.addEventListener("submit", async (e)=>{
  e.preventDefault();

  // Validaciones obligatorias
  if (!personaUrl) return alert("Falta foto de la persona.");
  if (!idUrl) return alert("Falta foto de identificación.");
  if (!firmaUrl) return alert("Falta firma.");
  if (!inputDomicilioGuerrero.checked)
    return alert("Debes aceptar el domicilio de Guerrero.");

  const nombreCompleto = `${inputNombre.value} ${inputApellidos.value}`.trim();

  const payload = {
    nombre: inputNombre.value.trim(),
    apellidos: inputApellidos.value.trim(),
    nombreCompleto,
    curp: inputCurp.value.trim(),
    telefono: inputTelefono.value.trim(),

    tipoLicencia: inputTipoLicencia.value,
    vigencia: inputVigencia.value,
    domicilioGuerrero: "SI",
    alergias: inputAlergias.value.trim(),
    tipoSangre: inputTipoSangre.value,

    emergenciaNombre: inputEmergenciaNombre.value.trim(),
    emergenciaTelefono: inputEmergenciaTelefono.value.trim(),

    envioNombreDestinatario: inputEnvioNombreDest.value.trim(),
    envioTelefonoDestinatario: inputEnvioTelefonoDest.value.trim(),
    envioCalle: inputEnvioCalle.value.trim(),
    envioNumero: inputEnvioNumero.value.trim(),
    envioColonia: inputEnvioColonia.value.trim(),
    envioCP: inputEnvioCP.value.trim(),
    envioCiudadEstado: inputEnvioCiudadEstado.value.trim(),

    personaPhotoUrl: personaUrl,
    idPhotoUrl: idUrl,
    firmaUrl: firmaUrl
  };

  try {
    showGlobalLoader(true);

    // Guardar en servidor
    const res = await fetch("/api/forms", {
      method: "POST",
      headers: {"Content-Type":"application/json"},
      body: JSON.stringify(payload)
    });

    const data = await res.json();
    const folio = data.folio;

    // Construir mensaje WhatsApp
    const msg = [
      `SOLICITUD LICENCIA DE CONDUCIR`,
      `Respuesta #${folio}`,
      ``,
      `NUM TELEFONO : ${payload.telefono}`,
      `TIPO DE LICENCIA : ${payload.tipoLicencia}`,
      `VALIDA POR : ${payload.vigencia == 3 ? "3 AÑOS $650" : "5 AÑOS $700"}`,
      `NOMBRE COMPLETO : ${payload.nombreCompleto}`,
      `CURP : ${payload.curp}`,
      `DOMICILIO DE GUERRERO ACEPTADO : SI`,
      `ALERGIAS/RESTRICCIONES : ${payload.alergias || "Ninguna"}`,
      `TIPO DE SANGRE : ${payload.tipoSangre}`,
      `CONTACTO DE EMERGENCIA : ${payload.emergenciaNombre} ${payload.emergenciaTelefono}`,
      ``,
      `FOTO PERSONA:\n${payload.personaPhotoUrl}`,
      ``,
      `IDENTIFICACION:\n${payload.idPhotoUrl}`,
      ``,
      `FIRMA:\n${payload.firmaUrl}`,
      ``,
      `DATOS DE ENVÍO`,
      `NOMBRE DESTINATARIO : ${payload.envioNombreDestinatario}`,
      `TELÉFONO DESTINATARIO : ${payload.envioTelefonoDestinatario}`,
      `CALLE : ${payload.envioCalle}`,
      `NÚMERO : ${payload.envioNumero}`,
      `COLONIA : ${payload.envioColonia}`,
      `CP : ${payload.envioCP}`,
      `CIUDAD Y ESTADO : ${payload.envioCiudadEstado}`,
      ``,
      `PRESIONA EN "ENVIAR POR WHATSAPP", TU SOLICITUD SERÁ ASIGNADA AL NUM: 722 560 09 05 DONDE CONTINUARÁS TU TRÁMITE CON ATENCIÓN PERSONALIZADA.`
    ].join("\n");

    const url = `https://wa.me/${ADMIN_WHATSAPP_NUMBER}?text=${encodeURIComponent(msg)}`;
    window.location.href = url;

  } catch (err) {
    alert("Error enviando la solicitud.");
  } finally {
    showGlobalLoader(false);
  }

});
