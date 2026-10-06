import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getOffers, deleteOffer, type Offer } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { StatusBadge } from '@/components/StatusBadge'
import { formatDate } from '@/lib/utils'
import { Plus, Trash2, FileDown } from 'lucide-react'

export function OffersPage() {
  const [offers, setOffers] = useState<Offer[]>([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  async function load() {
    setLoading(true)
    setOffers(await getOffers())
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  async function handleDelete(id: string) {
    if (!confirm('Delete this offer?')) return
    await deleteOffer(id)
    load()
  }

  async function handlePdf(id: string) {
    const res = await fetch(`/api/pdf/${id}`)
    if (!res.ok) throw new Error('PDF generation failed')
    const blob = await res.blob()
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `offer-${id}.pdf`
    a.click()
    URL.revokeObjectURL(url)
    load()
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-light tracking-tight">Offers</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage and generate client travel offers</p>
        </div>
        <Button onClick={() => navigate('/offers/new')} className="bg-foreground hover:bg-foreground/90">
          <Plus className="w-4 h-4 mr-2" /> New Offer
        </Button>
      </div>

      <div className="rounded-lg border border-border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50 hover:bg-muted/50">
              <TableHead className="font-medium text-xs tracking-wide uppercase text-muted-foreground">Company</TableHead>
              <TableHead className="font-medium text-xs tracking-wide uppercase text-muted-foreground">Travellers</TableHead>
              <TableHead className="font-medium text-xs tracking-wide uppercase text-muted-foreground">Days</TableHead>
              <TableHead className="font-medium text-xs tracking-wide uppercase text-muted-foreground">Status</TableHead>
              <TableHead className="font-medium text-xs tracking-wide uppercase text-muted-foreground">Created</TableHead>
              <TableHead className="font-medium text-xs tracking-wide uppercase text-muted-foreground">Exports</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground py-16">
                  Loading…
                </TableCell>
              </TableRow>
            ) : offers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground py-16">
                  No offers yet. Create your first one.
                </TableCell>
              </TableRow>
            ) : offers.map(offer => (
              <TableRow
                key={offer._id}
                className="cursor-pointer hover:bg-[#faf7f0] transition-colors"
                onClick={() => navigate(`/offers/${offer._id}/edit`)}
              >
                <TableCell className="font-medium">{offer.company?.name ?? '—'}</TableCell>
                <TableCell className="text-muted-foreground text-sm">
                  {offer.people?.map(p => p.name).join(', ') || '—'}
                </TableCell>
                <TableCell className="text-muted-foreground text-sm">{offer.days?.length ?? 0}</TableCell>
                <TableCell><StatusBadge status={offer.status} /></TableCell>
                <TableCell className="text-muted-foreground text-sm">{formatDate(offer.createdAt)}</TableCell>
                <TableCell className="text-muted-foreground text-xs">
                  {offer.exports?.length
                    ? `V${offer.exports.length} / ${formatDate(offer.exports[offer.exports.length - 1].exportedAt)}`
                    : '-'}
                </TableCell>
                <TableCell className="text-right" onClick={e => e.stopPropagation()}>
                  <div className="flex justify-end gap-1">
                    <Button
                      size="icon" variant="ghost"
                      className="h-8 w-8 text-muted-foreground hover:text-[#b8963e]"
                      onClick={() => handlePdf(offer._id)}
                      title="Download PDF"
                    >
                      <FileDown className="w-4 h-4" />
                    </Button>
                    <Button
                      size="icon" variant="ghost"
                      className="h-8 w-8 text-muted-foreground hover:text-destructive"
                      onClick={() => handleDelete(offer._id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
