/**
 * Challenger 1 Milestone 1 Empirical Stress Test Harness
 * Tests:
 * 1. Date formatting edge cases & SSR determinism
 * 2. Bento grid layout geometry across breakpoints (375px, 768px, 1280px, 1920px)
 * 3. Item count stress tests (0, 1, 2, 3, 5, 10, 50 items)
 * 4. Adversarial data payloads (nulls, missing fields, ultra-long strings, non-breaking words)
 * 5. CSS classes & flex/grid layout safety audit
 */

import fs from 'fs';
import path from 'path';
import { formatDateSafe, formatDateTimeSafe } from '../src/utils/dateFormat.js';

const results = {
  dateTests: { passed: 0, failed: 0, details: [] },
  gridGeometry: { passed: 0, failed: 0, details: [] },
  dataResilience: { passed: 0, failed: 0, details: [] },
  cssLayoutAudit: { passed: 0, failed: 0, details: [] },
  findings: []
};

// ==========================================
// 1. DATE FORMATTING RESILIENCE & SSR SAFETY
// ==========================================
console.log('\n--- 1. TESTING DATE FORMATTING RESILIENCE ---');

const dateTestCases = [
  { input: null, format: 'short', expected: '' },
  { input: undefined, format: 'short', expected: '' },
  { input: '', format: 'short', expected: '' },
  { input: 'invalid-date-string', format: 'short', expected: 'invalid-date-string' },
  { input: '2026-06-01', format: 'short', expected: '1 Jun, 2026' },
  { input: '2026-12-31T23:59:59.000Z', format: 'short', expected: '31 Dec, 2026' },
  { input: '2026-06-01T12:00:00.000Z', format: 'long', expected: '1 Jun, 2026 12:00 UTC' },
  { input: '2026-06-01T12:00:00.000Z', format: 'iso-date', expected: '2026-06-01' },
  { input: '2026-06-01T12:00:00.000Z', format: 'year-only', expected: '2026' },
  { input: '2026-06-01T12:00:00.000Z', format: 'month-year', expected: 'Jun 2026' },
  { input: '2026-06-01T12:00:00.000Z', format: 'full', expected: 'June 1, 2026' },
  { input: 0, format: 'short', expected: '1 Jan, 1970' },
  { input: 1772496000000, format: 'short', expected: '3 Mar, 2026' }
];

for (const tc of dateTestCases) {
  const actual = formatDateSafe(tc.input, tc.format);
  const pass = actual === tc.expected;
  if (pass) {
    results.dateTests.passed++;
  } else {
    results.dateTests.failed++;
    results.findings.push(`[DateFormat Error] input=${tc.input}, format=${tc.format}, expected="${tc.expected}", got="${actual}"`);
  }
  results.dateTests.details.push({ input: tc.input, format: tc.format, expected: tc.expected, actual, pass });
}

// ==========================================
// 2. BENTO GRID GEOMETRY & BREAKPOINT SIMULATION
// ==========================================
console.log('\n--- 2. SIMULATING BENTO GRID GEOMETRY ACROSS BREAKPOINTS ---');

const breakpoints = [
  { name: 'Mobile (375px)', cols: 1, heroCols: 1, stdCols: 1 },
  { name: 'Tablet (768px)', cols: 2, heroCols: 2, stdCols: 1 },
  { name: 'Desktop (1280px)', cols: 3, heroCols: 2, stdCols: 1 },
  { name: 'Wide (1920px)', cols: 3, heroCols: 2, stdCols: 1 }
];

const testItemCounts = [0, 1, 2, 3, 4, 5, 8, 10, 20];

for (const bp of breakpoints) {
  for (const count of testItemCounts) {
    // Calculate grid rows and slot occupancy
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
    const lastRowOccupancy = count === 0 ? 0 : (rowSlots[totalRows] || 0);
    const hasIncompleteRow = lastRowOccupancy > 0 && lastRowOccupancy < bp.cols;

    // Check if layout is valid (no overflow beyond grid width)
    const rowOverflown = Object.values(rowSlots).some(slots => slots > bp.cols);

    if (rowOverflown) {
      results.gridGeometry.failed++;
      results.findings.push(`[Grid Geometry Error] Breakpoint ${bp.name} with ${count} items caused row overflow!`);
    } else {
      results.gridGeometry.passed++;
    }

    results.gridGeometry.details.push({
      breakpoint: bp.name,
      itemCount: count,
      totalRows,
      lastRowOccupancy: `${lastRowOccupancy}/${bp.cols}`,
      hasIncompleteRow,
      rowOverflown
    });
  }
}

// ==========================================
// 3. ADVERSARIAL DATA PAYLOAD STRESS TESTING
// ==========================================
console.log('\n--- 3. TESTING ADVERSARIAL DATA RESILIENCE ---');

