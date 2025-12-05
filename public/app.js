/* ================================
   REFERENCIAS HTML
================================ */
const globalLoader = document.getElementById("globalLoader");

/* Persona */
const btnPersonaCamera = document.getElementById("btnPersonaCamera");
const btnPersonaFile = document.getElementById("btnPersonaFile");
const inputPersonaFile = document.getElementById("inputPersonaFile");
const previewPersona = document.getElementById("previewPersona");
const personaActions = document.getElementById("personaActions");
const btnPersonaUsar = document.getElementById("btnPersonaUsar");
const btnPersonaCambiar = document.getElementById("btnPersonaCambiar");
const inputPersonaPhotoUrl = document.getElementById("inputPersonaPhotoUrl");

/* Identificación */
const btnIdCamera = document.getElementById("btnIdCamera");
const btnIdFile = document.getElementById("btnIdFile");
const inputIdFile = document.getElementById("inputIdFile");
const previewId = document.getElementById("previewId");
const idActions = document.getElementById("idActions");
const btnIdUsar = document.getElementById("btnIdUsar");
const btnIdCambiar = document.getElementById("btnIdCambiar");
const inputIdPhotoUrl = document.getElementById("inputIdPhotoUrl");

/* Firma */
const tabFirmaArchivo = document.getElementById("tabFirmaArchivo");
const tabFirmaDibujar = document.getElementById("tabFirmaDibujar");
const firmaArchivoContainer = document.getElementById("firmaArchivoContainer");
const firmaDibujarContainer = document.getElementById("firmaDibujarContainer");
const inputFirmaFile = document.getElementById("inputFirmaFile");
const previewFirmaArchivo = document.getElementById("previewFirmaArchivo");
const firmaCanvas = document.getElementById("firmaCanvas");
const previewFirmaDibujada = document.getElementById("previewFirmaDibujada");
const btnFirmaClear = document.getElementById("btnFirmaClear");
const btnFirmaUsar = document.getElementById("btnFirmaUsar");
const btnFirmaCambiar = document.getElementById("btnFirmaCambiar");
const inputFirmaUrl = document.getElementById("inputFirmaUrl");
const firmaActions = document.getElementById("firmaActions");

/* Modal Cámara */
const cameraModal = document.getElementById("cameraModal");
const cameraVideo = document.getElementById("cameraVideo");
const takePhotoBtn = document.getElementById("takePhotoBtn");
const closeCameraBtn = document.getElementById("closeCameraBtn");

let cameraStream = null;
let cameraCallback = null;


/* ================================
   FUNCIONES UTILES
================================ */

function showGlobalLoader(show) {
  globalLoader.style.display = show ? "flex" : "none";
}

function setPreviewLoading(imgElement) {
  imgElement.src = "";
}

function setPreviewImage(imgElement, url, alt = "") {
  imgElement.src = url;
  imgElement.alt = alt;
}

function resetPreview(imgElement, alt = "") {
  imgElement.src = "";
  imgElement.alt = alt;
}

/* ================================
   LÓGICA DE CÁMARA
================================ */
async function openCamera(callback) {
  cameraCallback = callback;

  cameraModal.style.display = "flex";

  try {
    cameraStream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: "user" }
    });
    cameraVideo.srcObject = cameraStream;
  } catch (err) {
    alert("No se pudo acceder a la cámara");
    closeCamera();
  }
}

function closeCamera() {
  cameraModal.style.display = "none";

  if (cameraStream) {
    cameraStream.getTracks().forEach(t => t.stop());
    cameraStream = null;
  }
}

takePhotoBtn.onclick = () => {
  const canvas = document.createElement("canvas");
  canvas.width = cameraVideo.videoWidth;
  canvas.height = cameraVideo.videoHeight;

  const ctx = canvas.getContext("2d");
  ctx.drawImage(cameraVideo, 0, 0, canvas.width, canvas.height);

  canvas.toBlob(blob => {
    if (cameraCallback) cameraCallback(blob);
  }, "image/jpeg", 0.95);

  closeCamera();
};

closeCameraBtn.onclick = closeCamera;


/* ================================
   UPLOAD GENÉRICO
================================ */
async function uploadImage(blobOrFile, type) {
  const formData = new FormData();
  formData.append("image", blobOrFile);

  const res = await fetch(`/api/upload/image?type=${type}`, {
    method: "POST",
    body: formData
  });

  if (!res.ok) throw new Error("Error subiendo imagen");

  const data = await res.json();
  return data.url;
}


/* ================================
   FOTO PERSONA
================================ */

// Tomar foto con cámara
btnPersonaCamera.onclick = () => {
  openCamera(async (blob) => {
    await handlePersonaFile(blob);
  });
};

// Subir archivo desde la galería
btnPersonaFile.onclick = () => inputPersonaFile.click();

inputPersonaFile.onchange = async () => {
  if (inputPersonaFile.files.length === 0) return;
  await handlePersonaFile(inputPersonaFile.files[0]);
};

async function handlePersonaFile(file) {
  try {
    showGlobalLoader(true);
    setPreviewLoading(previewPersona);

    const url = await uploadImage(file, "persona");
    inputPersonaPhotoUrl.value = url;

    setPreviewImage(previewPersona, url);
    personaActions.style.display = "flex";

    btnPersonaUsar.onclick = () => alert("Foto confirmada");

    btnPersonaCambiar.onclick = () => {
      resetPreview(previewPersona, "Aún no hay foto");
      inputPersonaPhotoUrl.value = "";
      personaActions.style.display = "none";
    };

  } catch (err) {
    console.error(err);
    alert("Error procesando la imagen");
  } finally {
    showGlobalLoader(false);
  }
}


