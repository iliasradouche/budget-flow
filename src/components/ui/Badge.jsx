export default function Badge({ children, color = '#22c55e', className = '' }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${className}`}
      style={{ backgroundColor: color + '20', color }}
    >
      {children}
    </span>
  )
}
