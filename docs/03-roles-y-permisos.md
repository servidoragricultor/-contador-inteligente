# Roles y permisos

## Contador

Puede:

- Crear empresas/clientes.
- Editar datos basicos de empresas.
- Invitar clientes.
- Ver todas sus empresas.
- Ver ingresos y gastos de sus empresas.
- Crear, editar y revisar registros.
- Marcar registros como revisados.
- Solicitar correccion.
- Exportar Excel.

No se limita a una sola empresa.

## Cliente

Puede:

- Entrar solo a empresas donde fue invitado.
- Registrar ingresos.
- Registrar gastos.
- Importar XML.
- Ver sus registros.
- Corregir registros marcados con requiere correccion.

No puede:

- Ver otras empresas.
- Crear empresas.
- Invitar usuarios.
- Eliminar registros revisados.
- Cambiar datos fiscales criticos sin revision.

## Regla de seguridad

Todo acceso a ingresos, gastos, XML y archivos debe validarse contra la empresa del usuario.
