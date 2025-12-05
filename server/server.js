const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
require('dotenv').config();

const { pool, initializeDatabase, testConnection, retryConnection } = require('./db');

// Импортируем новые маршруты
const servicesRouter = require('./routes/services');
const usersRouter = require('./routes/users');
const shiftsRouter = require('./routes/shifts');
const transactionsRouter = require('./routes/transactions');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Health Check
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'OK', message: 'Server is running', database: 'PostgreSQL' });
});

// Подключаем новые API маршруты
app.use('/api/services', servicesRouter);
app.use('/api/users', usersRouter);
app.use('/api/shifts', shiftsRouter);
app.use('/api/transactions', transactionsRouter);

// GET - Получить все записи
app.get('/api/records', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM records ORDER BY id DESC');
    res.status(200).json(result.rows);
  } catch (err) {
    console.error('Ошибка при загрузке записей:', err);
    res.status(500).json({ error: 'Failed to fetch records', details: err.message });
  }
});

// GET - Получить запись по ID
app.get('/api/records/:id', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM records WHERE id = $1', [req.params.id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Record not found' });
    }

    res.status(200).json(result.rows[0]);
  } catch (err) {
    console.error('Ошибка при загрузке записи:', err);
    res.status(500).json({ error: 'Failed to fetch record', details: err.message });
  }
});

// POST - Создать новую запись
app.post('/api/records', async (req, res) => {
  try {
    const { client, car, service, price, date, status, payment_amount, comments, cancellation_reason } = req.body;

    // Валидация обязательных полей
    if (!client || !car || !service || price === undefined || !date) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const query = `
      INSERT INTO records (client, car, service, price, date, status, payment_amount, comments, cancellation_reason)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
    `;

    const result = await pool.query(query, [
      client,
      car,
      service,
      price,
      date,
      status || 'pending',
      payment_amount || null,
      comments || '',
      cancellation_reason || null
    ]);

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Ошибка при создании записи:', err);
    res.status(500).json({ error: 'Failed to create record', details: err.message });
  }
});

// PUT - Обновить запись
app.put('/api/records/:id', async (req, res) => {
  try {
    const { client, car, service, price, date, status, payment_amount, comments, cancellation_reason } = req.body;
    const id = req.params.id;

    // Проверяем существование записи
    const checkResult = await pool.query('SELECT * FROM records WHERE id = $1', [id]);
    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: 'Record not found' });
    }

    // Получаем текущие значения
    const current = checkResult.rows[0];

    // Строим динамический UPDATE запрос
    const updates = [];
    const values = [];
    let paramCount = 1;

    if (client !== undefined) {
      updates.push(`client = $${paramCount}`);
      values.push(client);
      paramCount++;
    }
    if (car !== undefined) {
      updates.push(`car = $${paramCount}`);
      values.push(car);
      paramCount++;
    }
    if (service !== undefined) {
      updates.push(`service = $${paramCount}`);
      values.push(service);
      paramCount++;
    }
    if (price !== undefined) {
      updates.push(`price = $${paramCount}`);
      values.push(price);
      paramCount++;
    }
    if (date !== undefined) {
      updates.push(`date = $${paramCount}`);
      values.push(date);
      paramCount++;
    }
    if (status !== undefined) {
      updates.push(`status = $${paramCount}`);
      values.push(status);
      paramCount++;
    }
    if (payment_amount !== undefined) {
      updates.push(`payment_amount = $${paramCount}`);
      values.push(payment_amount);
      paramCount++;
    }
    if (comments !== undefined) {
      updates.push(`comments = $${paramCount}`);
      values.push(comments);
      paramCount++;
    }
    if (cancellation_reason !== undefined) {
      updates.push(`cancellation_reason = $${paramCount}`);
      values.push(cancellation_reason);
      paramCount++;
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    updates.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(id);

    const query = `UPDATE records SET ${updates.join(', ')} WHERE id = $${paramCount} RETURNING *`;
    const result = await pool.query(query, values);

    res.status(200).json(result.rows[0]);
  } catch (err) {
    console.error('Ошибка при обновлении записи:', err);
    res.status(500).json({ error: 'Failed to update record', details: err.message });
  }
});

// DELETE - Удалить запись
app.delete('/api/records/:id', async (req, res) => {
  try {
    const id = req.params.id;

    // Получаем запись перед удалением
    const result = await pool.query('SELECT * FROM records WHERE id = $1', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Record not found' });
    }

    const deletedRecord = result.rows[0];

    // Удаляем запись
    await pool.query('DELETE FROM records WHERE id = $1', [id]);

    res.status(200).json({ message: 'Record deleted', record: deletedRecord });
  } catch (err) {
    console.error('Ошибка при удалении записи:', err);
    res.status(500).json({ error: 'Failed to delete record', details: err.message });
  }
});

// Обработка ошибок для несуществующих маршрутов
app.use((req, res) => {
  res.status(404).json({ error: 'Not Found' });
});

// Запуск сервера
async function startServer() {
  try {
    console.log('🚀 Запуск сервера...');
    console.log('⏳ Попытка подключения к PostgreSQL...\n');
    
    // Используем retry логику для подключения
    const connected = await retryConnection(10, 3000);

    if (!connected) {
      console.error('❌ Не удалось подключиться к базе данных после всех попыток');
      console.error('💡 Убедитесь что:');
      console.error('   1. PostgreSQL сервис запущен в Railway');
      console.error('   2. Переменная DATABASE_URL установлена правильно');
      console.error('   3. База данных доступна из вашей сети');
      process.exit(1);
    }

    // Инициализируем БД
    await initializeDatabase();

    app.listen(PORT, () => {
      console.log(`\n✅ Сервер запущен на порту ${PORT}`);
      console.log(`📍 API доступен по адресу: http://localhost:${PORT}/api`);
      console.log(`🔍 Health Check: http://localhost:${PORT}/api/health`);
      console.log(`🗄️  База данных: PostgreSQL`);
      console.log(`\n📝 Доступные API маршруты:`);
      console.log(`   📦 /api/services - Управление услугами`);
      console.log(`   👥 /api/users - Управление пользователями`);
      console.log(`   🔄 /api/shifts - Управление сменами`);
      console.log(`   💰 /api/transactions - Управление платежами`);
      console.log(`   📋 /api/records - Управление записями\n`);
    });
  } catch (err) {
    console.error('❌ Ошибка при запуске сервера:', err);
    process.exit(1);
  }
}

startServer();
