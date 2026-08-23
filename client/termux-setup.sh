#!/data/data/com.termux/files/usr/bin/bash
# Nexus — установка окружения для сборки Android APK прямо в Termux.
#
# Как использовать:
#   1. Установите Termux (F-Droid версия, НЕ из Play Store — та устарела и сломана)
#   2. termux-setup-storage
#   3. Скопируйте этот файл в Termux и запустите: bash termux-setup.sh
#   4. Скрипт займёт 20-40 минут в зависимости от интернета и телефона.
#
# Почему через proot-distro Ubuntu, а не напрямую в Termux:
#   Android SDK build-tools/AAPT2 собраны под glibc, а Termux работает на musl/bionic.
#   Ubuntu внутри proot-distro даёт полноценный glibc-контейнер, где всё это гарантированно
#   работает — это самый надёжный путь, проверенный сообществом Termux.

set -e

echo "== 1/6: Базовые пакеты Termux =="
pkg update -y && pkg upgrade -y
pkg install -y proot-distro git wget

echo "== 2/6: Установка Ubuntu внутри proot-distro =="
proot-distro install ubuntu || echo "Ubuntu уже установлена, пропускаю"

echo "== 3/6: Настройка Ubuntu (JDK, Node, Android SDK) =="
proot-distro login ubuntu -- bash -c '
set -e
apt update && apt upgrade -y
apt install -y openjdk-17-jdk wget unzip git curl

# Node.js 20 LTS
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs

# Android SDK cmdline-tools
mkdir -p /opt/android-sdk/cmdline-tools
cd /opt/android-sdk/cmdline-tools
if [ ! -d "latest" ]; then
  wget -q https://dl.google.com/android/repository/commandlinetools-linux-11076708_latest.zip -O cmdtools.zip
  unzip -q cmdtools.zip
  mv cmdline-tools latest
  rm cmdtools.zip
fi

export ANDROID_HOME=/opt/android-sdk
export PATH=$PATH:$ANDROID_HOME/cmdline-tools/latest/bin:$ANDROID_HOME/platform-tools

yes | sdkmanager --licenses
sdkmanager "platform-tools" "platforms;android-34" "build-tools;34.0.0"

# Persist env vars for future logins
cat >> /root/.bashrc << "EOF"
export ANDROID_HOME=/opt/android-sdk
export PATH=$PATH:$ANDROID_HOME/cmdline-tools/latest/bin:$ANDROID_HOME/platform-tools:$ANDROID_HOME/build-tools/34.0.0
export JAVA_HOME=/usr/lib/jvm/java-17-openjdk-amd64
EOF

echo "Готово. Java: $(java -version 2>&1 | head -1), Node: $(node -v)"
'

echo "== 6/6: Готово! =="
echo "Дальше:"
echo "  1. proot-distro login ubuntu"
echo "  2. Скопируйте папку Nexus/client внутрь (см. build-apk.sh)"
echo "  3. bash build-apk.sh"
