(function() {
  var BrowserPlus, BrowserPlusModel, CompositeDisposable, uuid;

  CompositeDisposable = require('atom').CompositeDisposable;

  BrowserPlusModel = require('./browser-plus-model');

  require('JSON2');

  uuid = require('node-uuid');

  module.exports = BrowserPlus = {
    browserPlusView: null,
    subscriptions: null,
    config: {
      fav: {
        title: 'No of Favorites',
        type: 'number',
        "default": 10
      },
      homepage: {
        title: 'HomePage',
        type: 'string',
        "default": 'browser-plus://blank'
      },
      live: {
        title: 'Live Refresh in ',
        type: 'number',
        "default": 500
      },
      currentFile: {
        title: 'Show Current File',
        type: 'boolean',
        "default": true
      },
      openInSameWindow: {
        title: 'Open URLs in Same Window',
        type: 'array',
        "default": ['www.google.com', 'www.stackoverflow.com', 'google.com', 'stackoverflow.com']
      }
    },
    activate: function(state) {
      var $;
      if (!state.noReset) {
        state.favIcon = {};
        state.title = {};
        state.fav = [];
      }
      this.resources = (atom.packages.getPackageDirPaths()[0]) + "/browser-plus/resources/";
      require('jstorage');
      window.bp = {};
      $ = require('jquery');
      window.bp.js = $.extend({}, window.$.jStorage);
      if (!window.bp.js.get('bp.fav')) {
        window.bp.js.set('bp.fav', []);
      }
      if (!window.bp.js.get('bp.history')) {
        window.bp.js.set('bp.history', []);
      }
      if (!window.bp.js.get('bp.favIcon')) {
        window.bp.js.set('bp.favIcon', {});
      }
      if (!window.bp.js.get('bp.title')) {
        window.bp.js.set('bp.title', {});
      }
      atom.workspace.addOpener((function(_this) {
        return function(url, opt) {
          var editor, localhostPattern, pane, path;
          if (opt == null) {
            opt = {};
          }
          path = require('path');
          if (url.indexOf('http:') === 0 || url.indexOf('https:') === 0 || url.indexOf('localhost') === 0 || url.indexOf('file:') === 0 || url.indexOf('browser-plus:') === 0 || url.indexOf('browser-plus~') === 0) {
            localhostPattern = /^(http:\/\/)?localhost/i;
            if (!BrowserPlusModel.checkUrl(url)) {
              return false;
            }
            if (!(url === 'browser-plus://blank' || url.startsWith('file:///') || !opt.openInSameWindow)) {
              editor = BrowserPlusModel.getEditorForURI(url, opt.openInSameWindow);
              if (editor) {
                editor.setText(opt.src);
                if (!opt.src) {
                  editor.refresh(url);
                }
                pane = atom.workspace.paneForItem(editor);
                pane.activateItem(editor);
                return editor;
              }
            }
            return new BrowserPlusModel({
              browserPlus: _this,
              url: url,
              opt: opt
            });
          }
        };
      })(this));
      this.subscriptions = new CompositeDisposable;
      this.subscriptions.add(atom.commands.add('atom-workspace', {
        'browser-plus:open': (function(_this) {
          return function() {
            return _this.open();
          };
        })(this)
      }));
      this.subscriptions.add(atom.commands.add('atom-workspace', {
        'browser-plus:openCurrent': (function(_this) {
          return function() {
            return _this.open(true);
          };
        })(this)
      }));
      this.subscriptions.add(atom.commands.add('atom-workspace', {
        'browser-plus:history': (function(_this) {
          return function() {
            return _this.history(true);
          };
        })(this)
      }));
      this.subscriptions.add(atom.commands.add('atom-workspace', {
        'browser-plus:deleteHistory': (function(_this) {
          return function() {
            return _this["delete"](true);
          };
        })(this)
      }));
      return this.subscriptions.add(atom.commands.add('atom-workspace', {
        'browser-plus:fav': (function(_this) {
          return function() {
            return _this.favr();
          };
        })(this)
      }));
    },
    favr: function() {
      var favList;
      favList = require('./fav-view');
      return new favList(window.bp.js.get('bp.fav'));
    },
    "delete": function() {
      return window.bp.js.set('bp.history', []);
    },
    history: function() {
      return atom.workspace.open("browser-plus://history", {
        split: 'left',
        searchAllPanes: true
      });
    },
    open: function(url, opt) {
      var editor, ref;
      if (opt == null) {
        opt = {};
      }
      if (!url && atom.config.get('browser-plus.currentFile')) {
        editor = atom.workspace.getActiveTextEditor();
        if (url = editor != null ? (ref = editor.buffer) != null ? ref.getUri() : void 0 : void 0) {
          url = "file:///" + url;
        }
      }
      if (!url) {
        url = atom.config.get('browser-plus.homepage');
      }
      if (!opt.split) {
        opt.split = this.getPosition();
      }
      return atom.workspace.open(url, opt);
    },
    getPosition: function() {
      var activePane, orientation, paneAxis, paneIndex, ref;
      activePane = atom.workspace.paneForItem(atom.workspace.getActiveTextEditor());
      if (!activePane) {
        return;
      }
      paneAxis = activePane.getParent();
      if (!paneAxis) {
        return;
      }
      paneIndex = paneAxis.getPanes().indexOf(activePane);
      orientation = (ref = paneAxis.orientation) != null ? ref : 'horizontal';
      if (orientation === 'horizontal') {
        if (paneIndex === 0) {
          return 'right';
        } else {
          return 'left';
        }
      } else {
        if (paneIndex === 0) {
          return 'down';
        } else {
          return 'up';
        }
      }
    },
    deactivate: function() {
      var ref;
      if ((ref = this.browserPlusView) != null) {
        if (typeof ref.destroy === "function") {
          ref.destroy();
        }
      }
      return this.subscriptions.dispose();
    },
    serialize: function() {
      return {
        noReset: true
      };
    },
    getBrowserPlusUrl: function(url) {
      if (url.startsWith('browser-plus://history')) {
        return url = this.resources + "history.html";
      } else {
        return url = '';
      }
    },
    addPlugin: function(requires) {
      var error, key, menu, pkg, pkgPath, pkgs, results, script, val;
      if (this.plugins == null) {
        this.plugins = {};
      }
      results = [];
      for (key in requires) {
        val = requires[key];
        try {
          switch (key) {
            case 'onInit' || 'onExit':
              results.push(this.plugins[key] = (this.plugins[key] || []).concat("(" + (val.toString()) + ")()"));
              break;
            case 'js' || 'css':
              if (!pkgPath) {
                pkgs = Object.keys(atom.packages.activatingPackages).sort();
                pkg = pkgs[pkgs.length - 1];
                pkgPath = atom.packages.activatingPackages[pkg].path + "/";
              }
              if (Array.isArray(val)) {
                results.push((function() {
                  var i, len, results1;
                  results1 = [];
                  for (i = 0, len = val.length; i < len; i++) {
                    script = val[i];
                    if (!script.startsWith('http')) {
                      results1.push(this.plugins[key + "s"] = (this.plugins[key] || []).concat('file:///' + atom.packages.activatingPackages[pkg].path.replace(/\\/g, "/") + "/" + script));
                    } else {
                      results1.push(void 0);
                    }
                  }
                  return results1;
                }).call(this));
              } else {
                if (!val.startsWith('http')) {
                  results.push(this.plugins[key + "s"] = (this.plugins[key] || []).concat('file:///' + atom.packages.activatingPackages[pkg].path.replace(/\\/g, "/") + "/" + val));
                } else {
                  results.push(void 0);
                }
              }
              break;
            case 'menus':
              if (Array.isArray(val)) {
                results.push((function() {
                  var i, len, results1;
                  results1 = [];
                  for (i = 0, len = val.length; i < len; i++) {
                    menu = val[i];
                    menu._id = uuid.v1();
                    results1.push(this.plugins[key] = (this.plugins[key] || []).concat(menu));
                  }
                  return results1;
                }).call(this));
              } else {
                val._id = uuid.v1();
                results.push(this.plugins[key] = (this.plugins[key] || []).concat(val));
              }
              break;
            default:
              results.push(void 0);
          }
        } catch (error1) {
          error = error1;
        }
      }
      return results;
    },
    provideService: function() {
      return {
        model: require('./browser-plus-model'),
        addPlugin: this.addPlugin.bind(this)
      };
    }
  };

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL2hvbWUvbWFyY3VzLy5hdG9tL3BhY2thZ2VzL2Jyb3dzZXItcGx1cy9saWIvYnJvd3Nlci1wbHVzLmNvZmZlZSJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFDQTtBQUFBLE1BQUE7O0VBQUMsc0JBQXVCLE9BQUEsQ0FBUSxNQUFSOztFQUN4QixnQkFBQSxHQUFtQixPQUFBLENBQVEsc0JBQVI7O0VBQ25CLE9BQUEsQ0FBUSxPQUFSOztFQUVBLElBQUEsR0FBTyxPQUFBLENBQVEsV0FBUjs7RUFDUCxNQUFNLENBQUMsT0FBUCxHQUFpQixXQUFBLEdBQ2Y7SUFBQSxlQUFBLEVBQWlCLElBQWpCO0lBQ0EsYUFBQSxFQUFlLElBRGY7SUFFQSxNQUFBLEVBQ0U7TUFBQSxHQUFBLEVBQ0U7UUFBQSxLQUFBLEVBQU8saUJBQVA7UUFDQSxJQUFBLEVBQU0sUUFETjtRQUVBLENBQUEsT0FBQSxDQUFBLEVBQVMsRUFGVDtPQURGO01BSUEsUUFBQSxFQUNFO1FBQUEsS0FBQSxFQUFPLFVBQVA7UUFDQSxJQUFBLEVBQU0sUUFETjtRQUVBLENBQUEsT0FBQSxDQUFBLEVBQVMsc0JBRlQ7T0FMRjtNQVFBLElBQUEsRUFDRTtRQUFBLEtBQUEsRUFBTyxrQkFBUDtRQUNBLElBQUEsRUFBTSxRQUROO1FBRUEsQ0FBQSxPQUFBLENBQUEsRUFBUyxHQUZUO09BVEY7TUFZQSxXQUFBLEVBQ0U7UUFBQSxLQUFBLEVBQU8sbUJBQVA7UUFDQSxJQUFBLEVBQU0sU0FETjtRQUVBLENBQUEsT0FBQSxDQUFBLEVBQVMsSUFGVDtPQWJGO01BZ0JBLGdCQUFBLEVBQ0U7UUFBQSxLQUFBLEVBQU8sMEJBQVA7UUFDQSxJQUFBLEVBQU0sT0FETjtRQUVBLENBQUEsT0FBQSxDQUFBLEVBQVMsQ0FBQyxnQkFBRCxFQUFrQix1QkFBbEIsRUFBMEMsWUFBMUMsRUFBdUQsbUJBQXZELENBRlQ7T0FqQkY7S0FIRjtJQXdCQSxRQUFBLEVBQVUsU0FBQyxLQUFEO0FBQ1IsVUFBQTtNQUFBLElBQUEsQ0FBTyxLQUFLLENBQUMsT0FBYjtRQUNFLEtBQUssQ0FBQyxPQUFOLEdBQWdCO1FBQ2hCLEtBQUssQ0FBQyxLQUFOLEdBQWM7UUFDZCxLQUFLLENBQUMsR0FBTixHQUFZLEdBSGQ7O01BSUEsSUFBQyxDQUFBLFNBQUQsR0FBZSxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsa0JBQWQsQ0FBQSxDQUFtQyxDQUFBLENBQUEsQ0FBcEMsQ0FBQSxHQUF1QztNQUN0RCxPQUFBLENBQVEsVUFBUjtNQUNBLE1BQU0sQ0FBQyxFQUFQLEdBQVk7TUFDWixDQUFBLEdBQUksT0FBQSxDQUFRLFFBQVI7TUFDSixNQUFNLENBQUMsRUFBRSxDQUFDLEVBQVYsR0FBZ0IsQ0FBQyxDQUFDLE1BQUYsQ0FBUyxFQUFULEVBQVksTUFBTSxDQUFDLENBQUMsQ0FBQyxRQUFyQjtNQUNoQixJQUFBLENBQXFDLE1BQU0sQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEdBQWIsQ0FBaUIsUUFBakIsQ0FBckM7UUFBQSxNQUFNLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxHQUFiLENBQWlCLFFBQWpCLEVBQTBCLEVBQTFCLEVBQUE7O01BQ0EsSUFBQSxDQUEwQyxNQUFNLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxHQUFiLENBQWlCLFlBQWpCLENBQTFDO1FBQUEsTUFBTSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsR0FBYixDQUFpQixZQUFqQixFQUE4QixFQUE5QixFQUFBOztNQUNBLElBQUEsQ0FBMEMsTUFBTSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsR0FBYixDQUFpQixZQUFqQixDQUExQztRQUFBLE1BQU0sQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEdBQWIsQ0FBaUIsWUFBakIsRUFBOEIsRUFBOUIsRUFBQTs7TUFDQSxJQUFBLENBQXdDLE1BQU0sQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEdBQWIsQ0FBaUIsVUFBakIsQ0FBeEM7UUFBQSxNQUFNLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxHQUFiLENBQWlCLFVBQWpCLEVBQTRCLEVBQTVCLEVBQUE7O01BRUEsSUFBSSxDQUFDLFNBQVMsQ0FBQyxTQUFmLENBQXlCLENBQUEsU0FBQSxLQUFBO2VBQUEsU0FBQyxHQUFELEVBQUssR0FBTDtBQUN2QixjQUFBOztZQUQ0QixNQUFJOztVQUNoQyxJQUFBLEdBQU8sT0FBQSxDQUFRLE1BQVI7VUFDUCxJQUFLLEdBQUcsQ0FBQyxPQUFKLENBQVksT0FBWixDQUFBLEtBQXdCLENBQXhCLElBQTZCLEdBQUcsQ0FBQyxPQUFKLENBQVksUUFBWixDQUFBLEtBQXlCLENBQXRELElBQ0QsR0FBRyxDQUFDLE9BQUosQ0FBWSxXQUFaLENBQUEsS0FBNEIsQ0FEM0IsSUFDZ0MsR0FBRyxDQUFDLE9BQUosQ0FBWSxPQUFaLENBQUEsS0FBd0IsQ0FEeEQsSUFFRCxHQUFHLENBQUMsT0FBSixDQUFZLGVBQVosQ0FBQSxLQUFnQyxDQUYvQixJQUdELEdBQUcsQ0FBQyxPQUFKLENBQVksZUFBWixDQUFBLEtBQWdDLENBSHBDO1lBSUcsZ0JBQUEsR0FBbUI7WUFJbkIsSUFBQSxDQUFvQixnQkFBZ0IsQ0FBQyxRQUFqQixDQUEwQixHQUExQixDQUFwQjtBQUFBLHFCQUFPLE1BQVA7O1lBRUEsSUFBQSxDQUFBLENBQU8sR0FBQSxLQUFPLHNCQUFQLElBQWlDLEdBQUcsQ0FBQyxVQUFKLENBQWUsVUFBZixDQUFqQyxJQUErRCxDQUFJLEdBQUcsQ0FBQyxnQkFBOUUsQ0FBQTtjQUNFLE1BQUEsR0FBUyxnQkFBZ0IsQ0FBQyxlQUFqQixDQUFpQyxHQUFqQyxFQUFxQyxHQUFHLENBQUMsZ0JBQXpDO2NBQ1QsSUFBRyxNQUFIO2dCQUNFLE1BQU0sQ0FBQyxPQUFQLENBQWUsR0FBRyxDQUFDLEdBQW5CO2dCQUNBLElBQUEsQ0FBMkIsR0FBRyxDQUFDLEdBQS9CO2tCQUFBLE1BQU0sQ0FBQyxPQUFQLENBQWUsR0FBZixFQUFBOztnQkFDQSxJQUFBLEdBQU8sSUFBSSxDQUFDLFNBQVMsQ0FBQyxXQUFmLENBQTJCLE1BQTNCO2dCQUNQLElBQUksQ0FBQyxZQUFMLENBQWtCLE1BQWxCO0FBQ0EsdUJBQU8sT0FMVDtlQUZGOzttQkFVSSxJQUFBLGdCQUFBLENBQWlCO2NBQUMsV0FBQSxFQUFZLEtBQWI7Y0FBZSxHQUFBLEVBQUksR0FBbkI7Y0FBdUIsR0FBQSxFQUFJLEdBQTNCO2FBQWpCLEVBcEJQOztRQUZ1QjtNQUFBLENBQUEsQ0FBQSxDQUFBLElBQUEsQ0FBekI7TUF5QkEsSUFBQyxDQUFBLGFBQUQsR0FBaUIsSUFBSTtNQUdyQixJQUFDLENBQUEsYUFBYSxDQUFDLEdBQWYsQ0FBbUIsSUFBSSxDQUFDLFFBQVEsQ0FBQyxHQUFkLENBQWtCLGdCQUFsQixFQUFvQztRQUFBLG1CQUFBLEVBQXFCLENBQUEsU0FBQSxLQUFBO2lCQUFBLFNBQUE7bUJBQUcsS0FBQyxDQUFBLElBQUQsQ0FBQTtVQUFIO1FBQUEsQ0FBQSxDQUFBLENBQUEsSUFBQSxDQUFyQjtPQUFwQyxDQUFuQjtNQUNBLElBQUMsQ0FBQSxhQUFhLENBQUMsR0FBZixDQUFtQixJQUFJLENBQUMsUUFBUSxDQUFDLEdBQWQsQ0FBa0IsZ0JBQWxCLEVBQW9DO1FBQUEsMEJBQUEsRUFBNEIsQ0FBQSxTQUFBLEtBQUE7aUJBQUEsU0FBQTttQkFBRyxLQUFDLENBQUEsSUFBRCxDQUFNLElBQU47VUFBSDtRQUFBLENBQUEsQ0FBQSxDQUFBLElBQUEsQ0FBNUI7T0FBcEMsQ0FBbkI7TUFDQSxJQUFDLENBQUEsYUFBYSxDQUFDLEdBQWYsQ0FBbUIsSUFBSSxDQUFDLFFBQVEsQ0FBQyxHQUFkLENBQWtCLGdCQUFsQixFQUFvQztRQUFBLHNCQUFBLEVBQXdCLENBQUEsU0FBQSxLQUFBO2lCQUFBLFNBQUE7bUJBQUcsS0FBQyxDQUFBLE9BQUQsQ0FBUyxJQUFUO1VBQUg7UUFBQSxDQUFBLENBQUEsQ0FBQSxJQUFBLENBQXhCO09BQXBDLENBQW5CO01BQ0EsSUFBQyxDQUFBLGFBQWEsQ0FBQyxHQUFmLENBQW1CLElBQUksQ0FBQyxRQUFRLENBQUMsR0FBZCxDQUFrQixnQkFBbEIsRUFBb0M7UUFBQSw0QkFBQSxFQUE4QixDQUFBLFNBQUEsS0FBQTtpQkFBQSxTQUFBO21CQUFHLEtBQUMsRUFBQSxNQUFBLEVBQUQsQ0FBUSxJQUFSO1VBQUg7UUFBQSxDQUFBLENBQUEsQ0FBQSxJQUFBLENBQTlCO09BQXBDLENBQW5CO2FBQ0EsSUFBQyxDQUFBLGFBQWEsQ0FBQyxHQUFmLENBQW1CLElBQUksQ0FBQyxRQUFRLENBQUMsR0FBZCxDQUFrQixnQkFBbEIsRUFBb0M7UUFBQSxrQkFBQSxFQUFvQixDQUFBLFNBQUEsS0FBQTtpQkFBQSxTQUFBO21CQUFHLEtBQUMsQ0FBQSxJQUFELENBQUE7VUFBSDtRQUFBLENBQUEsQ0FBQSxDQUFBLElBQUEsQ0FBcEI7T0FBcEMsQ0FBbkI7SUEvQ1EsQ0F4QlY7SUF5RUEsSUFBQSxFQUFNLFNBQUE7QUFDSixVQUFBO01BQUEsT0FBQSxHQUFVLE9BQUEsQ0FBUSxZQUFSO2FBQ04sSUFBQSxPQUFBLENBQVEsTUFBTSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsR0FBYixDQUFpQixRQUFqQixDQUFSO0lBRkEsQ0F6RU47SUE2RUEsQ0FBQSxNQUFBLENBQUEsRUFBUSxTQUFBO2FBQ04sTUFBTSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsR0FBYixDQUFpQixZQUFqQixFQUE4QixFQUE5QjtJQURNLENBN0VSO0lBZ0ZBLE9BQUEsRUFBUyxTQUFBO2FBRVAsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFmLENBQW9CLHdCQUFwQixFQUErQztRQUFDLEtBQUEsRUFBTyxNQUFSO1FBQWUsY0FBQSxFQUFlLElBQTlCO09BQS9DO0lBRk8sQ0FoRlQ7SUFvRkEsSUFBQSxFQUFNLFNBQUMsR0FBRCxFQUFLLEdBQUw7QUFDSixVQUFBOztRQURTLE1BQU07O01BQ2YsSUFBSyxDQUFJLEdBQUosSUFBWSxJQUFJLENBQUMsTUFBTSxDQUFDLEdBQVosQ0FBZ0IsMEJBQWhCLENBQWpCO1FBQ0UsTUFBQSxHQUFTLElBQUksQ0FBQyxTQUFTLENBQUMsbUJBQWYsQ0FBQTtRQUNULElBQUcsR0FBQSx1REFBb0IsQ0FBRSxNQUFoQixDQUFBLG1CQUFUO1VBQ0UsR0FBQSxHQUFNLFVBQUEsR0FBVyxJQURuQjtTQUZGOztNQUlBLElBQUEsQ0FBTyxHQUFQO1FBQ0UsR0FBQSxHQUFNLElBQUksQ0FBQyxNQUFNLENBQUMsR0FBWixDQUFnQix1QkFBaEIsRUFEUjs7TUFHQSxJQUFBLENBQWtDLEdBQUcsQ0FBQyxLQUF0QztRQUFBLEdBQUcsQ0FBQyxLQUFKLEdBQVksSUFBQyxDQUFBLFdBQUQsQ0FBQSxFQUFaOzthQUVBLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBZixDQUFvQixHQUFwQixFQUF5QixHQUF6QjtJQVZJLENBcEZOO0lBZ0dBLFdBQUEsRUFBYSxTQUFBO0FBQ1gsVUFBQTtNQUFBLFVBQUEsR0FBYSxJQUFJLENBQUMsU0FBUyxDQUFDLFdBQWYsQ0FBMkIsSUFBSSxDQUFDLFNBQVMsQ0FBQyxtQkFBZixDQUFBLENBQTNCO01BQ2IsSUFBQSxDQUFjLFVBQWQ7QUFBQSxlQUFBOztNQUNBLFFBQUEsR0FBVyxVQUFVLENBQUMsU0FBWCxDQUFBO01BQ1gsSUFBQSxDQUFjLFFBQWQ7QUFBQSxlQUFBOztNQUNBLFNBQUEsR0FBWSxRQUFRLENBQUMsUUFBVCxDQUFBLENBQW1CLENBQUMsT0FBcEIsQ0FBNEIsVUFBNUI7TUFDWixXQUFBLGdEQUFxQztNQUNyQyxJQUFHLFdBQUEsS0FBZSxZQUFsQjtRQUNFLElBQUksU0FBQSxLQUFhLENBQWpCO2lCQUF3QixRQUF4QjtTQUFBLE1BQUE7aUJBQXFDLE9BQXJDO1NBREY7T0FBQSxNQUFBO1FBR0UsSUFBSSxTQUFBLEtBQWEsQ0FBakI7aUJBQXdCLE9BQXhCO1NBQUEsTUFBQTtpQkFBb0MsS0FBcEM7U0FIRjs7SUFQVyxDQWhHYjtJQTRHQSxVQUFBLEVBQVksU0FBQTtBQUNWLFVBQUE7OzthQUFnQixDQUFFOzs7YUFDbEIsSUFBQyxDQUFBLGFBQWEsQ0FBQyxPQUFmLENBQUE7SUFGVSxDQTVHWjtJQWdIQSxTQUFBLEVBQVcsU0FBQTthQUNUO1FBQUEsT0FBQSxFQUFTLElBQVQ7O0lBRFMsQ0FoSFg7SUFtSEEsaUJBQUEsRUFBbUIsU0FBQyxHQUFEO01BQ2pCLElBQUcsR0FBRyxDQUFDLFVBQUosQ0FBZSx3QkFBZixDQUFIO2VBQ0UsR0FBQSxHQUFTLElBQUMsQ0FBQSxTQUFGLEdBQVksZUFEdEI7T0FBQSxNQUFBO2VBR0UsR0FBQSxHQUFNLEdBSFI7O0lBRGlCLENBbkhuQjtJQXlIQSxTQUFBLEVBQVcsU0FBQyxRQUFEO0FBQ1QsVUFBQTs7UUFBQSxJQUFDLENBQUEsVUFBVzs7QUFDWjtXQUFBLGVBQUE7O0FBQ0U7QUFDRSxrQkFBTyxHQUFQO0FBQUEsaUJBQ08sUUFBQSxJQUFZLFFBRG5COzJCQUVJLElBQUMsQ0FBQSxPQUFRLENBQUEsR0FBQSxDQUFULEdBQWdCLENBQUMsSUFBQyxDQUFBLE9BQVEsQ0FBQSxHQUFBLENBQVQsSUFBaUIsRUFBbEIsQ0FBcUIsQ0FBQyxNQUF0QixDQUE2QixHQUFBLEdBQUcsQ0FBQyxHQUFHLENBQUMsUUFBSixDQUFBLENBQUQsQ0FBSCxHQUFtQixLQUFoRDtBQURiO0FBRFAsaUJBR08sSUFBQSxJQUFRLEtBSGY7Y0FJSSxJQUFBLENBQVEsT0FBUjtnQkFDRSxJQUFBLEdBQU8sTUFBTSxDQUFDLElBQVAsQ0FBWSxJQUFJLENBQUMsUUFBUSxDQUFDLGtCQUExQixDQUE2QyxDQUFDLElBQTlDLENBQUE7Z0JBQ1AsR0FBQSxHQUFNLElBQUssQ0FBQSxJQUFJLENBQUMsTUFBTCxHQUFjLENBQWQ7Z0JBQ1gsT0FBQSxHQUFVLElBQUksQ0FBQyxRQUFRLENBQUMsa0JBQW1CLENBQUEsR0FBQSxDQUFJLENBQUMsSUFBdEMsR0FBNkMsSUFIekQ7O2NBSUEsSUFBRyxLQUFLLENBQUMsT0FBTixDQUFjLEdBQWQsQ0FBSDs7O0FBQ0U7dUJBQUEscUNBQUE7O29CQUNFLElBQUEsQ0FBTyxNQUFNLENBQUMsVUFBUCxDQUFrQixNQUFsQixDQUFQO29DQUNFLElBQUMsQ0FBQSxPQUFRLENBQUEsR0FBQSxHQUFJLEdBQUosQ0FBVCxHQUFvQixDQUFDLElBQUMsQ0FBQSxPQUFRLENBQUEsR0FBQSxDQUFULElBQWlCLEVBQWxCLENBQXFCLENBQUMsTUFBdEIsQ0FBNkIsVUFBQSxHQUFXLElBQUksQ0FBQyxRQUFRLENBQUMsa0JBQW1CLENBQUEsR0FBQSxDQUFJLENBQUMsSUFBSSxDQUFDLE9BQTNDLENBQW1ELEtBQW5ELEVBQXlELEdBQXpELENBQVgsR0FBMkUsR0FBM0UsR0FBaUYsTUFBOUcsR0FEdEI7cUJBQUEsTUFBQTs0Q0FBQTs7QUFERjs7K0JBREY7ZUFBQSxNQUFBO2dCQUtFLElBQUEsQ0FBTyxHQUFHLENBQUMsVUFBSixDQUFlLE1BQWYsQ0FBUDsrQkFDRSxJQUFDLENBQUEsT0FBUSxDQUFBLEdBQUEsR0FBSSxHQUFKLENBQVQsR0FBb0IsQ0FBQyxJQUFDLENBQUEsT0FBUSxDQUFBLEdBQUEsQ0FBVCxJQUFpQixFQUFsQixDQUFxQixDQUFDLE1BQXRCLENBQTZCLFVBQUEsR0FBWSxJQUFJLENBQUMsUUFBUSxDQUFDLGtCQUFtQixDQUFBLEdBQUEsQ0FBSSxDQUFDLElBQUksQ0FBQyxPQUEzQyxDQUFtRCxLQUFuRCxFQUF5RCxHQUF6RCxDQUFaLEdBQTRFLEdBQTVFLEdBQWtGLEdBQS9HLEdBRHRCO2lCQUFBLE1BQUE7dUNBQUE7aUJBTEY7O0FBTEc7QUFIUCxpQkFnQk8sT0FoQlA7Y0FpQkksSUFBRyxLQUFLLENBQUMsT0FBTixDQUFjLEdBQWQsQ0FBSDs7O0FBQ0U7dUJBQUEscUNBQUE7O29CQUNFLElBQUksQ0FBQyxHQUFMLEdBQVcsSUFBSSxDQUFDLEVBQUwsQ0FBQTtrQ0FDWCxJQUFDLENBQUEsT0FBUSxDQUFBLEdBQUEsQ0FBVCxHQUFnQixDQUFDLElBQUMsQ0FBQSxPQUFRLENBQUEsR0FBQSxDQUFULElBQWlCLEVBQWxCLENBQXFCLENBQUMsTUFBdEIsQ0FBNkIsSUFBN0I7QUFGbEI7OytCQURGO2VBQUEsTUFBQTtnQkFLRSxHQUFHLENBQUMsR0FBSixHQUFVLElBQUksQ0FBQyxFQUFMLENBQUE7NkJBQ1YsSUFBQyxDQUFBLE9BQVEsQ0FBQSxHQUFBLENBQVQsR0FBZ0IsQ0FBQyxJQUFDLENBQUEsT0FBUSxDQUFBLEdBQUEsQ0FBVCxJQUFpQixFQUFsQixDQUFxQixDQUFDLE1BQXRCLENBQTZCLEdBQTdCLEdBTmxCOztBQURHO0FBaEJQOztBQUFBLFdBREY7U0FBQSxjQUFBO1VBMEJNLGVBMUJOOztBQURGOztJQUZTLENBekhYO0lBMEpBLGNBQUEsRUFBZ0IsU0FBQTthQUNkO1FBQUEsS0FBQSxFQUFNLE9BQUEsQ0FBUSxzQkFBUixDQUFOO1FBQ0EsU0FBQSxFQUFXLElBQUMsQ0FBQSxTQUFTLENBQUMsSUFBWCxDQUFnQixJQUFoQixDQURYOztJQURjLENBMUpoQjs7QUFORiIsInNvdXJjZXNDb250ZW50IjpbIiMgYXRvbS5wcm9qZWN0LnJlc29sdmVQYXRoXG57Q29tcG9zaXRlRGlzcG9zYWJsZX0gPSByZXF1aXJlICdhdG9tJ1xuQnJvd3NlclBsdXNNb2RlbCA9IHJlcXVpcmUgJy4vYnJvd3Nlci1wbHVzLW1vZGVsJ1xucmVxdWlyZSAnSlNPTjInXG5cbnV1aWQgPSByZXF1aXJlICdub2RlLXV1aWQnXG5tb2R1bGUuZXhwb3J0cyA9IEJyb3dzZXJQbHVzID1cbiAgYnJvd3NlclBsdXNWaWV3OiBudWxsXG4gIHN1YnNjcmlwdGlvbnM6IG51bGxcbiAgY29uZmlnOlxuICAgIGZhdjpcbiAgICAgIHRpdGxlOiAnTm8gb2YgRmF2b3JpdGVzJ1xuICAgICAgdHlwZTogJ251bWJlcidcbiAgICAgIGRlZmF1bHQ6IDEwXG4gICAgaG9tZXBhZ2U6XG4gICAgICB0aXRsZTogJ0hvbWVQYWdlJ1xuICAgICAgdHlwZTogJ3N0cmluZydcbiAgICAgIGRlZmF1bHQ6ICdicm93c2VyLXBsdXM6Ly9ibGFuaydcbiAgICBsaXZlOlxuICAgICAgdGl0bGU6ICdMaXZlIFJlZnJlc2ggaW4gJ1xuICAgICAgdHlwZTogJ251bWJlcidcbiAgICAgIGRlZmF1bHQ6IDUwMFxuICAgIGN1cnJlbnRGaWxlOlxuICAgICAgdGl0bGU6ICdTaG93IEN1cnJlbnQgRmlsZSdcbiAgICAgIHR5cGU6ICdib29sZWFuJ1xuICAgICAgZGVmYXVsdDogdHJ1ZVxuICAgIG9wZW5JblNhbWVXaW5kb3c6XG4gICAgICB0aXRsZTogJ09wZW4gVVJMcyBpbiBTYW1lIFdpbmRvdydcbiAgICAgIHR5cGU6ICdhcnJheSdcbiAgICAgIGRlZmF1bHQ6IFsnd3d3Lmdvb2dsZS5jb20nLCd3d3cuc3RhY2tvdmVyZmxvdy5jb20nLCdnb29nbGUuY29tJywnc3RhY2tvdmVyZmxvdy5jb20nXVxuXG4gIGFjdGl2YXRlOiAoc3RhdGUpIC0+XG4gICAgdW5sZXNzIHN0YXRlLm5vUmVzZXRcbiAgICAgIHN0YXRlLmZhdkljb24gPSB7fVxuICAgICAgc3RhdGUudGl0bGUgPSB7fVxuICAgICAgc3RhdGUuZmF2ID0gW11cbiAgICBAcmVzb3VyY2VzID0gXCIje2F0b20ucGFja2FnZXMuZ2V0UGFja2FnZURpclBhdGhzKClbMF19L2Jyb3dzZXItcGx1cy9yZXNvdXJjZXMvXCJcbiAgICByZXF1aXJlICdqc3RvcmFnZSdcbiAgICB3aW5kb3cuYnAgPSB7fVxuICAgICQgPSByZXF1aXJlKCdqcXVlcnknKVxuICAgIHdpbmRvdy5icC5qcyAgPSAkLmV4dGVuZCh7fSx3aW5kb3cuJC5qU3RvcmFnZSlcbiAgICB3aW5kb3cuYnAuanMuc2V0KCdicC5mYXYnLFtdKSB1bmxlc3Mgd2luZG93LmJwLmpzLmdldCgnYnAuZmF2JylcbiAgICB3aW5kb3cuYnAuanMuc2V0KCdicC5oaXN0b3J5JyxbXSkgIHVubGVzcyB3aW5kb3cuYnAuanMuZ2V0KCdicC5oaXN0b3J5JylcbiAgICB3aW5kb3cuYnAuanMuc2V0KCdicC5mYXZJY29uJyx7fSkgIHVubGVzcyB3aW5kb3cuYnAuanMuZ2V0KCdicC5mYXZJY29uJylcbiAgICB3aW5kb3cuYnAuanMuc2V0KCdicC50aXRsZScse30pICB1bmxlc3Mgd2luZG93LmJwLmpzLmdldCgnYnAudGl0bGUnKVxuXG4gICAgYXRvbS53b3Jrc3BhY2UuYWRkT3BlbmVyICh1cmwsb3B0PXt9KT0+XG4gICAgICBwYXRoID0gcmVxdWlyZSAncGF0aCdcbiAgICAgIGlmICggdXJsLmluZGV4T2YoJ2h0dHA6JykgaXMgMCBvciB1cmwuaW5kZXhPZignaHR0cHM6JykgaXMgMCBvclxuICAgICAgICAgIHVybC5pbmRleE9mKCdsb2NhbGhvc3QnKSBpcyAwIG9yIHVybC5pbmRleE9mKCdmaWxlOicpIGlzIDAgb3JcbiAgICAgICAgICB1cmwuaW5kZXhPZignYnJvd3Nlci1wbHVzOicpIGlzIDAgICBvciAjb3Igb3B0LnNyY1xuICAgICAgICAgIHVybC5pbmRleE9mKCdicm93c2VyLXBsdXN+JykgaXMgMCApXG4gICAgICAgICBsb2NhbGhvc3RQYXR0ZXJuID0gLy8vXlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKGh0dHA6Ly8pP1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbG9jYWxob3N0XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLy9pXG4gICAgICAgICByZXR1cm4gZmFsc2UgdW5sZXNzIEJyb3dzZXJQbHVzTW9kZWwuY2hlY2tVcmwodXJsKVxuICAgICAgICAgIyAgY2hlY2sgaWYgaXQgbmVlZCB0byBiZSBvcGVuIGluIHNhbWUgd2luZG93XG4gICAgICAgICB1bmxlc3MgdXJsIGlzICdicm93c2VyLXBsdXM6Ly9ibGFuaycgb3IgdXJsLnN0YXJ0c1dpdGgoJ2ZpbGU6Ly8vJykgb3Igbm90IG9wdC5vcGVuSW5TYW1lV2luZG93XG4gICAgICAgICAgIGVkaXRvciA9IEJyb3dzZXJQbHVzTW9kZWwuZ2V0RWRpdG9yRm9yVVJJKHVybCxvcHQub3BlbkluU2FtZVdpbmRvdylcbiAgICAgICAgICAgaWYgZWRpdG9yXG4gICAgICAgICAgICAgZWRpdG9yLnNldFRleHQob3B0LnNyYylcbiAgICAgICAgICAgICBlZGl0b3IucmVmcmVzaCh1cmwpIHVubGVzcyBvcHQuc3JjXG4gICAgICAgICAgICAgcGFuZSA9IGF0b20ud29ya3NwYWNlLnBhbmVGb3JJdGVtKGVkaXRvcilcbiAgICAgICAgICAgICBwYW5lLmFjdGl2YXRlSXRlbShlZGl0b3IpXG4gICAgICAgICAgICAgcmV0dXJuIGVkaXRvclxuXG4gICAgICAgICMgIHVybCA9IHVybC5yZXBsYWNlKGxvY2FsaG9zdFBhdHRlcm4sJ2h0dHA6Ly8xMjcuMC4wLjEnKVxuICAgICAgICAgbmV3IEJyb3dzZXJQbHVzTW9kZWwge2Jyb3dzZXJQbHVzOkAsdXJsOnVybCxvcHQ6b3B0fVxuXG4gICAgIyBFdmVudHMgc3Vic2NyaWJlZCB0byBpbiBhdG9tJ3Mgc3lzdGVtIGNhbiBiZSBlYXNpbHkgY2xlYW5lZCB1cCB3aXRoIGEgQ29tcG9zaXRlRGlzcG9zYWJsZVxuICAgIEBzdWJzY3JpcHRpb25zID0gbmV3IENvbXBvc2l0ZURpc3Bvc2FibGVcblxuICAgICMgUmVnaXN0ZXIgY29tbWFuZCB0aGF0IHRvZ2dsZXMgdGhpcyB2aWV3XG4gICAgQHN1YnNjcmlwdGlvbnMuYWRkIGF0b20uY29tbWFuZHMuYWRkICdhdG9tLXdvcmtzcGFjZScsICdicm93c2VyLXBsdXM6b3Blbic6ID0+IEBvcGVuKClcbiAgICBAc3Vic2NyaXB0aW9ucy5hZGQgYXRvbS5jb21tYW5kcy5hZGQgJ2F0b20td29ya3NwYWNlJywgJ2Jyb3dzZXItcGx1czpvcGVuQ3VycmVudCc6ID0+IEBvcGVuKHRydWUpXG4gICAgQHN1YnNjcmlwdGlvbnMuYWRkIGF0b20uY29tbWFuZHMuYWRkICdhdG9tLXdvcmtzcGFjZScsICdicm93c2VyLXBsdXM6aGlzdG9yeSc6ID0+IEBoaXN0b3J5KHRydWUpXG4gICAgQHN1YnNjcmlwdGlvbnMuYWRkIGF0b20uY29tbWFuZHMuYWRkICdhdG9tLXdvcmtzcGFjZScsICdicm93c2VyLXBsdXM6ZGVsZXRlSGlzdG9yeSc6ID0+IEBkZWxldGUodHJ1ZSlcbiAgICBAc3Vic2NyaXB0aW9ucy5hZGQgYXRvbS5jb21tYW5kcy5hZGQgJ2F0b20td29ya3NwYWNlJywgJ2Jyb3dzZXItcGx1czpmYXYnOiA9PiBAZmF2cigpXG5cbiAgZmF2cjogLT5cbiAgICBmYXZMaXN0ID0gcmVxdWlyZSAnLi9mYXYtdmlldydcbiAgICBuZXcgZmF2TGlzdCB3aW5kb3cuYnAuanMuZ2V0KCdicC5mYXYnKVxuXG4gIGRlbGV0ZTogLT5cbiAgICB3aW5kb3cuYnAuanMuc2V0KCdicC5oaXN0b3J5JyxbXSlcblxuICBoaXN0b3J5OiAtPlxuICAgICMgZmlsZTovLy8je0ByZXNvdXJjZXN9aGlzdG9yeS5odG1sXG4gICAgYXRvbS53b3Jrc3BhY2Uub3BlbiBcImJyb3dzZXItcGx1czovL2hpc3RvcnlcIiAsIHtzcGxpdDogJ2xlZnQnLHNlYXJjaEFsbFBhbmVzOnRydWV9XG5cbiAgb3BlbjogKHVybCxvcHQgPSB7fSktPlxuICAgIGlmICggbm90IHVybCBhbmQgYXRvbS5jb25maWcuZ2V0KCdicm93c2VyLXBsdXMuY3VycmVudEZpbGUnKSlcbiAgICAgIGVkaXRvciA9IGF0b20ud29ya3NwYWNlLmdldEFjdGl2ZVRleHRFZGl0b3IoKVxuICAgICAgaWYgdXJsID0gZWRpdG9yPy5idWZmZXI/LmdldFVyaSgpXG4gICAgICAgIHVybCA9IFwiZmlsZTovLy9cIit1cmxcbiAgICB1bmxlc3MgdXJsXG4gICAgICB1cmwgPSBhdG9tLmNvbmZpZy5nZXQoJ2Jyb3dzZXItcGx1cy5ob21lcGFnZScpXG5cbiAgICBvcHQuc3BsaXQgPSBAZ2V0UG9zaXRpb24oKSB1bmxlc3Mgb3B0LnNwbGl0XG4gICAgIyB1cmwgPSBcImJyb3dzZXItcGx1czovL3ByZXZpZXd+I3t1cmx9XCIgaWYgc3JjXG4gICAgYXRvbS53b3Jrc3BhY2Uub3BlbiB1cmwsIG9wdFxuXG4gIGdldFBvc2l0aW9uOiAtPlxuICAgIGFjdGl2ZVBhbmUgPSBhdG9tLndvcmtzcGFjZS5wYW5lRm9ySXRlbSBhdG9tLndvcmtzcGFjZS5nZXRBY3RpdmVUZXh0RWRpdG9yKClcbiAgICByZXR1cm4gdW5sZXNzIGFjdGl2ZVBhbmVcbiAgICBwYW5lQXhpcyA9IGFjdGl2ZVBhbmUuZ2V0UGFyZW50KClcbiAgICByZXR1cm4gdW5sZXNzIHBhbmVBeGlzXG4gICAgcGFuZUluZGV4ID0gcGFuZUF4aXMuZ2V0UGFuZXMoKS5pbmRleE9mKGFjdGl2ZVBhbmUpXG4gICAgb3JpZW50YXRpb24gPSBwYW5lQXhpcy5vcmllbnRhdGlvbiA/ICdob3Jpem9udGFsJ1xuICAgIGlmIG9yaWVudGF0aW9uIGlzICdob3Jpem9udGFsJ1xuICAgICAgaWYgIHBhbmVJbmRleCBpcyAwIHRoZW4gJ3JpZ2h0JyBlbHNlICdsZWZ0J1xuICAgIGVsc2VcbiAgICAgIGlmICBwYW5lSW5kZXggaXMgMCB0aGVuICdkb3duJyBlbHNlICd1cCdcblxuICBkZWFjdGl2YXRlOiAtPlxuICAgIEBicm93c2VyUGx1c1ZpZXc/LmRlc3Ryb3k/KClcbiAgICBAc3Vic2NyaXB0aW9ucy5kaXNwb3NlKClcblxuICBzZXJpYWxpemU6IC0+XG4gICAgbm9SZXNldDogdHJ1ZVxuXG4gIGdldEJyb3dzZXJQbHVzVXJsOiAodXJsKS0+XG4gICAgaWYgdXJsLnN0YXJ0c1dpdGgoJ2Jyb3dzZXItcGx1czovL2hpc3RvcnknKVxuICAgICAgdXJsID0gXCIje0ByZXNvdXJjZXN9aGlzdG9yeS5odG1sXCJcbiAgICBlbHNlXG4gICAgICB1cmwgPSAnJ1xuXG4gIGFkZFBsdWdpbjogKHJlcXVpcmVzKS0+XG4gICAgQHBsdWdpbnMgPz0ge31cbiAgICBmb3Iga2V5LHZhbCBvZiByZXF1aXJlc1xuICAgICAgdHJ5XG4gICAgICAgIHN3aXRjaCBrZXlcbiAgICAgICAgICB3aGVuICdvbkluaXQnIG9yICdvbkV4aXQnXG4gICAgICAgICAgICBAcGx1Z2luc1trZXldID0gKEBwbHVnaW5zW2tleV0gb3IgW10pLmNvbmNhdCBcIigje3ZhbC50b1N0cmluZygpfSkoKVwiXG4gICAgICAgICAgd2hlbiAnanMnIG9yICdjc3MnXG4gICAgICAgICAgICB1bmxlc3MgIHBrZ1BhdGhcbiAgICAgICAgICAgICAgcGtncyA9IE9iamVjdC5rZXlzKGF0b20ucGFja2FnZXMuYWN0aXZhdGluZ1BhY2thZ2VzKS5zb3J0KClcbiAgICAgICAgICAgICAgcGtnID0gcGtnc1twa2dzLmxlbmd0aCAtIDFdXG4gICAgICAgICAgICAgIHBrZ1BhdGggPSBhdG9tLnBhY2thZ2VzLmFjdGl2YXRpbmdQYWNrYWdlc1twa2ddLnBhdGggKyBcIi9cIlxuICAgICAgICAgICAgaWYgQXJyYXkuaXNBcnJheSh2YWwpXG4gICAgICAgICAgICAgIGZvciBzY3JpcHQgaW4gdmFsXG4gICAgICAgICAgICAgICAgdW5sZXNzIHNjcmlwdC5zdGFydHNXaXRoKCdodHRwJylcbiAgICAgICAgICAgICAgICAgIEBwbHVnaW5zW2tleStcInNcIl0gPSAoQHBsdWdpbnNba2V5XSBvciBbXSkuY29uY2F0ICdmaWxlOi8vLycrYXRvbS5wYWNrYWdlcy5hY3RpdmF0aW5nUGFja2FnZXNbcGtnXS5wYXRoLnJlcGxhY2UoL1xcXFwvZyxcIi9cIikgKyBcIi9cIiArIHNjcmlwdFxuICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICB1bmxlc3MgdmFsLnN0YXJ0c1dpdGgoJ2h0dHAnKVxuICAgICAgICAgICAgICAgIEBwbHVnaW5zW2tleStcInNcIl0gPSAoQHBsdWdpbnNba2V5XSBvciBbXSkuY29uY2F0ICdmaWxlOi8vLycrIGF0b20ucGFja2FnZXMuYWN0aXZhdGluZ1BhY2thZ2VzW3BrZ10ucGF0aC5yZXBsYWNlKC9cXFxcL2csXCIvXCIpICsgXCIvXCIgKyB2YWxcblxuICAgICAgICAgIHdoZW4gJ21lbnVzJ1xuICAgICAgICAgICAgaWYgQXJyYXkuaXNBcnJheSh2YWwpXG4gICAgICAgICAgICAgIGZvciBtZW51IGluIHZhbFxuICAgICAgICAgICAgICAgIG1lbnUuX2lkID0gdXVpZC52MSgpXG4gICAgICAgICAgICAgICAgQHBsdWdpbnNba2V5XSA9IChAcGx1Z2luc1trZXldIG9yIFtdKS5jb25jYXQgbWVudVxuICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICB2YWwuX2lkID0gdXVpZC52MSgpXG4gICAgICAgICAgICAgIEBwbHVnaW5zW2tleV0gPSAoQHBsdWdpbnNba2V5XSBvciBbXSkuY29uY2F0IHZhbFxuXG4gICAgICBjYXRjaCBlcnJvclxuXG5cblxuICBwcm92aWRlU2VydmljZTogLT5cbiAgICBtb2RlbDpyZXF1aXJlICcuL2Jyb3dzZXItcGx1cy1tb2RlbCdcbiAgICBhZGRQbHVnaW46IEBhZGRQbHVnaW4uYmluZChAKVxuIl19
