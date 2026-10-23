export enum ReportType {
  Load = 'Load',
  Unload = 'Unload',
  Mixed = 'Load/Unload',
}

export type VehicleOperationType = 'Load' | 'Unload';

export interface VehicleEntry {
  id: string;
  number: string;
  type: VehicleOperationType;
}

export interface StaffInfo {
  id: string;
  name: string;
  phone: string;
}

export interface StaffMember {
  id: string;
  name: string;
  title: string;
  phone: string;
}

export interface DailyReportRecord {
  id: string;
  date: string; // YYYY-MM-DD
  displayDate: string; // DD/MM/YYYY
  time: string; // HH:mm:ss
  reportType: ReportType;
  vehicles: string[];
  vehicleCount: number;
  staffId: string;
  staffName: string;
  staffPhone: string;
  reportText: string;
  createdAt: number;
  notes?: string;
}
