const express = require('express');
const router = express.Router();
const { pool } = require('../db');

// GET - Получить все смены
router.get('/', async (req, res) => {
  try {
    const operatorId = req.query.operator_id;
    const status = req.query.status;

    let query = `
      SELECT s.id, s.operator_id, u.full_name, u.phone, s.opened_at, s.closed_at, s.status, s.created_at
      FROM shifts s
      JOIN users u ON s.operator_id = u.id
      WHERE 1=1
    `;
    const params = [];
    let paramCount = 1;

    if (operatorId) {
      query += ` AND s.operator_id = $${paramCount}`;
      params.push(operatorId);
      paramCount++;
    }

    if (status) {
      query += ` AND s.status = $${paramCount}`;
      params.push(status);
      paramCount++;
    }

    query += ' ORDER BY s.opened_at DESC';

    const result = await pool.query(query, params);
    res.status(200).json(result.rows);
  } catch (err) {
    console.error('Ошибка при загрузке смен:', err);
    res.status(500).json({ error: 'Failed to fetch shifts', details: err.message });
  }
});

// GET - Получить смену по ID
router.get('/:id', async (req, res) => {
  try {
    const shiftId = req.params.id;

    const result = await pool.query(`
      SELECT s.id, s.operator_id, u.full_name, u.phone, s.opened_at, s.closed_at, s.status, s.created_at
      FROM shifts s
      JOIN users u ON s.operator_id = u.id
      WHERE s.id = $1
    `, [shiftId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Shift not found' });
    }

    const shift = result.rows[0];

    // Получаем все транзакции для этой смены
    const transactionsResult = await pool.query(`
      SELECT id, shift_id, operator_id, amount, transaction_type, description, related_transaction_id, created_at
      FROM transactions
      WHERE shift_id = $1
      ORDER BY created_at DESC
    `, [shiftId]);

    shift.transactions = transactionsResult.rows;

    res.status(200).json(shift);
  } catch (err) {
    console.error('Ошибка при загрузке смены:', err);
    res.status(500).json({ error: 'Failed to fetch shift', details: err.message });
  }
});

// POST - Открыть смену оператором
router.post('/open/:operatorId', async (req, res) => {
  try {
    const operatorId = req.params.operatorId;

    // Проверяем, что пользователь - оператор
    const userResult = await pool.query(
      'SELECT * FROM users WHERE id = $1 AND role = $2',
      [operatorId, 'operator']
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'Operator not found' });
    }

    // Проверяем, что у оператора нет открытой смены
    const existingShiftResult = await pool.query(
      'SELECT * FROM shifts WHERE operator_id = $1 AND status = $2',
      [operatorId, 'open']
    );

    if (existingShiftResult.rows.length > 0) {
      return res.status(400).json({ error: 'Operator already has an open shift' });
    }

    // Открываем смену
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const shiftResult = await client.query(`
        INSERT INTO shifts (operator_id, status)
        VALUES ($1, $2)
        RETURNING id, operator_id, opened_at, closed_at, status, created_at
      `, [operatorId, 'open']);

      const shiftId = shiftResult.rows[0].id;

      // Добавляем запись в лог
      await client.query(`
        INSERT INTO shift_logs (shift_id, operator_id, action, details)
        VALUES ($1, $2, $3, $4)
      `, [shiftId, operatorId, 'opened', `Смена открыта оператором ${userResult.rows[0].full_name}`]);

      await client.query('COMMIT');

      res.status(201).json({
        message: 'Shift opened successfully',
        shift: shiftResult.rows[0]
      });
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  } catch (err) {
    console.error('Ошибка при открытии смены:', err);
    res.status(500).json({ error: 'Failed to open shift', details: err.message });
  }
});

// POST - Закрыть смену оператором
router.post('/close/:shiftId', async (req, res) => {
  try {
    const shiftId = req.params.shiftId;

    // Получаем смену
    const shiftResult = await pool.query(
      'SELECT * FROM shifts WHERE id = $1',
      [shiftId]
    );

    if (shiftResult.rows.length === 0) {
      return res.status(404).json({ error: 'Shift not found' });
    }

    const shift = shiftResult.rows[0];

    if (shift.status === 'closed') {
      return res.status(400).json({ error: 'Shift is already closed' });
    }

    // Закрываем смену в транзакции
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const closedShiftResult = await client.query(`
        UPDATE shifts
        SET status = $1, closed_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
        WHERE id = $2
        RETURNING id, operator_id, opened_at, closed_at, status, created_at
      `, ['closed', shiftId]);

      // Добавляем запись в лог
      await client.query(`
        INSERT INTO shift_logs (shift_id, operator_id, action, details)
        VALUES ($1, $2, $3, $4)
      `, [shiftId, shift.operator_id, 'closed', 'Смена закрыта']);

      await client.query('COMMIT');

      res.status(200).json({
        message: 'Shift closed successfully',
        shift: closedShiftResult.rows[0]
      });
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  } catch (err) {
    console.error('Ошибка при закрытии смены:', err);
    res.status(500).json({ error: 'Failed to close shift', details: err.message });
  }
});

// GET - Получить логи смены
router.get('/:shiftId/logs', async (req, res) => {
  try {
    const shiftId = req.params.shiftId;

    const result = await pool.query(`
      SELECT id, shift_id, operator_id, action, timestamp, details, created_at
      FROM shift_logs
      WHERE shift_id = $1
      ORDER BY timestamp DESC
    `, [shiftId]);

    res.status(200).json(result.rows);
  } catch (err) {
    console.error('Ошибка при загрузке логов смены:', err);
    res.status(500).json({ error: 'Failed to fetch shift logs', details: err.message });
  }
});

// GET - Получить все логи по оператору
router.get('/logs/operator/:operatorId', async (req, res) => {
  try {
    const operatorId = req.params.operatorId;

    const result = await pool.query(`
      SELECT sl.id, sl.shift_id, sl.operator_id, sl.action, sl.timestamp, sl.details, sl.created_at,
             s.opened_at, s.closed_at
      FROM shift_logs sl
      JOIN shifts s ON sl.shift_id = s.id
      WHERE sl.operator_id = $1
      ORDER BY sl.timestamp DESC
    `, [operatorId]);

    res.status(200).json(result.rows);
  } catch (err) {
    console.error('Ошибка при загрузке логов оператора:', err);
    res.status(500).json({ error: 'Failed to fetch operator logs', details: err.message });
  }
});

// GET - Получить активную смену оператора
router.get('/operator/:operatorId/active', async (req, res) => {
  try {
    const operatorId = req.params.operatorId;

    const result = await pool.query(`
      SELECT id, operator_id, opened_at, closed_at, status, created_at
      FROM shifts
      WHERE operator_id = $1 AND status = 'open'
      LIMIT 1
    `, [operatorId]);

    if (result.rows.length === 0) {
      return res.status(200).json({ shift: null, message: 'No active shift' });
    }

    res.status(200).json({ shift: result.rows[0] });
  } catch (err) {
    console.error('Ошибка при загрузке активной смены:', err);
    res.status(500).json({ error: 'Failed to fetch active shift', details: err.message });
  }
});

module.exports = router;