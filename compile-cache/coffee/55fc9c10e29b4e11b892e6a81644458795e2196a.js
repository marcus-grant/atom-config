(function() {
  var BrowserPlus, Disposable, Emitter, HTMLEditor, Model, fs, path, ref,
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty,
    indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

  ref = require('atom'), Disposable = ref.Disposable, Emitter = ref.Emitter;

  Model = require('theorist').Model;

  BrowserPlus = require('./browser-plus').BrowserPlus;

  path = require('path');

  fs = require('fs');

  module.exports = HTMLEditor = (function(superClass) {
    extend(HTMLEditor, superClass);

    atom.deserializers.add(HTMLEditor);

    function HTMLEditor(arg) {
      var i, item, j, len, len1, menu, ref1, ref2;
      this.browserPlus = arg.browserPlus, this.url = arg.url, this.opt = arg.opt;
      if (typeof this.browserPlus === 'string') {
        this.browserPlus = JSON.parse(this.browserPlus);
      }
      if (!this.opt) {
        this.opt = {};
      }
      this.disposable = new Disposable();
      this.emitter = new Emitter;
      this.src = this.opt.src;
      this.orgURI = this.opt.orgURI;
      this._id = this.opt._id;
      if (this.browserPlus && !this.browserPlus.setContextMenu) {
        this.browserPlus.setContextMenu = true;
        ref1 = atom.contextMenu.itemSets;
        for (i = 0, len = ref1.length; i < len; i++) {
          menu = ref1[i];
          if (menu.selector === 'atom-pane') {
            ref2 = menu.items;
            for (j = 0, len1 = ref2.length; j < len1; j++) {
              item = ref2[j];
              item.shouldDisplay = function(evt) {
                var ref3, ref4;
                if ((ref3 = evt.target) != null ? (ref4 = ref3.constructor) != null ? ref4.name = 'webview' : void 0 : void 0) {
                  return false;
                }
                return true;
              };
            }
          }
        }
      }
    }

    HTMLEditor.prototype.getViewClass = function() {
      return require('./browser-plus-view');
    };

    HTMLEditor.prototype.setText = function(src) {
      this.src = src;
      if (this.src) {
        return this.view.setSrc(this.src);
      }
    };

    HTMLEditor.prototype.refresh = function(url) {
      return this.view.refreshPage(url);
    };

    HTMLEditor.prototype.destroyed = function() {
      return this.emitter.emit('did-destroy');
    };

    HTMLEditor.prototype.onDidDestroy = function(cb) {
      return this.emitter.on('did-destroy', cb);
    };

    HTMLEditor.prototype.getTitle = function() {
      var ref1;
      if (((ref1 = this.title) != null ? ref1.length : void 0) > 20) {
        this.title = this.title.slice(0, 20) + '...';
      }
      return this.title || path.basename(this.url);
    };

    HTMLEditor.prototype.getIconName = function() {
      return this.iconName;
    };

    HTMLEditor.prototype.getURI = function() {
      if (this.url === 'browser-plus://blank') {
        return false;
      }
      return this.url;
    };

    HTMLEditor.prototype.getGrammar = function() {};

    HTMLEditor.prototype.setTitle = function(title) {
      this.title = title;
      return this.emit('title-changed');
    };

    HTMLEditor.prototype.updateIcon = function(favIcon) {
      this.favIcon = favIcon;
      return this.emit('icon-changed');
    };

    HTMLEditor.prototype.serialize = function() {
      return {
        data: {
          browserPlus: JSON.stringify(this.browserPlus),
          url: this.url,
          opt: {
            src: this.src,
            iconName: this.iconName,
            title: this.title
          }
        },
        deserializer: 'HTMLEditor'
      };
    };

    HTMLEditor.deserialize = function(arg) {
      var data;
      data = arg.data;
      return new HTMLEditor(data);
    };

    HTMLEditor.checkUrl = function(url) {
      if ((this.checkBlockUrl != null) && this.checkBlockUrl(url)) {
        atom.notifications.addSuccess(url + " Blocked~~Maintain Blocked URL in Browser-Plus Settings");
        return false;
      }
      return true;
    };

    HTMLEditor.getEditorForURI = function(url, sameWindow) {
      var a, a1, editor, i, len, panes, ref1, uri, urls;
      if (url.startsWith('file:///')) {
        return;
      }
      a = document.createElement("a");
      a.href = url;
      if (!sameWindow && (urls = atom.config.get('browser-plus.openInSameWindow')).length) {
        sameWindow = (ref1 = a.hostname, indexOf.call(urls, ref1) >= 0);
      }
      if (!sameWindow) {
        return;
      }
      panes = atom.workspace.getPaneItems();
      a1 = document.createElement("a");
      for (i = 0, len = panes.length; i < len; i++) {
        editor = panes[i];
        uri = editor.getURI();
        a1.href = uri;
        if (a1.hostname === a.hostname) {
          return editor;
        }
      }
      return false;
    };

    return HTMLEditor;

  })(Model);

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL2hvbWUvbWFyY3VzLy5hdG9tL3BhY2thZ2VzL2Jyb3dzZXItcGx1cy9saWIvYnJvd3Nlci1wbHVzLW1vZGVsLmNvZmZlZSJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFDQTtBQUFBLE1BQUEsa0VBQUE7SUFBQTs7OztFQUFBLE1BQXVCLE9BQUEsQ0FBUSxNQUFSLENBQXZCLEVBQUMsMkJBQUQsRUFBWTs7RUFDWCxRQUFTLE9BQUEsQ0FBUSxVQUFSOztFQUNULGNBQWUsT0FBQSxDQUFRLGdCQUFSOztFQUNoQixJQUFBLEdBQU8sT0FBQSxDQUFRLE1BQVI7O0VBQ1AsRUFBQSxHQUFLLE9BQUEsQ0FBUSxJQUFSOztFQUNMLE1BQU0sQ0FBQyxPQUFQLEdBQ1E7OztJQUNKLElBQUksQ0FBQyxhQUFhLENBQUMsR0FBbkIsQ0FBdUIsVUFBdkI7O0lBQ2Esb0JBQUMsR0FBRDtBQUNYLFVBQUE7TUFEYyxJQUFDLENBQUEsa0JBQUEsYUFBYSxJQUFDLENBQUEsVUFBQSxLQUFJLElBQUMsQ0FBQSxVQUFBO01BQ2xDLElBQTJDLE9BQU8sSUFBQyxDQUFBLFdBQVIsS0FBdUIsUUFBbEU7UUFBQSxJQUFDLENBQUEsV0FBRCxHQUFlLElBQUksQ0FBQyxLQUFMLENBQVcsSUFBQyxDQUFBLFdBQVosRUFBZjs7TUFDQSxJQUFBLENBQWlCLElBQUMsQ0FBQSxHQUFsQjtRQUFBLElBQUMsQ0FBQSxHQUFELEdBQU8sR0FBUDs7TUFDQSxJQUFDLENBQUEsVUFBRCxHQUFrQixJQUFBLFVBQUEsQ0FBQTtNQUNsQixJQUFDLENBQUEsT0FBRCxHQUFXLElBQUk7TUFDZixJQUFDLENBQUEsR0FBRCxHQUFPLElBQUMsQ0FBQSxHQUFHLENBQUM7TUFDWixJQUFDLENBQUEsTUFBRCxHQUFVLElBQUMsQ0FBQSxHQUFHLENBQUM7TUFDZixJQUFDLENBQUEsR0FBRCxHQUFPLElBQUMsQ0FBQSxHQUFHLENBQUM7TUFDWixJQUFHLElBQUMsQ0FBQSxXQUFELElBQWlCLENBQUksSUFBQyxDQUFBLFdBQVcsQ0FBQyxjQUFyQztRQUNFLElBQUMsQ0FBQSxXQUFXLENBQUMsY0FBYixHQUE4QjtBQUM5QjtBQUFBLGFBQUEsc0NBQUE7O1VBQ0UsSUFBRyxJQUFJLENBQUMsUUFBTCxLQUFpQixXQUFwQjtBQUNFO0FBQUEsaUJBQUEsd0NBQUE7O2NBQ0UsSUFBSSxDQUFDLGFBQUwsR0FBcUIsU0FBQyxHQUFEO0FBQ25CLG9CQUFBO2dCQUFBLDBFQUF1QyxDQUFFLElBQXpCLEdBQWdDLDJCQUFoRDtBQUFBLHlCQUFPLE1BQVA7O0FBQ0EsdUJBQU87Y0FGWTtBQUR2QixhQURGOztBQURGLFNBRkY7O0lBUlc7O3lCQWlCYixZQUFBLEdBQWMsU0FBQTthQUNaLE9BQUEsQ0FBUSxxQkFBUjtJQURZOzt5QkFHZCxPQUFBLEdBQVMsU0FBQyxHQUFEO01BQUMsSUFBQyxDQUFBLE1BQUQ7TUFDUixJQUFzQixJQUFDLENBQUEsR0FBdkI7ZUFBQSxJQUFDLENBQUEsSUFBSSxDQUFDLE1BQU4sQ0FBYSxJQUFDLENBQUEsR0FBZCxFQUFBOztJQURPOzt5QkFHVCxPQUFBLEdBQVMsU0FBQyxHQUFEO2FBQ0wsSUFBQyxDQUFBLElBQUksQ0FBQyxXQUFOLENBQWtCLEdBQWxCO0lBREs7O3lCQUdULFNBQUEsR0FBVyxTQUFBO2FBRVQsSUFBQyxDQUFBLE9BQU8sQ0FBQyxJQUFULENBQWMsYUFBZDtJQUZTOzt5QkFJWCxZQUFBLEdBQWMsU0FBQyxFQUFEO2FBQ1osSUFBQyxDQUFBLE9BQU8sQ0FBQyxFQUFULENBQVksYUFBWixFQUEyQixFQUEzQjtJQURZOzt5QkFHZCxRQUFBLEdBQVUsU0FBQTtBQUNSLFVBQUE7TUFBQSx1Q0FBUyxDQUFFLGdCQUFSLEdBQWlCLEVBQXBCO1FBQ0UsSUFBQyxDQUFBLEtBQUQsR0FBUyxJQUFDLENBQUEsS0FBTSxhQUFQLEdBQWUsTUFEMUI7O2FBRUEsSUFBQyxDQUFBLEtBQUQsSUFBVSxJQUFJLENBQUMsUUFBTCxDQUFjLElBQUMsQ0FBQSxHQUFmO0lBSEY7O3lCQUtWLFdBQUEsR0FBYSxTQUFBO2FBQ1gsSUFBQyxDQUFBO0lBRFU7O3lCQUdiLE1BQUEsR0FBUSxTQUFBO01BQ04sSUFBZ0IsSUFBQyxDQUFBLEdBQUQsS0FBUSxzQkFBeEI7QUFBQSxlQUFPLE1BQVA7O2FBQ0EsSUFBQyxDQUFBO0lBRks7O3lCQUlSLFVBQUEsR0FBWSxTQUFBLEdBQUE7O3lCQUVaLFFBQUEsR0FBVSxTQUFDLEtBQUQ7TUFBQyxJQUFDLENBQUEsUUFBRDthQUNULElBQUMsQ0FBQSxJQUFELENBQU0sZUFBTjtJQURROzt5QkFHVixVQUFBLEdBQVksU0FBQyxPQUFEO01BQUMsSUFBQyxDQUFBLFVBQUQ7YUFDWCxJQUFDLENBQUEsSUFBRCxDQUFNLGNBQU47SUFEVTs7eUJBR1osU0FBQSxHQUFXLFNBQUE7YUFDVDtRQUFBLElBQUEsRUFFRTtVQUFBLFdBQUEsRUFBYSxJQUFJLENBQUMsU0FBTCxDQUFlLElBQUMsQ0FBQSxXQUFoQixDQUFiO1VBQ0EsR0FBQSxFQUFLLElBQUMsQ0FBQSxHQUROO1VBRUEsR0FBQSxFQUNFO1lBQUEsR0FBQSxFQUFNLElBQUMsQ0FBQSxHQUFQO1lBQ0EsUUFBQSxFQUFVLElBQUMsQ0FBQSxRQURYO1lBRUEsS0FBQSxFQUFPLElBQUMsQ0FBQSxLQUZSO1dBSEY7U0FGRjtRQVNBLFlBQUEsRUFBZSxZQVRmOztJQURTOztJQVlYLFVBQUMsQ0FBQSxXQUFELEdBQWMsU0FBQyxHQUFEO0FBQ1osVUFBQTtNQURjLE9BQUQ7YUFDVCxJQUFBLFVBQUEsQ0FBVyxJQUFYO0lBRFE7O0lBR2QsVUFBQyxDQUFBLFFBQUQsR0FBVyxTQUFDLEdBQUQ7TUFDVCxJQUFHLDRCQUFBLElBQW9CLElBQUMsQ0FBQSxhQUFELENBQWUsR0FBZixDQUF2QjtRQUNFLElBQUksQ0FBQyxhQUFhLENBQUMsVUFBbkIsQ0FBaUMsR0FBRCxHQUFLLHlEQUFyQztBQUNBLGVBQU8sTUFGVDs7QUFHQSxhQUFPO0lBSkU7O0lBTVgsVUFBQyxDQUFBLGVBQUQsR0FBa0IsU0FBQyxHQUFELEVBQUssVUFBTDtBQUNoQixVQUFBO01BQUEsSUFBVSxHQUFHLENBQUMsVUFBSixDQUFlLFVBQWYsQ0FBVjtBQUFBLGVBQUE7O01BQ0EsQ0FBQSxHQUFJLFFBQVEsQ0FBQyxhQUFULENBQXVCLEdBQXZCO01BQ0osQ0FBQyxDQUFDLElBQUYsR0FBUztNQUNULElBQUcsQ0FBSSxVQUFKLElBQW1CLENBQUMsSUFBQSxHQUFPLElBQUksQ0FBQyxNQUFNLENBQUMsR0FBWixDQUFnQiwrQkFBaEIsQ0FBUixDQUF5RCxDQUFDLE1BQWhGO1FBQ0UsVUFBQSxHQUFhLFFBQUEsQ0FBQyxDQUFDLFFBQUYsRUFBQSxhQUFjLElBQWQsRUFBQSxJQUFBLE1BQUEsRUFEZjs7TUFHQSxJQUFBLENBQWMsVUFBZDtBQUFBLGVBQUE7O01BQ0EsS0FBQSxHQUFRLElBQUksQ0FBQyxTQUFTLENBQUMsWUFBZixDQUFBO01BQ1IsRUFBQSxHQUFLLFFBQVEsQ0FBQyxhQUFULENBQXVCLEdBQXZCO0FBQ0wsV0FBQSx1Q0FBQTs7UUFDRSxHQUFBLEdBQU0sTUFBTSxDQUFDLE1BQVAsQ0FBQTtRQUNOLEVBQUUsQ0FBQyxJQUFILEdBQVU7UUFDVixJQUFpQixFQUFFLENBQUMsUUFBSCxLQUFlLENBQUMsQ0FBQyxRQUFsQztBQUFBLGlCQUFPLE9BQVA7O0FBSEY7QUFJQSxhQUFPO0lBZFM7Ozs7S0E1RUs7QUFOM0IiLCJzb3VyY2VzQ29udGVudCI6WyIjIGh0dHA6Ly93d3cuc2thbmRhc29mdC5jb20vXG57RGlzcG9zYWJsZSxFbWl0dGVyfSA9IHJlcXVpcmUgJ2F0b20nXG57TW9kZWx9ID0gcmVxdWlyZSAndGhlb3Jpc3QnXG57QnJvd3NlclBsdXN9ID0gcmVxdWlyZSAnLi9icm93c2VyLXBsdXMnXG5wYXRoID0gcmVxdWlyZSAncGF0aCdcbmZzID0gcmVxdWlyZSAnZnMnXG5tb2R1bGUuZXhwb3J0cyA9XG4gIGNsYXNzIEhUTUxFZGl0b3IgZXh0ZW5kcyBNb2RlbFxuICAgIGF0b20uZGVzZXJpYWxpemVycy5hZGQodGhpcylcbiAgICBjb25zdHJ1Y3RvcjogKHsgQGJyb3dzZXJQbHVzICxAdXJsLEBvcHQgfSkgLT5cbiAgICAgIEBicm93c2VyUGx1cyA9IEpTT04ucGFyc2UoQGJyb3dzZXJQbHVzKSBpZiB0eXBlb2YgQGJyb3dzZXJQbHVzIGlzICdzdHJpbmcnXG4gICAgICBAb3B0ID0ge30gdW5sZXNzIEBvcHRcbiAgICAgIEBkaXNwb3NhYmxlID0gbmV3IERpc3Bvc2FibGUoKVxuICAgICAgQGVtaXR0ZXIgPSBuZXcgRW1pdHRlclxuICAgICAgQHNyYyA9IEBvcHQuc3JjXG4gICAgICBAb3JnVVJJID0gQG9wdC5vcmdVUklcbiAgICAgIEBfaWQgPSBAb3B0Ll9pZFxuICAgICAgaWYgQGJyb3dzZXJQbHVzIGFuZCBub3QgQGJyb3dzZXJQbHVzLnNldENvbnRleHRNZW51XG4gICAgICAgIEBicm93c2VyUGx1cy5zZXRDb250ZXh0TWVudSA9IHRydWVcbiAgICAgICAgZm9yIG1lbnUgaW4gYXRvbS5jb250ZXh0TWVudS5pdGVtU2V0c1xuICAgICAgICAgIGlmIG1lbnUuc2VsZWN0b3IgaXMgJ2F0b20tcGFuZSdcbiAgICAgICAgICAgIGZvciBpdGVtIGluIG1lbnUuaXRlbXNcbiAgICAgICAgICAgICAgaXRlbS5zaG91bGREaXNwbGF5ID0gKGV2dCktPlxuICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZSBpZiBldnQudGFyZ2V0Py5jb25zdHJ1Y3Rvcj8ubmFtZSA9ICd3ZWJ2aWV3J1xuICAgICAgICAgICAgICAgIHJldHVybiB0cnVlXG5cbiAgICBnZXRWaWV3Q2xhc3M6IC0+XG4gICAgICByZXF1aXJlICcuL2Jyb3dzZXItcGx1cy12aWV3J1xuXG4gICAgc2V0VGV4dDogKEBzcmMpLT5cbiAgICAgIEB2aWV3LnNldFNyYyhAc3JjKSBpZiBAc3JjXG5cbiAgICByZWZyZXNoOiAodXJsKS0+XG4gICAgICAgIEB2aWV3LnJlZnJlc2hQYWdlKHVybClcblxuICAgIGRlc3Ryb3llZDogLT5cbiAgICAgICMgQHVuc3Vic2NyaWJlKClcbiAgICAgIEBlbWl0dGVyLmVtaXQgJ2RpZC1kZXN0cm95J1xuXG4gICAgb25EaWREZXN0cm95OiAoY2IpLT5cbiAgICAgIEBlbWl0dGVyLm9uICdkaWQtZGVzdHJveScsIGNiXG5cbiAgICBnZXRUaXRsZTogLT5cbiAgICAgIGlmIEB0aXRsZT8ubGVuZ3RoID4gMjBcbiAgICAgICAgQHRpdGxlID0gQHRpdGxlWzAuLi4yMF0rJy4uLidcbiAgICAgIEB0aXRsZSBvciBwYXRoLmJhc2VuYW1lKEB1cmwpXG5cbiAgICBnZXRJY29uTmFtZTogLT5cbiAgICAgIEBpY29uTmFtZVxuXG4gICAgZ2V0VVJJOiAtPlxuICAgICAgcmV0dXJuIGZhbHNlIGlmIEB1cmwgaXMgJ2Jyb3dzZXItcGx1czovL2JsYW5rJ1xuICAgICAgQHVybFxuXG4gICAgZ2V0R3JhbW1hcjogLT5cblxuICAgIHNldFRpdGxlOiAoQHRpdGxlKS0+XG4gICAgICBAZW1pdCAndGl0bGUtY2hhbmdlZCdcblxuICAgIHVwZGF0ZUljb246IChAZmF2SWNvbiktPlxuICAgICAgQGVtaXQgJ2ljb24tY2hhbmdlZCdcblxuICAgIHNlcmlhbGl6ZTogLT5cbiAgICAgIGRhdGE6XG4gICAgICAgICMgYnJvd3NlclBsdXM6IEpTT04uc3RyaW5naWZ5KEBicm93c2VyUGx1cylcbiAgICAgICAgYnJvd3NlclBsdXM6IEpTT04uc3RyaW5naWZ5KEBicm93c2VyUGx1cylcbiAgICAgICAgdXJsOiBAdXJsXG4gICAgICAgIG9wdDpcbiAgICAgICAgICBzcmM6ICBAc3JjXG4gICAgICAgICAgaWNvbk5hbWU6IEBpY29uTmFtZVxuICAgICAgICAgIHRpdGxlOiBAdGl0bGVcblxuICAgICAgZGVzZXJpYWxpemVyOiAgJ0hUTUxFZGl0b3InXG5cbiAgICBAZGVzZXJpYWxpemU6ICh7ZGF0YX0pIC0+XG4gICAgICBuZXcgSFRNTEVkaXRvcihkYXRhKVxuXG4gICAgQGNoZWNrVXJsOiAodXJsKS0+XG4gICAgICBpZiBAY2hlY2tCbG9ja1VybD8gYW5kIEBjaGVja0Jsb2NrVXJsKHVybClcbiAgICAgICAgYXRvbS5ub3RpZmljYXRpb25zLmFkZFN1Y2Nlc3MoXCIje3VybH0gQmxvY2tlZH5+TWFpbnRhaW4gQmxvY2tlZCBVUkwgaW4gQnJvd3Nlci1QbHVzIFNldHRpbmdzXCIpXG4gICAgICAgIHJldHVybiBmYWxzZVxuICAgICAgcmV0dXJuIHRydWVcblxuICAgIEBnZXRFZGl0b3JGb3JVUkk6ICh1cmwsc2FtZVdpbmRvdyktPlxuICAgICAgcmV0dXJuIGlmIHVybC5zdGFydHNXaXRoKCdmaWxlOi8vLycpXG4gICAgICBhID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImFcIilcbiAgICAgIGEuaHJlZiA9IHVybFxuICAgICAgaWYgbm90IHNhbWVXaW5kb3cgYW5kICh1cmxzID0gYXRvbS5jb25maWcuZ2V0KCdicm93c2VyLXBsdXMub3BlbkluU2FtZVdpbmRvdycpKS5sZW5ndGhcbiAgICAgICAgc2FtZVdpbmRvdyA9IGEuaG9zdG5hbWUgaW4gdXJsc1xuXG4gICAgICByZXR1cm4gdW5sZXNzIHNhbWVXaW5kb3dcbiAgICAgIHBhbmVzID0gYXRvbS53b3Jrc3BhY2UuZ2V0UGFuZUl0ZW1zKClcbiAgICAgIGExID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImFcIilcbiAgICAgIGZvciBlZGl0b3IgaW4gcGFuZXNcbiAgICAgICAgdXJpID0gZWRpdG9yLmdldFVSSSgpXG4gICAgICAgIGExLmhyZWYgPSB1cmlcbiAgICAgICAgcmV0dXJuIGVkaXRvciBpZiBhMS5ob3N0bmFtZSBpcyBhLmhvc3RuYW1lXG4gICAgICByZXR1cm4gZmFsc2VcbiJdfQ==
