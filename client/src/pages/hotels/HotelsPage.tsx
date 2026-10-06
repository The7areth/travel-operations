import { useEffect, useState } from 'react'
import { createHotel, deleteHotel, getHotels, updateHotel, type Hotel } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Building2, Pencil, Plus, Trash2 } from 'lucide-react'

const emptyHotel = (): Partial<Hotel> => ({
  name: '',
  city: '',
  country: 'Saudi Arabia',
  emails: [''],
  phone: '',
  mealBasis: 'B&B',
  contractNotes: '',
  roomTypes: [{ name: 'Standard Room', notes: '' }],
})

function cleanHotel(hotel: Partial<Hotel>) {
  return {
    ...hotel,
    name: hotel.name?.trim(),
    city: hotel.city?.trim(),
    country: hotel.country?.trim(),
    emails: (hotel.emails ?? []).map(email => email.trim()).filter(Boolean),
    phone: hotel.phone?.trim(),
    contractNotes: hotel.contractNotes?.trim(),
    roomTypes: (hotel.roomTypes ?? []).filter(room => room.name.trim()).map(room => ({
      ...room,
      name: room.name.trim(),
      notes: room.notes?.trim(),
    })),
  }
}

export function HotelsPage() {
  const [hotels, setHotels] = useState<Hotel[]>([])
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Partial<Hotel>>(emptyHotel())

  async function load() { setHotels(await getHotels()) }
  useEffect(() => { load() }, [])

  async function save() {
    const payload = cleanHotel(editing)
    if (editing._id) await updateHotel(editing._id, payload)
    else await createHotel(payload)
    setOpen(false)
    load()
  }

  async function remove(id: string) {
    if (!confirm('Delete this hotel?')) return
    await deleteHotel(id)
    load()
  }

  return (
    <div className="p-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-light tracking-tight">Hotels</h1>
          <p className="mt-1 text-sm text-muted-foreground">Hotel contacts, emails, meal contracts, and room types for rooming lists</p>
        </div>
        <Button onClick={() => { setEditing(emptyHotel()); setOpen(true) }} className="bg-foreground hover:bg-foreground/90">
          <Plus className="mr-2 h-4 w-4" /> Add Hotel
        </Button>
      </div>

      <div className="overflow-hidden rounded-lg border border-border">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50 hover:bg-muted/50">
              <TableHead className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Hotel</TableHead>
              <TableHead className="text-xs font-medium uppercase tracking-wide text-muted-foreground">City</TableHead>
              <TableHead className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Emails</TableHead>
              <TableHead className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Meals</TableHead>
              <TableHead className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Room Types</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {hotels.map(hotel => (
              <TableRow key={hotel._id} className="hover:bg-[#faf7f0]">
                <TableCell className="font-medium">{hotel.name}</TableCell>
                <TableCell className="text-sm text-muted-foreground">{[hotel.city, hotel.country].filter(Boolean).join(', ') || '-'}</TableCell>
                <TableCell className="text-sm text-muted-foreground">{hotel.emails?.join(', ') || '-'}</TableCell>
                <TableCell className="text-sm text-muted-foreground">{hotel.mealBasis || 'B&B'}</TableCell>
                <TableCell className="text-sm text-muted-foreground">{hotel.roomTypes?.map(room => room.name).join(', ') || '-'}</TableCell>
                <TableCell>
                  <div className="flex justify-end gap-1">
                    <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => { setEditing({ ...hotel }); setOpen(true) }}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button size="icon" variant="ghost" className="h-8 w-8 hover:text-destructive" onClick={() => remove(hotel._id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="w-[calc(100vw-2rem)] sm:max-w-[calc(100vw-2rem)] lg:max-w-4xl max-h-[88vh] overflow-auto">
          <DialogHeader>
            <DialogTitle className="font-light">{editing._id ? 'Edit Hotel' : 'New Hotel'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-5 py-2">
            <div className="grid gap-3 md:grid-cols-3">
              <div className="space-y-1.5 md:col-span-1">
                <Label className="text-xs uppercase tracking-wide text-muted-foreground">Hotel name *</Label>
                <Input value={editing.name ?? ''} onChange={e => setEditing(v => ({ ...v, name: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs uppercase tracking-wide text-muted-foreground">City</Label>
                <Input value={editing.city ?? ''} onChange={e => setEditing(v => ({ ...v, city: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs uppercase tracking-wide text-muted-foreground">Country</Label>
                <Input value={editing.country ?? ''} onChange={e => setEditing(v => ({ ...v, country: e.target.value }))} />
              </div>
            </div>
            <div className="grid gap-3 md:grid-cols-[1fr_160px]">
              <div className="space-y-1.5">
                <Label className="text-xs uppercase tracking-wide text-muted-foreground">Emails</Label>
                <Input
                  value={(editing.emails ?? []).join(', ')}
                  onChange={e => setEditing(v => ({ ...v, emails: e.target.value.split(',') }))}
                  placeholder="reservations@hotel.com, sales@hotel.com"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs uppercase tracking-wide text-muted-foreground">Meal contract</Label>
                <select
                  value={editing.mealBasis ?? 'B&B'}
                  onChange={e => setEditing(v => ({ ...v, mealBasis: e.target.value as Hotel['mealBasis'] }))}
                  className="h-9 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
                >
                  <option value="B&B">B&B</option>
                  <option value="Half Board">Half Board</option>
                  <option value="Full Board">Full Board</option>
                  <option value="Custom">Custom</option>
                </select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs uppercase tracking-wide text-muted-foreground">Room types</Label>
              <Textarea
                value={(editing.roomTypes ?? []).map(room => room.name).join('\n')}
                onChange={e => setEditing(v => ({ ...v, roomTypes: e.target.value.split('\n').map(name => ({ name, notes: '' })) }))}
                className="min-h-[90px] resize-none text-sm"
                placeholder="Standard Room&#10;Deluxe Room&#10;Superior Room"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs uppercase tracking-wide text-muted-foreground">Contract notes</Label>
              <Textarea value={editing.contractNotes ?? ''} onChange={e => setEditing(v => ({ ...v, contractNotes: e.target.value }))} className="min-h-[90px] resize-none text-sm" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={save} disabled={!editing.name?.trim()} className="bg-foreground hover:bg-foreground/90">
              <Building2 className="mr-2 h-4 w-4" /> Save Hotel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
