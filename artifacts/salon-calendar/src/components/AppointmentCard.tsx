import * as React from "react";
import { format, parseISO, addMinutes } from "date-fns";
import { motion } from "framer-motion";
import { Clock, User, Phone, Edit2, Trash2, Scissors } from "lucide-react";
import type { Appointment } from "@workspace/api-client-react";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";

interface AppointmentCardProps {
  appointment: Appointment;
  onEdit: (appointment: Appointment) => void;
  onDelete: (id: number) => void;
  index: number;
}

export function AppointmentCard({ appointment, onEdit, onDelete, index }: AppointmentCardProps) {
  // Parse time for display
  const dateObj = parseISO(`${appointment.date}T${appointment.time}`);
  const endDateObj = addMinutes(dateObj, appointment.duration);
  
  const startTime = format(dateObj, 'h:mm a');
  const endTime = format(endDateObj, 'h:mm a');

  const statusConfig = {
    scheduled: { color: "border-l-blue-400", badge: "secondary" as const, label: "Scheduled" },
    confirmed: { color: "border-l-emerald-400", badge: "success" as const, label: "Confirmed" },
    completed: { color: "border-l-amber-400", badge: "warning" as const, label: "Completed" },
    cancelled: { color: "border-l-destructive", badge: "destructive" as const, label: "Cancelled" },
    no_show: { color: "border-l-slate-400", badge: "outline" as const, label: "No Show" },
  };

  const config = statusConfig[appointment.status as keyof typeof statusConfig] || statusConfig.scheduled;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      className={`relative flex flex-col md:flex-row gap-4 bg-card rounded-2xl p-5 shadow-sm border border-border/60 border-l-4 ${config.color} hover:shadow-md transition-all group`}
    >
      {/* Time Column */}
      <div className="flex flex-row md:flex-col justify-between md:justify-start items-center md:items-start min-w-[100px] border-b md:border-b-0 md:border-r border-border/50 pb-3 md:pb-0 md:pr-4">
        <div className="flex flex-col">
          <span className="font-display font-bold text-xl text-foreground">{startTime}</span>
          <span className="text-xs text-muted-foreground">{appointment.duration} mins</span>
        </div>
        <Badge variant={config.badge} className="md:mt-2">{config.label}</Badge>
      </div>

      {/* Details Column */}
      <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-y-2 gap-x-4">
        <div className="space-y-1">
          <h3 className="font-semibold text-lg flex items-center gap-2">
            <User className="h-4 w-4 text-muted-foreground" />
            {appointment.clientName}
          </h3>
          <p className="text-sm text-muted-foreground flex items-center gap-2">
            <Phone className="h-4 w-4" />
            {appointment.phone}
          </p>
        </div>
        
        <div className="space-y-1">
          <p className="font-medium flex items-center gap-2 text-foreground/90">
            <Scissors className="h-4 w-4 text-primary" />
            {appointment.service}
          </p>
          <p className="text-sm font-semibold text-primary/80">
            {formatCurrency(appointment.price)}
          </p>
        </div>

        {appointment.notes && (
          <div className="col-span-1 md:col-span-2 mt-2 p-3 bg-muted/30 rounded-xl text-sm italic text-muted-foreground border border-border/40">
            "{appointment.notes}"
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex flex-row md:flex-col gap-2 pt-3 md:pt-0 border-t md:border-t-0 border-border/50 justify-end md:justify-start">
        <button 
          onClick={() => onEdit(appointment)}
          className="p-2.5 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-xl transition-colors"
          aria-label="Edit appointment"
        >
          <Edit2 className="h-4 w-4" />
        </button>
        <button 
          onClick={() => onDelete(appointment.id)}
          className="p-2.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-xl transition-colors"
          aria-label="Delete appointment"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </motion.div>
  );
}
