import * as pdfjsLib from 'pdfjs-dist';
import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import { BoundingBox, LineItem, ParagraphItem, SubtopicHeading } from '../types';

// Set up worker source
if (typeof window !== 'undefined') {
  try {
    pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;
  } catch (err) {
    console.warn('Could not set worker from import url, using CDN fallback', err);
    pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version || '4.0.379'}/pdf.worker.min.mjs`;
  }
}

interface RawTextItem {
  str: string;
  left: number;
  top: number;
  right: number;
  bottom: number;
  height: number;
  width: number;
  fontSize: number;
}

interface RawLine {
  items: RawTextItem[];
  minLeft: number;
  maxRight: number;
  minTop: number;
  maxBottom: number;
  avgHeight: number;
  text: string;
}

export interface ExtractedPdfResult {
  pdfDoc: any;
  numPages: number;
  lines: LineItem[];
  paragraphs: ParagraphItem[];
  subtopics: SubtopicHeading[];
  fullText: string;
  title: string;
}

export async function extractPdfData(
  input: File | ArrayBuffer | Uint8Array,
  fileName?: string
): Promise<ExtractedPdfResult> {
  let arrayBuffer: ArrayBuffer;
  if (input instanceof File) {
    arrayBuffer = await input.arrayBuffer();
  } else if (input instanceof Uint8Array) {
    arrayBuffer = input.buffer as ArrayBuffer;
  } else {
    arrayBuffer = input;
  }

  const loadingTask = pdfjsLib.getDocument({ data: new Uint8Array(arrayBuffer) });
  const pdfDoc = await loadingTask.promise;
  const numPages = pdfDoc.numPages;

  const allLines: LineItem[] = [];
  const allParagraphs: ParagraphItem[] = [];
  const allSubtopics: SubtopicHeading[] = [];
  let fullText = '';
  let globalLineIndex = 0;
  let globalParaIndex = 0;

  let currentSubtopicTitle = '1. Introduction & Overview';
  const detectedDocumentTitle = fileName ? fileName.replace(/\.pdf$/i, '') : 'Study Document';

  for (let pageNum = 1; pageNum <= numPages; pageNum++) {
    const page = await pdfDoc.getPage(pageNum);
    const viewport = page.getViewport({ scale: 1.0 });
    const textContent = await page.getTextContent();

    const rawItems: RawTextItem[] = [];

    for (const item of textContent.items) {
      if (!('str' in item)) continue;
      const str = item.str;
      if (!str || str.trim() === '') continue;

      const tx = item.transform[4];
      const ty = item.transform[5];
      const fontHeight = Math.hypot(item.transform[2], item.transform[3]) || item.height || 12;
      const width = item.width || 8;

      // In PDF coordinate space, ty is from bottom. Convert to viewport
      const [vx, vy] = viewport.convertToViewportPoint(tx, ty);

      const left = vx;
      const top = Math.max(0, vy - fontHeight);
      const right = vx + width;
      const bottom = vy + 2;

      rawItems.push({
        str,
        left,
        top,
        right,
        bottom,
        height: fontHeight,
        width,
        fontSize: fontHeight,
      });
    }

    if (rawItems.length === 0) continue;

    // Calculate median font size for heading detection
    const fontSizes = rawItems.map((r) => r.fontSize).sort((a, b) => a - b);
    const medianFontSize = fontSizes[Math.floor(fontSizes.length / 2)] || 12;

    // Sort items top-to-bottom, left-to-right
    rawItems.sort((a, b) => {
      if (Math.abs(a.top - b.top) > 5) {
        return a.top - b.top;
      }
      return a.left - b.left;
    });

    // 1. Group items into LINES
    const rawLines: RawLine[] = [];
    let currentLineItems: RawTextItem[] = [];
    let lineCenterY = 0;
    let lineAvgHeight = 12;

    for (const item of rawItems) {
      const itemCenterY = (item.top + item.bottom) / 2;
      if (currentLineItems.length === 0) {
        currentLineItems = [item];
        lineCenterY = itemCenterY;
        lineAvgHeight = item.height;
      } else {
        const threshold = Math.max(lineAvgHeight, item.height) * 0.48;
        if (Math.abs(itemCenterY - lineCenterY) <= threshold) {
          currentLineItems.push(item);
          lineCenterY =
            currentLineItems.reduce((acc, it) => acc + (it.top + it.bottom) / 2, 0) /
            currentLineItems.length;
          lineAvgHeight =
            currentLineItems.reduce((acc, it) => acc + it.height, 0) /
            currentLineItems.length;
        } else {
          // Finalize line
          finalizeLine(currentLineItems, rawLines);
          currentLineItems = [item];
          lineCenterY = itemCenterY;
          lineAvgHeight = item.height;
        }
      }
    }

    if (currentLineItems.length > 0) {
      finalizeLine(currentLineItems, rawLines);
    }

    // Sort lines strictly from top to bottom
    rawLines.sort((a, b) => a.minTop - b.minTop);

    // Filter out empty lines
    const validLines = rawLines.filter((l) => l.text.trim().length > 0);
    if (validLines.length === 0) continue;

    // 2. Group LINES into PARAGRAPHS
    // Calculate typical vertical line spacing
    const gaps: number[] = [];
    for (let i = 1; i < validLines.length; i++) {
      const gap = validLines[i].minTop - validLines[i - 1].maxBottom;
      if (gap >= 0 && gap < 50) {
        gaps.push(gap);
      }
    }
    gaps.sort((a, b) => a - b);
    const medianGap = gaps.length > 0 ? gaps[Math.floor(gaps.length / 2)] : 6;

    let currentParaLines: RawLine[] = [];

    const flushCurrentParagraph = () => {
      if (currentParaLines.length === 0) return;

      const paraId = `para-${globalParaIndex}`;
      const paraText = currentParaLines.map((l) => l.text).join(' ').trim();

      // Check if this paragraph itself is a section heading
      const firstLine = currentParaLines[0];
      const isHeading =
        (firstLine.avgHeight >= medianFontSize * 1.25 ||
          /^(Chapter|Section|Unit|Part|\d+(\.\d+)*)\s+/i.test(firstLine.text) ||
          (/^[A-Z0-9\s:—–-]{3,60}$/.test(firstLine.text) && firstLine.text.length < 50)) &&
        currentParaLines.length <= 2;

      if (isHeading && firstLine.text.trim().length > 3) {
        currentSubtopicTitle = firstLine.text.trim();
        allSubtopics.push({
          id: `subtopic-${allSubtopics.length}`,
          title: currentSubtopicTitle,
          pageNumber: pageNum,
          paragraphId: paraId,
        });
      }

      // Compute paragraph bounding box
      const minLeft = Math.min(...currentParaLines.map((l) => l.minLeft));
      const maxRight = Math.max(...currentParaLines.map((l) => l.maxRight));
      const minTop = Math.min(...currentParaLines.map((l) => l.minTop));
      const maxBottom = Math.max(...currentParaLines.map((l) => l.maxBottom));

      const paraBox: BoundingBox = {
        leftPercent: Math.max(0, (minLeft / viewport.width) * 100),
        topPercent: Math.max(0, (minTop / viewport.height) * 100),
        widthPercent: Math.min(100, ((maxRight - minLeft) / viewport.width) * 100),
        heightPercent: Math.min(100, ((maxBottom - minTop) / viewport.height) * 100),
      };

      const lineIds: string[] = [];

      for (const line of currentParaLines) {
        const lineId = `line-${globalLineIndex++}`;
        lineIds.push(lineId);

        const lineBox: BoundingBox = {
          leftPercent: Math.max(0, (line.minLeft / viewport.width) * 100),
          topPercent: Math.max(0, (line.minTop / viewport.height) * 100),
          widthPercent: Math.min(100, ((line.maxRight - line.minLeft) / viewport.width) * 100),
          heightPercent: Math.min(100, ((line.maxBottom - line.minTop) / viewport.height) * 100),
        };

        allLines.push({
          id: lineId,
          pageNumber: pageNum,
          paragraphId: paraId,
          lineIndex: allLines.length,
          lineText: line.text,
          box: lineBox,
        });
      }

      allParagraphs.push({
        id: paraId,
        pageNumber: pageNum,
        paragraphIndex: globalParaIndex,
        text: paraText,
        lineIds,
        subtopicHeading: currentSubtopicTitle,
        box: paraBox,
      });

      fullText += (fullText ? '\n\n' : '') + paraText;
      globalParaIndex++;
      currentParaLines = [];
    };

    for (let i = 0; i < validLines.length; i++) {
      const line = validLines[i];

      if (currentParaLines.length === 0) {
        currentParaLines.push(line);
        continue;
      }

      const prevLine = currentParaLines[currentParaLines.length - 1];
      const gap = line.minTop - prevLine.maxBottom;

      const isBulletOrNumber = /^(\s*[-•*]|\s*\d+[\.\)]|\s*[a-zA-Z][\.\)])\s+/.test(line.text);
      const isBigFont = line.avgHeight >= medianFontSize * 1.25;
      const isLargeGap = gap > Math.max(medianGap * 1.45, 12);
      const prevEndsWithPeriod = /[.?!:]\s*$/.test(prevLine.text);

      if (isLargeGap || isBulletOrNumber || isBigFont || (prevEndsWithPeriod && gap > medianGap * 1.15)) {
        flushCurrentParagraph();
      }

      currentParaLines.push(line);
    }

    if (currentParaLines.length > 0) {
      flushCurrentParagraph();
    }
  }

  // Ensure there is at least one subtopic in the outline
  if (allSubtopics.length === 0 && allParagraphs.length > 0) {
    allSubtopics.push({
      id: 'subtopic-0',
      title: detectedDocumentTitle,
      pageNumber: 1,
      paragraphId: allParagraphs[0].id,
    });

    // If there are multiple pages, add page anchors
    for (let p = 2; p <= numPages; p++) {
      const firstParaOnPage = allParagraphs.find((para) => para.pageNumber === p);
      if (firstParaOnPage) {
        allSubtopics.push({
          id: `subtopic-page-${p}`,
          title: `Page ${p} Overview`,
          pageNumber: p,
          paragraphId: firstParaOnPage.id,
        });
      }
    }
  }

  return {
    pdfDoc,
    numPages,
    lines: allLines,
    paragraphs: allParagraphs,
    subtopics: allSubtopics,
    fullText,
    title: detectedDocumentTitle,
  };
}

function finalizeLine(items: RawTextItem[], rawLines: RawLine[]) {
  if (items.length === 0) return;

  // Sort items in this line horizontally
  items.sort((a, b) => a.left - b.left);

  let combinedText = '';
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    if (i === 0) {
      combinedText = item.str;
    } else {
      const prevItem = items[i - 1];
      const horizontalGap = item.left - prevItem.right;
      // If gap is greater than 2px and neither item has trailing/leading space, add space
      if (horizontalGap > 2.5 && !prevItem.str.endsWith(' ') && !item.str.startsWith(' ')) {
        combinedText += ' ' + item.str;
      } else {
        combinedText += item.str;
      }
    }
  }

  const minLeft = Math.min(...items.map((it) => it.left));
  const maxRight = Math.max(...items.map((it) => it.right));
  const minTop = Math.min(...items.map((it) => it.top));
  const maxBottom = Math.max(...items.map((it) => it.bottom));
  const avgHeight = items.reduce((acc, it) => acc + it.height, 0) / items.length;

  rawLines.push({
    items,
    minLeft,
    maxRight,
    minTop,
    maxBottom,
    avgHeight,
    text: combinedText.replace(/\s+/g, ' ').trim(),
  });
}
