interface HeaderProps {
  totalCount: number
  dataTimestamp: string
}

export function Header({ totalCount, dataTimestamp }: HeaderProps) {
  return (
    <header>
      <h1>Crunchyroll Advanced Search</h1>
      <p className="subtitle">
        {totalCount} anime available
        {dataTimestamp && ` (snapshot as of ${dataTimestamp})`}
      </p>
    </header>
  )
}
