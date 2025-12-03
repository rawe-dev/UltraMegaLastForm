import React, { useState, useEffect } from 'react';
import { getServices, getServiceById } from '../service/api';
import '../styles/ServicesPage.css';

function ServicesPage() {
  const [services, setServices] = useState([]);
  const [selectedService, setSelectedService] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await getServices();
      setServices(data);
    } catch (err) {
      setError('Ошибка загрузки услуг');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectService = async (serviceId) => {
    try {
      const serviceData = await getServiceById(serviceId);
      setSelectedService(serviceData);
    } catch (err) {
      setError('Ошибка загрузки деталей услуги');
      console.error(err);
    }
  };

  const handleCloseModal = () => {
    setSelectedService(null);
  };

  return (
    <div className="services-page">
      <div className="services-header">
        <h1>📦 Каталог услуг</h1>
        <p>Выберите услугу, чтобы увидеть привязанных мастеров</p>
      </div>

      {error && <div className="error-message">{error}</div>}

      <div className="services-grid">
        {loading ? (
          <div className="loading">Загрузка услуг...</div>
        ) : services.length === 0 ? (
          <div className="no-services">Услуги не найдены</div>
        ) : (
          services.map(service => (
            <div 
              key={service.id} 
              className="service-card"
              onClick={() => handleSelectService(service.id)}
            >
              <div className="service-icon">🔧</div>
              <h3>{service.name}</h3>
              <p className="service-price">₽ {Number(service.price).toFixed(2)}</p>
              {service.description && (
                <p className="service-description">{service.description}</p>
              )}
              <button className="view-masters-btn">
                Посмотреть мастеров →
              </button>
            </div>
          ))
        )}
      </div>

      {selectedService && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>🔧 {selectedService.name}</h2>
              <button className="close-btn" onClick={handleCloseModal}>✕</button>
            </div>

            <div className="modal-body">
              <div className="service-info">
                <p><strong>Цена:</strong> ₽ {Number(selectedService.price).toFixed(2)}</p>
                {selectedService.description && (
                  <p><strong>Описание:</strong> {selectedService.description}</p>
                )}
              </div>

              <div className="masters-section">
                <h3>👥 Мастера, выполняющие эту услугу:</h3>
                {selectedService.masters && selectedService.masters.length > 0 ? (
                  <div className="masters-list">
                    {selectedService.masters.map(master => (
                      <div key={master.id} className="master-item">
                        <div className="master-info">
                          <p className="master-name">👤 {master.full_name}</p>
                          <p className="master-phone">📱 {master.phone}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="no-masters">На данный момент мастеров не привязано</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ServicesPage;