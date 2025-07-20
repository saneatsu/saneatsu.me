import { chromium } from '@playwright/test';

async function checkPage() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  try {
    console.log('Navigating to http://localhost:3000...');
    const response = await page.goto('http://localhost:3000', { 
      waitUntil: 'domcontentloaded',
      timeout: 10000 
    });
    
    console.log('Response status:', response?.status());
    
    // Get page title
    const title = await page.title();
    console.log('Page title:', title);
    
    // Get page content
    const content = await page.content();
    console.log('HTML length:', content.length);
    
    // Check for any error messages
    const bodyText = await page.textContent('body');
    console.log('Body text:', bodyText?.substring(0, 200));
    
    // Check console errors
    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.error('Console error:', msg.text());
      }
    });
    
    // Take a screenshot
    await page.screenshot({ path: 'page-screenshot.png' });
    console.log('Screenshot saved as page-screenshot.png');
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await browser.close();
  }
}

checkPage();