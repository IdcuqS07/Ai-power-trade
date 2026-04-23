"""
LSTM-based Price Predictor for AI Trading Platform
Uses TensorFlow/Keras LSTM model for time series prediction
"""

import numpy as np
import pickle
import os
from datetime import datetime
from typing import Dict, List, Optional, Tuple
import logging

logger = logging.getLogger(__name__)

try:
    import tensorflow as tf
    from tensorflow import keras
    from tensorflow.keras.models import Sequential, load_model
    from tensorflow.keras.layers import LSTM, Dense, Dropout
    from tensorflow.keras.optimizers import Adam
    TENSORFLOW_AVAILABLE = True
    logger.info("✓ TensorFlow available")
except ImportError:
    TENSORFLOW_AVAILABLE = False
    logger.warning("TensorFlow not installed. LSTM features disabled.")


class LSTMPredictor:
    """LSTM-based predictor for cryptocurrency price prediction"""
    
    def __init__(self, sequence_length: int = 60):
        self.model = None
        self.sequence_length = sequence_length
        self.is_trained = False
        self.model_path = 'lstm_model.h5'
        self.scaler_path = 'lstm_scaler.pkl'
        self.scaler = None
        self.feature_names = [
            'price', 'rsi', 'macd', 'volume', 
            'ma_5', 'ma_20', 'bb_upper', 'bb_lower'
        ]
        
        if TENSORFLOW_AVAILABLE:
            self._load_model()
    
    def _create_model(self, input_shape: Tuple[int, int]) -> Sequential:
        """Create LSTM model architecture"""
        model = Sequential([
            LSTM(50, return_sequences=True, input_shape=input_shape),
            Dropout(0.2),
            LSTM(50, return_sequences=True),
            Dropout(0.2),
            LSTM(50),
            Dropout(0.2),
            Dense(25, activation='relu'),
            Dense(1)  # Predict next price
        ])
        
        model.compile(
            optimizer=Adam(learning_rate=0.001),
            loss='mean_squared_error',
            metrics=['mae']
        )
        
        return model
    
    def _load_model(self):
        """Load pre-trained LSTM model if exists"""
        try:
            if os.path.exists(self.model_path):
                self.model = load_model(self.model_path)
                self.is_trained = True
                logger.info("✓ LSTM model loaded successfully")
            
            if os.path.exists(self.scaler_path):
                with open(self.scaler_path, 'rb') as f:
                    self.scaler = pickle.load(f)
                logger.info("✓ LSTM scaler loaded successfully")
        except Exception as e:
            logger.warning(f"Could not load LSTM model: {e}")
    
    def _save_model(self):
        """Save trained LSTM model"""
        try:
            if self.model:
                self.model.save(self.model_path)
                logger.info("✓ LSTM model saved successfully")
            
            if self.scaler:
                with open(self.scaler_path, 'wb') as f:
                    pickle.dump(self.scaler, f)
                logger.info("✓ LSTM scaler saved successfully")
        except Exception as e:
            logger.error(f"Could not save LSTM model: {e}")
    
    def prepare_data(self, price_history: List[Dict]) -> Tuple[np.ndarray, np.ndarray]:
        """Prepare data for LSTM training"""
        if len(price_history) < self.sequence_length + 1:
            raise ValueError(f"Need at least {self.sequence_length + 1} data points")
        
        # Extract features
        features = []
        for data in price_history:
            feature_vector = [
                data.get('price', 0),
                data.get('rsi', 50),
                data.get('macd', 0),
                data.get('volume', 0),
                data.get('ma_5', 0),
                data.get('ma_20', 0),
                data.get('bb_upper', 0),
                data.get('bb_lower', 0)
            ]
            features.append(feature_vector)
        
        features = np.array(features)
        
        # Normalize data
        if self.scaler is None:
            from sklearn.preprocessing import MinMaxScaler
            self.scaler = MinMaxScaler(feature_range=(0, 1))
            features_scaled = self.scaler.fit_transform(features)
        else:
            features_scaled = self.scaler.transform(features)
        
        # Create sequences
        X, y = [], []
        for i in range(self.sequence_length, len(features_scaled)):
            X.append(features_scaled[i-self.sequence_length:i])
            y.append(features_scaled[i, 0])  # Predict price (first feature)
        
        return np.array(X), np.array(y)
    
    def train(self, price_history: List[Dict], epochs: int = 50, batch_size: int = 32) -> Dict:
        """Train LSTM model on historical price data"""
        if not TENSORFLOW_AVAILABLE:
            return {"success": False, "error": "TensorFlow not installed"}
        
        try:
            # Prepare data
            X, y = self.prepare_data(price_history)
            
            # Split train/validation
            split = int(0.8 * len(X))
            X_train, X_val = X[:split], X[split:]
            y_train, y_val = y[:split], y[split:]
            
            # Create model
            if self.model is None:
                self.model = self._create_model((X.shape[1], X.shape[2]))
            
            # Train model
            history = self.model.fit(
                X_train, y_train,
                validation_data=(X_val, y_val),
                epochs=epochs,
                batch_size=batch_size,
                verbose=0
            )
            
            self.is_trained = True
            
            # Save model
            self._save_model()
            
            # Get final metrics
            train_loss = history.history['loss'][-1]
            val_loss = history.history['val_loss'][-1]
            
            logger.info(f"✓ LSTM model trained on {len(X)} sequences")
            logger.info(f"✓ Training loss: {train_loss:.6f}, Validation loss: {val_loss:.6f}")
            
            return {
                "success": True,
                "samples": len(X),
                "train_loss": float(train_loss),
                "val_loss": float(val_loss),
                "epochs": epochs,
                "sequence_length": self.sequence_length
            }
        
        except Exception as e:
            logger.error(f"LSTM training error: {e}")
            return {"success": False, "error": str(e)}
    
    def predict(self, recent_data: List[Dict]) -> Optional[Dict]:
        """Predict next price using LSTM model"""
        if not TENSORFLOW_AVAILABLE or not self.is_trained:
            return None
        
        if len(recent_data) < self.sequence_length:
            return None
        
        try:
            # Prepare input sequence
            features = []
            for data in recent_data[-self.sequence_length:]:
                feature_vector = [
                    data.get('price', 0),
                    data.get('rsi', 50),
                    data.get('macd', 0),
                    data.get('volume', 0),
                    data.get('ma_5', 0),
                    data.get('ma_20', 0),
                    data.get('bb_upper', 0),
                    data.get('bb_lower', 0)
                ]
                features.append(feature_vector)
            
            features = np.array(features)
            features_scaled = self.scaler.transform(features)
            
            # Reshape for LSTM
            X = features_scaled.reshape(1, self.sequence_length, len(self.feature_names))
            
            # Predict
            prediction_scaled = self.model.predict(X, verbose=0)[0][0]
            
            # Inverse transform to get actual price
            dummy = np.zeros((1, len(self.feature_names)))
            dummy[0, 0] = prediction_scaled
            prediction = self.scaler.inverse_transform(dummy)[0, 0]
            
            current_price = recent_data[-1].get('price', 0)
            price_change = ((prediction - current_price) / current_price) * 100
            
            # Calculate confidence based on recent prediction accuracy
            confidence = self._calculate_confidence(price_change)
            
            return {
                "predicted_price": float(prediction),
                "current_price": float(current_price),
                "price_change_percent": float(price_change),
                "confidence": confidence,
                "model": "LSTM",
                "sequence_length": self.sequence_length,
                "is_trained": True
            }
        
        except Exception as e:
            logger.error(f"LSTM prediction error: {e}")
            return None
    
    def _calculate_confidence(self, price_change: float) -> float:
        """Calculate confidence score based on price change magnitude"""
        # Higher confidence for moderate predictions
        # Lower confidence for extreme predictions
        abs_change = abs(price_change)
        
        if abs_change < 1:
            return 0.85
        elif abs_change < 3:
            return 0.75
        elif abs_change < 5:
            return 0.65
        else:
            return 0.55
    
    def get_model_info(self) -> Dict:
        """Get LSTM model information"""
        if not TENSORFLOW_AVAILABLE:
            return {
                "available": False,
                "error": "TensorFlow not installed"
            }
        
        return {
            "available": True,
            "is_trained": self.is_trained,
            "model_type": "LSTM Neural Network",
            "sequence_length": self.sequence_length,
            "features": self.feature_names,
            "model_exists": os.path.exists(self.model_path)
        }


# Singleton instance
lstm_predictor = LSTMPredictor()
