const express = require("express");
const path = require("path");
const fs = require("fs");
const multer = require("multer");
const session = require("express-session");
const Jimp = require("jimp");
const { removeBackground } = require("@imgly/background-removal-node");

const app = express();

// ====== CONFIG BÁSICA ======
const PORT = process.env.PORT || 3000;
const ADMIN_USER = process.env.ADMIN_USER || "admin";
const ADMIN_PASS = process.env.ADMIN_PASS || "admin123";
const SESSION_SECRET = process.env.SESSION_SECRET || "cambia-esta-clave";

// Carpetas
const ROOT_DIR = __dirname;
const PUBLIC_DIR = path.join(ROOT_DIR, "public");
const UPLOADS_DIR = path.join(ROOT_DIR, "uploads");
const DATA_DIR = path.join(ROOT_DIR, "data");
const FORMS_FILE = path.join(DATA_DIR, "forms.json");

// Crear carpetas necesarias
fs.mkdirSync(PUBLIC_DIR, { recursive: true });
fs.mkdirSync(UPLOADS_DIR, { recursive: true });
fs.mkdirSync(DATA_DIR, { recursive: true });

// Inicializar archivo de formularios si no existe
if (!fs.existsSync(FORMS_FILE)) {
  fs.writeFileSync(FORMS_FILE, "[]", "utf8");
}

// ====== MIDDLEWARES ======
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(
  session({
    secret: SESSION_SECRET,
    resave: false,
    saveUninitialized: false
  })
);

// Static
app.use(express.static(PUBLIC_DIR));
app.use("/uploads", express.static(UPLOADS_DIR));

// ====== MULTER (subida de archivos) ======
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, UPLOADS_DIR);
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname) || ".png";
    const base = file.fieldname || "img";
    const filename = `${base}-${Date.now()}${ext}`;
    cb(null, filename);
  }
});

const upload = multer({ storage });

// ====== HELPERS DE FORMULARIOS ======
function loadForms() {
  try {
    const raw = fs.readFileSync(FORMS_FILE, "utf8");
    const data = JSON.parse(raw);
    return Array.isArray(data) ? data : [];
  } catch (err) {
    console.error("Error leyendo forms.json:", err);
    return [];
  }
}

function saveForms(forms) {
  try {
    fs.writeFileSync(FORMS_FILE, JSON.stringify(forms, null, 2), "utf8");
  } catch (err) {
    console.error("Error guardando forms.json:", err);
  }
}

// ====== HELPERS DE AUTENTICACIÓN ======
function requireAuth(req, res, next) {
  if (req.session && req.session.user === "admin") {
    return next();
  }
  return res.status(401).json({ error: "No autorizado" });
}

// ====== HELPERS DE IMAGEN ======

// Procesa la foto de la persona:
// 1) Quita fondo con @imgly/background-removal-node
// 2) Aumenta brillo 20% con Jimp
// 3) Guarda como PNG en /uploads y devuelve la URL pública
import { pipeline } from "@xenova/transformers"; // si usas require, dime y te lo convierto a CJS

async function processPersonaImage(inputPath) {
  // 1. Cargar modelo de quitar fondo
  const removeBg = await pipeline("image-segmentation", "Xenova/u2net");

  // 2. Ejecutar modelo
  const result = await removeBg(inputPath);

  // 3. Convertir a PNG y fondo transparente
  const outputFile = `persona-${Date.now()}.png`;
  const outputPath = path.join(UPLOADS_DIR, outputFile);

  const jimpImage = await Jimp.read(result);

  // aumentar brillo +20%
  jimpImage.brightness(0.2);

  await jimpImage.writeAsync(outputPath);

  fs.unlink(inputPath, () => {}); // borrar original

  return `/uploads/${outputFile}`;
}


// Normaliza imagen (ID o firma) a PNG y guarda
async function normalizeImage(inputPath, prefix) {
  const image = await Jimp.read(inputPath);
  const filename = `${prefix}-${Date.now()}.png`;
  const outputPath = path.join(UPLOADS_DIR, filename);
  await image.writeAsync(outputPath);

  fs.unlink(inputPath, () => {});

  return `/uploads/${filename}`;
}

// ====== RUTAS DE AUTENTICACIÓN ADMIN ======
app.post("/api/login", (req, res) => {
  const { username, password } = req.body || {};
  if (username === ADMIN_USER && password === ADMIN_PASS) {
    req.session.user = "admin";
    return res.json({ success: true });
  }
  return res.status(401).json({ error: "Credenciales incorrectas" });
});

app.post("/api/logout", (req, res) => {
  req.session.destroy(() => {
    res.json({ success: true });
  });
});

// ====== RUTA LISTADO DE FORMULARIOS (PANEL) ======
app.get("/api/forms", requireAuth, (req, res) => {
  const forms = loadForms().sort((a, b) => b.createdAt - a.createdAt);
  res.json(forms);
});

// ====== RUTA GUARDADO DE FORMULARIO ======
app.post("/api/forms", (req, res) => {
  try {
    const forms = loadForms();

    const {
      nombre,
      curp,
      telefono,
      email,
      comentarios,
      personaPhotoUrl,
      idPhotoUrl,
      firmaUrl
    } = req.body || {};

    const newForm = {
      id: Date.now(),
      createdAt: Date.now(),
      nombre: nombre || "",
      curp: curp || "",
      telefono: telefono || "",
      email: email || "",
      comentarios: comentarios || "",
      personaPhotoUrl: personaPhotoUrl || "",
      idPhotoUrl: idPhotoUrl || "",
      firmaUrl: firmaUrl || ""
    };

    forms.push(newForm);
    saveForms(forms);

    res.status(201).json({ success: true, form: newForm });
  } catch (err) {
    console.error("Error guardando formulario:", err);
    res
      .status(500)
      .json({ error: "No se pudo guardar el formulario en el servidor" });
  }
});

// ====== RUTA DE SUBIDA DE IMÁGENES ======
app.post(
  "/api/upload/image",
  upload.single("image"),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No se recibió ninguna imagen" });
      }

      const type = (req.query.type || "generic").toString();

      let publicUrl;

      if (type === "persona") {
        // foto de la persona: quitar fondo + brillo
        publicUrl = await processPersonaImage(req.file.path);
      } else if (type === "identificacion") {
        publicUrl = await normalizeImage(req.file.path, "id");
      } else if (type === "firma") {
        publicUrl = await normalizeImage(req.file.path, "firma");
      } else {
        // genérico
        publicUrl = await normalizeImage(req.file.path, "img");
      }

      res.json({ url: publicUrl });
    } catch (err) {
      console.error("Error procesando imagen:", err);
      res.status(500).json({ error: "Error procesando la imagen" });
    }
  }
);

// ====== ARRANCAR SERVIDOR ======
app.listen(PORT, () => {
  console.log(`Servidor escuchando en puerto ${PORT}`);
});
