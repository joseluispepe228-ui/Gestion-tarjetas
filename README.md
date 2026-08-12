# Control y Conciliación de Tarjetas de Crédito Familiares

Aplicación web para la gestión, distribución de cuotas y conciliación de gastos en tarjetas de crédito entre familiares.

## 🚀 Tecnologías
- **Frontend**: React + TypeScript + Vite + Tailwind CSS + Lucide Icons
- **Base de Datos en Tiempo Real**: Firebase Firestore
- **Repositorio**: GitHub
- **Alojamiento y Despliegue**: Vercel

---

## 🛠️ Guía de Configuración para GitHub, Firebase y Vercel

### 1. Subir el código a GitHub
1. Inicializa tu repositorio Git local si aún no lo has hecho:
   ```bash
   git init
   git add .
   git commit -m "Initial commit - Control de Tarjetas"
   ```
2. Crea un nuevo repositorio en [GitHub](https://github.com/new).
3. Conecta el repositorio local y sube los cambios:
   ```bash
   git remote add origin https://github.com/TU_USUARIO/TU_REPOSITORIO.git
   git branch -M main
   git push -u origin main
   ```

---

### 2. Configurar Firebase Firestore
1. Ve a la consola de [Firebase Console](https://console.firebase.google.com/).
2. Crea un nuevo proyecto (ej. `tarjetas-credito-familiar`).
3. Ve a **Build > Firestore Database** y haz clic en **Create database**.
   - Elige ubicación cercana (ej. `us-east1` o `southamerica-east1`).
   - Inicia en **Test Mode** (o configura reglas de lectura/escritura).
4. Ve a **Project Settings (⚙️) > General** y en la sección *Your apps*, agrega una **Web App** (`</>`).
5. Copia las credenciales de configuración de Firebase (`apiKey`, `projectId`, etc.).

---

### 3. Desplegar en Vercel
1. Ingresa a [Vercel](https://vercel.com/) e inicia sesión con tu cuenta de GitHub.
2. Haz clic en **Add New Project** y selecciona tu repositorio de GitHub.
3. En la sección **Environment Variables**, agrega las siguientes variables de entorno copiadas de Firebase:

   | Variable | Valor de Ejemplo |
   | --- | --- |
   | `VITE_FIREBASE_API_KEY` | `AIzaSyA...` |
   | `VITE_FIREBASE_AUTH_DOMAIN` | `tu-proyecto.firebaseapp.com` |
   | `VITE_FIREBASE_PROJECT_ID` | `tu-proyecto` |
   | `VITE_FIREBASE_STORAGE_BUCKET` | `tu-proyecto.appspot.com` |
   | `VITE_FIREBASE_MESSAGING_SENDER_ID` | `123456789...` |
   | `VITE_FIREBASE_APP_ID` | `1:123456789:web:...` |

4. Presiona **Deploy**. Vercel compilará la aplicación y generará la URL pública lista para usar.

---

## 💻 Desarrollo Local
1. Clona el repositorio e instala dependencias:
   ```bash
   npm install
   ```
2. Crea un archivo `.env` basado en `.env.example` con tus credenciales de Firebase:
   ```bash
   cp .env.example .env
   ```
3. Ejecuta el servidor de desarrollo:
   ```bash
   npm run dev
   ```
