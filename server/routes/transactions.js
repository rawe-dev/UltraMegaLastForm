const express = require('express');
const router = express.Router();
const { pool } = require('../db');

// GET - Получить все транзакции
router.get('/', async (req, res) => {
  try {
    const shiftId = req.query.shift_id;
    const operatorId = req.query.operator_id;

    let query = `
      SELECT t.id, t.shift_id, t.operator_id, u.full_name, t.amount, t.transaction_type, 
             t.description, t.related_transaction_id, t.created_at
      FROM transactions t
      JOIN users u ON t.operator_id = u.id
      WHERE 1=1
    `;
    const params = [];
    let paramCount = 1;

    if (shiftId) {
      query += ` AND t.shift_id = $${paramCount}`;
      params.push(shiftId);
      paramCount++;
    }

    if (operatorId) {
      query += ` AND t.operator_id = $${paramCount}`;
      params.push(operatorId);
      paramCount++;
    }

    query += ' ORDER BY t.created_at DESC';

    const result = await pool.query(query, params);
    res.status(200).json(result.rows);
  } catch (err) {
    console.error('Ошибка при загрузке транзакций:', err);
    res.status(500).json({ error: 'Failed to fetch transactions', details: err.message });
  }
});

// GET - Получить транзакцию по ID
router.get('/:id', async (req, res) => {
  try {
    const transactionId = req.params.id;

    const result = await pool.query(`
      SELECT t.id, t.shift_id, t.operator_id, u.full_name, t.amount, t.transaction_type, 
             t.description, t.related_transaction_id, t.created_at
      FROM transactions t
      JOIN users u ON t.operator_id = u.id
      WHERE t.id = $1
    `, [transactionId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    res.status(200).json(result.rows[0]);
  } catch (err) {
    console.error('Ошибка при загрузке транзакции:', err);
    res.status(500).json({ error: 'Failed to fetch transaction', details: err.message });
  }
});

// POST - Создать операцию платежа
router.post('/payment', async (req, res) => {
  try {
    const { shift_id, operator_id, amount, description } = req.body;

    if (!shift_id || !operator_id || amount === undefined) {
      return res.status(400).json({ error: 'Missing required fields: shift_id, operator_id, amount' });
    }

    // Проверяем, что смена открыта
    const shiftResult = await pool.query(
      'SELECT * FROM shifts WHERE id = $1 AND status = $2',
      [shift_id, 'open']
    );

    if (shiftResult.rows.length === 0) {
      return res.status(400).json({ error: 'Shift is not open' });
    }

    // Проверяем, что оператор принадлежит этой смене
    if (shiftResult.rows[0].operator_id !== operator_id) {
      return res.status(400).json({ error: 'Operator does not match the shift' });
    }

    // Создаем транзакцию платежа
    const query = `
      INSERT INTO transactions (shift_id, operator_id, amount, transaction_type, description)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `;

    const result = await pool.query(query, [shift_id, operator_id, amount, 'payment', description || null]);

    res.status(201).json({
      message: 'Payment transaction created successfully',
      transaction: result.rows[0]
    });
  } catch (err) {
    console.error('Ошибка при создании платежа:', err);
    res.status(500).json({ error: 'Failed to create payment', details: err.message });
  }
});

// POST - Отменить операцию (создать операцию отмены)
router.post('/cancellation', async (req, res) => {
  try {
    const { transaction_id, reason } = req.body;

    if (!transaction_id) {
      return res.status(400).json({ error: 'Missing required field: transaction_id' });
    }

    // Получаем оригинальную транзакцию
    const originalTransactionResult = await pool.query(
      'SELECT * FROM transactions WHERE id = $1 AND transaction_type = $2',
      [transaction_id, 'payment']
    );

    if (originalTransactionResult.rows.length === 0) {
      return res.status(404).json({ error: 'Payment transaction not found' });
    }

    const originalTransaction = originalTransactionResult.rows[0];

    // Проверяем, что смена все еще открыта
    const shiftResult = await pool.query(
      'SELECT * FROM shifts WHERE id = $1 AND status = $2',
      [originalTransaction.shift_id, 'open']
    );

    if (shiftResult.rows.length === 0) {
      return res.status(400).json({ error: 'Shift is not open. Cannot cancel payment' });
    }

    // Создаем транзакцию отмены в рамках одной транзакции БД
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Создаем запись об отмене
      const cancellationResult = await client.query(`
        INSERT INTO transactions (shift_id, operator_id, amount, transaction_type, description, related_transaction_id)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *
      `, [
        originalTransaction.shift_id,
        originalTransaction.operator_id,
        originalTransaction.amount,
        'cancellation',
        reason || 'Отмена платежа',
        transaction_id
      ]);

      await client.query('COMMIT');

      res.status(201).json({
        message: 'Payment cancelled successfully',
        cancellation_transaction: cancellationResult.rows[0],
        original_transaction: originalTransaction
      });
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  } catch (err) {
    console.error('Ошибка при отмене платежа:', err);
    res.status(500).json({ error: 'Failed to cancel payment', details: err.message });
  }
});

// GET - Получить сумму всех платежей по смене
router.get('/shift/:shiftId/total', async (req, res) => {
  try {
    const shiftId = req.params.shiftId;

    const result = await pool.query(`
      SELECT 
        COALESCE(SUM(CASE WHEN transaction_type = 'payment' THEN amount ELSE 0 END), 0) as total_payments,
        COALESCE(SUM(CASE WHEN transaction_type = 'cancellation' THEN amount ELSE 0 END), 0) as total_cancellations,
        COUNT(CASE WHEN transaction_type = 'payment' THEN 1 END) as payment_count,
        COUNT(CASE WHEN transaction_type = 'cancellation' THEN 1 END) as cancellation_count
      FROM transactions
      WHERE shift_id = $1
    `, [shiftId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Shift not found' });
    }

    const stats = result.rows[0];
    const netAmount = parseFloat(stats.total_payments) - parseFloat(stats.total_cancellations);

    res.status(200).json({
      shift_id: shiftId,
      total_payments: stats.total_payments,
      total_cancellations: stats.total_cancellations,
      net_amount: netAmount,
      payment_count: stats.payment_count,
      cancellation_count: stats.cancellation_count
    });
  } catch (err) {
    console.error('Ошибка при получении итогов смены:', err);
    res.status(500).json({ error: 'Failed to fetch shift totals', details: err.message });
  }
});

// GET - Получить отчет по оператору за период
router.get('/operator/:operatorId/report', async (req, res) => {
  try {
    const operatorId = req.params.operatorId;
    const startDate = req.query.start_date;
    const endDate = req.query.end_date;

    let query = `
      SELECT 
        t.id, t.shift_id, s.opened_at, s.closed_at, t.amount, t.transaction_type, 
        t.description, t.created_at
      FROM transactions t
      JOIN shifts s ON t.shift_id = s.id
      WHERE t.operator_id = $1
    `;
    const params = [operatorId];
    let paramCount = 2;

    if (startDate) {
      query += ` AND t.created_at >= $${paramCount}`;
      params.push(startDate);
      paramCount++;
    }

    if (endDate) {
      query += ` AND t.created_at <= $${paramCount}`;
      params.push(endDate);
      paramCount++;
    }

    query += ' ORDER BY t.created_at DESC';

    const transactionsResult = await pool.query(query, params);

    // Вычисляем статистику
    const stats = {
      total_payments: 0,
      total_cancellations: 0,
      payment_count: 0,
      cancellation_count: 0
    };

    transactionsResult.rows.forEach(t => {
      if (t.transaction_type === 'payment') {
        stats.total_payments += parseFloat(t.amount);
        stats.payment_count++;
      } else {
        stats.total_cancellations += parseFloat(t.amount);
        stats.cancellation_count++;
      }
    });

    stats.net_amount = stats.total_payments - stats.total_cancellations;

    res.status(200).json({
      operator_id: operatorId,
      statistics: stats,
      transactions: transactionsResult.rows
    });
  } catch (err) {
    console.error('Ошибка при получении отчета оператора:', err);
    res.status(500).json({ error: 'Failed to fetch operator report', details: err.message });
  }
});

module.exports = router;