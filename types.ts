
export type Language = 'en' | 'he' | 'hi';

export type GrowthStage = 'Germination' | 'Seedling' | 'Vegetative' | 'Flowering' | 'Fruiting' | 'Maturity' | 'Harvest';

export interface IndexedPDF {
  id: string;
  name: string;
  size: string;
  date: string;
  status: 'indexed' | 'processing' | 'error';
}

export interface FirebaseSettings {
  apiKey?: string;
  databaseURL?: string;
  projectId?: string;
  deviceId?: string;
  enabled: boolean;
  minMoisture?: number;
  maxMoisture?: number;
}

export interface FarmData {


  
  farmerName: string;
  farmName: string;
  location: string;
  lat?: number;
  lon?: number;
  season: string;
  crop: string;
  area: number;
  irrigationMethod: string;
  groundwaterLevel: number; 
  rainfallIndex: number; 
  soilMoisture: number;

  ndvi?: number;
  ndwi?: number;

  vci?: number;
  smi?: number;

  evi?: number;
  humidity?: number;
  rainfall?: number;
  temperature?: number;
  stress?: number;
  
  classificationAccuracy?: number;
  kappaCoefficient?: number;

  stressIndex?: number;

  yieldPotential?: number;

  droughtRisk?: string;

  growthStage?: GrowthStage;
  plantingDate?: string;
  firebase?: FirebaseSettings; 
  knowledgeBase?: IndexedPDF[];


 

  
}

export interface CropHealth {
  score: number;
  status: 'Excellent' | 'Good' | 'Fair' | 'Poor';
  lastChecked: string;
  growthStage: GrowthStage;
  biomassIndex: number;
  metrics: {
    ndvi: number;
    leafTurgor: number;
    soilPh: number;
    npk: { n: number; p: number; k: number };
  };
}

export interface GroundingSource {
  title: string;
  uri: string;
}

export interface FarmAlert {
  id: string;
  type: 'danger' | 'warning' | 'info';
  message: string;
  action: string;
  timestamp: string;
}

export interface CalendarEvent {
  id: string;
  title: string;
  date: string;
  time: string;
  amount: string;
  type: 'irrigation' | 'fertilizer' | 'harvest';
}

export interface EnvironmentalRisks {
  diseasePressure: number;
  heatStress: number;
  nutrientLeaching: number;
  statusMessages: {
    disease: string;
    heat: string;
    leaching: string;
  };
}

// Added VideoVisual interface for video generation features
export interface VideoVisual {
  id: string;
  prompt: string;
  url: string;
  timestamp: string;
  thumbnail?: string;
}

export interface BudgetResult {
  totalWaterNeeded: number;
  expectedRainContribution: number;
  groundwaterUsage: number;
  efficiencyScore: number;
  netDeficit: number;
  targetMoisture: number;
  recommendations: string[];
  breakdown: {
    category: string;
    value: number;
  }[];
  sources?: GroundingSource[];
  alerts?: FarmAlert[];
  cropHealth?: CropHealth;
  risks?: EnvironmentalRisks;
  weather?: {
    temp: number;
    humidity: number;
    forecast: string;
    windSpeed: number;
  };
  pathwayMetrics?: {
    moistureVelocity: number;
    temporalConfidence: number;
    communityBenchmark: number;
    anomalyScore: number;
  };
}

export enum NavigationTab {
  DASHBOARD = 'dashboard',
  PROFILE = 'profile',
  SENSORS = 'sensors',
  INSIGHTS = 'insights',
  ASSISTANT = 'assistant',
  CALENDAR = 'calendar',
  VIDEO = 'video'
}
