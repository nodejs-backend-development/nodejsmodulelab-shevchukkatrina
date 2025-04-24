// transform.js
class UpperCaseTransform {
    static transformText(text) {
        return text.replace(/[a-zа-яіїєґ]/gi, char => char.toUpperCase());
    }
}

module.exports = UpperCaseTransform;
