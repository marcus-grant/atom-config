(function() {
  var cheerio, compareHTML, markdownIt, renderMath;

  markdownIt = require('../lib/markdown-it-helper');

  cheerio = require('cheerio');

  require('./spec-helper');

  renderMath = false;

  compareHTML = function(one, two) {
    one = markdownIt.render(one, renderMath);
    one = one.replace(/\n\s*/g, '');
    two = two.replace(/\n\s*/g, '');
    return expect(one).toEqual(two);
  };

  describe("MarkdownItHelper (Math)", function() {
    var content;
    content = [][0];
    beforeEach(function() {
      content = null;
      return renderMath = true;
    });
    it("Math in markdown inlines", function() {
      var result;
      content = "# Math $x^2$ in heading 1\n\n_math $x^2$ in emphasis_\n\n**math $x^2$ in bold**\n\n[math $x^2$ in link](http://www.mathjax.org/)\n\n`math $x^2$ in code`\n\n~~math $x^2$ in strikethrough~~";
      result = "<h1>Math <span class='math'><script type='math/tex'>x^2</script></span> in heading 1</h1>\n<p><em>math <span class='math'><script type='math/tex'>x^2</script></span> in emphasis</em></p>\n<p><strong>math <span class='math'><script type='math/tex'>x^2</script></span> in bold</strong></p>\n<p><a href=\"http://www.mathjax.org/\">math <span class='math'><script type='math/tex'>x^2</script></span> in link</a></p>\n<p><code>math $x^2$ in code</code></p>\n<p><s>math <span class='math'><script type='math/tex'>x^2</script></span> in strikethrough</s></p>";
      return compareHTML(content, result);
    });
    describe("Interference with markdown syntax (from issue-18)", function() {
      it("should not interfere with *", function() {
        return runs(function() {
          var result;
          content = "This $(f*g*h)(x)$ is no conflict";
          result = "<p>This <span class='math'><script type='math/tex'>(f*g*h)(x)</script></span> is no conflict</p>";
          return compareHTML(content, result);
        });
      });
      it("should not interfere with _", function() {
        return runs(function() {
          var result;
          content = "This $x_1, x_2, \\dots, x_N$ is no conflict";
          result = "<p>This <span class='math'><script type='math/tex'>x_1, x_2, \\dots, x_N</script></span> is no conflict</p>";
          return compareHTML(content, result);
        });
      });
      return it("should not interfere with link syntax", function() {
        return runs(function() {
          var result;
          content = "This $[a+b](c+d)$ is no conflict";
          result = "<p>This <span class='math'><script type='math/tex'>[a+b](c+d)</script></span> is no conflict</p>";
          return compareHTML(content, result);
        });
      });
    });
    describe("Examples from stresstest document (issue-18)", function() {
      it("several tex functions", function() {
        return runs(function() {
          var result;
          content = "$k \\times k$, $n \\times 2$, $2 \\times n$, $\\times$\n\n$x \\cdot y$, $\\cdot$\n\n$\\sqrt{x^2+y^2+z^2}$\n\n$\\alpha \\beta \\gamma$\n\n$$\n\\begin{aligned}\nx\\ &= y\\\\\nmc^2\\ &= E\n\\end{aligned}\n$$";
          result = "<p><span class='math'><script type='math/tex'>k \\times k</script></span>, <span class='math'><script type='math/tex'>n \\times 2</script></span>, <span class='math'><script type='math/tex'>2 \\times n</script></span>, <span class='math'><script type='math/tex'>\\times</script></span></p>\n<p><span class='math'><script type='math/tex'>x \\cdot y</script></span>, <span class='math'><script type='math/tex'>\\cdot</script></span></p>\n<p><span class='math'><script type='math/tex'>\\sqrt{x^2+y^2+z^2}</script></span></p>\n<p><span class='math'><script type='math/tex'>\\alpha \\beta \\gamma</script></span></p>\n<span class='math'><script type='math/tex; mode=display'>\\begin{aligned}\nx\\ &= y\\\\\nmc^2\\ &= E\n\\end{aligned}\n</script></span>";
          return compareHTML(content, result);
        });
      });
      describe("Escaped Math environments", function() {
        xit("Empty lines after $$", function() {
          return runs(function() {
            var result;
            content = "$$\n\nshould be escaped\n\n$$";
            result = "<p>$$</p><p>should be escaped</p><p>$$</p>";
            return compareHTML(content, result);
          });
        });
        it("Inline Math without proper opening and closing", function() {
          return runs(function() {
            var result;
            content = "a $5, a $10 and a \\$100 Bill.";
            result = '<p>a $5, a $10 and a $100 Bill.</p>';
            return compareHTML(content, result);
          });
        });
        it("Double escaped \\[ and \\(", function() {
          return runs(function() {
            var result;
            content = "\n\\\\[\n  x+y\n\\]\n\n\\\\(x+y\\)";
            result = "<p>\\[x+y]</p><p>\\(x+y)</p>";
            return compareHTML(content, result);
          });
        });
        return it("In inline code examples", function() {
          return runs(function() {
            var result;
            content = "`\\$`, `\\[ \\]`, `$x$`";
            result = "<p><code>\\$</code>, <code>\\[ \\]</code>, <code>$x$</code></p>";
            return compareHTML(content, result);
          });
        });
      });
      return describe("Math Blocks", function() {
        it("$$ should work multiline", function() {
          return runs(function() {
            var result;
            content = "$$\na+b\n$$";
            result = "<span class='math'><script type='math/tex; mode=display'>a+b</script></span>";
            return compareHTML(content, result);
          });
        });
        it("$$ should work singeline", function() {
          return runs(function() {
            var result;
            content = "$$a+b$$";
            result = "<span class='math'><script type='math/tex; mode=display'>a+b</script></span>";
            return compareHTML(content, result);
          });
        });
        it("$$ should work directly after paragraph", function() {
          return runs(function() {
            var result;
            content = "Test\n$$\na+b\n$$";
            result = "<p>Test</p><span class='math'><script type='math/tex; mode=display'>a+b</script></span>";
            return compareHTML(content, result);
          });
        });
        it("\\[ should work multiline", function() {
          return runs(function() {
            var result;
            content = "\\[\na+b\n\\]";
            result = "<span class='math'><script type='math/tex; mode=display'>a+b</script></span>";
            return compareHTML(content, result);
          });
        });
        it("\\[ should work singeline", function() {
          return runs(function() {
            var result;
            content = "\\[a+b\\]";
            result = "<span class='math'><script type='math/tex; mode=display'>a+b</script></span>";
            return compareHTML(content, result);
          });
        });
        return it("\\[ should work directly after paragraph", function() {
          return runs(function() {
            var result;
            content = "Test\n\\[\na+b\n\\]";
            result = "<p>Test</p><span class='math'><script type='math/tex; mode=display'>a+b</script></span>";
            return compareHTML(content, result);
          });
        });
      });
    });
    return describe("Examples from issues", function() {
      it("should respect escaped dollar inside code (issue-3)", function() {
        return runs(function() {
          var result;
          content = "```\n\\$\n```";
          result = '<pre><code>\\$</code></pre>';
          return compareHTML(content, result);
        });
      });
      it("should respect escaped dollar inside code (mp-issue-116)", function() {
        return runs(function() {
          var result;
          content = "start\n\n```\n$fgf\n```\n\n\\$ asd\n$x$";
          result = "<p>start</p>\n<pre><code>$fgf</code></pre>\n<p>\n  $ asd\n  <span class='math'>\n    <script type='math/tex'>x</script>\n  </span>\n</p>";
          return compareHTML(content, result);
        });
      });
      it("should render inline math with \\( (issue-7)", function() {
        return runs(function() {
          var result;
          content = "This should \\(x+y\\) work.";
          result = "<p>\n This should <span class='math'>\n   <script type='math/tex'>x+y</script>\n </span> work.\n</p>";
          return compareHTML(content, result);
        });
      });
      it("should render inline math with N\\times N (issue-17)", function() {
        return runs(function() {
          var result;
          content = "An $N\\times N$ grid.";
          result = "<p>\n An <span class='math'>\n   <script type='math/tex'>N\\times N</script>\n </span> grid.\n</p>";
          return compareHTML(content, result);
        });
      });
      return it("should respect inline code (issue-20)", function() {
        return runs(function() {
          var result;
          content = "This is broken `$$`\n\n$$\na+b\n$$";
          result = "<p>This is broken <code>$$</code></p>\n<span class='math'>\n <script type='math/tex; mode=display'>\n   a+b\n </script>\n</span>";
          return compareHTML(content, result);
        });
      });
    });
  });

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL2hvbWUvbWFyY3VzLy5hdG9tL3BhY2thZ2VzL21hcmtkb3duLXByZXZpZXctcGx1cy9zcGVjL21hcmtkb3duLXByZXZpZXctcmVuZGVyZXItbWF0aC1zcGVjLmNvZmZlZSJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQUFBLE1BQUE7O0VBQUEsVUFBQSxHQUFhLE9BQUEsQ0FBUSwyQkFBUjs7RUFDYixPQUFBLEdBQVUsT0FBQSxDQUFRLFNBQVI7O0VBRVYsT0FBQSxDQUFRLGVBQVI7O0VBRUEsVUFBQSxHQUFhOztFQUViLFdBQUEsR0FBYyxTQUFDLEdBQUQsRUFBTSxHQUFOO0lBRVosR0FBQSxHQUFNLFVBQVUsQ0FBQyxNQUFYLENBQWtCLEdBQWxCLEVBQXVCLFVBQXZCO0lBRU4sR0FBQSxHQUFNLEdBQUcsQ0FBQyxPQUFKLENBQVksUUFBWixFQUFzQixFQUF0QjtJQUVOLEdBQUEsR0FBTSxHQUFHLENBQUMsT0FBSixDQUFZLFFBQVosRUFBc0IsRUFBdEI7V0FFTixNQUFBLENBQU8sR0FBUCxDQUFXLENBQUMsT0FBWixDQUFvQixHQUFwQjtFQVJZOztFQVVkLFFBQUEsQ0FBUyx5QkFBVCxFQUFvQyxTQUFBO0FBQ2xDLFFBQUE7SUFBQyxVQUFXO0lBRVosVUFBQSxDQUFXLFNBQUE7TUFDVCxPQUFBLEdBQVU7YUFDVixVQUFBLEdBQWE7SUFGSixDQUFYO0lBSUEsRUFBQSxDQUFHLDBCQUFILEVBQStCLFNBQUE7QUFFN0IsVUFBQTtNQUFBLE9BQUEsR0FBVTtNQWNWLE1BQUEsR0FBVTthQVNWLFdBQUEsQ0FBWSxPQUFaLEVBQXFCLE1BQXJCO0lBekI2QixDQUEvQjtJQTJCQSxRQUFBLENBQVMsbURBQVQsRUFBOEQsU0FBQTtNQUU1RCxFQUFBLENBQUcsNkJBQUgsRUFBa0MsU0FBQTtlQUNoQyxJQUFBLENBQUssU0FBQTtBQUVILGNBQUE7VUFBQSxPQUFBLEdBQVU7VUFFVixNQUFBLEdBQVM7aUJBRVQsV0FBQSxDQUFZLE9BQVosRUFBcUIsTUFBckI7UUFORyxDQUFMO01BRGdDLENBQWxDO01BU0EsRUFBQSxDQUFHLDZCQUFILEVBQWtDLFNBQUE7ZUFDaEMsSUFBQSxDQUFLLFNBQUE7QUFFSCxjQUFBO1VBQUEsT0FBQSxHQUFVO1VBRVYsTUFBQSxHQUFTO2lCQUVULFdBQUEsQ0FBWSxPQUFaLEVBQXFCLE1BQXJCO1FBTkcsQ0FBTDtNQURnQyxDQUFsQzthQVNBLEVBQUEsQ0FBRyx1Q0FBSCxFQUE0QyxTQUFBO2VBQzFDLElBQUEsQ0FBSyxTQUFBO0FBRUgsY0FBQTtVQUFBLE9BQUEsR0FBVTtVQUVWLE1BQUEsR0FBUztpQkFFVCxXQUFBLENBQVksT0FBWixFQUFxQixNQUFyQjtRQU5HLENBQUw7TUFEMEMsQ0FBNUM7SUFwQjRELENBQTlEO0lBOEJBLFFBQUEsQ0FBUyw4Q0FBVCxFQUF5RCxTQUFBO01BRXZELEVBQUEsQ0FBRyx1QkFBSCxFQUE0QixTQUFBO2VBQzFCLElBQUEsQ0FBSyxTQUFBO0FBRUgsY0FBQTtVQUFBLE9BQUEsR0FBVTtVQWlCVixNQUFBLEdBQVU7aUJBWVYsV0FBQSxDQUFZLE9BQVosRUFBcUIsTUFBckI7UUEvQkcsQ0FBTDtNQUQwQixDQUE1QjtNQWtDQSxRQUFBLENBQVMsMkJBQVQsRUFBc0MsU0FBQTtRQUdwQyxHQUFBLENBQUksc0JBQUosRUFBNEIsU0FBQTtpQkFDMUIsSUFBQSxDQUFLLFNBQUE7QUFFSCxnQkFBQTtZQUFBLE9BQUEsR0FBVTtZQVFWLE1BQUEsR0FBUzttQkFFVCxXQUFBLENBQVksT0FBWixFQUFxQixNQUFyQjtVQVpHLENBQUw7UUFEMEIsQ0FBNUI7UUFlQSxFQUFBLENBQUcsZ0RBQUgsRUFBcUQsU0FBQTtpQkFDbkQsSUFBQSxDQUFLLFNBQUE7QUFFSCxnQkFBQTtZQUFBLE9BQUEsR0FBVTtZQUVWLE1BQUEsR0FBUzttQkFFVCxXQUFBLENBQVksT0FBWixFQUFxQixNQUFyQjtVQU5HLENBQUw7UUFEbUQsQ0FBckQ7UUFTQSxFQUFBLENBQUcsNEJBQUgsRUFBaUMsU0FBQTtpQkFDL0IsSUFBQSxDQUFLLFNBQUE7QUFFSCxnQkFBQTtZQUFBLE9BQUEsR0FBVTtZQVNWLE1BQUEsR0FBUzttQkFFVCxXQUFBLENBQVksT0FBWixFQUFxQixNQUFyQjtVQWJHLENBQUw7UUFEK0IsQ0FBakM7ZUFnQkEsRUFBQSxDQUFHLHlCQUFILEVBQThCLFNBQUE7aUJBQzVCLElBQUEsQ0FBSyxTQUFBO0FBRUgsZ0JBQUE7WUFBQSxPQUFBLEdBQVU7WUFFVixNQUFBLEdBQVM7bUJBRVQsV0FBQSxDQUFZLE9BQVosRUFBcUIsTUFBckI7VUFORyxDQUFMO1FBRDRCLENBQTlCO01BM0NvQyxDQUF0QzthQW9EQSxRQUFBLENBQVMsYUFBVCxFQUF3QixTQUFBO1FBRXRCLEVBQUEsQ0FBRywwQkFBSCxFQUErQixTQUFBO2lCQUM3QixJQUFBLENBQUssU0FBQTtBQUVILGdCQUFBO1lBQUEsT0FBQSxHQUFVO1lBTVYsTUFBQSxHQUFTO21CQUVULFdBQUEsQ0FBWSxPQUFaLEVBQXFCLE1BQXJCO1VBVkcsQ0FBTDtRQUQ2QixDQUEvQjtRQWFBLEVBQUEsQ0FBRywwQkFBSCxFQUErQixTQUFBO2lCQUM3QixJQUFBLENBQUssU0FBQTtBQUVILGdCQUFBO1lBQUEsT0FBQSxHQUFVO1lBRVYsTUFBQSxHQUFTO21CQUVULFdBQUEsQ0FBWSxPQUFaLEVBQXFCLE1BQXJCO1VBTkcsQ0FBTDtRQUQ2QixDQUEvQjtRQVNBLEVBQUEsQ0FBRyx5Q0FBSCxFQUE4QyxTQUFBO2lCQUM1QyxJQUFBLENBQUssU0FBQTtBQUVILGdCQUFBO1lBQUEsT0FBQSxHQUFVO1lBT1YsTUFBQSxHQUFTO21CQUVULFdBQUEsQ0FBWSxPQUFaLEVBQXFCLE1BQXJCO1VBWEcsQ0FBTDtRQUQ0QyxDQUE5QztRQWNBLEVBQUEsQ0FBRywyQkFBSCxFQUFnQyxTQUFBO2lCQUM5QixJQUFBLENBQUssU0FBQTtBQUVILGdCQUFBO1lBQUEsT0FBQSxHQUFVO1lBTVYsTUFBQSxHQUFTO21CQUVULFdBQUEsQ0FBWSxPQUFaLEVBQXFCLE1BQXJCO1VBVkcsQ0FBTDtRQUQ4QixDQUFoQztRQWFBLEVBQUEsQ0FBRywyQkFBSCxFQUFnQyxTQUFBO2lCQUM5QixJQUFBLENBQUssU0FBQTtBQUVILGdCQUFBO1lBQUEsT0FBQSxHQUFVO1lBRVYsTUFBQSxHQUFTO21CQUVULFdBQUEsQ0FBWSxPQUFaLEVBQXFCLE1BQXJCO1VBTkcsQ0FBTDtRQUQ4QixDQUFoQztlQVNBLEVBQUEsQ0FBRywwQ0FBSCxFQUErQyxTQUFBO2lCQUM3QyxJQUFBLENBQUssU0FBQTtBQUVILGdCQUFBO1lBQUEsT0FBQSxHQUFVO1lBT1YsTUFBQSxHQUFTO21CQUVULFdBQUEsQ0FBWSxPQUFaLEVBQXFCLE1BQXJCO1VBWEcsQ0FBTDtRQUQ2QyxDQUEvQztNQTVEc0IsQ0FBeEI7SUF4RnVELENBQXpEO1dBbUtBLFFBQUEsQ0FBUyxzQkFBVCxFQUFpQyxTQUFBO01BRS9CLEVBQUEsQ0FBRyxxREFBSCxFQUEwRCxTQUFBO2VBQ3hELElBQUEsQ0FBSyxTQUFBO0FBRUgsY0FBQTtVQUFBLE9BQUEsR0FBVTtVQU1WLE1BQUEsR0FBUztpQkFFVCxXQUFBLENBQVksT0FBWixFQUFxQixNQUFyQjtRQVZHLENBQUw7TUFEd0QsQ0FBMUQ7TUFhQSxFQUFBLENBQUcsMERBQUgsRUFBK0QsU0FBQTtlQUM3RCxJQUFBLENBQUssU0FBQTtBQUVILGNBQUE7VUFBQSxPQUFBLEdBQVU7VUFXVixNQUFBLEdBQVM7aUJBV1QsV0FBQSxDQUFZLE9BQVosRUFBcUIsTUFBckI7UUF4QkcsQ0FBTDtNQUQ2RCxDQUEvRDtNQTJCQSxFQUFBLENBQUcsOENBQUgsRUFBbUQsU0FBQTtlQUNqRCxJQUFBLENBQUssU0FBQTtBQUVILGNBQUE7VUFBQSxPQUFBLEdBQVU7VUFFVixNQUFBLEdBQVM7aUJBUVQsV0FBQSxDQUFZLE9BQVosRUFBcUIsTUFBckI7UUFaRyxDQUFMO01BRGlELENBQW5EO01BZUEsRUFBQSxDQUFHLHNEQUFILEVBQTJELFNBQUE7ZUFDekQsSUFBQSxDQUFLLFNBQUE7QUFFSCxjQUFBO1VBQUEsT0FBQSxHQUFVO1VBRVYsTUFBQSxHQUFTO2lCQVFULFdBQUEsQ0FBWSxPQUFaLEVBQXFCLE1BQXJCO1FBWkcsQ0FBTDtNQUR5RCxDQUEzRDthQWVBLEVBQUEsQ0FBRyx1Q0FBSCxFQUE0QyxTQUFBO2VBQzFDLElBQUEsQ0FBSyxTQUFBO0FBRUgsY0FBQTtVQUFBLE9BQUEsR0FBVTtVQVFWLE1BQUEsR0FBUztpQkFTVCxXQUFBLENBQVksT0FBWixFQUFxQixNQUFyQjtRQW5CRyxDQUFMO01BRDBDLENBQTVDO0lBeEUrQixDQUFqQztFQW5Pa0MsQ0FBcEM7QUFqQkEiLCJzb3VyY2VzQ29udGVudCI6WyJtYXJrZG93bkl0ID0gcmVxdWlyZSAnLi4vbGliL21hcmtkb3duLWl0LWhlbHBlcidcbmNoZWVyaW8gPSByZXF1aXJlICdjaGVlcmlvJ1xuXG5yZXF1aXJlICcuL3NwZWMtaGVscGVyJ1xuXG5yZW5kZXJNYXRoID0gZmFsc2VcblxuY29tcGFyZUhUTUwgPSAob25lLCB0d28pIC0+XG5cbiAgb25lID0gbWFya2Rvd25JdC5yZW5kZXIob25lLCByZW5kZXJNYXRoKVxuXG4gIG9uZSA9IG9uZS5yZXBsYWNlKC9cXG5cXHMqL2csICcnKVxuXG4gIHR3byA9IHR3by5yZXBsYWNlKC9cXG5cXHMqL2csICcnKVxuXG4gIGV4cGVjdChvbmUpLnRvRXF1YWwodHdvKVxuXG5kZXNjcmliZSBcIk1hcmtkb3duSXRIZWxwZXIgKE1hdGgpXCIsIC0+XG4gIFtjb250ZW50XSA9IFtdXG5cbiAgYmVmb3JlRWFjaCAtPlxuICAgIGNvbnRlbnQgPSBudWxsXG4gICAgcmVuZGVyTWF0aCA9IHRydWVcblxuICBpdCBcIk1hdGggaW4gbWFya2Rvd24gaW5saW5lc1wiLCAtPlxuXG4gICAgY29udGVudCA9IFwiXCJcIlxuICAgICAgICAgICAgICAjIE1hdGggJHheMiQgaW4gaGVhZGluZyAxXG5cbiAgICAgICAgICAgICAgX21hdGggJHheMiQgaW4gZW1waGFzaXNfXG5cbiAgICAgICAgICAgICAgKiptYXRoICR4XjIkIGluIGJvbGQqKlxuXG4gICAgICAgICAgICAgIFttYXRoICR4XjIkIGluIGxpbmtdKGh0dHA6Ly93d3cubWF0aGpheC5vcmcvKVxuXG4gICAgICAgICAgICAgIGBtYXRoICR4XjIkIGluIGNvZGVgXG5cbiAgICAgICAgICAgICAgfn5tYXRoICR4XjIkIGluIHN0cmlrZXRocm91Z2h+flxuICAgICAgICAgICAgICBcIlwiXCJcblxuICAgIHJlc3VsdCA9ICBcIlwiXCJcbiAgICAgICAgICAgICAgPGgxPk1hdGggPHNwYW4gY2xhc3M9J21hdGgnPjxzY3JpcHQgdHlwZT0nbWF0aC90ZXgnPnheMjwvc2NyaXB0Pjwvc3Bhbj4gaW4gaGVhZGluZyAxPC9oMT5cbiAgICAgICAgICAgICAgPHA+PGVtPm1hdGggPHNwYW4gY2xhc3M9J21hdGgnPjxzY3JpcHQgdHlwZT0nbWF0aC90ZXgnPnheMjwvc2NyaXB0Pjwvc3Bhbj4gaW4gZW1waGFzaXM8L2VtPjwvcD5cbiAgICAgICAgICAgICAgPHA+PHN0cm9uZz5tYXRoIDxzcGFuIGNsYXNzPSdtYXRoJz48c2NyaXB0IHR5cGU9J21hdGgvdGV4Jz54XjI8L3NjcmlwdD48L3NwYW4+IGluIGJvbGQ8L3N0cm9uZz48L3A+XG4gICAgICAgICAgICAgIDxwPjxhIGhyZWY9XCJodHRwOi8vd3d3Lm1hdGhqYXgub3JnL1wiPm1hdGggPHNwYW4gY2xhc3M9J21hdGgnPjxzY3JpcHQgdHlwZT0nbWF0aC90ZXgnPnheMjwvc2NyaXB0Pjwvc3Bhbj4gaW4gbGluazwvYT48L3A+XG4gICAgICAgICAgICAgIDxwPjxjb2RlPm1hdGggJHheMiQgaW4gY29kZTwvY29kZT48L3A+XG4gICAgICAgICAgICAgIDxwPjxzPm1hdGggPHNwYW4gY2xhc3M9J21hdGgnPjxzY3JpcHQgdHlwZT0nbWF0aC90ZXgnPnheMjwvc2NyaXB0Pjwvc3Bhbj4gaW4gc3RyaWtldGhyb3VnaDwvcz48L3A+XG4gICAgICAgICAgICAgIFwiXCJcIlxuXG4gICAgY29tcGFyZUhUTUwoY29udGVudCwgcmVzdWx0KVxuXG4gIGRlc2NyaWJlIFwiSW50ZXJmZXJlbmNlIHdpdGggbWFya2Rvd24gc3ludGF4IChmcm9tIGlzc3VlLTE4KVwiLCAtPlxuXG4gICAgaXQgXCJzaG91bGQgbm90IGludGVyZmVyZSB3aXRoICpcIiwgLT5cbiAgICAgIHJ1bnMgLT5cblxuICAgICAgICBjb250ZW50ID0gXCJUaGlzICQoZipnKmgpKHgpJCBpcyBubyBjb25mbGljdFwiXG5cbiAgICAgICAgcmVzdWx0ID0gXCI8cD5UaGlzIDxzcGFuIGNsYXNzPSdtYXRoJz48c2NyaXB0IHR5cGU9J21hdGgvdGV4Jz4oZipnKmgpKHgpPC9zY3JpcHQ+PC9zcGFuPiBpcyBubyBjb25mbGljdDwvcD5cIlxuXG4gICAgICAgIGNvbXBhcmVIVE1MKGNvbnRlbnQsIHJlc3VsdClcblxuICAgIGl0IFwic2hvdWxkIG5vdCBpbnRlcmZlcmUgd2l0aCBfXCIsIC0+XG4gICAgICBydW5zIC0+XG5cbiAgICAgICAgY29udGVudCA9IFwiVGhpcyAkeF8xLCB4XzIsIFxcXFxkb3RzLCB4X04kIGlzIG5vIGNvbmZsaWN0XCJcblxuICAgICAgICByZXN1bHQgPSBcIjxwPlRoaXMgPHNwYW4gY2xhc3M9J21hdGgnPjxzY3JpcHQgdHlwZT0nbWF0aC90ZXgnPnhfMSwgeF8yLCBcXFxcZG90cywgeF9OPC9zY3JpcHQ+PC9zcGFuPiBpcyBubyBjb25mbGljdDwvcD5cIlxuXG4gICAgICAgIGNvbXBhcmVIVE1MKGNvbnRlbnQsIHJlc3VsdClcblxuICAgIGl0IFwic2hvdWxkIG5vdCBpbnRlcmZlcmUgd2l0aCBsaW5rIHN5bnRheFwiLCAtPlxuICAgICAgcnVucyAtPlxuXG4gICAgICAgIGNvbnRlbnQgPSBcIlRoaXMgJFthK2JdKGMrZCkkIGlzIG5vIGNvbmZsaWN0XCJcblxuICAgICAgICByZXN1bHQgPSBcIjxwPlRoaXMgPHNwYW4gY2xhc3M9J21hdGgnPjxzY3JpcHQgdHlwZT0nbWF0aC90ZXgnPlthK2JdKGMrZCk8L3NjcmlwdD48L3NwYW4+IGlzIG5vIGNvbmZsaWN0PC9wPlwiXG5cbiAgICAgICAgY29tcGFyZUhUTUwoY29udGVudCwgcmVzdWx0KVxuXG5cbiAgZGVzY3JpYmUgXCJFeGFtcGxlcyBmcm9tIHN0cmVzc3Rlc3QgZG9jdW1lbnQgKGlzc3VlLTE4KVwiLCAtPlxuXG4gICAgaXQgXCJzZXZlcmFsIHRleCBmdW5jdGlvbnNcIiwgLT5cbiAgICAgIHJ1bnMgLT5cblxuICAgICAgICBjb250ZW50ID0gXCJcIlwiXG4gICAgICAgICAgICAgICAgICAkayBcXFxcdGltZXMgayQsICRuIFxcXFx0aW1lcyAyJCwgJDIgXFxcXHRpbWVzIG4kLCAkXFxcXHRpbWVzJFxuXG4gICAgICAgICAgICAgICAgICAkeCBcXFxcY2RvdCB5JCwgJFxcXFxjZG90JFxuXG4gICAgICAgICAgICAgICAgICAkXFxcXHNxcnR7eF4yK3leMit6XjJ9JFxuXG4gICAgICAgICAgICAgICAgICAkXFxcXGFscGhhIFxcXFxiZXRhIFxcXFxnYW1tYSRcblxuICAgICAgICAgICAgICAgICAgJCRcbiAgICAgICAgICAgICAgICAgIFxcXFxiZWdpbnthbGlnbmVkfVxuICAgICAgICAgICAgICAgICAgeFxcXFwgJj0geVxcXFxcXFxcXG4gICAgICAgICAgICAgICAgICBtY14yXFxcXCAmPSBFXG4gICAgICAgICAgICAgICAgICBcXFxcZW5ke2FsaWduZWR9XG4gICAgICAgICAgICAgICAgICAkJFxuICAgICAgICAgICAgICAgICAgXCJcIlwiXG5cbiAgICAgICAgcmVzdWx0ID0gIFwiXCJcIlxuICAgICAgICAgICAgICAgICAgPHA+PHNwYW4gY2xhc3M9J21hdGgnPjxzY3JpcHQgdHlwZT0nbWF0aC90ZXgnPmsgXFxcXHRpbWVzIGs8L3NjcmlwdD48L3NwYW4+LCA8c3BhbiBjbGFzcz0nbWF0aCc+PHNjcmlwdCB0eXBlPSdtYXRoL3RleCc+biBcXFxcdGltZXMgMjwvc2NyaXB0Pjwvc3Bhbj4sIDxzcGFuIGNsYXNzPSdtYXRoJz48c2NyaXB0IHR5cGU9J21hdGgvdGV4Jz4yIFxcXFx0aW1lcyBuPC9zY3JpcHQ+PC9zcGFuPiwgPHNwYW4gY2xhc3M9J21hdGgnPjxzY3JpcHQgdHlwZT0nbWF0aC90ZXgnPlxcXFx0aW1lczwvc2NyaXB0Pjwvc3Bhbj48L3A+XG4gICAgICAgICAgICAgICAgICA8cD48c3BhbiBjbGFzcz0nbWF0aCc+PHNjcmlwdCB0eXBlPSdtYXRoL3RleCc+eCBcXFxcY2RvdCB5PC9zY3JpcHQ+PC9zcGFuPiwgPHNwYW4gY2xhc3M9J21hdGgnPjxzY3JpcHQgdHlwZT0nbWF0aC90ZXgnPlxcXFxjZG90PC9zY3JpcHQ+PC9zcGFuPjwvcD5cbiAgICAgICAgICAgICAgICAgIDxwPjxzcGFuIGNsYXNzPSdtYXRoJz48c2NyaXB0IHR5cGU9J21hdGgvdGV4Jz5cXFxcc3FydHt4XjIreV4yK3peMn08L3NjcmlwdD48L3NwYW4+PC9wPlxuICAgICAgICAgICAgICAgICAgPHA+PHNwYW4gY2xhc3M9J21hdGgnPjxzY3JpcHQgdHlwZT0nbWF0aC90ZXgnPlxcXFxhbHBoYSBcXFxcYmV0YSBcXFxcZ2FtbWE8L3NjcmlwdD48L3NwYW4+PC9wPlxuICAgICAgICAgICAgICAgICAgPHNwYW4gY2xhc3M9J21hdGgnPjxzY3JpcHQgdHlwZT0nbWF0aC90ZXg7IG1vZGU9ZGlzcGxheSc+XFxcXGJlZ2lue2FsaWduZWR9XG4gICAgICAgICAgICAgICAgICB4XFxcXCAmPSB5XFxcXFxcXFxcbiAgICAgICAgICAgICAgICAgIG1jXjJcXFxcICY9IEVcbiAgICAgICAgICAgICAgICAgIFxcXFxlbmR7YWxpZ25lZH1cbiAgICAgICAgICAgICAgICAgIDwvc2NyaXB0Pjwvc3Bhbj5cbiAgICAgICAgICAgICAgICAgIFwiXCJcIlxuXG4gICAgICAgIGNvbXBhcmVIVE1MKGNvbnRlbnQsIHJlc3VsdClcblxuICAgIGRlc2NyaWJlIFwiRXNjYXBlZCBNYXRoIGVudmlyb25tZW50c1wiLCAtPlxuXG4gICAgICAjIERpc2FibGVkIGFzIG1hcmtkb3duLWl0LW1hdGggZG9lcyBub3Qgc3VwcG9ydCBpdFxuICAgICAgeGl0IFwiRW1wdHkgbGluZXMgYWZ0ZXIgJCRcIiwgLT5cbiAgICAgICAgcnVucyAtPlxuXG4gICAgICAgICAgY29udGVudCA9IFwiXCJcIlxuICAgICAgICAgICAgICAgICAgICAkJFxuXG4gICAgICAgICAgICAgICAgICAgIHNob3VsZCBiZSBlc2NhcGVkXG5cbiAgICAgICAgICAgICAgICAgICAgJCRcbiAgICAgICAgICAgICAgICAgICAgXCJcIlwiXG5cbiAgICAgICAgICByZXN1bHQgPSBcIjxwPiQkPC9wPjxwPnNob3VsZCBiZSBlc2NhcGVkPC9wPjxwPiQkPC9wPlwiXG5cbiAgICAgICAgICBjb21wYXJlSFRNTChjb250ZW50LCByZXN1bHQpXG5cbiAgICAgIGl0IFwiSW5saW5lIE1hdGggd2l0aG91dCBwcm9wZXIgb3BlbmluZyBhbmQgY2xvc2luZ1wiLCAtPlxuICAgICAgICBydW5zIC0+XG5cbiAgICAgICAgICBjb250ZW50ID0gXCJhICQ1LCBhICQxMCBhbmQgYSBcXFxcJDEwMCBCaWxsLlwiXG5cbiAgICAgICAgICByZXN1bHQgPSAnPHA+YSAkNSwgYSAkMTAgYW5kIGEgJDEwMCBCaWxsLjwvcD4nXG5cbiAgICAgICAgICBjb21wYXJlSFRNTChjb250ZW50LCByZXN1bHQpXG5cbiAgICAgIGl0IFwiRG91YmxlIGVzY2FwZWQgXFxcXFsgYW5kIFxcXFwoXCIsIC0+XG4gICAgICAgIHJ1bnMgLT5cblxuICAgICAgICAgIGNvbnRlbnQgPSBcIlwiXCJcblxuICAgICAgICAgICAgICAgICAgICBcXFxcXFxcXFtcbiAgICAgICAgICAgICAgICAgICAgICB4K3lcbiAgICAgICAgICAgICAgICAgICAgXFxcXF1cblxuICAgICAgICAgICAgICAgICAgICBcXFxcXFxcXCh4K3lcXFxcKVxuICAgICAgICAgICAgICAgICAgICBcIlwiXCJcblxuICAgICAgICAgIHJlc3VsdCA9IFwiPHA+XFxcXFt4K3ldPC9wPjxwPlxcXFwoeCt5KTwvcD5cIlxuXG4gICAgICAgICAgY29tcGFyZUhUTUwoY29udGVudCwgcmVzdWx0KVxuXG4gICAgICBpdCBcIkluIGlubGluZSBjb2RlIGV4YW1wbGVzXCIsIC0+XG4gICAgICAgIHJ1bnMgLT5cblxuICAgICAgICAgIGNvbnRlbnQgPSBcImBcXFxcJGAsIGBcXFxcWyBcXFxcXWAsIGAkeCRgXCJcblxuICAgICAgICAgIHJlc3VsdCA9IFwiPHA+PGNvZGU+XFxcXCQ8L2NvZGU+LCA8Y29kZT5cXFxcWyBcXFxcXTwvY29kZT4sIDxjb2RlPiR4JDwvY29kZT48L3A+XCJcblxuICAgICAgICAgIGNvbXBhcmVIVE1MKGNvbnRlbnQsIHJlc3VsdClcblxuICAgIGRlc2NyaWJlIFwiTWF0aCBCbG9ja3NcIiwgLT5cblxuICAgICAgaXQgXCIkJCBzaG91bGQgd29yayBtdWx0aWxpbmVcIiwgLT5cbiAgICAgICAgcnVucyAtPlxuXG4gICAgICAgICAgY29udGVudCA9IFwiXCJcIlxuICAgICAgICAgICAgICAgICAgICAkJFxuICAgICAgICAgICAgICAgICAgICBhK2JcbiAgICAgICAgICAgICAgICAgICAgJCRcbiAgICAgICAgICAgICAgICAgICAgXCJcIlwiXG5cbiAgICAgICAgICByZXN1bHQgPSBcIjxzcGFuIGNsYXNzPSdtYXRoJz48c2NyaXB0IHR5cGU9J21hdGgvdGV4OyBtb2RlPWRpc3BsYXknPmErYjwvc2NyaXB0Pjwvc3Bhbj5cIlxuXG4gICAgICAgICAgY29tcGFyZUhUTUwoY29udGVudCwgcmVzdWx0KVxuXG4gICAgICBpdCBcIiQkIHNob3VsZCB3b3JrIHNpbmdlbGluZVwiLCAtPlxuICAgICAgICBydW5zIC0+XG5cbiAgICAgICAgICBjb250ZW50ID0gXCIkJGErYiQkXCJcblxuICAgICAgICAgIHJlc3VsdCA9IFwiPHNwYW4gY2xhc3M9J21hdGgnPjxzY3JpcHQgdHlwZT0nbWF0aC90ZXg7IG1vZGU9ZGlzcGxheSc+YStiPC9zY3JpcHQ+PC9zcGFuPlwiXG5cbiAgICAgICAgICBjb21wYXJlSFRNTChjb250ZW50LCByZXN1bHQpXG5cbiAgICAgIGl0IFwiJCQgc2hvdWxkIHdvcmsgZGlyZWN0bHkgYWZ0ZXIgcGFyYWdyYXBoXCIsIC0+XG4gICAgICAgIHJ1bnMgLT5cblxuICAgICAgICAgIGNvbnRlbnQgPSBcIlwiXCJcbiAgICAgICAgICAgICAgICAgICAgVGVzdFxuICAgICAgICAgICAgICAgICAgICAkJFxuICAgICAgICAgICAgICAgICAgICBhK2JcbiAgICAgICAgICAgICAgICAgICAgJCRcbiAgICAgICAgICAgICAgICAgICAgXCJcIlwiXG5cbiAgICAgICAgICByZXN1bHQgPSBcIjxwPlRlc3Q8L3A+PHNwYW4gY2xhc3M9J21hdGgnPjxzY3JpcHQgdHlwZT0nbWF0aC90ZXg7IG1vZGU9ZGlzcGxheSc+YStiPC9zY3JpcHQ+PC9zcGFuPlwiXG5cbiAgICAgICAgICBjb21wYXJlSFRNTChjb250ZW50LCByZXN1bHQpXG5cbiAgICAgIGl0IFwiXFxcXFsgc2hvdWxkIHdvcmsgbXVsdGlsaW5lXCIsIC0+XG4gICAgICAgIHJ1bnMgLT5cblxuICAgICAgICAgIGNvbnRlbnQgPSBcIlwiXCJcbiAgICAgICAgICAgICAgICAgICAgXFxcXFtcbiAgICAgICAgICAgICAgICAgICAgYStiXG4gICAgICAgICAgICAgICAgICAgIFxcXFxdXG4gICAgICAgICAgICAgICAgICAgIFwiXCJcIlxuXG4gICAgICAgICAgcmVzdWx0ID0gXCI8c3BhbiBjbGFzcz0nbWF0aCc+PHNjcmlwdCB0eXBlPSdtYXRoL3RleDsgbW9kZT1kaXNwbGF5Jz5hK2I8L3NjcmlwdD48L3NwYW4+XCJcblxuICAgICAgICAgIGNvbXBhcmVIVE1MKGNvbnRlbnQsIHJlc3VsdClcblxuICAgICAgaXQgXCJcXFxcWyBzaG91bGQgd29yayBzaW5nZWxpbmVcIiwgLT5cbiAgICAgICAgcnVucyAtPlxuXG4gICAgICAgICAgY29udGVudCA9IFwiXFxcXFthK2JcXFxcXVwiXG5cbiAgICAgICAgICByZXN1bHQgPSBcIjxzcGFuIGNsYXNzPSdtYXRoJz48c2NyaXB0IHR5cGU9J21hdGgvdGV4OyBtb2RlPWRpc3BsYXknPmErYjwvc2NyaXB0Pjwvc3Bhbj5cIlxuXG4gICAgICAgICAgY29tcGFyZUhUTUwoY29udGVudCwgcmVzdWx0KVxuXG4gICAgICBpdCBcIlxcXFxbIHNob3VsZCB3b3JrIGRpcmVjdGx5IGFmdGVyIHBhcmFncmFwaFwiLCAtPlxuICAgICAgICBydW5zIC0+XG5cbiAgICAgICAgICBjb250ZW50ID0gXCJcIlwiXG4gICAgICAgICAgICAgICAgICAgIFRlc3RcbiAgICAgICAgICAgICAgICAgICAgXFxcXFtcbiAgICAgICAgICAgICAgICAgICAgYStiXG4gICAgICAgICAgICAgICAgICAgIFxcXFxdXG4gICAgICAgICAgICAgICAgICAgIFwiXCJcIlxuXG4gICAgICAgICAgcmVzdWx0ID0gXCI8cD5UZXN0PC9wPjxzcGFuIGNsYXNzPSdtYXRoJz48c2NyaXB0IHR5cGU9J21hdGgvdGV4OyBtb2RlPWRpc3BsYXknPmErYjwvc2NyaXB0Pjwvc3Bhbj5cIlxuXG4gICAgICAgICAgY29tcGFyZUhUTUwoY29udGVudCwgcmVzdWx0KVxuXG5cbiAgZGVzY3JpYmUgXCJFeGFtcGxlcyBmcm9tIGlzc3Vlc1wiLCAtPlxuXG4gICAgaXQgXCJzaG91bGQgcmVzcGVjdCBlc2NhcGVkIGRvbGxhciBpbnNpZGUgY29kZSAoaXNzdWUtMylcIiwgLT5cbiAgICAgIHJ1bnMgLT5cblxuICAgICAgICBjb250ZW50ID0gXCJcIlwiXG4gICAgICAgICAgICAgICAgICBgYGBcbiAgICAgICAgICAgICAgICAgIFxcXFwkXG4gICAgICAgICAgICAgICAgICBgYGBcbiAgICAgICAgICAgICAgICAgIFwiXCJcIlxuXG4gICAgICAgIHJlc3VsdCA9ICc8cHJlPjxjb2RlPlxcXFwkPC9jb2RlPjwvcHJlPidcblxuICAgICAgICBjb21wYXJlSFRNTChjb250ZW50LCByZXN1bHQpXG5cbiAgICBpdCBcInNob3VsZCByZXNwZWN0IGVzY2FwZWQgZG9sbGFyIGluc2lkZSBjb2RlIChtcC1pc3N1ZS0xMTYpXCIsIC0+XG4gICAgICBydW5zIC0+XG5cbiAgICAgICAgY29udGVudCA9IFwiXCJcIlxuICAgICAgICAgICAgICAgICAgc3RhcnRcblxuICAgICAgICAgICAgICAgICAgYGBgXG4gICAgICAgICAgICAgICAgICAkZmdmXG4gICAgICAgICAgICAgICAgICBgYGBcblxuICAgICAgICAgICAgICAgICAgXFxcXCQgYXNkXG4gICAgICAgICAgICAgICAgICAkeCRcbiAgICAgICAgICAgICAgICAgIFwiXCJcIlxuXG4gICAgICAgIHJlc3VsdCA9IFwiXCJcIlxuICAgICAgICAgICAgICAgICA8cD5zdGFydDwvcD5cbiAgICAgICAgICAgICAgICAgPHByZT48Y29kZT4kZmdmPC9jb2RlPjwvcHJlPlxuICAgICAgICAgICAgICAgICA8cD5cbiAgICAgICAgICAgICAgICAgICAkIGFzZFxuICAgICAgICAgICAgICAgICAgIDxzcGFuIGNsYXNzPSdtYXRoJz5cbiAgICAgICAgICAgICAgICAgICAgIDxzY3JpcHQgdHlwZT0nbWF0aC90ZXgnPng8L3NjcmlwdD5cbiAgICAgICAgICAgICAgICAgICA8L3NwYW4+XG4gICAgICAgICAgICAgICAgIDwvcD5cbiAgICAgICAgICAgICAgICAgXCJcIlwiXG5cbiAgICAgICAgY29tcGFyZUhUTUwoY29udGVudCwgcmVzdWx0KVxuXG4gICAgaXQgXCJzaG91bGQgcmVuZGVyIGlubGluZSBtYXRoIHdpdGggXFxcXCggKGlzc3VlLTcpXCIsIC0+XG4gICAgICBydW5zIC0+XG5cbiAgICAgICAgY29udGVudCA9IFwiVGhpcyBzaG91bGQgXFxcXCh4K3lcXFxcKSB3b3JrLlwiXG5cbiAgICAgICAgcmVzdWx0ID0gXCJcIlwiXG4gICAgICAgICAgICAgICAgIDxwPlxuICAgICAgICAgICAgICAgICAgVGhpcyBzaG91bGQgPHNwYW4gY2xhc3M9J21hdGgnPlxuICAgICAgICAgICAgICAgICAgICA8c2NyaXB0IHR5cGU9J21hdGgvdGV4Jz54K3k8L3NjcmlwdD5cbiAgICAgICAgICAgICAgICAgIDwvc3Bhbj4gd29yay5cbiAgICAgICAgICAgICAgICAgPC9wPlxuICAgICAgICAgICAgICAgICBcIlwiXCJcblxuICAgICAgICBjb21wYXJlSFRNTChjb250ZW50LCByZXN1bHQpXG5cbiAgICBpdCBcInNob3VsZCByZW5kZXIgaW5saW5lIG1hdGggd2l0aCBOXFxcXHRpbWVzIE4gKGlzc3VlLTE3KVwiLCAtPlxuICAgICAgcnVucyAtPlxuXG4gICAgICAgIGNvbnRlbnQgPSBcIkFuICROXFxcXHRpbWVzIE4kIGdyaWQuXCJcblxuICAgICAgICByZXN1bHQgPSBcIlwiXCJcbiAgICAgICAgICAgICAgICAgPHA+XG4gICAgICAgICAgICAgICAgICBBbiA8c3BhbiBjbGFzcz0nbWF0aCc+XG4gICAgICAgICAgICAgICAgICAgIDxzY3JpcHQgdHlwZT0nbWF0aC90ZXgnPk5cXFxcdGltZXMgTjwvc2NyaXB0PlxuICAgICAgICAgICAgICAgICAgPC9zcGFuPiBncmlkLlxuICAgICAgICAgICAgICAgICA8L3A+XG4gICAgICAgICAgICAgICAgIFwiXCJcIlxuXG4gICAgICAgIGNvbXBhcmVIVE1MKGNvbnRlbnQsIHJlc3VsdClcblxuICAgIGl0IFwic2hvdWxkIHJlc3BlY3QgaW5saW5lIGNvZGUgKGlzc3VlLTIwKVwiLCAtPlxuICAgICAgcnVucyAtPlxuXG4gICAgICAgIGNvbnRlbnQgPSBcIlwiXCJcbiAgICAgICAgICAgICAgICAgIFRoaXMgaXMgYnJva2VuIGAkJGBcblxuICAgICAgICAgICAgICAgICAgJCRcbiAgICAgICAgICAgICAgICAgIGErYlxuICAgICAgICAgICAgICAgICAgJCRcbiAgICAgICAgICAgICAgICAgIFwiXCJcIlxuXG4gICAgICAgIHJlc3VsdCA9IFwiXCJcIlxuICAgICAgICAgICAgICAgICA8cD5UaGlzIGlzIGJyb2tlbiA8Y29kZT4kJDwvY29kZT48L3A+XG4gICAgICAgICAgICAgICAgIDxzcGFuIGNsYXNzPSdtYXRoJz5cbiAgICAgICAgICAgICAgICAgIDxzY3JpcHQgdHlwZT0nbWF0aC90ZXg7IG1vZGU9ZGlzcGxheSc+XG4gICAgICAgICAgICAgICAgICAgIGErYlxuICAgICAgICAgICAgICAgICAgPC9zY3JpcHQ+XG4gICAgICAgICAgICAgICAgIDwvc3Bhbj5cbiAgICAgICAgICAgICAgICAgXCJcIlwiXG5cbiAgICAgICAgY29tcGFyZUhUTUwoY29udGVudCwgcmVzdWx0KVxuIl19
