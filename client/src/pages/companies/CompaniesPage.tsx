import { useEffect, useState } from 'react'
import { getCompanies, createCompany, updateCompany, deleteCompany, type Company } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { DynamicProperties } from '@/components/DynamicProperties'
import { initials } from '@/lib/utils'
import { Plus, Pencil, Trash2 } from 'lucide-react'

const empty = (): Partial<Company> => ({ name: '', logo: '', properties: {} })

export function CompaniesPage() {
  const [companies, setCompanies] = useState<Company[]>([])
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Partial<Company>>(empty())

  async function load() { setCompanies(await getCompanies()) }
  useEffect(() => { load() }, [])

  async function handleSave() {
    if (editing._id) await updateCompany(editing._id, editing)
    else await createCompany(editing)
    setOpen(false)
    load()
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this company?')) return
    await deleteCompany(id)
    load()
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-light tracking-tight">Companies</h1>
          <p className="text-sm text-muted-foreground mt-1">Client companies and accounts</p>
        </div>
        <Button onClick={() => { setEditing(empty()); setOpen(true) }} className="bg-foreground hover:bg-foreground/90">
          <Plus className="w-4 h-4 mr-2" /> Add Company
        </Button>
      </div>

      <div className="rounded-lg border border-border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50 hover:bg-muted/50">
              <TableHead className="text-xs tracking-wide uppercase text-muted-foreground font-medium">Company</TableHead>
              <TableHead className="text-xs tracking-wide uppercase text-muted-foreground font-medium">Properties</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {companies.map(c => (
              <TableRow key={c._id} className="hover:bg-[#faf7f0] transition-colors">
                <TableCell>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-[#f5edd6] flex items-center justify-center text-xs font-bold text-[#b8963e]">
                      {initials(c.name)}
                    </div>
                    <span className="font-medium text-sm">{c.name}</span>
                  </div>
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">
                  {Object.entries(c.properties ?? {}).slice(0, 3).map(([k, v]) => `${k}: ${v}`).join(' · ') || '—'}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1">
                    <Button size="icon" variant="ghost" className="h-8 w-8 text-muted-foreground hover:text-[#b8963e]"
                      onClick={() => { setEditing(c); setOpen(true) }}>
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button size="icon" variant="ghost" className="h-8 w-8 text-muted-foreground hover:text-destructive"
                      onClick={() => handleDelete(c._id)}>
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
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-light text-lg">{editing._id ? 'Edit Company' : 'New Company'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label className="text-xs uppercase tracking-wide text-muted-foreground">Name *</Label>
              <Input value={editing.name ?? ''} onChange={e => setEditing(v => ({ ...v, name: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs uppercase tracking-wide text-muted-foreground">Logo URL</Label>
              <Input value={editing.logo ?? ''} onChange={e => setEditing(v => ({ ...v, logo: e.target.value }))} />
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
