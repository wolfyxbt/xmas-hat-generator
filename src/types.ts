export interface Hat {
  id: string;
  name: string;
  src: string; // URL or Base64
}

export interface PlacedHat extends Hat {
  uid: string; // Unique instance ID
  x: number;
  y: number;
  scale: number;
  rotation: number;
  isMirrored: boolean;
}