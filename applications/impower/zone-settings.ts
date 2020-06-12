
(window as any).global = window;

// disable on properties
const targets = [window, Document, HTMLBodyElement, HTMLElement];
global['__Zone_ignore_on_properties'] = [];
targets.forEach(function (target) {
  global['__Zone_ignore_on_properties'].push({
    target: target,
    ignoreProperties: ['scroll', 'mousemove']
  });
});

// disable requestAnimationFrame
global['__Zone_disable_requestAnimationFrame'] = true;
// disable addEventListener
global['__zone_symbol__BLACK_LISTED_EVENTS'] = ['scroll', 'mousemove'];
