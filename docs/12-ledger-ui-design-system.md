# Ledger UI v1.0

Nombre temporal del design system para Contador Inteligente.

## Filosofia

La informacion financiera debe sentirse simple.

Ledger UI busca que el sistema transmita claridad, calma, precision y confianza. No debe sentirse como un ERP antiguo. Debe sentirse como un SaaS financiero moderno, ligero y profesional.

## Principios

- Claridad: el usuario nunca debe pensar donde hacer clic.
- Rapidez: las acciones importantes deben estar a un clic.
- Consistencia: el mismo boton debe verse igual en toda la aplicacion.
- Jerarquia: debe ser evidente que es importante, secundario o requiere atencion.
- Calma visual: mucho espacio, aire y nada de saturacion.

## Grid

La unidad base es 8 px.

Espaciados permitidos:

- 4.
- 8.
- 16.
- 24.
- 32.
- 40.
- 48.
- 56.
- 64.
- 80.
- 96.

## Tipografia

Fuente principal: Inter.

Escala:

- H1: 36 px.
- H2: 30 px.
- H3: 24 px.
- H4: 20 px.
- Titulo tarjeta: 18 px.
- Texto normal: 16 px.
- Texto pequeno: 14 px.
- Ayuda: 12 px.

Pesos:

- 700: titulos.
- 600: subtitulos.
- 500: botones.
- 400: texto.

## Colores

- Primario: `#1A3B2A`.
- Secundario: `#2F5D44`.
- Fondo principal: `#F8FAFC`.
- Cards: `#FFFFFF`.
- Bordes: `#E5E7EB`.
- Texto principal: `#111827`.
- Texto secundario: `#6B7280`.
- Hover: `#F3F4F6`.
- Exito: `#16A34A`.
- Advertencia: `#F59E0B`.
- Error: `#DC2626`.
- Informacion: `#2563EB`.

## Radios

- Inputs: 12 px.
- Cards: 16 px.
- Modales: 20 px.
- Botones: 12 px.
- Badges: 999 px.

## Sombras

Solo tres niveles:

- Small: cards.
- Medium: dropdowns.
- Large: modales.

Nunca usar sombras fuertes.

## Tokens

Los estilos deben depender de tokens CSS y clases reutilizables. Evitar colores o medidas arbitrarias directamente en componentes nuevos.

Tokens principales:

- `--color-primary`.
- `--color-secondary`.
- `--color-background`.
- `--color-surface`.
- `--color-border`.
- `--color-text`.
- `--color-muted`.
- `--color-success`.
- `--color-warning`.
- `--color-error`.
- `--color-info`.
- `--radius-sm`.
- `--radius-md`.
- `--radius-lg`.
- `--radius-xl`.
- `--shadow-sm`.
- `--shadow-md`.
- `--shadow-lg`.

## Regla de oro

Antes de agregar un componente, responder:

- Reduce la carga cognitiva del usuario?
- Es consistente con el resto de la aplicacion?
- Ayuda a completar la tarea mas rapido?
- Puede reutilizarse en otras pantallas?
- Mantiene la interfaz limpia?

Si alguna respuesta es no, el componente debe redisenarse o eliminarse.
