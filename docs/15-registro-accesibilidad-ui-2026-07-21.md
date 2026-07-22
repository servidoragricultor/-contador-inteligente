# Registro de accesibilidad y calidad UI - 2026-07-21

## Objetivo de la jornada

Revisar la interfaz completa contra las Web Interface Guidelines de Vercel y corregir problemas de accesibilidad, semantica, formularios, interaccion tactil, rendimiento visual y comunicacion de estados asincronos.

## Navegacion y estructura

- Se agrego un enlace global para saltar al contenido principal.
- Todas las rutas activas exponen el destino `main-content`.
- Se agrego `theme-color` para mantener coherencia con el fondo de la aplicacion.
- Los encabezados usan balance de texto y margen de desplazamiento cuando tienen identificador.
- Los nombres largos de empresas pueden dividirse sin provocar desbordamiento horizontal.
- La barra lateral colapsada mantiene nombres accesibles en enlaces y en la accion Salir.
- El disparador de navegacion movil comunica su estado expandido y respeta las areas seguras del dispositivo.

## Foco, dialogos y teclado

- Se creo el hook compartido `useDialogFocus`.
- Los dialogos mueven el foco al abrirse, contienen la navegacion con Tab y restauran el foco al cerrarse.
- Mientras un dialogo esta abierto se bloquea el desplazamiento del documento de fondo.
- Los modales y paneles usan contencion de overscroll.
- Se eliminaron fondos implementados como `div` clicables para evitar controles no semanticos y cierres accidentales.
- Las filas de movimientos editables abren el detalle completo con clic, Enter o espacio y muestran foco visible.
- Los controles internos, como la revision contable, conservan su propia accion sin abrir la edicion de la fila.
- Se conservaron el cierre con Escape y las confirmaciones antes de descartar cambios.

## Formularios y estados asincronos

- Se creo el componente reutilizable `SubmitButton` con `useFormStatus`.
- Los envios muestran indicador de progreso, usan el caracter de elipsis correcto y bloquean activaciones repetidas mientras estan pendientes.
- Se agregaron estados pendientes a acceso, registro, creacion, edicion, eliminacion e importacion.
- Se mejoraron `autocomplete`, `inputMode`, `spellCheck`, tipos de campo y ejemplos de placeholders.
- Los errores devueltos por el servidor reciben foco mediante el componente `FormError`.
- Los errores de creacion de clientes se muestran dentro del dialogo correspondiente.
- Los errores de movimientos regresan a la empresa y modo de captura correctos.
- La copia de invitaciones anuncia exito o error a tecnologias de asistencia y ofrece una alternativa manual cuando falla el portapapeles.
- La importacion XML ya no se envia inmediatamente al seleccionar archivos; ahora permite revisar la seleccion y confirmar la importacion.
- Los formatos no admitidos al arrastrar PDF o XML muestran errores visibles y anunciados.

## Cambios sin guardar

- Se creo el hook compartido `useUnsavedChanges`.
- Los formularios de creacion y edicion advierten antes de recargar o abandonar la pagina con cambios pendientes.
- Cerrar un dialogo con datos modificados requiere confirmacion.
- Un envio valido limpia el estado pendiente para no mostrar advertencias durante la navegacion posterior.

## Interaccion tactil y movimiento

- Los controles interactivos usan `touch-action: manipulation`.
- Se definio intencionalmente el color de resaltado tactil en WebKit.
- Los filtros y acciones principales mantienen una altura tactil minima de 44 px.
- Los paneles fijos consideran `env(safe-area-inset-*)`.
- Se reemplazo `transition-all` por propiedades explicitas.
- Se mantiene la variante global para `prefers-reduced-motion`.

## Contenido, formato y rendimiento

- Los porcentajes se formatean con `Intl.NumberFormat`.
- El mes y la fecha predeterminados se calculan para la zona horaria `America/Mexico_City`.
- Fechas, monedas y cantidades comparables usan formatos internacionales y numeros tabulares.
- Se agrego `content-visibility: auto` a colecciones potencialmente extensas.
- Se corrigio el orden entre encabezados y celdas de la tabla de movimientos del cliente.
- Ingresos y gastos se presentan como lineas de libro mayor: canto semantico, importe firmado, concepto dominante y estados legibles.
- Se eliminaron la columna y el boton Editar para reducir decisiones repetidas; una instruccion breve explica la interaccion una sola vez.
- Los codigos SAT y enlaces tecnicos visibles se protegen con `translate="no"`.
- Se corrigieron elipsis, espacios no separables y varias etiquetas fiscales en espanol.
- Se ocultaron de los nombres accesibles los signos decorativos usados en acciones de alta.

## Componentes compartidos agregados

- `app-web/src/components/form-error.tsx`
- `app-web/src/components/submit-button.tsx`
- `app-web/src/hooks/use-dialog-focus.ts`
- `app-web/src/hooks/use-unsaved-changes.ts`

## Verificacion

- Revision completa contra las Web Interface Guidelines vigentes.
- `npm run lint`: completado sin errores ni advertencias.
- `npm run build`: compilacion de produccion completada.
- TypeScript: completado durante el build.
- Generacion de rutas estaticas y dinamicas: completada.
- `git diff --check`: sin errores de espacios.

## Resultado

La interfaz conserva los flujos existentes de contador y cliente, pero ahora ofrece controles semanticos, mejor navegacion por teclado, estados de carga consistentes, proteccion ante perdida de datos y una base compartida para mantener las siguientes pantallas bajo los mismos criterios de accesibilidad y calidad.
