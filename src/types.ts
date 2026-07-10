export type SystemType = 'cardiovascular' | 'digestive' | 'respiratory' | 'nervous';

export interface BodySystem {
  id: SystemType;
  name: string;
  nameEn: string;
  description: string;
  color: string; // Tailwind color class or hex
  accentColor: string; // Glowing theme color
  speedLabel: string;
  envTemperature: string;
  surroundingPH: string;
  scanTargets: ScanTarget[];
}

export interface ScanTarget {
  id: string;
  name: string;
  description: string;
  hint: string;
  x: number; // 3D offset from path center
  y: number;
  z: number;
  scanned: boolean;
}

export interface Vector3D {
  x: number;
  y: number;
  z: number;
}

export interface Vertex2D {
  x: number;
  y: number;
  zDepth: number;
  valid: boolean;
}

export interface Particle3D {
  id: string;
  type: string;
  position: Vector3D;
  velocity: Vector3D;
  size: number;
  color: string;
  pulse?: number;
  extra?: any; // For custom properties
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant' | 'system';
  text: string;
  timestamp: string;
  scanData?: {
    targetName: string;
    systemName: string;
    analysis: string;
  };
}
