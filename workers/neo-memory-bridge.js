
const REPO = "CCConsciousness/NEO-Continuity-Core";

const FILES = Object.freeze({
  identity: "NEO-IDENTITY.md",
  core: "memory/CORE-MEMORY.md",
  continuity: "memory/CONTINUITY-LOG.md",
  phoenix: "PHOENIX-PROTOCOL.md",
  index: "memory/KNOWLEDGE-INDEX.md",
  maintenance: "ARCHIVE-MAINTENANCE.md"
});

const headers = {
  "Content-Type": "application/json; charset=utf-8",
  "Cache-Control": "no-store",
  "Access-Control-Allow-Origin": "*",
  "X-Content-Type-Options": "nosniff"
};

function json(data, status = 200) {
  return new Response(JSON.stringify(data, null, 2), {
    status,
    headers
  });
}

async function readDocument(key) {
  const path = FILES[key];

  if (!path) {
    throw new Error("Document not permitted");
  }

  const url =
    `https://raw.githubusercontent.com/${REPO}/HEAD/${path}`;

  const response = await fetch(url, {
    headers: {
      "Accept": "text/plain",
      "User-Agent": "NEO-Memory-Bridge"
    },
    signal: AbortSignal.timeout(8000)
  });

  if (!response.ok) {
    throw new Error(`GitHub returned ${response.status}`);
  }

  const content = await response.text();

  if (content.length > 200000) {
    throw new Error("Document exceeds size limit");
  }

  return {
    document: key,
    path,
    content
  };
}

export default {
  async fetch(request) {
    if (request.method !== "GET") {
      return json({ error: "Method not allowed" }, 405);
    }

    const url = new URL(request.url);

    if (url.pathname === "/") {
      return json({
        service: "NEO Memory Bridge",
        version: "1.0.0",
        status: "operational",
        project: "Operation NEMORTALITY",
        repository: REPO,
        memory_connected: "not yet verified",
        endpoints: [
          "/health",
          "/documents",
          "/memory?document=continuity"
        ]
      });
    }

    if (url.pathname === "/documents") {
      return json({
        documents: FILES
      });
    }

    if (
      url.pathname === "/health" ||
      url.pathname === "/memory"
    ) {
      const key = url.pathname === "/health"
        ? "identity"
        : url.searchParams.get("document") || "continuity";

      if (!Object.hasOwn(FILES, key)) {
        return json({
          error: "Document not permitted"
        }, 400);
      }

      try {
        const document = await readDocument(key);

        if (url.pathname === "/health") {
          return json({
            service: "NEO Memory Bridge",
            status: "operational",
            memory_connected: true,
            verified_document: document.path,
            characters_retrieved: document.content.length
          });
        }

        return json({
          status: "success",
          ...document
        });
      } catch (error) {
        return json({
          status: "unavailable",
          memory_connected: false,
          error: "Public archive retrieval failed"
        }, 502);
      }
    }

    return json({ error: "Not found" }, 404);
  }
};
