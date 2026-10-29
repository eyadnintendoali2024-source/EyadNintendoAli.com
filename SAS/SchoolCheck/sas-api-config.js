(() => {
  const API_BASE = "https://wow-saturn-letter-engines.trycloudflare.com";

  window.SAS_API_BASE_URL = API_BASE;

  const originalFetch = window.fetch.bind(window);

  window.fetch = (input, init) => {
    const url = input instanceof Request ? input.url : String(input);
    let parsed;

    try {
      parsed = new URL(url, window.location.href);
    } catch {
      return originalFetch(input, init);
    }

    const isApi =
      parsed.pathname === "/api" ||
      parsed.pathname.startsWith("/api/");

    const isSameOrigin = parsed.origin === window.location.origin;

    if (!isApi || !isSameOrigin) {
      return originalFetch(input, init);
    }

    const target = API_BASE + parsed.pathname + parsed.search;

    if (input instanceof Request) {
      return originalFetch(new Request(target, input), init);
    }

    return originalFetch(target, init);
  };
})();
