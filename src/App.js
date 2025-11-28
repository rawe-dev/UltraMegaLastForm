import './App.css';
import RecordList from './components/RecordList';
import CreateCard from  './components/RecordForm';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';

function Navigation() {
  return (
    <nav style={{ padding: '20px', borderBottom: '1px solid #ccc' }}>
      <Link 
        to="/records" 
        style={{ marginRight: '15px', textDecoration: 'none', color: '#007bff' }}
      >
        📋 Список записей
      </Link>
      <Link 
        to="/create" 
        style={{ textDecoration: 'none', color: '#007bff' }}
      >
        ➕ Создать запись
      </Link>
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
        </Routes>
      </div>
    </Router>
  );
}

export default App;