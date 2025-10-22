const https = require('https');
const fs = require('fs');
const path = require('path');

// Create self-signed certificate for HTTPS
const forge = require('node-forge');
const pki = forge.pki;

// Generate a key pair
const keys = pki.rsa.generateKeyPair(2048);

// Create a certificate
const cert = pki.createCertificate();
cert.publicKey = keys.publicKey;
cert.serialNumber = '01';
cert.validity.notBefore = new Date();
cert.validity.notAfter = new Date();
cert.validity.notAfter.setFullYear(cert.validity.notBefore.getFullYear() + 1);

const attrs = [{
  name: 'countryName',
  value: 'US'
}, {
  name: 'stateOrProvinceName',
  value: 'Texas'
}, {
  name: 'localityName',
  value: 'Frisco'
}, {
  name: 'organizationName',
  value: 'Hanuman Temple'
}, {
  name: 'organizationalUnitName',
  value: 'DevineQ'
}, {
  name: 'commonName',
  value: 'localhost'
}];

cert.setSubject(attrs);
cert.setIssuer(attrs);
cert.sign(keys.privateKey);

// Convert to PEM format
const privateKeyPem = pki.privateKeyToPem(keys.privateKey);
const certPem = pki.certificateToPem(cert);

// Save to files
fs.writeFileSync('server.key', privateKeyPem);
fs.writeFileSync('server.crt', certPem);

console.log('✅ HTTPS certificates generated successfully!');
console.log('📁 Files created: server.key, server.crt');
console.log('🔐 You can now access the app via https://localhost:3000');
console.log('⚠️  You may need to accept the security warning in your browser');








