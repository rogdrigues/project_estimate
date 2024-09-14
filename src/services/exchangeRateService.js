const exchangeRates = [
    { currency: 'USD', rateToUSD: 1 },  // 1 USD = 1 USD
    { currency: 'EUR', rateToUSD: 1.1 }, // 1 EUR = 1.1 USD
    { currency: 'JPY', rateToUSD: 0.007 }, // 1 JPY = 0.007 USD
    { currency: 'VND', rateToUSD: 0.000042 }, // 1 VND = 0.000042 USD
    { currency: 'GBP', rateToUSD: 1.3 }, // 1 GBP = 1.3 USD
    { currency: 'CAD', rateToUSD: 0.75 }, // 1 CAD = 0.75 USD
    { currency: 'AUD', rateToUSD: 0.7 },  // 1 AUD = 0.7 USD
    { currency: 'CNY', rateToUSD: 0.15 }, // 1 CNY = 0.15 USD
    { currency: 'KRW', rateToUSD: 0.00084 }, // 1 KRW = 0.00084 USD
    { currency: 'SGD', rateToUSD: 0.74 },  // 1 SGD = 0.74 USD
    { currency: 'INR', rateToUSD: 0.013 },  // 1 INR = 0.013 USD
    { currency: 'IDR', rateToUSD: 0.000065 }  // 1 IDR = 0.000065 USD
];
//unitPriceInUSD=unitPrice×conversionRate

const getConversionRate = (currency) => {
    const rateObject = exchangeRates.find(rate => rate.currency === currency);
    return rateObject ? rateObject.rateToUSD : 1;
};


module.exports = getConversionRate;
