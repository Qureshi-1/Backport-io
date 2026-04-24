export default function BillingLoading() {
  return (
    <div className="max-w-7xl animate-pulse space-y-8">
      <div>
        <div className="h-8 w-48 bg-zinc-800 rounded mb-2"></div>
        <div className="h-4 w-64 bg-zinc-800/50 rounded"></div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-[450px] bg-zinc-800/20 rounded-2xl border border-zinc-800 p-6 flex flex-col space-y-4">
             <div className="h-6 w-24 bg-zinc-800 rounded"></div>
             <div className="h-10 w-32 bg-zinc-800 rounded"></div>
             <div className="h-[1px] w-full bg-zinc-800/50 my-2"></div>
             <div className="space-y-3 flex-1">
                <div className="h-4 w-3/4 bg-zinc-800 rounded"></div>
                <div className="h-4 w-5/6 bg-zinc-800 rounded"></div>
                <div className="h-4 w-2/3 bg-zinc-800 rounded"></div>
             </div>
             <div className="h-12 w-full bg-zinc-800 rounded-xl mt-auto"></div>
          </div>
        ))}
      </div>
    </div>
  );
}
