# Frontend

## Desarrollo local

```powershell
npm install
Copy-Item .env.example .env
npm run dev
```

Configura estas variables en `.env`:

```text
VITE_API_MASCOTAS_URL=http://127.0.0.1:8001
VITE_API_ADOPCIONES_URL=http://127.0.0.1:8002
```

## Despliegue en Vercel

1. Importa el repositorio en Vercel.
2. Configura **Root Directory** como `frontend`.
3. Usa `npm run build` como **Build Command**.
4. Usa `dist` como **Output Directory**.
5. Agrega las variables de entorno `VITE_API_MASCOTAS_URL` y `VITE_API_ADOPCIONES_URL` con las URLs desplegadas de las APIs.
6. Despliega. El archivo `vercel.json` permite recargar directamente cualquier ruta de React Router.
