import { useEffect, useState } from 'react';
import { supabase } from '../supabase';

function Students() {
  const [students, setStudents] = useState([]);
  
  // Yeni öğrenci formu verileri
  const [formData, setFormData] = useState({
    name: '', grade: '', phone: ''
  });

  useEffect(() => {
    getStudents();
  }, []);

  // Öğrencileri ve BAKİYELERİNİ getir
  async function getStudents() {
    const { data, error } = await supabase
      .from('students')
      .select('*')
      .order('name', { ascending: true }); // İsme göre sıralı olsun
    
    if (error) console.error('Hata:', error);
    else setStudents(data);
  }

  // Yeni Öğrenci Ekle
  async function addStudent(e) {
    e.preventDefault();
    if (!formData.name) return alert("İsim şart!");

    const { error } = await supabase
      .from('students')
      .insert([{ 
        name: formData.name, 
        grade: formData.grade, 
        phone: formData.phone,
        balance: 0 // Yeni öğrencinin borcu 0'dır
      }]);

    if (!error) {
      setFormData({ name: '', grade: '', phone: '' });
      getStudents();
    }
  }

  // Öğrenci Sil
  async function deleteStudent(id) {
    if (!window.confirm("Öğrenciyi ve tüm geçmişini silmek istediğine emin misin?")) return;
    await supabase.from('students').delete().eq('id', id);
    getStudents();
  }

  // --- KRİTİK BÖLÜM: ÖDEME ALMA FONKSİYONU ---
  async function receivePayment(student) {
    // 1. Kullanıcıdan tutarı iste
    const amountStr = prompt(`${student.name} için tahsil edilecek tutarı girin (TL):`);
    if (!amountStr) return; // İptal ettiyse dur.

    const amount = parseFloat(amountStr);
    if (isNaN(amount) || amount <= 0) return alert("Geçersiz tutar!");

    // 2. Ödeme tablosuna kaydet (Tarihçesi olsun)
    const { error: payError } = await supabase.from('payments').insert([{
      student_id: student.id,
      amount: amount,
      notes: 'Manuel Tahsilat'
    }]);

    if (payError) return alert("Ödeme kaydedilemedi!");

    // 3. Öğrencinin bakiyesini GÜNCELLE (Mevcut Borç - Ödenen)
    const newBalance = (student.balance || 0) - amount;

    const { error: updateError } = await supabase
      .from('students')
      .update({ balance: newBalance })
      .eq('id', student.id);

    if (updateError) {
      alert("Bakiye güncellenemedi!");
    } else {
      alert(`✅ ${amount} TL tahsil edildi. Yeni Bakiye: ${newBalance} TL`);
      getStudents(); // Listeyi yenile ki yeni bakiyeyi görelim
    }
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Öğrenci & Finans Yönetimi</h1>

      {/* Form Alanı */}
      <div className="bg-white p-6 rounded-lg shadow-md mb-8 border-l-4 border-blue-500">
        <h2 className="text-lg font-semibold mb-4">Yeni Öğrenci Kartı Aç</h2>
        <form onSubmit={addStudent} className="flex flex-col md:flex-row gap-4">
          <input
            type="text" placeholder="Adı Soyadı"
            className="border p-2 rounded flex-1"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          />
          <input
            type="text" placeholder="Sınıfı"
            className="border p-2 rounded w-full md:w-32"
            value={formData.grade}
            onChange={(e) => setFormData({ ...formData, grade: e.target.value })}
          />
          <input
            type="text" placeholder="Telefon"
            className="border p-2 rounded w-full md:w-40"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
          />
          <button type="submit" className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 font-bold">
            KAYDET
          </button>
        </form>
      </div>

      {/* Liste Alanı */}
      <div className="bg-white shadow-lg rounded-lg overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-100 border-b">
            <tr>
              <th className="p-4">Öğrenci Adı</th>
              <th className="p-4">İletişim</th>
              <th className="p-4 text-right">Bakiye (Borç)</th>
              <th className="p-4 text-right">İşlemler</th>
            </tr>
          </thead>
          <tbody>
            {students.map((student) => (
              <tr key={student.id} className="border-b hover:bg-gray-50">
                
                <td className="p-4">
                  <div className="font-bold text-lg text-gray-800">{student.name}</div>
                  <div className="text-sm text-gray-500">{student.grade}</div>
                </td>

                <td className="p-4 text-gray-600">
                  {student.phone || '-'}
                </td>

                {/* BAKİYE GÖSTERİMİ */}
                <td className="p-4 text-right">
                  <div className={`font-mono text-xl font-bold ${student.balance > 0 ? 'text-red-600' : 'text-green-600'}`}>
                    {student.balance} ₺
                  </div>
                  <div className="text-xs text-gray-400">Güncel Borç</div>
                </td>

                {/* BUTONLAR */}
                <td className="p-4 text-right space-x-2">
                  
                  {/* Ödeme Al Butonu */}
                  <button 
                    onClick={() => receivePayment(student)}
                    className="bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded text-sm font-bold shadow-sm transition-all"
                  >
                    💰 Ödeme Al
                  </button>

                  <button 
                    onClick={() => deleteStudent(student.id)}
                    className="bg-gray-100 hover:bg-red-100 text-red-500 hover:text-red-700 px-3 py-2 rounded text-sm font-bold transition-all"
                  >
                    Sil
                  </button>
                </td>

              </tr>
            ))}
            {students.length === 0 && (
              <tr><td colSpan="4" className="p-6 text-center text-gray-500">Kayıtlı öğrenci yok.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default Students;