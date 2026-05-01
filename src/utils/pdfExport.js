// ════════════════════════════════════════════════════════════════
//  PDF EXPORT  —  Uses browser print engine (not canvas)
//  Result: copyable text + tiny file size (100-300kb vs 20mb)
// ════════════════════════════════════════════════════════════════

export function downloadPDF(filename) {
  return new Promise((resolve, reject) => {
    // Get the invoice HTML content
    const sourceEl = document.getElementById('invoice-preview-content');
    if (!sourceEl) { reject(new Error('Preview element not found')); return; }

    // Clone the HTML so we don't disturb the live preview
    const cloned = sourceEl.cloneNode(true);

    // Collect ALL stylesheets from the current page
    const styles = Array.from(document.styleSheets)
      .map(sheet => {
        try {
          return Array.from(sheet.cssRules)
            .map(rule => rule.cssText)
            .join('\n');
        } catch {
          // Cross-origin stylesheets — link them instead
          return sheet.href
            ? `@import url('${sheet.href}');`
            : '';
        }
      })
      .join('\n');

    // Build a complete HTML document for printing
    const printHTML = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8" />
          <title>${filename}</title>
          <style>
            /* ── Reset for print ── */
            * { box-sizing: border-box; margin: 0; padding: 0; }

            /* ── Page setup ── */
            @page {
              size: A4 portrait;
              margin: 6mm;
            }

            @media print {
              html, body {
                width: 210mm;
                height: auto;
                background: #fff;
              }

              /* Remove app chrome — only invoice content */
              body > * { display: none; }
              body > #print-root { display: block; }

              /* Force page breaks between .inv-page divs */
              .inv-page {
                page-break-after: always;
                break-after: page;
                border: 1.5px solid #000 !important;
                width: 100% !important;
                height: auto !important;
                min-height: unset !important;
                overflow: visible !important;
              }

              .inv-page:last-child {
                page-break-after: avoid;
                break-after: avoid;
              }
            }

            /* ── All existing styles ── */
            ${styles}

            /* ── Overrides for print accuracy ── */
            body {
              font-family: Arial, sans-serif;
              background: #fff;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }

            #print-root {
              width: 100%;
            }

            .inv-page {
              width: 100% !important;
              height: auto !important;
              min-height: unset !important;
              overflow: visible !important;
              display: flex;
              flex-direction: column;
            }

            /* Items table must not clip in print */
            .items-tbl {
              flex: unset !important;
              display: table !important;
              width: 100% !important;
            }

            .items-tbl thead {
              display: table-header-group !important;
            }

            .items-tbl tbody {
              display: table-row-group !important;
              flex: unset !important;
            }

            .stretch-row {
              display: table-row !important;
              flex: unset !important;
              height: 20mm;
            }

            .item-row,
            .discount-row,
            .gst-line-row,
            .total-row {
              display: table-row !important;
            }
          </style>
        </head>
        <body>
          <div id="print-root">
            ${cloned.outerHTML}
          </div>
        </body>
      </html>
    `;

    // Create a hidden iframe
    const iframe = document.createElement('iframe');
    iframe.style.cssText = 'position:fixed;top:-9999px;left:-9999px;width:210mm;height:297mm;border:none;';
    document.body.appendChild(iframe);

    iframe.onload = () => {
      try {
        const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
        iframeDoc.open();
        iframeDoc.write(printHTML);
        iframeDoc.close();

        // Wait for fonts/images to load inside iframe
        iframe.contentWindow.onafterprint = () => {
          document.body.removeChild(iframe);
          resolve();
        };

        setTimeout(() => {
          try {
            // Trigger print dialog — user saves as PDF
            iframe.contentWindow.focus();
            iframe.contentWindow.print();

            // Cleanup after delay in case onafterprint doesn't fire
            setTimeout(() => {
              if (document.body.contains(iframe)) {
                document.body.removeChild(iframe);
              }
              resolve();
            }, 2000);
          } catch (err) {
            document.body.removeChild(iframe);
            reject(err);
          }
        }, 800);

      } catch (err) {
        if (document.body.contains(iframe)) document.body.removeChild(iframe);
        reject(err);
      }
    };

    // Trigger iframe load
    iframe.src = 'about:blank';
  });
}