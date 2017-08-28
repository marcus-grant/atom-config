(function() {
  var $, CSON, _, attachMathJax, checkMacros, cheerio, configureMathJax, createMacrosTemplate, fs, getUserMacrosPath, loadMacrosFile, loadUserMacros, namePattern, path, valueMatchesPattern;

  $ = require('atom-space-pen-views').$;

  cheerio = require('cheerio');

  path = require('path');

  CSON = require('season');

  fs = require('fs-plus');

  _ = require('underscore-plus');

  module.exports = {
    loadMathJax: function(listener) {
      var script;
      script = this.attachMathJax();
      if (listener != null) {
        script.addEventListener("load", function() {
          return listener();
        });
      }
    },
    attachMathJax: _.once(function() {
      return attachMathJax();
    }),
    resetMathJax: function() {
      $('script[src*="MathJax.js"]').remove();
      window.MathJax = void 0;
      return this.attachMathJax = _.once(function() {
        return attachMathJax();
      });
    },
    mathProcessor: function(domElements) {
      if (typeof MathJax !== "undefined" && MathJax !== null) {
        MathJax.Hub.Queue(["Typeset", MathJax.Hub, domElements]);
      } else {
        this.loadMathJax(function() {
          return MathJax.Hub.Queue(["Typeset", MathJax.Hub, domElements]);
        });
      }
    },
    processHTMLString: function(html, callback) {
      var compileProcessedHTMLString, element, queueProcessHTMLString;
      element = document.createElement('div');
      element.innerHTML = html;
      compileProcessedHTMLString = function() {
        var ref, svgGlyphs;
        svgGlyphs = (ref = document.getElementById('MathJax_SVG_Hidden')) != null ? ref.parentNode.cloneNode(true) : void 0;
        if (svgGlyphs != null) {
          element.insertBefore(svgGlyphs, element.firstChild);
        }
        return element.innerHTML;
      };
      queueProcessHTMLString = function() {
        return MathJax.Hub.Queue(["setRenderer", MathJax.Hub, "SVG"], ["Typeset", MathJax.Hub, element], ["setRenderer", MathJax.Hub, "HTML-CSS"], [
          function() {
            return callback(compileProcessedHTMLString());
          }
        ]);
      };
      if (typeof MathJax !== "undefined" && MathJax !== null) {
        queueProcessHTMLString();
      } else {
        this.loadMathJax(queueProcessHTMLString);
      }
    }
  };

  namePattern = /^[^a-zA-Z\d\s]$|^[a-zA-Z]*$/;

  getUserMacrosPath = function() {
    var userMacrosPath;
    userMacrosPath = CSON.resolve(path.join(atom.getConfigDirPath(), 'markdown-preview-plus'));
    return userMacrosPath != null ? userMacrosPath : path.join(atom.getConfigDirPath(), 'markdown-preview-plus.cson');
  };

  loadMacrosFile = function(filePath) {
    if (!CSON.isObjectPath(filePath)) {
      return {};
    }
    return CSON.readFileSync(filePath, function(error, object) {
      var ref, ref1;
      if (object == null) {
        object = {};
      }
      if (error != null) {
        console.warn("Error reading Latex Macros file '" + filePath + "': " + ((ref = error.stack) != null ? ref : error));
        if ((ref1 = atom.notifications) != null) {
          ref1.addError("Failed to load Latex Macros from '" + filePath + "'", {
            detail: error.message,
            dismissable: true
          });
        }
      }
      return object;
    });
  };

  loadUserMacros = function() {
    var result, userMacrosPath;
    userMacrosPath = getUserMacrosPath();
    if (fs.isFileSync(userMacrosPath)) {
      return result = loadMacrosFile(userMacrosPath);
    } else {
      console.log("Creating markdown-preview-plus.cson, this is a one-time operation.");
      createMacrosTemplate(userMacrosPath);
      return result = loadMacrosFile(userMacrosPath);
    }
  };

  createMacrosTemplate = function(filePath) {
    var templateFile, templatePath;
    templatePath = path.join(__dirname, "../assets/macros-template.cson");
    templateFile = fs.readFileSync(templatePath, 'utf8');
    return fs.writeFileSync(filePath, templateFile);
  };

  checkMacros = function(macrosObject) {
    var name, ref, value;
    for (name in macrosObject) {
      value = macrosObject[name];
      if (!(name.match(namePattern) && valueMatchesPattern(value))) {
        delete macrosObject[name];
        if ((ref = atom.notifications) != null) {
          ref.addError("Failed to load LaTeX macro named '" + name + "'. Please see the [LaTeX guide](https://github.com/Galadirith/markdown-preview-plus/blob/master/LATEX.md#macro-names)", {
            dismissable: true
          });
        }
      }
    }
    return macrosObject;
  };

  valueMatchesPattern = function(value) {
    var macroDefinition, numberOfArgs;
    switch (false) {
      case Object.prototype.toString.call(value) !== '[object Array]':
        macroDefinition = value[0];
        numberOfArgs = value[1];
        if (typeof numberOfArgs === 'number') {
          return numberOfArgs % 1 === 0 && typeof macroDefinition === 'string';
        } else {
          return false;
        }
        break;
      case typeof value !== 'string':
        return true;
      default:
        return false;
    }
  };

  configureMathJax = function() {
    var userMacros;
    userMacros = loadUserMacros();
    if (userMacros) {
      userMacros = checkMacros(userMacros);
    } else {
      userMacros = {};
    }
    MathJax.Hub.Config({
      jax: ["input/TeX", "output/HTML-CSS"],
      extensions: [],
      TeX: {
        extensions: ["AMSmath.js", "AMSsymbols.js", "noErrors.js", "noUndefined.js"],
        Macros: userMacros
      },
      "HTML-CSS": {
        availableFonts: [],
        webFont: "TeX"
      },
      messageStyle: "none",
      showMathMenu: false,
      skipStartupTypeset: true
    });
    MathJax.Hub.Configured();
    if (atom.inDevMode()) {
      atom.notifications.addSuccess("Loaded maths rendering engine MathJax");
    }
  };

  attachMathJax = function() {
    var script;
    if (atom.inDevMode()) {
      atom.notifications.addInfo("Loading maths rendering engine MathJax");
    }
    script = document.createElement("script");
    script.src = (require.resolve('MathJax')) + "?delayStartupUntil=configured";
    script.type = "text/javascript";
    script.addEventListener("load", function() {
      return configureMathJax();
    });
    document.getElementsByTagName("head")[0].appendChild(script);
    return script;
  };

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL2hvbWUvbWFyY3VzLy5hdG9tL3BhY2thZ2VzL21hcmtkb3duLXByZXZpZXctcGx1cy9saWIvbWF0aGpheC1oZWxwZXIuY29mZmVlIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQU9BO0FBQUEsTUFBQTs7RUFBQyxJQUFTLE9BQUEsQ0FBUSxzQkFBUjs7RUFDVixPQUFBLEdBQVUsT0FBQSxDQUFRLFNBQVI7O0VBQ1YsSUFBQSxHQUFVLE9BQUEsQ0FBUSxNQUFSOztFQUNWLElBQUEsR0FBVSxPQUFBLENBQVEsUUFBUjs7RUFDVixFQUFBLEdBQVUsT0FBQSxDQUFRLFNBQVI7O0VBQ1YsQ0FBQSxHQUFVLE9BQUEsQ0FBUSxpQkFBUjs7RUFFVixNQUFNLENBQUMsT0FBUCxHQU9FO0lBQUEsV0FBQSxFQUFhLFNBQUMsUUFBRDtBQUNYLFVBQUE7TUFBQSxNQUFBLEdBQVMsSUFBQyxDQUFBLGFBQUQsQ0FBQTtNQUNULElBQUcsZ0JBQUg7UUFBa0IsTUFBTSxDQUFDLGdCQUFQLENBQXdCLE1BQXhCLEVBQWdDLFNBQUE7aUJBQUcsUUFBQSxDQUFBO1FBQUgsQ0FBaEMsRUFBbEI7O0lBRlcsQ0FBYjtJQVFBLGFBQUEsRUFBZSxDQUFDLENBQUMsSUFBRixDQUFPLFNBQUE7YUFBRyxhQUFBLENBQUE7SUFBSCxDQUFQLENBUmY7SUFhQSxZQUFBLEVBQWMsU0FBQTtNQUVaLENBQUEsQ0FBRSwyQkFBRixDQUE4QixDQUFDLE1BQS9CLENBQUE7TUFDQSxNQUFNLENBQUMsT0FBUCxHQUFpQjthQUdqQixJQUFDLENBQUEsYUFBRCxHQUFpQixDQUFDLENBQUMsSUFBRixDQUFPLFNBQUE7ZUFBRyxhQUFBLENBQUE7TUFBSCxDQUFQO0lBTkwsQ0FiZDtJQTRCQSxhQUFBLEVBQWUsU0FBQyxXQUFEO01BQ2IsSUFBRyxrREFBSDtRQUNLLE9BQU8sQ0FBQyxHQUFHLENBQUMsS0FBWixDQUFrQixDQUFDLFNBQUQsRUFBWSxPQUFPLENBQUMs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cUQsTUFBckQ7QUFFQSxXQUFPO0VBWE87QUFsTGhCIiwic291cmNlc0NvbnRlbnQiOlsiI1xuIyBtYXRoamF4LWhlbHBlclxuI1xuIyBUaGlzIG1vZHVsZSB3aWxsIGhhbmRsZSBsb2FkaW5nIHRoZSBNYXRoSmF4IGVudmlyb25tZW50IGFuZCBwcm92aWRlIGEgd3JhcHBlclxuIyBmb3IgY2FsbHMgdG8gTWF0aEpheCB0byBwcm9jZXNzIExhVGVYIGVxdWF0aW9ucy5cbiNcblxueyR9ICAgICA9IHJlcXVpcmUgJ2F0b20tc3BhY2UtcGVuLXZpZXdzJ1xuY2hlZXJpbyA9IHJlcXVpcmUgJ2NoZWVyaW8nXG5wYXRoICAgID0gcmVxdWlyZSAncGF0aCdcbkNTT04gICAgPSByZXF1aXJlICdzZWFzb24nXG5mcyAgICAgID0gcmVxdWlyZSAnZnMtcGx1cydcbl8gICAgICAgPSByZXF1aXJlICd1bmRlcnNjb3JlLXBsdXMnXG5cbm1vZHVsZS5leHBvcnRzID1cbiAgI1xuICAjIExvYWQgTWF0aEpheCBlbnZpcm9ubWVudFxuICAjXG4gICMgQHBhcmFtIGxpc3RlbmVyIE9wdGlvbmFsIG1ldGhvZCB0byBjYWxsIHdoZW4gdGhlIE1hdGhKYXggc2NyaXB0IHdhcyBiZWVuXG4gICMgICBsb2FkZWQgdG8gdGhlIHdpbmRvdy4gVGhlIG1ldGhvZCBpcyBwYXNzZWQgbm8gYXJndW1lbnRzLlxuICAjXG4gIGxvYWRNYXRoSmF4OiAobGlzdGVuZXIpIC0+XG4gICAgc2NyaXB0ID0gQGF0dGFjaE1hdGhKYXgoKVxuICAgIGlmIGxpc3RlbmVyPyB0aGVuIHNjcmlwdC5hZGRFdmVudExpc3RlbmVyIFwibG9hZFwiLCAtPiBsaXN0ZW5lcigpXG4gICAgcmV0dXJuXG5cbiAgI1xuICAjIEF0dGFjaCBtYWluIE1hdGhKYXggc2NyaXB0IHRvIHRoZSBkb2N1bWVudFxuICAjXG4gIGF0dGFjaE1hdGhKYXg6IF8ub25jZSAtPiBhdHRhY2hNYXRoSmF4KClcblxuICAjXG4gICMgUmVtb3ZlIE1hdGhKYXggZnJvbSB0aGUgZG9jdW1lbnQgYW5kIHJlc2V0IGF0dGFjaCBtZXRob2RcbiAgI1xuICByZXNldE1hdGhKYXg6IC0+XG4gICAgIyBEZXRhY2ggTWF0aEpheCBmcm9tIHRoZSBkb2N1bWVudFxuICAgICQoJ3NjcmlwdFtzcmMqPVwiTWF0aEpheC5qc1wiXScpLnJlbW92ZSgpXG4gICAgd2luZG93Lk1hdGhKYXggPSB1bmRlZmluZWRcblxuICAgICMgUmVzZXQgYXR0YWNoIGZvciBhbnkgc3Vic2VxdWVudCBjYWxsc1xuICAgIEBhdHRhY2hNYXRoSmF4ID0gXy5vbmNlIC0+IGF0dGFjaE1hdGhKYXgoKVxuXG4gICNcbiAgIyBQcm9jZXNzIERPTSBlbGVtZW50cyBmb3IgTGFUZVggZXF1YXRpb25zIHdpdGggTWF0aEpheFxuICAjXG4gICMgQHBhcmFtIGRvbUVsZW1lbnRzIEFuIGFycmF5IG9mIERPTSBlbGVtZW50cyB0byBiZSBwcm9jZXNzZWQgYnkgTWF0aEpheC4gU2VlXG4gICMgICBbZWxlbWVudF0oaHR0cHM6Ly9kZXZlbG9wZXIubW96aWxsYS5vcmcvZW4tVVMvZG9jcy9XZWIvQVBJL2VsZW1lbnQpIGZvclxuICAjICAgZGV0YWlscyBvbiBET00gZWxlbWVudHMuXG4gICNcbiAgbWF0aFByb2Nlc3NvcjogKGRvbUVsZW1lbnRzKSAtPlxuICAgIGlmIE1hdGhKYXg/XG4gICAgdGhlbiBNYXRoSmF4Lkh1Yi5RdWV1ZSBbXCJUeXBlc2V0XCIsIE1hdGhKYXguSHViLCBkb21FbGVtZW50c11cbiAgICBlbHNlIEBsb2FkTWF0aEpheCAtPiBNYXRoSmF4Lkh1Yi5RdWV1ZSBbXCJUeXBlc2V0XCIsIE1hdGhKYXguSHViLCBkb21FbGVtZW50c11cbiAgICByZXR1cm5cblxuICAjXG4gICMgUHJvY2VzcyBtYXRocyBpbiBIVE1MIGZyYWdtZW50IHdpdGggTWF0aEpheFxuICAjXG4gICMgQHBhcmFtIGh0bWwgQSBIVE1MIGZyYWdtZW50IHN0cmluZ1xuICAjIEBwYXJhbSBjYWxsYmFjayBBIGNhbGxiYWNrIG1ldGhvZCB0aGF0IGFjY2VwdHMgYSBzaW5nbGUgcGFyYW1ldGVyLCBhIEhUTUxcbiAgIyAgIGZyYWdtZW50IHN0cmluZyB0aGF0IGlzIHRoZSByZXN1bHQgb2YgaHRtbCBwcm9jZXNzZWQgYnkgTWF0aEpheFxuICAjXG4gIHByb2Nlc3NIVE1MU3RyaW5nOiAoaHRtbCwgY2FsbGJhY2spIC0+XG4gICAgZWxlbWVudCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpXG4gICAgZWxlbWVudC5pbm5lckhUTUwgPSBodG1sXG5cbiAgICBjb21waWxlUHJvY2Vzc2VkSFRNTFN0cmluZyA9IC0+XG4gICAgICBzdmdHbHlwaHMgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnTWF0aEpheF9TVkdfSGlkZGVuJyk/LnBhcmVudE5vZGUuY2xvbmVOb2RlKHRydWUpXG4gICAgICBlbGVtZW50Lmluc2VydEJlZm9yZShzdmdHbHlwaHMsIGVsZW1lbnQuZmlyc3RDaGlsZCkgaWYgc3ZnR2x5cGhzP1xuICAgICAgcmV0dXJuIGVsZW1lbnQuaW5uZXJIVE1MXG5cbiAgICBxdWV1ZVByb2Nlc3NIVE1MU3RyaW5nID0gLT5cbiAgICAgIE1hdGhKYXguSHViLlF1ZXVlKFxuICAgICAgICBbXCJzZXRSZW5kZXJlclwiLCBNYXRoSmF4Lkh1YiwgXCJTVkdcIl0sXG4gICAgICAgIFtcIlR5cGVzZXRcIiwgTWF0aEpheC5IdWIsIGVsZW1lbnRdLFxuICAgICAgICBbXCJzZXRSZW5kZXJlclwiLCBNYXRoSmF4Lkh1YiwgXCJIVE1MLUNTU1wiXSxcbiAgICAgICAgWyAtPiBjYWxsYmFjayBjb21waWxlUHJvY2Vzc2VkSFRNTFN0cmluZygpXVxuICAgICAgKVxuXG4gICAgaWYgTWF0aEpheD9cbiAgICB0aGVuIHF1ZXVlUHJvY2Vzc0hUTUxTdHJpbmcoKVxuICAgIGVsc2UgQGxvYWRNYXRoSmF4IHF1ZXVlUHJvY2Vzc0hUTUxTdHJpbmdcblxuICAgIHJldHVyblxuXG4jXG4jIERlZmluZSBzb21lIGZ1bmN0aW9ucyB0byBoZWxwIGdldCBhIGhvbGQgb2YgdGhlIHVzZXIncyBMYXRleFxuIyBNYWNyb3MuXG4jXG5uYW1lUGF0dGVybiA9IC8vLyAgICAgICAgICAgICAjIFRoZSBuYW1lIG9mIGEgbWFjcm8gY2FuIGJlIGVpdGhlclxuICAgICAgICAgICAgICBeW15hLXpBLVpcXGRcXHNdJCAjIGEgc2luZ2xlIG5vbi1hbHBoYW51bWVyaWMgY2hhcmFjdGVyXG4gICAgICAgICAgICAgIHwgICAgICAgICAgICAgICAjIG9yXG4gICAgICAgICAgICAgIF5bYS16QS1aXSokICAgICAjIGFueSBudW1iZXIgb2YgbG93ZXIgYW5kIHVwcGVyIGNhc2VcbiAgICAgICAgICAgICAgLy8vICAgICAgICAgICAgICMgbGV0dGVycywgYnV0IG5vIG51bWVyYWxzLlxuXG5nZXRVc2VyTWFjcm9zUGF0aCA9IC0+XG4gIHVzZXJNYWNyb3NQYXRoID0gIENTT04ucmVzb2x2ZShwYXRoLmpvaW4oYXRvbS5nZXRDb25maWdEaXJQYXRoKCksICdtYXJrZG93bi1wcmV2aWV3LXBsdXMnKSlcbiAgdXNlck1hY3Jvc1BhdGggPyBwYXRoLmpvaW4oYXRvbS5nZXRDb25maWdEaXJQYXRoKCksICdtYXJrZG93bi1wcmV2aWV3LXBsdXMuY3NvbicpXG5cbmxvYWRNYWNyb3NGaWxlID0gKGZpbGVQYXRoKSAtPlxuICByZXR1cm4ge30gdW5sZXNzIENTT04uaXNPYmplY3RQYXRoKGZpbGVQYXRoKVxuICBDU09OLnJlYWRGaWxlU3luYyBmaWxlUGF0aCwgKGVycm9yLCBvYmplY3Q9e30pIC0+XG4gICAgaWYgZXJyb3I/XG4gICAgICBjb25zb2xlLndhcm4gXCJFcnJvciByZWFkaW5nIExhdGV4IE1hY3JvcyBmaWxlICcje2ZpbGVQYXRofSc6ICN7ZXJyb3Iuc3RhY2sgPyBlcnJvcn1cIlxuICAgICAgYXRvbS5ub3RpZmljYXRpb25zPy5hZGRFcnJvcihcIkZhaWxlZCB0byBsb2FkIExhdGV4IE1hY3JvcyBmcm9tICcje2ZpbGVQYXRofSdcIiwge2RldGFpbDogZXJyb3IubWVzc2FnZSwgZGlzbWlzc2FibGU6IHRydWV9KVxuICAgIG9iamVjdFxuXG5sb2FkVXNlck1hY3JvcyA9IC0+XG4gIHVzZXJNYWNyb3NQYXRoID0gZ2V0VXNlck1hY3Jvc1BhdGgoKVxuICBpZiBmcy5pc0ZpbGVTeW5jKHVzZXJNYWNyb3NQYXRoKVxuICAgIHJlc3VsdCA9IGxvYWRNYWNyb3NGaWxlKHVzZXJNYWNyb3NQYXRoKVxuICBlbHNlXG4gICAgY29uc29sZS5sb2cgXCJDcmVhdGluZyBtYXJrZG93bi1wcmV2aWV3LXBsdXMuY3NvbiwgdGhpcyBpcyBhIG9uZS10aW1lIG9wZXJhdGlvbi5cIlxuICAgIGNyZWF0ZU1hY3Jvc1RlbXBsYXRlKHVzZXJNYWNyb3NQYXRoKVxuICAgIHJlc3VsdCA9IGxvYWRNYWNyb3NGaWxlKHVzZXJNYWNyb3NQYXRoKVxuXG5jcmVhdGVNYWNyb3NUZW1wbGF0ZSA9IChmaWxlUGF0aCkgLT5cbiAgdGVtcGxhdGVQYXRoID0gcGF0aC5qb2luKF9fZGlybmFtZSwgXCIuLi9hc3NldHMvbWFjcm9zLXRlbXBsYXRlLmNzb25cIilcbiAgdGVtcGxhdGVGaWxlID0gZnMucmVhZEZpbGVTeW5jIHRlbXBsYXRlUGF0aCwgJ3V0ZjgnXG4gIGZzLndyaXRlRmlsZVN5bmMgZmlsZVBhdGgsIHRlbXBsYXRlRmlsZVxuXG5jaGVja01hY3JvcyA9IChtYWNyb3NPYmplY3QpIC0+XG4gIGZvciBuYW1lLCB2YWx1ZSBvZiBtYWNyb3NPYmplY3RcbiAgICB1bmxlc3MgbmFtZS5tYXRjaChuYW1lUGF0dGVybikgYW5kIHZhbHVlTWF0Y2hlc1BhdHRlcm4odmFsdWUpXG4gICAgICBkZWxldGUgbWFjcm9zT2JqZWN0W25hbWVdXG4gICAgICBhdG9tLm5vdGlmaWNhdGlvbnM/LmFkZEVycm9yKFwiRmFpbGVkIHRvIGxvYWQgTGFUZVggbWFjcm8gbmFtZWQgJyN7bmFtZX0nLiBQbGVhc2Ugc2VlIHRoZSBbTGFUZVggZ3VpZGVdKGh0dHBzOi8vZ2l0aHViLmNvbS9HYWxhZGlyaXRoL21hcmtkb3duLXByZXZpZXctcGx1cy9ibG9iL21hc3Rlci9MQVRFWC5tZCNtYWNyby1uYW1lcylcIiwge2Rpc21pc3NhYmxlOiB0cnVlfSlcbiAgbWFjcm9zT2JqZWN0XG5cbnZhbHVlTWF0Y2hlc1BhdHRlcm4gPSAodmFsdWUpIC0+XG4gICMgRGlmZmVyZW50IGNoZWNrIGJhc2VkIG9uIHdoZXRoZXIgdmFsdWUgaXMgc3RyaW5nIG9yIGFycmF5XG4gIHN3aXRjaFxuICAgICMgSWYgaXQgaXMgYW4gYXJyYXkgdGhlbiBpdCBzaG91bGQgYmUgW3N0cmluZywgaW50ZWdlcl1cbiAgICB3aGVuIE9iamVjdDo6dG9TdHJpbmcuY2FsbCh2YWx1ZSkgaXMgJ1tvYmplY3QgQXJyYXldJ1xuICAgICAgbWFjcm9EZWZpbml0aW9uID0gdmFsdWVbMF1cbiAgICAgIG51bWJlck9mQXJncyA9IHZhbHVlWzFdXG4gICAgICBpZiB0eXBlb2YgbnVtYmVyT2ZBcmdzICBpcyAnbnVtYmVyJ1xuICAgICAgICBudW1iZXJPZkFyZ3MgJSAxIGlzIDAgYW5kIHR5cGVvZiBtYWNyb0RlZmluaXRpb24gaXMgJ3N0cmluZydcbiAgICAgIGVsc2VcbiAgICAgICAgZmFsc2VcbiAgICAjIElmIGl0IGlzIGp1c3QgYSBzdHJpbmcgdGhlbiB0aGF0J3MgT0ssIGFueSBzdHJpbmcgaXMgYWNjZXB0YWJsZVxuICAgIHdoZW4gdHlwZW9mIHZhbHVlIGlzICdzdHJpbmcnXG4gICAgICB0cnVlXG4gICAgZWxzZSBmYWxzZVxuXG4jIENvbmZpZ3VyZSBNYXRoSmF4IGVudmlyb25tZW50LiBTaW1pbGFyIHRvIHRoZSBUZVgtQU1TX0hUTUwgY29uZmlndXJhdGlvbiB3aXRoXG4jIGEgZmV3IHVubmVjZXNzYXJ5IGZlYXR1cmVzIHN0cmlwcGVkIGF3YXlcbiNcbmNvbmZpZ3VyZU1hdGhKYXggPSAtPlxuICB1c2VyTWFjcm9zID0gbG9hZFVzZXJNYWNyb3MoKVxuICBpZiB1c2VyTWFjcm9zXG4gICAgdXNlck1hY3JvcyA9IGNoZWNrTWFjcm9zKHVzZXJNYWNyb3MpXG4gIGVsc2VcbiAgICB1c2VyTWFjcm9zID0ge31cblxuICAjTm93IENvbmZpZ3VyZSBNYXRoSmF4XG4gIE1hdGhKYXguSHViLkNvbmZpZ1xuICAgIGpheDogW1xuICAgICAgXCJpbnB1dC9UZVhcIixcbiAgICAgIFwib3V0cHV0L0hUTUwtQ1NTXCJcbiAgICBdXG4gICAgZXh0ZW5zaW9uczogW11cbiAgICBUZVg6XG4gICAgICBleHRlbnNpb25zOiBbXG4gICAgICAgIFwiQU1TbWF0aC5qc1wiLFxuICAgICAgICBcIkFNU3N5bWJvbHMuanNcIixcbiAgICAgICAgXCJub0Vycm9ycy5qc1wiLFxuICAgICAgICBcIm5vVW5kZWZpbmVkLmpzXCJcbiAgICAgIF1cbiAgICAgIE1hY3JvczogdXNlck1hY3Jvc1xuICAgIFwiSFRNTC1DU1NcIjpcbiAgICAgIGF2YWlsYWJsZUZvbnRzOiBbXVxuICAgICAgd2ViRm9udDogXCJUZVhcIlxuICAgIG1lc3NhZ2VTdHlsZTogXCJub25lXCJcbiAgICBzaG93TWF0aE1lbnU6IGZhbHNlXG4gICAgc2tpcFN0YXJ0dXBUeXBlc2V0OiB0cnVlXG4gIE1hdGhKYXguSHViLkNvbmZpZ3VyZWQoKVxuXG4gICMgTm90aWZ5IHVzZXIgTWF0aEpheCBoYXMgbG9hZGVkXG4gIGF0b20ubm90aWZpY2F0aW9ucy5hZGRTdWNjZXNzIFwiTG9hZGVkIG1hdGhzIHJlbmRlcmluZyBlbmdpbmUgTWF0aEpheFwiIGlmIGF0b20uaW5EZXZNb2RlKClcblxuICByZXR1cm5cblxuI1xuIyBBdHRhY2ggbWFpbiBNYXRoSmF4IHNjcmlwdCB0byB0aGUgZG9jdW1lbnRcbiNcbmF0dGFjaE1hdGhKYXggPSAtPlxuICAjIE5vdGlmeSB1c2VyIE1hdGhKYXggaXMgbG9hZGluZ1xuICBhdG9tLm5vdGlmaWNhdGlvbnMuYWRkSW5mbyBcIkxvYWRpbmcgbWF0aHMgcmVuZGVyaW5nIGVuZ2luZSBNYXRoSmF4XCIgaWYgYXRvbS5pbkRldk1vZGUoKVxuXG4gICMgQXR0YWNoIE1hdGhKYXggc2NyaXB0XG4gIHNjcmlwdCAgICAgID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcInNjcmlwdFwiKVxuICBzY3JpcHQuc3JjICA9IFwiI3tyZXF1aXJlLnJlc29sdmUoJ01hdGhKYXgnKX0/ZGVsYXlTdGFydHVwVW50aWw9Y29uZmlndXJlZFwiXG4gIHNjcmlwdC50eXBlID0gXCJ0ZXh0L2phdmFzY3JpcHRcIlxuICBzY3JpcHQuYWRkRXZlbnRMaXN0ZW5lciBcImxvYWRcIiwgLT4gY29uZmlndXJlTWF0aEpheCgpXG4gIGRvY3VtZW50LmdldEVsZW1lbnRzQnlUYWdOYW1lKFwiaGVhZFwiKVswXS5hcHBlbmRDaGlsZChzY3JpcHQpXG5cbiAgcmV0dXJuIHNjcmlwdFxuIl19
