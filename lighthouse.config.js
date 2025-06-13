
export default {
  extends: 'lighthouse:default',
  settings: {
    chromeFlags: ['--no-sandbox', '--headless', '--disable-gpu'],
    onlyCategories: ['performance', 'accessibility', 'best-practices'],
    throttlingMethod: 'devtools',
    skipAudits: ['uses-http2'], // Skip HTTP/2 audit for development
  },
  audits: [
    'metrics/largest-contentful-paint',
    'metrics/cumulative-layout-shift',
    'metrics/total-blocking-time',
  ],
};
