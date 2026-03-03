# Deploy en Netlify

1. Haz push de tu código a GitHub.
2. En Netlify, crea un nuevo sitio y conecta tu repo.
3. Configura las variables de entorno en Netlify:
   - VITE_GEMINI_KEY
   - (otras necesarias)
4. Build command: `npm run build`
5. Publish directory: `dist`
6. El archivo `netlify.toml` y `_redirects` ya están listos para SPA y funciones.

¡Listo para publicar!