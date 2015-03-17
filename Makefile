src = \
	src/animatable.js \
	src/Animation.js \
	src/AnimationTimeline.js \
	src/easingFunction.js \
	src/KeyframeEffect.js \
	src/style.js

style_src = \
	web-animations/src/property-interpolation.js \
	web-animations/src/interpolation.js \
	web-animations/src/handler-utils.js \
	web-animations/src/shadow-handler.js \
	web-animations/src/number-handler.js \
	web-animations/src/visibility-handler.js \
	web-animations/src/color-handler.js \
	web-animations/src/dimension-handler.js \
	web-animations/src/box-handler.js \
	web-animations/src/transform-handler.js \
	web-animations/src/apply.js \
	web-animations/src/property-names.js

.INTERMEDIATE: src/style.js

all: animatable.js test/polyfill.js

animatable.js: $(src)
	jspm bundle-sfx src/animatable $@ --no-mangle --skip-source-maps

src/style.js: src/style.tpl.js $(style_src)
	awk -f tools/replace.awk -v 'files=$(style_src)' $< >$@

test/polyfill.js:
	jspm bundle-sfx es6-shim $@ --no-mangle --skip-source-maps
