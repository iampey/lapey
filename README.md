# la Pey — Asistente de Gestión Operativa Personal

Tu app personal para capturar, organizar y analizar tu trabajo diario con IA.

---

## Estructura de archivos

```
lapey/
├── index.html        ← App principal
├── src/
│   ├── style.css     ← Estilos y marca visual
│   └── app.js        ← Lógica e integración con IA
└── README.md
```

---

## Despliegue en Vercel (recomendado, gratis, 5 minutos)

### Paso 1 — Crea una cuenta en Vercel
Ve a https://vercel.com y regístrate con tu cuenta de GitHub, Google o email.

### Paso 2 — Sube los archivos a GitHub
1. Ve a https://github.com y crea un repositorio nuevo llamado `lapey`
2. Sube los tres archivos (`index.html`, `src/style.css`, `src/app.js`) manteniendo la estructura de carpetas

### Paso 3 — Conecta Vercel con GitHub
1. En Vercel, pulsa "Add New Project"
2. Selecciona tu repositorio `lapey`
3. No cambies nada en la configuración — Vercel detecta automáticamente que es HTML estático
4. Pulsa "Deploy"

### Paso 4 — Tu URL lista
En menos de 1 minuto tendrás tu app en una URL como `lapey.vercel.app`.
Puedes cambiarla a un dominio propio (lapey.com, lapey.es, etc.) desde Settings > Domains.

---

## Despliegue alternativo: Netlify (también gratis)

1. Ve a https://netlify.com
2. Arrastra la carpeta `lapey` completa al área de drag-and-drop de Netlify
3. Tu app estará online al instante con una URL aleatoria que puedes personalizar

---

## Configuración de la API key

La app usa la API de Anthropic (Claude) para procesar tus entradas.

1. Ve a https://console.anthropic.com
2. Crea una cuenta gratuita
3. En "API Keys", crea una nueva clave
4. Al abrir la app por primera vez, te pedirá esta clave
5. Se guarda solo en tu navegador — nunca sale de tu dispositivo

**Coste estimado:** Con uso diario moderado (10-20 entradas/día), el coste mensual
es inferior a 1€. El plan gratuito de Anthropic incluye créditos iniciales suficientes
para semanas de uso.

---

## Uso diario

- **Ctrl + Enter** — Procesa la entrada actual con IA
- Los datos se guardan en el navegador automáticamente
- El informe de valor se puede copiar con un clic para pegar en email o documento

---

## Personalización

Para cambiar colores, abre `src/style.css` y modifica las variables en `:root`:
- `--orange: #F4622A` — Color principal de marca
- `--font-display: 'Bebas Neue'` — Tipografía del nombre
- `--font-body: 'DM Sans'` — Tipografía del contenido

---

Hecho con IA. Marca personal: **la Pey**.
