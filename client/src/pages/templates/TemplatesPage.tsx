import { useEffect, useState } from 'react'
import { getTemplates, createTemplate, updateTemplate, deleteTemplate, type Template } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Plus, Pencil, Trash2 } from 'lucide-react'

const BLOCK_COLORS: Record<string, string> = {
  cover: 'bg-[#f5edd6] text-[#b8963e] border-[#b8963e]/30',
  day: 'bg-blue-50 text-blue-700 border-blue-200',
  pricing: 'bg-green-50 text-green-700 border-green-200',
  freetext: 'bg-gray-50 text-gray-600 border-gray-200',
}

const empty = (): Partial<Template> => ({ name: '', blocks: [] })

export function TemplatesPage() {
  const [templates, setTemplates] = useState<Template[]>([])
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Partial<Template>>(empty())

  async function load() { setTemplates(await getTemplates()) }
  useEffect(() => { load() }, [])

  async function handleSave() {
    if (editing._id) await updateTemplate(editing._id, editing)
    else await createTemplate(editing)
    setOpen(false)
    load()
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this template?')) return
    await deleteTemplate(id)
    load()
  }

  function addBlock(type: Template['blocks'][0]['type']) {
    setEditing(v => ({
      ...v,
      blocks: [...(v.blocks ?? []), { type, content: '', order: (v.blocks ?? []).length }]
    }))
  }

  function updateBlock(i: number, content: string) {
    setEditing(v => ({
      ...v,
      blocks: (v.blocks ?? []).map((b, j) => j === i ? { ...b, content } : b)
    }))
  }

  function removeBlock(i: number) {
    setEditing(v => ({ ...v, blocks: (v.blocks ?? []).filter((_, j) => j !== i) }))
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-light tracking-tight">Templates</h1>
          <p className="text-sm text-muted-foreground mt-1">PDF offer templates with block layouts</p>
        </div>
        <Button onClick={() => { setEditing(empty()); setOpen(true) }} className="bg-foreground hover:bg-foreground/90">
          <Plus className="w-4 h-4 mr-2" /> New Template
        </Button>
      </div>

      <div className="rounded-lg border border-border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50 hover:bg-muted/50">
              <TableHead className="text-xs tracking-wide uppercase text-muted-foreground font-medium">Name</TableHead>
              <TableHead className="text-xs tracking-wide uppercase text-muted-foreground font-medium">Blocks</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {templates.map(t => (
              <TableRow key={t._id} className="hover:bg-[#faf7f0] transition-colors">
                <TableCell className="font-medium text-sm">{t.name}</TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    {t.blocks.map((b, i) => (
                      <Badge key={i} variant="outline" className={`text-xs ${BLOCK_COLORS[b.type] ?? ''}`}>
                        {b.type}
                      </Badge>
                    ))}
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1">
                    <Button size="icon" variant="ghost" className="h-8 w-8 text-muted-foreground hover:text-[#b8963e]"
                      onClick={() => { setEditing(t); setOpen(true) }}>
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button size="icon" variant="ghost" className="h-8 w-8 text-muted-foreground hover:text-destructive"
                      onClick={() => handleDelete(t._id)}>
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
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-auto">
          <DialogHeader>
            <DialogTitle className="font-light text-lg">{editing._id ? 'Edit Template' : 'New Template'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label className="text-xs uppercase tracking-wide text-muted-foreground">Template Name *</Label>
              <Input value={editing.name ?? ''} onChange={e => setEditing(v => ({ ...v, name: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label className="text-xs uppercase tracking-wide text-muted-foreground">Blocks</Label>
              {(editing.blocks ?? []).map((b, i) => (
                <div key={i} className="border border-border rounded-lg overflow-hidden">
                  <div className={`flex items-center justify-between px-4 py-2 border-b border-border ${BLOCK_COLORS[b.type] ?? 'bg-muted'}`}>
                    <Badge variant="outline" className={`text-xs ${BLOCK_COLORS[b.type] ?? ''}`}>{b.type}</Badge>
                    <button onClick={() => removeBlock(i)} className="text-muted-foreground hover:text-destructive">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <Textarea
                    className="border-0 rounded-none resize-none text-sm min-h-[80px] focus-visible:ring-0"
                    placeholder="Block content — use {{person.name}}, {{company.name}}, {{destination.name}} etc."
                    value={b.content}
                    onChange={e => updateBlock(i, e.target.value)}
                  />
                </div>
              ))}
              <div className="flex gap-2 flex-wrap pt-1">
                {(['cover', 'day', 'pricing', 'freetext'] as const).map(type => (
                  <Button
                    key={type}
                    size="sm"
                    variant="outline"
                    className={`text-xs h-7 ${BLOCK_COLORS[type] ?? ''}`}
                    onClick={() => addBlock(type)}
                  >
                    + {type}
                  </Button>
                ))}
              </div>
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
