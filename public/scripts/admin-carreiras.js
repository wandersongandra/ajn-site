// Painel Administrativo de Recrutamento — AJN Carreiras
// Conformidade rigorosa com CSP: sem eval, sem innerHTML, sem Web Storage.

(() => {
  let authToken = '';
  let currentUser = null;
  let currentJobId = 'job-eng-seguranca';
  let listenersRegistered = false;

  const allowedApiOrigins = new Set([
    'https://carreiras.ajnengenharia.com.br',
    'https://staging-ajn-carreiras-api.workers.dev',
  ]);
  const legacyStagingHost = 'sienna-mongoose-223157.hostingersite.com';

  function getConfiguredApiOrigin() {
    if (typeof window === 'undefined' || !window.AJN_CARREIRAS_API_BASE) return '';

    try {
      const configuredUrl = new URL(window.AJN_CARREIRAS_API_BASE, window.location.origin);
      return allowedApiOrigins.has(configuredUrl.origin) ||
        (window.location.protocol === 'http:' &&
          (configuredUrl.origin === 'http://localhost:8787' || configuredUrl.origin === 'http://127.0.0.1:8787'))
        ? configuredUrl.origin
        : '';
    } catch {
      return '';
    }
  }

  function getApiEndpoint(path) {
    if (!path) return '';
    if (path.startsWith('http://') || path.startsWith('https://')) return path;
    const clean = path.startsWith('/') ? path : '/' + path;

    if (
      typeof window !== 'undefined' &&
      (window.location.hostname === 'carreiras.ajnengenharia.com.br' ||
        window.location.hostname === 'staging-ajn-carreiras-api.workers.dev' ||
        window.location.hostname === 'localhost' ||
        window.location.hostname === '127.0.0.1')
    ) {
      return clean;
    }

    const configuredOrigin = getConfiguredApiOrigin();
    if (configuredOrigin) {
      return `${configuredOrigin}${clean}`;
    }

    if (typeof window !== 'undefined' && window.location.hostname === legacyStagingHost) {
      return `https://staging-ajn-carreiras-api.workers.dev${clean}`;
    }

    return `https://carreiras.ajnengenharia.com.br${clean}`;
  }

  function getAuthHeaders(extraHeaders = {}) {
    const headers = { ...extraHeaders };
    if (authToken && authToken !== 'undefined' && authToken !== 'null' && authToken.trim() !== '') {
      headers['Authorization'] = `Bearer ${authToken}`;
    }
    return headers;
  }

  document.addEventListener('DOMContentLoaded', () => {
    initAdminApp();
  });

  async function initAdminApp() {
    const loginCard = document.querySelector('[data-admin-login-card]');
    const dashboard = document.querySelector('[data-admin-dashboard]');
    const loginForm = document.querySelector('[data-admin-login-form]');
    const forgotForm = document.querySelector('[data-admin-forgot-form]');
    const resetCard = document.querySelector('[data-admin-reset-card]');
    const resetForm = document.querySelector('[data-admin-reset-form]');
    const logoutBtn = document.querySelector('[data-admin-logout]');
    const elements = { loginCard, dashboard, loginForm, forgotForm, resetCard, resetForm, logoutBtn };

    const urlParams = new URLSearchParams(window.location.search);
    const resetToken = urlParams.get('resetToken');

    registerAdminEventListeners(elements, resetToken);

    if (resetToken && resetCard && resetForm) {
      setAuthView(elements, false);
      resetCard.style.display = 'block';
      return;
    }

    const restored = await restoreAdminSession(elements);
    if (!restored) setAuthView(elements, false);
  }

  function registerAdminEventListeners(elements, resetToken) {
    if (listenersRegistered) return;
    listenersRegistered = true;

    const { loginCard, loginForm, forgotForm, resetCard, resetForm, logoutBtn } = elements;

    if (resetToken && resetCard && resetForm) {
      resetForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const newPassword = resetForm.querySelector('[name="newPassword"]')?.value;
        const confirmPassword = resetForm.querySelector('[name="confirmPassword"]')?.value;
        const noticeEl = resetCard.querySelector('[data-reset-notice]');

        if (newPassword !== confirmPassword) {
          showNotice(noticeEl, 'A confirmação de senha não coincide com a nova senha digitada.', 'error');
          return;
        }

        try {
          const res = await fetch(getApiEndpoint('/api/admin/auth/reset-password'), {
            method: 'POST',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token: resetToken, newPassword }),
          });

          const data = await res.json();
          if (res.ok && data.success) {
            showNotice(noticeEl, 'Senha redefinida com sucesso! Redirecionando para o login...', 'success');
            setTimeout(() => {
              if (window.history && window.history.replaceState) {
                window.history.replaceState({}, document.title, window.location.pathname);
              }
              resetCard.style.display = 'none';
              if (loginCard) {
                loginCard.style.display = 'block';
                showNotice(loginCard.querySelector('[data-login-notice]'), 'Senha alterada. Faça login com suas novas credenciais.', 'success');
              }
            }, 2000);
          } else {
            showNotice(noticeEl, data.error || 'Não foi possível redefinir a senha.', 'error');
          }
        } catch {
          showNotice(noticeEl, 'Erro de conexão ao redefinir senha.', 'error');
        }
      });
    }

    const showForgotBtn = document.querySelector('[data-show-forgot-btn]');
    const showLoginBtn = document.querySelector('[data-show-login-btn]');

    if (showForgotBtn && loginForm && forgotForm) {
      showForgotBtn.addEventListener('click', () => {
        loginForm.style.display = 'none';
        forgotForm.style.display = 'block';
        const noticeEl = loginCard?.querySelector('[data-login-notice]');
        if (noticeEl) noticeEl.style.display = 'none';
      });
    }

    if (showLoginBtn && loginForm && forgotForm) {
      showLoginBtn.addEventListener('click', () => {
        forgotForm.style.display = 'none';
        loginForm.style.display = 'block';
        const noticeEl = loginCard?.querySelector('[data-login-notice]');
        if (noticeEl) noticeEl.style.display = 'none';
      });
    }

    if (forgotForm) {
      forgotForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = forgotForm.querySelector('[name="forgotEmail"]')?.value.trim();
        const noticeEl = loginCard?.querySelector('[data-login-notice]');

        try {
          const res = await fetch(getApiEndpoint('/api/admin/auth/forgot-password'), {
            method: 'POST',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email }),
          });

          const data = await res.json();
          if (res.ok) {
            showNotice(noticeEl, data.message || 'Se o e-mail estiver cadastrado, as orientações foram enviadas.', 'success');
            forgotForm.reset();
            forgotForm.style.display = 'none';
            if (loginForm) loginForm.style.display = 'block';
          } else {
            showNotice(noticeEl, data.error || 'Erro ao processar solicitação.', 'error');
          }
        } catch {
          showNotice(noticeEl, 'Erro ao conectar ao serviço de recuperação.', 'error');
        }
      });
    }

    if (loginForm) {
      loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = loginForm.querySelector('[name="email"]')?.value.trim();
        const password = loginForm.querySelector('[name="password"]')?.value;
        const mfaCode = loginForm.querySelector('[name="mfaCode"]')?.value.trim();
        const noticeEl = loginCard?.querySelector('[data-login-notice]');

        try {
          const res = await fetch(getApiEndpoint('/api/admin/auth/login'), {
            method: 'POST',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password, mfaCode }),
          });

          const data = await res.json();
          if (res.ok && data.success) {
            authToken = data.token || '';
            currentUser = data.user;
            setAuthView(elements, true);
            updateUserBadge();
            void loadDashboardData();
          } else if (data.mfaRequired) {
            const mfaField = loginForm.querySelector('[data-mfa-field]');
            if (mfaField) mfaField.style.display = 'block';
            showNotice(noticeEl, 'Código MFA obrigatório. Digite o código de 6 dígitos gerado no aplicativo.', 'error');
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
          await fetch(getApiEndpoint('/api/admin/auth/logout'), {
            method: 'POST',
            credentials: 'include',
            headers: getAuthHeaders(),
          });
        } catch {}
        authToken = '';
        currentUser = null;
        setAuthView(elements, false);
      });
    }

    const tabButtons = document.querySelectorAll('[data-admin-tab]');
    tabButtons.forEach((btn) => {
      btn.addEventListener('click', () => {
        const targetTab = btn.getAttribute('data-admin-tab');
        tabButtons.forEach((b) => b.setAttribute('aria-selected', 'false'));
        btn.setAttribute('aria-selected', 'true');

        document.querySelectorAll('[data-admin-pane]').forEach((pane) => {
          pane.style.display = pane.getAttribute('data-admin-pane') === targetTab ? 'block' : 'none';
        });

        if (targetTab === 'pipeline') void loadPipeline(currentJobId);
        else if (targetTab === 'candidates') void loadCandidates();
        else if (targetTab === 'jobs') void loadJobs();
        else if (targetTab === 'lgpd') void loadLgpdRequests();
        else if (targetTab === 'audit') void loadAuditLogs();
        else if (targetTab === 'users') void loadAdminUsers();
      });
    });

    const jobSelect = document.querySelector('[data-pipeline-job-select]');
    if (jobSelect) {
      jobSelect.addEventListener('change', () => {
        currentJobId = jobSelect.value;
        void loadPipeline(currentJobId);
      });
    }

    const toggleJobFormBtn = document.querySelector('[data-toggle-job-form]');
    const cancelJobFormBtn = document.querySelector('[data-cancel-job-form]');
    const jobForm = document.querySelector('[data-job-form]');

    if (toggleJobFormBtn) {
      toggleJobFormBtn.addEventListener('click', () => openJobForm());
    }

    if (cancelJobFormBtn) {
      cancelJobFormBtn.addEventListener('click', () => closeJobForm());
    }

    if (jobForm) {
      jobForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(jobForm);
        const jobId = String(formData.get('jobId') || '').trim();
        const requirements = String(formData.get('requirements') || '')
          .split(/\r?\n/)
          .map((item) => item.trim())
          .filter(Boolean);
        const payload = {
          title: String(formData.get('title') || '').trim(),
          department: String(formData.get('department') || '').trim(),
          location: String(formData.get('location') || '').trim(),
          employmentType: String(formData.get('employmentType') || ''),
          experienceLevel: String(formData.get('experienceLevel') || ''),
          description: String(formData.get('description') || '').trim(),
          requirements,
          status: String(formData.get('status') || 'draft'),
          openingsCount: Number(formData.get('openingsCount') || 1),
        };
        if (!jobId) payload.slug = String(formData.get('slug') || '').trim();

        const noticeEl = document.querySelector('[data-jobs-notice]');
        try {
          const res = await fetch(getApiEndpoint(jobId ? `/api/admin/jobs/${encodeURIComponent(jobId)}` : '/api/admin/jobs'), {
            method: jobId ? 'PUT' : 'POST',
            credentials: 'include',
            headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
            body: JSON.stringify(payload),
          });
          const data = await res.json();
          if (!res.ok || !data.success) {
            showNotice(noticeEl, data.error || 'Não foi possível salvar a vaga.', 'error');
            return;
          }

          showNotice(noticeEl, jobId ? 'Vaga atualizada com sucesso.' : 'Vaga criada com sucesso.', 'success');
          closeJobForm();
          void loadJobs();
        } catch {
          showNotice(noticeEl, 'Erro de conexão ao salvar a vaga.', 'error');
        }
      });
    }

    const toggleCreateUserBtn = document.querySelector('[data-toggle-create-user-btn]');
    const cancelCreateUserBtn = document.querySelector('[data-cancel-create-user]');
    const createUserCard = document.querySelector('[data-create-user-card]');
    const createUserForm = document.querySelector('[data-create-user-form]');

    if (toggleCreateUserBtn && createUserCard) {
      toggleCreateUserBtn.addEventListener('click', () => {
        createUserCard.style.display = createUserCard.style.display === 'none' ? 'block' : 'none';
      });
    }

    if (cancelCreateUserBtn && createUserCard) {
      cancelCreateUserBtn.addEventListener('click', () => {
        createUserCard.style.display = 'none';
      });
    }

    if (createUserForm) {
      createUserForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const name = createUserForm.querySelector('[name="name"]')?.value.trim();
        const email = createUserForm.querySelector('[name="email"]')?.value.trim();
        const role = createUserForm.querySelector('[name="role"]')?.value;
        const password = createUserForm.querySelector('[name="password"]')?.value;
        const noticeEl = document.querySelector('[data-users-notice]');

        try {
          const res = await fetch(getApiEndpoint('/api/admin/users'), {
            method: 'POST',
            credentials: 'include',
            headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
            body: JSON.stringify({ name, email, role, password }),
          });

          const data = await res.json();
          if (res.ok && data.success) {
            showNotice(noticeEl, 'Conta de recrutador criada com sucesso.', 'success');
            createUserForm.reset();
            if (createUserCard) createUserCard.style.display = 'none';
            loadAdminUsers();
          } else {
            showNotice(noticeEl, data.error || 'Erro ao cadastrar usuário.', 'error');
          }
        } catch {
          showNotice(noticeEl, 'Erro de conexão ao cadastrar usuário.', 'error');
        }
      });
    }
  }

  function setAuthView(elements, authenticated) {
    if (elements.loginCard) elements.loginCard.style.display = authenticated ? 'none' : 'block';
    if (elements.dashboard) elements.dashboard.style.display = authenticated ? 'block' : 'none';
    if (!authenticated) updateUserBadge();
  }

  async function restoreAdminSession(elements) {
    try {
      const meRes = await fetch(getApiEndpoint('/api/admin/auth/me'), {
        method: 'GET',
        credentials: 'include',
        headers: getAuthHeaders(),
      });

      if (!meRes.ok) return false;
      const meData = await meRes.json();
      if (!meData.user) return false;

      currentUser = meData.user;
      setAuthView(elements, true);
      updateUserBadge();
      void loadDashboardData();
      return true;
    } catch {
      return false;
    }
  }

  function updateUserBadge() {
    const userBadge = document.querySelector('[data-admin-user-name]');
    const roleBadge = document.querySelector('[data-admin-user-role]');
    const usersTab = document.querySelector('[data-admin-users-tab]');

    if (userBadge && currentUser) userBadge.textContent = currentUser.name;
    if (roleBadge && currentUser) roleBadge.textContent = currentUser.role;

    if (usersTab && currentUser) {
      const canManage = currentUser.role === 'super_admin' || (currentUser.permissions && currentUser.permissions.includes('admin:manage'));
      usersTab.style.display = canManage ? 'inline-block' : 'none';
    }
  }

  function openJobForm(job = null) {
    const card = document.querySelector('[data-job-form-card]');
    const form = document.querySelector('[data-job-form]');
    if (!card || !form) return;

    const titleEl = document.querySelector('[data-job-form-title]');
    const slugEl = form.querySelector('[name="slug"]');
    const jobIdEl = form.querySelector('[name="jobId"]');
    if (!job) {
      form.reset();
      if (jobIdEl) jobIdEl.value = '';
      if (slugEl) slugEl.readOnly = false;
      if (titleEl) titleEl.textContent = 'Nova vaga';
    } else {
      const requirements = parseJobRequirements(job.requirements);
      const values = {
        jobId: job.id,
        title: job.title,
        slug: job.slug,
        department: job.department,
        location: job.location,
        employmentType: job.employmentType,
        experienceLevel: job.experienceLevel,
        status: job.status,
        openingsCount: job.openingsCount || 1,
        description: job.description || '',
        requirements: requirements.join('\n'),
      };
      Object.entries(values).forEach(([name, value]) => {
        const field = form.querySelector(`[name="${name}"]`);
        if (field) field.value = String(value ?? '');
      });
      if (slugEl) slugEl.readOnly = true;
      if (titleEl) titleEl.textContent = 'Editar vaga';
    }

    card.style.display = 'block';
    card.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }

  function closeJobForm() {
    const card = document.querySelector('[data-job-form-card]');
    const form = document.querySelector('[data-job-form]');
    if (form) form.reset();
    if (card) card.style.display = 'none';
  }

  function parseJobRequirements(requirements) {
    if (Array.isArray(requirements)) return requirements.filter(Boolean);
    if (typeof requirements !== 'string' || !requirements.trim()) return [];
    try {
      const parsed = JSON.parse(requirements);
      return Array.isArray(parsed) ? parsed.filter(Boolean) : [requirements];
    } catch {
      return requirements.split(/\r?\n/).map((item) => item.trim()).filter(Boolean);
    }
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
      const res = await fetch(getApiEndpoint('/api/admin/jobs'), {
        credentials: 'include',
        headers: getAuthHeaders(),
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

        const tdActions = document.createElement('td');
        const editBtn = document.createElement('button');
        editBtn.type = 'button';
        editBtn.className = 'carreiras-button carreiras-button--secondary';
        editBtn.style.padding = '0.35rem 0.65rem';
        editBtn.style.fontSize = '0.75rem';
        editBtn.textContent = 'Editar';
        editBtn.addEventListener('click', () => openJobForm(job));
        tdActions.appendChild(editBtn);
        tr.appendChild(tdActions);

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
      const res = await fetch(getApiEndpoint(`/api/admin/pipeline/${encodeURIComponent(jobId)}`), {
        credentials: 'include',
        headers: getAuthHeaders(),
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
      const res = await fetch(getApiEndpoint('/api/admin/pipeline/move-stage'), {
        method: 'POST',
        credentials: 'include',
        headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
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
      const res = await fetch(getApiEndpoint('/api/admin/candidates'), {
        credentials: 'include',
        headers: getAuthHeaders(),
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
      const res = await fetch(getApiEndpoint(`/api/admin/candidates/${encodeURIComponent(candidateId)}/resume`), {
        credentials: 'include',
        headers: getAuthHeaders(),
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
      const res = await fetch(getApiEndpoint('/api/admin/lgpd/requests'), {
        credentials: 'include',
        headers: getAuthHeaders(),
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
      const res = await fetch(getApiEndpoint(`/api/admin/lgpd/requests/${encodeURIComponent(requestId)}/execute`), {
        method: 'POST',
        credentials: 'include',
        headers: getAuthHeaders(),
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
      const res = await fetch(getApiEndpoint('/api/admin/audit'), {
        credentials: 'include',
        headers: getAuthHeaders(),
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

  // 6. Gestão de Contas de Recrutadores
  async function loadAdminUsers() {
    const tableBody = document.querySelector('[data-users-tbody]');
    if (!tableBody) return;

    try {
      const res = await fetch(getApiEndpoint('/api/admin/users'), {
        credentials: 'include',
        headers: getAuthHeaders(),
      });
      const data = await res.json();
      if (!res.ok) return;

      while (tableBody.firstChild) tableBody.removeChild(tableBody.firstChild);

      data.users.forEach((usr) => {
        const tr = document.createElement('tr');

        const tdName = document.createElement('td');
        const strong = document.createElement('strong');
        strong.textContent = usr.name;
        tdName.appendChild(strong);
        tr.appendChild(tdName);

        const tdEmail = document.createElement('td');
        tdEmail.textContent = usr.email;
        tr.appendChild(tdEmail);

        const tdRole = document.createElement('td');
        const roleBadge = document.createElement('span');
        roleBadge.className = `carreiras-badge ${usr.role === 'super_admin' ? 'carreiras-badge--primary' : ''}`;
        roleBadge.textContent = usr.role;
        tdRole.appendChild(roleBadge);
        tr.appendChild(tdRole);

        const tdMfa = document.createElement('td');
        tdMfa.textContent = usr.mfaEnabled ? 'Ativo (TOTP)' : 'Pendente';
        tr.appendChild(tdMfa);

        const tdStatus = document.createElement('td');
        const statusSpan = document.createElement('span');
        statusSpan.style.color = usr.isActive ? '#166534' : '#c62828';
        statusSpan.style.fontWeight = '600';
        statusSpan.textContent = usr.isActive ? 'Ativo' : 'Desativado';
        tdStatus.appendChild(statusSpan);
        tr.appendChild(tdStatus);

        const tdAction = document.createElement('td');
        if (currentUser && usr.id !== currentUser.id) {
          const toggleBtn = document.createElement('button');
          toggleBtn.type = 'button';
          toggleBtn.className = 'carreiras-button carreiras-button--secondary';
          toggleBtn.style.padding = '0.35rem 0.65rem';
          toggleBtn.style.fontSize = '0.75rem';
          toggleBtn.textContent = usr.isActive ? 'Desativar' : 'Reativar';
          if (usr.isActive) {
            toggleBtn.style.borderColor = '#c62828';
            toggleBtn.style.color = '#c62828';
          }
          toggleBtn.addEventListener('click', () => toggleUserStatus(usr.id, !usr.isActive));
          tdAction.appendChild(toggleBtn);
        } else {
          tdAction.textContent = '(Conta atual)';
        }
        tr.appendChild(tdAction);

        tableBody.appendChild(tr);
      });
    } catch {}
  }

  async function toggleUserStatus(userId, newStatus) {
    const actionLabel = newStatus ? 'reativar' : 'desativar';
    if (!confirm(`Deseja realmente ${actionLabel} este usuário?`)) return;

    try {
      const res = await fetch(getApiEndpoint(`/api/admin/users/${encodeURIComponent(userId)}/status`), {
        method: 'PUT',
        credentials: 'include',
        headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({ isActive: newStatus }),
      });

      const data = await res.json();
      if (res.ok) {
        loadAdminUsers();
      } else {
        alert(data.error || 'Erro ao alterar status do usuário.');
      }
    } catch {
      alert('Erro de conexão ao alterar status do usuário.');
    }
  }

  function showNotice(el, msg, type) {
    if (!el) return;
    el.textContent = msg;
    el.className = `carreiras-notice carreiras-notice--${type}`;
    el.style.display = 'block';
  }
})();
