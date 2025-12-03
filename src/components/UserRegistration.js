import React, { useState } from 'react';
import { registerUser } from '../service/api';
import '../styles/UserRegistration.css';

function UserRegistration() {
  const [formData, setFormData] = useState({
    phone: '',
    full_name: ''
  });
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.phone || !formData.full_name) {
      setError('Все поля обязательны');
      return;
    }

    setLoading(true);
    setError('');
    setMessage('');

    try {
      const response = await registerUser(formData.phone, formData.full_name);
      setMessage(`✅ Пользователь ${response.user.full_name} успешно зарегистрирован!`);
      setFormData({ phone: '', full_name: '' });
    } catch (err) {
      setError(`❌ Ошибка: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="registration-container">
      <div className="registration-card">
        <h1>📝 Регистрация пользователя</h1>
        <p className="subtitle">Введите номер телефона и ФИО для регистрации</p>
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="phone">📱 Номер телефона:</label>
            <input
              type="tel"
              id="phone"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              placeholder="+7 (999) 999-99-99"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="full_name">👤 Фамилия Имя Отчество:</label>
            <input
              type="text"
              id="full_name"
              name="full_name"
              value={formData.full_name}
              onChange={handleChange}
              placeholder="Иван Иванов Иванович"
              required
            />
          </div>

          <button type="submit" disabled={loading} className="submit-btn">
            {loading ? 'Регистрация...' : '✅ Зарегистрировать'}
          </button>
        </form>

        {message && <div className="success-message">{message}</div>}
        {error && <div className="error-message">{error}</div>}
      </div>
    </div>
  );
}

export default UserRegistration;