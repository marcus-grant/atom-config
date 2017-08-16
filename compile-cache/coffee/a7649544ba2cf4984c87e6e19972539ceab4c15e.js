(function() {
  var root, setFontSize, setHideDockButtons, setTabSizing, unsetFontSize, unsetHideDockButtons, unsetTabSizing;

  root = document.documentElement;

  module.exports = {
    activate: function(state) {
      atom.config.observe('pristine-ui.fontSize', function(value) {
        return setFontSize(value);
      });
      atom.config.observe('pristine-ui.tabSizing', function(value) {
        return setTabSizing(value);
      });
      atom.config.observe('pristine-ui.hideDockButtons', function(value) {
        return setHideDockButtons(value);
      });
      if (atom.config.get('pristine-ui.layoutMode')) {
        return atom.config.unset('pristine-ui.layoutMode');
      }
    },
    deactivate: function() {
      unsetFontSize();
      unsetTabSizing();
      return unsetHideDockButtons();
    }
  };

  setFontSize = function(currentFontSize) {
    if (Number.isInteger(currentFontSize)) {
      return root.style.fontSize = currentFontSize + "px";
    } else if (currentFontSize === 'Auto') {
      return unsetFontSize();
    }
  };

  unsetFontSize = function() {
    return root.style.fontSize = '';
  };

  setTabSizing = function(tabSizing) {
    return root.setAttribute('theme-pristine-ui-tabsizing', tabSizing.toLowerCase());
  };

  unsetTabSizing = function() {
    return root.removeAttribute('theme-pristine-ui-tabsizing');
  };

  setHideDockButtons = function(hideDockButtons) {
    if (hideDockButtons) {
      return root.setAttribute('theme-pristine-ui-dock-buttons', 'hidden');
    } else {
      return unsetHideDockButtons();
    }
  };

  unsetHideDockButtons = function() {
    return root.removeAttribute('theme-pristine-ui-dock-buttons');
  };

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL2hvbWUvbWFyY3VzLy5hdG9tL3BhY2thZ2VzL3ByaXN0aW5lLXVpL2xpYi9tYWluLmNvZmZlZSJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQUFBLE1BQUE7O0VBQUEsSUFBQSxHQUFPLFFBQVEsQ0FBQzs7RUFFaEIsTUFBTSxDQUFDLE9BQVAsR0FDRTtJQUFBLFFBQUEsRUFBVSxTQUFDLEtBQUQ7TUFDUixJQUFJLENBQUMsTUFBTSxDQUFDLE9BQVosQ0FBb0Isc0JBQXBCLEVBQTRDLFNBQUMsS0FBRDtlQUMxQyxXQUFBLENBQVksS0FBWjtNQUQwQyxDQUE1QztNQUdBLElBQUksQ0FBQyxNQUFNLENBQUMsT0FBWixDQUFvQix1QkFBcEIsRUFBNkMsU0FBQyxLQUFEO2VBQzNDLFlBQUEsQ0FBYSxLQUFiO01BRDJDLENBQTdDO01BR0EsSUFBSSxDQUFDLE1BQU0sQ0FBQyxPQUFaLENBQW9CLDZCQUFwQixFQUFtRCxTQUFDLEtBQUQ7ZUFDakQsa0JBQUEsQ0FBbUIsS0FBbkI7TUFEaUQsQ0FBbkQ7TUFLQSxJQUFHLElBQUksQ0FBQyxNQUFNLENBQUMsR0FBWixDQUFnQix3QkFBaEIsQ0FBSDtlQUNFLElBQUksQ0FBQyxNQUFNLENBQUMsS0FBWixDQUFrQix3QkFBbEIsRUFERjs7SUFaUSxDQUFWO0lBZUEsVUFBQSxFQUFZLFNBQUE7TUFDVixhQUFBLENBQUE7TUFDQSxjQUFBLENBQUE7YUFDQSxvQkFBQSxDQUFBO0lBSFUsQ0FmWjs7O0VBdUJGLFdBQUEsR0FBYyxTQUFDLGVBQUQ7SUFDWixJQUFHLE1BQU0sQ0FBQyxTQUFQLENBQWlCLGVBQWpCLENBQUg7YUFDRSxJQUFJLENBQUMsS0FBSyxDQUFDLFFBQVgsR0FBeUIsZUFBRCxHQUFpQixLQUQzQztLQUFBLE1BRUssSUFBRyxlQUFBLEtBQW1CLE1BQXRCO2FBQ0gsYUFBQSxDQUFBLEVBREc7O0VBSE87O0VBTWQsYUFBQSxHQUFnQixTQUFBO1dBQ2QsSUFBSSxDQUFDLEtBQUssQ0FBQyxRQUFYLEdBQXNCO0VBRFI7O0VBTWhCLFlBQUEsR0FBZSxTQUFDLFNBQUQ7V0FDYixJQUFJLENBQUMsWUFBTCxDQUFrQiw2QkFBbEIsRUFBaUQsU0FBUyxDQUFDLFdBQVYsQ0FBQSxDQUFqRDtFQURhOztFQUdmLGNBQUEsR0FBaUIsU0FBQTtXQUNmLElBQUksQ0FBQyxlQUFMLENBQXFCLDZCQUFyQjtFQURlOztFQU1qQixrQkFBQSxHQUFxQixTQUFDLGVBQUQ7SUFDbkIsSUFBRyxlQUFIO2FBQ0UsSUFBSSxDQUFDLFlBQUwsQ0FBa0IsZ0NBQWxCLEVBQW9ELFFBQXBELEVBREY7S0FBQSxNQUFBO2FBR0Usb0JBQUEsQ0FBQSxFQUhGOztFQURtQjs7RUFNckIsb0JBQUEsR0FBdUIsU0FBQTtXQUNyQixJQUFJLENBQUMsZUFBTCxDQUFxQixnQ0FBckI7RUFEcUI7QUFyRHZCIiwic291cmNlc0NvbnRlbnQiOlsicm9vdCA9IGRvY3VtZW50LmRvY3VtZW50RWxlbWVudFxuXG5tb2R1bGUuZXhwb3J0cyA9XG4gIGFjdGl2YXRlOiAoc3RhdGUpIC0+XG4gICAgYXRvbS5jb25maWcub2JzZXJ2ZSAncHJpc3RpbmUtdWkuZm9udFNpemUnLCAodmFsdWUpIC0+XG4gICAgICBzZXRGb250U2l6ZSh2YWx1ZSlcblxuICAgIGF0b20uY29uZmlnLm9ic2VydmUgJ3ByaXN0aW5lLXVpLnRhYlNpemluZycsICh2YWx1ZSkgLT5cbiAgICAgIHNldFRhYlNpemluZyh2YWx1ZSlcblxuICAgIGF0b20uY29uZmlnLm9ic2VydmUgJ3ByaXN0aW5lLXVpLmhpZGVEb2NrQnV0dG9ucycsICh2YWx1ZSkgLT5cbiAgICAgIHNldEhpZGVEb2NrQnV0dG9ucyh2YWx1ZSlcblxuICAgICMgREVQUkVDQVRFRDogVGhpcyBjYW4gYmUgcmVtb3ZlZCBhdCBzb21lIHBvaW50IChhZGRlZCBpbiBBdG9tIDEuMTcvMS4xOGlzaClcbiAgICAjIEl0IHJlbW92ZXMgYGxheW91dE1vZGVgXG4gICAgaWYgYXRvbS5jb25maWcuZ2V0KCdwcmlzdGluZS11aS5sYXlvdXRNb2RlJylcbiAgICAgIGF0b20uY29uZmlnLnVuc2V0KCdwcmlzdGluZS11aS5sYXlvdXRNb2RlJylcblxuICBkZWFjdGl2YXRlOiAtPlxuICAgIHVuc2V0Rm9udFNpemUoKVxuICAgIHVuc2V0VGFiU2l6aW5nKClcbiAgICB1bnNldEhpZGVEb2NrQnV0dG9ucygpXG5cblxuIyBGb250IFNpemUgLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cblxuc2V0Rm9udFNpemUgPSAoY3VycmVudEZvbnRTaXplKSAtPlxuICBpZiBOdW1iZXIuaXNJbnRlZ2VyKGN1cnJlbnRGb250U2l6ZSlcbiAgICByb290LnN0eWxlLmZvbnRTaXplID0gXCIje2N1cnJlbnRGb250U2l6ZX1weFwiXG4gIGVsc2UgaWYgY3VycmVudEZvbnRTaXplIGlzICdBdXRvJ1xuICAgIHVuc2V0Rm9udFNpemUoKVxuXG51bnNldEZvbnRTaXplID0gLT5cbiAgcm9vdC5zdHlsZS5mb250U2l6ZSA9ICcnXG5cblxuIyBUYWIgU2l6aW5nIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5cbnNldFRhYlNpemluZyA9ICh0YWJTaXppbmcpIC0+XG4gIHJvb3Quc2V0QXR0cmlidXRlKCd0aGVtZS1wcmlzdGluZS11aS10YWJzaXppbmcnLCB0YWJTaXppbmcudG9Mb3dlckNhc2UoKSlcblxudW5zZXRUYWJTaXppbmcgPSAtPlxuICByb290LnJlbW92ZUF0dHJpYnV0ZSgndGhlbWUtcHJpc3RpbmUtdWktdGFic2l6aW5nJylcblxuXG4jIERvY2sgQnV0dG9ucyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuXG5zZXRIaWRlRG9ja0J1dHRvbnMgPSAoaGlkZURvY2tCdXR0b25zKSAtPlxuICBpZiBoaWRlRG9ja0J1dHRvbnNcbiAgICByb290LnNldEF0dHJpYnV0ZSgndGhlbWUtcHJpc3RpbmUtdWktZG9jay1idXR0b25zJywgJ2hpZGRlbicpXG4gIGVsc2VcbiAgICB1bnNldEhpZGVEb2NrQnV0dG9ucygpXG5cbnVuc2V0SGlkZURvY2tCdXR0b25zID0gLT5cbiAgcm9vdC5yZW1vdmVBdHRyaWJ1dGUoJ3RoZW1lLXByaXN0aW5lLXVpLWRvY2stYnV0dG9ucycpXG4iXX0=
