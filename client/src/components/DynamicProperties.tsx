import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Plus, Trash2 } from 'lucide-react'

interface Props {
  value: Record<string, string>
  onChange: (v: Record<string, string>) => void
}

export function DynamicProperties({ value, onChange }: Props) {
  const [newKey, setNewKey] = useState('')
  const [newVal, setNewVal] = useState('')

  const entries = Object.entries(value)

  function update(key: string, val: string) {
    onChange({ ...value, [key]: val })
  }

  function remove(key: string) {
    const next = { ...value }
    delete next[key]
    onChange(next)
  }

  function add() {
    if (!newKey.trim()) return
    onChange({ ...value, [newKey.trim()]: newVal.trim() })
    setNewKey('')
    setNewVal('')
  }

  return (
    <div className="space-y-2">
      {entries.map(([k, v]) => (
        <div key={k} className="flex items-center gap-2">
          <Input className="w-36 shrink-0 text-xs bg-muted/50 font-medium" value={k} readOnly />
          <Input
            className="flex-1 text-sm"
            value={v}
            onChange={e => update(k, e.target.value)}
          />
          <button onClick={() => remove(k)} className="text-muted-foreground hover:text-destructive transition-colors shrink-0">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ))}
      <div className="flex items-center gap-2 pt-1">
        <Input
          className="w-36 shrink-0 text-xs"
          placeholder="property"
          value={newKey}
          onChange={e => setNewKey(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && add()}
        />
        <Input
          className="flex-1 text-sm"
          placeholder="value"
          value={newVal}
          onChange={e => setNewVal(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && add()}
        />
        <Button
          size="icon"
          variant="outline"
          className="shrink-0 h-9 w-9 border-[#b8963e]/40 text-[#b8963e] hover:bg-[#f5edd6]"
          onClick={add}
        >
          <Plus className="w-4 h-4" />
        </Button>
      </div>
    </div>
  )
}
