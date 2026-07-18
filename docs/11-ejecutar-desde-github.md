# Ejecutar el proyecto desde GitHub

## Punto importante

GitHub no ejecuta directamente esta aplicacion como servidor.

GitHub Pages sirve para paginas estaticas, pero esta app necesita backend porque usa:

- Login y sesiones.
- Server Actions de Next.js.
- Prisma.
- Base de datos.
- Importacion de XML.
- Rutas dinamicas por empresa.

Por eso, la forma correcta es:

GitHub como repositorio + Vercel como hosting + PostgreSQL como base de datos.

## Opcion recomendada

Usar Vercel conectado al repositorio de GitHub.

Repositorio:

```text
https://github.com/servidoragricultor/-contador-inteligente.git
```

## Pasos en Vercel

1. Entrar a `https://vercel.com`.
2. Crear cuenta o iniciar sesion con GitHub.
3. Presionar `Add New Project`.
4. Seleccionar el repositorio `-contador-inteligente`.
5. En `Root Directory`, elegir:

```text
app-web
```

6. Configurar variables de entorno.
7. Desplegar.

## Variables necesarias

Para desarrollo local se usa SQLite:

```text
DATABASE_URL="file:./dev.db"
```

Para produccion no se recomienda SQLite. Se debe usar PostgreSQL.

Ejemplo:

```text
DATABASE_URL="postgresql://usuario:password@host:5432/database?schema=public"
```

## Base de datos recomendada

Opciones simples:

- Supabase PostgreSQL.
- Neon PostgreSQL.
- Vercel Postgres si esta disponible en la cuenta.

## Ajuste pendiente antes de produccion real

La implementacion actual usa SQLite local para avanzar rapido.

Antes de desplegar produccion real se debe cambiar Prisma a PostgreSQL:

```prisma
datasource db {
  provider = "postgresql"
}
```

Tambien se debe quitar el adapter local `better-sqlite3` y usar el cliente compatible con PostgreSQL.

## Recomendacion practica

Para probar en internet rapido:

1. Crear base PostgreSQL en Supabase o Neon.
2. Cambiar Prisma de SQLite a PostgreSQL.
3. Poner `DATABASE_URL` en Vercel.
4. Conectar Vercel al repo de GitHub.
5. Desplegar.

## Por que no GitHub Pages

No usar GitHub Pages para esta etapa porque no ejecuta backend Node.js.

GitHub Pages no puede manejar:

- Sesiones.
- Acciones de servidor.
- Prisma.
- Carga y procesamiento XML en backend.
- Base de datos.
