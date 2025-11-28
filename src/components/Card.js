import '../styles/Card.css';

export default function Card({ 
  id, 
  client, 
  car, 
  service, 
  price, 
  date, 
  status, 
  payment_amount, 
  comments, 
  cancellation_reason,
  onEdit,
  onDelete
}) {
  const getStatusIcon = () => {
    switch(status) {
      case 'completed':
        return { icon: '✓', color: 'green', label: 'Проведена' };
      case 'cancelled':
        return { icon: '✕', color: 'red', label: 'Отмена' };
      case 'in_progress':
        return { icon: '⟳', color: 'yellow', label: 'В работе' };
      case 'pending':
        return { icon: '⋯', color: 'gray', label: 'Ожидание' };
      default:
        return { icon: '?', color: 'gray', label: 'Неизвестно' };
    }
  };

  const statusInfo = getStatusIcon();

  return (
    <div className={`card card-${status}`}>
      <div className="card-header">
        <div className={`status-icon status-${status}`} title={statusInfo.label}>
          {statusInfo.icon}
        </div>
        <div className="card-title">
          <h3>{client}</h3>
          <p className="date">{date}</p>
        </div>
        <div className="card-actions">
          <button className="btn-edit" onClick={() => onEdit?.(id)} title="Редактировать">
            ✎
          </button>
          <button className="btn-delete" onClick={() => onDelete?.(id)} title="Удалить">
            🗑
          </button>
        </div>
      </div>

      <div className="card-content">
        <div className="card-section">
          <label>Автомобиль:</label>
          <p>{car}</p>
        </div>

        <div className="card-section">
          <label>Услуга:</label>
          <p>{service}</p>
        </div>

        <div className="card-section">
          <label>К оплате:</label>
          <p className="price">{price} ₽</p>
        </div>

        {payment_amount !== null && status === 'completed' && (
          <div className="card-section payment-info">
            <label>Оплачено:</label>
            <p className="payment">{payment_amount} ₽</p>
          </div>
        )}

        {comments && (
          <div className="card-section">
            <label>Комментарии:</label>
            <p className="comments">{comments}</p>
          </div>
        )}

        {cancellation_reason && (
          <div className="card-section cancellation-info">
            <label>Причина отмены:</label>
            <p className="cancellation">{cancellation_reason}</p>
          </div>
        )}
      </div>

      <div className="card-footer">
        <span className={`status-badge status-badge-${status}`}>
          {statusInfo.label}
        </span>
      </div>
    </div>
  );
}