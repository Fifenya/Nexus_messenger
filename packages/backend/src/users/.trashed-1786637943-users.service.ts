import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { DbService } from '../common/db.service';

@Injectable()
export class UsersService {
  constructor(private db: DbService) {}

  async create(data: any) {
    // Проверяем существование пользователя
    const existing = await this.db.getFirst(
      'SELECT * FROM users WHERE phone = ? OR username = ?',
      [data.phone, data.username]
    );
    
    if (existing) {
      throw new ConflictException('User with this phone or username already exists');
    }

    // Создаём пользователя
    const result = await this.db.run(
      `INSERT INTO users (phone, username, publicKey, displayName, password)
       VALUES (?, ?, ?, ?, ?)`,
      [data.phone, data.username, data.publicKey || '', data.displayName || null, data.password]
    );

    // Получаем созданного пользователя
    return this.findById(result.lastID.toString());
  }

  async findById(id: string) {
    const user = await this.db.getFirst(
      'SELECT * FROM users WHERE id = ?',
      [id]
    );
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  async findByPhone(phone: string) {
    return this.db.getFirst(
      'SELECT * FROM users WHERE phone = ?',
      [phone]
    );
  }

  async findByUsername(username: string) {
    return this.db.getFirst(
      'SELECT * FROM users WHERE username = ?',
      [username]
    );
  }

  async update(id: string, data: any) {
    const fields = [];
    const values = [];
    
    if (data.displayName) {
      fields.push('displayName = ?');
      values.push(data.displayName);
    }
    if (data.avatarUrl) {
      fields.push('avatarUrl = ?');
      values.push(data.avatarUrl);
    }
    if (data.username) {
      fields.push('username = ?');
      values.push(data.username);
    }
    
    values.push(id);
    
    await this.db.run(
      `UPDATE users SET ${fields.join(', ')}, updatedAt = CURRENT_TIMESTAMP WHERE id = ?`,
      values
    );
    
    return this.findById(id);
  }

  async search(query: string) {
    return this.db.query(
      `SELECT * FROM users 
       WHERE username LIKE ? OR displayName LIKE ?
       LIMIT 10`,
      [`%${query}%`, `%${query}%`]
    );
  }
}
