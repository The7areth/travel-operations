import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AppShell } from '@/components/layout/AppShell'
import { OffersPage } from '@/pages/offers/OffersPage'
import { OfferWizard } from '@/pages/offers/OfferWizard'
import { PeoplePage } from '@/pages/people/PeoplePage'
import { HotelsPage } from '@/pages/hotels/HotelsPage'
import { ServiceConfirmationsPage } from '@/pages/service-confirmations/ServiceConfirmationsPage'
import { CompaniesPage } from '@/pages/companies/CompaniesPage'
import { DestinationsPage } from '@/pages/destinations/DestinationsPage'
import { TemplatesPage } from '@/pages/templates/TemplatesPage'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppShell />}>
          <Route path="/" element={<Navigate to="/offers" replace />} />
          <Route path="/offers" element={<OffersPage />} />
          <Route path="/people" element={<PeoplePage />} />
          <Route path="/hotels" element={<HotelsPage />} />
          <Route path="/service-confirmations" element={<ServiceConfirmationsPage />} />
          <Route path="/companies" element={<CompaniesPage />} />
          <Route path="/destinations" element={<DestinationsPage />} />
          <Route path="/templates" element={<TemplatesPage />} />
        </Route>
        {/* Wizard renders outside the sidebar shell */}
        <Route path="/offers/new" element={<OfferWizard />} />
        <Route path="/offers/:id/edit" element={<OfferWizard />} />
      </Routes>
    </BrowserRouter>
  )
}
