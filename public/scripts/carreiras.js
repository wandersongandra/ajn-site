// Client-side interactions para o Portal de Carreiras AJN
// Conformidade rigorosa com CSP: sem eval, sem innerHTML, sem Web Storage.

function getConfiguredCareerApiOrigin() {
  if (typeof window === 'undefined' || !window.AJN_CARREIRAS_API_BASE) return '';

  try {
    const configuredUrl = new URL(window.AJN_CARREIRAS_API_BASE, window.location.origin);
    return configuredUrl.origin === window.location.origin ? configuredUrl.origin : '';
  } catch {
    return '';
  }
}

function getApiEndpoint(path) {
  if (!path) return '';
  if (typeof window === 'undefined') return '';

  try {
    const currentOrigin = window.location.origin;
    const requestedUrl = new URL(path, currentOrigin);
    const cleanPath = `${requestedUrl.pathname}${requestedUrl.search}`;
    const configuredOrigin = getConfiguredCareerApiOrigin();
    return configuredOrigin ? `${configuredOrigin}${cleanPath}` : cleanPath;
  } catch {
    return '';
  }
}

document.addEventListener('DOMContentLoaded', () => {
  initJobFilters();
  initApplicationForm();
  initTrackingForm();
  initLgpdForm();
  checkCurrentJobStatus();
});

// 1. Filtros de busca no portal de vagas com renderização dinâmica e sincronização com API
function initJobFilters() {
  const filterForm = document.querySelector('[data-carreiras-filters]');
  if (!filterForm) return;

  function applyFilters() {
    const cards = document.querySelectorAll('[data-job-card]');
    const countEl = document.querySelector('[data-jobs-count]');
    const q = (filterForm.querySelector('[name="q"]')?.value || '').toLowerCase().trim();
    const dept = (filterForm.querySelector('[name="department"]')?.value || '').toLowerCase();
    const type = (filterForm.querySelector('[name="type"]')?.value || '').toLowerCase();

    let visibleCount = 0;
    cards.forEach((card) => {
      if (card.getAttribute('data-closed') === 'true') {
        card.style.display = 'none';
        return;
      }

      const cardTitle = (card.getAttribute('data-title') || '').toLowerCase();
      const cardDept = (card.getAttribute('data-department') || '').toLowerCase();
      const cardType = (card.getAttribute('data-type') || '').toLowerCase();
      const cardDesc = (card.getAttribute('data-desc') || '').toLowerCase();

      const matchesQ = !q || cardTitle.includes(q) || cardDesc.includes(q);
      const matchesDept = !dept || cardDept === dept;
      const matchesType = !type || cardType === type;

      if (matchesQ && matchesDept && matchesType) {
        card.style.display = '';
        visibleCount++;
      } else {
        card.style.display = 'none';
      }
    });

    if (countEl) {
      countEl.textContent = String(visibleCount);
    }
  }

  filterForm.addEventListener('input', applyFilters);
  filterForm.addEventListener('change', applyFilters);

  // Carregamento dinâmico direto da API (Item 4: eliminação de dependência funcional estática)
  (async () => {
    try {
      const res = await fetch(getApiEndpoint('/api/jobs'), { credentials: 'include' });
      if (!res.ok) return;
      const data = await res.json();
      if (Array.isArray(data.jobs)) {
        renderLiveJobs(data.jobs);
        applyFilters();
      }
    } catch {
      // Falha silenciosa de rede: preserva cartões estáticos de fallback
    }
  })();
}

