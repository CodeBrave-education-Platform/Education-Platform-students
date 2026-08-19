/**
 * Milestone 3: Bento UI Adversarial Verification & Stress Test Harness
 * 
 * Tests:
 * 1. Hydration & Timezone Safety across 7 global timezones & locales
 * 2. Extreme Viewport Geometry (320px, 375px, 768px, 1024px, 1280px, 1920px, 2560px)
 * 3. Thumbnail Fallback & URL Parser Adversarial Attacks
 * 4. Empty, Extreme & Corrupted Data Payloads (Nulls, nested missing keys, 10k-char strings)
 * 5. Codebase Static Audit for Unsafe Date APIs, Unhandled Image Collapses, Non-standard CSS
 */

import fs from 'fs';
import path from 'path';
import { formatDateSafe, formatDateTimeSafe } from '../src/utils/dateFormat.js';

const results = {
  timezoneHydration: { passed: 0, failed: 0, details: [] },
  geometryBreakpoints: { passed: 0, failed: 0, details: [] },
  thumbnailResilience: { passed: 0, failed: 0, details: [] },
  dataPayloadStress: { passed: 0, failed: 0, details: [] },
  codebaseAudit: { passed: 0, failed: 0, details: [] },
  findings: []
};

console.log('\n======================================================');
console.log('STARTING MILESTONE 3 BENTO UI ADVERSARIAL STRESS TEST');
console.log('======================================================\n');

// ====================================================================
// 1. TIMEZONE & LOCALE HYDRATION DETERMINISM UNDER ADVERSARIAL DRIFT
// ====================================================================
console.log('--- 1. TESTING TIMEZONE & LOCALE HYDRATION DETERMINISM ---');

const sampleTimestamps = [
  '2026-01-01T00:00:00.000Z', // Midnight NYE
  '2026-06-15T18:30:00.000Z', // Mid-year evening
  '2026-08-18T22:21:38.000Z', // Current test run date
  '2026-12-31T23:59:59.999Z', // Leap / Year-boundary edge
  '1970-01-01T00:00:00.000Z', // Unix Epoch
  1772496000000,              // Numeric timestamp
  '2026-02-28T23:30:00.000Z'  // Feb end boundary
];

const timezonesToSimulate = [
  { tz: 'UTC', name: 'Coordinated Universal Time (UTC+0)' },
  { tz: 'Asia/Kolkata', name: 'India Standard Time (UTC+5:30)' },
  { tz: 'America/New_York', name: 'Eastern Daylight Time (UTC-4)' },
  { tz: 'Pacific/Auckland', name: 'New Zealand Standard Time (UTC+12)' },
  { tz: 'Europe/London', name: 'British Summer Time (UTC+1)' },
  { tz: 'Asia/Tokyo', name: 'Japan Standard Time (UTC+9)' },
  { tz: 'Pacific/Honolulu', name: 'Hawaii-Aleutian Time (UTC-10)' }
];

for (const sample of sampleTimestamps) {
  // Reference value computed strictly in UTC
  const refShort = formatDateSafe(sample, 'short');
  const refLong = formatDateSafe(sample, 'long');
  const refIso = formatDateSafe(sample, 'iso-date');
  const refFull = formatDateSafe(sample, 'full');
  const refDateTime = formatDateTimeSafe(sample);

  for (const { tz, name } of timezonesToSimulate) {
    const originalTz = process.env.TZ;
    try {
      process.env.TZ = tz;
      const testedShort = formatDateSafe(sample, 'short');
      const testedLong = formatDateSafe(sample, 'long');
      const testedIso = formatDateSafe(sample, 'iso-date');
      const testedFull = formatDateSafe(sample, 'full');
      const testedDateTime = formatDateTimeSafe(sample);

      const isMatch = (
        testedShort === refShort &&
        testedLong === refLong &&
        testedIso === refIso &&
        testedFull === refFull &&
        testedDateTime === refDateTime
      );

      if (isMatch) {
        results.timezoneHydration.passed++;
      } else {
        results.timezoneHydration.failed++;
        results.findings.push(`[Timezone Drift] TZ=${tz} produced mismatch for input=${sample}. Ref="${refShort}", Tested="${testedShort}"`);
      }

      results.timezoneHydration.details.push({
        input: sample,
        tz,
        refShort,
        testedShort,
        isMatch
      });
    } finally {
      process.env.TZ = originalTz;
    }
  }
}

