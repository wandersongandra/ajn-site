(() => {
  'use strict';

  const MAX_ATTACHMENT_BYTES = 5 * 1024 * 1024;
  const REQUEST_TIMEOUT_MS = 15 * 1000;
  const allowedExtensions = new Set(['pdf', 'doc', 'docx', 'jpg', 'jpeg', 'png']);

  function getFileError(file) {
    if (!file) return '';
    const extension = file.name?.split('.').pop()?.toLowerCase() || '';
    if (!allowedExtensions.has(extension)) return 'Escolha um arquivo PDF, DOC, DOCX, JPG ou PNG.';
    if (file.size > MAX_ATTACHMENT_BYTES) return 'O anexo deve ter no máximo 5 MB.';
    return '';
  }

  function isSecureEndpoint(value) {
    try {
      const url = new URL(value);
      return url.protocol === 'https:' && !url.username && !url.password;
    } catch {
      return false;
    }
  }

  function createSubmissionId() {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
      return crypto.randomUUID();
    }
    return `ajn-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  }

  function setStatus(status, message, state) {
    status.textContent = message;
    status.dataset.state = state;
    status.focus();
  }

  document.querySelectorAll('[data-contact-form]').forEach((form) => {
    const status = form.querySelector('[data-contact-status]');
    const submit = form.querySelector('button[type="submit"]');
    const attachment = form.querySelector('input[type="file"]');
    let submitting = false;
    let retrySubmissionId = '';
    let retrySnapshot = '';

    if (!status || !submit) return;
    submit.disabled = false;

    form.addEventListener('submit', async (event) => {
      if (submitting) {
        event.preventDefault();
        return;
      }
      if (!form.checkValidity()) return;

      const honeypot = form.querySelector('input[name="website"]');
      if (honeypot?.value) {
        event.preventDefault();
        setStatus(status, 'Não foi possível enviar agora. Use o WhatsApp ou o e-mail da AJN.', 'error');
        return;
      }

      const fileError = getFileError(attachment?.files?.[0]);
      if (fileError) {
        event.preventDefault();
        setStatus(status, fileError, 'error');
        attachment?.focus();
        return;
      }

      const endpoint = form.dataset.contactEndpoint || '';
      if (!isSecureEndpoint(endpoint)) {
        event.preventDefault();
        setStatus(status, 'O envio não está disponível neste momento. Use o WhatsApp ou o e-mail da AJN.', 'error');
        return;
      }

      event.preventDefault();
      const formData = new FormData(form);
      const submissionSnapshot = [...form.querySelectorAll('input, textarea, select')]
        .map((control) => `${control.name}\u0000${control.type === 'file'
          ? [...(control.files || [])].map((file) => `${file.name}:${file.size}:${file.lastModified || 0}`).join(',')
          : control.value}`)
        .join('\u0001');
      const submissionId = retrySubmissionId && retrySnapshot === submissionSnapshot
        ? retrySubmissionId
        : createSubmissionId();
      formData.append('submission_id', submissionId);
      retrySubmissionId = submissionId;
      retrySnapshot = submissionSnapshot;
      const controlsToRestore = [...form.querySelectorAll('input, textarea, select')]
        .filter((control) => !control.disabled);
      submitting = true;
      form.setAttribute('aria-busy', 'true');
      submit.disabled = true;
      controlsToRestore.forEach((control) => { control.disabled = true; });
      const originalLabel = submit.textContent;
      submit.textContent = 'Enviando…';
      setStatus(status, 'Enviando sua mensagem…', 'pending');

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
      try {
        const response = await fetch(endpoint, {
          method: 'POST',
          body: formData,
          headers: { Accept: 'application/json' },
          credentials: 'omit',
          cache: 'no-store',
          signal: controller.signal,
        });
        if (!response.ok) throw new Error('contact endpoint rejected the request');
        form.reset();
        retrySubmissionId = '';
        retrySnapshot = '';
        setStatus(status, 'Mensagem enviada. A equipe da AJN responderá pelos canais informados.', 'success');
        window.dispatchEvent(new CustomEvent('ajn:contact-form-submit'));
      } catch {
        setStatus(status, 'Não foi possível enviar agora. Seus dados permaneceram no formulário; tente o WhatsApp ou o e-mail da AJN.', 'error');
      } finally {
        clearTimeout(timeoutId);
        submitting = false;
        form.removeAttribute('aria-busy');
        submit.disabled = false;
        controlsToRestore.forEach((control) => { control.disabled = false; });
        submit.textContent = originalLabel;
      }
    });
  });
})();
