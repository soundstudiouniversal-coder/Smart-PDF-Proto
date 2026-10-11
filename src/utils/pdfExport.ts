import { jsPDF } from 'jspdf';
import { SavedNote } from '../types';

export function exportNotesToPdf(notes: SavedNote[], documentTitle: string) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'pt',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 40;
  const contentWidth = pageWidth - margin * 2;
  let y = 50;

  const checkPageBreak = (neededHeight: number) => {
    if (y + neededHeight > pageHeight - 50) {
      doc.addPage();
      y = 50;
      renderHeaderFooter();
    }
  };

  const renderHeaderFooter = () => {
    // Mini header rule
    doc.setDrawColor(226, 232, 240);
    doc.line(margin, 35, pageWidth - margin, 35);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text('Smart PDF Analyzer • Student Revision Notes', margin, 30);
  };

  // Main Cover / Top Title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.setTextColor(15, 23, 42);
  doc.text(documentTitle, margin, y);
  y += 24;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(100, 116, 139);
  doc.text(
    `AI Study Notes & High-Yield Exam Revision • Generated ${new Date().toLocaleDateString()} (${notes.length} Sections)`,
    margin,
    y
  );
  y += 20;

  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(1);
  doc.line(margin, y, pageWidth - margin, y);
  y += 25;

  if (notes.length === 0) {
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(11);
    doc.setTextColor(148, 163, 184);
    doc.text('No study notes recorded yet. Read paragraphs with Smart PDF Analyzer to generate notes!', margin, y);
    doc.save(`${documentTitle.replace(/\s+/g, '_')}_Study_Notes.pdf`);
    return;
  }

  // Group notes by subtopic
  const grouped = new Map<string, SavedNote[]>();
  for (const note of notes) {
    const key = note.subtopic || 'General Topic';
    if (!grouped.has(key)) {
      grouped.set(key, []);
    }
    grouped.get(key)!.push(note);
  }

  grouped.forEach((topicNotes, topicTitle) => {
    checkPageBreak(50);

    // Subtopic Header Box
    doc.setFillColor(241, 245, 249);
    doc.roundedRect(margin, y - 12, contentWidth, 24, 4, 4, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(30, 58, 138);
    doc.text(topicTitle, margin + 8, y + 4);
    y += 26;

    for (const note of topicNotes) {
      checkPageBreak(90);

      // Note Header (Page & Star)
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(71, 85, 105);
      const starTag = note.starred ? '★ HIGH-YIELD EXAM PRIORITY • ' : '';
      doc.text(`${starTag}Page ${note.pageNumber} Context`, margin, y);
      y += 14;

      // Simple Explanation
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(100, 116, 139);
      doc.text('SIMPLE EXPLANATION:', margin, y);
      y += 12;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9.5);
      doc.setTextColor(30, 41, 59);
      const explLines = doc.splitTextToSize(note.explanation, contentWidth);
      checkPageBreak(explLines.length * 12 + 10);
      doc.text(explLines, margin, y);
      y += explLines.length * 12 + 10;

      // Key Terms
      if (note.keyTerms && note.keyTerms.length > 0) {
        checkPageBreak(30);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9);
        doc.setTextColor(15, 118, 110);
        doc.text('KEY TERMS & DEFINITIONS:', margin, y);
        y += 12;

        for (const term of note.keyTerms) {
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(9);
          doc.setTextColor(15, 23, 42);
          const termPrefix = `• ${term.term}: `;
          doc.text(termPrefix, margin + 8, y);

          const prefixWidth = doc.getTextWidth(termPrefix);
          doc.setFont('helvetica', 'normal');
          doc.setTextColor(51, 65, 85);

          const meaningLines = doc.splitTextToSize(term.meaning, contentWidth - prefixWidth - 10);
          checkPageBreak(meaningLines.length * 11 + 6);
          doc.text(meaningLines, margin + 8 + prefixWidth, y);
          y += meaningLines.length * 11 + 4;
        }
        y += 6;
      }

      // Exam Notes Bullets
      if (note.examNotes && note.examNotes.length > 0) {
        checkPageBreak(30);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9);
        doc.setTextColor(194, 65, 12);
        doc.text('EXAM NOTES & HIGH-YIELD POINTS:', margin, y);
        y += 12;

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        doc.setTextColor(30, 41, 59);

        for (const bullet of note.examNotes) {
          const bulletLines = doc.splitTextToSize(`✓  ${bullet}`, contentWidth - 8);
          checkPageBreak(bulletLines.length * 11 + 4);
          doc.text(bulletLines, margin + 8, y);
          y += bulletLines.length * 11 + 3;
        }
        y += 6;
      }

      // Exam Q&A Box
      if (note.examQuestion?.question) {
        checkPageBreak(50);
        doc.setFillColor(254, 243, 199);
        doc.setDrawColor(245, 158, 11);
        doc.setLineWidth(0.5);

        const qLines = doc.splitTextToSize(`Q: ${note.examQuestion.question}`, contentWidth - 16);
        const aLines = doc.splitTextToSize(`A: ${note.examQuestion.answer}`, contentWidth - 16);
        const boxHeight = (qLines.length + aLines.length) * 11 + 18;

        checkPageBreak(boxHeight);
        doc.roundedRect(margin, y - 8, contentWidth, boxHeight, 3, 3, 'FD');

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8.5);
        doc.setTextColor(146, 64, 14);
        doc.text(qLines, margin + 8, y + 4);

        doc.setFont('helvetica', 'normal');
        doc.setTextColor(120, 53, 15);
        doc.text(aLines, margin + 8, y + 4 + qLines.length * 11 + 4);

        y += boxHeight + 10;
      }

      // Divider line between paragraphs
      checkPageBreak(15);
      doc.setDrawColor(241, 245, 249);
      doc.setLineWidth(0.5);
      doc.line(margin, y, pageWidth - margin, y);
      y += 16;
    }
  });

  // Number all pages at the end
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text(`Page ${i} of ${totalPages}`, pageWidth - margin - 50, pageHeight - 20);
  }

  const safeFilename = `${documentTitle.replace(/[^a-zA-Z0-9_-]/g, '_')}_Exam_Notes.pdf`;
  doc.save(safeFilename);
}

