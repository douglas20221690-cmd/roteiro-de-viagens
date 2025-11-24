import React, { useState, useEffect, useRef } from 'react';
import { Layout } from './components/Layout';
import { Button } from './components/Button';
import { TripCard } from './components/TripCard';
import { Trip, User, ViewState, Activity, DayItinerary, ActivityType, CurrencyConfig, Expense, Attachment, TripDocument } from './types';
import * as storageService from './services/storage';
import { MapPin, Calendar, DollarSign, Plus, Clock, Map, Utensils, Bed, Camera, ArrowLeft, Trash2, Edit2, Plane, Train, Bus, FileText, PieChart, Image as ImageIcon, X, Save, Upload, Banknote, Settings, GraduationCap, Timer, AlertTriangle, ExternalLink, ChevronRight, CheckSquare, FolderOpen, Eye, Mail, Lock, RefreshCw } from 'lucide-react';

// --- Utils ---

const getLocalDate = (dateStr: string) => {
  if (!dateStr) return new Date();
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day);
};

const getDaysUntil = (dateStr: string) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = getLocalDate(dateStr);
  const diffTime = target.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
};

const compressImage = async (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 800;
        const scaleSize = MAX_WIDTH / img.width;
        canvas.width = MAX_WIDTH;
        canvas.height = img.height * scaleSize;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', 0.7)); 
      };
      img.onerror = (err) => reject(err);
    };
    reader.onerror = (err) => reject(err);
  });
};

const formatMoney = (amount: number, currency: string = 'BRL') => {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency }).format(amount);
};

// --- Sub-components ---

const ConfirmModal = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title, 
  message 
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  onConfirm: () => void; 
  title: string; 
  message: string; 
}) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl max-w-xs w-full p-6 transform transition-all scale-100">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-50 mb-4">
           <Trash2 className="h-7 w-7 text-red-500" />
        </div>
        <h3 className="text-xl font-bold text-center text-slate-900 mb-2">{title}</h3>
        <p className="text-sm text-center text-slate-500 mb-8 leading-relaxed">{message}</p>
        <div className="grid grid-cols-2 gap-3">
          <button 
            type="button"
            onClick={onClose} 
            className="w-full py-3 rounded-xl border border-slate-200 text-slate-700 font-semibold hover:bg-slate-50 transition-colors"
          >
            Cancelar
          </button>
          <button 
            type="button"
            onClick={onConfirm} 
            className="w-full py-3 rounded-xl bg-red-500 text-white font-semibold hover:bg-red-600 shadow-lg shadow-red-200 transition-colors"
          >
            Excluir
          </button>
        </div>
      </div>
    </div>
  );
};

const ImageViewerModal = ({ src, onClose }: { src: string | null; onClose: () => void }) => {
  if (!src) return null;
  return (
    <div className="fixed inset-0 z-[70] bg-black flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute top-4 right-4">
        <button onClick={onClose} className="text-white bg-white/20 p-2 rounded-full backdrop-blur-md">
          <X size={24} />
        </button>
      </div>
      <img src={src} alt="Full view" className="max-w-full max-h-full object-contain rounded-lg shadow-2xl" />
    </div>
  );
};

const LoginView = ({ 
  onGoogleLogin, 
  onEmailLogin,
  loading 
}: { 
  onGoogleLogin: () => void; 
  onEmailLogin: (e: string, p: string) => void;
  loading: boolean 
}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if(email && password) {
      onEmailLogin(email, password);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-white font-sans">
      <div className="w-full max-w-sm">
        <div className="text-center mb-10">
          <div className="mb-8 relative inline-block">
             <div className="absolute -inset-1 bg-gradient-to-r from-blue-400 to-green-400 rounded-full blur opacity-30 animate-pulse"></div>
             <div className="relative bg-white p-4 rounded-full shadow-xl">
                <Plane className="text-blue-600 w-12 h-12" />
             </div>
          </div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2 tracking-tight">Gerenciador de Viagens</h1>
          <p className="text-slate-500">Planeje, gerencie e controle seus gastos.</p>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4 mb-8">
          <div className="relative">
            <Mail className="absolute left-4 top-3.5 text-slate-400" size={20} />
            <input 
              type="email" 
              placeholder="E-mail" 
              className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all text-slate-900 placeholder:text-slate-400 font-medium"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="relative">
            <Lock className="absolute left-4 top-3.5 text-slate-400" size={20} />
            <input 
              type="password" 
              placeholder="Senha" 
              className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all text-slate-900 placeholder:text-slate-400 font-medium"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <Button 
            type="submit"
            isLoading={loading} 
            className="w-full py-3.5 shadow-lg shadow-blue-100"
          >
            {loading ? 'Entrando...' : 'Entrar / Cadastrar'}
          </Button>
        </form>

        <div className="relative flex py-2 items-center mb-8">
          <div className="flex-grow border-t border-slate-200"></div>
          <span className="flex-shrink-0 mx-4 text-slate-400 text-xs font-semibold uppercase">Ou continue com</span>
          <div className="flex-grow border-t border-slate-200"></div>
        </div>

        <Button 
          type="button"
          onClick={onGoogleLogin} 
          isLoading={loading}
          variant="outline"
          className="w-full bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
          icon={
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
          }
        >
          Entrar com Google
        </Button>
      </div>
    </div>
  );
};

