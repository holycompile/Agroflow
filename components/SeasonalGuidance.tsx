
import React, { useState } from 'react';
import { Sprout, Calendar, Bug, Sun, Thermometer, Droplets, ArrowRight, ShieldCheck, Clock, CalendarDays, Gauge, X, Sparkles, CheckCircle, FileText } from 'lucide-react';
import { FarmData, BudgetResult, CalendarEvent, Language } from '../types';
import { GoogleGenAI } from '@google/genai';
import { getGeminiApiKey } from '../utils/geminiHelper';

interface Props {
  data: FarmData | null;
  budget: BudgetResult | null;
  onAddEvent?: (event: CalendarEvent) => void;
  language: Language;
}

interface TaskDetail {
  title: string;
  date: string;
  time: string;
  amount: string;
  instruction: string;
  sourceDoc?: string;
}

const SeasonalGuidance: React.FC<Props> = ({ data, budget, onAddEvent, language }) => {
  const [selectedTask, setSelectedTask] = useState<string | null>(null);
  const [taskDetail, setTaskDetail] = useState<TaskDetail | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [addedSuccess, setAddedSuccess] = useState(false);

  if (!data || !budget) return null;

  const risks = budget.risks || {
    diseasePressure: 25,
    heatStress: 15,
    nutrientLeaching: 10,
    statusMessages: { disease: "Low", heat: "Optimal", leaching: "None" }
  };

  const handleTaskClick = async (title: string) => {
    if (!title.toLowerCase().includes('irrigation') && !title.toLowerCase().includes('water')) {
      return;
    }

    setSelectedTask(title);
    setLoadingDetail(true);
    setAddedSuccess(false);
    
    try {
      const apiKey = getGeminiApiKey();
      if (!apiKey) {
        throw new Error("GEMINI_API_KEY_MISSING");
      }
      const ai = new GoogleGenAI({ apiKey });
      const currentDate = new Date();
      
      const availableDocs = (data.knowledgeBase || []).map(d => d.name).join(", ");

      const prompt = `
        Act as an irrigation engineer. Provide a precision schedule for the task: "${title}".
        TODAY'S DATE IS: ${currentDate.toDateString()}. 
        Farm Context: ${data.crop} in ${data.location}. 
        Budget Need: ${budget.totalWaterNeeded} m³.
        Current Moisture: ${data.soilMoisture}%.
        Target: ${budget.targetMoisture}%.
        
        AVAILABLE MANUALS: ${availableDocs || "Standard_Practices"}.

        Provide a JSON response with the following keys (values must be in ${language}):
        - title: The task title
        - date: Suggested date in YYYY-MM-DD format
        - time: Optimal time (e.g. 05:30 AM)
        - amount: Precise water volume for THIS specific session (e.g. 450 m³)
        - instruction: 20-word technical instruction.
        - sourceDoc: Name of the manual from the list above that matches this advice.
      `;

      const res = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
        config: { responseMimeType: "application/json" }
      });

      const detail = JSON.parse(res.text || '{}');
      setTaskDetail(detail);
    } catch (e: any) {
      console.error(e);
      if (e?.message === "GEMINI_API_KEY_MISSING") {
        setTaskDetail({
          title: title,
          date: new Date(Date.now() + 86400000).toISOString().split('T')[0],
          time: "06:00 AM",
          amount: `${Math.round(budget.totalWaterNeeded / 7)} m³`,
          instruction: language === 'hi'
            ? "स्थानीय गणना लागू की गई। Gemini API कुंजी अनुपलब्ध है। इसे सक्षम करने के लिए .env में VITE_GEMINI_API_KEY सेट करें।"
            : language === 'he'
            ? "מצב חישוב מקומי מופעל. מפתח ה-API חסר. הגדר VITE_GEMINI_API_KEY בקובץ ה-.env שלך."
            : "Offline-mode calculations applied. Gemini API Key is missing. Please configure VITE_GEMINI_API_KEY in a local .env file inside VS Code.",
          sourceDoc: "Offline Soil Engine"
        });
      }
    } finally {
      setLoadingDetail(false);
    }
  };

  const handleAddToCalendar = () => {
    if (taskDetail && onAddEvent) {
      onAddEvent({
        id: Math.random().toString(36).substr(2, 9),
        title: taskDetail.title,
        date: taskDetail.date,
        time: taskDetail.time,
        amount: taskDetail.amount,
        type: 'irrigation'
      });
      setAddedSuccess(true);
      setTimeout(() => {
        setSelectedTask(null);
        setAddedSuccess(false);
      }, 1500);
    }
  };

  const getRiskColor = (level: number) => {
              if (level > 70) return "bg-red-500";
              if (level > 40) return "bg-amber-500";
              return "bg-emerald-500";
            };

            const cropHealth = Math.round(data.ndvi * 100);

          const waterEfficiency = Math.min(
            100,
            Math.round(data.smi * 5)
          );

          const droughtRisk =
            data.vci < 35
              ? "High"
              : data.vci < 50
              ? "Moderate"
              : "Low";

          const waterStress =
            data.stress > 0.6
              ? "High"
              : data.stress > 0.3
              ? "Moderate"
              : "Low";

          const growthTrend =
            data.vci > 50 ? "Improving" : "Declining";

          const yieldPrediction =
            (data.area * (data.ndvi + 0.5)).toFixed(1);





  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      <div className="bg-emerald-900 rounded-3xl p-8 text-white relative overflow-hidden shadow-2xl">
        <div className="relative z-10">
          <h2 className="text-3xl font-heading font-bold mb-2">Seasonal Action Roadmap</h2>



          <p className="text-emerald-200 text-lg opacity-80">Personalized plan for your {data.crop} in {data.location}</p>
          
          {/* kpi section */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-8">
              <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl">
                <p className="text-xs text-emerald-200">Crop Health</p>
                <h3 className="text-2xl font-bold">
                  {cropHealth}%
                </h3>
              </div>

              <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl">
                <p className="text-xs text-emerald-200">Water Efficiency</p>
                <h3 className="text-2xl font-bold">
                  {waterEfficiency}%
                </h3>
              </div>

              <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl">
                <p className="text-xs text-emerald-200">Drought Risk</p>
                <h3 className="text-2xl font-bold">
                  {droughtRisk}
                </h3>
              </div>

              <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl">
                <p className="text-xs text-emerald-200">Yield Prediction</p>
                <h3 className="text-2xl font-bold">
                  {yieldPrediction} T
                </h3>
              </div>
            </div>



            {/* Crop-intelligence section */}
            <div className="mt-8 bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-emerald-400/20">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-white">
                  Crop Intelligence
                </h3>

                <span className="text-xs px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-200">
                  Satellite Derived
                </span>
              </div>

              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">

                <div className="bg-black/10 rounded-xl p-4">
                  <p className="text-xs text-emerald-200">NDVI Score</p>
                  <h3 className="text-2xl font-bold">
                    {data.ndvi.toFixed(2)}
                  </h3>
                </div>

                <div className="bg-black/10 rounded-xl p-4">
                  <p className="text-xs text-emerald-200">Water Stress</p>
                  <h3 className="text-2xl font-bold">
                    {waterStress}
                  </h3>
                </div>

                <div className="bg-black/10 rounded-xl p-4">
                  <p className="text-xs text-emerald-200">Disease Risk</p>
                  <h3 className="text-2xl font-bold">
                    {risks.heatStress > 60 ? "Medium" : "Low"}
                  </h3>
                </div>

                <div className="bg-black/10 rounded-xl p-4">
                  <p className="text-xs text-emerald-200">Growth Trend</p>
                  <h3 className="text-2xl font-bold text-emerald-300">
                    {growthTrend}
                  </h3>
                </div>

              </div>

             
            </div>



          
        </div>
        <div className="absolute right-0 bottom-0 opacity-10 pointer-events-none">
          <Sprout size={400} />
        </div>
      </div>

     

     
    </div>
  );
};

