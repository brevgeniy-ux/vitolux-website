# VitoLux — рекламный ролик яхты: производственный пакет

Пакет для создания полноценного рекламного ролика яхты **Craft Ferretti**.

Что здесь есть:

1. **`vitolux-yacht-promo.mp4`** — готовый ролик (33 сек, Full HD), собранный из реальных
   фотографий яхты: движение камеры, титры, финальный призыв к действию и фоновый эмбиент.
   Можно публиковать уже сейчас (сайт, Instagram, Telegram).
2. **Этот документ** — раскадровка и готовые промпты для AI-видеогенераторов
   (Google Veo 3, Kling 2.x, Runway Gen-4, Hailuo/MiniMax), чтобы догенерировать сцены,
   которые невозможно получить из фото: модели, шампанское, прыжки в воду, ужин при свечах.
3. **`build-video.sh`** — скрипт сборки ролика (ffmpeg), чтобы пересобрать с другими
   титрами/контактами.

---

## Ключ к реалистичности: точное описание яхты

Чтобы сгенерированная яхта совпадала с реальной, в каждый промпт вставляйте этот блок
(описание составлено по фотографиям):

**RU (для понимания):** белая итальянская моторная яхта Craft Ferretti длиной ~14 м (47 футов)
с флайбриджем; бежевый бимини-топ на полированных дугах из нержавейки; радарная арка с
куполом Garmin и антеннами; чёрные тонированные окна салона трапециевидной формы; ряд
маленьких овальных иллюминаторов вдоль белого корпуса; по три чёрных цилиндрических кранца
на каждом борту; носовая палуба с белыми лежаками-матрасами и релингами из нержавейки;
кормовая купальная платформа с лесенкой из нержавейки; острый наклонный форштевень;
надпись «CRAFT FERRETTI» на бортике флайбриджа; болгарский флаг на корме.

**EN (вставлять в промпты как `[YACHT]`):**

```
a classic white 47-foot Italian motor yacht "Craft Ferretti" with a flybridge,
beige bimini canopy on polished stainless-steel arches, radar arch with a Garmin
radar dome and antennas, black tinted trapezoid saloon windows, a row of small oval
portholes along the sleek white hull, three black cylindrical fenders hanging on each
side, stainless-steel bow railings, white sunpad mattresses on the foredeck, stern
swim platform with a stainless ladder, sharp raked bow, "CRAFT FERRETTI" lettering
on the flybridge side
```

**Ещё надёжнее:** используйте режим *image-to-video* / *reference image* — загрузите
фотографии IMG_6832 (борт крупно, виден логотип) и IMG_6854 (нос, три четверти) как
референс/первый кадр. Тогда генератор сохранит геометрию именно вашей яхты. В Veo 3
это "Ingredients/Reference", в Kling — "Image to Video", в Runway — "First frame".

---

## Раскадровка полного ролика (60 сек)

| # | Время | Сцена | Источник |
|---|-------|-------|----------|
| 1 | 0–6 с | Дрон облетает яхту на ходу, белый след на воде, титул VITOLUX | генерация (сцена A) |
| 2 | 6–12 с | Модели загорают на носовых лежаках, бокалы шампанского | генерация (сцена B) |
| 3 | 12–17 с | Крупно: открывают шампанское на флайбридже, брызги | генерация (сцена C) |
| 4 | 17–23 с | Девушка прыгает с купальной платформы в бирюзовую воду, slow-mo | генерация (сцена D) |
| 5 | 23–29 с | Купание у яхты в лазурной бухте | генерация (сцена E) или фото IMG_6832 |
| 6 | 29–36 с | Яхта идёт на фоне заката, силуэт, золотая дорожка | генерация (сцена F) или фото IMG_6838 |
| 7 | 36–45 с | Романтический ужин на корме: свечи, пара, закат | генерация (сцена G) |
| 8 | 45–52 с | Тост, бокалы на фоне заката, смех | генерация (сцена H) |
| 9 | 52–60 с | Яхта на якоре в сумерках, титры: VITOLUX / Забронируйте прогулку своей мечты / info@vitoluxua.com | фото IMG_6854 (есть в готовом ролике) |

Сгенерированные клипы вставьте вместо/между сценами готового ролика — сборка та же
(`build-video.sh`, блок xfade).

