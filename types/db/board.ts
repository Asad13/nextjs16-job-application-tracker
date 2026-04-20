import type { Column } from './column';

export interface Board {
  id: string;
  name: string;
  description: string;
  userId: string;
  columns: Column[];
  isDefault: boolean;
  colorLight: string;
  colorDark: string;
  createdAt: Date;
  updatedAt: Date;
}
