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

// Em conformidade estrita com o requisito P0 Item 2:
// Nenhuma vaga fictícia ou em rascunho (draft) é pré-renderizada no HTML estático.
// O portal público exibe exclusivamente vagas aprovadas e publicadas em tempo real via Cloudflare D1.
export const APPROVED_JOB_POSTINGS: CareerJob[] = [];
