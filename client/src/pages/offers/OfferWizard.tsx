import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { createOffer, updateOffer, getOffer, type Offer } from '@/lib/api'
import { cn } from '@/lib/utils'
import { StepCompany } from './steps/StepCompany'
import { StepItinerary } from './steps/StepItinerary'
import { StepOptions } from './steps/StepOptions'
import { StepTemplate } from './steps/StepTemplate'
import { Building2, MapPin, Tag, LayoutTemplate, ChevronLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'

const STEPS = [
  { id: 1, label: 'Company', sub: '& People', icon: Building2 },
  { id: 2, label: 'Itinerary', sub: 'Days & Destinations', icon: MapPin },
  { id: 3, label: 'Options', sub: 'Pricing', icon: Tag },
  { id: 4, label: 'Template', sub: 'Generate PDF', icon: LayoutTemplate },
]

export function OfferWizard() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [step, setStep] = useState(1)
  const [draft, setDraft] = useState<Partial<Offer>>({ days: [], options: [], people: [] })
  const [offerId, setOfferId] = useState<string | undefined>(id)

  const [loadedId, setLoadedId] = useState<string>()
  const [loadError, setLoadError] = useState('')

  useEffect(() => {
    let active = true
    setLoadError('')
    if (id) {
      getOffer(id).then(offer => {
        if (!active) return
        if (!offer) throw new Error('Offer not found')
        setDraft(offer)
        setOfferId(id)
        setLoadedId(id)
      }).catch(() => { if (active) setLoadError('Could not load this offer. Return to Offers and try again.') })
    } else {
      setDraft({ days: [], options: [], people: [] })
      setOfferId(undefined)
      setLoadedId(undefined)
    }
    return () => { active = false }
  }, [id])

  async function saveDraft(patch: Partial<Offer>): Promise<Partial<Offer>> {
    const merged = { ...draft, ...patch }
    setDraft(merged)
    if (offerId) {
      await updateOffer(offerId, merged)
    } else {
      const created = await createOffer(merged)
      setOfferId(created._id)
      return { ...merged, _id: created._id } as Partial<Offer>
    }
    return merged
  }

  function next() { setStep(s => Math.min(s + 1, 4)) }
  function prev() { setStep(s => Math.max(s - 1, 1)) }

  if (loadError) return <div role="alert" className="p-8"><p>{loadError}</p><Button onClick={() => navigate('/offers')}>Back to Offers</Button></div>
  // Mount step-local form state only after the existing offer has arrived.
  if (id && loadedId !== id) return <p role="status" className="p-8">Loading offer…</p>

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <div className="border-b border-border px-6 py-3.5 flex items-center gap-3 bg-white">
        <Button
          variant="ghost" size="sm"
          className="text-muted-foreground gap-1.5 h-8 px-2"
          onClick={() => navigate('/offers')}
        >
          <ChevronLeft className="w-4 h-4" /> Offers
        </Button>
        <span className="text-muted-foreground text-sm">/</span>
        <span className="text-sm font-medium">{offerId ? 'Edit Offer' : 'New Offer'}</span>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Step sidebar */}
        <div className="w-56 border-r border-border bg-[#faf9f7] p-4 flex flex-col gap-1 shrink-0">
          <p className="text-xs font-bold tracking-[0.15em] text-[#b8963e] uppercase mb-3 px-2">Steps</p>
          {STEPS.map(s => {
            const Icon = s.icon
            const active = step === s.id
            const done = step > s.id
            return (
              <button
                key={s.id}
                onClick={() => (done || active) ? setStep(s.id) : undefined}
                className={cn(
                  'flex items-start gap-3 px-3 py-3 rounded-md text-left transition-colors w-full',
                  active && 'bg-[#f5edd6] border-l-2 border-[#b8963e] rounded-l-none pl-[10px]',
                  !active && done && 'text-muted-foreground hover:bg-muted cursor-pointer',
                  !active && !done && 'text-muted-foreground/50 cursor-default'
                )}
              >
                <div className={cn(
                  'w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5',
                  active && 'bg-[#b8963e] text-white',
                  done && 'bg-foreground text-white',
                  !active && !done && 'bg-muted text-muted-foreground/50'
                )}>
                  {done ? '✓' : s.id}
                </div>
                <div>
                  <div className={cn(
                    'text-sm font-medium',
                    active && 'text-[#b8963e]',
                    done && 'text-foreground'
                  )}>
                    {s.label}
                  </div>
                  <div className="text-xs text-muted-foreground/70">{s.sub}</div>
                </div>
              </button>
            )
          })}
        </div>

        {/* Step content */}
        <div className="flex-1 overflow-auto p-8">
          {step === 1 && (
            <StepCompany draft={draft} onSave={saveDraft} onNext={next} />
          )}
          {step === 2 && (
            <StepItinerary draft={draft} onSave={saveDraft} onNext={next} onPrev={prev} />
          )}
          {step === 3 && (
            <StepOptions draft={draft} onSave={saveDraft} onNext={next} onPrev={prev} />
          )}
          {step === 4 && (
            <StepTemplate
              draft={draft}
              offerId={offerId}
              onSave={saveDraft}
              onPrev={prev}
              onDone={() => navigate('/offers')}
            />
          )}
        </div>
      </div>
    </div>
  )
}
