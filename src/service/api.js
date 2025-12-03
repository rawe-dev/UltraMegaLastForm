const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// ========== RECORDS ==========
export async function getRecordCards() {
  try {
    const res = await fetch(`${API_BASE_URL}/records`);
    if (!res.ok) throw new Error("Network response was not ok");
    const data = await res.json();
    return data;
  } catch (err) {
    console.error("Ошибка загрузки записей:", err);
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

// ========== SERVICES ==========
export async function getServices() {
  try {
    const res = await fetch(`${API_BASE_URL}/services`);
    if (!res.ok) throw new Error("Failed to fetch services");
    return await res.json();
  } catch (err) {
    console.error("Ошибка загрузки услуг:", err);
    throw err;
  }
}

export async function getServiceById(id) {
  try {
    const res = await fetch(`${API_BASE_URL}/services/${id}`);
    if (!res.ok) throw new Error("Failed to fetch service");
    return await res.json();
  } catch (err) {
    console.error("Ошибка загрузки услуги:", err);
    throw err;
  }
}

export async function createService(serviceData) {
  try {
    const res = await fetch(`${API_BASE_URL}/services`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(serviceData),
    });
    if (!res.ok) throw new Error("Failed to create service");
    return await res.json();
  } catch (err) {
    console.error("Ошибка создания услуги:", err);
    throw err;
  }
}

export async function updateService(id, serviceData) {
  try {
    const res = await fetch(`${API_BASE_URL}/services/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(serviceData),
    });
    if (!res.ok) throw new Error("Failed to update service");
    return await res.json();
  } catch (err) {
    console.error("Ошибка обновления услуги:", err);
    throw err;
  }
}

export async function deleteService(id) {
  try {
    const res = await fetch(`${API_BASE_URL}/services/${id}`, {
      method: 'DELETE',
    });
    if (!res.ok) throw new Error("Failed to delete service");
    return await res.json();
  } catch (err) {
    console.error("Ошибка удаления услуги:", err);
    throw err;
  }
}

// ========== USERS ==========
export async function getUsers(role = null) {
  try {
    let url = `${API_BASE_URL}/users`;
    if (role) {
      url += `?role=${role}`;
    }
    const res = await fetch(url);
    if (!res.ok) throw new Error("Failed to fetch users");
    return await res.json();
  } catch (err) {
    console.error("Ошибка загрузки пользователей:", err);
    throw err;
  }
}

export async function getUserById(id) {
  try {
    const res = await fetch(`${API_BASE_URL}/users/${id}`);
    if (!res.ok) throw new Error("Failed to fetch user");
    return await res.json();
  } catch (err) {
    console.error("Ошибка загрузки пользователя:", err);
    throw err;
  }
}

export async function registerUser(phone, fullName) {
  try {
    const res = await fetch(`${API_BASE_URL}/users/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ phone, full_name: fullName }),
    });
    if (!res.ok) throw new Error("Failed to register user");
    return await res.json();
  } catch (err) {
    console.error("Ошибка регистрации пользователя:", err);
    throw err;
  }
}

export async function createUser(phone, fullName, role) {
  try {
    const res = await fetch(`${API_BASE_URL}/users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ phone, full_name: fullName, role }),
    });
    if (!res.ok) throw new Error("Failed to create user");
    return await res.json();
  } catch (err) {
    console.error("Ошибка создания пользователя:", err);
    throw err;
  }
}

export async function updateUser(id, userData) {
  try {
    const res = await fetch(`${API_BASE_URL}/users/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData),
    });
    if (!res.ok) throw new Error("Failed to update user");
    return await res.json();
  } catch (err) {
    console.error("Ошибка обновления пользователя:", err);
    throw err;
  }
}

