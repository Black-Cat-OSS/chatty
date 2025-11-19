# Chatty Backend Server

Backend сервер на NestJS с поддержкой PostgreSQL, Drizzle ORM, Zod валидации и Socket.io.

## Технологии

- **NestJS** - прогрессивный Node.js фреймворк
- **TypeScript** - типизированный JavaScript
- **PostgreSQL** - реляционная база данных
- **Drizzle ORM** - легковесный ORM
- **Zod** - схема валидации TypeScript-first
- **zod-openapi** - генерация OpenAPI из Zod схем (опционально)
- **Socket.io** - real-time коммуникация

## Быстрый старт

1. **Установите зависимости:**
```bash
pnpm install
```

2. **Настройте базу данных:**
   - Создайте `.env` файл (см. `.env.example`)
   - Настройте `DATABASE_URL`

3. **Примените миграции:**
```bash
pnpm run db:generate
pnpm run db:migrate
```

4. **Запустите сервер:**
```bash
pnpm run start:dev
```

## Подробная документация

См. [SETUP.md](./SETUP.md) для детальной информации о настройке и использовании.

## Docker

Сборка и запуск контейнера:
```bash
# Сборка образа (находясь в корне репозитория)
docker build -f server/Dockerfile -t chatty-server .

# Запуск контейнера
docker run -p 3000:3000 --env-file server/.env chatty-server
```

### Docker Compose (в корне проекта)

```bash
# Запустить только PostgreSQL
docker compose --profile db up -d

# Запустить всё приложение (сервер + PostgreSQL)
docker compose --profile app --profile db up --build

# Остановить и удалить контейнеры
docker compose down
```

## API Documentation

Swagger документация доступна по адресу: **http://localhost:3000/swagger**

В Swagger UI можно:
- Просмотреть все доступные endpoints
- Протестировать API прямо из браузера
- Авторизоваться с помощью API ключа (кнопка "Authorize")

## API Versioning

API использует URI версионирование. Все endpoints доступны по пути `/api/v1/...`

Примеры:
- `GET /api/v1/users` - список пользователей
- `POST /api/v1/rooms` - создание комнаты
- `GET /api/v1/auth/api-keys/:userId` - получение API ключей

## API Endpoints

### App
- `GET /api/v1/` - Приветственное сообщение
- `GET /api/v1/health` - Проверка здоровья сервера
- `GET /api/v1/protected` - Пример защищенного endpoint (требует JWT или API ключ)

### Auth
- `POST /api/v1/auth/login` - Вход с email и password (получить JWT токены)
- `POST /api/v1/auth/refresh` - Обновить access токен используя refresh токен
- `POST /api/v1/auth/logout` - Выход и отзыв refresh токена
- `POST /api/v1/auth/api-keys` - Создать новый API ключ (JWT-based, публичный)
- `GET /api/v1/auth/api-keys/:userId` - Получить все ключи пользователя
- `DELETE /api/v1/auth/api-keys/:id` - Отозвать API ключ
- `DELETE /api/v1/auth/api-keys/:id/delete` - Удалить API ключ

### Users
- `GET /api/v1/users` - Список пользователей
- `POST /api/v1/users` - Создание пользователя
- `GET /api/v1/users/:id` - Получение пользователя
- `PATCH /api/v1/users/:id` - Обновление пользователя
- `DELETE /api/v1/users/:id` - Удаление пользователя

### Rooms
- `GET /api/v1/rooms` - Список всех комнат
- `POST /api/v1/rooms` - Создание комнаты
- `GET /api/v1/rooms/:id` - Получение комнаты по ID

## Socket.io Events

- `message` - Отправка сообщения
- `join-room` - Присоединение к комнате
- `leave-room` - Выход из комнаты

## Аутентификация

API поддерживает две стратегии аутентификации:

### 1. JWT (Access + Refresh Tokens)

**Логин:**
```bash
POST /api/v1/auth/login
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Ответ:**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": { "id": "...", "email": "...", "username": "..." }
}
```

**Обновление токена:**
```bash
POST /api/v1/auth/refresh
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Использование:**
```bash
Authorization: Bearer <accessToken>
```

### 2. API Key (JWT-based, более защищённый)

**Создание API ключа:**
```bash
POST /api/v1/auth/api-keys
{
  "name": "My API Key",
  "userId": "optional-user-id",
  "expiresInDays": 30,
  "scopes": ["read", "write"]
}
```

**Ответ:**
```json
{
  "id": "uuid",
  "key": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...", // JWT токен
  "name": "My API Key",
  "createdAt": "2024-01-01T00:00:00Z",
  "expiresAt": "2024-01-31T00:00:00Z",
  "scopes": ["read", "write"]
}
```

**Использование:**
```bash
# Вариант 1: Заголовок X-API-Key
X-API-Key: <jwt-token>

# Вариант 2: Authorization Bearer
Authorization: Bearer <jwt-token>
```

**Преимущества JWT-based API ключей:**
- Подпись и проверка целостности
- Встроенное время истечения
- Поддержка scopes (разрешений)
- Отслеживание IP и User-Agent
- Возможность отзыва через базу данных

## Валидация

Все входящие данные валидируются с помощью Zod схем. Socket.io события также используют Zod для валидации.

