'use client'

import React from 'react';
import katex from 'katex';
import 'katex/dist/katex.min.css';

export default function KatexRenderer({ content, className = '' }) {
  if (!content) return null;

  // Convert plain text math notation (e.g. lim (x->0), dy/dx, integral) into LaTeX if not already LaTeX
  const formatLatexString = (text) => {
    if (typeof text !== 'string') return String(text ?? '');

    let formatted = text
      .replace(/lim\s*\(\s*x\s*->\s*0\s*\)/gi, '\\lim_{x \\to 0}')
      .replace(/lim\s*_\s*\(\s*x\s*->\s*0\s*\)/gi, '\\lim_{x \\to 0}')
      .replace(/dy\/dx/g, '\\frac{dy}{dx}')
      .replace(/ln\s*\|/g, '\\ln |')
      .replace(/∫/g, '\\int ')
      .replace(/\^\(2\)/g, '^2')
      .replace(/\^\(3\)/g, '^3');

    return formatted;
  };

  const formattedContent = formatLatexString(content);

  const renderMathContent = () => {
    // Split by LaTeX delimiters ($$...$$, $...$, \(...\), \[...\]) or markdown images
    const parts = formattedContent.split(/(!\[[^\]]*\]\([^)]+\)|\$\$[\s\S]*?\$\$|\$[\s\S]*?\$|\\\(.*?\\\)|\\\[.*?\\\])/g);

    return parts.map((part, index) => {
      if (!part) return null;

      // Handle Markdown Images
      const imgMatch = part.match(/^!\[([^\]]*)\]\(([^)]+)\)$/);
      if (imgMatch) {
        return (
          <span key={index} className="block my-3 max-w-full">
            <img 
              src={imgMatch[2]} 
              alt={imgMatch[1] || 'Question Diagram'} 
              className="max-w-full h-auto rounded-lg object-contain mx-auto shadow-xs" 
              loading="lazy"
            />
          </span>
        );
      }

      let isBlock = part.startsWith('$$') || part.startsWith('\\[');
      let isInline = part.startsWith('$') || part.startsWith('\\(');

      if (isBlock || isInline) {
        let mathStr = part
          .replace(/^\$\$|\$\$$/g, '')
          .replace(/^\$|\$$/g, '')
          .replace(/^\\\(|\\\)$/g, '')
          .replace(/^\\\[|\\\]$/g, '')
          .trim();

        try {
          const html = katex.renderToString(mathStr, {
            displayMode: isBlock,
            throwOnError: false
          });
          return (
            <span
              key={index}
              dangerouslySetInnerHTML={{ __html: html }}
              className={
                isBlock
                  ? 'block my-2 max-w-full overflow-x-auto text-center py-1 scrollbar-none'
                  : 'inline-block max-w-full overflow-x-auto align-middle px-0.5 scrollbar-none'
              }
            />
          );
        } catch (e) {
          return <span key={index} className="font-mono text-amber-700 break-all">{part}</span>;
        }
      }

      // Check for standalone LaTeX tokens without delimiters
      if (/\\(lim|frac|int|vec|sqrt|sum|prod|alpha|beta|gamma|theta|lambda|Delta|delta|pi|sigma|omega|Omega|mu|epsilon|rho|tau|phi|psi|nabla|partial|approx|pm|times|cdot|le|ge|neq|in|infty|subset|cap|cup)/.test(part)) {
        try {
          const html = katex.renderToString(part, {
            displayMode: false,
            throwOnError: false
          });
          return (
            <span
              key={index}
              dangerouslySetInnerHTML={{ __html: html }}
              className="inline-block max-w-full overflow-x-auto align-middle px-0.5 scrollbar-none"
            />
          );
        } catch (e) {
          return <span key={index}>{part}</span>;
        }
      }

      return <span key={index}>{part}</span>;
    });
  };

  return (
    <span className={`katex-wrapper inline max-w-full leading-relaxed break-words ${className}`}>
      {renderMathContent()}
    </span>
  );
}
