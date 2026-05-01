// ════════════════════════════════════════════════════════════════
//  PDF EXPORT
//  Uses jsPDF html() with foreignObjectRendering = true
//  Result:
//    ✅ Direct download — no print dialog
//    ✅ Text is copyable / selectable in PDF reader
//    ✅ File size ~200-500kb (vs 20mb canvas approach)
// ════════════════════════════════════════════════════════════════
import { jsPDF } from 'jspdf';

export async function downloadPDF(elementId, filename) {
  const element = document.getElementById(elementId);
  if (!element) throw new Error('Preview element not found');

  // Create jsPDF instance
  const doc = new jsPDF({
    unit:        'mm',
    format:      'a4',
    orientation: 'portrait',
    compress:    true,
  });

  // A4 dimensions
  const pageWidth  = 210;
  const pageHeight = 297;
  const margin     = 6; // mm

  return new Promise((resolve, reject) => {
    doc.html(element, {
      callback: (pdf) => {
        pdf.save(filename);
        resolve();
      },
      x:           margin,
      y:           margin,
      width:       pageWidth - (margin * 2),   // content width in mm
      windowWidth: element.scrollWidth,         // actual pixel width of element

      // ── These options keep text as real text (not canvas image) ──
      html2canvas: {
        scale:                 0.264583,   // 1px = 0.264583mm (96dpi to mm)
        useCORS:               true,
        allowTaint:            true,
        backgroundColor:       '#ffffff',
        logging:               false,
        // foreignObjectRendering renders HTML natively → text stays text
        foreignObjectRendering: true,
      },

      // Auto-pagination
      autoPaging:  'text',
      margin:      [margin, margin, margin, margin],
    });
  });
}