/* ================================
   FOTO IDENTIFICACION
================================ */

btnIdCamera.onclick = () => {
  openCamera(async (blob) => {
    await handleIdFile(blob);
  });
};

btnIdFile.onclick = () => inputIdFile.click();

inputIdFile.onchange = async () => {
  if (inputIdFile.files.length === 0) return;
  await handleIdFile(inputIdFile.files[0]);
};

async function handleIdFile(file) {
  try {
    showGlobalLoader(true);
    setPreviewLoading(previewId);

    const url = await uploadImage(file, "identificacion");
    inputIdPhotoUrl.value = url;

    setPreviewImage(previewId, url);
    idActions.style.display = "flex";

    btnIdUsar.onclick = () => alert("Foto confirmada");

    btnIdCambiar.onclick = () => {
      resetPreview(previewId, "Aún no hay foto");
      inputIdPhotoUrl.value = "";
      idActions.style.display = "none";
    };

  } catch (err) {
    console.error(err);
    alert("Error procesando la imagen");
  } finally {
    showGlobalLoader(false);
  }
}


/* ================================
   FIRMA: TABS (Archivo / Dibujar)
================================ */

tabFirmaArchivo.onclick = () => {
  tabFirmaArchivo.classList.add("active");
  tabFirmaDibujar.classList.remove("active");
  firmaArchivoContainer.style.display = "block";
  firmaDibujarContainer.style.display = "none";
};

tabFirmaDibujar.onclick = () => {
  tabFirmaArchivo.classList.remove("active");
  tabFirmaDibujar.classList.add("active");
  firmaArchivoContainer.style.display = "none";
  firmaDibujarContainer.style.display = "block";
  initCanvas();
};


/* ================================
   FIRMA: SUBIR ARCHIVO
================================ */
inputFirmaFile.onchange = async () => {
  if (inputFirmaFile.files.length === 0) return;

  try {
    showGlobalLoader(true);
    const url = await uploadImage(inputFirmaFile.files[0], "firma");
    previewFirmaArchivo.src = url;
    inputFirmaUrl.value = url;
    firmaActions.style.display = "flex";

    btnFirmaUsar.onclick = () => alert("Firma confirmada");

    btnFirmaCambiar.onclick = () => {
      previewFirmaArchivo.src = "";
      inputFirmaUrl.value = "";
      firmaActions.style.display = "none";
    };

  } catch (e) {
    alert("Error subiendo firma");
  } finally {
    showGlobalLoader(false);
  }
};


/* ================================
   FIRMA: CANVAS (DIBUJAR)
================================ */
let ctxFirma;
let drawing = false;

function initCanvas() {
  // Fija tamaño real del canvas (evita el bug de 0px)
  firmaCanvas.width = firmaCanvas.offsetWidth;
  firmaCanvas.height = firmaCanvas.offsetHeight;

  ctxFirma = firmaCanvas.getContext("2d");
  ctxFirma.lineWidth = 3;
  ctxFirma.lineCap = "round";
  ctxFirma.strokeStyle = "#000";
}

firmaCanvas.addEventListener("mousedown", startDraw);
firmaCanvas.addEventListener("mousemove", draw);
firmaCanvas.addEventListener("mouseup", stopDraw);

firmaCanvas.addEventListener("touchstart", startDraw);
firmaCanvas.addEventListener("touchmove", draw);
firmaCanvas.addEventListener("touchend", stopDraw);

function getPos(e) {
  const rect = firmaCanvas.getBoundingClientRect();
  const x = (e.touches ? e.touches[0].clientX : e.clientX) - rect.left;
  const y = (e.touches ? e.touches[0].clientY : e.clientY) - rect.top;
  return { x, y };
}

function startDraw(e) {
  drawing = true;
  const { x, y } = getPos(e);
  ctxFirma.beginPath();
  ctxFirma.moveTo(x, y);
  e.preventDefault();
}

function draw(e) {
  if (!drawing) return;
  const { x, y } = getPos(e);
  ctxFirma.lineTo(x, y);
  ctxFirma.stroke();
  e.preventDefault();
}

function stopDraw() {
  drawing = false;

  // Generar preview
  const dataUrl = firmaCanvas.toDataURL("image/png");
  previewFirmaDibujada.src = dataUrl;
  inputFirmaUrl.value = dataUrl;
  firmaActions.style.display = "flex";
}

btnFirmaClear.onclick = () => {
  ctxFirma.clearRect(0, 0, firmaCanvas.width, firmaCanvas.height);
  previewFirmaDibujada.src = "";
  inputFirmaUrl.value = "";
};


/* ================================
   SUBMIT FORMULARIO
================================ */
const mainForm = document.getElementById("mainForm");

mainForm.onsubmit = async (e) => {
  e.preventDefault();

  if (!inputPersonaPhotoUrl.value) {
    return alert("Falta foto de persona");
  }
  if (!inputIdPhotoUrl.value) {
    return alert("Falta identificación");
  }
  if (!inputFirmaUrl.value) {
    return alert("Falta firma");
  }

  const formData = {
    nombre: inputNombre.value,
    curp: inputCurp.value,
    telefono: inputTelefono.value,
    fotoPersona: inputPersonaPhotoUrl.value,
    fotoId: inputIdPhotoUrl.value,
    firma: inputFirmaUrl.value
  };

  console.log("Formulario listo:", formData);
  alert("Formulario enviado.");
};