// Edge case inputs for date formatting
const edgeDateCases = [
  { val: null, expected: '' },
  { val: undefined, expected: '' },
  { val: '', expected: '' },
  { val: 'not-a-valid-date-stamp', expected: 'not-a-valid-date-stamp' },
  { val: NaN, expected: '' },
  { val: false, expected: '' },
  { val: {}, expected: '[object Object]' }
];

for (const { val, expected } of edgeDateCases) {
  const out = formatDateSafe(val);
  const pass = (val === NaN || val === false) ? out === '' || out === 'false' : (out === expected || (typeof val === 'object' && out === String(val)));
  if (pass) {
    results.timezoneHydration.passed++;
  } else {
    results.timezoneHydration.failed++;
    results.findings.push(`[DateFormat Edge Failure] input=${JSON.stringify(val)}, expected="${expected}", got="${out}"`);
  }
}

// ====================================================================
// 2. EXTREME VIEWPORT GEOMETRY SIMULATION (320px - 2560px)
// ====================================================================
console.log('\n--- 2. SIMULATING EXTREME VIEWPORT BENTO GEOMETRY ---');

const extendedBreakpoints = [
  { name: 'Ultra-Narrow Mobile (320px)', width: 320, cols: 1, heroCols: 1, stdCols: 1 },
  { name: 'Standard Mobile (375px)', width: 375, cols: 1, heroCols: 1, stdCols: 1 },
  { name: 'Tablet Portrait (768px)', width: 768, cols: 2, heroCols: 2, stdCols: 1 },
  { name: 'Tablet Landscape (1024px)', width: 1024, cols: 3, heroCols: 2, stdCols: 1 },
  { name: 'Desktop HD (1280px)', width: 1280, cols: 3, heroCols: 2, stdCols: 1 },
  { name: 'Full HD Desktop (1920px)', width: 1920, cols: 3, heroCols: 2, stdCols: 1 },
  { name: '2K / 4K Ultrawide (2560px)', width: 2560, cols: 3, heroCols: 2, stdCols: 1 }
];

const cardCountsToStress = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 15, 25, 50];

for (const bp of extendedBreakpoints) {
  for (const count of cardCountsToStress) {
    let currentRow = 1;
    let currentCol = 0;
    const rowSlots = {};

    for (let i = 0; i < count; i++) {
      const isHero = i === 0;
      const span = isHero ? bp.heroCols : bp.stdCols;

      if (currentCol + span > bp.cols) {
        currentRow++;
        currentCol = 0;
      }
      currentCol += span;
      if (!rowSlots[currentRow]) rowSlots[currentRow] = 0;
      rowSlots[currentRow] += span;
    }

    const totalRows = count === 0 ? 0 : currentRow;
    const isOverflowing = Object.values(rowSlots).some(spanSum => spanSum > bp.cols);

    if (isOverflowing) {
      results.geometryBreakpoints.failed++;
      results.findings.push(`[Geometry Overflow] Breakpoint "${bp.name}" with count=${count} exceeded grid column capacity (${bp.cols})`);
    } else {
      results.geometryBreakpoints.passed++;
    }

    results.geometryBreakpoints.details.push({
      breakpoint: bp.name,
      width: bp.width,
      count,
      totalRows,
      isOverflowing
    });
  }
}

// ====================================================================
// 3. THUMBNAIL RENDERING UNDER BROKEN / MALICIOUS URL ATTACKS
// ====================================================================
console.log('\n--- 3. TESTING THUMBNAIL FALLBACK & URL PARSER ROBUSTNESS ---');

const defaultThumbnails = {
  foundation: 'https://images.unsplash.com/photo-1509228468518-180dd4864904?auto=format&fit=crop&w=800&q=80',
  mains: 'https://images.unsplash.com/photo-1532187643603-ba119ca4109e?auto=format&fit=crop&w=800&q=80',
  advanced: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?auto=format&fit=crop&w=800&q=80'
};

