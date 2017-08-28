(function() {
  var _, atomConfig, cheerio, config, currentText, findFileRecursive, fs, getArguments, getMathJaxPath, handleError, handleMath, handleResponse, handleSuccess, path, pdc, removeReferences, renderPandoc, setPandocOptions;

  pdc = require('pdc');

  _ = require('underscore-plus');

  cheerio = null;

  fs = null;

  path = null;

  currentText = null;

  atomConfig = null;

  config = {};


  /**
   * Sets local mathjaxPath if available
   */

  getMathJaxPath = function() {
    var e;
    try {
      return config.mathjax = require.resolve('MathJax');
    } catch (error1) {
      e = error1;
      return config.mathjax = '';
    }
  };

  findFileRecursive = function(filePath, fileName) {
    var bibFile, newPath;
    if (fs == null) {
      fs = require('fs');
    }
    if (path == null) {
      path = require('path');
    }
    bibFile = path.join(filePath, '../', fileName);
    if (fs.existsSync(bibFile)) {
      return bibFile;
    } else {
      newPath = path.join(bibFile, '..');
      if (newPath !== filePath && !_.contains(atom.project.getPaths(), newPath)) {
        return findFileRecursive(newPath, fileName);
      } else {
        return false;
      }
    }
  };


  /**
   * Sets local variables needed for everything
   * @param {string} path to markdown file
   *
   */

  setPandocOptions = function(filePath) {
    var bibFile, cslFile;
    atomConfig = atom.config.get('markdown-preview-plus');
    pdc.path = atomConfig.pandocPath;
    config.flavor = atomConfig.pandocMarkdownFlavor;
    config.args = {};
    config.opts = {};
    if (path == null) {
      path = require('path');
    }
    if (filePath != null) {
      config.opts.cwd = path.dirname(filePath);
    }
    if (config.mathjax == null) {
      getMathJaxPath();
    }
    config.args.mathjax = config.renderMath ? config.mathjax : void 0;
    if (atomConfig.pandocBibliography) {
      config.args.filter = ['pandoc-citeproc'];
      bibFile = findFileRecursive(filePath, atomConfig.pandocBIBFile);
      if (!bibFile) {
        bibFile = atomConfig.pandocBIBFileFallback;
      }
      config.args.bibliography = bibFile ? bibFile : void 0;
      cslFile = findFileRecursive(filePath, atomConfig.pandocCSLFile);
      if (!cslFile) {
        cslFile = atomConfig.pandocCSLFileFallback;
      }
      config.args.csl = cslFile ? cslFile : void 0;
    }
    return config;
  };


  /**
   * Handle error response from pdc
   * @param {error} Returned error
   * @param {string} Returned HTML
   * @return {array} with Arguments for callbackFunction (error set to null)
   */

  handleError = function(error, html) {
    var isOnlyMissingReferences, message, referenceSearch;
    referenceSearch = /pandoc-citeproc: reference ([\S]+) not found(<br>)?/ig;
    message = _.uniq(error.message.split('\n')).join('<br>');
    html = "<h1>Pandoc Error:</h1><p><b>" + message + "</b></p><hr>";
    isOnlyMissingReferences = message.replace(referenceSearch, '').length === 0;
    if (isOnlyMissingReferences) {
      message.match(referenceSearch).forEach(function(match) {
        var r;
        match = match.replace(referenceSearch, '$1');
        r = new RegExp("@" + match, 'gi');
        return currentText = currentText.replace(r, "&#64;" + match);
      });
      currentText = html + currentText;
      pdc(currentText, config.flavor, 'html', getArguments(config.args), config.opts, handleResponse);
    }
    return [null, html];
  };


  /**
   * Adjusts all math environments in HTML
   * @param {string} HTML to be adjusted
   * @return {string} HTML with adjusted math environments
   */

  handleMath = function(html) {
    var o;
    if (cheerio == null) {
      cheerio = require('cheerio');
    }
    o = cheerio.load("<div>" + html + "</div>");
    o('.math').each(function(i, elem) {
      var math, mode, newContent;
      math = cheerio(this).text();
      mode = math.indexOf('\\[') > -1 ? '; mode=display' : '';
      math = math.replace(/\\[[()\]]/g, '');
      newContent = '<span class="math">' + ("<script type='math/tex" + mode + "'>" + math + "</script>") + '</span>';
      return cheerio(this).replaceWith(newContent);
    });
    return o('div').html();
  };

  removeReferences = function(html) {
    var o;
    if (cheerio == null) {
      cheerio = require('cheerio');
    }
    o = cheerio.load("<div>" + html + "</div>");
    o('.references').each(function(i, elem) {
      return cheerio(this).remove();
    });
    return o('div').html();
  };


  /**
   * Handle successful response from pdc
   * @param {string} Returned HTML
   * @return {array} with Arguments for callbackFunction (error set to null)
   */

  handleSuccess = function(html) {
    if (config.renderMath) {
      html = handleMath(html);
    }
    if (atomConfig.pandocRemoveReferences) {
      html = removeReferences(html);
    }
    return [null, html];
  };


  /**
   * Handle response from pdc
   * @param {Object} error if thrown
   * @param {string} Returned HTML
   */

  handleResponse = function(error, html) {
    var array;
    array = error != null ? handleError(error, html) : handleSuccess(html);
    return config.callback.apply(config.callback, array);
  };


  /**
   * Renders markdown with pandoc
   * @param {string} document in markdown
   * @param {boolean} whether to render the math with mathjax
   * @param {function} callbackFunction
   */

  renderPandoc = function(text, filePath, renderMath, cb) {
    currentText = text;
    config.renderMath = renderMath;
    config.callback = cb;
    setPandocOptions(filePath);
    return pdc(text, config.flavor, 'html', getArguments(config.args), config.opts, handleResponse);
  };

  getArguments = function(args) {
    args = _.reduce(args, function(res, val, key) {
      if (!_.isEmpty(val)) {
        val = _.flatten([val]);
        _.forEach(val, function(v) {
          if (!_.isEmpty(v)) {
            return res.push("--" + key + "=" + v);
          }
        });
      }
      return res;
    }, []);
    args = _.union(args, atom.config.get('markdown-preview-plus.pandocArguments'));
    args = _.map(args, function(val) {
      val = val.replace(/^(--[\w\-]+)\s(.+)$/i, "$1=$2");
      if (val.substr(0, 1) !== '-') {
        return void 0;
      } else {
        return val;
      }
    });
    return _.reject(args, _.isEmpty);
  };

  module.exports = {
    renderPandoc: renderPandoc,
    __testing__: {
      findFileRecursive: findFileRecursive,
      setPandocOptions: setPandocOptions,
      getArguments: getArguments
    }
  };

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL2hvbWUvbWFyY3VzLy5hdG9tL3BhY2thZ2VzL21hcmtkb3duLXByZXZpZXctcGx1cy9saWIvcGFuZG9jLWhlbHBlci5jb2ZmZWUiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUFBQSxNQUFBOztFQUFBLEdBQUEsR0FBTSxPQUFBLENBQVEsS0FBUjs7RUFDTixDQUFBLEdBQUksT0FBQSxDQUFRLGlCQUFSOztFQUNKLE9BQUEsR0FBVTs7RUFDVixFQUFBLEdBQUs7O0VBQ0wsSUFBQSxHQUFPOztFQUdQLFdBQUEsR0FBYzs7RUFFZCxVQUFBLEdBQWE7O0VBRWIsTUFBQSxHQUFTOzs7QUFFVDs7OztFQUdBLGNBQUEsR0FBaUIsU0FBQTtBQUNmLFFBQUE7QUFBQTthQUNFLE1BQU0sQ0FBQyxPQUFQLEdBQWlCLE9BQU8sQ0FBQyxPQUFSLENBQWdCLFNBQWhCLEVBRG5CO0tBQUEsY0FBQTtNQUVNO2FBQ0osTUFBTSxDQUFDLE9BQVAsR0FBaUIsR0FIbkI7O0VBRGU7O0VBTWpCLGlCQUFBLEdBQW9CLFNBQUMsUUFBRCxFQUFXLFFBQVg7QUFDbEIsUUFBQTs7TUFBQSxLQUFNLE9BQUEsQ0FBUSxJQUFSOzs7TUFDTixPQUFRLE9BQUEsQ0FBUSxNQUFSOztJQUNSLE9BQUEsR0FBVSxJQUFJLENBQUMsSUFBTCxDQUFVLFFBQVYsRUFBb0IsS0FBcEIsRUFBMkIsUUFBM0I7SUFDVixJQUFHLEVBQUUsQ0FBQyxVQUFILENBQWMsT0FBZCxDQUFIO2FBQ0UsUUFERjtLQUFBLE1BQUE7TUFHRSxPQUFBLEdBQVUsSUFBSSxDQUFDLElBQUwsQ0FBVSxPQUFWLEVBQW1CLElBQW5CO01BQ1YsSUFBRyxPQUFBLEtBQWEsUUFBYixJQUEwQixDQUFJLENBQUMsQ0FBQyxRQUFGLENBQVcsSUFBSSxDQUFDLE9BQU8sQ0FBQyxRQUFiLENBQUEsQ0FBWCxFQUFvQyxPQUFwQyxDQUFqQztlQUNFLGlCQUFBLENBQWtCLE9BQWxCLEVBQTJC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QVMsR0FBVCxHQUFZLENBQXJCLEVBQUE7O1FBRGEsQ0FBZixFQUZGOztBQUlBLGFBQU87SUFMVCxDQURLLEVBT0gsRUFQRztJQVFQLElBQUEsR0FBTyxDQUFDLENBQUMsS0FBRixDQUFRLElBQVIsRUFBYyxJQUFJLENBQUMsTUFBTSxDQUFDLEdBQVosQ0FBZ0IsdUNBQWhCLENBQWQ7SUFDUCxJQUFBLEdBQU8sQ0FBQyxDQUFDLEdBQUYsQ0FBTSxJQUFOLEVBQ0wsU0FBQyxHQUFEO01BQ0UsR0FBQSxHQUFNLEdBQUcsQ0FBQyxPQUFKLENBQVksc0JBQVosRUFBb0MsT0FBcEM7TUFDTixJQUFHLEdBQUcsQ0FBQyxNQUFKLENBQVcsQ0FBWCxFQUFjLENBQWQsQ0FBQSxLQUFzQixHQUF6QjtlQUFrQyxPQUFsQztPQUFBLE1BQUE7ZUFBaUQsSUFBakQ7O0lBRkYsQ0FESztXQUlQLENBQUMsQ0FBQyxNQUFGLENBQVMsSUFBVCxFQUFlLENBQUMsQ0FBQyxPQUFqQjtFQWRhOztFQWdCZixNQUFNLENBQUMsT0FBUCxHQUNFO0lBQUEsWUFBQSxFQUFjLFlBQWQ7SUFDQSxXQUFBLEVBQ0U7TUFBQSxpQkFBQSxFQUFtQixpQkFBbkI7TUFDQSxnQkFBQSxFQUFrQixnQkFEbEI7TUFFQSxZQUFBLEVBQWMsWUFGZDtLQUZGOztBQXJLRiIsInNvdXJjZXNDb250ZW50IjpbInBkYyA9IHJlcXVpcmUgJ3BkYydcbl8gPSByZXF1aXJlICd1bmRlcnNjb3JlLXBsdXMnXG5jaGVlcmlvID0gbnVsbFxuZnMgPSBudWxsXG5wYXRoID0gbnVsbFxuXG4jIEN1cnJlbnQgbWFya2Rvd24gdGV4dFxuY3VycmVudFRleHQgPSBudWxsXG5cbmF0b21Db25maWcgPSBudWxsXG5cbmNvbmZpZyA9IHt9XG5cbiMjIypcbiAqIFNldHMgbG9jYWwgbWF0aGpheFBhdGggaWYgYXZhaWxhYmxlXG4gIyMjXG5nZXRNYXRoSmF4UGF0aCA9IC0+XG4gIHRyeVxuICAgIGNvbmZpZy5tYXRoamF4ID0gcmVxdWlyZS5yZXNvbHZlICdNYXRoSmF4J1xuICBjYXRjaCBlXG4gICAgY29uZmlnLm1hdGhqYXggPSAnJ1xuXG5maW5kRmlsZVJlY3Vyc2l2ZSA9IChmaWxlUGF0aCwgZmlsZU5hbWUpIC0+XG4gIGZzID89IHJlcXVpcmUgJ2ZzJ1xuICBwYXRoID89IHJlcXVpcmUgJ3BhdGgnXG4gIGJpYkZpbGUgPSBwYXRoLmpvaW4gZmlsZVBhdGgsICcuLi8nLCBmaWxlTmFtZVxuICBpZiBmcy5leGlzdHNTeW5jIGJpYkZpbGVcbiAgICBiaWJGaWxlXG4gIGVsc2VcbiAgICBuZXdQYXRoID0gcGF0aC5qb2luIGJpYkZpbGUsICcuLidcbiAgICBpZiBuZXdQYXRoIGlzbnQgZmlsZVBhdGggYW5kIG5vdCBfLmNvbnRhaW5zKGF0b20ucHJvamVjdC5nZXRQYXRocygpLCBuZXdQYXRoKVxuICAgICAgZmluZEZpbGVSZWN1cnNpdmUgbmV3UGF0aCwgZmlsZU5hbWVcbiAgICBlbHNlXG4gICAgICBmYWxzZVxuXG4jIyMqXG4gKiBTZXRzIGxvY2FsIHZhcmlhYmxlcyBuZWVkZWQgZm9yIGV2ZXJ5dGhpbmdcbiAqIEBwYXJhbSB7c3RyaW5nfSBwYXRoIHRvIG1hcmtkb3duIGZpbGVcbiAqXG4gIyMjXG5zZXRQYW5kb2NPcHRpb25zID0gKGZpbGVQYXRoKSAtPlxuICBhdG9tQ29uZmlnID0gYXRvbS5jb25maWcuZ2V0KCdtYXJrZG93bi1wcmV2aWV3LXBsdXMnKVxuICBwZGMucGF0aCA9IGF0b21Db25maWcucGFuZG9jUGF0aFxuICBjb25maWcuZmxhdm9yID0gYXRvbUNvbmZpZy5wYW5kb2NNYXJrZG93bkZsYXZvclxuICBjb25maWcuYXJncyA9IHt9XG4gIGNvbmZpZy5vcHRzID0ge31cbiAgcGF0aCA/PSByZXF1aXJlICdwYXRoJ1xuICBjb25maWcub3B0cy5jd2QgPSBwYXRoLmRpcm5hbWUoZmlsZVBhdGgpIGlmIGZpbGVQYXRoP1xuICBnZXRNYXRoSmF4UGF0aCgpIHVubGVzcyBjb25maWcubWF0aGpheD9cbiAgY29uZmlnLmFyZ3MubWF0aGpheCA9IGlmIGNvbmZpZy5yZW5kZXJNYXRoIHRoZW4gY29uZmlnLm1hdGhqYXggZWxzZSB1bmRlZmluZWRcbiAgaWYgYXRvbUNvbmZpZy5wYW5kb2NCaWJsaW9ncmFwaHlcbiAgICBjb25maWcuYXJncy5maWx0ZXIgPSBbJ3BhbmRvYy1jaXRlcHJvYyddXG4gICAgYmliRmlsZSA9IGZpbmRGaWxlUmVjdXJzaXZlIGZpbGVQYXRoLCBhdG9tQ29uZmlnLnBhbmRvY0JJQkZpbGVcbiAgICBiaWJGaWxlID0gYXRvbUNvbmZpZy5wYW5kb2NCSUJGaWxlRmFsbGJhY2sgdW5sZXNzIGJpYkZpbGVcbiAgICBjb25maWcuYXJncy5iaWJsaW9ncmFwaHkgPSBpZiBiaWJGaWxlIHRoZW4gYmliRmlsZSBlbHNlIHVuZGVmaW5lZFxuICAgIGNzbEZpbGUgPSBmaW5kRmlsZVJlY3Vyc2l2ZSBmaWxlUGF0aCwgYXRvbUNvbmZpZy5wYW5kb2NDU0xGaWxlXG4gICAgY3NsRmlsZSA9IGF0b21Db25maWcucGFuZG9jQ1NMRmlsZUZhbGxiYWNrIHVubGVzcyBjc2xGaWxlXG4gICAgY29uZmlnLmFyZ3MuY3NsID0gaWYgY3NsRmlsZSB0aGVuIGNzbEZpbGUgZWxzZSB1bmRlZmluZWRcbiAgY29uZmlnXG5cbiMjIypcbiAqIEhhbmRsZSBlcnJvciByZXNwb25zZSBmcm9tIHBkY1xuICogQHBhcmFtIHtlcnJvcn0gUmV0dXJuZWQgZXJyb3JcbiAqIEBwYXJhbSB7c3RyaW5nfSBSZXR1cm5lZCBIVE1MXG4gKiBAcmV0dXJuIHthcnJheX0gd2l0aCBBcmd1bWVudHMgZm9yIGNhbGxiYWNrRnVuY3Rpb24gKGVycm9yIHNldCB0byBudWxsKVxuICMjI1xuaGFuZGxlRXJyb3IgPSAoZXJyb3IsIGh0bWwpIC0+XG4gIHJlZmVyZW5jZVNlYXJjaCA9IC9wYW5kb2MtY2l0ZXByb2M6IHJlZmVyZW5jZSAoW1xcU10rKSBub3QgZm91bmQoPGJyPik/L2lnXG4gIG1lc3NhZ2UgPVxuICAgIF8udW5pcSBlcnJvci5tZXNzYWdlLnNwbGl0ICdcXG4nXG4gICAgLmpvaW4oJzxicj4nKVxuICBodG1sID0gXCI8aDE+UGFuZG9jIEVycm9yOjwvaDE+PHA+PGI+I3ttZXNzYWdlfTwvYj48L3A+PGhyPlwiXG4gIGlzT25seU1pc3NpbmdSZWZlcmVuY2VzID1cbiAgICBtZXNzYWdlLnJlcGxhY2UgcmVmZXJlbmNlU2VhcmNoLCAnJ1xuICAgIC5sZW5ndGggaXMgMFxuICBpZiBpc09ubHlNaXNzaW5nUmVmZXJlbmNlc1xuICAgIG1lc3NhZ2UubWF0Y2ggcmVmZXJlbmNlU2VhcmNoXG4gICAgLmZvckVhY2ggKG1hdGNoKSAtPlxuICAgICAgbWF0Y2ggPSBtYXRjaC5yZXBsYWNlIHJlZmVyZW5jZVNlYXJjaCwgJyQxJ1xuICAgICAgciA9IG5ldyBSZWdFeHAgXCJAI3ttYXRjaH1cIiwgJ2dpJ1xuICAgICAgY3VycmVudFRleHQgPSBjdXJyZW50VGV4dC5yZXBsYWNlKHIsIFwiJiM2NDsje21hdGNofVwiKVxuICAgIGN1cnJlbnRUZXh0ID0gaHRtbCArIGN1cnJlbnRUZXh0XG4gICAgcGRjIGN1cnJlbnRUZXh0LCBjb25maWcuZmxhdm9yLCAnaHRtbCcsIGdldEFyZ3VtZW50cyhjb25maWcuYXJncyksIGNvbmZpZy5vcHRzLCBoYW5kbGVSZXNwb25zZVxuICBbbnVsbCwgaHRtbF1cblxuIyMjKlxuICogQWRqdXN0cyBhbGwgbWF0aCBlbnZpcm9ubWVudHMgaW4gSFRNTFxuICogQHBhcmFtIHtzdHJpbmd9IEhUTUwgdG8gYmUgYWRqdXN0ZWRcbiAqIEByZXR1cm4ge3N0cmluZ30gSFRNTCB3aXRoIGFkanVzdGVkIG1hdGggZW52aXJvbm1lbnRzXG4gIyMjXG5oYW5kbGVNYXRoID0gKGh0bWwpIC0+XG4gIGNoZWVyaW8gPz0gcmVxdWlyZSAnY2hlZXJpbydcbiAgbyA9IGNoZWVyaW8ubG9hZChcIjxkaXY+I3todG1sfTwvZGl2PlwiKVxuICBvKCcubWF0aCcpLmVhY2ggKGksIGVsZW0pIC0+XG4gICAgbWF0aCA9IGNoZWVyaW8odGhpcykudGV4dCgpXG4gICAgIyBTZXQgbW9kZSBpZiBpdCBpcyBibG9jayBtYXRoXG4gICAgbW9kZSA9IGlmIG1hdGguaW5kZXhPZignXFxcXFsnKSA+IC0xICB0aGVuICc7IG1vZGU9ZGlzcGxheScgZWxzZSAnJ1xuXG4gICAgIyBSZW1vdmUgc291cnJvdW5kaW5nIFxcWyBcXF0gYW5kIFxcKCBcXClcbiAgICBtYXRoID0gbWF0aC5yZXBsYWNlKC9cXFxcW1soKVxcXV0vZywgJycpXG4gICAgbmV3Q29udGVudCA9XG4gICAgICAnPHNwYW4gY2xhc3M9XCJtYXRoXCI+JyArXG4gICAgICBcIjxzY3JpcHQgdHlwZT0nbWF0aC90ZXgje21vZGV9Jz4je21hdGh9PC9zY3JpcHQ+XCIgK1xuICAgICAgJzwvc3Bhbj4nXG5cbiAgICBjaGVlcmlvKHRoaXMpLnJlcGxhY2VXaXRoIG5ld0NvbnRlbnRcblxuICBvKCdkaXYnKS5odG1sKClcblxucmVtb3ZlUmVmZXJlbmNlcyA9IChodG1sKSAtPlxuICBjaGVlcmlvID89IHJlcXVpcmUgJ2NoZWVyaW8nXG4gIG8gPSBjaGVlcmlvLmxvYWQoXCI8ZGl2PiN7aHRtbH08L2Rpdj5cIilcbiAgbygnLnJlZmVyZW5jZXMnKS5lYWNoIChpLCBlbGVtKSAtPlxuICAgIGNoZWVyaW8odGhpcykucmVtb3ZlKClcbiAgbygnZGl2JykuaHRtbCgpXG5cbiMjIypcbiAqIEhhbmRsZSBzdWNjZXNzZnVsIHJlc3BvbnNlIGZyb20gcGRjXG4gKiBAcGFyYW0ge3N0cmluZ30gUmV0dXJuZWQgSFRNTFxuICogQHJldHVybiB7YXJyYXl9IHdpdGggQXJndW1lbnRzIGZvciBjYWxsYmFja0Z1bmN0aW9uIChlcnJvciBzZXQgdG8gbnVsbClcbiAjIyNcbmhhbmRsZVN1Y2Nlc3MgPSAoaHRtbCkgLT5cbiAgaHRtbCA9IGhhbmRsZU1hdGggaHRtbCBpZiBjb25maWcucmVuZGVyTWF0aFxuICBodG1sID0gcmVtb3ZlUmVmZXJlbmNlcyBodG1sIGlmIGF0b21Db25maWcucGFuZG9jUmVtb3ZlUmVmZXJlbmNlc1xuICBbbnVsbCwgaHRtbF1cblxuIyMjKlxuICogSGFuZGxlIHJlc3BvbnNlIGZyb20gcGRjXG4gKiBAcGFyYW0ge09iamVjdH0gZXJyb3IgaWYgdGhyb3duXG4gKiBAcGFyYW0ge3N0cmluZ30gUmV0dXJuZWQgSFRNTFxuICMjI1xuaGFuZGxlUmVzcG9uc2UgPSAoZXJyb3IsIGh0bWwpIC0+XG4gIGFycmF5ID0gaWYgZXJyb3I/IHRoZW4gaGFuZGxlRXJyb3IgZXJyb3IsIGh0bWwgZWxzZSBoYW5kbGVTdWNjZXNzIGh0bWxcbiAgY29uZmlnLmNhbGxiYWNrLmFwcGx5IGNvbmZpZy5jYWxsYmFjaywgYXJyYXlcblxuIyMjKlxuICogUmVuZGVycyBtYXJrZG93biB3aXRoIHBhbmRvY1xuICogQHBhcmFtIHtzdHJpbmd9IGRvY3VtZW50IGluIG1hcmtkb3duXG4gKiBAcGFyYW0ge2Jvb2xlYW59IHdoZXRoZXIgdG8gcmVuZGVyIHRoZSBtYXRoIHdpdGggbWF0aGpheFxuICogQHBhcmFtIHtmdW5jdGlvbn0gY2FsbGJhY2tGdW5jdGlvblxuICMjI1xucmVuZGVyUGFuZG9jID0gKHRleHQsIGZpbGVQYXRoLCByZW5kZXJNYXRoLCBjYikgLT5cbiAgY3VycmVudFRleHQgPSB0ZXh0XG4gIGNvbmZpZy5yZW5kZXJNYXRoID0gcmVuZGVyTWF0aFxuICBjb25maWcuY2FsbGJhY2sgPSBjYlxuICBzZXRQYW5kb2NPcHRpb25zIGZpbGVQYXRoXG4gIHBkYyB0ZXh0LCBjb25maWcuZmxhdm9yLCAnaHRtbCcsIGdldEFyZ3VtZW50cyhjb25maWcuYXJncyksIGNvbmZpZy5vcHRzLCBoYW5kbGVSZXNwb25zZVxuXG5nZXRBcmd1bWVudHMgPSAoYXJncykgLT5cbiAgYXJncyA9IF8ucmVkdWNlIGFyZ3MsXG4gICAgKHJlcywgdmFsLCBrZXkpIC0+XG4gICAgICB1bmxlc3MgXy5pc0VtcHR5IHZhbFxuICAgICAgICB2YWwgPSBfLmZsYXR0ZW4oW3ZhbF0pXG4gICAgICAgIF8uZm9yRWFjaCB2YWwsICh2KSAtPlxuICAgICAgICAgIHJlcy5wdXNoIFwiLS0je2tleX09I3t2fVwiIHVubGVzcyBfLmlzRW1wdHkgdlxuICAgICAgcmV0dXJuIHJlc1xuICAgICwgW11cbiAgYXJncyA9IF8udW5pb24gYXJncywgYXRvbS5jb25maWcuZ2V0KCdtYXJrZG93bi1wcmV2aWV3LXBsdXMucGFuZG9jQXJndW1lbnRzJylcbiAgYXJncyA9IF8ubWFwIGFyZ3MsXG4gICAgKHZhbCkgLT5cbiAgICAgIHZhbCA9IHZhbC5yZXBsYWNlKC9eKC0tW1xcd1xcLV0rKVxccyguKykkL2ksIFwiJDE9JDJcIilcbiAgICAgIGlmIHZhbC5zdWJzdHIoMCwgMSkgaXNudCAnLScgdGhlbiB1bmRlZmluZWQgZWxzZSB2YWxcbiAgXy5yZWplY3QgYXJncywgXy5pc0VtcHR5XG5cbm1vZHVsZS5leHBvcnRzID1cbiAgcmVuZGVyUGFuZG9jOiByZW5kZXJQYW5kb2MsXG4gIF9fdGVzdGluZ19fOlxuICAgIGZpbmRGaWxlUmVjdXJzaXZlOiBmaW5kRmlsZVJlY3Vyc2l2ZVxuICAgIHNldFBhbmRvY09wdGlvbnM6IHNldFBhbmRvY09wdGlvbnNcbiAgICBnZXRBcmd1bWVudHM6IGdldEFyZ3VtZW50c1xuIl19
