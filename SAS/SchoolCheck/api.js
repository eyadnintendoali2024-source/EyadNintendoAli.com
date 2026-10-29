(function () {
  const API_BASE = window.SAS_API_BASE_URL || 'http://127.0.0.1:3000';

  function buildUrl(path) {
    const normalized = path.startsWith('/') ? path : `/${path}`;
    return `${API_BASE}${normalized}`;
  }

  async function request(path, options = {}) {
    const method = (options.method || 'GET').toUpperCase();
    const headers = new Headers(options.headers || {});
    const bodyless = method === 'GET' || method === 'DELETE';

    if (!headers.has('Accept')) {
      headers.set('Accept', 'application/json');
    }

    if (!bodyless && options.body && !headers.has('Content-Type')) {
      headers.set('Content-Type', 'application/json');
    }

    const token = localStorage.getItem('sas_school_check_token');
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }

    const response = await fetch(buildUrl(path), {
      ...options,
      method,
      headers,
      body: bodyless ? undefined : options.body,
    });

    const text = await response.text();
    let payload = null;
    if (text) {
      try {
        payload = JSON.parse(text);
      } catch {
        payload = { raw: text };
      }
    }

    if (!response.ok) {
      const message = payload && payload.message ? payload.message : 'Request failed';
      throw new Error(message);
    }

    return payload;
  }

  window.SAS_API = {
    base: API_BASE,
    request,
    setToken(token) {
      if (token) {
        localStorage.setItem('sas_school_check_token', token);
      } else {
        localStorage.removeItem('sas_school_check_token');
      }
    },
    getToken() {
      return localStorage.getItem('sas_school_check_token');
    },
    clearToken() {
      localStorage.removeItem('sas_school_check_token');
    },
    admin: {
      setup(data) { return request('/api/admin/setup', { method: 'POST', body: JSON.stringify(data) }); },
      login(data) { return request('/api/admin/login', { method: 'POST', body: JSON.stringify(data) }); },
      me() { return request('/api/admin/me'); },
      dashboard() { return request('/api/admin/dashboard'); },
      teachers(search = '') { return request(`/api/admin/teachers${search ? `?search=${encodeURIComponent(search)}` : ''}`); },
      createTeacher(data) { return request('/api/admin/teachers', { method: 'POST', body: JSON.stringify(data) }); },
      attendance() { return request('/api/admin/attendance'); },
      audit() { return request('/api/admin/audit'); },
      geofence() { return request('/api/admin/geofence'); },
      saveGeofence(data) { return request('/api/admin/geofence', { method: 'PUT', body: JSON.stringify(data) }); },
      deviceCode(teacherId) { return request(`/api/admin/teachers/${encodeURIComponent(teacherId)}/device-code`, { method: 'POST' }); },
    },
    teacher: {
      login(data) { return request('/api/teacher/login', { method: 'POST', body: JSON.stringify(data) }); },
      activate(data) { return request('/api/teacher/activate', { method: 'POST', body: JSON.stringify(data) }); },
      me() { return request('/api/teacher/me'); },
      attendance(action, payload = {}) { return request('/api/teacher/attendance', { method: 'POST', body: JSON.stringify({ action, ...payload }) }); },
      history() { return request('/api/teacher/history'); },
      devices() { return request('/api/teacher/devices'); },
    },
  };
})();
