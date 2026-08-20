export function Marca() {
  return (
    <div className="flex items-center gap-3 px-2">
      <span className="bg-brand flex size-10 shrink-0 items-center justify-center rounded-xl text-lg font-bold text-white shadow-[0_6px_16px_rgba(91,124,255,0.35)]">
        $
      </span>
      <div className="min-w-0">
        <p className="text-sidebar-foreground truncate text-base leading-tight font-bold">
          SueldosPH
        </p>
        <p className="text-muted-foreground truncate text-xs">Liquidación de sueldos</p>
      </div>
    </div>
  )
}
