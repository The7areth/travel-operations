import { useAsyncAction } from '@/lib/useAsyncAction'
import { useEffect, useMemo, useState } from 'react'
import {
  createGuestList,
  deleteGuestList,
  getCompanies,
  getGuestLists,
  getHotels,
  updateGuestList,
  type Company,
  type Guest,
  type GuestList,
  type GuestListStatus,
  type GuestListType,
  type GuestListVersion,
  type Hotel,
} from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { cn, formatDate } from '@/lib/utils'
import { Copy, Download, FileText, Pencil, Plus, Trash2, Users } from 'lucide-react'

type EditableGuestList = Partial<GuestList> & {
  company?: Company | string
  versions: GuestListVersion[]
}

const emptyGuest = (): Guest => ({
  fullName: '',
  gender: '',
  email: '',
  phone: '',
  nationality: '',
  roomNumber: '',
  roomOccupancy: '',
  roomType: '',
  checkIn: '',
  checkOut: '',
  nights: '',
  arrivalTime: '',
  preExtension: false,
  postExtension: false,
  roomingNotes: '',
})

const emptyVersion = (label = 'V1 - partial list'): GuestListVersion => ({
  label,
  status: 'Partial',
  groupReference: '',
  hotel: '',
  hotelName: '',
  hotelEmail: '',
  roomSummary: '',
  totalRooms: '',
  totalGuests: '',
  mealBasis: 'B&B',
  mealPlan: 'Bed & Breakfast',
  payment: '',
  extra: '',
  ratesNotes: '',
  doubleRate: '',
  twinRate: '',
  singleRate: '',
  notes: '',
  guests: [emptyGuest()],
})

const emptyList = (): EditableGuestList => ({
  name: '',
  company: '',
  type: 'FIT',
  versions: [emptyVersion()],
})

function companyId(company: Company | string | undefined) {
  return typeof company === 'string' ? company : company?._id ?? ''
}

function companyName(company: Company | string | undefined, companies: Company[]) {
  if (!company) return '-'
  if (typeof company !== 'string') return company.name
  return companies.find(c => c._id === company)?.name ?? '-'
}

function hotelId(hotel: Hotel | string | undefined) {
  return typeof hotel === 'string' ? hotel : hotel?._id ?? ''
}

function latestVersion(list: Pick<GuestList, 'versions'>) {
  return list.versions?.[list.versions.length - 1]
}

function listPayload(list: EditableGuestList) {
  return {
    ...list,
    company: companyId(list.company),
    name: list.name?.trim(),
    versions: (list.versions ?? []).map(version => ({
      ...version,
      label: version.label.trim(),
      groupReference: version.groupReference?.trim(),
      hotel: typeof version.hotel === 'string' ? version.hotel : version.hotel?._id,
      hotelName: version.hotelName?.trim(),
      hotelEmail: version.hotelEmail?.trim(),
      roomSummary: version.roomSummary?.trim(),
      totalRooms: version.totalRooms?.trim(),
      totalGuests: version.totalGuests?.trim(),
      mealBasis: version.mealBasis ?? 'B&B',
      mealPlan: version.mealPlan?.trim(),
      payment: version.payment?.trim(),
      extra: version.extra?.trim(),
      ratesNotes: version.ratesNotes?.trim(),
      doubleRate: version.doubleRate?.trim(),
      twinRate: version.twinRate?.trim(),
      singleRate: version.singleRate?.trim(),
      notes: version.notes?.trim(),
      guests: (version.guests ?? [])
        .filter(guest => guest.fullName.trim())
        .map(guest => ({
          ...guest,
          fullName: guest.fullName.trim(),
          gender: guest.gender ?? '',
          email: guest.email?.trim(),
          phone: guest.phone?.trim(),
          nationality: guest.nationality?.trim(),
          roomNumber: guest.roomNumber?.trim(),
          roomOccupancy: guest.roomOccupancy ?? '',
          roomType: guest.roomType?.trim(),
          checkIn: guest.checkIn?.trim(),
          checkOut: guest.checkOut?.trim(),
          nights: guest.nights?.trim(),
          arrivalTime: guest.arrivalTime?.trim(),
          preExtension: Boolean(guest.preExtension),
          postExtension: Boolean(guest.postExtension),
          roomingNotes: guest.roomingNotes?.trim(),
        })),
    })),
  }
}

function extensionLabel(guest: Guest) {
  return [
    guest.preExtension ? 'Pre-extension' : '',
    guest.postExtension ? 'Post-extension' : '',
  ].filter(Boolean).join(', ')
}

