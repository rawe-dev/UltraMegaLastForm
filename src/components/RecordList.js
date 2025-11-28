import { useEffect, useState } from "react"
import { getRecordCards } from "../service/api"
import Card from "./Card";
import EditRecordModal from "./EditRecordModal";
import '../styles/RecordList.css';

export default function CardList() {
  const [records, setRecords] = useState([]);
  const [filteredRecords, setFilteredRecords] = useState([]);
  const [activeFilter, setActiveFilter] = useState('all');
  const [editingRecord, setEditingRecord] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);

  useEffect(() => {
    getRecordCards().then((data) => {
      setRecords(data);
      filterRecords(data, 'all');
    });
  }, []);

  const filterRecords = (recordsToFilter, status) => {
    if (status === 'all') {
      setFilteredRecords(recordsToFilter);
    } else {
      setFilteredRecords(recordsToFilter.filter(r => r.status === status));
    }
  };

  const handleFilterChange = (status) => {
    setActiveFilter(status);
    filterRecords(records, status);
  };

  const handleEdit = (recordId) => {
    const record = records.find(r => r.id === recordId);
    setEditingRecord(record);
    setShowEditModal(true);
  };

  const handleDelete = (recordId) => {
    if (window.confirm('Вы уверены, что хотите удалить эту запись?')) {
      const updatedRecords = records.filter(r => r.id !== recordId);
      setRecords(updatedRecords);
      filterRecords(updatedRecords, activeFilter);
      
      // Сохраняем изменения в localStorage
      const localRecords = updatedRecords.filter(r => r.id > 1000000000000);
      localStorage.setItem('records', JSON.stringify(localRecords));
    }
  };

  const handleSaveEdit = (updatedRecord) => {
    const updatedRecords = records.map(r => 
      r.id === updatedRecord.id ? updatedRecord : r
    );
    setRecords(updatedRecords);
    filterRecords(updatedRecords, activeFilter);
    setShowEditModal(false);
    setEditingRecord(null);
    
    // Сохраняем изменения в localStorage для локальных записей
    const localRecords = updatedRecords.filter(r => r.id > 1000000000000);
    localStorage.setItem('records', JSON.stringify(localRecords));
  };

  const getFilterCounts = () => {
    return {
      all: records.length,
      completed: records.filter(r => r.status === 'completed').length,
      cancelled: records.filter(r => r.status === 'cancelled').length,
      in_progress: records.filter(r => r.status === 'in_progress').length,
      pending: records.filter(r => r.status === 'pending').length
    };
  };

  const counts = getFilterCounts();

  return (
    <div className="record-list-container">
      <div className="record-list-header">
        <h2>📋 Список записей</h2>
        <p className="total-count">Всего: {records.length}</p>
      </div>

      <div className="filter-buttons">
        <button 
          className={`filter-btn ${activeFilter === 'all' ? 'active' : ''}`}
          onClick={() => handleFilterChange('all')}
        >
          Все ({counts.all})
        </button>
        <button 
          className={`filter-btn filter-completed ${activeFilter === 'completed' ? 'active' : ''}`}
          onClick={() => handleFilterChange('completed')}
        >
          ✓ Проведены ({counts.completed})
        </button>
        <button 
          className={`filter-btn filter-cancelled ${activeFilter === 'cancelled' ? 'active' : ''}`}
          onClick={() => handleFilterChange('cancelled')}
        >
          ✕ Отмены ({counts.cancelled})
        </button>
        <button 
          className={`filter-btn filter-in_progress ${activeFilter === 'in_progress' ? 'active' : ''}`}
          onClick={() => handleFilterChange('in_progress')}
        >
          ⟳ В работе ({counts.in_progress})
        </button>
        <button 
          className={`filter-btn filter-pending ${activeFilter === 'pending' ? 'active' : ''}`}
          onClick={() => handleFilterChange('pending')}
        >
          ⋯ Ожидание ({counts.pending})
        </button>
      </div>

      <div className="records-grid">
        {filteredRecords.length > 0 ? (
          filteredRecords.map((r) => (
            <Card 
              key={r.id}
              {...r}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          ))
        ) : (
          <div className="no-records">
            <p>Нет записей с выбранным статусом</p>
          </div>
        )}
      </div>

      {showEditModal && editingRecord && (
        <EditRecordModal 
          record={editingRecord}
          onSave={handleSaveEdit}
          onClose={() => setShowEditModal(false)}
        />
      )}
    </div>
  );
}