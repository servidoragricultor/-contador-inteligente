# Implementacion actual

## Estado

Primer corte funcional de Etapa 1.

## Incluye

- App Next.js con TypeScript y Tailwind CSS.
- Prisma con SQLite local para desarrollo.
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

- Se usa SQLite local para avanzar rapido en desarrollo.
- En produccion se debe migrar a PostgreSQL.
- La autenticacion es propia y minima para validar flujo.
- Better Auth queda recomendado para endurecer auth y organizaciones en una siguiente iteracion.
- Los XML se guardan por ahora como texto en base de datos; despues deben ir a storage y dejar solo metadata en DB.

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
