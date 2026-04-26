"use client";
import { motion, AnimatePresence } from "framer-motion";
import { ShieldAlert, AlertTriangle, Zap, Clock, Info } from "lucide-react";

interface Alert {
  id: number;
  type: string;
  message: string;
  severity: string;
  timestamp: string;
   
  details: Record<string, any>;
  is_read: boolean;
}

interface AlertFeedProps {
  alerts: Alert[];
  onMarkRead?: (_id: number) => void;
}

 
const SEVERITY_ICONS: Record<string, any> = {
  critical: ShieldAlert,
  high: AlertTriangle,
  warning: Zap,
  medium: Clock,
  info: Info,
};

const SEVERITY_COLORS: Record<string, { text: string; bg: string; border: string; icon: string }> = {
  critical: { text: 'text-red-400', bg: 'bg-red-500/5', border: 'border-red-500/20', icon: '#EF4444' },
  high: { text: 'text-orange-400', bg: 'bg-orange-500/5', border: 'border-orange-500/20', icon: '#F97316' },
  warning: { text: 'text-yellow-400', bg: 'bg-yellow-500/5', border: 'border-yellow-500/20', icon: '#FBBF24' },
  medium: { text: 'text-blue-400', bg: 'bg-blue-500/5', border: 'border-blue-500/20', icon: '#6BA9FF' },
  info: { text: 'text-zinc-400', bg: 'bg-zinc-500/5', border: 'border-zinc-500/20', icon: '#A2BDDB' },
};

export default function AlertFeed({ alerts }: AlertFeedProps) {
  if (alerts.length === 0) {
    return (
      <div className="text-center py-12 space-y-3">
        <motion.div
          animate={{ scale: [1, 1.05, 1] }}
          transition={{ duration: 3, repeat: Infinity }}
          className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-[#2CE8C3]/10"
        >
          <ShieldAlert className="w-6 h-6 text-[#2CE8C3]" />
        </motion.div>
        <div className="text-zinc-600 text-[10px] font-headline uppercase font-black tracking-widest">
          No security events detected
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <AnimatePresence>
        {alerts.map((alert, index) => {
          const colors = SEVERITY_COLORS[alert.severity] || SEVERITY_COLORS.info;
          const Icon = SEVERITY_ICONS[alert.severity] || Info;
          
          return (
            <motion.div
              key={alert.id}
              initial={{ opacity: 0, x: 30, scale: 0.95 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: -30, scale: 0.95 }}
              transition={{ delay: index * 0.05, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              className={`p-4 rounded-xl border ${colors.border} ${colors.bg} group relative overflow-hidden ${!alert.is_read ? 'ring-1 ring-white/5' : ''}`}
            >
              {/* Animated gradient line */}
              <motion.div
                className="absolute left-0 top-0 bottom-0 w-[2px]"
                style={{ background: colors.icon }}
                initial={{ scaleY: 0 }}
                animate={{ scaleY: 1 }}
                transition={{ delay: index * 0.05 + 0.2, duration: 0.6 }}
              />
              
              <div className="flex items-start gap-3 pl-2">
                <motion.div
                  animate={!alert.is_read ? { scale: [1, 1.2, 1] } : {}}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <Icon className="w-4 h-4 mt-0.5" style={{ color: colors.icon }} />
                </motion.div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className={`text-xs font-bold ${colors.text} uppercase tracking-wider`}>
                      {alert.type.replace(/_/g, ' ')}
                    </span>
                    {!alert.is_read && (
                      <span className="w-1.5 h-1.5 rounded-full bg-[#2CE8C3] animate-pulse" />
                    )}
                  </div>
                  <p className="text-sm text-zinc-300 mt-1 leading-relaxed">{alert.message}</p>
                  <span className="text-[9px] text-zinc-600 font-mono mt-2 block">
                    {new Date(alert.timestamp).toLocaleString()}
                  </span>
                </div>
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
