import express from "express";
import path from "path";
import fs from "fs";
import multer from "multer";
import session from "express-session";
import { removeBackground } from "@imgly/background-removal";
import * as Jimp from "jimp";
import { pipeline } from "@xenova/transformers";
import { fileURLToPath } from "url";

// === CONFIGURACIONES IMPORTANTES ESM ===
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// === VARIABLES ===
const PORT = process.env.PORT || 3000;
const ADMIN_USER = process.env.ADMIN_USER || "admin";
const ADMIN_PASS = process.env.ADMIN_PASS || "admin123";
const SESSION_SECRET = process.env.SESSION_SECRET || "clave-secreta";

// === RUTAS DE DIRECTORIOS ===
const PUBLIC_DIR = path.join(__dirname, "public");
const UPLOADS_DIR = path.join(__dirname, "uploads");
const DATA_DIR = path.join(__dirname, "data");
const FORMS_FILE = path.join(DATA_DIR, "forms.json");

// Crear carpetas si no existen
fs.mkdirSync(PUBLIC_DIR, { recursive: true });
fs.mkdirSync(UPLOADS_DIR, { recursive: true });
fs.mkdirSync(DATA_DIR, { recursive: true });

// Crear archivo de formularios si no existe
if (!fs.existsSync(FORMS_FILE)) {
    fs.writeFileSync(FORMS_FILE, "[]", "utf8");
}

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(PUBLIC_DIR));
app.use("/uploads", express.static(UPLOADS_DIR));

// Sesiones
app.use(
    session({
        secret: SESSION_SECRET,
        resave: false,
        saveUninitialized: false,
    })
);

// === MULTER CONFIG ===
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, UPLOADS_DIR),
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname) || ".png";
        cb(null, `${file.fieldname}-${Date.now()}${ext}`);
    },
});

const upload = multer({ storage });

// =========================
//  FUNCIONES AUXILIARES
// =========================

function loadForms() {
    try {
        const raw = fs.readFileSync(FORMS_FILE, "utf8");
        return JSON.parse(raw);
    } catch (e) {
        return [];
    }
}

function saveForms(forms) {
    fs.writeFileSync(FORMS_FILE, JSON.stringify(forms, null, 2), "utf8");
}

// =========================
//   QUITAR FONDO CON U2NET
// =========================
async function processPersonaImage(inputPath) {
    try {
        // 1. Cargar imagen original como buffer
        const inputBuffer = fs.readFileSync(inputPath);

        // 2. Quitar fondo (WASM, super estable)
        const bgRemoved = await removeBackground(inputBuffer, {
            debug: false,
            proxy: null,
        });

        // 3. Convertir a Jimp para brillo
        const img = await Jimp.read(bgRemoved);

        // 4. Aumentar brillo 20%
        img.brightness(0.20);

        // 5. Guardar resultado
        const filename = `persona-${Date.now()}.png`;
        const outputPath = path.join(UPLOADS_DIR, filename);

        await img.writeAsync(outputPath);

        // 6. Eliminar archivo original
        fs.unlinkSync(inputPath);

        return `/uploads/${filename}`;
    } catch (err) {
        console.error("Error en processPersonaImage:", err);
        throw err;
    }
}

// Normalizar imágenes ID/firma
async function normalizeImage(inputPath, prefix) {
    const outputName = `${prefix}-${Date.now()}.png`;
    const outputPath = path.join(UPLOADS_DIR, outputName);

    const img = await Jimp.read(inputPath);
    await img.writeAsync(outputPath);

    fs.unlink(inputPath, () => {});

    return `/uploads/${outputName}`;
}

// =========================
//   AUTH
// =========================

function requireAuth(req, res, next) {
    if (req.session?.user === "admin") return next();
    return res.status(401).json({ error: "No autorizado" });
}

app.post("/api/login", (req, res) => {
    const { username, password } = req.body;

    if (username === ADMIN_USER && password === ADMIN_PASS) {
        req.session.user = "admin";
        return res.json({ success: true });
    }

    return res.status(401).json({ error: "Credenciales incorrectas" });
});

app.post("/api/logout", (req, res) => {
    req.session.destroy(() => res.json({ success: true }));
});

// =========================
//    SUBIDA DE IMÁGENES
// =========================

app.post("/api/upload/image", upload.single("image"), async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ error: "No se recibió archivo" });

        const type = req.query.type || "generic";
        let url;

        if (type === "persona") url = await processPersonaImage(req.file.path);
        else if (type === "identificacion") url = await normalizeImage(req.file.path, "id");
        else if (type === "firma") url = await normalizeImage(req.file.path, "firma");
        else url = await normalizeImage(req.file.path, "img");

        res.json({ url });

    } catch (e) {
        console.error("Error procesando imagen:", e);
        res.status(500).json({ error: "Error procesando imagen" });
    }
});

// =========================
//      FORMULARIOS
// =========================

app.get("/api/forms", requireAuth, (req, res) => {
    const forms = loadForms().sort((a, b) => b.createdAt - a.createdAt);
    res.json(forms);
});

app.post("/api/forms", (req, res) => {
    const forms = loadForms();

    const newForm = {
        id: Date.now(),
        createdAt: Date.now(),
        ...req.body,
    };

    forms.push(newForm);
    saveForms(forms);

    res.json({ success: true, form: newForm });
});

// =========================
//   INICIAR SERVIDOR
// =========================

app.listen(PORT, () => {
    console.log(`Servidor escuchando en puerto ${PORT}`);
});
