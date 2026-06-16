#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(prompt) {
  return new Promise(resolve => {
    rl.question(prompt, resolve);
  });
}

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  red: '\x1b[31m',
};

async function main() {
  console.log(`\n${colors.bright}${colors.blue}📧 Netlinkagencies Email Notifications Setup${colors.reset}`);
  console.log('='.repeat(50));
  
  try {
    // Step 1: Welcome
    console.log(`\n${colors.blue}Welcome! This helper will guide you through the setup.${colors.reset}`);
    
    // Step 2: Check if dependencies are installed
    console.log(`\n${colors.yellow}Checking dependencies...${colors.reset}`);
    
    try {
      require.resolve('@sendgrid/mail');
      console.log(`${colors.green}✅ SendGrid package found${colors.reset}`);
    } catch (e) {
      console.log(`${colors.red}❌ SendGrid not installed${colors.reset}`);
      console.log(`${colors.yellow}Run: npm install @sendgrid/mail${colors.reset}`);
    }
    
    // Step 3: Get SendGrid API Key
    console.log(`\n${colors.blue}Step 1: SendGrid API Key${colors.reset}`);
    console.log('Go to https://sendgrid.com → Settings → API Keys');
    const apiKey = await question(`${colors.yellow}Enter your SendGrid API Key (starts with SG.):${colors.reset} `);
    
    if (!apiKey.startsWith('SG.')) {
      console.log(`${colors.red}❌ Invalid API key format${colors.reset}`);
      process.exit(1);
    }
    
    // Step 4: Get Sender Email
    console.log(`\n${colors.blue}Step 2: Sender Email${colors.reset}`);
    console.log('This must be verified in SendGrid');
    const senderEmail = await question(`${colors.yellow}Enter sender email:${colors.reset} `) || 'noreply@netlinkagencies.com';
    
    // Step 5: Summary and next steps
    console.log(`\n${colors.green}=`.repeat(25));
    console.log(`Summary:${colors.reset}`);
    console.log(`  API Key: ${apiKey.substring(0, 10)}...`);
    console.log(`  Sender Email: ${senderEmail}`);
    console.log(`${colors.green}=`.repeat(25)}`);
    
    // Step 6: Provide Firebase commands
    console.log(`\n${colors.blue}📝 Next Steps:${colors.reset}\n`);
    console.log(`${colors.yellow}1. Run this Firebase command:${colors.reset}`);
    console.log(`   firebase functions:config:set sendgrid.api_key="${apiKey}" sendgrid.from_email="${senderEmail}"\n`);
    console.log(`${colors.yellow}2. Then deploy:${colors.reset}`);
    console.log(`   firebase deploy --only functions\n`);
    console.log(`${colors.yellow}3. Check logs:${colors.reset}`);
    console.log(`   firebase functions:log --limit 50\n`);
    
    console.log(`${colors.green}✅ Setup configuration complete!${colors.reset}\n`);
    
    rl.close();
    
  } catch (error) {
    console.error(`${colors.red}❌ Error: ${error.message}${colors.reset}`);
    rl.close();
    process.exit(1);
  }
}

main();
