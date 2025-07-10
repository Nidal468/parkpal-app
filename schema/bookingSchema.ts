import { z } from "zod";

export const bookingSchema = z.object({
  fullName: z.string().min(1),
  email: z.string().email(),
  phone: z.string().min(8),
  vehicleReg: z.string().min(4).max(8),
  startDate: z.string(),
  endDate: z.string(),
  startTime: z.string(),
  endTime: z.string(),
  selectedVehicle: z.string().optional(),
});

export type BookingSchema = z.infer<typeof bookingSchema>;