const TripFormView = ({ 
  onCancel, 
  onSave, 
  initialTrip 
}: { 
  onCancel: () => void; 
  onSave: (t: Trip) => void;
  initialTrip?: Trip;
}) => {
  const [destination, setDestination] = useState(initialTrip?.destination || '');
  const [startDate, setStartDate] = useState(initialTrip?.startDate || '');
  const [endDate, setEndDate] = useState(initialTrip?.endDate || '');
  const [cities, setCities] = useState(initialTrip?.cities.join(', ') || '');
  const [budgetBRL, setBudgetBRL] = useState(initialTrip?.budgetBRL.toString() || '5000');
  const [coverImage, setCoverImage] = useState<string | undefined>(initialTrip?.coverImage);
  const imageInputRef = useRef<HTMLInputElement>(null);
  
  const [currencies, setCurrencies] = useState<CurrencyConfig[]>(
    initialTrip?.currencies || [{ code: 'USD', rateToBRL: 5.50 }]
  );
  
  const handleAddCurrency = () => {
    setCurrencies([...currencies, { code: 'EUR', rateToBRL: 6.00 }]);
  };

  const updateCurrency = (index: number, field: keyof CurrencyConfig, value: any) => {
    const newCurrencies = [...currencies];
    newCurrencies[index] = { ...newCurrencies[index], [field]: value };
    setCurrencies(newCurrencies);
  };

  const removeCurrency = (index: number) => {
    setCurrencies(currencies.filter((_, i) => i !== index));
  };

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const data = await compressImage(e.target.files[0]);
      setCoverImage(data);
    }
  };

  const handleSaveInternal = () => {
    if (!destination || !startDate || !endDate) return;

    const start = getLocalDate(startDate);
    const end = getLocalDate(endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

    const oldDays = initialTrip?.days || [];
    
    const newDays: DayItinerary[] = Array.from({length: diffDays}).map((_, i) => {
      const d = new Date(start);
      d.setDate(d.getDate() + i);
      const dateString = d.toISOString().split('T')[0];
      
      const existingDay = oldDays[i];

      if (existingDay) {
        return {
          ...existingDay,
          date: dateString,
          dayNumber: i + 1
        };
      }

      return {
        id: `day-${Date.now()}-${i}`,
        date: dateString,
        dayNumber: i + 1,
        activities: []
      };
    });

    const trip: Trip = {
      id: initialTrip?.id || Date.now().toString(),
      destination,
      cities: cities.split(',').map(c => c.trim()).filter(c => c),
      startDate,
      endDate,
      budgetBRL: parseFloat(budgetBRL),
      currencies,
      days: newDays,
      expenses: initialTrip?.expenses || [],
      documents: initialTrip?.documents || [],
      notes: initialTrip?.notes || '',
      coverImage: coverImage
    };

    onSave(trip);
  };

  const displayImage = coverImage || `https://picsum.photos/seed/${destination || 'trip'}/800/400`;

  return (
    <div className="bg-white min-h-screen">
      <div className="p-6">
        <div className="flex items-center mb-6">
          <button onClick={onCancel} className="p-2 -ml-2 rounded-full hover:bg-slate-100 transition-colors">
            <ArrowLeft size={24} className="text-slate-800" />
          </button>
          <h2 className="text-2xl font-bold ml-2 text-slate-900">{initialTrip ? 'Editar Viagem' : 'Nova Viagem'}</h2>
        </div>
      </div>

      <div className="px-6 pb-20 space-y-6">
        {/* Cover Image Editor */}
        <div className="relative w-full h-48 rounded-2xl overflow-hidden group shadow-md bg-slate-100">
           <img src={displayImage} alt="Capa" className="w-full h-full object-cover transition-all group-hover:scale-105" />
           <div className="absolute inset-0 bg-black/30 group-hover:bg-black/40 transition-colors" />
           
           <div className="absolute inset-0 flex items-center justify-center gap-4">
             <button 
               onClick={() => imageInputRef.current?.click()}
               className="bg-white/90 hover:bg-white text-slate-800 px-4 py-2 rounded-xl text-sm font-bold flex items-center backdrop-blur-sm transition-all"
             >
               <Camera size={18} className="mr-2" />
               {coverImage ? 'Trocar Foto' : 'Adicionar Foto'}
             </button>
             
             {coverImage && (
               <button 
                 onClick={() => setCoverImage(undefined)}
                 className="bg-red-500/80 hover:bg-red-500 text-white p-2 rounded-xl backdrop-blur-sm transition-all"
                 title="Restaurar padrão"
               >
                 <Trash2 size={18} />
               </button>
             )}
           </div>
           
           <input 
             type="file" 
             ref={imageInputRef} 
             className="hidden" 
             accept="image/*" 
             onChange={handleImageChange}
           />
           <div className="absolute bottom-3 left-4 text-white text-xs font-medium bg-black/40 px-2 py-1 rounded-md">
             Capa da Viagem
           </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">Destino Principal</label>
          <input 
            type="text" 
            className="w-full px-4 py-3.5 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
            placeholder="Ex: Eurotrip 2024"
            value={destination}
            onChange={(e) => setDestination(e.target.value)}
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">Cidades (Separadas por vírgula)</label>
          <input 
            type="text" 
            className="w-full px-4 py-3.5 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
            placeholder="Ex: Paris, Londres, Amsterdã"
            value={cities}
            onChange={(e) => setCities(e.target.value)}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Início</label>
            <input 
              type="date" 
              className="w-full px-4 py-3.5 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Fim</label>
            <input 
              type="date" 
              className="w-full px-4 py-3.5 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">Orçamento Total (R$)</label>
          <input 
            type="number" 
            className="w-full px-4 py-3.5 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
            value={budgetBRL}
            onChange={(e) => setBudgetBRL(e.target.value)}
          />
        </div>

        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
          <div className="flex justify-between items-center mb-4">
            <label className="text-sm font-semibold text-slate-700">Moedas e Cotações</label>
            <button onClick={handleAddCurrency} className="text-blue-600 text-sm font-bold bg-blue-50 px-3 py-1 rounded-full">+ Adicionar</button>
          </div>
          <div className="space-y-3">
            {currencies.map((curr, idx) => (
              <div key={idx} className="flex gap-2 items-center">
                <select 
                  className="w-24 px-3 py-3 rounded-xl border border-slate-200 bg-white font-medium"
                  value={curr.code}
                  onChange={(e) => updateCurrency(idx, 'code', e.target.value)}
                >
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                  <option value="GBP">GBP</option>
                  <option value="JPY">JPY</option>
                  <option value="ARS">ARS</option>
                  <option value="CLP">CLP</option>
                </select>
                <div className="flex-1 relative">
                  <span className="absolute left-3 top-3.5 text-slate-400 text-sm font-medium">R$</span>
                  <input 
                    type="number" 
                    step="0.01"
                    className="w-full pl-9 pr-3 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none"
                    value={curr.rateToBRL}
                    onChange={(e) => updateCurrency(idx, 'rateToBRL', parseFloat(e.target.value))}
                  />
                </div>
                {currencies.length > 1 && (
                  <button onClick={() => removeCurrency(idx)} className="p-3 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors">
                    <Trash2 size={20} />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="pt-4">
          <Button 
            className="w-full py-4 text-lg shadow-xl shadow-blue-100" 
            onClick={handleSaveInternal} 
            disabled={!destination || !startDate || !endDate}
          >
            {initialTrip ? 'Salvar Alterações' : 'Criar Viagem'}
          </Button>
        </div>
      </div>
    </div>
  );
};

const DocumentModal = ({
  isOpen,
  onClose,
  onSave,
  initialDocument
}: {
  isOpen: boolean;
  onClose: () => void;
  onSave: (doc: TripDocument) => void;
  initialDocument?: TripDocument;
}) => {
  const [title, setTitle] = useState('');
  const [image, setImage] = useState<string | undefined>(undefined);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTitle(initialDocument?.title || '');
      setImage(initialDocument?.image || undefined);
    }
  }, [isOpen, initialDocument]);

  if (!isOpen) return null;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const data = await compressImage(file);
      setImage(data);
    }
  };

  const handleSave = () => {
    if (!title) return;
    const doc: TripDocument = {
      id: initialDocument?.id || Date.now().toString(),
      title,
      isChecked: initialDocument?.isChecked || false,
      image
    };
    onSave(doc);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl w-full max-w-sm p-6 shadow-2xl">
        <h3 className="font-bold text-xl mb-6 text-slate-900">{initialDocument ? 'Editar Documento' : 'Novo Documento'}</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Nome do Documento</label>
            <input 
              type="text" 
              className="w-full p-4 border border-slate-200 rounded-2xl bg-slate-50 focus:bg-white outline-none focus:ring-2 focus:ring-blue-500 transition-all" 
              placeholder="Ex: Passaporte, Seguro, Visto" 
              value={title} 
              onChange={e => setTitle(e.target.value)} 
            />
          </div>
          
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Foto / Anexo</label>
            {image ? (
              <div className="relative">
                <img src={image} alt="Preview" className="w-full h-40 object-cover rounded-2xl border border-slate-200" />
                <button 
                  onClick={() => setImage(undefined)} 
                  className="absolute top-2 right-2 bg-red-500 text-white p-1.5 rounded-full shadow-md hover:bg-red-600 transition-colors"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ) : (
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="w-full h-32 flex flex-col items-center justify-center border-2 border-dashed border-slate-200 rounded-2xl text-slate-500 hover:border-blue-500 hover:text-blue-500 hover:bg-blue-50 transition-all"
              >
                <Camera size={24} className="mb-2" />
                <span className="text-sm font-medium">Tirar Foto ou Escolher</span>
              </button>
            )}
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              accept="image/*" 
              onChange={handleFileChange}
            />
          </div>

          <Button onClick={handleSave} className="w-full py-3.5 mt-2">Salvar</Button>
          <button onClick={onClose} className="w-full py-3 text-slate-500 font-medium hover:bg-slate-50 rounded-xl transition-colors">Cancelar</button>
        </div>
      </div>
    </div>
  );
};

