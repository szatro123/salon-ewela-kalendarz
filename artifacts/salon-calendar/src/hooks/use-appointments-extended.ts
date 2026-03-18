import { useQueryClient } from "@tanstack/react-query";
import { 
  useCreateAppointment as useOrvalCreate,
  useUpdateAppointment as useOrvalUpdate,
  useDeleteAppointment as useOrvalDelete,
  getListAppointmentsQueryKey
} from "@workspace/api-client-react";
import { useToast } from "@/components/ui/use-toast";

// Wrappers around the generated hooks to add cache invalidation and toast notifications
export function useCreateAppointmentExtended() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useOrvalCreate({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListAppointmentsQueryKey() });
        toast({
          title: "Appointment booked",
          description: "The appointment has been successfully scheduled.",
        });
      },
      onError: (error: any) => {
        toast({
          title: "Failed to book",
          description: error.message || "There was a conflict or error booking this appointment.",
          variant: "destructive",
        });
      }
    }
  });
}

export function useUpdateAppointmentExtended() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useOrvalUpdate({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListAppointmentsQueryKey() });
        toast({
          title: "Appointment updated",
          description: "The changes have been saved.",
        });
      },
      onError: (error: any) => {
        toast({
          title: "Failed to update",
          description: error.message || "There was an error updating this appointment.",
          variant: "destructive",
        });
      }
    }
  });
}

export function useDeleteAppointmentExtended() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useOrvalDelete({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListAppointmentsQueryKey() });
        toast({
          title: "Appointment cancelled",
          description: "The appointment has been removed from the calendar.",
        });
      },
      onError: (error: any) => {
        toast({
          title: "Failed to cancel",
          description: error.message || "There was an error removing this appointment.",
          variant: "destructive",
        });
      }
    }
  });
}
