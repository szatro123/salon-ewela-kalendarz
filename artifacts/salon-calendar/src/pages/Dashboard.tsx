import * as React from "react";
import { format, addDays, subDays, isToday, isTomorrow, isYesterday } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Plus, CalendarX2 } from "lucide-react";
import { useListAppointments } from "@workspace/api-client-react";
import { useDeleteAppointmentExtended } from "@/hooks/use-appointments-extended";
import { Button } from "@/components/ui/button";
import { AppointmentCard } from "@/components/AppointmentCard";
import { AppointmentForm } from "@/components/AppointmentForm";
import type { Appointment } from "@workspace/api-client-react";
import { formatCurrency } from "@/lib/utils";

export default function Dashboard() {
  const [selectedDate, setSelectedDate] = React.useState<Date>(new Date());
  const [isFormOpen, setIsFormOpen] = React.useState(false);
  const [editingAppointment, setEditingAppointment] = React.useState<Appointment | null>(null);
  
  const dateStr = format(selectedDate, 'yyyy-MM-dd');
  
  const { data: appointments, isLoading } = useListAppointments({ date: dateStr });
  const deleteMutation = useDeleteAppointmentExtended();

  const handlePrevDay = () => setSelectedDate(prev => subDays(prev, 1));
  const handleNextDay = () => setSelectedDate(prev => addDays(prev, 1));
  const handleToday = () => setSelectedDate(new Date());

  const handleEdit = (appointment: Appointment) => {
    setEditingAppointment(appointment);
    setIsFormOpen(true);
  };

  const handleCreate = () => {
    setEditingAppointment(null);
    setIsFormOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (window.confirm("Are you sure you want to cancel and delete this appointment?")) {
      await deleteMutation.mutateAsync({ id });
    }
  };

  // Sort appointments by time
  const sortedAppointments = React.useMemo(() => {
    if (!appointments) return [];
    return [...appointments].sort((a, b) => a.time.localeCompare(b.time));
  }, [appointments]);

  // Calculate stats
  const stats = React.useMemo(() => {
    if (!appointments) return { totalRevenue: 0, count: 0 };
    const validAppointments = appointments.filter(a => a.status !== 'cancelled' && a.status !== 'no_show');
    return {
      totalRevenue: validAppointments.reduce((sum, a) => sum + Number(a.price), 0),
      count: validAppointments.length
    };
  }, [appointments]);

  // Format date display nicely
  const dateDisplay = isToday(selectedDate) 
    ? "Today" 
    : isTomorrow(selectedDate) 
      ? "Tomorrow" 
      : isYesterday(selectedDate) 
        ? "Yesterday" 
        : format(selectedDate, 'EEEE, MMM do');

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Hero Header */}
      <div className="relative pt-12 pb-24 px-4 sm:px-6 lg:px-8 overflow-hidden">
        {/* Absolute Background image */}
        <div className="absolute inset-0 z-0">
          <img 
            src={`${import.meta.env.BASE_URL}images/hero-bg.png`} 
            alt="" 
            className="w-full h-full object-cover opacity-80"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-background/40 via-background/80 to-background" />
        </div>

        <div className="relative z-10 max-w-5xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
          <div>
            <h1 className="text-4xl md:text-5xl font-display font-bold text-foreground mb-2">
              Lumière Salon
            </h1>
            <p className="text-muted-foreground text-lg">
              Manage your daily schedule beautifully.
            </p>
          </div>
          
          <div className="flex gap-4 items-center bg-white/60 backdrop-blur-xl p-4 rounded-2xl border border-white/50 shadow-sm">
            <div className="text-right">
              <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Est. Revenue</p>
              <p className="text-2xl font-bold text-primary">{formatCurrency(stats.totalRevenue)}</p>
            </div>
            <div className="w-px h-10 bg-border/80 mx-2" />
            <div className="text-left">
              <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Bookings</p>
              <p className="text-2xl font-bold text-foreground">{stats.count}</p>
            </div>
          </div>
        </div>
      </div>

      <main className="relative z-20 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 -mt-10">
        
        {/* Date Navigation Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between bg-card p-2 rounded-2xl shadow-lg border border-border/50 mb-8 gap-4">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Button variant="ghost" size="icon" onClick={handlePrevDay}>
              <ChevronLeft className="h-5 w-5" />
            </Button>
            
            <div className="flex-1 sm:w-48 text-center flex items-center justify-center gap-2 font-display font-semibold text-xl">
              <CalendarIcon className="h-5 w-5 text-primary" />
              {dateDisplay}
            </div>

            <Button variant="ghost" size="icon" onClick={handleNextDay}>
              <ChevronRight className="h-5 w-5" />
            </Button>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-center">
            {!isToday(selectedDate) && (
              <Button variant="outline" size="sm" onClick={handleToday} className="rounded-xl hidden sm:flex">
                Today
              </Button>
            )}
            <Button size="sm" onClick={handleCreate} className="w-full sm:w-auto rounded-xl">
              <Plus className="h-4 w-4 mr-2" />
              New Booking
            </Button>
          </div>
        </div>

        {/* Timeline View */}
        <div className="space-y-4">
          {isLoading ? (
            <div className="space-y-4 animate-pulse">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-32 bg-card rounded-2xl border border-border/50" />
              ))}
            </div>
          ) : sortedAppointments.length > 0 ? (
            <AnimatePresence mode="popLayout">
              {sortedAppointments.map((apt, i) => (
                <AppointmentCard 
                  key={apt.id} 
                  appointment={apt} 
                  index={i}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                />
              ))}
            </AnimatePresence>
          ) : (
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center py-20 text-center bg-card/50 rounded-3xl border border-dashed border-border"
            >
              <div className="w-48 h-48 mb-6 opacity-80">
                <img 
                  src={`${import.meta.env.BASE_URL}images/empty-state.png`} 
                  alt="Empty schedule" 
                  className="w-full h-full object-contain mix-blend-multiply"
                />
              </div>
              <h3 className="text-2xl font-display font-semibold text-foreground mb-2">
                No appointments
              </h3>
              <p className="text-muted-foreground mb-6 max-w-xs">
                Your schedule is beautifully clear for {dateDisplay.toLowerCase()}.
              </p>
              <Button onClick={handleCreate} variant="outline" className="rounded-xl border-primary/20 text-primary hover:bg-primary/5">
                <Plus className="h-4 w-4 mr-2" />
                Add First Booking
              </Button>
            </motion.div>
          )}
        </div>
      </main>

      <AppointmentForm 
        open={isFormOpen} 
        onOpenChange={setIsFormOpen} 
        initialDate={selectedDate}
        appointmentToEdit={editingAppointment}
      />
    </div>
  );
}
