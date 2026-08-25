#!/usr/bin/env python3
import json, os, random, sys, time, urllib.request, urllib.parse

MODE = 'friends' if len(sys.argv) > 1 and sys.argv[1] == 'friends' else 'tech'
TOKEN = open(os.path.expanduser('~/.tg_token' + ('_friends' if MODE == 'friends' else ''))).read().strip()
CHAT_FILE = os.path.expanduser('~/.tg_chat_id' + ('_friends' if MODE == 'friends' else ''))
STATS = os.path.expanduser('~/.nexus_stats.json')
MSG_FILE = os.path.expanduser('~/.tg_msg_id' + ('_friends' if MODE == 'friends' else ''))
TUN_FILE = os.path.expanduser('~/.nexus_tunnel')
LAN = 'http://172.25.209.126:5173'

PHRASES = ['полёт нормальный 🚀', 'сервер мурчит как кот 🐈', 'всё стабильно, идите общайтесь ☕',
           'держусь и люблю вас ❤️', 'тихо и спокойно 🌙', 'работаем, братцы 🔧', 'ни одного краша, рекорд! 🏆']

def tg(method, payload):
    url = f'https://api.telegram.org/bot{TOKEN}/{method}'
    try:
        with urllib.request.urlopen(urllib.request.Request(url, data=urllib.parse.urlencode(payload).encode()), timeout=15) as r:
            return json.load(r)
    except urllib.error.HTTPError as e:
        try: return json.load(e)
        except Exception: return None
    except Exception as e:
        print('tg:', e); return None

def bar(p):
    n = max(0, min(10, round(p / 10))); return '▰' * n + '▱' * (10 - n)
def dot(ok): return '🟢' if ok else '🔴'

def fetch(url):
    try:
        with urllib.request.urlopen(url, timeout=8) as r:
            return json.load(r)
    except Exception:
        return None

def load():
    cands = []
    try: cands.append(json.load(open(STATS)))
    except Exception: pass
    cands.append(fetch(LAN + '/stats.json'))
    try: tun = open(TUN_FILE).read().strip()
    except Exception: tun = ''
    if tun: cands.append(fetch(tun + '/stats.json'))
    for d in cands:
        if d and d.get('ts') and time.time() - d['ts'] < 90:
            if d.get('tunnel_url'):
                open(TUN_FILE, 'w').write(d['tunnel_url'])
            return d
    return None

def build():
    d = load()
    if not d:
        if MODE == 'friends':
            return f'🥱 <b>Сервер спит</b>\n🕐 {time.strftime("%d.%m %H:%M")}\n\n«ноут уснул — пакет данных не приходит… разбудите его!»'
        return f'🔴 <b>Сервер недоступен</b>\n🕐 {time.strftime("%d.%m %H:%M:%S")}\n\nПакет статистики не приходит больше 90 секунд.'
    if MODE == 'friends':
        mood = '😌' if d['cpu'] < 50 and d['ram_pct'] < 70 else '😅' if d['cpu'] < 80 else '🥵'
        L = [f'{mood} <b>Сервер на связи</b>', '🕐 ' + time.strftime('%d.%m %H:%M'), '']
        L.append(f'⚙️ Нагрузка <code>{bar(d["cpu"])}</code> {d["cpu"]:.0f}%')
        L.append(f'🧠 Память <code>{bar(d["ram_pct"])}</code> {d["ram_pct"]:.0f}%')
        L.append(f'💽 Место <code>{bar(d["disk"])}</code> {d["disk"]:.0f}%')
        L.append(f'⏳ Аптайм: {d["uptime"] or "—"}')
        L.append('')
        L.append(f'💬 Сегодня наобщались: <b>{d["msgs"]}</b> сооб.')
        L.append(f'👥 Сейчас в сети: <b>{d["onl"]}</b>')
        L.append('')
        L.append(f'«{random.choice(PHRASES)}»')
        return '\n'.join(L)
    L = ['🛰 <b>NEXUS MONITOR</b> · live', '🕐 ' + time.strftime('%d.%m %H:%M:%S'), '']
    L.append(f'⚙️ CPU  <code>{bar(d["cpu"])}</code> {d["cpu"]:.0f}%')
    L.append(f'🧠 RAM  <code>{bar(d["ram_pct"])}</code> {d["ram_pct"]:.0f}% · {d["ram_used"]:.1f}/{d["ram_tot"]:.1f} ГБ')
    L.append(f'💽 Disk <code>{bar(d["disk"])}</code> {d["disk"]:.0f}%')
    L.append('')
    for key in ('backend', 'frontend'):
        s = d[key]
        L.append(f'{dot(s["state"] == "active")} nexus-{key} · {s["state"]}' + (f' · {s["ms"]} мс' if s["ms"] is not None else ' · не отвечает'))
    L.append(f'{dot(bool(d["postgres"]))} nexus-postgres · {d["postgres"] or "down"}')
    L.append(f'{dot(d["tunnel"])} cloudflared · {"up" if d["tunnel"] else "down"}')
    L.append('')
    L.append(f'💬 Сообщений сегодня: <b>{d["msgs"]}</b>')
    L.append(f'👥 Сейчас онлайн: <b>{d["onl"]}</b>')
    return '\n'.join(L)

def get_chat():
    if os.path.exists(CHAT_FILE): return open(CHAT_FILE).read().strip()
    print('Жду любое сообщение в группе…')
    while True:
        r = tg('getUpdates', {'timeout': 30})
        if r and r.get('result'):
            for u in r['result']:
                chat = u.get('message', {}).get('chat')
                if chat and chat.get('type') in ('group', 'supergroup'):
                    open(CHAT_FILE, 'w').write(str(chat['id'])); return str(chat['id'])
        time.sleep(2)

def get_msg_id():
    try: return int(open(MSG_FILE).read().strip())
    except Exception: return None

def save_msg_id(mid):
    open(MSG_FILE, 'w').write(str(mid))

def main():
    chat = get_chat()
    msg_id = get_msg_id()
    while True:
        text = build()
        if msg_id:
            r = tg('editMessageText', {'chat_id': chat, 'message_id': msg_id, 'text': text, 'parse_mode': 'HTML', 'disable_web_page_preview': 'true'})
            ok = bool(r and r.get('ok'))
            if not ok and r and 'not modified' in str(r.get('description', '')): ok = True
            if not ok and r and 'Too Many' in str(r.get('description', '')):
                time.sleep(5); continue
            if not ok: msg_id = None
        if not msg_id:
            r = tg('sendMessage', {'chat_id': chat, 'text': text, 'parse_mode': 'HTML', 'disable_web_page_preview': 'true'})
            if r and r.get('ok'):
                msg_id = r['result']['message_id']
                save_msg_id(msg_id)
        time.sleep(10)

if __name__ == '__main__':
    main()
