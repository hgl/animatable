System.config({
  "baseURL": ".",
  "transpiler": "babel",
  "paths": {
    "*": "*.js",
    "github:*": "jspm_packages/github/*.js"
  }
});

System.config({
  "map": {
    "es6-shim": "github:es-shims/es6-shim@0.27.1"
  }
});

