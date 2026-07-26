#!/bin/bash
# Nexus — сборка release APK.
# Запускать ВНУТРИ Ubuntu (после `proot-distro login ubuntu`), из папки client/.
#
# Пример полного пути от начала:
#   (Termux)      proot-distro login ubuntu
#   (Ubuntu)      cd ~ && cp -r /path/to/Nexus/client ./nexus-client && cd nexus-client
#   (Ubuntu)      bash termux-setup.sh   # если ещё не запускали
#   (Ubuntu)      bash build-apk.sh

set -e

export ANDROID_HOME=/opt/android-sdk
export PATH=$PATH:$ANDROID_HOME/cmdline-tools/latest/bin:$ANDROID_HOME/platform-tools:$ANDROID_HOME/build-tools/34.0.0
export JAVA_HOME=/usr/lib/jvm/java-17-openjdk-arm64

echo "== 1/3: npm install =="
npm install --legacy-peer-deps

echo "== 2/3: сборка JS-бандла и release APK =="
cd android
chmod +x gradlew
./gradlew assembleRelease --no-daemon

echo "== 3/3: Готово! =="
APK_PATH="app/build/outputs/apk/release/app-release.apk"
if [ -f "$APK_PATH" ]; then
  echo "APK собран: android/$APK_PATH"
  echo "Скопируйте его на телефон/в Termux storage:"
  echo "  cp $APK_PATH ~/storage/downloads/nexus.apk   (если делали termux-setup-storage)"
else
  echo "APK не найден — смотрите вывод gradlew выше на предмет ошибок."
fi
