import { useEffect, useState } from 'react';
import { supabase } from '../supabase';

function Exams() {
  const [exams, setExams] = useState([]);
  const [students, setStudents] = useState([]);
  const [formData, setFormData] = useState({ student_id: '', exam_name: '', tyt_net: '', ayt_net: '' });

  useEffect(() => { fetchData(); }, []);

  async function fetchData() {
    const { data: studentsData } = await supabase.from('students').select('*');
    setStudents(studentsData || []);
    const { data: examsData, error } = await supabase.from('exams').select('*, students(name)').order('created_at', { ascending: false });
    if (!error) setExams(examsData || []);
  }

  async function addExam(e) {
    e.preventDefault();
    if (!formData.student_id || !formData.exam_name) return alert("Bilgileri girin!");
    const { error } = await supabase.from('exams').insert([{
      student_id: formData.student_id,
      exam_name: formData.exam_name,
      tyt_net: parseFloat(formData.tyt_net) || 0,
      ayt_net: parseFloat(formData.ayt_net) || 0
    }]);
    if (!error) {
      setFormData({ student_id: '', exam_name: '', tyt_net: '', ayt_net: '' });
      fetchData();
    }
  }

  async function deleteExam(id) {
    if(!confirm("Silmek istiyor musun?")) return;
    await supabase.from('exams').delete().eq('id', id);
    fetchData();
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Deneme Analizi</h1>

      {/* --- FORM KUTUSU --- */}
      <div className="bg-white p-6 rounded-lg shadow-md mb-8 border-l-4 border-orange-500">
        <h2 className="text-lg font-bold mb-4 text-gray-700">Yeni Deneme Gir</h2>
        
        <form onSubmit={addExam} className="flex flex-col gap-4">
          
          {/* ÜST KISIM: INPUTLAR */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            
            {/* Öğrenci */}
            <div>
              <label className="text-xs font-bold text-gray-500 block mb-1">ÖĞRENCİ</label>
              <select 
                className="border p-2 rounded w-full h-11 bg-gray-50"
                value={formData.student_id}
                onChange={e => setFormData({...formData, student_id: e.target.value})}
              >
                <option value="">Seçiniz...</option>
                {students.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>

            {/* Deneme Adı */}
            <div>
              <label className="text-xs font-bold text-gray-500 block mb-1">DENEME ADI</label>
              <input 
                type="text" placeholder="Örn: Özdebir TYT-1"
                className="border p-2 rounded w-full h-11"
                value={formData.exam_name}
                onChange={e => setFormData({...formData, exam_name: e.target.value})}
              />
            </div>

            {/* TYT Net */}
            <div>
              <label className="text-xs font-bold text-blue-600 block mb-1">TYT NET</label>
              <input 
                type="number" step="0.25" placeholder="0"
                className="border p-2 rounded w-full h-11 border-blue-200 bg-blue-50"
                value={formData.tyt_net}
                onChange={e => setFormData({...formData, tyt_net: e.target.value})}
              />
            </div>

            {/* AYT Net */}
            <div>
              <label className="text-xs font-bold text-green-600 block mb-1">AYT NET</label>
              <input 
                type="number" step="0.25" placeholder="0"
                className="border p-2 rounded w-full h-11 border-green-200 bg-green-50"
                value={formData.ayt_net}
                onChange={e => setFormData({...formData, ayt_net: e.target.value})}
              />
            </div>
          </div>

          {/* ALT KISIM: BUTON (Tek başına, en altta) */}
          <button type="submit" className="bg-orange-600 text-white w-full py-3 rounded hover:bg-orange-700 font-bold text-lg mt-2 shadow-sm transition-colors">
            KAYDET
          </button>
        </form>
      </div>

      {/* LİSTE */}
      <div className="grid grid-cols-1 gap-4">
        {exams.map((exam) => {
          const tytPercent = Math.min((exam.tyt_net / 120) * 100, 100);
          const aytPercent = Math.min((exam.ayt_net / 80) * 100, 100);
          return (
            <div key={exam.id} className="bg-white p-5 rounded-lg shadow flex flex-col md:flex-row gap-6 items-center">
              <div className="w-full md:w-1/4">
                <div className="text-sm text-gray-400">{new Date(exam.created_at).toLocaleDateString('tr-TR')}</div>
                <div className="font-bold text-lg text-gray-800">{exam.students?.name}</div>
                <div className="text-sm text-gray-600">{exam.exam_name}</div>
                <button onClick={() => deleteExam(exam.id)} className="text-red-400 hover:text-red-600 text-xs mt-2 underline">Sil</button>
              </div>
              <div className="w-full md:w-3/4 flex flex-col gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 text-xs font-bold text-blue-600 text-right">TYT</div>
                  <div className="flex-1 bg-gray-200 rounded-full h-4 overflow-hidden"><div style={{ width: `${tytPercent}%` }} className="h-full bg-blue-500 rounded-full"></div></div>
                  <div className="w-16 font-mono font-bold text-blue-700 text-right">{exam.tyt_net}</div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-12 text-xs font-bold text-green-600 text-right">AYT</div>
                  <div className="flex-1 bg-gray-200 rounded-full h-4 overflow-hidden"><div style={{ width: `${aytPercent}%` }} className="h-full bg-green-500 rounded-full"></div></div>
                  <div className="w-16 font-mono font-bold text-green-700 text-right">{exam.ayt_net}</div>
                </div>
              </div>
            </div>
          );
        })}
        {exams.length === 0 && <div className="text-center text-gray-500 py-10 bg-white rounded shadow">Henüz deneme girilmedi.</div>}
      </div>
    </div>
  );
}

export default Exams;