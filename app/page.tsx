'use client';
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { PlusCircle, Trash2, CheckCircle, Clock, PlayCircle, Edit, Save, X, Search, Calendar, User } from 'lucide-react';
import { Toaster, toast } from 'react-hot-toast';

interface Category { id: number; name: string; color: string; }
interface Employee { id: number; name: string; }

interface Task {
  id: number;
  title: string;
  description: string | null;
  status: 'pending' | 'in_progress' | 'completed';
  category_id: number;
  priority: 'low' | 'medium' | 'high';
  due_date: string | null;
  assignee_id: number | null;
  created_at: string;
  categories?: Category; 
  employees?: Employee;
}

export default function Home() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  
  const [formData, setFormData] = useState({ 
    title: '', description: '', category_id: '', 
    priority: 'medium', due_date: '', assignee_id: '' 
  });
  const [editId, setEditId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchData = async () => {
    setIsLoading(true);
    const [tasksRes, categoriesRes, employeesRes] = await Promise.all([
      supabase.from('tasks').select('*, categories(*), employees(*)').order('created_at', { ascending: false }),
      supabase.from('categories').select('*'),
      supabase.from('employees').select('*')
    ]);
    
    if (!tasksRes.error) setTasks(tasksRes.data as Task[]);
    if (!categoriesRes.error) setCategories(categoriesRes.data as Category[]);
    if (!employeesRes.error) setEmployees(employeesRes.data as Employee[]);
    
    if (!editId) {
      setFormData(prev => ({
        ...prev,
        category_id: categoriesRes.data?.length ? String(categoriesRes.data[0].id) : '',
        assignee_id: employeesRes.data?.length ? String(employeesRes.data[0].id) : ''
      }));
    }
    setIsLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const handleCancelEdit = () => {
    setEditId(null);
    setFormData({ 
      title: '', description: '', 
      category_id: categories.length > 0 ? String(categories[0].id) : '',
      priority: 'medium', due_date: '', 
      assignee_id: employees.length > 0 ? String(employees[0].id) : ''
    });
  };

  const handleEditClick = (task: Task) => {
    setEditId(task.id);
    setFormData({
      title: task.title,
      description: task.description || '',
      category_id: String(task.category_id),
      priority: task.priority || 'medium',
      due_date: task.due_date ? task.due_date : '',
      assignee_id: task.assignee_id ? String(task.assignee_id) : (employees.length > 0 ? String(employees[0].id) : '')
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!formData.title.trim()) return toast.error('Vui lòng nhập tên công việc!');
    
    const payload = {
      title: formData.title,
      description: formData.description,
      category_id: Number(formData.category_id),
      priority: formData.priority,
      due_date: formData.due_date || null,
      assignee_id: formData.assignee_id ? Number(formData.assignee_id) : null
    };

    if (editId) {
      const { error } = await supabase.from('tasks').update(payload).eq('id', editId);
      if (error) return toast.error('Lỗi cập nhật');
      toast.success('Cập nhật thành công!');
    } else {
      const { error } = await supabase.from('tasks').insert([payload]);
      if (error) return toast.error('Lỗi thêm mới');
      toast.success('Thêm thành công!');
    }
    handleCancelEdit();
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

  const filteredTasks = tasks.filter(task => {
    const search = searchQuery.toLowerCase();
    return task.title.toLowerCase().includes(search) || 
           (task.description && task.description.toLowerCase().includes(search)) ||
           (task.employees?.name && task.employees.name.toLowerCase().includes(search));
  });

  const getPriorityColor = (priority: string) => {
    if (priority === 'high') return 'text-red-600 bg-red-50 border-red-200';
    if (priority === 'medium') return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    return 'text-blue-600 bg-blue-50 border-blue-200';
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8 font-sans">
      <Toaster position="top-right" />
      <div className="max-w-6xl mx-auto">
        <header className="mb-8">
          <h1 className="text-3xl font-extrabold text-gray-900">Cloud Task Manager</h1>
          <p className="text-gray-500 mt-2">Next.js (TypeScript) + Supabase + Netlify</p>
        </header>

        <div className={`p-6 rounded-xl shadow-sm border mb-8 transition-colors ${editId ? 'bg-blue-50 border-blue-200' : 'bg-white border-gray-100'}`}>
          <div className="flex justify-between items-center mb-4">
            <h2 className="font-bold text-lg text-gray-800">{editId ? 'Sửa công việc' : 'Thêm công việc mới'}</h2>
            {editId && <button onClick={handleCancelEdit} className="text-gray-400 hover:text-red-500 flex items-center text-sm"><X className="w-4 h-4 mr-1"/> Hủy sửa</button>}
          </div>
          
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-12 gap-4">
            <div className="md:col-span-3 flex flex-col gap-4">
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700">Tên công việc</label>
                <input type="text" value={formData.title} onChange={(e) => setFormData({...formData, title: e.target.value})} className="w-full border rounded-lg p-2 outline-none focus:ring-2 focus:ring-blue-500 text-gray-800" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700">Người phụ trách</label>
                <select value={formData.assignee_id} onChange={(e) => setFormData({...formData, assignee_id: e.target.value})} className="w-full border rounded-lg p-2 outline-none focus:ring-2 focus:ring-blue-500 text-gray-800">
                  <option value="">-- Chọn nhân viên --</option>
                  {employees.map(emp => <option key={emp.id} value={emp.id}>{emp.name}</option>)}
                </select>
              </div>
            </div>

            <div className="md:col-span-3 flex flex-col gap-4">
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700">Danh mục</label>
                <select value={formData.category_id} onChange={(e) => setFormData({...formData, category_id: e.target.value})} className="w-full border rounded-lg p-2 outline-none focus:ring-2 focus:ring-blue-500 text-gray-800">
                  {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-700">Ưu tiên</label>
                  <select value={formData.priority} onChange={(e) => setFormData({...formData, priority: e.target.value})} className="w-full border rounded-lg p-2 outline-none focus:ring-2 focus:ring-blue-500 text-gray-800">
                    <option value="low">Thấp</option>
                    <option value="medium">Trung bình</option>
                    <option value="high">Cao</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-700">Hạn chót</label>
                  <input type="date" value={formData.due_date} onChange={(e) => setFormData({...formData, due_date: e.target.value})} className="w-full border rounded-lg p-2 outline-none focus:ring-2 focus:ring-blue-500 text-gray-800" />
                </div>
              </div>
            </div>

            <div className="md:col-span-4">
              <label className="block text-sm font-medium mb-1 text-gray-700">Chi tiết công việc</label>
              <textarea value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} className="w-full border rounded-lg p-2 outline-none focus:ring-2 focus:ring-blue-500 text-gray-800 resize-none h-[110px]" />
            </div>

            <div className="md:col-span-2 flex items-end">
              <button type="submit" className={`w-full text-white font-medium p-2.5 rounded-lg flex items-center justify-center gap-2 transition-colors ${editId ? 'bg-green-600 hover:bg-green-700' : 'bg-blue-600 hover:bg-blue-700'}`}>
                {editId ? <><Save className="w-5 h-5" /> Lưu</> : <><PlusCircle className="w-5 h-5" /> Thêm</>}
              </button>
            </div>
          </form>
        </div>

        <div className="mb-6 relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input type="text" className="block w-full pl-10 pr-3 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none shadow-sm text-gray-900" placeholder="Tìm theo tên, mô tả hoặc người phụ trách..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
        </div>

        {isLoading ? <div className="text-center text-gray-500 py-10">Đang tải dữ liệu Cloud...</div> : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTasks.length === 0 ? (
              <div className="col-span-full text-center text-gray-500 py-8 bg-white rounded-xl border border-dashed">Không có dữ liệu!</div>
            ) : (
              filteredTasks.map(task => (
                <div key={task.id} className="p-5 rounded-xl shadow-sm border bg-white hover:shadow-md relative group flex flex-col">
                  
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex gap-2">
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${task.categories?.color || 'bg-gray-100 text-gray-800'}`}>{task.categories?.name}</span>
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${getPriorityColor(task.priority)}`}>
                        {task.priority === 'high' ? 'Cao' : task.priority === 'medium' ? 'TB' : 'Thấp'}
                      </span>
                    </div>
                    
                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => handleEditClick(task)} className="text-gray-400 hover:text-blue-500"><Edit className="w-4 h-4" /></button>
                      <button onClick={() => deleteTask(task.id)} className="text-gray-400 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </div>
                  
                  <h3 className={`font-semibold text-lg mb-1 ${task.status === 'completed' ? 'line-through text-gray-400' : 'text-gray-800'}`}>{task.title}</h3>
                  
                  {task.description && <p className="text-sm text-gray-500 mb-4 line-clamp-2 flex-grow">{task.description}</p>}
                  
                  <div className="grid grid-cols-2 gap-2 text-xs text-gray-500 mb-4 mt-auto">
                    <div className="flex items-center gap-1"><User className="w-3.5 h-3.5" /> {task.employees?.name || 'Chưa giao'}</div>
                    <div className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> {task.due_date ? new Date(task.due_date).toLocaleDateString('vi-VN') : 'Không có'}</div>
                  </div>
                  
                  <div className="pt-3 border-t flex items-center justify-between">
                    <select value={task.status} onChange={(e) => updateStatus(task.id, e.target.value)} className={`text-sm font-medium border-none bg-transparent outline-none cursor-pointer ${task.status === 'completed' ? 'text-green-600' : task.status === 'in_progress' ? 'text-blue-600' : 'text-gray-500'}`}>
                      <option value="pending">Cần làm</option>
                      <option value="in_progress">Đang làm</option>
                      <option value="completed">Hoàn thành</option>
                    </select>
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