(function bootstrapWellbeingAuth(global) {
  const STATE_KEY = "pfig_wellbeing_microsoft_state";
  let runtimeConfig = { microsoft: { enabled: false, tenantId: "", clientId: "" } };
  let currentSession = null;

  function toBase64Url(bytes) {
    let binary = "";
    bytes.forEach(byte => { binary += String.fromCharCode(byte); });
    return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
  }

  async function createPkceChallenge(verifier) {
    const data = new TextEncoder().encode(verifier);
    const digest = await global.crypto.subtle.digest("SHA-256", data);
    return toBase64Url(new Uint8Array(digest));
  }

  function redirectUri() {
    return `${global.location.origin}${global.location.pathname}`;
  }

  function cleanAuthUrl() {
    const url = new URL(global.location.href);
    ["code", "state", "error", "error_description", "pfig_sso"].forEach(key => url.searchParams.delete(key));
    global.history.replaceState({}, document.title, `${url.pathname}${url.search}${url.hash}`);
  }

  async function loadConfig() {
    const response = await fetch("/api/config", { credentials: "same-origin" });
    if (!response.ok) throw new Error("Wellbeing SSO configuration is unavailable");
    runtimeConfig = await response.json();
    return runtimeConfig;
  }

  async function readSession() {
    const response = await fetch("/api/session", { credentials: "same-origin" });
    if (!response.ok) return null;
    currentSession = await response.json();
    return currentSession;
  }

  async function beginSignIn({ prompt = "", silent = false } = {}) {
    const microsoft = runtimeConfig.microsoft || {};
    if (!microsoft.enabled || !microsoft.tenantId || !microsoft.clientId) {
      throw new Error("Microsoft sign-in is not configured for Wellbeing");
    }

    const state = global.crypto.randomUUID();
    const nonce = global.crypto.randomUUID();
    const verifierBytes = global.crypto.getRandomValues(new Uint8Array(32));
    const codeVerifier = toBase64Url(verifierBytes);
    const codeChallenge = await createPkceChallenge(codeVerifier);
    sessionStorage.setItem(STATE_KEY, JSON.stringify({ state, nonce, codeVerifier, silent }));

    const authorizeUrl = new URL(`https://login.microsoftonline.com/${encodeURIComponent(microsoft.tenantId)}/oauth2/v2.0/authorize`);
    const params = {
      client_id: microsoft.clientId,
      response_type: "code",
      redirect_uri: redirectUri(),
      response_mode: "query",
      scope: "openid profile email",
      state,
      nonce,
      code_challenge: codeChallenge,
      code_challenge_method: "S256",
    };
    if (prompt) params.prompt = prompt;
    authorizeUrl.search = new URLSearchParams(params).toString();
    global.location.assign(authorizeUrl.toString());
  }

  async function processCallback() {
    const params = new URLSearchParams(global.location.search);
    const code = params.get("code");
    const returnedState = params.get("state");
    const authError = params.get("error_description") || params.get("error");
    if (!code && !authError) return { handled: false, session: null };

    let saved = null;
    try {
      saved = JSON.parse(sessionStorage.getItem(STATE_KEY) || "null");
    } finally {
      sessionStorage.removeItem(STATE_KEY);
      cleanAuthUrl();
    }

    if (authError) {
      if (saved?.silent) return { handled: true, session: null };
      throw new Error(authError);
    }
    if (!saved?.state || !saved?.nonce || !saved?.codeVerifier || saved.state !== returnedState) {
      throw new Error("Microsoft sign-in state could not be verified");
    }

    const microsoft = runtimeConfig.microsoft || {};
    const tokenResponse = await fetch(`https://login.microsoftonline.com/${encodeURIComponent(microsoft.tenantId)}/oauth2/v2.0/token`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: microsoft.clientId,
        code,
        code_verifier: saved.codeVerifier,
        redirect_uri: redirectUri(),
        grant_type: "authorization_code",
        scope: "openid profile email",
      }),
    });
    const tokenResult = await tokenResponse.json();
    if (!tokenResponse.ok || !tokenResult.id_token) {
      throw new Error(tokenResult.error_description || tokenResult.error || "Microsoft token exchange failed");
    }

    const loginResponse = await fetch("/api/login-sso", {
      method: "POST",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ idToken: tokenResult.id_token, nonce: saved.nonce }),
    });
    const result = await loginResponse.json();
    if (!loginResponse.ok || !result.ok) throw new Error(result.error || "Microsoft sign-in failed");
    currentSession = result;
    return { handled: true, session: result };
  }

  function showGate(message = "") {
    const gate = document.getElementById("auth-gate");
    const error = document.getElementById("auth-gate-error");
    if (error) {
      error.textContent = message;
      error.style.display = message ? "block" : "none";
    }
    if (gate) gate.style.display = "flex";
    document.body.classList.add("auth-pending");
  }

  function hideGate() {
    const gate = document.getElementById("auth-gate");
    if (gate) gate.style.display = "none";
    document.body.classList.remove("auth-pending");
  }

  async function initialize() {
    const loginButton = document.getElementById("btn-auth-login");
    loginButton?.addEventListener("click", () => beginSignIn().catch(error => showGate(error.message)));

    await loadConfig();
    const callback = await processCallback();
    const session = callback.session || await readSession();
    if (session?.identity) {
      currentSession = session;
      hideGate();
      return session;
    }

    const launchIntent = new URL(global.location.href).searchParams.get("pfig_sso") === "1";
    if (!callback.handled && launchIntent) {
      await beginSignIn({ prompt: "none", silent: true });
      return null;
    }
    cleanAuthUrl();
    showGate();
    return null;
  }

  async function apiFetch(url, options = {}) {
    const method = String(options.method || "GET").toUpperCase();
    const headers = new Headers(options.headers || {});
    if (!["GET", "HEAD", "OPTIONS"].includes(method) && currentSession?.csrfToken) {
      headers.set("X-CSRF-Token", currentSession.csrfToken);
    }
    const response = await fetch(url, { ...options, method, headers, credentials: "same-origin" });
    if (response.status === 401) {
      currentSession = null;
      showGate("เซสชันหมดอายุ กรุณาเข้าสู่ระบบใหม่");
    }
    return response;
  }

  async function logout() {
    await apiFetch("/api/logout", { method: "POST" });
    currentSession = null;
    showGate();
  }

  global.PfigWellbeingAuth = {
    apiFetch,
    beginSignIn,
    getSession: () => currentSession,
    hideGate,
    initialize,
    logout,
    showGate,
  };
})(window);
