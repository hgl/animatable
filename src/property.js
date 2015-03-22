// Copyright 2014 Google Inc. All rights reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
//     You may obtain a copy of the License at
//
// http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
//     See the License for the specific language governing permissions and
// limitations under the License.
//
// Changed by Glen Huang(hey.hgl at gmail) to use es2015 syntax
let webAnimationsShared = {};
let webAnimations1 = {};
let WEB_ANIMATIONS_TESTING = false;
let webAnimationsTesting = null;

// Copyright 2014 Google Inc. All rights reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
//   You may obtain a copy of the License at
//
// http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
//   See the License for the specific language governing permissions and
// limitations under the License.

(function(scope, testing) {

  var propertyHandlers = {};

  function addPropertyHandler(parser, merger, property) {
    propertyHandlers[property] = propertyHandlers[property] || [];
    propertyHandlers[property].push([parser, merger]);
  }
  function addPropertiesHandler(parser, merger, properties) {
    for (var i = 0; i < properties.length; i++) {
      var property = properties[i];
      WEB_ANIMATIONS_TESTING && console.assert(property.toLowerCase() === property);
      addPropertyHandler(parser, merger, property);
      if (/-/.test(property)) {
        // Add camel cased variant.
        addPropertyHandler(parser, merger, property.replace(/-(.)/g, function(_, c) {
          return c.toUpperCase();
        }));
      }
    }
  }
  scope.addPropertiesHandler = addPropertiesHandler;

  function propertyInterpolation(property, left, right) {
    var handlers = left == right ? [] : propertyHandlers[property];
    for (var i = 0; handlers && i < handlers.length; i++) {
      var parsedLeft = handlers[i][0](left);
      var parsedRight = handlers[i][0](right);
      if (parsedLeft !== undefined && parsedRight !== undefined) {
        var interpolationArgs = handlers[i][1](parsedLeft, parsedRight);
        if (interpolationArgs) {
          var interp = scope.Interpolation.apply(null, interpolationArgs);
          return function(t) {
            if (t == 0) return left;
            if (t == 1) return right;
            return interp(t);
          };
        }
      }
    }
    return scope.Interpolation(false, true, function(bool) {
      return bool ? right : left;
    });
  }
  scope.propertyInterpolation = propertyInterpolation;

})(webAnimations1, webAnimationsTesting);

// Copyright 2014 Google Inc. All rights reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
//     You may obtain a copy of the License at
//
// http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
//     See the License for the specific language governing permissions and
// limitations under the License.

(function(scope, testing) {

  function interpolate(from, to, f) {
    if ((typeof from == 'number') && (typeof to == 'number')) {
      return from * (1 - f) + to * f;
    }
    if ((typeof from == 'boolean') && (typeof to == 'boolean')) {
      return f < 0.5 ? from : to;
    }

    WEB_ANIMATIONS_TESTING && console.assert(
        Array.isArray(from) && Array.isArray(to),
        'If interpolation arguments are not numbers or bools they must be arrays');

    if (from.length == to.length) {
      var r = [];
      for (var i = 0; i < from.length; i++) {
        r.push(interpolate(from[i], to[i], f));
      }
      return r;
    }
    throw 'Mismatched interpolation arguments ' + from + ':' + to;
  }

  scope.Interpolation = function(from, to, convertToString) {
    return function(f) {
      return convertToString(interpolate(from, to, f));
    }
  };

  if (WEB_ANIMATIONS_TESTING) {
    testing.interpolate = interpolate;
  }

})(webAnimations1, webAnimationsTesting);
// Copyright 2014 Google Inc. All rights reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
//   You may obtain a copy of the License at
//
// http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
//   See the License for the specific language governing permissions and
// limitations under the License.

