# Stack tecnico recomendado

## Contexto

Este documento evalua opciones tecnicas para Contador Inteligente.

El sistema requiere:

- Aplicacion web para contador y cliente.
- Multiempresa desde el inicio.
- Roles simples: contador y cliente.
- Registro de ingresos y gastos.
- Importacion de XML CFDI.
- Almacenamiento seguro de archivos.
- Exportacion Excel.
- Base preparada para crecer hacia bancos, conciliacion, reglas e inteligencia financiera.

## Recomendacion principal

Para Etapa 1 se recomienda:

- Frontend/fullstack: Next.js con App Router.
- Lenguaje: TypeScript.
- Base de datos: PostgreSQL.
- ORM: Prisma o Drizzle.
- Autenticacion: Better Auth o Auth.js.
- Archivos: Supabase Storage o S3 compatible.
- UI: Tailwind CSS con componentes propios o shadcn/ui.
- Validacion: Zod.
- XML: libreria Node.js para parseo XML.
- Excel: xlsx o exceljs.
- Hosting inicial: Vercel para app y Supabase/Neon para PostgreSQL.

## Opcion recomendada para MVP

Stack sugerido:

- Next.js.
- TypeScript.
- PostgreSQL.
- Prisma.
- Better Auth.
- Supabase Storage.
- Tailwind CSS.
- Zod.

Esta combinacion permite avanzar rapido sin dividir todavia frontend y backend en proyectos separados.

## Por que Next.js

Next.js permite construir interfaz, rutas protegidas, acciones de servidor y endpoints en una sola aplicacion.

Para Etapa 1 esto reduce friccion porque no necesitamos mantener un frontend y una API separada desde el dia uno.

Es adecuado para:

- Dashboards.
- Formularios.
- Carga de archivos.
- Procesamiento inicial de XML.
- Rutas por empresa.
- Exportaciones simples.

## Por que PostgreSQL

PostgreSQL es la mejor opcion para este producto porque la informacion es relacional y sensible.

El modelo tiene usuarios, empresas, membresias, transacciones, documentos fiscales, categorias y archivos.

Ademas, en etapas futuras sera util para reportes, conciliaciones, filtros por fecha, saldos y auditoria.

## Prisma vs Drizzle

### Prisma

Ventajas:

- Muy productivo para MVP.
- Esquema claro y facil de entender por agentes IA.
- Buen soporte TypeScript.
- Migraciones y Prisma Studio ayudan a desarrollo rapido.

Desventajas:

- Menos cercano a SQL puro.
- Puede ser menos flexible para consultas muy especializadas.

Recomendado si la prioridad es velocidad y claridad inicial.

### Drizzle

Ventajas:

- Mas cercano a SQL.
- Ligero.
- Buen rendimiento.
- Muy buena opcion para consultas complejas futuras.

Desventajas:

- Puede requerir mas criterio SQL desde el inicio.
- Para algunos agentes IA Prisma puede ser mas directo.

Recomendado si se prioriza control fino de SQL desde el comienzo.

### Decision sugerida

Usar Prisma en Etapa 1.

Motivo: el producto todavia esta validando flujo, roles, XML e ingresos/gastos. Prisma acelera el desarrollo y mantiene el modelo facil de documentar.

## Better Auth vs Auth.js vs Supabase Auth

### Better Auth

Ventajas:

- TypeScript moderno.
- Autenticacion y autorizacion extensible.
- Soporta organizaciones y control de acceso mediante plugins.
- Buena ruta para SaaS multiempresa.

Desventajas:

- Menos historico que Auth.js.

### Auth.js

Ventajas:

- Muy conocido en ecosistema Next.js.
- Soporta OAuth, magic links, credentials y adaptadores.
- Integracion madura.

Desventajas:

- La autorizacion multiempresa se debe modelar aparte.

### Supabase Auth

Ventajas:

