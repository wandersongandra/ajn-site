import { Hono } from 'hono';
import { eq, and, like, or } from 'drizzle-orm';
import * as schema from '../db/schema';
import type { Env, HonoVariables } from '../types';

function escapeHtml(str: string): string {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function serializeJsonLd(value: unknown): string {
  return (JSON.stringify(value) ?? 'null')
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/&/g, '\\u0026')
    .replace(/\u2028/g, '\\u2028')
    .replace(/\u2029/g, '\\u2029');
}

function normalizeCanonicalBase(value: string, fallback: string = 'https://carreiras.ajnengenharia.com.br'): string {
  try {
    return new URL(value).origin;
  } catch {
    return fallback;
  }
}

function getCanonicalBase(request: Request, env?: Env): string {
  const configured = env?.APP_URL?.trim();
  if (configured) return normalizeCanonicalBase(configured);
  if (env?.ENVIRONMENT === 'staging') return new URL(request.url).origin;
  return normalizeCanonicalBase('', new URL(request.url).origin);
}

function renderNotFoundHtml(): string {
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Vaga Não Encontrada | AJN Carreiras</title>
  <meta name="robots" content="noindex, follow">
  <link rel="stylesheet" href="/styles/global.css">
  <link rel="stylesheet" href="/styles/carreiras.css">
</head>
<body>
  <div class="carreiras-page">
    <div class="site-shell" style="text-align: center; padding: 4rem 1.5rem;">
      <div style="font-size: 3rem; margin-bottom: 1rem;" aria-hidden="true">🔒</div>
      <h1 class="carreiras-title">Esta oportunidade não está mais aberta</h1>
      <p class="carreiras-lead" style="max-width: 600px; margin: 0 auto 2rem;">
        O processo seletivo para esta vaga foi encerrado ou preenchido por nossa equipe. Você pode conferir nossas vagas ativas ou cadastrar seu currículo em nosso Banco de Talentos.
      </p>
      <div style="display: flex; gap: 1rem; justify-content: center; flex-wrap: wrap;">
        <a class="carreiras-button carreiras-button--primary" href="/carreiras/">Ver Vagas Abertas ←</a>
        <a class="carreiras-button carreiras-button--secondary" href="/carreiras/talentos/">Cadastrar no Banco de Talentos ↗</a>
      </div>
    </div>
  </div>
</body>
</html>`;
}

function renderJobListHtml(jobs: any[], canonicalBase: string): string {
  const jobCards = jobs.length > 0
    ? jobs.map((job) => `
        <article class="carreiras-card">
          <div class="carreiras-card-badges">
            <span class="carreiras-badge carreiras-badge--primary">${escapeHtml(job.department)}</span>
            <span class="carreiras-badge">${escapeHtml(job.employmentType)}</span>
            <span class="carreiras-badge">${escapeHtml(job.location)}</span>
          </div>
          <h2 class="carreiras-card-title">${escapeHtml(job.title)}</h2>
          <p class="carreiras-card-desc">${escapeHtml(job.description ? job.description.slice(0, 160) + '...' : '')}</p>
          <div style="margin-top: 1.5rem;">
            <a class="carreiras-button carreiras-button--primary" style="width: 100%; text-align: center;" href="/carreiras/${escapeHtml(job.slug)}/">
              Ver Detalhes e Inscrever-se →
            </a>
          </div>
        </article>
      `).join('\n')
    : `
        <div class="carreiras-empty" style="text-align: center; padding: 3rem 1.5rem; background: #fff; border-radius: 8px; border: 1px solid #e2e8f0; grid-column: 1 / -1;">
          <h2 style="font-size: 1.35rem; color: #0b1528; margin-bottom: 0.75rem;">Oportunidades em Atualização</h2>
          <p style="color: #64748b; max-width: 540px; margin: 0 auto 1.5rem;">
            No momento não há processos seletivos públicos com inscrições abertas. Cadastre seu currículo em nosso Banco de Talentos para ser contatado em futuras oportunidades.
          </p>
          <a class="carreiras-button carreiras-button--primary" href="/carreiras/talentos/">Cadastrar no Banco de Talentos ↗</a>
        </div>
      `;

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: 'Carreiras e Oportunidades | AJN Consultoria e Engenharia',
    url: `${canonicalBase}/carreiras/`,
  };

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Vagas e Oportunidades | AJN Carreiras</title>
  <meta name="description" content="Oportunidades profissionais na AJN Consultoria e Engenharia. Consulte vagas abertas ou envie seu currículo ao nosso Banco de Talentos.">
  <link rel="canonical" href="${escapeHtml(canonicalBase)}/carreiras/">
  <link rel="stylesheet" href="/styles/global.css">
  <link rel="stylesheet" href="/styles/carreiras.css">
  <script type="application/ld+json">${serializeJsonLd(jsonLd)}</script>
</head>
<body>
  <div class="carreiras-page">
    <div class="site-shell">
      <header class="carreiras-header">
        <span class="carreiras-eyebrow">Recrutamento e Seleção</span>
        <h1 class="carreiras-title">Oportunidades Profissionais</h1>
        <p class="carreiras-lead">
          Faça parte da AJN Consultoria e Engenharia. Trabalhe em projetos de alto impacto com segurança, ética e inovação.
        </p>
      </header>

      <nav class="carreiras-nav-bar" aria-label="Navegação Carreiras">
        <a class="carreiras-nav-link" href="/carreiras/" aria-current="page">Vagas Abertas</a>
        <a class="carreiras-nav-link" href="/carreiras/talentos/">Banco de Talentos</a>
        <a class="carreiras-nav-link" href="/carreiras/acompanhamento/">Acompanhar Candidatura</a>
        <a class="carreiras-nav-link" href="/admin/carreiras/">Acesso Recrutador</a>
      </nav>

      <div class="carreiras-grid">
        ${jobCards}
      </div>
    </div>
  </div>
</body>
</html>`;
}

