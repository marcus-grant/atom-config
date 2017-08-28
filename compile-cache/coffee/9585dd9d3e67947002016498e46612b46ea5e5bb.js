(function() {
  var MarkdownPreviewView, fs, markdownIt, pandocHelper, path, queryString, temp, url;

  path = require('path');

  fs = require('fs-plus');

  temp = require('temp');

  MarkdownPreviewView = require('../lib/markdown-preview-view');

  markdownIt = require('../lib/markdown-it-helper');

  pandocHelper = require('../lib/pandoc-helper.coffee');

  url = require('url');

  queryString = require('querystring');

  require('./spec-helper');

  describe("MarkdownPreviewView when Pandoc is enabled", function() {
    var filePath, html, preview, ref;
    ref = [], html = ref[0], preview = ref[1], filePath = ref[2];
    beforeEach(function() {
      var htmlPath;
      filePath = atom.project.getDirectories()[0].resolve('subdir/file.markdown');
      htmlPath = atom.project.getDirectories()[0].resolve('subdir/file-pandoc.html');
      html = fs.readFileSync(htmlPath, {
        encoding: 'utf-8'
      });
      waitsForPromise(function() {
        return atom.packages.activatePackage('markdown-preview-plus');
      });
      runs(function() {
        atom.config.set('markdown-preview-plus.enablePandoc', true);
        spyOn(pandocHelper, 'renderPandoc').andCallFake(function(text, filePath, renderMath, cb) {
          return cb(null, html);
        });
        preview = new MarkdownPreviewView({
          filePath: filePath
        });
        return jasmine.attachToDOM(preview.element);
      });
      return this.addMatchers({
        toStartWith: function(expected) {
          return this.actual.slice(0, expected.length) === expected;
        }
      });
    });
    afterEach(function() {
      return preview.destroy();
    });
    return describe("image resolving", function() {
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
          expect(markdownIt.decode).not.toHaveBeenCalled();
          return expect(image.attr('src')).toStartWith(atom.project.getDirectories()[0].resolve('subdir/image1.png'));
        });
      });
      describe("when the image uses an absolute path that does not exist", function() {
        return it("resolves to a path relative to the project root", function() {
          var image;
          image = preview.find("img[alt=Image2]");
          expect(markdownIt.decode).not.toHaveBeenCalled();
          return expect(image.attr('src')).toStartWith(atom.project.getDirectories()[0].resolve('tmp/image2.png'));
        });
      });
      describe("when the image uses an absolute path that exists", function() {
        return it("adds a query to the URL", function() {
          preview.destroy();
          filePath = path.join(temp.mkdirSync('atom'), 'foo.md');
          fs.writeFileSync(filePath, "![absolute](" + filePath + ")");
          jasmine.unspy(pandocHelper, 'renderPandoc');
          spyOn(pandocHelper, 'renderPandoc').andCallFake(function(text, filePath, renderMath, cb) {
            return cb(null, "<div class=\"figure\">\n<img src=\"" + filePath + "\" alt=\"absolute\"><p class=\"caption\">absolute</p>\n</div>");
          });
          preview = new MarkdownPreviewView({
            filePath: filePath
          });
          jasmine.attachToDOM(preview.element);
          waitsForPromise(function() {
            return preview.renderMarkdown();
          });
          return runs(function() {
            expect(markdownIt.decode).not.toHaveBeenCalled();
            return expect(preview.find("img[alt=absolute]").attr('src')).toStartWith(filePath + "?v=");
          });
        });
      });
      return describe("when the image uses a web URL", function() {
        return it("doesn't change the URL", function() {
          var image;
          image = preview.find("img[alt=Image3]");
          expect(markdownIt.decode).not.toHaveBeenCalled();
          return expect(image.attr('src')).toBe('https://raw.githubusercontent.com/Galadirith/markdown-preview-plus/master/assets/hr.png');
        });
      });
    });
  });

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL2hvbWUvbWFyY3VzLy5hdG9tL3BhY2thZ2VzL21hcmtkb3duLXByZXZpZXctcGx1cy9zcGVjL21hcmtkb3duLXByZXZpZXctdmlldy1wYW5kb2Mtc3BlYy5jb2ZmZWUiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUFBQSxNQUFBOztFQUFBLElBQUEsR0FBTyxPQUFBLENBQVEsTUFBUjs7RUFDUCxFQUFBLEdBQUssT0FBQSxDQUFRLFNBQVI7O0VBQ0wsSUFBQSxHQUFPLE9BQUEsQ0FBUSxNQUFSOztFQUNQLG1CQUFBLEdBQXNCLE9BQUEsQ0FBUSw4QkFBUjs7RUFDdEIsVUFBQSxHQUFhLE9BQUEsQ0FBUSwyQkFBUjs7RUFDYixZQUFBLEdBQWUsT0FBQSxDQUFRLDZCQUFSOztFQUNmLEdBQUEsR0FBTSxPQUFBLENBQVEsS0FBUjs7RUFDTixXQUFBLEdBQWMsT0FBQSxDQUFRLGFBQVI7O0VBRWQsT0FBQSxDQUFRLGVBQVI7O0VBRUEsUUFBQSxDQUFTLDRDQUFULEVBQXVELFNBQUE7QUFDckQsUUFBQTtJQUFBLE1BQTRCLEVBQTVCLEVBQUMsYUFBRCxFQUFPLGdCQUFQLEVBQWdCO0lBRWhCLFVBQUEsQ0FBVyxTQUFBO0FBQ1QsVUFBQTtNQUFBLFFBQUEsR0FBVyxJQUFJLENBQUMsT0FBTyxDQUFDLGNBQWIsQ0FBQSxDQUE4QixDQUFBLENBQUEsQ0FBRSxDQUFDLE9BQWpDLENBQXlDLHNCQUF6QztNQUNYLFFBQUEsR0FBVyxJQUFJLENBQUMsT0FBTyxDQUFDLGNBQWIsQ0FBQSxDQUE4QixDQUFBLENBQUEsQ0FBRSxDQUFDLE9BQWpDLENBQXlDLHlCQUF6QztNQUNYLElBQUEsR0FBTyxFQUFFLENBQUMsWUFBSCxDQUFnQixRQUFoQixFQUNMO1FBQUEsUUFBQSxFQUFVLE9BQVY7T0FESztNQUdQLGVBQUEsQ0FBZ0IsU0FBQTtlQUNkLElBQUksQ0FBQyxRQUFRLENBQUMsZUFBZCxDQUE4Qix1QkFBOUI7TUFE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QkFDOUMsRUFBQSxDQUFHLElBQUgsRUFBUyxxQ0FBQSxHQUVLLFFBRkwsR0FFYywrREFGdkI7VUFEOEMsQ0FBaEQ7VUFPQSxPQUFBLEdBQWMsSUFBQSxtQkFBQSxDQUFvQjtZQUFDLFVBQUEsUUFBRDtXQUFwQjtVQUNkLE9BQU8sQ0FBQyxXQUFSLENBQW9CLE9BQU8sQ0FBQyxPQUE1QjtVQUVBLGVBQUEsQ0FBZ0IsU0FBQTttQkFDZCxPQUFPLENBQUMsY0FBUixDQUFBO1VBRGMsQ0FBaEI7aUJBR0EsSUFBQSxDQUFLLFNBQUE7WUFDSCxNQUFBLENBQU8sVUFBVSxDQUFDLE1BQWxCLENBQXlCLENBQUMsR0FBRyxDQUFDLGdCQUE5QixDQUFBO21CQUNBLE1BQUEsQ0FBTyxPQUFPLENBQUMsSUFBUixDQUFhLG1CQUFiLENBQWlDLENBQUMsSUFBbEMsQ0FBdUMsS0FBdkMsQ0FBUCxDQUFxRCxDQUFDLFdBQXRELENBQXFFLFFBQUQsR0FBVSxLQUE5RTtVQUZHLENBQUw7UUFwQjRCLENBQTlCO01BRDJELENBQTdEO2FBeUJBLFFBQUEsQ0FBUywrQkFBVCxFQUEwQyxTQUFBO2VBQ3hDLEVBQUEsQ0FBRyx3QkFBSCxFQUE2QixTQUFBO0FBQzNCLGNBQUE7VUFBQSxLQUFBLEdBQVEsT0FBTyxDQUFDLElBQVIsQ0FBYSxpQkFBYjtVQUNSLE1BQUEsQ0FBTyxVQUFVLENBQUMsTUFBbEIsQ0FBeUIsQ0FBQyxHQUFHLENBQUMsZ0JBQTlCLENBQUE7aUJBQ0EsTUFBQSxDQUFPLEtBQUssQ0FBQyxJQUFOLENBQVcsS0FBWCxDQUFQLENBQXlCLENBQUMsSUFBMUIsQ0FBK0IseUZBQS9CO1FBSDJCLENBQTdCO01BRHdDLENBQTFDO0lBM0MwQixDQUE1QjtFQTNCcUQsQ0FBdkQ7QUFYQSIsInNvdXJjZXNDb250ZW50IjpbInBhdGggPSByZXF1aXJlICdwYXRoJ1xuZnMgPSByZXF1aXJlICdmcy1wbHVzJ1xudGVtcCA9IHJlcXVpcmUgJ3RlbXAnXG5NYXJrZG93blByZXZpZXdWaWV3ID0gcmVxdWlyZSAnLi4vbGliL21hcmtkb3duLXByZXZpZXctdmlldydcbm1hcmtkb3duSXQgPSByZXF1aXJlICcuLi9saWIvbWFya2Rvd24taXQtaGVscGVyJ1xucGFuZG9jSGVscGVyID0gcmVxdWlyZSAnLi4vbGliL3BhbmRvYy1oZWxwZXIuY29mZmVlJ1xudXJsID0gcmVxdWlyZSAndXJsJ1xucXVlcnlTdHJpbmcgPSByZXF1aXJlICdxdWVyeXN0cmluZydcblxucmVxdWlyZSAnLi9zcGVjLWhlbHBlcidcblxuZGVzY3JpYmUgXCJNYXJrZG93blByZXZpZXdWaWV3IHdoZW4gUGFuZG9jIGlzIGVuYWJsZWRcIiwgLT5cbiAgW2h0bWwsIHByZXZpZXcsIGZpbGVQYXRoXSA9IFtdXG5cbiAgYmVmb3JlRWFjaCAtPlxuICAgIGZpbGVQYXRoID0gYXRvbS5wcm9qZWN0LmdldERpcmVjdG9yaWVzKClbMF0ucmVzb2x2ZSgnc3ViZGlyL2ZpbGUubWFya2Rvd24nKVxuICAgIGh0bWxQYXRoID0gYXRvbS5wcm9qZWN0LmdldERpcmVjdG9yaWVzKClbMF0ucmVzb2x2ZSgnc3ViZGlyL2ZpbGUtcGFuZG9jLmh0bWwnKVxuICAgIGh0bWwgPSBmcy5yZWFkRmlsZVN5bmMgaHRtbFBhdGgsXG4gICAgICBlbmNvZGluZzogJ3V0Zi04J1xuXG4gICAgd2FpdHNGb3JQcm9taXNlIC0+XG4gICAgICBhdG9tLnBhY2thZ2VzLmFjdGl2YXRlUGFja2FnZSgnbWFya2Rvd24tcHJldmlldy1wbHVzJylcblxuICAgIHJ1bnMgLT5cbiAgICAgIGF0b20uY29uZmlnLnNldCAnbWFya2Rvd24tcHJldmlldy1wbHVzLmVuYWJsZVBhbmRvYycsIHRydWVcbiAgICAgIHNweU9uKHBhbmRvY0hlbHBlciwgJ3JlbmRlclBhbmRvYycpLmFuZENhbGxGYWtlICh0ZXh0LCBmaWxlUGF0aCwgcmVuZGVyTWF0aCwgY2IpIC0+XG4gICAgICAgIGNiIG51bGwsIGh0bWxcblxuICAgICAgcHJldmlldyA9IG5ldyBNYXJrZG93blByZXZpZXdWaWV3KHtmaWxlUGF0aH0pXG4gICAgICBqYXNtaW5lLmF0dGFjaFRvRE9NKHByZXZpZXcuZWxlbWVudClcblxuICAgIHRoaXMuYWRkTWF0Y2hlcnNcbiAgICAgIHRvU3RhcnRXaXRoOiAoZXhwZWN0ZWQpIC0+XG4gICAgICAgIHRoaXMuYWN0dWFsLnNsaWNlKDAsIGV4cGVjdGVkLmxlbmd0aCkgaXMgZXhwZWN0ZWRcblxuICBhZnRlckVhY2ggLT5cbiAgICBwcmV2aWV3LmRlc3Ryb3koKVxuXG4gIGRlc2NyaWJlIFwiaW1hZ2UgcmVzb2x2aW5nXCIsIC0+XG4gICAgYmVmb3JlRWFjaCAtPlxuICAgICAgc3B5T24obWFya2Rvd25JdCwgJ2RlY29kZScpLmFuZENhbGxUaHJvdWdoKClcbiAgICAgIHdhaXRzRm9yUHJvbWlzZSAtPlxuICAgICAgICBwcmV2aWV3LnJlbmRlck1hcmtkb3duKClcblxuICAgIGRlc2NyaWJlIFwid2hlbiB0aGUgaW1hZ2UgdXNlcyBhIHJlbGF0aXZlIHBhdGhcIiwgLT5cbiAgICAgIGl0IFwicmVzb2x2ZXMgdG8gYSBwYXRoIHJlbGF0aXZlIHRvIHRoZSBmaWxlXCIsIC0+XG4gICAgICAgIGltYWdlID0gcHJldmlldy5maW5kKFwiaW1nW2FsdD1JbWFnZTFdXCIpXG4gICAgICAgIGV4cGVjdChtYXJrZG93bkl0LmRlY29kZSkubm90LnRvSGF2ZUJlZW5DYWxsZWQoKVxuICAgICAgICBleHBlY3QoaW1hZ2UuYXR0cignc3JjJykpLnRvU3RhcnRXaXRoIGF0b20ucHJvamVjdC5nZXREaXJlY3RvcmllcygpWzBdLnJlc29sdmUoJ3N1YmRpci9pbWFnZTEucG5nJylcblxuICAgIGRlc2NyaWJlIFwid2hlbiB0aGUgaW1hZ2UgdXNlcyBhbiBhYnNvbHV0ZSBwYXRoIHRoYXQgZG9lcyBub3QgZXhpc3RcIiwgLT5cbiAgICAgIGl0IFwicmVzb2x2ZXMgdG8gYSBwYXRoIHJlbGF0aXZlIHRvIHRoZSBwcm9qZWN0IHJvb3RcIiwgLT5cbiAgICAgICAgaW1hZ2UgPSBwcmV2aWV3LmZpbmQoXCJpbWdbYWx0PUltYWdlMl1cIilcbiAgICAgICAgZXhwZWN0KG1hcmtkb3duSXQuZGVjb2RlKS5ub3QudG9IYXZlQmVlbkNhbGxlZCgpXG4gICAgICAgIGV4cGVjdChpbWFnZS5hdHRyKCdzcmMnKSkudG9TdGFydFdpdGggYXRvbS5wcm9qZWN0LmdldERpcmVjdG9yaWVzKClbMF0ucmVzb2x2ZSgndG1wL2ltYWdlMi5wbmcnKVxuXG4gICAgZGVzY3JpYmUgXCJ3aGVuIHRoZSBpbWFnZSB1c2VzIGFuIGFic29sdXRlIHBhdGggdGhhdCBleGlzdHNcIiwgLT5cbiAgICAgIGl0IFwiYWRkcyBhIHF1ZXJ5IHRvIHRoZSBVUkxcIiwgLT5cbiAgICAgICAgcHJldmlldy5kZXN0cm95KClcblxuICAgICAgICBmaWxlUGF0aCA9IHBhdGguam9pbih0ZW1wLm1rZGlyU3luYygnYXRvbScpLCAnZm9vLm1kJylcbiAgICAgICAgZnMud3JpdGVGaWxlU3luYyhmaWxlUGF0aCwgXCIhW2Fic29sdXRlXSgje2ZpbGVQYXRofSlcIilcblxuICAgICAgICBqYXNtaW5lLnVuc3B5KHBhbmRvY0hlbHBlciwgJ3JlbmRlclBhbmRvYycpXG4gICAgICAgIHNweU9uKHBhbmRvY0hlbHBlciwgJ3JlbmRlclBhbmRvYycpLmFuZENhbGxGYWtlICh0ZXh0LCBmaWxlUGF0aCwgcmVuZGVyTWF0aCwgY2IpIC0+XG4gICAgICAgICAgY2IgbnVsbCwgXCJcIlwiXG4gICAgICAgICAgICA8ZGl2IGNsYXNzPVwiZmlndXJlXCI+XG4gICAgICAgICAgICA8aW1nIHNyYz1cIiN7ZmlsZVBhdGh9XCIgYWx0PVwiYWJzb2x1dGVcIj48cCBjbGFzcz1cImNhcHRpb25cIj5hYnNvbHV0ZTwvcD5cbiAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgXCJcIlwiXG5cbiAgICAgICAgcHJldmlldyA9IG5ldyBNYXJrZG93blByZXZpZXdWaWV3KHtmaWxlUGF0aH0pXG4gICAgICAgIGphc21pbmUuYXR0YWNoVG9ET00ocHJldmlldy5lbGVtZW50KVxuXG4gICAgICAgIHdhaXRzRm9yUHJvbWlzZSAtPlxuICAgICAgICAgIHByZXZpZXcucmVuZGVyTWFya2Rvd24oKVxuXG4gICAgICAgIHJ1bnMgLT5cbiAgICAgICAgICBleHBlY3QobWFya2Rvd25JdC5kZWNvZGUpLm5vdC50b0hhdmVCZWVuQ2FsbGVkKClcbiAgICAgICAgICBleHBlY3QocHJldmlldy5maW5kKFwiaW1nW2FsdD1hYnNvbHV0ZV1cIikuYXR0cignc3JjJykpLnRvU3RhcnRXaXRoIFwiI3tmaWxlUGF0aH0/dj1cIlxuXG4gICAgZGVzY3JpYmUgXCJ3aGVuIHRoZSBpbWFnZSB1c2VzIGEgd2ViIFVSTFwiLCAtPlxuICAgICAgaXQgXCJkb2Vzbid0IGNoYW5nZSB0aGUgVVJMXCIsIC0+XG4gICAgICAgIGltYWdlID0gcHJldmlldy5maW5kKFwiaW1nW2FsdD1JbWFnZTNdXCIpXG4gICAgICAgIGV4cGVjdChtYXJrZG93bkl0LmRlY29kZSkubm90LnRvSGF2ZUJlZW5DYWxsZWQoKVxuICAgICAgICBleHBlY3QoaW1hZ2UuYXR0cignc3JjJykpLnRvQmUgJ2h0dHBzOi8vcmF3LmdpdGh1YnVzZXJjb250ZW50LmNvbS9HYWxhZGlyaXRoL21hcmtkb3duLXByZXZpZXctcGx1cy9tYXN0ZXIvYXNzZXRzL2hyLnBuZydcbiJdfQ==
