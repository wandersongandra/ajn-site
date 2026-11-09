// Client-side interactions para o Portal de Carreiras AJN
// Conformidade rigorosa com CSP: sem eval, sem innerHTML, sem Web Storage.

document.addEventListener('DOMContentLoaded', () => {
  initJobFilters();
  initApplicationForm();
  initTrackingForm();
  initLgpdForm();
  checkCurrentJobStatus();
});

// 1. Filtros de busca no portal de vagas com sincronização ao vivo com a API
function initJobFilters() {
  const filterForm = document.querySelector('[data-carreiras-filters]');
  if (!filterForm) return;

  const cards = document.querySelectorAll('[data-job-card]');
  const countEl = document.querySelector('[data-jobs-count]');

  function applyFilters() {
    const q = (filterForm.querySelector('[name="q"]')?.value || '').toLowerCase().trim();
    const dept = (filterForm.querySelector('[name="department"]')?.value || '').toLowerCase();
    const type = (filterForm.querySelector('[name="type"]')?.value || '').toLowerCase();

    let visibleCount = 0;
    cards.forEach((card) => {
      // Se a vaga foi marcada como encerrada na sincronização ao vivo, não exibe
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

  // Sincronização em segundo plano com a API para refletir encerramentos e novas vagas em tempo real
  (async () => {
    try {
      const res = await fetch('/api/jobs');
      if (!res.ok) return;
      const data = await res.json();
      if (Array.isArray(data.jobs)) {
        const liveSlugs = new Set(data.jobs.map((j) => j.slug));
        cards.forEach((card) => {
          const link = card.querySelector('a[href*="/carreiras/"]');
          if (link) {
            const href = link.getAttribute('href') || '';
            const slug = href.replace(/\/+$/, '').split('/').pop();
            if (slug && !liveSlugs.has(slug)) {
              card.setAttribute('data-closed', 'true');
            }
          }
        });
        applyFilters();
      }
    } catch {
      // Falha silenciosa de rede: preserva os cartões estáticos
    }
  })();
}

// 2. Verificação de status da vaga individual ao carregar a página
async function checkCurrentJobStatus() {
  const form = document.querySelector('[data-application-form]');
  if (!form) return;

  const action = form.getAttribute('action') || '';
  if (!action.includes('/jobs/')) return;

  // Extrai o slug da rota /api/applications/jobs/:slug/apply
  const match = action.match(/\/jobs\/([^/]+)\/apply/);
  if (!match) return;
  const slug = match[1];

  try {
    const res = await fetch(`/api/jobs/${encodeURIComponent(slug)}`);
    if (res.status === 404 || !res.ok) {
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
  } catch {
    // Falha silenciosa de verificação preliminar
  }
}

// 3. Formulário de Candidatura e Banco de Talentos
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

    const endpoint = form.getAttribute('action') || '/api/applications/talent-pool';

    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.setAttribute('data-orig-text', submitBtn.textContent || '');
      submitBtn.textContent = 'Enviando candidatura com segurança...';
    }

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        body: formData,
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
        // Exige código de verificação para alteração cadastral por CPF (P0 Item 2)
        showNotice(
          noticeBox,
          result.error || 'Código de verificação necessário enviado para o e-mail cadastrado.',
          'error'
        );
        let tokenInput = form.querySelector('[name="verificationToken"]');
        if (!tokenInput) {
          const group = document.createElement('div');
          group.className = 'carreiras-form-group';
          const label = document.createElement('label');
          label.className = 'carreiras-label';
          label.textContent = 'Código de Verificação de Titularidade (6 dígitos):';
          tokenInput = document.createElement('input');
          tokenInput.className = 'carreiras-input';
          tokenInput.name = 'verificationToken';
          tokenInput.type = 'text';
          tokenInput.maxLength = 6;
          tokenInput.placeholder = 'Digite o código recebido no e-mail cadastrado';
          tokenInput.required = true;
          group.appendChild(label);
          group.appendChild(tokenInput);
          form.insertBefore(group, submitBtn.parentElement);
          tokenInput.focus();
        }
      } else {
        showNotice(noticeBox, result.error || 'Não foi possível enviar a candidatura. Verifique os dados.', 'error');
      }
    } catch (err) {
      showNotice(noticeBox, 'Erro de comunicação com o servidor. Verifique sua conexão e tente novamente.', 'error');
    } finally {
      if (submitBtn && !submitBtn.disabled) {
        submitBtn.disabled = false;
        submitBtn.textContent = submitBtn.getAttribute('data-orig-text') || 'Enviar Candidatura';
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
      const response = await fetch(`/api/applications/track/${encodeURIComponent(code)}`);
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

  // Fluxo de recuperação de código com verificação de posse do e-mail (P1 Item 10)
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

      if (!email || !cpf) {
        showNotice(recNotice, 'Preencha seu e-mail e CPF.', 'error');
        return;
      }

      // Se o campo do código ainda não foi preenchido, dispara a solicitação de OTP
      if (!code) {
        if (recBtn) {
          recBtn.disabled = true;
          recBtn.textContent = 'Enviando código...';
        }

        try {
          const res = await fetch('/api/applications/recover-tracking', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, cpf }),
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
        // Envia o código para confirmação segura
        if (recBtn) {
          recBtn.disabled = true;
          recBtn.textContent = 'Validando código...';
        }

        try {
          const res = await fetch('/api/applications/verify-recovery', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, code }),
          });
          const data = await res.json();
          if (res.ok && Array.isArray(data.applications) && data.applications.length > 0) {
            showNotice(recNotice, `Recuperação realizada com sucesso! Código: ${data.applications[0].trackingCode}`, 'success');
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
  if (stageEl) stageEl.textContent = app.currentStage;
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

    if (!email || !cpf) {
      showNotice(noticeBox, 'Preencha seu e-mail e CPF para validar a solicitação.', 'error');
      return;
    }

    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = 'Enviando requerimento...';
    }

    try {
      const response = await fetch('/api/lgpd/deletion-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, cpf, reason }),
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
