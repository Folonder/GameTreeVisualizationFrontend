export const formatNumber = (number) => {
    if (typeof number !== 'number') return '0';
    return number.toLocaleString();
};

export const formatPercentage = (value) => {
    if (typeof value !== 'number') return '0%';
    return `${Math.round(value * 100)}%`;
};