import mongoose, { Schema, Document } from 'mongoose';

export interface IReview extends Document {
    space_id: string;
    user_id: string;
    rating: number;
    comment?: string;
    createdAt: Date;  // MongoDB style
    updatedAt: Date;  // added for completeness
}

const ReviewSchema = new Schema<IReview>(
    {
        space_id: {
            type: String,
            required: true,
        },
        user_id: {
            type: String,
            required: true,
        },
        rating: {
            type: Number,
            required: true,
            min: 1,
            max: 5,
        },
        comment: {
            type: String,
            trim: true,
        },
    },
    {
        timestamps: true, // adds createdAt and updatedAt automatically
    }
);

export const Review = mongoose.models.Review || mongoose.model<IReview>('Review', ReviewSchema);
