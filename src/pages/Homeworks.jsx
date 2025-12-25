import { useEffect, useState } from 'react';
import { supabase } from '../supabase';

function Homeworks() {
  const [homeworks, setHomeworks] = useState([]);
  const [students, setStudents] = useState([]);
  
  const [formData, setFormData] = useState({
    student_id: '',
    topic: '',
    total_questions: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    const { data: studentsData } = await supabase.from('students').select('*');
    setStudents(studentsData || []);

    const { data: homeworksData, error } = await supabase
      .from('homeworks')
      .select('*, students(name)')
      .order('created_at', { ascending: false });
    
    if (error) console.error(error);
    else setHomeworks(homeworksData || []);
  }

  async function addHomework(e) {
    e.preventDefault();
    if (!formData.student_id || !formData.total_questions) return alert("Bilgileri doldurun!");

    const { error } = await supabase.from('homeworks').insert([{
      student_id: formData.student_id,
      topic: formData.topic,
      total_questions: parseInt(formData.total_questions),
      solved_questions: 0 
    }]);

    if (!error) {
      setFormData({ student_id: '', topic: '', total_questions: '' });
      fetchData();
    }
  }

  async function updateProgress(homework) {
    const newSolvedStr = prompt(`"${homework.topic}" için toplam çözülen soru sayısı kaç?`, homework.solved_questions);
    if (newSolvedStr === null) return;
    let newSolved = parseInt(newSolvedStr);
    const total = homework.total_questions;
    if (newSolved > total) newSolved = total;
    if (newSolved < 0) newSolved = 0;
    const isDone = newSolved >= total;

    const { error } = await supabase.from('homeworks').update({ solved_questions: newSolved, is_done: isDone }).eq('id', homework.id);
    if (!error) fetchData();
  }

  async function deleteHomework(id) {
    if(!confirm("Silmek istiyor musun?")) return;
    await supabase.from('homeworks').delete().eq('id', id);
    fetchData();
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Ödev Takibi</h1>

      {/* --- FORM KUTUSU --- */}
      <div className="bg-white p-6 rounded-lg shadow-md mb-8 border border-purple-200">
        <h2 className="text-lg font-bold mb-4 text-purple-700">Yeni Ödev Ver</h2>
        
        <form onSubmit={addHomework} className="flex flex-col gap-4">
          
          {/* ÜST KISIM: INPUTLAR (Yan Yana) */}
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

            {/* Konu (Daha geniş yer kaplar) */}
            <div className="lg:col-span-2">
              <label className="text-xs font-bold text-gray-500 block mb-1">KONU / KAYNAK</label>
              <input 
                type="text" placeholder="Örn: Limit Test 1"
                className="border p-2 rounded w-full h-11"
                value={formData.topic}
                onChange={e => setFormData({...formData, topic: e.target.value})}
              />
            </div>

            {/* Soru Hedefi */}
            <div>
              <label className="text-xs font-bold text-gray-500 block mb-1">HEDEF SORU</label>
              <input 
                type="number" placeholder="100"
                className="border p-2 rounded w-full h-11"
                value={formData.total_questions}
                onChange={e => setFormData({...formData, total_questions: e.target.value})}
              />
            </div>
          </div>

          {/* ALT KISIM: BUTON (Tek başına, en altta) */}
          <button type="submit" className="bg-purple-600 text-white w-full py-3 rounded hover:bg-purple-700 font-bold text-lg mt-2 shadow-sm transition-colors">
            KAYDET
          </button>

        </form>
      </div>

      {/* LİSTE */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {homeworks.map((hw) => {
          const percentage = Math.round((hw.solved_questions / hw.total_questions) * 100);
          return (
            <div key={hw.id} className={`bg-white p-5 rounded-lg shadow border-l-4 ${hw.is_done ? 'border-green-500' : 'border-yellow-400'}`}>
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h3 className="font-bold text-lg text-gray-800">{hw.students?.name}</h3>
                  <p className="text-sm text-gray-600">{hw.topic}</p>
                </div>
                <button onClick={() => deleteHomework(hw.id)} className="text-red-300 hover:text-red-500 text-xs">Sil</button>
              </div>
              <div className="mt-4">
                <div className="flex justify-between text-xs font-bold mb-1">
                  <span>{hw.solved_questions} / {hw.total_questions}</span>
                  <span className={`${percentage === 100 ? 'text-green-600' : 'text-blue-600'}`}>%{percentage}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden cursor-pointer" onClick={() => updateProgress(hw)}>
                  <div className={`h-4 rounded-full transition-all duration-500 ${hw.is_done ? 'bg-green-500' : 'bg-blue-500'}`} style={{ width: `${percentage}%` }}></div>
                </div>
              </div>
            </div>
          );
        })}
        {homeworks.length === 0 && <p className="text-gray-500 col-span-3 text-center">Henüz ödev verilmemiş.</p>}
      </div>
    </div>
  );
}

export default Homeworks;