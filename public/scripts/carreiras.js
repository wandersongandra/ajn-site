// Client-side interactions para o Portal de Carreiras AJN
// Conformidade rigorosa com CSP: sem eval, sem innerHTML, sem Web Storage.

document.addEventListener('DOMContentLoaded', () => {
  initJobFilters();
  initApplicationForm();
  initTrackingForm();
  initLgpdForm();
});

// 1. Filtros de busca no portal de vagas
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
}

// 2. Formulário de Candidatura e Banco de Talentos
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
      } else {
        showNotice(noticeBox, result.error || 'Não foi possível enviar a candidatura. Verifique os dados.', 'error');
      }
    } catch (err) {
      showNotice(noticeBox, 'Erro de comunicação com o servidor. Verifique sua conexão e tente novamente.', 'error');
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = submitBtn.getAttribute('data-orig-text') || 'Enviar Candidatura';
      }
    }
  });
}

// 3. Consulta de Candidatura por Código (Tracking)
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

// 4. Solicitação LGPD
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
      submitBtn.textContent = 'Registrando solicitação LGPD...';
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
          `${data.message} Protocolo gerado: ${data.protocol}`,
          'success'
        );
        form.reset();
      } else {
        showNotice(noticeBox, data.error || 'Erro ao processar solicitação.', 'error');
      }
    } catch {
      showNotice(noticeBox, 'Erro de conexão ao enviar solicitação.', 'error');
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Solicitar Exclusão Definitiva';
      }
    }
  });
}

function showNotice(el, msg, type) {
  if (!el) return;
  el.textContent = msg;
  el.className = `carreiras-notice carreiras-notice--${type}`;
  el.style.display = 'block';
}

function hideNotice(el) {
  if (!el) return;
  el.textContent = '';
  el.style.display = 'none';
}
