export interface User {
  id: number;
  email: string;
  full_name: string;
  role: 'ADMIN' | 'LITBANG';
  is_active: boolean;
  created_at: string;
}

export interface MasterPos {
  id: number;
  building: string;
  name: string;
  code: string;
  description?: string;
  display_order: number;
  is_active: boolean;
  created_at: string;
}

export interface EventPos {
  id: string;
  event_id: string;
  building: string;
  name: string;
  code: string;
  token: string;
  is_active: boolean;
  created_at: string;
}

export interface EventSession {
  id: string;
  name: string;
  category: string;
  description?: string;
  start_time: string;
  end_time?: string;
  status: 'SCHEDULED' | 'OPEN' | 'COMPLETED';
  capacity_target?: number;
  enable_capacity_warning: boolean;
  area_capacities?: Record<string, number>;
  evaluation_notes?: string;
  created_at: string;
  updated_at: string;
  pos_list: EventPos[];
}

export interface ObservationItem {
  id?: string;
  category: string;
  note: string;
}

export interface EvaluationNotes {
  observations: ObservationItem[];
  recommendations?: string;
  conclusion?: string;
  photo_url?: string;
}

export interface PosStatItem {
  pos_id: string;
  building: string;
  pos_name: string;
  total: number;
  paroki_bintaro: number;
  luar_paroki: number;
}

export interface BuildingStatItem {
  building: string;
  total: number;
  paroki_bintaro: number;
  luar_paroki: number;
  pos_count: number;
  capacity_target?: number;
  capacity_percentage?: number;
  capacity_status?: 'NORMAL' | 'WARNING' | 'FULL';
}

export interface TimeSeriesBucket {
  time_label: string;
  total: number;
  paroki_bintaro: number;
  luar_paroki: number;
}

export interface LiveStats {
  event_id: string;
  event_name: string;
  category: string;
  status: 'SCHEDULED' | 'OPEN' | 'COMPLETED';
  start_time: string;
  capacity_target?: number;
  enable_capacity_warning: boolean;
  area_capacities?: Record<string, number>;
  total_umat: number;
  paroki_bintaro_count: number;
  luar_paroki_count: number;
  paroki_bintaro_percentage: number;
  luar_paroki_percentage: number;
  capacity_percentage?: number;
  capacity_status: 'NORMAL' | 'WARNING' | 'FULL';
  building_breakdown?: BuildingStatItem[];
  pos_breakdown: PosStatItem[];
  time_series: TimeSeriesBucket[];
  evaluation_notes?: string;
  last_updated: string;
}

export interface PosInfo {
  event_id: string;
  event_name: string;
  category: string;
  event_status: string;
  pos_id: string;
  building: string;
  pos_name: string;
  pos_code: string;
  start_time: string;
}

export interface TapQueueItem {
  id: string;
  posToken: string;
  choiceCode: 'PAROKI_BINTARO' | 'LUAR_PAROKI';
  clientTimestamp: string;
  metadata?: Record<string, any>;
}
