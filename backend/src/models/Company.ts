/**
 * © Joan Mora — Proprietary. See LICENSE.
 */
import mongoose, { Schema, Document } from 'mongoose';
import type { DataStatus } from '../utils/dataStatus.js';
import { encryptField, decryptField, looksEncrypted } from '../utils/crypto.js';

export interface ICompany extends Document {
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

const companySchema = new Schema<ICompany>(
  {
    name: { type: String, required: true, trim: true, index: true },
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
      index: true,
    },
    manuallyModified: { type: Boolean, default: false },
    sourceUrl: { type: String, default: '' },
    scrapedAt: { type: Date },
  },
  { timestamps: true }
);

companySchema.pre('save', function () {
  if (this.isModified('phone') && this.phone && !looksEncrypted(this.phone)) {
    this.phone = encryptField(this.phone);
  }
});

function decryptPhone(doc: ICompany | null) {
  if (doc?.phone && looksEncrypted(doc.phone)) {
    doc.phone = decryptField(doc.phone);
  }
}

companySchema.post('find', function (docs: ICompany[]) {
  docs.forEach(decryptPhone);
});

companySchema.post('findOne', function (doc: ICompany) {
  decryptPhone(doc);
});

companySchema.post('findOneAndUpdate', function (doc: ICompany) {
  decryptPhone(doc);
});

export const Company = mongoose.model<ICompany>('Company', companySchema);
