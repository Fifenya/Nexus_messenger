# 1. Берём самый свежий URL из логов
NEW_URL=$(journalctl -u nexus-tunnel --no-pager | grep -oE "https://[a-zA-Z0-9-]+\.trycloudflare\.com" | tail -1)
echo "Актуальный туннель: $NEW_URL"

# 2. Проверка что он реально отвечает
curl -sI "$NEW_URL" | head -3

# 3. Записываем в .nexus_tunnel (для баннера nexus-banner)
echo "$NEW_URL" > ~/.nexus_tunnel

# 4. Восстанавливаем nexus-redirect (клон с GitHub)
if [ ! -d ~/nexus-redirect ]; then
    echo "→ Клонирую nexus-redirect..."
    cd ~
    git clone https://github.com/Fifenya/nexus-redirect.git
fi

# 5. Ищем url.txt и обновляем
URL_FILE=$(find ~/nexus-redirect -name "url.txt" -o -name "url.txt" 2>/dev/null | head -1)
if [ -z "$URL_FILE" ]; then
    # Если url.txt вообще нет — создаём структуру GitHub Pages
    echo "→ Создаю структуру GitHub Pages..."
    mkdir -p ~/nexus-redirect/docs
    URL_FILE=~/nexus-redirect/docs/url.txt
    
    # index.html с редиректом (чтобы работало и в браузере)
    cat > ~/nexus-redirect/docs/index.html <<HTML
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Nexus Messenger</title>
    <meta http-equiv="refresh" content="0;url=$NEW_URL">
    <script>window.location="$NEW_URL"</script>
</head>
<body>Redirecting to <a href="$NEW_URL">Nexus</a>...</body>
</html>
HTML
fi

echo "$NEW_URL" > "$URL_FILE"
echo "Записано в: $URL_FILE"
cat "$URL_FILE"

# 6. Коммит и пуш в nexus-redirect
cd ~/nexus-redirect
git add -A
git diff --staged --quiet && echo "Нечего коммитить (URL не изменился)" || {
    git commit -m "auto: tunnel url update ($NEW_URL)"
    git push && echo "✅ Запушено в GitHub" || echo "❌ Пуш упал — нужен токен"
}

# 7. Проверка финального состояния
echo ""
echo "=== Итог ==="
echo "Туннель: $NEW_URL"
echo "URL в GitHub Pages: https://fifenya.github.io/nexus-redirect/url.txt"
sleep 2
curl -s "https://fifenya.github.io/nexus-redirect/url.txt" 2>/dev/null || echo "⏳ GitHub Pages ещё не обновился (ждёт до 5 мин)"
