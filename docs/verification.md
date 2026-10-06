# Verification record

Publication preparation: October 6, 2026.

The public copy is prepared separately from the original local project. Environment files, operational assets, generated documents, and original helper fixtures were excluded. Demo records were replaced entirely with fictional JSON fixtures. Personal study notes are stored outside the repository.

The client TypeScript/Vite build passed. All nine automated checks passed, including real offer, rooming-list, and service-confirmation PDF responses. An offer editor loading defect was fixed: step state now mounts after the existing offer arrives, and participant selections support both IDs and populated objects. Browser verification confirmed the existing company and both travelers are selected on load and remain selected after advancing to Itinerary and returning. A screenshot of the live itinerary editor is included in the README. Consult the live CI badge for Linux execution status. MongoDB integration and production deployment have not been verified in this preparation environment.
