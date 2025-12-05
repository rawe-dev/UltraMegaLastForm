const { Pool } = require('pg');
require('dotenv').config();

// Используем DATABASE_URL если доступна (Railway), иначе конструируем из отдельных переменных
const pool = new Pool(
  process.env.DATABASE_URL
    ? { connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } }
    : {
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
        database: process.env.DB_NAME,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
      }
);

// Инициализация таблицы при подключении
async function initializeDatabase() {
  try {
    // Таблица услуг
    await pool.query(`
      CREATE TABLE IF NOT EXISTS services (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL UNIQUE,
        price DECIMAL(10, 2) NOT NULL,
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Таблица пользователей (Операторы, Мастера, Клиенты)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        phone VARCHAR(20) NOT NULL UNIQUE,
        full_name VARCHAR(255) NOT NULL,
        role VARCHAR(50) NOT NULL CHECK (role IN ('operator', 'master', 'client')),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Таблица связи мастеров с услугами
    await pool.query(`
      CREATE TABLE IF NOT EXISTS master_services (
        id SERIAL PRIMARY KEY,
        master_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        service_id INTEGER NOT NULL REFERENCES services(id) ON DELETE CASCADE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(master_id, service_id)
      );
    `);

    // Таблица смен операторов
    await pool.query(`
      CREATE TABLE IF NOT EXISTS shifts (
        id SERIAL PRIMARY KEY,
        operator_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        opened_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        closed_at TIMESTAMP,
        status VARCHAR(50) NOT NULL CHECK (status IN ('open', 'closed')) DEFAULT 'open',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Таблица операций платежей
    await pool.query(`
      CREATE TABLE IF NOT EXISTS transactions (
        id SERIAL PRIMARY KEY,
        shift_id INTEGER NOT NULL REFERENCES shifts(id) ON DELETE CASCADE,
        operator_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        amount DECIMAL(10, 2) NOT NULL,
        transaction_type VARCHAR(50) NOT NULL CHECK (transaction_type IN ('payment', 'cancellation')),
        description TEXT,
        related_transaction_id INTEGER REFERENCES transactions(id) ON DELETE SET NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Таблица логов смен
    await pool.query(`
      CREATE TABLE IF NOT EXISTS shift_logs (
        id SERIAL PRIMARY KEY,
        shift_id INTEGER NOT NULL REFERENCES shifts(id) ON DELETE CASCADE,
        operator_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        action VARCHAR(50) NOT NULL CHECK (action IN ('opened', 'closed')),
        timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        details TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Оригинальная таблица записей (обновляем с новыми полями)
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

    console.log('✅ Все таблицы созданы или уже существуют');

    // Проверяем есть ли данные в таблице records
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
