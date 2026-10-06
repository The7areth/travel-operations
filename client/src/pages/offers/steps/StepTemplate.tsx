import { useAsyncAction } from '@/lib/useAsyncAction'
import { useEffect, useState } from 'react'
import { getTemplates, type Template, type Offer } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { LayoutTemplate, FileDown, CheckCircle2 } from 'lucide-react'

interface Props {
  draft: Partial<Offer>
  offerId?: string
  onSave: (patch: Partial<Offer>) => Promise<Partial<Offer>>
  onPrev: () => void
  onDone: () => void
}

export function StepTemplate({ draft, offerId, onSave, onPrev, onDone }: Props) {
  const { run, busy, error } = useAsyncAction()

  const [templates, setTemplates] = useState<Template[]>([])
  const [selected, setSelected] = useState<string | undefined>(
    typeof draft.template === 'object' ? (draft.template as Template)?._id : (draft.template as unknown as string)
  )
  const [generating, setGenerating] = useState(false)
  const [generated, setGenerated] = useState(false)

  useEffect(() => { void run(async () => { setTemplates(await getTemplates()) }) }, [])

  async function handleExit() {
    if (selected) await onSave({ template: selected as any })
    onDone()
  }

  async function handleGenerate() {
    if (!offerId || !selected) return
    setGenerated(false)
    setGenerating(true)
    try {
      await onSave({ template: selected as any })
      const res = await fetch(`/api/pdf/${offerId}`)
      if (!res.ok) { const body = await res.json().catch(() => null); throw new Error(body?.error || 'PDF generation failed. Please retry.') }
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `offer-${offerId}.pdf`
      a.click()
      URL.revokeObjectURL(url)
      setGenerated(true)
    } finally {
      setGenerating(false)
    }
  }

  return (
    <fieldset disabled={busy} aria-busy={busy} className="max-w-2xl space-y-6">
      {error && <p role="alert" className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      {busy && <p role="status" className="text-sm text-muted-foreground">Saving…</p>}
      <div>
        <h2 className="text-xl font-light tracking-tight mb-1">Template & Generate</h2>
        <p className="text-sm text-muted-foreground">Choose a template, then generate the PDF offer.</p>
      </div>

      <div className="space-y-2">
        {templates.map(t => (
          <button
            key={t._id}
            onClick={() => setSelected(t._id)}
            className={cn(
              'w-full flex items-center gap-4 px-5 py-4 rounded-xl border text-left transition-all',
              selected === t._id
                ? 'border-[#b8963e] bg-[#f5edd6]'
                : 'border-border hover:border-[#b8963e]/40 hover:bg-muted/40'
            )}
          >
            <div className={cn(
              'w-10 h-10 rounded-lg flex items-center justify-center shrink-0',
              selected === t._id ? 'bg-[#b8963e] text-white' : 'bg-muted text-muted-foreground'
            )}>
              <LayoutTemplate className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <div className="text-sm font-medium">{t.name}</div>
              <div className="text-xs text-muted-foreground mt-0.5">{t.blocks.length} blocks</div>
            </div>
            {selected === t._id && <span className="text-[#b8963e] text-xs font-medium">✓ selected</span>}
          </button>
        ))}
      </div>

      {generated && (
        <div className="flex items-center gap-3 px-5 py-4 rounded-xl bg-green-50 border border-green-200 text-green-700">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <div>
            <p className="text-sm font-medium">PDF downloaded successfully</p>
            <p className="text-xs opacity-80">The offer has been saved and the PDF has been sent to your downloads.</p>
          </div>
        </div>
      )}

      <div className="flex justify-between items-center pt-4 border-t border-border">
        <Button variant="outline" onClick={onPrev}>← Back</Button>
        <div className="flex gap-3">
          <Button
            disabled={!selected || generating || !offerId}
            onClick={() => void run(handleGenerate)}
            variant="outline"
            className="gap-2 border-[#b8963e] text-[#b8963e] hover:bg-[#f5edd6]"
          >
            <FileDown className="w-4 h-4" />
            {generating ? 'Generating…' : 'Generate PDF'}
          </Button>
          <Button onClick={() => void run(handleExit)} className="bg-foreground hover:bg-foreground/90">
            {generated ? 'Done ✓' : 'Save & Exit'}
          </Button>
        </div>
      </div>
    </fieldset>
  )
}
