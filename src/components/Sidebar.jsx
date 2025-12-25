import { Link } from 'react-router-dom';

// Sidebar: Uygulamanın sol tarafındaki sabit menü
function Sidebar() {
  return (
    // h-screen: Tam ekran yüksekliği
    // w-64: Genişlik
    // bg-gray-800: Koyu gri arka plan
    <div className="h-screen w-64 bg-gray-800 text-white fixed left-0 top-0 flex flex-col p-4">
      
      {/* Logo / Başlık Alanı */}
      <h1 className="text-2xl font-bold mb-10 text-center">
        Ders CRM 🚀
      </h1>

      {/* Menü Linkleri */}
      <nav className="flex flex-col gap-2">
        {/* hover:bg-gray-700 -> Üzerine gelince rengi değiştirir */}
        <Link to="/" className="p-3 rounded hover:bg-gray-700 transition-colors">
          📊 Dashboard
        </Link>
        <Link to="/students" className="p-3 rounded hover:bg-gray-700 transition-colors">
          🎓 Öğrenciler
        </Link>
        <Link to="/lessons" className="p-3 rounded hover:bg-gray-700 transition-colors">
          📅 Ders Programı
        </Link>
        <Link to="/homeworks" className="p-3 rounded hover:bg-gray-700 transition-colors">
          📚 Ödev Takibi
        </Link>
        <Link to="/exams" className="p-3 rounded hover:bg-gray-700 transition-colors">
          📈 Deneme Analizi
        </Link>
      </nav>

    </div>
  );
}

export default Sidebar;