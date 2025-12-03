import './App.css';
import RecordList from './components/RecordList';
import CreateCard from  './components/RecordForm';
import UserRegistration from './components/UserRegistration';
import ServicesPage from './components/ServicesPage';
import ShiftManagement from './components/ShiftManagement';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';

function Navigation() {
  return (
    <nav style={{ padding: '20px', borderBottom: '1px solid #ccc', background: '#f9f9f9' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
        <Link 
          to="/records" 
          style={{ textDecoration: 'none', color: '#007bff', fontWeight: '500' }}
        >
          📋 Записи
        </Link>
        <Link 
          to="/create" 
          style={{ textDecoration: 'none', color: '#007bff', fontWeight: '500' }}
        >
          ➕ Создать запись
        </Link>
        <Link 
          to="/register" 
          style={{ textDecoration: 'none', color: '#007bff', fontWeight: '500' }}
        >
          📝 Регистрация
        </Link>
        <Link 
          to="/services" 
          style={{ textDecoration: 'none', color: '#007bff', fontWeight: '500' }}
        >
          📦 Услуги
        </Link>
        <Link 
          to="/shifts" 
          style={{ textDecoration: 'none', color: '#007bff', fontWeight: '500' }}
        >
          🔄 Смены
        </Link>
      </div>
    </nav>
  );
}

function App() {
  return (
    <Router>
      <div>
        <Navigation />
        
        <Routes>
          <Route path="/records" element={<RecordList />} />
          <Route path="/create" element={<CreateCard />} />
          <Route path="/register" element={<UserRegistration />} />
          <Route path="/services" element={<ServicesPage />} />
          <Route path="/shifts" element={<ShiftManagement />} />
          <Route path="/" element={<RecordList />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;