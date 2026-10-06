import { useEffect, useState } from 'react'
import {
  getDestinations,
  createDestination,
  updateDestination,
  deleteDestination,
  resolveImageUrl,
  type ActivityPrice,
  type Destination,
  type DestinationActivity,
} from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { DynamicProperties } from '@/components/DynamicProperties'
import { AlertCircle, Image, Loader2, Plus, Trash2, Pencil } from 'lucide-react'

const empty = (): Partial<Destination> => ({
  name: '',
  country: '',
  description: '',
  coverImage: '',
  imagePositionX: 50,
  imagePositionY: 50,
  activities: [],
  properties: {},
})
const emptyActivity = (): DestinationActivity => ({
  name: '',
  description: '',
  duration: '',
  image: '',
  imagePositionX: 50,
  imagePositionY: 50,
  prices: [{ label: 'Standard', price: 0, currency: 'USD', notes: '' }],
})
const emptyPrice = (): ActivityPrice => ({ label: '', price: 0, currency: 'USD', notes: '' })

function ImageField({
  value,
  positionX = 50,
  positionY = 50,
  onChange,
  onPositionChange,
}: {
  value?: string
  positionX?: number
  positionY?: number
  onChange: (value: string) => void
  onPositionChange: (patch: { imagePositionX?: number; imagePositionY?: number }) => void
}) {
  const [input, setInput] = useState(value ?? '')
  const [error, setError] = useState('')
  const [resolving, setResolving] = useState(false)

  useEffect(() => { setInput(value ?? '') }, [value])

  async function useUrl() {
    const raw = input.trim()
    if (!raw) {
      onChange('')
      setError('')
      return
    }
    setResolving(true)
    setError('')
    try {
      const resolved = await resolveImageUrl(raw)
      setInput(resolved.url)
      onChange(resolved.url)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not resolve image URL')
    } finally {
      setResolving(false)
    }
  }

  function useFile(file?: File) {
    if (!file) return
    if (file.size > 8 * 1024 * 1024) {
      setError('Please use an image under 8 MB.')
      return
    }
    const reader = new FileReader()
    reader.onload = () => {
      const dataUrl = String(reader.result ?? '')
      setInput(dataUrl)
      onChange(dataUrl)
      setError('')
    }
    reader.readAsDataURL(file)
  }

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <Input
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="Paste an image URL or Unsplash photo page"
        />
        <Button type="button" variant="outline" onClick={useUrl} disabled={resolving} className="shrink-0 gap-1.5">
          {resolving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Image className="w-4 h-4" />}
          Use
        </Button>
      </div>
      <Input type="file" accept="image/*" onChange={e => useFile(e.target.files?.[0])} />
      {error && (
        <p className="flex items-center gap-1.5 text-xs text-destructive">
          <AlertCircle className="w-3.5 h-3.5" /> {error}
        </p>
      )}
      {value && (
        <div className="space-y-2">
          <img
            src={value}
            style={{ objectPosition: `${positionX}% ${positionY}%` }}
            className="w-full h-36 object-cover rounded-lg border border-border"
            alt="Destination cover preview"
          />
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Move left / right</span>
                <span>{positionX}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={positionX}
                onChange={e => onPositionChange({ imagePositionX: Number(e.target.value) })}
                className="w-full accent-[#b8963e]"
              />
            </div>
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Move up / down</span>
                <span>{positionY}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={positionY}
                onChange={e => onPositionChange({ imagePositionY: Number(e.target.value) })}
                className="w-full accent-[#b8963e]"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function ActivityPricingEditor({
  value,
  onChange,
}: {
  value: DestinationActivity[]
  onChange: (value: DestinationActivity[]) => void
}) {
  function updateActivity(index: number, patch: Partial<DestinationActivity>) {
    onChange(value.map((activity, i) => i === index ? { ...activity, ...patch } : activity))
  }

  function updatePrice(activityIndex: number, priceIndex: number, patch: Partial<ActivityPrice>) {
    onChange(value.map((activity, i) => {
      if (i !== activityIndex) return activity
      return {
        ...activity,
        prices: (activity.prices ?? []).map((price, j) => j === priceIndex ? { ...price, ...patch } : price),
      }
    }))
  }

  function addPrice(activityIndex: number) {
    onChange(value.map((activity, i) => (
      i === activityIndex
        ? { ...activity, prices: [...(activity.prices ?? []), emptyPrice()] }
        : activity
    )))
  }

  return (
    <div className="space-y-3">
      {value.map((activity, activityIndex) => (
        <div key={activityIndex} className="rounded-lg border border-border bg-white">
          <div className="flex items-center justify-between border-b border-border px-4 py-2">
            <span className="text-xs font-bold uppercase tracking-widest text-[#b8963e]">Activity {activityIndex + 1}</span>
            <button
              type="button"
              onClick={() => onChange(value.filter((_, i) => i !== activityIndex))}
              className="text-muted-foreground hover:text-destructive"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
          <div className="space-y-4 p-4">
            <div className="grid gap-3 sm:grid-cols-[1fr_140px]">
              <div className="space-y-1.5">
                <Label className="text-xs uppercase tracking-wide text-muted-foreground">Activity name *</Label>
                <Input
                  value={activity.name}
                  onChange={e => updateActivity(activityIndex, { name: e.target.value })}
                  placeholder="Old Town visit"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs uppercase tracking-wide text-muted-foreground">Duration</Label>
                <Input
                  value={activity.duration ?? ''}
                  onChange={e => updateActivity(activityIndex, { duration: e.target.value })}
                  placeholder="2 hours"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs uppercase tracking-wide text-muted-foreground">Description</Label>
              <Textarea
                value={activity.description ?? ''}
                onChange={e => updateActivity(activityIndex, { description: e.target.value })}
                placeholder="Short details for the proposal"
                className="min-h-[72px] resize-none text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs uppercase tracking-wide text-muted-foreground">Activity Photo</Label>
              <ImageField
                value={activity.image ?? ''}
                positionX={activity.imagePositionX ?? 50}
                positionY={activity.imagePositionY ?? 50}
                onChange={image => updateActivity(activityIndex, { image })}
                onPositionChange={patch => updateActivity(activityIndex, patch)}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs uppercase tracking-wide text-muted-foreground">Pricing options</Label>
              {(activity.prices ?? []).map((price, priceIndex) => (
                <div key={priceIndex} className="grid gap-2 rounded-md bg-muted/40 p-2 sm:grid-cols-[1fr_110px_90px_28px]">
                  <Input
                    value={price.label}
                    onChange={e => updatePrice(activityIndex, priceIndex, { label: e.target.value })}
                    placeholder="Private tour"
                    className="text-sm"
                  />
                  <Input
                    type="number"
                    value={price.price || ''}
                    onChange={e => updatePrice(activityIndex, priceIndex, { price: Number(e.target.value) })}
                    placeholder="0"
                    className="text-sm"
                  />
                  <Input
                    value={price.currency || 'USD'}
                    onChange={e => updatePrice(activityIndex, priceIndex, { currency: e.target.value.toUpperCase() })}
                    placeholder="USD"
                    className="text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => updateActivity(activityIndex, {
                      prices: (activity.prices ?? []).filter((_, i) => i !== priceIndex),
                    })}
                    className="flex h-9 items-center justify-center text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
              <Button type="button" variant="outline" size="sm" onClick={() => addPrice(activityIndex)} className="gap-1.5">
                <Plus className="w-3.5 h-3.5" /> Add price
              </Button>
            </div>
          </div>
        </div>
      ))}
      <Button
        type="button"
        variant="outline"
        className="w-full border-dashed border-[#b8963e]/40 text-[#b8963e] hover:bg-[#f5edd6]"
        onClick={() => onChange([...value, emptyActivity()])}
      >
        <Plus className="w-4 h-4 mr-2" /> Add Activity
      </Button>
    </div>
  )
}

function cleanDestination(destination: Partial<Destination>) {
  return {
    ...destination,
    name: destination.name?.trim(),
    country: destination.country?.trim(),
    description: destination.description?.trim(),
    coverImage: destination.coverImage?.trim(),
    imagePositionX: Number(destination.imagePositionX ?? 50),
    imagePositionY: Number(destination.imagePositionY ?? 50),
    activities: (destination.activities ?? [])
      .filter(activity => activity.name.trim())
      .map(activity => ({
        ...activity,
        name: activity.name.trim(),
        description: activity.description?.trim(),
        duration: activity.duration?.trim(),
        image: activity.image?.trim(),
        imagePositionX: Number(activity.imagePositionX ?? 50),
        imagePositionY: Number(activity.imagePositionY ?? 50),
        prices: (activity.prices ?? [])
          .filter(price => price.label.trim())
          .map(price => ({
            ...price,
            label: price.label.trim(),
            currency: (price.currency || 'USD').trim().toUpperCase(),
            price: Number(price.price || 0),
            notes: price.notes?.trim(),
          })),
      })),
  }
}

export function DestinationsPage() {
  const [destinations, setDestinations] = useState<Destination[]>([])
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Partial<Destination>>(empty())

  async function load() { setDestinations(await getDestinations()) }
  useEffect(() => { load() }, [])

  async function handleSave() {
    const payload = cleanDestination(editing)
    if (editing._id) await updateDestination(editing._id, payload)
    else await createDestination(payload)
    setOpen(false)
    load()
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this destination?')) return
    await deleteDestination(id)
    load()
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-light tracking-tight">Destinations</h1>
          <p className="text-sm text-muted-foreground mt-1">Travel destinations, cover photos, and bookable activities</p>
        </div>
        <Button onClick={() => { setEditing(empty()); setOpen(true) }} className="bg-foreground hover:bg-foreground/90">
          <Plus className="w-4 h-4 mr-2" /> Add Destination
        </Button>
      </div>

      <div className="rounded-lg border border-border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50 hover:bg-muted/50">
              <TableHead className="text-xs tracking-wide uppercase text-muted-foreground font-medium">Destination</TableHead>
              <TableHead className="text-xs tracking-wide uppercase text-muted-foreground font-medium">Country</TableHead>
              <TableHead className="text-xs tracking-wide uppercase text-muted-foreground font-medium">Cover</TableHead>
              <TableHead className="text-xs tracking-wide uppercase text-muted-foreground font-medium">Activities</TableHead>
              <TableHead className="text-xs tracking-wide uppercase text-muted-foreground font-medium">Properties</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {destinations.map(d => (
              <TableRow key={d._id} className="hover:bg-[#faf7f0] transition-colors">
                <TableCell className="font-medium text-sm">{d.name}</TableCell>
                <TableCell className="text-sm text-muted-foreground">{d.country || '-'}</TableCell>
                <TableCell>
                  {d.coverImage
                    ? <img src={d.coverImage} style={{ objectPosition: `${d.imagePositionX ?? 50}% ${d.imagePositionY ?? 50}%` }} className="w-16 h-10 object-cover rounded" alt={d.name} />
                    : <span className="text-xs text-muted-foreground">-</span>}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">{d.activities?.length ?? 0}</TableCell>
                <TableCell className="text-xs text-muted-foreground">
                  {Object.entries(d.properties ?? {}).slice(0, 2).map(([k, v]) => `${k}: ${v}`).join(' / ') || '-'}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1">
                    <Button size="icon" variant="ghost" className="h-8 w-8 text-muted-foreground hover:text-[#b8963e]"
                      onClick={() => { setEditing({ imagePositionX: 50, imagePositionY: 50, ...d, activities: d.activities ?? [] }); setOpen(true) }}>
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button size="icon" variant="ghost" className="h-8 w-8 text-muted-foreground hover:text-destructive"
                      onClick={() => handleDelete(d._id)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="w-[calc(100vw-2rem)] sm:max-w-[calc(100vw-2rem)] lg:max-w-5xl max-h-[86vh] overflow-auto">
          <DialogHeader>
            <DialogTitle className="font-light text-lg">{editing._id ? 'Edit Destination' : 'New Destination'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-5 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs uppercase tracking-wide text-muted-foreground">Name *</Label>
                <Input value={editing.name ?? ''} onChange={e => setEditing(v => ({ ...v, name: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs uppercase tracking-wide text-muted-foreground">Country</Label>
                <Input value={editing.country ?? ''} onChange={e => setEditing(v => ({ ...v, country: e.target.value }))} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs uppercase tracking-wide text-muted-foreground">Destination Description</Label>
              <Textarea
                value={editing.description ?? ''}
                onChange={e => setEditing(v => ({ ...v, description: e.target.value }))}
                placeholder="Short destination overview for the exported proposal"
                className="min-h-[80px] resize-none text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs uppercase tracking-wide text-muted-foreground">Cover Photo</Label>
              <ImageField
                value={editing.coverImage}
                onChange={coverImage => setEditing(v => ({ ...v, coverImage }))}
                positionX={editing.imagePositionX ?? 50}
                positionY={editing.imagePositionY ?? 50}
                onPositionChange={patch => setEditing(v => ({ ...v, ...patch }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs uppercase tracking-wide text-muted-foreground">Activities and Pricing</Label>
              <ActivityPricingEditor
                value={editing.activities ?? []}
                onChange={activities => setEditing(v => ({ ...v, activities }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs uppercase tracking-wide text-muted-foreground">Properties</Label>
              <DynamicProperties
                value={(editing.properties as Record<string, string>) ?? {}}
                onChange={p => setEditing(v => ({ ...v, properties: p }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={!editing.name} className="bg-foreground hover:bg-foreground/90">Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