function renderJobHtml(
  job: any,
  requirements: string[],
  jsonLd: any,
  siteKey: string,
  canonicalBase: string = 'https://carreiras.ajnengenharia.com.br'
): string {
  const reqItems = requirements.map((r) => `<li>${escapeHtml(r)}</li>`).join('\n');
  const salaryHtml = job.salaryIsDisclosed && job.salaryMin
    ? `<p style="font-size: 1.25rem; font-weight: 600; color: var(--brand-action, #166534); margin-top: 0.5rem;">Faixa Salarial: R$ ${job.salaryMin.toLocaleString('pt-BR')}${job.salaryMax ? ' a R$ ' + job.salaryMax.toLocaleString('pt-BR') : ''} / mês</p>`
    : '';
  const diffHtml = job.differentials
    ? `<section style="margin-bottom: 2rem;"><h2 style="font-size: 1.5rem; color: #0b1528; margin-bottom: 1rem;">Diferenciais Valorizados</h2><p style="font-size: 1.0625rem; line-height: 1.7; color: #475569;">${escapeHtml(job.differentials)}</p></section>`
    : '';
  const benHtml = job.benefits
    ? `<section><h2 style="font-size: 1.5rem; color: #0b1528; margin-bottom: 1rem;">Benefícios Oferecidos</h2><p style="font-size: 1.0625rem; line-height: 1.7; color: #475569;">${escapeHtml(job.benefits)}</p></section>`
    : '';

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtml(job.title)} | Carreiras AJN</title>
  <meta name="description" content="Vaga de ${escapeHtml(job.title)} na AJN Consultoria e Engenharia em ${escapeHtml(job.location)}. Conheça os requisitos e candidate-se online.">
  <link rel="canonical" href="${escapeHtml(canonicalBase)}/carreiras/${escapeHtml(job.slug)}/">
  <link rel="stylesheet" href="/styles/global.css">
  <link rel="stylesheet" href="/styles/carreiras.css">
  <script type="application/ld+json">${serializeJsonLd(jsonLd)}</script>