function renderLiveJobs(jobs) {
  const grid = document.querySelector('.carreiras-grid');
  if (!grid) return;

  while (grid.firstChild) {
    grid.removeChild(grid.firstChild);
  }

  const countEl = document.querySelector('[data-jobs-count]');
  if (countEl) countEl.textContent = String(jobs.length);

  if (jobs.length === 0) {
    const emptyBox = document.createElement('div');
    emptyBox.style.gridColumn = '1 / -1';
    emptyBox.style.textAlign = 'center';
    emptyBox.style.padding = '3rem 1rem';

    const p1 = document.createElement('p');
    p1.style.fontSize = '1.125rem';
    p1.style.color = 'var(--text-soft)';
    p1.textContent = 'No momento todas as oportunidades em aberto foram preenchidas.';

    const p2 = document.createElement('p');
    p2.style.marginTop = '1rem';
    const talentLink = document.createElement('a');
    talentLink.className = 'carreiras-button carreiras-button--primary';
    talentLink.href = '/carreiras/talentos/';
    talentLink.textContent = 'Cadastrar no Banco de Talentos';
    p2.appendChild(talentLink);

    emptyBox.appendChild(p1);
    emptyBox.appendChild(p2);
    grid.appendChild(emptyBox);
    return;
  }

  jobs.forEach((job) => {
    const card = document.createElement('article');
    card.className = 'carreiras-card';
    card.setAttribute('data-job-card', '');
    card.setAttribute('data-title', job.title || '');
    card.setAttribute('data-department', job.department || '');
    card.setAttribute('data-type', job.employmentType || '');
    card.setAttribute('data-desc', job.description || '');

    const topDiv = document.createElement('div');
    const badgesDiv = document.createElement('div');
    badgesDiv.className = 'carreiras-card-badges';

    const deptBadge = document.createElement('span');
    deptBadge.className = 'carreiras-badge carreiras-badge--primary';
    deptBadge.textContent = job.department || '';
    badgesDiv.appendChild(deptBadge);

    const typeBadge = document.createElement('span');
    typeBadge.className = 'carreiras-badge';
    typeBadge.textContent = job.employmentType || '';
    badgesDiv.appendChild(typeBadge);

    if (job.experienceLevel) {
      const expBadge = document.createElement('span');
      expBadge.className = 'carreiras-badge';
      expBadge.textContent = job.experienceLevel;
      badgesDiv.appendChild(expBadge);
    }
    topDiv.appendChild(badgesDiv);

    const titleH3 = document.createElement('h3');
    titleH3.className = 'carreiras-card-title';
    titleH3.textContent = job.title || '';
    topDiv.appendChild(titleH3);

    const descP = document.createElement('p');
    descP.className = 'carreiras-card-desc';
    descP.textContent = job.description || '';
    topDiv.appendChild(descP);

    const botDiv = document.createElement('div');
    const metaDiv = document.createElement('div');
    metaDiv.className = 'carreiras-card-meta';

    const locSpan = document.createElement('span');
    const locStrong = document.createElement('strong');
    locStrong.textContent = 'Local: ';
    locSpan.appendChild(locStrong);
    locSpan.appendChild(document.createTextNode(job.location || 'Belo Horizonte - MG'));
    metaDiv.appendChild(locSpan);

    if (job.salaryIsDisclosed && job.salaryMin && job.salaryMax) {
      const salSpan = document.createElement('span');
      const salStrong = document.createElement('strong');
      salStrong.textContent = 'Faixa salarial: ';
      salSpan.appendChild(salStrong);
      salSpan.appendChild(
        document.createTextNode(
          `R$ ${Number(job.salaryMin).toLocaleString('pt-BR')} a R$ ${Number(job.salaryMax).toLocaleString('pt-BR')}`
        )
      );
      metaDiv.appendChild(salSpan);
    }
    botDiv.appendChild(metaDiv);

    const applyA = document.createElement('a');
    applyA.className = 'carreiras-button carreiras-button--primary';
    applyA.style.width = '100%';
    applyA.href = `/carreiras/${job.slug}/`;
    applyA.textContent = 'Ver detalhes e candidatar-se →';
    botDiv.appendChild(applyA);

    card.appendChild(topDiv);
    card.appendChild(botDiv);
    grid.appendChild(card);
  });

  updateJobsJsonLd(jobs);
}

function updateJobsJsonLd(jobs) {
  let scriptEl = document.getElementById('dynamic-jobs-jsonld');
  if (!scriptEl) {
    scriptEl = document.createElement('script');
    scriptEl.id = 'dynamic-jobs-jsonld';
    scriptEl.type = 'application/ld+json';
    document.head.appendChild(scriptEl);
  }

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'Vagas em aberto na AJN Consultoria e Engenharia',
    numberOfItems: jobs.length,
    itemListElement: jobs.map((job, idx) => ({
      '@type': 'ListItem',
      position: idx + 1,
      item: {
        '@type': 'JobPosting',
        title: job.title,
        description: job.description,
        employmentType: job.employmentType === 'CLT' ? 'FULL_TIME' : 'CONTRACTOR',
        hiringOrganization: {
          '@type': 'Organization',
          name: 'AJN Consultoria e Engenharia',
          sameAs: 'https://ajnengenharia.com.br',
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
      },
    })),
  };

  scriptEl.textContent = JSON.stringify(jsonLd);
}

