import { useAsyncAction } from '@/lib/useAsyncAction'
import { useEffect, useState } from 'react'
import { getDestinations, type DayActivity, type Destination, type Offer } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import {
  DndContext, closestCenter, PointerSensor, useSensor, useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext, verticalListSortingStrategy, useSortable, arrayMove,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Check, GripVertical, MapPin, Plus, Ticket, Trash2 } from 'lucide-react'

type Day = { destinations: string[]; activities: DayActivity[]; notes: string }

interface Props {
  draft: Partial<Offer>
  onSave: (patch: Partial<Offer>) => Promise<Partial<Offer>>
  onNext: () => void
  onPrev: () => void
}

function idOf(value: Destination | string | undefined) {
  return typeof value === 'string' ? value : value?._id
}

function money(price: number, currency: string) {
  return `${currency || 'USD'} ${Number(price || 0).toLocaleString()}`
}

function DayCard({ day, index, destinations, onChange, onRemove }: {
  day: Day
  index: number
  destinations: Destination[]
  onChange: (d: Day) => void
  onRemove: () => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: `day-${index}` })
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  const selectedDestinations = destinations.filter(d => day.destinations.includes(d._id))

  function toggleDest(id: string) {
    const removing = day.destinations.includes(id)
    const dests = removing
      ? day.destinations.filter(x => x !== id)
      : [...day.destinations, id]
    const activities = removing
      ? day.activities.filter(activity => idOf(activity.destination) !== id)
      : day.activities
    onChange({ ...day, destinations: dests, activities })
  }

  function toggleActivity(destination: Destination, activityIndex: number, priceIndex: number) {
    const activity = destination.activities?.[activityIndex]
    const price = activity?.prices?.[priceIndex]
    if (!activity || !price) return

    const activityId = activity._id ?? `${destination._id}-${activityIndex}`
    const priceId = price._id ?? `${activityId}-${priceIndex}`
    const selected = day.activities.some(item =>
      idOf(item.destination) === destination._id &&
      item.activityId === activityId &&
      item.priceId === priceId
    )

    if (selected) {
      onChange({
        ...day,
        activities: day.activities.filter(item =>
          !(idOf(item.destination) === destination._id && item.activityId === activityId && item.priceId === priceId)
        ),
      })
      return
    }

    onChange({
      ...day,
      activities: [
        ...day.activities,
        {
          destination: destination._id,
          activityId,
          priceId,
          activityName: activity.name,
          optionLabel: price.label,
          description: activity.description,
          image: activity.image,
          imagePositionX: activity.imagePositionX,
          imagePositionY: activity.imagePositionY,
          price: Number(price.price || 0),
          currency: price.currency || 'USD',
          notes: price.notes,
        },
      ],
    })
  }

  return (
    <div ref={setNodeRef} style={style} className={cn(
      'border border-border rounded-xl bg-white overflow-hidden transition-shadow',
      isDragging && 'shadow-xl'
    )}>
      <div className="flex items-center gap-3 px-4 py-3 bg-muted/30 border-b border-border">
        <button
          {...attributes} {...listeners}
          className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground touch-none"
        >
          <GripVertical className="w-4 h-4" />
        </button>
        <span className="text-xs font-bold tracking-widest uppercase text-[#b8963e]">Day {index + 1}</span>
        <button onClick={onRemove} className="ml-auto text-muted-foreground hover:text-destructive transition-colors">
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
      <div className="p-4 space-y-5">
        <div>
          <Label className="text-xs font-semibold tracking-wide uppercase text-muted-foreground mb-2 block">
            Destinations
          </Label>
          <div className="flex flex-wrap gap-2">
            {destinations.map(d => (
              <button
                key={d._id}
                onClick={() => toggleDest(d._id)}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-medium transition-all',
                  day.destinations.includes(d._id)
                    ? 'bg-[#b8963e] text-white border-[#b8963e]'
                    : 'border-border text-muted-foreground hover:border-[#b8963e]/40 hover:text-foreground'
                )}
              >
                <MapPin className="w-3 h-3" />
                {d.name}
              </button>
            ))}
          </div>
        </div>

        {selectedDestinations.some(d => (d.activities?.length ?? 0) > 0) && (
          <div className="space-y-3">
            <Label className="text-xs font-semibold tracking-wide uppercase text-muted-foreground block">
              Activities and pricing
            </Label>
            {selectedDestinations.map(destination => (
              <div key={destination._id} className="space-y-2">
                {(destination.activities ?? []).length > 0 && (
                  <p className="text-xs font-medium text-foreground">{destination.name}</p>
                )}
                {(destination.activities ?? []).map((activity, activityIndex) => (
                  <div key={activity._id ?? activityIndex} className="rounded-lg border border-border p-3">
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-[#f5edd6] text-[#b8963e]">
                        <Ticket className="w-4 h-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-sm font-medium">{activity.name}</p>
                          {activity.duration && <span className="text-xs text-muted-foreground">{activity.duration}</span>}
                        </div>
                        {activity.description && (
                          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{activity.description}</p>
                        )}
                        <div className="mt-3 flex flex-wrap gap-2">
                          {(activity.prices ?? []).map((price, priceIndex) => {
                            const activityId = activity._id ?? `${destination._id}-${activityIndex}`
                            const priceId = price._id ?? `${activityId}-${priceIndex}`
                            const selected = day.activities.some(item =>
                              idOf(item.destination) === destination._id &&
                              item.activityId === activityId &&
                              item.priceId === priceId
                            )
                            return (
                              <button
                                key={price._id ?? priceIndex}
                                onClick={() => toggleActivity(destination, activityIndex, priceIndex)}
                                className={cn(
                                  'flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-all',
                                  selected
                                    ? 'border-[#b8963e] bg-[#b8963e] text-white'
                                    : 'border-border text-muted-foreground hover:border-[#b8963e]/50 hover:text-foreground'
                                )}
                              >
                                {selected && <Check className="w-3 h-3" />}
                                {price.label || 'Option'} / {money(price.price, price.currency)}
                              </button>
                            )
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}

        {day.activities.length > 0 && (
          <div className="rounded-lg bg-[#faf9f7] p-3">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[#b8963e]">Selected activities</p>
            <div className="space-y-1.5">
              {day.activities.map((activity, activityIndex) => (
                <div key={`${activity.activityId}-${activity.priceId}-${activityIndex}`} className="flex items-center gap-2 text-xs">
                  <span className="font-medium">{activity.activityName}</span>
                  <span className="text-muted-foreground">{activity.optionLabel}</span>
                  <span className="ml-auto text-muted-foreground">{money(activity.price, activity.currency)}</span>
                  <button
                    onClick={() => onChange({ ...day, activities: day.activities.filter((_, i) => i !== activityIndex) })}
                    className="text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        <div>
          <Label className="text-xs font-semibold tracking-wide uppercase text-muted-foreground mb-2 block">
            Notes
          </Label>
          <Textarea
            placeholder="Day notes, timing, meal plans, special requests..."
            value={day.notes}
            onChange={e => onChange({ ...day, notes: e.target.value })}
            className="resize-none min-h-[80px] text-sm"
          />
        </div>
      </div>
    </div>
  )
}

function draftDays(days: Offer['days'] | undefined): Day[] {
  return (days ?? []).map(d => ({
    destinations: (d.destinations as (Destination | string)[]).map(x =>
      typeof x === 'string' ? x : x._id
    ),
    activities: (d.activities ?? []).map(activity => ({
      ...activity,
      destination: idOf(activity.destination),
    })),
    notes: d.notes,
  }))
}

export function StepItinerary({ draft, onSave, onNext, onPrev }: Props) {
  const { run, busy, error } = useAsyncAction()

  const [destinations, setDestinations] = useState<Destination[]>([])
  const [days, setDays] = useState<Day[]>(draftDays(draft.days))

  const sensors = useSensors(useSensor(PointerSensor))

  useEffect(() => { void run(async () => { setDestinations(await getDestinations()) }) }, [])

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const from = days.findIndex((_, i) => `day-${i}` === active.id)
    const to = days.findIndex((_, i) => `day-${i}` === over.id)
    if (from >= 0 && to >= 0) setDays(arrayMove(days, from, to))
  }

  async function handleNext() {
    await onSave({ days: days as any })
    onNext()
  }

  return (
    <fieldset disabled={busy} aria-busy={busy} className="max-w-3xl space-y-6">
      {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
      {busy && <p role="status">Saving…</p>}
      <div>
        <h2 className="text-xl font-light tracking-tight mb-1">Itinerary</h2>
        <p className="text-sm text-muted-foreground">Build the journey, then select activity price options for each day.</p>
      </div>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext
          items={days.map((_, i) => `day-${i}`)}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-3">
            {days.map((day, i) => (
              <DayCard
                key={`day-${i}`}
                day={day}
                index={i}
                destinations={destinations}
                onChange={updated => setDays(days.map((d, j) => j === i ? updated : d))}
                onRemove={() => setDays(days.filter((_, j) => j !== i))}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      <Button
        variant="outline"
        className="w-full border-dashed border-[#b8963e]/40 text-[#b8963e] hover:bg-[#f5edd6] hover:border-[#b8963e] gap-2"
        onClick={() => setDays([...days, { destinations: [], activities: [], notes: '' }])}
      >
        <Plus className="w-4 h-4" /> Add Day
      </Button>

      <div className="flex justify-between pt-4 border-t border-border">
        <Button variant="outline" onClick={onPrev}>Back</Button>
        <Button onClick={() => void run(handleNext)} className="bg-foreground hover:bg-foreground/90">
          Continue to Options
        </Button>
      </div>
    </fieldset>
  )
}
