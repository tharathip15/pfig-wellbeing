export function sendJson(response, status, payload) {
  response.setHeader("Cache-Control", "no-store");
  response.status(status).json(payload);
}

export function readJsonBody(request, limit = 2 * 1024 * 1024) {
  if (request.body && typeof request.body === "object") return Promise.resolve(request.body);

  return new Promise((resolve, reject) => {
    let body = "";
    request.on("data", chunk => {
      body += chunk;
      if (body.length > limit) {
        reject(new Error("Request body too large"));
        request.destroy();
      }
    });
    request.on("end", () => {
      try {
        resolve(JSON.parse(body || "null"));
      } catch (error) {
        reject(error);
      }
    });
    request.on("error", reject);
  });
}
