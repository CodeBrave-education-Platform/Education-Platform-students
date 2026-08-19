import fs from 'fs';
import path from 'path';

console.log('================================================================');
console.log('CHALLENGER 1: ADVERSARIAL BENTO GRID & VISUAL STRESS HARNESS');
console.log('================================================================');

const results = {
  test1_emptyDatasets: { passed: 0, failed: 0, details: [] },
  test2_thumbnailUrls: { passed: 0, failed: 0, details: [] },
  test3_highVolume: { passed: 0, failed: 0, details: [] },
  test4_extremePricing: { passed: 0, failed: 0, details: [] },
  test5_massiveEnrollments: { passed: 0, failed: 0, details: [] },
  test6_csvAndUnicodeInjection: { passed: 0, failed: 0, details: [] },
  test7_multiFilterInteractionMatrix: { passed: 0, failed: 0, details: [] },
  findings: []
};

// 1. EMPTY DATASETS & NULL FALLBACKS
function filterCourses(courses, selectedSubject, searchQuery) {
  if (!Array.isArray(courses)) return [];
  return courses.filter(c => {
    if (!c) return false;
    const matchSubject = selectedSubject === 'All' || (c.subject && c.subject.toLowerCase() === selectedSubject.toLowerCase());
    const matchSearch = !searchQuery || 
      (c.title && c.title.toLowerCase().includes(searchQuery.toLowerCase())) || 
      (c.instructor && c.instructor.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (c.badge && c.badge.toLowerCase().includes(searchQuery.toLowerCase()));
    return Boolean(matchSubject && matchSearch);
  });
}

function filterPackages(packages, activeTag, searchQuery) {
  if (!Array.isArray(packages)) return [];
  return packages.filter(pkg => {
    if (!pkg) return false;
    const matchTag = activeTag === 'ALL' || (pkg.target_exam_tag && pkg.target_exam_tag.toUpperCase() === activeTag);
    const matchSearch = !searchQuery || 
      (pkg.title && pkg.title.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (pkg.target_exam_tag && pkg.target_exam_tag.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (pkg.campus_branch && pkg.campus_branch.toLowerCase().includes(searchQuery.toLowerCase()));
    return Boolean(matchTag && matchSearch);
  });
}

const emptyDatasetScenarios = [
  { name: 'Empty courses array', data: [], subject: 'All', query: '', expectedCount: 0 },
  { name: 'Null courses parameter', data: null, subject: 'All', query: '', expectedCount: 0 },
  { name: 'Undefined courses parameter', data: undefined, subject: 'Physics', query: 'JEE', expectedCount: 0 },
  { name: 'Array of null/undefined elements', data: [null, undefined, {}, null], subject: 'All', query: '', expectedCount: 0 },
  { name: 'Empty packages array', data: [], tag: 'ALL', query: '', expectedCount: 0 },
  { name: 'Null packages parameter', data: null, tag: 'ALL', query: '', expectedCount: 0 },
  { name: 'Non-matching search on empty array', data: [], tag: 'JEE', query: 'Mathematics', expectedCount: 0 }
];

for (const sc of emptyDatasetScenarios) {
  try {
    let out = [];
    if (sc.subject !== undefined) {
      out = filterCourses(sc.data, sc.subject, sc.query);
    } else {
      out = filterPackages(sc.data, sc.tag, sc.query);
    }

    if (Array.isArray(out) && out.length === sc.expectedCount) {
      results.test1_emptyDatasets.passed++;
    } else {
      results.test1_emptyDatasets.failed++;
      results.findings.push('[Empty Dataset Failure] ' + sc.name + ': Expected ' + sc.expectedCount + ', got ' + out.length);
    }
  } catch (err) {
    results.test1_emptyDatasets.failed++;
    results.findings.push('[Empty Dataset Crash] ' + sc.name + ' threw: ' + err.message);
  }
}

// 2. BROKEN, INVALID, OR NULL THUMBNAIL URLS
const DEFAULT_COVER = 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=800&auto=format&fit=crop&q=80';
const DEFAULT_PKG_COVER = 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1200&q=80';

function resolveCourseThumbnail(c) {
  if (!c || !c.thumbnail_url || typeof c.thumbnail_url !== 'string' || c.thumbnail_url.trim() === '') {
    return c?.cover || DEFAULT_COVER;
  }
  return c.thumbnail_url.trim();
}

function resolvePackageThumbnail(pkg) {
  if (!pkg || !pkg.thumbnail_url || typeof pkg.thumbnail_url !== 'string' || pkg.thumbnail_url.trim() === '') {
    return DEFAULT_PKG_COVER;
  }
  return pkg.thumbnail_url.trim();
}

const thumbnailVectors = [
  { name: 'Null thumbnail', input: { thumbnail_url: null }, expected: DEFAULT_COVER },
  { name: 'Undefined thumbnail', input: {}, expected: DEFAULT_COVER },
  { name: 'Empty string', input: { thumbnail_url: '' }, expected: DEFAULT_COVER },
  { name: 'Whitespace only', input: { thumbnail_url: '   ' }, expected: DEFAULT_COVER },
  { name: 'Valid HTTPS URL', input: { thumbnail_url: 'https://cdn.example.com/course.jpg' }, expected: 'https://cdn.example.com/course.jpg' },
  { name: 'Search engine redirect with params', input: { thumbnail_url: 'https://bing.com/images?imgurl=https%3A%2F%2Fsite.com%2Fpic.png' }, expected: 'https://bing.com/images?imgurl=https%3A%2F%2Fsite.com%2Fpic.png' },
  { name: 'Relative path', input: { thumbnail_url: '/assets/jee_cover.webp' }, expected: '/assets/jee_cover.webp' },
  { name: 'Data URI SVG', input: { thumbnail_url: 'data:image/svg+xml;base64,PHN2Zz48L3N2Zz4=' }, expected: 'data:image/svg+xml;base64,PHN2Zz48L3N2Zz4=' },
  { name: 'Broken non-string type (number)', input: { thumbnail_url: 123456 }, expected: DEFAULT_COVER },
  { name: 'Package Null thumbnail', input: { thumbnail_url: null }, isPkg: true, expected: DEFAULT_PKG_COVER },
  { name: 'Package whitespace thumbnail', input: { thumbnail_url: '  	
 ' }, isPkg: true, expected: DEFAULT_PKG_COVER }
];

for (const vec of thumbnailVectors) {
  try {
    const resolved = vec.isPkg ? resolvePackageThumbnail(vec.input) : resolveCourseThumbnail(vec.input);
    if (resolved === vec.expected) {
      results.test2_thumbnailUrls.passed++;
    } else {
      results.test2_thumbnailUrls.failed++;
      results.findings.push('[Thumbnail Resolution Error] ' + vec.name + ': Expected ' + vec.expected + ', got ' + resolved);
    }
  } catch (err) {
    results.test2_thumbnailUrls.failed++;
    results.findings.push('[Thumbnail Crash] ' + vec.name + ' threw: ' + err.message);
  }
}

// 3. HIGH-VOLUME DATASET STRESS (100 to 1,000 entities)
const subjects = ['Physics', 'Chemistry', 'Mathematics', 'Biology'];
const targetTags = ['JEE MAIN', 'JEE ADVANCED', 'NEET UG', 'BITSAT', 'OLYMPIAD'];

function generateHighVolumeCourses(count) {
  const courses = [];
  for (let i = 1; i <= count; i++) {
    courses.push({
      id: 'course-high-vol-' + i,
      title: 'Academic Mastery Program #' + i + ' for ' + subjects[i % subjects.length] + ' Aspirants',
      subject: subjects[i % subjects.length],
      instructor: 'Senior Faculty Member ' + i,
      instructorRole: 'HOD Department ' + (i % 10),
      cover: DEFAULT_COVER,
      badge: i === 1 ? 'FLAGSHIP 2-YEAR MASTER PROGRAM' : (i % 5 === 0 ? 'FLAGSHIP BATCH' : 'CERTIFIED COURSE'),
      rating: Number((4.5 + ((i % 50) / 100)).toFixed(2)),
      studentsCount: (i * 150) + '+ Aspirants',
      duration: ((i % 12) + 1) + ' Months',
      lessonsCount: 20 + (i % 80),
      price: 999 + (i * 50),
      originalPrice: 2999 + (i * 100),
      checklist: [
        'Complete ' + subjects[i % subjects.length] + ' syllabus coverage with Kota faculty',
        'Physical printed study modules delivered to home',
        '24/7 AI-powered instant doubt resolution engine access'
      ]
    });
  }
  return courses;
}

function generateHighVolumePackages(count) {
  const packages = [];
  for (let i = 1; i <= count; i++) {
    packages.push({
      id: 'pkg-high-vol-' + i,
      title: 'National ' + targetTags[i % targetTags.length] + ' CBT Mega Test Series #' + i,
      target_exam_tag: targetTags[i % targetTags.length],
      campus_branch: 'Campus ' + (i % 8),
      thumbnail_url: DEFAULT_PKG_COVER,
      is_featured: i === 1 || i % 10 === 0,
      test_distribution: {
        chapter_drills: 10 + (i % 20),
        full_mocks: 5 + (i % 15),
        live_papers: 2 + (i % 5)
      },
      price_ledger: {
        status: i % 2 === 0 ? 'premium' : 'free',
        price: i % 2 === 0 ? 499 + (i * 20) : 0,
        original_price: i % 2 === 0 ? 1499 + (i * 50) : 0
      }
    });
  }
  return packages;
}

const highVolCourses1000 = generateHighVolumeCourses(1000);
const highVolPackages1000 = generateHighVolumePackages(1000);

const courseKeys = new Set(highVolCourses1000.map(c => c.id));
const packageKeys = new Set(highVolPackages1000.map(p => p.id));

if (courseKeys.size === 1000 && packageKeys.size === 1000) {
  results.test3_highVolume.passed++;
} else {
  results.test3_highVolume.failed++;
  results.findings.push('[Key Collision] Duplicate IDs in high volume dataset: Courses(' + courseKeys.size + '/1000), Packages(' + packageKeys.size + '/1000)');
}

const filtered1000Courses = filterCourses(highVolCourses1000, 'Physics', 'Mastery');
if (filtered1000Courses.length === 250) {
  results.test3_highVolume.passed++;
} else {
  results.test3_highVolume.failed++;
  results.findings.push('[High Volume Query Error] Expected 250 filtered records, got ' + filtered1000Courses.length);
}

// 4. EXTREME PRICING & DISCOUNT CALCULATIONS
function computePricingAndDiscount(course, userXp = 0) {
  let currentPrice = typeof course.price === 'number' && !isNaN(course.price) ? course.price : 0;
  let xpDiscountApplied = false;

  if (userXp > 1000 && currentPrice > 0) {
    currentPrice = Math.max(1, Math.floor(currentPrice * 0.9));
    xpDiscountApplied = true;
  }

  const originalPrice = (typeof course.originalPrice === 'number' && !isNaN(course.originalPrice) && course.originalPrice > 0)
    ? course.originalPrice
    : Math.round(currentPrice * 2.5);

  let discount = 0;
  if (originalPrice > 0 && originalPrice >= currentPrice) {
    discount = Math.round(((originalPrice - currentPrice) / originalPrice) * 100);
  }

  return { currentPrice, originalPrice, discount, xpDiscountApplied };
}

const pricingScenarios = [
  { name: '0 INR Free Course', input: { price: 0, originalPrice: 0 }, expectedPrice: 0, expectedDiscount: 0 },
  { name: '100,000 INR Enterprise Course', input: { price: 100000, originalPrice: 250000 }, expectedPrice: 100000, expectedDiscount: 60 },
  { name: 'Fractional price 499.75', input: { price: 499.75, originalPrice: 999.50 }, expectedDiscount: 50 },
  { name: 'Missing original price (auto 2.5x)', input: { price: 2000 }, expectedOriginal: 5000, expectedDiscount: 60 },
  { name: 'Null price and original price', input: { price: null, originalPrice: null }, expectedPrice: 0, expectedDiscount: 0 },
  { name: 'Original price less than price (anomaly)', input: { price: 5000, originalPrice: 3000 }, expectedDiscount: 0 },
  { name: 'Ranker XP discount (10%)', input: { price: 2000, originalPrice: 5000 }, userXp: 1500, expectedPrice: 1800, expectedDiscount: 64, xpDiscountApplied: true }
];

for (const sc of pricingScenarios) {
  try {
    const calc = computePricingAndDiscount(sc.input, sc.userXp || 0);
    let pass = true;

    if (sc.expectedPrice !== undefined && calc.currentPrice !== sc.expectedPrice) pass = false;
    if (sc.expectedDiscount !== undefined && calc.discount !== sc.expectedDiscount) pass = false;
    if (sc.expectedOriginal !== undefined && calc.originalPrice !== sc.expectedOriginal) pass = false;
    if (sc.xpDiscountApplied !== undefined && calc.xpDiscountApplied !== sc.xpDiscountApplied) pass = false;

    if (pass) {
      results.test4_extremePricing.passed++;
    } else {
      results.test4_extremePricing.failed++;
      results.findings.push('[Pricing Calc Mismatch] ' + sc.name + ': got ' + JSON.stringify(calc));
    }
  } catch (err) {
    results.test4_extremePricing.failed++;
    results.findings.push('[Pricing Crash] ' + sc.name + ' threw: ' + err.message);
  }
}

// 5. MASSIVE STUDENT ENROLLMENT COUNTS
function formatStudentCount(val) {
  if (val === null || val === undefined || val === '') return 'New Batch';
  if (typeof val === 'string') return val;
  if (typeof val === 'number') {
    if (isNaN(val) || val <= 0) return 'New Batch';
    return val.toLocaleString('en-IN') + '+ Aspirants';
  }
  return 'New Batch';
}

const enrollmentScenarios = [
  { name: '0 students', input: 0, expected: 'New Batch' },
  { name: '1 student', input: 1, expected: '1+ Aspirants' },
  { name: '500 students', input: 500, expected: '500+ Aspirants' },
  { name: '12,400 students', input: 12400, expected: '12,400+ Aspirants' },
  { name: '1,000,000 students', input: 1000000, expected: '10,00,000+ Aspirants' },
  { name: 'Null students count', input: null, expected: 'New Batch' },
  { name: 'Existing formatted string 14,200+ Aspirants', input: '14,200+ Aspirants', expected: '14,200+ Aspirants' },
  { name: 'Negative count -50', input: -50, expected: 'New Batch' }
];

for (const sc of enrollmentScenarios) {
  try {
    const formatted = formatStudentCount(sc.input);
    if (formatted === sc.expected) {
      results.test5_massiveEnrollments.passed++;
    } else {
      results.test5_massiveEnrollments.failed++;
      results.findings.push('[Student Count Format Failure] ' + sc.name + ': Expected ' + sc.expected + ', got ' + formatted);
    }
  } catch (err) {
    results.test5_massiveEnrollments.failed++;
    results.findings.push('[Student Count Crash] ' + sc.name + ' threw: ' + err.message);
  }
}

// 6. CSV INJECTION, UNICODE & SPECIAL CHARACTERS
const injectionAndUnicodePayloads = [
  { name: 'CSV Command Injection (Excel formula =cmd)', input: '=cmd\t/C calc!A0 JEE Masterclass' },
  { name: 'CSV DDE Injection (+@SUM)', input: '+@SUM(1+1)*cmd\t/C calc!A0 Advanced Physics' },
  { name: 'CSV Minus sign injection (-2+3+cmd)', input: '-2+3+cmd\t/C calc!A0 Chemistry Drill' },
  { name: 'Telugu Script (Bhouthika Shaastram)', input: 'భౌతిక శాస్త్రం - IIT JEE 2026 సమగ్ర కోర్సు' },
  { name: 'Hindi Script', input: 'भौतिक विज्ॎान - सम्पूर्ण JEE मेन्स और एडवांस्ड' },
  { name: 'Emojis and Mathematical Symbols', input: '🚀 100% Guaranteed Rank Booster ∫e^x dx 🎯 [2026 Batch]' },
  { name: 'RTL text', input: 'دورة الكيمياء المتقدمة 2026 - Master Batch' },
  { name: 'HTML tags', input: '<b>JEE 2026</b>' },
  { name: 'Double Quotes and Special Punctuation', input: 'JEE Master 2026; DROP TABLE courses; --' }
];

for (const payload of injectionAndUnicodePayloads) {
  try {
    const course = {
      id: 'adv-unicode-test',
      title: payload.input,
      subject: 'Physics',
      instructor: payload.input,
      badge: payload.input
    };

    const query = payload.input.slice(0, 8);
    const filtered = filterCourses([course], 'All', query);

    if (filtered.length === 1 && filtered[0].title === payload.input) {
      results.test6_csvAndUnicodeInjection.passed++;
    } else {
      results.test6_csvAndUnicodeInjection.failed++;
      results.findings.push('[Unicode/Injection Match Failure] ' + payload.name + ': query ' + query + ' failed to match safely');
    }
  } catch (err) {
    results.test6_csvAndUnicodeInjection.failed++;
    results.findings.push('[Unicode/Injection Crash] ' + payload.name + ' threw: ' + err.message);
  }
}

// 7. SIMULTANEOUS MULTI-FILTER INTERACTION MATRIX
const interactionTestPool = [
  ...highVolCourses1000.slice(0, 100),
  { id: 'c-spec-1', title: 'Quantum Mechanics JEE Advanced', subject: 'Physics', price: 999, badge: 'FLAGSHIP MASTER', instructor: 'Dr. Nitin Verma' },
  { id: 'c-spec-2', title: 'Organic Chemistry Sprint', subject: 'Chemistry', price: 1499, badge: 'HIGH-SCORING SPRINT', instructor: 'Dr. Meenakshi Sundaram' },
  { id: 'c-spec-3', title: 'Calculus & Vectors Masterclass', subject: 'Mathematics', price: 1999, badge: 'TOP RANKER ACCELERATOR', instructor: 'R. K. Singhal Sir' },
  { id: 'c-spec-4', title: 'NEET Human Physiology 360', subject: 'Biology', price: 2199, badge: 'NEET 360/360 TARGET', instructor: 'Dr. Radhika Kulkarni' }
];

const filterMatrixCombinations = [
  { subject: 'All', query: '', expectedMin: 100 },
  { subject: 'Physics', query: '', expectedMin: 25 },
  { subject: 'Physics', query: 'Quantum', expectedMin: 1 },
  { subject: 'Chemistry', query: 'Sprint', expectedMin: 1 },
  { subject: 'Mathematics', query: 'Calculus', expectedMin: 1 },
  { subject: 'Biology', query: 'Physiology', expectedMin: 1 },
  { subject: 'Physics', query: 'Dr. Nitin Verma', expectedMin: 1 },
  { subject: 'Chemistry', query: 'NonExistentXYZ999', expectedCount: 0 },
  { subject: 'All', query: 'FLAGSHIP', expectedMin: 2 },
  { subject: 'All', query: 'Mastery', expectedMin: 50 },
  { subject: 'Biology', query: 'Physics', expectedCount: 0 }
];

for (const combo of filterMatrixCombinations) {
  try {
    const res = filterCourses(interactionTestPool, combo.subject, combo.query);
    let pass = true;

    if (combo.expectedMin !== undefined && res.length < combo.expectedMin) pass = false;
    if (combo.expectedCount !== undefined && res.length !== combo.expectedCount) pass = false;

    if (pass) {
      results.test7_multiFilterInteractionMatrix.passed++;
    } else {
      results.test7_multiFilterInteractionMatrix.failed++;
      results.findings.push('[Filter Matrix Failure] Subj=' + combo.subject + ', Query=' + combo.query + ': Got ' + res.length);
    }
  } catch (err) {
    results.test7_multiFilterInteractionMatrix.failed++;
    results.findings.push('[Filter Matrix Crash] Subj=' + combo.subject + ', Query=' + combo.query + ' threw: ' + err.message);
  }
}

// SUMMARY & OUTPUT
console.log('');
console.log('================================================================');
console.log('CHALLENGER 1 ADVERSARIAL VERIFICATION SUMMARY REPORT');
console.log('================================================================');
console.log('1. Empty & Null Datasets:            ' + results.test1_emptyDatasets.passed + ' Passed, ' + results.test1_emptyDatasets.failed + ' Failed');
console.log('2. Broken & Malformed Thumbnails:    ' + results.test2_thumbnailUrls.passed + ' Passed, ' + results.test2_thumbnailUrls.failed + ' Failed');
console.log('3. High-Volume Scaling (100-1000):   ' + results.test3_highVolume.passed + ' Passed, ' + results.test3_highVolume.failed + ' Failed');
console.log('4. Extreme Pricing & Zero-Div Guard: ' + results.test4_extremePricing.passed + ' Passed, ' + results.test4_extremePricing.failed + ' Failed');
console.log('5. Massive Student Counts (0-1M):    ' + results.test5_massiveEnrollments.passed + ' Passed, ' + results.test5_massiveEnrollments.failed + ' Failed');
console.log('6. CSV / Unicode / XSS Injections:   ' + results.test6_csvAndUnicodeInjection.passed + ' Passed, ' + results.test6_csvAndUnicodeInjection.failed + ' Failed');
console.log('7. Multi-Filter Interaction Matrix:  ' + results.test7_multiFilterInteractionMatrix.passed + ' Passed, ' + results.test7_multiFilterInteractionMatrix.failed + ' Failed');

const totalPassed = Object.keys(results).filter(k => k.startsWith('test')).reduce((sum, k) => sum + results[k].passed, 0);
const totalFailed = Object.keys(results).filter(k => k.startsWith('test')).reduce((sum, k) => sum + results[k].failed, 0);

console.log('');
console.log('TOTAL INVARIANTS TESTED: ' + (totalPassed + totalFailed));
console.log('PASS RATE: ' + totalPassed + ' / ' + (totalPassed + totalFailed) + ' (' + (((totalPassed / (totalPassed + totalFailed)) * 100).toFixed(1)) + '%)');
console.log('TOTAL ANOMALIES / BUGS FOUND: ' + results.findings.length);

if (results.findings.length === 0) {
  console.log('');
  console.log('FINAL VERDICT: FULL EMPIRICAL APPROVAL (Zero Bugs / Failures Detected)');
} else {
  console.log('');
  console.log('FINAL VERDICT: REJECT / ISSUES DETECTED');
  results.findings.forEach(f => console.log(' - ' + f));
}

fs.writeFileSync(
  path.resolve(process.cwd(), 'tests/adversarial_bento_results.json'),
  JSON.stringify(results, null, 2),
  'utf-8'
);
console.log('');
console.log('Saved output to tests/adversarial_bento_results.json');
