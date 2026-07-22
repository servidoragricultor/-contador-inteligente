<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Identidad visual: paleta Libro Mayor (obligatoria)

Toda UI nueva (pagina, componente o correo) DEBE conservar la paleta Libro Mayor definida en `../docs/12-ledger-ui-design-system.md`. No crear una identidad visual distinta.

Reglas:

- Derivar color, radio y sombra de los tokens en `src/app/globals.css`. Prohibido usar hex arbitrarios en componentes.
- Reutilizar las clases del sistema (`calm-*`, `ledger-*`); si falta una variante, agregarla como clase reutilizable en `globals.css`, no como estilo suelto.
- Base de cada pantalla: fondo papel `--color-background`, superficies `--color-surface`, bordes `--color-border`, texto `--color-text`, apoyo `--color-muted`.
- Verde tinta (`--color-primary`) es el ancla de acciones y navegacion. El laton (`--color-accent*`) es la firma y se usa en un solo elemento por vista, tipicamente el eyebrow.
- Color semantico solo para estados reales: exito, advertencia, error e info con sus tokens.
- Piso de calidad siempre: responsive hasta movil, foco visible, contraste AA y `prefers-reduced-motion`.
- Si de verdad se necesita un color nuevo, primero actualizar tokens y el design system; nunca introducirlo directo en un componente.
