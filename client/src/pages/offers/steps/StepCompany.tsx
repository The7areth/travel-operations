import { useEffect, useState } from 'react'
import { getCompanies, getPeople, createPerson, type Company, type Person, type Offer } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn, initials } from '@/lib/utils'
import { Search, Plus, X } from 'lucide-react'

interface Props {
  draft: Partial<Offer>
  onSave: (patch: Partial<Offer>) => Promise<Partial<Offer>>
  onNext: () => void
}

export function StepCompany({ draft, onSave, onNext }: Props) {
  const [companies, setCompanies] = useState<Company[]>([])
  const [people, setPeople] = useState<Person[]>([])
  const [companySearch, setCompanySearch] = useState('')
  const [peopleSearch, setPeopleSearch] = useState('')
  const [selectedCompany, setSelectedCompany] = useState<string | undefined>(
    typeof draft.company === 'object' ? (draft.company as Company)?._id : (draft.company as unknown as string)
  )
  const [selectedPeople, setSelectedPeople] = useState<string[]>(
    (draft.people as (Person | string)[])?.map(p => typeof p === 'string' ? p : p._id) ?? []
  )
  const [newPersonName, setNewPersonName] = useState('')
  const [newPersonEmail, setNewPersonEmail] = useState('')
  const [addingPerson, setAddingPerson] = useState(false)

  useEffect(() => {
    getCompanies().then(setCompanies)
    getPeople().then(setPeople)
  }, [])

  const filteredCompanies = companies.filter(c =>
    c.name.toLowerCase().includes(companySearch.toLowerCase())
  )
  const filteredPeople = people.filter(p =>
    p.name.toLowerCase().includes(peopleSearch.toLowerCase())
  )

  async function handleAddPerson() {
    if (!newPersonName.trim()) return
    const person = await createPerson({ name: newPersonName.trim(), email: newPersonEmail.trim() })
    setPeople(prev => [...prev, person])
    setSelectedPeople(prev => [...prev, person._id])
    setNewPersonName('')
    setNewPersonEmail('')
    setAddingPerson(false)
  }

  async function handleNext() {
    await onSave({ company: selectedCompany as any, people: selectedPeople as any })
    onNext()
  }

  function togglePerson(id: string) {
    setSelectedPeople(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    )
  }

  return (
    <div className="max-w-2xl space-y-8">
      <div>
        <h2 className="text-xl font-light tracking-tight mb-1">Company & People</h2>
        <p className="text-sm text-muted-foreground">Select the client company and travellers for this offer.</p>
      </div>

      {/* Company */}
      <div className="space-y-3">
        <Label className="text-xs font-semibold tracking-widest uppercase text-muted-foreground">Company</Label>
        <div className="relative">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" />
          <Input className="pl-9" placeholder="Search companies…" value={companySearch} onChange={e => setCompanySearch(e.target.value)} />
        </div>
        <div className="space-y-1.5 max-h-52 overflow-auto pr-1">
          {filteredCompanies.map(c => (
            <button
              key={c._id}
              onClick={() => setSelectedCompany(c._id)}
              className={cn(
                'w-full flex items-center gap-3 px-4 py-3 rounded-lg border text-left transition-all',
                selectedCompany === c._id
                  ? 'border-[#b8963e] bg-[#f5edd6]'
                  : 'border-border hover:border-[#b8963e]/40 hover:bg-muted/50'
              )}
            >
              <div className={cn(
                'w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold shrink-0',
                selectedCompany === c._id ? 'bg-[#b8963e] text-white' : 'bg-muted text-muted-foreground'
              )}>
                {initials(c.name)}
              </div>
              <div>
                <div className="text-sm font-medium">{c.name}</div>
                {c.properties?.industry && <div className="text-xs text-muted-foreground">{c.properties.industry}</div>}
              </div>
              {selectedCompany === c._id && <span className="ml-auto text-[#b8963e] text-xs font-medium">✓</span>}
            </button>
          ))}
        </div>
      </div>

      {/* People */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label className="text-xs font-semibold tracking-widest uppercase text-muted-foreground">Travellers</Label>
          <Button
            size="sm" variant="outline"
            className="h-7 text-xs gap-1.5 border-[#b8963e]/40 text-[#b8963e] hover:bg-[#f5edd6]"
            onClick={() => setAddingPerson(true)}
          >
            <Plus className="w-3 h-3" /> Add Person
          </Button>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" />
          <Input className="pl-9" placeholder="Search people…" value={peopleSearch} onChange={e => setPeopleSearch(e.target.value)} />
        </div>
        {addingPerson && (
          <div className="border border-[#b8963e]/30 rounded-lg p-4 bg-[#faf9f7] space-y-3">
            <p className="text-xs font-semibold text-[#b8963e] uppercase tracking-wide">New Person</p>
            <Input placeholder="Full name *" value={newPersonName} onChange={e => setNewPersonName(e.target.value)} />
            <Input placeholder="Email" value={newPersonEmail} onChange={e => setNewPersonEmail(e.target.value)} />
            <div className="flex gap-2">
              <Button size="sm" onClick={handleAddPerson} className="bg-foreground hover:bg-foreground/90">Add</Button>
              <Button size="sm" variant="ghost" onClick={() => setAddingPerson(false)}>Cancel</Button>
            </div>
          </div>
        )}
        <div className="space-y-1.5 max-h-64 overflow-auto pr-1">
          {filteredPeople.map(p => {
            const selected = selectedPeople.includes(p._id)
            return (
              <button
                key={p._id}
                onClick={() => togglePerson(p._id)}
                className={cn(
                  'w-full flex items-center gap-3 px-4 py-3 rounded-lg border text-left transition-all',
                  selected ? 'border-[#b8963e] bg-[#f5edd6]' : 'border-border hover:border-[#b8963e]/40 hover:bg-muted/50'
                )}
              >
                <div className={cn(
                  'w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold shrink-0',
                  selected ? 'bg-[#b8963e] text-white' : 'bg-muted text-muted-foreground'
                )}>
                  {initials(p.name)}
                </div>
                <div>
                  <div className="text-sm font-medium">{p.name}</div>
                  {p.email && <div className="text-xs text-muted-foreground">{p.email}</div>}
                </div>
                {selected && <X className="ml-auto w-4 h-4 text-[#b8963e]" />}
              </button>
            )
          })}
        </div>
        {selectedPeople.length > 0 && (
          <p className="text-xs text-[#b8963e] font-medium">
            {selectedPeople.length} traveller{selectedPeople.length > 1 ? 's' : ''} selected
          </p>
        )}
      </div>

      <div className="flex justify-end pt-4 border-t border-border">
        <Button
          onClick={handleNext}
          disabled={!selectedCompany}
          className="bg-foreground hover:bg-foreground/90"
        >
          Continue to Itinerary →
        </Button>
      </div>
    </div>
  )
}
