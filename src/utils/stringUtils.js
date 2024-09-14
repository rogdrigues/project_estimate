const sanitizeString = (str) => {
    return str.trim();
};

const generateDisplayName = (username) => {
    const nameParts = username.split(' ');
    const lastName = nameParts[nameParts.length - 1];
    const initials = nameParts.slice(0, -1).map(name => name.charAt(0)).join('');
    const code = Math.floor(100 + Math.random() * 900);
    return `${lastName}${initials}${code}`;
};

module.exports = { sanitizeString, generateDisplayName };