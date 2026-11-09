// Painel Administrativo de Recrutamento — AJN Carreiras
// Conformidade rigorosa com CSP: sem eval, sem innerHTML, sem Web Storage.

(() => {
  let authToken = '';
  let currentUser = null;
  let currentJobId = 'job-eng-seguranca';

  document.addEventListener('DOMContentLoaded', () => {
    initAdminApp();
  });

  function initAdminApp() {
    const loginCard = document.querySelector('[data-admin-login-card]');
    const dashboard = document.querySelector('[data-admin-dashboard]');
    const loginForm = document.querySelector('[data-admin-login-form]');
    const logoutBtn = document.querySelector('[data-admin-logout]');

    if (loginForm) {
      loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = loginForm.querySelector('[name="email"]')?.value.trim();
        const password = loginForm.querySelector('[name="password"]')?.value;
        const mfaCode = loginForm.querySelector('[name="mfaCode"]')?.value.trim();
        const noticeEl = loginForm.querySelector('[data-login-notice]');

        try {
          const res = await fetch('/api/admin/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password, mfaCode }),
          });

          const data = await res.json();
          if (res.ok && data.success) {
            authToken = data.token;
            currentUser = data.user;
            if (loginCard) loginCard.style.display = 'none';
            if (dashboard) dashboard.style.display = 'block';
            updateUserBadge();
            loadDashboardData();
          } else if (data.mfaRequired) {
            const mfaField = loginForm.querySelector('[data-mfa-field]');
            if (mfaField) mfaField.style.display = 'block';
            showNotice(noticeEl, 'Código MFA obrigatório. Digite o código do aplicativo autenticador.', 'error');
          } else {
            showNotice(noticeEl, data.error || 'Credenciais inválidas.', 'error');
          }
        } catch {
          showNotice(noticeEl, 'Erro ao conectar ao servidor de autenticação.', 'error');
        }
      });
    }

    if (logoutBtn) {
      logoutBtn.addEventListener('click', async () => {
        try {
          await fetch('/api/admin/auth/logout', {
            method: 'POST',
            headers: authToken ? { Authorization: `Bearer ${authToken}` } : {},
          });
        } catch {}
        authToken = '';
        currentUser = null;
        if (dashboard) dashboard.style.display = 'none';
        if (loginCard) loginCard.style.display = 'block';
      });
    }

    // Inicialização das abas administrativas
    const tabButtons = document.querySelectorAll('[data-admin-tab]');
    tabButtons.forEach((btn) => {
      btn.addEventListener('click', () => {
        const targetTab = btn.getAttribute('data-admin-tab');
        tabButtons.forEach((b) => b.setAttribute('aria-selected', 'false'));
        btn.setAttribute('aria-selected', 'true');

        document.querySelectorAll('[data-admin-pane]').forEach((pane) => {
          if (pane.getAttribute('data-admin-pane') === targetTab) {
            pane.style.display = 'block';
          } else {
            pane.style.display = 'none';
          }
        });

        if (targetTab === 'pipeline') loadPipeline(currentJobId);
        else if (targetTab === 'candidates') loadCandidates();
        else if (targetTab === 'jobs') loadJobs();
        else if (targetTab === 'lgpd') loadLgpdRequests();
        else if (targetTab === 'audit') loadAuditLogs();
      });
    });

    // Filtro de vaga no pipeline
    const jobSelect = document.querySelector('[data-pipeline-job-select]');
    if (jobSelect) {
      jobSelect.addEventListener('change', () => {
        currentJobId = jobSelect.value;
        loadPipeline(currentJobId);
      });
    }
  }

  function updateUserBadge() {
    const userBadge = document.querySelector('[data-admin-user-name]');
    const roleBadge = document.querySelector('[data-admin-user-role]');
    if (userBadge && currentUser) userBadge.textContent = currentUser.name;
    if (roleBadge && currentUser) roleBadge.textContent = currentUser.role;
  }

  async function loadDashboardData() {
    loadJobs();
    loadPipeline(currentJobId);
  }

  // 1. Carrega Vagas
  async function loadJobs() {
    const tableBody = document.querySelector('[data-jobs-tbody]');
    if (!tableBody) return;

    try {
      const res = await fetch('/api/admin/jobs', {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      const data = await res.json();
      if (!res.ok) return;

      while (tableBody.firstChild) tableBody.removeChild(tableBody.firstChild);

      const jobSelect = document.querySelector('[data-pipeline-job-select]');
      if (jobSelect) {
        while (jobSelect.firstChild) jobSelect.removeChild(jobSelect.firstChild);
      }

      data.jobs.forEach((job) => {
        const tr = document.createElement('tr');

        const tdTitle = document.createElement('td');
        const titleStrong = document.createElement('strong');
        titleStrong.textContent = job.title;
        tdTitle.appendChild(titleStrong);
        tr.appendChild(tdTitle);

        const tdDept = document.createElement('td');
        tdDept.textContent = job.department;
        tr.appendChild(tdDept);

        const tdLoc = document.createElement('td');
        tdLoc.textContent = job.location;
        tr.appendChild(tdLoc);

        const tdType = document.createElement('td');
        tdType.textContent = `${job.employmentType} (${job.experienceLevel})`;
        tr.appendChild(tdType);

        const tdStatus = document.createElement('td');
        const badge = document.createElement('span');
        badge.className = `carreiras-badge ${job.status === 'published' ? 'carreiras-badge--primary' : ''}`;
        badge.textContent = job.status === 'published' ? 'Publicada' : job.status;
        tdStatus.appendChild(badge);
        tr.appendChild(tdStatus);

        const tdCount = document.createElement('td');
        tdCount.textContent = String(job.applicationsCount || 0);
        tr.appendChild(tdCount);

        tableBody.appendChild(tr);

        if (jobSelect) {
          const opt = document.createElement('option');
          opt.value = job.id;
          opt.textContent = `${job.title} (${job.applicationsCount || 0} candidatos)`;
          if (job.id === currentJobId) opt.selected = true;
          jobSelect.appendChild(opt);
        }
      });
    } catch {}
  }

  // 2. Carrega Pipeline (Kanban)
  async function loadPipeline(jobId) {
    const boardEl = document.querySelector('[data-pipeline-board]');
    if (!boardEl) return;

    while (boardEl.firstChild) boardEl.removeChild(boardEl.firstChild);

    try {
      const res = await fetch(`/api/admin/pipeline/${encodeURIComponent(jobId)}`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      const data = await res.json();
      if (!res.ok) return;

      data.stages.forEach((stage) => {
        const col = document.createElement('div');
        col.className = 'pipeline-column';

        const header = document.createElement('div');
        header.className = 'pipeline-column-header';

        const title = document.createElement('h3');
        title.style.fontSize = '1rem';
        title.style.fontWeight = '600';
        title.textContent = stage.name;
        header.appendChild(title);

        const countBadge = document.createElement('span');
        countBadge.className = 'carreiras-badge';
        countBadge.textContent = String(stage.candidates ? stage.candidates.length : 0);
        header.appendChild(countBadge);

        col.appendChild(header);

        const cardsList = document.createElement('div');
        cardsList.className = 'pipeline-cards-list';

        if (stage.candidates && stage.candidates.length > 0) {
          stage.candidates.forEach((cand) => {
            const card = document.createElement('div');
            card.className = 'pipeline-candidate-card';

            const name = document.createElement('strong');
            name.textContent = cand.fullName;
            card.appendChild(name);

            const titleP = document.createElement('div');
            titleP.style.fontSize = '0.8rem';
            titleP.style.color = 'var(--text-soft)';
            titleP.textContent = cand.currentTitle || 'Perfil Geral';
            card.appendChild(titleP);

            const locP = document.createElement('div');
            locP.style.fontSize = '0.75rem';
            locP.style.color = 'var(--text-soft)';
            locP.textContent = `${cand.city} - ${cand.state}`;
            card.appendChild(locP);

            // Botão para avançar estágio
            const actions = document.createElement('div');
            actions.style.marginTop = '0.75rem';
            actions.style.display = 'flex';
            actions.style.gap = '0.5rem';

            const moveBtn = document.createElement('button');
            moveBtn.type = 'button';
            moveBtn.className = 'carreiras-button carreiras-button--secondary';
            moveBtn.style.padding = '0.35rem 0.65rem';
            moveBtn.style.fontSize = '0.75rem';
            moveBtn.textContent = 'Mover Etapa';
            moveBtn.addEventListener('click', () => {
              promptMoveStage(cand.id, data.stages);
            });
            actions.appendChild(moveBtn);

            card.appendChild(actions);
            cardsList.appendChild(card);
          });
        }

        col.appendChild(cardsList);
        boardEl.appendChild(col);
      });
    } catch {}
  }

  async function promptMoveStage(applicationId, stages) {
    const stageNames = stages.map((s, idx) => `${idx + 1}. ${s.name}`).join('\n');
    const choice = prompt(`Selecione a nova etapa para o candidato:\n\n${stageNames}\n\nDigite o número correspondente (1 a ${stages.length}):`);
    const num = parseInt(choice || '', 10);
    if (!num || num < 1 || num > stages.length) return;

    const targetStage = stages[num - 1];
    const notes = prompt('Observações do recrutador (humano):') || '';
    const ratingStr = prompt('Avaliação do candidato (1 a 5 estrelas):');
    const rating = ratingStr ? parseInt(ratingStr, 10) : undefined;

    try {
      const res = await fetch('/api/admin/pipeline/move-stage', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          applicationId,
          targetStageId: targetStage.id,
          rating,
          notes,
        }),
      });

      if (res.ok) {
        alert('Candidato movimentado com sucesso!');
        loadPipeline(currentJobId);
      } else {
        const err = await res.json();
        alert(err.error || 'Erro ao movimentar candidato.');
      }
    } catch {
      alert('Erro de conexão ao movimentar candidato.');
    }
  }

  // 3. Carrega Candidatos e Banco de Talentos
  async function loadCandidates() {
    const tableBody = document.querySelector('[data-candidates-tbody]');
    if (!tableBody) return;

    try {
      const res = await fetch('/api/admin/candidates', {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      const data = await res.json();
      if (!res.ok) return;

      while (tableBody.firstChild) tableBody.removeChild(tableBody.firstChild);

      data.candidates.forEach((cand) => {
        const tr = document.createElement('tr');

        const tdName = document.createElement('td');
        const strong = document.createElement('strong');
        strong.textContent = cand.fullName;
        tdName.appendChild(strong);
        tr.appendChild(tdName);

        const tdContact = document.createElement('td');
        tdContact.textContent = `${cand.email} | ${cand.phone}`;
        tr.appendChild(tdContact);

        const tdLoc = document.createElement('td');
        tdLoc.textContent = `${cand.city} - ${cand.state}`;
        tr.appendChild(tdLoc);

        const tdTitle = document.createElement('td');
        tdTitle.textContent = cand.currentTitle || 'Banco Geral';
        tr.appendChild(tdTitle);

        const tdActions = document.createElement('td');
        const dlBtn = document.createElement('button');
        dlBtn.type = 'button';
        dlBtn.className = 'carreiras-button carreiras-button--secondary';
        dlBtn.style.padding = '0.35rem 0.75rem';
        dlBtn.style.fontSize = '0.8125rem';
        dlBtn.textContent = 'Baixar Currículo (R2 Privado)';
        dlBtn.addEventListener('click', () => downloadResume(cand.id));
        tdActions.appendChild(dlBtn);
        tr.appendChild(tdActions);

        tableBody.appendChild(tr);
      });
    } catch {}
  }

  async function downloadResume(candidateId) {
    try {
      const res = await fetch(`/api/admin/candidates/${encodeURIComponent(candidateId)}/resume`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });

      if (!res.ok) {
        const err = await res.json();
        alert(err.error || 'Não foi possível baixar o currículo.');
        return;
      }

      const blob = await res.blob();
      const contentDisposition = res.headers.get('content-disposition');
      let filename = 'curriculo.pdf';
      if (contentDisposition) {
        const match = contentDisposition.match(/filename="?([^";]+)"?/);
        if (match) filename = decodeURIComponent(match[1]);
      }

      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      alert('Erro de conexão ao baixar currículo.');
    }
  }

  // 4. Carrega Solicitações LGPD
  async function loadLgpdRequests() {
    const tableBody = document.querySelector('[data-lgpd-tbody]');
    if (!tableBody) return;

    try {
      const res = await fetch('/api/admin/lgpd/requests', {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      const data = await res.json();
      if (!res.ok) return;

      while (tableBody.firstChild) tableBody.removeChild(tableBody.firstChild);

      data.requests.forEach((req) => {
        const tr = document.createElement('tr');

        const tdType = document.createElement('td');
        const badge = document.createElement('span');
        badge.className = 'carreiras-badge';
        badge.textContent = req.requestType === 'deletion' ? 'Exclusão Definitiva' : 'Exportação';
        tdType.appendChild(badge);
        tr.appendChild(tdType);

        const tdCand = document.createElement('td');
        tdCand.textContent = `${req.candidateName || 'N/A'} (${req.candidateEmail || 'N/A'})`;
        tr.appendChild(tdCand);

        const tdDate = document.createElement('td');
        tdDate.textContent = req.requestedAt ? new Date(req.requestedAt).toLocaleDateString('pt-BR') : '';
        tr.appendChild(tdDate);

        const tdStatus = document.createElement('td');
        tdStatus.textContent = req.status === 'completed' ? 'Atendido' : 'Pendente';
        tr.appendChild(tdStatus);

        const tdAction = document.createElement('td');
        if (req.status === 'pending') {
          const execBtn = document.createElement('button');
          execBtn.type = 'button';
          execBtn.className = 'carreiras-button carreiras-button--secondary';
          execBtn.style.padding = '0.35rem 0.65rem';
          execBtn.style.fontSize = '0.75rem';
          execBtn.style.borderColor = '#c62828';
          execBtn.style.color = '#c62828';
          execBtn.textContent = 'Executar Exclusão';
          execBtn.addEventListener('click', () => executeLgpdRequest(req.id));
          tdAction.appendChild(execBtn);
        } else {
          tdAction.textContent = req.completedAt ? `Concluído em ${new Date(req.completedAt).toLocaleDateString('pt-BR')}` : '-';
        }
        tr.appendChild(tdAction);

        tableBody.appendChild(tr);
      });
    } catch {}
  }

  async function executeLgpdRequest(requestId) {
    if (!confirm('Confirma a execução desta solicitação LGPD? Se for exclusão, todos os dados e arquivos do R2 serão eliminados de forma irreversível.')) {
      return;
    }

    try {
      const res = await fetch(`/api/admin/lgpd/requests/${encodeURIComponent(requestId)}/execute`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${authToken}` },
      });
      const data = await res.json();
      if (res.ok) {
        alert(data.message || 'Solicitação executada com sucesso.');
        loadLgpdRequests();
      } else {
        alert(data.error || 'Erro ao executar solicitação.');
      }
    } catch {
      alert('Erro de conexão ao processar solicitação.');
    }
  }

  // 5. Trilha de Auditoria
  async function loadAuditLogs() {
    const tableBody = document.querySelector('[data-audit-tbody]');
    if (!tableBody) return;

    try {
      const res = await fetch('/api/admin/audit', {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      const data = await res.json();
      if (!res.ok) return;

      while (tableBody.firstChild) tableBody.removeChild(tableBody.firstChild);

      data.logs.forEach((log) => {
        const tr = document.createElement('tr');

        const tdTime = document.createElement('td');
        tdTime.textContent = new Date(log.timestamp).toLocaleString('pt-BR');
        tr.appendChild(tdTime);

        const tdAction = document.createElement('td');
        const strong = document.createElement('strong');
        strong.textContent = log.action;
        tdAction.appendChild(strong);
        tr.appendChild(tdAction);

        const tdActor = document.createElement('td');
        tdActor.textContent = `${log.actorType}: ${log.actorId || 'anônimo'}`;
        tr.appendChild(tdActor);

        const tdResource = document.createElement('td');
        tdResource.textContent = `${log.resource} (${log.resourceId || '-'})`;
        tr.appendChild(tdResource);

        const tdIp = document.createElement('td');
        tdIp.textContent = log.ipAddress || '-';
        tr.appendChild(tdIp);

        tableBody.appendChild(tr);
      });
    } catch {}
  }

  function showNotice(el, msg, type) {
    if (!el) return;
    el.textContent = msg;
    el.className = `carreiras-notice carreiras-notice--${type}`;
    el.style.display = 'block';
  }
})();
