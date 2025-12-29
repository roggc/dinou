import { ClientRedirect } from "./client-redirect.jsx";

/**
 * Función universal de redirección.
 * Úsala con 'return': return redirect('/login');
 */
export function redirect(destination) {
  // 1. Intentamos obtener el contexto del servidor
  if (typeof window === "undefined") {
    // getContext() debe ser accesible aquí
    const dynamicRequire = require;
    const { getContext } = dynamicRequire(
      /* webpackIgnore: true */ "./request-context.js"
    );
    const ctx = getContext();

    // 2. Si estamos en el servidor y AÚN NO se han enviado cabeceras...
    // Podemos hacer un redirect HTTP real (Status 307).
    // Esto es mejor para SEO y rapidez en Hard Navigation.
    if (ctx && ctx.res) {
      ctx.res.redirect(destination);
      return <ClientRedirect to={destination} />;
    }
  }

  // 3. FALLBACK: Si estamos en Cliente, O si el Servidor ya empezó el stream (headers sent)
  // Devolvemos el componente que forzará la redirección en el navegador.
  return <ClientRedirect to={destination} />;
}
