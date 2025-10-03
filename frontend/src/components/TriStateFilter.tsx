import { FilterValue } from '../types'

interface TriStateFilterProps {
  label: string
  value: FilterValue
  onChange: (value: FilterValue) => void
}

export function TriStateFilter({ label, value, onChange }: TriStateFilterProps) {
  const cycleState = () => {
    const states: FilterValue[] = ['default', 'include', 'exclude']
    const currentIndex = states.indexOf(value)
    const nextIndex = (currentIndex + 1) % states.length
    onChange(states[nextIndex])
  }

  const getIcon = () => {
    switch (value) {
      case 'include':
        return '✓'
      case 'exclude':
        return '✗'
      default:
        return '○'
    }
  }

  const getClassName = () => {
    return `tri-state-filter tri-state-${value}`
  }

  return (
    <button
      type="button"
      className={getClassName()}
      onClick={cycleState}
      title={`${label}: ${value}`}
    >
      <span className="tri-state-icon">{getIcon()}</span>
      <span className="tri-state-label">{label}</span>
    </button>
  )
}