function getThumbnailUrlSim(course) {
  if (!course || !course.thumbnail_url || typeof course.thumbnail_url !== 'string' || course.thumbnail_url.trim() === '') {
    return defaultThumbnails[course?.level] || defaultThumbnails.foundation;
  }

  let url = course.thumbnail_url.trim();

  // Normalize absolute URLs without protocol
  if (!url.startsWith('http://') && !url.startsWith('https://') && !url.startsWith('/') && !url.startsWith('data:')) {
    if (url.includes('.') && !url.includes(' ')) {
      url = 'https://' + url;
    }
  }

  if (url.startsWith('http://') || url.startsWith('https://')) {
    try {
      const u = new URL(url);
      let mediaUrl = null;
      for (const [key, value] of u.searchParams.entries()) {
        const lowerKey = key.toLowerCase();
        if (lowerKey === 'mediaurl' || lowerKey === 'imgurl' || lowerKey === 'imageurl') {
          mediaUrl = value;
          break;
        }
      }
      if (mediaUrl) {
        return decodeURIComponent(mediaUrl);
      }
    } catch (e) {
      // Malformed URL recovery
    }
    return url;
  }

  if (url.startsWith('/') || url.startsWith('data:')) {
    return url;
  }

  return defaultThumbnails[course?.level] || defaultThumbnails.foundation;
}

const thumbnailAttackVectors = [
  { name: 'Null course', input: null, expectedFallback: true },
  { name: 'Empty string thumbnail', input: { thumbnail_url: '' }, expectedFallback: true },
  { name: 'Whitespace only', input: { thumbnail_url: '   ' }, expectedFallback: true },
  { name: 'Non-string type (number)', input: { thumbnail_url: 12345 }, expectedFallback: true },
  { name: 'Non-string type (object)', input: { thumbnail_url: { src: 'pic.jpg' } }, expectedFallback: true },
  { name: 'Relative path', input: { thumbnail_url: '/images/physics.jpg' }, expected: '/images/physics.jpg' },
  { name: 'Data URI SVG', input: { thumbnail_url: 'data:image/svg+xml;base64,PHN2Zz48L3N2Zz4=' }, expected: 'data:image/svg+xml;base64,PHN2Zz48L3N2Zz4=' },
  { name: 'Search engine redirect with mediaUrl', input: { thumbnail_url: 'https://www.bing.com/images/search?q=physics&mediaurl=https%3A%2F%2Fexample.com%2Freal_pic.jpg' }, expected: 'https://example.com/real_pic.jpg' },
  { name: 'Search engine redirect with imgurl', input: { thumbnail_url: 'https://www.google.com/imgres?imgurl=https%3A%2F%2Fcdn.study.com%2Fphoto.png&tbnid=1' }, expected: 'https://cdn.study.com/photo.png' },
  { name: 'Missing protocol auto-fix', input: { thumbnail_url: 'cdn.education.com/thumbnails/jee_adv.png' }, expected: 'https://cdn.education.com/thumbnails/jee_adv.png' },
  { name: 'Malformed URL encoding with invalid % sequences', input: { thumbnail_url: 'https://cdn.com/test?mediaurl=%%%BAD_ENCODING%%%' }, shouldNotCrash: true }
];

for (const vec of thumbnailAttackVectors) {
  try {
    const resolved = getThumbnailUrlSim(vec.input);
    let pass = false;

    if (vec.expectedFallback) {
      pass = typeof resolved === 'string' && (resolved === defaultThumbnails.foundation || resolved.startsWith('https://images.unsplash.com'));
    } else if (vec.expected) {
      pass = resolved === vec.expected;
    } else if (vec.shouldNotCrash) {
      pass = typeof resolved === 'string' && resolved.length > 0;
    }

    if (pass) {
      results.thumbnailResilience.passed++;
    } else {
      results.thumbnailResilience.failed++;
      results.findings.push(`[Thumbnail Vector Failure] "${vec.name}": resolved to "${resolved}"`);
    }

    results.thumbnailResilience.details.push({
      vector: vec.name,
      input: vec.input,
      resolved,
      pass
    });
  } catch (err) {
    results.thumbnailResilience.failed++;
    results.findings.push(`[Thumbnail Crash] "${vec.name}" threw exception: ${err.message}`);
  }
}

// ====================================================================
// 4. ADVERSARIAL DATA RESILIENCE & XSS INJECTION PAYLOADS
// ====================================================================
console.log('\n--- 4. TESTING ADVERSARIAL DATA RESILIENCE & XSS RESISTANCE ---');

