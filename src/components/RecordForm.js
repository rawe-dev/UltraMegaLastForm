import { useState } from 'react';
import ResultCreateRecord from './ResultCreateRecord';
import '../styles/RecordForm.css';

export default function CreateCard() {
  const [formData, setFormData] = useState({
    id: null,
    client: '',
    car: '',
    service: '',
    price: '',
    date: '',
    status: 'pending',
    payment_amount: null,
    comments: '',
    cancellation_reason: null
  });

  const [result, setResult] = useState('');
  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.client.trim()) newErrors.client = 'Поле обязательно';
    if (!formData.car.trim()) newErrors.car = 'Поле обязательно';
    if (!formData.service.trim()) newErrors.service = 'Поле обязательно';
    if (!formData.price || formData.price <= 0) newErrors.price = 'Укажите корректную цену';
    if (!formData.date) newErrors.date = 'Выберите дату';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (validateForm()) {
      const newRecord = {
        ...formData,
        id: Date.now(),
        price: parseFloat(formData.price)
      };

      // Сохраняем новую запись в localStorage для демонстрации
      const existingRecords = JSON.parse(localStorage.getItem('records') || '[]');
      existingRecords.push(newRecord);
      localStorage.setItem('records', JSON.stringify(existingRecords));

      setResult('✓ Запись успешно создана!');
      
      // Очищаем форму
      setTimeout(() => {
        setFormData({
          id: null,
          client: '',
          car: '',
          service: '',
          price: '',
          date: '',
          status: 'pending',
          payment_amount: null,
          comments: '',
          cancellation_reason: null
        });
        setResult('');
      }, 2000);
    }
  };

  return (
    <div className="form-container">
      <div className="form-header">
        <h2>➕ Создать новую запись</h2>
      </div>

      <form onSubmit={handleSubmit} className="create-form">
        <div className="form-row">
          <div className="form-group">
            <label>Клиент:</label>
            <input
              type="text"
              name="client"
              value={formData.client}
              onChange={handleChange}
              placeholder="ФИО клиента"
              className={errors.client ? 'error' : ''}
            />
            {errors.client && <span className="error-text">{errors.client}</span>}
          </div>

          <div className="form-group">
            <label>Дата:</label>
            <input
              type="date"
              name="date"
              value={formData.date}
              onChange={handleChange}
              className={errors.date ? 'error' : ''}
            />
            {errors.date && <span className="error-text">{errors.date}</span>}
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Автомобиль:</label>
            <input
              type="text"
              name="car"
              value={formData.car}
              onChange={handleChange}
              placeholder="Марка и модель"
              className={errors.car ? 'error' : ''}
            />
            {errors.car && <span className="error-text">{errors.car}</span>}
          </div>

          <div className="form-group">
            <label>Услуга:</label>
            <input
              type="text"
              name="service"
              value={formData.service}
              onChange={handleChange}
              placeholder="Название услуги"
              className={errors.service ? 'error' : ''}
            />
            {errors.service && <span className="error-text">{errors.service}</span>}
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Цена (₽):</label>
            <input
              type="number"
              name="price"
              value={formData.price}
              onChange={handleChange}
              placeholder="0.00"
              className={errors.price ? 'error' : ''}
            />
            {errors.price && <span className="error-text">{errors.price}</span>}
          </div>

          <div className="form-group">
            <label>Статус:</label>
            <select 
              name="status" 
              value={formData.status}
              onChange={handleChange}
            >
              <option value="pending">Ожидание</option>
              <option value="in_progress">В работе</option>
              <option value="completed">Проведена</option>
              <option value="cancelled">Отмена</option>
            </select>
          </div>
        </div>

        <div className="form-actions">
          <button type="submit" className="btn-submit">
            Создать запись
          </button>
        </div>
      </form>

      {result && <ResultCreateRecord result={result} />}
    </div>
  );
}
