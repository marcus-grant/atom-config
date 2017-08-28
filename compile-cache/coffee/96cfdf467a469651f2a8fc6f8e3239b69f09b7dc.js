(function() {
  var $, MarkdownPreviewView, cson, markdownIt, mathjaxHelper, path, temp;

  $ = require('atom-space-pen-views').$;

  path = require('path');

  temp = require('temp').track();

  cson = require('season');

  markdownIt = require('../lib/markdown-it-helper');

  mathjaxHelper = require('../lib/mathjax-helper');

  MarkdownPreviewView = require('../lib/markdown-preview-view');

  describe("Syncronization of source and preview", function() {
    var expectPreviewInSplitPane, fixturesPath, generateSelector, preview, ref, waitsForQueuedMathJax, workspaceElement;
    ref = [], preview = ref[0], workspaceElement = ref[1], fixturesPath = ref[2];
    beforeEach(function() {
      var configDirPath;
      fixturesPath = path.join(__dirname, 'fixtures');
      jasmine.useRealClock();
      workspaceElement = atom.views.getView(atom.workspace);
      jasmine.attachToDOM(workspaceElement);
      configDirPath = temp.mkdirSync('atom-config-dir-');
      spyOn(atom, 'getConfigDirPath').andReturn(configDirPath);
      mathjaxHelper.resetMathJax();
      waitsForPromise(function() {
        return atom.packages.activatePackage("markdown-preview-plus");
      });
      waitsFor("LaTeX rendering to be enabled", function() {
        return atom.config.set('markdown-preview-plus.enableLatexRenderingByDefault', true);
      });
      waitsForPromise(function() {
        return atom.workspace.open(path.join(fixturesPath, 'sync.md'));
      });
      runs(function() {
        spyOn(mathjaxHelper, 'mathProcessor').andCallThrough();
        return atom.commands.dispatch(workspaceElement, 'markdown-preview-plus:toggle');
      });
      expectPreviewInSplitPane();
      waitsFor("mathjaxHelper.mathProcessor to be called", function() {
        return mathjaxHelper.mathProcessor.calls.length;
      });
      waitsFor("MathJax to load", function() {
        return typeof MathJax !== "undefined" && MathJax !== null;
      });
      return waitsForQueuedMathJax();
    });
    afterEach(function() {
      preview.destroy();
      return mathjaxHelper.resetMathJax();
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
    waitsForQueuedMathJax = function() {
      var callback, done;
      done = [][0];
      callback = function() {
        return done = true;
      };
      runs(function() {
        return MathJax.Hub.Queue([callback]);
      });
      return waitsFor("queued MathJax operations to complete", function() {
        return done;
      });
    };
    generateSelector = function(token) {
      var element, j, len, ref1, selector;
      selector = null;
      ref1 = token.path;
      for (j = 0, len = ref1.length; j < len; j++) {
        element = ref1[j];
        if (selector === null) {
          selector = ".update-preview > " + element.tag + ":eq(" + element.index + ")";
        } else {
          selector = selector + " > " + element.tag + ":eq(" + element.index + ")";
        }
      }
      return selector;
    };
    describe("Syncronizing preview with source", function() {
      var ref1, sourceMap, tokens;
      ref1 = [], sourceMap = ref1[0], tokens = ref1[1];
      beforeEach(function() {
        sourceMap = cson.readFileSync(path.join(fixturesPath, 'sync-preview.cson'));
        return tokens = markdownIt.getTokens(preview.editor.getText(), true);
      });
      it("identifies the correct HTMLElement path", function() {
        var elementPath, i, j, len, results, sourceLine;
        results = [];
        for (j = 0, len = sourceMap.length; j < len; j++) {
          sourceLine = sourceMap[j];
          elementPath = preview.getPathToToken(tokens, sourceLine.line);
          results.push((function() {
            var k, ref2, results1;
            results1 = [];
            for (i = k = 0, ref2 = elementPath.length - 1; k <= ref2; i = k += 1) {
              expect(elementPath[i].tag).toBe(sourceLine.path[i].tag);
              results1.push(expect(elementPath[i].index).toBe(sourceLine.path[i].index));
            }
            return results1;
          })());
        }
        return results;
      });
      return it("scrolls to the correct HTMLElement", function() {
        var element, j, len, results, selector, sourceLine, syncElement;
        results = [];
        for (j = 0, len = sourceMap.length; j < len; j++) {
          sourceLine = sourceMap[j];
          selector = generateSelector(sourceLine);
          if (selector != null) {
            element = preview.find(selector)[0];
          } else {
            continue;
          }
          syncElement = preview.syncPreview(preview.editor.getText(), sourceLine.line);
          results.push(expect(element).toBe(syncElement));
        }
        return results;
      });
    });
    return describe("Syncronizing source with preview", function() {
      return it("sets the editors cursor buffer location to the correct line", function() {
        var element, j, len, results, selector, sourceElement, sourceMap, syncLine;
        sourceMap = cson.readFileSync(path.join(fixturesPath, 'sync-source.cson'));
        results = [];
        for (j = 0, len = sourceMap.length; j < len; j++) {
          sourceElement = sourceMap[j];
          selector = generateSelector(sourceElement);
          if (selector != null) {
            element = preview.find(selector)[0];
          } else {
            continue;
          }
          syncLine = preview.syncSource(preview.editor.getText(), element);
          if (syncLine) {
            results.push(expect(syncLine).toBe(sourceElement.line));
          } else {
            results.push(void 0);
          }
        }
        return results;
      });
    });
  });

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL2hvbWUvbWFyY3VzLy5hdG9tL3BhY2thZ2VzL21hcmtkb3duLXByZXZpZXctcGx1cy9zcGVjL3N5bmMtc3BlYy5jb2ZmZWUiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUFBQSxNQUFBOztFQUFDLElBQWUsT0FBQSxDQUFRLHNCQUFSOztFQUNoQixJQUFBLEdBQWdCLE9BQUEsQ0FBUSxNQUFSOztFQUNoQixJQUFBLEdBQWdCLE9BQUEsQ0FBUSxNQUFSLENBQWUsQ0FBQyxLQUFoQixDQUFBOztFQUNoQixJQUFBLEdBQWdCLE9BQUEsQ0FBUSxRQUFSOztFQUNoQixVQUFBLEdBQWdCLE9BQUEsQ0FBUSwyQkFBUjs7RUFDaEIsYUFBQSxHQUFnQixPQUFBLENBQVEsdUJBQVI7O0VBQ2hCLG1CQUFBLEdBQXNCLE9BQUEsQ0FBUSw4QkFBUjs7RUFFdEIsUUFBQSxDQUFTLHNDQUFULEVBQWlELFNBQUE7QUFDL0MsUUFBQTtJQUFBLE1BQTRDLEVBQTVDLEVBQUMsZ0JBQUQsRUFBVSx5QkFBVixFQUE0QjtJQUU1QixVQUFBLENBQVcsU0FBQTtBQUNULFVBQUE7TUFBQSxZQUFBLEdBQWUsSUFBSSxDQUFDLElBQUwsQ0FBVSxTQUFWLEVBQXFCLFVBQXJCO01BR2YsT0FBTyxDQUFDLFlBQVIsQ0FBQTtNQUNBLGdCQUFBLEdBQW1CLElBQUksQ0FBQyxLQUFLLENBQUMsT0FBWCxDQUFtQixJQUFJLENBQUMsU0FBeEI7TUFDbkIsT0FBTyxDQUFDLFdBQVIsQ0FBb0IsZ0JBQXBCO01BR0EsYUFBQSxHQUFnQixJQUFJLENBQUMsU0FBTCxDQUFlLGtCQUFmO01BQ2hCLEtBQUEsQ0FBTSxJQUFOLEVBQVksa0JBQVosQ0FBK0IsQ0FBQyxTQUFoQyxDQUEwQyxhQUExQztNQUVBLGFBQWEsQ0FBQyxZQUFkLENBQUE7TUFFQSxlQUFBLENBQWdCLFNBQUE7ZUFDZCxJQUFJLENBQUMsUUFBUSxDQUFDLGVBQWQsQ0FBOEIsdUJBQTlC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QyxTQUFBO2FBQzNDLEVBQUEsQ0FBRyw2REFBSCxFQUFrRSxTQUFBO0FBQ2hFLFlBQUE7UUFBQSxTQUFBLEdBQVksSUFBSSxDQUFDLFlBQUwsQ0FBa0IsSUFBSSxDQUFDLElBQUwsQ0FBVSxZQUFWLEVBQXdCLGtCQUF4QixDQUFsQjtBQUVaO2FBQUEsMkNBQUE7O1VBQ0UsUUFBQSxHQUFXLGdCQUFBLENBQWlCLGFBQWpCO1VBQ1gsSUFBRyxnQkFBSDtZQUFrQixPQUFBLEdBQVUsT0FBTyxDQUFDLElBQVIsQ0FBYSxRQUFiLENBQXVCLENBQUEsQ0FBQSxFQUFuRDtXQUFBLE1BQUE7QUFBMkQscUJBQTNEOztVQUNBLFFBQUEsR0FBVyxPQUFPLENBQUMsVUFBUixDQUFtQixPQUFPLENBQUMsTUFBTSxDQUFDLE9BQWYsQ0FBQSxDQUFuQixFQUE2QyxPQUE3QztVQUNYLElBQTZDLFFBQTdDO3lCQUFBLE1BQUEsQ0FBTyxRQUFQLENBQWdCLENBQUMsSUFBakIsQ0FBc0IsYUFBYSxDQUFDLElBQXBDLEdBQUE7V0FBQSxNQUFBO2lDQUFBOztBQUpGOztNQUhnRSxDQUFsRTtJQUQyQyxDQUE3QztFQTNGK0MsQ0FBakQ7QUFSQSIsInNvdXJjZXNDb250ZW50IjpbInskfSAgICAgICAgICAgPSByZXF1aXJlICdhdG9tLXNwYWNlLXBlbi12aWV3cydcbnBhdGggICAgICAgICAgPSByZXF1aXJlICdwYXRoJ1xudGVtcCAgICAgICAgICA9IHJlcXVpcmUoJ3RlbXAnKS50cmFjaygpXG5jc29uICAgICAgICAgID0gcmVxdWlyZSAnc2Vhc29uJ1xubWFya2Rvd25JdCAgICA9IHJlcXVpcmUgJy4uL2xpYi9tYXJrZG93bi1pdC1oZWxwZXInXG5tYXRoamF4SGVscGVyID0gcmVxdWlyZSAnLi4vbGliL21hdGhqYXgtaGVscGVyJ1xuTWFya2Rvd25QcmV2aWV3VmlldyA9IHJlcXVpcmUgJy4uL2xpYi9tYXJrZG93bi1wcmV2aWV3LXZpZXcnXG5cbmRlc2NyaWJlIFwiU3luY3Jvbml6YXRpb24gb2Ygc291cmNlIGFuZCBwcmV2aWV3XCIsIC0+XG4gIFtwcmV2aWV3LCB3b3Jrc3BhY2VFbGVtZW50LCBmaXh0dXJlc1BhdGhdID0gW11cblxuICBiZWZvcmVFYWNoIC0+XG4gICAgZml4dHVyZXNQYXRoID0gcGF0aC5qb2luKF9fZGlybmFtZSwgJ2ZpeHR1cmVzJylcblxuICAgICMgU2V0dXAgSmFzbWluZSBlbnZpcm9ubWVudFxuICAgIGphc21pbmUudXNlUmVhbENsb2NrKCkgIyBNYXRoSmF4IHF1ZXVlJ3Mgd2lsbCBOT1Qgd29yayB3aXRob3V0IHRoaXNcbiAgICB3b3Jrc3BhY2VFbGVtZW50ID0gYXRvbS52aWV3cy5nZXRWaWV3KGF0b20ud29ya3NwYWNlKVxuICAgIGphc21pbmUuYXR0YWNoVG9ET00gd29ya3NwYWNlRWxlbWVudFxuXG4gICAgIyBSZWRpcmVjdCBhdG9tIHRvIGEgdGVtcCBjb25maWcgZGlyZWN0b3J5XG4gICAgY29uZmlnRGlyUGF0aCA9IHRlbXAubWtkaXJTeW5jKCdhdG9tLWNvbmZpZy1kaXItJylcbiAgICBzcHlPbihhdG9tLCAnZ2V0Q29uZmlnRGlyUGF0aCcpLmFuZFJldHVybiBjb25maWdEaXJQYXRoXG5cbiAgICBtYXRoamF4SGVscGVyLnJlc2V0TWF0aEpheCgpXG5cbiAgICB3YWl0c0ZvclByb21pc2UgLT5cbiAgICAgIGF0b20ucGFja2FnZXMuYWN0aXZhdGVQYWNrYWdlKFwibWFya2Rvd24tcHJldmlldy1wbHVzXCIpXG5cbiAgICB3YWl0c0ZvciBcIkxhVGVYIHJlbmRlcmluZyB0byBiZSBlbmFibGVkXCIsIC0+XG4gICAgICBhdG9tLmNvbmZpZy5zZXQgJ21hcmtkb3duLXByZXZpZXctcGx1cy5lbmFibGVMYXRleFJlbmRlcmluZ0J5RGVmYXVsdCcsIHRydWVcblxuICAgIHdhaXRzRm9yUHJvbWlzZSAtPlxuICAgICAgYXRvbS53b3Jrc3BhY2Uub3BlbiBwYXRoLmpvaW4oZml4dHVyZXNQYXRoLCAnc3luYy5tZCcpXG5cbiAgICBydW5zIC0+XG4gICAgICBzcHlPbihtYXRoamF4SGVscGVyLCAnbWF0aFByb2Nlc3NvcicpLmFuZENhbGxUaHJvdWdoKClcbiAgICAgIGF0b20uY29tbWFuZHMuZGlzcGF0Y2ggd29ya3NwYWNlRWxlbWVudCwgJ21hcmtkb3duLXByZXZpZXctcGx1czp0b2dnbGUnXG5cbiAgICBleHBlY3RQcmV2aWV3SW5TcGxpdFBhbmUoKVxuXG4gICAgd2FpdHNGb3IgXCJtYXRoamF4SGVscGVyLm1hdGhQcm9jZXNzb3IgdG8gYmUgY2FsbGVkXCIsIC0+XG4gICAgICBtYXRoamF4SGVscGVyLm1hdGhQcm9jZXNzb3IuY2FsbHMubGVuZ3RoXG5cbiAgICB3YWl0c0ZvciBcIk1hdGhKYXggdG8gbG9hZFwiLCAtPlxuICAgICAgTWF0aEpheD9cblxuICAgIHdhaXRzRm9yUXVldWVkTWF0aEpheCgpXG5cbiAgYWZ0ZXJFYWNoIC0+XG4gICAgcHJldmlldy5kZXN0cm95KClcbiAgICBtYXRoamF4SGVscGVyLnJlc2V0TWF0aEpheCgpXG5cbiAgZXhwZWN0UHJldmlld0luU3BsaXRQYW5lID0gLT5cbiAgICB3YWl0c0ZvciAtPlxuICAgICAgYXRvbS53b3Jrc3BhY2UuZ2V0Q2VudGVyKCkuZ2V0UGFuZXMoKS5sZW5ndGggaXMgMlxuXG4gICAgd2FpdHNGb3IgXCJtYXJrZG93biBwcmV2aWV3IHRvIGJlIGNyZWF0ZWRcIiwgLT5cbiAgICAgIHByZXZpZXcgPSBhdG9tLndvcmtzcGFjZS5nZXRDZW50ZXIoKS5nZXRQYW5lcygpWzFdLmdldEFjdGl2ZUl0ZW0oKVxuXG4gICAgcnVucyAtPlxuICAgICAgZXhwZWN0KHByZXZpZXcpLnRvQmVJbnN0YW5jZU9mKE1hcmtkb3duUHJldmlld1ZpZXcpXG4gICAgICBleHBlY3QocHJldmlldy5nZXRQYXRoKCkpLnRvQmUgYXRvbS53b3Jrc3BhY2UuZ2V0QWN0aXZlUGFuZUl0ZW0oKS5nZXRQYXRoKClcblxuICB3YWl0c0ZvclF1ZXVlZE1hdGhKYXggPSAtPlxuICAgIFtkb25lXSA9IFtdXG5cbiAgICBjYWxsYmFjayA9IC0+IGRvbmUgPSB0cnVlXG4gICAgcnVucyAtPiBNYXRoSmF4Lkh1Yi5RdWV1ZSBbY2FsbGJhY2tdXG4gICAgd2FpdHNGb3IgXCJxdWV1ZWQgTWF0aEpheCBvcGVyYXRpb25zIHRvIGNvbXBsZXRlXCIsIC0+IGRvbmVcblxuICBnZW5lcmF0ZVNlbGVjdG9yID0gKHRva2VuKSAtPlxuICAgIHNlbGVjdG9yID0gbnVsbFxuICAgIGZvciBlbGVtZW50IGluIHRva2VuLnBhdGhcbiAgICAgIGlmIHNlbGVjdG9yIGlzIG51bGxcbiAgICAgIHRoZW4gc2VsZWN0b3IgPSBcIi51cGRhdGUtcHJldmlldyA+ICN7ZWxlbWVudC50YWd9OmVxKCN7ZWxlbWVudC5pbmRleH0pXCJcbiAgICAgIGVsc2Ugc2VsZWN0b3IgPSBcIiN7c2VsZWN0b3J9ID4gI3tlbGVtZW50LnRhZ306ZXEoI3tlbGVtZW50LmluZGV4fSlcIlxuICAgIHJldHVybiBzZWxlY3RvclxuXG4gIGRlc2NyaWJlIFwiU3luY3Jvbml6aW5nIHByZXZpZXcgd2l0aCBzb3VyY2VcIiwgLT5cbiAgICBbc291cmNlTWFwLCB0b2tlbnNdID0gW11cblxuICAgIGJlZm9yZUVhY2ggLT5cbiAgICAgIHNvdXJjZU1hcCA9IGNzb24ucmVhZEZpbGVTeW5jIHBhdGguam9pbihmaXh0dXJlc1BhdGgsICdzeW5jLXByZXZpZXcuY3NvbicpXG4gICAgICB0b2tlbnMgPSBtYXJrZG93bkl0LmdldFRva2VucyBwcmV2aWV3LmVkaXRvci5nZXRUZXh0KCksIHRydWVcblxuICAgIGl0IFwiaWRlbnRpZmllcyB0aGUgY29ycmVjdCBIVE1MRWxlbWVudCBwYXRoXCIsIC0+XG4gICAgICBmb3Igc291cmNlTGluZSBpbiBzb3VyY2VNYXBcbiAgICAgICAgZWxlbWVudFBhdGggPSBwcmV2aWV3LmdldFBhdGhUb1Rva2VuIHRva2Vucywgc291cmNlTGluZS5saW5lXG4gICAgICAgIGZvciBpIGluIFswLi4oZWxlbWVudFBhdGgubGVuZ3RoLTEpXSBieSAxXG4gICAgICAgICAgZXhwZWN0KGVsZW1lbnRQYXRoW2ldLnRhZykudG9CZShzb3VyY2VMaW5lLnBhdGhbaV0udGFnKVxuICAgICAgICAgIGV4cGVjdChlbGVtZW50UGF0aFtpXS5pbmRleCkudG9CZShzb3VyY2VMaW5lLnBhdGhbaV0uaW5kZXgpXG5cbiAgICBpdCBcInNjcm9sbHMgdG8gdGhlIGNvcnJlY3QgSFRNTEVsZW1lbnRcIiwgLT5cbiAgICAgIGZvciBzb3VyY2VMaW5lIGluIHNvdXJjZU1hcFxuICAgICAgICBzZWxlY3RvciA9IGdlbmVyYXRlU2VsZWN0b3Ioc291cmNlTGluZSlcbiAgICAgICAgaWYgc2VsZWN0b3I/IHRoZW4gZWxlbWVudCA9IHByZXZpZXcuZmluZChzZWxlY3RvcilbMF0gZWxzZSBjb250aW51ZVxuICAgICAgICBzeW5jRWxlbWVudCA9IHByZXZpZXcuc3luY1ByZXZpZXcgcHJldmlldy5lZGl0b3IuZ2V0VGV4dCgpLCBzb3VyY2VMaW5lLmxpbmVcbiAgICAgICAgZXhwZWN0KGVsZW1lbnQpLnRvQmUoc3luY0VsZW1lbnQpXG5cbiAgZGVzY3JpYmUgXCJTeW5jcm9uaXppbmcgc291cmNlIHdpdGggcHJldmlld1wiLCAtPlxuICAgIGl0IFwic2V0cyB0aGUgZWRpdG9ycyBjdXJzb3IgYnVmZmVyIGxvY2F0aW9uIHRvIHRoZSBjb3JyZWN0IGxpbmVcIiwgLT5cbiAgICAgIHNvdXJjZU1hcCA9IGNzb24ucmVhZEZpbGVTeW5jIHBhdGguam9pbihmaXh0dXJlc1BhdGgsICdzeW5jLXNvdXJjZS5jc29uJylcblxuICAgICAgZm9yIHNvdXJjZUVsZW1lbnQgaW4gc291cmNlTWFwXG4gICAgICAgIHNlbGVjdG9yID0gZ2VuZXJhdGVTZWxlY3Rvcihzb3VyY2VFbGVtZW50KVxuICAgICAgICBpZiBzZWxlY3Rvcj8gdGhlbiBlbGVtZW50ID0gcHJldmlldy5maW5kKHNlbGVjdG9yKVswXSBlbHNlIGNvbnRpbnVlXG4gICAgICAgIHN5bmNMaW5lID0gcHJldmlldy5zeW5jU291cmNlIHByZXZpZXcuZWRpdG9yLmdldFRleHQoKSwgZWxlbWVudFxuICAgICAgICBleHBlY3Qoc3luY0xpbmUpLnRvQmUoc291cmNlRWxlbWVudC5saW5lKSBpZiBzeW5jTGluZVxuIl19
