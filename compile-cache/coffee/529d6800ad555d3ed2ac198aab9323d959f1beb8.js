(function() {
  var $, $$$, CompositeDisposable, Disposable, Emitter, File, Grim, MarkdownPreviewView, ScrollView, UpdatePreview, _, fs, imageWatcher, markdownIt, path, ref, ref1, renderer,
    bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

  path = require('path');

  ref = require('atom'), Emitter = ref.Emitter, Disposable = ref.Disposable, CompositeDisposable = ref.CompositeDisposable;

  ref1 = require('atom-space-pen-views'), $ = ref1.$, $$$ = ref1.$$$, ScrollView = ref1.ScrollView;

  Grim = require('grim');

  _ = require('underscore-plus');

  fs = require('fs-plus');

  File = require('atom').File;

  renderer = require('./renderer');

  UpdatePreview = require('./update-preview');

  markdownIt = null;

  imageWatcher = null;

  module.exports = MarkdownPreviewView = (function(superClass) {
    extend(MarkdownPreviewView, superClass);

    MarkdownPreviewView.content = function() {
      return this.div({
        "class": 'markdown-preview native-key-bindings',
        tabindex: -1
      }, (function(_this) {
        return function() {
          return _this.div({
            "class": 'update-preview'
          });
        };
      })(this));
    };

    function MarkdownPreviewView(arg) {
      this.editorId = arg.editorId, this.filePath = arg.filePath;
      this.syncPreview = bind(this.syncPreview, this);
      this.getPathToToken = bind(this.getPathToToken, this);
      this.syncSource = bind(this.syncSource, this);
      this.getPathToElement = bind(this.getPathToElement, this);
      this.updatePreview = null;
      this.renderLaTeX = atom.config.get('markdown-preview-plus.enableLatexRenderingByDefault');
      MarkdownPreviewView.__super__.constructor.apply(this, arguments);
      this.emitter = new Emitter;
      this.disposables = new CompositeDisposable;
      this.loaded = true;
    }

    MarkdownPreviewView.prototype.attached = function() {
      if (this.isAttached) {
        return;
      }
      this.isAttached = true;
      if (this.editorId != null) {
        return this.resolveEditor(this.editorId);
      } else {
        if (atom.workspace != null) {
          return this.subscribeToFilePath(this.filePath);
        } else {
          return this.disposables.add(atom.packages.onDidActivateInitialPackages((function(_this) {
            return function() {
              return _this.subscribeToFilePath(_this.filePath);
            };
          })(this)));
        }
      }
    };

    MarkdownPreviewView.prototype.serialize = function() {
      var ref2;
      return {
        deserializer: 'MarkdownPreviewView',
        filePath: (ref2 = this.getPath()) != null ? ref2 : this.filePath,
        editorId: this.editorId
      };
    };

    MarkdownPreviewView.prototype.destroy = function() {
      if (imageWatcher == null) {
        imageWatcher = require('./image-watch-helper');
      }
      imageWatcher.removeFile(this.getPath());
      return this.disposables.dispose();
    };

    MarkdownPreviewView.prototype.onDidChangeTitle = function(callback) {
      return this.emitter.on('did-change-title', callback);
    };

    MarkdownPreviewView.prototype.onDidChangeModified = function(callback) {
      return new Disposable;
    };

    MarkdownPreviewView.prototype.onDidChangeMarkdown = function(callback) {
      return this.emitter.on('did-change-markdown', callback);
    };

    MarkdownPreviewView.prototype.subscribeToFilePath = function(filePath) {
      this.file = new File(filePath);
      this.emitter.emit('did-change-title');
      this.handleEvents();
      return this.renderMarkdown();
    };

    MarkdownPreviewView.prototype.resolveEditor = function(editorId) {
      var resolve;
      resolve = (function(_this) {
        return function() {
          var ref2, ref3;
          _this.editor = _this.editorForId(editorId);
          if (_this.editor != null) {
            if (_this.editor != null) {
              _this.emitter.emit('did-change-title');
            }
            _this.handleEvents();
            return _this.renderMarkdown();
          } else {
            return (ref2 = atom.workspace) != null ? (ref3 = ref2.paneForItem(_this)) != null ? ref3.destroyItem(_this) : void 0 : void 0;
          }
        };
      })(this);
      if (atom.workspace != null) {
        return resolve();
      } else {
        return this.disposables.add(atom.packages.onDidActivateInitialPackages(resolve));
      }
    };

    MarkdownPreviewView.prototype.editorForId = function(editorId) {
      var editor, j, len, ref2, ref3;
      ref2 = atom.workspace.getTextEditors();
      for (j = 0, len = ref2.length; j < len; j++) {
        editor = ref2[j];
        if (((ref3 = editor.id) != null ? ref3.toString() : void 0) === editorId.toString()) {
          return editor;
        }
      }
      return null;
    };

    MarkdownPreviewView.prototype.handleEvents = function() {
      var changeHandler;
      this.disposables.add(atom.grammars.onDidAddGrammar((function(_this) {
        return function() {
          return _.debounce((function() {
            return _this.renderMarkdown();
          }), 250);
        };
      })(this)));
      this.disposables.add(atom.grammars.onDidUpdateGrammar(_.debounce(((function(_this) {
        return function() {
          return _this.renderMarkdown();
        };
      })(this)), 250)));
      atom.commands.add(this.element, {
        'core:move-up': (function(_this) {
          return function() {
            return _this.scrollUp();
          };
        })(this),
        'core:move-down': (function(_this) {
          return function() {
            return _this.scrollDown();
          };
        })(this),
        'core:save-as': (function(_this) {
          return function(event) {
            event.stopPropagation();
            return _this.saveAs();
          };
        })(this),
        'core:copy': (function(_this) {
          return function(event) {
            if (_this.copyToClipboard()) {
              return event.stopPropagation();
            }
          };
        })(this),
        'markdown-preview-plus:zoom-in': (function(_this) {
          return function() {
            var zoomLevel;
            zoomLevel = parseFloat(_this.css('zoom')) || 1;
            return _this.css('zoom', zoomLevel + .1);
          };
        })(this),
        'markdown-preview-plus:zoom-out': (function(_this) {
          return function() {
            var zoomLevel;
            zoomLevel = parseFloat(_this.css('zoom')) || 1;
            return _this.css('zoom', zoomLevel - .1);
          };
        })(this),
        'markdown-preview-plus:reset-zoom': (function(_this) {
          return function() {
            return _this.css('zoom', 1);
          };
        })(this),
        'markdown-preview-plus:sync-source': (function(_this) {
          return function(event) {
            return _this.getMarkdownSource().then(function(source) {
              if (source == null) {
                return;
              }
              return _this.syncSource(source, event.target);
            });
          };
        })(this)
      });
      changeHandler = (function(_this) {
        return function() {
          var base, pane, ref2;
          _this.renderMarkdown();
          pane = (ref2 = typeof (base = atom.workspace).paneForItem === "function" ? base.paneForItem(_this) : void 0) != null ? ref2 : atom.workspace.paneForURI(_this.getURI());
          if ((pane != null) && pane !== atom.workspace.getActivePane()) {
            return pane.activateItem(_this);
          }
        };
      })(this);
      if (this.file != null) {
        this.disposables.add(this.file.onDidChange(changeHandler));
      } else if (this.editor != null) {
        this.disposables.add(this.editor.getBuffer().onDidStopChanging(function() {
          if (atom.config.get('markdown-preview-plus.liveUpdate')) {
            return changeHandler();
          }
        }));
        this.disposables.add(this.editor.onDidChangePath((function(_this) {
          return function() {
            return _this.emitter.emit('did-change-title');
          };
        })(this)));
        this.disposables.add(this.editor.getBuffer().onDidSave(function() {
          if (!atom.config.get('markdown-preview-plus.liveUpdate')) {
            return changeHandler();
          }
        }));
        this.disposables.add(this.editor.getBuffer().onDidReload(function() {
          if (!atom.config.get('markdown-preview-plus.liveUpdate')) {
            return changeHandler();
          }
        }));
        this.disposables.add(atom.commands.add(atom.views.getView(this.editor), {
          'markdown-preview-plus:sync-preview': (function(_this) {
            return function(event) {
              return _this.getMarkdownSource().then(function(source) {
                if (source == null) {
                  return;
                }
                return _this.syncPreview(source, _this.editor.getCursorBufferPosition().row);
              });
            };
          })(this)
        }));
      }
      this.disposables.add(atom.config.onDidChange('markdown-preview-plus.breakOnSingleNewline', changeHandler));
      this.disposables.add(atom.commands.add('atom-workspace', {
        'markdown-preview-plus:toggle-render-latex': (function(_this) {
          return function() {
            if ((atom.workspace.getActivePaneItem() === _this) || (atom.workspace.getActiveTextEditor() === _this.editor)) {
              _this.renderLaTeX = !_this.renderLaTeX;
              changeHandler();
            }
          };
        })(this)
      }));
      return this.disposables.add(atom.config.observe('markdown-preview-plus.useGitHubStyle', (function(_this) {
        return function(useGitHubStyle) {
          if (useGitHubStyle) {
            return _this.element.setAttribute('data-use-github-style', '');
          } else {
            return _this.element.removeAttribute('data-use-github-style');
          }
        };
      })(this)));
    };

    MarkdownPreviewView.prototype.renderMarkdown = function() {
      if (!this.loaded) {
        this.showLoading();
      }
      return this.getMarkdownSource().then((function(_this) {
        return function(source) {
          if (source != null) {
            return _this.renderMarkdownText(source);
          }
        };
      })(this));
    };

    MarkdownPreviewView.prototype.refreshImages = function(oldsrc) {
      var img, imgs, j, len, match, ov, ref2, ref3, results, src, v;
      imgs = this.element.querySelectorAll("img[src]");
      if (imageWatcher == null) {
        imageWatcher = require('./image-watch-helper');
      }
      results = [];
      for (j = 0, len = imgs.length; j < len; j++) {
        img = imgs[j];
        src = img.getAttribute('src');
        match = src.match(/^(.*)\?v=(\d+)$/);
        ref3 = (ref2 = match != null ? typeof match.slice === "function" ? match.slice(1) : void 0 : void 0) != null ? ref2 : [src], src = ref3[0], ov = ref3[1];
        if (src === oldsrc) {
          if (ov != null) {
            ov = parseInt(ov);
          }
          v = imageWatcher.getVersion(src, this.getPath());
          if (v !== ov) {
            if (v) {
              results.push(img.src = src + "?v=" + v);
            } else {
              results.push(img.src = "" + src);
            }
          } else {
            results.push(void 0);
          }
        } else {
          results.push(void 0);
        }
      }
      return results;
    };

    MarkdownPreviewView.prototype.getMarkdownSource = function() {
      var ref2;
      if ((ref2 = this.file) != null ? ref2.getPath() : void 0) {
        return this.file.read();
      } else if (this.editor != null) {
        return Promise.resolve(this.editor.getText());
      } else {
        return Promise.resolve(null);
      }
    };

    MarkdownPreviewView.prototype.getHTML = function(callback) {
      return this.getMarkdownSource().then((function(_this) {
        return function(source) {
          if (source == null) {
            return;
          }
          return renderer.toHTML(source, _this.getPath(), _this.getGrammar(), _this.renderLaTeX, false, callback);
        };
      })(this));
    };

    MarkdownPreviewView.prototype.renderMarkdownText = function(text) {
      return renderer.toDOMFragment(text, this.getPath(), this.getGrammar(), this.renderLaTeX, (function(_this) {
        return function(error, domFragment) {
          if (error) {
            return _this.showError(error);
          } else {
            _this.loading = false;
            _this.loaded = true;
            if (!_this.updatePreview) {
              _this.updatePreview = new UpdatePreview(_this.find("div.update-preview")[0]);
            }
            _this.updatePreview.update(domFragment, _this.renderLaTeX);
            _this.emitter.emit('did-change-markdown');
            return _this.originalTrigger('markdown-preview-plus:markdown-changed');
          }
        };
      })(this));
    };

    MarkdownPreviewView.prototype.getTitle = function() {
      if (this.file != null) {
        return (path.basename(this.getPath())) + " Preview";
      } else if (this.editor != null) {
        return (this.editor.getTitle()) + " Preview";
      } else {
        return "Markdown Preview";
      }
    };

    MarkdownPreviewView.prototype.getIconName = function() {
      return "markdown";
    };

    MarkdownPreviewView.prototype.getURI = function() {
      if (this.file != null) {
        return "markdown-preview-plus://" + (this.getPath());
      } else {
        return "markdown-preview-plus://editor/" + this.editorId;
      }
    };

    MarkdownPreviewView.prototype.getPath = function() {
      if (this.file != null) {
        return this.file.getPath();
      } else if (this.editor != null) {
        return this.editor.getPath();
      }
    };

    MarkdownPreviewView.prototype.getGrammar = function() {
      var ref2;
      return (ref2 = this.editor) != null ? ref2.getGrammar() : void 0;
    };

    MarkdownPreviewView.prototype.getDocumentStyleSheets = function() {
      return document.styleSheets;
    };

    MarkdownPreviewView.prototype.getTextEditorStyles = function() {
      var textEditorStyles;
      textEditorStyles = document.createElement("atom-styles");
      textEditorStyles.initialize(atom.styles);
      textEditorStyles.setAttribute("context", "atom-text-editor");
      document.body.appendChild(textEditorStyles);
      return Array.prototype.slice.apply(textEditorStyles.childNodes).map(function(styleElement) {
        return styleElement.innerText;
      });
    };

    MarkdownPreviewView.prototype.getMarkdownPreviewCSS = function() {
      var cssUrlRefExp, j, k, len, len1, markdowPreviewRules, ref2, ref3, ref4, rule, ruleRegExp, stylesheet;
      markdowPreviewRules = [];
      ruleRegExp = /\.markdown-preview/;
      cssUrlRefExp = /url\(atom:\/\/markdown-preview-plus\/assets\/(.*)\)/;
      ref2 = this.getDocumentStyleSheets();
      for (j = 0, len = ref2.length; j < len; j++) {
        stylesheet = ref2[j];
        if (stylesheet.rules != null) {
          ref3 = stylesheet.rules;
          for (k = 0, len1 = ref3.length; k < len1; k++) {
            rule = ref3[k];
            if (((ref4 = rule.selectorText) != null ? ref4.match(ruleRegExp) : void 0) != null) {
              markdowPreviewRules.push(rule.cssText);
            }
          }
        }
      }
      return markdowPreviewRules.concat(this.getTextEditorStyles()).join('\n').replace(/atom-text-editor/g, 'pre.editor-colors').replace(/:host/g, '.host').replace(cssUrlRefExp, function(match, assetsName, offset, string) {
        var assetPath, base64Data, originalData;
        assetPath = path.join(__dirname, '../assets', assetsName);
        originalData = fs.readFileSync(assetPath, 'binary');
        base64Data = new Buffer(originalData, 'binary').toString('base64');
        return "url('data:image/jpeg;base64," + base64Data + "')";
      });
    };

    MarkdownPreviewView.prototype.showError = function(result) {
      var failureMessage;
      failureMessage = result != null ? result.message : void 0;
      return this.html($$$(function() {
        this.h2('Previewing Markdown Failed');
        if (failureMessage != null) {
          return this.h3(failureMessage);
        }
      }));
    };

    MarkdownPreviewView.prototype.showLoading = function() {
      this.loading = true;
      return this.html($$$(function() {
        return this.div({
          "class": 'markdown-spinner'
        }, 'Loading Markdown\u2026');
      }));
    };

    MarkdownPreviewView.prototype.copyToClipboard = function() {
      var selectedNode, selectedText, selection;
      if (this.loading) {
        return false;
      }
      selection = window.getSelection();
      selectedText = selection.toString();
      selectedNode = selection.baseNode;
      if (selectedText && (selectedNode != null) && (this[0] === selectedNode || $.contains(this[0], selectedNode))) {
        return false;
      }
      this.getHTML(function(error, html) {
        if (error != null) {
          return console.warn('Copying Markdown as HTML failed', error);
        } else {
          return atom.clipboard.write(html);
        }
      });
      return true;
    };

    MarkdownPreviewView.prototype.saveAs = function() {
      var filePath, htmlFilePath, projectPath, title;
      if (this.loading) {
        return;
      }
      filePath = this.getPath();
      title = 'Markdown to HTML';
      if (filePath) {
        title = path.parse(filePath).name;
        filePath += '.html';
      } else {
        filePath = 'untitled.md.html';
        if (projectPath = atom.project.getPaths()[0]) {
          filePath = path.join(projectPath, filePath);
        }
      }
      if (htmlFilePath = atom.showSaveDialogSync(filePath)) {
        return this.getHTML((function(_this) {
          return function(error, htmlBody) {
            var html, mathjaxScript;
            if (error != null) {
              return console.warn('Saving Markdown as HTML failed', error);
            } else {
              if (_this.renderLaTeX) {
                mathjaxScript = "\n<script type=\"text/x-mathjax-config\">\n  MathJax.Hub.Config({\n    jax: [\"input/TeX\",\"output/HTML-CSS\"],\n    extensions: [],\n    TeX: {\n      extensions: [\"AMSmath.js\",\"AMSsymbols.js\",\"noErrors.js\",\"noUndefined.js\"]\n    },\n    showMathMenu: false\n  });\n</script>\n<script type=\"text/javascript\" src=\"https://cdn.mathjax.org/mathjax/latest/MathJax.js\">\n</script>";
              } else {
                mathjaxScript = "";
              }
              html = ("<!DOCTYPE html>\n<html>\n  <head>\n      <meta charset=\"utf-8\" />\n      <title>" + title + "</title>" + mathjaxScript + "\n      <style>" + (_this.getMarkdownPreviewCSS()) + "</style>\n  </head>\n  <body class='markdown-preview'>" + htmlBody + "</body>\n</html>") + "\n";
              fs.writeFileSync(htmlFilePath, html);
              return atom.workspace.open(htmlFilePath);
            }
          };
        })(this));
      }
    };

    MarkdownPreviewView.prototype.isEqual = function(other) {
      return this[0] === (other != null ? other[0] : void 0);
    };

    MarkdownPreviewView.prototype.bubbleToContainerElement = function(element) {
      var parent, testElement;
      testElement = element;
      while (testElement !== document.body) {
        parent = testElement.parentNode;
        if (parent.classList.contains('MathJax_Display')) {
          return parent.parentNode;
        }
        if (parent.classList.contains('atom-text-editor')) {
          return parent;
        }
        testElement = parent;
      }
      return element;
    };

    MarkdownPreviewView.prototype.bubbleToContainerToken = function(pathToToken) {
      var i, j, ref2;
      for (i = j = 0, ref2 = pathToToken.length - 1; j <= ref2; i = j += 1) {
        if (pathToToken[i].tag === 'table') {
          return pathToToken.slice(0, i + 1);
        }
      }
      return pathToToken;
    };

    MarkdownPreviewView.prototype.encodeTag = function(element) {
      if (element.classList.contains('math')) {
        return 'math';
      }
      if (element.classList.contains('atom-text-editor')) {
        return 'code';
      }
      return element.tagName.toLowerCase();
    };

    MarkdownPreviewView.prototype.decodeTag = function(token) {
      if (token.tag === 'math') {
        return 'span';
      }
      if (token.tag === 'code') {
        return 'span';
      }
      if (token.tag === "") {
        return null;
      }
      return token.tag;
    };

    MarkdownPreviewView.prototype.getPathToElement = function(element) {
      var j, len, pathToElement, sibling, siblingTag, siblings, siblingsCount, tag;
      if (element.classList.contains('markdown-preview')) {
        return [
          {
            tag: 'div',
            index: 0
          }
        ];
      }
      element = this.bubbleToContainerElement(element);
      tag = this.encodeTag(element);
      siblings = element.parentNode.childNodes;
      siblingsCount = 0;
      for (j = 0, len = siblings.length; j < len; j++) {
        sibling = siblings[j];
        siblingTag = sibling.nodeType === 1 ? this.encodeTag(sibling) : null;
        if (sibling === element) {
          pathToElement = this.getPathToElement(element.parentNode);
          pathToElement.push({
            tag: tag,
            index: siblingsCount
          });
          return pathToElement;
        } else if (siblingTag === tag) {
          siblingsCount++;
        }
      }
    };

    MarkdownPreviewView.prototype.syncSource = function(text, element) {
      var finalToken, j, len, level, pathToElement, ref2, token, tokens;
      pathToElement = this.getPathToElement(element);
      pathToElement.shift();
      pathToElement.shift();
      if (!pathToElement.length) {
        return;
      }
      if (markdownIt == null) {
        markdownIt = require('./markdown-it-helper');
      }
      tokens = markdownIt.getTokens(text, this.renderLaTeX);
      finalToken = null;
      level = 0;
      for (j = 0, len = tokens.length; j < len; j++) {
        token = tokens[j];
        if (token.level < level) {
          break;
        }
        if (token.hidden) {
          continue;
        }
        if (token.tag === pathToElement[0].tag && token.level === level) {
          if (token.nesting === 1) {
            if (pathToElement[0].index === 0) {
              if (token.map != null) {
                finalToken = token;
              }
              pathToElement.shift();
              level++;
            } else {
              pathToElement[0].index--;
            }
          } else if (token.nesting === 0 && ((ref2 = token.tag) === 'math' || ref2 === 'code' || ref2 === 'hr')) {
            if (pathToElement[0].index === 0) {
              finalToken = token;
              break;
            } else {
              pathToElement[0].index--;
            }
          }
        }
        if (pathToElement.length === 0) {
          break;
        }
      }
      if (finalToken != null) {
        this.editor.setCursorBufferPosition([finalToken.map[0], 0]);
        return finalToken.map[0];
      } else {
        return null;
      }
    };

    MarkdownPreviewView.prototype.getPathToToken = function(tokens, line) {
      var j, len, level, pathToToken, ref2, ref3, token, tokenTagCount;
      pathToToken = [];
      tokenTagCount = [];
      level = 0;
      for (j = 0, len = tokens.length; j < len; j++) {
        token = tokens[j];
        if (token.level < level) {
          break;
        }
        if (token.hidden) {
          continue;
        }
        if (token.nesting === -1) {
          continue;
        }
        token.tag = this.decodeTag(token);
        if (token.tag == null) {
          continue;
        }
        if ((token.map != null) && line >= token.map[0] && line <= (token.map[1] - 1)) {
          if (token.nesting === 1) {
            pathToToken.push({
              tag: token.tag,
              index: (ref2 = tokenTagCount[token.tag]) != null ? ref2 : 0
            });
            tokenTagCount = [];
            level++;
          } else if (token.nesting === 0) {
            pathToToken.push({
              tag: token.tag,
              index: (ref3 = tokenTagCount[token.tag]) != null ? ref3 : 0
            });
            break;
          }
        } else if (token.level === level) {
          if (tokenTagCount[token.tag] != null) {
            tokenTagCount[token.tag]++;
          } else {
            tokenTagCount[token.tag] = 1;
          }
        }
      }
      pathToToken = this.bubbleToContainerToken(pathToToken);
      return pathToToken;
    };

    MarkdownPreviewView.prototype.syncPreview = function(text, line) {
      var candidateElement, element, j, len, maxScrollTop, pathToToken, token, tokens;
      if (markdownIt == null) {
        markdownIt = require('./markdown-it-helper');
      }
      tokens = markdownIt.getTokens(text, this.renderLaTeX);
      pathToToken = this.getPathToToken(tokens, line);
      element = this.find('.update-preview').eq(0);
      for (j = 0, len = pathToToken.length; j < len; j++) {
        token = pathToToken[j];
        candidateElement = element.children(token.tag).eq(token.index);
        if (candidateElement.length !== 0) {
          element = candidateElement;
        } else {
          break;
        }
      }
      if (element[0].classList.contains('update-preview')) {
        return null;
      }
      if (!element[0].classList.contains('update-preview')) {
        element[0].scrollIntoView();
      }
      maxScrollTop = this.element.scrollHeight - this.innerHeight();
      if (!(this.scrollTop() >= maxScrollTop)) {
        this.element.scrollTop -= this.innerHeight() / 4;
      }
      element.addClass('flash');
      setTimeout((function() {
        return element.removeClass('flash');
      }), 1000);
      return element[0];
    };

    return MarkdownPreviewView;

  })(ScrollView);

  if (Grim.includeDeprecatedAPIs) {
    MarkdownPreviewView.prototype.on = function(eventName) {
      if (eventName === 'markdown-preview:markdown-changed') {
        Grim.deprecate("Use MarkdownPreviewView::onDidChangeMarkdown instead of the 'markdown-preview:markdown-changed' jQuery event");
      }
      return MarkdownPreviewView.__super__.on.apply(this, arguments);
    };
  }

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL2hvbWUvbWFyY3VzLy5hdG9tL3BhY2thZ2VzL21hcmtkb3duLXByZXZpZXctcGx1cy9saWIvbWFya2Rvd24tcHJldmlldy12aWV3LmNvZmZlZSJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQUFBLE1BQUEsd0tBQUE7SUFBQTs7OztFQUFBLElBQUEsR0FBTyxPQUFBLENBQVEsTUFBUjs7RUFFUCxNQUE2QyxPQUFBLENBQVEsTUFBUixDQUE3QyxFQUFDLHFCQUFELEVBQVUsMkJBQVYsRUFBc0I7O0VBQ3RCLE9BQXVCLE9BQUEsQ0FBUSxzQkFBUixDQUF2QixFQUFDLFVBQUQsRUFBSSxjQUFKLEVBQVM7O0VBQ1QsSUFBQSxHQUFPLE9BQUEsQ0FBUSxNQUFSOztFQUNQLENBQUEsR0FBSSxPQUFBLENBQVEsaUJBQVI7O0VBQ0osRUFBQSxHQUFLLE9BQUEsQ0FBUSxTQUFSOztFQUNKLE9BQVEsT0FBQSxDQUFRLE1BQVI7O0VBRVQsUUFBQSxHQUFXLE9BQUEsQ0FBUSxZQUFSOztFQUNYLGFBQUEsR0FBZ0IsT0FBQSxDQUFRLGtCQUFSOztFQUNoQixVQUFBLEdBQWE7O0VBQ2IsWUFBQSxHQUFlOztFQUVmLE1BQU0sQ0FBQyxPQUFQLEdBQ007OztJQUNKLG1CQUFDLENBQUEsT0FBRCxHQUFVLFNBQUE7YUFDUixJQUFDLENBQUEsR0FBRCxDQUFLO1FBQUEsQ0FBQSxLQUFBLENBQUEsRUFBTyxzQ0FBUDtRQUErQyxRQUFBLEVBQVUsQ0FBQyxDQUExRDtPQUFMLEVBQWtFLENBQUEsU0FBQSxLQUFBO2VBQUEsU0FBQTtpQkFFaEUsS0FBQyxDQUFBLEdBQUQsQ0FBSztZQUFBLENBQUEsS0FBQSxDQUFBLEVBQU8sZ0JBQVA7V0FBTDtRQUZnRTtNQUFBLENBQUEsQ0FBQSxDQUFBLElBQUEsQ0FBbEU7SUFEUTs7SUFLRyw2QkFBQyxHQUFEO01BQUUsSUFBQyxDQUFBLGVBQUEsVUFBVSxJQUFDLENBQUEsZUFBQTs7Ozs7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QUFyQixDQUE4QixnQkFBOUIsQ0FBbkM7UUFBQSxPQUFRLENBQUEsQ0FBQSxDQUFFLENBQUMsY0FBWCxDQUFBLEVBQUE7O01BQ0EsWUFBQSxHQUFlLElBQUMsQ0FBQSxPQUFPLENBQUMsWUFBVCxHQUF3QixJQUFDLENBQUEsV0FBRCxDQUFBO01BQ3ZDLElBQUEsQ0FBQSxDQUE4QyxJQUFDLENBQUEsU0FBRCxDQUFBLENBQUEsSUFBZ0IsWUFBOUQsQ0FBQTtRQUFBLElBQUMsQ0FBQSxPQUFPLENBQUMsU0FBVCxJQUFzQixJQUFDLENBQUEsV0FBRCxDQUFBLENBQUEsR0FBZSxFQUFyQzs7TUFFQSxPQUFPLENBQUMsUUFBUixDQUFpQixPQUFqQjtNQUNBLFVBQUEsQ0FBVyxDQUFFLFNBQUE7ZUFBRyxPQUFPLENBQUMsV0FBUixDQUFvQixPQUFwQjtNQUFILENBQUYsQ0FBWCxFQUFnRCxJQUFoRDtBQUVBLGFBQU8sT0FBUSxDQUFBLENBQUE7SUFyQko7Ozs7S0F6aEJtQjs7RUFnakJsQyxJQUFHLElBQUksQ0FBQyxxQkFBUjtJQUNFLG1CQUFtQixDQUFBLFNBQUUsQ0FBQSxFQUFyQixHQUEwQixTQUFDLFNBQUQ7TUFDeEIsSUFBRyxTQUFBLEtBQWEsbUNBQWhCO1FBQ0UsSUFBSSxDQUFDLFNBQUwsQ0FBZSw4R0FBZixFQURGOzthQUVBLDZDQUFBLFNBQUE7SUFId0IsRUFENUI7O0FBL2pCQSIsInNvdXJjZXNDb250ZW50IjpbInBhdGggPSByZXF1aXJlICdwYXRoJ1xuXG57RW1pdHRlciwgRGlzcG9zYWJsZSwgQ29tcG9zaXRlRGlzcG9zYWJsZX0gPSByZXF1aXJlICdhdG9tJ1xueyQsICQkJCwgU2Nyb2xsVmlld30gPSByZXF1aXJlICdhdG9tLXNwYWNlLXBlbi12aWV3cydcbkdyaW0gPSByZXF1aXJlICdncmltJ1xuXyA9IHJlcXVpcmUgJ3VuZGVyc2NvcmUtcGx1cydcbmZzID0gcmVxdWlyZSAnZnMtcGx1cydcbntGaWxlfSA9IHJlcXVpcmUgJ2F0b20nXG5cbnJlbmRlcmVyID0gcmVxdWlyZSAnLi9yZW5kZXJlcidcblVwZGF0ZVByZXZpZXcgPSByZXF1aXJlICcuL3VwZGF0ZS1wcmV2aWV3J1xubWFya2Rvd25JdCA9IG51bGwgIyBEZWZlciB1bnRpbCB1c2VkXG5pbWFnZVdhdGNoZXIgPSBudWxsXG5cbm1vZHVsZS5leHBvcnRzID1cbmNsYXNzIE1hcmtkb3duUHJldmlld1ZpZXcgZXh0ZW5kcyBTY3JvbGxWaWV3XG4gIEBjb250ZW50OiAtPlxuICAgIEBkaXYgY2xhc3M6ICdtYXJrZG93bi1wcmV2aWV3IG5hdGl2ZS1rZXktYmluZGluZ3MnLCB0YWJpbmRleDogLTEsID0+XG4gICAgICAjIElmIHlvdSBkb250IGV4cGxpY2l0bHkgZGVjbGFyZSBhIGNsYXNzIHRoZW4gdGhlIGVsZW1lbnRzIHdvbnQgYmUgY3JlYXRlZFxuICAgICAgQGRpdiBjbGFzczogJ3VwZGF0ZS1wcmV2aWV3J1xuXG4gIGNvbnN0cnVjdG9yOiAoe0BlZGl0b3JJZCwgQGZpbGVQYXRofSkgLT5cbiAgICBAdXBkYXRlUHJldmlldyAgPSBudWxsXG4gICAgQHJlbmRlckxhVGVYICAgID0gYXRvbS5jb25maWcuZ2V0ICdtYXJrZG93bi1wcmV2aWV3LXBsdXMuZW5hYmxlTGF0ZXhSZW5kZXJpbmdCeURlZmF1bHQnXG4gICAgc3VwZXJcbiAgICBAZW1pdHRlciA9IG5ldyBFbWl0dGVyXG4gICAgQGRpc3Bvc2FibGVzID0gbmV3IENvbXBvc2l0ZURpc3Bvc2FibGVcbiAgICBAbG9hZGVkID0gdHJ1ZSAjIERvIG5vdCBzaG93IHRoZSBsb2FkaW5nIHNwaW5ub3Igb24gaW5pdGlhbCBsb2FkXG5cbiAgYXR0YWNoZWQ6IC0+XG4gICAgcmV0dXJuIGlmIEBpc0F0dGFjaGVkXG4gICAgQGlzQXR0YWNoZWQgPSB0cnVlXG5cbiAgICBpZiBAZWRpdG9ySWQ/XG4gICAgICBAcmVzb2x2ZUVkaXRvcihAZWRpdG9ySWQpXG4gICAgZWxzZVxuICAgICAgaWYgYXRvbS53b3Jrc3BhY2U/XG4gICAgICAgIEBzdWJzY3JpYmVUb0ZpbGVQYXRoKEBmaWxlUGF0aClcbiAgICAgIGVsc2VcbiAgICAgICAgQGRpc3Bvc2FibGVzLmFkZCBhdG9tLnBhY2thZ2VzLm9uRGlkQWN0aXZhdGVJbml0aWFsUGFja2FnZXMgPT5cbiAgICAgICAgICBAc3Vic2NyaWJlVG9GaWxlUGF0aChAZmlsZVBhdGgpXG5cbiAgc2VyaWFsaXplOiAtPlxuICAgIGRlc2VyaWFsaXplcjogJ01hcmtkb3duUHJldmlld1ZpZXcnXG4gICAgZmlsZVBhdGg6IEBnZXRQYXRoKCkgPyBAZmlsZVBhdGhcbiAgICBlZGl0b3JJZDogQGVkaXRvcklkXG5cbiAgZGVzdHJveTogLT5cbiAgICBpbWFnZVdhdGNoZXIgPz0gcmVxdWlyZSAnLi9pbWFnZS13YXRjaC1oZWxwZXInXG4gICAgaW1hZ2VXYXRjaGVyLnJlbW92ZUZpbGUoQGdldFBhdGgoKSlcbiAgICBAZGlzcG9zYWJsZXMuZGlzcG9zZSgpXG5cbiAgb25EaWRDaGFuZ2VUaXRsZTogKGNhbGxiYWNrKSAtPlxuICAgIEBlbWl0dGVyLm9uICdkaWQtY2hhbmdlLXRpdGxlJywgY2FsbGJhY2tcblxuICBvbkRpZENoYW5nZU1vZGlmaWVkOiAoY2FsbGJhY2spIC0+XG4gICAgIyBObyBvcCB0byBzdXBwcmVzcyBkZXByZWNhdGlvbiB3YXJuaW5nXG4gICAgbmV3IERpc3Bvc2FibGVcblxuICBvbkRpZENoYW5nZU1hcmtkb3duOiAoY2FsbGJhY2spIC0+XG4gICAgQGVtaXR0ZXIub24gJ2RpZC1jaGFuZ2UtbWFya2Rvd24nLCBjYWxsYmFja1xuXG4gIHN1YnNjcmliZVRvRmlsZVBhdGg6IChmaWxlUGF0aCkgLT5cbiAgICBAZmlsZSA9IG5ldyBGaWxlKGZpbGVQYXRoKVxuICAgIEBlbWl0dGVyLmVtaXQgJ2RpZC1jaGFuZ2UtdGl0bGUnXG4gICAgQGhhbmRsZUV2ZW50cygpXG4gICAgQHJlbmRlck1hcmtkb3duKClcblxuICByZXNvbHZlRWRpdG9yOiAoZWRpdG9ySWQpIC0+XG4gICAgcmVzb2x2ZSA9ID0+XG4gICAgICBAZWRpdG9yID0gQGVkaXRvckZvcklkKGVkaXRvcklkKVxuXG4gICAgICBpZiBAZWRpdG9yP1xuICAgICAgICBAZW1pdHRlci5lbWl0ICdkaWQtY2hhbmdlLXRpdGxlJyBpZiBAZWRpdG9yP1xuICAgICAgICBAaGFuZGxlRXZlbnRzKClcbiAgICAgICAgQHJlbmRlck1hcmtkb3duKClcbiAgICAgIGVsc2VcbiAgICAgICAgIyBUaGUgZWRpdG9yIHRoaXMgcHJldmlldyB3YXMgY3JlYXRlZCBmb3IgaGFzIGJlZW4gY2xvc2VkIHNvIGNsb3NlXG4gICAgICAgICMgdGhpcyBwcmV2aWV3IHNpbmNlIGEgcHJldmlldyBjYW5ub3QgYmUgcmVuZGVyZWQgd2l0aG91dCBhbiBlZGl0b3JcbiAgICAgICAgYXRvbS53b3Jrc3BhY2U/LnBhbmVGb3JJdGVtKHRoaXMpPy5kZXN0cm95SXRlbSh0aGlzKVxuXG4gICAgaWYgYXRvbS53b3Jrc3BhY2U/XG4gICAgICByZXNvbHZlKClcbiAgICBlbHNlXG4gICAgICBAZGlzcG9zYWJsZXMuYWRkIGF0b20ucGFja2FnZXMub25EaWRBY3RpdmF0ZUluaXRpYWxQYWNrYWdlcyhyZXNvbHZlKVxuXG4gIGVkaXRvckZvcklkOiAoZWRpdG9ySWQpIC0+XG4gICAgZm9yIGVkaXRvciBpbiBhdG9tLndvcmtzcGFjZS5nZXRUZXh0RWRpdG9ycygpXG4gICAgICByZXR1cm4gZWRpdG9yIGlmIGVkaXRvci5pZD8udG9TdHJpbmcoKSBpcyBlZGl0b3JJZC50b1N0cmluZygpXG4gICAgbnVsbFxuXG4gIGhhbmRsZUV2ZW50czogLT5cbiAgICBAZGlzcG9zYWJsZXMuYWRkIGF0b20uZ3JhbW1hcnMub25EaWRBZGRHcmFtbWFyID0+IF8uZGVib3VuY2UoKD0+IEByZW5kZXJNYXJrZG93bigpKSwgMjUwKVxuICAgIEBkaXNwb3NhYmxlcy5hZGQgYXRvbS5ncmFtbWFycy5vbkRpZFVwZGF0ZUdyYW1tYXIgXy5kZWJvdW5jZSgoPT4gQHJlbmRlck1hcmtkb3duKCkpLCAyNTApXG5cbiAgICBhdG9tLmNvbW1hbmRzLmFkZCBAZWxlbWVudCxcbiAgICAgICdjb3JlOm1vdmUtdXAnOiA9PlxuICAgICAgICBAc2Nyb2xsVXAoKVxuICAgICAgJ2NvcmU6bW92ZS1kb3duJzogPT5cbiAgICAgICAgQHNjcm9sbERvd24oKVxuICAgICAgJ2NvcmU6c2F2ZS1hcyc6IChldmVudCkgPT5cbiAgICAgICAgZXZlbnQuc3RvcFByb3BhZ2F0aW9uKClcbiAgICAgICAgQHNhdmVBcygpXG4gICAgICAnY29yZTpjb3B5JzogKGV2ZW50KSA9PlxuICAgICAgICBldmVudC5zdG9wUHJvcGFnYXRpb24oKSBpZiBAY29weVRvQ2xpcGJvYXJkKClcbiAgICAgICdtYXJrZG93bi1wcmV2aWV3LXBsdXM6em9vbS1pbic6ID0+XG4gICAgICAgIHpvb21MZXZlbCA9IHBhcnNlRmxvYXQoQGNzcygnem9vbScpKSBvciAxXG4gICAgICAgIEBjc3MoJ3pvb20nLCB6b29tTGV2ZWwgKyAuMSlcbiAgICAgICdtYXJrZG93bi1wcmV2aWV3LXBsdXM6em9vbS1vdXQnOiA9PlxuICAgICAgICB6b29tTGV2ZWwgPSBwYXJzZUZsb2F0KEBjc3MoJ3pvb20nKSkgb3IgMVxuICAgICAgICBAY3NzKCd6b29tJywgem9vbUxldmVsIC0gLjEpXG4gICAgICAnbWFya2Rvd24tcHJldmlldy1wbHVzOnJlc2V0LXpvb20nOiA9PlxuICAgICAgICBAY3NzKCd6b29tJywgMSlcbiAgICAgICdtYXJrZG93bi1wcmV2aWV3LXBsdXM6c3luYy1zb3VyY2UnOiAoZXZlbnQpID0+XG4gICAgICAgIEBnZXRNYXJrZG93blNvdXJjZSgpLnRoZW4gKHNvdXJjZSkgPT5cbiAgICAgICAgICByZXR1cm4gdW5sZXNzIHNvdXJjZT9cbiAgICAgICAgICBAc3luY1NvdXJjZSBzb3VyY2UsIGV2ZW50LnRhcmdldFxuXG4gICAgY2hhbmdlSGFuZGxlciA9ID0+XG4gICAgICBAcmVuZGVyTWFya2Rvd24oKVxuXG4gICAgICAjIFRPRE86IFJlbW92ZSBwYW5lRm9yVVJJIGNhbGwgd2hlbiA6OnBhbmVGb3JJdGVtIGlzIHJlbGVhc2VkXG4gICAgICBwYW5lID0gYXRvbS53b3Jrc3BhY2UucGFuZUZvckl0ZW0/KHRoaXMpID8gYXRvbS53b3Jrc3BhY2UucGFuZUZvclVSSShAZ2V0VVJJKCkpXG4gICAgICBpZiBwYW5lPyBhbmQgcGFuZSBpc250IGF0b20ud29ya3NwYWNlLmdldEFjdGl2ZVBhbmUoKVxuICAgICAgICBwYW5lLmFjdGl2YXRlSXRlbSh0aGlzKVxuXG4gICAgaWYgQGZpbGU/XG4gICAgICBAZGlzcG9zYWJsZXMuYWRkIEBmaWxlLm9uRGlkQ2hhbmdlKGNoYW5nZUhhbmRsZXIpXG4gICAgZWxzZSBpZiBAZWRpdG9yP1xuICAgICAgQGRpc3Bvc2FibGVzLmFkZCBAZWRpdG9yLmdldEJ1ZmZlcigpLm9uRGlkU3RvcENoYW5naW5nIC0+XG4gICAgICAgIGNoYW5nZUhhbmRsZXIoKSBpZiBhdG9tLmNvbmZpZy5nZXQgJ21hcmtkb3duLXByZXZpZXctcGx1cy5saXZlVXBkYXRlJ1xuICAgICAgQGRpc3Bvc2FibGVzLmFkZCBAZWRpdG9yLm9uRGlkQ2hhbmdlUGF0aCA9PiBAZW1pdHRlci5lbWl0ICdkaWQtY2hhbmdlLXRpdGxlJ1xuICAgICAgQGRpc3Bvc2FibGVzLmFkZCBAZWRpdG9yLmdldEJ1ZmZlcigpLm9uRGlkU2F2ZSAtPlxuICAgICAgICBjaGFuZ2VIYW5kbGVyKCkgdW5sZXNzIGF0b20uY29uZmlnLmdldCAnbWFya2Rvd24tcHJldmlldy1wbHVzLmxpdmVVcGRhdGUnXG4gICAgICBAZGlzcG9zYWJsZXMuYWRkIEBlZGl0b3IuZ2V0QnVmZmVyKCkub25EaWRSZWxvYWQgLT5cbiAgICAgICAgY2hhbmdlSGFuZGxlcigpIHVubGVzcyBhdG9tLmNvbmZpZy5nZXQgJ21hcmtkb3duLXByZXZpZXctcGx1cy5saXZlVXBkYXRlJ1xuICAgICAgQGRpc3Bvc2FibGVzLmFkZCBhdG9tLmNvbW1hbmRzLmFkZCggYXRvbS52aWV3cy5nZXRWaWV3KEBlZGl0b3IpLFxuICAgICAgICAnbWFya2Rvd24tcHJldmlldy1wbHVzOnN5bmMtcHJldmlldyc6IChldmVudCkgPT5cbiAgICAgICAgICBAZ2V0TWFya2Rvd25Tb3VyY2UoKS50aGVuIChzb3VyY2UpID0+XG4gICAgICAgICAgICByZXR1cm4gdW5sZXNzIHNvdXJjZT9cbiAgICAgICAgICAgIEBzeW5jUHJldmlldyBzb3VyY2UsIEBlZGl0b3IuZ2V0Q3Vyc29yQnVmZmVyUG9zaXRpb24oKS5yb3cgKVxuXG4gICAgQGRpc3Bvc2FibGVzLmFkZCBhdG9tLmNvbmZpZy5vbkRpZENoYW5nZSAnbWFya2Rvd24tcHJldmlldy1wbHVzLmJyZWFrT25TaW5nbGVOZXdsaW5lJywgY2hhbmdlSGFuZGxlclxuXG4gICAgIyBUb2dnbGUgTGFUZVggcmVuZGVyaW5nIGlmIGZvY3VzIGlzIG9uIHByZXZpZXcgcGFuZSBvciBhc3NvY2lhdGVkIGVkaXRvci5cbiAgICBAZGlzcG9zYWJsZXMuYWRkIGF0b20uY29tbWFuZHMuYWRkICdhdG9tLXdvcmtzcGFjZScsXG4gICAgICAnbWFya2Rvd24tcHJldmlldy1wbHVzOnRvZ2dsZS1yZW5kZXItbGF0ZXgnOiA9PlxuICAgICAgICBpZiAoYXRvbS53b3Jrc3BhY2UuZ2V0QWN0aXZlUGFuZUl0ZW0oKSBpcyB0aGlzKSBvciAoYXRvbS53b3Jrc3BhY2UuZ2V0QWN0aXZlVGV4dEVkaXRvcigpIGlzIEBlZGl0b3IpXG4gICAgICAgICAgQHJlbmRlckxhVGVYID0gbm90IEByZW5kZXJMYVRlWFxuICAgICAgICAgIGNoYW5nZUhhbmRsZXIoKVxuICAgICAgICByZXR1cm5cblxuICAgIEBkaXNwb3NhYmxlcy5hZGQgYXRvbS5jb25maWcub2JzZXJ2ZSAnbWFya2Rvd24tcHJldmlldy1wbHVzLnVzZUdpdEh1YlN0eWxlJywgKHVzZUdpdEh1YlN0eWxlKSA9PlxuICAgICAgaWYgdXNlR2l0SHViU3R5bGVcbiAgICAgICAgQGVsZW1lbnQuc2V0QXR0cmlidXRlKCdkYXRhLXVzZS1naXRodWItc3R5bGUnLCAnJylcbiAgICAgIGVsc2VcbiAgICAgICAgQGVsZW1lbnQucmVtb3ZlQXR0cmlidXRlKCdkYXRhLXVzZS1naXRodWItc3R5bGUnKVxuXG4gIHJlbmRlck1hcmtkb3duOiAtPlxuICAgIEBzaG93TG9hZGluZygpIHVubGVzcyBAbG9hZGVkXG4gICAgQGdldE1hcmtkb3duU291cmNlKCkudGhlbiAoc291cmNlKSA9PiBAcmVuZGVyTWFya2Rvd25UZXh0KHNvdXJjZSkgaWYgc291cmNlP1xuXG4gIHJlZnJlc2hJbWFnZXM6IChvbGRzcmMpIC0+XG4gICAgaW1ncyA9IEBlbGVtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoXCJpbWdbc3JjXVwiKVxuICAgIGltYWdlV2F0Y2hlciA/PSByZXF1aXJlICcuL2ltYWdlLXdhdGNoLWhlbHBlcidcbiAgICBmb3IgaW1nIGluIGltZ3NcbiAgICAgIHNyYyA9IGltZy5nZXRBdHRyaWJ1dGUoJ3NyYycpXG4gICAgICBtYXRjaCA9IHNyYy5tYXRjaCgvXiguKilcXD92PShcXGQrKSQvKVxuICAgICAgW3NyYywgb3ZdID0gbWF0Y2g/LnNsaWNlPygxKSA/IFtzcmNdXG4gICAgICBpZiBzcmMgaXMgb2xkc3JjXG4gICAgICAgIG92ID0gcGFyc2VJbnQob3YpIGlmIG92P1xuICAgICAgICB2ID0gaW1hZ2VXYXRjaGVyLmdldFZlcnNpb24oc3JjLCBAZ2V0UGF0aCgpKVxuICAgICAgICBpZiB2IGlzbnQgb3ZcbiAgICAgICAgICBpZiB2XG4gICAgICAgICAgICBpbWcuc3JjID0gXCIje3NyY30/dj0je3Z9XCJcbiAgICAgICAgICBlbHNlXG4gICAgICAgICAgICBpbWcuc3JjID0gXCIje3NyY31cIlxuXG4gIGdldE1hcmtkb3duU291cmNlOiAtPlxuICAgIGlmIEBmaWxlPy5nZXRQYXRoKClcbiAgICAgIEBmaWxlLnJlYWQoKVxuICAgIGVsc2UgaWYgQGVkaXRvcj9cbiAgICAgIFByb21pc2UucmVzb2x2ZShAZWRpdG9yLmdldFRleHQoKSlcbiAgICBlbHNlXG4gICAgICBQcm9taXNlLnJlc29sdmUobnVsbClcblxuICBnZXRIVE1MOiAoY2FsbGJhY2spIC0+XG4gICAgQGdldE1hcmtkb3duU291cmNlKCkudGhlbiAoc291cmNlKSA9PlxuICAgICAgcmV0dXJuIHVubGVzcyBzb3VyY2U/XG5cbiAgICAgIHJlbmRlcmVyLnRvSFRNTCBzb3VyY2UsIEBnZXRQYXRoKCksIEBnZXRHcmFtbWFyKCksIEByZW5kZXJMYVRlWCwgZmFsc2UsIGNhbGxiYWNrXG5cbiAgcmVuZGVyTWFya2Rvd25UZXh0OiAodGV4dCkgLT5cbiAgICByZW5kZXJlci50b0RPTUZyYWdtZW50IHRleHQsIEBnZXRQYXRoKCksIEBnZXRHcmFtbWFyKCksIEByZW5kZXJMYVRlWCwgKGVycm9yLCBkb21GcmFnbWVudCkgPT5cbiAgICAgIGlmIGVycm9yXG4gICAgICAgIEBzaG93RXJyb3IoZXJyb3IpXG4gICAgICBlbHNlXG4gICAgICAgIEBsb2FkaW5nID0gZmFsc2VcbiAgICAgICAgQGxvYWRlZCA9IHRydWVcbiAgICAgICAgIyBkaXYudXBkYXRlLXByZXZpZXcgY3JlYXRlZCBhZnRlciBjb25zdHJ1Y3RvciBzdCBVcGRhdGVQcmV2aWV3IGNhbm5vdFxuICAgICAgICAjIGJlIGluc3RhbmNlZCBpbiB0aGUgY29uc3RydWN0b3JcbiAgICAgICAgdW5sZXNzIEB1cGRhdGVQcmV2aWV3XG4gICAgICAgICAgQHVwZGF0ZVByZXZpZXcgPSBuZXcgVXBkYXRlUHJldmlldyhAZmluZChcImRpdi51cGRhdGUtcHJldmlld1wiKVswXSlcbiAgICAgICAgQHVwZGF0ZVByZXZpZXcudXBkYXRlKGRvbUZyYWdtZW50LCBAcmVuZGVyTGFUZVgpXG4gICAgICAgIEBlbWl0dGVyLmVtaXQgJ2RpZC1jaGFuZ2UtbWFya2Rvd24nXG4gICAgICAgIEBvcmlnaW5hbFRyaWdnZXIoJ21hcmtkb3duLXByZXZpZXctcGx1czptYXJrZG93bi1jaGFuZ2VkJylcblxuICBnZXRUaXRsZTogLT5cbiAgICBpZiBAZmlsZT9cbiAgICAgIFwiI3twYXRoLmJhc2VuYW1lKEBnZXRQYXRoKCkpfSBQcmV2aWV3XCJcbiAgICBlbHNlIGlmIEBlZGl0b3I/XG4gICAgICBcIiN7QGVkaXRvci5nZXRUaXRsZSgpfSBQcmV2aWV3XCJcbiAgICBlbHNlXG4gICAgICBcIk1hcmtkb3duIFByZXZpZXdcIlxuXG4gIGdldEljb25OYW1lOiAtPlxuICAgIFwibWFya2Rvd25cIlxuXG4gIGdldFVSSTogLT5cbiAgICBpZiBAZmlsZT9cbiAgICAgIFwibWFya2Rvd24tcHJldmlldy1wbHVzOi8vI3tAZ2V0UGF0aCgpfVwiXG4gICAgZWxzZVxuICAgICAgXCJtYXJrZG93bi1wcmV2aWV3LXBsdXM6Ly9lZGl0b3IvI3tAZWRpdG9ySWR9XCJcblxuICBnZXRQYXRoOiAtPlxuICAgIGlmIEBmaWxlP1xuICAgICAgQGZpbGUuZ2V0UGF0aCgpXG4gICAgZWxzZSBpZiBAZWRpdG9yP1xuICAgICAgQGVkaXRvci5nZXRQYXRoKClcblxuICBnZXRHcmFtbWFyOiAtPlxuICAgIEBlZGl0b3I/LmdldEdyYW1tYXIoKVxuXG4gIGdldERvY3VtZW50U3R5bGVTaGVldHM6IC0+ICMgVGhpcyBmdW5jdGlvbiBleGlzdHMgc28gd2UgY2FuIHN0dWIgaXRcbiAgICBkb2N1bWVudC5zdHlsZVNoZWV0c1xuXG4gIGdldFRleHRFZGl0b3JTdHlsZXM6IC0+XG5cbiAgICB0ZXh0RWRpdG9yU3R5bGVzID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImF0b20tc3R5bGVzXCIpXG4gICAgdGV4dEVkaXRvclN0eWxlcy5pbml0aWFsaXplKGF0b20uc3R5bGVzKVxuICAgIHRleHRFZGl0b3JTdHlsZXMuc2V0QXR0cmlidXRlIFwiY29udGV4dFwiLCBcImF0b20tdGV4dC1lZGl0b3JcIlxuICAgIGRvY3VtZW50LmJvZHkuYXBwZW5kQ2hpbGQgdGV4dEVkaXRvclN0eWxlc1xuXG4gICAgIyBFeHRyYWN0IHN0eWxlIGVsZW1lbnRzIGNvbnRlbnRcbiAgICBBcnJheS5wcm90b3R5cGUuc2xpY2UuYXBwbHkodGV4dEVkaXRvclN0eWxlcy5jaGlsZE5vZGVzKS5tYXAgKHN0eWxlRWxlbWVudCkgLT5cbiAgICAgIHN0eWxlRWxlbWVudC5pbm5lclRleHRcblxuICBnZXRNYXJrZG93blByZXZpZXdDU1M6IC0+XG4gICAgbWFya2Rvd1ByZXZpZXdSdWxlcyA9IFtdXG4gICAgcnVsZVJlZ0V4cCA9IC9cXC5tYXJrZG93bi1wcmV2aWV3L1xuICAgIGNzc1VybFJlZkV4cCA9IC91cmxcXChhdG9tOlxcL1xcL21hcmtkb3duLXByZXZpZXctcGx1c1xcL2Fzc2V0c1xcLyguKilcXCkvXG5cbiAgICBmb3Igc3R5bGVzaGVldCBpbiBAZ2V0RG9jdW1lbnRTdHlsZVNoZWV0cygpXG4gICAgICBpZiBzdHlsZXNoZWV0LnJ1bGVzP1xuICAgICAgICBmb3IgcnVsZSBpbiBzdHlsZXNoZWV0LnJ1bGVzXG4gICAgICAgICAgIyBXZSBvbmx5IG5lZWQgYC5tYXJrZG93bi1yZXZpZXdgIGNzc1xuICAgICAgICAgIG1hcmtkb3dQcmV2aWV3UnVsZXMucHVzaChydWxlLmNzc1RleHQpIGlmIHJ1bGUuc2VsZWN0b3JUZXh0Py5tYXRjaChydWxlUmVnRXhwKT9cblxuICAgIG1hcmtkb3dQcmV2aWV3UnVsZXNcbiAgICAgIC5jb25jYXQoQGdldFRleHRFZGl0b3JTdHlsZXMoKSlcbiAgICAgIC5qb2luKCdcXG4nKVxuICAgICAgLnJlcGxhY2UoL2F0b20tdGV4dC1lZGl0b3IvZywgJ3ByZS5lZGl0b3ItY29sb3JzJylcbiAgICAgIC5yZXBsYWNlKC86aG9zdC9nLCAnLmhvc3QnKSAjIFJlbW92ZSBzaGFkb3ctZG9tIDpob3N0IHNlbGVjdG9yIGNhdXNpbmcgcHJvYmxlbSBvbiBGRlxuICAgICAgLnJlcGxhY2UgY3NzVXJsUmVmRXhwLCAobWF0Y2gsIGFzc2V0c05hbWUsIG9mZnNldCwgc3RyaW5nKSAtPiAjIGJhc2U2NCBlbmNvZGUgYXNzZXRzXG4gICAgICAgIGFzc2V0UGF0aCA9IHBhdGguam9pbiBfX2Rpcm5hbWUsICcuLi9hc3NldHMnLCBhc3NldHNOYW1lXG4gICAgICAgIG9yaWdpbmFsRGF0YSA9IGZzLnJlYWRGaWxlU3luYyBhc3NldFBhdGgsICdiaW5hcnknXG4gICAgICAgIGJhc2U2NERhdGEgPSBuZXcgQnVmZmVyKG9yaWdpbmFsRGF0YSwgJ2JpbmFyeScpLnRvU3RyaW5nKCdiYXNlNjQnKVxuICAgICAgICBcInVybCgnZGF0YTppbWFnZS9qcGVnO2Jhc2U2NCwje2Jhc2U2NERhdGF9JylcIlxuXG4gIHNob3dFcnJvcjogKHJlc3VsdCkgLT5cbiAgICBmYWlsdXJlTWVzc2FnZSA9IHJlc3VsdD8ubWVzc2FnZVxuXG4gICAgQGh0bWwgJCQkIC0+XG4gICAgICBAaDIgJ1ByZXZpZXdpbmcgTWFya2Rvd24gRmFpbGVkJ1xuICAgICAgQGgzIGZhaWx1cmVNZXNzYWdlIGlmIGZhaWx1cmVNZXNzYWdlP1xuXG4gIHNob3dMb2FkaW5nOiAtPlxuICAgIEBsb2FkaW5nID0gdHJ1ZVxuICAgIEBodG1sICQkJCAtPlxuICAgICAgQGRpdiBjbGFzczogJ21hcmtkb3duLXNwaW5uZXInLCAnTG9hZGluZyBNYXJrZG93blxcdTIwMjYnXG5cbiAgY29weVRvQ2xpcGJvYXJkOiAtPlxuICAgIHJldHVybiBmYWxzZSBpZiBAbG9hZGluZ1xuXG4gICAgc2VsZWN0aW9uID0gd2luZG93LmdldFNlbGVjdGlvbigpXG4gICAgc2VsZWN0ZWRUZXh0ID0gc2VsZWN0aW9uLnRvU3RyaW5nKClcbiAgICBzZWxlY3RlZE5vZGUgPSBzZWxlY3Rpb24uYmFzZU5vZGVcblxuICAgICMgVXNlIGRlZmF1bHQgY29weSBldmVudCBoYW5kbGVyIGlmIHRoZXJlIGlzIHNlbGVjdGVkIHRleHQgaW5zaWRlIHRoaXMgdmlld1xuICAgIHJldHVybiBmYWxzZSBpZiBzZWxlY3RlZFRleHQgYW5kIHNlbGVjdGVkTm9kZT8gYW5kIChAWzBdIGlzIHNlbGVjdGVkTm9kZSBvciAkLmNvbnRhaW5zKEBbMF0sIHNlbGVjdGVkTm9kZSkpXG5cbiAgICBAZ2V0SFRNTCAoZXJyb3IsIGh0bWwpIC0+XG4gICAgICBpZiBlcnJvcj9cbiAgICAgICAgY29uc29sZS53YXJuKCdDb3B5aW5nIE1hcmtkb3duIGFzIEhUTUwgZmFpbGVkJywgZXJyb3IpXG4gICAgICBlbHNlXG4gICAgICAgIGF0b20uY2xpcGJvYXJkLndyaXRlKGh0bWwpXG5cbiAgICB0cnVlXG5cbiAgc2F2ZUFzOiAtPlxuICAgIHJldHVybiBpZiBAbG9hZGluZ1xuXG4gICAgZmlsZVBhdGggPSBAZ2V0UGF0aCgpXG4gICAgdGl0bGUgPSAnTWFya2Rvd24gdG8gSFRNTCdcbiAgICBpZiBmaWxlUGF0aFxuICAgICAgdGl0bGUgPSBwYXRoLnBhcnNlKGZpbGVQYXRoKS5uYW1lXG4gICAgICBmaWxlUGF0aCArPSAnLmh0bWwnXG4gICAgZWxzZVxuICAgICAgZmlsZVBhdGggPSAndW50aXRsZWQubWQuaHRtbCdcbiAgICAgIGlmIHByb2plY3RQYXRoID0gYXRvbS5wcm9qZWN0LmdldFBhdGhzKClbMF1cbiAgICAgICAgZmlsZVBhdGggPSBwYXRoLmpvaW4ocHJvamVjdFBhdGgsIGZpbGVQYXRoKVxuXG4gICAgaWYgaHRtbEZpbGVQYXRoID0gYXRvbS5zaG93U2F2ZURpYWxvZ1N5bmMoZmlsZVBhdGgpXG5cbiAgICAgIEBnZXRIVE1MIChlcnJvciwgaHRtbEJvZHkpID0+XG4gICAgICAgIGlmIGVycm9yP1xuICAgICAgICAgIGNvbnNvbGUud2FybignU2F2aW5nIE1hcmtkb3duIGFzIEhUTUwgZmFpbGVkJywgZXJyb3IpXG4gICAgICAgIGVsc2VcbiAgICAgICAgICBpZiBAcmVuZGVyTGFUZVhcbiAgICAgICAgICAgIG1hdGhqYXhTY3JpcHQgPSBcIlwiXCJcblxuICAgICAgICAgICAgICA8c2NyaXB0IHR5cGU9XCJ0ZXh0L3gtbWF0aGpheC1jb25maWdcIj5cbiAgICAgICAgICAgICAgICBNYXRoSmF4Lkh1Yi5Db25maWcoe1xuICAgICAgICAgICAgICAgICAgamF4OiBbXCJpbnB1dC9UZVhcIixcIm91dHB1dC9IVE1MLUNTU1wiXSxcbiAgICAgICAgICAgICAgICAgIGV4dGVuc2lvbnM6IFtdLFxuICAgICAgICAgICAgICAgICAgVGVYOiB7XG4gICAgICAgICAgICAgICAgICAgIGV4dGVuc2lvbnM6IFtcIkFNU21hdGguanNcIixcIkFNU3N5bWJvbHMuanNcIixcIm5vRXJyb3JzLmpzXCIsXCJub1VuZGVmaW5lZC5qc1wiXVxuICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgIHNob3dNYXRoTWVudTogZmFsc2VcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgPC9zY3JpcHQ+XG4gICAgICAgICAgICAgIDxzY3JpcHQgdHlwZT1cInRleHQvamF2YXNjcmlwdFwiIHNyYz1cImh0dHBzOi8vY2RuLm1hdGhqYXgub3JnL21hdGhqYXgvbGF0ZXN0L01hdGhKYXguanNcIj5cbiAgICAgICAgICAgICAgPC9zY3JpcHQ+XG4gICAgICAgICAgICAgIFwiXCJcIlxuICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgIG1hdGhqYXhTY3JpcHQgPSBcIlwiXG4gICAgICAgICAgaHRtbCA9IFwiXCJcIlxuICAgICAgICAgICAgPCFET0NUWVBFIGh0bWw+XG4gICAgICAgICAgICA8aHRtbD5cbiAgICAgICAgICAgICAgPGhlYWQ+XG4gICAgICAgICAgICAgICAgICA8bWV0YSBjaGFyc2V0PVwidXRmLThcIiAvPlxuICAgICAgICAgICAgICAgICAgPHRpdGxlPiN7dGl0bGV9PC90aXRsZT4je21hdGhqYXhTY3JpcHR9XG4gICAgICAgICAgICAgICAgICA8c3R5bGU+I3tAZ2V0TWFya2Rvd25QcmV2aWV3Q1NTKCl9PC9zdHlsZT5cbiAgICAgICAgICAgICAgPC9oZWFkPlxuICAgICAgICAgICAgICA8Ym9keSBjbGFzcz0nbWFya2Rvd24tcHJldmlldyc+I3todG1sQm9keX08L2JvZHk+XG4gICAgICAgICAgICA8L2h0bWw+XCJcIlwiICsgXCJcXG5cIiAjIEVuc3VyZSB0cmFpbGluZyBuZXdsaW5lXG5cbiAgICAgICAgICBmcy53cml0ZUZpbGVTeW5jKGh0bWxGaWxlUGF0aCwgaHRtbClcbiAgICAgICAgICBhdG9tLndvcmtzcGFjZS5vcGVuKGh0bWxGaWxlUGF0aClcblxuICBpc0VxdWFsOiAob3RoZXIpIC0+XG4gICAgQFswXSBpcyBvdGhlcj9bMF0gIyBDb21wYXJlIERPTSBlbGVtZW50c1xuXG4gICNcbiAgIyBGaW5kIHRoZSBjbG9zZXN0IGFuY2VzdG9yIG9mIGFuIGVsZW1lbnQgdGhhdCBpcyBub3QgYSBkZWNlbmRhbnQgb2YgZWl0aGVyXG4gICMgYHNwYW4ubWF0aGAgb3IgYHNwYW4uYXRvbS10ZXh0LWVkaXRvcmAuXG4gICNcbiAgIyBAcGFyYW0ge0hUTUxFbGVtZW50fSBlbGVtZW50IFRoZSBlbGVtZW50IGZyb20gd2hpY2ggdGhlIHNlYXJjaCBmb3IgYVxuICAjICAgY2xvc2VzdCBhbmNlc3RvciBiZWdpbnMuXG4gICMgQHJldHVybiB7SFRNTEVsZW1lbnR9IFRoZSBjbG9zZXN0IGFuY2VzdG9yIHRvIGBlbGVtZW50YCB0aGF0IGRvZXMgbm90XG4gICMgICBjb250YWluIGVpdGhlciBgc3Bhbi5tYXRoYCBvciBgc3Bhbi5hdG9tLXRleHQtZWRpdG9yYC5cbiAgI1xuICBidWJibGVUb0NvbnRhaW5lckVsZW1lbnQ6IChlbGVtZW50KSAtPlxuICAgIHRlc3RFbGVtZW50ID0gZWxlbWVudFxuICAgIHdoaWxlIHRlc3RFbGVtZW50IGlzbnQgZG9jdW1lbnQuYm9keVxuICAgICAgcGFyZW50ID0gdGVzdEVsZW1lbnQucGFyZW50Tm9kZVxuICAgICAgcmV0dXJuIHBhcmVudC5wYXJlbnROb2RlIGlmIHBhcmVudC5jbGFzc0xpc3QuY29udGFpbnMoJ01hdGhKYXhfRGlzcGxheScpXG4gICAgICByZXR1cm4gcGFyZW50IGlmIHBhcmVudC5jbGFzc0xpc3QuY29udGFpbnMoJ2F0b20tdGV4dC1lZGl0b3InKVxuICAgICAgdGVzdEVsZW1lbnQgPSBwYXJlbnRcbiAgICByZXR1cm4gZWxlbWVudFxuXG4gICNcbiAgIyBEZXRlcm1pbmUgYSBzdWJzZXF1ZW5jZSBvZiBhIHNlcXVlbmNlIG9mIHRva2VucyByZXByZXNlbnRpbmcgYSBwYXRoIHRocm91Z2hcbiAgIyBIVE1MRWxlbWVudHMgdGhhdCBkb2VzIG5vdCBjb250aW51ZSBkZWVwZXIgdGhhbiBhIHRhYmxlIGVsZW1lbnQuXG4gICNcbiAgIyBAcGFyYW0geyh0YWc6IDx0YWc+LCBpbmRleDogPGluZGV4PilbXX0gcGF0aFRvVG9rZW4gQXJyYXkgb2YgdG9rZW5zXG4gICMgICByZXByZXNlbnRpbmcgYSBwYXRoIHRvIGEgSFRNTEVsZW1lbnQgd2l0aCB0aGUgcm9vdCBlbGVtZW50IGF0XG4gICMgICBwYXRoVG9Ub2tlblswXSBhbmQgdGhlIHRhcmdldCBlbGVtZW50IGF0IHRoZSBoaWdoZXN0IGluZGV4LiBFYWNoIGVsZW1lbnRcbiAgIyAgIGNvbnNpc3RzIG9mIGEgYHRhZ2AgYW5kIGBpbmRleGAgcmVwcmVzZW50aW5nIGl0cyBpbmRleCBhbW9uZ3N0IGl0c1xuICAjICAgc2libGluZyBlbGVtZW50cyBvZiB0aGUgc2FtZSBgdGFnYC5cbiAgIyBAcmV0dXJuIHsodGFnOiA8dGFnPiwgaW5kZXg6IDxpbmRleD4pW119IFRoZSBzdWJzZXF1ZW5jZSBvZiBwYXRoVG9Ub2tlbiB0aGF0XG4gICMgICBtYWludGFpbnMgdGhlIHNhbWUgcm9vdCBidXQgdGVybWluYXRlcyBhdCBhIHRhYmxlIGVsZW1lbnQgb3IgdGhlIHRhcmdldFxuICAjICAgZWxlbWVudCwgd2hpY2hldmVyIGNvbWVzIGZpcnN0LlxuICAjXG4gIGJ1YmJsZVRvQ29udGFpbmVyVG9rZW46IChwYXRoVG9Ub2tlbikgLT5cbiAgICBmb3IgaSBpbiBbMC4uKHBhdGhUb1Rva2VuLmxlbmd0aC0xKV0gYnkgMVxuICAgICAgcmV0dXJuIHBhdGhUb1Rva2VuLnNsaWNlKDAsIGkrMSkgaWYgcGF0aFRvVG9rZW5baV0udGFnIGlzICd0YWJsZSdcbiAgICByZXR1cm4gcGF0aFRvVG9rZW5cblxuICAjXG4gICMgRW5jb2RlIHRhZ3MgZm9yIG1hcmtkb3duLWl0LlxuICAjXG4gICMgQHBhcmFtIHtIVE1MRWxlbWVudH0gZWxlbWVudCBFbmNvZGUgdGhlIHRhZyBvZiBlbGVtZW50LlxuICAjIEByZXR1cm4ge3N0cmluZ30gRW5jb2RlZCB0YWcuXG4gICNcbiAgZW5jb2RlVGFnOiAoZWxlbWVudCkgLT5cbiAgICByZXR1cm4gJ21hdGgnIGlmIGVsZW1lbnQuY2xhc3NMaXN0LmNvbnRhaW5zKCdtYXRoJylcbiAgICByZXR1cm4gJ2NvZGUnIGlmIGVsZW1lbnQuY2xhc3NMaXN0LmNvbnRhaW5zKCdhdG9tLXRleHQtZWRpdG9yJykgIyBvbmx5IHRva2VuLnR5cGUgaXMgYGZlbmNlYCBjb2RlIGJsb2NrcyBzaG91bGQgZXZlciBiZSBmb3VuZCBpbiB0aGUgZmlyc3QgbGV2ZWwgb2YgdGhlIHRva2VucyBhcnJheVxuICAgIHJldHVybiBlbGVtZW50LnRhZ05hbWUudG9Mb3dlckNhc2UoKVxuXG4gICNcbiAgIyBEZWNvZGUgdGFncyB1c2VkIGJ5IG1hcmtkb3duLWl0XG4gICNcbiAgIyBAcGFyYW0ge21hcmtkb3duLWl0LlRva2VufSB0b2tlbiBEZWNvZGUgdGhlIHRhZyBvZiB0b2tlbi5cbiAgIyBAcmV0dXJuIHtzdHJpbmd8bnVsbH0gRGVjb2RlZCB0YWcgb3IgYG51bGxgIGlmIHRoZSB0b2tlbiBoYXMgbm8gdGFnLlxuICAjXG4gIGRlY29kZVRhZzogKHRva2VuKSAtPlxuICAgIHJldHVybiAnc3BhbicgaWYgdG9rZW4udGFnIGlzICdtYXRoJ1xuICAgIHJldHVybiAnc3BhbicgaWYgdG9rZW4udGFnIGlzICdjb2RlJ1xuICAgIHJldHVybiBudWxsIGlmIHRva2VuLnRhZyBpcyBcIlwiXG4gICAgcmV0dXJuIHRva2VuLnRhZ1xuXG4gICNcbiAgIyBEZXRlcm1pbmUgcGF0aCB0byBhIHRhcmdldCBlbGVtZW50IGZyb20gYSBjb250YWluZXIgYC5tYXJrZG93bi1wcmV2aWV3YC5cbiAgI1xuICAjIEBwYXJhbSB7SFRNTEVsZW1lbnR9IGVsZW1lbnQgVGFyZ2V0IEhUTUxFbGVtZW50LlxuICAjIEByZXR1cm4geyh0YWc6IDx0YWc+LCBpbmRleDogPGluZGV4PilbXX0gQXJyYXkgb2YgdG9rZW5zIHJlcHJlc2VudGluZyBhIHBhdGhcbiAgIyAgIHRvIGBlbGVtZW50YCBmcm9tIGAubWFya2Rvd24tcHJldmlld2AuIFRoZSByb290IGAubWFya2Rvd24tcHJldmlld2BcbiAgIyAgIGVsZW1lbnQgaXMgdGhlIGZpcnN0IGVsZW1lbnRzIGluIHRoZSBhcnJheSBhbmQgdGhlIHRhcmdldCBlbGVtZW50XG4gICMgICBgZWxlbWVudGAgYXQgdGhlIGhpZ2hlc3QgaW5kZXguIEVhY2ggZWxlbWVudCBjb25zaXN0cyBvZiBhIGB0YWdgIGFuZFxuICAjICAgYGluZGV4YCByZXByZXNlbnRpbmcgaXRzIGluZGV4IGFtb25nc3QgaXRzIHNpYmxpbmcgZWxlbWVudHMgb2YgdGhlIHNhbWVcbiAgIyAgIGB0YWdgLlxuICAjXG4gIGdldFBhdGhUb0VsZW1lbnQ6IChlbGVtZW50KSA9PlxuICAgIGlmIGVsZW1lbnQuY2xhc3NMaXN0LmNvbnRhaW5zKCdtYXJrZG93bi1wcmV2aWV3JylcbiAgICAgIHJldHVybiBbXG4gICAgICAgIHRhZzogJ2RpdidcbiAgICAgICAgaW5kZXg6IDBcbiAgICAgIF1cblxuICAgIGVsZW1lbnQgICAgICAgPSBAYnViYmxlVG9Db250YWluZXJFbGVtZW50IGVsZW1lbnRcbiAgICB0YWcgICAgICAgICAgID0gQGVuY29kZVRhZyBlbGVtZW50XG4gICAgc2libGluZ3MgICAgICA9IGVsZW1lbnQucGFyZW50Tm9kZS5jaGlsZE5vZGVzXG4gICAgc2libGluZ3NDb3VudCA9IDBcblxuICAgIGZvciBzaWJsaW5nIGluIHNpYmxpbmdzXG4gICAgICBzaWJsaW5nVGFnICA9IGlmIHNpYmxpbmcubm9kZVR5cGUgaXMgMSB0aGVuIEBlbmNvZGVUYWcoc2libGluZykgZWxzZSBudWxsXG4gICAgICBpZiBzaWJsaW5nIGlzIGVsZW1lbnRcbiAgICAgICAgcGF0aFRvRWxlbWVudCA9IEBnZXRQYXRoVG9FbGVtZW50KGVsZW1lbnQucGFyZW50Tm9kZSlcbiAgICAgICAgcGF0aFRvRWxlbWVudC5wdXNoXG4gICAgICAgICAgdGFnOiB0YWdcbiAgICAgICAgICBpbmRleDogc2libGluZ3NDb3VudFxuICAgICAgICByZXR1cm4gcGF0aFRvRWxlbWVudFxuICAgICAgZWxzZSBpZiBzaWJsaW5nVGFnIGlzIHRhZ1xuICAgICAgICBzaWJsaW5nc0NvdW50KytcblxuICAgIHJldHVyblxuXG4gICNcbiAgIyBTZXQgdGhlIGFzc29jaWF0ZWQgZWRpdG9ycyBjdXJzb3IgYnVmZmVyIHBvc2l0aW9uIHRvIHRoZSBsaW5lIHJlcHJlc2VudGluZ1xuICAjIHRoZSBzb3VyY2UgbWFya2Rvd24gb2YgYSB0YXJnZXQgZWxlbWVudC5cbiAgI1xuICAjIEBwYXJhbSB7c3RyaW5nfSB0ZXh0IFNvdXJjZSBtYXJrZG93biBvZiB0aGUgYXNzb2NpYXRlZCBlZGl0b3IuXG4gICMgQHBhcmFtIHtIVE1MRWxlbWVudH0gZWxlbWVudCBUYXJnZXQgZWxlbWVudCBjb250YWluZWQgd2l0aGluIHRoZSBhc3NvaWNhdGVkXG4gICMgICBgLm1hcmtkb3duLXByZXZpZXdgIGNvbnRhaW5lci4gVGhlIG1ldGhvZCB3aWxsIGF0dGVtcHQgdG8gaWRlbnRpZnkgdGhlXG4gICMgICBsaW5lIG9mIGB0ZXh0YCB0aGF0IHJlcHJlc2VudHMgYGVsZW1lbnRgIGFuZCBzZXQgdGhlIGN1cnNvciB0byB0aGF0IGxpbmUuXG4gICMgQHJldHVybiB7bnVtYmVyfG51bGx9IFRoZSBsaW5lIG9mIGB0ZXh0YCB0aGF0IHJlcHJlc2VudHMgYGVsZW1lbnRgLiBJZiBub1xuICAjICAgbGluZSBpcyBpZGVudGlmaWVkIGBudWxsYCBpcyByZXR1cm5lZC5cbiAgI1xuICBzeW5jU291cmNlOiAodGV4dCwgZWxlbWVudCkgPT5cbiAgICBwYXRoVG9FbGVtZW50ID0gQGdldFBhdGhUb0VsZW1lbnQgZWxlbWVudFxuICAgIHBhdGhUb0VsZW1lbnQuc2hpZnQoKSAjIHJlbW92ZSBkaXYubWFya2Rvd24tcHJldmlld1xuICAgIHBhdGhUb0VsZW1lbnQuc2hpZnQoKSAjIHJlbW92ZSBkaXYudXBkYXRlLXByZXZpZXdcbiAgICByZXR1cm4gdW5sZXNzIHBhdGhUb0VsZW1lbnQubGVuZ3RoXG5cbiAgICBtYXJrZG93bkl0ICA/PSByZXF1aXJlICcuL21hcmtkb3duLWl0LWhlbHBlcidcbiAgICB0b2tlbnMgICAgICA9IG1hcmtkb3duSXQuZ2V0VG9rZW5zIHRleHQsIEByZW5kZXJMYVRlWFxuICAgIGZpbmFsVG9rZW4gID0gbnVsbFxuICAgIGxldmVsICAgICAgID0gMFxuXG4gICAgZm9yIHRva2VuIGluIHRva2Vuc1xuICAgICAgYnJlYWsgaWYgdG9rZW4ubGV2ZWwgPCBsZXZlbFxuICAgICAgY29udGludWUgaWYgdG9rZW4uaGlkZGVuXG4gICAgICBpZiB0b2tlbi50YWcgaXMgcGF0aFRvRWxlbWVudFswXS50YWcgYW5kIHRva2VuLmxldmVsIGlzIGxldmVsXG4gICAgICAgIGlmIHRva2VuLm5lc3RpbmcgaXMgMVxuICAgICAgICAgIGlmIHBhdGhUb0VsZW1lbnRbMF0uaW5kZXggaXMgMFxuICAgICAgICAgICAgZmluYWxUb2tlbiA9IHRva2VuIGlmIHRva2VuLm1hcD9cbiAgICAgICAgICAgIHBhdGhUb0VsZW1lbnQuc2hpZnQoKVxuICAgICAgICAgICAgbGV2ZWwrK1xuICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgIHBhdGhUb0VsZW1lbnRbMF0uaW5kZXgtLVxuICAgICAgICBlbHNlIGlmIHRva2VuLm5lc3RpbmcgaXMgMCBhbmQgdG9rZW4udGFnIGluIFsnbWF0aCcsICdjb2RlJywgJ2hyJ11cbiAgICAgICAgICBpZiBwYXRoVG9FbGVtZW50WzBdLmluZGV4IGlzIDBcbiAgICAgICAgICAgIGZpbmFsVG9rZW4gPSB0b2tlblxuICAgICAgICAgICAgYnJlYWtcbiAgICAgICAgICBlbHNlXG4gICAgICAgICAgICBwYXRoVG9FbGVtZW50WzBdLmluZGV4LS1cbiAgICAgIGJyZWFrIGlmIHBhdGhUb0VsZW1lbnQubGVuZ3RoIGlzIDBcblxuICAgIGlmIGZpbmFsVG9rZW4/XG4gICAgICBAZWRpdG9yLnNldEN1cnNvckJ1ZmZlclBvc2l0aW9uIFtmaW5hbFRva2VuLm1hcFswXSwgMF1cbiAgICAgIHJldHVybiBmaW5hbFRva2VuLm1hcFswXVxuICAgIGVsc2VcbiAgICAgIHJldHVybiBudWxsXG5cbiAgI1xuICAjIERldGVybWluZSBwYXRoIHRvIGEgdGFyZ2V0IHRva2VuLlxuICAjXG4gICMgQHBhcmFtIHsobWFya2Rvd24taXQuVG9rZW4pW119IHRva2VucyBBcnJheSBvZiB0b2tlbnMgYXMgcmV0dXJuZWQgYnlcbiAgIyAgIGBtYXJrZG93bi1pdC5wYXJzZSgpYC5cbiAgIyBAcGFyYW0ge251bWJlcn0gbGluZSBMaW5lIHJlcHJlc2VudGluZyB0aGUgdGFyZ2V0IHRva2VuLlxuICAjIEByZXR1cm4geyh0YWc6IDx0YWc+LCBpbmRleDogPGluZGV4PilbXX0gQXJyYXkgcmVwcmVzZW50aW5nIGEgcGF0aCB0byB0aGVcbiAgIyAgIHRhcmdldCB0b2tlbi4gVGhlIHJvb3QgdG9rZW4gaXMgcmVwcmVzZW50ZWQgYnkgdGhlIGZpcnN0IGVsZW1lbnQgaW4gdGhlXG4gICMgICBhcnJheSBhbmQgdGhlIHRhcmdldCB0b2tlbiBieSB0aGUgbGFzdCBlbG1lbnQuIEVhY2ggZWxlbWVudCBjb25zaXN0cyBvZiBhXG4gICMgICBgdGFnYCBhbmQgYGluZGV4YCByZXByZXNlbnRpbmcgaXRzIGluZGV4IGFtb25nc3QgaXRzIHNpYmxpbmcgdG9rZW5zIGluXG4gICMgICBgdG9rZW5zYCBvZiB0aGUgc2FtZSBgdGFnYC4gYGxpbmVgIHdpbGwgbGllIGJldHdlZW4gdGhlIHByb3BlcnRpZXNcbiAgIyAgIGBtYXBbMF1gIGFuZCBgbWFwWzFdYCBvZiB0aGUgdGFyZ2V0IHRva2VuLlxuICAjXG4gIGdldFBhdGhUb1Rva2VuOiAodG9rZW5zLCBsaW5lKSA9PlxuICAgIHBhdGhUb1Rva2VuICAgPSBbXVxuICAgIHRva2VuVGFnQ291bnQgPSBbXVxuICAgIGxldmVsICAgICAgICAgPSAwXG5cbiAgICBmb3IgdG9rZW4gaW4gdG9rZW5zXG4gICAgICBicmVhayBpZiB0b2tlbi5sZXZlbCA8IGxldmVsXG4gICAgICBjb250aW51ZSBpZiB0b2tlbi5oaWRkZW5cbiAgICAgIGNvbnRpbnVlIGlmIHRva2VuLm5lc3RpbmcgaXMgLTFcblxuICAgICAgdG9rZW4udGFnID0gQGRlY29kZVRhZyB0b2tlblxuICAgICAgY29udGludWUgdW5sZXNzIHRva2VuLnRhZz9cblxuICAgICAgaWYgdG9rZW4ubWFwPyBhbmQgbGluZSA+PSB0b2tlbi5tYXBbMF0gYW5kIGxpbmUgPD0gKHRva2VuLm1hcFsxXS0xKVxuICAgICAgICBpZiB0b2tlbi5uZXN0aW5nIGlzIDFcbiAgICAgICAgICBwYXRoVG9Ub2tlbi5wdXNoXG4gICAgICAgICAgICB0YWc6IHRva2VuLnRhZ1xuICAgICAgICAgICAgaW5kZXg6IHRva2VuVGFnQ291bnRbdG9rZW4udGFnXSA/IDBcbiAgICAgICAgICB0b2tlblRhZ0NvdW50ID0gW11cbiAgICAgICAgICBsZXZlbCsrXG4gICAgICAgIGVsc2UgaWYgdG9rZW4ubmVzdGluZyBpcyAwXG4gICAgICAgICAgcGF0aFRvVG9rZW4ucHVzaFxuICAgICAgICAgICAgdGFnOiB0b2tlbi50YWdcbiAgICAgICAgICAgIGluZGV4OiB0b2tlblRhZ0NvdW50W3Rva2VuLnRhZ10gPyAwXG4gICAgICAgICAgYnJlYWtcbiAgICAgIGVsc2UgaWYgdG9rZW4ubGV2ZWwgaXMgbGV2ZWxcbiAgICAgICAgaWYgdG9rZW5UYWdDb3VudFt0b2tlbi50YWddP1xuICAgICAgICB0aGVuIHRva2VuVGFnQ291bnRbdG9rZW4udGFnXSsrXG4gICAgICAgIGVsc2UgdG9rZW5UYWdDb3VudFt0b2tlbi50YWddID0gMVxuXG4gICAgcGF0aFRvVG9rZW4gPSBAYnViYmxlVG9Db250YWluZXJUb2tlbiBwYXRoVG9Ub2tlblxuICAgIHJldHVybiBwYXRoVG9Ub2tlblxuXG4gICNcbiAgIyBTY3JvbGwgdGhlIGFzc29jaWF0ZWQgcHJldmlldyB0byB0aGUgZWxlbWVudCByZXByZXNlbnRpbmcgdGhlIHRhcmdldCBsaW5lIG9mXG4gICMgb2YgdGhlIHNvdXJjZSBtYXJrZG93bi5cbiAgI1xuICAjIEBwYXJhbSB7c3RyaW5nfSB0ZXh0IFNvdXJjZSBtYXJrZG93biBvZiB0aGUgYXNzb2NpYXRlZCBlZGl0b3IuXG4gICMgQHBhcmFtIHtudW1iZXJ9IGxpbmUgVGFyZ2V0IGxpbmUgb2YgYHRleHRgLiBUaGUgbWV0aG9kIHdpbGwgYXR0ZW1wdCB0b1xuICAjICAgaWRlbnRpZnkgdGhlIGVsbWVudCBvZiB0aGUgYXNzb2NpYXRlZCBgLm1hcmtkb3duLXByZXZpZXdgIHRoYXQgcmVwcmVzZW50c1xuICAjICAgYGxpbmVgIGFuZCBzY3JvbGwgdGhlIGAubWFya2Rvd24tcHJldmlld2AgdG8gdGhhdCBlbGVtZW50LlxuICAjIEByZXR1cm4ge251bWJlcnxudWxsfSBUaGUgZWxlbWVudCB0aGF0IHJlcHJlc2VudHMgYGxpbmVgLiBJZiBubyBlbGVtZW50IGlzXG4gICMgICBpZGVudGlmaWVkIGBudWxsYCBpcyByZXR1cm5lZC5cbiAgI1xuICBzeW5jUHJldmlldzogKHRleHQsIGxpbmUpID0+XG4gICAgbWFya2Rvd25JdCAgPz0gcmVxdWlyZSAnLi9tYXJrZG93bi1pdC1oZWxwZXInXG4gICAgdG9rZW5zICAgICAgPSBtYXJrZG93bkl0LmdldFRva2VucyB0ZXh0LCBAcmVuZGVyTGFUZVhcbiAgICBwYXRoVG9Ub2tlbiA9IEBnZXRQYXRoVG9Ub2tlbiB0b2tlbnMsIGxpbmVcblxuICAgIGVsZW1lbnQgPSBAZmluZCgnLnVwZGF0ZS1wcmV2aWV3JykuZXEoMClcbiAgICBmb3IgdG9rZW4gaW4gcGF0aFRvVG9rZW5cbiAgICAgIGNhbmRpZGF0ZUVsZW1lbnQgPSBlbGVtZW50LmNoaWxkcmVuKHRva2VuLnRhZykuZXEodG9rZW4uaW5kZXgpXG4gICAgICBpZiBjYW5kaWRhdGVFbGVtZW50Lmxlbmd0aCBpc250IDBcbiAgICAgIHRoZW4gZWxlbWVudCA9IGNhbmRpZGF0ZUVsZW1lbnRcbiAgICAgIGVsc2UgYnJlYWtcblxuICAgIHJldHVybiBudWxsIGlmIGVsZW1lbnRbMF0uY2xhc3NMaXN0LmNvbnRhaW5zKCd1cGRhdGUtcHJldmlldycpICMgRG8gbm90IGp1bXAgdG8gdGhlIHRvcCBvZiB0aGUgcHJldmlldyBmb3IgYmFkIHN5bmNzXG5cbiAgICBlbGVtZW50WzBdLnNjcm9sbEludG9WaWV3KCkgdW5sZXNzIGVsZW1lbnRbMF0uY2xhc3NMaXN0LmNvbnRhaW5zKCd1cGRhdGUtcHJldmlldycpXG4gICAgbWF4U2Nyb2xsVG9wID0gQGVsZW1lbnQuc2Nyb2xsSGVpZ2h0IC0gQGlubmVySGVpZ2h0KClcbiAgICBAZWxlbWVudC5zY3JvbGxUb3AgLT0gQGlubmVySGVpZ2h0KCkvNCB1bmxlc3MgQHNjcm9sbFRvcCgpID49IG1heFNjcm9sbFRvcFxuXG4gICAgZWxlbWVudC5hZGRDbGFzcygnZmxhc2gnKVxuICAgIHNldFRpbWVvdXQgKCAtPiBlbGVtZW50LnJlbW92ZUNsYXNzKCdmbGFzaCcpICksIDEwMDBcblxuICAgIHJldHVybiBlbGVtZW50WzBdXG5cbmlmIEdyaW0uaW5jbHVkZURlcHJlY2F0ZWRBUElzXG4gIE1hcmtkb3duUHJldmlld1ZpZXc6Om9uID0gKGV2ZW50TmFtZSkgLT5cbiAgICBpZiBldmVudE5hbWUgaXMgJ21hcmtkb3duLXByZXZpZXc6bWFya2Rvd24tY2hhbmdlZCdcbiAgICAgIEdyaW0uZGVwcmVjYXRlKFwiVXNlIE1hcmtkb3duUHJldmlld1ZpZXc6Om9uRGlkQ2hhbmdlTWFya2Rvd24gaW5zdGVhZCBvZiB0aGUgJ21hcmtkb3duLXByZXZpZXc6bWFya2Rvd24tY2hhbmdlZCcgalF1ZXJ5IGV2ZW50XCIpXG4gICAgc3VwZXJcbiJdfQ==
