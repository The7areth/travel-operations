const BASE = '/api'

async function req<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  })
  if (!res.ok) {
    const body = await res.json().catch(() => null)
    throw new Error(body?.error || `Request failed (${res.status}). Please try again.`)
  }
  return res.json()
}

export const getPeople = () => req<Person[]>('/people')
export const createPerson = (data: Partial<Person>) => req<Person>('/people', { method: 'POST', body: JSON.stringify(data) })
export const updatePerson = (id: string, data: Partial<Person>) => req<Person>(`/people/${id}`, { method: 'PUT', body: JSON.stringify(data) })
export const deletePerson = (id: string) => req(`/people/${id}`, { method: 'DELETE' })

export const getGuestLists = () => req<GuestList[]>('/guest-lists')
export const createGuestList = (data: Partial<GuestList>) => req<GuestList>('/guest-lists', { method: 'POST', body: JSON.stringify(data) })
export const updateGuestList = (id: string, data: Partial<GuestList>) => req<GuestList>(`/guest-lists/${id}`, { method: 'PUT', body: JSON.stringify(data) })
export const deleteGuestList = (id: string) => req(`/guest-lists/${id}`, { method: 'DELETE' })

export const getHotels = () => req<Hotel[]>('/hotels')
export const createHotel = (data: Partial<Hotel>) => req<Hotel>('/hotels', { method: 'POST', body: JSON.stringify(data) })
export const updateHotel = (id: string, data: Partial<Hotel>) => req<Hotel>(`/hotels/${id}`, { method: 'PUT', body: JSON.stringify(data) })
export const deleteHotel = (id: string) => req(`/hotels/${id}`, { method: 'DELETE' })

export const getServiceConfirmations = () => req<ServiceConfirmation[]>('/service-confirmations')
export const createServiceConfirmation = (data: Partial<ServiceConfirmation>) => req<ServiceConfirmation>('/service-confirmations', { method: 'POST', body: JSON.stringify(data) })
export const updateServiceConfirmation = (id: string, data: Partial<ServiceConfirmation>) => req<ServiceConfirmation>(`/service-confirmations/${id}`, { method: 'PUT', body: JSON.stringify(data) })
export const deleteServiceConfirmation = (id: string) => req(`/service-confirmations/${id}`, { method: 'DELETE' })

export const getCompanies = () => req<Company[]>('/companies')
export const createCompany = (data: Partial<Company>) => req<Company>('/companies', { method: 'POST', body: JSON.stringify(data) })
export const updateCompany = (id: string, data: Partial<Company>) => req<Company>(`/companies/${id}`, { method: 'PUT', body: JSON.stringify(data) })
export const deleteCompany = (id: string) => req(`/companies/${id}`, { method: 'DELETE' })

export const getDestinations = () => req<Destination[]>('/destinations')
export const createDestination = (data: Partial<Destination>) => req<Destination>('/destinations', { method: 'POST', body: JSON.stringify(data) })
export const updateDestination = (id: string, data: Partial<Destination>) => req<Destination>(`/destinations/${id}`, { method: 'PUT', body: JSON.stringify(data) })
export const deleteDestination = (id: string) => req(`/destinations/${id}`, { method: 'DELETE' })
export const resolveImageUrl = (url: string) => req<{ url: string }>('/images/resolve', { method: 'POST', body: JSON.stringify({ url }) })

export const getTemplates = () => req<Template[]>('/templates')
export const createTemplate = (data: Partial<Template>) => req<Template>('/templates', { method: 'POST', body: JSON.stringify(data) })
export const updateTemplate = (id: string, data: Partial<Template>) => req<Template>(`/templates/${id}`, { method: 'PUT', body: JSON.stringify(data) })
export const deleteTemplate = (id: string) => req(`/templates/${id}`, { method: 'DELETE' })

export const getOffers = () => req<Offer[]>('/offers')
export const getOffer = (id: string) => req<Offer>(`/offers/${id}`)
export const createOffer = (data: Partial<Offer>) => req<Offer>('/offers', { method: 'POST', body: JSON.stringify(data) })
export const updateOffer = (id: string, data: Partial<Offer>) => req<Offer>(`/offers/${id}`, { method: 'PUT', body: JSON.stringify(data) })
export const deleteOffer = (id: string) => req(`/offers/${id}`, { method: 'DELETE' })