(function(scope) {

  // consume* functions return a 2 value array of [parsed-data, '' or not-yet consumed input]

  // Regex should be anchored with /^
  function consumeToken(regex, string) {
    var result = regex.exec(string);
    if (result) {
      result = regex.ignoreCase ? result[0].toLowerCase() : result[0];
      return [result, string.substr(result.length)];
    }
  }

  function consumeTrimmed(consumer, string) {
    string = string.replace(/^\s*/, '');
    var result = consumer(string);
    if (result) {
      return [result[0], result[1].replace(/^\s*/, '')];
    }
  }

  function consumeRepeated(consumer, separator, string) {
    consumer = consumeTrimmed.bind(null, consumer);
    var list = [];
    while (true) {
      var result = consumer(string);
      if (!result) {
        return [list, string];
      }
      list.push(result[0]);
      string = result[1];
      result = consumeToken(separator, string);
      if (!result || result[1] == '') {
        return [list, string];
      }
      string = result[1];
    }
  }

  // Consumes a token or expression with balanced parentheses
  function consumeParenthesised(parser, string) {
    var nesting = 0;
    for (var n = 0; n < string.length; n++) {
      if (/\s|,/.test(string[n]) && nesting == 0) {
        break;
      } else if (string[n] == '(') {
        nesting++;
      } else if (string[n] == ')') {
        nesting--;
        if (nesting == 0)
          n++;
        if (nesting <= 0)
          break;
      }
    }
    var parsed = parser(string.substr(0, n));
    return parsed == undefined ? undefined : [parsed, string.substr(n)];
  }

  function lcm(a, b) {
    var c = a;
    var d = b;
    while (c && d)
      c > d ? c %= d : d %= c;
    c = (a * b) / (c + d);
    return c;
  }

  function ignore(value) {
    return function(input) {
      var result = value(input);
      if (result)
        result[0] = undefined;
      return result;
    }
  }

  function optional(value, defaultValue) {
    return function(input) {
      var result = value(input);
      if (result)
        return result;
      return [defaultValue, input];
    }
  }

  function consumeList(list, input) {
    var output = [];
    for (var i = 0; i < list.length; i++) {
      var result = scope.consumeTrimmed(list[i], input);
      if (!result || result[0] == '')
        return;
      if (result[0] !== undefined)
        output.push(result[0]);
      input = result[1];
    }
    if (input == '') {
      return output;
    }
  }

  function mergeWrappedNestedRepeated(wrap, nestedMerge, separator, left, right) {
    var matchingLeft = [];
    var matchingRight = [];
    var reconsititution = [];
    var length = lcm(left.length, right.length);
    for (var i = 0; i < length; i++) {
      var thing = nestedMerge(left[i % left.length], right[i % right.length]);
      if (!thing) {
        return;
      }
      matchingLeft.push(thing[0]);
      matchingRight.push(thing[1]);
      reconsititution.push(thing[2]);
    }
    return [matchingLeft, matchingRight, function(positions) {
      var result = positions.map(function(position, i) {
        return reconsititution[i](position);
      }).join(separator);
      return wrap ? wrap(result) : result;
    }];
  }

  function mergeList(left, right, list) {
    var lefts = [];
    var rights = [];
    var functions = [];
    var j = 0;
    for (var i = 0; i < list.length; i++) {
      if (typeof list[i] == 'function') {
        var result = list[i](left[j], right[j++]);
        lefts.push(result[0]);
        rights.push(result[1]);
        functions.push(result[2]);
      } else {
        (function(pos) {
          lefts.push(false);
          rights.push(false);
          functions.push(function() { return list[pos]; });
        })(i);
      }
    }
    return [lefts, rights, function(results) {
      var result = '';
      for (var i = 0; i < results.length; i++) {
        result += functions[i](results[i]);
      }
      return result;
    }];
  }

  scope.consumeToken = consumeToken;
  scope.consumeTrimmed = consumeTrimmed;
  scope.consumeRepeated = consumeRepeated;
  scope.consumeParenthesised = consumeParenthesised;
  scope.ignore = ignore;
  scope.optional = optional;
  scope.consumeList = consumeList;
  scope.mergeNestedRepeated = mergeWrappedNestedRepeated.bind(null, null);
  scope.mergeWrappedNestedRepeated = mergeWrappedNestedRepeated;
  scope.mergeList = mergeList;

})(webAnimations1);
// Copyright 2014 Google Inc. All rights reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
//   You may obtain a copy of the License at
//
// http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
//   See the License for the specific language governing permissions and
// limitations under the License.

