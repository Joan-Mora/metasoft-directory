/**
 * © Joan Mora — Proprietary. See LICENSE.
 */
export function HighlightMatch({ text, query }: { text: string; query: string }) {
  const q = query.trim()
  if (!q) return <>{text}</>
  const escaped = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const parts = text.split(new RegExp(`(${escaped})`, 'ig'))
  return (
    <>
      {parts.map((part, i) =>
        part.toLowerCase() === q.toLowerCase() ? (
          <mark key={`${part}-${i}`} className="mark-hit">
            {part}
          </mark>
        ) : (
          <span key={`${part}-${i}`}>{part}</span>
        )
      )}
    </>
  )
}
