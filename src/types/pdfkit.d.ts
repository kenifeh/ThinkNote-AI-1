declare module 'pdfkit' {
  import { Readable } from 'stream'

  interface PDFDocumentOptions {
    size?: string | [number, number]
    layout?: 'portrait' | 'landscape'
    margins?: {
      top?: number
      bottom?: number
      left?: number
      right?: number
    }
    info?: {
      Title?: string
      Author?: string
      Subject?: string
      Keywords?: string
      CreationDate?: Date
      ModDate?: Date
      Creator?: string
      Producer?: string
    }
  }

  class PDFDocument extends Readable {
    constructor(options?: PDFDocumentOptions)
    
    // Text methods
    fontSize(size: number): this
    text(text: string, options?: any): this
    moveDown(lines?: number): this
    
    // Event handlers
    on(event: 'data', listener: (chunk: Buffer) => void): this
    on(event: 'end', listener: () => void): this
    
    // Finalize
    end(): void
  }

  export = PDFDocument
}
