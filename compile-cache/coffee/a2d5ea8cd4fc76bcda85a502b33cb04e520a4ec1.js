(function() {
  var $, fs, mathjaxHelper, path, temp;

  $ = require('atom-space-pen-views').$;

  path = require('path');

  fs = require('fs-plus');

  temp = require('temp').track();

  mathjaxHelper = require('../lib/mathjax-helper');

  describe("MathJax helper module", function() {
    return describe("loading MathJax TeX macros", function() {
      var configDirPath, macros, macrosPath, ref, waitsForMacrosToLoad;
      ref = [], configDirPath = ref[0], macrosPath = ref[1], macros = ref[2];
      beforeEach(function() {
        configDirPath = temp.mkdirSync('atom-config-dir-');
        macrosPath = path.join(configDirPath, 'markdown-preview-plus.cson');
        spyOn(atom, 'getConfigDirPath').andReturn(configDirPath);
        jasmine.useRealClock();
        return mathjaxHelper.resetMathJax();
      });
      afterEach(function() {
        return mathjaxHelper.resetMathJax();
      });
      waitsForMacrosToLoad = function() {
        var span;
        span = [][0];
        waitsForPromise(function() {
          return atom.packages.activatePackage("markdown-preview-plus");
        });
        runs(function() {
          return mathjaxHelper.loadMathJax();
        });
        waitsFor("MathJax to load", function() {
          return typeof MathJax !== "undefined" && MathJax !== null;
        });
        runs(function() {
          var equation;
          span = document.createElement("span");
          equation = document.createElement("script");
          equation.type = "math/tex; mode=display";
          equation.textContent = "\\int_1^2";
          span.appendChild(equation);
          return mathjaxHelper.mathProcessor(span);
        });
        waitsFor("MathJax macros to be defined", function() {
          var ref1, ref2, ref3;
          return macros = (ref1 = MathJax.InputJax) != null ? (ref2 = ref1.TeX) != null ? (ref3 = ref2.Definitions) != null ? ref3.macros : void 0 : void 0 : void 0;
        });
        return waitsFor("MathJax to process span", function() {
          return span.childElementCount === 2;
        });
      };
      describe("when a macros file exists", function() {
        beforeEach(function() {
          var fixturesFile, fixturesPath;
          fixturesPath = path.join(__dirname, 'fixtures/macros.cson');
          fixturesFile = fs.readFileSync(fixturesPath, 'utf8');
          return fs.writeFileSync(macrosPath, fixturesFile);
        });
        it("loads valid macros", function() {
          waitsForMacrosToLoad();
          return runs(function() {
            expect(macros.macroOne).toBeDefined();
            return expect(macros.macroParamOne).toBeDefined();
          });
        });
        return it("doesn't load invalid macros", function() {
          waitsForMacrosToLoad();
          return runs(function() {
            expect(macros.macro1).toBeUndefined();
            expect(macros.macroTwo).toBeUndefined();
            expect(macros.macroParam1).toBeUndefined();
            return expect(macros.macroParamTwo).toBeUndefined();
          });
        });
      });
      return describe("when a macros file doesn't exist", function() {
        return it("creates a template macros file", function() {
          expect(fs.isFileSync(macrosPath)).toBe(false);
          waitsForMacrosToLoad();
          return runs(function() {
            return expect(fs.isFileSync(macrosPath)).toBe(true);
          });
        });
      });
    });
  });

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL2hvbWUvbWFyY3VzLy5hdG9tL3BhY2thZ2VzL21hcmtkb3duLXByZXZpZXctcGx1cy9zcGVjL21hdGhqYXgtaGVscGVyLXNwZWMuY29mZmVlIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FBQUEsTUFBQTs7RUFBQyxJQUFlLE9BQUEsQ0FBUSxzQkFBUjs7RUFDaEIsSUFBQSxHQUFnQixPQUFBLENBQVEsTUFBUjs7RUFDaEIsRUFBQSxHQUFnQixPQUFBLENBQVEsU0FBUjs7RUFDaEIsSUFBQSxHQUFnQixPQUFBLENBQVEsTUFBUixDQUFlLENBQUMsS0FBaEIsQ0FBQTs7RUFDaEIsYUFBQSxHQUFnQixPQUFBLENBQVEsdUJBQVI7O0VBRWhCLFFBQUEsQ0FBUyx1QkFBVCxFQUFrQyxTQUFBO1dBQ2hDLFFBQUEsQ0FBUyw0QkFBVCxFQUF1QyxTQUFBO0FBQ3JDLFVBQUE7TUFBQSxNQUFzQyxFQUF0QyxFQUFDLHNCQUFELEVBQWdCLG1CQUFoQixFQUE0QjtNQUU1QixVQUFBLENBQVcsU0FBQTtRQUNULGFBQUEsR0FBZ0IsSUFBSSxDQUFDLFNBQUwsQ0FBZSxrQkFBZjtRQUNoQixVQUFBLEdBQWEsSUFBSSxDQUFDLElBQUwsQ0FBVSxhQUFWLEVBQXlCLDRCQUF6QjtRQUViLEtBQUEsQ0FBTSxJQUFOLEVBQVksa0JBQVosQ0FBK0IsQ0FBQyxTQUFoQyxDQUEwQyxhQUExQztRQUNBLE9BQU8sQ0FBQyxZQUFSLENBQUE7ZUFFQSxhQUFhLENBQUMsWUFBZCxDQUFBO01BUFMsQ0FBWDtNQVNBLFNBQUEsQ0FBVSxTQUFBO2VBQ1IsYUFBYSxDQUFDLFlBQWQsQ0FBQTtNQURRLENBQVY7TUFHQSxvQkFBQSxHQUF1QixTQUFBO0FBQ3JCLFlBQUE7UUFBQyxPQUFRO1FBRVQsZUFBQSxDQUFnQixTQUFBO2lCQUNkLElBQUksQ0FBQyxRQUFRLENBQUMsZUFBZCxDQUE4Qix1QkFBOUI7UUFEYyxDQUFoQjtRQUdBLElBQUEsQ0FBSyxTQUFBO2lCQUNILGFBQWEsQ0FBQyxXQUFkLENBQUE7UUFERyxDQUFMO1FBR0EsUUFBQSxDQUFTLGlCQUFULEVBQTRCLFNBQUE7aUJBQzFCO1FBRDBCLENBQTVCO1FBS0EsSUFBQSxDQUFLLFNBQUE7QUFDSCxjQUFBO1VBQUEsSUFBQSxHQUF3QixRQUFRLENBQUMsYUFBVCxDQUF1QixNQUF2QjtVQUN4QixRQUFBLEdBQXdCLFFBQVEsQ0FBQyxhQUFULENBQXVCLFFBQXZCO1VBQ3hCLFFBQVEsQ0FBQyxJQUFULEdBQXdCO1VBQ3hCLFFBQVEsQ0FBQyxXQUFULEdBQXdCO1VBQ3hCLElBQUksQ0FBQyxXQUFMLENBQWlCLFFBQWpCO2lCQUNBLGFBQWEsQ0FBQyxhQUFkLENBQTRCLElBQTVCO1FBTkcsQ0FBTDtRQVFBLFFBQUEsQ0FBUyw4QkFBVCxFQUF5QyxTQUFBO0FBQ3ZDLGNBQUE7aUJBQUEsTUFBQSwyR0FBMkMsQ0FBRTtRQUROLENBQXpDO2VBR0EsUUFBQSxDQUFTLHlCQUFULEVBQW9DLFNBQUE7aUJBQ2xDLElBQUksQ0FBQyxpQkFBTCxLQUEwQjtRQURRLENBQXBDO01BekJxQjtNQTRCdkIsUUFBQSxDQUFTLDJCQUFULEVBQXNDLFNBQUE7UUFDcEMsVUFBQSxDQUFXLFNBQUE7QUFDVCxjQUFBO1VBQUEsWUFBQSxHQUFlLElBQUksQ0FBQyxJQUFMLENBQVUsU0FBVixFQUFxQixzQkFBckI7VUFDZixZQUFBLEdBQWUsRUFBRSxDQUFDLFlBQUgsQ0FBZ0IsWUFBaEIsRUFBOEIsTUFBOUI7aUJBQ2YsRUFBRSxDQUFDLGFBQUgsQ0FBaUIsVUFBakIsRUFBNkIsWUFBN0I7UUFIUyxDQUFYO1FBS0EsRUFBQSxDQUFHLG9CQUFILEVBQXlCLFNBQUE7VUFDdkIsb0JBQUEsQ0FBQTtpQkFDQSxJQUFBLENBQUssU0FBQTtZQUNILE1BQUEsQ0FBTyxNQUFNLENBQUMsUUFBZCxDQUF1QixDQUFDLFdBQXhCLENBQUE7bUJBQ0EsTUFBQSxDQUFPLE1BQU0sQ0FBQyxhQUFkLENBQTRCLENBQUMsV0FBN0IsQ0FBQTtVQUZHLENBQUw7UUFGdUIsQ0FBekI7ZUFNQSxFQUFBLENBQUcsNkJBQUgsRUFBa0MsU0FBQTtVQUNoQyxvQkFBQSxDQUFBO2lCQUNBLElBQUEsQ0FBSyxTQUFBO1lBQ0gsTUFBQSxDQUFPLE1BQU0sQ0FBQyxNQUFkLENBQXFCLENBQUMsYUFBdEIsQ0FBQTtZQUNBLE1BQUEsQ0FBTyxNQUFNLENBQUMsUUFBZCxDQUF1QixDQUFDLGFBQXhCLENBQUE7WUFDQSxNQUFBLENBQU8sTUFBTSxDQUFDLFdBQWQsQ0FBMEIsQ0FBQyxhQUEzQixDQUFBO21CQUNBLE1BQUEsQ0FBTyxNQUFNLENBQUMsYUFBZCxDQUE0QixDQUFDLGFBQTdCLENBQUE7VUFKRyxDQUFMO1FBRmdDLENBQWxDO01BWm9DLENBQXRDO2FBb0JBLFFBQUEsQ0FBUyxrQ0FBVCxFQUE2QyxTQUFBO2VBQzNDLEVBQUEsQ0FBRyxnQ0FBSCxFQUFxQyxTQUFBO1VBQ25DLE1BQUEsQ0FBTyxFQUFFLENBQUMsVUFBSCxDQUFjLFVBQWQsQ0FBUCxDQUFpQyxDQUFDLElBQWxDLENBQXVDLEtBQXZDO1VBQ0Esb0JBQUEsQ0FBQTtpQkFDQSxJQUFBLENBQUssU0FBQTttQkFBRyxNQUFBLENBQU8sRUFBRSxDQUFDLFVBQUgsQ0FBYyxVQUFkLENBQVAsQ0FBaUMsQ0FBQyxJQUFsQyxDQUF1QyxJQUF2QztVQUFILENBQUw7UUFIbUMsQ0FBckM7TUFEMkMsQ0FBN0M7SUEvRHFDLENBQXZDO0VBRGdDLENBQWxDO0FBTkEiLCJzb3VyY2VzQ29udGVudCI6WyJ7JH0gICAgICAgICAgID0gcmVxdWlyZSAnYXRvbS1zcGFjZS1wZW4tdmlld3MnXG5wYXRoICAgICAgICAgID0gcmVxdWlyZSAncGF0aCdcbmZzICAgICAgICAgICAgPSByZXF1aXJlICdmcy1wbHVzJ1xudGVtcCAgICAgICAgICA9IHJlcXVpcmUoJ3RlbXAnKS50cmFjaygpXG5tYXRoamF4SGVscGVyID0gcmVxdWlyZSAnLi4vbGliL21hdGhqYXgtaGVscGVyJ1xuXG5kZXNjcmliZSBcIk1hdGhKYXggaGVscGVyIG1vZHVsZVwiLCAtPlxuICBkZXNjcmliZSBcImxvYWRpbmcgTWF0aEpheCBUZVggbWFjcm9zXCIsIC0+XG4gICAgW2NvbmZpZ0RpclBhdGgsIG1hY3Jvc1BhdGgsIG1hY3Jvc10gPSBbXVxuXG4gICAgYmVmb3JlRWFjaCAtPlxuICAgICAgY29uZmlnRGlyUGF0aCA9IHRlbXAubWtkaXJTeW5jKCdhdG9tLWNvbmZpZy1kaXItJylcbiAgICAgIG1hY3Jvc1BhdGggPSBwYXRoLmpvaW4gY29uZmlnRGlyUGF0aCwgJ21hcmtkb3duLXByZXZpZXctcGx1cy5jc29uJ1xuXG4gICAgICBzcHlPbihhdG9tLCAnZ2V0Q29uZmlnRGlyUGF0aCcpLmFuZFJldHVybiBjb25maWdEaXJQYXRoXG4gICAgICBqYXNtaW5lLnVzZVJlYWxDbG9jaygpICMgTWF0aEpheCBxdWV1ZSdzIHdpbGwgTk9UIHdvcmsgd2l0aG91dCB0aGlzXG5cbiAgICAgIG1hdGhqYXhIZWxwZXIucmVzZXRNYXRoSmF4KClcblxuICAgIGFmdGVyRWFjaCAtPlxuICAgICAgbWF0aGpheEhlbHBlci5yZXNldE1hdGhKYXgoKVxuXG4gICAgd2FpdHNGb3JNYWNyb3NUb0xvYWQgPSAtPlxuICAgICAgW3NwYW5dID0gW11cblxuICAgICAgd2FpdHNGb3JQcm9taXNlIC0+XG4gICAgICAgIGF0b20ucGFja2FnZXMuYWN0aXZhdGVQYWNrYWdlKFwibWFya2Rvd24tcHJldmlldy1wbHVzXCIpXG5cbiAgICAgIHJ1bnMgLT5cbiAgICAgICAgbWF0aGpheEhlbHBlci5sb2FkTWF0aEpheCgpXG5cbiAgICAgIHdhaXRzRm9yIFwiTWF0aEpheCB0byBsb2FkXCIsIC0+XG4gICAgICAgIE1hdGhKYXg/XG5cbiAgICAgICMgVHJpZ2dlciBNYXRoSmF4IFRlWCBleHRlbnNpb24gdG8gbG9hZFxuXG4gICAgICBydW5zIC0+XG4gICAgICAgIHNwYW4gICAgICAgICAgICAgICAgICA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJzcGFuXCIpXG4gICAgICAgIGVxdWF0aW9uICAgICAgICAgICAgICA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJzY3JpcHRcIilcbiAgICAgICAgZXF1YXRpb24udHlwZSAgICAgICAgID0gXCJtYXRoL3RleDsgbW9kZT1kaXNwbGF5XCJcbiAgICAgICAgZXF1YXRpb24udGV4dENvbnRlbnQgID0gXCJcXFxcaW50XzFeMlwiXG4gICAgICAgIHNwYW4uYXBwZW5kQ2hpbGQgZXF1YXRpb25cbiAgICAgICAgbWF0aGpheEhlbHBlci5tYXRoUHJvY2Vzc29yIHNwYW5cblxuICAgICAgd2FpdHNGb3IgXCJNYXRoSmF4IG1hY3JvcyB0byBiZSBkZWZpbmVkXCIsIC0+XG4gICAgICAgIG1hY3JvcyA9IE1hdGhKYXguSW5wdXRKYXg/LlRlWD8uRGVmaW5pdGlvbnM/Lm1hY3Jvc1xuXG4gICAgICB3YWl0c0ZvciBcIk1hdGhKYXggdG8gcHJvY2VzcyBzcGFuXCIsIC0+XG4gICAgICAgIHNwYW4uY2hpbGRFbGVtZW50Q291bnQgaXMgMlxuXG4gICAgZGVzY3JpYmUgXCJ3aGVuIGEgbWFjcm9zIGZpbGUgZXhpc3RzXCIsIC0+XG4gICAgICBiZWZvcmVFYWNoIC0+XG4gICAgICAgIGZpeHR1cmVzUGF0aCA9IHBhdGguam9pbihfX2Rpcm5hbWUsICdmaXh0dXJlcy9tYWNyb3MuY3NvbicpXG4gICAgICAgIGZpeHR1cmVzRmlsZSA9IGZzLnJlYWRGaWxlU3luYyBmaXh0dXJlc1BhdGgsICd1dGY4J1xuICAgICAgICBmcy53cml0ZUZpbGVTeW5jIG1hY3Jvc1BhdGgsIGZpeHR1cmVzRmlsZVxuXG4gICAgICBpdCBcImxvYWRzIHZhbGlkIG1hY3Jvc1wiLCAtPlxuICAgICAgICB3YWl0c0Zvck1hY3Jvc1RvTG9hZCgpXG4gICAgICAgIHJ1bnMgLT5cbiAgICAgICAgICBleHBlY3QobWFjcm9zLm1hY3JvT25lKS50b0JlRGVmaW5lZCgpXG4gICAgICAgICAgZXhwZWN0KG1hY3Jvcy5tYWNyb1BhcmFtT25lKS50b0JlRGVmaW5lZCgpXG5cbiAgICAgIGl0IFwiZG9lc24ndCBsb2FkIGludmFsaWQgbWFjcm9zXCIsIC0+XG4gICAgICAgIHdhaXRzRm9yTWFjcm9zVG9Mb2FkKClcbiAgICAgICAgcnVucyAtPlxuICAgICAgICAgIGV4cGVjdChtYWNyb3MubWFjcm8xKS50b0JlVW5kZWZpbmVkKClcbiAgICAgICAgICBleHBlY3QobWFjcm9zLm1hY3JvVHdvKS50b0JlVW5kZWZpbmVkKClcbiAgICAgICAgICBleHBlY3QobWFjcm9zLm1hY3JvUGFyYW0xKS50b0JlVW5kZWZpbmVkKClcbiAgICAgICAgICBleHBlY3QobWFjcm9zLm1hY3JvUGFyYW1Ud28pLnRvQmVVbmRlZmluZWQoKVxuXG4gICAgZGVzY3JpYmUgXCJ3aGVuIGEgbWFjcm9zIGZpbGUgZG9lc24ndCBleGlzdFwiLCAtPlxuICAgICAgaXQgXCJjcmVhdGVzIGEgdGVtcGxhdGUgbWFjcm9zIGZpbGVcIiwgLT5cbiAgICAgICAgZXhwZWN0KGZzLmlzRmlsZVN5bmMobWFjcm9zUGF0aCkpLnRvQmUoZmFsc2UpXG4gICAgICAgIHdhaXRzRm9yTWFjcm9zVG9Mb2FkKClcbiAgICAgICAgcnVucyAtPiBleHBlY3QoZnMuaXNGaWxlU3luYyhtYWNyb3NQYXRoKSkudG9CZSh0cnVlKVxuIl19
