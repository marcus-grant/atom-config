(function() {
  var getOptions, init, lazyHeaders, markdownIt, markdownItOptions, math, mathBlock, mathBrackets, mathDollars, mathInline, needsInit, renderLaTeX;

  markdownIt = null;

  markdownItOptions = null;

  renderLaTeX = null;

  math = null;

  lazyHeaders = null;

  mathInline = function(string) {
    return "<span class='math'><script type='math/tex'>" + string + "</script></span>";
  };

  mathBlock = function(string) {
    return "<span class='math'><script type='math/tex; mode=display'>" + string + "</script></span>";
  };

  mathDollars = {
    inlineOpen: '$',
    inlineClose: '$',
    blockOpen: '$$',
    blockClose: '$$',
    inlineRenderer: mathInline,
    blockRenderer: mathBlock
  };

  mathBrackets = {
    inlineOpen: '\\(',
    inlineClose: '\\)',
    blockOpen: '\\[',
    blockClose: '\\]',
    inlineRenderer: mathInline,
    blockRenderer: mathBlock
  };

  getOptions = function() {
    return {
      html: true,
      xhtmlOut: false,
      breaks: atom.config.get('markdown-preview-plus.breakOnSingleNewline'),
      langPrefix: 'lang-',
      linkify: true,
      typographer: true
    };
  };

  init = function(rL) {
    renderLaTeX = rL;
    markdownItOptions = getOptions();
    markdownIt = require('markdown-it')(markdownItOptions);
    if (renderLaTeX) {
      if (math == null) {
        math = require('markdown-it-math');
      }
      markdownIt.use(math, mathDollars);
      markdownIt.use(math, mathBrackets);
    }
    lazyHeaders = atom.config.get('markdown-preview-plus.useLazyHeaders');
    if (lazyHeaders) {
      return markdownIt.use(require('markdown-it-lazy-headers'));
    }
  };

  needsInit = function(rL) {
    return (markdownIt == null) || markdownItOptions.breaks !== atom.config.get('markdown-preview-plus.breakOnSingleNewline') || lazyHeaders !== atom.config.get('markdown-preview-plus.useLazyHeaders') || rL !== renderLaTeX;
  };

  exports.render = function(text, rL) {
    if (needsInit(rL)) {
      init(rL);
    }
    return markdownIt.render(text);
  };

  exports.decode = function(url) {
    return markdownIt.normalizeLinkText(url);
  };

  exports.getTokens = function(text, rL) {
    if (needsInit(rL)) {
      init(rL);
    }
    return markdownIt.parse(text, {});
  };

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL2hvbWUvbWFyY3VzLy5hdG9tL3BhY2thZ2VzL21hcmtkb3duLXByZXZpZXctcGx1cy9saWIvbWFya2Rvd24taXQtaGVscGVyLmNvZmZlZSJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQUFBLE1BQUE7O0VBQUEsVUFBQSxHQUFhOztFQUNiLGlCQUFBLEdBQW9COztFQUNwQixXQUFBLEdBQWM7O0VBQ2QsSUFBQSxHQUFPOztFQUNQLFdBQUEsR0FBYzs7RUFFZCxVQUFBLEdBQWEsU0FBQyxNQUFEO1dBQVksNkNBQUEsR0FBOEMsTUFBOUMsR0FBcUQ7RUFBakU7O0VBQ2IsU0FBQSxHQUFZLFNBQUMsTUFBRDtXQUFZLDJEQUFBLEdBQTRELE1BQTVELEdBQW1FO0VBQS9FOztFQUVaLFdBQUEsR0FDRTtJQUFBLFVBQUEsRUFBWSxHQUFaO0lBQ0EsV0FBQSxFQUFhLEdBRGI7SUFFQSxTQUFBLEVBQVcsSUFGWDtJQUdBLFVBQUEsRUFBWSxJQUhaO0lBSUEsY0FBQSxFQUFnQixVQUpoQjtJQUtBLGFBQUEsRUFBZSxTQUxmOzs7RUFPRixZQUFBLEdBQ0U7SUFBQSxVQUFBLEVBQVksS0FBWjtJQUNBLFdBQUEsRUFBYSxLQURiO0lBRUEsU0FBQSxFQUFXLEtBRlg7SUFHQSxVQUFBLEVBQVksS0FIWjtJQUlBLGNBQUEsRUFBZ0IsVUFKaEI7SUFLQSxhQUFBLEVBQWUsU0FMZjs7O0VBT0YsVUFBQSxHQUFhLFNBQUE7V0FDWDtNQUFBLElBQUEsRUFBTSxJQUFOO01BQ0EsUUFBQSxFQUFVLEtBRFY7TUFFQSxNQUFBLEVBQVEsSUFBSSxDQUFDLE1BQU0sQ0FBQyxHQUFaLENBQWdCLDRDQUFoQixDQUZSO01BR0EsVUFBQSxFQUFZLE9BSFo7TUFJQSxPQUFBLEVBQVMsSUFKVDtNQUtBLFdBQUEsRUFBYSxJQUxiOztFQURXOztFQVNiLElBQUEsR0FBTyxTQUFDLEVBQUQ7SUFFTCxXQUFBLEdBQWM7SUFFZCxpQkFBQSxHQUFvQixVQUFBLENBQUE7SUFFcEIsVUFBQSxHQUFhLE9BQUEsQ0FBUSxhQUFSLENBQUEsQ0FBdUIsaUJBQXZCO0lBRWIsSUFBRyxXQUFIOztRQUNFLE9BQVEsT0FBQSxDQUFRLGtCQUFSOztNQUNSLFVBQVUsQ0FBQyxHQUFYLENBQWUsSUFBZixFQUFxQixXQUFyQjtNQUNBLFVBQVUsQ0FBQyxHQUFYLENBQWUsSUFBZixFQUFxQixZQUFyQixFQUhGOztJQUtBLFdBQUEsR0FBYyxJQUFJLENBQUMsTUFBTSxDQUFDLEdBQVosQ0FBZ0Isc0NBQWhCO0lBRWQsSUFBRyxXQUFIO2FBQ0UsVUFBVSxDQUFDLEdBQVgsQ0FBZSxPQUFBLENBQVEsMEJBQVIsQ0FBZixFQURGOztFQWZLOztFQW1CUCxTQUFBLEdBQVksU0FBQyxFQUFEO1dBQ04sb0JBQUosSUFDQSxpQkFBaUIsQ0FBQyxNQUFsQixLQUE4QixJQUFJLENBQUMsTUFBTSxDQUFDLEdBQVosQ0FBZ0IsNENBQWhCLENBRDlCLElBRUEsV0FBQSxLQUFpQixJQUFJLENBQUMsTUFBTSxDQUFDLEdBQVosQ0FBZ0Isc0NBQWhCLENBRmpCLElBR0EsRUFBQSxLQUFRO0VBSkU7O0VBTVosT0FBTyxDQUFDLE1BQVIsR0FBaUIsU0FBQyxJQUFELEVBQU8sRUFBUDtJQUNmLElBQVksU0FBQSxDQUFVLEVBQVYsQ0FBWjtNQUFBLElBQUEsQ0FBSyxFQUFMLEVBQUE7O1dBQ0EsVUFBVSxDQUFDLE1BQVgsQ0FBa0IsSUFBbEI7RUFGZTs7RUFJakIsT0FBTyxDQUFDLE1BQVIsR0FBaUIsU0FBQyxHQUFEO1dBQ2YsVUFBVSxDQUFDLGlCQUFYLENBQTZCLEdBQTdCO0VBRGU7O0VBR2pCLE9BQU8sQ0FBQyxTQUFSLEdBQW9CLFNBQUMsSUFBRCxFQUFPLEVBQVA7SUFDbEIsSUFBWSxTQUFBLENBQVUsRUFBVixDQUFaO01BQUEsSUFBQSxDQUFLLEVBQUwsRUFBQTs7V0FDQSxVQUFVLENBQUMsS0FBWCxDQUFpQixJQUFqQixFQUF1QixFQUF2QjtFQUZrQjtBQWxFcEIiLCJzb3VyY2VzQ29udGVudCI6WyJtYXJrZG93bkl0ID0gbnVsbFxubWFya2Rvd25JdE9wdGlvbnMgPSBudWxsXG5yZW5kZXJMYVRlWCA9IG51bGxcbm1hdGggPSBudWxsXG5sYXp5SGVhZGVycyA9IG51bGxcblxubWF0aElubGluZSA9IChzdHJpbmcpIC0+IFwiPHNwYW4gY2xhc3M9J21hdGgnPjxzY3JpcHQgdHlwZT0nbWF0aC90ZXgnPiN7c3RyaW5nfTwvc2NyaXB0Pjwvc3Bhbj5cIlxubWF0aEJsb2NrID0gKHN0cmluZykgLT4gXCI8c3BhbiBjbGFzcz0nbWF0aCc+PHNjcmlwdCB0eXBlPSdtYXRoL3RleDsgbW9kZT1kaXNwbGF5Jz4je3N0cmluZ308L3NjcmlwdD48L3NwYW4+XCJcblxubWF0aERvbGxhcnMgPVxuICBpbmxpbmVPcGVuOiAnJCdcbiAgaW5saW5lQ2xvc2U6ICckJ1xuICBibG9ja09wZW46ICckJCdcbiAgYmxvY2tDbG9zZTogJyQkJ1xuICBpbmxpbmVSZW5kZXJlcjogbWF0aElubGluZVxuICBibG9ja1JlbmRlcmVyOiBtYXRoQmxvY2tcblxubWF0aEJyYWNrZXRzID1cbiAgaW5saW5lT3BlbjogJ1xcXFwoJ1xuICBpbmxpbmVDbG9zZTogJ1xcXFwpJ1xuICBibG9ja09wZW46ICdcXFxcWydcbiAgYmxvY2tDbG9zZTogJ1xcXFxdJ1xuICBpbmxpbmVSZW5kZXJlcjogbWF0aElubGluZVxuICBibG9ja1JlbmRlcmVyOiBtYXRoQmxvY2tcblxuZ2V0T3B0aW9ucyA9IC0+XG4gIGh0bWw6IHRydWVcbiAgeGh0bWxPdXQ6IGZhbHNlXG4gIGJyZWFrczogYXRvbS5jb25maWcuZ2V0KCdtYXJrZG93bi1wcmV2aWV3LXBsdXMuYnJlYWtPblNpbmdsZU5ld2xpbmUnKVxuICBsYW5nUHJlZml4OiAnbGFuZy0nXG4gIGxpbmtpZnk6IHRydWVcbiAgdHlwb2dyYXBoZXI6IHRydWVcblxuXG5pbml0ID0gKHJMKSAtPlxuXG4gIHJlbmRlckxhVGVYID0gckxcblxuICBtYXJrZG93bkl0T3B0aW9ucyA9IGdldE9wdGlvbnMoKVxuXG4gIG1hcmtkb3duSXQgPSByZXF1aXJlKCdtYXJrZG93bi1pdCcpKG1hcmtkb3duSXRPcHRpb25zKVxuXG4gIGlmIHJlbmRlckxhVGVYXG4gICAgbWF0aCA/PSByZXF1aXJlKCdtYXJrZG93bi1pdC1tYXRoJylcbiAgICBtYXJrZG93bkl0LnVzZSBtYXRoLCBtYXRoRG9sbGFyc1xuICAgIG1hcmtkb3duSXQudXNlIG1hdGgsIG1hdGhCcmFja2V0c1xuXG4gIGxhenlIZWFkZXJzID0gYXRvbS5jb25maWcuZ2V0KCdtYXJrZG93bi1wcmV2aWV3LXBsdXMudXNlTGF6eUhlYWRlcnMnKVxuXG4gIGlmIGxhenlIZWFkZXJzXG4gICAgbWFya2Rvd25JdC51c2UgcmVxdWlyZSgnbWFya2Rvd24taXQtbGF6eS1oZWFkZXJzJylcblxuXG5uZWVkc0luaXQgPSAockwpIC0+XG4gIG5vdCBtYXJrZG93bkl0PyBvclxuICBtYXJrZG93bkl0T3B0aW9ucy5icmVha3MgaXNudCBhdG9tLmNvbmZpZy5nZXQoJ21hcmtkb3duLXByZXZpZXctcGx1cy5icmVha09uU2luZ2xlTmV3bGluZScpIG9yXG4gIGxhenlIZWFkZXJzIGlzbnQgYXRvbS5jb25maWcuZ2V0KCdtYXJrZG93bi1wcmV2aWV3LXBsdXMudXNlTGF6eUhlYWRlcnMnKSBvclxuICByTCBpc250IHJlbmRlckxhVGVYXG5cbmV4cG9ydHMucmVuZGVyID0gKHRleHQsIHJMKSAtPlxuICBpbml0KHJMKSBpZiBuZWVkc0luaXQockwpXG4gIG1hcmtkb3duSXQucmVuZGVyIHRleHRcblxuZXhwb3J0cy5kZWNvZGUgPSAodXJsKSAtPlxuICBtYXJrZG93bkl0Lm5vcm1hbGl6ZUxpbmtUZXh0IHVybFxuXG5leHBvcnRzLmdldFRva2VucyA9ICh0ZXh0LCByTCkgLT5cbiAgaW5pdChyTCkgaWYgbmVlZHNJbml0KHJMKVxuICBtYXJrZG93bkl0LnBhcnNlIHRleHQsIHt9XG4iXX0=
