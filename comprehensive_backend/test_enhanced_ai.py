"""
Test Script for Enhanced AI Features
Tests LSTM, CoinGecko, and Enhanced Predictor
"""

import requests
import time
import json
from datetime import datetime

API_URL = "http://localhost:8000"

def print_header(text):
    print("\n" + "="*60)
    print(f"  {text}")
    print("="*60)

def print_result(success, message):
    status = "✓" if success else "✗"
    color = "\033[92m" if success else "\033[91m"
    reset = "\033[0m"
    print(f"{color}{status} {message}{reset}")

def test_model_status():
    print_header("Test 1: Model Status")
    try:
        response = requests.get(f"{API_URL}/api/ai/model-status")
        data = response.json()
        
        if data.get("success"):
            print_result(True, "Model status endpoint working")
            
            # Check LSTM
            lstm = data["data"].get("lstm", {})
            print(f"  LSTM: {'Trained' if lstm.get('is_trained') else 'Not Trained'}")
            
            # Check Random Forest
            rf = data["data"].get("random_forest", {})
            print(f"  Random Forest: {'Trained' if rf.get('is_trained') else 'Not Trained'}")
            
            # Check CoinGecko
            cg = data["data"].get("coingecko", {})
            print(f"  CoinGecko: {'Available' if cg.get('available') else 'Unavailable'}")

            # Check SoSoValue
            soso = data["data"].get("sosovalue", {})
            print(f"  SoSoValue: {'Enabled' if soso.get('enabled') else 'Not Configured'}")
            
            return True
        else:
            print_result(False, f"Failed: {data.get('error')}")
            return False
    except Exception as e:
        print_result(False, f"Error: {e}")
        return False

def test_coingecko_api():
    print_header("Test 2: CoinGecko API")
    try:
        # Test price data
        response = requests.get(f"{API_URL}/api/ai/coingecko/BTC")
        data = response.json()
        
        if data.get("success"):
            market_data = data["data"]
            print_result(True, "CoinGecko API working")
            print(f"  BTC Price: ${market_data.get('price', 0):,.2f}")
            print(f"  24h Change: {market_data.get('price_change_24h', 0):.2f}%")
            print(f"  Market Cap: ${market_data.get('market_cap', 0)/1e9:.2f}B")
            print(f"  Volume 24h: ${market_data.get('volume_24h', 0)/1e9:.2f}B")
            return True
        else:
            print_result(False, f"Failed: {data.get('error')}")
            return False
    except Exception as e:
        print_result(False, f"Error: {e}")
        return False

def test_global_market():
    print_header("Test 3: Global Market Data")
    try:
        response = requests.get(f"{API_URL}/api/ai/global-market")
        data = response.json()
        
        if data.get("success"):
            global_data = data["data"]
            print_result(True, "Global market data working")
            print(f"  Total Market Cap: ${global_data.get('total_market_cap_usd', 0)/1e12:.2f}T")
            print(f"  24h Volume: ${global_data.get('total_volume_24h_usd', 0)/1e9:.2f}B")
            print(f"  BTC Dominance: {global_data.get('bitcoin_dominance', 0):.1f}%")
            print(f"  Active Coins: {global_data.get('active_cryptocurrencies', 0):,}")
            return True
        else:
            print_result(False, f"Failed: {data.get('error')}")
            return False
    except Exception as e:
        print_result(False, f"Error: {e}")
        return False

def test_trending_coins():
    print_header("Test 4: Trending Coins")
    try:
        response = requests.get(f"{API_URL}/api/ai/trending")
        data = response.json()
        
        if data.get("success"):
            trending = data["data"]
            print_result(True, f"Found {len(trending)} trending coins")
            for i, coin in enumerate(trending[:5], 1):
                print(f"  {i}. {coin['symbol'].upper()} - {coin['name']}")
            return True
        else:
            print_result(False, f"Failed: {data.get('error')}")
            return False
    except Exception as e:
        print_result(False, f"Error: {e}")
        return False

def test_market_sentiment():
    print_header("Test 5: Market Sentiment")
    try:
        response = requests.get(f"{API_URL}/api/ai/market-sentiment/BTC")
        data = response.json()
        
        if data.get("success"):
            sentiment = data["data"]
            print_result(True, "Market sentiment working")
            print(f"  Sentiment Up: {sentiment.get('sentiment_up', 0):.1f}%")
            print(f"  Sentiment Down: {sentiment.get('sentiment_down', 0):.1f}%")
            print(f"  Twitter Followers: {sentiment.get('twitter_followers', 0):,}")
            print(f"  Reddit Subscribers: {sentiment.get('reddit_subscribers', 0):,}")
            return True
        else:
            print_result(False, f"Failed: {data.get('error')}")
            return False
    except Exception as e:
        print_result(False, f"Error: {e}")
        return False