(function(scope) {

  function consumeShadow(string) {
    var shadow = {
      inset: false,
      lengths: [],
      color: null,
    };
    function consumePart(string) {
      var result = scope.consumeToken(/^inset/i, string);
      if (result) {
        shadow.inset = true;
        return result;
      }
      var result = scope.consumeLengthOrPercent(string);
      if (result) {
        shadow.lengths.push(result[0]);
        return result;
      }
      var result = scope.consumeColor(string);
      if (result) {
        shadow.color = result[0];
        return result;
      }
    }
    var result = scope.consumeRepeated(consumePart, /^/, string);
    if (result && result[0].length) {
      return [shadow, result[1]];
    }
  }

  function parseShadowList(string) {
    var result = scope.consumeRepeated(consumeShadow, /^,/, string);
    if (result && result[1] == '') {
      return result[0];
    }
  }

  function mergeShadow(left, right) {
    while (left.lengths.length < Math.max(left.lengths.length, right.lengths.length))
      left.lengths.push({px: 0});
    while (right.lengths.length < Math.max(left.lengths.length, right.lengths.length))
      right.lengths.push({px: 0});

    if (left.inset != right.inset || !!left.color != !!right.color) {
      return;
    }
    var lengthReconstitution = [];
    var colorReconstitution;
    var matchingLeft = [[], 0];
    var matchingRight = [[], 0];
    for (var i = 0; i < left.lengths.length; i++) {
      var mergedDimensions = scope.mergeDimensions(left.lengths[i], right.lengths[i], i == 2);
      matchingLeft[0].push(mergedDimensions[0]);
      matchingRight[0].push(mergedDimensions[1]);
      lengthReconstitution.push(mergedDimensions[2]);
    }
    if (left.color && right.color) {
      var mergedColor = scope.mergeColors(left.color, right.color);
      matchingLeft[1] = mergedColor[0];
      matchingRight[1] = mergedColor[1];
      colorReconstitution = mergedColor[2];
    }
    return [matchingLeft, matchingRight, function(value) {
      var result = left.inset ? 'inset ' : ' ';
      for (var i = 0; i < lengthReconstitution.length; i++) {
        result += lengthReconstitution[i](value[0][i]) + ' ';
      }
      if (colorReconstitution) {
        result += colorReconstitution(value[1]);
      }
      return result;
    }];
  }

  function mergeNestedRepeatedShadow(nestedMerge, separator, left, right) {
    var leftCopy = [];
    var rightCopy = [];
    function defaultShadow(inset) {
      return {inset: inset, color: [0, 0, 0, 0], lengths: [{px: 0}, {px: 0}, {px: 0}, {px: 0}]};
    }
    for (var i = 0; i < left.length || i < right.length; i++) {
      var l = left[i] || defaultShadow(right[i].inset);
      var r = right[i] || defaultShadow(left[i].inset);
      leftCopy.push(l);
      rightCopy.push(r);
    }
    return scope.mergeNestedRepeated(nestedMerge, separator, leftCopy, rightCopy);
  }

  var mergeShadowList = mergeNestedRepeatedShadow.bind(null, mergeShadow, ', ');
  scope.addPropertiesHandler(parseShadowList, mergeShadowList, ['box-shadow', 'text-shadow']);

})(webAnimations1);
// Copyright 2014 Google Inc. All rights reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
//   You may obtain a copy of the License at
//
// http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
//   See the License for the specific language governing permissions and
// limitations under the License.

