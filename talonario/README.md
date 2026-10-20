# Talonario · facturas para autónomos

Una sola página (`index.html` + la carpeta `fonts/`) que hace una factura de autónomo en 30 segundos y la descarga en PDF. Sin servidor, sin cuentas, sin gastos fijos: todo pasa en el navegador del usuario.

**Modelo de ingresos:** gratis con la línea «Hecho con Talonario» al pie del PDF; **Pro, 19 € de pago único**, la quita y añade logo, clientes guardados, historial y plantilla moderna. El pago se hace en Lemon Squeezy o Gumroad; el comprador recibe una clave por correo, la pega en la web y Pro queda activado en su navegador.

## Publicar (10 minutos)

1. Sube la carpeta `talonario/` entera (con `fonts/`) a tu hosting. Vale Hostinger, o gratis en Cloudflare Pages o Netlify arrastrando la carpeta.
2. Ponle un dominio propio cuando puedas (`talonario.app`, `talonario.es`…). Mientras tanto funciona en cualquier ruta.
3. Cambia `site` en `CONFIG` (al principio del `<script>`) por tu dominio: es lo que aparece en la línea del PDF.

## Cobrar

**Lemon Squeezy (recomendado):** actúa como vendedor oficial, así que calcula y liquida él el IVA de cada país del comprador. Tú no tienes que darte de alta en el régimen de IVA de la UE para vender fuera de España.

1. Crea el producto «Talonario Pro» a 19 €. En el producto activa **License keys** (y pon un límite de activaciones, por ejemplo 3).
2. Copia el enlace de compra en `CONFIG.checkoutUrl` y el id numérico del producto en `CONFIG.productId`. Deja `provider: 'lemonsqueezy'`.
3. **Borra `demoCode`** antes de publicar. Hasta entonces, la clave `TALONARIO-DEMO` activa Pro para que lo pruebes.

**Gumroad:** mismo proceso con `provider: 'gumroad'`, el enlace del producto en `checkoutUrl` y su `product_id` en `productId`. Activa «Generate a unique license key per sale».

Al pagar, la clave llega por correo. El usuario pulsa «Pro · 19 €», la pega y listo. Si cambia de navegador, la vuelve a pegar (cada vez cuenta como una activación).

## Legal, antes de lanzar

- **Aviso legal:** una web que vende algo en España tiene que identificar al titular (nombre, NIF y contacto). Añade una página `aviso-legal.html` y enlázala desde el pie.
- **Privacidad:** no hay servidor ni cookies; los datos se guardan en `localStorage` del propio usuario, y las fuentes se sirven desde tu dominio (no desde Google). Aun así, una página corta de privacidad que lo explique evita problemas.
- **Veri*Factu:** es la obligación de que los programas de facturación en España registren cada factura ante la Agencia Tributaria. Se ha aplazado varias veces; para autónomos está prevista para 2027. Comprueba la fecha vigente en la web de la AEAT. Cuando sea obligatoria, Talonario tal como está (un generador de PDF) no bastará para emitir facturas en España: tendrás que adaptarlo o limitarlo a presupuestos y a otros países.

## Cómo se promociona

- **Buscar en Google:** la página está preparada para «hacer factura autónomo», «factura con retención IRPF», «generador de facturas gratis», «factura sin IVA». Las preguntas frecuentes llevan datos estructurados (FAQ) para salir con más espacio en los resultados.
- **TikTok y Reels:** el formato de los vídeos de AniRadar vale aquí. Ganchos: «Cómo hacer tu primera factura de autónomo en 30 segundos», «El error del IRPF que cometen todos los autónomos nuevos» (7 % vs 15 %), «Factura a un particular vs a una empresa».
- **Donde están los autónomos:** grupos y foros de freelancers, Reddit (r/autonomos), comentarios en vídeos sobre darse de alta como autónomo.

## Límites conocidos

- Pro se guarda en el navegador. Alguien con conocimientos puede activarlo editando `localStorage`; para un producto de 19 € sin servidor es un riesgo aceptable.
- Los datos viven en el navegador del usuario: si borra los datos de navegación, pierde el historial. La web lo avisa y Pro puede exportar una copia en JSON.
- El PDF se genera con «Imprimir → Guardar como PDF» del navegador. Funciona en Chrome, Safari (también en iPhone), Firefox y Edge.

## Probar en local

Abre `index.html` en el navegador. Para probar Pro, pulsa «Pro · 19 €» y pega `TALONARIO-DEMO`.