</head>
<body>
  <div class="carreiras-page">
    <div class="site-shell">
      <nav class="carreiras-nav-bar" style="margin-top: 0;" aria-label="Navegação de retorno">
        <a class="carreiras-nav-link" href="/carreiras/">← Voltar para todas as vagas</a>
        <a class="carreiras-nav-link" href="#candidatura">Ir para formulário de inscrição ↓</a>
      </nav>

      <header class="carreiras-header" style="text-align: left; max-width: 100%; margin-bottom: 2.5rem;">
        <div class="carreiras-card-badges" style="margin-bottom: 1rem;">
          <span class="carreiras-badge carreiras-badge--primary">${escapeHtml(job.department)}</span>
          <span class="carreiras-badge">${escapeHtml(job.employmentType)}</span>
          <span class="carreiras-badge">${escapeHtml(job.experienceLevel || '')}</span>
          <span class="carreiras-badge">${escapeHtml(job.location)}</span>
        </div>
        <h1 class="carreiras-title">${escapeHtml(job.title)}</h1>
        ${salaryHtml}
      </header>

      <div style="display: grid; grid-template-columns: minmax(0, 1.8fr) minmax(320px, 1.2fr); gap: 2.5rem; align-items: start; margin-bottom: 4rem;">
        <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; padding: 2.5rem; box-shadow: 0 1px 3px rgba(0,0,0,0.08);">
          <section style="margin-bottom: 2rem;">
            <h2 style="font-size: 1.5rem; color: #0b1528; margin-bottom: 1rem;">Descrição da Oportunidade</h2>
            <p style="font-size: 1.0625rem; line-height: 1.7; color: #475569;">${escapeHtml(job.description)}</p>
          </section>

          <section style="margin-bottom: 2rem;">
            <h2 style="font-size: 1.5rem; color: #0b1528; margin-bottom: 1rem;">Requisitos Obrigatórios</h2>
            <ul style="list-style: disc; padding-left: 1.25rem; line-height: 1.8; color: #475569;">
              ${reqItems}
            </ul>
          </section>

          ${diffHtml}
          ${benHtml}
        </div>

        <div class="carreiras-form-container" id="candidatura" style="max-width: 100%; margin: 0;">
          <h2 style="font-size: 1.5rem; color: #0b1528; margin-bottom: 0.5rem; text-align: center;">Inscreva-se nesta Vaga</h2>
          <p style="font-size: 0.9375rem; color: #64748b; margin-bottom: 1.5rem; text-align: center;">Preencha seus dados e anexe seu currículo atualizado em PDF ou DOCX.</p>
          <div class="carreiras-notice" data-notice role="alert"></div>
          <form action="/api/applications/jobs/${escapeHtml(job.slug)}/apply" method="POST" enctype="multipart/form-data" data-application-form>
            <div class="carreiras-form-grid">
              <div class="carreiras-field carreiras-form-full">
                <label class="carreiras-label" for="apply-name">Nome Completo *</label>
                <input class="carreiras-input" id="apply-name" name="fullName" type="text" required minlength="3" placeholder="Seu nome completo" />
              </div>
              <div class="carreiras-field">
                <label class="carreiras-label" for="apply-email">E-mail *</label>
                <input class="carreiras-input" id="apply-email" name="email" type="email" required placeholder="seu.email@exemplo.com" />
              </div>
              <div class="carreiras-field">
                <label class="carreiras-label" for="apply-phone">Telefone / WhatsApp *</label>
                <input class="carreiras-input" id="apply-phone" name="phone" type="tel" required placeholder="(31) 99999-9999" />
              </div>
              <div class="carreiras-field">
                <label class="carreiras-label" for="apply-cpf">CPF (apenas dígitos) *</label>
                <input class="carreiras-input" id="apply-cpf" name="cpf" type="text" required placeholder="000.000.000-00" />
              </div>
              <div class="carreiras-field">
                <label class="carreiras-label" for="apply-city">Cidade *</label>
                <input class="carreiras-input" id="apply-city" name="city" type="text" required placeholder="Ex: Belo Horizonte" />
              </div>
              <div class="carreiras-field">
                <label class="carreiras-label" for="apply-state">Estado (UF) *</label>
                <input class="carreiras-input" id="apply-state" name="state" type="text" required maxlength="2" placeholder="MG" style="text-transform: uppercase;" />
              </div>
              <div class="carreiras-field">
                <label class="carreiras-label" for="apply-title">Cargo / Formação Atual</label>
                <input class="carreiras-input" id="apply-title" name="currentTitle" type="text" placeholder="Ex: Engenheiro de Segurança" />
              </div>
              <div class="carreiras-field carreiras-form-full">
                <label class="carreiras-label" for="apply-linkedin">Perfil do LinkedIn (opcional)</label>
                <input class="carreiras-input" id="apply-linkedin" name="linkedinUrl" type="url" placeholder="https://linkedin.com/in/seuperfil" />
              </div>
              <div class="carreiras-field carreiras-form-full">
                <label class="carreiras-label" for="apply-summary">Breve Resumo Profissional</label>
                <textarea class="carreiras-textarea" id="apply-summary" name="summary" rows="3" placeholder="Destaque suas principais experiências e projetos..."></textarea>
              </div>
              <div class="carreiras-field carreiras-form-full">
                <label class="carreiras-label">Currículo Atualizado (PDF, DOC ou DOCX até 5 MB) *</label>
                <div class="carreiras-file-drop">
                  <label for="apply-resume" style="cursor: pointer;">
                    <div style="font-size: 1.75rem; margin-bottom: 0.5rem;" aria-hidden="true">📄</div>
                    <span data-file-label style="font-size: 0.875rem; color: #166534; font-weight: 500;">
                      Clique para selecionar o currículo (PDF, DOC, DOCX até 5 MB)
                    </span>
                  </label>
                  <input id="apply-resume" name="resume" type="file" required accept=".pdf,.doc,.docx" style="position: absolute; opacity: 0; width: 1px; height: 1px;" />
                </div>
              </div>
              <div class="carreiras-field carreiras-form-full">
                <div class="carreiras-checkbox-group">
                  <input id="apply-consent-terms" name="consentTerms" type="checkbox" value="true" required />
                  <label class="carreiras-checkbox-label" for="apply-consent-terms">
                    Concordo com o tratamento dos meus dados pessoais pela AJN Consultoria e Engenharia exclusivamente para fins de processos seletivos, nos termos da <a href="/politica-de-privacidade/" target="_blank" rel="noopener noreferrer">Política de Privacidade</a> e da LGPD. *
                  </label>
                </div>
                <div class="carreiras-checkbox-group">
                  <input id="apply-consent-retention" name="consentRetention" type="checkbox" value="true" checked />
                  <label class="carreiras-checkbox-label" for="apply-consent-retention">
                    Autorizo a AJN a manter meu currículo no banco de talentos pelo período de até 2 anos para futuras oportunidades profissionais.
                  </label>
                </div>
              </div>
              <div class="carreiras-field carreiras-form-full">
                <div class="cf-turnstile" data-sitekey="${escapeHtml(siteKey)}" data-theme="light"></div>
              </div>
              <div class="carreiras-form-full" style="margin-top: 1rem;">
                <button class="carreiras-button carreiras-button--primary" style="width: 100%;" type="submit">
                  Confirmar e Enviar Candidatura <span aria-hidden="true">✓</span>
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  </div>
  <script src="https://challenges.cloudflare.com/turnstile/v0/api.js" async defer></script>
  <script src="/scripts/carreiras.js" defer></script>
</body>
</html>`;
}

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

    const acceptsHtml = c.req.header('accept')?.includes('text/html');
    if (acceptsHtml) {
      const canonicalBase = getCanonicalBase(c.req.raw, c.env);
      return c.html(renderJobListHtml(publicJobs, canonicalBase), 200);
    }

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

    const acceptsHtml = c.req.header('accept')?.includes('text/html');

    if (!job) {
      c.header('Cache-Control', 'no-store');
      c.header('X-Robots-Tag', 'noindex, follow');
      if (acceptsHtml) {
        return c.html(renderNotFoundHtml(), 404);
      }
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

    const siteKey = c.env?.TURNSTILE_SITE_KEY || (c.env?.ENVIRONMENT === 'test' ? '1x00000000000000000000AA' : '');
    const canonicalBase = getCanonicalBase(c.req.raw, c.env);

    if (acceptsHtml) {
      return c.html(renderJobHtml(job, parsedRequirements, jsonLd, siteKey, canonicalBase), 200);
    }

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
