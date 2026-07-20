# Validacion fiscal SAT

## Fuente oficial

La implementacion sigue el Anexo 20 y el esquema XSD de CFDI 4.0 publicados por el SAT:

- https://omawww.sat.gob.mx/tramitesyservicios/Paginas/anexo_20.htm
- http://www.sat.gob.mx/sitio_internet/cfd/4/cfdv40.xsd

El SAT indica que CFDI 4.0 es la unica version valida desde el 1 de abril de 2023. Para el receptor son obligatorios:

- RFC.
- Nombre, denominacion o razon social.
- Domicilio fiscal receptor, expresado como codigo postal.
- Regimen fiscal receptor.
- Uso CFDI.

## Datos obtenidos de la constancia

Al crear un cliente desde su Constancia de Situacion Fiscal se extraen:

- RFC.
- Nombre fiscal.
- Codigo postal.
- Una o varias claves de regimen fiscal.
- Nombre comercial, cuando esta disponible.

El Uso CFDI no se obtiene de la constancia. Es una decision asociada a cada factura y se lee directamente del XML.

## Comparacion de facturas

Para CFDI recibidos se compara el nodo Receptor contra el perfil fiscal del cliente:

- Rfc.
- Nombre.
- DomicilioFiscalReceptor.
- RegimenFiscalReceptor.

Para CFDI emitidos se compara el nodo Emisor:

- Rfc.
- Nombre.
- RegimenFiscal.

LugarExpedicion no se compara con el codigo postal fiscal porque puede corresponder a una sucursal.

Tambien se valida directamente en el XML:

- Version CFDI 4.0.
- MetodoPago y FormaPago cuando corresponden al tipo de comprobante.
- PPD con FormaPago 99.
- PUE con una forma distinta de 99.
- ObjetoImp en cada concepto.
- Presencia o ausencia de impuestos de acuerdo con ObjetoImp 01, 02 y 04.

Las diferencias se guardan como correccion requerida, se muestran al cliente y al contador, y evitan que el CFDI se marque como revisado mientras continuen presentes.

## Alcance

La validacion detecta inconsistencias de datos entre la constancia y el XML. No consulta en tiempo real el estado del UUID ante el SAT, no confirma si un CFDI fue cancelado y no sustituye una revision fiscal profesional.