const TaskItem = ({ icon, title, desc, priority, onClick, isInteractive }: any) => (
  <div 
    onClick={onClick}
    className={`bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-start space-x-4 group hover:border-emerald-200 hover:shadow-md transition-all ${isInteractive ? 'cursor-pointer' : ''}`}
  >
    <div className="p-3 bg-gray-50 rounded-xl group-hover:scale-110 transition-transform">{icon}</div>
    <div className="flex-1">
      <div className="flex justify-between items-center mb-1">
        <h4 className="font-bold text-gray-900">{title}</h4>
        <span className={`text-[10px] font-bold px-2 py-1 rounded-full uppercase ${
          priority === 'High' ? 'bg-red-100 text-red-600' : 'bg-amber-100 text-amber-600'
        }`}>{priority} Priority</span>
      </div>
      <p className="text-sm text-gray-500 leading-snug">{desc}</p>
      {isInteractive && (
        <div className="mt-3 flex items-center text-[10px] font-bold text-blue-600 uppercase tracking-widest">
           <Sparkles className="w-3 h-3 mr-1" /> Consult Knowledge Base
        </div>
      )}
    </div>
    <div className="self-center p-2 text-gray-300 group-hover:text-emerald-500 transition-colors">
      <ArrowRight className="w-5 h-5" />
    </div>
  </div>
);


export default SeasonalGuidance;
