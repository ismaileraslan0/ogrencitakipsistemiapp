import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom'; // Sayfa geçişleri için
import { supabase } from '../supabase';

function Dashboard() {
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalDebt: 0,
    todayLessonCount: 0
  });

  const [todaySchedule, setTodaySchedule] = useState([]);
  const [debtors, setDebtors] = useState([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  async function fetchDashboardData() {
    // 1. ÖĞRENCİ VERİLERİNİ ÇEK (Sayı ve Borç Hesabı için)
    const { data: students } = await supabase.from('students').select('*');
    
    // Toplam Borcu Hesapla (Reduce fonksiyonu toplama yapar)
    const totalDebt = students?.reduce((sum, s) => sum + (parseFloat(s.balance) || 0), 0) || 0;
    
    // Borçlu Öğrencileri Filtrele (Bakiyesi 0'dan büyük olanlar)
    const debtorList = students?.filter(s => s.balance > 0) || [];

    // 2. DERSLERİ ÇEK (Bugünü bulmak için)
    // Gerçek projelerde tarih sorgusu veritabanında yapılır ama şimdilik JS ile filtreleyelim (Daha kolay)
    const { data: lessons } = await supabase
      .from('lessons')
      .select('*, students(name)')
      .eq('is_done', false) // Henüz yapılmamış dersler
      .order('date', { ascending: true });

    // Bugünün tarihini al (Gün/Ay/Yıl olarak)
    const todayStr = new Date().toLocaleDateString('tr-TR');

    // Sadece "BUGÜN" olan dersleri ayıkla
    const todaysLessons = lessons?.filter(l => {
      const lessonDate = new Date(l.date).toLocaleDateString('tr-TR');
      return lessonDate === todayStr;
    }) || [];

    // 3. VERİLERİ KASAYA (STATE) KOY
    setStats({
      totalStudents: students?.length || 0,
      totalDebt: totalDebt,
      todayLessonCount: todaysLessons.length
    });

    setTodaySchedule(todaysLessons);
    setDebtors(debtorList);
  }

  // Tarih formatlayıcı (Saat için)
  function formatTime(dateString) {
    return new Date(dateString).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
  }

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-8 text-gray-800">Hoş Geldin Hocam! 👋</h1>

      {/* --- ÜST BİLGİ KARTLARI --- */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        
        {/* Kart 1: Öğrenci Sayısı */}
        <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-blue-500">
          <div className="text-gray-500 text-sm font-bold uppercase">Toplam Öğrenci</div>
          <div className="text-3xl font-bold text-gray-800">{stats.totalStudents}</div>
        </div>

        {/* Kart 2: Toplam Alacak (Para) */}
        <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-red-500">
          <div className="text-gray-500 text-sm font-bold uppercase">Toplam Alacak</div>
          <div className="text-3xl font-bold text-red-600">{stats.totalDebt} ₺</div>
          <div className="text-xs text-gray-400 mt-1">Tahsil edilmeyi bekleyen</div>
        </div>

        {/* Kart 3: Bugünün Dersleri */}
        <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-green-500">
          <div className="text-gray-500 text-sm font-bold uppercase">Bugünkü Dersler</div>
          <div className="text-3xl font-bold text-gray-800">{stats.todayLessonCount}</div>
          <div className="text-xs text-gray-400 mt-1">Adet planlanmış ders</div>
        </div>
      </div>

      {/* --- ALT BÖLÜM: İKİ SÜTUN --- */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* SOL: BUGÜNÜN PROGRAMI */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="bg-gray-800 text-white p-4 flex justify-between items-center">
            <h2 className="font-bold">📅 Bugünün Programı</h2>
            <Link to="/lessons" className="text-xs bg-gray-700 px-2 py-1 rounded hover:bg-gray-600">Tümünü Gör</Link>
          </div>
          
          <div className="p-4">
            {todaySchedule.length === 0 ? (
              <p className="text-gray-500 text-center py-4">Bugün için ders görünmüyor. Dinlenme zamanı! ☕</p>
            ) : (
              <ul className="divide-y">
                {todaySchedule.map(lesson => (
                  <li key={lesson.id} className="py-3 flex justify-between items-center">
                    <div>
                      <div className="font-bold text-lg">{formatTime(lesson.date)}</div>
                      <div className="text-sm text-gray-600">{lesson.topic}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-blue-600">{lesson.students?.name}</div>
                      <div className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded-full inline-block">
                        {lesson.price} ₺
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* SAĞ: ALACAKLILAR LİSTESİ (BORÇLULAR) */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="bg-red-600 text-white p-4 flex justify-between items-center">
            <h2 className="font-bold">⚠️ Ödemesi Gecikenler</h2>
            <Link to="/students" className="text-xs bg-red-700 px-2 py-1 rounded hover:bg-red-800">Detay Gör</Link>
          </div>
          
          <div className="p-4">
            {debtors.length === 0 ? (
              <p className="text-green-600 text-center py-4 font-bold">Harika! Kimsenin borcu yok. 🤑</p>
            ) : (
              <table className="w-full">
                <tbody>
                  {debtors.map(student => (
                    <tr key={student.id} className="border-b last:border-0 hover:bg-red-50 transition-colors">
                      <td className="py-3 font-medium text-gray-700">{student.name}</td>
                      <td className="py-3 text-right text-red-600 font-bold">{student.balance} ₺</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}

export default Dashboard;