// 2. Verificação de status e hidratação dinâmica da vaga individual ao carregar a página
async function checkCurrentJobStatus() {
  const dynamicPage = document.querySelector('[data-dynamic-job-page]');
  const form = document.querySelector('[data-application-form]');

  // Extrai o slug da URL atual (parâmetro ?slug= ou segmento /carreiras/:slug/)
  let slug = '';
  const searchParams = new URLSearchParams(window.location.search);
  const paramSlug = searchParams.get('slug');
  if (paramSlug) {
    slug = paramSlug.trim();
  } else {
    const pathParts = window.location.pathname.split('/').filter(Boolean);
    if (pathParts[0] === 'carreiras' && pathParts[1] && !['talentos', 'acompanhamento', 'vaga'].includes(pathParts[1])) {
      slug = pathParts[1].trim();
    }
  }

  // Se não extraiu da URL, tenta do atributo action do formulário
  if (!slug && form) {
    const action = form.getAttribute('action') || '';
    const match = action.match(/\/jobs\/([^/]+)\/apply/);
    if (match) slug = match[1];
  }

  if (!slug) return;

  const closedBox = document.getElementById('job-closed-box');
  const detailsContainer = document.getElementById('job-details-container');

  try {
    const res = await fetch(getApiEndpoint(`/api/jobs/${encodeURIComponent(slug)}`), { credentials: 'include' });

    if (res.status === 404 || !res.ok) {
      // Vaga não encontrada ou encerrada
      if (closedBox && detailsContainer) {
        detailsContainer.style.display = 'none';
        closedBox.style.display = 'block';
      }

      if (form) {
        const noticeBox = form.querySelector('[data-notice]');
        const submitBtn = form.querySelector('button[type="submit"]');
        if (noticeBox) {
          showNotice(
            noticeBox,
            'Atenção: Esta oportunidade foi encerrada ou preenchida e não aceita novas inscrições no momento. Você ainda pode cadastrar seu currículo em nosso Banco de Talentos.',
            'error'
          );
        }
        if (submitBtn) {
          submitBtn.disabled = true;
          submitBtn.textContent = 'Inscrições Encerradas';
        }
        const inputs = form.querySelectorAll('input, textarea, select');
        inputs.forEach((input) => {
          input.disabled = true;
        });
      }

      const existingLd = document.getElementById('dynamic-job-posting-jsonld');
      if (existingLd) existingLd.remove();
      return;
    }

    const data = await res.json();
    const job = data.job;
    if (!job) return;

    // Se estiver em uma página dinâmica de vaga, hidrata os dados completos no DOM
    if (dynamicPage) {
      if (closedBox) closedBox.style.display = 'none';
      if (detailsContainer) detailsContainer.style.display = 'block';

      // Atualiza título da página e do documento
      document.title = `${job.title} | Carreiras AJN`;
      const titleEl = dynamicPage.querySelector('[data-job-title]');
      if (titleEl) titleEl.textContent = job.title;

      // Badges
      const deptEl = dynamicPage.querySelector('[data-job-department]');
      if (deptEl) deptEl.textContent = job.department || 'Geral';

      const typeEl = dynamicPage.querySelector('[data-job-type]');
      if (typeEl) typeEl.textContent = job.employmentType || 'CLT';

      const levelEl = dynamicPage.querySelector('[data-job-level]');
      if (levelEl) levelEl.textContent = job.experienceLevel || 'Pleno';

      const locEl = dynamicPage.querySelector('[data-job-location]');
      if (locEl) locEl.textContent = job.location || 'Belo Horizonte - MG';

      // Salário
      const salaryEl = dynamicPage.querySelector('[data-job-salary]');
      if (salaryEl) {
        if (job.salaryIsDisclosed && job.salaryMin) {
          salaryEl.textContent = `Faixa Salarial: R$ ${job.salaryMin.toLocaleString('pt-BR')}${
            job.salaryMax ? ' a R$ ' + job.salaryMax.toLocaleString('pt-BR') : ''
          } / mês`;
          salaryEl.style.display = 'block';
        } else {
          salaryEl.style.display = 'none';
        }
      }

      // Descrição
      const descEl = dynamicPage.querySelector('[data-job-desc]');
      if (descEl) descEl.textContent = job.description;

      // Requisitos
      const reqList = dynamicPage.querySelector('[data-job-requirements]');
      if (reqList && Array.isArray(job.requirements)) {
        while (reqList.firstChild) reqList.removeChild(reqList.firstChild);
        job.requirements.forEach((req) => {
          const li = document.createElement('li');
          li.textContent = req;
          reqList.appendChild(li);
        });
      }

      // Diferenciais
      const diffBox = dynamicPage.querySelector('[data-job-differentials-box]');
      const diffEl = dynamicPage.querySelector('[data-job-differentials]');
      if (diffBox && diffEl) {
        if (job.differentials) {
          diffEl.textContent = job.differentials;
          diffBox.style.display = 'block';
        } else {
          diffBox.style.display = 'none';
        }
      }

      // Benefícios
      const benBox = dynamicPage.querySelector('[data-job-benefits-box]');
      const benEl = dynamicPage.querySelector('[data-job-benefits]');
      if (benBox && benEl) {
        if (job.benefits) {
          benEl.textContent = job.benefits;
          benBox.style.display = 'block';
        } else {
          benBox.style.display = 'none';
        }
      }

      // Atualiza action do formulário de candidatura
      if (form) {
        form.setAttribute('action', `/api/applications/jobs/${encodeURIComponent(job.slug)}/apply`);
      }
    }

    // Injeta / atualiza o JSON-LD Google Jobs estruturado na head
    if (job.jsonLd) {
      let jobScript = document.getElementById('dynamic-job-posting-jsonld');
      if (!jobScript) {
        jobScript = document.createElement('script');
        jobScript.id = 'dynamic-job-posting-jsonld';
        jobScript.type = 'application/ld+json';
        document.head.appendChild(jobScript);
      }
      jobScript.textContent = JSON.stringify(job.jsonLd);
    }
  } catch (err) {
    // Falha de conexão ou rede na verificação
  }
}

