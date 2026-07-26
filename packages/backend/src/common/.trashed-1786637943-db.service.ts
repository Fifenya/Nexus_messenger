import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import initSqlJs, { Database, SqlJsStatic } from 'sql.js';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class DbService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(DbService.name);
  private db: Database;
  private SQL: SqlJsStatic;
  private dbPath: string;

  async onModuleInit() {
    // Загружаем SQL.js
    this.SQL = await initSqlJs({
      locateFile: () => '/node_modules/sql.js/dist/sql-wasm.wasm'
    });

    this.dbPath = path.join(process.cwd(), 'prisma/dev.db');
    
    // Проверяем существование БД
    let dbData: Uint8Array | null = null;
    if (fs.existsSync(this.dbPath)) {
      dbData = new Uint8Array(fs.readFileSync(this.dbPath));
      this.logger.log('📂 Загружена существующая БД');
    } else {
      this.logger.log('📄 Создана новая БД');
    }

    // Создаём экземпляр БД
    this.db = new this.SQL.Database(dbData);
    
    // Проверяем структуру
    this.ensureTables();
    
    this.logger.log('✅ SQLite (sql.js) подключена');
  }

  private ensureTables() {
    // Проверяем, есть ли таблицы
    const tables = this.db.exec("SELECT name FROM sqlite_master WHERE type='table' AND name='users'");
    
    if (tables.length === 0) {
      this.logger.log('📄 Создаём таблицы...');
      this.db.run(`
        CREATE TABLE IF NOT EXISTS users (
          id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
          phone TEXT UNIQUE NOT NULL,
          username TEXT UNIQUE NOT NULL,
          publicKey TEXT NOT NULL,
          displayName TEXT,
          avatarUrl TEXT,
          password TEXT,
          createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
          updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS chats (
          id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
          type TEXT DEFAULT 'PRIVATE',
          title TEXT,
          avatarUrl TEXT,
          createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
          updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS chat_members (
          id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
          userId TEXT NOT NULL,
          chatId TEXT NOT NULL,
          role TEXT DEFAULT 'MEMBER',
          joinedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (userId) REFERENCES users(id),
          FOREIGN KEY (chatId) REFERENCES chats(id),
          UNIQUE(userId, chatId)
        );

        CREATE TABLE IF NOT EXISTS messages (
          id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
          chatId TEXT NOT NULL,
          senderId TEXT NOT NULL,
          text TEXT,
          replyToId TEXT,
          editedAt DATETIME,
          deletedAt DATETIME,
          deleteTimer INTEGER,
          isDeleted INTEGER DEFAULT 0,
          createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
          updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (chatId) REFERENCES chats(id),
          FOREIGN KEY (senderId) REFERENCES users(id)
        );

        CREATE TABLE IF NOT EXISTS message_attachments (
          id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
          messageId TEXT NOT NULL,
          type TEXT NOT NULL,
          url TEXT NOT NULL,
          size INTEGER,
          mimeType TEXT,
          createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (messageId) REFERENCES messages(id)
        );

        CREATE TABLE IF NOT EXISTS message_reactions (
          id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
          messageId TEXT NOT NULL,
          userId TEXT NOT NULL,
          emoji TEXT NOT NULL,
          createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (messageId) REFERENCES messages(id),
          FOREIGN KEY (userId) REFERENCES users(id),
          UNIQUE(messageId, userId, emoji)
        );

        CREATE TABLE IF NOT EXISTS nexus_motes (
          id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
          name TEXT NOT NULL,
          url TEXT NOT NULL,
          tags TEXT,
          width INTEGER,
          height INTEGER,
          ownerId TEXT UNIQUE NOT NULL,
          createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
          updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (ownerId) REFERENCES users(id)
        );

        CREATE TABLE IF NOT EXISTS bots (
          id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
          token TEXT UNIQUE NOT NULL,
          name TEXT NOT NULL,
          username TEXT UNIQUE NOT NULL,
          description TEXT,
          avatarUrl TEXT,
          ownerId TEXT NOT NULL,
          webhookUrl TEXT,
          createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
          updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (ownerId) REFERENCES users(id)
        );

        CREATE TABLE IF NOT EXISTS invite_links (
          id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
          code TEXT UNIQUE NOT NULL,
          chatId TEXT NOT NULL,
          creatorId TEXT NOT NULL,
          uses INTEGER DEFAULT 0,
          maxUses INTEGER,
          expiresAt DATETIME,
          createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
          updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (chatId) REFERENCES chats(id),
          FOREIGN KEY (creatorId) REFERENCES users(id)
        );

        CREATE TABLE IF NOT EXISTS privacy_settings (
          id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
          userId TEXT NOT NULL,
          field TEXT NOT NULL,
          value TEXT NOT NULL,
          createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
          updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (userId) REFERENCES users(id),
          UNIQUE(userId, field)
        );

        CREATE INDEX IF NOT EXISTS idx_messages_chatId_createdAt ON messages(chatId, createdAt);
      `);
      this.logger.log('✅ Таблицы созданы');
    }
  }

  onModuleDestroy() {
    // Сохраняем БД в файл
    const data = this.db.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(this.dbPath, buffer);
    this.logger.log('💾 БД сохранена');
    
    this.db.close();
    this.logger.log('✅ SQLite отключена');
  }

  // Для SELECT запросов (возвращает массив объектов)
  query(sql: string, params: any[] = []): any[] {
    const stmt = this.db.prepare(sql);
    const result = stmt.getAsObject(params);
    stmt.free();
    return result ? [result] : [];
  }

  // Для SELECT с несколькими строками
  queryAll(sql: string, params: any[] = []): any[] {
    const stmt = this.db.prepare(sql);
    const results: any[] = [];
    while (stmt.step()) {
      results.push(stmt.getAsObject());
    }
    stmt.free();
    return results;
  }

  // Для SELECT одного (возвращает первый объект)
  getFirst(sql: string, params: any[] = []): any {
    const results = this.queryAll(sql, params);
    return results.length > 0 ? results[0] : null;
  }

  // Для INSERT, UPDATE, DELETE (возвращает результат)
  run(sql: string, params: any[] = []): any {
    const stmt = this.db.prepare(sql);
    const result = stmt.run(params);
    stmt.free();
    return result;
  }

  // Для транзакций
  transaction(callback: () => void) {
    this.db.run('BEGIN TRANSACTION');
    try {
      callback();
      this.db.run('COMMIT');
    } catch (error) {
      this.db.run('ROLLBACK');
      throw error;
    }
  }
}
# Устанавливаем better-sqlite3
