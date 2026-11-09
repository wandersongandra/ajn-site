import { INITIAL_JOB_POSTINGS } from '../../worker/db/seed';

export interface CareerJob {
  id: string;
  title: string;
  slug: string;
  department: string;
  location: string;
  employmentType: string;
  experienceLevel: string;
  description: string;
  requirements: string;
  differentials?: string;
  benefits?: string;
  salaryMin?: number;
  salaryMax?: number;
  salaryIsDisclosed?: boolean;
  status: string;
  openingsCount: number;
  publishedAt: Date | null;
}

// Em conformidade com o requisito P0 Item 6:
// Vagas de teste são mantidas como rascunho.
// Somente vagas com aprovação explícita são publicadas no portal público.
export const APPROVED_JOB_POSTINGS: CareerJob[] = INITIAL_JOB_POSTINGS;
