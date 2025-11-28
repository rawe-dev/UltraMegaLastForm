# Backend для Auto-App

Полнофункциональный Node.js/Express сервер для управления записями сервиса автомобилей.

## Установка

### Шаг 1: Установка зависимостей для сервера

```bash
cd server
npm install
```

### Шаг 2: Установка зависимостей для фронтенда (если еще не установлены)

```bash
cd ..
npm install
```

## Запуск

### Разработка с двумя терминалами

**Терминал 1 - Бэкэнд сервер:**
```bash
cd server
npm start
# или для режима разработки с автоперезагрузкой:
npm run dev
```

**Терминал 2 - Фронтенд React:**
```bash
npm start
```

Сервер будет доступен по адресу: `http://localhost:5000`
Приложение React будет доступно по адресу: `http://localhost:3000`

## API Endpoints

### Получить все записи
```
GET /api/records
```

### Получить запись по ID
```
GET /api/records/:id
```

### Создать новую запись
```
POST /api/records
Content-Type: application/json

{
  "client": "John Doe",
  "car": "Toyota Camry 2020",
  "service": "Oil change",
  "price": 3500,
  "date": "2025-11-28",
  "status": "pending",
  "payment_amount": null,
  "comments": "",
  "cancellation_reason": null
}
```

### Обновить запись
```
PUT /api/records/:id
Content-Type: application/json

{
  "client": "John Doe",
  "car": "Toyota Camry 2020",
  "service": "Oil change",
  "price": 3500,
  "date": "2025-11-28",
  "status": "completed",
  "payment_amount": 3500,
  "comments": "Service completed",
  "cancellation_reason": null
}
```

### Удалить запись
```
DELETE /api/records/:id
```

### Health Check
```
GET /api/health
```

## Структура проекта

```
auto-app/
├── server/
│   ├── server.js          # Основной сервер Express
│   ├── data.json          # База данных (создается автоматически)
│   └── package.json       # Зависимости сервера
├── src/
│   ├── service/
│   │   └── api.js         # API клиент для фронтенда
│   └── components/        # React компоненты
├── public/
│   └── data/
│       └── Records.json   # Начальные данные
└── .env                   # Переменные окружения
```

## Переменные окружения

### Фронтенд (.env в корне проекта)
```
REACT_APP_API_URL=http://localhost:5000/api
```

### Бэкэнд (server/server.js)
```javascript
PORT = process.env.PORT || 5000
```

## Возможности

✅ CRUD операции (Create, Read, Update, Delete)
✅ Сохранение данных в JSON файл
✅ CORS поддержка для кроссдоменных запросов
✅ Обработка ошибок
✅ Валидация данных
✅ Автоматическая инициализация данных

## Статусы записей

- `pending` - В ожидании
- `in_progress` - В процессе
- `completed` - Завершено
- `cancelled` - Отменено

## Разработка

Для удобства разработки установите `nodemon`:
```bash
cd server
npm install --save-dev nodemon
npm run dev
```

Сервер будет автоматически перезагружаться при изменении файлов.

## Развертывание

Для развертывания на продакшене измените переменные окружения:

```bash
PORT=3000 node server/server.js
```

или используйте PM2:
```bash
pm2 start server/server.js --name "auto-app-server"
```
