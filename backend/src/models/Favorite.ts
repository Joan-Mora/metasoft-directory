/**
 * © Joan Mora — Proprietary. See LICENSE.
 */
import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IFavorite extends Document {
  userId: Types.ObjectId;
  refType: 'company' | 'extraction';
  refId: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const favoriteSchema = new Schema<IFavorite>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    refType: { type: String, enum: ['company', 'extraction'], required: true },
    refId: { type: Schema.Types.ObjectId, required: true },
  },
  { timestamps: true }
);

favoriteSchema.index({ userId: 1, refType: 1, refId: 1 }, { unique: true });

export const Favorite = mongoose.model<IFavorite>('Favorite', favoriteSchema);
