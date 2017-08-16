(function() {
  var $, FavView, SelectListView, View, ref,
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

  ref = require('atom-space-pen-views'), View = ref.View, SelectListView = ref.SelectListView;

  $ = require('jquery');

  FavView = (function(superClass) {
    extend(FavView, superClass);

    function FavView() {
      return FavView.__super__.constructor.apply(this, arguments);
    }

    FavView.prototype.initialize = function(items) {
      this.items = items;
      FavView.__super__.initialize.apply(this, arguments);
      this.addClass('overlay from-top');
      this.setItems(this.items);
      if (this.panel == null) {
        this.panel = atom.workspace.addModalPanel({
          item: this
        });
      }
      this.panel.show();
      return this.focusFilterEditor();
    };

    FavView.prototype.viewForItem = function(item) {
      var ref1, ref2;
      if (!item.favIcon) {
        item.favIcon = (ref1 = window.bp.js.get('bp.favIcon')) != null ? ref1[item.url] : void 0;
      }
      return "<li><img src='" + item.favIcon + "'width='20' height='20' >&nbsp; &nbsp; " + ((ref2 = item.title) != null ? ref2.slice(0, 31) : void 0) + "</li>";
    };

    FavView.prototype.confirmed = function(item) {
      atom.workspace.open(item.url, {
        split: 'left',
        searchAllPanes: true
      });
      return this.parent().remove();
    };

    FavView.prototype.cancelled = function() {
      return this.parent().remove();
    };

    FavView.prototype.getFilterKey = function() {
      return "title";
    };

    return FavView;

  })(SelectListView);

  module.exports = FavView;

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL2hvbWUvbWFyY3VzLy5hdG9tL3BhY2thZ2VzL2Jyb3dzZXItcGx1cy9saWIvZmF2LXZpZXcuY29mZmVlIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FBQUEsTUFBQSxxQ0FBQTtJQUFBOzs7RUFBQSxNQUF3QixPQUFBLENBQVEsc0JBQVIsQ0FBeEIsRUFBQyxlQUFELEVBQU07O0VBRU4sQ0FBQSxHQUFJLE9BQUEsQ0FBUSxRQUFSOztFQUNFOzs7Ozs7O3NCQUNKLFVBQUEsR0FBWSxTQUFDLEtBQUQ7TUFBQyxJQUFDLENBQUEsUUFBRDtNQUNYLHlDQUFBLFNBQUE7TUFDQSxJQUFDLENBQUEsUUFBRCxDQUFVLGtCQUFWO01BQ0EsSUFBQyxDQUFBLFFBQUQsQ0FBVSxJQUFDLENBQUEsS0FBWDs7UUFDQSxJQUFDLENBQUEsUUFBUyxJQUFJLENBQUMsU0FBUyxDQUFDLGFBQWYsQ0FBNkI7VUFBQSxJQUFBLEVBQUssSUFBTDtTQUE3Qjs7TUFDVixJQUFDLENBQUEsS0FBSyxDQUFDLElBQVAsQ0FBQTthQUNBLElBQUMsQ0FBQSxpQkFBRCxDQUFBO0lBTlU7O3NCQVFaLFdBQUEsR0FBYSxTQUFDLElBQUQ7QUFDVCxVQUFBO01BQUEsSUFBQSxDQUFPLElBQUksQ0FBQyxPQUFaO1FBQ0UsSUFBSSxDQUFDLE9BQUwseURBQStDLENBQUEsSUFBSSxDQUFDLEdBQUwsV0FEakQ7O2FBRUEsZ0JBQUEsR0FBaUIsSUFBSSxDQUFDLE9BQXRCLEdBQThCLHlDQUE5QixHQUFzRSxtQ0FBYSxzQkFBYixDQUF0RSxHQUEwRjtJQUhqRjs7c0JBS2IsU0FBQSxHQUFXLFNBQUMsSUFBRDtNQUNQLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBZixDQUFvQixJQUFJLENBQUMsR0FBekIsRUFBOEI7UUFBQyxLQUFBLEVBQU0sTUFBUDtRQUFjLGNBQUEsRUFBZSxJQUE3QjtPQUE5QjthQUNBLElBQUMsQ0FBQSxNQUFELENBQUEsQ0FBUyxDQUFDLE1BQVYsQ0FBQTtJQUZPOztzQkFJWCxTQUFBLEdBQVcsU0FBQTthQUNULElBQUMsQ0FBQSxNQUFELENBQUEsQ0FBUyxDQUFDLE1BQVYsQ0FBQTtJQURTOztzQkFHWCxZQUFBLEdBQWMsU0FBQTthQUNaO0lBRFk7Ozs7S0FyQk07O0VBdUJ0QixNQUFNLENBQUMsT0FBUCxHQUFpQjtBQTFCakIiLCJzb3VyY2VzQ29udGVudCI6WyJ7VmlldyxTZWxlY3RMaXN0Vmlld30gPSByZXF1aXJlICdhdG9tLXNwYWNlLXBlbi12aWV3cydcblxuJCA9IHJlcXVpcmUgJ2pxdWVyeSdcbmNsYXNzIEZhdlZpZXcgZXh0ZW5kcyBTZWxlY3RMaXN0Vmlld1xuICBpbml0aWFsaXplOiAoQGl0ZW1zKS0+XG4gICAgc3VwZXJcbiAgICBAYWRkQ2xhc3MgJ292ZXJsYXkgZnJvbS10b3AnXG4gICAgQHNldEl0ZW1zIEBpdGVtc1xuICAgIEBwYW5lbCA/PSBhdG9tLndvcmtzcGFjZS5hZGRNb2RhbFBhbmVsIGl0ZW06QFxuICAgIEBwYW5lbC5zaG93KClcbiAgICBAZm9jdXNGaWx0ZXJFZGl0b3IoKVxuXG4gIHZpZXdGb3JJdGVtOiAoaXRlbSktPlxuICAgICAgdW5sZXNzIGl0ZW0uZmF2SWNvblxuICAgICAgICBpdGVtLmZhdkljb24gPSB3aW5kb3cuYnAuanMuZ2V0KCdicC5mYXZJY29uJyk/W2l0ZW0udXJsXVxuICAgICAgXCI8bGk+PGltZyBzcmM9JyN7aXRlbS5mYXZJY29ufSd3aWR0aD0nMjAnIGhlaWdodD0nMjAnID4mbmJzcDsgJm5ic3A7ICN7aXRlbS50aXRsZT9bMC4uMzBdfTwvbGk+XCJcblxuICBjb25maXJtZWQ6IChpdGVtKS0+XG4gICAgICBhdG9tLndvcmtzcGFjZS5vcGVuIGl0ZW0udXJsLCB7c3BsaXQ6J2xlZnQnLHNlYXJjaEFsbFBhbmVzOnRydWV9XG4gICAgICBAcGFyZW50KCkucmVtb3ZlKClcblxuICBjYW5jZWxsZWQ6IC0+XG4gICAgQHBhcmVudCgpLnJlbW92ZSgpXG5cbiAgZ2V0RmlsdGVyS2V5OiAtPlxuICAgIFwidGl0bGVcIlxubW9kdWxlLmV4cG9ydHMgPSBGYXZWaWV3XG4iXX0=