- Rapido para iniciar.
- Integrado con Supabase Database y Storage.
- Bueno si se quiere delegar gran parte de auth.

Desventajas:

- Puede acoplar mas el producto a Supabase.
- La logica de permisos de negocio seguira viviendo en la app.

### Decision sugerida

Usar Better Auth si se quiere una base moderna y preparada para organizaciones.

Usar Auth.js si se prefiere una opcion mas conocida y establecida.

Para este proyecto, la recomendacion es Better Auth por su enfoque en organizaciones y control de acceso.

## Archivos XML y PDF

No guardar archivos XML/PDF directamente en la base de datos.

Guardar archivos en storage y guardar en PostgreSQL:

- Ruta del archivo.
- Nombre original.
- Tipo MIME.
- Tamano.
- Hash opcional.
- Empresa asociada.
- Usuario que lo subio.

Opciones:

- Supabase Storage: recomendado para MVP por simplicidad.
- S3 o compatible: recomendado cuando el producto crezca o se quiera independencia de proveedor.

## Procesamiento XML CFDI

El parseo XML debe vivir en backend/server code, nunca solo en frontend.

Reglas:

- Validar estructura XML.
- Extraer UUID del Timbre Fiscal Digital.
- Extraer emisor y receptor.
- Detectar ingreso o gasto por RFC de empresa.
- Evitar UUID duplicado por empresa.
- Crear transaccion y documento fiscal en una transaccion de base de datos.

## UI recomendada

Usar Tailwind CSS.

Componentes pueden ser propios o apoyarse en shadcn/ui.

La interfaz debe ser limpia, rapida y no tecnica.

Pantallas clave:

- Login.
- Empresas del contador.
- Dashboard de empresa.
- Lista de ingresos/gastos.
- Nuevo ingreso.
- Nuevo gasto.
- Importar XML.
- Revision contable.

## Hosting recomendado

Para MVP:

- Vercel: aplicacion Next.js.
- Supabase o Neon: PostgreSQL.
- Supabase Storage: XML/PDF.

Para produccion mas avanzada:

- Railway, Render, Fly.io o AWS si se necesita backend persistente, jobs o procesamiento pesado.
- S3 compatible para archivos.
- Worker separado para tareas pesadas como OCR, SAT, bancos o conciliacion masiva.

## Alternativas evaluadas

### Laravel

Laravel es excelente para sistemas administrativos, roles, colas, archivos y reportes.

Seria una opcion fuerte si el equipo domina PHP o si se quiere un backend tradicional robusto.

No es la recomendacion principal aqui porque Next.js permite avanzar mas rapido en una sola base TypeScript para interfaz y backend inicial.

### NestJS separado

NestJS es excelente para APIs empresariales.

Conviene cuando el backend crece mucho, hay muchos servicios, colas, integraciones y equipos separados.

Para Etapa 1 puede ser mas arquitectura de la necesaria.

### Supabase completo

Supabase puede resolver auth, database y storage rapido.

Es buena opcion, pero para este producto la logica de negocio fiscal y revision contable debe mantenerse clara en el backend de la app.

## Arquitectura por etapas

### Etapa 1

Monolito fullstack con Next.js.

Suficiente para ingresos, gastos, XML, usuarios, empresas, revision y exportacion Excel.

### Etapa 2

Agregar modulo bancario y conciliacion.

Evaluar jobs en background para procesar archivos bancarios grandes.

### Etapa 3

Agregar worker separado si hay procesamiento pesado.

Ejemplos: OCR, integracion SAT, conciliacion masiva, IA, reportes grandes.

## Decision final recomendada

Construir Etapa 1 con:

- Next.js.
- TypeScript.
- PostgreSQL.
- Prisma.
- Better Auth.
- Supabase Storage.
- Tailwind CSS.
- Zod.
- exceljs.
- fast-xml-parser o libreria equivalente para XML.

Esta decision favorece velocidad, orden, seguridad multiempresa y crecimiento gradual.