(function(scope, testing) {

  function numberToString(x) {
    return x.toFixed(3).replace('.000', '');
  }

  function clamp(min, max, x) {
    return Math.min(max, Math.max(min, x));
  }

  function parseNumber(string) {
    if (/^\s*[-+]?(\d*\.)?\d+\s*$/.test(string))
      return Number(string);
  }

  function mergeNumbers(left, right) {
    return [left, right, numberToString];
  }

  // FIXME: This should probably go in it's own handler.
  function mergeFlex(left, right) {
    if (left == 0)
      return;
    return clampedMergeNumbers(0, Infinity)(left, right);
  }

  function mergePositiveIntegers(left, right) {
    return [left, right, function(x) {
      return Math.round(clamp(1, Infinity, x));
    }];
  }

  function clampedMergeNumbers(min, max) {
    return function(left, right) {
      return [left, right, function(x) {
        return numberToString(clamp(min, max, x));
      }];
    };
  }

  function round(left, right) {
    return [left, right, Math.round];
  }

  scope.clamp = clamp;
  scope.addPropertiesHandler(parseNumber, clampedMergeNumbers(0, Infinity), ['border-image-width', 'line-height']);
  scope.addPropertiesHandler(parseNumber, clampedMergeNumbers(0, 1), ['opacity', 'shape-image-threshold']);
  scope.addPropertiesHandler(parseNumber, mergeFlex, ['flex-grow', 'flex-shrink']);
  scope.addPropertiesHandler(parseNumber, mergePositiveIntegers, ['orphans', 'widows']);
  scope.addPropertiesHandler(parseNumber, round, ['z-index']);

  scope.parseNumber = parseNumber;
  scope.mergeNumbers = mergeNumbers;
  scope.numberToString = numberToString;

})(webAnimations1, webAnimationsTesting);
// Copyright 2014 Google Inc. All rights reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
//   You may obtain a copy of the License at
//
// http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
//   See the License for the specific language governing permissions and
// limitations under the License.

(function(scope, testing) {

  function merge(left, right) {
    if (left != 'visible' && right != 'visible') return;
    return [0, 1, function(x) {
      if (x <= 0) return left;
      if (x >= 1) return right;
      return 'visible';
    }];
  }

  scope.addPropertiesHandler(String, merge, ['visibility']);

})(webAnimations1);

// Copyright 2014 Google Inc. All rights reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
//   You may obtain a copy of the License at
//
// http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
//   See the License for the specific language governing permissions and
// limitations under the License.

(function(scope, testing) {

  var canvas = document.createElementNS('http://www.w3.org/1999/xhtml', 'canvas');
  canvas.width = canvas.height = 1;
  var context = canvas.getContext('2d');

  function parseColor(string) {
    string = string.trim();
    // The context ignores invalid colors
    context.fillStyle = '#000';
    context.fillStyle = string;
    var contextSerializedFillStyle = context.fillStyle;
    context.fillStyle = '#fff';
    context.fillStyle = string;
    if (contextSerializedFillStyle != context.fillStyle)
      return;
    context.fillRect(0, 0, 1, 1);
    var pixelColor = context.getImageData(0, 0, 1, 1).data;
    context.clearRect(0, 0, 1, 1);
    var alpha = pixelColor[3] / 255;
    return [pixelColor[0] * alpha, pixelColor[1] * alpha, pixelColor[2] * alpha, alpha];
  }

  function mergeColors(left, right) {
    return [left, right, function(x) {
      function clamp(v) {
        return Math.max(0, Math.min(255, v));
      }
      if (x[3]) {
        for (var i = 0; i < 3; i++)
          x[i] = Math.round(clamp(x[i] / x[3]));
      }
      x[3] = scope.numberToString(scope.clamp(0, 1, x[3]));
      return 'rgba(' + x.join(',') + ')';
    }];
  }

  scope.addPropertiesHandler(parseColor, mergeColors,
      ['background-color', 'border-bottom-color', 'border-left-color', 'border-right-color',
       'border-top-color', 'color', 'outline-color', 'text-decoration-color']);
  scope.consumeColor = scope.consumeParenthesised.bind(null, parseColor);
  scope.mergeColors = mergeColors;

  if (WEB_ANIMATIONS_TESTING) {
    testing.parseColor = parseColor;
  }

})(webAnimations1, webAnimationsTesting);
// Copyright 2014 Google Inc. All rights reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
//   You may obtain a copy of the License at
//
// http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
//   See the License for the specific language governing permissions and
// limitations under the License.

