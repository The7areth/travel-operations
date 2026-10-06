import { useEffect, useMemo, useState } from 'react'
import {
  createServiceConfirmation,
  deleteServiceConfirmation,
  getCompanies,
  getServiceConfirmations,
  updateServiceConfirmation,
  type Company,
  type ServiceConfirmation,
  type ServiceConfirmationStatus,
  type ServiceConfirmationVersion,
  type ServiceDay,
  type ServiceRow,
} from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { cn, formatDate } from '@/lib/utils'
import { Download, FileText, Pencil, Plus, Trash2 } from 'lucide-react'

type EditableSC = Partial<ServiceConfirmation> & { versions: ServiceConfirmationVersion[] }

const sampleDays = (): ServiceDay[] => [
  {
    title: 'Day 01: Friday - 31 October - Arrive to Riyadh',
    rows: [
      { type: 'Airport transfer', description: 'Private transfer from Riyadh Airport to Centro Olaya Hotel with English-speaking representative.', status: 'Confirmed' },
      { type: 'Dinner', description: 'Dinner at Centro Olaya hotel.', status: 'Confirmed' },
      { type: 'Accommodation', description: 'Centro Olaya Hotel - 12 Standard Rooms (03 Double, 02 Twin and 07 Single).', status: 'Confirmed' },
    ],
  },
  {
    title: 'Day 02: Saturday - 01 November - Riyadh City Tour',
    rows: [
      { type: 'Guide', description: 'English-speaking guide. Pickup time: 09:00am from Centro Olaya Hotel.', status: 'Confirmed' },
      { type: 'Transportation', description: 'Private a/c coach bus.', status: 'Confirmed' },
      { type: 'Tour', description: 'Visit Diriyah, National Museum, Masmak Fortress, and Souq al Zal.', status: 'Confirmed' },
    ],
  },
]

const emptyVersion = (label = 'V1 - service confirmation'): ServiceConfirmationVersion => ({
  label,
  status: 'Draft',
  guests: '',
  totalTravelers: '',
  rooms: '',
  travelersContact: 'N/A',
  client: '',
  destination: '',
  emergencyContact: '',
  dietaryNotes: '',
  days: sampleDays(),
  notes: '',
})