function generatedText(list: EditableGuestList, version: GuestListVersion, companies: Company[]) {
  const lines = [
    `${companyName(list.company, companies)} - ${list.name || 'Guest list'}`,
    `Type: ${list.type}`,
    `Version: ${version.label} (${version.status})`,
    version.groupReference ? `Group Name/reference: ${version.groupReference}` : '',
    version.hotelName ? `Hotel: ${version.hotelName}` : '',
    version.roomSummary ? `Total number of rooms: ${version.roomSummary}` : '',
    version.totalGuests ? `Total number of guests: ${version.totalGuests}` : '',
    `Meal basis: ${version.mealBasis || 'B&B'}`,
    version.mealPlan ? `Meals Plan: ${version.mealPlan}` : '',
    version.payment ? `Payment: ${version.payment}` : '',
    version.extra ? `Extra: ${version.extra}` : '',
    version.ratesNotes ? `Rates: ${version.ratesNotes}` : '',
    version.doubleRate ? `Double: ${version.doubleRate}` : '',
    version.twinRate ? `Twin: ${version.twinRate}` : '',
    version.singleRate ? `Single: ${version.singleRate}` : '',
    `Guests: ${version.guests.filter(g => g.fullName.trim()).length}`,
    '',
    'Rooming List',
    ...version.guests
      .filter(g => g.fullName.trim())
      .map((guest, index) => [
        `${index + 1}. ${guest.fullName}`,
        guest.gender ? `Gender: ${guest.gender}` : '',
        guest.roomNumber ? `Rm#: ${guest.roomNumber}` : '',
        guest.roomOccupancy ? `Type: ${guest.roomOccupancy}` : '',
        guest.nationality ? `Nationality: ${guest.nationality}` : '',
        guest.roomType ? `Category: ${guest.roomType}` : '',
        guest.checkIn ? `Check-in: ${guest.checkIn}` : '',
        guest.checkOut ? `Check-out: ${guest.checkOut}` : '',
        guest.nights ? `Nights: ${guest.nights}` : '',
        guest.arrivalTime ? `Arrival: ${guest.arrivalTime}` : '',
        extensionLabel(guest) ? `Extension: ${extensionLabel(guest)}` : '',
        guest.roomingNotes ? `Notes: ${guest.roomingNotes}` : '',
      ].filter(Boolean).join(' | ')),
    version.notes ? '' : '',
    version.notes ? `Notes: ${version.notes}` : '',
  ].filter(line => line !== undefined)
  return lines.join('\n')
}

function csvText(list: EditableGuestList, version: GuestListVersion, companies: Company[]) {
  const rows = [
    ['Company', 'List', 'Type', 'Version', 'Status', 'Group Reference', 'Hotel', 'Meal Basis', 'Meal Plan', 'Payment', 'Extra', 'Rates Notes', 'Full Name', 'Gender', 'Rm#', 'DBL', 'Twin', 'SGL', 'Room Category', 'Check-In', 'Check-Out', 'Nights', 'Comments/Special Requests', 'Expected Arrival Time', 'Pre Extension', 'Post Extension', 'Email', 'Phone', 'Nationality'],
    ...version.guests
      .filter(guest => guest.fullName.trim())
      .map(guest => [
        companyName(list.company, companies),
        list.name ?? '',
        list.type ?? '',
        version.label,
        version.status,
        version.groupReference ?? '',
        version.hotelName ?? '',
        version.mealBasis ?? '',
        version.mealPlan ?? '',
        version.payment ?? '',
        version.extra ?? '',
        version.ratesNotes ?? '',
        guest.fullName,
        guest.gender ?? '',
        guest.roomNumber ?? '',
        guest.roomOccupancy === 'DBL' ? 'DBL' : '',
        guest.roomOccupancy === 'Twin' ? 'Twin' : '',
        guest.roomOccupancy === 'SGL' ? 'SGL' : '',
        guest.roomType ?? '',
        guest.checkIn ?? '',
        guest.checkOut ?? '',
        guest.nights ?? '',
        [
          guest.preExtension ? 'Pre-Extension' : '',
          guest.postExtension ? 'Post-Extension' : '',
          guest.roomingNotes ?? '',
        ].filter(Boolean).join('; '),
        guest.arrivalTime ?? '',
        guest.preExtension ? 'Yes' : '',
        guest.postExtension ? 'Yes' : '',
        guest.email ?? '',
        guest.phone ?? '',
        guest.nationality ?? '',
      ]),
  ]
  return rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n')
}