const ActivityModal = ({ 
  isOpen, 
  onClose, 
  onSave, 
  initialActivity, 
  date 
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  onSave: (a: Activity) => void;
  initialActivity?: Activity;
  date: string;
}) => {
  const [title, setTitle] = useState(initialActivity?.title || '');
  const [time, setTime] = useState(initialActivity?.time || '09:00');
  const [type, setType] = useState<ActivityType>(initialActivity?.type || ActivityType.SIGHTSEEING);
  const [location, setLocation] = useState(initialActivity?.location || '');
  const [description, setDescription] = useState(initialActivity?.description || '');
  const [attachments, setAttachments] = useState<Attachment[]>(initialActivity?.attachments || []);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTitle(initialActivity?.title || '');
      setTime(initialActivity?.time || '09:00');
      setType(initialActivity?.type || ActivityType.SIGHTSEEING);
      setLocation(initialActivity?.location || '');
      setDescription(initialActivity?.description || '');
      setAttachments(initialActivity?.attachments || []);
    }
  }, [initialActivity, isOpen]);

  if (!isOpen) return null;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const isPdf = file.type === 'application/pdf';
      let data = '';
      
      if (isPdf) {
         data = 'PDF_MOCK_DATA'; 
      } else {
         data = await compressImage(file);
      }

      const newAtt: Attachment = {
        id: Date.now().toString(),
        name: file.name,
        type: isPdf ? 'PDF' : 'IMAGE',
        data: data
      };
      setAttachments([...attachments, newAtt]);
    }
  };

  const removeAttachment = (id: string) => {
    setAttachments(attachments.filter(a => a.id !== id));
  };

  const handleSave = () => {
    if (!title) return;
    const activity: Activity = {
      id: initialActivity?.id || Date.now().toString(),
      title,
      time,
      type,
      location,
      description,
      attachments
    };
    onSave(activity);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl w-full max-w-md max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="p-5 border-b border-slate-100 flex justify-between items-center sticky top-0 bg-white z-10">
          <h3 className="font-bold text-xl text-slate-900">{initialActivity ? 'Editar Atividade' : 'Nova Atividade'}</h3>
          <button onClick={onClose} className="p-2 bg-slate-50 rounded-full hover:bg-slate-100 transition-colors"><X size={20} className="text-slate-500" /></button>
        </div>
        <div className="p-5 space-y-5">
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Tipo de Atividade</label>
            <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
              {[
                { id: ActivityType.SIGHTSEEING, label: 'Passeio', icon: <Camera size={16} /> },
                { id: ActivityType.FOOD, label: 'Comida', icon: <Utensils size={16} /> },
                { id: ActivityType.WORK_STUDY, label: 'Estudo', icon: <GraduationCap size={16} /> },
                { id: ActivityType.TRANSPORT, label: 'Transp.', icon: <Plane size={16} /> },
                { id: ActivityType.HOTEL, label: 'Hotel', icon: <Bed size={16} /> },
              ].map(t => (
                <button
                  key={t.id}
                  onClick={() => setType(t.id)}
                  className={`flex items-center space-x-1.5 px-4 py-2.5 rounded-xl text-sm whitespace-nowrap border font-medium transition-all ${
                    type === t.id ? 'bg-slate-900 text-white border-slate-900 shadow-md' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {t.icon} <span>{t.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="col-span-2">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">Título</label>
              <input type="text" className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all" value={title} onChange={e => setTitle(e.target.value)} placeholder="Ex: Torre Eiffel" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">Hora</label>
              <input type="time" className="w-full px-2 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white outline-none transition-all text-center" value={time} onChange={e => setTime(e.target.value)} />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">Local / Endereço</label>
            <div className="relative">
               <MapPin className="absolute left-3 top-3.5 text-slate-400" size={18} />
               <input 
                type="text" 
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all" 
                value={location} 
                onChange={e => setLocation(e.target.value)} 
                placeholder="Ex: Champ de Mars, 5 Av. Anatole France" 
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">Detalhes / Observações</label>
            <textarea className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all h-24 resize-none" value={description} onChange={e => setDescription(e.target.value)} placeholder="Detalhes, reservas, ingressos..." />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Anexos</label>
            <div className="flex flex-wrap gap-2 mb-3">
              {attachments.map(att => (
                <div key={att.id} className="flex items-center bg-slate-100 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-700">
                  <span className="truncate max-w-[120px]">{att.name}</span>
                  <button onClick={() => removeAttachment(att.id)} className="ml-2 text-slate-400 hover:text-red-500"><X size={14} /></button>
                </div>
              ))}
            </div>
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center justify-center w-full py-3 border-2 border-dashed border-slate-200 rounded-xl text-slate-500 hover:border-blue-500 hover:text-blue-500 hover:bg-blue-50 transition-all text-sm font-medium"
            >
              <Upload size={18} className="mr-2" /> Adicionar Imagem ou PDF
            </button>
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              accept="image/*" 
              onChange={handleFileChange}
            />
          </div>

          <Button onClick={handleSave} className="w-full mt-2 py-3.5 text-base shadow-lg shadow-blue-100">Salvar Atividade</Button>
        </div>
      </div>
    </div>
  );
};

const ExpenseModal = ({ 
  isOpen, 
  onClose, 
  onSave, 
  currencies,
  initialExpense
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  onSave: (e: Expense) => void;
  currencies: CurrencyConfig[];
  initialExpense?: Expense;
}) => {
  const [desc, setDesc] = useState('');
  const [amount, setAmount] = useState('');
  const [curr, setCurr] = useState(currencies[0]?.code || 'BRL');
  const [cat, setCat] = useState('Alimentação');

  useEffect(() => {
    if (isOpen) {
      if (initialExpense) {
        setDesc(initialExpense.description);
        setAmount(initialExpense.amount.toString());
        setCurr(initialExpense.currency);
        setCat(initialExpense.category);
      } else {
        setDesc('');
        setAmount('');
        setCurr(currencies[0]?.code || 'BRL');
        setCat('Alimentação');
      }
    }
  }, [isOpen, initialExpense, currencies]);

  if (!isOpen) return null;

  const handleSave = () => {
    if (!desc || !amount) return;
    
    let rate = 1;
    if (curr !== 'BRL') {
      const config = currencies.find(c => c.code === curr);
      rate = config ? config.rateToBRL : 1;
    }

    const val = parseFloat(amount);
    
    const expense: Expense = {
      id: initialExpense?.id || Date.now().toString(),
      description: desc,
      amount: val,
      currency: curr,
      category: cat,
      date: initialExpense?.date || new Date().toISOString(),
      amountInBRL: val * rate
    };
    onSave(expense);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl w-full max-w-sm p-6 shadow-2xl">
        <h3 className="font-bold text-xl mb-6 text-slate-900">{initialExpense ? 'Editar Gasto' : 'Novo Gasto'}</h3>
        <div className="space-y-4">
          <input type="text" className="w-full p-4 border border-slate-200 rounded-2xl bg-slate-50 focus:bg-white outline-none focus:ring-2 focus:ring-blue-500" placeholder="O que você comprou?" value={desc} onChange={e => setDesc(e.target.value)} />
          <div className="flex gap-3">
            <input type="number" className="flex-1 p-4 border border-slate-200 rounded-2xl bg-slate-50 focus:bg-white outline-none focus:ring-2 focus:ring-blue-500" placeholder="0.00" value={amount} onChange={e => setAmount(e.target.value)} />
            <select className="w-28 p-4 border border-slate-200 rounded-2xl bg-white font-medium" value={curr} onChange={e => setCurr(e.target.value)}>
              <option value="BRL">BRL</option>
              {currencies.map(c => <option key={c.code} value={c.code}>{c.code}</option>)}
            </select>
          </div>
          <select className="w-full p-4 border border-slate-200 rounded-2xl bg-white" value={cat} onChange={e => setCat(e.target.value)}>
            <option>Alimentação</option>
            <option>Transporte</option>
            <option>Hospedagem</option>
            <option>Lazer</option>
            <option>Compras</option>
            <option>Educação</option>
            <option>Outros</option>
          </select>
          <Button onClick={handleSave} className="w-full py-3.5 mt-2">Salvar</Button>
          <button onClick={onClose} className="w-full py-3 text-slate-500 font-medium hover:bg-slate-50 rounded-xl transition-colors">Cancelar</button>
        </div>
      </div>
    </div>
  );
};

const TripDetailView = ({ 
  trip: initialTrip, 
  onBack, 
  onDelete, 
  onUpdate,
  onEditTrip
}: { 
  trip: Trip; 
  onBack: () => void; 
  onDelete: (id: string) => void; 
  onUpdate: (t: Trip) => void;
  onEditTrip: () => void;
}) => {
  const [trip, setTrip] = useState(initialTrip);
  const [activeTab, setActiveTab] = useState<'ROTEIRO' | 'GASTOS' | 'INFO' | 'DOCS'>('INFO');
  
  useEffect(() => {
    setTrip(initialTrip);
  }, [initialTrip]);
  
  // Modals
  const [showActivityModal, setShowActivityModal] = useState(false);
  const [editingDayId, setEditingDayId] = useState<string | null>(null);
  const [editingActivity, setEditingActivity] = useState<Activity | undefined>(undefined);
  
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | undefined>(undefined);

  const [showDocumentModal, setShowDocumentModal] = useState(false);
  const [editingDocument, setEditingDocument] = useState<TripDocument | undefined>(undefined);
  const [fullScreenImage, setFullScreenImage] = useState<string | null>(null);

  // Confirm Delete State
  const [confirmConfig, setConfirmConfig] = useState<{
    isOpen: boolean;
    type: 'TRIP' | 'ACTIVITY' | 'EXPENSE' | 'DOCUMENT' | null;
    data: any; 
    title: string;
    message: string;
  }>({
    isOpen: false,
    type: null,
    data: null,
    title: '',
    message: ''
  });

  const [notes, setNotes] = useState(trip.notes || '');
  const [isEditingNotes, setIsEditingNotes] = useState(false);

  const saveNotes = () => {
    const updatedTrip = { ...trip, notes };
    setTrip(updatedTrip);
    onUpdate(updatedTrip);
    setIsEditingNotes(false);
  };

  const handleAddActivity = (dayId: string) => {
    setEditingDayId(dayId);
    setEditingActivity(undefined);
    setShowActivityModal(true);
  };

  const handleEditActivity = (dayId: string, activity: Activity) => {
    setEditingDayId(dayId);
    setEditingActivity(activity);
    setShowActivityModal(true);
  };

  const saveActivity = (activity: Activity) => {
    if (!editingDayId) return;
    
    const newDays = trip.days.map(day => {
      if (day.id !== editingDayId) return day;
      
      let newActivities = [...day.activities];
      if (editingActivity) {
        newActivities = newActivities.map(a => a.id === activity.id ? activity : a);
      } else {
        newActivities.push(activity);
      }
      newActivities.sort((a, b) => a.time.localeCompare(b.time));
      return { ...day, activities: newActivities };
    });

    const updatedTrip = { ...trip, days: newDays };
    setTrip(updatedTrip);
    onUpdate(updatedTrip);
  };

  // --- DELETE REQUEST HANDLERS ---
  const requestDeleteTrip = () => {
    setConfirmConfig({
      isOpen: true,
      type: 'TRIP',
      data: trip.id,
      title: 'Excluir Viagem',
      message: 'Tem certeza que deseja excluir esta viagem inteira? Essa ação não pode ser desfeita.'
    });
  };

  const requestDeleteActivity = (dayId: string, activityId: string, e: React.MouseEvent) => {
    e.stopPropagation(); 
    setConfirmConfig({
      isOpen: true,
      type: 'ACTIVITY',
      data: { dayId, activityId },
      title: 'Remover Atividade',
      message: 'Deseja remover esta atividade do roteiro?'
    });
  };

  const requestDeleteExpense = (expenseId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setConfirmConfig({
      isOpen: true,
      type: 'EXPENSE',
      data: expenseId,
      title: 'Excluir Gasto',
      message: 'Deseja remover este registro de gasto?'
    });
  };

  const requestDeleteDocument = (docId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setConfirmConfig({
      isOpen: true,
      type: 'DOCUMENT',
      data: docId,
      title: 'Excluir Documento',
      message: 'Deseja remover este documento?'
    });
  };

  const executeDelete = () => {
    if (confirmConfig.type === 'TRIP') {
      onDelete(confirmConfig.data);
    } 
    else if (confirmConfig.type === 'ACTIVITY') {
      const { dayId, activityId } = confirmConfig.data;
      const newDays = trip.days.map(day => {
        if (day.id !== dayId) return day;
        return { ...day, activities: day.activities.filter(a => a.id !== activityId) };
      });
      const updatedTrip = { ...trip, days: newDays };
      setTrip(updatedTrip);
      onUpdate(updatedTrip);
    } 
    else if (confirmConfig.type === 'EXPENSE') {
      const expenseId = confirmConfig.data;
      const updatedTrip = { ...trip, expenses: trip.expenses.filter(e => e.id !== expenseId) };
      setTrip(updatedTrip);
      onUpdate(updatedTrip);
    }
    else if (confirmConfig.type === 'DOCUMENT') {
      const docId = confirmConfig.data;
      const updatedTrip = { ...trip, documents: (trip.documents || []).filter(d => d.id !== docId) };
      setTrip(updatedTrip);
      onUpdate(updatedTrip);
    }
    setConfirmConfig({ ...confirmConfig, isOpen: false });
  };

  const handleEditExpense = (expense: Expense) => {
    setEditingExpense(expense);
    setShowExpenseModal(true);
  };

  const saveExpense = (expense: Expense) => {
    let newExpenses = [...trip.expenses];
    if (editingExpense) {
      newExpenses = newExpenses.map(e => e.id === expense.id ? expense : e);
    } else {
      newExpenses.push(expense);
    }
    const updatedTrip = { ...trip, expenses: newExpenses };
    setTrip(updatedTrip);
    onUpdate(updatedTrip);
    setEditingExpense(undefined);
  };

  const handleEditDocument = (doc: TripDocument) => {
    setEditingDocument(doc);
    setShowDocumentModal(true);
  };

  const saveDocument = (doc: TripDocument) => {
    let newDocs = [...(trip.documents || [])];
    if (editingDocument) {
      newDocs = newDocs.map(d => d.id === doc.id ? doc : d);
    } else {
      newDocs.push(doc);
    }
    const updatedTrip = { ...trip, documents: newDocs };
    setTrip(updatedTrip);
    onUpdate(updatedTrip);
    setEditingDocument(undefined);
  };

  const toggleDocumentCheck = (docId: string) => {
    const newDocs = (trip.documents || []).map(d => 
      d.id === docId ? { ...d, isChecked: !d.isChecked } : d
    );
    const updatedTrip = { ...trip, documents: newDocs };
    setTrip(updatedTrip);
    onUpdate(updatedTrip);
  };

  const getActivityIcon = (type: ActivityType) => {
    switch(type) {
      case ActivityType.FOOD: return <Utensils size={18} />;
      case ActivityType.HOTEL: return <Bed size={18} />;
      case ActivityType.WORK_STUDY: return <GraduationCap size={18} />;
      case ActivityType.TRANSPORT: return <Map size={18} />;
      case ActivityType.SIGHTSEEING: return <Camera size={18} />;
      default: return <MapPin size={18} />;
    }
  };

  const getActivityColor = (type: ActivityType) => {
    switch(type) {
      case ActivityType.FOOD: return 'bg-orange-100 text-orange-600';
      case ActivityType.HOTEL: return 'bg-indigo-100 text-indigo-600';
      case ActivityType.WORK_STUDY: return 'bg-purple-100 text-purple-600';
      case ActivityType.TRANSPORT: return 'bg-slate-100 text-slate-600';
      default: return 'bg-blue-100 text-blue-600';
    }
  };

  const nextRelevant = (() => {
    const today = new Date();
    today.setHours(0,0,0,0);
    const todayStr = today.toISOString().split('T')[0];
    const sortedDays = [...trip.days].sort((a,b) => a.date.localeCompare(b.date));
    const todayDay = sortedDays.find(d => d.date === todayStr);
    if (todayDay) return { day: todayDay, label: 'Hoje' };
    const nextDay = sortedDays.find(d => d.date > todayStr);
    if (nextDay) return { day: nextDay, label: `Dia ${nextDay.dayNumber}` }; 
    return null;
  })();

  const totalSpent = trip.expenses.reduce((acc, cur) => acc + cur.amountInBRL, 0);
  const percentUsed = Math.min((totalSpent / trip.budgetBRL) * 100, 100);
  const bgImage = trip.coverImage || `https://picsum.photos/seed/${trip.destination}/800/400`;

  return (
    <div className="bg-slate-50 min-h-screen pb-20 font-sans">
      <ConfirmModal 
        isOpen={confirmConfig.isOpen}
        onClose={() => setConfirmConfig({...confirmConfig, isOpen: false})}
        onConfirm={executeDelete}
        title={confirmConfig.title}
        message={confirmConfig.message}
      />
      
      <ImageViewerModal 
        src={fullScreenImage} 
        onClose={() => setFullScreenImage(null)} 
      />

      {/* Hero Header */}
      <div className="relative h-64 w-full">
         <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-slate-900/40 to-transparent z-10" />
         <img src={bgImage} alt={trip.destination} className="w-full h-full object-cover" />
         
         <div className="absolute top-0 left-0 right-0 z-20 p-4 flex justify-between items-center text-white">
            <button onClick={onBack} className="p-2 -ml-2 rounded-full hover:bg-white/20 backdrop-blur-md transition-colors">
              <ArrowLeft size={24} />
            </button>
            <div className="flex gap-2">
               <button onClick={onEditTrip} className="p-2 rounded-full hover:bg-white/20 backdrop-blur-md text-white transition-colors">
                 <Edit2 size={20} className="pointer-events-none" />
               </button>
               <button 
                  onClick={requestDeleteTrip} 
                  className="p-2 rounded-full hover:bg-white/20 backdrop-blur-md text-white hover:text-red-300 transition-colors relative z-20"
                >
                 <Trash2 size={20} className="pointer-events-none" />
               </button>
            </div>
         </div>

         <div className="absolute bottom-0 left-0 right-0 z-20 p-6">
            <h1 className="text-3xl font-bold text-white mb-1 shadow-sm">{trip.destination}</h1>
            <p className="text-blue-100 flex items-center text-sm font-medium">
              <Calendar size={14} className="mr-2" />
              {getLocalDate(trip.startDate).toLocaleDateString('pt-BR')} - {getLocalDate(trip.endDate).toLocaleDateString('pt-BR')}
            </p>
         </div>
      </div>
        
      {/* Floating Tabs */}
      <div className="px-4 -mt-6 relative z-30 mb-6">
        <div className="bg-white rounded-full shadow-lg shadow-slate-200/50 p-1 flex justify-between overflow-x-auto no-scrollbar">
          <button onClick={() => setActiveTab('INFO')} className={`flex-1 min-w-[80px] py-2.5 rounded-full text-sm font-bold transition-all whitespace-nowrap ${activeTab === 'INFO' ? 'bg-slate-900 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}>Resumo</button>
          <button onClick={() => setActiveTab('ROTEIRO')} className={`flex-1 min-w-[80px] py-2.5 rounded-full text-sm font-bold transition-all whitespace-nowrap ${activeTab === 'ROTEIRO' ? 'bg-slate-900 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}>Roteiro</button>
          <button onClick={() => setActiveTab('GASTOS')} className={`flex-1 min-w-[80px] py-2.5 rounded-full text-sm font-bold transition-all whitespace-nowrap ${activeTab === 'GASTOS' ? 'bg-slate-900 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}>Gastos</button>
          <button onClick={() => setActiveTab('DOCS')} className={`flex-1 min-w-[80px] py-2.5 rounded-full text-sm font-bold transition-all whitespace-nowrap ${activeTab === 'DOCS' ? 'bg-slate-900 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}>Docs</button>
        </div>
      </div>

      {/* --- INFO TAB --- */}
      {activeTab === 'INFO' && (
        <div className="px-4 space-y-6 animate-in slide-in-from-bottom-4 duration-500">
          
          {nextRelevant ? (
             <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
                <div className="flex justify-between items-center mb-4">
                  <div>
                    <span className="text-xs font-bold text-blue-600 uppercase tracking-wide bg-blue-50 px-2 py-1 rounded-md">{nextRelevant.label}</span>
                    <h3 className="font-bold text-slate-800 text-lg mt-1">
                      {getLocalDate(nextRelevant.day.date).toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
                    </h3>
                  </div>
                  <button onClick={() => setActiveTab('ROTEIRO')} className="text-slate-400 hover:text-blue-600">
                    <ChevronRight size={20} />
                  </button>
                </div>
                
                <div className="space-y-3">
                  {nextRelevant.day.activities.length === 0 ? (
                    <p className="text-slate-400 text-sm italic">Nada planejado para este dia.</p>
                  ) : (
                    nextRelevant.day.activities.slice(0, 3).map((act, i) => (
                      <div key={i} className="flex items-center gap-3 p-2 hover:bg-slate-50 rounded-xl transition-colors">
                        <span className="text-xs font-mono font-medium text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">{act.time}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-slate-800 truncate">{act.title}</p>
                          {act.location && <p className="text-xs text-slate-400 truncate">{act.location}</p>}
                        </div>
                        <div className={`w-2 h-2 rounded-full ${getActivityColor(act.type).replace('bg-', 'bg-').split(' ')[0]}`}></div>
                      </div>
                    ))
                  )}
                  {nextRelevant.day.activities.length > 3 && (
                    <p className="text-center text-xs text-slate-400 mt-2">+ {nextRelevant.day.activities.length - 3} atividades</p>
                  )}
                </div>
             </div>
          ) : (
             <div className="bg-green-50 p-5 rounded-2xl border border-green-100 text-center">
                <p className="text-green-700 font-medium">Viagem Concluída! 🎉</p>
             </div>
          )}

          <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-bold text-slate-800 flex items-center"><FileText size={18} className="mr-2 text-slate-400" /> Notas</h3>
              <button onClick={() => isEditingNotes ? saveNotes() : setIsEditingNotes(true)} className="text-blue-600 text-sm font-bold">
                {isEditingNotes ? 'Salvar' : 'Editar'}
              </button>
            </div>
            {isEditingNotes ? (
              <textarea 
                className="w-full h-32 p-3 border rounded-xl text-sm bg-slate-50 focus:bg-white outline-none focus:ring-2 focus:ring-blue-500"
                value={notes} 
                onChange={e => setNotes(e.target.value)}
                placeholder="Escreva aqui códigos de reserva, dicas, etc..."
              />
            ) : (
              <div className="bg-slate-50 rounded-xl p-4">
                 <p className="text-slate-600 text-sm whitespace-pre-wrap leading-relaxed">{notes || 'Nenhuma nota adicionada.'}</p>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
             <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
               <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-3">Cidades</h3>
               <div className="flex flex-wrap gap-2">
                 {trip.cities.map((city, i) => (
                   <span key={i} className="bg-blue-50 text-blue-700 px-2 py-1 rounded-md text-xs font-bold">{city}</span>
                 ))}
               </div>
             </div>
             <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-3">Cotações</h3>
                <div className="space-y-2">
                  {trip.currencies.map((curr, i) => (
                    <div key={i} className="flex justify-between items-center">
                      <span className="font-bold text-slate-700 text-sm">{curr.code}</span>
                      <span className="text-slate-500 text-xs">R$ {curr.rateToBRL.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
             </div>
          </div>
        </div>
      )}

      {/* --- ROTEIRO TAB --- */}
      {activeTab === 'ROTEIRO' && (
        <div className="px-4 space-y-8 animate-in slide-in-from-bottom-4 duration-500">
          {trip.days.map((day) => {
             const dayDate = getLocalDate(day.date);
             return (
              <div key={day.id} className="relative pl-6 border-l-2 border-slate-200 ml-2">
                <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-slate-900 border-4 border-slate-100 shadow-sm"></div>
                
                <div className="mb-5 flex justify-between items-start pt-1">
                  <div>
                    <h3 className="font-bold text-slate-900 text-2xl capitalize leading-none mb-1">
                      {dayDate.toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' }).replace('.', '')}
                    </h3>
                    <p className="text-slate-400 text-sm font-medium capitalize">
                       {dayDate.toLocaleDateString('pt-BR', { weekday: 'long' })} <span className="text-slate-300 mx-1">•</span> Dia {day.dayNumber}
                    </p>
                  </div>
                  <button onClick={() => handleAddActivity(day.id)} className="bg-slate-900 text-white p-2 rounded-xl shadow-lg shadow-slate-200 hover:bg-slate-800 active:scale-95 transition-all">
                    <Plus size={20} />
                  </button>
                </div>
                
                <div className="space-y-4">
                  {day.activities.length === 0 && (
                     <div className="bg-slate-50 rounded-2xl p-6 text-center border border-dashed border-slate-200">
                        <p className="text-slate-400 text-sm font-medium">Nenhuma atividade.</p>
                     </div>
                  )}
                  {day.activities.map((activity) => (
                    <div key={activity.id} className="group bg-white p-4 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow relative overflow-hidden">
                      <div className="flex gap-4">
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${getActivityColor(activity.type)}`}>
                          {getActivityIcon(activity.type)}
                        </div>
                        <div className="flex-1 min-w-0 py-0.5">
                          <div className="flex justify-between items-start">
                            <h4 className="font-bold text-slate-800 text-base truncate pr-2">{activity.title}</h4>
                            <span className="text-xs font-bold font-mono text-slate-500 bg-slate-100 px-2 py-1 rounded-md shrink-0">{activity.time}</span>
                          </div>
                          
                          {activity.location && (
                            <div className="flex items-center mt-1.5 mb-1 text-xs text-slate-500">
                              <MapPin size={12} className="mr-1 shrink-0 text-slate-400" /> 
                              <a 
                                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(activity.location)}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="truncate hover:text-blue-600 hover:underline cursor-pointer transition-colors"
                                onClick={(e) => e.stopPropagation()}
                              >
                                {activity.location}
                              </a>
                            </div>
                          )}
                          
                          {activity.description && <p className="text-slate-500 text-sm mt-2 leading-relaxed border-l-2 border-slate-100 pl-2">{activity.description}</p>}
                          
                          {/* Attachments */}
                          {activity.attachments && activity.attachments.length > 0 && (
                            <div className="mt-3 flex gap-2 overflow-x-auto pb-1 no-scrollbar">
                              {activity.attachments.map(att => (
                                <div key={att.id} className="relative group/att shrink-0 cursor-pointer">
                                  {att.type === 'IMAGE' ? (
                                    <img src={att.data} alt="att" className="h-14 w-14 object-cover rounded-lg border border-slate-200" />
                                  ) : (
                                    <div className="h-14 w-14 bg-red-50 rounded-lg flex flex-col items-center justify-center border border-red-100 text-red-500">
                                      <FileText size={18} />
                                      <span className="text-[7px] uppercase mt-1 font-bold">PDF</span>
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {/* Action Buttons */}
                      <div className="mt-3 pt-3 border-t border-slate-50 flex justify-end gap-1">
                        <button onClick={() => handleEditActivity(day.id, activity)} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"><Edit2 size={16} className="pointer-events-none" /></button>
                        <button 
                          onClick={(e) => requestDeleteActivity(day.id, activity.id, e)} 
                          className="relative z-10 p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 size={16} className="pointer-events-none" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
             );
          })}
          
          <ActivityModal 
            isOpen={showActivityModal} 
            onClose={() => setShowActivityModal(false)}
            onSave={saveActivity}
            initialActivity={editingActivity}
            date={editingDayId ? trip.days.find(d => d.id === editingDayId)?.date || '' : ''}
          />
        </div>
      )}

      {/* --- GASTOS TAB --- */}
      {activeTab === 'GASTOS' && (
        <div className="px-4 space-y-6 animate-in slide-in-from-bottom-4 duration-500">
          <div className="bg-slate-900 text-white p-6 rounded-3xl shadow-lg shadow-slate-200">
            <div className="flex justify-between items-start mb-6">
              <div>
                <p className="text-slate-400 text-sm font-medium mb-1">Gasto Total Estimado</p>
                <h2 className="text-4xl font-bold">{formatMoney(totalSpent)}</h2>
              </div>
              <div className="bg-white/10 p-3 rounded-xl backdrop-blur-sm">
                 <PieChart className="text-blue-300" size={24} />
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-medium text-slate-300">
                <span>Orçamento: {formatMoney(trip.budgetBRL)}</span>
                <span className="text-slate-300">
                  {percentUsed.toFixed(1)}% utilizado
                </span>
              </div>
              <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden">
                <div 
                  className={`h-full rounded-full transition-all duration-1000 ${percentUsed > 90 ? 'bg-gradient-to-r from-red-500 to-orange-500' : 'bg-gradient-to-r from-blue-500 to-indigo-500'}`} 
                  style={{ width: `${Math.min(percentUsed, 100)}%` }}
                ></div>
              </div>
            </div>
          </div>

          <div className="flex justify-between items-center px-1">
            <h3 className="font-bold text-slate-900 text-lg">Histórico</h3>
            <button onClick={() => { setEditingExpense(undefined); setShowExpenseModal(true); }} className="flex items-center text-sm font-bold text-white bg-blue-600 px-4 py-2.5 rounded-xl shadow-md shadow-blue-200 hover:bg-blue-700 transition-colors">
              <Plus size={16} className="mr-1" /> Novo Gasto
            </button>
          </div>

          <div className="space-y-3 pb-8">
            {trip.expenses.length === 0 && (
              <div className="text-center py-12 text-slate-400 bg-white rounded-2xl border border-dashed border-slate-200">
                <Banknote size={32} className="mx-auto mb-3 opacity-30" />
                <p className="font-medium">Nenhum gasto registrado.</p>
              </div>
            )}
            {trip.expenses.slice().reverse().map(expense => (
              <div key={expense.id} className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex justify-between items-center">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-500">
                    <DollarSign size={18} />
                  </div>
                  <div>
                    <p className="font-bold text-slate-800 text-sm">{expense.description}</p>
                    <div className="flex items-center text-xs text-slate-500 mt-0.5">
                      <span className="font-medium text-blue-600 mr-2">{expense.category}</span>
                      <span>• {getLocalDate(expense.date.split('T')[0]).toLocaleDateString('pt-BR', {day: '2-digit', month: '2-digit'})}</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="font-bold text-slate-900">{formatMoney(expense.amountInBRL)}</p>
                    {expense.currency !== 'BRL' && (
                      <p className="text-[10px] text-slate-400 font-mono mt-0.5">{expense.currency} {expense.amount}</p>
                    )}
                  </div>
                  
                  <div className="flex flex-col gap-1 border-l border-slate-100 pl-2">
                     <button onClick={() => handleEditExpense(expense)} className="text-slate-300 hover:text-blue-600 p-1 transition-colors">
                       <Edit2 size={14} className="pointer-events-none" />
                     </button>
                     <button onClick={(e) => requestDeleteExpense(expense.id, e)} className="relative z-10 text-slate-300 hover:text-red-500 p-1 transition-colors">
                       <Trash2 size={14} className="pointer-events-none" />
                     </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <ExpenseModal 
            isOpen={showExpenseModal} 
            onClose={() => setShowExpenseModal(false)} 
            onSave={saveExpense} 
            currencies={trip.currencies} 
            initialExpense={editingExpense}
          />
        </div>
      )}

      {/* --- DOCS TAB --- */}
      {activeTab === 'DOCS' && (
        <div className="px-4 space-y-6 animate-in slide-in-from-bottom-4 duration-500">
          <div className="flex justify-between items-center px-1">
            <h3 className="font-bold text-slate-900 text-lg">Documentos Importantes</h3>
            <button onClick={() => { setEditingDocument(undefined); setShowDocumentModal(true); }} className="flex items-center text-sm font-bold text-white bg-blue-600 px-4 py-2.5 rounded-xl shadow-md shadow-blue-200 hover:bg-blue-700 transition-colors">
              <Plus size={16} className="mr-1" /> Novo Doc
            </button>
          </div>

          <div className="space-y-3 pb-8">
            {(trip.documents || []).length === 0 && (
              <div className="text-center py-12 text-slate-400 bg-white rounded-2xl border border-dashed border-slate-200">
                <FolderOpen size={32} className="mx-auto mb-3 opacity-30" />
                <p className="font-medium">Nenhum documento salvo.</p>
                <p className="text-xs mt-1">Salve passaportes, vistos e seguros aqui.</p>
              </div>
            )}
            {(trip.documents || []).map(doc => (
              <div key={doc.id} className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex justify-between items-center group hover:shadow-md transition-shadow">
                <div className="flex items-center gap-4 flex-1">
                  <button 
                    onClick={() => toggleDocumentCheck(doc.id)} 
                    className={`p-2 rounded-full transition-colors ${doc.isChecked ? 'text-green-500 bg-green-50' : 'text-slate-300 bg-slate-50 hover:bg-slate-100'}`}
                  >
                    <CheckSquare size={20} className={doc.isChecked ? "fill-green-500 text-white" : ""} />
                  </button>
                  
                  <div className="flex-1">
                    <p className={`font-bold text-base transition-all ${doc.isChecked ? 'text-slate-400 line-through' : 'text-slate-800'}`}>
                      {doc.title}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  {doc.image && (
                     <div 
                        className="relative w-12 h-12 rounded-lg overflow-hidden cursor-pointer border border-slate-200 group/img"
                        onClick={() => setFullScreenImage(doc.image || null)}
                     >
                       <img src={doc.image} className="w-full h-full object-cover" alt="thumbnail" />
                       <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 group-hover/img:opacity-100 transition-opacity">
                          <Eye size={16} className="text-white drop-shadow-sm" />
                       </div>
                     </div>
                  )}
                  
                  <div className="flex flex-col gap-1 border-l border-slate-100 pl-2">
                     <button onClick={() => handleEditDocument(doc)} className="text-slate-300 hover:text-blue-600 p-1 transition-colors">
                       <Edit2 size={14} className="pointer-events-none" />
                     </button>
                     <button onClick={(e) => requestDeleteDocument(doc.id, e)} className="relative z-10 text-slate-300 hover:text-red-500 p-1 transition-colors">
                       <Trash2 size={14} className="pointer-events-none" />
                     </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <DocumentModal 
            isOpen={showDocumentModal}
            onClose={() => setShowDocumentModal(false)}
            onSave={saveDocument}
            initialDocument={editingDocument}
          />
        </div>
      )}
    </div>
  );
};

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [view, setView] = useState<ViewState | 'EDIT_TRIP'>('LOGIN');
  const [loading, setLoading] = useState(true);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [selectedTrip, setSelectedTrip] = useState<Trip | null>(null);

  useEffect(() => {
    // Inicia o observador de autenticação do Firebase
    // Isso garante que se o usuário der refresh, ele continua logado
    const unsubscribe = storageService.observeAuth(async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        // Só carrega as viagens se tiver usuário
        try {
          const data = await storageService.getTrips();
          setTrips(data);
        } catch (error) {
          console.error("Erro ao carregar viagens:", error);
        }
        setView('DASHBOARD');
      } else {
        setUser(null);
        setView('LOGIN');
      }
      setLoading(false);
    });

    // Cleanup subscription
    return () => unsubscribe();
  }, []);

  const loadTrips = async () => {
    const data = await storageService.getTrips();
    setTrips(data);
  };

  const handleLogin = async () => {
    setLoading(true);
    try {
      await storageService.mockLogin();
      // Não precisamos setar view ou user aqui, o useEffect do observeAuth vai lidar com isso
    } catch (error) {
      console.error("Login failed", error);
      alert("Falha no login com Google");
      setLoading(false);
    }
  };

  const handleEmailLogin = async (email: string, pass: string) => {
    setLoading(true);
    try {
      await storageService.mockEmailLogin(email, pass);
      // O listener cuidará do resto
    } catch (error: any) {
      console.error("Email Login failed", error);
      let msg = "Falha no login.";
      if (error.code === 'auth/wrong-password') msg = "Senha incorreta.";
      if (error.code === 'auth/invalid-email') msg = "E-mail inválido.";
      alert(msg);
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await storageService.logout();
    // O listener cuidará de limpar o estado
  };

  const handleSaveTrip = async (newTrip: Trip) => {
    await storageService.saveTrip(newTrip);
    await loadTrips();
    if(view === 'EDIT_TRIP') {
      setSelectedTrip(newTrip);
      setView('TRIP_DETAILS');
    } else {
      setView('DASHBOARD');
    }
  };

  const handleUpdateTrip = async (updatedTrip: Trip) => {
    // Atualização otimista da UI para parecer instantâneo
    setSelectedTrip(updatedTrip);
    setTrips(trips.map(t => t.id === updatedTrip.id ? updatedTrip : t));
    
    // Atualização real no banco
    await storageService.saveTrip(updatedTrip);
  };

  const handleDeleteTrip = async (tripId: string) => {
    await storageService.deleteTrip(tripId);
    await loadTrips();
    setView('DASHBOARD');
  };

  if (loading) {
     return (
       <div className="min-h-screen flex items-center justify-center bg-slate-50">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
       </div>
     );
  }

  if (view === 'LOGIN') {
    return <LoginView onGoogleLogin={handleLogin} onEmailLogin={handleEmailLogin} loading={loading} />;
  }

  if (view === 'CREATE_TRIP') {
    return (
      <Layout currentView={'CREATE_TRIP'} onChangeView={(v) => setView(v)} onLogout={handleLogout} showNav={false}>
        <TripFormView onCancel={() => setView('DASHBOARD')} onSave={handleSaveTrip} />
      </Layout>
    );
  }

  if (view === 'EDIT_TRIP' && selectedTrip) {
    return (
       <Layout currentView={'TRIP_DETAILS'} onChangeView={(v) => setView(v)} onLogout={handleLogout} showNav={false}>
        <TripFormView 
          onCancel={() => setView('TRIP_DETAILS')} 
          onSave={handleSaveTrip} 
          initialTrip={selectedTrip}
        />
      </Layout>
    );
  }

  if (view === 'TRIP_DETAILS' && selectedTrip) {
    return (
      <Layout currentView={view} onChangeView={(v) => setView(v)} onLogout={handleLogout} showNav={false}>
        <TripDetailView 
          trip={selectedTrip} 
          onBack={() => setView('DASHBOARD')} 
          onDelete={handleDeleteTrip} 
          onUpdate={handleUpdateTrip}
          onEditTrip={() => setView('EDIT_TRIP')}
        />
      </Layout>
    );
  }

  const upcomingTrips = trips
    .filter(t => getDaysUntil(t.startDate) >= 0)
    .sort((a, b) => getDaysUntil(a.startDate) - getDaysUntil(b.startDate));
  
  const nextTrip = upcomingTrips[0];
  const daysUntilNext = nextTrip ? getDaysUntil(nextTrip.startDate) : -1;

  return (
    <Layout currentView={view as ViewState} onChangeView={(v) => setView(v)} onLogout={handleLogout}>
      <div className="p-6">
        <header className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Olá, {user?.displayName.split(' ')[0]}!</h1>
            <p className="text-slate-500 text-sm font-medium">Pronto para a próxima aventura?</p>
          </div>
          <div className="p-1 rounded-full border-2 border-white shadow-md">
            <img src={user?.photoURL} alt="Profile" className="w-10 h-10 rounded-full" />
          </div>
        </header>

        {/* Countdown Banner */}
        {nextTrip && (
          <div 
            onClick={() => { setSelectedTrip(nextTrip); setView('TRIP_DETAILS'); }}
            className="group mb-8 relative overflow-hidden bg-slate-900 rounded-3xl p-6 text-white shadow-xl shadow-slate-200 cursor-pointer transition-transform active:scale-[0.98]"
          >
            <div className="absolute top-0 right-0 p-8 opacity-10 transform translate-x-4 -translate-y-4">
               <Plane size={120} />
            </div>
            
            <div className="relative z-10">
              <div className="flex items-center space-x-2 mb-3">
                <span className="bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider">Próxima Viagem</span>
              </div>
              <h2 className="text-4xl font-bold mb-1 tracking-tight">
                {daysUntilNext === 0 ? "É hoje!" : `Falta${daysUntilNext > 1 ? 'm' : ''} ${daysUntilNext} dia${daysUntilNext > 1 ? 's' : ''}`}
              </h2>
              <p className="text-slate-300 font-medium text-lg">
                Rumo a <span className="text-white font-bold">{nextTrip.destination}</span>
              </p>
            </div>
          </div>
        )}

        <div>
          <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center">Suas Viagens <span className="ml-2 text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">{trips.length}</span></h2>
          {trips.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-3xl border border-dashed border-slate-200">
              <div className="bg-slate-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400">
                <Map size={32} />
              </div>
              <h3 className="font-bold text-slate-900 text-lg mb-1">Nenhuma viagem</h3>
              <p className="text-slate-400 text-sm mb-6 max-w-[200px] mx-auto">Comece planejando o roteiro dos seus sonhos hoje mesmo.</p>
              <Button onClick={() => setView('CREATE_TRIP')} variant="primary" className="shadow-lg shadow-blue-100">Criar Roteiro</Button>
            </div>
          ) : (
            <div className="space-y-4">
              {trips.map(trip => (
                <TripCard 
                  key={trip.id} 
                  trip={trip} 
                  onClick={(t) => { setSelectedTrip(t); setView('TRIP_DETAILS'); }} 
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}