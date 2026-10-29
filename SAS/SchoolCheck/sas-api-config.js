(function () {
  const configured = window.SAS_API_BASE_URL || 'http://127.0.0.1:3000';
  window.SAS_API_BASE_URL = configured;

  const params = new URLSearchParams(window.location.search);
  const override = params.get('apiBase');
  if (override) {
    window.SAS_API_BASE_URL = override.replace(/\/$/, '');
  }
})();
