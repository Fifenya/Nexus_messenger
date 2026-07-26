#!/bin/bash

echo "🚀 Установка Nexus Mobile на Termux..."

# Обновление пакетов
pkg update && pkg upgrade -y

# Установка зависимостей
pkg install -y nodejs-lts
pkg install -y openssl-tool
pkg install -y git
pkg install -y python
pkg install -y make
pkg install -y gcc

# Установка PM2
npm install -g pm2

# Установка зависимостей проекта
npm run install:all

# Генерация Prisma клиента
cd packages/backend
npx prisma generate

# Создание базы данных
npx prisma db push

# Сборка бекенда
npm run build

# Возврат в корень
cd ../..

# Запуск через PM2
pm2 start ecosystem.config.js
pm2 save
pm2 startup

echo "✅ Nexus Mobile установлен!"
echo "📱 Сервер запущен на http://localhost:3000"
echo "🔧 Для просмотра логов: pm2 logs"
echo "🌐 Веб-интерфейс: http://localhost:3000"
echo "📱 Android клиент: собери APK в папке client"