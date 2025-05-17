import fs from 'fs';
import path from 'path';

const credentialsPath = path.resolve('./comlab-monitoring-4ecec-a1e7074749a3.json');
const credentials = JSON.parse(fs.readFileSync(credentialsPath, 'utf8'));

// Check required fields
const requiredFields = [
  'type',
  'project_id',
  'private_key_id',
  'private_key',
  'client_email',
  'client_id',
  'auth_uri',
  'token_uri',
  'auth_provider_x509_cert_url',
  'client_x509_cert_url'
];

console.log('Verifying service account credentials...\n');

// Check if all required fields exist
const missingFields = requiredFields.filter(field => !credentials[field]);
if (missingFields.length > 0) {
  console.error('Missing required fields:', missingFields);
} else {
  console.log('✓ All required fields are present');
}

// Verify private key format
const privateKey = credentials.private_key;
if (privateKey.includes('-----BEGIN PRIVATE KEY-----') && 
    privateKey.includes('-----END PRIVATE KEY-----')) {
  console.log('✓ Private key appears to be in correct format');
} else {
  console.error('× Private key format is invalid');
}

// Check if client email is properly formatted
const emailRegex = /^[a-zA-Z0-9-]+@[a-zA-Z0-9-]+\.iam\.gserviceaccount\.com$/;
if (emailRegex.test(credentials.client_email)) {
  console.log('✓ Client email is properly formatted');
} else {
  console.error('× Client email format is invalid:', credentials.client_email);
}

// Print key details (without revealing sensitive information)
console.log('\nKey Details:');
console.log('Project ID:', credentials.project_id);
console.log('Client Email:', credentials.client_email);
console.log('Private Key ID:', credentials.private_key_id); 