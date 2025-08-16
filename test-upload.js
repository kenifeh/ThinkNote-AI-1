// Simple test script to test the upload API
const fs = require('fs');
const FormData = require('form-data');

async function testUpload() {
  try {
    // Create a simple test audio file (empty buffer for testing)
    const testBuffer = Buffer.alloc(1024); // 1KB test file
    
    const form = new FormData();
    form.append('file', testBuffer, {
      filename: 'test-audio.webm',
      contentType: 'audio/webm'
    });
    form.append('title', 'Test Recording');
    form.append('tags', 'test, audio');
    
    console.log('Testing upload API...');
    
    const response = await fetch('http://localhost:3000/api/upload', {
      method: 'POST',
      body: form,
      headers: {
        // Note: We'll need to handle authentication
        'Cookie': 'your-auth-cookie-here'
      }
    });
    
    if (response.ok) {
      const result = await response.json();
      console.log('Success:', result);
    } else {
      const error = await response.text();
      console.log('Error:', response.status, error);
    }
    
  } catch (error) {
    console.error('Test failed:', error);
  }
}

testUpload();
