import { useEffect, useState } from 'react';
import { supabase } from '../supabase';

// Hazır Konu Şablonları
const KONU_SABLONLARI = [
  "Genel Durum Görüşmesi",
  "Deneme Analizi",
  "Ödev Kontrolü & Soru Çözümü",
  "TYT Matematik Tekrar",
  "AYT Deneme Çözümü",
  "Türev Giriş",
  "İntegral Uygulamaları",
  "Problemler Kampı"
];

function Lessons() {
  const [lessons, setLessons] = useState([]);
  const [students, setStudents] = useState([]);
  
  // Form Verileri
  const [formData, setFormData] = useState({
    student_id: '',
    date: '',
    topic: '',
    price: '',
    weeks: 1 // Varsayılan: 1 ders
  });

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    // Öğrencileri çek
    const { data: studentsData } = await supabase.from('students').select('*');
    setStudents(studentsData || []);

    // Dersleri çek (Öğrenci adı ve ID'si ile birlikte)
    const { data: lessonsData, error } = await supabase
      .from('lessons')
      .select('*, students(name, balance)')
      .order('date', { ascending: true });
    
    if (error) console.error('Veri çekme hatası:', error);
    else setLessons(lessonsData || []);
  }

  // --- TOPLU DERS EKLEME ---
  async function addLesson(e) {
    e.preventDefault();
    if (!formData.student_id || !formData.date) return alert("Öğrenci ve Tarih seçmelisiniz!");

    const lessonsToInsert = [];
    const baseDate = new Date(formData.date);

    // Hafta sayısı kadar döngü kuruyoruz
    for (let i = 0; i < formData.weeks; i++) {
      const nextDate = new Date(baseDate);
      nextDate.setDate(baseDate.getDate() + (i * 7)); // Her turda 7 gün ekle

      lessonsToInsert.push({
        student_id: formData.student_id,
        date: nextDate.toISOString(),
        topic: formData.topic,
        price: formData.price || 0
      });
    }

    const { error } = await supabase.from('lessons').insert(lessonsToInsert);

    if (error) {
      console.error(error);
      alert("Ders eklenirken hata oluştu!");
    } else {
      alert(`${formData.weeks} adet ders planlandı!`);
      // Formu temizle (Tarih ve öğrenci kalsın kolaylık olsun diye)
      setFormData({ ...formData, topic: '', price: '', weeks: 1 });
      fetchData();
    }
  }

  // --- DERS SİLME ---
  async function deleteLesson(id) {
    if(!confirm("Bu dersi iptal etmek istiyor musun?")) return;
    await supabase.from('lessons').delete().eq('id', id);
    fetchData();
  }

  // --- DERSİ TAMAMLAMA VE BAKİYE GÜNCELLEME (Fixlenmiş Kod) ---
  async function completeLesson(lesson) {
    if (lesson.is_done) return;

    // 1. Not iste
    const note = prompt("Ders tamamlanıyor. Notunuz:", "İşlendi.");
    if (note === null) return; // İptal'e basarsa dur.

    // 2. Ders tablosunu güncelle
    const { error: lessonError } = await supabase
      .from('lessons')
      .update({ is_done: true, notes: note })
      .eq('id', lesson.id);

    if (lessonError) return alert("Hata! Ders güncellenemedi.");

    // 3. Öğrencinin MEVCUT bakiyesini bul
    const { data: studentData, error: fetchError } = await supabase
      .from('students')
      .select('balance')
      .eq('id', lesson.student_id)
      .single();
    
    if (fetchError) return alert("Öğrenci bakiyesi bulunamadı!");

    // 4. Matematik İşlemi (Sayı olduğundan emin oluyoruz)
    const currentBalance = parseFloat(studentData.balance) || 0;
    const lessonPrice = parseFloat(lesson.price) || 0;
    const newBalance = currentBalance + lessonPrice;

    // 5. Yeni bakiyeyi öğrenciye yaz
    const { error: updateError } = await supabase
      .from('students')
      .update({ balance: newBalance })
      .eq('id', lesson.student_id);

    if (updateError) {
      alert("Ders bitti ama bakiye yansıtılamadı! (SQL İzni Eksik Olabilir)");
    } else {
      fetchData(); // Listeyi yenile
    }
  }

  // Tarih formatlama yardımcısı
  function formatDate(dateString) {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleString('tr-TR', {
      weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Ders Programı</h1>

      {/* --- EKLEME FORMU --- */}
      <div className="bg-white p-6 rounded-lg shadow-md mb-8 border border-gray-200">
        <h2 className="text-lg font-bold mb-4 text-gray-700">Ders Planla</h2>
        <form onSubmit={addLesson} className="flex flex-col gap-4">
          
          <div className="flex gap-4">
            <div className="flex-1">
              <label className="text-xs font-bold text-gray-500">ÖĞRENCİ</label>
              <select 
                className="border p-2 rounded w-full mt-1"
                value={formData.student_id}
                onChange={e => setFormData({...formData, student_id: e.target.value})}
              >
                <option value="">Seçiniz...</option>
                {students.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>

            <div className="flex-1">
              <label className="text-xs font-bold text-gray-500">BAŞLANGIÇ TARİHİ</label>
              <input 
                type="datetime-local" 
                className="border p-2 rounded w-full mt-1"
                value={formData.date}
                onChange={e => setFormData({...formData, date: e.target.value})}
              />
            </div>
          </div>

          <div className="flex gap-4 items-end">
            <div className="flex-[2]">
              <label className="text-xs font-bold text-gray-500">KONU</label>
              <div className="flex gap-2 mt-1">
                <select 
                  className="border p-2 rounded w-1/3 bg-gray-50"
                  onChange={(e) => setFormData({...formData, topic: e.target.value})}
                >
                  <option value="">Şablon...</option>
                  {KONU_SABLONLARI.map(k => <option key={k} value={k}>{k}</option>)}
                </select>
                <input 
                  type="text" placeholder="Konu yazın..."
                  className="border p-2 rounded w-2/3"
                  value={formData.topic}
                  onChange={e => setFormData({...formData, topic: e.target.value})}
                />
              </div>
            </div>

            <div className="w-24">
              <label className="text-xs font-bold text-gray-500">ÜCRET</label>
              <input 
                type="number" placeholder="0"
                className="border p-2 rounded w-full mt-1"
                value={formData.price}
                onChange={e => setFormData({...formData, price: e.target.value})}
              />
            </div>

            <div className="w-24">
              <label className="text-xs font-bold text-green-600">TEKRAR</label>
              <input 
                type="number" min="1" max="52"
                className="border p-2 rounded w-full mt-1 border-green-200 bg-green-50"
                value={formData.weeks}
                onChange={e => setFormData({...formData, weeks: e.target.value})}
              />
            </div>

            <button type="submit" className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 font-bold h-11">
              PLANLA
            </button>
          </div>
        </form>
      </div>

      {/* --- LİSTE --- */}
      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-100 border-b">
            <tr>
              <th className="p-4">Tarih</th>
              <th className="p-4">Öğrenci</th>
              <th className="p-4">Konu & Not</th>
              <th className="p-4">Durum</th>
              <th className="p-4 text-right">İşlem</th>
            </tr>
          </thead>
          <tbody>
            {lessons.map((lesson) => (
              <tr key={lesson.id} className={`border-b ${lesson.is_done ? 'bg-green-50' : 'hover:bg-gray-50'}`}>
                
                <td className="p-4 text-gray-700 font-medium text-sm whitespace-nowrap">
                  {formatDate(lesson.date)}
                </td>
                
                <td className="p-4">
                  <div className="font-bold text-blue-600">{lesson.students?.name || 'Silinmiş'}</div>
                  <div className="text-xs text-gray-500">{lesson.price} ₺</div>
                </td>
                
                <td className="p-4">
                  <div className="text-gray-800 font-medium">{lesson.topic}</div>
                  {lesson.notes && (
                    <div className="text-xs text-gray-500 mt-1 italic">
                      📝 {lesson.notes}
                    </div>
                  )}
                </td>

                <td className="p-4">
                  {lesson.is_done ? (
                    <span className="text-green-700 font-bold text-xs border border-green-200 bg-white px-2 py-1 rounded">
                      Tamamlandı
                    </span>
                  ) : (
                    <button 
                      onClick={() => completeLesson(lesson)}
                      className="bg-gray-800 hover:bg-green-600 text-white px-3 py-1 rounded text-sm transition-all"
                    >
                      ✅ Tamamla
                    </button>
                  )}
                </td>
                
                <td className="p-4 text-right">
                  {!lesson.is_done && (
                    <button onClick={() => deleteLesson(lesson.id)} className="text-red-400 hover:text-red-600 text-sm font-bold">
                      İptal
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {lessons.length === 0 && (
               <tr><td colSpan="5" className="p-6 text-center text-gray-500">Planlanmış ders yok.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default Lessons;