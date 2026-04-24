export default function DashboardLoading() {
  return (
    <div className="max-w-6xl space-y-8 animate-pulse">
      <div>
        <div className="h-8 w-48 bg-zinc-800 rounded mb-2"></div>
        <div className="h-4 w-64 bg-zinc-800/50 rounded"></div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-10 w-10 rounded-lg bg-zinc-800"></div>
              <div className="h-4 w-24 bg-zinc-800 rounded"></div>
            </div>
            <div className="h-8 w-20 bg-zinc-800 rounded"></div>
          </div>
        ))}
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden p-6">
        <div className="flex justify-between items-center mb-6">
           <div className="h-6 w-32 bg-zinc-800 rounded"></div>
           <div className="h-6 w-24 bg-zinc-800 rounded"></div>
        </div>
        <div className="h-[300px] w-full bg-zinc-800/50 rounded"></div>
      </div>
    </div>
  );
}
