import type { JobApplication } from './job-application';

export interface Column {
  id: string;
  name: string;
  order: number;
  jobApplications: JobApplication[];
  colorLight: string;
  colorDark: string;
  icon: string;
  createdAt: Date;
  updatedAt: Date;
}
