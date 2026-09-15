/**
 * Main App Component
 * Entry point for the DUTY application with routing
 */

import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { DutyList } from './components/DutyList';
import { DutyFormPage } from './pages/DutyFormPage/DutyFormPage';
import './App.css';

function App() {
  return (
    <BrowserRouter>
      <div className="app">
        <Routes>
          <Route path="/" element={<DutyList />} />
          <Route path="/duty/new" element={<DutyFormPage />} />
          <Route path="/duty/edit/:id" element={<DutyFormPage />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;
