// ════════════════════════════════════════════════════════════════
//  PDF EXPORT — jsPDF + html2canvas
//  Direct download, no print dialog
// ════════════════════════════════════════════════════════════════

export async function downloadPDF(elementId, filename) {
  const element = document.getElementById(elementId);
  if (!element) throw new Error('Preview element not found');

  // Dynamically import to keep bundle small
  const [{ jsPDF }, html2canvas] = await Promise.all([
    import('jspdf'),
    import('html2canvas').then(m => m.default),
  ]);

  const pdf        = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait', compress: true });
  const pageWidth  = 210;
  const pageHeight = 297;
  const margin     = 5;
  const usableWidth  = pageWidth  - margin * 2;
  const usableHeight = pageHeight - margin * 2;

  // Get all .inv-page divs (one per page)
  const pages = element.querySelectorAll('.inv-page');
  const targets = pages.length > 0 ? Array.from(pages) : [element];

  for (let i = 0; i < targets.length; i++) {
    if (i > 0) pdf.addPage();

    const target = targets[i];

    // Temporarily make visible and positioned for capture
    const canvas = await html2canvas(target, {
      scale:           2,
      useCORS:         true,
      allowTaint:      false,
      backgroundColor: '#ffffff',
      logging:         false,
      // Remove all image sources that could cause base64 errors
      ignoreElements:  (el) => {
        // Skip any element that has a broken image
        if (el.tagName === 'IMG') return true;
        return false;
      },
      onclone: (clonedDoc) => {
        // Fix any blob/data URLs that cause atob errors
        const imgs = clonedDoc.querySelectorAll('img');
        imgs.forEach(img => {
          if (img.src && !img.src.startsWith('http')) {
            img.remove();
          }
        });
        // Ensure the cloned page is visible
        const clonedEl = clonedDoc.querySelector('.inv-page') || clonedDoc.body.firstChild;
        if (clonedEl) {
          clonedEl.style.height = 'auto';
          clonedEl.style.overflow = 'visible';
        }
      },
    });

    const imgData     = canvas.toDataURL('image/jpeg', 0.7);  // 0.7 quality = small size
    const imgWidth    = usableWidth;
    const imgHeight   = (canvas.height * usableWidth) / canvas.width;

    // If single page content is taller than A4, split it
    if (imgHeight <= usableHeight) {
      pdf.addImage(imgData, 'JPEG', margin, margin, imgWidth, imgHeight, '', 'FAST');
    } else {
      // Content taller than one page — tile it across pages
      let yOffset     = 0;
      const srcHeight = (usableHeight * canvas.width) / usableWidth;

      while (yOffset < canvas.height) {
        if (yOffset > 0) pdf.addPage();

        const tileCanvas = document.createElement('canvas');
        tileCanvas.width  = canvas.width;
        tileCanvas.height = Math.min(srcHeight, canvas.height - yOffset);
        const ctx = tileCanvas.getContext('2d');
        ctx.drawImage(canvas, 0, -yOffset);

        const tileData   = tileCanvas.toDataURL('image/jpeg', 0.7);
        const tileHeight = (tileCanvas.height * usableWidth) / canvas.width;
        pdf.addImage(tileData, 'JPEG', margin, margin, imgWidth, tileHeight, '', 'FAST');
        yOffset += srcHeight;
      }
    }
  }

  pdf.save(filename);
}