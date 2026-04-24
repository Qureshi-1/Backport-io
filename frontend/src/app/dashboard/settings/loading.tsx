export default function SettingsLoading() {
  return (
    <div className="max-w-3xl space-y-8 animate-pulse">
      <div>
        <div className="h-8 w-48 bg-zinc-800 rounded mb-2"></div>
        <div className="h-4 w-64 bg-zinc-800/50 rounded"></div>
      </div>
      
      <div className="space-y-6">
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
          <div className="h-6 w-32 bg-zinc-800 rounded mb-4"></div>
          <div className="h-12 w-full bg-zinc-800 rounded"></div>
        </div>
        
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl divide-y divide-zinc-800">
          {[1, 2, 3, 4].map(i => (
             <div key={i} className="p-6 flex items-center justify-between">
                <div>
                   <div className="h-5 w-32 bg-zinc-800 rounded mb-2"></div>
                   <div className="h-4 w-64 bg-zinc-800 border rounded"></div>
                </div>
                <div className="h-6 w-12 bg-zinc-800 rounded-full"></div>
             </div>
          ))}
        </div>
      </div>
    </div>
  );
}
