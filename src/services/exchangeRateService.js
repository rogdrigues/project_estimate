const axios = require('axios');

const getConversionRate = async (currency) => {
    try {
        const response = await axios.get(`https://api.exchangeratesapi.io/latest?base=${currency}&symbols=USD`);
        const conversionRate = response.data.rates.USD;
        return conversionRate;
    } catch (error) {
        console.error('Error fetching conversion rate:', error.message);
        throw new Error('Could not fetch conversion rate');
    }
};

module.exports = getConversionRate;