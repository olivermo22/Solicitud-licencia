/* ==========================================================
   GESTORÍA VIRTUAL — app.js FINAL
   Funcionalidad:
   - Cámara frontal con silueta (foto persona)
   - Cámara trasera sin silueta (foto identificación)
   - Vista previa inmediata antes de subir
   - Subida a servidor por AJAX
   - Manejo de firma (archivo + canvas)
   ========================================================== */

/* ----------------------------------------------------------
   ELEMENTOS GENERALES
---------------------------------------------------------- */
const globalLoader = document.getElementById("globalLoader");
const btnAdmin = document.getElementById("btnAdmin");

/* Campos */
const nombreInput = document.getElementById("nombre");
const curpInput = document.getElementById("curp");
const telefonoInput = document.getElementById("telefono");
const emailInput = document.getElementById("email");
const comentariosInput = document.getElementById("comentarios");

/* ----------------------------------------------------------
   FOTO PERSONA
---------------------------------------------------------- */
const btnPersonaCamera = document.getElementById("btnPersonaCamera");
const btnPersonaFile = document.getElementById("btnPersonaFile");
const fotoPersonaInput = document.getElementById("fotoPersonaInput");

const fotoPersonaPreview = document.getElementById("fotoPersonaPreview");
const fotoPersonaActions = document.getElementById("fotoPersonaActions");
const btnPersonaUsar = document.getElementById("btnPersonaUsar");
const btnPersonaCambiar = document.getElementById("btnPersonaCambiar");

const inputPersonaPhotoUrl = document.getElementById("personaPhotoUrl");

/* Estado */
let personaUrl = "";

/* ----------------------------------------------------------
   FOTO IDENTIFICACIÓN
---------------------------------------------------------- */
const btnIdCamera = document.getElementById("btnIdCamera");
const btnIdFile = document.getElementById("btnIdFile");
const fotoIdInput = document.getElementById("fotoIdInput");

const fotoIdPreview = document.getElementById("fotoIdPreview");
const fotoIdActions = document.getElementById("fotoIdActions");
const btnIdUsar = document.getElementById("btnIdUsar");
const btnIdCambiar = document.getElementById("btnIdCambiar");

const inputIdPhotoUrl = document.getElementById("idPhotoUrl");

/* Estado */
let idUrl = "";

/* ----------------------------------------------------------
   FIRMA
---------------------------------------------------------- */
const tabFirmaSubir = document.getElementById("tabFirmaSubir");
const tabFirmaDibujar = document.getElementById("tabFirmaDibujar");

const firmaSubirPanel = document.getElementById("firmaSubirPanel");
const firmaDibujarPanel = document.getElementById("firmaDibujarPanel");

const fotoFirmaInput = document.getElementById("fotoFirmaInput");
const firmaPreview = document.getElementById("firmaPreview");
const firmaActions = document.getElementById("firmaActions");
const btnFirmaCambiar = document.getElementById("btnFirmaCambiar");

const signaturePad = document.getElementById("signaturePad");
const btnLimpiarFirma = document.getElementById("btnLimpiarFirma");
const btnConfirmarFirmaCanvas = document.getElementById("btnConfirmarFirmaCanvas");

let firmaUrl = "";
const inputFirmaUrl = document.getElementById("firmaUrl");

/* ----------------------------------------------------------
   CÁMARA (MODAL)
---------------------------------------------------------- */
const cameraModal = document.getElementById("cameraModal");
const cameraVideo = document.getElementById("cameraVideo");
const takePhotoBtn = document.getElementById("takePhotoBtn");
const closeCameraBtn = document.getElementById("closeCameraBtn");
const silhouetteOverlay = document.getElementById("silhouetteOverlay");

let cameraCallback = null;
let currentCameraMode = "persona"; // persona | identificacion

/* ==========================================================
   UTILIDADES
========================================================== */
function showLoader(show) {
  globalLoader.style.display = show ? "flex" : "none";
}

function setPreviewImage(container, url) {
  container.innerHTML = `<img src="${url}" class="preview-img">`;
}

function resetPreview(container, placeholder) {
  container.innerHTML = `<span class="placeholder">${placeholder}</span>`;
}

async function uploadImage(fileOrBlob, type) {
  const fd = new FormData();
  fd.append("image", fileOrBlob);

  const res = await fetch(`/api/upload/image?type=${type}`, {
    method: "POST",
    body: fd
  });

  if (!res.ok) throw new Error("Error subiendo imagen");

  const data = await res.json();
  return data.url;
}

/* ==========================================================
   CÁMARA — ABRIR
========================================================== */
async function openCamera(mode, callback) {
  currentCameraMode = mode;
  cameraCallback = callback;

  // silueta solo para foto persona
  silhouetteOverlay.style.display = mode === "persona" ? "block" : "none";

  const constraints = {
    video: {
      facingMode: mode === "identificacion"
        ? { exact: "environment" }
        : "user"
    }
  };

  try {
    const stream = await navigator.mediaDevices.getUserMedia(constraints);
    cameraVideo.srcObject = stream;
    cameraModal.style.display = "flex";
  } catch (err) {
    alert("Error al acceder a la cámara.");
    console.error(err);
  }
}

