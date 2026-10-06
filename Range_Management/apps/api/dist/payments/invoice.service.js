"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var InvoiceService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.InvoiceService = void 0;
const common_1 = require("@nestjs/common");
const pdf_lib_1 = require("pdf-lib");
const fs = require("fs");
const path = require("path");
let InvoiceService = InvoiceService_1 = class InvoiceService {
    constructor() {
        this.logger = new common_1.Logger(InvoiceService_1.name);
    }
    async generateAndSendInvoice(payment) {
        try {
            this.logger.log(`Generating invoice for payment ${payment.id}`);
            const pdfDoc = await pdf_lib_1.PDFDocument.create();
            const page = pdfDoc.addPage([600, 800]);
            const font = await pdfDoc.embedFont(pdf_lib_1.StandardFonts.Helvetica);
            page.drawText('Marksman Platform', { x: 50, y: 750, size: 24, font, color: (0, pdf_lib_1.rgb)(0, 0, 0) });
            page.drawText('TAX INVOICE', { x: 400, y: 750, size: 20, font, color: (0, pdf_lib_1.rgb)(0.3, 0.3, 0.3) });
            page.drawText(`Invoice Number: INV-${payment.id.split('-')[0].toUpperCase()}`, { x: 50, y: 700, size: 12, font });
            page.drawText(`Date: ${new Date(payment.createdAt).toLocaleDateString()}`, { x: 50, y: 680, size: 12, font });
            page.drawText('Bill To:', { x: 50, y: 640, size: 14, font });
            page.drawText(`Customer ID: ${payment.userId}`, { x: 50, y: 620, size: 12, font });
            page.drawText('Description', { x: 50, y: 560, size: 12, font });
            page.drawText('Amount', { x: 450, y: 560, size: 12, font });
            page.drawLine({ start: { x: 50, y: 550 }, end: { x: 550, y: 550 }, thickness: 1, color: (0, pdf_lib_1.rgb)(0.8, 0.8, 0.8) });
            page.drawText(payment.relatedType || 'Platform Services', { x: 50, y: 530, size: 12, font });
            page.drawText(`${payment.currency} ${payment.amount.toFixed(2)}`, { x: 450, y: 530, size: 12, font });
            const isGstApplicable = payment.currency === 'INR';
            const taxRate = isGstApplicable ? 0.18 : 0;
            const subtotal = payment.amount / (1 + taxRate);
            const taxAmount = payment.amount - subtotal;
            page.drawLine({ start: { x: 350, y: 480 }, end: { x: 550, y: 480 }, thickness: 1, color: (0, pdf_lib_1.rgb)(0.8, 0.8, 0.8) });
            page.drawText('Subtotal:', { x: 350, y: 460, size: 12, font });
            page.drawText(`${payment.currency} ${subtotal.toFixed(2)}`, { x: 450, y: 460, size: 12, font });
            page.drawText('Tax (GST/VAT):', { x: 350, y: 440, size: 12, font });
            page.drawText(`${payment.currency} ${taxAmount.toFixed(2)}`, { x: 450, y: 440, size: 12, font });
            page.drawText('Total:', { x: 350, y: 410, size: 14, font });
            page.drawText(`${payment.currency} ${payment.amount.toFixed(2)}`, { x: 450, y: 410, size: 14, font });
            const pdfBytes = await pdfDoc.save();
            const outDir = path.join(process.cwd(), 'invoices');
            if (!fs.existsSync(outDir)) {
                fs.mkdirSync(outDir, { recursive: true });
            }
            const outPath = path.join(outDir, `INV-${payment.id}.pdf`);
            fs.writeFileSync(outPath, pdfBytes);
            this.logger.log(`Invoice saved to ${outPath}`);
        }
        catch (error) {
            this.logger.error(`Error generating invoice: ${error.message}`);
        }
    }
};
exports.InvoiceService = InvoiceService;
exports.InvoiceService = InvoiceService = InvoiceService_1 = __decorate([
    (0, common_1.Injectable)()
], InvoiceService);
//# sourceMappingURL=invoice.service.js.map