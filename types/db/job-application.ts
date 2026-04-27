export interface JobApplication {
  id: string;
  title: string;
  company: string;
  position: string;
  location?: string;
  status: string;
  appliedDate?: string;
  notes?: string;
  salary?: string;
  jobUrl?: string;
  order: number;
  userId?: string;
  boardId: string;
  columnId: string;
  tags?: string[];
  description?: string;
}

// export type CreateJobApplication = Omit<
//   JobApplication,
//   'id' | 'tags' | 'order' | 'status' | 'appliedDate'
// > & {
//   tags?: string;
// };

// export type UpdateJobApplication = Partial<CreateJobApplication>;

export interface UpdateJobOrder {
  id: string;
  columnId: string;
  order: number;
}
