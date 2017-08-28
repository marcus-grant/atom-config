(function() {
  var MarkdownPreviewView, fs, markdownIt, mathjaxHelper, path, queryString, temp, url;

  path = require('path');

  fs = require('fs-plus');

  temp = require('temp');

  MarkdownPreviewView = require('../lib/markdown-preview-view');

  markdownIt = require('../lib/markdown-it-helper');

  mathjaxHelper = require('../lib/mathjax-helper');

  url = require('url');

  queryString = require('querystring');

  require('./spec-helper');

  describe("MarkdownPreviewView", function() {
    var expectPreviewInSplitPane, filePath, preview, ref;
    ref = [], filePath = ref[0], preview = ref[1];
    beforeEach(function() {
      preview = filePath = null;
      waitsForPromise(function() {
        return Promise.all([atom.packages.activatePackage('language-ruby'), atom.packages.activatePackage('language-javascript')]);
      });
      waitsFor(function() {
        return atom.grammars.grammarForScopeName('source.ruby') !== void 0;
      });
      waitsFor(function() {
        return atom.grammars.grammarForScopeName('source.js') !== void 0;
      });
      waitsForPromise(function() {
        return atom.packages.activatePackage('markdown-preview-plus');
      });
      return runs(function() {
        filePath = atom.project.getDirectories()[0].resolve('subdir/file.markdown');
        preview = new MarkdownPreviewView({
          filePath: filePath
        });
        jasmine.attachToDOM(preview.element);
        return this.addMatchers({
          toStartWith: function(expected) {
            return this.actual.slice(0, expected.length) === expected;
          }
        });
      });
    });
    afterEach(function() {
      return preview.destroy();
    });
    expectPreviewInSplitPane = function() {
      waitsFor(function() {
        return atom.workspace.getCenter().getPanes().length === 2;
      });
      waitsFor("markdown preview to be created", function() {
        return preview = atom.workspace.getCenter().getPanes()[1].getActiveItem();
      });
      return runs(function() {
        expect(preview).toBeInstanceOf(MarkdownPreviewView);
        return expect(preview.getPath()).toBe(atom.workspace.getActivePaneItem().getPath());
      });
    };
    describe("::constructor", function() {
      return it("shows an error message when there is an error", function() {
        preview.showError("Not a real file");
        return expect(preview.text()).toContain("Failed");
      });
    });
    describe("serialization", function() {
      var newPreview;
      newPreview = null;
      afterEach(function() {
        return newPreview != null ? newPreview.destroy() : void 0;
      });
      it("recreates the preview when serialized/deserialized", function() {
        newPreview = atom.deserializers.deserialize(preview.serialize());
        jasmine.attachToDOM(newPreview.element);
        return expect(newPreview.getPath()).toBe(preview.getPath());
      });
      it("does not recreate a preview when the file no longer exists", function() {
        var serialized;
        filePath = path.join(temp.mkdirSync('markdown-preview-'), 'foo.md');
        fs.writeFileSync(filePath, '# Hi');
        newPreview = new MarkdownPreviewView({
          filePath: filePath
        });
        serialized = newPreview.serialize();
        fs.removeSync(filePath);
        newPreview = atom.deserializers.deserialize(serialized);
        return expect(newPreview).toBeUndefined();
      });
      return it("serializes the editor id when opened for an editor", function() {
        preview.destroy();
        waitsForPromise(function() {
          return atom.workspace.open('new.markdown');
        });
        return runs(function() {
          preview = new MarkdownPreviewView({
            editorId: atom.workspace.getActiveTextEditor().id
          });
          jasmine.attachToDOM(preview.element);
          expect(preview.getPath()).toBe(atom.workspace.getActiveTextEditor().getPath());
          newPreview = atom.deserializers.deserialize(preview.serialize());
          jasmine.attachToDOM(newPreview.element);
          return expect(newPreview.getPath()).toBe(preview.getPath());
        });
      });
    });
    describe("header rendering", function() {
      it("should render headings with and without space", function() {
        waitsForPromise(function() {
          return preview.renderMarkdown();
        });
        return runs(function() {
          var headlines;
          headlines = preview.find('h2');
          expect(headlines).toExist();
          expect(headlines.length).toBe(2);
          expect(headlines[0].outerHTML).toBe("<h2>Level two header without space</h2>");
          return expect(headlines[1].outerHTML).toBe("<h2>Level two header with space</h2>");
        });
      });
      return it("should render headings with and without space", function() {
        atom.config.set('markdown-preview-plus.useLazyHeaders', false);
        waitsForPromise(function() {
          return preview.renderMarkdown();
        });
        return runs(function() {
          var headlines;
          headlines = preview.find('h2');
          expect(headlines).toExist();
          expect(headlines.length).toBe(1);
          return expect(headlines[0].outerHTML).toBe("<h2>Level two header with space</h2>");
        });
      });
    });
    describe("code block conversion to atom-text-editor tags", function() {
      beforeEach(function() {
        return waitsForPromise(function() {
          return preview.renderMarkdown();
        });
      });
      it("removes line decorations on rendered code blocks", function() {
        var decorations, editor;
        editor = preview.find("atom-text-editor[data-grammar='text plain null-grammar']");
        decorations = editor[0].getModel().getDecorations({
          "class": 'cursor-line',
          type: 'line'
        });
        return expect(decorations.length).toBe(0);
      });
      it("removes a trailing newline but preserves remaining leading and trailing whitespace", function() {
        var newFilePath, newPreview;
        newFilePath = atom.project.getDirectories()[0].resolve('subdir/trim-nl.md');
        newPreview = new MarkdownPreviewView({
          filePath: newFilePath
        });
        jasmine.attachToDOM(newPreview.element);
        waitsForPromise(function() {
          return newPreview.renderMarkdown();
        });
        runs(function() {
          var editor;
          editor = newPreview.find("atom-text-editor");
          expect(editor).toExist();
          return expect(editor[0].getModel().getText()).toBe("\n     a\n    b\n   c\n  d\n e\nf\n");
        });
        return runs(function() {
          return newPreview.destroy();
        });
      });
      describe("when the code block's fence name has a matching grammar", function() {
        return it("assigns the grammar on the atom-text-editor", function() {
          var jsEditor, rubyEditor;
          rubyEditor = preview.find("atom-text-editor[data-grammar='source ruby']");
          expect(rubyEditor).toExist();
          expect(rubyEditor[0].getModel().getText()).toBe("def func\n  x = 1\nend");
          jsEditor = preview.find("atom-text-editor[data-grammar='source js']");
          expect(jsEditor).toExist();
          return expect(jsEditor[0].getModel().getText()).toBe("if a === 3 {\n  b = 5\n}");
        });
      });
      return describe("when the code block's fence name doesn't have a matching grammar", function() {
        return it("does not assign a specific grammar", function() {
          var plainEditor;
          plainEditor = preview.find("atom-text-editor[data-grammar='text plain null-grammar']");
          expect(plainEditor).toExist();
          return expect(plainEditor[0].getModel().getText()).toBe("function f(x) {\n  return x++;\n}");
        });
      });
    });
    describe("image resolving", function() {
      beforeEach(function() {
        spyOn(markdownIt, 'decode').andCallThrough();
        return waitsForPromise(function() {
          return preview.renderMarkdown();
        });
      });
      describe("when the image uses a relative path", function() {
        return it("resolves to a path relative to the file", function() {
          var image;
          image = preview.find("img[alt=Image1]");
          expect(markdownIt.decode).toHaveBeenCalled();
          return expect(image.attr('src')).toStartWith(atom.project.getDirectories()[0].resolve('subdir/image1.png'));
        });
      });
      describe("when the image uses an absolute path that does not exist", function() {
        return it("resolves to a path relative to the project root", function() {
          var image;
          image = preview.find("img[alt=Image2]");
          expect(markdownIt.decode).toHaveBeenCalled();
          return expect(image.attr('src')).toStartWith(atom.project.getDirectories()[0].resolve('tmp/image2.png'));
        });
      });
      describe("when the image uses an absolute path that exists", function() {
        return it("adds a query to the URL", function() {
          preview.destroy();
          filePath = path.join(temp.mkdirSync('atom'), 'foo.md');
          fs.writeFileSync(filePath, "![absolute](" + filePath + ")");
          preview = new MarkdownPreviewView({
            filePath: filePath
          });
          jasmine.attachToDOM(preview.element);
          waitsForPromise(function() {
            return preview.renderMarkdown();
          });
          return runs(function() {
            expect(markdownIt.decode).toHaveBeenCalled();
            return expect(preview.find("img[alt=absolute]").attr('src')).toStartWith(filePath + "?v=");
          });
        });
      });
      return describe("when the image uses a web URL", function() {
        return it("doesn't change the URL", function() {
          var image;
          image = preview.find("img[alt=Image3]");
          expect(markdownIt.decode).toHaveBeenCalled();
          return expect(image.attr('src')).toBe('https://raw.githubusercontent.com/Galadirith/markdown-preview-plus/master/assets/hr.png');
        });
      });
    });
    describe("image modification", function() {
      var dirPath, getImageVersion, img1Path, ref1, workspaceElement;
      ref1 = [], dirPath = ref1[0], filePath = ref1[1], img1Path = ref1[2], workspaceElement = ref1[3];
      beforeEach(function() {
        preview.destroy();
        jasmine.useRealClock();
        dirPath = temp.mkdirSync('atom');
        filePath = path.join(dirPath, 'image-modification.md');
        img1Path = path.join(dirPath, 'img1.png');
        fs.writeFileSync(filePath, "![img1](" + img1Path + ")");
        fs.writeFileSync(img1Path, "clearly not a png but good enough for tests");
        workspaceElement = atom.views.getView(atom.workspace);
        return jasmine.attachToDOM(workspaceElement);
      });
      getImageVersion = function(imagePath, imageURL) {
        var urlQuery, urlQueryStr;
        expect(imageURL).toStartWith(imagePath + "?v=");
        urlQueryStr = url.parse(imageURL).query;
        urlQuery = queryString.parse(urlQueryStr);
        return urlQuery.v;
      };
      describe("when a local image is previewed", function() {
        return it("adds a timestamp query to the URL", function() {
          waitsForPromise(function() {
            return atom.workspace.open(filePath);
          });
          runs(function() {
            return atom.commands.dispatch(workspaceElement, 'markdown-preview-plus:toggle');
          });
          expectPreviewInSplitPane();
          return runs(function() {
            var imageURL, imageVer;
            imageURL = preview.find("img[alt=img1]").attr('src');
            imageVer = getImageVersion(img1Path, imageURL);
            return expect(imageVer).not.toEqual('deleted');
          });
        });
      });
      describe("when a local image is modified during a preview #notwercker", function() {
        return it("rerenders the image with a more recent timestamp query", function() {
          var imageURL, imageVer, ref2;
          ref2 = [], imageURL = ref2[0], imageVer = ref2[1];
          waitsForPromise(function() {
            return atom.workspace.open(filePath);
          });
          runs(function() {
            return atom.commands.dispatch(workspaceElement, 'markdown-preview-plus:toggle');
          });
          expectPreviewInSplitPane();
          runs(function() {
            imageURL = preview.find("img[alt=img1]").attr('src');
            imageVer = getImageVersion(img1Path, imageURL);
            expect(imageVer).not.toEqual('deleted');
            return fs.writeFileSync(img1Path, "still clearly not a png ;D");
          });
          waitsFor("image src attribute to update", function() {
            imageURL = preview.find("img[alt=img1]").attr('src');
            return !imageURL.endsWith(imageVer);
          });
          return runs(function() {
            var newImageVer;
            newImageVer = getImageVersion(img1Path, imageURL);
            expect(newImageVer).not.toEqual('deleted');
            return expect(parseInt(newImageVer)).toBeGreaterThan(parseInt(imageVer));
          });
        });
      });
      describe("when three images are previewed and all are modified #notwercker", function() {
        return it("rerenders the images with a more recent timestamp as they are modified", function() {
          var expectQueryValues, getImageElementsURL, img1URL, img1Ver, img2Path, img2URL, img2Ver, img3Path, img3URL, img3Ver, ref2, ref3, ref4;
          ref2 = [], img2Path = ref2[0], img3Path = ref2[1];
          ref3 = [], img1Ver = ref3[0], img2Ver = ref3[1], img3Ver = ref3[2];
          ref4 = [], img1URL = ref4[0], img2URL = ref4[1], img3URL = ref4[2];
          runs(function() {
            preview.destroy();
            img2Path = path.join(dirPath, 'img2.png');
            img3Path = path.join(dirPath, 'img3.png');
            fs.writeFileSync(img2Path, "i'm not really a png ;D");
            fs.writeFileSync(img3Path, "neither am i ;D");
            return fs.writeFileSync(filePath, "![img1](" + img1Path + ")\n![img2](" + img2Path + ")\n![img3](" + img3Path + ")");
          });
          waitsForPromise(function() {
            return atom.workspace.open(filePath);
          });
          runs(function() {
            return atom.commands.dispatch(workspaceElement, 'markdown-preview-plus:toggle');
          });
          expectPreviewInSplitPane();
          getImageElementsURL = function() {
            return [preview.find("img[alt=img1]").attr('src'), preview.find("img[alt=img2]").attr('src'), preview.find("img[alt=img3]").attr('src')];
          };
          expectQueryValues = function(queryValues) {
            var ref5;
            ref5 = getImageElementsURL(), img1URL = ref5[0], img2URL = ref5[1], img3URL = ref5[2];
            if (queryValues.img1 != null) {
              expect(img1URL).toStartWith(img1Path + "?v=");
              expect(img1URL).toBe(img1Path + "?v=" + queryValues.img1);
            }
            if (queryValues.img2 != null) {
              expect(img2URL).toStartWith(img2Path + "?v=");
              expect(img2URL).toBe(img2Path + "?v=" + queryValues.img2);
            }
            if (queryValues.img3 != null) {
              expect(img3URL).toStartWith(img3Path + "?v=");
              return expect(img3URL).toBe(img3Path + "?v=" + queryValues.img3);
            }
          };
          runs(function() {
            var ref5;
            ref5 = getImageElementsURL(), img1URL = ref5[0], img2URL = ref5[1], img3URL = ref5[2];
            img1Ver = getImageVersion(img1Path, img1URL);
            img2Ver = getImageVersion(img2Path, img2URL);
            img3Ver = getImageVersion(img3Path, img3URL);
            return fs.writeFileSync(img1Path, "still clearly not a png ;D");
          });
          waitsFor("img1 src attribute to update", function() {
            img1URL = preview.find("img[alt=img1]").attr('src');
            return !img1URL.endsWith(img1Ver);
          });
          runs(function() {
            var newImg1Ver;
            expectQueryValues({
              img2: img2Ver,
              img3: img3Ver
            });
            newImg1Ver = getImageVersion(img1Path, img1URL);
            expect(newImg1Ver).not.toEqual('deleted');
            expect(parseInt(newImg1Ver)).toBeGreaterThan(parseInt(img1Ver));
            img1Ver = newImg1Ver;
            return fs.writeFileSync(img2Path, "still clearly not a png either ;D");
          });
          waitsFor("img2 src attribute to update", function() {
            img2URL = preview.find("img[alt=img2]").attr('src');
            return !img2URL.endsWith(img2Ver);
          });
          runs(function() {
            var newImg2Ver;
            expectQueryValues({
              img1: img1Ver,
              img3: img3Ver
            });
            newImg2Ver = getImageVersion(img2Path, img2URL);
            expect(newImg2Ver).not.toEqual('deleted');
            expect(parseInt(newImg2Ver)).toBeGreaterThan(parseInt(img2Ver));
            img2Ver = newImg2Ver;
            return fs.writeFileSync(img3Path, "you better believe i'm not a png ;D");
          });
          waitsFor("img3 src attribute to update", function() {
            img3URL = preview.find("img[alt=img3]").attr('src');
            return !img3URL.endsWith(img3Ver);
          });
          return runs(function() {
            var newImg3Ver;
            expectQueryValues({
              img1: img1Ver,
              img2: img2Ver
            });
            newImg3Ver = getImageVersion(img3Path, img3URL);
            expect(newImg3Ver).not.toEqual('deleted');
            return expect(parseInt(newImg3Ver)).toBeGreaterThan(parseInt(img3Ver));
          });
        });
      });
      describe("when a previewed image is deleted then restored", function() {
        return it("removes the query timestamp and restores the timestamp after a rerender", function() {
          var imageURL, imageVer, ref2;
          ref2 = [], imageURL = ref2[0], imageVer = ref2[1];
          waitsForPromise(function() {
            return atom.workspace.open(filePath);
          });
          runs(function() {
            return atom.commands.dispatch(workspaceElement, 'markdown-preview-plus:toggle');
          });
          expectPreviewInSplitPane();
          runs(function() {
            imageURL = preview.find("img[alt=img1]").attr('src');
            imageVer = getImageVersion(img1Path, imageURL);
            expect(imageVer).not.toEqual('deleted');
            return fs.unlinkSync(img1Path);
          });
          waitsFor("image src attribute to update", function() {
            imageURL = preview.find("img[alt=img1]").attr('src');
            return !imageURL.endsWith(imageVer);
          });
          runs(function() {
            expect(imageURL).toBe(img1Path);
            fs.writeFileSync(img1Path, "clearly not a png but good enough for tests");
            return preview.renderMarkdown();
          });
          waitsFor("image src attribute to update", function() {
            imageURL = preview.find("img[alt=img1]").attr('src');
            return imageURL !== img1Path;
          });
          return runs(function() {
            var newImageVer;
            newImageVer = getImageVersion(img1Path, imageURL);
            return expect(parseInt(newImageVer)).toBeGreaterThan(parseInt(imageVer));
          });
        });
      });
      return describe("when a previewed image is renamed and then restored with its original name", function() {
        return it("removes the query timestamp and restores the timestamp after a rerender", function() {
          var imageURL, imageVer, ref2;
          ref2 = [], imageURL = ref2[0], imageVer = ref2[1];
          waitsForPromise(function() {
            return atom.workspace.open(filePath);
          });
          runs(function() {
            return atom.commands.dispatch(workspaceElement, 'markdown-preview-plus:toggle');
          });
          expectPreviewInSplitPane();
          runs(function() {
            imageURL = preview.find("img[alt=img1]").attr('src');
            imageVer = getImageVersion(img1Path, imageURL);
            expect(imageVer).not.toEqual('deleted');
            return fs.renameSync(img1Path, img1Path + "trol");
          });
          waitsFor("image src attribute to update", function() {
            imageURL = preview.find("img[alt=img1]").attr('src');
            return !imageURL.endsWith(imageVer);
          });
          runs(function() {
            expect(imageURL).toBe(img1Path);
            fs.renameSync(img1Path + "trol", img1Path);
            return preview.renderMarkdown();
          });
          waitsFor("image src attribute to update", function() {
            imageURL = preview.find("img[alt=img1]").attr('src');
            return imageURL !== img1Path;
          });
          return runs(function() {
            var newImageVer;
            newImageVer = getImageVersion(img1Path, imageURL);
            return expect(parseInt(newImageVer)).toBeGreaterThan(parseInt(imageVer));
          });
        });
      });
    });
    describe("gfm newlines", function() {
      describe("when gfm newlines are not enabled", function() {
        return it("creates a single paragraph with <br>", function() {
          atom.config.set('markdown-preview-plus.breakOnSingleNewline', false);
          waitsForPromise(function() {
            return preview.renderMarkdown();
          });
          return runs(function() {
            return expect(preview.find("p:last-child br").length).toBe(0);
          });
        });
      });
      return describe("when gfm newlines are enabled", function() {
        return it("creates a single paragraph with no <br>", function() {
          atom.config.set('markdown-preview-plus.breakOnSingleNewline', true);
          waitsForPromise(function() {
            return preview.renderMarkdown();
          });
          return runs(function() {
            return expect(preview.find("p:last-child br").length).toBe(1);
          });
        });
      });
    });
    describe("when core:save-as is triggered", function() {
      beforeEach(function() {
        preview.destroy();
        filePath = atom.project.getDirectories()[0].resolve('subdir/code-block.md');
        preview = new MarkdownPreviewView({
          filePath: filePath
        });
        return jasmine.attachToDOM(preview.element);
      });
      it("saves the rendered HTML and opens it", function() {
        var atomTextEditorStyles, createRule, expectedFilePath, expectedOutput, markdownPreviewStyles, openedPromise, outputPath, textEditor;
        outputPath = temp.path({
          suffix: '.html'
        });
        expectedFilePath = atom.project.getDirectories()[0].resolve('saved-html.html');
        expectedOutput = fs.readFileSync(expectedFilePath).toString();
        createRule = function(selector, css) {
          return {
            selectorText: selector,
            cssText: selector + " " + css
          };
        };
        markdownPreviewStyles = [
          {
            rules: [createRule(".markdown-preview", "{ color: orange; }")]
          }, {
            rules: [createRule(".not-included", "{ color: green; }"), createRule(".markdown-preview :host", "{ color: purple; }")]
          }
        ];
        atomTextEditorStyles = ["atom-text-editor .line { color: brown; }\natom-text-editor .number { color: cyan; }", "atom-text-editor :host .something { color: black; }", "atom-text-editor .hr { background: url(atom://markdown-preview-plus/assets/hr.png); }"];
        expect(fs.isFileSync(outputPath)).toBe(false);
        waitsForPromise("renderMarkdown", function() {
          return preview.renderMarkdown();
        });
        textEditor = null;
        openedPromise = new Promise(function(resolve) {
          return atom.workspace.onDidAddTextEditor(function(event) {
            textEditor = event.textEditor;
            return resolve();
          });
        });
        runs(function() {
          spyOn(atom, 'showSaveDialogSync').andReturn(outputPath);
          spyOn(preview, 'getDocumentStyleSheets').andReturn(markdownPreviewStyles);
          spyOn(preview, 'getTextEditorStyles').andReturn(atomTextEditorStyles);
          return atom.commands.dispatch(preview.element, 'core:save-as');
        });
        waitsForPromise("text editor opened", function() {
          return openedPromise;
        });
        return runs(function() {
          var savedHTML;
          expect(fs.isFileSync(outputPath)).toBe(true);
          expect(fs.realpathSync(textEditor.getPath())).toBe(fs.realpathSync(outputPath));
          savedHTML = textEditor.getText().replace(/<body class='markdown-preview'><div>/, '<body class=\'markdown-preview\'>').replace(/\n<\/div><\/body>/, '</body>');
          return expect(savedHTML).toBe(expectedOutput.replace(/\r\n/g, '\n'));
        });
      });
      return describe("text editor style extraction", function() {
        var extractedStyles, textEditorStyle, unrelatedStyle;
        extractedStyles = [][0];
        textEditorStyle = ".editor-style .extraction-test { color: blue; }";
        unrelatedStyle = ".something else { color: red; }";
        beforeEach(function() {
          atom.styles.addStyleSheet(textEditorStyle, {
            context: 'atom-text-editor'
          });
          atom.styles.addStyleSheet(unrelatedStyle, {
            context: 'unrelated-context'
          });
          return extractedStyles = preview.getTextEditorStyles();
        });
        it("returns an array containing atom-text-editor css style strings", function() {
          return expect(extractedStyles.indexOf(textEditorStyle)).toBeGreaterThan(-1);
        });
        return it("does not return other styles", function() {
          return expect(extractedStyles.indexOf(unrelatedStyle)).toBe(-1);
        });
      });
    });
    describe("when core:copy is triggered", function() {
      return it("writes the rendered HTML to the clipboard", function() {
        preview.destroy();
        preview.element.remove();
        filePath = atom.project.getDirectories()[0].resolve('subdir/code-block.md');
        preview = new MarkdownPreviewView({
          filePath: filePath
        });
        jasmine.attachToDOM(preview.element);
        waitsForPromise(function() {
          return preview.renderMarkdown();
        });
        runs(function() {
          return atom.commands.dispatch(preview.element, 'core:copy');
        });
        waitsFor(function() {
          return atom.clipboard.read() !== "initial clipboard content";
        });
        return runs(function() {
          return expect(atom.clipboard.read()).toBe("<h1>Code Block</h1>\n<pre class=\"editor-colors lang-javascript\"><div class=\"line\"><span class=\"syntax--source syntax--js\"><span class=\"syntax--keyword syntax--control syntax--js\"><span>if</span></span><span>&nbsp;a&nbsp;</span><span class=\"syntax--keyword syntax--operator syntax--comparison syntax--js\"><span>===</span></span><span>&nbsp;</span><span class=\"syntax--constant syntax--numeric syntax--decimal syntax--js\"><span>3</span></span><span>&nbsp;</span><span class=\"syntax--meta syntax--brace syntax--curly syntax--js\"><span>{</span></span></span>\n</div><div class=\"line\"><span class=\"syntax--source syntax--js\"><span>&nbsp;&nbsp;b&nbsp;</span><span class=\"syntax--keyword syntax--operator syntax--assignment syntax--js\"><span>=</span></span><span>&nbsp;</span><span class=\"syntax--constant syntax--numeric syntax--decimal syntax--js\"><span>5</span></span></span>\n</div><div class=\"line\"><span class=\"syntax--source syntax--js\"><span class=\"syntax--meta syntax--brace syntax--curly syntax--js\"><span>}</span></span></span>\n</div></pre>\n<p>encoding → issue</p>");
        });
      });
    });
    return describe("when maths rendering is enabled by default", function() {
      return it("notifies the user MathJax is loading when first preview is opened", function() {
        var workspaceElement;
        workspaceElement = [][0];
        preview.destroy();
        waitsForPromise(function() {
          return atom.packages.activatePackage('notifications');
        });
        runs(function() {
          workspaceElement = atom.views.getView(atom.workspace);
          return jasmine.attachToDOM(workspaceElement);
        });
        waitsForPromise(function() {
          return atom.workspace.open(filePath);
        });
        runs(function() {
          mathjaxHelper.resetMathJax();
          atom.config.set('markdown-preview-plus.enableLatexRenderingByDefault', true);
          return atom.commands.dispatch(workspaceElement, 'markdown-preview-plus:toggle');
        });
        expectPreviewInSplitPane();
        waitsFor("notification", function() {
          return workspaceElement.querySelector('atom-notification');
        });
        return runs(function() {
          var notification;
          notification = workspaceElement.querySelector('atom-notification.info');
          return expect(notification).toExist();
        });
      });
    });
  });

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL2hvbWUvbWFyY3VzLy5hdG9tL3BhY2thZ2VzL21hcmtkb3duLXByZXZpZXctcGx1cy9zcGVjL21hcmtkb3duLXByZXZpZXctdmlldy1zcGVjLmNvZmZlZSJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQUFBLE1BQUE7O0VBQUEsSUFBQSxHQUFPLE9BQUEsQ0FBUSxNQUFSOztFQUNQLEVBQUEsR0FBSyxPQUFBLENBQVEsU0FBUjs7RUFDTCxJQUFBLEdBQU8sT0FBQSxDQUFRLE1BQVI7O0VBQ1AsbUJBQUEsR0FBc0IsT0FBQSxDQUFRLDhCQUFSOztFQUN0QixVQUFBLEdBQWEsT0FBQSxDQUFRLDJCQUFSOztFQUNiLGFBQUEsR0FBZ0IsT0FBQSxDQUFRLHVCQUFSOztFQUNoQixHQUFBLEdBQU0sT0FBQSxDQUFRLEtBQVI7O0VBQ04sV0FBQSxHQUFjLE9BQUEsQ0FBUSxhQUFSOztFQUVkLE9BQUEsQ0FBUSxlQUFSOztFQUVBLFFBQUEsQ0FBUyxxQkFBVCxFQUFnQyxTQUFBO0FBQzlCLFFBQUE7SUFBQSxNQUFzQixFQUF0QixFQUFDLGlCQUFELEVBQVc7SUFFWCxVQUFBLENBQVcsU0FBQTtNQUNULE9BQUEsR0FBVSxRQUFBLEdBQVc7TUFDckIsZUFBQSxDQUFnQixTQUFBO2VBQ2QsT0FBTyxDQUFDLEdBQVIsQ0FBWSxDQUNWLElBQUksQ0FBQyxRQUFRLENBQUMsZUFBZCxDQUE4QixlQUE5QixDQURVLEVBRVYsSUFBSSxDQUFDLFFBQVEsQ0FBQyxlQUFkLENBQThCLHFCQUE5QixDQUZVLENBQVo7TUFEYyxDQUFoQjtNQU1BLFFBQUEsQ0FBUyxTQUFBO2VBQ1AsSUFBSSxDQUFDLFFBQVEsQ0FBQyxtQkFBZCxDQUFrQyxhQUFsQyxDQUFBLEtBQXNEO01BRC9DLENBQVQ7TUFHQSxRQUFBLENBQVMsU0FBQTtlQUNQLElBQUksQ0FBQyxRQUFRLENBQUMsbUJBQWQsQ0FBa0MsV0FBbEMsQ0FBQSxLQUFvRDtNQUQ3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Q0FBQyxPQUFSLENBQUE7UUFFQSxlQUFBLENBQWdCLFNBQUE7aUJBQUcsSUFBSSxDQUFDLFFBQVEsQ0FBQyxlQUFkLENBQThCLGVBQTlCO1FBQUgsQ0FBaEI7UUFFQSxJQUFBLENBQUssU0FBQTtVQUNILGdCQUFBLEdBQW1CLElBQUksQ0FBQyxLQUFLLENBQUMsT0FBWCxDQUFtQixJQUFJLENBQUMsU0FBeEI7aUJBQ25CLE9BQU8sQ0FBQyxXQUFSLENBQW9CLGdCQUFwQjtRQUZHLENBQUw7UUFJQSxlQUFBLENBQWdCLFNBQUE7aUJBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFmLENBQW9CLFFBQXBCO1FBQUgsQ0FBaEI7UUFFQSxJQUFBLENBQUssU0FBQTtVQUNILGFBQWEsQ0FBQyxZQUFkLENBQUE7VUFDQSxJQUFJLENBQUMsTUFBTSxDQUFDLEdBQVosQ0FBZ0IscURBQWhCLEVBQXVFLElBQXZFO2lCQUNBLElBQUksQ0FBQyxRQUFRLENBQUMsUUFBZCxDQUF1QixnQkFBdkIsRUFBeUMsOEJBQXpDO1FBSEcsQ0FBTDtRQUtBLHdCQUFBLENBQUE7UUFFQSxRQUFBLENBQVMsY0FBVCxFQUF5QixTQUFBO2lCQUN2QixnQkFBZ0IsQ0FBQyxhQUFqQixDQUErQixtQkFBL0I7UUFEdUIsQ0FBekI7ZUFHQSxJQUFBLENBQUssU0FBQTtBQUNILGNBQUE7VUFBQSxZQUFBLEdBQWUsZ0JBQWdCLENBQUMsYUFBakIsQ0FBK0Isd0JBQS9CO2lCQUNmLE1BQUEsQ0FBTyxZQUFQLENBQW9CLENBQUMsT0FBckIsQ0FBQTtRQUZHLENBQUw7TUF2QnNFLENBQXhFO0lBRHFELENBQXZEO0VBemtCOEIsQ0FBaEM7QUFYQSIsInNvdXJjZXNDb250ZW50IjpbInBhdGggPSByZXF1aXJlICdwYXRoJ1xuZnMgPSByZXF1aXJlICdmcy1wbHVzJ1xudGVtcCA9IHJlcXVpcmUgJ3RlbXAnXG5NYXJrZG93blByZXZpZXdWaWV3ID0gcmVxdWlyZSAnLi4vbGliL21hcmtkb3duLXByZXZpZXctdmlldydcbm1hcmtkb3duSXQgPSByZXF1aXJlICcuLi9saWIvbWFya2Rvd24taXQtaGVscGVyJ1xubWF0aGpheEhlbHBlciA9IHJlcXVpcmUgJy4uL2xpYi9tYXRoamF4LWhlbHBlcidcbnVybCA9IHJlcXVpcmUgJ3VybCdcbnF1ZXJ5U3RyaW5nID0gcmVxdWlyZSAncXVlcnlzdHJpbmcnXG5cbnJlcXVpcmUgJy4vc3BlYy1oZWxwZXInXG5cbmRlc2NyaWJlIFwiTWFya2Rvd25QcmV2aWV3Vmlld1wiLCAtPlxuICBbZmlsZVBhdGgsIHByZXZpZXddID0gW11cblxuICBiZWZvcmVFYWNoIC0+XG4gICAgcHJldmlldyA9IGZpbGVQYXRoID0gbnVsbFxuICAgIHdhaXRzRm9yUHJvbWlzZSAtPlxuICAgICAgUHJvbWlzZS5hbGwgW1xuICAgICAgICBhdG9tLnBhY2thZ2VzLmFjdGl2YXRlUGFja2FnZSgnbGFuZ3VhZ2UtcnVieScpXG4gICAgICAgIGF0b20ucGFja2FnZXMuYWN0aXZhdGVQYWNrYWdlKCdsYW5ndWFnZS1qYXZhc2NyaXB0JylcbiAgICAgIF1cblxuICAgIHdhaXRzRm9yIC0+XG4gICAgICBhdG9tLmdyYW1tYXJzLmdyYW1tYXJGb3JTY29wZU5hbWUoJ3NvdXJjZS5ydWJ5JykgaXNudCB1bmRlZmluZWRcblxuICAgIHdhaXRzRm9yIC0+XG4gICAgICBhdG9tLmdyYW1tYXJzLmdyYW1tYXJGb3JTY29wZU5hbWUoJ3NvdXJjZS5qcycpIGlzbnQgdW5kZWZpbmVkXG5cbiAgICB3YWl0c0ZvclByb21pc2UgLT5cbiAgICAgIGF0b20ucGFja2FnZXMuYWN0aXZhdGVQYWNrYWdlKCdtYXJrZG93bi1wcmV2aWV3LXBsdXMnKVxuXG4gICAgcnVucyAtPlxuICAgICAgZmlsZVBhdGggPSBhdG9tLnByb2plY3QuZ2V0RGlyZWN0b3JpZXMoKVswXS5yZXNvbHZlKCdzdWJkaXIvZmlsZS5tYXJrZG93bicpXG4gICAgICBwcmV2aWV3ID0gbmV3IE1hcmtkb3duUHJldmlld1ZpZXcoe2ZpbGVQYXRofSlcbiAgICAgIGphc21pbmUuYXR0YWNoVG9ET00ocHJldmlldy5lbGVtZW50KVxuXG4gICAgICB0aGlzLmFkZE1hdGNoZXJzXG4gICAgICAgIHRvU3RhcnRXaXRoOiAoZXhwZWN0ZWQpIC0+XG4gICAgICAgICAgdGhpcy5hY3R1YWwuc2xpY2UoMCwgZXhwZWN0ZWQubGVuZ3RoKSBpcyBleHBlY3RlZFxuXG4gIGFmdGVyRWFjaCAtPlxuICAgIHByZXZpZXcuZGVzdHJveSgpXG5cbiAgZXhwZWN0UHJldmlld0luU3BsaXRQYW5lID0gLT5cbiAgICB3YWl0c0ZvciAtPlxuICAgICAgYXRvbS53b3Jrc3BhY2UuZ2V0Q2VudGVyKCkuZ2V0UGFuZXMoKS5sZW5ndGggaXMgMlxuXG4gICAgd2FpdHNGb3IgXCJtYXJrZG93biBwcmV2aWV3IHRvIGJlIGNyZWF0ZWRcIiwgLT5cbiAgICAgIHByZXZpZXcgPSBhdG9tLndvcmtzcGFjZS5nZXRDZW50ZXIoKS5nZXRQYW5lcygpWzFdLmdldEFjdGl2ZUl0ZW0oKVxuXG4gICAgcnVucyAtPlxuICAgICAgZXhwZWN0KHByZXZpZXcpLnRvQmVJbnN0YW5jZU9mKE1hcmtkb3duUHJldmlld1ZpZXcpXG4gICAgICBleHBlY3QocHJldmlldy5nZXRQYXRoKCkpLnRvQmUgYXRvbS53b3Jrc3BhY2UuZ2V0QWN0aXZlUGFuZUl0ZW0oKS5nZXRQYXRoKClcblxuICBkZXNjcmliZSBcIjo6Y29uc3RydWN0b3JcIiwgLT5cbiAgICAjIExvYWRpbmcgc3Bpbm5lciBkaXNhYmxlZCB3aGVuIERPTSB1cGRhdGUgYnkgZGlmZiB3YXMgaW50cm9kdWNlZC4gSWZcbiAgICAjIHNwaW5uZXIgY29kZSBpbiBgbGliL21hcmtkb3duLXByZXZpZXctdmlld2AgaXMgcmVtb3ZlZCBjb21wbGV0bHkgdGhpc1xuICAgICMgc3BlYyBzaG91bGQgYWxzbyBiZSByZW1vdmVkXG4gICAgI1xuICAgICMgaXQgXCJzaG93cyBhIGxvYWRpbmcgc3Bpbm5lciBhbmQgcmVuZGVycyB0aGUgbWFya2Rvd25cIiwgLT5cbiAgICAjICAgcHJldmlldy5zaG93TG9hZGluZygpXG4gICAgIyAgIGV4cGVjdChwcmV2aWV3LmZpbmQoJy5tYXJrZG93bi1zcGlubmVyJykpLnRvRXhpc3QoKVxuICAgICNcbiAgICAjICAgd2FpdHNGb3JQcm9taXNlIC0+XG4gICAgIyAgICAgcHJldmlldy5yZW5kZXJNYXJrZG93bigpXG4gICAgI1xuICAgICMgICBydW5zIC0+XG4gICAgIyAgICAgZXhwZWN0KHByZXZpZXcuZmluZChcIi5lbW9qaVwiKSkudG9FeGlzdCgpXG5cbiAgICBpdCBcInNob3dzIGFuIGVycm9yIG1lc3NhZ2Ugd2hlbiB0aGVyZSBpcyBhbiBlcnJvclwiLCAtPlxuICAgICAgcHJldmlldy5zaG93RXJyb3IoXCJOb3QgYSByZWFsIGZpbGVcIilcbiAgICAgIGV4cGVjdChwcmV2aWV3LnRleHQoKSkudG9Db250YWluIFwiRmFpbGVkXCJcblxuICBkZXNjcmliZSBcInNlcmlhbGl6YXRpb25cIiwgLT5cbiAgICBuZXdQcmV2aWV3ID0gbnVsbFxuXG4gICAgYWZ0ZXJFYWNoIC0+XG4gICAgICBuZXdQcmV2aWV3Py5kZXN0cm95KClcblxuICAgIGl0IFwicmVjcmVhdGVzIHRoZSBwcmV2aWV3IHdoZW4gc2VyaWFsaXplZC9kZXNlcmlhbGl6ZWRcIiwgLT5cbiAgICAgIG5ld1ByZXZpZXcgPSBhdG9tLmRlc2VyaWFsaXplcnMuZGVzZXJpYWxpemUocHJldmlldy5zZXJpYWxpemUoKSlcbiAgICAgIGphc21pbmUuYXR0YWNoVG9ET00obmV3UHJldmlldy5lbGVtZW50KVxuICAgICAgZXhwZWN0KG5ld1ByZXZpZXcuZ2V0UGF0aCgpKS50b0JlIHByZXZpZXcuZ2V0UGF0aCgpXG5cbiAgICBpdCBcImRvZXMgbm90IHJlY3JlYXRlIGEgcHJldmlldyB3aGVuIHRoZSBmaWxlIG5vIGxvbmdlciBleGlzdHNcIiwgLT5cbiAgICAgIGZpbGVQYXRoID0gcGF0aC5qb2luKHRlbXAubWtkaXJTeW5jKCdtYXJrZG93bi1wcmV2aWV3LScpLCAnZm9vLm1kJylcbiAgICAgIGZzLndyaXRlRmlsZVN5bmMoZmlsZVBhdGgsICcjIEhpJylcblxuICAgICAgbmV3UHJldmlldyA9IG5ldyBNYXJrZG93blByZXZpZXdWaWV3KHtmaWxlUGF0aH0pXG4gICAgICBzZXJpYWxpemVkID0gbmV3UHJldmlldy5zZXJpYWxpemUoKVxuICAgICAgZnMucmVtb3ZlU3luYyhmaWxlUGF0aClcblxuICAgICAgbmV3UHJldmlldyA9IGF0b20uZGVzZXJpYWxpemVycy5kZXNlcmlhbGl6ZShzZXJpYWxpemVkKVxuICAgICAgZXhwZWN0KG5ld1ByZXZpZXcpLnRvQmVVbmRlZmluZWQoKVxuXG4gICAgaXQgXCJzZXJpYWxpemVzIHRoZSBlZGl0b3IgaWQgd2hlbiBvcGVuZWQgZm9yIGFuIGVkaXRvclwiLCAtPlxuICAgICAgcHJldmlldy5kZXN0cm95KClcblxuICAgICAgd2FpdHNGb3JQcm9taXNlIC0+XG4gICAgICAgIGF0b20ud29ya3NwYWNlLm9wZW4oJ25ldy5tYXJrZG93bicpXG5cbiAgICAgIHJ1bnMgLT5cbiAgICAgICAgcHJldmlldyA9IG5ldyBNYXJrZG93blByZXZpZXdWaWV3KHtlZGl0b3JJZDogYXRvbS53b3Jrc3BhY2UuZ2V0QWN0aXZlVGV4dEVkaXRvcigpLmlkfSlcblxuICAgICAgICBqYXNtaW5lLmF0dGFjaFRvRE9NKHByZXZpZXcuZWxlbWVudClcbiAgICAgICAgZXhwZWN0KHByZXZpZXcuZ2V0UGF0aCgpKS50b0JlIGF0b20ud29ya3NwYWNlLmdldEFjdGl2ZVRleHRFZGl0b3IoKS5nZXRQYXRoKClcblxuICAgICAgICBuZXdQcmV2aWV3ID0gYXRvbS5kZXNlcmlhbGl6ZXJzLmRlc2VyaWFsaXplKHByZXZpZXcuc2VyaWFsaXplKCkpXG4gICAgICAgIGphc21pbmUuYXR0YWNoVG9ET00obmV3UHJldmlldy5lbGVtZW50KVxuICAgICAgICBleHBlY3QobmV3UHJldmlldy5nZXRQYXRoKCkpLnRvQmUgcHJldmlldy5nZXRQYXRoKClcblxuICBkZXNjcmliZSBcImhlYWRlciByZW5kZXJpbmdcIiwgLT5cblxuICAgIGl0IFwic2hvdWxkIHJlbmRlciBoZWFkaW5ncyB3aXRoIGFuZCB3aXRob3V0IHNwYWNlXCIsIC0+XG5cbiAgICAgIHdhaXRzRm9yUHJvbWlzZSAtPiBwcmV2aWV3LnJlbmRlck1hcmtkb3duKClcblxuICAgICAgcnVucyAtPlxuICAgICAgICBoZWFkbGluZXMgPSBwcmV2aWV3LmZpbmQoJ2gyJylcbiAgICAgICAgZXhwZWN0KGhlYWRsaW5lcykudG9FeGlzdCgpXG4gICAgICAgIGV4cGVjdChoZWFkbGluZXMubGVuZ3RoKS50b0JlKDIpXG4gICAgICAgIGV4cGVjdChoZWFkbGluZXNbMF0ub3V0ZXJIVE1MKS50b0JlKFwiPGgyPkxldmVsIHR3byBoZWFkZXIgd2l0aG91dCBzcGFjZTwvaDI+XCIpXG4gICAgICAgIGV4cGVjdChoZWFkbGluZXNbMV0ub3V0ZXJIVE1MKS50b0JlKFwiPGgyPkxldmVsIHR3byBoZWFkZXIgd2l0aCBzcGFjZTwvaDI+XCIpXG5cbiAgICBpdCBcInNob3VsZCByZW5kZXIgaGVhZGluZ3Mgd2l0aCBhbmQgd2l0aG91dCBzcGFjZVwiLCAtPlxuICAgICAgYXRvbS5jb25maWcuc2V0ICdtYXJrZG93bi1wcmV2aWV3LXBsdXMudXNlTGF6eUhlYWRlcnMnLCBmYWxzZVxuXG4gICAgICB3YWl0c0ZvclByb21pc2UgLT4gcHJldmlldy5yZW5kZXJNYXJrZG93bigpXG5cbiAgICAgIHJ1bnMgLT5cbiAgICAgICAgaGVhZGxpbmVzID0gcHJldmlldy5maW5kKCdoMicpXG4gICAgICAgIGV4cGVjdChoZWFkbGluZXMpLnRvRXhpc3QoKVxuICAgICAgICBleHBlY3QoaGVhZGxpbmVzLmxlbmd0aCkudG9CZSgxKVxuICAgICAgICBleHBlY3QoaGVhZGxpbmVzWzBdLm91dGVySFRNTCkudG9CZShcIjxoMj5MZXZlbCB0d28gaGVhZGVyIHdpdGggc3BhY2U8L2gyPlwiKVxuXG5cbiAgZGVzY3JpYmUgXCJjb2RlIGJsb2NrIGNvbnZlcnNpb24gdG8gYXRvbS10ZXh0LWVkaXRvciB0YWdzXCIsIC0+XG4gICAgYmVmb3JlRWFjaCAtPlxuICAgICAgd2FpdHNGb3JQcm9taXNlIC0+XG4gICAgICAgIHByZXZpZXcucmVuZGVyTWFya2Rvd24oKVxuXG4gICAgaXQgXCJyZW1vdmVzIGxpbmUgZGVjb3JhdGlvbnMgb24gcmVuZGVyZWQgY29kZSBibG9ja3NcIiwgLT5cbiAgICAgIGVkaXRvciA9IHByZXZpZXcuZmluZChcImF0b20tdGV4dC1lZGl0b3JbZGF0YS1ncmFtbWFyPSd0ZXh0IHBsYWluIG51bGwtZ3JhbW1hciddXCIpXG4gICAgICBkZWNvcmF0aW9ucyA9IGVkaXRvclswXS5nZXRNb2RlbCgpLmdldERlY29yYXRpb25zKGNsYXNzOiAnY3Vyc29yLWxpbmUnLCB0eXBlOiAnbGluZScpXG4gICAgICBleHBlY3QoZGVjb3JhdGlvbnMubGVuZ3RoKS50b0JlIDBcblxuICAgIGl0IFwicmVtb3ZlcyBhIHRyYWlsaW5nIG5ld2xpbmUgYnV0IHByZXNlcnZlcyByZW1haW5pbmcgbGVhZGluZyBhbmQgdHJhaWxpbmcgd2hpdGVzcGFjZVwiLCAtPlxuICAgICAgbmV3RmlsZVBhdGggPSBhdG9tLnByb2plY3QuZ2V0RGlyZWN0b3JpZXMoKVswXS5yZXNvbHZlKCdzdWJkaXIvdHJpbS1ubC5tZCcpXG4gICAgICBuZXdQcmV2aWV3ID0gbmV3IE1hcmtkb3duUHJldmlld1ZpZXcoe2ZpbGVQYXRoOiBuZXdGaWxlUGF0aH0pXG4gICAgICBqYXNtaW5lLmF0dGFjaFRvRE9NKG5ld1ByZXZpZXcuZWxlbWVudClcblxuICAgICAgd2FpdHNGb3JQcm9taXNlIC0+XG4gICAgICAgIG5ld1ByZXZpZXcucmVuZGVyTWFya2Rvd24oKVxuXG4gICAgICBydW5zIC0+XG4gICAgICAgIGVkaXRvciA9IG5ld1ByZXZpZXcuZmluZChcImF0b20tdGV4dC1lZGl0b3JcIilcbiAgICAgICAgZXhwZWN0KGVkaXRvcikudG9FeGlzdCgpXG4gICAgICAgIGV4cGVjdChlZGl0b3JbMF0uZ2V0TW9kZWwoKS5nZXRUZXh0KCkpLnRvQmUgXCJcIlwiXG5cbiAgICAgICAgICAgICAgIGFcbiAgICAgICAgICAgICAgYlxuICAgICAgICAgICAgIGNcbiAgICAgICAgICAgIGRcbiAgICAgICAgICAgZVxuICAgICAgICAgIGZcblxuICAgICAgICBcIlwiXCJcblxuICAgICAgcnVucyAtPlxuICAgICAgICBuZXdQcmV2aWV3LmRlc3Ryb3koKVxuXG4gICAgZGVzY3JpYmUgXCJ3aGVuIHRoZSBjb2RlIGJsb2NrJ3MgZmVuY2UgbmFtZSBoYXMgYSBtYXRjaGluZyBncmFtbWFyXCIsIC0+XG4gICAgICBpdCBcImFzc2lnbnMgdGhlIGdyYW1tYXIgb24gdGhlIGF0b20tdGV4dC1lZGl0b3JcIiwgLT5cbiAgICAgICAgcnVieUVkaXRvciA9IHByZXZpZXcuZmluZChcImF0b20tdGV4dC1lZGl0b3JbZGF0YS1ncmFtbWFyPSdzb3VyY2UgcnVieSddXCIpXG4gICAgICAgIGV4cGVjdChydWJ5RWRpdG9yKS50b0V4aXN0KClcbiAgICAgICAgZXhwZWN0KHJ1YnlFZGl0b3JbMF0uZ2V0TW9kZWwoKS5nZXRUZXh0KCkpLnRvQmUgXCJcIlwiXG4gICAgICAgICAgZGVmIGZ1bmNcbiAgICAgICAgICAgIHggPSAxXG4gICAgICAgICAgZW5kXG4gICAgICAgIFwiXCJcIlxuXG4gICAgICAgICMgbmVzdGVkIGluIGEgbGlzdCBpdGVtXG4gICAgICAgIGpzRWRpdG9yID0gcHJldmlldy5maW5kKFwiYXRvbS10ZXh0LWVkaXRvcltkYXRhLWdyYW1tYXI9J3NvdXJjZSBqcyddXCIpXG4gICAgICAgIGV4cGVjdChqc0VkaXRvcikudG9FeGlzdCgpXG4gICAgICAgIGV4cGVjdChqc0VkaXRvclswXS5nZXRNb2RlbCgpLmdldFRleHQoKSkudG9CZSBcIlwiXCJcbiAgICAgICAgICBpZiBhID09PSAzIHtcbiAgICAgICAgICAgIGIgPSA1XG4gICAgICAgICAgfVxuICAgICAgICBcIlwiXCJcblxuICAgIGRlc2NyaWJlIFwid2hlbiB0aGUgY29kZSBibG9jaydzIGZlbmNlIG5hbWUgZG9lc24ndCBoYXZlIGEgbWF0Y2hpbmcgZ3JhbW1hclwiLCAtPlxuICAgICAgaXQgXCJkb2VzIG5vdCBhc3NpZ24gYSBzcGVjaWZpYyBncmFtbWFyXCIsIC0+XG4gICAgICAgIHBsYWluRWRpdG9yID0gcHJldmlldy5maW5kKFwiYXRvbS10ZXh0LWVkaXRvcltkYXRhLWdyYW1tYXI9J3RleHQgcGxhaW4gbnVsbC1ncmFtbWFyJ11cIilcbiAgICAgICAgZXhwZWN0KHBsYWluRWRpdG9yKS50b0V4aXN0KClcbiAgICAgICAgZXhwZWN0KHBsYWluRWRpdG9yWzBdLmdldE1vZGVsKCkuZ2V0VGV4dCgpKS50b0JlIFwiXCJcIlxuICAgICAgICAgIGZ1bmN0aW9uIGYoeCkge1xuICAgICAgICAgICAgcmV0dXJuIHgrKztcbiAgICAgICAgICB9XG4gICAgICAgIFwiXCJcIlxuXG4gIGRlc2NyaWJlIFwiaW1hZ2UgcmVzb2x2aW5nXCIsIC0+XG4gICAgYmVmb3JlRWFjaCAtPlxuICAgICAgc3B5T24obWFya2Rvd25JdCwgJ2RlY29kZScpLmFuZENhbGxUaHJvdWdoKClcbiAgICAgIHdhaXRzRm9yUHJvbWlzZSAtPlxuICAgICAgICBwcmV2aWV3LnJlbmRlck1hcmtkb3duKClcblxuICAgIGRlc2NyaWJlIFwid2hlbiB0aGUgaW1hZ2UgdXNlcyBhIHJlbGF0aXZlIHBhdGhcIiwgLT5cbiAgICAgIGl0IFwicmVzb2x2ZXMgdG8gYSBwYXRoIHJlbGF0aXZlIHRvIHRoZSBmaWxlXCIsIC0+XG4gICAgICAgIGltYWdlID0gcHJldmlldy5maW5kKFwiaW1nW2FsdD1JbWFnZTFdXCIpXG4gICAgICAgIGV4cGVjdChtYXJrZG93bkl0LmRlY29kZSkudG9IYXZlQmVlbkNhbGxlZCgpXG4gICAgICAgIGV4cGVjdChpbWFnZS5hdHRyKCdzcmMnKSkudG9TdGFydFdpdGggYXRvbS5wcm9qZWN0LmdldERpcmVjdG9yaWVzKClbMF0ucmVzb2x2ZSgnc3ViZGlyL2ltYWdlMS5wbmcnKVxuXG4gICAgZGVzY3JpYmUgXCJ3aGVuIHRoZSBpbWFnZSB1c2VzIGFuIGFic29sdXRlIHBhdGggdGhhdCBkb2VzIG5vdCBleGlzdFwiLCAtPlxuICAgICAgaXQgXCJyZXNvbHZlcyB0byBhIHBhdGggcmVsYXRpdmUgdG8gdGhlIHByb2plY3Qgcm9vdFwiLCAtPlxuICAgICAgICBpbWFnZSA9IHByZXZpZXcuZmluZChcImltZ1thbHQ9SW1hZ2UyXVwiKVxuICAgICAgICBleHBlY3QobWFya2Rvd25JdC5kZWNvZGUpLnRvSGF2ZUJlZW5DYWxsZWQoKVxuICAgICAgICBleHBlY3QoaW1hZ2UuYXR0cignc3JjJykpLnRvU3RhcnRXaXRoIGF0b20ucHJvamVjdC5nZXREaXJlY3RvcmllcygpWzBdLnJlc29sdmUoJ3RtcC9pbWFnZTIucG5nJylcblxuICAgIGRlc2NyaWJlIFwid2hlbiB0aGUgaW1hZ2UgdXNlcyBhbiBhYnNvbHV0ZSBwYXRoIHRoYXQgZXhpc3RzXCIsIC0+XG4gICAgICBpdCBcImFkZHMgYSBxdWVyeSB0byB0aGUgVVJMXCIsIC0+XG4gICAgICAgIHByZXZpZXcuZGVzdHJveSgpXG5cbiAgICAgICAgZmlsZVBhdGggPSBwYXRoLmpvaW4odGVtcC5ta2RpclN5bmMoJ2F0b20nKSwgJ2Zvby5tZCcpXG4gICAgICAgIGZzLndyaXRlRmlsZVN5bmMoZmlsZVBhdGgsIFwiIVthYnNvbHV0ZV0oI3tmaWxlUGF0aH0pXCIpXG4gICAgICAgIHByZXZpZXcgPSBuZXcgTWFya2Rvd25QcmV2aWV3Vmlldyh7ZmlsZVBhdGh9KVxuICAgICAgICBqYXNtaW5lLmF0dGFjaFRvRE9NKHByZXZpZXcuZWxlbWVudClcblxuICAgICAgICB3YWl0c0ZvclByb21pc2UgLT5cbiAgICAgICAgICBwcmV2aWV3LnJlbmRlck1hcmtkb3duKClcblxuICAgICAgICBydW5zIC0+XG4gICAgICAgICAgZXhwZWN0KG1hcmtkb3duSXQuZGVjb2RlKS50b0hhdmVCZWVuQ2FsbGVkKClcbiAgICAgICAgICBleHBlY3QocHJldmlldy5maW5kKFwiaW1nW2FsdD1hYnNvbHV0ZV1cIikuYXR0cignc3JjJykpLnRvU3RhcnRXaXRoIFwiI3tmaWxlUGF0aH0/dj1cIlxuXG4gICAgZGVzY3JpYmUgXCJ3aGVuIHRoZSBpbWFnZSB1c2VzIGEgd2ViIFVSTFwiLCAtPlxuICAgICAgaXQgXCJkb2Vzbid0IGNoYW5nZSB0aGUgVVJMXCIsIC0+XG4gICAgICAgIGltYWdlID0gcHJldmlldy5maW5kKFwiaW1nW2FsdD1JbWFnZTNdXCIpXG4gICAgICAgIGV4cGVjdChtYXJrZG93bkl0LmRlY29kZSkudG9IYXZlQmVlbkNhbGxlZCgpXG4gICAgICAgIGV4cGVjdChpbWFnZS5hdHRyKCdzcmMnKSkudG9CZSAnaHR0cHM6Ly9yYXcuZ2l0aHVidXNlcmNvbnRlbnQuY29tL0dhbGFkaXJpdGgvbWFya2Rvd24tcHJldmlldy1wbHVzL21hc3Rlci9hc3NldHMvaHIucG5nJ1xuXG4gIGRlc2NyaWJlIFwiaW1hZ2UgbW9kaWZpY2F0aW9uXCIsIC0+XG4gICAgW2RpclBhdGgsIGZpbGVQYXRoLCBpbWcxUGF0aCwgd29ya3NwYWNlRWxlbWVudF0gPSBbXVxuXG4gICAgYmVmb3JlRWFjaCAtPlxuICAgICAgcHJldmlldy5kZXN0cm95KClcblxuICAgICAgamFzbWluZS51c2VSZWFsQ2xvY2soKVxuXG4gICAgICBkaXJQYXRoICAgPSB0ZW1wLm1rZGlyU3luYygnYXRvbScpXG4gICAgICBmaWxlUGF0aCAgPSBwYXRoLmpvaW4gZGlyUGF0aCwgJ2ltYWdlLW1vZGlmaWNhdGlvbi5tZCdcbiAgICAgIGltZzFQYXRoICA9IHBhdGguam9pbiBkaXJQYXRoLCAnaW1nMS5wbmcnXG5cbiAgICAgIGZzLndyaXRlRmlsZVN5bmMgZmlsZVBhdGgsIFwiIVtpbWcxXSgje2ltZzFQYXRofSlcIlxuICAgICAgZnMud3JpdGVGaWxlU3luYyBpbWcxUGF0aCwgXCJjbGVhcmx5IG5vdCBhIHBuZyBidXQgZ29vZCBlbm91Z2ggZm9yIHRlc3RzXCJcblxuICAgICAgd29ya3NwYWNlRWxlbWVudCA9IGF0b20udmlld3MuZ2V0VmlldyhhdG9tLndvcmtzcGFjZSlcbiAgICAgIGphc21pbmUuYXR0YWNoVG9ET00od29ya3NwYWNlRWxlbWVudClcblxuICAgIGdldEltYWdlVmVyc2lvbiA9IChpbWFnZVBhdGgsIGltYWdlVVJMKSAtPlxuICAgICAgZXhwZWN0KGltYWdlVVJMKS50b1N0YXJ0V2l0aCBcIiN7aW1hZ2VQYXRofT92PVwiXG4gICAgICB1cmxRdWVyeVN0ciA9IHVybC5wYXJzZShpbWFnZVVSTCkucXVlcnlcbiAgICAgIHVybFF1ZXJ5ICAgID0gcXVlcnlTdHJpbmcucGFyc2UodXJsUXVlcnlTdHIpXG4gICAgICB1cmxRdWVyeS52XG5cbiAgICBkZXNjcmliZSBcIndoZW4gYSBsb2NhbCBpbWFnZSBpcyBwcmV2aWV3ZWRcIiwgLT5cbiAgICAgIGl0IFwiYWRkcyBhIHRpbWVzdGFtcCBxdWVyeSB0byB0aGUgVVJMXCIsIC0+XG4gICAgICAgIHdhaXRzRm9yUHJvbWlzZSAtPiBhdG9tLndvcmtzcGFjZS5vcGVuKGZpbGVQYXRoKVxuICAgICAgICBydW5zIC0+IGF0b20uY29tbWFuZHMuZGlzcGF0Y2ggd29ya3NwYWNlRWxlbWVudCwgJ21hcmtkb3duLXByZXZpZXctcGx1czp0b2dnbGUnXG4gICAgICAgIGV4cGVjdFByZXZpZXdJblNwbGl0UGFuZSgpXG5cbiAgICAgICAgcnVucyAtPlxuICAgICAgICAgIGltYWdlVVJMID0gcHJldmlldy5maW5kKFwiaW1nW2FsdD1pbWcxXVwiKS5hdHRyKCdzcmMnKVxuICAgICAgICAgIGltYWdlVmVyID0gZ2V0SW1hZ2VWZXJzaW9uKGltZzFQYXRoLCBpbWFnZVVSTClcbiAgICAgICAgICBleHBlY3QoaW1hZ2VWZXIpLm5vdC50b0VxdWFsKCdkZWxldGVkJylcblxuICAgIGRlc2NyaWJlIFwid2hlbiBhIGxvY2FsIGltYWdlIGlzIG1vZGlmaWVkIGR1cmluZyBhIHByZXZpZXcgI25vdHdlcmNrZXJcIiwgLT5cbiAgICAgIGl0IFwicmVyZW5kZXJzIHRoZSBpbWFnZSB3aXRoIGEgbW9yZSByZWNlbnQgdGltZXN0YW1wIHF1ZXJ5XCIsIC0+XG4gICAgICAgIFtpbWFnZVVSTCwgaW1hZ2VWZXJdID0gW11cblxuICAgICAgICB3YWl0c0ZvclByb21pc2UgLT4gYXRvbS53b3Jrc3BhY2Uub3BlbihmaWxlUGF0aClcbiAgICAgICAgcnVucyAtPiBhdG9tLmNvbW1hbmRzLmRpc3BhdGNoIHdvcmtzcGFjZUVsZW1lbnQsICdtYXJrZG93bi1wcmV2aWV3LXBsdXM6dG9nZ2xlJ1xuICAgICAgICBleHBlY3RQcmV2aWV3SW5TcGxpdFBhbmUoKVxuXG4gICAgICAgIHJ1bnMgLT5cbiAgICAgICAgICBpbWFnZVVSTCA9IHByZXZpZXcuZmluZChcImltZ1thbHQ9aW1nMV1cIikuYXR0cignc3JjJylcbiAgICAgICAgICBpbWFnZVZlciA9IGdldEltYWdlVmVyc2lvbihpbWcxUGF0aCwgaW1hZ2VVUkwpXG4gICAgICAgICAgZXhwZWN0KGltYWdlVmVyKS5ub3QudG9FcXVhbCgnZGVsZXRlZCcpXG5cbiAgICAgICAgICBmcy53cml0ZUZpbGVTeW5jIGltZzFQYXRoLCBcInN0aWxsIGNsZWFybHkgbm90IGEgcG5nIDtEXCJcblxuICAgICAgICB3YWl0c0ZvciBcImltYWdlIHNyYyBhdHRyaWJ1dGUgdG8gdXBkYXRlXCIsIC0+XG4gICAgICAgICAgaW1hZ2VVUkwgPSBwcmV2aWV3LmZpbmQoXCJpbWdbYWx0PWltZzFdXCIpLmF0dHIoJ3NyYycpXG4gICAgICAgICAgbm90IGltYWdlVVJMLmVuZHNXaXRoIGltYWdlVmVyXG5cbiAgICAgICAgcnVucyAtPlxuICAgICAgICAgIG5ld0ltYWdlVmVyID0gZ2V0SW1hZ2VWZXJzaW9uKGltZzFQYXRoLCBpbWFnZVVSTClcbiAgICAgICAgICBleHBlY3QobmV3SW1hZ2VWZXIpLm5vdC50b0VxdWFsKCdkZWxldGVkJylcbiAgICAgICAgICBleHBlY3QocGFyc2VJbnQobmV3SW1hZ2VWZXIpKS50b0JlR3JlYXRlclRoYW4ocGFyc2VJbnQoaW1hZ2VWZXIpKVxuXG4gICAgZGVzY3JpYmUgXCJ3aGVuIHRocmVlIGltYWdlcyBhcmUgcHJldmlld2VkIGFuZCBhbGwgYXJlIG1vZGlmaWVkICNub3R3ZXJja2VyXCIsIC0+XG4gICAgICBpdCBcInJlcmVuZGVycyB0aGUgaW1hZ2VzIHdpdGggYSBtb3JlIHJlY2VudCB0aW1lc3RhbXAgYXMgdGhleSBhcmUgbW9kaWZpZWRcIiwgLT5cbiAgICAgICAgW2ltZzJQYXRoLCBpbWczUGF0aF0gPSBbXVxuICAgICAgICBbaW1nMVZlciwgaW1nMlZlciwgaW1nM1Zlcl0gPSBbXVxuICAgICAgICBbaW1nMVVSTCwgaW1nMlVSTCwgaW1nM1VSTF0gPSBbXVxuXG4gICAgICAgIHJ1bnMgLT5cbiAgICAgICAgICBwcmV2aWV3LmRlc3Ryb3koKVxuXG4gICAgICAgICAgaW1nMlBhdGggID0gcGF0aC5qb2luIGRpclBhdGgsICdpbWcyLnBuZydcbiAgICAgICAgICBpbWczUGF0aCAgPSBwYXRoLmpvaW4gZGlyUGF0aCwgJ2ltZzMucG5nJ1xuXG4gICAgICAgICAgZnMud3JpdGVGaWxlU3luYyBpbWcyUGF0aCwgXCJpJ20gbm90IHJlYWxseSBhIHBuZyA7RFwiXG4gICAgICAgICAgZnMud3JpdGVGaWxlU3luYyBpbWczUGF0aCwgXCJuZWl0aGVyIGFtIGkgO0RcIlxuICAgICAgICAgIGZzLndyaXRlRmlsZVN5bmMgZmlsZVBhdGgsIFwiXCJcIlxuICAgICAgICAgICAgIVtpbWcxXSgje2ltZzFQYXRofSlcbiAgICAgICAgICAgICFbaW1nMl0oI3tpbWcyUGF0aH0pXG4gICAgICAgICAgICAhW2ltZzNdKCN7aW1nM1BhdGh9KVxuICAgICAgICAgIFwiXCJcIlxuXG4gICAgICAgIHdhaXRzRm9yUHJvbWlzZSAtPiBhdG9tLndvcmtzcGFjZS5vcGVuKGZpbGVQYXRoKVxuICAgICAgICBydW5zIC0+IGF0b20uY29tbWFuZHMuZGlzcGF0Y2ggd29ya3NwYWNlRWxlbWVudCwgJ21hcmtkb3duLXByZXZpZXctcGx1czp0b2dnbGUnXG4gICAgICAgIGV4cGVjdFByZXZpZXdJblNwbGl0UGFuZSgpXG5cbiAgICAgICAgZ2V0SW1hZ2VFbGVtZW50c1VSTCA9IC0+XG4gICAgICAgICAgcmV0dXJuIFtcbiAgICAgICAgICAgIHByZXZpZXcuZmluZChcImltZ1thbHQ9aW1nMV1cIikuYXR0cignc3JjJyksXG4gICAgICAgICAgICBwcmV2aWV3LmZpbmQoXCJpbWdbYWx0PWltZzJdXCIpLmF0dHIoJ3NyYycpLFxuICAgICAgICAgICAgcHJldmlldy5maW5kKFwiaW1nW2FsdD1pbWczXVwiKS5hdHRyKCdzcmMnKVxuICAgICAgICAgIF1cblxuICAgICAgICBleHBlY3RRdWVyeVZhbHVlcyA9IChxdWVyeVZhbHVlcykgLT5cbiAgICAgICAgICBbaW1nMVVSTCwgaW1nMlVSTCwgaW1nM1VSTF0gPSBnZXRJbWFnZUVsZW1lbnRzVVJMKClcbiAgICAgICAgICBpZiBxdWVyeVZhbHVlcy5pbWcxP1xuICAgICAgICAgICAgZXhwZWN0KGltZzFVUkwpLnRvU3RhcnRXaXRoIFwiI3tpbWcxUGF0aH0/dj1cIlxuICAgICAgICAgICAgZXhwZWN0KGltZzFVUkwpLnRvQmUgXCIje2ltZzFQYXRofT92PSN7cXVlcnlWYWx1ZXMuaW1nMX1cIlxuICAgICAgICAgIGlmIHF1ZXJ5VmFsdWVzLmltZzI/XG4gICAgICAgICAgICBleHBlY3QoaW1nMlVSTCkudG9TdGFydFdpdGggXCIje2ltZzJQYXRofT92PVwiXG4gICAgICAgICAgICBleHBlY3QoaW1nMlVSTCkudG9CZSBcIiN7aW1nMlBhdGh9P3Y9I3txdWVyeVZhbHVlcy5pbWcyfVwiXG4gICAgICAgICAgaWYgcXVlcnlWYWx1ZXMuaW1nMz9cbiAgICAgICAgICAgIGV4cGVjdChpbWczVVJMKS50b1N0YXJ0V2l0aCBcIiN7aW1nM1BhdGh9P3Y9XCJcbiAgICAgICAgICAgIGV4cGVjdChpbWczVVJMKS50b0JlIFwiI3tpbWczUGF0aH0/dj0je3F1ZXJ5VmFsdWVzLmltZzN9XCJcblxuICAgICAgICBydW5zIC0+XG4gICAgICAgICAgW2ltZzFVUkwsIGltZzJVUkwsIGltZzNVUkxdID0gZ2V0SW1hZ2VFbGVtZW50c1VSTCgpXG5cbiAgICAgICAgICBpbWcxVmVyID0gZ2V0SW1hZ2VWZXJzaW9uKGltZzFQYXRoLCBpbWcxVVJMKVxuICAgICAgICAgIGltZzJWZXIgPSBnZXRJbWFnZVZlcnNpb24oaW1nMlBhdGgsIGltZzJVUkwpXG4gICAgICAgICAgaW1nM1ZlciA9IGdldEltYWdlVmVyc2lvbihpbWczUGF0aCwgaW1nM1VSTClcblxuICAgICAgICAgIGZzLndyaXRlRmlsZVN5bmMgaW1nMVBhdGgsIFwic3RpbGwgY2xlYXJseSBub3QgYSBwbmcgO0RcIlxuXG4gICAgICAgIHdhaXRzRm9yIFwiaW1nMSBzcmMgYXR0cmlidXRlIHRvIHVwZGF0ZVwiLCAtPlxuICAgICAgICAgIGltZzFVUkwgPSBwcmV2aWV3LmZpbmQoXCJpbWdbYWx0PWltZzFdXCIpLmF0dHIoJ3NyYycpXG4gICAgICAgICAgbm90IGltZzFVUkwuZW5kc1dpdGggaW1nMVZlclxuXG4gICAgICAgIHJ1bnMgLT5cbiAgICAgICAgICBleHBlY3RRdWVyeVZhbHVlc1xuICAgICAgICAgICAgaW1nMjogaW1nMlZlclxuICAgICAgICAgICAgaW1nMzogaW1nM1ZlclxuXG4gICAgICAgICAgbmV3SW1nMVZlciA9IGdldEltYWdlVmVyc2lvbihpbWcxUGF0aCwgaW1nMVVSTClcbiAgICAgICAgICBleHBlY3QobmV3SW1nMVZlcikubm90LnRvRXF1YWwoJ2RlbGV0ZWQnKVxuICAgICAgICAgIGV4cGVjdChwYXJzZUludChuZXdJbWcxVmVyKSkudG9CZUdyZWF0ZXJUaGFuKHBhcnNlSW50KGltZzFWZXIpKVxuICAgICAgICAgIGltZzFWZXIgPSBuZXdJbWcxVmVyXG5cbiAgICAgICAgICBmcy53cml0ZUZpbGVTeW5jIGltZzJQYXRoLCBcInN0aWxsIGNsZWFybHkgbm90IGEgcG5nIGVpdGhlciA7RFwiXG5cbiAgICAgICAgd2FpdHNGb3IgXCJpbWcyIHNyYyBhdHRyaWJ1dGUgdG8gdXBkYXRlXCIsIC0+XG4gICAgICAgICAgaW1nMlVSTCA9IHByZXZpZXcuZmluZChcImltZ1thbHQ9aW1nMl1cIikuYXR0cignc3JjJylcbiAgICAgICAgICBub3QgaW1nMlVSTC5lbmRzV2l0aCBpbWcyVmVyXG5cbiAgICAgICAgcnVucyAtPlxuICAgICAgICAgIGV4cGVjdFF1ZXJ5VmFsdWVzXG4gICAgICAgICAgICBpbWcxOiBpbWcxVmVyXG4gICAgICAgICAgICBpbWczOiBpbWczVmVyXG5cbiAgICAgICAgICBuZXdJbWcyVmVyID0gZ2V0SW1hZ2VWZXJzaW9uKGltZzJQYXRoLCBpbWcyVVJMKVxuICAgICAgICAgIGV4cGVjdChuZXdJbWcyVmVyKS5ub3QudG9FcXVhbCgnZGVsZXRlZCcpXG4gICAgICAgICAgZXhwZWN0KHBhcnNlSW50KG5ld0ltZzJWZXIpKS50b0JlR3JlYXRlclRoYW4ocGFyc2VJbnQoaW1nMlZlcikpXG4gICAgICAgICAgaW1nMlZlciA9IG5ld0ltZzJWZXJcblxuICAgICAgICAgIGZzLndyaXRlRmlsZVN5bmMgaW1nM1BhdGgsIFwieW91IGJldHRlciBiZWxpZXZlIGknbSBub3QgYSBwbmcgO0RcIlxuXG4gICAgICAgIHdhaXRzRm9yIFwiaW1nMyBzcmMgYXR0cmlidXRlIHRvIHVwZGF0ZVwiLCAtPlxuICAgICAgICAgIGltZzNVUkwgPSBwcmV2aWV3LmZpbmQoXCJpbWdbYWx0PWltZzNdXCIpLmF0dHIoJ3NyYycpXG4gICAgICAgICAgbm90IGltZzNVUkwuZW5kc1dpdGggaW1nM1ZlclxuXG4gICAgICAgIHJ1bnMgLT5cbiAgICAgICAgICBleHBlY3RRdWVyeVZhbHVlc1xuICAgICAgICAgICAgaW1nMTogaW1nMVZlclxuICAgICAgICAgICAgaW1nMjogaW1nMlZlclxuXG4gICAgICAgICAgbmV3SW1nM1ZlciAgPSBnZXRJbWFnZVZlcnNpb24oaW1nM1BhdGgsIGltZzNVUkwpXG4gICAgICAgICAgZXhwZWN0KG5ld0ltZzNWZXIpLm5vdC50b0VxdWFsKCdkZWxldGVkJylcbiAgICAgICAgICBleHBlY3QocGFyc2VJbnQobmV3SW1nM1ZlcikpLnRvQmVHcmVhdGVyVGhhbihwYXJzZUludChpbWczVmVyKSlcblxuICAgIGRlc2NyaWJlIFwid2hlbiBhIHByZXZpZXdlZCBpbWFnZSBpcyBkZWxldGVkIHRoZW4gcmVzdG9yZWRcIiwgLT5cbiAgICAgIGl0IFwicmVtb3ZlcyB0aGUgcXVlcnkgdGltZXN0YW1wIGFuZCByZXN0b3JlcyB0aGUgdGltZXN0YW1wIGFmdGVyIGEgcmVyZW5kZXJcIiwgLT5cbiAgICAgICAgW2ltYWdlVVJMLCBpbWFnZVZlcl0gPSBbXVxuXG4gICAgICAgIHdhaXRzRm9yUHJvbWlzZSAtPiBhdG9tLndvcmtzcGFjZS5vcGVuKGZpbGVQYXRoKVxuICAgICAgICBydW5zIC0+IGF0b20uY29tbWFuZHMuZGlzcGF0Y2ggd29ya3NwYWNlRWxlbWVudCwgJ21hcmtkb3duLXByZXZpZXctcGx1czp0b2dnbGUnXG4gICAgICAgIGV4cGVjdFByZXZpZXdJblNwbGl0UGFuZSgpXG5cbiAgICAgICAgcnVucyAtPlxuICAgICAgICAgIGltYWdlVVJMID0gcHJldmlldy5maW5kKFwiaW1nW2FsdD1pbWcxXVwiKS5hdHRyKCdzcmMnKVxuICAgICAgICAgIGltYWdlVmVyID0gZ2V0SW1hZ2VWZXJzaW9uKGltZzFQYXRoLCBpbWFnZVVSTClcbiAgICAgICAgICBleHBlY3QoaW1hZ2VWZXIpLm5vdC50b0VxdWFsKCdkZWxldGVkJylcblxuICAgICAgICAgIGZzLnVubGlua1N5bmMgaW1nMVBhdGhcblxuICAgICAgICB3YWl0c0ZvciBcImltYWdlIHNyYyBhdHRyaWJ1dGUgdG8gdXBkYXRlXCIsIC0+XG4gICAgICAgICAgaW1hZ2VVUkwgPSBwcmV2aWV3LmZpbmQoXCJpbWdbYWx0PWltZzFdXCIpLmF0dHIoJ3NyYycpXG4gICAgICAgICAgbm90IGltYWdlVVJMLmVuZHNXaXRoIGltYWdlVmVyXG5cbiAgICAgICAgcnVucyAtPlxuICAgICAgICAgIGV4cGVjdChpbWFnZVVSTCkudG9CZSBpbWcxUGF0aFxuICAgICAgICAgIGZzLndyaXRlRmlsZVN5bmMgaW1nMVBhdGgsIFwiY2xlYXJseSBub3QgYSBwbmcgYnV0IGdvb2QgZW5vdWdoIGZvciB0ZXN0c1wiXG4gICAgICAgICAgcHJldmlldy5yZW5kZXJNYXJrZG93bigpXG5cbiAgICAgICAgd2FpdHNGb3IgXCJpbWFnZSBzcmMgYXR0cmlidXRlIHRvIHVwZGF0ZVwiLCAtPlxuICAgICAgICAgIGltYWdlVVJMID0gcHJldmlldy5maW5kKFwiaW1nW2FsdD1pbWcxXVwiKS5hdHRyKCdzcmMnKVxuICAgICAgICAgIGltYWdlVVJMIGlzbnQgaW1nMVBhdGhcblxuICAgICAgICBydW5zIC0+XG4gICAgICAgICAgbmV3SW1hZ2VWZXIgPSBnZXRJbWFnZVZlcnNpb24oaW1nMVBhdGgsIGltYWdlVVJMKVxuICAgICAgICAgIGV4cGVjdChwYXJzZUludChuZXdJbWFnZVZlcikpLnRvQmVHcmVhdGVyVGhhbihwYXJzZUludChpbWFnZVZlcikpXG5cbiAgICBkZXNjcmliZSBcIndoZW4gYSBwcmV2aWV3ZWQgaW1hZ2UgaXMgcmVuYW1lZCBhbmQgdGhlbiByZXN0b3JlZCB3aXRoIGl0cyBvcmlnaW5hbCBuYW1lXCIsIC0+XG4gICAgICBpdCBcInJlbW92ZXMgdGhlIHF1ZXJ5IHRpbWVzdGFtcCBhbmQgcmVzdG9yZXMgdGhlIHRpbWVzdGFtcCBhZnRlciBhIHJlcmVuZGVyXCIsIC0+XG4gICAgICAgIFtpbWFnZVVSTCwgaW1hZ2VWZXJdID0gW11cblxuICAgICAgICB3YWl0c0ZvclByb21pc2UgLT4gYXRvbS53b3Jrc3BhY2Uub3BlbihmaWxlUGF0aClcbiAgICAgICAgcnVucyAtPiBhdG9tLmNvbW1hbmRzLmRpc3BhdGNoIHdvcmtzcGFjZUVsZW1lbnQsICdtYXJrZG93bi1wcmV2aWV3LXBsdXM6dG9nZ2xlJ1xuICAgICAgICBleHBlY3RQcmV2aWV3SW5TcGxpdFBhbmUoKVxuXG4gICAgICAgIHJ1bnMgLT5cbiAgICAgICAgICBpbWFnZVVSTCA9IHByZXZpZXcuZmluZChcImltZ1thbHQ9aW1nMV1cIikuYXR0cignc3JjJylcbiAgICAgICAgICBpbWFnZVZlciA9IGdldEltYWdlVmVyc2lvbihpbWcxUGF0aCwgaW1hZ2VVUkwpXG4gICAgICAgICAgZXhwZWN0KGltYWdlVmVyKS5ub3QudG9FcXVhbCgnZGVsZXRlZCcpXG5cbiAgICAgICAgICBmcy5yZW5hbWVTeW5jIGltZzFQYXRoLCBpbWcxUGF0aCArIFwidHJvbFwiXG5cbiAgICAgICAgd2FpdHNGb3IgXCJpbWFnZSBzcmMgYXR0cmlidXRlIHRvIHVwZGF0ZVwiLCAtPlxuICAgICAgICAgIGltYWdlVVJMID0gcHJldmlldy5maW5kKFwiaW1nW2FsdD1pbWcxXVwiKS5hdHRyKCdzcmMnKVxuICAgICAgICAgIG5vdCBpbWFnZVVSTC5lbmRzV2l0aCBpbWFnZVZlclxuXG4gICAgICAgIHJ1bnMgLT5cbiAgICAgICAgICBleHBlY3QoaW1hZ2VVUkwpLnRvQmUgaW1nMVBhdGhcbiAgICAgICAgICBmcy5yZW5hbWVTeW5jIGltZzFQYXRoICsgXCJ0cm9sXCIsIGltZzFQYXRoXG4gICAgICAgICAgcHJldmlldy5yZW5kZXJNYXJrZG93bigpXG5cbiAgICAgICAgd2FpdHNGb3IgXCJpbWFnZSBzcmMgYXR0cmlidXRlIHRvIHVwZGF0ZVwiLCAtPlxuICAgICAgICAgIGltYWdlVVJMID0gcHJldmlldy5maW5kKFwiaW1nW2FsdD1pbWcxXVwiKS5hdHRyKCdzcmMnKVxuICAgICAgICAgIGltYWdlVVJMIGlzbnQgaW1nMVBhdGhcblxuICAgICAgICBydW5zIC0+XG4gICAgICAgICAgbmV3SW1hZ2VWZXIgPSBnZXRJbWFnZVZlcnNpb24oaW1nMVBhdGgsIGltYWdlVVJMKVxuICAgICAgICAgIGV4cGVjdChwYXJzZUludChuZXdJbWFnZVZlcikpLnRvQmVHcmVhdGVyVGhhbihwYXJzZUludChpbWFnZVZlcikpXG5cbiAgZGVzY3JpYmUgXCJnZm0gbmV3bGluZXNcIiwgLT5cbiAgICBkZXNjcmliZSBcIndoZW4gZ2ZtIG5ld2xpbmVzIGFyZSBub3QgZW5hYmxlZFwiLCAtPlxuICAgICAgaXQgXCJjcmVhdGVzIGEgc2luZ2xlIHBhcmFncmFwaCB3aXRoIDxicj5cIiwgLT5cbiAgICAgICAgYXRvbS5jb25maWcuc2V0KCdtYXJrZG93bi1wcmV2aWV3LXBsdXMuYnJlYWtPblNpbmdsZU5ld2xpbmUnLCBmYWxzZSlcblxuICAgICAgICB3YWl0c0ZvclByb21pc2UgLT5cbiAgICAgICAgICBwcmV2aWV3LnJlbmRlck1hcmtkb3duKClcblxuICAgICAgICBydW5zIC0+XG4gICAgICAgICAgZXhwZWN0KHByZXZpZXcuZmluZChcInA6bGFzdC1jaGlsZCBiclwiKS5sZW5ndGgpLnRvQmUgMFxuXG4gICAgZGVzY3JpYmUgXCJ3aGVuIGdmbSBuZXdsaW5lcyBhcmUgZW5hYmxlZFwiLCAtPlxuICAgICAgaXQgXCJjcmVhdGVzIGEgc2luZ2xlIHBhcmFncmFwaCB3aXRoIG5vIDxicj5cIiwgLT5cbiAgICAgICAgYXRvbS5jb25maWcuc2V0KCdtYXJrZG93bi1wcmV2aWV3LXBsdXMuYnJlYWtPblNpbmdsZU5ld2xpbmUnLCB0cnVlKVxuXG4gICAgICAgIHdhaXRzRm9yUHJvbWlzZSAtPlxuICAgICAgICAgIHByZXZpZXcucmVuZGVyTWFya2Rvd24oKVxuXG4gICAgICAgIHJ1bnMgLT5cbiAgICAgICAgICBleHBlY3QocHJldmlldy5maW5kKFwicDpsYXN0LWNoaWxkIGJyXCIpLmxlbmd0aCkudG9CZSAxXG5cbiAgZGVzY3JpYmUgXCJ3aGVuIGNvcmU6c2F2ZS1hcyBpcyB0cmlnZ2VyZWRcIiwgLT5cbiAgICBiZWZvcmVFYWNoIC0+XG4gICAgICBwcmV2aWV3LmRlc3Ryb3koKVxuICAgICAgZmlsZVBhdGggPSBhdG9tLnByb2plY3QuZ2V0RGlyZWN0b3JpZXMoKVswXS5yZXNvbHZlKCdzdWJkaXIvY29kZS1ibG9jay5tZCcpXG4gICAgICBwcmV2aWV3ID0gbmV3IE1hcmtkb3duUHJldmlld1ZpZXcoe2ZpbGVQYXRofSlcbiAgICAgIGphc21pbmUuYXR0YWNoVG9ET00ocHJldmlldy5lbGVtZW50KVxuXG4gICAgaXQgXCJzYXZlcyB0aGUgcmVuZGVyZWQgSFRNTCBhbmQgb3BlbnMgaXRcIiwgLT5cbiAgICAgIG91dHB1dFBhdGggPSB0ZW1wLnBhdGgoc3VmZml4OiAnLmh0bWwnKVxuICAgICAgZXhwZWN0ZWRGaWxlUGF0aCA9IGF0b20ucHJvamVjdC5nZXREaXJlY3RvcmllcygpWzBdLnJlc29sdmUoJ3NhdmVkLWh0bWwuaHRtbCcpXG4gICAgICBleHBlY3RlZE91dHB1dCA9IGZzLnJlYWRGaWxlU3luYyhleHBlY3RlZEZpbGVQYXRoKS50b1N0cmluZygpXG5cbiAgICAgIGNyZWF0ZVJ1bGUgPSAoc2VsZWN0b3IsIGNzcykgLT5cbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICBzZWxlY3RvclRleHQ6IHNlbGVjdG9yXG4gICAgICAgICAgY3NzVGV4dDogXCIje3NlbGVjdG9yfSAje2Nzc31cIlxuICAgICAgICB9XG5cbiAgICAgIG1hcmtkb3duUHJldmlld1N0eWxlcyA9IFtcbiAgICAgICAge1xuICAgICAgICAgIHJ1bGVzOiBbXG4gICAgICAgICAgICBjcmVhdGVSdWxlIFwiLm1hcmtkb3duLXByZXZpZXdcIiwgXCJ7IGNvbG9yOiBvcmFuZ2U7IH1cIlxuICAgICAgICAgIF1cbiAgICAgICAgfSwge1xuICAgICAgICAgIHJ1bGVzOiBbXG4gICAgICAgICAgICBjcmVhdGVSdWxlIFwiLm5vdC1pbmNsdWRlZFwiLCBcInsgY29sb3I6IGdyZWVuOyB9XCJcbiAgICAgICAgICAgIGNyZWF0ZVJ1bGUgXCIubWFya2Rvd24tcHJldmlldyA6aG9zdFwiLCBcInsgY29sb3I6IHB1cnBsZTsgfVwiXG4gICAgICAgICAgXVxuICAgICAgICB9XG4gICAgICBdXG5cbiAgICAgIGF0b21UZXh0RWRpdG9yU3R5bGVzID0gW1xuICAgICAgICBcImF0b20tdGV4dC1lZGl0b3IgLmxpbmUgeyBjb2xvcjogYnJvd247IH1cXG5hdG9tLXRleHQtZWRpdG9yIC5udW1iZXIgeyBjb2xvcjogY3lhbjsgfVwiXG4gICAgICAgIFwiYXRvbS10ZXh0LWVkaXRvciA6aG9zdCAuc29tZXRoaW5nIHsgY29sb3I6IGJsYWNrOyB9XCJcbiAgICAgICAgXCJhdG9tLXRleHQtZWRpdG9yIC5ociB7IGJhY2tncm91bmQ6IHVybChhdG9tOi8vbWFya2Rvd24tcHJldmlldy1wbHVzL2Fzc2V0cy9oci5wbmcpOyB9XCJcbiAgICAgIF1cblxuICAgICAgZXhwZWN0KGZzLmlzRmlsZVN5bmMob3V0cHV0UGF0aCkpLnRvQmUgZmFsc2VcblxuICAgICAgd2FpdHNGb3JQcm9taXNlIFwicmVuZGVyTWFya2Rvd25cIiwgLT5cbiAgICAgICAgcHJldmlldy5yZW5kZXJNYXJrZG93bigpXG5cbiAgICAgIHRleHRFZGl0b3IgPSBudWxsXG4gICAgICBvcGVuZWRQcm9taXNlID0gbmV3IFByb21pc2UgKHJlc29sdmUpIC0+XG4gICAgICAgIGF0b20ud29ya3NwYWNlLm9uRGlkQWRkVGV4dEVkaXRvciAoZXZlbnQpIC0+XG4gICAgICAgICAgdGV4dEVkaXRvciA9IGV2ZW50LnRleHRFZGl0b3JcbiAgICAgICAgICByZXNvbHZlKClcblxuICAgICAgcnVucyAtPlxuICAgICAgICBzcHlPbihhdG9tLCAnc2hvd1NhdmVEaWFsb2dTeW5jJykuYW5kUmV0dXJuKG91dHB1dFBhdGgpXG4gICAgICAgIHNweU9uKHByZXZpZXcsICdnZXREb2N1bWVudFN0eWxlU2hlZXRzJykuYW5kUmV0dXJuKG1hcmtkb3duUHJldmlld1N0eWxlcylcbiAgICAgICAgc3B5T24ocHJldmlldywgJ2dldFRleHRFZGl0b3JTdHlsZXMnKS5hbmRSZXR1cm4oYXRvbVRleHRFZGl0b3JTdHlsZXMpXG4gICAgICAgIGF0b20uY29tbWFuZHMuZGlzcGF0Y2ggcHJldmlldy5lbGVtZW50LCAnY29yZTpzYXZlLWFzJ1xuXG4gICAgICB3YWl0c0ZvclByb21pc2UgXCJ0ZXh0IGVkaXRvciBvcGVuZWRcIiwgLT5cbiAgICAgICAgb3BlbmVkUHJvbWlzZVxuXG4gICAgICBydW5zIC0+XG4gICAgICAgIGV4cGVjdChmcy5pc0ZpbGVTeW5jKG91dHB1dFBhdGgpKS50b0JlIHRydWVcbiAgICAgICAgZXhwZWN0KGZzLnJlYWxwYXRoU3luYyh0ZXh0RWRpdG9yLmdldFBhdGgoKSkpLnRvQmUgZnMucmVhbHBhdGhTeW5jKG91dHB1dFBhdGgpXG4gICAgICAgIHNhdmVkSFRNTCA9IHRleHRFZGl0b3IuZ2V0VGV4dCgpXG4gICAgICAgICAgLnJlcGxhY2UoLzxib2R5IGNsYXNzPSdtYXJrZG93bi1wcmV2aWV3Jz48ZGl2Pi8sICc8Ym9keSBjbGFzcz1cXCdtYXJrZG93bi1wcmV2aWV3XFwnPicpXG4gICAgICAgICAgLnJlcGxhY2UoL1xcbjxcXC9kaXY+PFxcL2JvZHk+LywgJzwvYm9keT4nKVxuICAgICAgICBleHBlY3Qoc2F2ZWRIVE1MKS50b0JlIGV4cGVjdGVkT3V0cHV0LnJlcGxhY2UoL1xcclxcbi9nLCAnXFxuJylcblxuICAgIGRlc2NyaWJlIFwidGV4dCBlZGl0b3Igc3R5bGUgZXh0cmFjdGlvblwiLCAtPlxuXG4gICAgICBbZXh0cmFjdGVkU3R5bGVzXSA9IFtdXG5cbiAgICAgIHRleHRFZGl0b3JTdHlsZSA9IFwiLmVkaXRvci1zdHlsZSAuZXh0cmFjdGlvbi10ZXN0IHsgY29sb3I6IGJsdWU7IH1cIlxuICAgICAgdW5yZWxhdGVkU3R5bGUgID0gXCIuc29tZXRoaW5nIGVsc2UgeyBjb2xvcjogcmVkOyB9XCJcblxuICAgICAgYmVmb3JlRWFjaCAtPlxuICAgICAgICBhdG9tLnN0eWxlcy5hZGRTdHlsZVNoZWV0IHRleHRFZGl0b3JTdHlsZSxcbiAgICAgICAgICBjb250ZXh0OiAnYXRvbS10ZXh0LWVkaXRvcidcblxuICAgICAgICBhdG9tLnN0eWxlcy5hZGRTdHlsZVNoZWV0IHVucmVsYXRlZFN0eWxlLFxuICAgICAgICAgIGNvbnRleHQ6ICd1bnJlbGF0ZWQtY29udGV4dCdcblxuICAgICAgICBleHRyYWN0ZWRTdHlsZXMgPSBwcmV2aWV3LmdldFRleHRFZGl0b3JTdHlsZXMoKVxuXG4gICAgICBpdCBcInJldHVybnMgYW4gYXJyYXkgY29udGFpbmluZyBhdG9tLXRleHQtZWRpdG9yIGNzcyBzdHlsZSBzdHJpbmdzXCIsIC0+XG4gICAgICAgIGV4cGVjdChleHRyYWN0ZWRTdHlsZXMuaW5kZXhPZih0ZXh0RWRpdG9yU3R5bGUpKS50b0JlR3JlYXRlclRoYW4oLTEpXG5cbiAgICAgIGl0IFwiZG9lcyBub3QgcmV0dXJuIG90aGVyIHN0eWxlc1wiLCAtPlxuICAgICAgICBleHBlY3QoZXh0cmFjdGVkU3R5bGVzLmluZGV4T2YodW5yZWxhdGVkU3R5bGUpKS50b0JlKC0xKVxuXG4gIGRlc2NyaWJlIFwid2hlbiBjb3JlOmNvcHkgaXMgdHJpZ2dlcmVkXCIsIC0+XG4gICAgaXQgXCJ3cml0ZXMgdGhlIHJlbmRlcmVkIEhUTUwgdG8gdGhlIGNsaXBib2FyZFwiLCAtPlxuICAgICAgcHJldmlldy5kZXN0cm95KClcbiAgICAgIHByZXZpZXcuZWxlbWVudC5yZW1vdmUoKVxuXG4gICAgICBmaWxlUGF0aCA9IGF0b20ucHJvamVjdC5nZXREaXJlY3RvcmllcygpWzBdLnJlc29sdmUoJ3N1YmRpci9jb2RlLWJsb2NrLm1kJylcbiAgICAgIHByZXZpZXcgPSBuZXcgTWFya2Rvd25QcmV2aWV3Vmlldyh7ZmlsZVBhdGh9KVxuICAgICAgamFzbWluZS5hdHRhY2hUb0RPTShwcmV2aWV3LmVsZW1lbnQpXG5cbiAgICAgIHdhaXRzRm9yUHJvbWlzZSAtPlxuICAgICAgICBwcmV2aWV3LnJlbmRlck1hcmtkb3duKClcblxuICAgICAgcnVucyAtPlxuICAgICAgICBhdG9tLmNvbW1hbmRzLmRpc3BhdGNoIHByZXZpZXcuZWxlbWVudCwgJ2NvcmU6Y29weSdcblxuICAgICAgd2FpdHNGb3IgLT5cbiAgICAgICAgYXRvbS5jbGlwYm9hcmQucmVhZCgpIGlzbnQgXCJpbml0aWFsIGNsaXBib2FyZCBjb250ZW50XCJcblxuICAgICAgcnVucyAtPlxuICAgICAgICBleHBlY3QoYXRvbS5jbGlwYm9hcmQucmVhZCgpKS50b0JlIFwiXCJcIlxuICAgICAgICAgPGgxPkNvZGUgQmxvY2s8L2gxPlxuICAgICAgICAgPHByZSBjbGFzcz1cImVkaXRvci1jb2xvcnMgbGFuZy1qYXZhc2NyaXB0XCI+PGRpdiBjbGFzcz1cImxpbmVcIj48c3BhbiBjbGFzcz1cInN5bnRheC0tc291cmNlIHN5bnRheC0tanNcIj48c3BhbiBjbGFzcz1cInN5bnRheC0ta2V5d29yZCBzeW50YXgtLWNvbnRyb2wgc3ludGF4LS1qc1wiPjxzcGFuPmlmPC9zcGFuPjwvc3Bhbj48c3Bhbj4mbmJzcDthJm5ic3A7PC9zcGFuPjxzcGFuIGNsYXNzPVwic3ludGF4LS1rZXl3b3JkIHN5bnRheC0tb3BlcmF0b3Igc3ludGF4LS1jb21wYXJpc29uIHN5bnRheC0tanNcIj48c3Bhbj49PT08L3NwYW4+PC9zcGFuPjxzcGFuPiZuYnNwOzwvc3Bhbj48c3BhbiBjbGFzcz1cInN5bnRheC0tY29uc3RhbnQgc3ludGF4LS1udW1lcmljIHN5bnRheC0tZGVjaW1hbCBzeW50YXgtLWpzXCI+PHNwYW4+Mzwvc3Bhbj48L3NwYW4+PHNwYW4+Jm5ic3A7PC9zcGFuPjxzcGFuIGNsYXNzPVwic3ludGF4LS1tZXRhIHN5bnRheC0tYnJhY2Ugc3ludGF4LS1jdXJseSBzeW50YXgtLWpzXCI+PHNwYW4+ezwvc3Bhbj48L3NwYW4+PC9zcGFuPlxuICAgICAgICAgPC9kaXY+PGRpdiBjbGFzcz1cImxpbmVcIj48c3BhbiBjbGFzcz1cInN5bnRheC0tc291cmNlIHN5bnRheC0tanNcIj48c3Bhbj4mbmJzcDsmbmJzcDtiJm5ic3A7PC9zcGFuPjxzcGFuIGNsYXNzPVwic3ludGF4LS1rZXl3b3JkIHN5bnRheC0tb3BlcmF0b3Igc3ludGF4LS1hc3NpZ25tZW50IHN5bnRheC0tanNcIj48c3Bhbj49PC9zcGFuPjwvc3Bhbj48c3Bhbj4mbmJzcDs8L3NwYW4+PHNwYW4gY2xhc3M9XCJzeW50YXgtLWNvbnN0YW50IHN5bnRheC0tbnVtZXJpYyBzeW50YXgtLWRlY2ltYWwgc3ludGF4LS1qc1wiPjxzcGFuPjU8L3NwYW4+PC9zcGFuPjwvc3Bhbj5cbiAgICAgICAgIDwvZGl2PjxkaXYgY2xhc3M9XCJsaW5lXCI+PHNwYW4gY2xhc3M9XCJzeW50YXgtLXNvdXJjZSBzeW50YXgtLWpzXCI+PHNwYW4gY2xhc3M9XCJzeW50YXgtLW1ldGEgc3ludGF4LS1icmFjZSBzeW50YXgtLWN1cmx5IHN5bnRheC0tanNcIj48c3Bhbj59PC9zcGFuPjwvc3Bhbj48L3NwYW4+XG4gICAgICAgICA8L2Rpdj48L3ByZT5cbiAgICAgICAgIDxwPmVuY29kaW5nIOKGkiBpc3N1ZTwvcD5cbiAgICAgICAgXCJcIlwiXG5cbiAgZGVzY3JpYmUgXCJ3aGVuIG1hdGhzIHJlbmRlcmluZyBpcyBlbmFibGVkIGJ5IGRlZmF1bHRcIiwgLT5cbiAgICBpdCBcIm5vdGlmaWVzIHRoZSB1c2VyIE1hdGhKYXggaXMgbG9hZGluZyB3aGVuIGZpcnN0IHByZXZpZXcgaXMgb3BlbmVkXCIsIC0+XG4gICAgICBbd29ya3NwYWNlRWxlbWVudF0gPSBbXVxuXG4gICAgICBwcmV2aWV3LmRlc3Ryb3koKVxuXG4gICAgICB3YWl0c0ZvclByb21pc2UgLT4gYXRvbS5wYWNrYWdlcy5hY3RpdmF0ZVBhY2thZ2UoJ25vdGlmaWNhdGlvbnMnKVxuXG4gICAgICBydW5zIC0+XG4gICAgICAgIHdvcmtzcGFjZUVsZW1lbnQgPSBhdG9tLnZpZXdzLmdldFZpZXcoYXRvbS53b3Jrc3BhY2UpXG4gICAgICAgIGphc21pbmUuYXR0YWNoVG9ET00od29ya3NwYWNlRWxlbWVudClcblxuICAgICAgd2FpdHNGb3JQcm9taXNlIC0+IGF0b20ud29ya3NwYWNlLm9wZW4oZmlsZVBhdGgpXG5cbiAgICAgIHJ1bnMgLT5cbiAgICAgICAgbWF0aGpheEhlbHBlci5yZXNldE1hdGhKYXgoKVxuICAgICAgICBhdG9tLmNvbmZpZy5zZXQgJ21hcmtkb3duLXByZXZpZXctcGx1cy5lbmFibGVMYXRleFJlbmRlcmluZ0J5RGVmYXVsdCcsIHRydWVcbiAgICAgICAgYXRvbS5jb21tYW5kcy5kaXNwYXRjaCB3b3Jrc3BhY2VFbGVtZW50LCAnbWFya2Rvd24tcHJldmlldy1wbHVzOnRvZ2dsZSdcblxuICAgICAgZXhwZWN0UHJldmlld0luU3BsaXRQYW5lKClcblxuICAgICAgd2FpdHNGb3IgXCJub3RpZmljYXRpb25cIiwgLT5cbiAgICAgICAgd29ya3NwYWNlRWxlbWVudC5xdWVyeVNlbGVjdG9yICdhdG9tLW5vdGlmaWNhdGlvbidcblxuICAgICAgcnVucyAtPlxuICAgICAgICBub3RpZmljYXRpb24gPSB3b3Jrc3BhY2VFbGVtZW50LnF1ZXJ5U2VsZWN0b3IgJ2F0b20tbm90aWZpY2F0aW9uLmluZm8nXG4gICAgICAgIGV4cGVjdChub3RpZmljYXRpb24pLnRvRXhpc3QoKVxuIl19
