/**
 * © Joan Mora — Proprietary. See LICENSE.
 */
import mongoose, { Schema, Document, Types } from 'mongoose';
import type { DataStatus } from '../utils/dataStatus.js';
import { encryptField, decryptField, looksEncrypted } from '../utils/crypto.js';

export type Visibility = 'private' | 'published' | 'both';

export interface IExtraction extends Document {
  ownerId: Types.ObjectId;
  visibility: Visibility;
  name: string;
  address: string;
  specialty: string;
  phone: string;
  website: string;
  logoUrl: string;
  bannerUrl: string;
  links: string[];
  description: string;
  highlights: string[];
  dataStatus: DataStatus;
  manuallyModified: boolean;
  sourceUrl: string;
  scrapedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const extractionSchema = new Schema<IExtraction>(
  {
    ownerId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    visibility: {
      type: String,
      enum: ['private', 'published', 'both'],
      default: 'private',
      index: true,
    },
    name: { type: String, required: true, trim: true },
    address: { type: String, default: '' },
    specialty: { type: String, default: '' },
    phone: { type: String, default: '' },
    website: { type: String, default: '' },
    logoUrl: { type: String, default: '' },
    bannerUrl: { type: String, default: '' },
    links: { type: [String], default: [] },
    description: { type: String, default: '' },
    highlights: { type: [String], default: [] },
    dataStatus: {
      type: String,
      enum: ['complete', 'partial', 'none'],
      default: 'none',
    },
    manuallyModified: { type: Boolean, default: false },
    sourceUrl: { type: String, default: '' },
    scrapedAt: { type: Date },
  },
  { timestamps: true }
);

extractionSchema.pre('save', function () {
  if (this.isModified('phone') && this.phone && !looksEncrypted(this.phone)) {
    this.phone = encryptField(this.phone);
  }
});

function decryptPhone(doc: IExtraction | null) {
  if (doc?.phone && looksEncrypted(doc.phone)) {
    doc.phone = decryptField(doc.phone);
  }
}

extractionSchema.post('find', function (docs: IExtraction[]) {
  docs.forEach(decryptPhone);
});

extractionSchema.post('findOne', function (doc: IExtraction) {
  decryptPhone(doc);
});

extractionSchema.post('findOneAndUpdate', function (doc: IExtraction) {
  decryptPhone(doc);
});

export const Extraction = mongoose.model<IExtraction>('Extraction', extractionSchema);