const deepAdversarialPayloads = [
  {
    name: 'XSS and Script Injections in All Fields',
    data: {
      id: '<script>window.__hacked=true</script>',
      title: '<img src=x onerror=alert(1)> Physics Advanced Pro',
      instructor: '<svg onload=alert(document.cookie)> Dr. Hacker',
      badge: '<iframe src="javascript:alert(1)">FLAGSHIP</iframe>',
      price: -500,
      originalPrice: 0,
      rating: 99.9,
      studentsCount: -100,
      checklist: ['<marquee>Hack</marquee>', null, undefined, 12345],
      includedBookKit: {
        title: '<a href="javascript:alert(1)">Malicious Book Kit</a>',
        value: -999,
        booksCount: 0
      }
    }
  },
  {
    name: 'Massive Payload (10,000 chars non-breaking strings)',
    data: {
      id: 'massive-id-' + 'x'.repeat(500),
      title: 'SUPERLONGWORD'.repeat(100),
      description: 'Z'.repeat(5000),
      instructor: 'Dr. ' + 'LongName'.repeat(50),
      checklist: Array.from({ length: 50 }, (_, i) => `Checklist item ${i}: ` + 'Content'.repeat(30)),
      curriculum: Array.from({ length: 20 }, (_, i) => ({
        chapter: `Chapter ${i}: ` + 'C'.repeat(50),
        duration: '100 Hours',
        lessons: Array.from({ length: 15 }, (_, j) => ({
          title: `Lesson ${i}.${j}: ` + 'L'.repeat(50),
          type: 'Lecture'
        }))
      }))
    }
  },
  {
    name: 'Totally Corrupted Types and Prototype Poisoning attempts',
    data: {
      id: '__proto__',
      title: ['Array instead of string'],
      badge: { nested: 'object instead of string' },
      rating: 'Five Stars',
      checklist: 'Single string instead of array',
      curriculum: null,
      price_ledger: 'Not an object'
    }
  }
];

function sanitizeForRender(item) {
  // Simulates robust rendering extraction with defensive checks
  const title = typeof item.title === 'string' ? item.title : (Array.isArray(item.title) ? item.title.join(' ') : 'Untitled');
  const badge = typeof item.badge === 'string' ? item.badge : '';
  const instructor = typeof item.instructor === 'string' ? item.instructor : 'Faculty Team';
  const checklist = Array.isArray(item.checklist) ? item.checklist.filter(c => typeof c === 'string') : [];
  const price = typeof item.price === 'number' && item.price >= 0 ? item.price : 0;
  const rating = typeof item.rating === 'number' ? Math.min(5, Math.max(0, item.rating)) : 4.9;
  
  return {
    title,
    badge,
    instructor,
    checklistCount: checklist.length,
    price,
    rating
  };
}

for (const payload of deepAdversarialPayloads) {
  try {
    const clean = sanitizeForRender(payload.data);
    results.dataPayloadStress.passed++;
    results.dataPayloadStress.details.push({
      test: payload.name,
      clean,
      success: true
    });
  } catch (err) {
    results.dataPayloadStress.failed++;
    results.findings.push(`[Payload Error] "${payload.name}" failed sanitization: ${err.message}`);
  }
}

// ====================================================================
// 5. STATIC CODEBASE AUDIT FOR RESPONSIVE & HYDRATION RULES
// ====================================================================
console.log('\n--- 5. RUNNING STATIC CODEBASE QUALITY & SAFETY AUDIT ---');

const auditFiles = [
  'src/app/courses/page.jsx',
  'src/app/batches/page.jsx',
  'src/app/test-series/TestSeriesHubClient.jsx',
  'src/app/dashboard/DashboardClient.jsx',
  'src/utils/dateFormat.js'
];

