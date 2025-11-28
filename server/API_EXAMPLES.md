# Примеры использования API

## Тестирование с помощью curl

### 1. Получить все записи
```bash
curl http://localhost:5000/api/records
```

### 2. Получить запись по ID
```bash
curl http://localhost:5000/api/records/1
```

### 3. Создать новую запись
```bash
curl -X POST http://localhost:5000/api/records \
  -H "Content-Type: application/json" \
  -d '{
    "client": "Alex Johnson",
    "car": "BMW X5 2022",
    "service": "Full maintenance",
    "price": 8500,
    "date": "2025-11-28",
    "status": "pending",
    "payment_amount": null,
    "comments": "Premium service package",
    "cancellation_reason": null
  }'
```

### 4. Обновить запись
```bash
curl -X PUT http://localhost:5000/api/records/1 \
  -H "Content-Type: application/json" \
  -d '{
    "client": "Ivan Petrov",
    "car": "Toyota Camry 2015",
    "service": "Oil change",
    "price": 3500,
    "date": "2025-10-05",
    "status": "completed",
    "payment_amount": 3500,
    "comments": "Service completed successfully",
    "cancellation_reason": null
  }'
```

### 5. Удалить запись
```bash
curl -X DELETE http://localhost:5000/api/records/5
```

### 6. Health Check
```bash
curl http://localhost:5000/api/health
```

## Тестирование с помощью Postman

1. Откройте Postman
2. Создайте новую коллекцию "Auto-App API"
3. Добавьте следующие запросы:

**GET - Все записи**
- Method: GET
- URL: `http://localhost:5000/api/records`

**POST - Создать запись**
- Method: POST
- URL: `http://localhost:5000/api/records`
- Headers: `Content-Type: application/json`
- Body (raw):
```json
{
  "client": "Test Client",
  "car": "Test Car 2023",
  "service": "Test Service",
  "price": 5000,
  "date": "2025-11-28",
  "status": "pending",
  "payment_amount": null,
  "comments": "Test comment",
  "cancellation_reason": null
}
```

**PUT - Обновить запись**
- Method: PUT
- URL: `http://localhost:5000/api/records/1`
- Headers: `Content-Type: application/json`
- Body (raw): Аналогично POST

**DELETE - Удалить запись**
- Method: DELETE
- URL: `http://localhost:5000/api/records/1`

## Использование в React компонентах

```javascript
import { getRecordCards, createRecord, updateRecord, deleteRecord } from './service/api';

// Загрузить все записи
const records = await getRecordCards();

// Создать новую запись
const newRecord = await createRecord({
  client: "New Client",
  car: "New Car",
  service: "New Service",
  price: 5000,
  date: "2025-11-28",
  status: "pending"
});

// Обновить запись
const updated = await updateRecord(1, {
  status: "completed",
  payment_amount: 5000
});

// Удалить запись
await deleteRecord(1);
```

## Возможные коды ошибок

- `200` - OK - Запрос выполнен успешно
- `201` - Created - Ресурс успешно создан
- `400` - Bad Request - Неправильный формат запроса
- `404` - Not Found - Ресурс не найден
- `500` - Internal Server Error - Ошибка сервера
