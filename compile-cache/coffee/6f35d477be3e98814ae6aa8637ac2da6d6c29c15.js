(function() {
  var root, setFontSize, setHideDockButtons, setTabSizing, unsetFontSize, unsetHideDockButtons, unsetTabSizing;

  root = document.documentElement;

  module.exports = {
    activate: function(state) {
      atom.config.observe('apex-adapt-dark-ui.fontSize', function(value) {
        return setFontSize(value);
      });
      atom.config.observe('apex-adapt-dark-ui.tabSizing', function(value) {
        return setTabSizing(value);
      });
      atom.config.observe('apex-adapt-dark-ui.hideDockButtons', function(value) {
        return setHideDockButtons(value);
      });
      if (atom.config.get('apex-adapt-dark-ui.layoutMode')) {
        return atom.config.unset('apex-adapt-dark-ui.layoutMode');
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
    return root.setAttribute('theme-apex-adapt-dark-ui-tabsizing', tabSizing.toLowerCase());
  };

  unsetTabSizing = function() {
    return root.removeAttribute('theme-apex-adapt-dark-ui-tabsizing');
  };

  setHideDockButtons = function(hideDockButtons) {
    if (hideDockButtons) {
      return root.setAttribute('theme-apex-adapt-dark-ui-dock-buttons', 'hidden');
    } else {
      return unsetHideDockButtons();
    }
  };

  unsetHideDockButtons = function() {
    return root.removeAttribute('theme-apex-adapt-dark-ui-dock-buttons');
  };

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL2hvbWUvbWFyY3VzLy5hdG9tL3BhY2thZ2VzL2FwZXgtYWRhcHQtZGFyay11aS9saWIvbWFpbi5jb2ZmZWUiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUFBQSxNQUFBOztFQUFBLElBQUEsR0FBTyxRQUFRLENBQUM7O0VBRWhCLE1BQU0sQ0FBQyxPQUFQLEdBQ0U7SUFBQSxRQUFBLEVBQVUsU0FBQyxLQUFEO01BQ1IsSUFBSSxDQUFDLE1BQU0sQ0FBQyxPQUFaLENBQW9CLDZCQUFwQixFQUFtRCxTQUFDLEtBQUQ7ZUFDakQsV0FBQSxDQUFZLEtBQVo7TUFEaUQsQ0FBbkQ7TUFHQSxJQUFJLENBQUMsTUFBTSxDQUFDLE9BQVosQ0FBb0IsOEJBQXBCLEVBQW9ELFNBQUMsS0FBRDtlQUNsRCxZQUFBLENBQWEsS0FBYjtNQURrRCxDQUFwRDtNQUdBLElBQUksQ0FBQyxNQUFNLENBQUMsT0FBWixDQUFvQixvQ0FBcEIsRUFBMEQsU0FBQyxLQUFEO2VBQ3hELGtCQUFBLENBQW1CLEtBQW5CO01BRHdELENBQTFEO01BS0EsSUFBRyxJQUFJLENBQUMsTUFBTSxDQUFDLEdBQVosQ0FBZ0IsK0JBQWhCLENBQUg7ZUFDRSxJQUFJLENBQUMsTUFBTSxDQUFDLEtBQVosQ0FBa0IsK0JBQWxCLEVBREY7O0lBWlEsQ0FBVjtJQWVBLFVBQUEsRUFBWSxTQUFBO01BQ1YsYUFBQSxDQUFBO01BQ0EsY0FBQSxDQUFBO2FBQ0Esb0JBQUEsQ0FBQTtJQUhVLENBZlo7OztFQXVCRixXQUFBLEdBQWMsU0FBQyxlQUFEO0lBQ1osSUFBRyxNQUFNLENBQUMsU0FBUCxDQUFpQixlQUFqQixDQUFIO2FBQ0UsSUFBSSxDQUFDLEtBQUssQ0FBQyxRQUFYLEdBQXlCLGVBQUQsR0FBaUIsS0FEM0M7S0FBQSxNQUVLLElBQUcsZUFBQSxLQUFtQixNQUF0QjthQUNILGFBQUEsQ0FBQSxFQURHOztFQUhPOztFQU1kLGFBQUEsR0FBZ0IsU0FBQTtXQUNkLElBQUksQ0FBQyxLQUFLLENBQUMsUUFBWCxHQUFzQjtFQURSOztFQU1oQixZQUFBLEdBQWUsU0FBQyxTQUFEO1dBQ2IsSUFBSSxDQUFDLFlBQUwsQ0FBa0Isb0NBQWxCLEVBQXdELFNBQVMsQ0FBQyxXQUFWLENBQUEsQ0FBeEQ7RUFEYTs7RUFHZixjQUFBLEdBQWlCLFNBQUE7V0FDZixJQUFJLENBQUMsZUFBTCxDQUFxQixvQ0FBckI7RUFEZTs7RUFNakIsa0JBQUEsR0FBcUIsU0FBQyxlQUFEO0lBQ25CLElBQUcsZUFBSDthQUNFLElBQUksQ0FBQyxZQUFMLENBQWtCLHVDQUFsQixFQUEyRCxRQUEzRCxFQURGO0tBQUEsTUFBQTthQUdFLG9CQUFBLENBQUEsRUFIRjs7RUFEbUI7O0VBTXJCLG9CQUFBLEdBQXVCLFNBQUE7V0FDckIsSUFBSSxDQUFDLGVBQUwsQ0FBcUIsdUNBQXJCO0VBRHFCO0FBckR2QiIsInNvdXJjZXNDb250ZW50IjpbInJvb3QgPSBkb2N1bWVudC5kb2N1bWVudEVsZW1lbnRcblxubW9kdWxlLmV4cG9ydHMgPVxuICBhY3RpdmF0ZTogKHN0YXRlKSAtPlxuICAgIGF0b20uY29uZmlnLm9ic2VydmUgJ2FwZXgtYWRhcHQtZGFyay11aS5mb250U2l6ZScsICh2YWx1ZSkgLT5cbiAgICAgIHNldEZvbnRTaXplKHZhbHVlKVxuXG4gICAgYXRvbS5jb25maWcub2JzZXJ2ZSAnYXBleC1hZGFwdC1kYXJrLXVpLnRhYlNpemluZycsICh2YWx1ZSkgLT5cbiAgICAgIHNldFRhYlNpemluZyh2YWx1ZSlcblxuICAgIGF0b20uY29uZmlnLm9ic2VydmUgJ2FwZXgtYWRhcHQtZGFyay11aS5oaWRlRG9ja0J1dHRvbnMnLCAodmFsdWUpIC0+XG4gICAgICBzZXRIaWRlRG9ja0J1dHRvbnModmFsdWUpXG5cbiAgICAjIERFUFJFQ0FURUQ6IFRoaXMgY2FuIGJlIHJlbW92ZWQgYXQgc29tZSBwb2ludCAoYWRkZWQgaW4gQXRvbSAxLjE3LzEuMThpc2gpXG4gICAgIyBJdCByZW1vdmVzIGBsYXlvdXRNb2RlYFxuICAgIGlmIGF0b20uY29uZmlnLmdldCgnYXBleC1hZGFwdC1kYXJrLXVpLmxheW91dE1vZGUnKVxuICAgICAgYXRvbS5jb25maWcudW5zZXQoJ2FwZXgtYWRhcHQtZGFyay11aS5sYXlvdXRNb2RlJylcblxuICBkZWFjdGl2YXRlOiAtPlxuICAgIHVuc2V0Rm9udFNpemUoKVxuICAgIHVuc2V0VGFiU2l6aW5nKClcbiAgICB1bnNldEhpZGVEb2NrQnV0dG9ucygpXG5cblxuIyBGb250IFNpemUgLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cblxuc2V0Rm9udFNpemUgPSAoY3VycmVudEZvbnRTaXplKSAtPlxuICBpZiBOdW1iZXIuaXNJbnRlZ2VyKGN1cnJlbnRGb250U2l6ZSlcbiAgICByb290LnN0eWxlLmZvbnRTaXplID0gXCIje2N1cnJlbnRGb250U2l6ZX1weFwiXG4gIGVsc2UgaWYgY3VycmVudEZvbnRTaXplIGlzICdBdXRvJ1xuICAgIHVuc2V0Rm9udFNpemUoKVxuXG51bnNldEZvbnRTaXplID0gLT5cbiAgcm9vdC5zdHlsZS5mb250U2l6ZSA9ICcnXG5cblxuIyBUYWIgU2l6aW5nIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5cbnNldFRhYlNpemluZyA9ICh0YWJTaXppbmcpIC0+XG4gIHJvb3Quc2V0QXR0cmlidXRlKCd0aGVtZS1hcGV4LWFkYXB0LWRhcmstdWktdGFic2l6aW5nJywgdGFiU2l6aW5nLnRvTG93ZXJDYXNlKCkpXG5cbnVuc2V0VGFiU2l6aW5nID0gLT5cbiAgcm9vdC5yZW1vdmVBdHRyaWJ1dGUoJ3RoZW1lLWFwZXgtYWRhcHQtZGFyay11aS10YWJzaXppbmcnKVxuXG5cbiMgRG9jayBCdXR0b25zIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5cbnNldEhpZGVEb2NrQnV0dG9ucyA9IChoaWRlRG9ja0J1dHRvbnMpIC0+XG4gIGlmIGhpZGVEb2NrQnV0dG9uc1xuICAgIHJvb3Quc2V0QXR0cmlidXRlKCd0aGVtZS1hcGV4LWFkYXB0LWRhcmstdWktZG9jay1idXR0b25zJywgJ2hpZGRlbicpXG4gIGVsc2VcbiAgICB1bnNldEhpZGVEb2NrQnV0dG9ucygpXG5cbnVuc2V0SGlkZURvY2tCdXR0b25zID0gLT5cbiAgcm9vdC5yZW1vdmVBdHRyaWJ1dGUoJ3RoZW1lLWFwZXgtYWRhcHQtZGFyay11aS1kb2NrLWJ1dHRvbnMnKVxuIl19
