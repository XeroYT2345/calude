# Vídeos de TikTok para AniRadar

Tres vídeos verticales (1080×1920, 30 fps, ~17 s) en `tiktok/out/`, con su portada:

| Vídeo | Qué promociona | Archivo |
|---|---|---|
| ¿Viste un anime y NO recuerdas el nombre? | Identificador por trama y por captura | `identifica.mp4` |
| ¿No sabes qué anime ver hoy? | El test `que-anime-ver.html` | `que-anime-ver.mp4` |
| ¿A qué hora sale el próximo episodio en TU país? | Calendario, recordatorios y dónde verlo legal | `calendario.mp4` |

Están hechos **solo con gráficos y texto originales**: no aparecen clips, carátulas, personajes ni música de ningún anime. Es la causa nº 1 de vídeos silenciados, retirados y cuentas penalizadas.

## Antes de publicar: reglas para que no te bloqueen

1. **Música: solo desde TikTok y, si puedes, de la biblioteca de música comercial.** Los vídeos llevan audio en silencio a propósito. Al subirlos, añade un sonido desde TikTok. Si tu cuenta es de empresa, solo podrás elegir de la *Commercial Music Library*, que es la opción segura para contenido promocional. **Nunca** metas openings de anime ni canciones descargadas.
2. **Marca el contenido como promocional.** En «Más opciones → Divulgación de contenido» activa **«Tu marca»**, porque estás promocionando tu propia web. No es obligatorio en todos los casos, pero evita problemas con la política de contenido comercial.
3. **El enlace va en el perfil, no en el vídeo.** Pon `aniradar.net` en la biografía. TikTok solo deja poner enlace clicable a algunas cuentas (empresa o con suficientes seguidores, según el país). Mientras tanto basta con el texto «aniradar.net» en la bio, que ya aparece en el vídeo.
4. **No pidas interacción a cambio de nada.** Evita «dale like si…», «comenta 1 y te lo paso» o «sígueme para la parte 2» sin parte 2: TikTok lo trata como *engagement bait* y te baja el alcance.
5. **No subas el mismo vídeo varias veces** ni en varias cuentas, y no compres seguidores ni vistas. Publica 1 vídeo al día como mucho.
6. **Etiqueta de IA:** no hace falta, porque son gráficos animados y no imágenes realistas generadas por IA. Si algún día usas una voz o una cara generadas por IA, actívala.
7. **Sin marcas de agua de otras apps.** Si los subes también a Reels o Shorts, usa los MP4 originales, no los descargados de TikTok.
8. **No digas nada que no sea verdad.** Todo lo que dicen los vídeos lo hace tu web: es gratis, no pide registro, tiene 20 países y 6 idiomas y el recordatorio avisa 10 minutos antes. Mantenlo así si cambias textos.

## Textos para publicar (copiar y pegar)

**identifica.mp4**
> ¿Te ha pasado? Ves un trozo de anime en un vídeo y no hay forma de saber cuál es 😩 Con AniRadar lo describes con tus palabras o subes una captura y te dice el anime, el episodio y dónde verlo legal en tu país. Gratis y sin registro → aniradar.net (enlace en el perfil)
>
> #anime #animeespañol #animetok #otaku #recomendacionesanime

**que-anime-ver.mp4**
> No sé qué anime ver → 3 preguntas → 6 recomendaciones. ¿Acción, risas, misterio o romance? Pruébalo gratis en aniradar.net/que-anime-ver (enlace en el perfil)
>
> #anime #queanimever #recomendacionesanime #animetok #otaku

**calendario.mp4**
> Cuenta atrás de los próximos episodios en TU hora local y recordatorio al calendario 10 min antes 🔔 Y además te dice dónde verlo legal en tu país. aniradar.net
>
> #anime #animeespañol #estrenosanime #animetok #otaku

## Consejos para que lleguen a más gente

- **Ponle tu voz.** Graba encima la frase del gancho («¿Viste un anime y no recuerdas el nombre?») con el micrófono de TikTok. Los vídeos con voz original suelen tener más alcance que los mudos con música.
- **Portada:** elige el primer segundo (el gancho grande) como portada. También tienes `*-portada.jpg`.
- **Responde comentarios con vídeo:** si alguien pregunta «¿y qué anime es el de…?», búscalo en AniRadar y responde con un vídeo grabando tu pantalla. Ese contenido es tuyo y genera mucha interacción. Al grabar la pantalla, **evita mostrar escenas o tráileres del anime**: con la ficha y el resultado basta.
- **Horario:** prueba entre las 18:00 y las 22:00 de tu país y mira en las estadísticas cuál funciona mejor.

## Volver a generarlos o hacer más

Los vídeos se dibujan en `render.html` (canvas) y se graban con `render.mjs` (Playwright + ffmpeg):

```bash
npm i playwright && npx playwright install chromium   # solo la primera vez
node tiktok/render.mjs              # vídeos en tiktok/out/
node tiktok/render.mjs --stills     # solo fotogramas sueltos, para revisar el diseño
```

Para cambiar textos, edita las funciones `v1`, `v2` y `v3` de `render.html`.
