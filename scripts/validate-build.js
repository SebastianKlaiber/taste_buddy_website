#!/usr/bin/env node

/**
 * Build validation script for TasteBuddy website
 * 
 * This script validates that:
 * 1. All URLs in sitemap.xml have corresponding files in the dist folder
 * 2. Critical error pages (404.html, 500.html) exist
 * 3. All static routes are accessible
 * 
 * Usage: node scripts/validate-build.js
 */

import fs from 'fs';
import path from 'path';
import { DOMParser } from '@xmldom/xmldom';

// Colors for console output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
};

function log(color, message) {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function checkFileExists(filePath) {
  try {
    return fs.existsSync(filePath) && fs.statSync(filePath).isFile();
  } catch {
    return false;
  }
}

function urlToFilePath(url, distDir) {
  // Remove domain and protocol
  const pathname = new URL(url).pathname;
  
  // Handle root path
  if (pathname === '/') {
    return path.join(distDir, 'index.html');
  }
  
  // Handle paths with trailing slash - check for index.html
  if (pathname.endsWith('/')) {
    const indexPath = path.join(distDir, pathname.substring(1), 'index.html');
    if (checkFileExists(indexPath)) {
      return indexPath;
    }
  }
  
  // Handle paths without extension - Astro builds as directories
  const dirPath = path.join(distDir, pathname.substring(1), 'index.html');
  if (checkFileExists(dirPath)) {
    return dirPath;
  }
  
  // Handle direct .html files
  const htmlPath = path.join(distDir, pathname.substring(1));
  if (checkFileExists(htmlPath)) {
    return htmlPath;
  }
  
  // Handle .html extension
  const htmlExtPath = path.join(distDir, pathname.substring(1) + '.html');
  if (checkFileExists(htmlExtPath)) {
    return htmlExtPath;
  }
  
  return null;
}

function validateSitemap(sitemapPath, distDir) {
  log('blue', '📋 Validating sitemap URLs...');
  
  if (!checkFileExists(sitemapPath)) {
    log('red', `❌ Sitemap not found: ${sitemapPath}`);
    return { passed: false, errors: ['Sitemap file missing'] };
  }
  
  const sitemapContent = fs.readFileSync(sitemapPath, 'utf-8');
  const parser = new DOMParser();
  const doc = parser.parseFromString(sitemapContent, 'text/xml');
  
  const urls = Array.from(doc.getElementsByTagName('loc')).map(loc => loc.textContent);
  
  log('blue', `Found ${urls.length} URLs in sitemap`);
  
  const results = {
    passed: true,
    errors: [],
    warnings: [],
    total: urls.length,
    found: 0,
    missing: 0
  };
  
  for (const url of urls) {
    const filePath = urlToFilePath(url, distDir);
    
    if (filePath && checkFileExists(filePath)) {
      results.found++;
      log('green', `✅ ${url} -> ${path.relative(process.cwd(), filePath)}`);
    } else {
      results.missing++;
      results.errors.push(`Missing file for URL: ${url}`);
      log('red', `❌ ${url} -> No corresponding file found`);
    }
  }
  
  if (results.missing > 0) {
    results.passed = false;
  }
  
  return results;
}

function validateErrorPages(distDir) {
  log('blue', '🚨 Validating error pages...');
  
  const errorPages = [
    { name: '404 page', path: path.join(distDir, '404.html') },
    { name: '404 directory page', path: path.join(distDir, '404', 'index.html') },
    { name: '500 page', path: path.join(distDir, '500.html') }
  ];
  
  const results = {
    passed: true,
    errors: [],
    found: []
  };
  
  for (const errorPage of errorPages) {
    if (checkFileExists(errorPage.path)) {
      results.found.push(errorPage.name);
      log('green', `✅ ${errorPage.name} found: ${path.relative(process.cwd(), errorPage.path)}`);
    } else {
      results.errors.push(`Missing ${errorPage.name}: ${errorPage.path}`);
      log('yellow', `⚠️  ${errorPage.name} not found: ${errorPage.path}`);
    }
  }
  
  // At least one 404 page must exist
  const has404 = errorPages.slice(0, 2).some(page => checkFileExists(page.path));
  if (!has404) {
    results.passed = false;
    log('red', '❌ No 404 page found! This is critical.');
  }
  
  return results;
}

function validateCriticalFiles(distDir) {
  log('blue', '📁 Validating critical files...');
  
  const criticalFiles = [
    'index.html',
    '_redirects',
    'about/index.html',
    'contact/index.html'
  ];
  
  const results = {
    passed: true,
    errors: [],
    found: 0,
    missing: 0
  };
  
  for (const file of criticalFiles) {
    const filePath = path.join(distDir, file);
    if (checkFileExists(filePath)) {
      results.found++;
      log('green', `✅ ${file}`);
    } else {
      results.missing++;
      results.errors.push(`Missing critical file: ${file}`);
      log('red', `❌ ${file}`);
    }
  }
  
  if (results.missing > 0) {
    results.passed = false;
  }
  
  return results;
}

async function main() {
  const distDir = path.join(process.cwd(), 'dist');
  const sitemapPath = path.join(process.cwd(), 'public', 'sitemap.xml');
  
  log('blue', '🔍 Starting build validation...');
  log('blue', `📂 Dist directory: ${distDir}`);
  log('blue', `📄 Sitemap path: ${sitemapPath}`);
  
  if (!fs.existsSync(distDir)) {
    log('red', '❌ Dist directory not found! Run `npm run build` first.');
    process.exit(1);
  }
  
  console.log('\\n');
  
  // Validate sitemap URLs
  const sitemapResults = validateSitemap(sitemapPath, distDir);
  
  console.log('\\n');
  
  // Validate error pages
  const errorPageResults = validateErrorPages(distDir);
  
  console.log('\\n');
  
  // Validate critical files
  const criticalFileResults = validateCriticalFiles(distDir);
  
  console.log('\\n');
  
  // Summary
  log('blue', '📊 VALIDATION SUMMARY');
  log('blue', '==================');
  
  console.log(`📋 Sitemap URLs: ${sitemapResults.found}/${sitemapResults.total} found`);
  console.log(`🚨 Error pages: ${errorPageResults.found.length} found`);
  console.log(`📁 Critical files: ${criticalFileResults.found}/${criticalFileResults.found + criticalFileResults.missing} found`);
  
  const allPassed = sitemapResults.passed && errorPageResults.passed && criticalFileResults.passed;
  
  if (allPassed) {
    log('green', '\\n🎉 All validations passed! Your build looks good.');
    process.exit(0);
  } else {
    log('red', '\\n❌ Some validations failed. Please fix the issues above.');
    
    // Show all errors
    const allErrors = [
      ...sitemapResults.errors,
      ...errorPageResults.errors,
      ...criticalFileResults.errors
    ];
    
    if (allErrors.length > 0) {
      log('red', '\\n🔍 ERRORS FOUND:');
      allErrors.forEach(error => log('red', `  • ${error}`));
    }
    
    process.exit(1);
  }
}

// Entry point
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export { validateSitemap, validateErrorPages, validateCriticalFiles };