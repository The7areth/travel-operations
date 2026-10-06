import { useState } from 'react'
import { type Offer } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Plus, Trash2 } from 'lucide-react'

type OfferOption = { label: string; description: string; price: number }

interface Props {
  draft: Partial<Offer>
  onSave: (patch: Partial<Offer>) => Promise<Partial<Offer>>
  onNext: () => void
  onPrev: () => void
}

export function StepOptions({ draft, onSave, onNext, onPrev }: Props) {
  const [options, setOptions] = useState<OfferOption[]>(draft.options ?? [])

  function update(i: number, patch: Partial<OfferOption>) {
    setOptions(options.map((o, j) => j === i ? { ...o, ...patch } : o))
  }

  async function handleNext() {
    await onSave({ options })
    onNext()
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h2 className="text-xl font-light tracking-tight mb-1">Pricing Options</h2>
        <p className="text-sm text-muted-foreground">
          Define the offer tiers the client can choose from (e.g. Standard / Luxury).
        </p>
      </div>

      <div className="space-y-4">
        {options.map((opt, i) => (
          <div key={i} className="border border-border rounded-xl p-5 space-y-4 bg-white">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold tracking-widest uppercase text-[#b8963e]">
                Option {i + 1}
              </span>
              <button
                onClick={() => setOptions(options.filter((_, j) => j !== i))}
                className="text-muted-foreground hover:text-destructive transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold tracking-wide uppercase text-muted-foreground">Label</Label>
                <Input
                  placeholder="e.g. Standard"
                  value={opt.label}
                  onChange={e => update(i, { label: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold tracking-wide uppercase text-muted-foreground">Price (USD)</Label>
                <Input
                  type="number"
                  placeholder="0"
                  value={opt.price || ''}
                  onChange={e => update(i, { price: Number(e.target.value) })}
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold tracking-wide uppercase text-muted-foreground">Description</Label>
              <Textarea
                placeholder="What's included in this option…"
                value={opt.description}
                onChange={e => update(i, { description: e.target.value })}
                className="resize-none min-h-[80px] text-sm"
              />
            </div>
          </div>
        ))}
      </div>

      <Button
        variant="outline"
        className="w-full border-dashed border-[#b8963e]/40 text-[#b8963e] hover:bg-[#f5edd6] hover:border-[#b8963e] gap-2"
        onClick={() => setOptions([...options, { label: '', description: '', price: 0 }])}
      >
        <Plus className="w-4 h-4" /> Add Option
      </Button>

      <div className="flex justify-between pt-4 border-t border-border">
        <Button variant="outline" onClick={onPrev}>← Back</Button>
        <Button
          onClick={handleNext}
          disabled={options.length === 0}
          className="bg-foreground hover:bg-foreground/90"
        >
          Continue to Template →
        </Button>
      </div>
    </div>
  )
}
