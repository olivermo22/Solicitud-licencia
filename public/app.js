// app.js

const ADMIN_WHATSAPP_NUMBER = "527225600905"; // 52 + 7225600905

const btnAdmin = document.getElementById("btnAdmin");
if (btnAdmin) {
  btnAdmin.addEventListener("click", () => {
    window.location.href = "/login.html";
  });
}

const form = document.getElementById("solicitudForm");
const globalLoader = document.getElementById("globalLoader");

// Inputs de datos
const inputNombre = document.getElementById("nombre");
const inputCurp = document.getElementById("curp");
const inputTelefono = document.getElementById("telefono");
const inputEmail = document.getElementById("email");
const inputComentarios = document.getElementById("comentarios");

// Inputs ocultos para URLs
const inputPersonaPhotoUrl = document.getElementById("personaPhotoUrl");
const inputIdPhotoUrl = document.getElementById("idPhotoUrl");
const inputFirmaUrl = document.getElementById("firmaUrl");

// Cámara
const cameraModal = document.getElementById("cameraModal");
const cameraVideo = document.getElementById("cameraVideo");
const takePhotoBtn = document.getElementById("takePhotoBtn");
const closeCameraBtn = document.getElementById("closeCameraBtn");

let cameraStream = null;
let cameraCallback = null;

// Foto persona
const fotoPersonaInput = document.getElementById("fotoPersonaInput");
const fotoPersonaPreview = document.getElementById("fotoPersonaPreview");
const fotoPersonaActions = document.getElementById("fotoPersonaActions");
const btnPersonaUsar = document.getElementById("btnPersonaUsar");
const btnPersonaCambiar = document.getElementById("btnPersonaCambiar");

// Foto ID
const fotoIdInput = document.getElementById("fotoIdInput");
const fotoIdPreview = document.getElementById("fotoIdPreview");
const fotoIdActions = document.getElementById("fotoIdActions");
const btnIdUsar = document.getElementById("btnIdUsar");
const btnIdCambiar = document.getElementById("btnIdCambiar");

// Firma
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

// Estado interno
let personaUrl = "";
let idUrl = "";
let firmaUrl = "";

// ====== HELPERS UI ======
function showGlobalLoader(show) {
  if (!globalLoader) return;
  globalLoader.style.display = show ? "flex" : "none";
}

function setPreviewLoading(previewContainer) {
  if (!previewContainer) return;
  previewContainer.classList.remove("empty");
  previewContainer.innerHTML =
    '<div class="loader" style="border-color:#d1d5db;border-top-color:#6b7280;"></div>';
}

function setPreviewImage(previewContainer, url, altText) {
  if (!previewContainer) return;
  previewContainer.classList.remove("empty");
  previewContainer.innerHTML = `<img src="${url}" alt="${altText}" />`;
}

function resetPreview(previewContainer, placeholderText) {
  if (!previewContainer) return;
  previewContainer.classList.add("empty");
  previewContainer.innerHTML = `<span class="placeholder">${placeholderText}</span>`;
}

// ====== SUBIDA GENÉRICA DE IMAGEN ======
async function uploadImage(fileOrBlob, type) {
  const fd = new FormData();
  fd.append("image", fileOrBlob);

  const res = await fetch(`/api/upload/image?type=${encodeURIComponent(type)}`, {
    method: "POST",
    body: fd
  });

  if (!res.ok) {
    throw new Error("Error al subir la imagen");
  }

  const data = await res.json();
  if (!data.url) {
    throw new Error("Respuesta de imagen inválida");
  }

  return data.url;
}

