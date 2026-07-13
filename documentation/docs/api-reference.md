---
sidebar_position: 7
---

# API Reference

The detailed endpoint reference for the MaqamTravels REST API is served interactively via the Swagger (OpenAPI 3.0) UI hosted on our API servers.

## Accessing the Swagger UI

* **Local Environment:** [http://localhost:5000/api/docs](http://localhost:5000/api/docs)
* **Staging Server:** [https://staging-api.maqamtravels.com/api/docs](https://staging-api.maqamtravels.com/api/docs)
* **Production Gateway:** [https://api.maqamtravels.com/api/docs](https://api.maqamtravels.com/api/docs)

To view the raw compiled OpenAPI specification JSON schema, request the docs payload directly:
`GET /api/docs.json` (e.g., [http://localhost:5000/api/docs.json](http://localhost:5000/api/docs.json)).

---

## Design Choices & Best Practices

We deliberately avoid copy-pasting API route details (parameters, request bodies, HTTP codes) inside Docusaurus markdown files. The reasons for this architecture include:

1. **Elimination of Duplication:** Specifying endpoint parameters in both code schemas and markdown files creates documentation drift.
2. **Single Source of Truth:** Route changes, validations, and body schemas are updated inside the code JSDoc blocks. Rebuilding or deploying the backend automatically updates the Swagger schema.
3. **Interactive Sandboxing:** Developers can execute live API calls (e.g., testing authentication flow or fetching flights) using the **Try it out** button directly in the browser, which is not possible in static markdown pages.

---

## Swagger Schema Validation

When adding new routes, verify that your OpenAPI blocks are correct. If an invalid reference is specified (e.g., referencing a missing `$ref` schema), the Swagger UI console will show schema rendering errors. Always check the browser inspector when loading the Swagger page locally.
