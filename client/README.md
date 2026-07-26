# Nexus mobile client (React Native)

## Что сделано
- Настоящая точка входа: `index.js` -> `App.tsx` (навигатор), старая заглушка `App.js` удалена.
- `src/store/auth.store.ts` — регистрация/вход/выход через `zustand`, токен хранится в `AsyncStorage`.
- `src/store/chat.store.ts` — список чатов, история сообщений, реалтайм через сокет (новые/изменённые/удалённые сообщения, реакции, typing).
- `src/services/api.service.ts` — axios с авто-подстановкой JWT из `AsyncStorage`.
- `src/services/socket.service.ts` — обёртка над socket.io-client, события совпадают с backend-шлюзом.
- `src/theme.ts` — цвета/отступы/радиусы, используемые всеми экранами.
- Экраны `RegisterScreen`, `SettingsScreen`, `ProfileScreen`, `CreateChatScreen` дописаны с нуля — раньше их не было, хотя навигатор на них ссылался.
- Backend: добавлено сокет-событие `message:react` с realtime-рассылкой реакций (раньше реакции работали только через REST без обновления в реальном времени).

## Настройка (у меня нет доступа в сеть в этой песочнице — не устанавливал и не собирал)
```bash
cd client
npm install
# Android:
npm run android
# iOS (нужен Mac + Xcode):
npx pod-install ios
npx react-native run-ios
```

`src/config.ts` указывает на `10.0.2.2:3000` для Android-эмулятора (алиас localhost хост-машины)
и `localhost:3000` для iOS-симулятора. **Для реального телефона** замените на IP вашего компьютера
в локальной сети (`ipconfig`/`ifconfig`), иначе приложение не достучится до backend.

## Сборка APK прямо в Termux (без ПК)
В папке лежат два готовых скрипта:

```bash
# В обычном Termux (не в Ubuntu):
bash termux-setup.sh      # ставит proot-distro Ubuntu + JDK 17 + Node 20 + Android SDK
                           # займёт 20-40 минут, зависит от интернета/телефона

# Дальше внутри Ubuntu:
proot-distro login ubuntu
cd ~ && cp -r /путь/до/Nexus/client ./nexus-client && cd nexus-client
bash build-apk.sh         # npm install + сборка release APK
```

Готовый файл появится в `android/app/build/outputs/apk/release/app-release.apk`.
Подписан debug-ключом (уже лежит в `android/app/debug.keystore`) — этого достаточно,
чтобы установить APK на свой телефон, но **не годится для публикации в Play Store**
(там нужен отдельный release-ключ).

Если на каком-то шаге не хватит RAM (2GB на слабом железе может не хватить Gradle) —
попробуйте `./gradlew assembleRelease --no-daemon -Dorg.gradle.jvmargs="-Xmx1536m"` вручную.

## Сборка APK на ПК/сервере (когда доберётесь)
```bash
npm run bundle
npm run build:apk
# файл появится в android/app/build/outputs/apk/release/
```

## iOS / .ipa — важно
**В архиве вообще нет папки `ios/`** — только `android/`. Это значит iOS-сборка сейчас
невозможна не только из-за отсутствия Mac, а потому что нативного Xcode-проекта попросту
не существует. Чтобы получить iOS-приложение, нужно на Mac сгенерировать его заново:
```bash
npx react-native init NexusTemp --version 0.73.0   # временный проект той же версии
# скопировать сгенерированную папку ios/ в client/ios/
cd client/ios && pod install
```
После этого можно открыть `ios/*.xcworkspace` в Xcode и собирать/архивировать оттуда.
Это отдельная, не самая тривиальная задача — дайте знать, если хотите, чтобы я прошёл её
шаг за шагом вместе с вами (потребуется Mac на вашей стороне, у меня его нет).

## Что сделано (2-й проход: медиа, голос, push, reply/edit/delete)
- **Reply**: долгое нажатие на сообщение → "Ответить", в бабле показывается цитата.
- **Edit/Delete**: долгое нажатие на своё сообщение → "Редактировать"/"Удалить" (backend уже поддерживал, теперь есть UI).
- **Фото/видео**: кнопка 📎 → камера или галерея, файл грузится на `/uploads`, превью в чате.
- **Голосовые**: удержание кнопки 🎤 = запись, отпустили = отправка.
- **Push**: `src/services/push.service.ts` регистрирует FCM-токен на сервере — но это
  заработает только после нативной настройки Firebase (см. ниже), сама я её сделать не могу.

## Push notifications — нужна ручная нативная настройка
Без этого пуши технически невозможны — тут нет обхода:
1. Создайте проект на https://console.firebase.google.com
2. Добавьте Android-приложение (package name из `android/app/build.gradle`, поле `applicationId`) →
   скачайте `google-services.json` → положите в `client/android/app/`
3. Добавьте `classpath 'com.google.gms:google-services:4.4.0'` в `android/build.gradle` и
   `apply plugin: 'com.google.gms.google-services'` в `android/app/build.gradle`
4. Для iOS: добавьте iOS-приложение в Firebase → скачайте `GoogleService-Info.plist` →
   перетащите в Xcode-проект `ios/`, настройте APNs-ключ в консоли Firebase
5. `npm install` подтянет `@react-native-firebase/app` и `@react-native-firebase/messaging`,
   но без шагов 1-4 `registerForPushNotifications()` просто залогирует предупреждение и не упадёт.

## Новые нативные зависимости — потребуют pod install / rebuild
`react-native-image-picker`, `react-native-audio-recorder-player` и Firebase-модули — все с
нативным кодом. После `npm install` обязательно:
```bash
cd ios && pod-install && cd ..   # iOS
# Android пересоберётся сам при следующем npm run android
```
Также для Android понадобятся разрешения в `android/app/src/main/AndroidManifest.xml`:
`CAMERA`, `RECORD_AUDIO`, `READ_MEDIA_IMAGES`/`READ_MEDIA_VIDEO` (или `READ_EXTERNAL_STORAGE`
для старых версий) — я не могу отредактировать этот файл, так как он не входит в архив.


## Известные ограничения
- Не проверено сборкой (нет сети в этой среде) — возможны мелкие правки при первом запуске.
- Длительность голосового сообщения не всегда точна — библиотека не всегда возвращает
  финальную длительность при остановке записи; используется live-счётчик во время записи.
- `google-services.json`/`GoogleService-Info.plist` для push всё равно нужно добавить вручную —
  это ключи вашего Firebase-проекта, я не могу их сгенерировать.
