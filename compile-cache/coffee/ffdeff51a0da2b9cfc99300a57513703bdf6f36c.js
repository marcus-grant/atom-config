(function() {
  var CompositeDisposable, Flatwhite, fs, path;

  fs = require('fs');

  path = require('path');

  CompositeDisposable = require('atom').CompositeDisposable;

  Flatwhite = (function() {
    function Flatwhite() {}

    Flatwhite.prototype.config = require('./flatwhite-settings').config;

    Flatwhite.prototype.activate = function() {
      this.disposables = new CompositeDisposable;
      this.packageName = require('../package.json').name;
      return this.disposables.add(atom.config.observe(this.packageName + ".ebmedded", (function(_this) {
        return function() {
          return _this.enableConfigTheme();
        };
      })(this)));
    };

    Flatwhite.prototype.deactivate = function() {
      return this.disposables.dispose();
    };

    Flatwhite.prototype.enableConfigTheme = function() {
      var ebmedded;
      ebmedded = atom.config.get(this.packageName + ".ebmedded");
      return this.enableTheme(ebmedded);
    };

    Flatwhite.prototype.enableTheme = function(ebmedded) {
      var embedded_path;
      embedded_path = __dirname + "/../styles/settings.less";
      fs.writeFileSync(embedded_path, "@import 'languages/embedded-" + (this.getNormalizedName(ebmedded)) + "';");
      return atom.packages.getLoadedPackage("" + this.packageName).reloadStylesheets();
    };

    Flatwhite.prototype.getNormalizedName = function(name) {
      return ("" + name).replace(/\ /g, '-').toLowerCase();
    };

    return Flatwhite;

  })();

  module.exports = new Flatwhite;

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL2hvbWUvbWFyY3VzLy5hdG9tL3BhY2thZ2VzL2ZsYXR3aGl0ZS1zeW50YXgvbGliL2ZsYXR3aGl0ZS5jb2ZmZWUiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUFBQSxNQUFBOztFQUFBLEVBQUEsR0FBSyxPQUFBLENBQVEsSUFBUjs7RUFDTCxJQUFBLEdBQU8sT0FBQSxDQUFRLE1BQVI7O0VBQ04sc0JBQXVCLE9BQUEsQ0FBUSxNQUFSOztFQUVsQjs7O3dCQUVKLE1BQUEsR0FBUSxPQUFBLENBQVEsc0JBQVIsQ0FBK0IsQ0FBQzs7d0JBRXhDLFFBQUEsR0FBVSxTQUFBO01BRVIsSUFBQyxDQUFBLFdBQUQsR0FBZSxJQUFJO01BQ25CLElBQUMsQ0FBQSxXQUFELEdBQWUsT0FBQSxDQUFRLGlCQUFSLENBQTBCLENBQUM7YUFDMUMsSUFBQyxDQUFBLFdBQVcsQ0FBQyxHQUFiLENBQWlCLElBQUksQ0FBQyxNQUFNLENBQUMsT0FBWixDQUF1QixJQUFDLENBQUEsV0FBRixHQUFjLFdBQXBDLEVBQWdELENBQUEsU0FBQSxLQUFBO2VBQUEsU0FBQTtpQkFBRyxLQUFDLENBQUEsaUJBQUQsQ0FBQTtRQUFIO01BQUEsQ0FBQSxDQUFBLENBQUEsSUFBQSxDQUFoRCxDQUFqQjtJQUpROzt3QkFNVixVQUFBLEdBQVksU0FBQTthQUNWLElBQUMsQ0FBQSxXQUFXLENBQUMsT0FBYixDQUFBO0lBRFU7O3dCQUdaLGlCQUFBLEdBQW1CLFNBQUE7QUFDakIsVUFBQTtNQUFBLFFBQUEsR0FBVyxJQUFJLENBQUMsTUFBTSxDQUFDLEdBQVosQ0FBbUIsSUFBQyxDQUFBLFdBQUYsR0FBYyxXQUFoQzthQUNYLElBQUMsQ0FBQSxXQUFELENBQWEsUUFBYjtJQUZpQjs7d0JBSW5CLFdBQUEsR0FBYSxTQUFDLFFBQUQ7QUFDWCxVQUFBO01BQUEsYUFBQSxHQUFtQixTQUFELEdBQVc7TUFDN0IsRUFBRSxDQUFDLGFBQUgsQ0FBaUIsYUFBakIsRUFBZ0MsOEJBQUEsR0FBOEIsQ0FBQyxJQUFDLENBQUEsaUJBQUQsQ0FBbUIsUUFBbkIsQ0FBRCxDQUE5QixHQUE0RCxJQUE1RjthQUNBLElBQUksQ0FBQyxRQUFRLENBQUMsZ0JBQWQsQ0FBK0IsRUFBQSxHQUFHLElBQUMsQ0FBQSxXQUFuQyxDQUFpRCxDQUFDLGlCQUFsRCxDQUFBO0lBSFc7O3dCQUtiLGlCQUFBLEdBQW1CLFNBQUMsSUFBRDthQUNqQixDQUFBLEVBQUEsR0FBRyxJQUFILENBQ0UsQ0FBQyxPQURILENBQ1csS0FEWCxFQUNrQixHQURsQixDQUVFLENBQUMsV0FGSCxDQUFBO0lBRGlCOzs7Ozs7RUFLckIsTUFBTSxDQUFDLE9BQVAsR0FBaUIsSUFBSTtBQS9CckIiLCJzb3VyY2VzQ29udGVudCI6WyJmcyA9IHJlcXVpcmUgJ2ZzJ1xucGF0aCA9IHJlcXVpcmUgJ3BhdGgnXG57Q29tcG9zaXRlRGlzcG9zYWJsZX0gPSByZXF1aXJlICdhdG9tJ1xuXG5jbGFzcyBGbGF0d2hpdGVcblxuICBjb25maWc6IHJlcXVpcmUoJy4vZmxhdHdoaXRlLXNldHRpbmdzJykuY29uZmlnXG5cbiAgYWN0aXZhdGU6IC0+XG5cbiAgICBAZGlzcG9zYWJsZXMgPSBuZXcgQ29tcG9zaXRlRGlzcG9zYWJsZVxuICAgIEBwYWNrYWdlTmFtZSA9IHJlcXVpcmUoJy4uL3BhY2thZ2UuanNvbicpLm5hbWVcbiAgICBAZGlzcG9zYWJsZXMuYWRkIGF0b20uY29uZmlnLm9ic2VydmUgXCIje0BwYWNrYWdlTmFtZX0uZWJtZWRkZWRcIiwgPT4gQGVuYWJsZUNvbmZpZ1RoZW1lKClcblxuICBkZWFjdGl2YXRlOiAtPlxuICAgIEBkaXNwb3NhYmxlcy5kaXNwb3NlKClcblxuICBlbmFibGVDb25maWdUaGVtZTogLT5cbiAgICBlYm1lZGRlZCA9IGF0b20uY29uZmlnLmdldCBcIiN7QHBhY2thZ2VOYW1lfS5lYm1lZGRlZFwiXG4gICAgQGVuYWJsZVRoZW1lIGVibWVkZGVkXG5cbiAgZW5hYmxlVGhlbWU6IChlYm1lZGRlZCkgLT5cbiAgICBlbWJlZGRlZF9wYXRoID0gXCIje19fZGlybmFtZX0vLi4vc3R5bGVzL3NldHRpbmdzLmxlc3NcIlxuICAgIGZzLndyaXRlRmlsZVN5bmMgZW1iZWRkZWRfcGF0aCwgXCJAaW1wb3J0ICdsYW5ndWFnZXMvZW1iZWRkZWQtI3tAZ2V0Tm9ybWFsaXplZE5hbWUoZWJtZWRkZWQpfSc7XCJcbiAgICBhdG9tLnBhY2thZ2VzLmdldExvYWRlZFBhY2thZ2UoXCIje0BwYWNrYWdlTmFtZX1cIikucmVsb2FkU3R5bGVzaGVldHMoKVxuXG4gIGdldE5vcm1hbGl6ZWROYW1lOiAobmFtZSkgLT5cbiAgICBcIiN7bmFtZX1cIlxuICAgICAgLnJlcGxhY2UgL1xcIC9nLCAnLSdcbiAgICAgIC50b0xvd2VyQ2FzZSgpXG5cbm1vZHVsZS5leHBvcnRzID0gbmV3IEZsYXR3aGl0ZVxuIl19
