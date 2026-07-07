export interface CareGuideItem {
  watering: string;
  light: string;
  fertilizer: string;
  soil: string;
}

export interface TreatmentStep {
  step: number;
  titleEn: string;
  titleFa: string;
  descriptionEn: string;
  descriptionFa: string;
}

export interface PreventionTip {
  titleEn: string;
  titleFa: string;
  descriptionEn: string;
  descriptionFa: string;
}

export interface PlantAnalysisResult {
  plantNameEn: string;
  plantNameFa: string;
  scientificName: string;
  healthStatus: "healthy" | "warning" | "critical";
  healthDescriptionEn: string;
  healthDescriptionFa: string;
  diseaseNameEn: string | null;
  diseaseNameFa: string | null;
  diseaseDescriptionEn: string | null;
  diseaseDescriptionFa: string | null;
  soilMoisture: "dry" | "moderate" | "wet";
  soilCondition: string;
  soilConditionFa: string;
  moistureDescriptionEn: string;
  moistureDescriptionFa: string;
  treatmentSteps: TreatmentStep[];
  careGuide: CareGuideItem;
  careGuideFa: {
    watering: string;
    light: string;
    fertilizer: string;
    soil: string;
  };
  preventionTips: PreventionTip[];
  confidence: number;
}

export interface ApiUser {
  id: string;
  email: string;
  name: string;
  username: string;
  avatar: string | null;
  bio: string | null;
  country: string | null;
  city: string | null;
}

export interface PlantProfile {
  id: string;
  nameEn: string;
  nameFa: string;
  scientificName: string | null;
  imageUrl: string | null;
  healthStatus: string;
  environment: string;
  notes: string | null;
  careGuide: unknown;
  carePlan: unknown;
  lastWateredAt: string | null;
  lastFertilizedAt: string | null;
  acquiredAt: string;
  createdAt: string;
  updatedAt: string;
  _count?: { careReminders: number };
}

export interface CarePlanTaskView {
  type: string;
  intervalDays: number;
  titleEn: string;
  titleFa: string;
  notesEn: string;
  notesFa: string;
}

export interface PostWithMeta {
  id: string;
  content: string;
  imageUrl: string | null;
  createdAt: string;
  user: {
    id: string;
    name: string;
    username: string;
    avatar: string | null;
  };
  _count: {
    likes: number;
    comments: number;
  };
  likedByUser: boolean;
  isFollowing?: boolean;
}

export interface QuestionWithMeta {
  id: string;
  title: string;
  content: string;
  category: string;
  tags: string[];
  solved: boolean;
  createdAt: string;
  user: {
    id: string;
    name: string;
    username: string;
    avatar: string | null;
  };
  _count: {
    answers: number;
  };
}

export interface CareReminderItem {
  id: string;
  titleEn: string;
  titleFa: string;
  type: string;
  scheduledAt: string;
  completed: boolean;
  recurring: string | null;
  notes: string | null;
  plant: {
    id: string;
    nameEn: string;
    nameFa: string;
  } | null;
}
