const express = require('express');
const router = express.Router();
const { pool } = require('../db');

// GET - Получить всех пользователей
router.get('/', async (req, res) => {
  try {
    const role = req.query.role; // Фильтр по роли (operator, master, client)
    
    let query = 'SELECT id, phone, full_name, role, created_at FROM users ORDER BY id DESC';
    let params = [];

    if (role) {
      query = 'SELECT id, phone, full_name, role, created_at FROM users WHERE role = $1 ORDER BY id DESC';
      params = [role];
    }

    const result = await pool.query(query, params);
    res.status(200).json(result.rows);
  } catch (err) {
    console.error('Ошибка при загрузке пользователей:', err);
    res.status(500).json({ error: 'Failed to fetch users', details: err.message });
  }
});

// GET - Получить пользователя по ID
router.get('/:id', async (req, res) => {
  try {
    const userId = req.params.id;
    
    const result = await pool.query(
      'SELECT id, phone, full_name, role, created_at FROM users WHERE id = $1',
      [userId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = result.rows[0];

    // Если это мастер, получаем его услуги
    if (user.role === 'master') {
      const servicesResult = await pool.query(`
        SELECT s.id, s.name, s.price
        FROM services s
        INNER JOIN master_services ms ON s.id = ms.service_id
        WHERE ms.master_id = $1
        ORDER BY s.name
      `, [userId]);

      user.services = servicesResult.rows;
    }

    // Если это оператор, получаем информацию о текущей смене
    if (user.role === 'operator') {
      const shiftResult = await pool.query(`
        SELECT id, opened_at, closed_at, status
        FROM shifts
        WHERE operator_id = $1 AND status = 'open'
        LIMIT 1
      `, [userId]);

      user.current_shift = shiftResult.rows[0] || null;
    }

    res.status(200).json(user);
  } catch (err) {
    console.error('Ошибка при загрузке пользователя:', err);
    res.status(500).json({ error: 'Failed to fetch user', details: err.message });
  }
});

// POST - Регистрация нового пользователя (по номеру телефона и ФИО)
router.post('/register', async (req, res) => {
  try {
    const { phone, full_name } = req.body;

    if (!phone || !full_name) {
      return res.status(400).json({ error: 'Missing required fields: phone, full_name' });
    }

    const query = `
      INSERT INTO users (phone, full_name, role)
      VALUES ($1, $2, 'client')
      RETURNING id, phone, full_name, role, created_at
    `;

    const result = await pool.query(query, [phone, full_name]);

    res.status(201).json({
      message: 'User registered successfully',
      user: result.rows[0]
    });
  } catch (err) {
    if (err.code === '23505') {
      return res.status(400).json({ error: 'User with this phone already exists' });
    }
    console.error('Ошибка при регистрации пользователя:', err);
    res.status(500).json({ error: 'Failed to register user', details: err.message });
  }
});

// POST - Создать пользователя (администратор добавляет операторов/мастеров)
router.post('/', async (req, res) => {
  try {
    const { phone, full_name, role } = req.body;

    if (!phone || !full_name || !role) {
      return res.status(400).json({ error: 'Missing required fields: phone, full_name, role' });
    }

    if (!['operator', 'master', 'client'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role. Must be: operator, master, or client' });
    }

    const query = `
      INSERT INTO users (phone, full_name, role)
      VALUES ($1, $2, $3)
      RETURNING id, phone, full_name, role, created_at
    `;

    const result = await pool.query(query, [phone, full_name, role]);

    res.status(201).json(result.rows[0]);
  } catch (err) {
    if (err.code === '23505') {
      return res.status(400).json({ error: 'User with this phone already exists' });
    }
    console.error('Ошибка при создании пользователя:', err);
    res.status(500).json({ error: 'Failed to create user', details: err.message });
  }
});

// PUT - Обновить информацию пользователя
router.put('/:id', async (req, res) => {
  try {
    const { full_name, role } = req.body;
    const id = req.params.id;

    const checkResult = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const updates = [];
    const values = [];
    let paramCount = 1;

    if (full_name !== undefined) {
      updates.push(`full_name = $${paramCount}`);
      values.push(full_name);
      paramCount++;
    }
    if (role !== undefined) {
      if (!['operator', 'master', 'client'].includes(role)) {
        return res.status(400).json({ error: 'Invalid role' });
      }
      updates.push(`role = $${paramCount}`);
      values.push(role);
      paramCount++;
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    updates.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(id);

    const query = `UPDATE users SET ${updates.join(', ')} WHERE id = $${paramCount} RETURNING id, phone, full_name, role, created_at`;
    const result = await pool.query(query, values);

    res.status(200).json(result.rows[0]);
  } catch (err) {
    console.error('Ошибка при обновлении пользователя:', err);
    res.status(500).json({ error: 'Failed to update user', details: err.message });
  }
});

// DELETE - Удалить пользователя
router.delete('/:id', async (req, res) => {
  try {
    const id = req.params.id;

    const result = await pool.query('SELECT * FROM users WHERE id = $1', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const deletedUser = result.rows[0];

    await pool.query('DELETE FROM users WHERE id = $1', [id]);

    res.status(200).json({ message: 'User deleted', user: deletedUser });
  } catch (err) {
    console.error('Ошибка при удалении пользователя:', err);
    res.status(500).json({ error: 'Failed to delete user', details: err.message });
  }
});

// POST - Привязать услугу к мастеру
router.post('/:masterId/services/:serviceId', async (req, res) => {
  try {
    const { masterId, serviceId } = req.params;

    // Проверяем, что пользователь - мастер
    const masterResult = await pool.query('SELECT * FROM users WHERE id = $1 AND role = $2', [masterId, 'master']);
    if (masterResult.rows.length === 0) {
      return res.status(404).json({ error: 'Master not found' });
    }

    // Проверяем, что услуга существует
    const serviceResult = await pool.query('SELECT * FROM services WHERE id = $1', [serviceId]);
    if (serviceResult.rows.length === 0) {
      return res.status(404).json({ error: 'Service not found' });
    }

    // Привязываем услугу к мастеру
    const query = `
      INSERT INTO master_services (master_id, service_id)
      VALUES ($1, $2)
      RETURNING *
    `;

    try {
      const result = await pool.query(query, [masterId, serviceId]);
      res.status(201).json({
        message: 'Service assigned to master',
        assignment: result.rows[0]
      });
    } catch (err) {
      if (err.code === '23505') {
        return res.status(400).json({ error: 'This service is already assigned to this master' });
      }
      throw err;
    }
  } catch (err) {
    console.error('Ошибка при привязке услуги:', err);
    res.status(500).json({ error: 'Failed to assign service', details: err.message });
  }
});

// DELETE - Отвязать услугу от мастера
router.delete('/:masterId/services/:serviceId', async (req, res) => {
  try {
    const { masterId, serviceId } = req.params;

    const result = await pool.query(
      'DELETE FROM master_services WHERE master_id = $1 AND service_id = $2 RETURNING *',
      [masterId, serviceId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Service assignment not found' });
    }

    res.status(200).json({
      message: 'Service unassigned from master',
      assignment: result.rows[0]
    });
  } catch (err) {
    console.error('Ошибка при отвязке услуги:', err);
    res.status(500).json({ error: 'Failed to unassign service', details: err.message });
  }
});

module.exports = router;