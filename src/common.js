/**
 * Specialized deep Object.extend function
 */
export function extend(defaults) {
    var extended = {};
    var prop;
    for (prop in defaults) {
        if (defaults.hasOwnProperty(prop)) {
            extended[prop] = defaults[prop];
        }
    }
    for (var i = 1; i < arguments.length; i++) {
        var options = arguments[i];
        for (prop in options) {
            if (options.hasOwnProperty(prop)) {
                if (typeof options[prop] === 'object' && !Array.isArray(options[prop])) {
                    extended[prop] = options[prop];
                } else {
                    extended[prop] = options[prop];
                }
            }
        }
    }
    return extended;
}