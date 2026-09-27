import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';

interface ResetRequest {
  code: string;
  expiresAt: number;
  userId: string;
}

@Injectable()
export class PasswordResetService {
  private requests = new Map<string, ResetRequest>();

  constructor(private readonly prisma: PrismaService) {}

  private genCode(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  /** Какое поле хранит хеш пароля у User */
  private passField(u: any): string | null {
    if ('password' in u) return 'password';
    if ('passwordHash' in u) return 'passwordHash';
    return null;
  }

  async forgot(username: string, lastPassword: string) {
    const user = await this.prisma.user.findUnique({ where: { username } });
    if (!user) throw new NotFoundException('Пользователь не найден');

    // антиспам: повторный запрос не чаще раза в 10 минут
    const existing = this.requests.get(username);
    if (existing && existing.expiresAt - Date.now() > 5 * 60_000) {
      return { ok: true, message: 'Код уже отправлен администратору. Дождитесь ответа.' };
    }

    const code = this.genCode();
    this.requests.set(username, {
      code,
      expiresAt: Date.now() + 15 * 60_000,
      userId: user.id,
    });

    // ищем Моты-чат администратора
    const adminName = process.env.RESET_ADMIN_USERNAME || 'Fifenya';
    const admin = await this.prisma.user.findUnique({ where: { username: adminName } });
    let chatId: string | null = null;
    if (admin) {
      const motes = await this.prisma.chat.findMany({ where: { type: 'MOTES' } });
      for (const c of motes) {
        const m = await this.prisma.chatMember.findFirst({
          where: { chatId: c.id, userId: admin.id },
        });
        if (m) { chatId = c.id; break; }
      }
    }

    const field = this.passField(user);
    let lastMatches = false;
    if (field && lastPassword) {
      try { lastMatches = await bcrypt.compare(lastPassword, user[field]); } catch {}
    }

    const text =
      `🔑 Запрос смены пароля\n` +
      `Пользователь: @${username}\n` +
      `Указанный последний пароль: ${lastPassword ? (lastMatches ? 'совпадает ✓' : 'НЕ совпадает ⚠️') : 'не указан'}\n` +
      `Код: ${code}\n` +
      `Действует 15 минут. Передавай код только если уверен, что это действительно он.`;

    if (chatId && admin) {
      await this.prisma.message.create({ data: { chatId, senderId: admin.id, text } });
    } else {
      console.warn('[password-reset] MOTES-чат не найден, код в консоли:', code);
    }

    return { ok: true, message: 'Запрос отправлен администратору. Код придёт ему в Моты.' };
  }

  async reset(username: string, code: string, newPassword: string) {
    const req = this.requests.get(username);
    if (!req || req.expiresAt < Date.now()) {
      throw new BadRequestException('Код истёк или не существует. Запросите новый.');
    }
    if (req.code !== code.trim()) {
      throw new BadRequestException('Неверный код');
    }
    if (!newPassword || newPassword.length < 6) {
      throw new BadRequestException('Пароль должен быть не короче 6 символов');
    }

    const user = await this.prisma.user.findUnique({ where: { username } });
    if (!user) throw new NotFoundException('Пользователь не найден');
    const field = this.passField(user);
    if (!field) throw new BadRequestException('Не найдено поле пароля');

    const hash = await bcrypt.hash(newPassword, 10);
    await this.prisma.user.update({ where: { username }, data: { [field]: hash } });
    this.requests.delete(username);
    return { ok: true, message: 'Пароль изменён. Теперь можно войти.' };
  }
}
