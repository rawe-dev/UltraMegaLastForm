import React, { useState } from 'react';
import { openShift, closeShift, getActiveShift, getOperatorLogs } from '../service/api';
import '../styles/ShiftManagement.css';

function ShiftManagement() {
  const [operatorId, setOperatorId] = useState('');
  const [activeShift, setActiveShift] = useState(null);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleLoadShift = async (e) => {
    e.preventDefault();
    if (!operatorId) {
      setError('Введите ID оператора');
      return;
    }

    setLoading(true);
    setError('');
    setMessage('');

    try {
      const response = await getActiveShift(operatorId);
      setActiveShift(response.shift);
      
      const logsData = await getOperatorLogs(operatorId);
      setLogs(logsData);
    } catch (err) {
      setError('Ошибка при загрузке данных смены');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenShift = async () => {
    if (!operatorId) {
      setError('Введите ID оператора');
      return;
    }

    setLoading(true);
    setError('');
    setMessage('');

    try {
      const response = await openShift(operatorId);
      setActiveShift(response.shift);
      setMessage(`✅ Смена открыта успешно! ID смены: ${response.shift.id}`);
      
      const logsData = await getOperatorLogs(operatorId);
      setLogs(logsData);
    } catch (err) {
      setError(`❌ Ошибка при открытии смены: ${err.message}`);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCloseShift = async () => {
    if (!activeShift) {
      setError('Нет открытой смены');
      return;
    }

    if (!window.confirm('Вы уверены, что хотите закрыть смену?')) {
      return;
    }

    setLoading(true);
    setError('');
    setMessage('');

    try {
      await closeShift(activeShift.id);
      setActiveShift(null);
      setMessage('✅ Смена закрыта успешно!');
      
      const logsData = await getOperatorLogs(operatorId);
      setLogs(logsData);
    } catch (err) {
      setError(`❌ Ошибка при закрытии смены: ${err.message}`);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="shift-management">
      <div className="shift-header">
        <h1>🔄 Управление сменой</h1>
        <p>Откройте или закройте смену оператора</p>
      </div>

      <div className="shift-container">
        <div className="shift-control-panel">
          <form onSubmit={handleLoadShift} className="operator-form">
            <div className="form-group">
              <label htmlFor="operatorId">👤 ID Оператора:</label>
              <input
                type="number"
                id="operatorId"
                value={operatorId}
                onChange={(e) => setOperatorId(e.target.value)}
                placeholder="Введите ID оператора"
                disabled={loading}
              />
            </div>
            <button type="submit" disabled={loading} className="load-btn">
              {loading ? 'Загрузка...' : 'Загрузить данные'}
            </button>
          </form>

          {message && <div className="success-message">{message}</div>}
          {error && <div className="error-message">{error}</div>}

          {operatorId && (
            <div className="shift-actions">
              {activeShift ? (
                <div className="shift-status active">
                  <h2>📖 Активная смена</h2>
                  <div className="shift-info">
                    <p><strong>ID смены:</strong> {activeShift.id}</p>
                    <p><strong>Открыта:</strong> {new Date(activeShift.opened_at).toLocaleString('ru-RU')}</p>
                    <p><strong>Статус:</strong> <span className="status-badge open">Открыта</span></p>
                  </div>
                  <button 
                    onClick={handleCloseShift} 
                    disabled={loading}
                    className="close-shift-btn"
                  >
                    {loading ? 'Закрытие...' : '❌ Закрыть смену'}
                  </button>
                </div>
              ) : (
                <div className="shift-status closed">
                  <h2>📭 Нет открытой смены</h2>
                  <p>Откройте новую смену, чтобы начать работу</p>
                  <button 
                    onClick={handleOpenShift} 
                    disabled={loading}
                    className="open-shift-btn"
                  >
                    {loading ? 'Открытие...' : '✅ Открыть смену'}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="shift-logs-panel">
          <h2>📋 История смен</h2>
          {logs.length === 0 ? (
            <p className="no-logs">История не найдена</p>
          ) : (
            <div className="logs-list">
              {logs.map((log, index) => (
                <div key={index} className="log-item">
                  <div className="log-action">
                    {log.action === 'opened' ? '🟢' : '🔴'}
                    <span className={`action-text ${log.action}`}>
                      {log.action === 'opened' ? 'Смена открыта' : 'Смена закрыта'}
                    </span>
                  </div>
                  <div className="log-time">
                    {new Date(log.timestamp).toLocaleString('ru-RU')}
                  </div>
                  {log.details && <div className="log-details">{log.details}</div>}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="shift-rules">
        <h3>⚠️ Важные правила:</h3>
        <ul>
          <li>После закрытия смены оператор не может выполнять никакие операции</li>
          <li>Платежи можно обрабатывать только в открытой смене</li>
          <li>Все операции логируются для отчетности</li>
        </ul>
      </div>
    </div>
  );
}

export default ShiftManagement;