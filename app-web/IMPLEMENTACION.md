# Implementacion actual

## Estado

Primer corte funcional de Etapa 1.

## Incluye

- App Next.js con TypeScript y Tailwind CSS.
- Prisma con PostgreSQL.
- Modelo multiempresa.
- Usuarios y sesiones propias basicas.
- Registro/login de contador.
- Creacion de empresas.
- Registro manual de ingresos.
- Registro manual de gastos.
- Importacion basica de XML CFDI.
- Deteccion ingreso/gasto por RFC de empresa.
- Deteccion de UUID duplicado por empresa.
- Estados de pago/cobro.
- Estado de revision contable.
- Dashboard simple por empresa.

## Decisiones temporales

- La app requiere una base PostgreSQL configurada en `DATABASE_URL`.
- La autenticacion es propia y minima para validar flujo.
- Better Auth queda recomendado para endurecer auth y organizaciones en una siguiente iteracion.
- Los XML se guardan por ahora como texto en base de datos; despues deben ir a storage y dejar solo metadata en DB.

## Variables

Crear `app-web/.env` con:

```bash
DATABASE_URL="postgresql://usuario:password@host:5432/database?schema=public"
```

## Comandos

Instalar dependencias:

```bash
npm install
```

Ejecutar migraciones:

```bash
npx prisma migrate dev
```

Iniciar desarrollo:

```bash
npm run dev
```

Verificar:

```bash
npm run lint
npm run build
```
