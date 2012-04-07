ImageProcess = (function() {

/**
 * Converts an RGB color value to HSV. Conversion formula
 * adapted from http://en.wikipedia.org/wiki/HSV_color_space.
 * Assumes r, g, and b are contained in the set [0, 255] and
 * returns h, s, and v in the set [0, 1].
 *
 * @param {number} r The red color value
 * @param {number} g The green color value
 * @param {number} b The blue color value
 * @return {!Array.<number>} The HSV representation
 */
function rgbToHsv(r, g, b){
    r = r/255, g = g/255, b = b/255;
    var max = Math.max(r, g, b), min = Math.min(r, g, b);
    var h, s, v = max;

    var d = max - min;
    s = max == 0 ? 0 : d / max;

    if(max == min){
        h = 0; // achromatic
    }else{
        switch(max){
            case r: h = (g - b) / d + (g < b ? 6 : 0); break;
            case g: h = (b - r) / d + 2; break;
            case b: h = (r - g) / d + 4; break;
        }
        h /= 6;
    }

    return [h, s, v];
}

/**
 * Converts an HSV color value to RGB. Conversion formula
 * adapted from http://en.wikipedia.org/wiki/HSV_color_space.
 * Assumes h, s, and v are contained in the set [0, 1] and
 * returns r, g, and b in the set [0, 255].
 *
 * @param {number} h The hue
 * @param {number} s The saturation
 * @param {number} v The value
 * @return {!Array.<number>} The RGB representation
 */
function hsvToRgb(h, s, v){
    var r, g, b;

    var i = Math.floor(h * 6);
    var f = h * 6 - i;
    var p = v * (1 - s);
    var q = v * (1 - f * s);
    var t = v * (1 - (1 - f) * s);

    switch(i % 6){
        case 0: r = v, g = t, b = p; break;
        case 1: r = q, g = v, b = p; break;
        case 2: r = p, g = v, b = t; break;
        case 3: r = p, g = q, b = v; break;
        case 4: r = t, g = p, b = v; break;
        case 5: r = v, g = p, b = q; break;
    }

    return [r * 255, g * 255, b * 255];
}

/**
 * Adjusts the hue, saturation and value of an image.
 * @param {!Image} image an Image tag
 * @param {number} hue The amount to adjust the eye in
 *        hue.
 * @param {number} saturation The amount to adjust the
 *     saturation.
 * @param {number} value. The amount to adjust the value.
 * @param {function(!Image)} callback. A callback with the new
 *     image
 */
function adjustHSV(image, hue, saturation, value, callback) {
    var canvas = document.createElement("canvas");
    var width = image.width;
    var height = image.height;
    canvas.width = width;
    canvas.height = height;
    var ctx = canvas.getContext("2d");
    ctx.drawImage(image, 0, 0);
    var imageData = ctx.getImageData(0, 0, width, height);
    var pixels = imageData.data;
    var numPixels = width * height;
    var numBytes = numPixels * 4;
    for (var offset = 0; offset < numBytes; offset += 4) {
        var hsv = rgbToHsv(pixels[offset + 0], pixels[offset + 1], pixels[offset + 2]);
        h = (hsv[0] + hue + 100) % 1;
        s = Math.min(1, Math.max(0, hsv[1] + saturation));
        v = Math.min(1, Math.max(0, hsv[2] + value));
        var rgb = hsvToRgb(h, s, v);
        pixels[offset + 0] = rgb[0];
        pixels[offset + 1] = rgb[1];
        pixels[offset + 2] = rgb[2];
    }
    ctx.putImageData(imageData, 0, 0);
    var img = new Image();
    img.src = canvas.toDataURL();
    img.onload = function() {
        callback(img);
    }
}

return {
    adjustHSV: adjustHSV,

    dummy: null  // marks the end
};

}());
