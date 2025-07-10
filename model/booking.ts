import mongoose, { Schema, Document } from "mongoose";

interface IBooking extends Document {
  customer: {
    name: string;
    email: string;
    phone: string;
  };
  metadata: {
    vehicle: string;
    vehicleType: string;
    bookingPeriod: string;
  };
  amount: number;
  currency: string;
  description: string;
  stripeProductId: string;
  priceId: string;
  createdAt: Date;
  updatedAt: Date;
}

const BookingSchema: Schema = new Schema(
  {
    customer: {
      name: { type: String, required: true },
      email: { type: String, required: true },
      phone: { type: String },
    },
    metadata: {
      vehicle: { type: String, required: true },
      vehicleType: { type: String, default: "N/A" },
      bookingPeriod: { type: String, required: true },
    },
    amount: { type: Number, required: true },   // amount in cents (integer)
    currency: { type: String, required: true, default: "gbp" },
    description: { type: String, required: true },
    stripeProductId: { type: String, required: true },
    priceId: { type: String, required: true },
  },
  {
    timestamps: true, // adds createdAt and updatedAt
  }
);

const Booking = mongoose.models.Booking || mongoose.model<IBooking>("Booking", BookingSchema);

export default Booking;
