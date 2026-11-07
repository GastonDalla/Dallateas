export function TableSkeletonRows({ columns, rows = 5 }: { columns: number; rows?: number }) {
  return Array.from({ length: rows }, (_, row) => (
    <tr key={row} aria-hidden="true" className="border-t border-border">
      {Array.from({ length: columns }, (_, column) => (
        <td key={column} className="py-3 pr-4">
          <div className="h-4 bg-muted" />
        </td>
      ))}
    </tr>
  ));
}