/* ==========================================================
   CÁMARA — TOMAR FOTO
========================================================== */
takePhotoBtn.addEventListener("click", async () => {
  const canvas = document.createElement("canvas");
  canvas.width = cameraVideo.videoWidth;
  canvas.height = cameraVideo.videoHeight;

  const ctx = canvas.getContext("2d");
  ctx.drawImage(cameraVideo, 0, 0, canvas.width, canvas.height);

  const localPreview = canvas.toDataURL("image/jpeg", 0.95);

  // aplicar preview inmediato
  if (currentCameraMode === "persona") {
    setPreviewImage(fotoPersonaPreview, localPreview);
    fotoPersonaActions.style.display = "flex";
  } else {
    setPreviewImage(fotoIdPreview, localPreview);
    fotoIdActions.style.display = "flex";
  }

  const blob = await new Promise(resolve =>
    canvas.toBlob(resolve, "image/jpeg", 0.95)
  );

  if (cameraCallback && blob) {
    cameraCallback(blob);
  }

  closeCamera();
});

/* ==========================================================
   CERRAR CÁMARA
========================================================== */
closeCameraBtn.addEventListener("click", () => {
  closeCamera();
});

function closeCamera() {
  cameraModal.style.display = "none";
  const stream = cameraVideo.srcObject;
  if (stream) stream.getTracks().forEach(t => t.stop());
  cameraVideo.srcObject = null;
}

/* ==========================================================
   FOTO PERSONA — SUBIR ARCHIVO
========================================================== */
btnPersonaFile.addEventListener("click", () => fotoPersonaInput.click());

fotoPersonaInput.addEventListener("change", async () => {
  const file = fotoPersonaInput.files[0];
  if (!file) return;

  setPreviewImage(fotoPersonaPreview, URL.createObjectURL(file));
  fotoPersonaActions.style.display = "flex";

  showLoader(true);
  try {
    personaUrl = await uploadImage(file, "persona");
    inputPersonaPhotoUrl.value = personaUrl;
  } catch (err) {
    alert("Error subiendo foto");
  }
  showLoader(false);
});

/* ==========================================================
   FOTO PERSONA — TOMAR FOTO
========================================================== */
btnPersonaCamera.addEventListener("click", () => {
  openCamera("persona", async (blob) => {
    showLoader(true);
    try {
      personaUrl = await uploadImage(blob, "persona");
      inputPersonaPhotoUrl.value = personaUrl;
    } catch (err) {
      alert("Error subiendo foto persona.");
    }
    showLoader(false);
  });
});

btnPersonaCambiar.addEventListener("click", () => {
  personaUrl = "";
  inputPersonaPhotoUrl.value = "";
  resetPreview(fotoPersonaPreview, "Aún no hay foto");
  fotoPersonaActions.style.display = "none";
});

/* ==========================================================
   FOTO IDENTIFICACIÓN — SUBIR ARCHIVO
========================================================== */
btnIdFile.addEventListener("click", () => fotoIdInput.click());

fotoIdInput.addEventListener("change", async () => {
  const file = fotoIdInput.files[0];
  if (!file) return;

  setPreviewImage(fotoIdPreview, URL.createObjectURL(file));
  fotoIdActions.style.display = "flex";

  showLoader(true);
  try {
    idUrl = await uploadImage(file, "identificacion");
    inputIdPhotoUrl.value = idUrl;
  } catch (err) {
    alert("Error subiendo identificación.");
  }
  showLoader(false);
});

/* ==========================================================
   FOTO IDENTIFICACIÓN — TOMAR FOTO
========================================================== */
btnIdCamera.addEventListener("click", () => {
  openCamera("identificacion", async (blob) => {
    showLoader(true);
    try {
      idUrl = await uploadImage(blob, "identificacion");
      inputIdPhotoUrl.value = idUrl;
    } catch (err) {
      alert("Error subiendo identificación.");
    }
    showLoader(false);
  });
});

btnIdCambiar.addEventListener("click", () => {
  idUrl = "";
  inputIdPhotoUrl.value = "";
  resetPreview(fotoIdPreview, "Aún no hay foto");
  fotoIdActions.style.display = "none";
});

/* ==========================================================
   FIRMA — SUBIR ARCHIVO
========================================================== */
fotoFirmaInput.addEventListener("change", async () => {
  const file = fotoFirmaInput.files[0];
  if (!file) return;

  setPreviewImage(firmaPreview, URL.createObjectURL(file));
  firmaActions.style.display = "flex";

  showLoader(true);
  try {
    firmaUrl = await uploadImage(file, "firma");
    inputFirmaUrl.value = firmaUrl;
  } catch (err) {
    alert("Error subiendo firma.");
  }
  showLoader(false);
});