// 3. Formulário de Candidatura e Banco de Talentos com Turnstile e OTP de Titularidade
function initApplicationForm() {
  const form = document.querySelector('[data-application-form]');
  if (!form) return;

  const fileInput = form.querySelector('input[type="file"]');
  const fileLabel = form.querySelector('[data-file-label]');
  const noticeBox = form.querySelector('[data-notice]');
  const submitBtn = form.querySelector('button[type="submit"]');

  if (fileInput && fileLabel) {
    fileInput.addEventListener('change', () => {
      if (fileInput.files && fileInput.files.length > 0) {
        const file = fileInput.files[0];
        if (file.size > 5 * 1024 * 1024) {
          showNotice(noticeBox, 'O currículo excede o limite de 5 MB.', 'error');
          fileInput.value = '';
          fileLabel.textContent = 'Clique para selecionar o currículo (PDF, DOC, DOCX até 5 MB)';
          return;
        }
        fileLabel.textContent = `Arquivo selecionado: ${file.name} (${Math.round(file.size / 1024)} KB)`;
      } else {
        fileLabel.textContent = 'Clique para selecionar o currículo (PDF, DOC, DOCX até 5 MB)';
      }
    });
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    hideNotice(noticeBox);

    const formData = new FormData(form);
    const resume = formData.get('resume');
    if (!resume || !(resume instanceof File) || resume.size === 0) {
      showNotice(noticeBox, 'Por favor, selecione seu currículo antes de enviar.', 'error');
      return;
    }

    // Obtenção do token Turnstile do widget ou input hidden
    const turnstileToken =
      formData.get('cf-turnstile-response') ||
      (window.turnstile ? window.turnstile.getResponse() : '') ||
      '';
    if (!turnstileToken) {
      showNotice(noticeBox, 'A verificação antispam ainda não foi concluída. Tente novamente em instantes.', 'error');
      return;
    }
    formData.set('turnstileToken', String(turnstileToken));

    const endpoint = form.getAttribute('action') || '/api/applications/talent-pool';

    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.setAttribute('data-orig-text', submitBtn.textContent || '');
      submitBtn.textContent = 'Enviando candidatura com segurança...';
    }

    try {
      const response = await fetch(getApiEndpoint(endpoint), {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });

      const result = await response.json();

      if (response.ok && result.success) {
        showNotice(
          noticeBox,
          `${result.message} Código de rastreamento: ${result.trackingCode}`,
          'success'
        );
        form.reset();
        if (fileLabel) {
          fileLabel.textContent = 'Clique para selecionar o currículo (PDF, DOC, DOCX até 5 MB)';
        }
      } else if (response.status === 409 && result.verificationRequired) {
        // Exige código de verificação para alteração cadastral por CPF ou e-mail (Item 3)
        showNotice(
          noticeBox,
          result.error ||
            'Cadastro prévio localizado. Um código de verificação de 6 dígitos foi enviado ao seu e-mail cadastrado.',
          'error'
        );

        let tokenInput = form.querySelector('[name="verificationToken"]');
        if (!tokenInput) {
          const group = document.createElement('div');
          group.className = 'carreiras-field carreiras-form-full';
          const label = document.createElement('label');
          label.className = 'carreiras-label';
          label.textContent = 'Código de Verificação de Titularidade (6 dígitos enviado ao e-mail): *';
          tokenInput = document.createElement('input');
          tokenInput.className = 'carreiras-input';
          tokenInput.name = 'verificationToken';
          tokenInput.type = 'text';
          tokenInput.maxLength = 6;
          tokenInput.placeholder = 'Digite o código de 6 dígitos';
          tokenInput.required = true;
          tokenInput.style.letterSpacing = '0.15em';
          tokenInput.style.fontWeight = 'bold';
          tokenInput.style.textAlign = 'center';
          tokenInput.style.fontSize = '1.25rem';
          group.appendChild(label);
          group.appendChild(tokenInput);

          const gridContainer = form.querySelector('.carreiras-form-grid');
          const submitContainer = submitBtn?.parentElement;
          if (gridContainer && submitContainer) {
            gridContainer.insertBefore(group, submitContainer);
          } else {
            form.appendChild(group);
          }
          tokenInput.focus();
        }
      } else {
        showNotice(noticeBox, result.error || 'Não foi possível enviar a candidatura. Verifique os dados.', 'error');
      }
    } catch (err) {
      showNotice(noticeBox, 'Erro de comunicação com o servidor. Verifique sua conexão e tente novamente.', 'error');
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = submitBtn.getAttribute('data-orig-text') || 'Confirmar e Enviar Candidatura';
      }
    }
  });
}

