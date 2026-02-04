import { SplitResult, ProcessingStatus } from '../types';

// Declare globals for the external libraries loaded in index.html
declare const PDFLib: any;
declare const pdfjsLib: any;

pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

/**
 * Extracts the city name from a PDF page using a regex-based algorithm.
 * Looks specifically at text in the top portion of the page.
 */
async function extractCityFromPage(pdfPage: any): Promise<string> {
  const textContent = await pdfPage.getTextContent();
  const viewport = pdfPage.getViewport({ scale: 1.0 });
  const pageHeight = viewport.height;

  // Pattern: City Name (with accents/spaces) followed by " - " and 2-letter State code
  // Example: "Americana - SP", "Rio de Janeiro - RJ", "São José dos Campos - SP"
  const cityStateRegex = /([A-ZÀ-Ú][a-zà-úA-ZÀ-Ú\s]+)\s?-\s?([A-Z]{2})/;

  // We sort items by vertical position (top to bottom)
  // PDF.js Y-axis usually starts from the bottom, so higher Y means higher in the page
  const items = textContent.items
    .map((item: any) => ({
      text: item.str.trim(),
      y: item.transform[5], // Y coordinate
      x: item.transform[4]  // X coordinate
    }))
    .filter((item: any) => item.text.length > 2)
    .sort((a: any, b: any) => b.y - a.y);

  // We prioritize the top 25% of the page where headers usually reside
  const headerItems = items.filter((item: any) => item.y > pageHeight * 0.70);
  
  // Strategy 1: Look for exact matches in header items
  for (const item of headerItems) {
    const match = item.text.match(cityStateRegex);
    if (match) {
      return match[0].toUpperCase();
    }
  }

  // Strategy 2: Join nearby items on same line (sometimes PDF.js splits "Americana" and " - SP")
  const lines: { [y: number]: string } = {};
  headerItems.forEach((item: any) => {
    // Group by Y with some tolerance (approx 5 units)
    const roundedY = Math.round(item.y / 5) * 5;
    lines[roundedY] = (lines[roundedY] || "") + " " + item.text;
  });

  for (const y in lines) {
    const match = lines[y].match(cityStateRegex);
    if (match) {
      return match[0].trim().toUpperCase();
    }
  }

  // Strategy 3: Search the whole page if not found in header (fallback)
  // Fix: Explicitly type 'i' as any to avoid TS7006 error
  const fullText = items.map((i: any) => i.text).join(" ");
  const fallbackMatch = fullText.match(cityStateRegex);
  if (fallbackMatch) {
    return fallbackMatch[0].toUpperCase();
  }

  return 'DESCONHECIDO';
}

/**
 * Main function to process the PDF using a native algorithm.
 */
export async function processPdf(
  file: File, 
  onStatusUpdate: (status: ProcessingStatus) => void
): Promise<SplitResult[]> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    
    onStatusUpdate({ step: 'extracting', progress: 0, message: 'Lendo conteúdo do PDF...' });

    const pdfJsDoc = await pdfjsLib.getDocument({ 
      data: new Uint8Array(arrayBuffer.slice(0)) 
    }).promise;
    
    const numPages = pdfJsDoc.numPages;
    const cityPages: { [city: string]: number[] } = {};

    // 1. Analyze each page text
    for (let i = 1; i <= numPages; i++) {
      onStatusUpdate({
        step: 'analyzing',
        progress: Math.round((i / numPages) * 100),
        message: `Identificando cidade na página ${i} de ${numPages}...`
      });

      const page = await pdfJsDoc.getPage(i);
      const city = await extractCityFromPage(page);
      
      if (!cityPages[city]) cityPages[city] = [];
      cityPages[city].push(i);
    }

    // 2. Split PDF using PDF-Lib
    onStatusUpdate({ step: 'splitting', progress: 0, message: 'Preparando arquivos separados...' });
    
    const results: SplitResult[] = [];
    const mainPdfDoc = await PDFLib.PDFDocument.load(arrayBuffer.slice(0));
    const cities = Object.keys(cityPages);

    for (let j = 0; j < cities.length; j++) {
      const city = cities[j];
      const pageIndices = cityPages[city];
      
      const newPdfDoc = await PDFLib.PDFDocument.create();
      
      // PDF-Lib uses 0-indexed pages
      const copiedPages = await newPdfDoc.copyPages(mainPdfDoc, pageIndices.map(p => p - 1));
      copiedPages.forEach((page: any) => newPdfDoc.addPage(page));

      const pdfBytes = await newPdfDoc.save();
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);

      results.push({
        cityName: city,
        pdfBlob: blob,
        pdfUrl: url,
        pageCount: pageIndices.length
      });

      onStatusUpdate({
        step: 'splitting',
        progress: Math.round(((j + 1) / cities.length) * 100),
        message: `Finalizado ${city}...`
      });
    }

    onStatusUpdate({ step: 'completed', progress: 100, message: 'Processamento concluído com sucesso!' });
    return results;

  } catch (error: any) {
    console.error('Error processing PDF:', error);
    onStatusUpdate({ step: 'error', progress: 0, message: `Erro ao processar: ${error.message}` });
    throw error;
  }
}