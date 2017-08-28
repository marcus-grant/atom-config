(function() {
  var $, bibFile, cslFile, file, fs, pandocHelper, path, temp, tempPath, wrench;

  path = require('path');

  fs = require('fs-plus');

  temp = require('temp');

  wrench = require('wrench');

  $ = require('atom-space-pen-views').$;

  pandocHelper = require('../lib/pandoc-helper.coffee');

  bibFile = 'test.bib';

  cslFile = 'foo.csl';

  tempPath = null;

  file = null;

  require('./spec-helper');

  describe("Markdown preview plus pandoc helper", function() {
    var preview, ref, workspaceElement;
    ref = [], workspaceElement = ref[0], preview = ref[1];
    beforeEach(function() {
      var fixturesPath;
      fixturesPath = path.join(__dirname, 'fixtures');
      tempPath = temp.mkdirSync('atom');
      wrench.copyDirSyncRecursive(fixturesPath, tempPath, {
        forceDelete: true
      });
      atom.project.setPaths([tempPath]);
      jasmine.useRealClock();
      workspaceElement = atom.views.getView(atom.workspace);
      jasmine.attachToDOM(workspaceElement);
      return waitsForPromise(function() {
        return atom.packages.activatePackage("markdown-preview-plus");
      });
    });
    describe("PandocHelper::findFileRecursive", function() {
      var fR;
      fR = pandocHelper.__testing__.findFileRecursive;
      it("should return bibFile in the same directory", function() {
        return runs(function() {
          var bibPath, found;
          bibPath = path.join(tempPath, 'subdir', bibFile);
          fs.writeFileSync(bibPath, '');
          found = fR(path.join(tempPath, 'subdir', 'simple.md'), bibFile);
          return expect(found).toEqual(bibPath);
        });
      });
      it("should return bibFile in a parent directory", function() {
        return runs(function() {
          var bibPath, found;
          bibPath = path.join(tempPath, bibFile);
          fs.writeFileSync(bibPath, '');
          found = fR(path.join(tempPath, 'subdir', 'simple.md'), bibFile);
          return expect(found).toEqual(bibPath);
        });
      });
      return it("shouldn't return bibFile in a out of scope directory", function() {
        return runs(function() {
          var found;
          fs.writeFileSync(path.join(tempPath, '..', bibFile), '');
          found = fR(path.join(tempPath, 'subdir', 'simple.md'), bibFile);
          return expect(found).toEqual(false);
        });
      });
    });
    describe("PandocHelper::getArguments", function() {
      var getArguments;
      getArguments = pandocHelper.__testing__.getArguments;
      it('should work with empty arguments', function() {
        var result;
        atom.config.set('markdown-preview-plus.pandocArguments', []);
        result = getArguments(null);
        return expect(result.length).toEqual(0);
      });
      it('should filter empty arguments', function() {
        var args, result;
        args = {
          foo: 'bar',
          empty: null,
          none: 'lala',
          empty2: false,
          empty3: void 0
        };
        result = getArguments(args);
        expect(result.length).toEqual(2);
        expect(result[0]).toEqual('--foo=bar');
        return expect(result[1]).toEqual('--none=lala');
      });
      it('should load user arguments', function() {
        var args, result;
        atom.config.set('markdown-preview-plus.pandocArguments', ['-v', '--smart', 'rem', '--filter=/foo/bar', '--filter-foo /foo/baz']);
        args = {};
        result = getArguments(args);
        expect(result.length).toEqual(4);
        expect(result[0]).toEqual('-v');
        expect(result[1]).toEqual('--smart');
        expect(result[2]).toEqual('--filter=/foo/bar');
        return expect(result[3]).toEqual('--filter-foo=/foo/baz');
      });
      return it('should combine user arguments and given arguments', function() {
        var args, result;
        atom.config.set('markdown-preview-plus.pandocArguments', ['-v', '--filter-foo /foo/baz']);
        args = {
          foo: 'bar',
          empty3: void 0
        };
        result = getArguments(args);
        expect(result.length).toEqual(3);
        expect(result[0]).toEqual('--foo=bar');
        expect(result[1]).toEqual('-v');
        return expect(result[2]).toEqual('--filter-foo=/foo/baz');
      });
    });
    return describe("PandocHelper::setPandocOptions", function() {
      var fallBackBib, fallBackCsl, setPandocOptions;
      fallBackBib = '/foo/fallback.bib';
      fallBackCsl = '/foo/fallback.csl';
      setPandocOptions = pandocHelper.__testing__.setPandocOptions;
      beforeEach(function() {
        file = path.join(tempPath, 'subdir', 'simple.md');
        atom.config.set('markdown-preview-plus.pandocBibliography', true);
        atom.config.set('markdown-preview-plus.pandocBIBFile', bibFile);
        atom.config.set('markdown-preview-plus.pandocBIBFileFallback', fallBackBib);
        atom.config.set('markdown-preview-plus.pandocCSLFile', cslFile);
        return atom.config.set('markdown-preview-plus.pandocCSLFileFallback', fallBackCsl);
      });
      it("shouldn't set pandoc bib options if citations are disabled", function() {
        return runs(function() {
          var config;
          atom.config.set('markdown-preview-plus.pandocBibliography', false);
          fs.writeFileSync(path.join(tempPath, bibFile), '');
          config = setPandocOptions(file);
          return expect(config.args.bibliography).toEqual(void 0);
        });
      });
      it("shouldn't set pandoc bib options if no fallback file exists", function() {
        return runs(function() {
          var config;
          atom.config.set('markdown-preview-plus.pandocBIBFileFallback');
          config = setPandocOptions(file);
          return expect(config.args.bibliography).toEqual(void 0);
        });
      });
      it("should set pandoc bib options if citations are enabled and project bibFile exists", function() {
        return runs(function() {
          var bibPath, config;
          bibPath = path.join(tempPath, bibFile);
          fs.writeFileSync(bibPath, '');
          config = setPandocOptions(file);
          return expect(config.args.bibliography).toEqual(bibPath);
        });
      });
      it("should set pandoc bib options if citations are enabled and use fallback", function() {
        return runs(function() {
          var config;
          config = setPandocOptions(file);
          return expect(config.args.bibliography).toEqual(fallBackBib);
        });
      });
      it("shouldn't set pandoc csl options if citations are disabled", function() {
        return runs(function() {
          var config;
          atom.config.set('markdown-preview-plus.pandocBibliography', false);
          fs.writeFileSync(path.join(tempPath, cslFile), '');
          config = setPandocOptions(file);
          return expect(config.args.csl).toEqual(void 0);
        });
      });
      it("shouldn't set pandoc csl options if no fallback file exists", function() {
        return runs(function() {
          var config;
          atom.config.set('markdown-preview-plus.pandocCSLFileFallback');
          config = setPandocOptions(file);
          return expect(config.args.csl).toEqual(void 0);
        });
      });
      it("should set pandoc csl options if citations are enabled and project cslFile exists", function() {
        return runs(function() {
          var config, cslPath;
          cslPath = path.join(tempPath, cslFile);
          fs.writeFileSync(cslPath, '');
          config = setPandocOptions(file);
          return expect(config.args.csl).toEqual(cslPath);
        });
      });
      return it("should set pandoc csl options if citations are enabled and use fallback", function() {
        return runs(function() {
          var config;
          config = setPandocOptions(file);
          return expect(config.args.csl).toEqual(fallBackCsl);
        });
      });
    });
  });

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL2hvbWUvbWFyY3VzLy5hdG9tL3BhY2thZ2VzL21hcmtkb3duLXByZXZpZXctcGx1cy9zcGVjL21hcmtkb3duLXByZXZpZXctcGFuZG9jLWhlbHBlci1zcGVjLmNvZmZlZSJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQUFBLE1BQUE7O0VBQUEsSUFBQSxHQUFPLE9BQUEsQ0FBUSxNQUFSOztFQUNQLEVBQUEsR0FBSyxPQUFBLENBQVEsU0FBUjs7RUFDTCxJQUFBLEdBQU8sT0FBQSxDQUFRLE1BQVI7O0VBQ1AsTUFBQSxHQUFTLE9BQUEsQ0FBUSxRQUFSOztFQUNSLElBQUssT0FBQSxDQUFRLHNCQUFSOztFQUNOLFlBQUEsR0FBZSxPQUFBLENBQVEsNkJBQVI7O0VBRWYsT0FBQSxHQUFVOztFQUNWLE9BQUEsR0FBVTs7RUFFVixRQUFBLEdBQVc7O0VBQ1gsSUFBQSxHQUFPOztFQUVQLE9BQUEsQ0FBUSxlQUFSOztFQUVBLFFBQUEsQ0FBUyxxQ0FBVCxFQUFnRCxTQUFBO0FBQzlDLFFBQUE7SUFBQSxNQUE4QixFQUE5QixFQUFDLHlCQUFELEVBQW1CO0lBRW5CLFVBQUEsQ0FBVyxTQUFBO0FBQ1QsVUFBQTtNQUFBLFlBQUEsR0FBZSxJQUFJLENBQUMsSUFBTCxDQUFVLFNBQVYsRUFBcUIsVUFBckI7TUFDZixRQUFBLEdBQVcsSUFBSSxDQUFDLFNBQUwsQ0FBZSxNQUFmO01BQ1gsTUFBTSxDQUFDLG9CQUFQLENBQTRCLFlBQTVCLEVBQTBDLFFBQTFDLEVBQW9EO1FBQUEsV0FBQSxFQUFhLElBQWI7T0FBcEQ7TUFDQSxJQUFJLENBQUMsT0FBTyxDQUFDLFFBQWIsQ0FBc0IsQ0FBQyxRQUFELENBQXRCO01BRUEsT0FBTyxDQUFDLFlBQVIsQ0FBQTtNQUVBLGdCQUFBLEdBQW1CLElBQUksQ0FBQyxLQUFLLENBQUMsT0FBWCxDQUFtQixJQUFJLENBQUMsU0FBeEI7TUFDbkIsT0FBTyxDQUFDLFdBQVIsQ0FB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QUFmQSIsInNvdXJjZXNDb250ZW50IjpbInBhdGggPSByZXF1aXJlICdwYXRoJ1xuZnMgPSByZXF1aXJlICdmcy1wbHVzJ1xudGVtcCA9IHJlcXVpcmUgJ3RlbXAnXG53cmVuY2ggPSByZXF1aXJlICd3cmVuY2gnXG57JH0gPSByZXF1aXJlICdhdG9tLXNwYWNlLXBlbi12aWV3cydcbnBhbmRvY0hlbHBlciA9IHJlcXVpcmUgJy4uL2xpYi9wYW5kb2MtaGVscGVyLmNvZmZlZSdcblxuYmliRmlsZSA9ICd0ZXN0LmJpYidcbmNzbEZpbGUgPSAnZm9vLmNzbCdcblxudGVtcFBhdGggPSBudWxsXG5maWxlID0gbnVsbFxuXG5yZXF1aXJlICcuL3NwZWMtaGVscGVyJ1xuXG5kZXNjcmliZSBcIk1hcmtkb3duIHByZXZpZXcgcGx1cyBwYW5kb2MgaGVscGVyXCIsIC0+XG4gIFt3b3Jrc3BhY2VFbGVtZW50LCBwcmV2aWV3XSA9IFtdXG5cbiAgYmVmb3JlRWFjaCAtPlxuICAgIGZpeHR1cmVzUGF0aCA9IHBhdGguam9pbihfX2Rpcm5hbWUsICdmaXh0dXJlcycpXG4gICAgdGVtcFBhdGggPSB0ZW1wLm1rZGlyU3luYygnYXRvbScpXG4gICAgd3JlbmNoLmNvcHlEaXJTeW5jUmVjdXJzaXZlKGZpeHR1cmVzUGF0aCwgdGVtcFBhdGgsIGZvcmNlRGVsZXRlOiB0cnVlKVxuICAgIGF0b20ucHJvamVjdC5zZXRQYXRocyhbdGVtcFBhdGhdKVxuXG4gICAgamFzbWluZS51c2VSZWFsQ2xvY2soKVxuXG4gICAgd29ya3NwYWNlRWxlbWVudCA9IGF0b20udmlld3MuZ2V0VmlldyhhdG9tLndvcmtzcGFjZSlcbiAgICBqYXNtaW5lLmF0dGFjaFRvRE9NKHdvcmtzcGFjZUVsZW1lbnQpXG5cbiAgICB3YWl0c0ZvclByb21pc2UgLT5cbiAgICAgIGF0b20ucGFja2FnZXMuYWN0aXZhdGVQYWNrYWdlKFwibWFya2Rvd24tcHJldmlldy1wbHVzXCIpXG5cbiAgZGVzY3JpYmUgXCJQYW5kb2NIZWxwZXI6OmZpbmRGaWxlUmVjdXJzaXZlXCIsIC0+XG5cbiAgICBmUiA9IHBhbmRvY0hlbHBlci5fX3Rlc3RpbmdfXy5maW5kRmlsZVJlY3Vyc2l2ZVxuXG4gICAgaXQgXCJzaG91bGQgcmV0dXJuIGJpYkZpbGUgaW4gdGhlIHNhbWUgZGlyZWN0b3J5XCIsIC0+XG4gICAgICBydW5zIC0+XG4gICAgICAgIGJpYlBhdGggPSBwYXRoLmpvaW4odGVtcFBhdGgsICdzdWJkaXInLCBiaWJGaWxlKVxuICAgICAgICBmcy53cml0ZUZpbGVTeW5jIGJpYlBhdGgsICcnXG4gICAgICAgIGZvdW5kID0gZlIgcGF0aC5qb2luKHRlbXBQYXRoLCAnc3ViZGlyJywgJ3NpbXBsZS5tZCcpLCBiaWJGaWxlXG4gICAgICAgIGV4cGVjdChmb3VuZCkudG9FcXVhbChiaWJQYXRoKVxuXG4gICAgaXQgXCJzaG91bGQgcmV0dXJuIGJpYkZpbGUgaW4gYSBwYXJlbnQgZGlyZWN0b3J5XCIsIC0+XG4gICAgICBydW5zIC0+XG4gICAgICAgIGJpYlBhdGggPSBwYXRoLmpvaW4odGVtcFBhdGgsIGJpYkZpbGUpXG4gICAgICAgIGZzLndyaXRlRmlsZVN5bmMgYmliUGF0aCwgJydcbiAgICAgICAgZm91bmQgPSBmUiBwYXRoLmpvaW4odGVtcFBhdGgsICdzdWJkaXInLCAnc2ltcGxlLm1kJyksIGJpYkZpbGVcbiAgICAgICAgZXhwZWN0KGZvdW5kKS50b0VxdWFsKGJpYlBhdGgpXG5cbiAgICBpdCBcInNob3VsZG4ndCByZXR1cm4gYmliRmlsZSBpbiBhIG91dCBvZiBzY29wZSBkaXJlY3RvcnlcIiwgLT5cbiAgICAgIHJ1bnMgLT5cbiAgICAgICAgZnMud3JpdGVGaWxlU3luYyBwYXRoLmpvaW4odGVtcFBhdGgsICcuLicsIGJpYkZpbGUpLCAnJ1xuICAgICAgICBmb3VuZCA9IGZSIHBhdGguam9pbih0ZW1wUGF0aCwgJ3N1YmRpcicsICdzaW1wbGUubWQnKSwgYmliRmlsZVxuICAgICAgICBleHBlY3QoZm91bmQpLnRvRXF1YWwoZmFsc2UpXG5cbiAgZGVzY3JpYmUgXCJQYW5kb2NIZWxwZXI6OmdldEFyZ3VtZW50c1wiLCAtPlxuICAgIGdldEFyZ3VtZW50cyA9IHBhbmRvY0hlbHBlci5fX3Rlc3RpbmdfXy5nZXRBcmd1bWVudHNcblxuICAgIGl0ICdzaG91bGQgd29yayB3aXRoIGVtcHR5IGFyZ3VtZW50cycsIC0+XG4gICAgICBhdG9tLmNvbmZpZy5zZXQgJ21hcmtkb3duLXByZXZpZXctcGx1cy5wYW5kb2NBcmd1bWVudHMnLCBbXVxuICAgICAgcmVzdWx0ID0gZ2V0QXJndW1lbnRzKG51bGwpXG4gICAgICBleHBlY3QocmVzdWx0Lmxlbmd0aCkudG9FcXVhbCgwKVxuXG4gICAgaXQgJ3Nob3VsZCBmaWx0ZXIgZW1wdHkgYXJndW1lbnRzJywgLT5cbiAgICAgIGFyZ3MgPVxuICAgICAgICBmb286ICdiYXInXG4gICAgICAgIGVtcHR5OiBudWxsXG4gICAgICAgIG5vbmU6ICdsYWxhJ1xuICAgICAgICBlbXB0eTI6IGZhbHNlXG4gICAgICAgIGVtcHR5MzogdW5kZWZpbmVkXG4gICAgICByZXN1bHQgPSBnZXRBcmd1bWVudHMoYXJncylcbiAgICAgIGV4cGVjdChyZXN1bHQubGVuZ3RoKS50b0VxdWFsKDIpXG4gICAgICBleHBlY3QocmVzdWx0WzBdKS50b0VxdWFsKCctLWZvbz1iYXInKVxuICAgICAgZXhwZWN0KHJlc3VsdFsxXSkudG9FcXVhbCgnLS1ub25lPWxhbGEnKVxuXG4gICAgaXQgJ3Nob3VsZCBsb2FkIHVzZXIgYXJndW1lbnRzJywgLT5cbiAgICAgIGF0b20uY29uZmlnLnNldCAnbWFya2Rvd24tcHJldmlldy1wbHVzLnBhbmRvY0FyZ3VtZW50cycsXG4gICAgICAgIFsnLXYnLCAnLS1zbWFydCcsICdyZW0nLCAnLS1maWx0ZXI9L2Zvby9iYXInLCAnLS1maWx0ZXItZm9vIC9mb28vYmF6J11cbiAgICAgIGFyZ3MgPSB7fVxuICAgICAgcmVzdWx0ID0gZ2V0QXJndW1lbnRzKGFyZ3MpXG4gICAgICBleHBlY3QocmVzdWx0Lmxlbmd0aCkudG9FcXVhbCg0KVxuICAgICAgZXhwZWN0KHJlc3VsdFswXSkudG9FcXVhbCgnLXYnKVxuICAgICAgZXhwZWN0KHJlc3VsdFsxXSkudG9FcXVhbCgnLS1zbWFydCcpXG4gICAgICBleHBlY3QocmVzdWx0WzJdKS50b0VxdWFsKCctLWZpbHRlcj0vZm9vL2JhcicpXG4gICAgICBleHBlY3QocmVzdWx0WzNdKS50b0VxdWFsKCctLWZpbHRlci1mb289L2Zvby9iYXonKVxuXG4gICAgaXQgJ3Nob3VsZCBjb21iaW5lIHVzZXIgYXJndW1lbnRzIGFuZCBnaXZlbiBhcmd1bWVudHMnLCAtPlxuICAgICAgYXRvbS5jb25maWcuc2V0ICdtYXJrZG93bi1wcmV2aWV3LXBsdXMucGFuZG9jQXJndW1lbnRzJyxcbiAgICAgICAgWyctdicsICctLWZpbHRlci1mb28gL2Zvby9iYXonXVxuICAgICAgYXJncyA9XG4gICAgICAgIGZvbzogJ2JhcidcbiAgICAgICAgZW1wdHkzOiB1bmRlZmluZWRcbiAgICAgIHJlc3VsdCA9IGdldEFyZ3VtZW50cyhhcmdzKVxuICAgICAgZXhwZWN0KHJlc3VsdC5sZW5ndGgpLnRvRXF1YWwoMylcbiAgICAgIGV4cGVjdChyZXN1bHRbMF0pLnRvRXF1YWwoJy0tZm9vPWJhcicpXG4gICAgICBleHBlY3QocmVzdWx0WzFdKS50b0VxdWFsKCctdicpXG4gICAgICBleHBlY3QocmVzdWx0WzJdKS50b0VxdWFsKCctLWZpbHRlci1mb289L2Zvby9iYXonKVxuXG5cbiAgZGVzY3JpYmUgXCJQYW5kb2NIZWxwZXI6OnNldFBhbmRvY09wdGlvbnNcIiwgLT5cbiAgICBmYWxsQmFja0JpYiA9ICcvZm9vL2ZhbGxiYWNrLmJpYidcbiAgICBmYWxsQmFja0NzbCA9ICcvZm9vL2ZhbGxiYWNrLmNzbCdcbiAgICBzZXRQYW5kb2NPcHRpb25zID0gcGFuZG9jSGVscGVyLl9fdGVzdGluZ19fLnNldFBhbmRvY09wdGlvbnNcblxuXG4gICAgYmVmb3JlRWFjaCAtPlxuICAgICAgZmlsZSA9IHBhdGguam9pbiB0ZW1wUGF0aCwgJ3N1YmRpcicsICdzaW1wbGUubWQnXG4gICAgICBhdG9tLmNvbmZpZy5zZXQgJ21hcmtkb3duLXByZXZpZXctcGx1cy5wYW5kb2NCaWJsaW9ncmFwaHknLCB0cnVlXG4gICAgICBhdG9tLmNvbmZpZy5zZXQgJ21hcmtkb3duLXByZXZpZXctcGx1cy5wYW5kb2NCSUJGaWxlJywgYmliRmlsZVxuICAgICAgYXRvbS5jb25maWcuc2V0ICdtYXJrZG93bi1wcmV2aWV3LXBsdXMucGFuZG9jQklCRmlsZUZhbGxiYWNrJywgZmFsbEJhY2tCaWJcbiAgICAgIGF0b20uY29uZmlnLnNldCAnbWFya2Rvd24tcHJldmlldy1wbHVzLnBhbmRvY0NTTEZpbGUnLCBjc2xGaWxlXG4gICAgICBhdG9tLmNvbmZpZy5zZXQgJ21hcmtkb3duLXByZXZpZXctcGx1cy5wYW5kb2NDU0xGaWxlRmFsbGJhY2snLCBmYWxsQmFja0NzbFxuXG4gICAgaXQgXCJzaG91bGRuJ3Qgc2V0IHBhbmRvYyBiaWIgb3B0aW9ucyBpZiBjaXRhdGlvbnMgYXJlIGRpc2FibGVkXCIsIC0+XG4gICAgICBydW5zIC0+XG4gICAgICAgIGF0b20uY29uZmlnLnNldCAnbWFya2Rvd24tcHJldmlldy1wbHVzLnBhbmRvY0JpYmxpb2dyYXBoeScsIGZhbHNlXG4gICAgICAgIGZzLndyaXRlRmlsZVN5bmMgcGF0aC5qb2luKHRlbXBQYXRoLCBiaWJGaWxlKSwgJydcbiAgICAgICAgY29uZmlnID0gc2V0UGFuZG9jT3B0aW9ucyBmaWxlXG4gICAgICAgIGV4cGVjdChjb25maWcuYXJncy5iaWJsaW9ncmFwaHkpLnRvRXF1YWwodW5kZWZpbmVkKVxuXG4gICAgaXQgXCJzaG91bGRuJ3Qgc2V0IHBhbmRvYyBiaWIgb3B0aW9ucyBpZiBubyBmYWxsYmFjayBmaWxlIGV4aXN0c1wiLCAtPlxuICAgICAgcnVucyAtPlxuICAgICAgICBhdG9tLmNvbmZpZy5zZXQgJ21hcmtkb3duLXByZXZpZXctcGx1cy5wYW5kb2NCSUJGaWxlRmFsbGJhY2snXG4gICAgICAgIGNvbmZpZyA9IHNldFBhbmRvY09wdGlvbnMgZmlsZVxuICAgICAgICBleHBlY3QoY29uZmlnLmFyZ3MuYmlibGlvZ3JhcGh5KS50b0VxdWFsKHVuZGVmaW5lZClcblxuICAgIGl0IFwic2hvdWxkIHNldCBwYW5kb2MgYmliIG9wdGlvbnMgaWYgY2l0YXRpb25zIGFyZSBlbmFibGVkIGFuZCBwcm9qZWN0IGJpYkZpbGUgZXhpc3RzXCIsIC0+XG4gICAgICBydW5zIC0+XG4gICAgICAgIGJpYlBhdGggPSBwYXRoLmpvaW4odGVtcFBhdGgsIGJpYkZpbGUpXG4gICAgICAgIGZzLndyaXRlRmlsZVN5bmMgYmliUGF0aCwgJydcbiAgICAgICAgY29uZmlnID0gc2V0UGFuZG9jT3B0aW9ucyBmaWxlXG4gICAgICAgIGV4cGVjdChjb25maWcuYXJncy5iaWJsaW9ncmFwaHkpLnRvRXF1YWwoYmliUGF0aClcblxuICAgIGl0IFwic2hvdWxkIHNldCBwYW5kb2MgYmliIG9wdGlvbnMgaWYgY2l0YXRpb25zIGFyZSBlbmFibGVkIGFuZCB1c2UgZmFsbGJhY2tcIiwgLT5cbiAgICAgIHJ1bnMgLT5cbiAgICAgICAgY29uZmlnID0gc2V0UGFuZG9jT3B0aW9ucyBmaWxlXG4gICAgICAgIGV4cGVjdChjb25maWcuYXJncy5iaWJsaW9ncmFwaHkpLnRvRXF1YWwoZmFsbEJhY2tCaWIpXG5cbiAgICBpdCBcInNob3VsZG4ndCBzZXQgcGFuZG9jIGNzbCBvcHRpb25zIGlmIGNpdGF0aW9ucyBhcmUgZGlzYWJsZWRcIiwgLT5cbiAgICAgIHJ1bnMgLT5cbiAgICAgICAgYXRvbS5jb25maWcuc2V0ICdtYXJrZG93bi1wcmV2aWV3LXBsdXMucGFuZG9jQmlibGlvZ3JhcGh5JywgZmFsc2VcbiAgICAgICAgZnMud3JpdGVGaWxlU3luYyBwYXRoLmpvaW4odGVtcFBhdGgsIGNzbEZpbGUpLCAnJ1xuICAgICAgICBjb25maWcgPSBzZXRQYW5kb2NPcHRpb25zIGZpbGVcbiAgICAgICAgZXhwZWN0KGNvbmZpZy5hcmdzLmNzbCkudG9FcXVhbCh1bmRlZmluZWQpXG5cbiAgICBpdCBcInNob3VsZG4ndCBzZXQgcGFuZG9jIGNzbCBvcHRpb25zIGlmIG5vIGZhbGxiYWNrIGZpbGUgZXhpc3RzXCIsIC0+XG4gICAgICBydW5zIC0+XG4gICAgICAgIGF0b20uY29uZmlnLnNldCAnbWFya2Rvd24tcHJldmlldy1wbHVzLnBhbmRvY0NTTEZpbGVGYWxsYmFjaydcbiAgICAgICAgY29uZmlnID0gc2V0UGFuZG9jT3B0aW9ucyBmaWxlXG4gICAgICAgIGV4cGVjdChjb25maWcuYXJncy5jc2wpLnRvRXF1YWwodW5kZWZpbmVkKVxuXG4gICAgaXQgXCJzaG91bGQgc2V0IHBhbmRvYyBjc2wgb3B0aW9ucyBpZiBjaXRhdGlvbnMgYXJlIGVuYWJsZWQgYW5kIHByb2plY3QgY3NsRmlsZSBleGlzdHNcIiwgLT5cbiAgICAgIHJ1bnMgLT5cbiAgICAgICAgY3NsUGF0aCA9IHBhdGguam9pbih0ZW1wUGF0aCwgY3NsRmlsZSlcbiAgICAgICAgZnMud3JpdGVGaWxlU3luYyBjc2xQYXRoLCAnJ1xuICAgICAgICBjb25maWcgPSBzZXRQYW5kb2NPcHRpb25zIGZpbGVcbiAgICAgICAgZXhwZWN0KGNvbmZpZy5hcmdzLmNzbCkudG9FcXVhbChjc2xQYXRoKVxuXG4gICAgaXQgXCJzaG91bGQgc2V0IHBhbmRvYyBjc2wgb3B0aW9ucyBpZiBjaXRhdGlvbnMgYXJlIGVuYWJsZWQgYW5kIHVzZSBmYWxsYmFja1wiLCAtPlxuICAgICAgcnVucyAtPlxuICAgICAgICBjb25maWcgPSBzZXRQYW5kb2NPcHRpb25zIGZpbGVcbiAgICAgICAgZXhwZWN0KGNvbmZpZy5hcmdzLmNzbCkudG9FcXVhbChmYWxsQmFja0NzbClcbiJdfQ==