export interface Person {
  _id: string
  name: string
  email?: string
  properties: Record<string, string>
  createdAt: string
}
export type GuestListType = 'FIT' | 'Group'
export type GuestListStatus = 'Draft' | 'Partial' | 'Final'
export interface Guest {
  _id?: string
  fullName: string
  gender?: '' | 'M' | 'F'
  email?: string
  phone?: string
  nationality?: string
  roomNumber?: string
  roomOccupancy?: '' | 'DBL' | 'Twin' | 'SGL'
  roomType?: string
  checkIn?: string
  checkOut?: string
  nights?: string
  arrivalTime?: string
  preExtension?: boolean
  postExtension?: boolean
  roomingNotes?: string
}
export interface GuestListVersion {
  _id?: string
  label: string
  status: GuestListStatus
  groupReference?: string
  hotel?: Hotel | string
  hotelName?: string
  hotelEmail?: string
  roomSummary?: string
  totalRooms?: string
  totalGuests?: string
  mealBasis?: 'B&B' | 'Half Board' | 'Full Board' | 'Custom'
  mealPlan?: string
  payment?: string
  extra?: string
  ratesNotes?: string
  doubleRate?: string
  twinRate?: string
  singleRate?: string
  notes?: string
  sharedAt?: string
  guests: Guest[]
  createdAt?: string
  updatedAt?: string
}
export interface GuestList {
  _id: string
  name: string
  company: Company | string
  type: GuestListType
  versions: GuestListVersion[]
  exports?: ExportRecord[]
  createdAt: string
  updatedAt: string
}
export interface ExportRecord {
  _id?: string
  sequence: number
  label?: string
  versionIndex?: number
  versionLabel?: string
  filename: string
  kind: string
  exportedAt: string
}
export interface Hotel {
  _id: string
  name: string
  city?: string
  country?: string
  emails?: string[]
  phone?: string
  mealBasis?: 'B&B' | 'Half Board' | 'Full Board' | 'Custom'
  contractNotes?: string
  roomTypes?: { _id?: string; name: string; notes?: string }[]
  createdAt?: string
  updatedAt?: string
}
export interface Company {
  _id: string
  name: string
  logo?: string
  properties: Record<string, string>
}
export interface Destination {
  _id: string
  name: string
  country?: string
  description?: string
  coverImage?: string
  imagePositionX?: number
  imagePositionY?: number
  activities?: DestinationActivity[]
  properties: Record<string, string>
}
export interface ActivityPrice {
  _id?: string
  label: string
  price: number
  currency: string
  notes?: string
}
export interface DestinationActivity {
  _id?: string
  name: string
  description?: string
  duration?: string
  image?: string
  imagePositionX?: number
  imagePositionY?: number
  prices: ActivityPrice[]
}
export interface DayActivity {
  destination?: Destination | string
  activityId?: string
  priceId?: string
  activityName: string
  optionLabel: string
  description?: string
  image?: string
  imagePositionX?: number
  imagePositionY?: number
  price: number
  currency: string
  notes?: string
}
export interface Template {
  _id: string
  name: string
  blocks: Block[]
}
export interface Block {
  type: 'cover' | 'day' | 'pricing' | 'freetext'
  content: string
  order: number
}
export interface Offer {
  _id: string
  company: Company
  people: Person[]
  template: Template
  days: { destinations: Destination[]; activities?: DayActivity[]; notes: string }[]
  options: { label: string; description: string; price: number }[]
  exports?: ExportRecord[]
  status: 'Draft' | 'Sent' | 'Accepted'
  createdAt: string
}

export type ServiceConfirmationStatus = 'Draft' | 'Sent' | 'Updated'
export interface ServiceRow {
  _id?: string
  type: string
  description: string
  status: string
}
export interface ServiceDay {
  _id?: string
  title: string
  rows: ServiceRow[]
}
export interface ServiceConfirmationVersion {
  _id?: string
  label: string
  status: ServiceConfirmationStatus
  guests?: string
  totalTravelers?: string
  rooms?: string
  travelersContact?: string
  client?: string
  destination?: string
  emergencyContact?: string
  dietaryNotes?: string
  days: ServiceDay[]
  notes?: string
  sentAt?: string
}
export interface ServiceConfirmation {
  _id: string
  name: string
  company?: Company | string
  groupReference?: string
  tourDates?: string
  sendBy?: string
  versions: ServiceConfirmationVersion[]
  exports?: ExportRecord[]
  createdAt: string
  updatedAt: string
}
