#!/bin/bash

# 5th Wave Enhanced AI Installation Script
# Installs TensorFlow and all required dependencies

echo "=================================================="
echo "  🚀 5th Wave: Enhanced AI Installation"
echo "=================================================="
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if Python is installed
echo "Checking Python installation..."
if ! command -v python3 &> /dev/null; then
    echo -e "${RED}✗ Python 3 is not installed${NC}"
    echo "Please install Python 3.8+ first"
    exit 1
fi

PYTHON_VERSION=$(python3 --version | cut -d' ' -f2)
echo -e "${GREEN}✓ Python $PYTHON_VERSION found${NC}"
echo ""

# Navigate to backend directory
cd comprehensive_backend || {
    echo -e "${RED}✗ comprehensive_backend directory not found${NC}"
    exit 1
}

echo "Installing Python dependencies..."
echo ""

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    echo "Creating virtual environment..."
    python3 -m venv venv
    echo -e "${GREEN}✓ Virtual environment created${NC}"
else
    echo -e "${YELLOW}⚠ Virtual environment already exists${NC}"
fi

# Activate virtual environment
echo "Activating virtual environment..."
source venv/bin/activate || {
    echo -e "${RED}✗ Failed to activate virtual environment${NC}"
    exit 1
}
echo -e "${GREEN}✓ Virtual environment activated${NC}"
echo ""

# Upgrade pip
echo "Upgrading pip..."
pip install --upgrade pip > /dev/null 2>&1
echo -e "${GREEN}✓ pip upgraded${NC}"
echo ""

# Install requirements
echo "Installing requirements from requirements.txt..."
pip install -r requirements.txt

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ All dependencies installed successfully${NC}"
else
    echo -e "${RED}✗ Failed to install some dependencies${NC}"
    exit 1
fi

echo ""
echo "=================================================="
echo "  Verifying Installation"
echo "=================================================="
echo ""

# Verify TensorFlow
echo "Checking TensorFlow..."
python3 -c "import tensorflow as tf; print(f'✓ TensorFlow {tf.__version__} installed')" 2>/dev/null
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ TensorFlow working${NC}"
else
    echo -e "${RED}✗ TensorFlow not working${NC}"
fi

# Verify Keras
echo "Checking Keras..."
python3 -c "import keras; print(f'✓ Keras {keras.__version__} installed')" 2>/dev/null
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Keras working${NC}"
else
    echo -e "${RED}✗ Keras not working${NC}"
fi

# Verify scikit-learn
echo "Checking scikit-learn..."
python3 -c "import sklearn; print(f'✓ scikit-learn {sklearn.__version__} installed')" 2>/dev/null
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ scikit-learn working${NC}"
else
    echo -e "${RED}✗ scikit-learn not working${NC}"
fi

# Verify NumPy
echo "Checking NumPy..."
python3 -c "import numpy; print(f'✓ NumPy {numpy.__version__} installed')" 2>/dev/null
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ NumPy working${NC}"
else
    echo -e "${RED}✗ NumPy not working${NC}"
fi

echo ""
echo "=================================================="
echo "  Installation Complete!"
echo "=================================================="
echo ""
echo "Next steps:"
echo ""
echo "1. Start the backend:"
echo "   cd comprehensive_backend"
echo "   python main.py"
echo ""
echo "2. In another terminal, start the frontend:"
echo "   cd comprehensive_frontend"
echo "   npm run dev"
echo ""
echo "3. Access Enhanced AI Predictions:"
echo "   http://localhost:3000/ai-predictions"
echo ""
echo "4. Train LSTM model (optional):"
echo "   curl -X POST 'http://localhost:8000/api/ai/lstm/train?symbol=BTC&epochs=50'"
echo ""
echo "5. Run tests:"
echo "   python comprehensive_backend/test_enhanced_ai.py"
echo ""
echo "📚 Documentation:"
echo "   - 5TH_WAVE_IMPLEMENTATION.md"
echo "   - QUICK_START_5TH_WAVE.md"
echo "   - 5TH_WAVE_SUMMARY.md"
echo ""
echo -e "${GREEN}🎉 Happy trading with Enhanced AI!${NC}"
echo ""