function RoomingListPreview({ list, version, companies }: { list: EditableGuestList; version: GuestListVersion; companies: Company[] }) {
  const guests = version.guests.filter(guest => guest.fullName.trim())
  return (
    <div className="max-h-[58vh] overflow-auto rounded-lg border border-border bg-white">
      <div className="min-w-[1120px] p-4">
        <div className="mb-3">
          <h3 className="text-base font-medium">{companyName(list.company, companies)} / {list.name}</h3>
          <p className="text-xs text-muted-foreground">{list.type} / {version.label} ({version.status})</p>
        </div>
        <table className="mb-4 w-full border-collapse text-xs">
          <tbody>
            <tr>
              <td className="w-44 border border-border bg-muted/40 px-2 py-1.5 font-medium uppercase text-muted-foreground">Group Name/reference</td>
              <td className="border border-border px-2 py-1.5">{version.groupReference || '-'}</td>
              <td className="border border-border px-2 py-1.5">{version.ratesNotes || '-'}</td>
            </tr>
            <tr>
              <td className="border border-border bg-muted/40 px-2 py-1.5 font-medium uppercase text-muted-foreground">Hotel</td>
              <td className="border border-border px-2 py-1.5">{version.hotelName || '-'}</td>
              <td className="border border-border px-2 py-1.5">Double: {version.doubleRate || '-'}</td>
            </tr>
            <tr>
              <td className="border border-border bg-muted/40 px-2 py-1.5 font-medium uppercase text-muted-foreground">Total number of rooms</td>
              <td className="border border-border px-2 py-1.5">{version.roomSummary || version.totalRooms || '-'}</td>
              <td className="border border-border px-2 py-1.5">Twin: {version.twinRate || '-'}</td>
            </tr>
            <tr>
              <td className="border border-border bg-muted/40 px-2 py-1.5 font-medium uppercase text-muted-foreground">Total number of guests</td>
              <td className="border border-border px-2 py-1.5">{version.totalGuests || guests.length}</td>
              <td className="border border-border px-2 py-1.5">Single: {version.singleRate || '-'}</td>
            </tr>
            <tr>
              <td className="border border-border bg-muted/40 px-2 py-1.5 font-medium uppercase text-muted-foreground">Meals Plan</td>
              <td className="border border-border px-2 py-1.5" colSpan={2}>{version.mealPlan || version.mealBasis || 'B&B'}</td>
            </tr>
            <tr>
              <td className="border border-border bg-muted/40 px-2 py-1.5 font-medium uppercase text-muted-foreground">Payment</td>
              <td className="border border-border px-2 py-1.5" colSpan={2}>{version.payment || '-'}</td>
            </tr>
            <tr>
              <td className="border border-border bg-muted/40 px-2 py-1.5 font-medium uppercase text-muted-foreground">Extra</td>
              <td className="border border-border px-2 py-1.5" colSpan={2}>{version.extra || '-'}</td>
            </tr>
          </tbody>
        </table>
        <table className="w-full border-collapse text-[11px]">
          <thead>
            <tr className="bg-[#f5edd6] text-[#6d5520]">
              {['#', 'Full Name', 'M/F', 'Rm#', 'DBL', 'Twin', 'SGL', 'Room Category', 'Check-In', 'Check-Out', 'Nights', 'Comments/Special Requests', 'Expected Arrival', 'Email / Phone'].map(heading => (
                <th key={heading} className="border border-border px-2 py-1.5 text-left font-semibold uppercase tracking-wide">{heading}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {guests.map((guest, index) => (
              <tr key={guest._id ?? index}>
                <td className="border border-border px-2 py-1.5">{index + 1}</td>
                <td className="border border-border px-2 py-1.5 font-medium">{guest.fullName}</td>
                <td className="border border-border px-2 py-1.5">{guest.gender || ''}</td>
                <td className="border border-border px-2 py-1.5">{guest.roomNumber || ''}</td>
                <td className="border border-border px-2 py-1.5 text-center">{guest.roomOccupancy === 'DBL' ? 'X' : ''}</td>
                <td className="border border-border px-2 py-1.5 text-center">{guest.roomOccupancy === 'Twin' ? 'X' : ''}</td>
                <td className="border border-border px-2 py-1.5 text-center">{guest.roomOccupancy === 'SGL' ? 'X' : ''}</td>
                <td className="border border-border px-2 py-1.5">{guest.roomType || ''}</td>
                <td className="border border-border px-2 py-1.5">{guest.checkIn || ''}</td>
                <td className="border border-border px-2 py-1.5">{guest.checkOut || ''}</td>
                <td className="border border-border px-2 py-1.5">{guest.nights || ''}</td>
                <td className="border border-border px-2 py-1.5">
                  {[guest.preExtension ? 'Pre-Extension' : '', guest.postExtension ? 'Post-Extension' : '', guest.roomingNotes || ''].filter(Boolean).join(' / ')}
                </td>
                <td className="border border-border px-2 py-1.5">{guest.arrivalTime || ''}</td>
                <td className="border border-border px-2 py-1.5">{[guest.email, guest.phone].filter(Boolean).join(' / ')}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {version.notes && <p className="mt-3 text-xs text-muted-foreground">{version.notes}</p>}
      </div>
    </div>
  )
}

function downloadCsv(list: EditableGuestList, version: GuestListVersion, companies: Company[]) {
  const blob = new Blob([csvText(list, version, companies)], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${(list.name || 'guest-list').toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${version.label.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

export function PeoplePage() {
  const { run, busy, error } = useAsyncAction()

  const [companies, setCompanies] = useState<Company[]>([])
  const [hotels, setHotels] = useState<Hotel[]>([])
  const [lists, setLists] = useState<GuestList[]>([])
  const [open, setOpen] = useState(false)
  const [shareOpen, setShareOpen] = useState(false)
  const [editing, setEditing] = useState<EditableGuestList>(emptyList())
  const [activeVersion, setActiveVersion] = useState(0)
  const [shareTarget, setShareTarget] = useState<{ list: EditableGuestList; versionIndex: number } | null>(null)
  const [copied, setCopied] = useState(false)

  async function load() {
    const [nextCompanies, nextHotels, nextLists] = await Promise.all([getCompanies(), getHotels(), getGuestLists()])
    setCompanies(nextCompanies)
    setHotels(nextHotels)
    setLists(nextLists)
  }

  useEffect(() => { void run(load) }, [])

  const currentVersion = editing.versions[activeVersion] ?? editing.versions[0]
  const canSave = Boolean(editing.name?.trim() && companyId(editing.company) && editing.versions.length)

  const shareVersion = useMemo(() => {
    if (!shareTarget) return null
    return shareTarget.list.versions[shareTarget.versionIndex]
  }, [shareTarget])

  async function handleSave() {
    const payload = listPayload(editing)
    if (editing._id) await updateGuestList(editing._id, payload)
    else await createGuestList(payload)
    setOpen(false)
    setActiveVersion(0)
    await load()
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this guest list?')) return
    await deleteGuestList(id)
    await load()
  }

  function editList(list: GuestList) {
    setEditing({ ...list, versions: list.versions.length ? list.versions : [emptyVersion()] })
    setActiveVersion(Math.max(0, list.versions.length - 1))
    setOpen(true)
  }

  function updateVersion(patch: Partial<GuestListVersion>) {
    setEditing(list => ({
      ...list,
      versions: list.versions.map((version, index) => index === activeVersion ? { ...version, ...patch } : version),
    }))
  }

  function updateGuest(index: number, patch: Partial<Guest>) {
    updateVersion({
      guests: currentVersion.guests.map((guest, guestIndex) => guestIndex === index ? { ...guest, ...patch } : guest),
    })
  }

  function addVersion() {
    const base = latestVersion(editing)
    const next: GuestListVersion = {
      label: `V${editing.versions.length + 1} - ${editing.type === 'Group' ? 'updated rooming list' : 'updated FIT list'}`,
      status: 'Partial',
      groupReference: base?.groupReference ?? '',
      hotel: base?.hotel ?? '',
      hotelName: base?.hotelName ?? '',
      hotelEmail: base?.hotelEmail ?? '',
      roomSummary: base?.roomSummary ?? '',
      totalRooms: base?.totalRooms ?? '',
      totalGuests: base?.totalGuests ?? '',
      mealBasis: base?.mealBasis ?? 'B&B',
      mealPlan: base?.mealPlan ?? '',
      payment: base?.payment ?? '',
      extra: base?.extra ?? '',
      ratesNotes: base?.ratesNotes ?? '',
      doubleRate: base?.doubleRate ?? '',
      twinRate: base?.twinRate ?? '',
      singleRate: base?.singleRate ?? '',
      notes: '',
      guests: (base?.guests ?? [emptyGuest()]).map(guest => ({ ...guest })),
    }
    setEditing(list => ({ ...list, versions: [...list.versions, next] }))
    setActiveVersion(editing.versions.length)
  }

  function openShare(list: EditableGuestList, versionIndex?: number) {
    setShareTarget({ list, versionIndex: versionIndex ?? Math.max(0, list.versions.length - 1) })
    setCopied(false)
    setShareOpen(true)
  }

  async function copyShareText() {
    if (!shareTarget || !shareVersion) return
    await navigator.clipboard.writeText(generatedText(shareTarget.list, shareVersion, companies))
    setCopied(true)
  }

  async function downloadRoomingListPdf() {
    if (!shareTarget?.list._id || !shareVersion?._id) return
    const versionIndex = shareTarget.list.versions.findIndex(version => version._id === shareVersion._id)
    const res = await fetch(`/api/pdf/guest-lists/${shareTarget.list._id}/${Math.max(0, versionIndex)}`)
    if (!res.ok) throw new Error('Rooming list PDF generation failed')
    const blob = await res.blob()
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${(shareTarget.list.name || 'rooming-list').toLowerCase().replace(/[^a-z0-9]+/g, '-')}.pdf`
    a.click()
    URL.revokeObjectURL(url)
    await load()
  }

  function mailRoomingList() {
    if (!shareTarget || !shareVersion) return
    const subject = encodeURIComponent(`Rooming list - ${shareVersion.hotelName || shareTarget.list.name}`)
    const body = encodeURIComponent(generatedText(shareTarget.list, shareVersion, companies))
    window.location.href = `mailto:${shareVersion.hotelEmail || ''}?subject=${subject}&body=${body}`
  }

  return (
    <div className="p-4 sm:p-8" aria-busy={busy}>
      {error && <p role="alert" className="mb-4 rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      {busy && <p role="status" className="mb-3 text-sm text-muted-foreground">Working…</p>}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-light tracking-tight">People</h1>
          <p className="text-sm text-muted-foreground mt-1">Company FIT and group guest lists with hotel-ready versions</p>
        </div>
        <Button onClick={() => { setEditing(emptyList()); setActiveVersion(0); setOpen(true) }} className="bg-foreground hover:bg-foreground/90">
          <Plus className="w-4 h-4 mr-2" /> New Guest List
        </Button>
      </div>

      <div className="overflow-x-auto rounded-lg border border-border">
        <Table className="min-w-[980px]">
          <TableHeader>
            <TableRow className="bg-muted/50 hover:bg-muted/50">
              <TableHead className="text-xs tracking-wide uppercase text-muted-foreground font-medium">Company</TableHead>
              <TableHead className="text-xs tracking-wide uppercase text-muted-foreground font-medium">Type</TableHead>
              <TableHead className="text-xs tracking-wide uppercase text-muted-foreground font-medium">List</TableHead>
              <TableHead className="text-xs tracking-wide uppercase text-muted-foreground font-medium">Latest Version</TableHead>
              <TableHead className="text-xs tracking-wide uppercase text-muted-foreground font-medium">Guests</TableHead>
              <TableHead className="text-xs tracking-wide uppercase text-muted-foreground font-medium">Updated</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {lists.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-sm text-muted-foreground py-12">
                  No guest lists yet.
                </TableCell>
              </TableRow>
            ) : lists.map(list => {
              const latest = latestVersion(list)
              return (
                <TableRow key={list._id} className="hover:bg-[#faf7f0] transition-colors">
                  <TableCell className="font-medium text-sm">{companyName(list.company, companies)}</TableCell>
                  <TableCell>
                    <span className={cn(
                      'inline-flex rounded-full px-2.5 py-1 text-xs font-medium',
                      list.type === 'Group' ? 'bg-[#f5edd6] text-[#9a782c]' : 'bg-muted text-muted-foreground'
                    )}>
                      {list.type}
                    </span>
                  </TableCell>
                  <TableCell className="text-sm">{list.name}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {latest ? `${latest.label} / ${latest.status}` : '-'}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">{latest?.guests?.length ?? 0}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{formatDate(list.updatedAt || list.createdAt)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button size="icon" variant="ghost" title="Generate hotel list" className="h-8 w-8 text-muted-foreground hover:text-[#b8963e]"
                        onClick={() => openShare(list)}>
                        <FileText className="w-4 h-4" />
                      </Button>
                      <Button size="icon" variant="ghost" className="h-8 w-8 text-muted-foreground hover:text-[#b8963e]"
                        onClick={() => editList(list)}>
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button size="icon" variant="ghost" className="h-8 w-8 text-muted-foreground hover:text-destructive"
                        onClick={() => void run(() => handleDelete(list._id))}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="w-[calc(100vw-2rem)] sm:max-w-[calc(100vw-2rem)] xl:max-w-7xl max-h-[88vh] overflow-auto">
          <DialogHeader>
            <DialogTitle className="font-light text-lg">{editing._id ? 'Edit Guest List' : 'New Guest List'}</DialogTitle>
          </DialogHeader>

          <div className="grid gap-6 py-2 xl:grid-cols-[320px_minmax(0,1fr)]">
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label className="text-xs uppercase tracking-wide text-muted-foreground">Company *</Label>
                <select
                  value={companyId(editing.company)}
                  onChange={e => setEditing(v => ({ ...v, company: e.target.value }))}
                  className="h-9 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
                >
                  <option value="">Select company</option>
                  {companies.map(company => <option key={company._id} value={company._id}>{company.name}</option>)}
                </select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs uppercase tracking-wide text-muted-foreground">List name *</Label>
                <Input value={editing.name ?? ''} onChange={e => setEditing(v => ({ ...v, name: e.target.value }))} placeholder="AlUla rooming list" />
              </div>

              <div className="space-y-2">
                <Label className="text-xs uppercase tracking-wide text-muted-foreground">Travel type</Label>
                <div className="grid grid-cols-2 gap-2">
                  {(['FIT', 'Group'] as GuestListType[]).map(type => (
                    <button
                      key={type}
                      onClick={() => setEditing(v => ({ ...v, type }))}
                      className={cn(
                        'rounded-lg border px-3 py-2 text-sm font-medium transition-colors',
                        editing.type === type ? 'border-[#b8963e] bg-[#f5edd6] text-[#9a782c]' : 'border-border text-muted-foreground hover:bg-muted'
                      )}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-xs uppercase tracking-wide text-muted-foreground">Versions</Label>
                  <Button type="button" size="sm" variant="outline" className="h-7 gap-1.5 text-xs" onClick={addVersion}>
                    <Plus className="w-3.5 h-3.5" /> Add
                  </Button>
                </div>
                <div className="space-y-1.5">
                  {editing.versions.map((version, index) => (
                    <button
                      key={index}
                      onClick={() => setActiveVersion(index)}
                      className={cn(
                        'w-full rounded-lg border px-3 py-2 text-left transition-colors',
                        activeVersion === index ? 'border-[#b8963e] bg-[#f5edd6]' : 'border-border hover:bg-muted/60'
                      )}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="truncate text-sm font-medium">{version.label}</span>
                        <span className="text-xs text-muted-foreground">{version.guests.length}</span>
                      </div>
                      <span className="text-xs text-muted-foreground">{version.status}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {currentVersion && (
              <div className="space-y-5">
                <div className="grid gap-3 md:grid-cols-[1fr_140px]">
                  <div className="space-y-1.5">
                    <Label className="text-xs uppercase tracking-wide text-muted-foreground">Version label</Label>
                    <Input value={currentVersion.label} onChange={e => updateVersion({ label: e.target.value })} />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs uppercase tracking-wide text-muted-foreground">Status</Label>
                    <select
                      value={currentVersion.status}
                      onChange={e => updateVersion({ status: e.target.value as GuestListStatus })}
                      className="h-9 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
                    >
                      <option value="Draft">Draft</option>
                      <option value="Partial">Partial</option>
                      <option value="Final">Final</option>
                    </select>
                  </div>
                </div>

                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs uppercase tracking-wide text-muted-foreground">Group reference</Label>
                    <Input value={currentVersion.groupReference ?? ''} onChange={e => updateVersion({ groupReference: e.target.value })} placeholder="DEMO-001" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs uppercase tracking-wide text-muted-foreground">Hotel</Label>
                    <select
                      value={hotelId(currentVersion.hotel as Hotel | string | undefined)}
                      onChange={e => {
                        const hotel = hotels.find(item => item._id === e.target.value)
                        updateVersion({
                          hotel: e.target.value,
                          hotelName: hotel?.name ?? currentVersion.hotelName ?? '',
                          hotelEmail: hotel?.emails?.[0] ?? currentVersion.hotelEmail ?? '',
                          mealBasis: hotel?.mealBasis ?? currentVersion.mealBasis,
                          mealPlan: hotel?.mealBasis === 'B&B' ? 'Bed & Breakfast' : currentVersion.mealPlan,
                        })
                      }}
                      className="h-9 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
                    >
                      <option value="">Manual hotel</option>
                      {hotels.map(hotel => <option key={hotel._id} value={hotel._id}>{hotel.name}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs uppercase tracking-wide text-muted-foreground">Shared date</Label>
                    <Input
                      type="date"
                      value={currentVersion.sharedAt ? currentVersion.sharedAt.slice(0, 10) : ''}
                      onChange={e => updateVersion({ sharedAt: e.target.value ? new Date(e.target.value).toISOString() : undefined })}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs uppercase tracking-wide text-muted-foreground">Meal basis</Label>
                    <select
                      value={currentVersion.mealBasis ?? 'B&B'}
                      onChange={e => {
                        const mealBasis = e.target.value as GuestListVersion['mealBasis']
                        const mealPlan = mealBasis === 'B&B'
                          ? 'Bed & Breakfast'
                          : mealBasis === 'Half Board'
                            ? 'Breakfast & Dinner'
                            : mealBasis === 'Full Board'
                              ? 'Breakfast, Lunch & Dinner'
                              : currentVersion.mealPlan ?? ''
                        updateVersion({ mealBasis, mealPlan })
                      }}
                      className="h-9 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
                    >
                      <option value="B&B">B&B</option>
                      <option value="Half Board">Half Board</option>
                      <option value="Full Board">Full Board</option>
                      <option value="Custom">Custom</option>
                    </select>
                  </div>
                </div>

                <div className="grid gap-3 md:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label className="text-xs uppercase tracking-wide text-muted-foreground">Hotel name on list</Label>
                    <Input value={currentVersion.hotelName ?? ''} onChange={e => updateVersion({ hotelName: e.target.value })} placeholder="Banyan Tree AlUla" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs uppercase tracking-wide text-muted-foreground">Hotel email</Label>
                    <Input value={currentVersion.hotelEmail ?? ''} onChange={e => updateVersion({ hotelEmail: e.target.value })} placeholder="hotel@example.com" />
                  </div>
                </div>

                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs uppercase tracking-wide text-muted-foreground">Room summary</Label>
                    <Input value={currentVersion.roomSummary ?? ''} onChange={e => updateVersion({ roomSummary: e.target.value })} placeholder="12 Standard rooms (07 Single, 03 Double, 02 Twin)" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs uppercase tracking-wide text-muted-foreground">Total rooms</Label>
                    <Input value={currentVersion.totalRooms ?? ''} onChange={e => updateVersion({ totalRooms: e.target.value })} placeholder="12" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs uppercase tracking-wide text-muted-foreground">Total guests</Label>
                    <Input value={currentVersion.totalGuests ?? ''} onChange={e => updateVersion({ totalGuests: e.target.value })} placeholder="17 pax" />
                  </div>
                </div>

                <div className="grid gap-3 md:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label className="text-xs uppercase tracking-wide text-muted-foreground">Meals plan</Label>
                    <Input value={currentVersion.mealPlan ?? ''} onChange={e => updateVersion({ mealPlan: e.target.value })} placeholder="Bed, Breakfast & Dinner on 31 Oct 2025" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs uppercase tracking-wide text-muted-foreground">Payment</Label>
                    <Input value={currentVersion.payment ?? ''} onChange={e => updateVersion({ payment: e.target.value })} placeholder="By Tetrapylon rooms with breakfast..." />
                  </div>
                </div>

                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs uppercase tracking-wide text-muted-foreground">Double rate</Label>
                    <Input value={currentVersion.doubleRate ?? ''} onChange={e => updateVersion({ doubleRate: e.target.value })} placeholder="SAR per room per night" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs uppercase tracking-wide text-muted-foreground">Twin rate</Label>
                    <Input value={currentVersion.twinRate ?? ''} onChange={e => updateVersion({ twinRate: e.target.value })} placeholder="SAR per room per night" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs uppercase tracking-wide text-muted-foreground">Single rate</Label>
                    <Input value={currentVersion.singleRate ?? ''} onChange={e => updateVersion({ singleRate: e.target.value })} placeholder="SAR per room per night" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs uppercase tracking-wide text-muted-foreground">Extra</Label>
                    <Input value={currentVersion.extra ?? ''} onChange={e => updateVersion({ extra: e.target.value })} placeholder="To be paid by clients directly" />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs uppercase tracking-wide text-muted-foreground">Rates notes</Label>
                  <Input value={currentVersion.ratesNotes ?? ''} onChange={e => updateVersion({ ratesNotes: e.target.value })} placeholder="Confirmed rates including tax and breakfast" />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs uppercase tracking-wide text-muted-foreground">Names list</Label>
                    <Button type="button" size="sm" variant="outline" className="h-7 gap-1.5 text-xs" onClick={() => updateVersion({ guests: [...currentVersion.guests, emptyGuest()] })}>
                      <Plus className="w-3.5 h-3.5" /> Add Name
                    </Button>
                  </div>
                  <div className="space-y-2">
                    {currentVersion.guests.map((guest, index) => (
                      <div key={index} className="rounded-lg border border-border p-3">
                        <div className="grid gap-2 lg:grid-cols-[1.4fr_70px_78px_110px_110px_1fr_28px]">
                          <Input value={guest.fullName} onChange={e => updateGuest(index, { fullName: e.target.value })} placeholder="Full name *" />
                          <select
                            value={guest.gender ?? ''}
                            onChange={e => updateGuest(index, { gender: e.target.value as Guest['gender'] })}
                            className="h-9 rounded-lg border border-input bg-background px-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
                          >
                            <option value="">Gender</option>
                            <option value="F">F</option>
                            <option value="M">M</option>
                          </select>
                          <Input value={guest.roomNumber ?? ''} onChange={e => updateGuest(index, { roomNumber: e.target.value })} placeholder="Rm#" />
                          <select
                            value={guest.roomOccupancy ?? ''}
                            onChange={e => updateGuest(index, { roomOccupancy: e.target.value as Guest['roomOccupancy'] })}
                            className="h-9 rounded-lg border border-input bg-background px-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
                          >
                            <option value="">Room</option>
                            <option value="DBL">DBL</option>
                            <option value="Twin">Twin</option>
                            <option value="SGL">SGL</option>
                          </select>
                          <Input value={guest.nationality ?? ''} onChange={e => updateGuest(index, { nationality: e.target.value })} placeholder="Nationality" />
                          <Input value={guest.roomType ?? ''} onChange={e => updateGuest(index, { roomType: e.target.value })} placeholder="Room category" />
                          <button
                            onClick={() => updateVersion({ guests: currentVersion.guests.filter((_, guestIndex) => guestIndex !== index) })}
                            className="flex h-9 items-center justify-center text-muted-foreground hover:text-destructive"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                        <div className="mt-2 grid gap-2 lg:grid-cols-[150px_150px_80px_150px_1fr]">
                          <Input type="date" value={guest.checkIn ?? ''} onChange={e => updateGuest(index, { checkIn: e.target.value })} />
                          <Input type="date" value={guest.checkOut ?? ''} onChange={e => updateGuest(index, { checkOut: e.target.value })} />
                          <Input value={guest.nights ?? ''} onChange={e => updateGuest(index, { nights: e.target.value })} placeholder="Nights" />
                          <Input value={guest.arrivalTime ?? ''} onChange={e => updateGuest(index, { arrivalTime: e.target.value })} placeholder="Arrival time" />
                          <Input value={guest.email ?? ''} onChange={e => updateGuest(index, { email: e.target.value })} placeholder="Email" />
                        </div>
                        <div className="mt-2 grid gap-2 lg:grid-cols-[150px_150px_1fr]">
                          <label className="flex h-9 items-center gap-2 rounded-lg border border-input px-3 text-sm text-muted-foreground">
                            <input type="checkbox" checked={Boolean(guest.preExtension)} onChange={e => updateGuest(index, { preExtension: e.target.checked })} />
                            Pre extension
                          </label>
                          <label className="flex h-9 items-center gap-2 rounded-lg border border-input px-3 text-sm text-muted-foreground">
                            <input type="checkbox" checked={Boolean(guest.postExtension)} onChange={e => updateGuest(index, { postExtension: e.target.checked })} />
                            Post extension
                          </label>
                          <Input
                            value={guest.roomingNotes ?? ''}
                            onChange={e => updateGuest(index, { roomingNotes: e.target.value })}
                            placeholder="Comments / special requests, dietary notes, pending passport info..."
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs uppercase tracking-wide text-muted-foreground">Version notes</Label>
                  <Textarea
                    value={currentVersion.notes ?? ''}
                    onChange={e => updateVersion({ notes: e.target.value })}
                    placeholder="Example: Company shared only 12 names; final rooming list still pending."
                    className="min-h-[80px] resize-none text-sm"
                  />
                </div>

                <div className="flex justify-end">
                  <Button type="button" variant="outline" className="gap-1.5" onClick={() => openShare(editing, activeVersion)}>
                    <FileText className="w-4 h-4" /> Generate Hotel List
                  </Button>
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
              {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={() => void run(handleSave)} disabled={busy || !canSave} className="bg-foreground hover:bg-foreground/90">Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={shareOpen} onOpenChange={setShareOpen}>
        <DialogContent className="w-[calc(100vw-2rem)] sm:max-w-[calc(100vw-2rem)] xl:max-w-6xl max-h-[88vh] overflow-auto">
          <DialogHeader>
            <DialogTitle className="font-light text-lg">Hotel Guest List</DialogTitle>
          </DialogHeader>
          {shareTarget && shareVersion && (
            <div className="space-y-4 py-2">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Users className="w-4 h-4 text-[#b8963e]" />
                {companyName(shareTarget.list.company, companies)} / {shareTarget.list.type} / {shareVersion.label}
              </div>
              <RoomingListPreview list={shareTarget.list} version={shareVersion} companies={companies} />
              <div className="flex flex-wrap justify-end gap-2">
                <Button variant="outline" className="gap-1.5" onClick={() => void run(copyShareText)}>
                  <Copy className="w-4 h-4" /> {copied ? 'Copied' : 'Copy Text'}
                </Button>
                <Button variant="outline" className="gap-1.5" onClick={() => void run(downloadRoomingListPdf)} disabled={busy || !shareTarget.list._id || !shareVersion._id}>
                  <FileText className="w-4 h-4" /> Download PDF
                </Button>
                <Button variant="outline" className="gap-1.5" onClick={mailRoomingList}>
                  Mail Hotel
                </Button>
                <Button className="gap-1.5 bg-foreground hover:bg-foreground/90" onClick={() => downloadCsv(shareTarget.list, shareVersion, companies)}>
                  <Download className="w-4 h-4" /> Download CSV
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