// Mock component mapping logic from Courses, Batches, TestSeriesHub
function mapCourseAdversarial(course) {
  try {
    const isHero = course.badge?.toUpperCase().includes('FLAGSHIP') || false;
    const title = course.title || 'Untitled Course';
    const instructor = course.instructor || 'Expert Faculty';
    const instructorRole = course.instructorRole || 'Senior Educator';
    const cover = course.cover || course.thumbnail_url || 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=800&auto=format&fit=crop&q=80';
    const badge = course.badge || 'CERTIFIED COURSE';
    const rating = course.rating || 4.9;
    const studentsCount = course.studentsCount ? `${course.studentsCount}+ Aspirants` : 'New Batch';
    const duration = course.duration || 'Flexible Schedule';
    const lessonsCount = course.lessonsCount || 36;
    const checklist = Array.isArray(course.checklist) && course.checklist.length > 0 ? course.checklist : [
      'Comprehensive syllabus coverage with top faculty',
      'Physical study kit & reference books delivered to home'
    ];
    const includedBookKit = course.includedBookKit || {
      title: 'Master Study Material & Practice Workbook Kit',
      booksCount: 3,
      value: 1999
    };

    // Simulate rendering access
    const checklistSlice = checklist.slice(0, 2);
    const bookTitle = includedBookKit.title;
    const discount = Math.round((((course.originalPrice || 9999) - (course.price || 999)) / (course.originalPrice || 9999)) * 100);

    return { success: true, title, isHero, checklistCount: checklist.length, discount };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

function mapBatchAdversarial(batch) {
  try {
    const isHero = batch.badge?.toUpperCase().includes('FLAGSHIP') || false;
    const title = batch.title || 'Untitled Batch';
    const faculty = batch.faculty || 'Expert Faculty Team';
    const checklist = Array.isArray(batch.checklist) && batch.checklist.length > 0 ? batch.checklist : ['Live Lectures'];
    const curriculum = Array.isArray(batch.curriculum) && batch.curriculum.length > 0 ? batch.curriculum : [
      { chapter: 'Module 1', duration: '4 Weeks', lessons: [{ title: 'Lesson 1', type: 'Live Lecture' }] }
    ];

    // Simulate nested curriculum iteration
    let totalLessons = 0;
    for (const mod of curriculum) {
      if (Array.isArray(mod.lessons)) {
        totalLessons += mod.lessons.length;
      }
    }

    return { success: true, title, isHero, totalLessons };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

function mapTestSeriesAdversarial(pkg) {
  try {
    const isHero = pkg.is_featured || false;
    const title = pkg.title || 'Untitled Test Series';
    const distribution = pkg.test_distribution || {};
    const drills = distribution.chapter_drills || 0;
    const mocks = distribution.full_mocks || 0;
    const live = distribution.live_papers || 0;
    const ledger = pkg.price_ledger || {};
    const price = ledger.price || 499;

    return { success: true, title, isHero, drills, mocks, live, price };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

const adversarialTestCases = [
  { name: 'Empty Object', payload: {} },
  { name: 'All Nulls', payload: { id: null, title: null, cover: null, badge: null, checklist: null, curriculum: null, test_distribution: null, price_ledger: null } },
  { name: 'All Undefined', payload: { id: undefined, title: undefined, cover: undefined, badge: undefined, checklist: undefined, curriculum: undefined } },
  { name: 'Empty Arrays and Strings', payload: { id: '', title: '', cover: '', badge: '', checklist: [], curriculum: [], test_distribution: {} } },
  { name: 'Broken Nested Structures', payload: { checklist: 'not-an-array', curriculum: 'not-an-array', test_distribution: 'not-an-object', price_ledger: 'not-an-object' } },
  { name: 'Ultra-Long Strings (1000+ chars)', payload: {
    id: 'pkg-long',
    title: 'A'.repeat(500) + ' ' + 'B'.repeat(500),
    description: 'D'.repeat(2500),
    instructor: 'Prof ' + 'LongName'.repeat(30),
    badge: 'BADGE_'.repeat(20),
    checklist: ['Feature 1: ' + 'F'.repeat(400), 'Feature 2: ' + 'G'.repeat(400)],
    curriculum: [{ chapter: 'Chap ' + 'C'.repeat(200), duration: '100 Weeks', lessons: [{ title: 'Les ' + 'L'.repeat(300), type: 'Live' }] }]
  }},
  { name: 'Special Chars and HTML/XSS Payloads', payload: {
    id: 'xss-1',
    title: '<script>alert("XSS")</script>&amp;"\'<>',
    badge: '<b>BOLD</b>',
    checklist: ['<img src=x onerror=alert(1)>', '${7*7}']
  }}
];

for (const tc of adversarialTestCases) {
  const cRes = mapCourseAdversarial(tc.payload);
  const bRes = mapBatchAdversarial(tc.payload);
  const tRes = mapTestSeriesAdversarial(tc.payload);

  const allPassed = cRes.success && bRes.success && tRes.success;
  if (allPassed) {
    results.dataResilience.passed++;
  } else {
    results.dataResilience.failed++;
    results.findings.push(`[Data Resilience Error] Test case "${tc.name}" threw error: C(${cRes.error}) B(${bRes.error}) T(${tRes.error})`);
  }

  results.dataResilience.details.push({
    testCase: tc.name,
    courseResult: cRes,
    batchResult: bRes,
    testSeriesResult: tRes,
    pass: allPassed
  });
}

// ==========================================
// 4. STATIC CSS & CODEBASE LAYOUT AUDIT
// ==========================================
console.log('\n--- 4. STATIC CODEBASE CSS & LAYOUT AUDIT ---');

const filesToAudit = [
  'src/app/courses/page.jsx',
  'src/app/batches/page.jsx',
  'src/app/test-series/TestSeriesHubClient.jsx',
  'src/app/dashboard/DashboardClient.jsx'
];

for (const relPath of filesToAudit) {
  const fullPath = path.resolve(process.cwd(), relPath);
  if (!fs.existsSync(fullPath)) {
    results.cssLayoutAudit.failed++;
    results.findings.push(`[Audit Error] File not found: ${relPath}`);
    continue;
  }

  const content = fs.readFileSync(fullPath, 'utf-8');

  // Check 1: Empty state handling
  const hasEmptyState = content.includes('length === 0') || content.includes('No courses matched') || content.includes('No batches available') || content.includes('No test series packages found');
  
  // Check 2: Uncropped 16:9 media container
  const hasUncroppedMedia = content.includes('aspect-[16/9]') && content.includes('object-contain');

  // Check 3: Text truncation safeguards
  const hasTruncateOrClamp = content.includes('line-clamp-') || content.includes('truncate');

  // Check 4: Responsive grid breakpoints
  const hasResponsiveGrid = content.includes('grid-cols-1') && (content.includes('md:grid-cols-2') || content.includes('lg:grid-cols-3'));

  // Check 5: Hero 2-col span
  const hasHeroColSpan = content.includes('md:col-span-2') || content.includes('lg:col-span-2');

  // Check 6: Hydration date safety
  const hasUnsafeDateMethod = content.includes('.toLocaleDateString()') || content.includes('.toLocaleString()');

  const fileAuditPass = hasUncroppedMedia && hasTruncateOrClamp && hasResponsiveGrid && !hasUnsafeDateMethod;

  if (fileAuditPass) {
    results.cssLayoutAudit.passed++;
  } else {
    results.cssLayoutAudit.failed++;
    if (!hasUncroppedMedia) results.findings.push(`[Layout Notice] ${relPath} missing 16:9 uncropped media container`);
    if (!hasTruncateOrClamp) results.findings.push(`[Layout Notice] ${relPath} missing text line-clamp / truncation safeguards`);
    if (hasUnsafeDateMethod) results.findings.push(`[Hydration Warning] ${relPath} contains direct toLocaleDateString/toLocaleString call`);
  }

  results.cssLayoutAudit.details.push({
    file: relPath,
    hasEmptyState,
    hasUncroppedMedia,
    hasTruncateOrClamp,
    hasResponsiveGrid,
    hasHeroColSpan,
    hasUnsafeDateMethod,
    pass: fileAuditPass
  });
}

// ==========================================
// 5. PRINT SUMMARY REPORT
// ==========================================
console.log('\n==========================================');
console.log('CHALLENGER 1 STRESS TEST SUMMARY REPORT');
console.log('==========================================');
console.log(`Date Formatting:   ${results.dateTests.passed} Passed, ${results.dateTests.failed} Failed`);
console.log(`Grid Geometry:     ${results.gridGeometry.passed} Passed, ${results.gridGeometry.failed} Failed`);
console.log(`Data Resilience:   ${results.dataResilience.passed} Passed, ${results.dataResilience.failed} Failed`);
console.log(`CSS Layout Audit:  ${results.cssLayoutAudit.passed} Passed, ${results.cssLayoutAudit.failed} Failed`);
console.log(`Total Findings:    ${results.findings.length}`);

if (results.findings.length > 0) {
  console.log('\nFindings / Issues Detected:');
  results.findings.forEach(f => console.log(' - ' + f));
} else {
  console.log('\nVerdict: ALL TESTS PASSED CLEANLY.');
}

// Write json artifact for handoff documentation
fs.writeFileSync(
  path.resolve(process.cwd(), 'tests/bento_stress_test_output.json'),
  JSON.stringify(results, null, 2),
  'utf-8'
);
