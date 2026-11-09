import { Hono } from 'hono';
import { eq, and, like, or } from 'drizzle-orm';
import * as schema from '../db/schema';
import type { Env, HonoVariables } from '../types';

export function createPublicJobsRoutes(dbFactory: (env: Env) => any) {
  const router = new Hono<{ Bindings: Env; Variables: HonoVariables }>();

  // Listagem pública de vagas disponíveis com filtros de busca
  router.get('/', async (c) => {
    const db = dbFactory(c.env);
    const department = c.req.query('department');
    const location = c.req.query('location');
    const type = c.req.query('type');
    const level = c.req.query('level');
    const q = c.req.query('q')?.trim();

    const conditions = [eq(schema.jobPostings.status, 'published')];

    if (department) {
      conditions.push(eq(schema.jobPostings.department, department));
    }
    if (location) {
      conditions.push(like(schema.jobPostings.location, `%${location}%`));
    }
    if (type) {
      conditions.push(eq(schema.jobPostings.employmentType, type));
    }
    if (level) {
      conditions.push(eq(schema.jobPostings.experienceLevel, level));
    }
    if (q) {
      conditions.push(
        or(
          like(schema.jobPostings.title, `%${q}%`),
          like(schema.jobPostings.description, `%${q}%`)
        )!
      );
    }

    const jobs = await db
      .select({
        id: schema.jobPostings.id,
        title: schema.jobPostings.title,
        slug: schema.jobPostings.slug,
        department: schema.jobPostings.department,
        location: schema.jobPostings.location,
        employmentType: schema.jobPostings.employmentType,
        experienceLevel: schema.jobPostings.experienceLevel,
        description: schema.jobPostings.description,
        salaryMin: schema.jobPostings.salaryMin,
        salaryMax: schema.jobPostings.salaryMax,
        salaryIsDisclosed: schema.jobPostings.salaryIsDisclosed,
        openingsCount: schema.jobPostings.openingsCount,
        publishedAt: schema.jobPostings.publishedAt,
        status: schema.jobPostings.status,
      })
      .from(schema.jobPostings)
      .where(and(...conditions))
      .all();

    // Sanitiza exibição salarial se não divulgada publicamente
    const publicJobs = jobs.map((job: any) => ({
      ...job,
      salaryMin: job.salaryIsDisclosed ? job.salaryMin : null,
      salaryMax: job.salaryIsDisclosed ? job.salaryMax : null,
    }));

    return c.json({ jobs: publicJobs, count: publicJobs.length });
  });

  // Detalhes da vaga individual por slug e dados estruturados Google Jobs (JSON-LD)
  router.get('/:slug', async (c) => {
    const db = dbFactory(c.env);
    const slug = c.req.param('slug');

    const job = await db
      .select()
      .from(schema.jobPostings)
      .where(and(eq(schema.jobPostings.slug, slug), eq(schema.jobPostings.status, 'published')))
      .get();

    if (!job) {
      return c.json({ error: 'Vaga não encontrada ou não está mais aberta.' }, 404);
    }

    let parsedRequirements = [];
    try {
      parsedRequirements = typeof job.requirements === 'string' && job.requirements.startsWith('[')
        ? JSON.parse(job.requirements)
        : [job.requirements];
    } catch {
      parsedRequirements = [job.requirements];
    }

    const jsonLd = {
      '@context': 'https://schema.org',
      '@type': 'JobPosting',
      title: job.title,
      description: job.description,
      datePosted: job.publishedAt ? new Date(job.publishedAt).toISOString() : new Date().toISOString(),
      employmentType: job.employmentType === 'CLT' ? 'FULL_TIME' : job.employmentType === 'Estágio' ? 'INTERN' : 'CONTRACTOR',
      hiringOrganization: {
        '@type': 'Organization',
        name: 'AJN Consultoria e Engenharia',
        sameAs: 'https://ajnengenharia.com.br',
        logo: 'https://ajnengenharia.com.br/images/branding/logo.png',
      },
      jobLocation: {
        '@type': 'Place',
        address: {
          '@type': 'PostalAddress',
          addressLocality: 'Belo Horizonte',
          addressRegion: 'MG',
          addressCountry: 'BR',
        },
      },
      baseSalary: job.salaryIsDisclosed && job.salaryMin
        ? {
            '@type': 'MonetaryAmount',
            currency: 'BRL',
            value: {
              '@type': 'QuantitativeValue',
              minValue: job.salaryMin,
              maxValue: job.salaryMax || job.salaryMin,
              unitText: 'MONTH',
            },
          }
        : undefined,
    };

    return c.json({
      job: {
        id: job.id,
        title: job.title,
        slug: job.slug,
        department: job.department,
        location: job.location,
        employmentType: job.employmentType,
        experienceLevel: job.experienceLevel,
        description: job.description,
        requirements: parsedRequirements,
        differentials: job.differentials,
        benefits: job.benefits,
        salaryMin: job.salaryIsDisclosed ? job.salaryMin : null,
        salaryMax: job.salaryIsDisclosed ? job.salaryMax : null,
        salaryIsDisclosed: job.salaryIsDisclosed,
        openingsCount: job.openingsCount,
        publishedAt: job.publishedAt,
        status: job.status,
        jsonLd,
      },
      jsonLd,
    });
  });

  return router;
}
