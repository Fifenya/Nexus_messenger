import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ChevronDown, MessageCircle, Bot, Shield, Smile, Palette, FileText, Users, HelpCircle, Zap } from 'lucide-react';
import BottomNav from '../components/BottomNav';

type Section = {
  id: string;
  icon: any;
  title: string;
  content: React.ReactNode;
};

export default function SupportPage() {
  const navigate = useNavigate();
  const [open, setOpen] = useState<string | null>('about');

  const sections: Section[] = [
    {
      id: 'about',
      icon: Zap,
      title: 'О Nexus',
      content: (
        <div className="space-y-3 text-sm">
          <p><strong>Nexus</strong> — это защищённый мессенджер с фокусом на приватность, кастомизацию и расширяемость.</p>
          <p>Основные возможности:</p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li>Личные и групповые чаты</li>
            <li>Создание собственных ботов с API</li>
            <li>Гибкие настройки приватности</li>
            <li>Nexus Motes — уникальные реакции и эмоции</li>
            <li>Кастомные темы оформления</li>
            <li>Обмен файлами, медиа, голосовыми</li>
          </ul>
        </div>
      ),
    },
    {
      id: 'chats',
      icon: MessageCircle,
      title: 'Чаты',
      content: (
        <div className="space-y-3 text-sm">
          <p><strong>Личные чаты</strong> — общение один на один. Найди собеседника через поиск по @username.</p>
          <p><strong>Групповые чаты</strong> — создай группу, добавь участников, настрой аватарку и описание.</p>
          <p className="font-semibold">Функции чатов:</p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li>Отправка текста, фото, видео, файлов</li>
            <li>Голосовые сообщения</li>
            <li>Ответы на сообщения (reply)</li>
            <li>Редактирование и удаление</li>
            <li>Реакции (Nexus Motes)</li>
            <li>Индикатор "печатает…"</li>
            <li>Профиль группы с медиа-архивом</li>
          </ul>
        </div>
      ),
    },
    {
      id: 'bots',
      icon: Bot,
      title: 'Боты',
      content: (
        <div className="space-y-3 text-sm">
          <p><strong>Создание бота:</strong> Настройки → Боты → Создать. Пройди диалог с BotFather: укажи имя и username (обязательно с <code className="text-xs bg-black/20 px-1 rounded">bot</code> на конце).</p>
          <p><strong>API ID:</strong> после создания получишь уникальный ID вида <code className="text-xs bg-black/20 px-1 rounded">nb_123456789</code>.</p>
          <p className="font-semibold">API эндпоинты:</p>
          <div className="bg-black/20 rounded-lg p-3 font-mono text-xs space-y-2">
            <div>GET /botapi/[ID]/me</div>
            <div>GET /botapi/[ID]/chats</div>
            <div>GET /botapi/[ID]/updates</div>
            <div>POST /botapi/[ID]/send</div>
          </div>
          <p>Добавь бота в чат через поиск <code className="text-xs bg-black/20 px-1 rounded">@username</code>, и он сможет получать и отправлять сообщения.</p>
        </div>
      ),
    },
    {
      id: 'privacy',
      icon: Shield,
      title: 'Приватность',
      content: (
        <div className="space-y-3 text-sm">
          <p className="font-semibold">Видимость в поиске:</p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li><strong>Точное совпадение</strong> — находишься только по точному @username</li>
            <li><strong>Начинается с</strong> — находишься если вводить начало ника</li>
            <li><strong>Содержит</strong> — находишься если ник содержит запрос</li>
            <li><strong>Везде</strong> — поиск по нику и имени</li>
          </ul>
          <p className="font-semibold mt-3">Кто видит (Все / Контакты / Никто):</p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li><strong>Онлайн-статус</strong> — точка "в сети"</li>
            <li><strong>Последний визит</strong> — точное время</li>
            <li><strong>Аватарка</strong> — фото профиля</li>
            <li><strong>Профиль</strong> — "о себе" и описание</li>
          </ul>
        </div>
      ),
    },
    {
      id: 'motes',
      icon: Smile,
      title: 'Nexus Motes',
      content: (
        <div className="space-y-3 text-sm">
          <p><strong>Nexus Motes</strong> — это кастомные реакции и эмоции для сообщений.</p>
          <p>В чате зажми сообщение → выбери эмодзи → появится реакция. Тапни на реакцию ещё раз — снимешь свою.</p>
          <p>В профиле можно добавить свои Motes (картинки или эмодзи) и использовать их как реакции.</p>
        </div>
      ),
    },
    {
      id: 'themes',
      icon: Palette,
      title: 'Темы',
      content: (
        <div className="space-y-3 text-sm">
          <p>Настройки → Темы — выбери цветовую схему приложения.</p>
          <p>Доступны предустановленные темы и возможность создать свою.</p>
          <p>Темы меняют цвета фона, поверхностей, акцентов и текста.</p>
        </div>
      ),
    },
    {
      id: 'files',
      icon: FileText,
      title: 'Файлы и медиа',
      content: (
        <div className="space-y-3 text-sm">
          <p>В чате тапни скрепку 📎 — выбери файл, фото или видео.</p>
          <p><strong>Предпросмотр:</strong> после выбора файла над полем ввода появится карточка с иконкой, именем и размером. Можно добавить подпись текстом.</p>
          <p><strong>В профиле группы</strong> весь медиа-контент категоризирован: фото, видео, файлы, музыка, голосовые, GIF, ссылки.</p>
        </div>
      ),
    },
    {
      id: 'profiles',
      icon: Users,
      title: 'Профили',
      content: (
        <div className="space-y-3 text-sm">
          <p><strong>Профиль группы:</strong> тапни на название в шапке чата → откроется профиль с табами: Участники, Медиа, Видео, Файлы, Музыка, Голосовые, GIF, Ссылки.</p>
          <p><strong>Профиль пользователя:</strong> тапни на аватарку собеседника в чате → увидишь инфо, общие чаты, кнопки действий.</p>
        </div>
      ),
    },
    {
      id: 'faq',
      icon: HelpCircle,
      title: 'Частые вопросы',
      content: (
        <div className="space-y-3 text-sm">
          <p className="font-semibold">Не могу найти пользователя в поиске</p>
          <p className="ml-2">Возможно, у него в настройках приватности стоит "Точное совпадение" — попробуй ввести полный @username.</p>
          <p className="font-semibold mt-3">Бот не отвечает</p>
          <p className="ml-2">Проверь, что бот добавлен в чат. Внешний скрипт должен опрашивать /botapi/[ID]/updates и отвечать через /send.</p>
          <p className="font-semibold mt-3">Не видно онлайн-статус</p>
          <p className="ml-2">Собеседник скрыл статус в настройках приватности. Вместо "в сети" будет "был(а) недавно".</p>
          <p className="font-semibold mt-3">Как удалить сообщение?</p>
          <p className="ml-2">Зажми сообщение → "Удалить". Удалить можно только свои сообщения.</p>
        </div>
      ),
    },
  ];

  const card: React.CSSProperties = { background: 'var(--color-surface)', borderColor: 'var(--color-border)' };
  const muted: React.CSSProperties = { color: 'var(--color-text-muted)' };

  return (
    <div className="h-[100dvh] overflow-y-auto chat-wallpaper pb-24">
      <header className="px-4 pt-4 pb-2 flex items-center gap-3">
        <button className="icon-btn" onClick={() => navigate('/settings')}><ArrowLeft size={20} /></button>
        <div className="text-xl font-extrabold">Nexus Support</div>
      </header>

      <div className="max-w-2xl mx-auto p-3 space-y-3">
        {sections.map(sec => {
          const Icon = sec.icon;
          const isOpen = open === sec.id;
          return (
            <div key={sec.id} className="rounded-2xl border overflow-hidden" style={card}>
              <button
                onClick={() => setOpen(isOpen ? null : sec.id)}
                className="w-full flex items-center gap-3 p-4 text-left"
              >
                <Icon size={20} style={{ color: 'var(--color-accent)' }} />
                <span className="flex-1 font-semibold">{sec.title}</span>
                <ChevronDown
                  size={18}
                  style={{
                    color: 'var(--color-text-muted)',
                    transform: isOpen ? 'rotate(180deg)' : 'rotate(0)',
                    transition: 'transform 0.2s',
                  }}
                />
              </button>
              {isOpen && (
                <div className="px-4 pb-4">
                  {sec.content}
                </div>
              )}
            </div>
          );
        })}

        <div className="text-center pt-4" style={muted}>
          <p className="text-xs">Nexus Messenger v1.0</p>
          <p className="text-xs mt-1">Сделано с ❤️ для приватного общения</p>
        </div>
      </div>
      <BottomNav />
    </div>
  );
}
