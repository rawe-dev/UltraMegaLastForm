const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

// Инициализация таблицы при подключении
async function initializeDatabase() {
  try {
    // Создание таблицы если её нет
    await pool.query(`
      CREATE TABLE IF NOT EXISTS records (
        id SERIAL PRIMARY KEY,
        client VARCHAR(255) NOT NULL,
        car VARCHAR(255) NOT NULL,
        service VARCHAR(255) NOT NULL,
        price INTEGER NOT NULL,
        date DATE NOT NULL,
        status VARCHAR(50) NOT NULL DEFAULT 'pending',
        payment_amount INTEGER,
        comments TEXT DEFAULT '',
        cancellation_reason TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    console.log('✅ Таблица records создана или уже существует');

    // Проверяем есть ли данные в таблице
    const result = await pool.query('SELECT COUNT(*) FROM records');
    const rowCount = parseInt(result.rows[0].count);

    // Если таблица пустая, вставляем начальные данные
    if (rowCount === 0) {
      const initialData = [
        {
          client: 'Ivan Petrov',
          car: 'Toyota Camry 2015',
          service: 'Oil change',
          price: 3500,
          date: '2025-10-05',
          status: 'completed',
          payment_amount: 3500,
          comments: 'Service completed successfully',
          cancellation_reason: null
        },
        {
          client: 'Alexey Smirnov',
          car: 'Honda Civic 2018',
          service: 'Brake pads replacement',
          price: 6200,
          date: '2025-10-06',
          status: 'pending',
          payment_amount: null,
          comments: '',
          cancellation_reason: null
        },
        {
          client: 'Maria Ivanova',
          car: 'Ford Focus 2017',
          service: 'Engine diagnostics',
          price: 2000,
          date: '2025-10-07',
          status: 'completed',
          payment_amount: 2000,
          comments: 'All systems checked',
          cancellation_reason: null
        },
        {
          client: 'Dmitry Orlov',
          car: 'Nissan X-Trail 2020',
          service: 'Air conditioner refill',
          price: 2800,
          date: '2025-10-08',
          status: 'cancelled',
          payment_amount: null,
          comments: '',
          cancellation_reason: 'Client cancelled the service'
        },
        {
          client: 'Olga Sokolova',
          car: 'Kia Rio 2019',
          service: 'Tire replacement',
          price: 4500,
          date: '2025-10-09',
          status: 'in_progress',
          payment_amount: null,
          comments: 'Work in progress',
          cancellation_reason: null
        }
      ];

      for (const data of initialData) {
        await pool.query(
          `INSERT INTO records (client, car, service, price, date, status, payment_amount, comments, cancellation_reason)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
          [data.client, data.car, data.service, data.price, data.date, data.status, data.payment_amount, data.comments, data.cancellation_reason]
        );
      }

      console.log('📁 База данных инициализирована с начальными данными');
    } else {
      console.log(`📊 База данных содержит ${rowCount} записей`);
    }
  } catch (err) {
    console.error('❌ Ошибка при инициализации БД:', err.message);
    process.exit(1);
  }
}

// Тестирование подключения
async function testConnection() {
  try {
    const result = await pool.query('SELECT NOW()');
    console.log('✅ Подключение к PostgreSQL успешно!');
    return true;
  } catch (err) {
    console.error('❌ Ошибка подключения к PostgreSQL:', err.message);
    return false;
  }
}

module.exports = {
  pool,
  initializeDatabase,
  testConnection
};
