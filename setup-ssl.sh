#!/bin/bash

# Phone Shaker SSL Setup Script
echo "Setting up SSL certificates for Phone Shaker..."

# Check if certificates already exist
if [ -f "localhost.pem" ] && [ -f "localhost-key.pem" ]; then
    echo "SSL certificates already exist!"
    exit 0
fi

# Method 1: Try mkcert (preferred)
if command -v mkcert &> /dev/null; then
    echo "Using mkcert..."
    mkcert -install
    mkcert localhost 127.0.0.1 ::1
    echo "SSL certificates created with mkcert!"
    exit 0
fi

# Method 2: Use OpenSSL
if command -v openssl &> /dev/null; then
    echo "Using OpenSSL..."
    
    # Generate private key
    openssl genrsa -out localhost-key.pem 2048
    
    # Create config file
    cat > localhost.conf << EOF
[req]
distinguished_name = req_distinguished_name
req_extensions = v3_req
prompt = no

[req_distinguished_name]
C = US
ST = California
L = San Francisco
O = Local Development
CN = localhost

[v3_req]
basicConstraints = CA:FALSE
keyUsage = critical, digitalSignature, keyEncipherment
extendedKeyUsage = serverAuth
subjectAltName = @alt_names

[alt_names]
DNS.1 = localhost
DNS.2 = 127.0.0.1
IP.1 = 127.0.0.1
IP.2 = ::1
EOF
    
    # Generate certificate
    openssl req -new -x509 -key localhost-key.pem -out localhost.pem -days 365 -config localhost.conf -extensions v3_req
    
    # Clean up
    rm localhost.conf
    
    echo "SSL certificates created with OpenSSL!"
    echo ""
    echo "⚠️  IMPORTANT: You need to trust the certificate in your browser:"
    echo "   1. Open https://localhost:5174/ in your browser"
    echo "   2. Click 'Advanced' when you see the security warning"
    echo "   3. Click 'Proceed to localhost (unsafe)'"
    echo "   4. Or add the certificate to your browser's trusted certificates"
    echo ""
    echo "📱 For mobile testing:"
    echo "   1. Connect your phone to the same WiFi network"
    echo "   2. Visit https://YOUR_IP:5174/ (replace YOUR_IP with your computer's IP)"
    echo "   3. Accept the certificate warning"
    echo ""
    exit 0
fi

echo "❌ Error: Neither mkcert nor openssl found!"
echo "Please install one of them:"
echo "  - mkcert: https://github.com/FiloSottile/mkcert"
echo "  - openssl: Usually pre-installed on most systems"
exit 1