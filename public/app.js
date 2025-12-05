// app.js - Frontend principal del formulario de Gestoría Virtual

// ===============================
// CONFIGURACIÓN
// ===============================
const ADMIN_WHATSAPP_NUMBER = "527225600905"; // 52 + 7225600905

// ===============================
// REFERENCIAS GENERALES
// ===============================
const btnAdmin = document.getElementById("btnAdmin");
const form = document.getElementById("solicitudForm");
const globalLoader = document.getElementById("globalLoader");

// Datos del formulario
const inputNombre = document.getElementById("nombre");
const inputCurp = document.getElementById("curp");
const inputTelefono = document.getElementById("telefono");
const inputEmail = document.getElementById("email");
const inputComentarios = document.getElementById("comentarios");

// Foto persona
const btnPersonaCamera = document.getElementById("btnPersonaCamera");
const btnPersonaFile = document.getElementById("btnPersonaFile");
const fotoPersonaInput = document.getElementById("fotoPersonaInput");
const fotoPersonaPreview = document.getElementById("fotoPersonaPreview");
const fotoPersonaActions = document.getElementById("fotoPersonaActions");
const btnPersonaUsar = document.getElementById("btnPersonaUsar");
const btnPersonaCambiar = document.getElementById("btnPersonaCambiar");
const inputPersonaPhotoUrl = document.getElementById("personaPhotoUrl");

// Foto identificación
const btnIdCamera = document.getElementById("btnIdCamera");
const btnIdFile = document.getElementById("btnIdFile");
const fotoIdInput = document.getElementById("fotoIdInput");
const fotoIdPreview = document.getElementById("fotoIdPreview");
const fotoIdActions = document.getElementById("fotoIdActions");
const btnIdUsar = document.getElementById("btnIdUsar");
const btnIdCambiar = document.getElementById("btnIdCambiar");
const inputIdPhotoUrl = document.getElementById("idPhotoUrl");

// Firma
const tabFirmaSubir = document.getElementById("tabFirmaSubir");
const tabFirmaDibujar = document.getElementById("tabFirmaDibujar");
const firmaSubirPanel = document.getElementById("firmaSubirPanel");
const firmaDibujarPanel = document.getElementById("firmaDibujarPanel");

const fotoFirmaInput = document.getElementById("fotoFirmaInput");
const firmaPreview = document.getElementById("firmaPreview");

const signaturePad = document.getElementById("signaturePad");
const btnLimpiarFirma = document.getElementById("btnLimpiarFirma");
const btnConfirmarFirmaCanvas = document.getElementById(
  "btnConfirmarFirmaCanvas"
);

const firmaActions = document.getElementById("firmaActions");
const btnFirmaCambiar = document.getElementById("btnFirmaCambiar");
const inputFirmaUrl = document.getElementById("firmaUrl");

// Cámara (modal)
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
// NAVEGACIÓN PANEL ADMIN
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
  if (!container) return;
  container.classList.add("loading");
  const placeholder = container.querySelector(".placeholder");
  if (placeholder) {
    placeholder.textContent = "Procesando...";
  }
  const img = container.querySelector("img");
  if (img) img.src = "";
}

function setPreviewImage(container, url, altText) {
  if (!container) return;
  container.classList.remove("empty", "loading");
  container.innerHTML = "";
  const img = document.createElement("img");
  img.src = url;
  img.alt = altText || "";
  container.appendChild(img);
}

function resetPreview(container, placeholderText) {
  if (!container) return;
  container.classList.add("empty");
  container.innerHTML = "";
  const span = document.createElement("span");
  span.className = "placeholder";
  span.textContent = placeholderText || "Aún no hay imagen";
  container.appendChild(span);
}

// ===============================
// CÁMARA (MODAL)
// ===============================
async function openCamera(callback) {
  cameraCallback = callback;
  cameraModal.style.display = "flex";

  try {
    cameraStream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: "user" },
      audio: false,
    });
    cameraVideo.srcObject = cameraStream;
  } catch (err) {
    console.error("Error accediendo a la cámara:", err);
    alert("No se pudo acceder a la cámara. Revisa los permisos.");
    closeCamera();
  }
}

