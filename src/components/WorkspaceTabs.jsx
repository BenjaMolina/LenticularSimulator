export default function WorkspaceTabs({ id, label, tabs, selected, onSelect, compact = false }) {
  function navigate(event, index) {
    if (event.altKey || event.ctrlKey || event.metaKey) return
    const move = { ArrowRight: (index + 1) % tabs.length, ArrowLeft: (index + tabs.length - 1) % tabs.length,
      Home: 0, End: tabs.length - 1 }[event.key]
    if (move === undefined) return
    event.preventDefault()
    const next = tabs[move][0]
    onSelect(next)
    document.getElementById(`${id}-tab-${next}`)?.focus()
  }

  return (
    <div className={`workspace-tabs${compact ? ' compact' : ''}`} role="tablist" aria-label={label}>
      {tabs.map(([key, name], index) => (
        <button key={key} type="button" role="tab" id={`${id}-tab-${key}`}
          aria-selected={selected === key} aria-controls={`${id}-panel-${key}`}
          tabIndex={selected === key ? 0 : -1} onClick={() => onSelect(key)}
          onKeyDown={(event) => navigate(event, index)}>{name}</button>
      ))}
    </div>
  )
}

export function WorkspaceTabPanel({ id, tab, active, className, children }) {
  return (
    <section id={`${id}-panel-${tab}`} role="tabpanel" aria-labelledby={`${id}-tab-${tab}`}
      hidden={!active} className={className} tabIndex={0}>
      {children}
    </section>
  )
}
