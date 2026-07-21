// Cloudflare Worker - Proxy for Oay Yaqin AI

export default {
  async fetch(request, env) {

    // CORS
    if (request.method === "OPTIONS") {
      return new Response(null, {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type"
        }
      });
    }

    if (request.method !== "POST") {
      return new Response(
        JSON.stringify({ error: "Method not allowed" }),
        {
          status: 405,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*"
          }
        }
      );
    }

    try {

      const body = await request.json();

      const provider = body.provider || "groq";
      const apiUrl = body.apiUrl;
      const apiKey = body.apiKey;
      const requestBody = body.requestBody;
      const customHeaders = body.headers || {};

      let finalApiKey = apiKey;

      if (!finalApiKey) {
        switch (provider) {
          case "groq":
            finalApiKey = env.GROQ_API_KEY;
            break;

          case "openai":
            finalApiKey = env.OPENAI_API_KEY;
            break;

          case "anthropic":
            finalApiKey = env.ANTHROPIC_API_KEY;
            break;

          case "google":
            finalApiKey = env.GOOGLE_API_KEY;
            break;
        }
      }

      if (!finalApiKey) {
        return new Response(
          JSON.stringify({
            error: "API Key not found."
          }),
          {
            status: 400,
            headers: {
              "Content-Type": "application/json",
              "Access-Control-Allow-Origin": "*"
            }
          }
        );
      }

      const fetchHeaders = {
        "Content-Type": "application/json"
      };

      if (provider === "anthropic") {
        fetchHeaders["x-api-key"] = finalApiKey;
        fetchHeaders["anthropic-version"] = "2023-06-01";
      }

      else if (provider !== "google") {
        fetchHeaders["Authorization"] = "Bearer " + finalApiKey;
      }

      Object.assign(fetchHeaders, customHeaders);

      // فقط یک بار تعریف می‌شود
      let targetUrl = apiUrl;

      if (provider === "google") {
        const separator = apiUrl.includes("?") ? "&" : "?";
        targetUrl = apiUrl + separator + "key=" + finalApiKey;
      }

      const response = await fetch(targetUrl, {
        method: "POST",
        headers: fetchHeaders,
        body: JSON.stringify(requestBody)
      });

      const data = await response.text();

      return new Response(data, {
        status: response.status,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*"
        }
      });

    } catch (err) {

      return new Response(
        JSON.stringify({
          error: err.message
        }),
        {
          status: 500,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*"
          }
        }
      );

    }

  }
};