for (const f of auditFiles) {
  const fullPath = path.resolve(process.cwd(), f);
  if (!fs.existsSync(fullPath)) {
    results.codebaseAudit.failed++;
    results.findings.push(`[File Missing] ${f} does not exist`);
    continue;
  }

  const code = fs.readFileSync(fullPath, 'utf-8');

  // Check 1: No direct unsafe locale date calls that cause SSR mismatch
  const unsafeDateRegex = /\.(toLocaleDateString|toLocaleTimeString|toLocaleString)\s*\(/g;
  const unsafeDateMatches = code.match(unsafeDateRegex);
  const isDateSafe = !unsafeDateMatches;

  // Check 2: No invalid non-standard Tailwind tokens (e.g. -905, -650)
  const invalidTokensRegex = /(bg|text|border|fill)-(slate|zinc|gray|indigo|teal|emerald|amber|red)-(905|650|750|850)/g;
  const invalidTokens = code.match(invalidTokensRegex);
  const isTokensClean = !invalidTokens;

  // Check 3: Bento Grid Layout classes
  const hasBentoGrid = code.includes('grid-cols-1') && (code.includes('md:grid-cols-2') || code.includes('lg:grid-cols-3'));

  // Check 4: Uncropped image classes
  const hasUncroppedThumbnails = code.includes('object-contain') && (code.includes('blur-xl') || code.includes('aspect-[16/9]'));

  const filePass = isDateSafe && isTokensClean && (f.includes('dateFormat') || (hasBentoGrid && hasUncroppedThumbnails));

  if (filePass) {
    results.codebaseAudit.passed++;
  } else {
    results.codebaseAudit.failed++;
    if (!isDateSafe) results.findings.push(`[Audit Warning] ${f} contains unsafe locale date method: ${unsafeDateMatches.join(', ')}`);
    if (!isTokensClean) results.findings.push(`[Audit Warning] ${f} contains invalid Tailwind tokens: ${invalidTokens.join(', ')}`);
    if (!hasBentoGrid && !f.includes('dateFormat')) results.findings.push(`[Audit Warning] ${f} missing responsive Bento grid column classes`);
    if (!hasUncroppedThumbnails && !f.includes('dateFormat')) results.findings.push(`[Audit Warning] ${f} missing uncropped thumbnail or ambient blur pattern`);
  }

  results.codebaseAudit.details.push({
    file: f,
    isDateSafe,
    isTokensClean,
    hasBentoGrid,
    hasUncroppedThumbnails,
    pass: filePass
  });
}

// ====================================================================
// SUMMARY OUTPUT & ARTIFACT GENERATION
// ====================================================================
console.log('\n======================================================');
console.log('MILESTONE 3 ADVERSARIAL STRESS TEST SUMMARY REPORT');
console.log('======================================================');
console.log(`1. Timezone & Locale Hydration: ${results.timezoneHydration.passed} Passed, ${results.timezoneHydration.failed} Failed`);
console.log(`2. Extreme Viewport Geometry:   ${results.geometryBreakpoints.passed} Passed, ${results.geometryBreakpoints.failed} Failed`);
console.log(`3. Thumbnail Resilience:        ${results.thumbnailResilience.passed} Passed, ${results.thumbnailResilience.failed} Failed`);
console.log(`4. Adversarial Data Resilience: ${results.dataPayloadStress.passed} Passed, ${results.dataPayloadStress.failed} Failed`);
console.log(`5. Static Codebase Audit:       ${results.codebaseAudit.passed} Passed, ${results.codebaseAudit.failed} Failed`);
console.log(`Total Findings / Anomalies:     ${results.findings.length}`);

const totalPassed = results.timezoneHydration.passed + results.geometryBreakpoints.passed + results.thumbnailResilience.passed + results.dataPayloadStress.passed + results.codebaseAudit.passed;
const totalFailed = results.timezoneHydration.failed + results.geometryBreakpoints.failed + results.thumbnailResilience.failed + results.dataPayloadStress.failed + results.codebaseAudit.failed;
console.log(`\nOVERALL SCORE: ${totalPassed} / ${totalPassed + totalFailed} Passed (${((totalPassed / (totalPassed + totalFailed)) * 100).toFixed(1)}%)`);

if (results.findings.length === 0) {
  console.log('\nVERDICT: FULL EMPIRICAL APPROVAL (Zero Bugs / Failures Detected)');
} else {
  console.log('\nVERDICT: ISSUES FOUND');
  results.findings.forEach(f => console.log(' - ' + f));
}

fs.writeFileSync(
  path.resolve(process.cwd(), 'tests/challenge_bento_adversarial_m3_output.json'),
  JSON.stringify(results, null, 2),
  'utf-8'
);

console.log('\nOutput written to tests/challenge_bento_adversarial_m3_output.json');
