
import React, { useState, useRef } from 'react';
import { FarmData, Language, IndexedPDF } from '../types';
import { CROPS, SEASONS, IRRIGATION_METHODS } from '../constants';
import { User, Home, MapPin, Sprout, Ruler, Database, Settings2, Droplets, Waves, FileText, Upload, X, CheckCircle2, FileUp, Loader2, Link2, Wifi, ShieldCheck } from 'lucide-react';

interface Props {
  onSave: (data: FarmData) => void;
  initialData: FarmData | null;
  isSaving: boolean;
  language: Language;
}

const FarmerProfile: React.FC<Props> = ({ onSave, initialData, isSaving, language }) => {
  const [indexingFiles, setIndexingFiles] = useState<string[]>([]);
  
  const [formData, setFormData] = useState<FarmData>(initialData || {
    farmerName: '',
    farmName: '',
    location: '',
    season: SEASONS[0],
    crop: CROPS[0],
    area: 5,
    irrigationMethod: IRRIGATION_METHODS[0],
    groundwaterLevel: 25,
    rainfallIndex: 0,
    soilMoisture: 45,
    plantingDate: new Date().toISOString().split('T')[0],
    knowledgeBase: [
      { id: '1', name: 'Wheat_Irrigation_Manual_v1.pdf', size: '1.2 MB', date: '2024-05-12', status: 'indexed' },
      { id: '2', name: 'Soil_Health_Guidelines.pdf', size: '2.5 MB', date: '2024-06-01', status: 'indexed' }
    ],
    firebase: {
      enabled: false,
      databaseURL: '',
      deviceId: '',
      apiKey: '',
      minMoisture: 400, 
      maxMoisture: 1024
    }
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    if (name.startsWith('firebase.')) {
      const field = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        firebase: {
          ...prev.firebase!,
          [field]: type === 'checkbox' 
            ? (e.target as HTMLInputElement).checked 
            : (['minMoisture', 'maxMoisture'].includes(field)) ? parseFloat(value) : value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: (['area', 'groundwaterLevel', 'rainfallIndex', 'soilMoisture'].includes(name))
          ? parseFloat(value) 
          : value
      }));
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const fileList = Array.from(files) as File[];
    const newFileIds = fileList.map(() => Math.random().toString(36).substring(7));
    
    setIndexingFiles(prev => [...prev, ...newFileIds]);

    setTimeout(() => {
      const newFiles: IndexedPDF[] = fileList.map((file, idx) => ({
        id: newFileIds[idx],
        name: file.name,
        size: `${(file.size / 1024 / 1024).toFixed(1)} MB`,
        date: new Date().toISOString().split('T')[0],
        status: 'indexed'
      }));

      setFormData(prev => ({
        ...prev,
        knowledgeBase: [...(prev.knowledgeBase || []), ...newFiles]
      }));
      setIndexingFiles(prev => prev.filter(id => !newFileIds.includes(id)));
    }, 2500);
  };

  const removeFile = (id: string) => {
    setFormData(prev => ({
      ...prev,
      knowledgeBase: (prev.knowledgeBase || []).filter(f => f.id !== id)
    }));
  };

  const handleGetCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((pos) => {
        setFormData(prev => ({ ...prev, location: `${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)}` }));
      });
    }
  };

  

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in slide-in-from-bottom-4 duration-500 pb-20">
      <div className="glass-card p-6 md:p-10 rounded-3xl shadow-xl border border-emerald-100/20">
        <div className="mb-8 text-center md:text-left">
          <h2 className="text-3xl font-heading font-bold text-emerald-900">Farmer Profile</h2>
          <p className="text-gray-500">Set up your farm parameters and IoT connectivity for smart budgeting.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-emerald-600 uppercase tracking-widest flex items-center">
              <User className="w-4 h-4 mr-2" /> Identity & Farm
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1 uppercase tracking-tight">Farmer Name</label>
                <input type="text" name="farmerName" value={formData.farmerName} onChange={handleChange} className="w-full p-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none" required />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1 uppercase tracking-tight">Farm Name</label>
                <input type="text" name="farmName" value={formData.farmName} onChange={handleChange} className="w-full p-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none" required />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-bold text-emerald-600 uppercase tracking-widest flex items-center">
              <Home className="w-4 h-4 mr-2" /> Parameters
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1 uppercase tracking-tight">Location</label>
                  <div className="flex space-x-2">
                    <input type="text" name="location" value={formData.location} onChange={handleChange} className="flex-1 p-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none" required />
                    <button type="button" onClick={handleGetCurrentLocation} className="p-3 bg-emerald-50 text-emerald-600 rounded-xl hover:bg-emerald-100 transition-colors">📍</button>
                  </div>
                </div>
               
              </div>
              
            </div>
          </div>

          <hr className="border-gray-100" />

          <hr className="border-gray-100" />

          
          <button type="submit" disabled={isSaving} className={`w-full py-4 rounded-2xl text-white font-bold text-lg shadow-xl flex items-center justify-center transition-all ${isSaving ? 'bg-emerald-300' : 'bg-emerald-600 hover:bg-emerald-700 hover:-translate-y-1'}`}>
            {isSaving ? <><Loader2 className="w-5 h-5 animate-spin mr-3" /> Processing...</> : 'Save Profile & Start Monitoring'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default FarmerProfile;
