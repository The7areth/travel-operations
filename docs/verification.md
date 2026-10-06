# Verification record

Publication preparation: October 6, 2026.

The repository includes fictional JSON fixtures for reproducible evaluation. Environment files, operational records, and generated traveler documents are excluded from version control.

The client TypeScript/Vite build passed. All nine automated checks passed, including real offer, rooming-list, and service-confirmation PDF responses. An offer editor loading defect was fixed: step state now mounts after the existing offer arrives, and participant selections support both IDs and populated objects. Browser verification confirmed the existing company and both travelers are selected on load and remain selected after advancing to Itinerary and returning. A screenshot of the live itinerary editor is included in the README. Consult the live CI badge for Linux execution status. Production deployment has not been verified.

## Reliability update

Added regression checks for failed PDF exports and protected identity/history, plus isolated MongoDB integration coverage. The client now reports action failures inline, blocks repeated submissions, saves the selected template on exit, and gives offline versions stable IDs. Browser checks confirmed invalid pricing stays on the same step with a useful message and succeeds after correction. Consult GitHub Actions for the updated suite result.

[Linux verification run 37406077589](https://github.com/The7areth/travel-operations/actions/runs/37406077589) passed on October 6, 2026, for commit `1ef6ed6`: client build and all **14 tests** (11 demo/PDF checks and three real MongoDB integration checks). The database tests ran against an isolated temporary MongoDB instance. The local demo suite passed; the slower local MongoDB binary download was stopped after Linux verification completed. Browser checks also confirmed that Save & Exit persists a changed template, and navigation adapts to a 390-pixel-wide viewport.