---

## Промпты для генерации (копировать целиком)

Замените `[YACHT]` на блок описания яхты выше. Рекомендуемые настройки: 16:9, 1080p+,
5–8 секунд, cinematic.

### A. Дрон-облёт на ходу
```
Cinematic aerial drone shot orbiting [YACHT] cruising through calm deep-blue sea,
leaving an elegant white foamy wake, golden afternoon sunlight, sun glints on the
water, seagulls in the distance, luxury travel commercial style, smooth camera
motion, photorealistic, shallow depth of field
```

### B. Модели на носовой палубе с шампанским
```
Cinematic shot on the foredeck of [YACHT]: two beautiful elegant fashion models in
stylish designer swimwear and sunglasses relaxing on white sunpad mattresses, holding
glasses of sparkling champagne, laughing, wind in their hair, stainless-steel bow
railings visible, turquoise sea and green coastal hills in the background, bright
sunny day, luxury lifestyle commercial, slow dolly-in camera move, photorealistic
```

### C. Открытие шампанского (крупный план)
```
Close-up slow-motion shot on the flybridge of [YACHT]: hands popping a champagne
bottle, cork flying, golden champagne spray sparkling in the sunlight, elegant crystal
glasses ready, beige bimini canopy above, blurred sea horizon in background, luxury
celebration, cinematic lighting, ultra slow motion 120fps look
```

### D. Прыжок в воду (slow-mo)
```
Slow-motion cinematic shot: a beautiful athletic young woman in an elegant swimsuit
jumping joyfully from the stern swim platform of [YACHT] into crystal-clear turquoise
water, splash frozen in golden sunlight, stainless swim ladder visible, friends
cheering on deck, azure bay with green cliffs behind, luxury summer vacation vibes,
photorealistic, 120fps slow motion
```

### E. Купание у яхты
```
Cinematic shot at water level: happy people swimming in transparent turquoise water
next to [YACHT] anchored in a quiet azure bay with lush green hills, sun sparkles
on gentle ripples, someone climbing the stern stainless ladder, carefree summer
atmosphere, warm afternoon light, photorealistic luxury travel commercial
```

### F. Закатный проход
```
Wide cinematic shot: [YACHT] cruising slowly across a dramatic golden-orange sunset,
sun touching the horizon, dark silhouette of the yacht with warm cabin lights glowing,
golden light path reflecting on calm sea, romantic mood, anamorphic lens flare,
luxury commercial cinematography
```

### G. Романтический ужин на корме
```
Cinematic shot on the aft deck of [YACHT] at sunset: an elegant couple having a
romantic dinner at a beautifully set table with white tablecloth, candles in glass
holders, fresh seafood and fruit, glasses of white wine, warm string lights, the
woman in an evening dress, pastel pink-orange sunset sky and calm sea behind them,
soft warm cinematic light, shallow depth of field, luxury lifestyle commercial
```

### H. Тост на фоне заката
```
Close-up cinematic slow-motion: two champagne glasses clinking in a toast against a
blazing orange sunset over the sea, on board [YACHT], bokeh sparkles, silhouettes of
a happy couple laughing softly out of focus, romantic luxurious atmosphere, golden
hour backlight, 96fps slow motion
```

---

## Практические советы

- **Veo 3** (flow.google / Gemini): даёт лучший фотореализм воды и людей, умеет звук.
  Генерируйте 8-секундные клипы, режьте до 5–6 с.
- **Kling 2.x**: лучший image-to-video — скормите IMG_6832 как первый кадр для сцен D/E,
  IMG_6854 для сцены A.
- **Runway Gen-4**: удобен для стилизации и продления клипов (extend).
- Одна сцена — один промпт; не смешивайте «прыжок + ужин» в одном клипе.
- Генерируйте по 3–4 варианта каждой сцены и выбирайте лучший дубль.
- Для соцсетей соберите вертикальную версию 9:16: те же клипы, кроп по центру.
- Музыка: спокойный chill-house / lounge ~100 BPM (в готовом ролике — нейтральный
  эмбиент «море», замените лицензированным треком перед публикацией в соцсети).

## Пересборка готового ролика

```bash
# поменяйте тексты титров в build-video.sh (блок printf ... > txt/*.txt) и запустите:
bash promo/build-video.sh
```
