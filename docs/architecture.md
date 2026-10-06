# Architecture and engineering tradeoffs

## Two explicit execution modes

| Concern | Offline demo | MongoDB mode |
|---|---|---|
| Entry | `server/src/demo/index.js` | `server/src/index.js` |
| Storage | Arrays cloned from fictional JSON | Mongoose models |
| Lifetime | Resets on restart | Persists in configured database |
| References | Manual response hydration | Mongoose populate |
| Validation | Lightweight | Schema casting/validation, incomplete request validation |
| PDFs | Shared HTML builders; remote resources blocked | Shared builders; remote URLs may be fetched |
| Intended use | Local evaluation | Local persistent development |

The demo is deliberately easy to run. Maintaining a duplicate API means behavior can diverge. A future storage interface should keep route/service logic shared and swap repositories beneath it.

## Relationships and document boundaries

Companies, people, hotels, destinations, and templates are reusable top-level records. Offers reference companies, people, templates, and destinations. Itinerary days, selected activity details, price options, and export records are embedded in offers. Rooming lists and service confirmations embed versions and their rows.

Embedding favors loading a whole operational document. References favor reuse. This combination needs explicit policies for deleting a referenced entity, snapshots, document-size limits, and concurrent editing. The current code does not provide cascading referential integrity or conflict detection.

## State and requests

The client API wrapper centralizes JSON requests and TypeScript interfaces. React components own form state. There is no offline queue, multi-user synchronization, authentication, or role model. TypeScript catches static mistakes, but server-side runtime validation remains necessary.

## Current design and deployment considerations

- PDF layouts are fixed; stored template blocks do not drive rendering.
- Export records contain metadata, not the exact PDF bytes or content hashes.
- Export sequence numbers derived from array length are not concurrency-safe.
- Database route rejections now reach shared error handling; invalid IDs/fields return 400 and missing CRUD records return 404. Complete domain/reference validation remains future work.
- Input validation rejects empty names, invalid prices, and update operators, and protects top-level IDs, timestamps, and export history. A comprehensive per-resource allowlist is still needed for production.
- Remote images and Chromium resource use require a strict policy before untrusted access.
- Chromium is launched per export and uses inherited no-sandbox options; production requires an isolated, constrained renderer with an appropriate sandbox configuration.
- Large embedded version arrays and inline image data can grow documents and memory.
- There is no automatic currency conversion or independently verified accounting calculation.
- Validation currently covers functional behavior. Workload benchmarks and operational metrics are planned for a hosted deployment.

## Prioritized next steps

1. Consolidate backends behind a repository interface and test both implementations.
2. Add runtime request schemas, consistent errors, and reference checks.
3. Implement snapshot/approval rules and atomic export sequencing; persist PDF bytes separately.
4. Connect the template block editor to the renderer with escaping and allowlisted content.
5. Add authentication, roles, CSRF/origin policies where applicable, resource limits, logs, backups, and dependency maintenance before deployment.

The current architecture supports local evaluation and persistent development. The milestones above define the path to a hosted, multi-user service.
