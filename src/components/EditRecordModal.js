import { useState } from 'react';
import '../styles/EditRecordModal.css';

export default function EditRecordModal({ record, onSave, onClose }) {
  const [formData, setFormData] = useState({ ...record });
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

    if (formData.status === 'completed') {
      if (!formData.payment_amount || formData.payment_amount <= 0) {
        newErrors.payment_amount = 'Укажите сумму оплаты';
      }
    }

    if (formData.status === 'cancelled') {
      if (!formData.cancellation_reason.trim()) {
        newErrors.cancellation_reason = 'Укажите причину отмены';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (validateForm()) {
      onSave(formData);
    }
  };

  const handleStatusChange = (e) => {
    const newStatus = e.target.value;
    setFormData(prev => ({
      ...prev,
      status: newStatus,
      payment_amount: newStatus === 'completed' ? prev.payment_amount : null,
      cancellation_reason: newStatus === 'cancelled' ? prev.cancellation_reason : null,
      comments: newStatus === 'completed' ? prev.comments : ''
    }));
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Редактировать запись</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        <form onSubmit={handleSubmit} className="edit-form">
          <div className="form-row">
            <div className="form-group">
              <label>Клиент:</label>
              <input
                type="text"
                name="client"
                value={formData.client}
                onChange={handleChange}
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
                className={errors.price ? 'error' : ''}
              />
              {errors.price && <span className="error-text">{errors.price}</span>}
            </div>

            <div className="form-group">
              <label>Статус:</label>
              <select 
                name="status" 
                value={formData.status}
                onChange={handleStatusChange}
              >
                <option value="pending">Ожидание</option>
                <option value="in_progress">В работе</option>
                <option value="completed">Проведена</option>
                <option value="cancelled">Отмена</option>
              </select>
            </div>
          </div>

          {formData.status === 'completed' && (
            <div className="form-row">
              <div className="form-group">
                <label>Сумма оплаты (₽):</label>
                <input
                  type="number"
                  name="payment_amount"
                  value={formData.payment_amount || ''}
                  onChange={handleChange}
                  placeholder="Укажите сумму оплаты"
                  className={errors.payment_amount ? 'error' : ''}
                />
                {errors.payment_amount && <span className="error-text">{errors.payment_amount}</span>}
              </div>

              <div className="form-group">
                <label>Комментарии:</label>
                <textarea
                  name="comments"
                  value={formData.comments}
                  onChange={handleChange}
                  placeholder="Добавьте комментарии (опционально)"
                  rows="3"
                />
              </div>
            </div>
          )}

          {formData.status === 'cancelled' && (
            <div className="form-group full-width">
              <label>Причина отмены:</label>
              <textarea
                name="cancellation_reason"
                value={formData.cancellation_reason}
                onChange={handleChange}
                placeholder="Укажите причину отмены"
                rows="3"
                className={errors.cancellation_reason ? 'error' : ''}
              />
              {errors.cancellation_reason && <span className="error-text">{errors.cancellation_reason}</span>}
            </div>
          )}

          <div className="form-actions">
            <button type="button" className="btn-cancel" onClick={onClose}>
              Отмена
            </button>
            <button type="submit" className="btn-save">
              Сохранить
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}