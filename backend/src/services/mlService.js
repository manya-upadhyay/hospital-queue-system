const axios = require('axios');
const logger = require('../utils/logger');

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://localhost:8000';
const ML_TIMEOUT = 3000; // 3 second timeout - fallback to rule-based if slow

/**
 * Get wait time prediction from ML service
 */
const getMLPrediction = async (features) => {
  const response = await axios.post(
    `${ML_SERVICE_URL}/predict/wait-time`,
    features,
    { timeout: ML_TIMEOUT }
  );
  return response.data;
};

/**
 * Get no-show probability prediction
 */
const getNoShowProbability = async (features) => {
  try {
    const response = await axios.post(
      `${ML_SERVICE_URL}/predict/no-show`,
      features,
      { timeout: ML_TIMEOUT }
    );
    return response.data.no_show_probability;
  } catch (error) {
    logger.warn('ML no-show prediction failed, returning default', error.message);
    return 0.1; // default 10% probability
  }
};

/**
 * Health check for ML service
 */
const checkMLHealth = async () => {
  const response = await axios.get(`${ML_SERVICE_URL}/health`, { timeout: 2000 });
  return response.data;
};

module.exports = { getMLPrediction, getNoShowProbability, checkMLHealth };
