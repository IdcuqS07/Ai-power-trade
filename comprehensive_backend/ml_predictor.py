"""
Machine Learning Predictor for AI Trading Platform
Uses Random Forest Classifier for trade signal prediction
"""

import numpy as np
import pickle
import os
from datetime import datetime
from typing import Dict, List, Optional
import logging

logger = logging.getLogger(__name__)

try:
    from sklearn.ensemble import RandomForestClassifier
    from sklearn.preprocessing import StandardScaler
    SKLEARN_AVAILABLE = True
except ImportError:
    SKLEARN_AVAILABLE = False
    logger.warning("scikit-learn not installed. ML features disabled.")


class MLPredictor:
    """Machine Learning predictor using Random Forest"""
    
    def __init__(self):
        self.model = None
        self.scaler = None
        self.is_trained = False
        self.feature_names = [
            'rsi', 'macd', 'ma_diff', 'volatility', 
            'bb_position', 'volume_ratio', 'price_momentum'
        ]
        self.model_path = 'ml_model.pkl'
        self.scaler_path = 'ml_scaler.pkl'
        
        if SKLEARN_AVAILABLE:
            self.model = RandomForestClassifier(
                n_estimators=100,
                max_depth=10,
                min_samples_split=5,
                random_state=42
            )
            self.scaler = StandardScaler()
            self._load_model()
    
    def _load_model(self):
        """Load pre-trained model if exists"""
        try:
            if os.path.exists(self.model_path) and os.path.exists(self.scaler_path):
                with open(self.model_path, 'rb') as f:
                    self.model = pickle.load(f)
                with open(self.scaler_path, 'rb') as f:
                    self.scaler = pickle.load(f)
                self.is_trained = True
                logger.info("✓ ML model loaded successfully")
        except Exception as e:
            logger.warning(f"Could not load ML model: {e}")
    
    def _save_model(self):
        """Save trained model"""
        try:
            with open(self.model_path, 'wb') as f:
                pickle.dump(self.model, f)
            with open(self.scaler_path, 'wb') as f:
                pickle.dump(self.scaler, f)
            logger.info("✓ ML model saved successfully")
        except Exception as e:
            logger.error(f"Could not save ML model: {e}")
    
    def extract_features(self, indicators: Dict) -> List[float]:
        """Extract features from indicators for ML model"""
        features = [
            indicators.get('rsi', 50),
            indicators.get('macd', 0),
            indicators.get('ma_5', 0) - indicators.get('ma_20', 0),  # MA difference
            indicators.get('volatility', 0),
            (indicators.get('current_price', 0) - indicators.get('bb_lower', 0)) / 
            (indicators.get('bb_upper', 1) - indicators.get('bb_lower', 0) + 0.0001),  # BB position
            1.0,  # Volume ratio (placeholder)
            (indicators.get('current_price', 0) - indicators.get('ma_20', 0)) / 
            (indicators.get('ma_20', 1) + 0.0001)  # Price momentum
        ]
        return features
    
    def train(self, historical_trades: List[Dict]) -> Dict:
        """Train ML model on historical trades"""
        if not SKLEARN_AVAILABLE:
            return {"success": False, "error": "scikit-learn not installed"}
        
        if len(historical_trades) < 5:
            return {"success": False, "error": "Need at least 5 trades for training"}
        
        try:
            X = []
            y = []
            
            for trade in historical_trades:
                if 'indicators' in trade and 'profit_loss' in trade:
                    features = self.extract_features(trade['indicators'])
                    label = 1 if trade['profit_loss'] > 0 else 0
                    X.append(features)
                    y.append(label)
            
            if len(X) < 5:
                return {"success": False, "error": "Not enough valid training data"}
            
            X = np.array(X)
            y = np.array(y)
            
            # Normalize features
            X_scaled = self.scaler.fit_transform(X)
            
            # Train model
            self.model.fit(X_scaled, y)
            self.is_trained = True
            
            # Calculate training accuracy
            train_accuracy = self.model.score(X_scaled, y)
            
            # Save model
            self._save_model()
            
            logger.info(f"✓ ML model trained on {len(X)} samples")
            logger.info(f"✓ Training accuracy: {train_accuracy:.2%}")
            
            return {
                "success": True,
                "samples": len(X),
                "accuracy": round(train_accuracy, 4),
                "features": self.feature_names
            }
        
        except Exception as e:
            logger.error(f"Training error: {e}")
            return {"success": False, "error": str(e)}
    
    def predict(self, indicators: Dict) -> Optional[Dict]:
        """Predict trade outcome using ML model"""
        if not SKLEARN_AVAILABLE or not self.is_trained:
            return None
        
        try:
            features = self.extract_features(indicators)
            features_scaled = self.scaler.transform([features])
            
            # Get prediction
            prediction = self.model.predict(features_scaled)[0]
            probabilities = self.model.predict_proba(features_scaled)[0]
            
            # Get feature importance
            feature_importance = dict(zip(
                self.feature_names,
                self.model.feature_importances_
            ))
            
            return {
                "prediction": "BUY" if prediction == 1 else "SELL",
                "ml_confidence": float(probabilities[1]),
                "win_probability": float(probabilities[1]),
                "loss_probability": float(probabilities[0]),
                "model": "Random Forest",
                "feature_importance": {k: round(v, 4) for k, v in feature_importance.items()},
                "is_trained": True
            }
        
        except Exception as e:
            logger.error(f"Prediction error: {e}")
            return None
    
    def get_model_info(self) -> Dict:
        """Get ML model information"""
        if not SKLEARN_AVAILABLE:
            return {
                "available": False,
                "error": "scikit-learn not installed"
            }
        
        return {
            "available": True,
            "is_trained": self.is_trained,
            "model_type": "Random Forest Classifier",
            "n_estimators": 100,
            "features": self.feature_names,
            "model_exists": os.path.exists(self.model_path)
        }


# Singleton instance
ml_predictor = MLPredictor()
