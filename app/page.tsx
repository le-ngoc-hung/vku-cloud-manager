'use client';
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { PlusCircle, Trash2, CheckCircle, Clock, PlayCircle, Edit, Save, X, Search } from 'lucide-react';
import { Toaster, toast } from 'react-hot-toast';

interface Category {
  id: number;
  name: string;
  color: string;
}

interface Task {
  id: number;
  title: string;
  description: string | null;
  status: 'pending' | 'in_progress' | 'completed';
  category_id: number;
  created_at: string;
  categories?: Category; 
}

export default function Home() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  
  const [formData, setFormData] = useState({ title: '', description: '', category_id: '' });
  const [editId, setEditId] = useState<number | null>(null);
  
  // State mới cho tính năng Tìm kiếm
  const [searchQuery, setSearchQuery] = useState('');

  const fetchData = async () => {
    setIsLoading(true);
    const [tasksResponse, categoriesResponse] = await Promise.all([
      supabase.from('tasks').select('*, categories(*)').order('created_at', { ascending: false }),
      supabase.from('categories').select('*')
    ]);
    
    if (!tasksResponse.error) setTasks(tasksResponse.data as Task[]);
    if (!categoriesResponse.error) {
      setCategories(categoriesResponse.data as Category[]);
      if (categoriesResponse.data.length > 0 && !editId) {
        setFormData(prev => ({ ...prev, category_id: String(categoriesResponse.data[0].id) }));
      }
    }
    setIsLoading(false);
  };

  useEffect(() => { 
    fetchData(); 
  }, []);

  const handleCancelEdit = () => {
    setEditId(null);
    setFormData({ title: '', description: '', category_id: categories.length > 0 ? String(categories[0].id) : '' });
  };

  const handleEditClick = (task: Task) => {
    setEditId(task.id);
    setFormData({
      title: task.title,
      description: task.description || '',
      category_id: String(task.category_id)
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!formData.title.trim()) return toast.error('Vui lòng nhập tên công việc!');
    
    const payload = {
      title: formData.title,
      description: formData.description,
      category_id: Number(formData.category_id)
    };

    if (editId) {
      const { error } = await supabase.from('tasks').update(payload).eq('id', editId);
      if (error) return toast.error('Lỗi khi cập nhật dữ liệu');
      toast.success('Cập nhật thành công!');
      handleCancelEdit();
    } else {
      const { error } = await supabase.from('tasks').insert([payload]);
      if (error) return toast.error('Lỗi khi thêm dữ liệu');
      toast.success('Thêm thành công!');
      handleCancelEdit();
    }
    
    fetchData();
  };

  const updateStatus = async (id: number, newStatus: string) => {
    await supabase.from('tasks').update({ status: newStatus }).eq('id', id);
    fetchData();
  };

  const deleteTask = async (id: number) => {
    await supabase.from('tasks').delete().eq('id', id);
    toast.success('Đã xóa');
    fetchData();
  };

  const getStatusIcon = (status: string) => {
    if (status === 'completed') return <CheckCircle className="w-5 h-5 text-green-500" />;
    if (status === 'in_progress') return <PlayCircle className="w-5 h-5 text-blue-500" />;
    return <Clock className="w-5 h-5 text-gray-400" />;
  };

  // Logic lọc dữ liệu dựa trên từ khóa tìm kiếm
  const filteredTasks = tasks.filter(task => {
    const searchLower = searchQuery.toLowerCase();
    const titleMatch = task.title.toLowerCase().includes(searchLower);
    const descMatch = task.description ? task.description.toLowerCase().includes(searchLower) : false;
    return titleMatch || descMatch;
  });

  return (
    <div className="min-h-screen bg-gray-50 p-8 font-sans">
      <Toaster position="top-right" />
      <div className="max-w-5xl mx-auto">
        <header className="mb-8">
          <h1 className="text-3xl font-extrabold text-gray-900">Cloud Task Manager</h1>
          <p className="text-gray-500 mt-2">Next.js (TypeScript) + Supabase + Netlify</p>
        </header>

        <div className={`p-6 rounded-xl shadow-sm border mb-8 transition-colors ${editId ? 'bg-blue-50 border-blue-200' : 'bg-white border-gray-100'}`}>
          <div className="flex justify-between items-center mb-4">
            <h2 className="font-bold text-lg text-gray-800">{editId ? 'Sửa công việc' : 'Thêm công việc mới'}</h2>
            {editId && (
              <button onClick={handleCancelEdit} className="text-gray-400 hover:text-red-500 flex items-center text-sm">
                <X className="w-4 h-4 mr-1"/> Hủy sửa
              </button>
            )}
          </div>
          
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-12 gap-4">
            <div className="md:col-span-4 flex flex-col gap-4">
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700">Tên công việc</label>
                <input type="text" value={formData.title} onChange={(e) => setFormData({...formData, title: e.target.value})} className="w-full border border-gray-300 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-blue-500 text-gray-800" placeholder="Ví dụ: Thiết kế Database" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700">Danh mục</label>
                <select value={formData.category_id} onChange={(e) => setFormData({...formData, category_id: e.target.value})} className="w-full border border-gray-300 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-blue-500 text-gray-800">
                  {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
                </select>
              </div>
            </div>

            <div className="md:col-span-6">
              <label className="block text-sm font-medium mb-1 text-gray-700">Chi tiết công việc (Không bắt buộc)</label>
              <textarea 
                value={formData.description} 
                onChange={(e) => setFormData({...formData, description: e.target.value})} 
                className="w-full border border-gray-300 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-blue-500 text-gray-800 resize-none h-[116px]" 
                placeholder="Nhập mô tả hoặc ghi chú..."
              />
            </div>

            <div className="md:col-span-2 flex items-end">
              <button type="submit" className={`w-full text-white font-medium p-2.5 rounded-lg flex items-center justify-center gap-2 transition-colors ${editId ? 'bg-green-600 hover:bg-green-700' : 'bg-blue-600 hover:bg-blue-700'}`}>
                {editId ? <><Save className="w-5 h-5" /> Lưu</> : <><PlusCircle className="w-5 h-5" /> Thêm</>}
              </button>
            </div>
          </form>
        </div>

        {/* Thanh tìm kiếm */}
        <div className="mb-6 relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            className="block w-full pl-10 pr-3 py-3 border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 shadow-sm transition-shadow"
            placeholder="Tìm kiếm công việc theo tên hoặc mô tả..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {isLoading ? <div className="text-center text-gray-500 py-10">Đang kết nối Cloud...</div> : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
             {/* Hiển thị filteredTasks thay vì tasks */}
            {filteredTasks.length === 0 ? (
              <div className="col-span-full text-center text-gray-500 py-8 bg-white rounded-xl border border-dashed border-gray-300">
                Không tìm thấy công việc nào phù hợp!
              </div>
            ) : (
              filteredTasks.map(task => (
                <div key={task.id} className={`p-5 rounded-xl shadow-sm border transition-shadow relative group ${editId === task.id ? 'border-blue-400 bg-blue-50' : 'bg-white hover:shadow-md'}`}>
                  <div className="flex justify-between items-start mb-3">
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${task.categories?.color || 'bg-gray-100 text-gray-800'}`}>{task.categories?.name}</span>
                    
                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => handleEditClick(task)} className="text-gray-300 hover:text-blue-500"><Edit className="w-4 h-4" /></button>
                      <button onClick={() => deleteTask(task.id)} className="text-gray-300 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </div>
                  
                  <h3 className={`font-semibold text-lg mb-1 ${task.status === 'completed' ? 'line-through text-gray-400' : 'text-gray-800'}`}>{task.title}</h3>
                  
                  {task.description && (
                    <div className="text-sm text-gray-600 mb-4 bg-gray-50 p-2 rounded border border-gray-100 line-clamp-3">
                      {task.description}
                    </div>
                  )}
                  
                  <div className="mt-4 pt-4 border-t flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(task.status)}
                      <select value={task.status} onChange={(e) => updateStatus(task.id, e.target.value)} className="text-sm border-none bg-transparent font-medium outline-none text-gray-600 cursor-pointer focus:ring-0">
                        <option value="pending">Cần làm</option>
                        <option value="in_progress">Đang làm</option>
                        <option value="completed">Hoàn thành</option>
                      </select>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}