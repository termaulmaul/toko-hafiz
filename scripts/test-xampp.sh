#!/bin/bash

# Toko Hafiz - XAMPP Connection Test
# Test database connection with XAMPP MySQL

echo "🧪 Testing XAMPP MySQL Connection"
echo "=================================="

# XAMPP MySQL configuration
MYSQL_SOCKET="/Applications/XAMPP/xamppfiles/var/mysql/mysql.sock"
DB_NAME="db_toko_hafiz_simple"

# Check if XAMPP MySQL is running
echo "1. Checking XAMPP MySQL service..."
if pgrep mysqld > /dev/null; then
    echo "✅ MySQL service is running"
else
    echo "❌ MySQL service is not running"
    echo "💡 Start XAMPP MySQL: sudo /Applications/XAMPP/xamppfiles/xampp startmysql"
    exit 1
fi

# Check socket file
echo ""
echo "2. Checking MySQL socket..."
if [ -S "$MYSQL_SOCKET" ]; then
    echo "✅ MySQL socket exists: $MYSQL_SOCKET"
else
    echo "❌ MySQL socket not found: $MYSQL_SOCKET"
    echo "💡 Make sure XAMPP MySQL is properly installed"
    exit 1
fi

# Test database connection
echo ""
echo "3. Testing database connection..."
# Use XAMPP's MySQL client directly
MYSQL_CMD="/Applications/XAMPP/xamppfiles/bin/mysql -u root"
if $MYSQL_CMD -e "SELECT 1;" > /dev/null 2>&1; then
    echo "✅ MySQL connection successful (XAMPP)"
else
    echo "❌ MySQL connection failed"
    echo "💡 Check XAMPP MySQL is running: sudo /Applications/XAMPP/xamppfiles/xampp startmysql"
    exit 1
fi

# Check if database exists
echo ""
echo "4. Checking database..."
if $MYSQL_CMD -e "USE $DB_NAME; SELECT 1;" > /dev/null 2>&1; then
    echo "✅ Database '$DB_NAME' exists"
else
    echo "❌ Database '$DB_NAME' not found"
    echo "💡 Run setup script: ./scripts/setup-simple-db.sh"
    exit 1
fi

# Check tables
echo ""
echo "5. Checking tables..."
TABLES=$($MYSQL_CMD -D "$DB_NAME" -e "SHOW TABLES;" 2>/dev/null)
if echo "$TABLES" | grep -q "products\|training_data\|models"; then
    echo "✅ Required tables exist"
    echo "$TABLES"
else
    echo "❌ Some tables missing"
    echo "💡 Re-run setup script: ./scripts/setup-simple-db.sh"
    exit 1
fi

# Check data counts
echo ""
echo "6. Checking data counts..."
PRODUCTS_COUNT=$($MYSQL_CMD -D "$DB_NAME" -e "SELECT COUNT(*) as count FROM products;" 2>/dev/null | tail -1)
TRAINING_COUNT=$($MYSQL_CMD -D "$DB_NAME" -e "SELECT COUNT(*) as count FROM training_data WHERE is_training = 1;" 2>/dev/null | tail -1)
TEST_COUNT=$($MYSQL_CMD -D "$DB_NAME" -e "SELECT COUNT(*) as count FROM training_data WHERE is_training = 0;" 2>/dev/null | tail -1)

echo "📊 Products: $PRODUCTS_COUNT"
echo "📊 Training Data: $TRAINING_COUNT"
echo "📊 Test Data: $TEST_COUNT"

if [ "$PRODUCTS_COUNT" -gt 0 ] && [ "$TRAINING_COUNT" -gt 0 ]; then
    echo ""
    echo "🎉 XAMPP setup verification completed successfully!"
    echo ""
    echo "🚀 Ready to start the application:"
    echo "   Backend: node backend/server-simple.js"
    echo "   Frontend: npm run dev"
    echo "   Access: http://localhost:5173"
else
    echo ""
    echo "⚠️  Data verification failed. Please check setup."
    exit 1
fi