async function openCamera(callback) {
  cameraCallback = callback;

  cameraModal.style.display = "flex";

  try {
    cameraStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" } });
    cameraVideo.srcObject = cameraStream;
  } catch (err) {
    alert("No se pudo acceder a la cámara.");
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

  canvas.toBlob((blob) => {
    if (cameraCallback) cameraCallback(blob);
    closeCamera();
  }, "image/jpeg", 0.95);
};

closeCameraBtn.onclick = closeCamera;


// ====== FOTO PERSONA (NUEVO: CÁMARA CON SILUETA) ======
if (fotoPersonaInput) {
  fotoPersonaInput.addEventListener("click", (e) => {
    e.preventDefault();

    // Abrir cámara
    openCamera(async (blob) => {
      try {
        setPreviewLoading(fotoPersonaPreview);
        showGlobalLoader(true);

        const url = await uploadImage(blob, "persona");

        personaUrl = url;
        inputPersonaPhotoUrl.value = url;

        setPreviewImage(fotoPersonaPreview, url, "Foto de persona");
        fotoPersonaActions.style.display = "flex";

        btnPersonaUsar.onclick = () => {
          alert("Foto de la persona confirmada.");
        };

        btnPersonaCambiar.onclick = () => {
          personaUrl = "";
          inputPersonaPhotoUrl.value = "";
          resetPreview(fotoPersonaPreview, "Aún no hay foto");
          fotoPersonaActions.style.display = "none";
        };

      } catch (err) {
        console.error(err);
        alert("Error procesando la foto.");
        resetPreview(fotoPersonaPreview, "Aún no hay foto");
      } finally {
        showGlobalLoader(false);
      }
    });
  });
}

// ====== FOTO IDENTIFICACIÓN ======
if (fotoIdInput) {
  fotoIdInput.addEventListener("change", async () => {
    const file = fotoIdInput.files[0];
    if (!file) return;

    try {
      setPreviewLoading(fotoIdPreview);
      showGlobalLoader(true);

      const url = await uploadImage(file, "identificacion");

      setPreviewImage(fotoIdPreview, url, "Foto de identificación");
      fotoIdActions.style.display = "flex";

      btnIdUsar.onclick = () => {
        idUrl = url;
        inputIdPhotoUrl.value = url;
        alert("Foto de identificación confirmada.");
      };

      btnIdCambiar.onclick = () => {
        idUrl = "";
        inputIdPhotoUrl.value = "";
        fotoIdInput.value = "";
        resetPreview(fotoIdPreview, "Aún no hay foto");
        fotoIdActions.style.display = "none";
      };
    } catch (err) {
      console.error(err);
      alert("Ocurrió un error procesando la foto de identificación.");
      resetPreview(fotoIdPreview, "Aún no hay foto");
      fotoIdActions.style.display = "none";
    } finally {
      showGlobalLoader(false);
    }
  });
}

// ====== TABS FIRMA ======
function setTabActive(which) {
  if (which === "subir") {
    tabFirmaSubir.classList.add("active");
    tabFirmaDibujar.classList.remove("active");
    firmaSubirPanel.style.display = "block";
    firmaDibujarPanel.style.display = "none";
  } else {
    tabFirmaSubir.classList.remove("active");
    tabFirmaDibujar.classList.add("active");
    firmaSubirPanel.style.display = "none";
    firmaDibujarPanel.style.display = "block";
  }
}

if (tabFirmaSubir && tabFirmaDibujar) {
  tabFirmaSubir.addEventListener("click", () => setTabActive("subir"));
  tabFirmaDibujar.addEventListener("click", () => setTabActive("dibujar"));
}

// ====== SUBIR FIRMA (IMAGEN) ======
if (fotoFirmaInput) {
  fotoFirmaInput.addEventListener("change", async () => {
    const file = fotoFirmaInput.files[0];
    if (!file) return;

    try {
      setPreviewLoading(firmaPreview);
      showGlobalLoader(true);

      const url = await uploadImage(file, "firma");

      firmaUrl = url;
      inputFirmaUrl.value = url;
      setPreviewImage(firmaPreview, url, "Firma");
      firmaActions.style.display = "flex";
    } catch (err) {
      console.error(err);
      alert("Error procesando la firma.");
      resetPreview(firmaPreview, "Aún no hay firma");
      firmaActions.style.display = "none";
    } finally {
      showGlobalLoader(false);
    }
  });
}

// ====== DIBUJAR FIRMA (CANVAS) ======
if (signaturePad && btnLimpiarFirma && btnConfirmarFirmaCanvas) {
  const ctx = signaturePad.getContext("2d");
  let drawing = false;
  let lastX = 0;
  let lastY = 0;

  function resizeCanvas() {
    const rect = signaturePad.getBoundingClientRect();
    const temp = document.createElement("canvas");
    temp.width = signaturePad.width;
    temp.height = signaturePad.height;
    temp.getContext("2d").drawImage(signaturePad, 0, 0);

    signaturePad.width = rect.width * devicePixelRatio;
    signaturePad.height = rect.height * devicePixelRatio;
    ctx.scale(devicePixelRatio, devicePixelRatio);
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, rect.width, rect.height);
    ctx.drawImage(temp, 0, 0, rect.width, rect.height);
  }

  // Inicializar canvas
  setTimeout(resizeCanvas, 200);
  window.addEventListener("resize", resizeCanvas);

  function startDrawing(e) {
    e.preventDefault();
    drawing = true;
    const rect = signaturePad.getBoundingClientRect();
    lastX = (e.clientX || e.touches?.[0]?.clientX) - rect.left;
    lastY = (e.clientY || e.touches?.[0]?.clientY) - rect.top;
  }

  function draw(e) {
    if (!drawing) return;
    e.preventDefault();
    const rect = signaturePad.getBoundingClientRect();
    const x = (e.clientX || e.touches?.[0]?.clientX) - rect.left;
    const y = (e.clientY || e.touches?.[0]?.clientY) - rect.top;

    ctx.strokeStyle = "#111827";
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(lastX, lastY);
    ctx.lineTo(x, y);
    ctx.stroke();

    lastX = x;
    lastY = y;
  }

  function stopDrawing(e) {
    if (!drawing) return;
    e && e.preventDefault();
    drawing = false;
  }

  signaturePad.addEventListener("pointerdown", startDrawing);
  signaturePad.addEventListener("pointermove", draw);
  signaturePad.addEventListener("pointerup", stopDrawing);
  signaturePad.addEventListener("pointerleave", stopDrawing);

  btnLimpiarFirma.addEventListener("click", () => {
    const rect = signaturePad.getBoundingClientRect();
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, rect.width, rect.height);
  });

  btnConfirmarFirmaCanvas.addEventListener("click", () => {
    showGlobalLoader(true);
    signaturePad.toBlob(
      async (blob) => {
        try {
          if (!blob) throw new Error("No se pudo leer la firma");

          const url = await uploadImage(blob, "firma");
          firmaUrl = url;
          inputFirmaUrl.value = url;
          setPreviewImage(firmaPreview, url, "Firma");
          firmaActions.style.display = "flex";
          alert("Firma confirmada.");
        } catch (err) {
          console.error(err);
          alert("Error procesando la firma dibujada.");
          resetPreview(firmaPreview, "Aún no hay firma");
          firmaActions.style.display = "none";
        } finally {
          showGlobalLoader(false);
        }
      },
      "image/png",
      1.0
    );
  });

  btnFirmaCambiar.addEventListener("click", () => {
    firmaUrl = "";
    inputFirmaUrl.value = "";
    resetPreview(firmaPreview, "Aún no hay firma");
    firmaActions.style.display = "none";
  });
}

