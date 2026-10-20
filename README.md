# AniRadar · monetize.js

Capa de monetización para aniradar.net. Un solo archivo, sin dependencias, coste 0 €.

## Instalar (2 minutos)
1. Sube `monetize.js` junto a tu `index.html`.
2. Antes de `</body>` añade: `<script src="monetize.js" defer></script>`
3. Edita el bloque `CONFIG` al principio del archivo con tus IDs (lo que dejes vacío no se activa).

## Qué hace
| Función | Necesita |
|---|---|
| Etiqueta de afiliado en los enlaces de Amazon de «Dónde verlo» | ID de Amazon Associates |
| Bloque «Manga, figuras y merchandising» en cada ficha (según el país elegido) | ID de Amazon Associates de esa tienda |
| Anuncio AdSense en la portada | ID del bloque de anuncios (`homeSlot`) |
| Botón «Apoya AniRadar» en el pie | URL de Ko-fi / Buy Me a Coffee |
| Enlaces de otros afiliados (Impact, Awin, CJ…) | plantilla en `deepLinks` / `extraStores` |

## Dónde conseguir los IDs (gratis)
- **Amazon Associates**: afiliados.amazon.es (y uno por cada país que quieras cubrir).
- **AdSense**: crea un bloque «adaptable» y copia su `data-ad-slot`.
- **Ko-fi**: ko-fi.com → tu página → copia la URL.

## Notas
- Los enlaces llevan `rel="sponsored nofollow"` y un aviso de afiliados visible.
- Si el anuncio no se rellena, el hueco se oculta solo.
- En la UE/Reino Unido AdSense exige un banner de consentimiento (CMP) certificado.
