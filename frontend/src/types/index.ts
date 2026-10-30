/**
 * © Joan Mora — Proprietary. See LICENSE.
 */
export type DataStatus = 'complete' | 'partial' | 'none'

export interface CompanyCard {
  _id: string
  name: string
  address: string
  specialty: string
  phone: string
  website: string
  logoUrl: string
  bannerUrl: string
  links: string[]
  description: string
  highlights: string[]
  dataStatus: DataStatus
  manuallyModified: boolean
  sourceUrl: string
  /** Presente en el directorio unificado (seed vs importación publicada). */
  refType?: 'company' | 'extraction'
  visibility?: 'private' | 'published' | 'both'
}

export interface Extraction extends CompanyCard {
  ownerId: string
  visibility: 'private' | 'published' | 'both'
}

export interface User {
  id: string
  email: string
  name: string
}

export interface ExtractPreview extends Omit<CompanyCard, '_id'> {
  scrapedAt?: string
}

export type SaveMode = 'private' | 'publish' | 'private_and_publish'

export type ImportActivityAction = 'extract_ok' | 'extract_fail' | 'saved' | 'discarded'

export interface ImportActivity {
  _id: string
  action: ImportActivityAction
  sourceUrl: string
  name: string
  detail: string
  mode?: string
  createdAt: string
}
