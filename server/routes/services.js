const express = require('express');
const router = express.Router();
const { pool } = require('../db');

// GET - Получить все услуги
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT s.id, s.name, s.price, s.description, s.created_at,
             COALESCE(json_agg(json_build_object('id', u.id, 'full_name', u.full_name, 'phone', u.phone)) 
             FILTER (WHERE u.id IS NOT NULL), '[]'::json) as masters
      FROM services s
      LEFT JOIN master_services ms ON s.id = ms.service_id
      LEFT JOIN users u ON ms.master_id = u.id
      GROUP BY s.id, s.name, s.price, s.description, s.created_at
      ORDER BY s.name
    `);

    res.status(200).json(result.rows);
  } catch (err) {
    console.error('Ошибка при загрузке услуг:', err);
    res.status(500).json({ error: 'Failed to fetch services', details: err.message });
  }
});

// GET - Получить услугу по ID
router.get('/:id', async (req, res) => {
  try {
    const serviceId = req.params.id;

    const result = await pool.query(`
      SELECT s.id, s.name, s.price, s.description, s.created_at,
             COALESCE(json_agg(json_build_object('id', u.id, 'full_name', u.full_name, 'phone', u.phone)) 
             FILTER (WHERE u.id IS NOT NULL), '[]'::json) as masters
      FROM services s
      LEFT JOIN master_services ms ON s.id = ms.service_id
      LEFT JOIN users u ON ms.master_id = u.id
      WHERE s.id = $1
      GROUP BY s.id, s.name, s.price, s.description, s.created_at
    `, [serviceId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Service not found' });
    }

    res.status(200).json(result.rows[0]);
  } catch (err) {
    console.error('Ошибка при загрузке услуги:', err);
    res.status(500).json({ error: 'Failed to fetch service', details: err.message });
  }
});

// POST - Создать новую услугу
router.post('/', async (req, res) => {
  try {
    const { name, price, description } = req.body;

    if (!name || price === undefined) {
      return res.status(400).json({ error: 'Missing required fields: name, price' });
    }

    const query = `
      INSERT INTO services (name, price, description)
      VALUES ($1, $2, $3)
      RETURNING id, name, price, description, created_at
    `;

    const result = await pool.query(query, [name, price, description || null]);

    res.status(201).json(result.rows[0]);
  } catch (err) {
    if (err.code === '23505') {
      return res.status(400).json({ error: 'Service with this name already exists' });
    }
    console.error('Ошибка при создании услуги:', err);
    res.status(500).json({ error: 'Failed to create service', details: err.message });
  }
});

// PUT - Обновить услугу
router.put('/:id', async (req, res) => {
  try {
    const { name, price, description } = req.body;
    const id = req.params.id;

    const checkResult = await pool.query('SELECT * FROM services WHERE id = $1', [id]);
    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: 'Service not found' });
    }

    const updates = [];
    const values = [];
    let paramCount = 1;

    if (name !== undefined) {
      updates.push(`name = $${paramCount}`);
      values.push(name);
      paramCount++;
    }
    if (price !== undefined) {
      updates.push(`price = $${paramCount}`);
      values.push(price);
      paramCount++;
    }
    if (description !== undefined) {
      updates.push(`description = $${paramCount}`);
      values.push(description);
      paramCount++;
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    updates.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(id);

    const query = `UPDATE services SET ${updates.join(', ')} WHERE id = $${paramCount} RETURNING id, name, price, description, created_at`;
    const result = await pool.query(query, values);

    res.status(200).json(result.rows[0]);
  } catch (err) {
    console.error('Ошибка при обновлении услуги:', err);
    res.status(500).json({ error: 'Failed to update service', details: err.message });
  }
});

// DELETE - Удалить услугу
router.delete('/:id', async (req, res) => {
  try {
    const id = req.params.id;

    const result = await pool.query('SELECT * FROM services WHERE id = $1', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Service not found' });
    }

    const deletedService = result.rows[0];

    await pool.query('DELETE FROM services WHERE id = $1', [id]);

    res.status(200).json({ message: 'Service deleted', service: deletedService });
  } catch (err) {
    console.error('Ошибка при удалении услуги:', err);
    res.status(500).json({ error: 'Failed to delete service', details: err.message });
  }
});

module.exports = router;