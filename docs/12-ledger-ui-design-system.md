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

## Colores (paleta Libro Mayor)

Inspirada en el mundo contable: tinta verde, papel y un acento de laton usado con moderacion. Es la paleta oficial y unica del producto.

Base:

- Tinta / primario: `#15352A`.
- Salvia / secundario: `#2F5D44`.
- Papel / fondo principal: `#F5F6F3`.
- Lino / superficie y cards: `#FFFFFF`.
- Bruma / bordes: `#E4E7E2`.
- Texto principal: `#14201A`.
- Texto secundario: `#5E6B62`.
- Hover: `#EFF1ED`.

Acento (firma, usar con moderacion):

- Laton: `#B0842A` para rellenos, indicadores y detalles.
- Laton fuerte: `#8A6518` para texto pequeno como eyebrows (cumple contraste AA).
- Laton suave: `#F4ECD8` para fondos y badges de enfasis.

Semanticos (terrosos, armonizados con la tinta, nunca los tonos neon por defecto):

- Exito: `#2E7D53`.
- Advertencia: `#B4791F`.
- Error: `#B23A2E`.
- Informacion: `#35688C`.

Uso del color:

- Verde tinta: navegacion, acciones principales y estados positivos de marca.
- Laton: solo el elemento firma de cada vista, por ejemplo el eyebrow de seccion. No competir con el verde.
- Rojo: errores y correcciones fiscales reales.
- Ambar: pendientes y cuentas por pagar.
- Neutros: superficies, texto y datos normales.
- Nunca usar un color plano saturado en tarjetas de contenido habitual.

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

## Regla para paginas nuevas

Toda pantalla, componente o correo nuevo debe conservar la paleta Libro Mayor. Es obligatorio:

- Derivar todo color, radio y sombra de los tokens de `globals.css`. Nunca introducir hex arbitrarios en componentes.
- Usar las clases del sistema (`calm-*`, `ledger-*`) antes de crear estilos nuevos. Si falta una variante, agregarla como clase reutilizable, no como estilo suelto.
- Reservar el laton para un unico elemento firma por vista; el verde tinta es el ancla.
- Fondo papel, superficies blancas, bordes bruma y texto tinta como base de cada pantalla.
- Mantener el color semantico disciplinado: verde, ambar, rojo e info solo para estados reales.
- Cumplir el piso de calidad: responsive hasta movil, foco visible, contraste AA y `prefers-reduced-motion`.

Si un diseno nuevo necesita un color fuera de la paleta, primero se actualiza este documento y los tokens; nunca al reves.

## Regla de oro

Antes de agregar un componente, responder:

- Reduce la carga cognitiva del usuario?
- Es consistente con el resto de la aplicacion?
- Ayuda a completar la tarea mas rapido?
- Puede reutilizarse en otras pantallas?
- Mantiene la interfaz limpia?

Si alguna respuesta es no, el componente debe redisenarse o eliminarse.
