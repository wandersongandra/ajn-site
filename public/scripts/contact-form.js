(() => {
  'use strict';

  const MAX_ATTACHMENT_BYTES = 5 * 1024 * 1024;
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

    if (!status || !submit) return;

    form.addEventListener('submit', async (event) => {
      if (!form.checkValidity() || submitting) return;

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
      submitting = true;
      form.setAttribute('aria-busy', 'true');
      submit.disabled = true;
      const originalLabel = submit.textContent;
      submit.textContent = 'Enviando…';
      setStatus(status, 'Enviando sua mensagem…', 'pending');

      try {
        const response = await fetch(endpoint, {
          method: 'POST',
          body: new FormData(form),
          headers: { Accept: 'application/json' },
          credentials: 'omit',
          cache: 'no-store',
        });
        if (!response.ok) throw new Error('contact endpoint rejected the request');
        form.reset();
        setStatus(status, 'Mensagem enviada. A equipe da AJN responderá pelos canais informados.', 'success');
        window.dispatchEvent(new CustomEvent('ajn:contact-form-submit'));
      } catch {
        setStatus(status, 'Não foi possível enviar agora. Seus dados permaneceram no formulário; tente o WhatsApp ou o e-mail da AJN.', 'error');
      } finally {
        submitting = false;
        form.removeAttribute('aria-busy');
        submit.disabled = false;
        submit.textContent = originalLabel;
      }
    });
  });
})();