// 4. Consulta e Recuperação Segura de Candidatura
function initTrackingForm() {
  const form = document.querySelector('[data-tracking-form]');
  if (!form) return;

  const resultContainer = document.querySelector('[data-tracking-result]');
  const noticeBox = form.querySelector('[data-notice]');
  const submitBtn = form.querySelector('button[type="submit"]');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    hideNotice(noticeBox);
    if (resultContainer) resultContainer.style.display = 'none';

    const codeInput = form.querySelector('[name="code"]');
    const code = codeInput ? codeInput.value.trim().toUpperCase() : '';
    if (!code) {
      showNotice(noticeBox, 'Informe o código de acompanhamento (ex: AJN-2026-X8K9M).', 'error');
      return;
    }

    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = 'Consultando...';
    }

    try {
      const response = await fetch(getApiEndpoint(`/api/applications/track/${encodeURIComponent(code)}`), {
        credentials: 'include',
      });
      const data = await response.json();

      if (response.ok && data.application) {
        renderTrackingResult(resultContainer, data.application);
      } else {
        showNotice(noticeBox, data.error || 'Candidatura não localizada para o código informado.', 'error');
      }
    } catch (err) {
      showNotice(noticeBox, 'Erro ao consultar o servidor. Tente novamente mais tarde.', 'error');
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Consultar Status';
      }
    }
  });

  // Fluxo de recuperação de código com verificação de posse do e-mail
  const recoveryForm = document.querySelector('[data-recovery-form]');
  if (recoveryForm) {
    const recNotice = recoveryForm.querySelector('[data-notice]');
    const recBtn = recoveryForm.querySelector('button[type="submit"]');

    recoveryForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      hideNotice(recNotice);

      const email = recoveryForm.querySelector('[name="email"]')?.value.trim();
      const cpf = recoveryForm.querySelector('[name="cpf"]')?.value.trim();
      const codeInput = recoveryForm.querySelector('[name="recoveryCode"]');
      const code = codeInput?.value.trim();
      const turnstileToken =
        recoveryForm.querySelector('[name="cf-turnstile-response"]')?.value ||
        (window.turnstile ? window.turnstile.getResponse() : '');

      if (!email || !cpf) {
        showNotice(recNotice, 'Preencha seu e-mail e CPF.', 'error');
        return;
      }

      if (!code) {
        if (recBtn) {
          recBtn.disabled = true;
          recBtn.textContent = 'Enviando código...';
        }

        try {
          const res = await fetch(getApiEndpoint('/api/applications/recover-tracking'), {
            method: 'POST',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, cpf, turnstileToken }),
          });
          const data = await res.json();
          if (res.ok && data.success) {
            showNotice(recNotice, data.message, 'success');
            const codeGroup = recoveryForm.querySelector('[data-code-group]');
            if (codeGroup) codeGroup.style.display = 'block';
            if (codeInput) codeInput.focus();
            if (recBtn) recBtn.textContent = 'Confirmar Código e Ver Candidaturas';
          } else {
            showNotice(recNotice, data.error || 'Não foi possível solicitar o código.', 'error');
          }
        } catch {
          showNotice(recNotice, 'Erro de conexão.', 'error');
        } finally {
          if (recBtn) recBtn.disabled = false;
        }
      } else {
        if (recBtn) {
          recBtn.disabled = true;
          recBtn.textContent = 'Validando código...';
        }

        try {
          const res = await fetch(getApiEndpoint('/api/applications/verify-recovery'), {
            method: 'POST',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, code }),
          });
          const data = await res.json();
          if (res.ok && Array.isArray(data.applications) && data.applications.length > 0) {
            showNotice(
              recNotice,
              `Recuperação realizada com sucesso! Código: ${data.applications[0].trackingCode}`,
              'success'
            );
            if (resultContainer) {
              renderTrackingResult(resultContainer, data.applications[0]);
            }
          } else {
            showNotice(recNotice, data.error || 'Código incorreto ou expirado.', 'error');
          }
        } catch {
          showNotice(recNotice, 'Erro de conexão ao verificar código.', 'error');
        } finally {
          if (recBtn) recBtn.disabled = false;
        }
      }
    });
  }
}