(function(scope, testing) {

  function parseDimension(unitRegExp, string) {
    string = string.trim().toLowerCase();

    if (string == '0' && 'px'.search(unitRegExp) >= 0)
      return {px: 0};

    // If we have parenthesis, we're a calc and need to start with 'calc'.
    if (!/^[^(]*$|^calc/.test(string))
      return;
    string = string.replace(/calc\(/g, '(');

    // We tag units by prefixing them with 'U' (note that we are already
    // lowercase) to prevent problems with types which are substrings of
    // each other (although prefixes may be problematic!)
    var matchedUnits = {};
    string = string.replace(unitRegExp, function(match) {
      matchedUnits[match] = null;
      return 'U' + match;
    });
    var taggedUnitRegExp = 'U(' + unitRegExp.source + ')';

    // Validating input is simply applying as many reductions as we can.
    var typeCheck = string.replace(/[-+]?(\d*\.)?\d+/g, 'N')
                          .replace(new RegExp('N' + taggedUnitRegExp, 'g'), 'D')
                          .replace(/\s[+-]\s/g, 'O')
                          .replace(/\s/g, '');
    var reductions = [/N\*(D)/g, /(N|D)[*/]N/g, /(N|D)O\1/g, /\((N|D)\)/g];
    var i = 0;
    while (i < reductions.length) {
      if (reductions[i].test(typeCheck)) {
        typeCheck = typeCheck.replace(reductions[i], '$1');
        i = 0;
      } else {
        i++;
      }
    }
    if (typeCheck != 'D')
      return;

    for (var unit in matchedUnits) {
      var result = eval(string.replace(new RegExp('U' + unit, 'g'), '').replace(new RegExp(taggedUnitRegExp, 'g'), '*0'));
      if (!isFinite(result))
        return;
      matchedUnits[unit] = result;
    }
    return matchedUnits;
  }

  function mergeDimensionsNonNegative(left, right) {
    return mergeDimensions(left, right, true);
  }

  function mergeDimensions(left, right, nonNegative) {
    var units = [], unit;
    for (unit in left)
      units.push(unit);
    for (unit in right) {
      if (units.indexOf(unit) < 0)
        units.push(unit);
    }

    left = units.map(function(unit) { return left[unit] || 0; });
    right = units.map(function(unit) { return right[unit] || 0; });
    return [left, right, function(values) {
      var result = values.map(function(value, i) {
        if (values.length == 1 && nonNegative) {
          value = Math.max(value, 0);
        }
        // Scientific notation (e.g. 1e2) is not yet widely supported by browser vendors.
        return scope.numberToString(value) + units[i];
      }).join(' + ');
      return values.length > 1 ? 'calc(' + result + ')' : result;
    }];
  }

  var lengthUnits = 'px|em|ex|ch|rem|vw|vh|vmin|vmax|cm|mm|in|pt|pc';
  var parseLength = parseDimension.bind(null, new RegExp(lengthUnits, 'g'));
  var parseLengthOrPercent = parseDimension.bind(null, new RegExp(lengthUnits + '|%', 'g'));
  var parseAngle = parseDimension.bind(null, /deg|rad|grad|turn/g);

  scope.parseLength = parseLength;
  scope.parseLengthOrPercent = parseLengthOrPercent;
  scope.consumeLengthOrPercent = scope.consumeParenthesised.bind(null, parseLengthOrPercent);
  scope.parseAngle = parseAngle;
  scope.mergeDimensions = mergeDimensions;

  var consumeLength = scope.consumeParenthesised.bind(null, parseLength);
  var consumeSizePair = scope.consumeRepeated.bind(undefined, consumeLength, /^/);
  var consumeSizePairList = scope.consumeRepeated.bind(undefined, consumeSizePair, /^,/);
  scope.consumeSizePairList = consumeSizePairList;

  var parseSizePairList = function(input) {
    var result = consumeSizePairList(input);
    if (result && result[1] == '') {
      return result[0];
    }
  };

  var mergeNonNegativeSizePair = scope.mergeNestedRepeated.bind(undefined, mergeDimensionsNonNegative, ' ');
  var mergeNonNegativeSizePairList = scope.mergeNestedRepeated.bind(undefined, mergeNonNegativeSizePair, ',');
  scope.mergeNonNegativeSizePair = mergeNonNegativeSizePair;

  scope.addPropertiesHandler(parseSizePairList, mergeNonNegativeSizePairList, [
    'background-size'
  ]);

  scope.addPropertiesHandler(parseLengthOrPercent, mergeDimensionsNonNegative, [
    'border-bottom-width',
    'border-image-width',
    'border-left-width',
    'border-right-width',
    'border-top-width',
    'flex-basis',
    'font-size',
    'height',
    'line-height',
    'max-height',
    'max-width',
    'outline-width',
    'width',
  ]);

  scope.addPropertiesHandler(parseLengthOrPercent, mergeDimensions, [
    'border-bottom-left-radius',
    'border-bottom-right-radius',
    'border-top-left-radius',
    'border-top-right-radius',
    'bottom',
    'left',
    'letter-spacing',
    'margin-bottom',
    'margin-left',
    'margin-right',
    'margin-top',
    'min-height',
    'min-width',
    'outline-offset',
    'padding-bottom',
    'padding-left',
    'padding-right',
    'padding-top',
    'perspective',
    'right',
    'shape-margin',
    'text-indent',
    'top',
    'vertical-align',
    'word-spacing',
  ]);

})(webAnimations1, webAnimationsTesting);
// Copyright 2014 Google Inc. All rights reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
//   You may obtain a copy of the License at
//
// http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
//   See the License for the specific language governing permissions and
// limitations under the License.

(function(scope, testing) {
  function consumeLengthPercentOrAuto(string) {
    return scope.consumeLengthOrPercent(string) || scope.consumeToken(/^auto/, string);
  }
  function parseBox(string) {
    var result = scope.consumeList([
      scope.ignore(scope.consumeToken.bind(null, /^rect/)),
      scope.ignore(scope.consumeToken.bind(null, /^\(/)),
      scope.consumeRepeated.bind(null, consumeLengthPercentOrAuto, /^,/),
      scope.ignore(scope.consumeToken.bind(null, /^\)/)),
    ], string);
    if (result && result[0].length == 4) {
      return result[0];
    }
  }

  function mergeComponent(left, right) {
    if (left == 'auto' || right == 'auto') {
      return [true, false, function(t) {
        var result = t ? left : right;
        if (result == 'auto') {
          return 'auto';
        }
        // FIXME: There's probably a better way to turn a dimension back into a string.
        var merged = scope.mergeDimensions(result, result);
        return merged[2](merged[0]);
      }];
    }
    return scope.mergeDimensions(left, right);
  }

  function wrap(result) {
    return 'rect(' + result + ')';
  }

  var mergeBoxes = scope.mergeWrappedNestedRepeated.bind(null, wrap, mergeComponent, ', ');

  scope.parseBox = parseBox;
  scope.mergeBoxes = mergeBoxes;

  scope.addPropertiesHandler(parseBox, mergeBoxes, ['clip']);

})(webAnimations1, webAnimationsTesting);
// Copyright 2014 Google Inc. All rights reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
//   You may obtain a copy of the License at
//
// http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
//   See the License for the specific language governing permissions and
// limitations under the License.

(function(scope, testing) {

  // This returns a function for converting transform functions to equivalent
  // primitive functions, which will take an array of values from the
  // derivative type and fill in the blanks (underscores) with them.
  var _ = null;
  function cast(pattern) {
    return function(contents) {
      var i = 0;
      return pattern.map(function(x) { return x === _ ? contents[i++] : x; });
    }
  }

  function id(x) { return x; }

  var Opx = {px: 0};
  var Odeg = {deg: 0};

  // type: [argTypes, convertTo3D, convertTo2D]
  // In the argument types string, lowercase characters represent optional arguments
  var transformFunctions = {
    matrix: ['NNNNNN', [_, _, 0, 0, _, _, 0, 0, 0, 0, 1, 0, _, _, 0, 1], id],
    matrix3d: ['NNNNNNNNNNNNNNNN', id],
    rotate: ['A'],
    rotatex: ['A'],
    rotatey: ['A'],
    rotatez: ['A'],
    rotate3d: ['NNNA'],
    perspective: ['L'],
    scale: ['Nn', cast([_, _, 1]), id],
    scalex: ['N', cast([_, 1, 1]), cast([_, 1])],
    scaley: ['N', cast([1, _, 1]), cast([1, _])],
    scalez: ['N', cast([1, 1, _])],
    scale3d: ['NNN', id],
    skew: ['Aa', null, id],
    skewx: ['A', null, cast([_, Odeg])],
    skewy: ['A', null, cast([Odeg, _])],
    translate: ['Tt', cast([_, _, Opx]), id],
    translatex: ['T', cast([_, Opx, Opx]), cast([_, Opx])],
    translatey: ['T', cast([Opx, _, Opx]), cast([Opx, _])],
    translatez: ['L', cast([Opx, Opx, _])],
    translate3d: ['TTL', id],
  };

  function parseTransform(string) {
    string = string.toLowerCase().trim();
    if (string == 'none')
      return [];
    // FIXME: Using a RegExp means calcs won't work here
    var transformRegExp = /\s*(\w+)\(([^)]*)\)/g;
    var result = [];
    var match;
    var prevLastIndex = 0;
    while (match = transformRegExp.exec(string)) {
      if (match.index != prevLastIndex)
        return;
      prevLastIndex = match.index + match[0].length;
      var functionName = match[1];
      var functionData = transformFunctions[functionName];
      if (!functionData)
        return;
      var args = match[2].split(',');
      var argTypes = functionData[0];
      if (argTypes.length < args.length)
        return;

      var parsedArgs = [];
      for (var i = 0; i < argTypes.length; i++) {
        var arg = args[i];
        var type = argTypes[i];
        var parsedArg;
        if (!arg)
          parsedArg = ({a: Odeg,
                        n: parsedArgs[0],
                        t: Opx})[type];
        else
          parsedArg = ({A: function(s) { return s.trim() == '0' ? Odeg : scope.parseAngle(s); },
                        N: scope.parseNumber,
                        T: scope.parseLengthOrPercent,
                        L: scope.parseLength})[type.toUpperCase()](arg);
        if (parsedArg === undefined)
          return;
        parsedArgs.push(parsedArg);
      }
      result.push({t: functionName, d: parsedArgs});

      if (transformRegExp.lastIndex == string.length)
        return result;
    }
  };

  function numberToLongString(x) {
    return x.toFixed(6).replace('.000000', '');
  }

  function mergeMatrices(left, right) {
    if (left.decompositionPair !== right) {
      left.decompositionPair = right;
      var leftArgs = scope.makeMatrixDecomposition(left);
    }
    if (right.decompositionPair !== left) {
      right.decompositionPair = left;
      var rightArgs = scope.makeMatrixDecomposition(right);
    }
    if (leftArgs[0] == null || rightArgs[0] == null)
      return [[false], [true], function(x) { return x ? right[0].d : left[0].d; }];
    leftArgs[0].push(0);
    rightArgs[0].push(1);
    return [
      leftArgs,
      rightArgs,
      function(list) {
        var quat = scope.quat(leftArgs[0][3], rightArgs[0][3], list[5]);
        var mat = scope.composeMatrix(list[0], list[1], list[2], quat, list[4]);
        var stringifiedArgs = mat.map(numberToLongString).join(',');
        return stringifiedArgs;
      }
    ];
  }

  function typeTo2D(type) {
    return type.replace(/[xy]/, '');
  }

  function typeTo3D(type) {
    return type.replace(/(x|y|z|3d)?$/, '3d');
  }

  function mergeTransforms(left, right) {
    var matrixModulesLoaded = scope.makeMatrixDecomposition && true;

    var flipResults = false;
    if (!left.length || !right.length) {
      if (!left.length) {
        flipResults = true;
        left = right;
        right = [];
      }
      for (var i = 0; i < left.length; i++) {
        var type = left[i].t;
        var args = left[i].d;
        var defaultValue = type.substr(0, 5) == 'scale' ? 1 : 0;
        right.push({t: type, d: args.map(function(arg) {
          if (typeof arg == 'number')
            return defaultValue;
          var result = {};
          for (var unit in arg)
            result[unit] = defaultValue;
          return result;
        })});
      }
    }

    var isMatrixOrPerspective = function(lt, rt) {
      return ((lt == 'perspective') && (rt == 'perspective')) ||
          ((lt == 'matrix' || lt == 'matrix3d') && (rt == 'matrix' || rt == 'matrix3d'));
    };
    var leftResult = [];
    var rightResult = [];
    var types = [];

    if (left.length != right.length) {
      if (!matrixModulesLoaded)
        return;
      var merged = mergeMatrices(left, right);
      leftResult = [merged[0]];
      rightResult = [merged[1]];
      types = [['matrix', [merged[2]]]];
    } else {
      for (var i = 0; i < left.length; i++) {
        var leftType = left[i].t;
        var rightType = right[i].t;
        var leftArgs = left[i].d;
        var rightArgs = right[i].d;

        var leftFunctionData = transformFunctions[leftType];
        var rightFunctionData = transformFunctions[rightType];

        var type;
        if (isMatrixOrPerspective(leftType, rightType)) {
          if (!matrixModulesLoaded)
            return;
          var merged = mergeMatrices([left[i]], [right[i]]);
          leftResult.push(merged[0]);
          rightResult.push(merged[1]);
          types.push(['matrix', [merged[2]]]);
          continue;
        } else if (leftType == rightType) {
          type = leftType;
        } else if (leftFunctionData[2] && rightFunctionData[2] && typeTo2D(leftType) == typeTo2D(rightType)) {
          type = typeTo2D(leftType);
          leftArgs = leftFunctionData[2](leftArgs);
          rightArgs = rightFunctionData[2](rightArgs);
        } else if (leftFunctionData[1] && rightFunctionData[1] && typeTo3D(leftType) == typeTo3D(rightType)) {
          type = typeTo3D(leftType);
          leftArgs = leftFunctionData[1](leftArgs);
          rightArgs = rightFunctionData[1](rightArgs);
        } else {
          if (!matrixModulesLoaded)
            return;
          var merged = mergeMatrices(left, right);
          leftResult = [merged[0]];
          rightResult = [merged[1]];
          types = [['matrix', [merged[2]]]];
          break;
        }

        var leftArgsCopy = [];
        var rightArgsCopy = [];
        var stringConversions = [];
        for (var j = 0; j < leftArgs.length; j++) {
          var merge = typeof leftArgs[j] == 'number' ? scope.mergeNumbers : scope.mergeDimensions;
          var merged = merge(leftArgs[j], rightArgs[j]);
          leftArgsCopy[j] = merged[0];
          rightArgsCopy[j] = merged[1];
          stringConversions.push(merged[2]);
        }
        leftResult.push(leftArgsCopy);
        rightResult.push(rightArgsCopy);
        types.push([type, stringConversions]);
      }
    }

    if (flipResults) {
      var tmp = leftResult;
      leftResult = rightResult;
      rightResult = tmp;
    }

    return [leftResult, rightResult, function(list) {
      return list.map(function(args, i) {
        var stringifiedArgs = args.map(function(arg, j) {
          return types[i][1][j](arg);
        }).join(',');
        if (types[i][0] == 'matrix' && stringifiedArgs.split(',').length == 16)
          types[i][0] = 'matrix3d';
        return types[i][0] + '(' + stringifiedArgs + ')';

      }).join(' ');
    }];
  }

  scope.addPropertiesHandler(parseTransform, mergeTransforms, ['transform']);

  if (WEB_ANIMATIONS_TESTING)
    testing.parseTransform = parseTransform;

})(webAnimations1, webAnimationsTesting);
// Copyright 2014 Google Inc. All rights reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
//     You may obtain a copy of the License at
//
// http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
//     See the License for the specific language governing permissions and
// limitations under the License.

(function(scope, testing) {

  scope.apply = function(element, property, value) {
    element.style[scope.propertyName(property)] = value;
  };

  scope.clear = function(element, property) {
    element.style[scope.propertyName(property)] = '';
  };

})(webAnimations1, webAnimationsTesting);
// Copyright 2014 Google Inc. All rights reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
//     You may obtain a copy of the License at
//
// http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
//     See the License for the specific language governing permissions and
// limitations under the License.

(function(scope, testing) {

  var aliased = {};

  function alias(name, aliases) {
    aliases.concat([name]).forEach(function(candidate) {
      if (candidate in document.documentElement.style) {
        aliased[name] = candidate;
      }
    });
  }
  alias('transform', ['webkitTransform', 'msTransform']);
  alias('transformOrigin', ['webkitTransformOrigin']);
  alias('perspective', ['webkitPerspective']);
  alias('perspectiveOrigin', ['webkitPerspectiveOrigin']);

  scope.propertyName = function(property) {
    return aliased[property] || property;
  };

})(webAnimations1, webAnimationsTesting);

let set = webAnimations1.apply;
let remove = webAnimations1.clear;
let interpolate = webAnimations1.propertyInterpolation;
export {set, remove, interpolate}
