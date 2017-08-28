(function() {
  var $, MarkdownPreviewView, fs, path, temp, wrench;

  path = require('path');

  fs = require('fs-plus');

  temp = require('temp');

  wrench = require('wrench');

  MarkdownPreviewView = require('../lib/markdown-preview-view');

  $ = require('atom-space-pen-views').$;

  require('./spec-helper');

  describe("Markdown preview plus package", function() {
    var expectPreviewInSplitPane, preview, ref, workspaceElement;
    ref = [], workspaceElement = ref[0], preview = ref[1];
    beforeEach(function() {
      var fixturesPath, tempPath;
      fixturesPath = path.join(__dirname, 'fixtures');
      tempPath = temp.mkdirSync('atom');
      wrench.copyDirSyncRecursive(fixturesPath, tempPath, {
        forceDelete: true
      });
      atom.project.setPaths([tempPath]);
      jasmine.useRealClock();
      workspaceElement = atom.views.getView(atom.workspace);
      jasmine.attachToDOM(workspaceElement);
      waitsForPromise(function() {
        return atom.packages.activatePackage("markdown-preview-plus");
      });
      return waitsForPromise(function() {
        return atom.packages.activatePackage('language-gfm');
      });
    });
    afterEach(function() {
      if (preview instanceof MarkdownPreviewView) {
        preview.destroy();
      }
      return preview = null;
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
    describe("when a preview has not been created for the file", function() {
      it("displays a markdown preview in a split pane", function() {
        waitsForPromise(function() {
          return atom.workspace.open("subdir/file.markdown");
        });
        runs(function() {
          return atom.commands.dispatch(workspaceElement, 'markdown-preview-plus:toggle');
        });
        expectPreviewInSplitPane();
        return runs(function() {
          var editorPane;
          editorPane = atom.workspace.getPanes()[0];
          expect(editorPane.getItems()).toHaveLength(1);
          return expect(editorPane.isActive()).toBe(true);
        });
      });
      describe("when the editor's path does not exist", function() {
        return it("splits the current pane to the right with a markdown preview for the file", function() {
          waitsForPromise(function() {
            return atom.workspace.open("new.markdown");
          });
          runs(function() {
            return atom.commands.dispatch(workspaceElement, 'markdown-preview-plus:toggle');
          });
          return expectPreviewInSplitPane();
        });
      });
      describe("when the editor does not have a path", function() {
        return it("splits the current pane to the right with a markdown preview for the file", function() {
          waitsForPromise(function() {
            return atom.workspace.open("");
          });
          runs(function() {
            return atom.commands.dispatch(workspaceElement, 'markdown-preview-plus:toggle');
          });
          return expectPreviewInSplitPane();
        });
      });
      describe("when the path contains a space", function() {
        return it("renders the preview", function() {
          waitsForPromise(function() {
            return atom.workspace.open("subdir/file with space.md");
          });
          runs(function() {
            return atom.commands.dispatch(workspaceElement, 'markdown-preview-plus:toggle');
          });
          return expectPreviewInSplitPane();
        });
      });
      return describe("when the path contains accented characters", function() {
        return it("renders the preview", function() {
          waitsForPromise(function() {
            return atom.workspace.open("subdir/áccéntéd.md");
          });
          runs(function() {
            return atom.commands.dispatch(workspaceElement, 'markdown-preview-plus:toggle');
          });
          return expectPreviewInSplitPane();
        });
      });
    });
    describe("when a preview has been created for the file", function() {
      beforeEach(function() {
        waitsForPromise(function() {
          return atom.workspace.open("subdir/file.markdown");
        });
        runs(function() {
          return atom.commands.dispatch(workspaceElement, 'markdown-preview-plus:toggle');
        });
        return expectPreviewInSplitPane();
      });
      it("closes the existing preview when toggle is triggered a second time on the editor and when the preview is its panes active item", function() {
        var editorPane, previewPane, ref1;
        atom.commands.dispatch(workspaceElement, 'markdown-preview-plus:toggle');
        ref1 = atom.workspace.getPanes(), editorPane = ref1[0], previewPane = ref1[1];
        expect(editorPane.isActive()).toBe(true);
        return expect(previewPane.getActiveItem()).toBeUndefined();
      });
      it("activates the existing preview when toggle is triggered a second time on the editor and when the preview is not its panes active item #nottravis", function() {
        var editorPane, previewPane, ref1;
        ref1 = atom.workspace.getPanes(), editorPane = ref1[0], previewPane = ref1[1];
        editorPane.activate();
        waitsForPromise(function() {
          return atom.workspace.open("subdir/simple.md");
        });
        runs(function() {
          return atom.commands.dispatch(workspaceElement, 'markdown-preview-plus:toggle');
        });
        waitsFor("second markdown preview to be created", function() {
          return previewPane.getItems().length === 2;
        });
        waitsFor("second markdown preview to be activated", function() {
          return previewPane.getActiveItemIndex() === 1;
        });
        runs(function() {
          preview = previewPane.getActiveItem();
          expect(preview).toBeInstanceOf(MarkdownPreviewView);
          expect(preview.getPath()).toBe(editorPane.getActiveItem().getPath());
          expect(preview.getPath()).toBe(atom.workspace.getActivePaneItem().getPath());
          editorPane.activate();
          editorPane.activateItemAtIndex(0);
          return atom.commands.dispatch(workspaceElement, 'markdown-preview-plus:toggle');
        });
        waitsFor("first preview to be activated", function() {
          return previewPane.getActiveItemIndex() === 0;
        });
        return runs(function() {
          preview = previewPane.getActiveItem();
          expect(previewPane.getItems().length).toBe(2);
          expect(preview.getPath()).toBe(editorPane.getActiveItem().getPath());
          return expect(preview.getPath()).toBe(atom.workspace.getActivePaneItem().getPath());
        });
      });
      it("closes the existing preview when toggle is triggered on it and it has focus", function() {
        var editorPane, previewPane, ref1;
        ref1 = atom.workspace.getPanes(), editorPane = ref1[0], previewPane = ref1[1];
        previewPane.activate();
        atom.commands.dispatch(workspaceElement, 'markdown-preview-plus:toggle');
        return expect(previewPane.getActiveItem()).toBeUndefined();
      });
      describe("when the editor is modified", function() {
        it("re-renders the preview", function() {
          var markdownEditor;
          spyOn(preview, 'showLoading');
          markdownEditor = atom.workspace.getActiveTextEditor();
          markdownEditor.setText("Hey!");
          waitsFor(function() {
            return preview.text().indexOf("Hey!") >= 0;
          });
          return runs(function() {
            return expect(preview.showLoading).not.toHaveBeenCalled();
          });
        });
        it("invokes ::onDidChangeMarkdown listeners", function() {
          var listener, markdownEditor;
          markdownEditor = atom.workspace.getActiveTextEditor();
          preview.onDidChangeMarkdown(listener = jasmine.createSpy('didChangeMarkdownListener'));
          runs(function() {
            return markdownEditor.setText("Hey!");
          });
          return waitsFor("::onDidChangeMarkdown handler to be called", function() {
            return listener.callCount > 0;
          });
        });
        describe("when the preview is in the active pane but is not the active item", function() {
          return it("re-renders the preview but does not make it active", function() {
            var markdownEditor, previewPane;
            markdownEditor = atom.workspace.getActiveTextEditor();
            previewPane = atom.workspace.getPanes()[1];
            previewPane.activate();
            waitsForPromise(function() {
              return atom.workspace.open();
            });
            runs(function() {
              return markdownEditor.setText("Hey!");
            });
            waitsFor(function() {
              return preview.text().indexOf("Hey!") >= 0;
            });
            return runs(function() {
              expect(previewPane.isActive()).toBe(true);
              return expect(previewPane.getActiveItem()).not.toBe(preview);
            });
          });
        });
        describe("when the preview is not the active item and not in the active pane", function() {
          return it("re-renders the preview and makes it active", function() {
            var editorPane, markdownEditor, previewPane, ref1;
            markdownEditor = atom.workspace.getActiveTextEditor();
            ref1 = atom.workspace.getPanes(), editorPane = ref1[0], previewPane = ref1[1];
            previewPane.splitRight({
              copyActiveItem: true
            });
            previewPane.activate();
            waitsForPromise(function() {
              return atom.workspace.open();
            });
            runs(function() {
              editorPane.activate();
              return markdownEditor.setText("Hey!");
            });
            waitsFor(function() {
              return preview.text().indexOf("Hey!") >= 0;
            });
            return runs(function() {
              expect(editorPane.isActive()).toBe(true);
              return expect(previewPane.getActiveItem()).toBe(preview);
            });
          });
        });
        return describe("when the liveUpdate config is set to false", function() {
          return it("only re-renders the markdown when the editor is saved, not when the contents are modified", function() {
            var didStopChangingHandler;
            atom.config.set('markdown-preview-plus.liveUpdate', false);
            didStopChangingHandler = jasmine.createSpy('didStopChangingHandler');
            atom.workspace.getActiveTextEditor().getBuffer().onDidStopChanging(didStopChangingHandler);
            atom.workspace.getActiveTextEditor().setText('ch ch changes');
            waitsFor(function() {
              return didStopChangingHandler.callCount > 0;
            });
            runs(function() {
              expect(preview.text()).not.toContain("ch ch changes");
              return atom.workspace.getActiveTextEditor().save();
            });
            return waitsFor(function() {
              return preview.text().indexOf("ch ch changes") >= 0;
            });
          });
        });
      });
      return describe("when a new grammar is loaded", function() {
        return it("re-renders the preview", function() {
          var grammarAdded;
          atom.workspace.getActiveTextEditor().setText("```javascript\nvar x = y;\n```");
          waitsFor("markdown to be rendered after its text changed", function() {
            return preview.find("atom-text-editor").data("grammar") === "text plain null-grammar";
          });
          grammarAdded = false;
          runs(function() {
            return atom.grammars.onDidAddGrammar(function() {
              return grammarAdded = true;
            });
          });
          waitsForPromise(function() {
            expect(atom.packages.isPackageActive('language-javascript')).toBe(false);
            return atom.packages.activatePackage('language-javascript');
          });
          waitsFor("grammar to be added", function() {
            return grammarAdded;
          });
          return waitsFor("markdown to be rendered after grammar was added", function() {
            return preview.find("atom-text-editor").data("grammar") !== "source js";
          });
        });
      });
    });
    describe("when the markdown preview view is requested by file URI", function() {
      return it("opens a preview editor and watches the file for changes", function() {
        waitsForPromise("atom.workspace.open promise to be resolved", function() {
          return atom.workspace.open("markdown-preview-plus://" + (atom.project.getDirectories()[0].resolve('subdir/file.markdown')));
        });
        runs(function() {
          preview = atom.workspace.getActivePaneItem();
          expect(preview).toBeInstanceOf(MarkdownPreviewView);
          spyOn(preview, 'renderMarkdownText');
          return preview.file.emitter.emit('did-change');
        });
        return waitsFor("markdown to be re-rendered after file changed", function() {
          return preview.renderMarkdownText.callCount > 0;
        });
      });
    });
    describe("when the editor's grammar it not enabled for preview", function() {
      return it("does not open the markdown preview", function() {
        atom.config.set('markdown-preview-plus.grammars', []);
        waitsForPromise(function() {
          return atom.workspace.open("subdir/file.markdown");
        });
        return runs(function() {
          spyOn(atom.workspace, 'open').andCallThrough();
          atom.commands.dispatch(workspaceElement, 'markdown-preview-plus:toggle');
          return expect(atom.workspace.open).not.toHaveBeenCalled();
        });
      });
    });
    describe("when the editor's path changes on #win32 and #darwin", function() {
      return it("updates the preview's title", function() {
        var titleChangedCallback;
        titleChangedCallback = jasmine.createSpy('titleChangedCallback');
        waitsForPromise(function() {
          return atom.workspace.open("subdir/file.markdown");
        });
        runs(function() {
          return atom.commands.dispatch(workspaceElement, 'markdown-preview-plus:toggle');
        });
        expectPreviewInSplitPane();
        runs(function() {
          var filePath;
          expect(preview.getTitle()).toBe('file.markdown Preview');
          preview.onDidChangeTitle(titleChangedCallback);
          filePath = atom.workspace.getActiveTextEditor().getPath();
          return fs.renameSync(filePath, path.join(path.dirname(filePath), 'file2.md'));
        });
        waitsFor(function() {
          return preview.getTitle() === "file2.md Preview";
        });
        return runs(function() {
          expect(titleChangedCallback).toHaveBeenCalled();
          return preview.destroy();
        });
      });
    });
    describe("when the URI opened does not have a markdown-preview-plus protocol", function() {
      return it("does not throw an error trying to decode the URI (regression)", function() {
        waitsForPromise(function() {
          return atom.workspace.open('%');
        });
        return runs(function() {
          return expect(atom.workspace.getActiveTextEditor()).toBeTruthy();
        });
      });
    });
    describe("when markdown-preview-plus:copy-html is triggered", function() {
      it("copies the HTML to the clipboard", function() {
        waitsForPromise(function() {
          return atom.workspace.open("subdir/simple.md");
        });
        return runs(function() {
          atom.commands.dispatch(workspaceElement, 'markdown-preview-plus:copy-html');
          expect(atom.clipboard.read()).toBe("<p><em>italic</em></p>\n<p><strong>bold</strong></p>\n<p>encoding \u2192 issue</p>");
          atom.workspace.getActiveTextEditor().setSelectedBufferRange([[0, 0], [1, 0]]);
          atom.commands.dispatch(workspaceElement, 'markdown-preview-plus:copy-html');
          return expect(atom.clipboard.read()).toBe("<p><em>italic</em></p>");
        });
      });
      return describe("code block tokenization", function() {
        preview = null;
        beforeEach(function() {
          waitsForPromise(function() {
            return atom.packages.activatePackage('language-ruby');
          });
          waitsForPromise(function() {
            return atom.packages.activatePackage('markdown-preview-plus');
          });
          waitsForPromise(function() {
            return atom.workspace.open("subdir/file.markdown");
          });
          return runs(function() {
            workspaceElement = atom.views.getView(atom.workspace);
            atom.commands.dispatch(workspaceElement, 'markdown-preview-plus:copy-html');
            return preview = $('<div>').append(atom.clipboard.read());
          });
        });
        describe("when the code block's fence name has a matching grammar", function() {
          return it("tokenizes the code block with the grammar", function() {
            return expect(preview.find("pre span.syntax--entity.syntax--name.syntax--function.syntax--ruby")).toExist();
          });
        });
        describe("when the code block's fence name doesn't have a matching grammar", function() {
          return it("does not tokenize the code block", function() {
            return expect(preview.find("pre.lang-kombucha .line .syntax--null-grammar").children().length).toBe(2);
          });
        });
        describe("when the code block contains empty lines", function() {
          return it("doesn't remove the empty lines", function() {
            expect(preview.find("pre.lang-python").children().length).toBe(6);
            expect(preview.find("pre.lang-python div:nth-child(2)").text().trim()).toBe('');
            expect(preview.find("pre.lang-python div:nth-child(4)").text().trim()).toBe('');
            return expect(preview.find("pre.lang-python div:nth-child(5)").text().trim()).toBe('');
          });
        });
        return describe("when the code block is nested in a list", function() {
          return it("detects and styles the block", function() {
            return expect(preview.find("pre.lang-javascript")).toHaveClass('editor-colors');
          });
        });
      });
    });
    describe("when main::copyHtml() is called directly", function() {
      var mpp;
      mpp = null;
      beforeEach(function() {
        return mpp = atom.packages.getActivePackage('markdown-preview-plus').mainModule;
      });
      it("copies the HTML to the clipboard by default", function() {
        waitsForPromise(function() {
          return atom.workspace.open("subdir/simple.md");
        });
        return runs(function() {
          mpp.copyHtml();
          expect(atom.clipboard.read()).toBe("<p><em>italic</em></p>\n<p><strong>bold</strong></p>\n<p>encoding \u2192 issue</p>");
          atom.workspace.getActiveTextEditor().setSelectedBufferRange([[0, 0], [1, 0]]);
          mpp.copyHtml();
          return expect(atom.clipboard.read()).toBe("<p><em>italic</em></p>");
        });
      });
      it("passes the HTML to a callback if supplied as the first argument", function() {
        waitsForPromise(function() {
          return atom.workspace.open("subdir/simple.md");
        });
        return runs(function() {
          expect(mpp.copyHtml(function(html) {
            return html;
          })).toBe("<p><em>italic</em></p>\n<p><strong>bold</strong></p>\n<p>encoding \u2192 issue</p>");
          atom.workspace.getActiveTextEditor().setSelectedBufferRange([[0, 0], [1, 0]]);
          return expect(mpp.copyHtml(function(html) {
            return html;
          })).toBe("<p><em>italic</em></p>");
        });
      });
      return describe("when LaTeX rendering is enabled by default", function() {
        beforeEach(function() {
          spyOn(atom.clipboard, 'write').andCallThrough();
          waitsFor("LaTeX rendering to be enabled", function() {
            return atom.config.set('markdown-preview-plus.enableLatexRenderingByDefault', true);
          });
          waitsForPromise(function() {
            return atom.workspace.open("subdir/simple.md");
          });
          return runs(function() {
            return atom.workspace.getActiveTextEditor().setText('$$\\int_3^4$$');
          });
        });
        it("copies the HTML with maths blocks as svg's to the clipboard by default", function() {
          mpp.copyHtml();
          waitsFor("atom.clipboard.write to have been called", function() {
            return atom.clipboard.write.callCount === 1;
          });
          return runs(function() {
            var clipboard;
            clipboard = atom.clipboard.read();
            expect(clipboard.match(/MathJax\_SVG\_Hidden/).length).toBe(1);
            return expect(clipboard.match(/class\=\"MathJax\_SVG\"/).length).toBe(1);
          });
        });
        it("scales the svg's if the scaleMath parameter is passed", function() {
          mpp.copyHtml(null, 200);
          waitsFor("atom.clipboard.write to have been called", function() {
            return atom.clipboard.write.callCount === 1;
          });
          return runs(function() {
            var clipboard;
            clipboard = atom.clipboard.read();
            return expect(clipboard.match(/font\-size\: 200%/).length).toBe(1);
          });
        });
        return it("passes the HTML to a callback if supplied as the first argument", function() {
          var html;
          html = null;
          mpp.copyHtml(function(proHTML) {
            return html = proHTML;
          });
          waitsFor("markdown to be parsed and processed by MathJax", function() {
            return html != null;
          });
          return runs(function() {
            expect(html.match(/MathJax\_SVG\_Hidden/).length).toBe(1);
            return expect(html.match(/class\=\"MathJax\_SVG\"/).length).toBe(1);
          });
        });
      });
    });
    describe("sanitization", function() {
      it("removes script tags and attributes that commonly contain inline scripts", function() {
        waitsForPromise(function() {
          return atom.workspace.open("subdir/evil.md");
        });
        runs(function() {
          return atom.commands.dispatch(workspaceElement, 'markdown-preview-plus:toggle');
        });
        expectPreviewInSplitPane();
        return runs(function() {
          return expect($(preview[0]).find("div.update-preview").html()).toBe("<p>hello</p>\n\n\n<p>sad\n<img>\nworld</p>");
        });
      });
      return it("remove the first <!doctype> tag at the beginning of the file", function() {
        waitsForPromise(function() {
          return atom.workspace.open("subdir/doctype-tag.md");
        });
        runs(function() {
          return atom.commands.dispatch(workspaceElement, 'markdown-preview-plus:toggle');
        });
        expectPreviewInSplitPane();
        return runs(function() {
          return expect($(preview[0]).find("div.update-preview").html()).toBe("<p>content\n&lt;!doctype html&gt;</p>");
        });
      });
    });
    describe("when the markdown contains an <html> tag", function() {
      return it("does not throw an exception", function() {
        waitsForPromise(function() {
          return atom.workspace.open("subdir/html-tag.md");
        });
        runs(function() {
          return atom.commands.dispatch(workspaceElement, 'markdown-preview-plus:toggle');
        });
        expectPreviewInSplitPane();
        return runs(function() {
          return expect($(preview[0]).find("div.update-preview").html()).toBe("content");
        });
      });
    });
    describe("when the markdown contains a <pre> tag", function() {
      return it("does not throw an exception", function() {
        waitsForPromise(function() {
          return atom.workspace.open("subdir/pre-tag.md");
        });
        runs(function() {
          return atom.commands.dispatch(workspaceElement, 'markdown-preview-plus:toggle');
        });
        expectPreviewInSplitPane();
        return runs(function() {
          return expect(preview.find('atom-text-editor')).toExist();
        });
      });
    });
    return describe("GitHub style markdown preview", function() {
      beforeEach(function() {
        return atom.config.set('markdown-preview-plus.useGitHubStyle', false);
      });
      it("renders markdown using the default style when GitHub styling is disabled", function() {
        waitsForPromise(function() {
          return atom.workspace.open("subdir/simple.md");
        });
        runs(function() {
          return atom.commands.dispatch(workspaceElement, 'markdown-preview-plus:toggle');
        });
        expectPreviewInSplitPane();
        return runs(function() {
          return expect(preview.element.getAttribute('data-use-github-style')).toBeNull();
        });
      });
      it("renders markdown using the GitHub styling when enabled", function() {
        atom.config.set('markdown-preview-plus.useGitHubStyle', true);
        waitsForPromise(function() {
          return atom.workspace.open("subdir/simple.md");
        });
        runs(function() {
          return atom.commands.dispatch(workspaceElement, 'markdown-preview-plus:toggle');
        });
        expectPreviewInSplitPane();
        return runs(function() {
          return expect(preview.element.getAttribute('data-use-github-style')).toBe('');
        });
      });
      return it("updates the rendering style immediately when the configuration is changed", function() {
        waitsForPromise(function() {
          return atom.workspace.open("subdir/simple.md");
        });
        runs(function() {
          return atom.commands.dispatch(workspaceElement, 'markdown-preview-plus:toggle');
        });
        expectPreviewInSplitPane();
        return runs(function() {
          expect(preview.element.getAttribute('data-use-github-style')).toBeNull();
          atom.config.set('markdown-preview-plus.useGitHubStyle', true);
          expect(preview.element.getAttribute('data-use-github-style')).not.toBeNull();
          atom.config.set('markdown-preview-plus.useGitHubStyle', false);
          return expect(preview.element.getAttribute('data-use-github-style')).toBeNull();
        });
      });
    });
  });

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL2hvbWUvbWFyY3VzLy5hdG9tL3BhY2thZ2VzL21hcmtkb3duLXByZXZpZXctcGx1cy9zcGVjL21hcmtkb3duLXByZXZpZXctc3BlYy5jb2ZmZWUiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUFBQSxNQUFBOztFQUFBLElBQUEsR0FBTyxPQUFBLENBQVEsTUFBUjs7RUFDUCxFQUFBLEdBQUssT0FBQSxDQUFRLFNBQVI7O0VBQ0wsSUFBQSxHQUFPLE9BQUEsQ0FBUSxNQUFSOztFQUNQLE1BQUEsR0FBUyxPQUFBLENBQVEsUUFBUjs7RUFDVCxtQkFBQSxHQUFzQixPQUFBLENBQVEsOEJBQVI7O0VBQ3JCLElBQUssT0FBQSxDQUFRLHNCQUFSOztFQUVOLE9BQUEsQ0FBUSxlQUFSOztFQUVBLFFBQUEsQ0FBUywrQkFBVCxFQUEwQyxTQUFBO0FBQ3hDLFFBQUE7SUFBQSxNQUE4QixFQUE5QixFQUFDLHlCQUFELEVBQW1CO0lBRW5CLFVBQUEsQ0FBVyxTQUFBO0FBQ1QsVUFBQTtNQUFBLFlBQUEsR0FBZSxJQUFJLENBQUMsSUFBTCxDQUFVLFNBQVYsRUFBcUIsVUFBckI7TUFDZixRQUFBLEdBQVcsSUFBSSxDQUFDLFNBQUwsQ0FBZSxNQUFmO01BQ1gsTUFBTSxDQUFDLG9CQUFQLENBQTRCLFlBQTVCLEVBQTBDLFFBQTFDLEVBQW9EO1FBQUEsV0FBQSxFQUFhLElBQWI7T0FBcEQ7TUFDQSxJQUFJLENBQUMsT0FBTyxDQUFDLFFBQWIsQ0FBc0IsQ0FBQyxRQUFELENBQXRCO01BRUEsT0FBTyxDQUFDLFlBQVIsQ0FBQTtNQUVBLGdCQUFBLEdBQW1CLElBQUksQ0FBQyxLQUFLLENBQUMsT0FBWCxDQUFtQixJQUFJLENBQUMsU0FBeEI7TUFDbkIsT0FBTyxDQUFDLFdBQVIsQ0FBb0IsZ0JBQXBCO01BRUEsZUFBQSxDQUFnQixTQUFBO2VBQ2QsSUFBSSxDQUFDLFFBQVEsQ0FBQyxlQUFkLENBQThCLHVCQUE5QjtN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aUJBQ0EsTUFBQSxDQUFPLE9BQU8sQ0FBQyxPQUFPLENBQUMsWUFBaEIsQ0FBNkIsdUJBQTdCLENBQVAsQ0FBNkQsQ0FBQyxRQUE5RCxDQUFBO1FBUEcsQ0FBTDtNQUw4RSxDQUFoRjtJQXBCd0MsQ0FBMUM7RUEzZHdDLENBQTFDO0FBVEEiLCJzb3VyY2VzQ29udGVudCI6WyJwYXRoID0gcmVxdWlyZSAncGF0aCdcbmZzID0gcmVxdWlyZSAnZnMtcGx1cydcbnRlbXAgPSByZXF1aXJlICd0ZW1wJ1xud3JlbmNoID0gcmVxdWlyZSAnd3JlbmNoJ1xuTWFya2Rvd25QcmV2aWV3VmlldyA9IHJlcXVpcmUgJy4uL2xpYi9tYXJrZG93bi1wcmV2aWV3LXZpZXcnXG57JH0gPSByZXF1aXJlICdhdG9tLXNwYWNlLXBlbi12aWV3cydcblxucmVxdWlyZSAnLi9zcGVjLWhlbHBlcidcblxuZGVzY3JpYmUgXCJNYXJrZG93biBwcmV2aWV3IHBsdXMgcGFja2FnZVwiLCAtPlxuICBbd29ya3NwYWNlRWxlbWVudCwgcHJldmlld10gPSBbXVxuXG4gIGJlZm9yZUVhY2ggLT5cbiAgICBmaXh0dXJlc1BhdGggPSBwYXRoLmpvaW4oX19kaXJuYW1lLCAnZml4dHVyZXMnKVxuICAgIHRlbXBQYXRoID0gdGVtcC5ta2RpclN5bmMoJ2F0b20nKVxuICAgIHdyZW5jaC5jb3B5RGlyU3luY1JlY3Vyc2l2ZShmaXh0dXJlc1BhdGgsIHRlbXBQYXRoLCBmb3JjZURlbGV0ZTogdHJ1ZSlcbiAgICBhdG9tLnByb2plY3Quc2V0UGF0aHMoW3RlbXBQYXRoXSlcblxuICAgIGphc21pbmUudXNlUmVhbENsb2NrKClcblxuICAgIHdvcmtzcGFjZUVsZW1lbnQgPSBhdG9tLnZpZXdzLmdldFZpZXcoYXRvbS53b3Jrc3BhY2UpXG4gICAgamFzbWluZS5hdHRhY2hUb0RPTSh3b3Jrc3BhY2VFbGVtZW50KVxuXG4gICAgd2FpdHNGb3JQcm9taXNlIC0+XG4gICAgICBhdG9tLnBhY2thZ2VzLmFjdGl2YXRlUGFja2FnZShcIm1hcmtkb3duLXByZXZpZXctcGx1c1wiKVxuXG4gICAgd2FpdHNGb3JQcm9taXNlIC0+XG4gICAgICBhdG9tLnBhY2thZ2VzLmFjdGl2YXRlUGFja2FnZSgnbGFuZ3VhZ2UtZ2ZtJylcblxuICBhZnRlckVhY2ggLT5cbiAgICBpZiBwcmV2aWV3IGluc3RhbmNlb2YgTWFya2Rvd25QcmV2aWV3Vmlld1xuICAgICAgcHJldmlldy5kZXN0cm95KClcbiAgICBwcmV2aWV3ID0gbnVsbFxuXG4gIGV4cGVjdFByZXZpZXdJblNwbGl0UGFuZSA9IC0+XG4gICAgd2FpdHNGb3IgLT5cbiAgICAgICMgZXhwZWN0KGF0b20ud29ya3NwYWNlLmdldENlbnRlcigpLmdldFBhbmVzKCkpLnRvSGF2ZUxlbmd0aCAyXG4gICAgICBhdG9tLndvcmtzcGFjZS5nZXRDZW50ZXIoKS5nZXRQYW5lcygpLmxlbmd0aCBpcyAyXG5cbiAgICB3YWl0c0ZvciBcIm1hcmtkb3duIHByZXZpZXcgdG8gYmUgY3JlYXRlZFwiLCAtPlxuICAgICAgcHJldmlldyA9IGF0b20ud29ya3NwYWNlLmdldENlbnRlcigpLmdldFBhbmVzKClbMV0uZ2V0QWN0aXZlSXRlbSgpXG5cbiAgICBydW5zIC0+XG4gICAgICBleHBlY3QocHJldmlldykudG9CZUluc3RhbmNlT2YoTWFya2Rvd25QcmV2aWV3VmlldylcbiAgICAgIGV4cGVjdChwcmV2aWV3LmdldFBhdGgoKSkudG9CZSBhdG9tLndvcmtzcGFjZS5nZXRBY3RpdmVQYW5lSXRlbSgpLmdldFBhdGgoKVxuXG4gIGRlc2NyaWJlIFwid2hlbiBhIHByZXZpZXcgaGFzIG5vdCBiZWVuIGNyZWF0ZWQgZm9yIHRoZSBmaWxlXCIsIC0+XG4gICAgaXQgXCJkaXNwbGF5cyBhIG1hcmtkb3duIHByZXZpZXcgaW4gYSBzcGxpdCBwYW5lXCIsIC0+XG4gICAgICB3YWl0c0ZvclByb21pc2UgLT4gYXRvbS53b3Jrc3BhY2Uub3BlbihcInN1YmRpci9maWxlLm1hcmtkb3duXCIpXG4gICAgICBydW5zIC0+IGF0b20uY29tbWFuZHMuZGlzcGF0Y2ggd29ya3NwYWNlRWxlbWVudCwgJ21hcmtkb3duLXByZXZpZXctcGx1czp0b2dnbGUnXG4gICAgICBleHBlY3RQcmV2aWV3SW5TcGxpdFBhbmUoKVxuXG4gICAgICBydW5zIC0+XG4gICAgICAgIFtlZGl0b3JQYW5lXSA9IGF0b20ud29ya3NwYWNlLmdldFBhbmVzKClcbiAgICAgICAgZXhwZWN0KGVkaXRvclBhbmUuZ2V0SXRlbXMoKSkudG9IYXZlTGVuZ3RoIDFcbiAgICAgICAgZXhwZWN0KGVkaXRvclBhbmUuaXNBY3RpdmUoKSkudG9CZSB0cnVlXG5cbiAgICBkZXNjcmliZSBcIndoZW4gdGhlIGVkaXRvcidzIHBhdGggZG9lcyBub3QgZXhpc3RcIiwgLT5cbiAgICAgIGl0IFwic3BsaXRzIHRoZSBjdXJyZW50IHBhbmUgdG8gdGhlIHJpZ2h0IHdpdGggYSBtYXJrZG93biBwcmV2aWV3IGZvciB0aGUgZmlsZVwiLCAtPlxuICAgICAgICB3YWl0c0ZvclByb21pc2UgLT4gYXRvbS53b3Jrc3BhY2Uub3BlbihcIm5ldy5tYXJrZG93blwiKVxuICAgICAgICBydW5zIC0+IGF0b20uY29tbWFuZHMuZGlzcGF0Y2ggd29ya3NwYWNlRWxlbWVudCwgJ21hcmtkb3duLXByZXZpZXctcGx1czp0b2dnbGUnXG4gICAgICAgIGV4cGVjdFByZXZpZXdJblNwbGl0UGFuZSgpXG5cbiAgICBkZXNjcmliZSBcIndoZW4gdGhlIGVkaXRvciBkb2VzIG5vdCBoYXZlIGEgcGF0aFwiLCAtPlxuICAgICAgaXQgXCJzcGxpdHMgdGhlIGN1cnJlbnQgcGFuZSB0byB0aGUgcmlnaHQgd2l0aCBhIG1hcmtkb3duIHByZXZpZXcgZm9yIHRoZSBmaWxlXCIsIC0+XG4gICAgICAgIHdhaXRzRm9yUHJvbWlzZSAtPiBhdG9tLndvcmtzcGFjZS5vcGVuKFwiXCIpXG4gICAgICAgIHJ1bnMgLT4gYXRvbS5jb21tYW5kcy5kaXNwYXRjaCB3b3Jrc3BhY2VFbGVtZW50LCAnbWFya2Rvd24tcHJldmlldy1wbHVzOnRvZ2dsZSdcbiAgICAgICAgZXhwZWN0UHJldmlld0luU3BsaXRQYW5lKClcblxuICAgICMgaHR0cHM6Ly9naXRodWIuY29tL2F0b20vbWFya2Rvd24tcHJldmlldy9pc3N1ZXMvMjhcbiAgICBkZXNjcmliZSBcIndoZW4gdGhlIHBhdGggY29udGFpbnMgYSBzcGFjZVwiLCAtPlxuICAgICAgaXQgXCJyZW5kZXJzIHRoZSBwcmV2aWV3XCIsIC0+XG4gICAgICAgIHdhaXRzRm9yUHJvbWlzZSAtPiBhdG9tLndvcmtzcGFjZS5vcGVuKFwic3ViZGlyL2ZpbGUgd2l0aCBzcGFjZS5tZFwiKVxuICAgICAgICBydW5zIC0+IGF0b20uY29tbWFuZHMuZGlzcGF0Y2ggd29ya3NwYWNlRWxlbWVudCwgJ21hcmtkb3duLXByZXZpZXctcGx1czp0b2dnbGUnXG4gICAgICAgIGV4cGVjdFByZXZpZXdJblNwbGl0UGFuZSgpXG5cbiAgICAjIGh0dHBzOi8vZ2l0aHViLmNvbS9hdG9tL21hcmtkb3duLXByZXZpZXcvaXNzdWVzLzI5XG4gICAgZGVzY3JpYmUgXCJ3aGVuIHRoZSBwYXRoIGNvbnRhaW5zIGFjY2VudGVkIGNoYXJhY3RlcnNcIiwgLT5cbiAgICAgIGl0IFwicmVuZGVycyB0aGUgcHJldmlld1wiLCAtPlxuICAgICAgICB3YWl0c0ZvclByb21pc2UgLT4gYXRvbS53b3Jrc3BhY2Uub3BlbihcInN1YmRpci/DoWNjw6ludMOpZC5tZFwiKVxuICAgICAgICBydW5zIC0+IGF0b20uY29tbWFuZHMuZGlzcGF0Y2ggd29ya3NwYWNlRWxlbWVudCwgJ21hcmtkb3duLXByZXZpZXctcGx1czp0b2dnbGUnXG4gICAgICAgIGV4cGVjdFByZXZpZXdJblNwbGl0UGFuZSgpXG5cbiAgZGVzY3JpYmUgXCJ3aGVuIGEgcHJldmlldyBoYXMgYmVlbiBjcmVhdGVkIGZvciB0aGUgZmlsZVwiLCAtPlxuICAgIGJlZm9yZUVhY2ggLT5cbiAgICAgIHdhaXRzRm9yUHJvbWlzZSAtPiBhdG9tLndvcmtzcGFjZS5vcGVuKFwic3ViZGlyL2ZpbGUubWFya2Rvd25cIilcbiAgICAgIHJ1bnMgLT4gYXRvbS5jb21tYW5kcy5kaXNwYXRjaCB3b3Jrc3BhY2VFbGVtZW50LCAnbWFya2Rvd24tcHJldmlldy1wbHVzOnRvZ2dsZSdcbiAgICAgIGV4cGVjdFByZXZpZXdJblNwbGl0UGFuZSgpXG5cbiAgICBpdCBcImNsb3NlcyB0aGUgZXhpc3RpbmcgcHJldmlldyB3aGVuIHRvZ2dsZSBpcyB0cmlnZ2VyZWQgYSBzZWNvbmQgdGltZSBvbiB0aGUgZWRpdG9yIGFuZCB3aGVuIHRoZSBwcmV2aWV3IGlzIGl0cyBwYW5lcyBhY3RpdmUgaXRlbVwiLCAtPlxuICAgICAgYXRvbS5jb21tYW5kcy5kaXNwYXRjaCB3b3Jrc3BhY2VFbGVtZW50LCAnbWFya2Rvd24tcHJldmlldy1wbHVzOnRvZ2dsZSdcblxuICAgICAgW2VkaXRvclBhbmUsIHByZXZpZXdQYW5lXSA9IGF0b20ud29ya3NwYWNlLmdldFBhbmVzKClcbiAgICAgIGV4cGVjdChlZGl0b3JQYW5lLmlzQWN0aXZlKCkpLnRvQmUgdHJ1ZVxuICAgICAgZXhwZWN0KHByZXZpZXdQYW5lLmdldEFjdGl2ZUl0ZW0oKSkudG9CZVVuZGVmaW5lZCgpXG5cbiAgICBpdCBcImFjdGl2YXRlcyB0aGUgZXhpc3RpbmcgcHJldmlldyB3aGVuIHRvZ2dsZSBpcyB0cmlnZ2VyZWQgYSBzZWNvbmQgdGltZSBvbiB0aGUgZWRpdG9yIGFuZCB3aGVuIHRoZSBwcmV2aWV3IGlzIG5vdCBpdHMgcGFuZXMgYWN0aXZlIGl0ZW0gI25vdHRyYXZpc1wiLCAtPlxuICAgICAgW2VkaXRvclBhbmUsIHByZXZpZXdQYW5lXSA9IGF0b20ud29ya3NwYWNlLmdldFBhbmVzKClcblxuICAgICAgZWRpdG9yUGFuZS5hY3RpdmF0ZSgpXG4gICAgICB3YWl0c0ZvclByb21pc2UgLT4gYXRvbS53b3Jrc3BhY2Uub3BlbihcInN1YmRpci9zaW1wbGUubWRcIilcbiAgICAgIHJ1bnMgLT4gYXRvbS5jb21tYW5kcy5kaXNwYXRjaCB3b3Jrc3BhY2VFbGVtZW50LCAnbWFya2Rvd24tcHJldmlldy1wbHVzOnRvZ2dsZSdcblxuICAgICAgd2FpdHNGb3IgXCJzZWNvbmQgbWFya2Rvd24gcHJldmlldyB0byBiZSBjcmVhdGVkXCIsIC0+XG4gICAgICAgIHByZXZpZXdQYW5lLmdldEl0ZW1zKCkubGVuZ3RoIGlzIDJcblxuICAgICAgd2FpdHNGb3IgXCJzZWNvbmQgbWFya2Rvd24gcHJldmlldyB0byBiZSBhY3RpdmF0ZWRcIiwgLT5cbiAgICAgICAgcHJldmlld1BhbmUuZ2V0QWN0aXZlSXRlbUluZGV4KCkgaXMgMVxuXG4gICAgICBydW5zIC0+XG4gICAgICAgIHByZXZpZXcgPSBwcmV2aWV3UGFuZS5nZXRBY3RpdmVJdGVtKClcbiAgICAgICAgZXhwZWN0KHByZXZpZXcpLnRvQmVJbnN0YW5jZU9mKE1hcmtkb3duUHJldmlld1ZpZXcpXG4gICAgICAgIGV4cGVjdChwcmV2aWV3LmdldFBhdGgoKSkudG9CZSBlZGl0b3JQYW5lLmdldEFjdGl2ZUl0ZW0oKS5nZXRQYXRoKClcbiAgICAgICAgZXhwZWN0KHByZXZpZXcuZ2V0UGF0aCgpKS50b0JlIGF0b20ud29ya3NwYWNlLmdldEFjdGl2ZVBhbmVJdGVtKCkuZ2V0UGF0aCgpXG5cbiAgICAgICAgZWRpdG9yUGFuZS5hY3RpdmF0ZSgpXG4gICAgICAgIGVkaXRvclBhbmUuYWN0aXZhdGVJdGVtQXRJbmRleCgwKVxuXG4gICAgICAgIGF0b20uY29tbWFuZHMuZGlzcGF0Y2ggd29ya3NwYWNlRWxlbWVudCwgJ21hcmtkb3duLXByZXZpZXctcGx1czp0b2dnbGUnXG5cbiAgICAgIHdhaXRzRm9yIFwiZmlyc3QgcHJldmlldyB0byBiZSBhY3RpdmF0ZWRcIiwgLT5cbiAgICAgICAgcHJldmlld1BhbmUuZ2V0QWN0aXZlSXRlbUluZGV4KCkgaXMgMFxuXG4gICAgICBydW5zIC0+XG4gICAgICAgIHByZXZpZXcgPSBwcmV2aWV3UGFuZS5nZXRBY3RpdmVJdGVtKClcbiAgICAgICAgZXhwZWN0KHByZXZpZXdQYW5lLmdldEl0ZW1zKCkubGVuZ3RoKS50b0JlKDIpXG4gICAgICAgIGV4cGVjdChwcmV2aWV3LmdldFBhdGgoKSkudG9CZSBlZGl0b3JQYW5lLmdldEFjdGl2ZUl0ZW0oKS5nZXRQYXRoKClcbiAgICAgICAgZXhwZWN0KHByZXZpZXcuZ2V0UGF0aCgpKS50b0JlIGF0b20ud29ya3NwYWNlLmdldEFjdGl2ZVBhbmVJdGVtKCkuZ2V0UGF0aCgpXG5cbiAgICBpdCBcImNsb3NlcyB0aGUgZXhpc3RpbmcgcHJldmlldyB3aGVuIHRvZ2dsZSBpcyB0cmlnZ2VyZWQgb24gaXQgYW5kIGl0IGhhcyBmb2N1c1wiLCAtPlxuICAgICAgW2VkaXRvclBhbmUsIHByZXZpZXdQYW5lXSA9IGF0b20ud29ya3NwYWNlLmdldFBhbmVzKClcbiAgICAgIHByZXZpZXdQYW5lLmFjdGl2YXRlKClcblxuICAgICAgYXRvbS5jb21tYW5kcy5kaXNwYXRjaCB3b3Jrc3BhY2VFbGVtZW50LCAnbWFya2Rvd24tcHJldmlldy1wbHVzOnRvZ2dsZSdcbiAgICAgIGV4cGVjdChwcmV2aWV3UGFuZS5nZXRBY3RpdmVJdGVtKCkpLnRvQmVVbmRlZmluZWQoKVxuXG4gICAgZGVzY3JpYmUgXCJ3aGVuIHRoZSBlZGl0b3IgaXMgbW9kaWZpZWRcIiwgLT5cbiAgICAgIGl0IFwicmUtcmVuZGVycyB0aGUgcHJldmlld1wiLCAtPlxuICAgICAgICBzcHlPbihwcmV2aWV3LCAnc2hvd0xvYWRpbmcnKVxuXG4gICAgICAgIG1hcmtkb3duRWRpdG9yID0gYXRvbS53b3Jrc3BhY2UuZ2V0QWN0aXZlVGV4dEVkaXRvcigpXG4gICAgICAgIG1hcmtkb3duRWRpdG9yLnNldFRleHQgXCJIZXkhXCJcblxuICAgICAgICB3YWl0c0ZvciAtPlxuICAgICAgICAgIHByZXZpZXcudGV4dCgpLmluZGV4T2YoXCJIZXkhXCIpID49IDBcblxuICAgICAgICBydW5zIC0+XG4gICAgICAgICAgZXhwZWN0KHByZXZpZXcuc2hvd0xvYWRpbmcpLm5vdC50b0hhdmVCZWVuQ2FsbGVkKClcblxuICAgICAgaXQgXCJpbnZva2VzIDo6b25EaWRDaGFuZ2VNYXJrZG93biBsaXN0ZW5lcnNcIiwgLT5cbiAgICAgICAgbWFya2Rvd25FZGl0b3IgPSBhdG9tLndvcmtzcGFjZS5nZXRBY3RpdmVUZXh0RWRpdG9yKClcbiAgICAgICAgcHJldmlldy5vbkRpZENoYW5nZU1hcmtkb3duKGxpc3RlbmVyID0gamFzbWluZS5jcmVhdGVTcHkoJ2RpZENoYW5nZU1hcmtkb3duTGlzdGVuZXInKSlcblxuICAgICAgICBydW5zIC0+XG4gICAgICAgICAgbWFya2Rvd25FZGl0b3Iuc2V0VGV4dChcIkhleSFcIilcblxuICAgICAgICB3YWl0c0ZvciBcIjo6b25EaWRDaGFuZ2VNYXJrZG93biBoYW5kbGVyIHRvIGJlIGNhbGxlZFwiLCAtPlxuICAgICAgICAgIGxpc3RlbmVyLmNhbGxDb3VudCA+IDBcblxuICAgICAgZGVzY3JpYmUgXCJ3aGVuIHRoZSBwcmV2aWV3IGlzIGluIHRoZSBhY3RpdmUgcGFuZSBidXQgaXMgbm90IHRoZSBhY3RpdmUgaXRlbVwiLCAtPlxuICAgICAgICBpdCBcInJlLXJlbmRlcnMgdGhlIHByZXZpZXcgYnV0IGRvZXMgbm90IG1ha2UgaXQgYWN0aXZlXCIsIC0+XG4gICAgICAgICAgbWFya2Rvd25FZGl0b3IgPSBhdG9tLndvcmtzcGFjZS5nZXRBY3RpdmVUZXh0RWRpdG9yKClcbiAgICAgICAgICBwcmV2aWV3UGFuZSA9IGF0b20ud29ya3NwYWNlLmdldFBhbmVzKClbMV1cbiAgICAgICAgICBwcmV2aWV3UGFuZS5hY3RpdmF0ZSgpXG5cbiAgICAgICAgICB3YWl0c0ZvclByb21pc2UgLT5cbiAgICAgICAgICAgIGF0b20ud29ya3NwYWNlLm9wZW4oKVxuXG4gICAgICAgICAgcnVucyAtPlxuICAgICAgICAgICAgbWFya2Rvd25FZGl0b3Iuc2V0VGV4dChcIkhleSFcIilcblxuICAgICAgICAgIHdhaXRzRm9yIC0+XG4gICAgICAgICAgICBwcmV2aWV3LnRleHQoKS5pbmRleE9mKFwiSGV5IVwiKSA+PSAwXG5cbiAgICAgICAgICBydW5zIC0+XG4gICAgICAgICAgICBleHBlY3QocHJldmlld1BhbmUuaXNBY3RpdmUoKSkudG9CZSB0cnVlXG4gICAgICAgICAgICBleHBlY3QocHJldmlld1BhbmUuZ2V0QWN0aXZlSXRlbSgpKS5ub3QudG9CZSBwcmV2aWV3XG5cbiAgICAgIGRlc2NyaWJlIFwid2hlbiB0aGUgcHJldmlldyBpcyBub3QgdGhlIGFjdGl2ZSBpdGVtIGFuZCBub3QgaW4gdGhlIGFjdGl2ZSBwYW5lXCIsIC0+XG4gICAgICAgIGl0IFwicmUtcmVuZGVycyB0aGUgcHJldmlldyBhbmQgbWFrZXMgaXQgYWN0aXZlXCIsIC0+XG4gICAgICAgICAgbWFya2Rvd25FZGl0b3IgPSBhdG9tLndvcmtzcGFjZS5nZXRBY3RpdmVUZXh0RWRpdG9yKClcbiAgICAgICAgICBbZWRpdG9yUGFuZSwgcHJldmlld1BhbmVdID0gYXRvbS53b3Jrc3BhY2UuZ2V0UGFuZXMoKVxuICAgICAgICAgIHByZXZpZXdQYW5lLnNwbGl0UmlnaHQoY29weUFjdGl2ZUl0ZW06IHRydWUpXG4gICAgICAgICAgcHJldmlld1BhbmUuYWN0aXZhdGUoKVxuXG4gICAgICAgICAgd2FpdHNGb3JQcm9taXNlIC0+XG4gICAgICAgICAgICBhdG9tLndvcmtzcGFjZS5vcGVuKClcblxuICAgICAgICAgIHJ1bnMgLT5cbiAgICAgICAgICAgIGVkaXRvclBhbmUuYWN0aXZhdGUoKVxuICAgICAgICAgICAgbWFya2Rvd25FZGl0b3Iuc2V0VGV4dChcIkhleSFcIilcblxuICAgICAgICAgIHdhaXRzRm9yIC0+XG4gICAgICAgICAgICBwcmV2aWV3LnRleHQoKS5pbmRleE9mKFwiSGV5IVwiKSA+PSAwXG5cbiAgICAgICAgICBydW5zIC0+XG4gICAgICAgICAgICBleHBlY3QoZWRpdG9yUGFuZS5pc0FjdGl2ZSgpKS50b0JlIHRydWVcbiAgICAgICAgICAgIGV4cGVjdChwcmV2aWV3UGFuZS5nZXRBY3RpdmVJdGVtKCkpLnRvQmUgcHJldmlld1xuXG4gICAgICBkZXNjcmliZSBcIndoZW4gdGhlIGxpdmVVcGRhdGUgY29uZmlnIGlzIHNldCB0byBmYWxzZVwiLCAtPlxuICAgICAgICBpdCBcIm9ubHkgcmUtcmVuZGVycyB0aGUgbWFya2Rvd24gd2hlbiB0aGUgZWRpdG9yIGlzIHNhdmVkLCBub3Qgd2hlbiB0aGUgY29udGVudHMgYXJlIG1vZGlmaWVkXCIsIC0+XG4gICAgICAgICAgYXRvbS5jb25maWcuc2V0ICdtYXJrZG93bi1wcmV2aWV3LXBsdXMubGl2ZVVwZGF0ZScsIGZhbHNlXG5cbiAgICAgICAgICBkaWRTdG9wQ2hhbmdpbmdIYW5kbGVyID0gamFzbWluZS5jcmVhdGVTcHkoJ2RpZFN0b3BDaGFuZ2luZ0hhbmRsZXInKVxuICAgICAgICAgIGF0b20ud29ya3NwYWNlLmdldEFjdGl2ZVRleHRFZGl0b3IoKS5nZXRCdWZmZXIoKS5vbkRpZFN0b3BDaGFuZ2luZyBkaWRTdG9wQ2hhbmdpbmdIYW5kbGVyXG4gICAgICAgICAgYXRvbS53b3Jrc3BhY2UuZ2V0QWN0aXZlVGV4dEVkaXRvcigpLnNldFRleHQoJ2NoIGNoIGNoYW5nZXMnKVxuXG4gICAgICAgICAgd2FpdHNGb3IgLT5cbiAgICAgICAgICAgIGRpZFN0b3BDaGFuZ2luZ0hhbmRsZXIuY2FsbENvdW50ID4gMFxuXG4gICAgICAgICAgcnVucyAtPlxuICAgICAgICAgICAgZXhwZWN0KHByZXZpZXcudGV4dCgpKS5ub3QudG9Db250YWluKFwiY2ggY2ggY2hhbmdlc1wiKVxuICAgICAgICAgICAgYXRvbS53b3Jrc3BhY2UuZ2V0QWN0aXZlVGV4dEVkaXRvcigpLnNhdmUoKVxuXG4gICAgICAgICAgd2FpdHNGb3IgLT5cbiAgICAgICAgICAgIHByZXZpZXcudGV4dCgpLmluZGV4T2YoXCJjaCBjaCBjaGFuZ2VzXCIpID49IDBcblxuICAgIGRlc2NyaWJlIFwid2hlbiBhIG5ldyBncmFtbWFyIGlzIGxvYWRlZFwiLCAtPlxuICAgICAgaXQgXCJyZS1yZW5kZXJzIHRoZSBwcmV2aWV3XCIsIC0+XG4gICAgICAgIGF0b20ud29ya3NwYWNlLmdldEFjdGl2ZVRleHRFZGl0b3IoKS5zZXRUZXh0IFwiXCJcIlxuICAgICAgICAgIGBgYGphdmFzY3JpcHRcbiAgICAgICAgICB2YXIgeCA9IHk7XG4gICAgICAgICAgYGBgXG4gICAgICAgIFwiXCJcIlxuXG4gICAgICAgIHdhaXRzRm9yIFwibWFya2Rvd24gdG8gYmUgcmVuZGVyZWQgYWZ0ZXIgaXRzIHRleHQgY2hhbmdlZFwiLCAtPlxuICAgICAgICAgIHByZXZpZXcuZmluZChcImF0b20tdGV4dC1lZGl0b3JcIikuZGF0YShcImdyYW1tYXJcIikgaXMgXCJ0ZXh0IHBsYWluIG51bGwtZ3JhbW1hclwiXG5cbiAgICAgICAgZ3JhbW1hckFkZGVkID0gZmFsc2VcbiAgICAgICAgcnVucyAtPlxuICAgICAgICAgIGF0b20uZ3JhbW1hcnMub25EaWRBZGRHcmFtbWFyIC0+IGdyYW1tYXJBZGRlZCA9IHRydWVcblxuICAgICAgICB3YWl0c0ZvclByb21pc2UgLT5cbiAgICAgICAgICBleHBlY3QoYXRvbS5wYWNrYWdlcy5pc1BhY2thZ2VBY3RpdmUoJ2xhbmd1YWdlLWphdmFzY3JpcHQnKSkudG9CZSBmYWxzZVxuICAgICAgICAgIGF0b20ucGFja2FnZXMuYWN0aXZhdGVQYWNrYWdlKCdsYW5ndWFnZS1qYXZhc2NyaXB0JylcblxuICAgICAgICB3YWl0c0ZvciBcImdyYW1tYXIgdG8gYmUgYWRkZWRcIiwgLT4gZ3JhbW1hckFkZGVkXG5cbiAgICAgICAgd2FpdHNGb3IgXCJtYXJrZG93biB0byBiZSByZW5kZXJlZCBhZnRlciBncmFtbWFyIHdhcyBhZGRlZFwiLCAtPlxuICAgICAgICAgIHByZXZpZXcuZmluZChcImF0b20tdGV4dC1lZGl0b3JcIikuZGF0YShcImdyYW1tYXJcIikgaXNudCBcInNvdXJjZSBqc1wiXG5cbiAgZGVzY3JpYmUgXCJ3aGVuIHRoZSBtYXJrZG93biBwcmV2aWV3IHZpZXcgaXMgcmVxdWVzdGVkIGJ5IGZpbGUgVVJJXCIsIC0+XG4gICAgaXQgXCJvcGVucyBhIHByZXZpZXcgZWRpdG9yIGFuZCB3YXRjaGVzIHRoZSBmaWxlIGZvciBjaGFuZ2VzXCIsIC0+XG4gICAgICB3YWl0c0ZvclByb21pc2UgXCJhdG9tLndvcmtzcGFjZS5vcGVuIHByb21pc2UgdG8gYmUgcmVzb2x2ZWRcIiwgLT5cbiAgICAgICAgYXRvbS53b3Jrc3BhY2Uub3BlbihcIm1hcmtkb3duLXByZXZpZXctcGx1czovLyN7YXRvbS5wcm9qZWN0LmdldERpcmVjdG9yaWVzKClbMF0ucmVzb2x2ZSgnc3ViZGlyL2ZpbGUubWFya2Rvd24nKX1cIilcblxuICAgICAgcnVucyAtPlxuICAgICAgICBwcmV2aWV3ID0gYXRvbS53b3Jrc3BhY2UuZ2V0QWN0aXZlUGFuZUl0ZW0oKVxuICAgICAgICBleHBlY3QocHJldmlldykudG9CZUluc3RhbmNlT2YoTWFya2Rvd25QcmV2aWV3VmlldylcblxuICAgICAgICBzcHlPbihwcmV2aWV3LCAncmVuZGVyTWFya2Rvd25UZXh0JylcbiAgICAgICAgcHJldmlldy5maWxlLmVtaXR0ZXIuZW1pdCgnZGlkLWNoYW5nZScpXG5cbiAgICAgIHdhaXRzRm9yIFwibWFya2Rvd24gdG8gYmUgcmUtcmVuZGVyZWQgYWZ0ZXIgZmlsZSBjaGFuZ2VkXCIsIC0+XG4gICAgICAgIHByZXZpZXcucmVuZGVyTWFya2Rvd25UZXh0LmNhbGxDb3VudCA+IDBcblxuICBkZXNjcmliZSBcIndoZW4gdGhlIGVkaXRvcidzIGdyYW1tYXIgaXQgbm90IGVuYWJsZWQgZm9yIHByZXZpZXdcIiwgLT5cbiAgICBpdCBcImRvZXMgbm90IG9wZW4gdGhlIG1hcmtkb3duIHByZXZpZXdcIiwgLT5cbiAgICAgIGF0b20uY29uZmlnLnNldCgnbWFya2Rvd24tcHJldmlldy1wbHVzLmdyYW1tYXJzJywgW10pXG5cbiAgICAgIHdhaXRzRm9yUHJvbWlzZSAtPlxuICAgICAgICBhdG9tLndvcmtzcGFjZS5vcGVuKFwic3ViZGlyL2ZpbGUubWFya2Rvd25cIilcblxuICAgICAgcnVucyAtPlxuICAgICAgICBzcHlPbihhdG9tLndvcmtzcGFjZSwgJ29wZW4nKS5hbmRDYWxsVGhyb3VnaCgpXG4gICAgICAgIGF0b20uY29tbWFuZHMuZGlzcGF0Y2ggd29ya3NwYWNlRWxlbWVudCwgJ21hcmtkb3duLXByZXZpZXctcGx1czp0b2dnbGUnXG4gICAgICAgIGV4cGVjdChhdG9tLndvcmtzcGFjZS5vcGVuKS5ub3QudG9IYXZlQmVlbkNhbGxlZCgpXG5cbiAgZGVzY3JpYmUgXCJ3aGVuIHRoZSBlZGl0b3IncyBwYXRoIGNoYW5nZXMgb24gI3dpbjMyIGFuZCAjZGFyd2luXCIsIC0+XG4gICAgaXQgXCJ1cGRhdGVzIHRoZSBwcmV2aWV3J3MgdGl0bGVcIiwgLT5cbiAgICAgIHRpdGxlQ2hhbmdlZENhbGxiYWNrID0gamFzbWluZS5jcmVhdGVTcHkoJ3RpdGxlQ2hhbmdlZENhbGxiYWNrJylcblxuICAgICAgd2FpdHNGb3JQcm9taXNlIC0+IGF0b20ud29ya3NwYWNlLm9wZW4oXCJzdWJkaXIvZmlsZS5tYXJrZG93blwiKVxuICAgICAgcnVucyAtPiBhdG9tLmNvbW1hbmRzLmRpc3BhdGNoIHdvcmtzcGFjZUVsZW1lbnQsICdtYXJrZG93bi1wcmV2aWV3LXBsdXM6dG9nZ2xlJ1xuXG4gICAgICBleHBlY3RQcmV2aWV3SW5TcGxpdFBhbmUoKVxuXG4gICAgICBydW5zIC0+XG4gICAgICAgIGV4cGVjdChwcmV2aWV3LmdldFRpdGxlKCkpLnRvQmUgJ2ZpbGUubWFya2Rvd24gUHJldmlldydcbiAgICAgICAgcHJldmlldy5vbkRpZENoYW5nZVRpdGxlKHRpdGxlQ2hhbmdlZENhbGxiYWNrKVxuICAgICAgICBmaWxlUGF0aCA9IGF0b20ud29ya3NwYWNlLmdldEFjdGl2ZVRleHRFZGl0b3IoKS5nZXRQYXRoKClcbiAgICAgICAgZnMucmVuYW1lU3luYyhmaWxlUGF0aCwgcGF0aC5qb2luKHBhdGguZGlybmFtZShmaWxlUGF0aCksICdmaWxlMi5tZCcpKVxuXG4gICAgICB3YWl0c0ZvciAtPlxuICAgICAgICBwcmV2aWV3LmdldFRpdGxlKCkgaXMgXCJmaWxlMi5tZCBQcmV2aWV3XCJcblxuICAgICAgcnVucyAtPlxuICAgICAgICBleHBlY3QodGl0bGVDaGFuZ2VkQ2FsbGJhY2spLnRvSGF2ZUJlZW5DYWxsZWQoKVxuICAgICAgICBwcmV2aWV3LmRlc3Ryb3koKVxuXG4gIGRlc2NyaWJlIFwid2hlbiB0aGUgVVJJIG9wZW5lZCBkb2VzIG5vdCBoYXZlIGEgbWFya2Rvd24tcHJldmlldy1wbHVzIHByb3RvY29sXCIsIC0+XG4gICAgaXQgXCJkb2VzIG5vdCB0aHJvdyBhbiBlcnJvciB0cnlpbmcgdG8gZGVjb2RlIHRoZSBVUkkgKHJlZ3Jlc3Npb24pXCIsIC0+XG4gICAgICB3YWl0c0ZvclByb21pc2UgLT5cbiAgICAgICAgYXRvbS53b3Jrc3BhY2Uub3BlbignJScpXG5cbiAgICAgIHJ1bnMgLT5cbiAgICAgICAgZXhwZWN0KGF0b20ud29ya3NwYWNlLmdldEFjdGl2ZVRleHRFZGl0b3IoKSkudG9CZVRydXRoeSgpXG5cbiAgZGVzY3JpYmUgXCJ3aGVuIG1hcmtkb3duLXByZXZpZXctcGx1czpjb3B5LWh0bWwgaXMgdHJpZ2dlcmVkXCIsIC0+XG4gICAgaXQgXCJjb3BpZXMgdGhlIEhUTUwgdG8gdGhlIGNsaXBib2FyZFwiLCAtPlxuICAgICAgd2FpdHNGb3JQcm9taXNlIC0+XG4gICAgICAgIGF0b20ud29ya3NwYWNlLm9wZW4oXCJzdWJkaXIvc2ltcGxlLm1kXCIpXG5cbiAgICAgIHJ1bnMgLT5cbiAgICAgICAgYXRvbS5jb21tYW5kcy5kaXNwYXRjaCB3b3Jrc3BhY2VFbGVtZW50LCAnbWFya2Rvd24tcHJldmlldy1wbHVzOmNvcHktaHRtbCdcbiAgICAgICAgZXhwZWN0KGF0b20uY2xpcGJvYXJkLnJlYWQoKSkudG9CZSBcIlwiXCJcbiAgICAgICAgICA8cD48ZW0+aXRhbGljPC9lbT48L3A+XG4gICAgICAgICAgPHA+PHN0cm9uZz5ib2xkPC9zdHJvbmc+PC9wPlxuICAgICAgICAgIDxwPmVuY29kaW5nIFxcdTIxOTIgaXNzdWU8L3A+XG4gICAgICAgIFwiXCJcIlxuXG4gICAgICAgIGF0b20ud29ya3NwYWNlLmdldEFjdGl2ZVRleHRFZGl0b3IoKS5zZXRTZWxlY3RlZEJ1ZmZlclJhbmdlIFtbMCwgMF0sIFsxLCAwXV1cbiAgICAgICAgYXRvbS5jb21tYW5kcy5kaXNwYXRjaCB3b3Jrc3BhY2VFbGVtZW50LCAnbWFya2Rvd24tcHJldmlldy1wbHVzOmNvcHktaHRtbCdcbiAgICAgICAgZXhwZWN0KGF0b20uY2xpcGJvYXJkLnJlYWQoKSkudG9CZSBcIlwiXCJcbiAgICAgICAgICA8cD48ZW0+aXRhbGljPC9lbT48L3A+XG4gICAgICAgIFwiXCJcIlxuXG4gICAgZGVzY3JpYmUgXCJjb2RlIGJsb2NrIHRva2VuaXphdGlvblwiLCAtPlxuICAgICAgcHJldmlldyA9IG51bGxcblxuICAgICAgYmVmb3JlRWFjaCAtPlxuICAgICAgICB3YWl0c0ZvclByb21pc2UgLT5cbiAgICAgICAgICBhdG9tLnBhY2thZ2VzLmFjdGl2YXRlUGFja2FnZSgnbGFuZ3VhZ2UtcnVieScpXG5cbiAgICAgICAgd2FpdHNGb3JQcm9taXNlIC0+XG4gICAgICAgICAgYXRvbS5wYWNrYWdlcy5hY3RpdmF0ZVBhY2thZ2UoJ21hcmtkb3duLXByZXZpZXctcGx1cycpXG5cbiAgICAgICAgd2FpdHNGb3JQcm9taXNlIC0+XG4gICAgICAgICAgYXRvbS53b3Jrc3BhY2Uub3BlbihcInN1YmRpci9maWxlLm1hcmtkb3duXCIpXG5cbiAgICAgICAgcnVucyAtPlxuICAgICAgICAgIHdvcmtzcGFjZUVsZW1lbnQgPSBhdG9tLnZpZXdzLmdldFZpZXcoYXRvbS53b3Jrc3BhY2UpXG4gICAgICAgICAgYXRvbS5jb21tYW5kcy5kaXNwYXRjaCB3b3Jrc3BhY2VFbGVtZW50LCAnbWFya2Rvd24tcHJldmlldy1wbHVzOmNvcHktaHRtbCdcbiAgICAgICAgICBwcmV2aWV3ID0gJCgnPGRpdj4nKS5hcHBlbmQoYXRvbS5jbGlwYm9hcmQucmVhZCgpKVxuXG4gICAgICBkZXNjcmliZSBcIndoZW4gdGhlIGNvZGUgYmxvY2sncyBmZW5jZSBuYW1lIGhhcyBhIG1hdGNoaW5nIGdyYW1tYXJcIiwgLT5cbiAgICAgICAgaXQgXCJ0b2tlbml6ZXMgdGhlIGNvZGUgYmxvY2sgd2l0aCB0aGUgZ3JhbW1hclwiLCAtPlxuICAgICAgICAgIGV4cGVjdChwcmV2aWV3LmZpbmQoXCJwcmUgc3Bhbi5zeW50YXgtLWVudGl0eS5zeW50YXgtLW5hbWUuc3ludGF4LS1mdW5jdGlvbi5zeW50YXgtLXJ1YnlcIikpLnRvRXhpc3QoKVxuXG4gICAgICBkZXNjcmliZSBcIndoZW4gdGhlIGNvZGUgYmxvY2sncyBmZW5jZSBuYW1lIGRvZXNuJ3QgaGF2ZSBhIG1hdGNoaW5nIGdyYW1tYXJcIiwgLT5cbiAgICAgICAgaXQgXCJkb2VzIG5vdCB0b2tlbml6ZSB0aGUgY29kZSBibG9ja1wiLCAtPlxuICAgICAgICAgIGV4cGVjdChwcmV2aWV3LmZpbmQoXCJwcmUubGFuZy1rb21idWNoYSAubGluZSAuc3ludGF4LS1udWxsLWdyYW1tYXJcIikuY2hpbGRyZW4oKS5sZW5ndGgpLnRvQmUgMlxuXG4gICAgICBkZXNjcmliZSBcIndoZW4gdGhlIGNvZGUgYmxvY2sgY29udGFpbnMgZW1wdHkgbGluZXNcIiwgLT5cbiAgICAgICAgaXQgXCJkb2Vzbid0IHJlbW92ZSB0aGUgZW1wdHkgbGluZXNcIiwgLT5cbiAgICAgICAgICBleHBlY3QocHJldmlldy5maW5kKFwicHJlLmxhbmctcHl0aG9uXCIpLmNoaWxkcmVuKCkubGVuZ3RoKS50b0JlIDZcbiAgICAgICAgICBleHBlY3QocHJldmlldy5maW5kKFwicHJlLmxhbmctcHl0aG9uIGRpdjpudGgtY2hpbGQoMilcIikudGV4dCgpLnRyaW0oKSkudG9CZSAnJ1xuICAgICAgICAgIGV4cGVjdChwcmV2aWV3LmZpbmQoXCJwcmUubGFuZy1weXRob24gZGl2Om50aC1jaGlsZCg0KVwiKS50ZXh0KCkudHJpbSgpKS50b0JlICcnXG4gICAgICAgICAgZXhwZWN0KHByZXZpZXcuZmluZChcInByZS5sYW5nLXB5dGhvbiBkaXY6bnRoLWNoaWxkKDUpXCIpLnRleHQoKS50cmltKCkpLnRvQmUgJydcblxuICAgICAgZGVzY3JpYmUgXCJ3aGVuIHRoZSBjb2RlIGJsb2NrIGlzIG5lc3RlZCBpbiBhIGxpc3RcIiwgLT5cbiAgICAgICAgaXQgXCJkZXRlY3RzIGFuZCBzdHlsZXMgdGhlIGJsb2NrXCIsIC0+XG4gICAgICAgICAgZXhwZWN0KHByZXZpZXcuZmluZChcInByZS5sYW5nLWphdmFzY3JpcHRcIikpLnRvSGF2ZUNsYXNzICdlZGl0b3ItY29sb3JzJ1xuXG4gIGRlc2NyaWJlIFwid2hlbiBtYWluOjpjb3B5SHRtbCgpIGlzIGNhbGxlZCBkaXJlY3RseVwiLCAtPlxuICAgIG1wcCA9IG51bGxcblxuICAgIGJlZm9yZUVhY2ggLT5cbiAgICAgIG1wcCA9IGF0b20ucGFja2FnZXMuZ2V0QWN0aXZlUGFja2FnZSgnbWFya2Rvd24tcHJldmlldy1wbHVzJykubWFpbk1vZHVsZVxuXG4gICAgaXQgXCJjb3BpZXMgdGhlIEhUTUwgdG8gdGhlIGNsaXBib2FyZCBieSBkZWZhdWx0XCIsIC0+XG4gICAgICB3YWl0c0ZvclByb21pc2UgLT5cbiAgICAgICAgYXRvbS53b3Jrc3BhY2Uub3BlbihcInN1YmRpci9zaW1wbGUubWRcIilcblxuICAgICAgcnVucyAtPlxuICAgICAgICBtcHAuY29weUh0bWwoKVxuICAgICAgICBleHBlY3QoYXRvbS5jbGlwYm9hcmQucmVhZCgpKS50b0JlIFwiXCJcIlxuICAgICAgICAgIDxwPjxlbT5pdGFsaWM8L2VtPjwvcD5cbiAgICAgICAgICA8cD48c3Ryb25nPmJvbGQ8L3N0cm9uZz48L3A+XG4gICAgICAgICAgPHA+ZW5jb2RpbmcgXFx1MjE5MiBpc3N1ZTwvcD5cbiAgICAgICAgXCJcIlwiXG5cbiAgICAgICAgYXRvbS53b3Jrc3BhY2UuZ2V0QWN0aXZlVGV4dEVkaXRvcigpLnNldFNlbGVjdGVkQnVmZmVyUmFuZ2UgW1swLCAwXSwgWzEsIDBdXVxuICAgICAgICBtcHAuY29weUh0bWwoKVxuICAgICAgICBleHBlY3QoYXRvbS5jbGlwYm9hcmQucmVhZCgpKS50b0JlIFwiXCJcIlxuICAgICAgICAgIDxwPjxlbT5pdGFsaWM8L2VtPjwvcD5cbiAgICAgICAgXCJcIlwiXG5cbiAgICBpdCBcInBhc3NlcyB0aGUgSFRNTCB0byBhIGNhbGxiYWNrIGlmIHN1cHBsaWVkIGFzIHRoZSBmaXJzdCBhcmd1bWVudFwiLCAtPlxuICAgICAgd2FpdHNGb3JQcm9taXNlIC0+XG4gICAgICAgIGF0b20ud29ya3NwYWNlLm9wZW4oXCJzdWJkaXIvc2ltcGxlLm1kXCIpXG5cbiAgICAgIHJ1bnMgLT5cbiAgICAgICAgZXhwZWN0KG1wcC5jb3B5SHRtbCggKGh0bWwpIC0+IGh0bWwgKSkudG9CZSBcIlwiXCJcbiAgICAgICAgICA8cD48ZW0+aXRhbGljPC9lbT48L3A+XG4gICAgICAgICAgPHA+PHN0cm9uZz5ib2xkPC9zdHJvbmc+PC9wPlxuICAgICAgICAgIDxwPmVuY29kaW5nIFxcdTIxOTIgaXNzdWU8L3A+XG4gICAgICAgIFwiXCJcIlxuXG4gICAgICAgIGF0b20ud29ya3NwYWNlLmdldEFjdGl2ZVRleHRFZGl0b3IoKS5zZXRTZWxlY3RlZEJ1ZmZlclJhbmdlIFtbMCwgMF0sIFsxLCAwXV1cbiAgICAgICAgZXhwZWN0KG1wcC5jb3B5SHRtbCggKGh0bWwpIC0+IGh0bWwgKSkudG9CZSBcIlwiXCJcbiAgICAgICAgICA8cD48ZW0+aXRhbGljPC9lbT48L3A+XG4gICAgICAgIFwiXCJcIlxuXG4gICAgZGVzY3JpYmUgXCJ3aGVuIExhVGVYIHJlbmRlcmluZyBpcyBlbmFibGVkIGJ5IGRlZmF1bHRcIiwgLT5cbiAgICAgIGJlZm9yZUVhY2ggLT5cbiAgICAgICAgc3B5T24oYXRvbS5jbGlwYm9hcmQsICd3cml0ZScpLmFuZENhbGxUaHJvdWdoKClcblxuICAgICAgICB3YWl0c0ZvciBcIkxhVGVYIHJlbmRlcmluZyB0byBiZSBlbmFibGVkXCIsIC0+XG4gICAgICAgICAgYXRvbS5jb25maWcuc2V0ICdtYXJrZG93bi1wcmV2aWV3LXBsdXMuZW5hYmxlTGF0ZXhSZW5kZXJpbmdCeURlZmF1bHQnLCB0cnVlXG5cbiAgICAgICAgd2FpdHNGb3JQcm9taXNlIC0+XG4gICAgICAgICAgYXRvbS53b3Jrc3BhY2Uub3BlbihcInN1YmRpci9zaW1wbGUubWRcIilcblxuICAgICAgICBydW5zIC0+XG4gICAgICAgICAgYXRvbS53b3Jrc3BhY2UuZ2V0QWN0aXZlVGV4dEVkaXRvcigpLnNldFRleHQgJyQkXFxcXGludF8zXjQkJCdcblxuICAgICAgaXQgXCJjb3BpZXMgdGhlIEhUTUwgd2l0aCBtYXRocyBibG9ja3MgYXMgc3ZnJ3MgdG8gdGhlIGNsaXBib2FyZCBieSBkZWZhdWx0XCIsIC0+XG4gICAgICAgIG1wcC5jb3B5SHRtbCgpXG5cbiAgICAgICAgd2FpdHNGb3IgXCJhdG9tLmNsaXBib2FyZC53cml0ZSB0byBoYXZlIGJlZW4gY2FsbGVkXCIsIC0+XG4gICAgICAgICAgYXRvbS5jbGlwYm9hcmQud3JpdGUuY2FsbENvdW50IGlzIDFcblxuICAgICAgICBydW5zIC0+XG4gICAgICAgICAgY2xpcGJvYXJkID0gYXRvbS5jbGlwYm9hcmQucmVhZCgpXG4gICAgICAgICAgZXhwZWN0KGNsaXBib2FyZC5tYXRjaCgvTWF0aEpheFxcX1NWR1xcX0hpZGRlbi8pLmxlbmd0aCkudG9CZSgxKVxuICAgICAgICAgIGV4cGVjdChjbGlwYm9hcmQubWF0Y2goL2NsYXNzXFw9XFxcIk1hdGhKYXhcXF9TVkdcXFwiLykubGVuZ3RoKS50b0JlKDEpXG5cbiAgICAgIGl0IFwic2NhbGVzIHRoZSBzdmcncyBpZiB0aGUgc2NhbGVNYXRoIHBhcmFtZXRlciBpcyBwYXNzZWRcIiwgLT5cbiAgICAgICAgbXBwLmNvcHlIdG1sKG51bGwsIDIwMClcblxuICAgICAgICB3YWl0c0ZvciBcImF0b20uY2xpcGJvYXJkLndyaXRlIHRvIGhhdmUgYmVlbiBjYWxsZWRcIiwgLT5cbiAgICAgICAgICBhdG9tLmNsaXBib2FyZC53cml0ZS5jYWxsQ291bnQgaXMgMVxuXG4gICAgICAgIHJ1bnMgLT5cbiAgICAgICAgICBjbGlwYm9hcmQgPSBhdG9tLmNsaXBib2FyZC5yZWFkKClcbiAgICAgICAgICBleHBlY3QoY2xpcGJvYXJkLm1hdGNoKC9mb250XFwtc2l6ZVxcOiAyMDAlLykubGVuZ3RoKS50b0JlKDEpXG5cbiAgICAgIGl0IFwicGFzc2VzIHRoZSBIVE1MIHRvIGEgY2FsbGJhY2sgaWYgc3VwcGxpZWQgYXMgdGhlIGZpcnN0IGFyZ3VtZW50XCIsIC0+XG4gICAgICAgIGh0bWwgPSBudWxsXG4gICAgICAgIG1wcC5jb3B5SHRtbCAocHJvSFRNTCkgLT5cbiAgICAgICAgICBodG1sID0gcHJvSFRNTFxuXG4gICAgICAgIHdhaXRzRm9yIFwibWFya2Rvd24gdG8gYmUgcGFyc2VkIGFuZCBwcm9jZXNzZWQgYnkgTWF0aEpheFwiLCAtPiBodG1sP1xuXG4gICAgICAgIHJ1bnMgLT5cbiAgICAgICAgICBleHBlY3QoaHRtbC5tYXRjaCgvTWF0aEpheFxcX1NWR1xcX0hpZGRlbi8pLmxlbmd0aCkudG9CZSgxKVxuICAgICAgICAgIGV4cGVjdChodG1sLm1hdGNoKC9jbGFzc1xcPVxcXCJNYXRoSmF4XFxfU1ZHXFxcIi8pLmxlbmd0aCkudG9CZSgxKVxuXG4gIGRlc2NyaWJlIFwic2FuaXRpemF0aW9uXCIsIC0+XG4gICAgaXQgXCJyZW1vdmVzIHNjcmlwdCB0YWdzIGFuZCBhdHRyaWJ1dGVzIHRoYXQgY29tbW9ubHkgY29udGFpbiBpbmxpbmUgc2NyaXB0c1wiLCAtPlxuICAgICAgd2FpdHNGb3JQcm9taXNlIC0+IGF0b20ud29ya3NwYWNlLm9wZW4oXCJzdWJkaXIvZXZpbC5tZFwiKVxuICAgICAgcnVucyAtPiBhdG9tLmNvbW1hbmRzLmRpc3BhdGNoIHdvcmtzcGFjZUVsZW1lbnQsICdtYXJrZG93bi1wcmV2aWV3LXBsdXM6dG9nZ2xlJ1xuICAgICAgZXhwZWN0UHJldmlld0luU3BsaXRQYW5lKClcblxuICAgICAgcnVucyAtPlxuICAgICAgICBleHBlY3QoJChwcmV2aWV3WzBdKS5maW5kKFwiZGl2LnVwZGF0ZS1wcmV2aWV3XCIpLmh0bWwoKSkudG9CZSBcIlwiXCJcbiAgICAgICAgICA8cD5oZWxsbzwvcD5cblxuXG4gICAgICAgICAgPHA+c2FkXG4gICAgICAgICAgPGltZz5cbiAgICAgICAgICB3b3JsZDwvcD5cbiAgICAgICAgXCJcIlwiXG5cbiAgICBpdCBcInJlbW92ZSB0aGUgZmlyc3QgPCFkb2N0eXBlPiB0YWcgYXQgdGhlIGJlZ2lubmluZyBvZiB0aGUgZmlsZVwiLCAtPlxuICAgICAgd2FpdHNGb3JQcm9taXNlIC0+IGF0b20ud29ya3NwYWNlLm9wZW4oXCJzdWJkaXIvZG9jdHlwZS10YWcubWRcIilcbiAgICAgIHJ1bnMgLT4gYXRvbS5jb21tYW5kcy5kaXNwYXRjaCB3b3Jrc3BhY2VFbGVtZW50LCAnbWFya2Rvd24tcHJldmlldy1wbHVzOnRvZ2dsZSdcbiAgICAgIGV4cGVjdFByZXZpZXdJblNwbGl0UGFuZSgpXG5cbiAgICAgIHJ1bnMgLT5cbiAgICAgICAgZXhwZWN0KCQocHJldmlld1swXSkuZmluZChcImRpdi51cGRhdGUtcHJldmlld1wiKS5odG1sKCkpLnRvQmUgXCJcIlwiXG4gICAgICAgICAgPHA+Y29udGVudFxuICAgICAgICAgICZsdDshZG9jdHlwZSBodG1sJmd0OzwvcD5cbiAgICAgICAgXCJcIlwiXG5cbiAgZGVzY3JpYmUgXCJ3aGVuIHRoZSBtYXJrZG93biBjb250YWlucyBhbiA8aHRtbD4gdGFnXCIsIC0+XG4gICAgaXQgXCJkb2VzIG5vdCB0aHJvdyBhbiBleGNlcHRpb25cIiwgLT5cbiAgICAgIHdhaXRzRm9yUHJvbWlzZSAtPiBhdG9tLndvcmtzcGFjZS5vcGVuKFwic3ViZGlyL2h0bWwtdGFnLm1kXCIpXG4gICAgICBydW5zIC0+IGF0b20uY29tbWFuZHMuZGlzcGF0Y2ggd29ya3NwYWNlRWxlbWVudCwgJ21hcmtkb3duLXByZXZpZXctcGx1czp0b2dnbGUnXG4gICAgICBleHBlY3RQcmV2aWV3SW5TcGxpdFBhbmUoKVxuXG4gICAgICBydW5zIC0+IGV4cGVjdCgkKHByZXZpZXdbMF0pLmZpbmQoXCJkaXYudXBkYXRlLXByZXZpZXdcIikuaHRtbCgpKS50b0JlIFwiY29udGVudFwiXG5cbiAgZGVzY3JpYmUgXCJ3aGVuIHRoZSBtYXJrZG93biBjb250YWlucyBhIDxwcmU+IHRhZ1wiLCAtPlxuICAgIGl0IFwiZG9lcyBub3QgdGhyb3cgYW4gZXhjZXB0aW9uXCIsIC0+XG4gICAgICB3YWl0c0ZvclByb21pc2UgLT4gYXRvbS53b3Jrc3BhY2Uub3BlbihcInN1YmRpci9wcmUtdGFnLm1kXCIpXG4gICAgICBydW5zIC0+IGF0b20uY29tbWFuZHMuZGlzcGF0Y2ggd29ya3NwYWNlRWxlbWVudCwgJ21hcmtkb3duLXByZXZpZXctcGx1czp0b2dnbGUnXG4gICAgICBleHBlY3RQcmV2aWV3SW5TcGxpdFBhbmUoKVxuXG4gICAgICBydW5zIC0+IGV4cGVjdChwcmV2aWV3LmZpbmQoJ2F0b20tdGV4dC1lZGl0b3InKSkudG9FeGlzdCgpXG5cbiAgIyBXQVJOSU5HIElmIGZvY3VzIGlzIGdpdmVuIHRvIHRoaXMgc3BlYyBhbG9uZSB5b3VyIGBjb25maWcuY3NvbmAgbWF5IGJlXG4gICMgb3ZlcndyaXR0ZW4uIFBsZWFzZSBlbnN1cmUgdGhhdCB5b3UgaGF2ZSB5b3VycyBiYWNrZWQgdXAgOkRcbiAgZGVzY3JpYmUgXCJHaXRIdWIgc3R5bGUgbWFya2Rvd24gcHJldmlld1wiLCAtPlxuICAgIGJlZm9yZUVhY2ggLT5cbiAgICAgIGF0b20uY29uZmlnLnNldCAnbWFya2Rvd24tcHJldmlldy1wbHVzLnVzZUdpdEh1YlN0eWxlJywgZmFsc2VcblxuICAgIGl0IFwicmVuZGVycyBtYXJrZG93biB1c2luZyB0aGUgZGVmYXVsdCBzdHlsZSB3aGVuIEdpdEh1YiBzdHlsaW5nIGlzIGRpc2FibGVkXCIsIC0+XG4gICAgICB3YWl0c0ZvclByb21pc2UgLT4gYXRvbS53b3Jrc3BhY2Uub3BlbihcInN1YmRpci9zaW1wbGUubWRcIilcbiAgICAgIHJ1bnMgLT4gYXRvbS5jb21tYW5kcy5kaXNwYXRjaCB3b3Jrc3BhY2VFbGVtZW50LCAnbWFya2Rvd24tcHJldmlldy1wbHVzOnRvZ2dsZSdcbiAgICAgIGV4cGVjdFByZXZpZXdJblNwbGl0UGFuZSgpXG5cbiAgICAgIHJ1bnMgLT4gZXhwZWN0KHByZXZpZXcuZWxlbWVudC5nZXRBdHRyaWJ1dGUoJ2RhdGEtdXNlLWdpdGh1Yi1zdHlsZScpKS50b0JlTnVsbCgpXG5cbiAgICBpdCBcInJlbmRlcnMgbWFya2Rvd24gdXNpbmcgdGhlIEdpdEh1YiBzdHlsaW5nIHdoZW4gZW5hYmxlZFwiLCAtPlxuICAgICAgYXRvbS5jb25maWcuc2V0ICdtYXJrZG93bi1wcmV2aWV3LXBsdXMudXNlR2l0SHViU3R5bGUnLCB0cnVlXG5cbiAgICAgIHdhaXRzRm9yUHJvbWlzZSAtPiBhdG9tLndvcmtzcGFjZS5vcGVuKFwic3ViZGlyL3NpbXBsZS5tZFwiKVxuICAgICAgcnVucyAtPiBhdG9tLmNvbW1hbmRzLmRpc3BhdGNoIHdvcmtzcGFjZUVsZW1lbnQsICdtYXJrZG93bi1wcmV2aWV3LXBsdXM6dG9nZ2xlJ1xuICAgICAgZXhwZWN0UHJldmlld0luU3BsaXRQYW5lKClcblxuICAgICAgcnVucyAtPiBleHBlY3QocHJldmlldy5lbGVtZW50LmdldEF0dHJpYnV0ZSgnZGF0YS11c2UtZ2l0aHViLXN0eWxlJykpLnRvQmUgJydcblxuICAgIGl0IFwidXBkYXRlcyB0aGUgcmVuZGVyaW5nIHN0eWxlIGltbWVkaWF0ZWx5IHdoZW4gdGhlIGNvbmZpZ3VyYXRpb24gaXMgY2hhbmdlZFwiLCAtPlxuICAgICAgd2FpdHNGb3JQcm9taXNlIC0+IGF0b20ud29ya3NwYWNlLm9wZW4oXCJzdWJkaXIvc2ltcGxlLm1kXCIpXG4gICAgICBydW5zIC0+IGF0b20uY29tbWFuZHMuZGlzcGF0Y2ggd29ya3NwYWNlRWxlbWVudCwgJ21hcmtkb3duLXByZXZpZXctcGx1czp0b2dnbGUnXG4gICAgICBleHBlY3RQcmV2aWV3SW5TcGxpdFBhbmUoKVxuXG4gICAgICBydW5zIC0+XG4gICAgICAgIGV4cGVjdChwcmV2aWV3LmVsZW1lbnQuZ2V0QXR0cmlidXRlKCdkYXRhLXVzZS1naXRodWItc3R5bGUnKSkudG9CZU51bGwoKVxuXG4gICAgICAgIGF0b20uY29uZmlnLnNldCAnbWFya2Rvd24tcHJldmlldy1wbHVzLnVzZUdpdEh1YlN0eWxlJywgdHJ1ZVxuICAgICAgICBleHBlY3QocHJldmlldy5lbGVtZW50LmdldEF0dHJpYnV0ZSgnZGF0YS11c2UtZ2l0aHViLXN0eWxlJykpLm5vdC50b0JlTnVsbCgpXG5cbiAgICAgICAgYXRvbS5jb25maWcuc2V0ICdtYXJrZG93bi1wcmV2aWV3LXBsdXMudXNlR2l0SHViU3R5bGUnLCBmYWxzZVxuICAgICAgICBleHBlY3QocHJldmlldy5lbGVtZW50LmdldEF0dHJpYnV0ZSgnZGF0YS11c2UtZ2l0aHViLXN0eWxlJykpLnRvQmVOdWxsKClcbiJdfQ==
