/**
 * © Joan Mora — Proprietary. See LICENSE.
 */
import mongoose, { Schema, Document, Types } from 'mongoose';

export type ImportActivityAction = 'extract_ok' | 'extract_fail' | 'saved' | 'discarded';

export interface IImportActivity extends Document {
  ownerId: Types.ObjectId;
  action: ImportActivityAction;
  sourceUrl: string;
  name: string;
  detail: string;
  mode?: string;
  createdAt: Date;
  updatedAt: Date;
}

const importActivitySchema = new Schema<IImportActivity>(
  {
    ownerId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    action: {
      type: String,
      enum: ['extract_ok', 'extract_fail', 'saved', 'discarded'],
      required: true,
      index: true,
    },
    sourceUrl: { type: String, default: '' },
    name: { type: String, default: '' },
    detail: { type: String, default: '' },
    mode: { type: String, default: '' },
  },
  { timestamps: true }
);

importActivitySchema.index({ ownerId: 1, createdAt: -1 });

export const ImportActivity = mongoose.model<IImportActivity>(
  'ImportActivity',
  importActivitySchema
);
