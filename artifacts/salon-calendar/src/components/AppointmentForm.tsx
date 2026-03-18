import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { SelectNative } from "@/components/ui/select-native";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useCreateAppointmentExtended, useUpdateAppointmentExtended } from "@/hooks/use-appointments-extended";
import type { Appointment, AppointmentInput } from "@workspace/api-client-react";
import { Loader2 } from "lucide-react";

const SERVICES = [
  "Haircut", "Color", "Highlights", "Balayage", "Blowout", 
  "Trim", "Treatment", "Extensions", "Nails", "Facial", "Waxing", "Other"
];

const DURATIONS = [
  { label: "30 mins", value: 30 },
  { label: "45 mins", value: 45 },
  { label: "1 hour", value: 60 },
  { label: "1.5 hours", value: 90 },
  { label: "2 hours", value: 120 },
  { label: "2.5 hours", value: 150 },
  { label: "3 hours", value: 180 },
];

const STATUSES = [
  { label: "Scheduled", value: "scheduled" },
  { label: "Confirmed", value: "confirmed" },
  { label: "Completed", value: "completed" },
  { label: "Cancelled", value: "cancelled" },
  { label: "No Show", value: "no_show" },
];

const formSchema = z.object({
  clientName: z.string().min(2, "Client name is required"),
  phone: z.string().min(10, "Valid phone number required"),
  service: z.string().min(1, "Service is required"),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format"),
  time: z.string().regex(/^\d{2}:\d{2}$/, "Invalid time format"),
  duration: z.coerce.number().min(15),
  price: z.coerce.number().min(0),
  notes: z.string().optional(),
  status: z.enum(["scheduled", "confirmed", "completed", "cancelled", "no_show"]),
});

type FormValues = z.infer<typeof formSchema>;

interface AppointmentFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialDate?: Date;
  appointmentToEdit?: Appointment | null;
}

export function AppointmentForm({ 
  open, 
  onOpenChange, 
  initialDate, 
  appointmentToEdit 
}: AppointmentFormProps) {
  
  const createMutation = useCreateAppointmentExtended();
  const updateMutation = useUpdateAppointmentExtended();
  const isPending = createMutation.isPending || updateMutation.isPending;

  const defaultDateStr = initialDate ? format(initialDate, 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd');

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      clientName: "",
      phone: "",
      service: SERVICES[0],
      date: defaultDateStr,
      time: "10:00",
      duration: 60,
      price: 50,
      notes: "",
      status: "scheduled",
    },
  });

  React.useEffect(() => {
    if (open) {
      if (appointmentToEdit) {
        reset({
          clientName: appointmentToEdit.clientName,
          phone: appointmentToEdit.phone,
          service: appointmentToEdit.service,
          date: appointmentToEdit.date,
          time: appointmentToEdit.time,
          duration: appointmentToEdit.duration,
          price: appointmentToEdit.price,
          notes: appointmentToEdit.notes || "",
          status: appointmentToEdit.status as any,
        });
      } else {
        reset({
          clientName: "",
          phone: "",
          service: SERVICES[0],
          date: defaultDateStr,
          time: "10:00",
          duration: 60,
          price: 50,
          notes: "",
          status: "scheduled",
        });
      }
    }
  }, [open, appointmentToEdit, defaultDateStr, reset]);

  const onSubmit = async (data: FormValues) => {
    try {
      if (appointmentToEdit) {
        await updateMutation.mutateAsync({
          id: appointmentToEdit.id,
          data: data as AppointmentInput,
        });
      } else {
        await createMutation.mutateAsync({
          data: data as AppointmentInput,
        });
      }
      onOpenChange(false);
    } catch (error) {
      // Handled by mutation toast
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{appointmentToEdit ? "Edit Appointment" : "New Appointment"}</DialogTitle>
          <DialogDescription>
            {appointmentToEdit ? "Make changes to the booking below." : "Enter the details for the new booking."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 pt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="clientName">Client Name</Label>
              <Input id="clientName" {...register("clientName")} placeholder="Jane Doe" />
              {errors.clientName && <p className="text-xs text-destructive">{errors.clientName.message}</p>}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input id="phone" type="tel" {...register("phone")} placeholder="(555) 123-4567" />
              {errors.phone && <p className="text-xs text-destructive">{errors.phone.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="service">Service</Label>
              <SelectNative id="service" {...register("service")}>
                {SERVICES.map(s => <option key={s} value={s}>{s}</option>)}
              </SelectNative>
              {errors.service && <p className="text-xs text-destructive">{errors.service.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="price">Price ($)</Label>
              <Input id="price" type="number" min="0" step="0.01" {...register("price")} />
              {errors.price && <p className="text-xs text-destructive">{errors.price.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="date">Date</Label>
              <Input id="date" type="date" {...register("date")} />
              {errors.date && <p className="text-xs text-destructive">{errors.date.message}</p>}
            </div>

            <div className="space-y-2 flex gap-2">
              <div className="w-1/2 space-y-2">
                <Label htmlFor="time">Time</Label>
                <Input id="time" type="time" {...register("time")} />
                {errors.time && <p className="text-xs text-destructive">{errors.time.message}</p>}
              </div>
              <div className="w-1/2 space-y-2">
                <Label htmlFor="duration">Duration</Label>
                <SelectNative id="duration" {...register("duration")}>
                  {DURATIONS.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
                </SelectNative>
                {errors.duration && <p className="text-xs text-destructive">{errors.duration.message}</p>}
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <SelectNative id="status" {...register("status")}>
              {STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
            </SelectNative>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Textarea id="notes" {...register("notes")} placeholder="Client preferences, allergies, etc." />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {appointmentToEdit ? "Save Changes" : "Book Appointment"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
