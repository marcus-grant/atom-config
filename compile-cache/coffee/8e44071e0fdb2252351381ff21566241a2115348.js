(function() {
  var $, _, cheerio, fs, highlight, highlighter, imageWatcher, markdownIt, packagePath, pandocHelper, path, render, resolveImagePaths, resourcePath, sanitize, scopeForFenceName, tokenizeCodeBlocks;

  path = require('path');

  _ = require('underscore-plus');

  cheerio = require('cheerio');

  fs = require('fs-plus');

  highlight = require('atom-highlight');

  $ = require('atom-space-pen-views').$;

  pandocHelper = null;

  markdownIt = null;

  scopeForFenceName = require('./extension-helper').scopeForFenceName;

  imageWatcher = require('./image-watch-helper');

  highlighter = null;

  resourcePath = atom.getLoadSettings().resourcePath;

  packagePath = path.dirname(__dirname);

  exports.toDOMFragment = function(text, filePath, grammar, renderLaTeX, callback) {
    if (text == null) {
      text = '';
    }
    return render(text, filePath, renderLaTeX, false, function(error, html) {
      var domFragment, template;
      if (error != null) {
        return callback(error);
      }
      template = document.createElement('template');
      template.innerHTML = html;
      domFragment = template.content.cloneNode(true);
      return callback(null, domFragment);
    });
  };

  exports.toHTML = function(text, filePath, grammar, renderLaTeX, copyHTMLFlag, callback) {
    if (text == null) {
      text = '';
    }
    return render(text, filePath, renderLaTeX, copyHTMLFlag, function(error, html) {
      var defaultCodeLanguage;
      if (error != null) {
        return callback(error);
      }
      if ((grammar != null ? grammar.scopeName : void 0) === 'source.litcoffee') {
        defaultCodeLanguage = 'coffee';
      }
      if (!(atom.config.get('markdown-preview-plus.enablePandoc') && atom.config.get('markdown-preview-plus.useNativePandocCodeStyles'))) {
        html = tokenizeCodeBlocks(html, defaultCodeLanguage);
      }
      return callback(null, html);
    });
  };

  render = function(text, filePath, renderLaTeX, copyHTMLFlag, callback) {
    var callbackFunction;
    text = text.replace(/^\s*<!doctype(\s+.*)?>\s*/i, '');
    callbackFunction = function(error, html) {
      if (error != null) {
        return callback(error);
      }
      html = sanitize(html);
      html = resolveImagePaths(html, filePath, copyHTMLFlag);
      return callback(null, html.trim());
    };
    if (atom.config.get('markdown-preview-plus.enablePandoc')) {
      if (pandocHelper == null) {
        pandocHelper = require('./pandoc-helper');
      }
      return pandocHelper.renderPandoc(text, filePath, renderLaTeX, callbackFunction);
    } else {
      if (markdownIt == null) {
        markdownIt = require('./markdown-it-helper');
      }
      return callbackFunction(null, markdownIt.render(text, renderLaTeX));
    }
  };

  sanitize = function(html) {
    var attribute, attributesToRemove, i, len, o;
    o = cheerio.load(html);
    o("script:not([type^='math/tex'])").remove();
    attributesToRemove = ['onabort', 'onblur', 'onchange', 'onclick', 'ondbclick', 'onerror', 'onfocus', 'onkeydown', 'onkeypress', 'onkeyup', 'onload', 'onmousedown', 'onmousemove', 'onmouseover', 'onmouseout', 'onmouseup', 'onreset', 'onresize', 'onscroll', 'onselect', 'onsubmit', 'onunload'];
    for (i = 0, len = attributesToRemove.length; i < len; i++) {
      attribute = attributesToRemove[i];
      o('*').removeAttr(attribute);
    }
    return o.html();
  };

  resolveImagePaths = function(html, filePath, copyHTMLFlag) {
    var e, i, img, imgElement, len, o, ref, rootDirectory, src, v;
    if (atom.project != null) {
      rootDirectory = atom.project.relativizePath(filePath)[0];
    }
    o = cheerio.load(html);
    ref = o('img');
    for (i = 0, len = ref.length; i < len; i++) {
      imgElement = ref[i];
      img = o(imgElement);
      if (src = img.attr('src')) {
        if (!atom.config.get('markdown-preview-plus.enablePandoc')) {
          if (markdownIt == null) {
            markdownIt = require('./markdown-it-helper');
          }
          src = markdownIt.decode(src);
        }
        if (src.match(/^(https?|atom):\/\//)) {
          continue;
        }
        if (src.startsWith(process.resourcesPath)) {
          continue;
        }
        if (src.startsWith(resourcePath)) {
          continue;
        }
        if (src.startsWith(packagePath)) {
          continue;
        }
        if (src[0] === '/') {
          if (!fs.isFileSync(src)) {
            try {
              src = path.join(rootDirectory, src.substring(1));
            } catch (error1) {
              e = error1;
            }
          }
        } else {
          src = path.resolve(path.dirname(filePath), src);
        }
        if (!copyHTMLFlag) {
          v = imageWatcher.getVersion(src, filePath);
          if (v) {
            src = src + "?v=" + v;
          }
        }
        img.attr('src', src);
      }
    }
    return o.html();
  };

  exports.convertCodeBlocksToAtomEditors = function(domFragment, defaultLanguage) {
    var codeBlock, codeElement, cursorLineDecoration, editor, editorElement, fenceName, fontFamily, grammar, i, j, k, len, len1, len2, preElement, ref, ref1, ref2, ref3, ref4, ref5;
    if (defaultLanguage == null) {
      defaultLanguage = 'text';
    }
    if (fontFamily = atom.config.get('editor.fontFamily')) {
      ref = domFragment.querySelectorAll('code');
      for (i = 0, len = ref.length; i < len; i++) {
        codeElement = ref[i];
        codeElement.style.fontFamily = fontFamily;
      }
    }
    ref1 = domFragment.querySelectorAll('pre');
    for (j = 0, len1 = ref1.length; j < len1; j++) {
      preElement = ref1[j];
      codeBlock = (ref2 = preElement.firstElementChild) != null ? ref2 : preElement;
      fenceName = (ref3 = (ref4 = codeBlock.getAttribute('class')) != null ? ref4.replace(/^(lang-|sourceCode )/, '') : void 0) != null ? ref3 : defaultLanguage;
      editorElement = document.createElement('atom-text-editor');
      editorElement.setAttributeNode(document.createAttribute('gutter-hidden'));
      editorElement.removeAttribute('tabindex');
      preElement.parentNode.insertBefore(editorElement, preElement);
      preElement.remove();
      editor = editorElement.getModel();
      if (editor.cursorLineDecorations != null) {
        ref5 = editor.cursorLineDecorations;
        for (k = 0, len2 = ref5.length; k < len2; k++) {
          cursorLineDecoration = ref5[k];
          cursorLineDecoration.destroy();
        }
      } else {
        editor.getDecorations({
          "class": 'cursor-line',
          type: 'line'
        })[0].destroy();
      }
      editor.setText(codeBlock.textContent.replace(/\n$/, ''));
      if (grammar = atom.grammars.grammarForScopeName(scopeForFenceName(fenceName))) {
        editor.setGrammar(grammar);
      }
    }
    return domFragment;
  };

  tokenizeCodeBlocks = function(html, defaultLanguage) {
    var codeBlock, fenceName, fontFamily, highlightedBlock, highlightedHtml, i, len, o, preElement, ref, ref1, ref2;
    if (defaultLanguage == null) {
      defaultLanguage = 'text';
    }
    o = cheerio.load(html);
    if (fontFamily = atom.config.get('editor.fontFamily')) {
      o('code').css('font-family', fontFamily);
    }
    ref = o("pre");
    for (i = 0, len = ref.length; i < len; i++) {
      preElement = ref[i];
      codeBlock = o(preElement).children().first();
      fenceName = (ref1 = (ref2 = codeBlock.attr('class')) != null ? ref2.replace(/^(lang-|sourceCode )/, '') : void 0) != null ? ref1 : defaultLanguage;
      highlightedHtml = highlight({
        fileContents: codeBlock.text(),
        scopeName: scopeForFenceName(fenceName),
        nbsp: true,
        lineDivs: true,
        editorDiv: true,
        editorDivTag: 'pre',
        editorDivClass: 'editor-colors'
      });
      highlightedBlock = o(highlightedHtml);
      highlightedBlock.addClass("lang-" + fenceName);
      o(preElement).replaceWith(highlightedBlock);
    }
    return o.html();
  };

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL2hvbWUvbWFyY3VzLy5hdG9tL3BhY2thZ2VzL21hcmtkb3duLXByZXZpZXctcGx1cy9saWIvcmVuZGVyZXIuY29mZmVlIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FBQUEsTUFBQTs7RUFBQSxJQUFBLEdBQU8sT0FBQSxDQUFRLE1BQVI7O0VBQ1AsQ0FBQSxHQUFJLE9BQUEsQ0FBUSxpQkFBUjs7RUFDSixPQUFBLEdBQVUsT0FBQSxDQUFRLFNBQVI7O0VBQ1YsRUFBQSxHQUFLLE9BQUEsQ0FBUSxTQUFSOztFQUNMLFNBQUEsR0FBWSxPQUFBLENBQVEsZ0JBQVI7O0VBQ1gsSUFBSyxPQUFBLENBQVEsc0JBQVI7O0VBQ04sWUFBQSxHQUFlOztFQUNmLFVBQUEsR0FBYTs7RUFDWixvQkFBcUIsT0FBQSxDQUFRLG9CQUFSOztFQUN0QixZQUFBLEdBQWUsT0FBQSxDQUFRLHNCQUFSOztFQUVmLFdBQUEsR0FBYzs7RUFDYixlQUFnQixJQUFJLENBQUMsZUFBTCxDQUFBOztFQUNqQixXQUFBLEdBQWMsSUFBSSxDQUFDLE9BQUwsQ0FBYSxTQUFiOztFQUVkLE9BQU8sQ0FBQyxhQUFSLEdBQXdCLFNBQUMsSUFBRCxFQUFVLFFBQVYsRUFBb0IsT0FBcEIsRUFBNkIsV0FBN0IsRUFBMEMsUUFBMUM7O01BQUMsT0FBSzs7V0FDNUIsTUFBQSxDQUFPLElBQVAsRUFBYSxRQUFiLEVBQXVCLFdBQXZCLEVBQW9DLEtBQXBDLEVBQTJDLFNBQUMsS0FBRCxFQUFRLElBQVI7QUFDekMsVUFBQTtNQUFBLElBQTBCLGFBQTFCO0FBQUEsZUFBTyxRQUFBLENBQVMsS0FBVCxFQUFQOztNQUVBLFFBQUEsR0FBVyxRQUFRLENBQUMsYUFBVCxDQUF1QixVQUF2QjtNQUNYLFFBQVEsQ0FBQyxTQUFULEdBQXFCO01BQ3JCLFdBQUEsR0FBYyxRQUFRLENBQUMsT0FBTyxDQUFDLFNBQWpCLENBQTJCLElBQTNCO2FBRWQsUUFBQSxDQUFT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LENBQTBCLGdCQUExQjtBQWpCRjtXQW1CQSxDQUFDLENBQUMsSUFBRixDQUFBO0VBekJtQjtBQXJKckIiLCJzb3VyY2VzQ29udGVudCI6WyJwYXRoID0gcmVxdWlyZSAncGF0aCdcbl8gPSByZXF1aXJlICd1bmRlcnNjb3JlLXBsdXMnXG5jaGVlcmlvID0gcmVxdWlyZSAnY2hlZXJpbydcbmZzID0gcmVxdWlyZSAnZnMtcGx1cydcbmhpZ2hsaWdodCA9IHJlcXVpcmUgJ2F0b20taGlnaGxpZ2h0J1xueyR9ID0gcmVxdWlyZSAnYXRvbS1zcGFjZS1wZW4tdmlld3MnXG5wYW5kb2NIZWxwZXIgPSBudWxsICMgRGVmZXIgdW50aWwgdXNlZFxubWFya2Rvd25JdCA9IG51bGwgIyBEZWZlciB1bnRpbCB1c2VkXG57c2NvcGVGb3JGZW5jZU5hbWV9ID0gcmVxdWlyZSAnLi9leHRlbnNpb24taGVscGVyJ1xuaW1hZ2VXYXRjaGVyID0gcmVxdWlyZSAnLi9pbWFnZS13YXRjaC1oZWxwZXInXG5cbmhpZ2hsaWdodGVyID0gbnVsbFxue3Jlc291cmNlUGF0aH0gPSBhdG9tLmdldExvYWRTZXR0aW5ncygpXG5wYWNrYWdlUGF0aCA9IHBhdGguZGlybmFtZShfX2Rpcm5hbWUpXG5cbmV4cG9ydHMudG9ET01GcmFnbWVudCA9ICh0ZXh0PScnLCBmaWxlUGF0aCwgZ3JhbW1hciwgcmVuZGVyTGFUZVgsIGNhbGxiYWNrKSAtPlxuICByZW5kZXIgdGV4dCwgZmlsZVBhdGgsIHJlbmRlckxhVGVYLCBmYWxzZSwgKGVycm9yLCBodG1sKSAtPlxuICAgIHJldHVybiBjYWxsYmFjayhlcnJvcikgaWYgZXJyb3I/XG5cbiAgICB0ZW1wbGF0ZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3RlbXBsYXRlJylcbiAgICB0ZW1wbGF0ZS5pbm5lckhUTUwgPSBodG1sXG4gICAgZG9tRnJhZ21lbnQgPSB0ZW1wbGF0ZS5jb250ZW50LmNsb25lTm9kZSh0cnVlKVxuXG4gICAgY2FsbGJhY2sobnVsbCwgZG9tRnJhZ21lbnQpXG5cbmV4cG9ydHMudG9IVE1MID0gKHRleHQ9JycsIGZpbGVQYXRoLCBncmFtbWFyLCByZW5kZXJMYVRlWCwgY29weUhUTUxGbGFnLCBjYWxsYmFjaykgLT5cbiAgcmVuZGVyIHRleHQsIGZpbGVQYXRoLCByZW5kZXJMYVRlWCwgY29weUhUTUxGbGFnLCAoZXJyb3IsIGh0bWwpIC0+XG4gICAgcmV0dXJuIGNhbGxiYWNrKGVycm9yKSBpZiBlcnJvcj9cbiAgICAjIERlZmF1bHQgY29kZSBibG9ja3MgdG8gYmUgY29mZmVlIGluIExpdGVyYXRlIENvZmZlZVNjcmlwdCBmaWxlc1xuICAgIGRlZmF1bHRDb2RlTGFuZ3VhZ2UgPSAnY29mZmVlJyBpZiBncmFtbWFyPy5zY29wZU5hbWUgaXMgJ3NvdXJjZS5saXRjb2ZmZWUnXG4gICAgdW5sZXNzIGF0b20uY29uZmlnLmdldCgnbWFya2Rvd24tcHJldmlldy1wbHVzLmVuYWJsZVBhbmRvYycpIFxcXG4gICAgICAgIGFuZCBhdG9tLmNvbmZpZy5nZXQoJ21hcmtkb3duLXByZXZpZXctcGx1cy51c2VOYXRpdmVQYW5kb2NDb2RlU3R5bGVzJylcbiAgICAgIGh0bWwgPSB0b2tlbml6ZUNvZGVCbG9ja3MoaHRtbCwgZGVmYXVsdENvZGVMYW5ndWFnZSlcbiAgICBjYWxsYmFjayhudWxsLCBodG1sKVxuXG5yZW5kZXIgPSAodGV4dCwgZmlsZVBhdGgsIHJlbmRlckxhVGVYLCBjb3B5SFRNTEZsYWcsIGNhbGxiYWNrKSAtPlxuICAjIFJlbW92ZSB0aGUgPCFkb2N0eXBlPiBzaW5jZSBvdGhlcndpc2UgbWFya2VkIHdpbGwgZXNjYXBlIGl0XG4gICMgaHR0cHM6Ly9naXRodWIuY29tL2NoamovbWFya2VkL2lzc3Vlcy8zNTRcbiAgdGV4dCA9IHRleHQucmVwbGFjZSgvXlxccyo8IWRvY3R5cGUoXFxzKy4qKT8+XFxzKi9pLCAnJylcblxuICBjYWxsYmFja0Z1bmN0aW9uID0gKGVycm9yLCBodG1sKSAtPlxuICAgIHJldHVybiBjYWxsYmFjayhlcnJvcikgaWYgZXJyb3I/XG4gICAgaHRtbCA9IHNhbml0aXplKGh0bWwpXG4gICAgaHRtbCA9IHJlc29sdmVJbWFnZVBhdGhzKGh0bWwsIGZpbGVQYXRoLCBjb3B5SFRNTEZsYWcpXG4gICAgY2FsbGJhY2sobnVsbCwgaHRtbC50cmltKCkpXG5cbiAgaWYgYXRvbS5jb25maWcuZ2V0KCdtYXJrZG93bi1wcmV2aWV3LXBsdXMuZW5hYmxlUGFuZG9jJylcbiAgICBwYW5kb2NIZWxwZXIgPz0gcmVxdWlyZSAnLi9wYW5kb2MtaGVscGVyJ1xuICAgIHBhbmRvY0hlbHBlci5yZW5kZXJQYW5kb2MgdGV4dCwgZmlsZVBhdGgsIHJlbmRlckxhVGVYLCBjYWxsYmFja0Z1bmN0aW9uXG4gIGVsc2VcblxuICAgIG1hcmtkb3duSXQgPz0gcmVxdWlyZSAnLi9tYXJrZG93bi1pdC1oZWxwZXInXG5cbiAgICBjYWxsYmFja0Z1bmN0aW9uIG51bGwsIG1hcmtkb3duSXQucmVuZGVyKHRleHQsIHJlbmRlckxhVGVYKVxuXG5zYW5pdGl6ZSA9IChodG1sKSAtPlxuICBvID0gY2hlZXJpby5sb2FkKGh0bWwpXG4gICMgRG8gbm90IHJlbW92ZSBNYXRoSmF4IHNjcmlwdCBkZWxpbWl0ZWQgYmxvY2tzXG4gIG8oXCJzY3JpcHQ6bm90KFt0eXBlXj0nbWF0aC90ZXgnXSlcIikucmVtb3ZlKClcbiAgYXR0cmlidXRlc1RvUmVtb3ZlID0gW1xuICAgICdvbmFib3J0J1xuICAgICdvbmJsdXInXG4gICAgJ29uY2hhbmdlJ1xuICAgICdvbmNsaWNrJ1xuICAgICdvbmRiY2xpY2snXG4gICAgJ29uZXJyb3InXG4gICAgJ29uZm9jdXMnXG4gICAgJ29ua2V5ZG93bidcbiAgICAnb25rZXlwcmVzcydcbiAgICAnb25rZXl1cCdcbiAgICAnb25sb2FkJ1xuICAgICdvbm1vdXNlZG93bidcbiAgICAnb25tb3VzZW1vdmUnXG4gICAgJ29ubW91c2VvdmVyJ1xuICAgICdvbm1vdXNlb3V0J1xuICAgICdvbm1vdXNldXAnXG4gICAgJ29ucmVzZXQnXG4gICAgJ29ucmVzaXplJ1xuICAgICdvbnNjcm9sbCdcbiAgICAnb25zZWxlY3QnXG4gICAgJ29uc3VibWl0J1xuICAgICdvbnVubG9hZCdcbiAgXVxuICBvKCcqJykucmVtb3ZlQXR0cihhdHRyaWJ1dGUpIGZvciBhdHRyaWJ1dGUgaW4gYXR0cmlidXRlc1RvUmVtb3ZlXG4gIG8uaHRtbCgpXG5cblxucmVzb2x2ZUltYWdlUGF0aHMgPSAoaHRtbCwgZmlsZVBhdGgsIGNvcHlIVE1MRmxhZykgLT5cbiAgaWYgYXRvbS5wcm9qZWN0P1xuICAgIFtyb290RGlyZWN0b3J5XSA9IGF0b20ucHJvamVjdC5yZWxhdGl2aXplUGF0aChmaWxlUGF0aClcbiAgbyA9IGNoZWVyaW8ubG9hZChodG1sKVxuICBmb3IgaW1nRWxlbWVudCBpbiBvKCdpbWcnKVxuICAgIGltZyA9IG8oaW1nRWxlbWVudClcbiAgICBpZiBzcmMgPSBpbWcuYXR0cignc3JjJylcbiAgICAgIGlmIG5vdCBhdG9tLmNvbmZpZy5nZXQoJ21hcmtkb3duLXByZXZpZXctcGx1cy5lbmFibGVQYW5kb2MnKVxuICAgICAgICBtYXJrZG93bkl0ID89IHJlcXVpcmUgJy4vbWFya2Rvd24taXQtaGVscGVyJ1xuICAgICAgICBzcmMgPSBtYXJrZG93bkl0LmRlY29kZShzcmMpXG5cbiAgICAgIGNvbnRpbnVlIGlmIHNyYy5tYXRjaCgvXihodHRwcz98YXRvbSk6XFwvXFwvLylcbiAgICAgIGNvbnRpbnVlIGlmIHNyYy5zdGFydHNXaXRoKHByb2Nlc3MucmVzb3VyY2VzUGF0aClcbiAgICAgIGNvbnRpbnVlIGlmIHNyYy5zdGFydHNXaXRoKHJlc291cmNlUGF0aClcbiAgICAgIGNvbnRpbnVlIGlmIHNyYy5zdGFydHNXaXRoKHBhY2thZ2VQYXRoKVxuXG4gICAgICBpZiBzcmNbMF0gaXMgJy8nXG4gICAgICAgIHVubGVzcyBmcy5pc0ZpbGVTeW5jKHNyYylcbiAgICAgICAgICB0cnlcbiAgICAgICAgICAgIHNyYyA9IHBhdGguam9pbihyb290RGlyZWN0b3J5LCBzcmMuc3Vic3RyaW5nKDEpKVxuICAgICAgICAgIGNhdGNoIGVcbiAgICAgIGVsc2VcbiAgICAgICAgc3JjID0gcGF0aC5yZXNvbHZlKHBhdGguZGlybmFtZShmaWxlUGF0aCksIHNyYylcblxuICAgICAgIyBVc2UgbW9zdCByZWNlbnQgdmVyc2lvbiBvZiBpbWFnZVxuICAgICAgaWYgbm90IGNvcHlIVE1MRmxhZ1xuICAgICAgICB2ID0gaW1hZ2VXYXRjaGVyLmdldFZlcnNpb24oc3JjLCBmaWxlUGF0aClcbiAgICAgICAgc3JjID0gXCIje3NyY30/dj0je3Z9XCIgaWYgdlxuXG4gICAgICBpbWcuYXR0cignc3JjJywgc3JjKVxuXG4gIG8uaHRtbCgpXG5cbmV4cG9ydHMuY29udmVydENvZGVCbG9ja3NUb0F0b21FZGl0b3JzID0gKGRvbUZyYWdtZW50LCBkZWZhdWx0TGFuZ3VhZ2U9J3RleHQnKSAtPlxuICBpZiBmb250RmFtaWx5ID0gYXRvbS5jb25maWcuZ2V0KCdlZGl0b3IuZm9udEZhbWlseScpXG4gICAgZm9yIGNvZGVFbGVtZW50IGluIGRvbUZyYWdtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoJ2NvZGUnKVxuICAgICAgY29kZUVsZW1lbnQuc3R5bGUuZm9udEZhbWlseSA9IGZvbnRGYW1pbHlcblxuICBmb3IgcHJlRWxlbWVudCBpbiBkb21GcmFnbWVudC5xdWVyeVNlbGVjdG9yQWxsKCdwcmUnKVxuICAgIGNvZGVCbG9jayA9IHByZUVsZW1lbnQuZmlyc3RFbGVtZW50Q2hpbGQgPyBwcmVFbGVtZW50XG4gICAgZmVuY2VOYW1lID0gY29kZUJsb2NrLmdldEF0dHJpYnV0ZSgnY2xhc3MnKT8ucmVwbGFjZSgvXihsYW5nLXxzb3VyY2VDb2RlICkvLCAnJykgPyBkZWZhdWx0TGFuZ3VhZ2VcblxuICAgIGVkaXRvckVsZW1lbnQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdhdG9tLXRleHQtZWRpdG9yJylcbiAgICBlZGl0b3JFbGVtZW50LnNldEF0dHJpYnV0ZU5vZGUoZG9jdW1lbnQuY3JlYXRlQXR0cmlidXRlKCdndXR0ZXItaGlkZGVuJykpXG4gICAgZWRpdG9yRWxlbWVudC5yZW1vdmVBdHRyaWJ1dGUoJ3RhYmluZGV4JykgIyBtYWtlIHJlYWQtb25seVxuXG4gICAgcHJlRWxlbWVudC5wYXJlbnROb2RlLmluc2VydEJlZm9yZShlZGl0b3JFbGVtZW50LCBwcmVFbGVtZW50KVxuICAgIHByZUVsZW1lbnQucmVtb3ZlKClcblxuICAgIGVkaXRvciA9IGVkaXRvckVsZW1lbnQuZ2V0TW9kZWwoKVxuICAgICMgcmVtb3ZlIHRoZSBkZWZhdWx0IHNlbGVjdGlvbiBvZiBhIGxpbmUgaW4gZWFjaCBlZGl0b3JcbiAgICBpZiBlZGl0b3IuY3Vyc29yTGluZURlY29yYXRpb25zP1xuICAgICAgZm9yIGN1cnNvckxpbmVEZWNvcmF0aW9uIGluIGVkaXRvci5jdXJzb3JMaW5lRGVjb3JhdGlvbnNcbiAgICAgICAgY3Vyc29yTGluZURlY29yYXRpb24uZGVzdHJveSgpXG4gICAgZWxzZVxuICAgICAgZWRpdG9yLmdldERlY29yYXRpb25zKGNsYXNzOiAnY3Vyc29yLWxpbmUnLCB0eXBlOiAnbGluZScpWzBdLmRlc3Ryb3koKVxuICAgIGVkaXRvci5zZXRUZXh0KGNvZGVCbG9jay50ZXh0Q29udGVudC5yZXBsYWNlKC9cXG4kLywgJycpKVxuICAgIGlmIGdyYW1tYXIgPSBhdG9tLmdyYW1tYXJzLmdyYW1tYXJGb3JTY29wZU5hbWUoc2NvcGVGb3JGZW5jZU5hbWUoZmVuY2VOYW1lKSlcbiAgICAgIGVkaXRvci5zZXRHcmFtbWFyKGdyYW1tYXIpXG5cbiAgZG9tRnJhZ21lbnRcblxudG9rZW5pemVDb2RlQmxvY2tzID0gKGh0bWwsIGRlZmF1bHRMYW5ndWFnZT0ndGV4dCcpIC0+XG4gIG8gPSBjaGVlcmlvLmxvYWQoaHRtbClcblxuICBpZiBmb250RmFtaWx5ID0gYXRvbS5jb25maWcuZ2V0KCdlZGl0b3IuZm9udEZhbWlseScpXG4gICAgbygnY29kZScpLmNzcygnZm9udC1mYW1pbHknLCBmb250RmFtaWx5KVxuXG4gIGZvciBwcmVFbGVtZW50IGluIG8oXCJwcmVcIilcbiAgICBjb2RlQmxvY2sgPSBvKHByZUVsZW1lbnQpLmNoaWxkcmVuKCkuZmlyc3QoKVxuICAgIGZlbmNlTmFtZSA9IGNvZGVCbG9jay5hdHRyKCdjbGFzcycpPy5yZXBsYWNlKC9eKGxhbmctfHNvdXJjZUNvZGUgKS8sICcnKSA/IGRlZmF1bHRMYW5ndWFnZVxuXG4gICAgaGlnaGxpZ2h0ZWRIdG1sID0gaGlnaGxpZ2h0XG4gICAgICBmaWxlQ29udGVudHM6IGNvZGVCbG9jay50ZXh0KClcbiAgICAgIHNjb3BlTmFtZTogc2NvcGVGb3JGZW5jZU5hbWUoZmVuY2VOYW1lKVxuICAgICAgbmJzcDogdHJ1ZVxuICAgICAgbGluZURpdnM6IHRydWVcbiAgICAgIGVkaXRvckRpdjogdHJ1ZVxuICAgICAgZWRpdG9yRGl2VGFnOiAncHJlJ1xuICAgICAgIyBUaGUgYGVkaXRvcmAgY2xhc3MgbWVzc2VzIHRoaW5ncyB1cCBhcyBgLmVkaXRvcmAgaGFzIGFic29sdXRlbHkgcG9zaXRpb25lZCBsaW5lc1xuICAgICAgZWRpdG9yRGl2Q2xhc3M6ICdlZGl0b3ItY29sb3JzJ1xuXG4gICAgaGlnaGxpZ2h0ZWRCbG9jayA9IG8oaGlnaGxpZ2h0ZWRIdG1sKVxuICAgIGhpZ2hsaWdodGVkQmxvY2suYWRkQ2xhc3MoXCJsYW5nLSN7ZmVuY2VOYW1lfVwiKVxuXG4gICAgbyhwcmVFbGVtZW50KS5yZXBsYWNlV2l0aChoaWdobGlnaHRlZEJsb2NrKVxuXG4gIG8uaHRtbCgpXG4iXX0=
