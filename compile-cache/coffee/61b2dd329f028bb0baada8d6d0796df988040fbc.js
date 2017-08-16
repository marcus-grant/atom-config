(function() {
  module.exports = {
    apply: function() {
      var root, setColor, setFancy, setFontSize;
      root = document.querySelector('body');
      setFontSize = function(currentFontSize) {
        if (Number.isInteger(currentFontSize)) {
          return root.style.fontSize = currentFontSize + 'px';
        } else if (currentFontSize === 'Auto') {
          return root.style.fontSize = '';
        }
      };
      setColor = function(color) {
        return root.setAttribute('color', color != null ? color : color = 'Green');
      };
      setFancy = function(fancy) {
        if (fancy) {
          return root.setAttribute('fancy', '');
        } else {
          return root.removeAttribute('fancy');
        }
      };
      atom.config.onDidChange('paper-flat-ui.fontSize', function() {
        return setFontSize(atom.config.get('paper-flat-ui.fontSize'));
      });
      atom.config.onDidChange('paper-flat-ui.color', function() {
        return setColor(atom.config.get('paper-flat-ui.color'));
      });
      atom.config.onDidChange('paper-flat-ui.useFancyStyle', function() {
        return setFancy(atom.config.get('paper-flat-ui.useFancyStyle'));
      });
      setFontSize(atom.config.get('paper-flat-ui.fontSize'));
      setColor(atom.config.get('paper-flat-ui.color'));
      return setFancy(atom.config.get('paper-flat-ui.useFancyStyle'));
    }
  };

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL2hvbWUvbWFyY3VzLy5hdG9tL3BhY2thZ2VzL3BhcGVyLWZsYXQtdWkvbGliL2NvbmZpZy5jb2ZmZWUiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7RUFBQSxNQUFNLENBQUMsT0FBUCxHQUVFO0lBQUEsS0FBQSxFQUFPLFNBQUE7QUFFTCxVQUFBO01BQUEsSUFBQSxHQUFPLFFBQVEsQ0FBQyxhQUFULENBQXVCLE1BQXZCO01BR1AsV0FBQSxHQUFjLFNBQUMsZUFBRDtRQUNaLElBQUcsTUFBTSxDQUFDLFNBQVAsQ0FBaUIsZUFBakIsQ0FBSDtpQkFDRSxJQUFJLENBQUMsS0FBSyxDQUFDLFFBQVgsR0FBc0IsZUFBQSxHQUFrQixLQUQxQztTQUFBLE1BRUssSUFBRyxlQUFBLEtBQW1CLE1BQXRCO2lCQUNILElBQUksQ0FBQyxLQUFLLENBQUMsUUFBWCxHQUFzQixHQURuQjs7TUFITztNQU1kLFFBQUEsR0FBVyxTQUFDLEtBQUQ7ZUFDVCxJQUFJLENBQUMsWUFBTCxDQUFrQixPQUFsQixrQkFBMkIsUUFBQSxRQUFPLE9BQWxDO01BRFM7TUFHWCxRQUFBLEdBQVcsU0FBQyxLQUFEO1FBQ1QsSUFBRyxLQUFIO2lCQUNFLElBQUksQ0FBQyxZQUFMLENBQWtCLE9BQWxCLEVBQTBCLEVBQTFCLEVBREY7U0FBQSxNQUFBO2lCQUdFLElBQUksQ0FBQyxlQUFMLENBQXFCLE9BQXJCLEVBSEY7O01BRFM7TUFNWCxJQUFJLENBQUMsTUFBTSxDQUFDLFdBQVosQ0FBd0Isd0JBQXhCLEVBQWtELFNBQUE7ZUFDaEQsV0FBQSxDQUFZLElBQUksQ0FBQyxNQUFNLENBQUMsR0FBWixDQUFnQix3QkFBaEIsQ0FBWjtNQURnRCxDQUFsRDtNQUdBLElBQUksQ0FBQyxNQUFNLENBQUMsV0FBWixDQUF3QixxQkFBeEIsRUFBK0MsU0FBQTtlQUM3QyxRQUFBLENBQVMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxHQUFaLENBQWdCLHFCQUFoQixDQUFUO01BRDZDLENBQS9DO01BR0EsSUFBSSxDQUFDLE1BQU0sQ0FBQyxXQUFaLENBQXdCLDZCQUF4QixFQUF1RCxTQUFBO2VBQ3JELFFBQUEsQ0FBUyxJQUFJLENBQUMsTUFBTSxDQUFDLEdBQVosQ0FBZ0IsNkJBQWhCLENBQVQ7TUFEcUQsQ0FBdkQ7TUFHQSxXQUFBLENBQVksSUFBSSxDQUFDLE1BQU0sQ0FBQyxHQUFaLENBQWdCLHdCQUFoQixDQUFaO01BQ0EsUUFBQSxDQUFTLElBQUksQ0FBQyxNQUFNLENBQUMsR0FBWixDQUFnQixxQkFBaEIsQ0FBVDthQUNBLFFBQUEsQ0FBUyxJQUFJLENBQUMsTUFBTSxDQUFDLEdBQVosQ0FBZ0IsNkJBQWhCLENBQVQ7SUEvQkssQ0FBUDs7QUFGRiIsInNvdXJjZXNDb250ZW50IjpbIm1vZHVsZS5leHBvcnRzID1cblxuICBhcHBseTogLT5cblxuICAgIHJvb3QgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCdib2R5JylcblxuICAgICMgRm9udCBTaXplXG4gICAgc2V0Rm9udFNpemUgPSAoY3VycmVudEZvbnRTaXplKSAtPlxuICAgICAgaWYgTnVtYmVyLmlzSW50ZWdlcihjdXJyZW50Rm9udFNpemUpXG4gICAgICAgIHJvb3Quc3R5bGUuZm9udFNpemUgPSBjdXJyZW50Rm9udFNpemUgKyAncHgnXG4gICAgICBlbHNlIGlmIGN1cnJlbnRGb250U2l6ZSBpcyAnQXV0bydcbiAgICAgICAgcm9vdC5zdHlsZS5mb250U2l6ZSA9ICcnXG5cbiAgICBzZXRDb2xvciA9IChjb2xvcikgLT5cbiAgICAgIHJvb3Quc2V0QXR0cmlidXRlKCdjb2xvcicsIGNvbG9yPz0nR3JlZW4nKVxuXG4gICAgc2V0RmFuY3kgPSAoZmFuY3kpIC0+XG4gICAgICBpZiBmYW5jeVxuICAgICAgICByb290LnNldEF0dHJpYnV0ZSgnZmFuY3knLCcnKVxuICAgICAgZWxzZVxuICAgICAgICByb290LnJlbW92ZUF0dHJpYnV0ZSgnZmFuY3knKVxuXG4gICAgYXRvbS5jb25maWcub25EaWRDaGFuZ2UgJ3BhcGVyLWZsYXQtdWkuZm9udFNpemUnLCAtPlxuICAgICAgc2V0Rm9udFNpemUoYXRvbS5jb25maWcuZ2V0KCdwYXBlci1mbGF0LXVpLmZvbnRTaXplJykpXG5cbiAgICBhdG9tLmNvbmZpZy5vbkRpZENoYW5nZSAncGFwZXItZmxhdC11aS5jb2xvcicsIC0+XG4gICAgICBzZXRDb2xvcihhdG9tLmNvbmZpZy5nZXQoJ3BhcGVyLWZsYXQtdWkuY29sb3InKSlcblxuICAgIGF0b20uY29uZmlnLm9uRGlkQ2hhbmdlICdwYXBlci1mbGF0LXVpLnVzZUZhbmN5U3R5bGUnLCAtPlxuICAgICAgc2V0RmFuY3koYXRvbS5jb25maWcuZ2V0KCdwYXBlci1mbGF0LXVpLnVzZUZhbmN5U3R5bGUnKSlcblxuICAgIHNldEZvbnRTaXplKGF0b20uY29uZmlnLmdldCgncGFwZXItZmxhdC11aS5mb250U2l6ZScpKVxuICAgIHNldENvbG9yKGF0b20uY29uZmlnLmdldCgncGFwZXItZmxhdC11aS5jb2xvcicpKVxuICAgIHNldEZhbmN5KGF0b20uY29uZmlnLmdldCgncGFwZXItZmxhdC11aS51c2VGYW5jeVN0eWxlJykpXG4iXX0=