export async function assignServiceToMaster(masterId, serviceId) {
  try {
    const res = await fetch(`${API_BASE_URL}/users/${masterId}/services/${serviceId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    if (!res.ok) throw new Error("Failed to assign service");
    return await res.json();
  } catch (err) {
    console.error("Ошибка привязки услуги:", err);
    throw err;
  }
}

export async function removeServiceFromMaster(masterId, serviceId) {
  try {
    const res = await fetch(`${API_BASE_URL}/users/${masterId}/services/${serviceId}`, {
      method: 'DELETE',
    });
    if (!res.ok) throw new Error("Failed to remove service");
    return await res.json();
  } catch (err) {
    console.error("Ошибка отвязки услуги:", err);
    throw err;
  }
}

// ========== SHIFTS ==========
export async function getShifts(operatorId = null, status = null) {
  try {
    let url = `${API_BASE_URL}/shifts`;
    const params = [];
    if (operatorId) params.push(`operator_id=${operatorId}`);
    if (status) params.push(`status=${status}`);
    if (params.length > 0) url += `?${params.join('&')}`;
    
    const res = await fetch(url);
    if (!res.ok) throw new Error("Failed to fetch shifts");
    return await res.json();
  } catch (err) {
    console.error("Ошибка загрузки смен:", err);
    throw err;
  }
}

export async function getShiftById(id) {
  try {
    const res = await fetch(`${API_BASE_URL}/shifts/${id}`);
    if (!res.ok) throw new Error("Failed to fetch shift");
    return await res.json();
  } catch (err) {
    console.error("Ошибка загрузки смены:", err);
    throw err;
  }
}

export async function openShift(operatorId) {
  try {
    const res = await fetch(`${API_BASE_URL}/shifts/open/${operatorId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    if (!res.ok) throw new Error("Failed to open shift");
    return await res.json();
  } catch (err) {
    console.error("Ошибка открытия смены:", err);
    throw err;
  }
}

export async function closeShift(shiftId) {
  try {
    const res = await fetch(`${API_BASE_URL}/shifts/close/${shiftId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    if (!res.ok) throw new Error("Failed to close shift");
    return await res.json();
  } catch (err) {
    console.error("Ошибка закрытия смены:", err);
    throw err;
  }
}

export async function getActiveShift(operatorId) {
  try {
    const res = await fetch(`${API_BASE_URL}/shifts/operator/${operatorId}/active`);
    if (!res.ok) throw new Error("Failed to fetch active shift");
    return await res.json();
  } catch (err) {
    console.error("Ошибка загрузки активной смены:", err);
    throw err;
  }
}

export async function getShiftLogs(shiftId) {
  try {
    const res = await fetch(`${API_BASE_URL}/shifts/${shiftId}/logs`);
    if (!res.ok) throw new Error("Failed to fetch shift logs");
    return await res.json();
  } catch (err) {
    console.error("Ошибка загрузки логов смены:", err);
    throw err;
  }
}

export async function getOperatorLogs(operatorId) {
  try {
    const res = await fetch(`${API_BASE_URL}/shifts/logs/operator/${operatorId}`);
    if (!res.ok) throw new Error("Failed to fetch operator logs");
    return await res.json();
  } catch (err) {
    console.error("Ошибка загрузки логов оператора:", err);
    throw err;
  }
}

// ========== TRANSACTIONS ==========
export async function getTransactions(shiftId = null, operatorId = null) {
  try {
    let url = `${API_BASE_URL}/transactions`;
    const params = [];
    if (shiftId) params.push(`shift_id=${shiftId}`);
    if (operatorId) params.push(`operator_id=${operatorId}`);
    if (params.length > 0) url += `?${params.join('&')}`;
    
    const res = await fetch(url);
    if (!res.ok) throw new Error("Failed to fetch transactions");
    return await res.json();
  } catch (err) {
    console.error("Ошибка загрузки транзакций:", err);
    throw err;
  }
}

export async function getTransactionById(id) {
  try {
    const res = await fetch(`${API_BASE_URL}/transactions/${id}`);
    if (!res.ok) throw new Error("Failed to fetch transaction");
    return await res.json();
  } catch (err) {
    console.error("Ошибка загрузки транзакции:", err);
    throw err;
  }
}

export async function createPayment(shiftId, operatorId, amount, description = null) {
  try {
    const res = await fetch(`${API_BASE_URL}/transactions/payment`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ shift_id: shiftId, operator_id: operatorId, amount, description }),
    });
    if (!res.ok) throw new Error("Failed to create payment");
    return await res.json();
  } catch (err) {
    console.error("Ошибка создания платежа:", err);
    throw err;
  }
}

export async function cancelPayment(transactionId, reason = null) {
  try {
    const res = await fetch(`${API_BASE_URL}/transactions/cancellation`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ transaction_id: transactionId, reason }),
    });
    if (!res.ok) throw new Error("Failed to cancel payment");
    return await res.json();
  } catch (err) {
    console.error("Ошибка отмены платежа:", err);
    throw err;
  }
}

export async function getShiftTotals(shiftId) {
  try {
    const res = await fetch(`${API_BASE_URL}/transactions/shift/${shiftId}/total`);
    if (!res.ok) throw new Error("Failed to fetch shift totals");
    return await res.json();
  } catch (err) {
    console.error("Ошибка получения итогов смены:", err);
    throw err;
  }
}

export async function getOperatorReport(operatorId, startDate = null, endDate = null) {
  try {
    let url = `${API_BASE_URL}/transactions/operator/${operatorId}/report`;
    const params = [];
    if (startDate) params.push(`start_date=${startDate}`);
    if (endDate) params.push(`end_date=${endDate}`);
    if (params.length > 0) url += `?${params.join('&')}`;
    
    const res = await fetch(url);
    if (!res.ok) throw new Error("Failed to fetch operator report");
    return await res.json();
  } catch (err) {
    console.error("Ошибка получения отчета оператора:", err);
    throw err;
  }
}