// ====== ENVÍO DEL FORMULARIO ======
if (form) {
  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const nombre = inputNombre.value.trim();
    const curp = inputCurp.value.trim();
    const telefono = inputTelefono.value.trim();
    const email = inputEmail.value.trim();
    const comentarios = inputComentarios.value.trim();

    if (!nombre || !curp || !telefono) {
      alert("Por favor completa los campos obligatorios (Nombre, CURP, Teléfono).");
      return;
    }

    if (!personaUrl || !idUrl || !firmaUrl) {
      alert(
        "Es necesario confirmar la foto de la persona, la identificación y la firma antes de continuar."
      );
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
      firmaUrl
    };

    try {
      showGlobalLoader(true);

      // 1) Guardar en el servidor (para el panel)
      const res = await fetch("/api/forms", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
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
        "Enviado desde el formulario web."
      ].filter(Boolean);

      const text = encodeURIComponent(lines.join("\n"));

      // 3) Abrir WhatsApp
      const waUrl = `https://wa.me/${ADMIN_WHATSAPP_NUMBER}?text=${text}`;
      window.location.href = waUrl;
    } catch (err) {
      console.error(err);
      alert("Ocurrió un error al guardar el formulario. Intenta de nuevo.");
    } finally {
      showGlobalLoader(false);
    }
  });
}
