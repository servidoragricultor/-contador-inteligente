# Contador Inteligente

Plataforma web para contadores y sus clientes enfocada en registrar ingresos y gastos con la menor friccion posible.

La vision final es crear un asistente financiero inteligente que lea informacion fiscal y bancaria, valide datos, detecte errores, concilie operaciones y muestre salud financiera clara.

La etapa actual no busca construir un sistema contable completo. Busca validar el flujo colaborativo entre contador y cliente.

## Etapa actual

Etapa 1: ingresos y gastos simples con revision contable.

En esta etapa el sistema debe permitir:

- Que el contador cree empresas/clientes.
- Que el contador invite clientes.
- Que el cliente registre ingresos y gastos manualmente.
- Que el cliente importe XML CFDI.
- Que el sistema detecte automaticamente si un XML es ingreso o gasto.
- Que el contador revise, corrija y valide registros.
- Que se exporte informacion basica a Excel.

## Fuera de alcance por ahora

- Conciliacion bancaria.
- Estados de cuenta bancarios.
- Pagos parciales complejos.
- Complementos de pago.
- OCR de PDF.
- Integracion directa con SAT.
- Reportes PDF avanzados.
- Salud financiera avanzada.
- Motor de reglas automaticas.

## Principio rector

El cliente captura lo minimo. El sistema automatiza lo posible. El contador revisa excepciones.

## Stack recomendado

La recomendacion tecnica inicial esta documentada en `docs/10-stack-tecnico-recomendado.md`.

Resumen recomendado para Etapa 1:

- Next.js.
- TypeScript.
- PostgreSQL.
- Prisma.
- Better Auth.
- Supabase Storage.
- Tailwind CSS.
