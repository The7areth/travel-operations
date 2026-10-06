# API guide

The client uses `/api`. Vite forwards to port 3001. Run one backend at a time. Examples below use the offline demo; its IDs are fixture strings, while MongoDB uses ObjectIds.

| Resource | Methods | Notes |
|---|---|---|
| `/api/people` | GET, POST | Person directory |
| `/api/companies` | GET, POST | Company directory |
| `/api/hotels` | GET, POST | Room types and hotel information |
| `/api/destinations` | GET, POST | Activities and price alternatives |
| `/api/templates` | GET, POST | Stored blocks, not yet interpreted by the PDF renderer |
| Above resources + `/:id` | PUT, DELETE | Modify/delete one record |
| `/api/offers` | GET, POST | List/create offers |
| `/api/offers/:id` | GET, PUT, DELETE | Read/update/delete an offer |
| `/api/guest-lists` | GET, POST | Versioned rooming lists |
| `/api/guest-lists/:id` | GET, PUT, DELETE | One guest list |
| `/api/service-confirmations` | GET, POST | Versioned service records |
| `/api/service-confirmations/:id` | GET, PUT, DELETE | One confirmation |
| `/api/pdf/:id` | GET | Offer PDF |
| `/api/pdf/guest-lists/:id/:versionIndex` | GET | Rooming-list PDF; zero-based version index |
| `/api/pdf/service-confirmations/:id/:versionIndex` | GET | Service-confirmation PDF |
| `/api/images/resolve` | POST | Resolve a supported image URL; may need network |
| `/api/health` | GET | Offline demo only: mode and persistence information |

```sh
curl http://127.0.0.1:3001/api/offers/o1
curl -X POST http://127.0.0.1:3001/api/companies \
  -H 'Content-Type: application/json' \
  -d '{"name":"Example Travel","properties":{}}'
curl http://127.0.0.1:3001/api/pdf/o1 -o offer.pdf
```

PDF GET requests have a side effect: they append export metadata. A production redesign should use POST for creating an export and GET for downloading the created resource. Error handling differs between modes; do not assume database and demo contracts are completely identical. Client interfaces are in `client/src/lib/api.ts`, persistent schemas in `server/src/models`.