function renderTrackingResult(container, app) {
  if (!container) return;

  const codeEl = container.querySelector('[data-track-code]');
  const jobEl = container.querySelector('[data-track-job]');
  const deptEl = container.querySelector('[data-track-dept]');
  const stageEl = container.querySelector('[data-track-stage]');
  const statusEl = container.querySelector('[data-track-status]');
  const dateEl = container.querySelector('[data-track-date]');

  if (codeEl) codeEl.textContent = app.trackingCode;
  if (jobEl) jobEl.textContent = app.jobTitle;
  if (deptEl) deptEl.textContent = app.department;
  if (stageEl) stageEl.textContent = app.currentStage || app.stage || 'Em processamento';
  if (statusEl) statusEl.textContent = app.status;
  if (dateEl && app.appliedAt) {
    const d = new Date(app.appliedAt);
    dateEl.textContent = d.toLocaleDateString('pt-BR');
  }

  container.style.display = 'block';
  container.scrollIntoView({ behavior: 'smooth' });
}

// 5. Solicitação LGPD
function initLgpdForm() {
  const form = document.querySelector('[data-lgpd-form]');
  if (!form) return;

  const noticeBox = form.querySelector('[data-notice]');
  const submitBtn = form.querySelector('button[type="submit"]');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    hideNotice(noticeBox);

    const email = form.querySelector('[name="email"]')?.value.trim();
    const cpf = form.querySelector('[name="cpf"]')?.value.trim();
    const reason = form.querySelector('[name="reason"]')?.value.trim();
    const turnstileToken =
      form.querySelector('[name="cf-turnstile-response"]')?.value ||
      (window.turnstile ? window.turnstile.getResponse() : '');

    if (!email || !cpf) {
      showNotice(noticeBox, 'Preencha seu e-mail e CPF para validar a solicitação.', 'error');
      return;
    }

    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = 'Enviando requerimento...';
    }

    try {
      const response = await fetch(getApiEndpoint('/api/lgpd/deletion-request'), {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, cpf, reason, turnstileToken }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        showNotice(
          noticeBox,
          'Requerimento registrado com sucesso! Nosso Encarregado de Dados (DPO) analisará a solicitação e responderá no prazo legal.',
          'success'
        );
        form.reset();
      } else {
        showNotice(noticeBox, data.error || 'Não foi possível registrar o requerimento. Verifique os dados.', 'error');
      }
    } catch (err) {
      showNotice(noticeBox, 'Erro de conexão ao processar solicitação. Tente novamente mais tarde.', 'error');
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Solicitar Exclusão Definitiva';
      }
    }
  });
}

function showNotice(box, message, type) {
  if (!box) return;
  box.textContent = message;
  box.className = `carreiras-notice carreiras-notice--${type}`;
  box.style.display = 'block';
}

function hideNotice(box) {
  if (!box) return;
  box.style.display = 'none';
  box.textContent = '';
}