export function copyNotesAsMarkdown(notes: SavedNote[], documentTitle: string): string {
  let md = `# ${documentTitle} - Study & Exam Notes\n\n`;
  md += `*Generated with Smart PDF Analyzer on ${new Date().toLocaleDateString()}*\n\n`;

  const grouped = new Map<string, SavedNote[]>();
  for (const note of notes) {
    const key = note.subtopic || 'General Topic';
    if (!grouped.has(key)) {
      grouped.set(key, []);
    }
    grouped.get(key)!.push(note);
  }

  grouped.forEach((topicNotes, topicTitle) => {
    md += `## ${topicTitle}\n\n`;

    for (const note of topicNotes) {
      const star = note.starred ? ' ⭐ [High-Yield Exam Focus]' : '';
      md += `### Page ${note.pageNumber} Notes${star}\n\n`;

      if (note.paragraphSnippet) {
        md += `> "${note.paragraphSnippet.slice(0, 180)}..."\n\n`;
      }

      md += `#### 💡 Simple Explanation\n${note.explanation}\n\n`;

      if (note.keyTerms.length > 0) {
        md += `#### 🔑 Key Terms\n`;
        note.keyTerms.forEach((k) => {
          md += `- **${k.term}**: ${k.meaning}\n`;
        });
        md += `\n`;
      }

      if (note.examNotes.length > 0) {
        md += `#### 📝 Exam Notes\n`;
        note.examNotes.forEach((point) => {
          md += `- ${point}\n`;
        });
        md += `\n`;
      }

      if (note.examQuestion?.question) {
        md += `#### 🎯 Likely Exam Question\n`;
        md += `**Q:** ${note.examQuestion.question}\n\n`;
        md += `**Model Answer:** ${note.examQuestion.answer}\n\n`;
      }

      md += `---\n\n`;
    }
  });

  return md;
}
