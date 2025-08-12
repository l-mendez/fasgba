#!/usr/bin/env node

// Simple script to test the email notification system
const fetch = require('node-fetch');

async function testEmail() {
  try {
    console.log('🧪 Testing email notification system...\n');
    
    const response = await fetch('http://localhost:3000/api/notifications/email/test', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const result = await response.json();
    
    if (response.ok) {
      console.log('✅ Test email sent successfully!');
      console.log('📧 Message ID:', result.messageId);
      console.log('📬 Recipient:', 'lolomendez985@gmail.com');
      console.log('\n📋 Check your email inbox to verify delivery.');
    } else {
      console.error('❌ Test failed:', result.error || result.message);
    }
  } catch (error) {
    console.error('❌ Error testing email system:', error.message);
    console.log('\n💡 Make sure:');
    console.log('   • The server is running (npm run dev)');
    console.log('   • The email credentials are configured correctly');
    console.log('   • You have internet connection');
  }
}

testEmail(); 