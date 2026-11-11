const generatedApiBaseUrl = "__API_BASE_URL__";
const generatedDemoMode = "__DEMO_MODE__";

window.APP_CONFIG = {
  API_BASE_URL: generatedApiBaseUrl.startsWith("__")
    ? "http://localhost:8000"
    : generatedApiBaseUrl,
  DEMO_MODE: generatedDemoMode.startsWith("__")
    ? true
    : generatedDemoMode === "true"
};