const emptySC = (): EditableSC => ({
  name: '',
  company: '',
  groupReference: '',
  tourDates: '',
  sendBy: '',
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

function latestVersion(item: Pick<ServiceConfirmation, 'versions'>) {
  return item.versions?.[item.versions.length - 1]
}

function payload(item: EditableSC) {
  return {
    ...item,
    company: companyId(item.company as Company | string | undefined),
    name: item.name?.trim(),
    groupReference: item.groupReference?.trim(),
    tourDates: item.tourDates?.trim(),
    sendBy: item.sendBy?.trim(),
    versions: item.versions.map(version => ({
      ...version,
      label: version.label.trim(),
      guests: version.guests?.trim(),
      totalTravelers: version.totalTravelers?.trim(),
      rooms: version.rooms?.trim(),
      travelersContact: version.travelersContact?.trim(),
      client: version.client?.trim(),
      destination: version.destination?.trim(),
      emergencyContact: version.emergencyContact?.trim(),
      dietaryNotes: version.dietaryNotes?.trim(),
      notes: version.notes?.trim(),
      days: version.days.filter(day => day.title.trim()).map(day => ({
        ...day,
        title: day.title.trim(),
        rows: day.rows.filter(row => row.type.trim() || row.description.trim()).map(row => ({
          ...row,
          type: row.type.trim(),
          description: row.description.trim(),
          status: row.status.trim() || 'Confirmed',
        })),
      })),
    })),
  }
}

function ServicePreview({ version }: { version: ServiceConfirmationVersion }) {
  return (
    <div className="max-h-[55vh] overflow-auto rounded-lg border border-border bg-white">
      <div className="min-w-[900px] p-4">
        <table className="mb-4 w-full border-collapse text-xs">
          <tbody>
            {[
              ['Guests', version.guests],
              ['Total Travelers', version.totalTravelers],
              ['Rooms', version.rooms],
              ['Travelers Contact Information', version.travelersContact || 'N/A'],
              ['Client', version.client],
              ["Traveller's Destination", version.destination],
              ['Emergency Contact', version.emergencyContact],
              ['Dietary restrictions/Medical Conditions/requests', version.dietaryNotes],
            ].map(([label, value]) => (
              <tr key={label}>
                <td className="w-64 border border-border bg-muted/40 px-2 py-1.5 font-medium">{label}</td>
                <td className="whitespace-pre-wrap border border-border px-2 py-1.5">{value || '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="mb-2 text-sm font-medium">List of services</p>
        {version.days.map((day, dayIndex) => (
          <div key={day._id ?? dayIndex} className="mb-4">
            <div className="border border-[#a8c79c] bg-[#d9ead3] px-2 py-1.5 text-xs font-semibold">{day.title}</div>
            <table className="w-full border-collapse text-xs">
              <thead>
                <tr className="bg-[#e2f0d9]">
                  <th className="w-[28%] border border-border px-2 py-1.5 text-left">Type of services</th>
                  <th className="border border-border px-2 py-1.5 text-left">Description</th>
                  <th className="w-[16%] border border-border px-2 py-1.5 text-left">Services Status</th>
                </tr>
              </thead>
              <tbody>
                {day.rows.map((row, rowIndex) => (
                  <tr key={row._id ?? rowIndex}>
                    <td className="whitespace-pre-wrap border border-border px-2 py-1.5">{row.type}</td>
                    <td className="whitespace-pre-wrap border border-border px-2 py-1.5">{row.description}</td>
                    <td className="border border-border px-2 py-1.5">{row.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}
      </div>
    </div>
  )
}

export function ServiceConfirmationsPage() {
  const [companies, setCompanies] = useState<Company[]>([])
  const [items, setItems] = useState<ServiceConfirmation[]>([])
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<EditableSC>(emptySC())
  const [activeVersion, setActiveVersion] = useState(0)

  async function load() {
    const [nextCompanies, nextItems] = await Promise.all([getCompanies(), getServiceConfirmations()])
    setCompanies(nextCompanies)
    setItems(nextItems)
  }
  useEffect(() => { load() }, [])

  const currentVersion = editing.versions[activeVersion] ?? editing.versions[0]
  const canSave = Boolean(editing.name?.trim() && editing.versions.length)
  const latest = useMemo(() => editing.versions[editing.versions.length - 1], [editing.versions])

  function updateVersion(patch: Partial<ServiceConfirmationVersion>) {
    setEditing(item => ({ ...item, versions: item.versions.map((version, index) => index === activeVersion ? { ...version, ...patch } : version) }))
  }

  function updateDay(dayIndex: number, patch: Partial<ServiceDay>) {
    updateVersion({ days: currentVersion.days.map((day, index) => index === dayIndex ? { ...day, ...patch } : day) })
  }

  function updateRow(dayIndex: number, rowIndex: number, patch: Partial<ServiceRow>) {
    updateDay(dayIndex, {
      rows: currentVersion.days[dayIndex].rows.map((row, index) => index === rowIndex ? { ...row, ...patch } : row),
    })
  }

  function addVersion() {
    const base = latest ?? emptyVersion()
    setEditing(item => ({
      ...item,
      versions: [...item.versions, {
        ...base,
        label: `V${item.versions.length + 1} - updated service confirmation`,
        status: 'Updated',
        days: base.days.map(day => ({ ...day, rows: day.rows.map(row => ({ ...row })) })),
      }],
    }))
    setActiveVersion(editing.versions.length)
  }

  async function save() {
    const data = payload(editing)
    if (editing._id) await updateServiceConfirmation(editing._id, data)
    else await createServiceConfirmation(data)
    setOpen(false)
    setActiveVersion(0)
    load()
  }

  async function remove(id: string) {
    if (!confirm('Delete this service confirmation?')) return
    await deleteServiceConfirmation(id)
    load()
  }

  async function exportPdf(item: ServiceConfirmation, versionIndex?: number) {
    const index = versionIndex ?? Math.max(0, item.versions.length - 1)
    const res = await fetch(`/api/pdf/service-confirmations/${item._id}/${index}`)
    if (!res.ok) throw new Error('Service confirmation PDF generation failed')
    const blob = await res.blob()
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${(item.groupReference || item.name).toLowerCase().replace(/[^a-z0-9]+/g, '-')}-service-confirmation.pdf`
    a.click()
    URL.revokeObjectURL(url)
    load()
  }

  return (
    <div className="p-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-light tracking-tight">Service Confirmations</h1>
          <p className="mt-1 text-sm text-muted-foreground">Agent-ready service confirmations with table layouts and saved versions</p>
        </div>
        <Button onClick={() => { setEditing(emptySC()); setActiveVersion(0); setOpen(true) }} className="bg-foreground hover:bg-foreground/90">
          <Plus className="mr-2 h-4 w-4" /> New SC
        </Button>
      </div>

      <div className="overflow-hidden rounded-lg border border-border">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50 hover:bg-muted/50">
              <TableHead className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Reference</TableHead>
              <TableHead className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Client</TableHead>
              <TableHead className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Tour Dates</TableHead>
              <TableHead className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Latest Version</TableHead>
              <TableHead className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Exports</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map(item => {
              const version = latestVersion(item)
              return (
                <TableRow key={item._id} className="hover:bg-[#faf7f0]">
                  <TableCell className="font-medium">{item.groupReference || item.name}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{companyName(item.company, companies)}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{item.tourDates || '-'}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{version ? `${version.label} / ${version.status}` : '-'}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{item.exports?.length ? `V${item.exports.length} / ${formatDate(item.exports[item.exports.length - 1].exportedAt)}` : '-'}</TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-1">
                      <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => exportPdf(item)}>
                        <Download className="h-4 w-4" />
                      </Button>
                      <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => { setEditing({ ...item, versions: item.versions.length ? item.versions : [emptyVersion()] }); setActiveVersion(Math.max(0, item.versions.length - 1)); setOpen(true) }}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button size="icon" variant="ghost" className="h-8 w-8 hover:text-destructive" onClick={() => remove(item._id)}>
                        <Trash2 className="h-4 w-4" />
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
            <DialogTitle className="font-light">{editing._id ? 'Edit Service Confirmation' : 'New Service Confirmation'}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-6 py-2 xl:grid-cols-[320px_minmax(0,1fr)]">
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label className="text-xs uppercase tracking-wide text-muted-foreground">Name *</Label>
                <Input value={editing.name ?? ''} onChange={e => setEditing(v => ({ ...v, name: e.target.value }))} placeholder="MSA2532 Group Service Confirmation" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs uppercase tracking-wide text-muted-foreground">Client company</Label>
                <select value={companyId(editing.company as any)} onChange={e => setEditing(v => ({ ...v, company: e.target.value }))} className="h-9 w-full rounded-lg border border-input bg-background px-3 text-sm">
                  <option value="">Select company</option>
                  {companies.map(company => <option key={company._id} value={company._id}>{company.name}</option>)}
                </select>
              </div>
              <div className="grid gap-3">
                <Input value={editing.groupReference ?? ''} onChange={e => setEditing(v => ({ ...v, groupReference: e.target.value }))} placeholder="MSA2532" />
                <Input value={editing.tourDates ?? ''} onChange={e => setEditing(v => ({ ...v, tourDates: e.target.value }))} placeholder="31 Oct - 08 Nov 2025" />
                <Input type="date" value={editing.sendBy ?? ''} onChange={e => setEditing(v => ({ ...v, sendBy: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-xs uppercase tracking-wide text-muted-foreground">Versions</Label>
                  <Button type="button" size="sm" variant="outline" className="h-7 gap-1.5 text-xs" onClick={addVersion}>
                    <Plus className="h-3.5 w-3.5" /> Add
                  </Button>
                </div>
                {editing.versions.map((version, index) => (
                  <button key={index} onClick={() => setActiveVersion(index)} className={cn('w-full rounded-lg border px-3 py-2 text-left', activeVersion === index ? 'border-[#b8963e] bg-[#f5edd6]' : 'border-border hover:bg-muted/60')}>
                    <span className="block truncate text-sm font-medium">{version.label}</span>
                    <span className="text-xs text-muted-foreground">{version.status} / {version.days.length} days</span>
                  </button>
                ))}
              </div>
            </div>

            {currentVersion && (
              <div className="space-y-5">
                <div className="grid gap-3 md:grid-cols-[1fr_150px]">
                  <Input value={currentVersion.label} onChange={e => updateVersion({ label: e.target.value })} />
                  <select value={currentVersion.status} onChange={e => updateVersion({ status: e.target.value as ServiceConfirmationStatus })} className="h-9 rounded-lg border border-input bg-background px-3 text-sm">
                    <option value="Draft">Draft</option>
                    <option value="Sent">Sent</option>
                    <option value="Updated">Updated</option>
                  </select>
                </div>
                <div className="grid gap-3 md:grid-cols-2">
                  <Textarea value={currentVersion.guests ?? ''} onChange={e => updateVersion({ guests: e.target.value })} placeholder="Guests" className="min-h-[90px] resize-none text-sm" />
                  <Textarea value={currentVersion.dietaryNotes ?? ''} onChange={e => updateVersion({ dietaryNotes: e.target.value })} placeholder="Dietary / medical / requests" className="min-h-[90px] resize-none text-sm" />
                </div>
                <div className="grid gap-3 md:grid-cols-3">
                  <Input value={currentVersion.totalTravelers ?? ''} onChange={e => updateVersion({ totalTravelers: e.target.value })} placeholder="17 pax" />
                  <Input value={currentVersion.rooms ?? ''} onChange={e => updateVersion({ rooms: e.target.value })} placeholder="12 Rooms..." />
                  <Input value={currentVersion.destination ?? ''} onChange={e => updateVersion({ destination: e.target.value })} placeholder="Saudi Arabia" />
                  <Input value={currentVersion.travelersContact ?? ''} onChange={e => updateVersion({ travelersContact: e.target.value })} placeholder="Traveler contact" />
                  <Input value={currentVersion.client ?? ''} onChange={e => updateVersion({ client: e.target.value })} placeholder="Wendy Wu Tours" />
                  <Input value={currentVersion.emergencyContact ?? ''} onChange={e => updateVersion({ emergencyContact: e.target.value })} placeholder="+966..." />
                </div>

                <ServicePreview version={currentVersion} />

                <div className="space-y-3">
                  {currentVersion.days.map((day, dayIndex) => (
                    <div key={day._id ?? dayIndex} className="rounded-lg border border-border p-3">
                      <div className="mb-3 flex gap-2">
                        <Input value={day.title} onChange={e => updateDay(dayIndex, { title: e.target.value })} />
                        <Button type="button" variant="ghost" size="icon" onClick={() => updateVersion({ days: currentVersion.days.filter((_, index) => index !== dayIndex) })}><Trash2 className="h-4 w-4" /></Button>
                      </div>
                      <div className="space-y-2">
                        {day.rows.map((row, rowIndex) => (
                          <div key={row._id ?? rowIndex} className="grid gap-2 md:grid-cols-[190px_1fr_120px_28px]">
                            <Input value={row.type} onChange={e => updateRow(dayIndex, rowIndex, { type: e.target.value })} placeholder="Guide" />
                            <Textarea value={row.description} onChange={e => updateRow(dayIndex, rowIndex, { description: e.target.value })} placeholder="Description" className="min-h-[42px] resize-none text-sm" />
                            <Input value={row.status} onChange={e => updateRow(dayIndex, rowIndex, { status: e.target.value })} placeholder="Confirmed" />
                            <button onClick={() => updateDay(dayIndex, { rows: day.rows.filter((_, index) => index !== rowIndex) })} className="text-muted-foreground hover:text-destructive"><Trash2 className="h-4 w-4" /></button>
                          </div>
                        ))}
                      </div>
                      <Button type="button" size="sm" variant="outline" className="mt-3" onClick={() => updateDay(dayIndex, { rows: [...day.rows, { type: '', description: '', status: 'Confirmed' }] })}>Add row</Button>
                    </div>
                  ))}
                  <Button type="button" variant="outline" className="w-full border-dashed" onClick={() => updateVersion({ days: [...currentVersion.days, { title: 'New service day', rows: [{ type: '', description: '', status: 'Confirmed' }] }] })}>Add day</Button>
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            {editing._id && <Button variant="outline" className="gap-1.5" onClick={() => exportPdf(editing as ServiceConfirmation, activeVersion)}><FileText className="h-4 w-4" /> Export PDF</Button>}
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={save} disabled={!canSave} className="bg-foreground hover:bg-foreground/90">Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
