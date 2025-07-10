import mongoose, { Schema, Document } from 'mongoose';

export interface ISpaces extends Document {
  title: string;
  location: string;
  features: string;
  is_available?: boolean;        // Changed from string to boolean
  description?: string;
  price_per_day: number;
  available_from: Date;           // Changed from string to Date
  available_to: Date;             // Changed from string to Date
  image_url: string;
  address: string;
  postcode: string;
  latitude: string;
  longitude: string;
  what3words: string;
  available_days: string;
  total_spaces: number;           // Changed from string to number
  price_per_month: number;
  space_owner_id: Schema.Types.ObjectId; // Reference to User or Owner schema (assuming)
  price_per_hour: number;
  price_per_week: number;
  createdAt: Date;
  updatedAt: Date;
}

const SpacesSchema = new Schema<ISpaces>(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    location: {
      type: String,
      required: true,
      trim: true,
    },
    features: {
      type: String,
      required: true,
      trim: true,
    },
    is_available: {
      type: Boolean,
      default: true,
    },
    description: {
      type: String,
      trim: true,
    },
    price_per_day: {
      type: Number,
      required: true,
    },
    available_from: {
      type: Date,
      required: true,
    },
    available_to: {
      type: Date,
      required: true,
    },
    image_url: {
      type: String,
      required: true,
      trim: true,
    },
    address: {
      type: String,
      required: true,
      trim: true,
    },
    postcode: {
      type: String,
      required: true,
      trim: true,
    },
    latitude: {
      type: String,
      required: true,
      trim: true,
    },
    longitude: {
      type: String,
      required: true,
      trim: true,
    },
    what3words: {
      type: String,
      required: true,
      trim: true,
    },
    available_days: {
      type: String,
      required: true,
      trim: true,
    },
    total_spaces: {
      type: Number,
      required: true,
    },
    price_per_month: {
      type: Number,
      required: true,
    },
    space_owner_id: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    price_per_hour: {
      type: Number,
      required: true,
    },
    price_per_week: {
      type: Number,
      required: true,
    },
  },
  {
    timestamps: true, // createdAt, updatedAt auto
  }
);

export const Spaces = mongoose.models.Spaces || mongoose.model<ISpaces>('Spaces', SpacesSchema);
