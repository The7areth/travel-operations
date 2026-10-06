# Travel Operations: complete walkthrough

## 1. The problem

Travel operations involve related information that is often copied between offers, rooming lists, and service confirmations. This project models those records in one application and renders documents from structured data. The portfolio edition uses fictional content, so a reviewer can explore the workflow without company or traveler records.

The engineering story is translating an operational process into reusable entities, a multi-step interface, API operations, and generated documents. Any claim of business adoption or time saved needs separate evidence; the repository itself demonstrates the implementation.

## 2. Start with the offline mode

Follow [setup](setup.md), run `npm run demo`, and open the Offers screen. The server loads [fixtures.json](../server/src/demo/fixtures.json), stamps the records with creation/update times, and exposes Express endpoints. Arrays hold the records in process memory. A restart creates fresh arrays from the fixture.

The original offline helper has been packaged as a normal server entry point. The publication copy replaces its operational-looking examples with fictional data, adds a health endpoint, and forwards rejected asynchronous requests to error middleware. The original local source remains separate.

Offline here means no database or network is needed for the bundled workflow after installation. It does not mean service-worker caching, durable local storage, or a native desktop app.

## 3. Reusable records

Companies represent the organization receiving an offer. People represent participants. Hotels store room types, meal basis, and contact details. Destinations store descriptive information and activities; activities have named price alternatives and currencies. Dynamic properties allow additional string fields without a dedicated UI/schema field for every one.

This flexibility speeds up changing business requirements, but arbitrary properties do not guarantee consistent naming, types, or reporting. A larger system should promote important fields into validated schema attributes.

Code: [models](../server/src/models), [client API types](../client/src/lib/api.ts).

## 4. Follow an offer through the application

The [wizard](../client/src/pages/offers/OfferWizard.tsx) is outside the sidebar shell. Its steps organize company/participants, itinerary, template selection, and pricing options. React state holds the draft while the user moves through steps. The client API module serializes it as JSON and sends a POST or PUT to `/api/offers`.

In offline mode, the API stores references as IDs and hydrates them for responses: a company ID becomes a company object, participant IDs become people, and destination IDs become destinations. In persistent mode, Mongoose `populate` performs the analogous reference lookup. This is why the UI can display names while the stored relationship is an ID.

An itinerary day includes destination references, notes, and selected activity details. The activity selection contains copied names/prices as well as references. The PDF helper can consult the current destination activity when rendering; therefore an old offer export is not guaranteed to be an immutable snapshot of the original catalog. A robust approval workflow would explicitly freeze the accepted offer.

Statuses are Draft, Sent, and Accepted. These are stored labels, not an email delivery or electronic-signature integration. Changing a status does not prove that a message was delivered or a contract accepted.

## 5. Rooming lists

The People area also exposes guest-list operations. A guest list has a company, FIT/Group type, and an array of versions. Each version includes hotel details, room summaries, dates, guests, meal/payment notes, and a Draft/Partial/Final label. Per-guest rows capture occupancy, arrival information, and extension notes.

Embedding versions makes the document convenient to load as one unit. The tradeoff is document growth and potentially conflicting full-document updates. Versions can be edited; they are not a compliance-grade audit trail. Counts such as room totals are supplied fields, so consistency with guest rows should be checked rather than assumed.

Code: [GuestList schema](../server/src/models/GuestList.js), [guest-list routes](../server/src/routes/guestLists.js), [People screen](../client/src/pages/people/PeoplePage.tsx).

## 6. Service confirmations

A service confirmation groups operational instructions into days and rows. Each row describes a service, its details, and status. A version includes traveler counts, room notes, contacts, dietary notes, and general instructions. The structure is rendered as a printable confirmation.

The labels Draft, Sent, and Updated describe the user's workflow. No supplier booking system or delivery confirmation is integrated. The portfolio fixture deliberately contains no real passenger or guide contacts.

Code: [ServiceConfirmation schema](../server/src/models/ServiceConfirmation.js), [screen](../client/src/pages/service-confirmations/ServiceConfirmationsPage.tsx).

## 7. How a PDF is generated

1. The browser requests the matching `/api/pdf` endpoint.
2. The backend locates the document and selected version, returning 404 if missing.
3. References are hydrated so the renderer receives usable company/destination data.
4. A shared builder produces HTML for an offer, rooming list, or service confirmation.
5. Puppeteer opens headless Chrome, loads the HTML, and prints a PDF using the layout's page rules.
6. The backend returns `application/pdf` with a download filename and records export metadata.
7. The browser process is closed even if rendering fails.

Text values are HTML-escaped. Attribute escaping alone is not URL validation: remote resource controls are a separate concern. Offline mode blocks remote requests while rendering. Persistent mode still needs an explicit resource policy before handling untrusted uploads/URLs.

The offline helper inherited export metadata updates before rendering succeeds. A failed render may therefore leave an export entry. Persistent mode records after rendering, but parallel exports can still race on sequence assignment. These are documented limitations rather than claims of atomic audit behavior.

Code: [shared builders](../server/src/pdf/template.js), [persistent PDF endpoints](../server/src/routes/pdf.js), [offline API](../server/src/demo/index.js).

## 8. Template editing versus document layout

Templates and their blocks are editable records and can be selected for offers. However, the current `buildOfferHtml` function uses a fixed layout and does not interpret the stored template blocks. This distinction matters during a demo: show the functioning PDF layouts, and describe block-driven rendering as future work rather than an existing feature.

## 9. Client/server separation

React renders screens and handles interactions. TypeScript describes client data shapes at build time; it does not validate arbitrary network input at runtime. Express exposes endpoints. Mongoose adds persistent schema casting and validation in database mode, while the offline server has lighter validation. The two modes share PDF builders and API paths, but do not share a storage abstraction.

The Vite proxy allows the client to use `/api` without hard-coding a backend URL in every component. A production host would need an equivalent reverse proxy. Building the client bundle alone does not deploy the system.

## 10. Test and inspect

Run the client build, then the server suite. The tests start the demo on a random loopback port and exercise HTTP responses, mutations, reference hydration, missing records, generated PDF headers, and escaping. Database integration needs its own verification; passing a demo test does not prove MongoDB behavior.

For a short demonstration: open the sample offer, change a day note, export the offer, inspect a guest-list version, and export a service confirmation. Then show the model schemas and one PDF builder to connect the UI to its implementation.

## 11. What to improve next

Prioritize a shared service/storage layer with parity tests, input validation and error handling, immutable accepted-offer snapshots, reliable export sequence allocation, and block-driven templates. Before real deployment add authentication, permissions, resource restrictions, backups, operational monitoring, and privacy controls. These are future requirements, not delivered features.

See [architecture and tradeoffs](architecture.md) for the design review and [API guide](api.md) for the endpoint map.