def test_enhanced_prediction():
    print_header("Test 6: Enhanced Prediction")
    try:
        response = requests.get(f"{API_URL}/api/ai/enhanced-prediction/BTC")
        data = response.json()
        
        if data.get("success"):
            pred = data["data"]
            print_result(True, "Enhanced prediction working")
            print(f"  Signal: {pred.get('signal', 'N/A')}")
            print(f"  Confidence: {pred.get('confidence', 0)*100:.1f}%")
            print(f"  Level: {pred.get('confidence_level', 'N/A')}")
            print(f"  Color: {pred.get('confidence_color', 'N/A')}")
            print(f"  Models Used: {pred.get('models_used', 0)}")
            print(f"  Alignment: {pred.get('signal_alignment', 'N/A')}")
            print(f"  Confirmation Required: {pred.get('confirmation_required', False)}")
            
            # Show model breakdown
            if 'models' in pred:
                print("\n  Model Breakdown:")
                if 'lstm' in pred['models']:
                    lstm = pred['models']['lstm']
                    print(f"    LSTM: {lstm.get('price_change', 0):.2f}% change")
                if 'random_forest' in pred['models']:
                    rf = pred['models']['random_forest']
                    print(f"    Random Forest: {rf.get('signal', 'N/A')}")
                if 'sosovalue' in pred['models']:
                    soso = pred['models']['sosovalue']
                    print(f"    SoSoValue: {soso.get('macro_regime', 'N/A')} / catalyst {soso.get('catalyst_score', 0):.1f}")
            
            return True
        else:
            print_result(False, f"Failed: {data.get('error')}")
            return False
    except Exception as e:
        print_result(False, f"Error: {e}")
        return False

def test_lstm_prediction():
    print_header("Test 7: LSTM Prediction")
    try:
        response = requests.get(f"{API_URL}/api/ai/lstm/predict/BTC")
        data = response.json()
        
        if data.get("success"):
            pred = data["data"]
            print_result(True, "LSTM prediction working")
            print(f"  Current Price: ${pred.get('current_price', 0):,.2f}")
            print(f"  Predicted Price: ${pred.get('predicted_price', 0):,.2f}")
            print(f"  Price Change: {pred.get('price_change_percent', 0):.2f}%")
            print(f"  Confidence: {pred.get('confidence', 0)*100:.1f}%")
            return True
        else:
            error = data.get('error', 'Unknown error')
            if 'not trained' in error.lower():
                print_result(False, "LSTM model not trained yet")
                print("  Run: curl -X POST 'http://localhost:8000/api/ai/lstm/train?symbol=BTC&epochs=50'")
            else:
                print_result(False, f"Failed: {error}")
            return False
    except Exception as e:
        print_result(False, f"Error: {e}")
        return False

def test_confidence_thresholds():
    print_header("Test 8: Confidence Thresholds")
    try:
        response = requests.get(f"{API_URL}/api/ai/confidence-thresholds")
        data = response.json()
        
        if data.get("success"):
            thresholds = data["data"]["thresholds"]
            colors = data["data"]["colors"]
            print_result(True, "Confidence thresholds configured")
            print(f"  High (Green): ≥{thresholds['high']*100:.0f}%")
            print(f"  Medium (Yellow): ≥{thresholds['medium']*100:.0f}%")
            print(f"  Low (Red): <{thresholds['medium']*100:.0f}%")
            return True
        else:
            print_result(False, f"Failed: {data.get('error')}")
            return False
    except Exception as e:
        print_result(False, f"Error: {e}")
        return False

def run_all_tests():
    print("\n" + "🚀 Enhanced AI Features Test Suite")
    print(f"Testing API at: {API_URL}")
    print(f"Time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    
    tests = [
        ("Model Status", test_model_status),
        ("CoinGecko API", test_coingecko_api),
        ("Global Market", test_global_market),
        ("Trending Coins", test_trending_coins),
        ("Market Sentiment", test_market_sentiment),
        ("Enhanced Prediction", test_enhanced_prediction),
        ("LSTM Prediction", test_lstm_prediction),
        ("Confidence Thresholds", test_confidence_thresholds),
    ]
    
    results = []
    for name, test_func in tests:
        try:
            result = test_func()
            results.append((name, result))
            time.sleep(2)  # Rate limiting for CoinGecko
        except Exception as e:
            print_result(False, f"{name} crashed: {e}")
            results.append((name, False))
    
    # Summary
    print_header("Test Summary")
    passed = sum(1 for _, result in results if result)
    total = len(results)
    
    for name, result in results:
        print_result(result, name)
    
    print(f"\n  Total: {passed}/{total} tests passed")
    print(f"  Success Rate: {passed/total*100:.1f}%")
    
    if passed == total:
        print("\n  🎉 All tests passed! Enhanced AI is working perfectly!")
    elif passed >= total * 0.7:
        print("\n  ⚠️  Most tests passed. Check failed tests above.")
    else:
        print("\n  ❌ Many tests failed. Check your setup.")
    
    print("\n" + "="*60)

if __name__ == "__main__":
    try:
        run_all_tests()
    except KeyboardInterrupt:
        print("\n\nTests interrupted by user")
    except Exception as e:
        print(f"\n\nFatal error: {e}")
