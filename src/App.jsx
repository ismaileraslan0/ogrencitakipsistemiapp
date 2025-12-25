import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import Students from './pages/Students';
import Lessons from './pages/Lessons'; // <--- Yeni
import Homeworks from './pages/Homeworks';
import Exams from './pages/Exams';

function App() {
  return (
    <Router>
      <div className="flex">
        <Sidebar />
        <div className="flex-1 ml-64 p-8 min-h-screen bg-gray-100">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/students" element={<Students />} />
            <Route path="/lessons" element={<Lessons />} /> {/* <--- Yeni */}
            <Route path="/homeworks" element={<Homeworks />} />
            <Route path="/exams" element={<Exams />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
}
export default App;