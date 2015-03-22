System.config({
  "baseURL": ".",
  "transpiler": "babel",
  "paths": {
    "*": "*.js",
    "github:*": "jspm_packages/github/*.js"
  }
});

System.config({
  "meta": {
    "src/Animation": {
      "format": "es6"
    }
  }
});

