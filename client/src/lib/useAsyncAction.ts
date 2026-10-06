import { useRef, useState } from 'react'

/** Prevent re-entry and keep failed actions in the current form for retry. */
export function useAsyncAction() {
  const lock = useRef(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  async function run(action: () => Promise<unknown>) {
    if (lock.current) return
    lock.current = true
    setBusy(true)
    setError('')
    try { await action() }
    catch (err) { setError(err instanceof Error ? err.message : 'Could not complete the action. Please try again.') }
    finally { lock.current = false; setBusy(false) }
  }
  return { run, busy, error }
}
