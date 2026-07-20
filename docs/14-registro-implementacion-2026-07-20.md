# Registro de implementacion - 2026-07-20

## Objetivo de la jornada

Fortalecer la operacion fiscal y contable, reducir el ruido visual de Ledger UI y habilitar una incorporacion segura de clientes al portal.

## Perfil fiscal desde constancia SAT

- Se agrego lectura de Constancias de Situacion Fiscal en PDF mediante `unpdf`.
- Se extraen RFC, nombre fiscal, codigo postal, claves de regimen, nombre comercial, estatus, fecha de inicio y actividades cuando estan disponibles.
- Se exige la informacion fiscal minima cuando se usa una constancia.
- Se rechazan constancias que indiquen un estatus diferente de ACTIVO.
- Se reforzo el parser para evitar que encabezados del PDF se guarden como nombre fiscal.
- Se valida RFC duplicado dentro de los clientes activos del contador.
- Los campos manuales permanecen como respaldo cuando no se adjunta una constancia.

## Validacion de CFDI 4.0

- El parser XML ahora obtiene version, tipo de comprobante, regimen del emisor y receptor, codigo postal receptor, UsoCFDI, LugarExpedicion, Exportacion y ObjetoImp por concepto.
- Se compara RFC, nombre y regimen contra el perfil fiscal correspondiente.
- El codigo postal se compara cuando la empresa es receptora. LugarExpedicion no se compara con el domicilio fiscal del emisor porque puede representar una sucursal.
- Se valida MetodoPago y FormaPago para comprobantes que los requieren.
- Se alerta cuando PPD no utiliza FormaPago 99 o cuando PUE utiliza 99.
- Se valida ObjetoImp por concepto y la coherencia basica de los nodos de impuestos.
- Los XML anteriores se revalidan al abrir la empresa.
- Un CFDI con diferencias no puede marcarse como revisado; el servidor vuelve a validarlo antes de aceptar el cambio.
- Las alertas son visibles tanto para el contador como para el cliente.

## Clasificacion y cuentas por pagar

- Se agregaron etiquetas legibles para MetodoPago y FormaPago.
- Los gastos PPD pendientes y los gastos manuales pendientes se identifican como cuentas por pagar.
- Se agrego el filtro Gastos a credito para ambos roles.
- Las cuentas por pagar tienen indicador visual y total acumulado en el dashboard.
- Al cambiar el estado a Pagado dejan de aparecer como credito.
- Se agrego sugerencia de categoria para gastos importados desde XML.

## Captura y movimientos

- La importacion admite varios XML por lote.
- Los duplicados o archivos invalidos se omiten sin detener los XML validos.
- Se muestran resultados de importacion y errores en la interfaz.
- Se eliminaron los campos duplicados Cliente opcional y Proveedor opcional de la captura manual.
- Los movimientos se editan al hacer clic en la fila y tambien mediante Enter o Espacio.
- Se mantuvieron eliminacion con confirmacion, notas de revision y cierre de modal con Escape.

## Limpieza de Ledger UI

- El sidebar del contador muestra solo modulos funcionales.
- El contenido aprovecha el espacio cuando el sidebar esta contraido.
- Se eliminaron acciones visuales que todavia no tenian implementacion.
- Se unificaron encabezados, busqueda, filtros, estados y mensajes.
- Los filtros activos muestran contador y opcion para restablecerlos.
- Los indicadores financieros comparten una superficie compacta de hasta tres columnas.
- Las tarjetas de clientes redujeron superficies anidadas y altura.
- Los formularios usan etiquetas persistentes, ayuda contextual y estilos neutrales.
- Los colores se reservan para estados positivos, pendientes y errores reales.
- Las tablas se transforman en tarjetas legibles en pantallas pequenas.
- Los modales incorporan semantica de dialogo y un solo desplazamiento principal.
- Se agrego soporte para `prefers-reduced-motion`.

## Acceso de clientes por invitacion

- El contador puede seleccionar Dar acceso desde el menu de cada cliente.
- Se genera un enlace de invitacion que puede copiarse y abrirse para comprobarlo.
- El cliente captura su nombre y correo, elige su contrasena y la confirma.
- Al completar el registro se crea la membresia del cliente y se inicia su sesion automaticamente.
- La invitacion vence despues de siete dias y solo puede utilizarse una vez.
- Generar una invitacion nueva invalida las invitaciones pendientes anteriores.
- El token no se almacena en texto plano; se guarda un hash SHA-256.
- Se evita sobrescribir cuentas existentes o crear un segundo acceso activo para la empresa.
- Se agrego la migracion `20260721030000_add_client_invitations`.
- El singleton de Prisma detecta clientes generados obsoletos durante desarrollo para evitar errores despues de cambios de esquema.

## Seguridad y dependencias

- Se elimino `exceljs`, que incorporaba dependencias vulnerables sin uso activo.
- Se actualizaron resoluciones de `postcss` y `@hono/node-server`.
- La auditoria de dependencias final reporto cero vulnerabilidades.

## Archivos principales

- `app-web/src/app/actions.ts`
- `app-web/src/lib/cfdi.ts`
- `app-web/src/lib/cfdi-classification.ts`
- `app-web/src/lib/fiscal-constancy.ts`
- `app-web/src/lib/fiscal-validation.ts`
- `app-web/src/app/empresas/[companyId]/page.tsx`
- `app-web/src/app/invitacion/[token]/page.tsx`
- `app-web/src/components/client-card-menu.tsx`
- `app-web/src/components/invitation-link.tsx`
- `app-web/src/app/globals.css`
- `app-web/prisma/schema.prisma`

## Verificacion

- ESLint sin errores.
- Build de produccion de Next.js completado.
- TypeScript completado durante el build.
- `npm audit --audit-level=moderate`: cero vulnerabilidades.
- `git diff --check`: sin errores de espacios.
- Migracion de invitaciones aplicada correctamente en PostgreSQL/Supabase.

## Pendientes futuros

- Envio automatico del enlace de invitacion por correo mediante un proveedor transaccional.
- Verificacion de dominio, SPF y DKIM antes de habilitar correos en produccion.
- Consulta en tiempo real del estado y cancelacion de UUID ante servicios del SAT.
- Recuperacion y restablecimiento de contrasena.
