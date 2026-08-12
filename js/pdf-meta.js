// ============================================================
//  GTU BBA Academic Dashboard — Client-side PDF Meta Extractor
//  Extracts PDF File Name & Total Page Count from File object.
//  Does NOT store binary PDF content.
// ============================================================

const PdfMeta = (() => {

  /**
   * Fast client-side page count scanner using ArrayBuffer regex search
   * Scans PDF byte stream for /Count N tags in catalog dictionary.
   */
  async function extractMeta(file) {
    if (!file) return null;

    const fileName = file.name;
    let pageCount = null;

    try {
      const buffer = await readFileAsArrayBuffer(file);
      pageCount = parsePageCountFromBuffer(buffer);
    } catch (err) {
      console.warn('PDF page count extraction notice:', err);
    }

    return {
      fileName,
      pageCount: (pageCount && pageCount > 0) ? pageCount : null
    };
  }

  function readFileAsArrayBuffer(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => reject(reader.error);
      reader.readAsArrayBuffer(file);
    });
  }

  function parsePageCountFromBuffer(buffer) {
    const bytes = new Uint8Array(buffer);
    let str = '';
    
    // Read chunks from beginning and end of file where catalog/trailer info lives
    const chunkSize = Math.min(bytes.length, 500000); // 500KB chunk
    
    // Decode start chunk
    for (let i = 0; i < chunkSize; i++) {
      str += String.fromCharCode(bytes[i]);
    }
    
    // Decode tail chunk if file is larger
    if (bytes.length > chunkSize) {
      const tailStart = bytes.length - chunkSize;
      for (let i = tailStart; i < bytes.length; i++) {
        str += String.fromCharCode(bytes[i]);
      }
    }

    // Pattern 1: Search for /Type /Pages /Count N
    const pagesCountMatch = str.match(/\/Type\s*\/Pages[\s\S]*?\/Count\s+(\d+)/i);
    if (pagesCountMatch && pagesCountMatch[1]) {
      return parseInt(pagesCountMatch[1], 10);
    }

    // Pattern 2: Search for /Count N in dictionary
    const matches = [...str.matchAll(/\/Count\s+(\d+)/gi)];
    if (matches.length > 0) {
      // Find the maximum /Count number found in catalog headers
      const counts = matches.map(m => parseInt(m[1], 10)).filter(n => !isNaN(n) && n > 0 && n < 5000);
      if (counts.length) {
        return Math.max(...counts);
      }
    }

    // Pattern 3: Count /Type /Page instances
    const pageMatches = str.match(/\/Type\s*\/Page\b/gi);
    if (pageMatches && pageMatches.length > 0) {
      return pageMatches.length;
    }

    return null;
  }

  return {
    extractMeta
  };
})();
