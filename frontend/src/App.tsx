function App() {
  return (
    <div className="mx-auto flex min-h-full max-w-3xl flex-col gap-6 px-6 py-10">
      <header className="flex flex-col gap-2">
        <h1 className="text-3xl font-semibold tracking-tight">ProtectPibble</h1>
        <p className="text-slate-300">
          Class Companion MVP scaffold (Friend mode + Instructor mode).
        </p>
      </header>

      <section className="rounded-xl border border-slate-800 bg-slate-900/40 p-5">
        <h2 className="text-lg font-medium">Dev setup</h2>
        <ol className="mt-3 list-decimal space-y-2 pl-6 text-slate-200">
          <li>
            Run <code className="rounded bg-slate-800 px-1.5 py-0.5">./scripts/bootstrap</code>
          </li>
          <li>
            Run <code className="rounded bg-slate-800 px-1.5 py-0.5">./scripts/dev</code>
          </li>
          <li>
            Backend health check: <code className="rounded bg-slate-800 px-1.5 py-0.5">GET /health</code>
          </li>
        </ol>
      </section>
    </div>
  )
}

export default App
