import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
  fullName: string;
  email: string;
  role: string;
  bio?: string;
  spaces: { id: string }[];
  avatarUrl?: string;
  stripeCustomerId: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    fullName: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    role: {
      type: String,
      required: true,
    },
    bio: {
      type: String,
    },
    spaces: [{ id: String }],
    avatarUrl: {
      type: String,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    stripeCustomerId: {
      type: String
    }
  },
  {
    timestamps: true, // adds createdAt and updatedAt automatically
  }
);

export const User =
  mongoose.models.User || mongoose.model<IUser>('User', UserSchema);