btnFirmaCambiar.addEventListener("click", () => {
  firmaUrl = "";
  inputFirmaUrl.value = "";
  resetPreview(firmaPreview, "Aún no hay firma");
  firmaActions.style.display = "none";
});

/* ==========================================================
   FIRMA — CANVAS
========================================================== */
let drawing = false;
let firmaCtx = null;

function initSignatureCanvas() {
  const rect = signaturePad.getBoundingClientRect();
  signaturePad.width = rect.width;
  signaturePad.height = rect.height;

  firmaCtx = signaturePad.getContext("2d");
  firmaCtx.fillStyle = "#ffffff";
  firmaCtx.fillRect(0, 0, rect.width, rect.height);

  firmaCtx.lineWidth = 2;
  firmaCtx.lineCap = "round";
  firmaCtx.strokeStyle = "#111";
}

tabFirmaDibujar.addEventListener("click", () => {
  tabFirmaSubir.classList.remove("active");
  tabFirmaDibujar.classList.add("active");

  firmaSubirPanel.style.display = "none";
  firmaDibujarPanel.style.display = "block";

  initSignatureCanvas();
});

tabFirmaSubir.addEventListener("click", () => {
  tabFirmaDibujar.classList.remove("active");
  tabFirmaSubir.classList.add("active");

  firmaSubirPanel.style.display = "block";
  firmaDibujarPanel.style.display = "none";
});

function getPos(e) {
  const rect = signaturePad.getBoundingClientRect();
  const x = (e.touches ? e.touches[0].clientX : e.clientX) - rect.left;
  const y = (e.touches ? e.touches[0].clientY : e.clientY) - rect.top;
  return { x, y };
}

signaturePad.addEventListener("mousedown", (e) => {
  drawing = true;
  const { x, y } = getPos(e);
  firmaCtx.beginPath();
  firmaCtx.moveTo(x, y);
});

signaturePad.addEventListener("mousemove", (e) => {
  if (!drawing) return;
  const { x, y } = getPos(e);
  firmaCtx.lineTo(x, y);
  firmaCtx.stroke();
});

signaturePad.addEventListener("mouseup", () => { drawing = false; });

signaturePad.addEventListener("touchstart", (e) => {
  drawing = true;
  const { x, y } = getPos(e);
  firmaCtx.beginPath();
  firmaCtx.moveTo(x, y);
});

signaturePad.addEventListener("touchmove", (e) => {
  if (!drawing) return;
  const { x, y } = getPos(e);
  firmaCtx.lineTo(x, y);
  firmaCtx.stroke();
});

signaturePad.addEventListener("touchend", () => { drawing = false; });

btnLimpiarFirma.addEventListener("click", () => {
  initSignatureCanvas();
  firmaUrl = "";
  inputFirmaUrl.value = "";
  resetPreview(firmaPreview, "Aún no hay firma");
  firmaActions.style.display = "none";
});

btnConfirmarFirmaCanvas.addEventListener("click", () => {
  signaturePad.toBlob(async (blob) => {
    if (!blob) return;

    const localUrl = URL.createObjectURL(blob);
    setPreviewImage(firmaPreview, localUrl);
    firmaActions.style.display = "flex";

    showLoader(true);
    try {
      firmaUrl = await uploadImage(blob, "firma");
      inputFirmaUrl.value = firmaUrl;
    } catch (err) {
      alert("Error subiendo firma.");
    }
    showLoader(false);
  });
});

/* ==========================================================
   ENVIAR FORMULARIO
========================================================== */
document.getElementById("solicitudForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  if (!personaUrl) return alert("Falta foto persona");
  if (!idUrl) return alert("Falta identificación");
  if (!firmaUrl) return alert("Falta firma");

  const payload = {
    nombre: nombreInput.value.trim(),
    curp: curpInput.value.trim(),
    telefono: telefonoInput.value.trim(),
    email: emailInput.value.trim(),
    comentarios: comentariosInput.value.trim(),
    personaPhotoUrl: personaUrl,
    idPhotoUrl: idUrl,
    firmaUrl: firmaUrl
  };

  showLoader(true);
  try {
    await fetch("/api/forms", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    // WhatsApp
    const msg =
      `Nueva solicitud de trámite:%0A%0A` +
      `Nombre: ${payload.nombre}%0A` +
      `CURP: ${payload.curp}%0A` +
      `Teléfono: ${payload.telefono}%0A` +
      `Foto persona: ${payload.personaPhotoUrl}%0A` +
      `Identificación: ${payload.idPhotoUrl}%0A` +
      `Firma: ${payload.firmaUrl}%0A`;

    window.location.href = `https://wa.me/527225600905?text=${msg}`;
  } catch (err) {
    alert("Error enviando formulario.");
  }
  showLoader(false);
});

/* ==========================================================
   PANEL ADMIN
========================================================== */
if (btnAdmin) {
  btnAdmin.addEventListener("click", () => {
    window.location.href = "/login.html";
  });
}
