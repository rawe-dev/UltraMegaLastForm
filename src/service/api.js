const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

export async function getRecordCards() {
  try {
    const res = await fetch(`${API_BASE_URL}/records`);
    if (!res.ok) throw new Error("Network response was not ok");
    const data = await res.json();
    return data;
  } catch (err) {
    console.error("Ошибка загрузки записей:", err);
    // Fallback - загружаем из локального JSON если бэкэнд недоступен
    try {
      const res = await fetch("/data/Records.json");
      if (!res.ok) throw new Error("Network response was not ok");
      const data = await res.json();
      
      const localRecords = JSON.parse(localStorage.getItem('records') || '[]');
      return [...data, ...localRecords];
    } catch (fallbackErr) {
      console.error("Ошибка загрузки fallback данных:", fallbackErr);
      const localRecords = JSON.parse(localStorage.getItem('records') || '[]');
      return localRecords;
    }
  }
}

export async function createRecord(recordData) {
  try {
    const res = await fetch(`${API_BASE_URL}/records`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(recordData),
    });
    
    if (!res.ok) throw new Error("Failed to create record");
    return await res.json();
  } catch (err) {
    console.error("Ошибка создания записи:", err);
    throw err;
  }
}

export async function updateRecord(id, recordData) {
  try {
    const res = await fetch(`${API_BASE_URL}/records/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(recordData),
    });
    
    if (!res.ok) throw new Error("Failed to update record");
    return await res.json();
  } catch (err) {
    console.error("Ошибка обновления записи:", err);
    throw err;
  }
}

export async function deleteRecord(id) {
  try {
    const res = await fetch(`${API_BASE_URL}/records/${id}`, {
      method: 'DELETE',
    });
    
    if (!res.ok) throw new Error("Failed to delete record");
    return await res.json();
  } catch (err) {
    console.error("Ошибка удаления записи:", err);
    throw err;
  }
}

export async function getRecordById(id) {
  try {
    const res = await fetch(`${API_BASE_URL}/records/${id}`);
    if (!res.ok) throw new Error("Failed to get record");
    return await res.json();
  } catch (err) {
    console.error("Ошибка получения записи:", err);
    throw err;
  }
}