function closeCamera() {
  cameraModal.style.display = "none";
  if (cameraStream) {
    cameraStream.getTracks().forEach((t) => t.stop());
    cameraStream = null;
  }
  cameraCallback = null;
}

if (takePhotoBtn) {
  takePhotoBtn.addEventListener("click", async () => {
  const canvas = document.createElement("canvas");
  canvas.width = cameraVideo.videoWidth;
  canvas.height = cameraVideo.videoHeight;

  const ctx = canvas.getContext("2d");
  ctx.drawImage(cameraVideo, 0, 0, canvas.width, canvas.height);

  // Convertir a blob usando Promise
  const blob = await new Promise((resolve) =>
    canvas.toBlob(resolve, "image/jpeg", 0.95)
  );

  if (!blob) {
    alert("No se pudo obtener la foto, intenta nuevamente.");
    return;
  }

  // Enviar la foto a quien la solicitó
  if (cameraCallback) {
    await cameraCallback(blob);
  }

  closeCamera();
});

}

if (closeCameraBtn) {
  closeCameraBtn.addEventListener("click", () => {
    closeCamera();
  });
}

// ===============================
// SUBIDA GENÉRICA DE IMÁGENES
// ===============================
async function uploadImage(fileOrBlob, type) {
  const formData = new FormData();
  formData.append("image", fileOrBlob);

  const res = await fetch(`/api/upload/image?type=${encodeURIComponent(type)}`, {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    throw new Error("Error subiendo la imagen al servidor");
  }

  const data = await res.json();
  if (!data.url) {
    throw new Error("El servidor no devolvió la URL de la imagen");
  }
  return data.url;
}

// ===============================
// FOTO PERSONA
// ===============================
if (btnPersonaFile && fotoPersonaInput) {
  btnPersonaFile.addEventListener("click", () => {
    fotoPersonaInput.click();
  });

  fotoPersonaInput.addEventListener("change", async () => {
    const file = fotoPersonaInput.files[0];
    if (!file) return;
    await handlePersonaImage(file);
  });
}

if (btnPersonaCamera) {
  btnPersonaCamera.addEventListener("click", () => {
    openCamera(async (blob) => {
      await handlePersonaImage(blob);
    });
  });
}

async function handlePersonaImage(fileOrBlob) {
  try {
    setPreviewLoading(fotoPersonaPreview);
    showGlobalLoader(true);

    const url = await uploadImage(fileOrBlob, "persona");
    personaUrl = url;
    if (inputPersonaPhotoUrl) inputPersonaPhotoUrl.value = url;

    setPreviewImage(fotoPersonaPreview, url, "Foto de la persona");
    if (fotoPersonaActions) fotoPersonaActions.style.display = "flex";

    if (btnPersonaUsar) {
      btnPersonaUsar.onclick = () => {
        alert("Foto de la persona confirmada.");
      };
    }

    if (btnPersonaCambiar) {
      btnPersonaCambiar.onclick = () => {
        personaUrl = "";
        if (inputPersonaPhotoUrl) inputPersonaPhotoUrl.value = "";
        resetPreview(fotoPersonaPreview, "Aún no hay foto");
        if (fotoPersonaActions) fotoPersonaActions.style.display = "none";
      };
    }
  } catch (err) {
    console.error(err);
    alert("Ocurrió un error al procesar la foto de la persona.");
    resetPreview(fotoPersonaPreview, "Aún no hay foto");
    if (fotoPersonaActions) fotoPersonaActions.style.display = "none";
  } finally {
    showGlobalLoader(false);
  }
}

// ===============================
// FOTO IDENTIFICACIÓN
// ===============================
if (btnIdFile && fotoIdInput) {
  btnIdFile.addEventListener("click", () => {
    fotoIdInput.click();
  });

  fotoIdInput.addEventListener("change", async () => {
    const file = fotoIdInput.files[0];
    if (!file) return;
    await handleIdImage(file);
  });
}

if (btnIdCamera) {
  btnIdCamera.addEventListener("click", () => {
    openCamera(async (blob) => {
      await handleIdImage(blob);
    });
  });
}

async function handleIdImage(fileOrBlob) {
  try {
    setPreviewLoading(fotoIdPreview);
    showGlobalLoader(true);

    const url = await uploadImage(fileOrBlob, "identificacion");
    idUrl = url;
    if (inputIdPhotoUrl) inputIdPhotoUrl.value = url;

    setPreviewImage(fotoIdPreview, url, "Identificación");
    if (fotoIdActions) fotoIdActions.style.display = "flex";

    if (btnIdUsar) {
      btnIdUsar.onclick = () => {
        alert("Foto de identificación confirmada.");
      };
    }

    if (btnIdCambiar) {
      btnIdCambiar.onclick = () => {
        idUrl = "";
        if (inputIdPhotoUrl) inputIdPhotoUrl.value = "";
        resetPreview(fotoIdPreview, "Aún no hay foto");
        if (fotoIdActions) fotoIdActions.style.display = "none";
      };
    }
  } catch (err) {
    console.error(err);
    alert("Ocurrió un error al procesar la foto de identificación.");
    resetPreview(fotoIdPreview, "Aún no hay foto");
    if (fotoIdActions) fotoIdActions.style.display = "none";
  } finally {
    showGlobalLoader(false);
  }
}

// ===============================
// FIRMA - TABS (SUBIR / DIBUJAR)
// ===============================
if (tabFirmaSubir && tabFirmaDibujar && firmaSubirPanel && firmaDibujarPanel) {
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
}

// ===============================
// FIRMA - SUBIR ARCHIVO
// ===============================
if (fotoFirmaInput) {
  fotoFirmaInput.addEventListener("change", async () => {
    const file = fotoFirmaInput.files[0];
    if (!file) return;

    try {
      setPreviewLoading(firmaPreview);
      showGlobalLoader(true);

      const url = await uploadImage(file, "firma");
      firmaUrl = url;
      if (inputFirmaUrl) inputFirmaUrl.value = url;

      setPreviewImage(firmaPreview, url, "Firma");
      if (firmaActions) firmaActions.style.display = "flex";
    } catch (err) {
      console.error(err);
      alert("Error subiendo la firma.");
      resetPreview(firmaPreview, "Aún no hay firma");
      if (firmaActions) firmaActions.style.display = "none";
    } finally {
      showGlobalLoader(false);
    }
  });
}

// ===============================
// FIRMA - DIBUJAR EN CANVAS
// ===============================
let firmaCtx = null;
let drawing = false;

function initSignaturePad() {
  if (!signaturePad) return;

  const rect = signaturePad.getBoundingClientRect();
  const dpr = window.devicePixelRatio || 1;

  signaturePad.width = rect.width * dpr;
  signaturePad.height = rect.height * dpr;

  firmaCtx = signaturePad.getContext("2d");
  firmaCtx.setTransform(dpr, 0, 0, dpr, 0, 0);

  firmaCtx.fillStyle = "#ffffff";
  firmaCtx.fillRect(0, 0, rect.width, rect.height);

  firmaCtx.lineWidth = 2;
  firmaCtx.lineCap = "round";
  firmaCtx.strokeStyle = "#111827";
}

function getCanvasPos(e) {
  const rect = signaturePad.getBoundingClientRect();
  const clientX = e.touches ? e.touches[0].clientX : e.clientX;
  const clientY = e.touches ? e.touches[0].clientY : e.clientY;
  return {
    x: clientX - rect.left,
    y: clientY - rect.top,
  };
}

if (signaturePad) {
  ["mousedown", "touchstart"].forEach((ev) => {
    signaturePad.addEventListener(ev, (e) => {
      e.preventDefault();
      if (!firmaCtx) initSignaturePad();
      drawing = true;
      const { x, y } = getCanvasPos(e);
      firmaCtx.beginPath();
      firmaCtx.moveTo(x, y);
    });
  });

  ["mousemove", "touchmove"].forEach((ev) => {
    signaturePad.addEventListener(ev, (e) => {
      if (!drawing || !firmaCtx) return;
      e.preventDefault();
      const { x, y } = getCanvasPos(e);
      firmaCtx.lineTo(x, y);
      firmaCtx.stroke();
    });
  });

  ["mouseup", "mouseleave", "touchend", "touchcancel"].forEach((ev) => {
    signaturePad.addEventListener(ev, (e) => {
      if (!drawing) return;
      e.preventDefault();
      drawing = false;
    });
  });
}

if (btnLimpiarFirma && signaturePad) {
  btnLimpiarFirma.addEventListener("click", () => {
    initSignaturePad();
    resetPreview(firmaPreview, "Aún no hay firma");
    if (firmaActions) firmaActions.style.display = "none";
    firmaUrl = "";
    if (inputFirmaUrl) inputFirmaUrl.value = "";
  });
}

if (btnConfirmarFirmaCanvas && signaturePad) {
  btnConfirmarFirmaCanvas.addEventListener("click", () => {
    if (!firmaCtx) {
      alert("Primero dibuja tu firma.");
      return;
    }

    signaturePad.toBlob(
      async (blob) => {
        if (!blob) {
          alert("No se pudo leer la firma dibujada.");
          return;
        }
        try {
          setPreviewLoading(firmaPreview);
          showGlobalLoader(true);

          const url = await uploadImage(blob, "firma");
          firmaUrl = url;
          if (inputFirmaUrl) inputFirmaUrl.value = url;

          setPreviewImage(firmaPreview, url, "Firma");
          if (firmaActions) firmaActions.style.display = "flex";
        } catch (err) {
          console.error(err);
          alert("Error subiendo la firma dibujada.");
          resetPreview(firmaPreview, "Aún no hay firma");
          if (firmaActions) firmaActions.style.display = "none";
        } finally {
          showGlobalLoader(false);
        }
      },
      "image/png"
    );
  });
}

if (btnFirmaCambiar) {
  btnFirmaCambiar.addEventListener("click", () => {
    firmaUrl = "";
    if (inputFirmaUrl) inputFirmaUrl.value = "";
    resetPreview(firmaPreview, "Aún no hay firma");
    if (firmaActions) firmaActions.style.display = "none";
  });
}

// ===============================
// ENVÍO DEL FORMULARIO
// ===============================
if (form) {
  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const nombre = inputNombre.value.trim();
    const curp = inputCurp.value.trim();
    const telefono = inputTelefono.value.trim();
    const email = inputEmail.value.trim();
    const comentarios = inputComentarios.value.trim();

    if (!nombre || !curp || !telefono) {
      alert("Por favor, llena al menos Nombre, CURP y Teléfono.");
      return;
    }

    if (!personaUrl) {
      alert("Falta la foto de la persona.");
      return;
    }
    if (!idUrl) {
      alert("Falta la foto de la identificación.");
      return;
    }
    if (!firmaUrl) {
      alert("Falta la firma.");
      return;
    }

    const payload = {
      nombre,
      curp,
      telefono,
      email,
      comentarios,
      personaPhotoUrl: personaUrl,
      idPhotoUrl: idUrl,
      firmaUrl,
    };

    try {
      showGlobalLoader(true);

      // 1) Guardar en el servidor para el panel admin
      const res = await fetch("/api/forms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        throw new Error("Error guardando el formulario en el servidor");
      }

      // 2) Construir mensaje de WhatsApp
      const baseUrl = window.location.origin;
      const lines = [
        "NUEVA SOLICITUD DE TRÁMITE",
        "",
        `Nombre: ${nombre}`,
        `CURP: ${curp}`,
        `Teléfono: ${telefono}`,
        email ? `Email: ${email}` : "",
        comentarios ? `Comentarios: ${comentarios}` : "",
        "",
        `Foto persona: ${baseUrl}${personaUrl}`,
        `Identificación: ${baseUrl}${idUrl}`,
        `Firma: ${baseUrl}${firmaUrl}`,
        "",
        "Enviado desde el formulario web.",
      ].filter(Boolean);

      const text = encodeURIComponent(lines.join("\n"));
      const waUrl = `https://wa.me/${ADMIN_WHATSAPP_NUMBER}?text=${text}`;
      window.location.href = waUrl;
    } catch (err) {
      console.error(err);
      alert("Ocurrió un error al guardar o enviar la solicitud. Intenta de nuevo.");
    } finally {
      showGlobalLoader(false);
    }
  });
}
