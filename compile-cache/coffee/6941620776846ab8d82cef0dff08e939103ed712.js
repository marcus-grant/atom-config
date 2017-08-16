(function() {
  var TextData, dispatch, getView, getVimState, rawKeystroke, ref, settings, withMockPlatform;

  ref = require('./spec-helper'), getVimState = ref.getVimState, dispatch = ref.dispatch, TextData = ref.TextData, getView = ref.getView, withMockPlatform = ref.withMockPlatform, rawKeystroke = ref.rawKeystroke;

  settings = require('../lib/settings');

  describe("min DSL used in vim-mode-plus's spec", function() {
    var editor, editorElement, ensure, keystroke, ref1, set, vimState;
    ref1 = [], set = ref1[0], ensure = ref1[1], keystroke = ref1[2], editor = ref1[3], editorElement = ref1[4], vimState = ref1[5];
    beforeEach(function() {
      getVimState(function(state, vim) {
        vimState = state;
        editor = vimState.editor, editorElement = vimState.editorElement;
        return set = vim.set, ensure = vim.ensure, keystroke = vim.keystroke, vim;
      });
      return runs(function() {
        return jasmine.attachToDOM(editorElement);
      });
    });
    describe("old exisisting spec options", function() {
      beforeEach(function() {
        return set({
          text: "abc",
          cursor: [0, 0]
        });
      });
      return it("toggle and move right", function() {
        return ensure("~", {
          text: "Abc",
          cursor: [0, 1]
        });
      });
    });
    describe("new 'textC' spec options with explanatory ensure", function() {
      describe("| represent cursor", function() {
        beforeEach(function() {
          set({
            textC: "|abc"
          });
          return ensure({
            text: "abc",
            cursor: [0, 0]
          });
        });
        return it("toggle and move right", function() {
          ensure("~", {
            textC: "A|bc"
          });
          return ensure({
            text: "Abc",
            cursor: [0, 1]
          });
        });
      });
      describe("! represent cursor", function() {
        beforeEach(function() {
          set({
            textC: "!abc"
          });
          return ensure({
            text: "abc",
            cursor: [0, 0]
          });
        });
        return it("toggle and move right", function() {
          ensure("~", {
            textC: "A!bc"
          });
          return ensure({
            text: "Abc",
            cursor: [0, 1]
          });
        });
      });
      return describe("| and ! is exchangable", function() {
        return it("both are OK", function() {
          set({
            textC: "|abc"
          });
          ensure("~", {
            textC: "A!bc"
          });
          set({
            textC: "a!bc"
          });
          return ensure("~", {
            textC: "aB!c"
          });
        });
      });
    });
    return describe("multi-low, multi-cursor case", function() {
      describe("without ! cursor", function() {
        return it("last cursor become last one", function() {
          set({
            textC: "|0: line0\n|1: line1"
          });
          ensure({
            cursor: [[0, 0], [1, 0]]
          });
          return expect(editor.getLastCursor().getBufferPosition()).toEqual([1, 0]);
        });
      });
      describe("with ! cursor", function() {
        return it("last cursor become ! one", function() {
          set({
            textC: "|012|345|678"
          });
          ensure({
            textC: "|012|345|678"
          });
          ensure({
            cursor: [[0, 0], [0, 3], [0, 6]]
          });
          expect(editor.getLastCursor().getBufferPosition()).toEqual([0, 6]);
          set({
            textC: "!012|345|678"
          });
          ensure({
            textC: "!012|345|678"
          });
          ensure({
            cursor: [[0, 3], [0, 6], [0, 0]]
          });
          expect(editor.getLastCursor().getBufferPosition()).toEqual([0, 0]);
          set({
            textC: "|012!345|678"
          });
          ensure({
            textC: "|012!345|678"
          });
          ensure({
            cursor: [[0, 0], [0, 6], [0, 3]]
          });
          expect(editor.getLastCursor().getBufferPosition()).toEqual([0, 3]);
          set({
            textC: "|012|345!678"
          });
          ensure({
            textC: "|012|345!678"
          });
          ensure({
            cursor: [[0, 0], [0, 3], [0, 6]]
          });
          return expect(editor.getLastCursor().getBufferPosition()).toEqual([0, 6]);
        });
      });
      return describe("without ! cursor", function() {
        beforeEach(function() {
          set({
            textC: "|ab|cde|fg\nhi|jklmn\nopqrstu\n"
          });
          return ensure({
            text: "abcdefg\nhijklmn\nopqrstu\n",
            cursor: [[0, 0], [0, 2], [0, 5], [1, 2]]
          });
        });
        return it("toggle and move right", function() {
          ensure('~', {
            textC: "A|bC|deF|g\nhiJ|klmn\nopqrstu\n"
          });
          return ensure({
            text: "AbCdeFg\nhiJklmn\nopqrstu\n",
            cursor: [[0, 1], [0, 3], [0, 6], [1, 3]]
          });
        });
      });
    });
  });

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL2hvbWUvbWFyY3VzLy5hdG9tL3BhY2thZ2VzL3ZpbS1tb2RlLXBsdXMvc3BlYy9zcGVjLWhlbHBlci1zcGVjLmNvZmZlZSJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQUFBLE1BQUE7O0VBQUEsTUFBNkUsT0FBQSxDQUFRLGVBQVIsQ0FBN0UsRUFBQyw2QkFBRCxFQUFjLHVCQUFkLEVBQXdCLHVCQUF4QixFQUFrQyxxQkFBbEMsRUFBMkMsdUNBQTNDLEVBQTZEOztFQUM3RCxRQUFBLEdBQVcsT0FBQSxDQUFRLGlCQUFSOztFQUVYLFFBQUEsQ0FBUyxzQ0FBVCxFQUFpRCxTQUFBO0FBQy9DLFFBQUE7SUFBQSxPQUE0RCxFQUE1RCxFQUFDLGFBQUQsRUFBTSxnQkFBTixFQUFjLG1CQUFkLEVBQXlCLGdCQUF6QixFQUFpQyx1QkFBakMsRUFBZ0Q7SUFFaEQsVUFBQSxDQUFXLFNBQUE7TUFDVCxXQUFBLENBQVksU0FBQyxLQUFELEVBQVEsR0FBUjtRQUNWLFFBQUEsR0FBVztRQUNWLHdCQUFELEVBQVM7ZUFDUixhQUFELEVBQU0sbUJBQU4sRUFBYyx5QkFBZCxFQUEyQjtNQUhqQixDQUFaO2FBS0EsSUFBQSxDQUFLLFNBQUE7ZUFDSCxPQUFPLENBQUMsV0FBUixDQUFvQixhQUFwQjtNQURHLENBQUw7SUFOUyxDQUFYO0lBU0EsUUFBQSxDQUFTLDZCQUFULEVBQXdDLFNBQUE7TUFDdEMsVUFBQSxDQUFXLFNBQUE7ZUFDVCxHQUFBLENBQUk7VUFBQSxJQUFBLEVBQU0sS0FBTjtVQUFhLE1BQUEsRUFBUSxDQUFDLENBQUQsRUFBSSxDQUFKLENBQXJCO1NBQUo7TUFEUyxDQUFYO2FBR0EsRUFBQSxDQUFHLHVCQUFILEVBQTRCLFNBQUE7ZUFDMUIsTUFBQSxDQUFPLEdBQVAsRUFBWTtVQUFBLElBQUEsRUFBTSxLQUFOO1VBQWEsTUFBQSxFQUFRLENBQUMsQ0FBRCxFQUFJLENBQUosQ0FBckI7U0FBWjtNQUQwQixDQUE1QjtJQUpzQyxDQUF4QztJQU9BLFFBQUEsQ0FBUyxrREFBVCxFQUE2RCxTQUFBO01BQzNELFFBQUEsQ0FBUyxvQkFBVCxFQUErQixTQUFBO1FBQzdCLFVBQUEsQ0FBVyxTQUFBO1VBQ1QsR0FBQSxDQUFJO1lBQUEsS0FBQSxFQUFPLE1BQVA7V0FBSjtpQkFDQSxNQUFBLENBQU87WUFBQSxJQUFBLEVBQU0sS0FBTjtZQUFhLE1BQUEsRUFBUSxDQUFDLENBQUQsRUFBSSxDQUFKLENBQXJCO1dBQVA7UUFGUyxDQUFYO2VBSUEsRUFBQSxDQUFHLHVCQUFILEVBQTRCLFNBQUE7VUFDMUIsTUFBQSxDQUFPLEdBQVAsRUFBWTtZQUFBLEtBQUEsRUFBTyxNQUFQO1dBQVo7aUJBQ0EsTUFBQSxDQUFPO1lBQUEsSUFBQSxFQUFNLEtBQU47WUFBYSxNQUFBLEVBQVEsQ0FBQyxDQUFELEVBQUksQ0FBSixDQUFyQjtXQUFQO1FBRjBCLENBQTVCO01BTDZCLENBQS9CO01BU0EsUUFBQSxDQUFTLG9CQUFULEVBQStCLFNBQUE7UUFDN0IsVUFBQSxDQUFXLFNBQUE7VUFDVCxHQUFBLENBQUk7WUFBQSxLQUFBLEVBQU8sTUFBUDtXQUFKO2lCQUNBLE1BQUEsQ0FBTztZQUFBLElBQUEsRUFBTSxLQUFOO1lBQWEsTUFBQSxFQUFRLENBQUMsQ0FBRCxFQUFJLENBQUosQ0FBckI7V0FBUDtRQUZTLENBQVg7ZUFJQSxFQUFBLENBQUcsdUJBQUgsRUFBNEIsU0FBQTtVQUMxQixNQUFBLENBQU8sR0FBUCxFQUFZO1lBQUEsS0FBQSxFQUFPLE1BQVA7V0FBWjtpQkFDQSxNQUFBLENBQU87WUFBQSxJQUFBLEVBQU0sS0FBTjtZQUFhLE1BQUEsRUFBUSxDQUFDLENBQUQsRUFBSSxDQUFKLENBQXJCO1dBQVA7UUFGMEIsQ0FBNUI7TUFMNkIsQ0FBL0I7YUFTQSxRQUFBLENBQVMsd0JBQVQsRUFBbUMsU0FBQTtlQUNqQyxFQUFBLENBQUcsYUFBSCxFQUFrQixTQUFBO1VBQ2hCLEdBQUEsQ0FBSTtZQUFBLEtBQUEsRUFBTyxNQUFQO1dBQUo7VUFDQSxNQUFBLENBQU8sR0FBUCxFQUFZO1lBQUEsS0FBQSxFQUFPLE1BQVA7V0FBWjtVQUVBLEdBQUEsQ0FBSTtZQUFBLEtBQUEsRUFBTyxNQUFQO1dBQUo7aUJBQ0EsTUFBQSxDQUFPLEdBQVAsRUFBWTtZQUFBLEtBQUEsRUFBTyxNQUFQO1dBQVo7UUFMZ0IsQ0FBbEI7TUFEaUMsQ0FBbkM7SUFuQjJELENBQTdEO1dBMkJBLFFBQUEsQ0FBUyw4QkFBVCxFQUF5QyxTQUFBO01BQ3ZDLFFBQUEsQ0FBUyxrQkFBVCxFQUE2QixTQUFBO2VBQzNCLEVBQUEsQ0FBRyw2QkFBSCxFQUFrQyxTQUFBO1VBQ2hDLEdBQUEsQ0FDRTtZQUFBLEtBQUEsRUFBTyxzQkFBUDtXQURGO1VBTUEsTUFBQSxDQUFPO1lBQUEsTUFBQSxFQUFRLENBQUMsQ0FBQyxDQUFELEVBQUksQ0FBSixDQUFELEVBQVMsQ0FBQyxDQUFELEVBQUksQ0FBSixDQUFULENBQVI7V0FBUDtpQkFDQSxNQUFBLENBQU8sTUFBTSxDQUFDLGFBQVAsQ0FBQSxDQUFzQixDQUFDLGlCQUF2QixDQUFBLENBQVAsQ0FBa0QsQ0FBQyxPQUFuRCxDQUEyRCxDQUFDLENBQUQsRUFBSSxDQUFKLENBQTNEO1FBUmdDLENBQWxDO01BRDJCLENBQTdCO01BV0EsUUFBQSxDQUFTLGVBQVQsRUFBMEIsU0FBQTtlQUN4QixFQUFBLENBQUcsMEJBQUgsRUFBK0IsU0FBQTtVQUM3QixHQUFBLENBQUk7WUFBQSxLQUFBLEVBQU8sY0FBUDtXQUFKO1VBQ0EsTUFBQSxDQUFPO1lBQUEsS0FBQSxFQUFPLGNBQVA7V0FBUDtVQUNBLE1BQUEsQ0FBTztZQUFBLE1BQUEsRUFBUSxDQUFDLENBQUMsQ0FBRCxFQUFJLENBQUosQ0FBRCxFQUFTLENBQUMsQ0FBRCxFQUFJLENBQUosQ0FBVCxFQUFpQixDQUFDLENBQUQsRUFBSSxDQUFKLENBQWpCLENBQVI7V0FBUDtVQUNBLE1BQUEsQ0FBTyxNQUFNLENBQUMsYUFBUCxDQUFBLENBQXNCLENBQUMsaUJBQXZCLENBQUEsQ0FBUCxDQUFrRCxDQUFDLE9BQW5ELENBQTJELENBQUMsQ0FBRCxFQUFJLENBQUosQ0FBM0Q7VUFFQSxHQUFBLENBQUk7WUFBQSxLQUFBLEVBQU8sY0FBUDtXQUFKO1VBQ0EsTUFBQSxDQUFPO1lBQUEsS0FBQSxFQUFPLGNBQVA7V0FBUDtVQUNBLE1BQUEsQ0FBTztZQUFBLE1BQUEsRUFBUSxDQUFDLENBQUMsQ0FBRCxFQUFJLENBQUosQ0FBRCxFQUFTLENBQUMsQ0FBRCxFQUFJLENBQUosQ0FBVCxFQUFpQixDQUFDLENBQUQsRUFBSSxDQUFKLENBQWpCLENBQVI7V0FBUDtVQUNBLE1BQUEsQ0FBTyxNQUFNLENBQUMsYUFBUCxDQUFBLENBQXNCLENBQUMsaUJBQXZCLENBQUEsQ0FBUCxDQUFrRCxDQUFDLE9BQW5ELENBQTJELENBQUMsQ0FBRCxFQUFJLENBQUosQ0FBM0Q7VUFFQSxHQUFBLENBQUk7WUFBQSxLQUFBLEVBQU8sY0FBUDtXQUFKO1VBQ0EsTUFBQSxDQUFPO1lBQUEsS0FBQSxFQUFPLGNBQVA7V0FBUDtVQUNBLE1BQUEsQ0FBTztZQUFBLE1BQUEsRUFBUSxDQUFDLENBQUMsQ0FBRCxFQUFJLENBQUosQ0FBRCxFQUFTLENBQUMsQ0FBRCxFQUFJLENBQUosQ0FBVCxFQUFpQixDQUFDLENBQUQsRUFBSSxDQUFKLENBQWpCLENBQVI7V0FBUDtVQUNBLE1BQUEsQ0FBTyxNQUFNLENBQUMsYUFBUCxDQUFBLENBQXNCLENBQUMsaUJBQXZCLENBQUEsQ0FBUCxDQUFrRCxDQUFDLE9BQW5ELENBQTJELENBQUMsQ0FBRCxFQUFJLENBQUosQ0FBM0Q7VUFFQSxHQUFBLENBQUk7WUFBQSxLQUFBLEVBQU8sY0FBUDtXQUFKO1VBQ0EsTUFBQSxDQUFPO1lBQUEsS0FBQSxFQUFPLGNBQVA7V0FBUDtVQUNBLE1BQUEsQ0FBTztZQUFBLE1BQUEsRUFBUSxDQUFDLENBQUMsQ0FBRCxFQUFJLENBQUosQ0FBRCxFQUFTLENBQUMsQ0FBRCxFQUFJLENBQUosQ0FBVCxFQUFpQixDQUFDLENBQUQsRUFBSSxDQUFKLENBQWpCLENBQVI7V0FBUDtpQkFDQSxNQUFBLENBQU8sTUFBTSxDQUFDLGFBQVAsQ0FBQSxDQUFzQixDQUFDLGlCQUF2QixDQUFBLENBQVAsQ0FBa0QsQ0FBQyxPQUFuRCxDQUEyRCxDQUFDLENBQUQsRUFBSSxDQUFKLENBQTNEO1FBbkI2QixDQUEvQjtNQUR3QixDQUExQjthQXNCQSxRQUFBLENBQVMsa0JBQVQsRUFBNkIsU0FBQTtRQUMzQixVQUFBLENBQVcsU0FBQTtVQUNULEdBQUEsQ0FDRTtZQUFBLEtBQUEsRUFBTyxpQ0FBUDtXQURGO2lCQU9BLE1BQUEsQ0FDRTtZQUFBLElBQUEsRUFBTSw2QkFBTjtZQUtBLE1BQUEsRUFBUSxDQUFDLENBQUMsQ0FBRCxFQUFJLENBQUosQ0FBRCxFQUFTLENBQUMsQ0FBRCxFQUFJLENBQUosQ0FBVCxFQUFpQixDQUFDLENBQUQsRUFBSSxDQUFKLENBQWpCLEVBQXlCLENBQUMsQ0FBRCxFQUFJLENBQUosQ0FBekIsQ0FMUjtXQURGO1FBUlMsQ0FBWDtlQWdCQSxFQUFBLENBQUcsdUJBQUgsRUFBNEIsU0FBQTtVQUMxQixNQUFBLENBQU8sR0FBUCxFQUNFO1lBQUEsS0FBQSxFQUFPLGlDQUFQO1dBREY7aUJBT0EsTUFBQSxDQUNFO1lBQUEsSUFBQSxFQUFNLDZCQUFOO1lBS0EsTUFBQSxFQUFRLENBQUMsQ0FBQyxDQUFELEVBQUksQ0FBSixDQUFELEVBQVMsQ0FBQyxDQUFELEVBQUksQ0FBSixDQUFULEVBQWlCLENBQUMsQ0FBRCxFQUFJLENBQUosQ0FBakIsRUFBeUIsQ0FBQyxDQUFELEVBQUksQ0FBSixDQUF6QixDQUxSO1dBREY7UUFSMEIsQ0FBNUI7TUFqQjJCLENBQTdCO0lBbEN1QyxDQUF6QztFQTlDK0MsQ0FBakQ7QUFIQSIsInNvdXJjZXNDb250ZW50IjpbIntnZXRWaW1TdGF0ZSwgZGlzcGF0Y2gsIFRleHREYXRhLCBnZXRWaWV3LCB3aXRoTW9ja1BsYXRmb3JtLCByYXdLZXlzdHJva2V9ID0gcmVxdWlyZSAnLi9zcGVjLWhlbHBlcidcbnNldHRpbmdzID0gcmVxdWlyZSAnLi4vbGliL3NldHRpbmdzJ1xuXG5kZXNjcmliZSBcIm1pbiBEU0wgdXNlZCBpbiB2aW0tbW9kZS1wbHVzJ3Mgc3BlY1wiLCAtPlxuICBbc2V0LCBlbnN1cmUsIGtleXN0cm9rZSwgZWRpdG9yLCBlZGl0b3JFbGVtZW50LCB2aW1TdGF0ZV0gPSBbXVxuXG4gIGJlZm9yZUVhY2ggLT5cbiAgICBnZXRWaW1TdGF0ZSAoc3RhdGUsIHZpbSkgLT5cbiAgICAgIHZpbVN0YXRlID0gc3RhdGVcbiAgICAgIHtlZGl0b3IsIGVkaXRvckVsZW1lbnR9ID0gdmltU3RhdGVcbiAgICAgIHtzZXQsIGVuc3VyZSwga2V5c3Ryb2tlfSA9IHZpbVxuXG4gICAgcnVucyAtPlxuICAgICAgamFzbWluZS5hdHRhY2hUb0RPTShlZGl0b3JFbGVtZW50KVxuXG4gIGRlc2NyaWJlIFwib2xkIGV4aXNpc3Rpbmcgc3BlYyBvcHRpb25zXCIsIC0+XG4gICAgYmVmb3JlRWFjaCAtPlxuICAgICAgc2V0IHRleHQ6IFwiYWJjXCIsIGN1cnNvcjogWzAsIDBdXG5cbiAgICBpdCBcInRvZ2dsZSBhbmQgbW92ZSByaWdodFwiLCAtPlxuICAgICAgZW5zdXJlIFwiflwiLCB0ZXh0OiBcIkFiY1wiLCBjdXJzb3I6IFswLCAxXVxuXG4gIGRlc2NyaWJlIFwibmV3ICd0ZXh0Qycgc3BlYyBvcHRpb25zIHdpdGggZXhwbGFuYXRvcnkgZW5zdXJlXCIsIC0+XG4gICAgZGVzY3JpYmUgXCJ8IHJlcHJlc2VudCBjdXJzb3JcIiwgLT5cbiAgICAgIGJlZm9yZUVhY2ggLT5cbiAgICAgICAgc2V0IHRleHRDOiBcInxhYmNcIlxuICAgICAgICBlbnN1cmUgdGV4dDogXCJhYmNcIiwgY3Vyc29yOiBbMCwgMF0gIyBleHBsYW5hdG9yeSBwdXJwb3NlXG5cbiAgICAgIGl0IFwidG9nZ2xlIGFuZCBtb3ZlIHJpZ2h0XCIsIC0+XG4gICAgICAgIGVuc3VyZSBcIn5cIiwgdGV4dEM6IFwiQXxiY1wiXG4gICAgICAgIGVuc3VyZSB0ZXh0OiBcIkFiY1wiLCBjdXJzb3I6IFswLCAxXSAjIGV4cGxhbmF0b3J5IHB1cnBvc2VcblxuICAgIGRlc2NyaWJlIFwiISByZXByZXNlbnQgY3Vyc29yXCIsIC0+XG4gICAgICBiZWZvcmVFYWNoIC0+XG4gICAgICAgIHNldCB0ZXh0QzogXCIhYWJjXCJcbiAgICAgICAgZW5zdXJlIHRleHQ6IFwiYWJjXCIsIGN1cnNvcjogWzAsIDBdICMgZXhwbGFuYXRvcnkgcHVycG9zZVxuXG4gICAgICBpdCBcInRvZ2dsZSBhbmQgbW92ZSByaWdodFwiLCAtPlxuICAgICAgICBlbnN1cmUgXCJ+XCIsIHRleHRDOiBcIkEhYmNcIlxuICAgICAgICBlbnN1cmUgdGV4dDogXCJBYmNcIiwgY3Vyc29yOiBbMCwgMV0gIyBleHBsYW5hdG9yeSBwdXJwb3NlXG5cbiAgICBkZXNjcmliZSBcInwgYW5kICEgaXMgZXhjaGFuZ2FibGVcIiwgLT5cbiAgICAgIGl0IFwiYm90aCBhcmUgT0tcIiwgLT5cbiAgICAgICAgc2V0IHRleHRDOiBcInxhYmNcIlxuICAgICAgICBlbnN1cmUgXCJ+XCIsIHRleHRDOiBcIkEhYmNcIlxuXG4gICAgICAgIHNldCB0ZXh0QzogXCJhIWJjXCJcbiAgICAgICAgZW5zdXJlIFwiflwiLCB0ZXh0QzogXCJhQiFjXCJcblxuICBkZXNjcmliZSBcIm11bHRpLWxvdywgbXVsdGktY3Vyc29yIGNhc2VcIiwgLT5cbiAgICBkZXNjcmliZSBcIndpdGhvdXQgISBjdXJzb3JcIiwgLT5cbiAgICAgIGl0IFwibGFzdCBjdXJzb3IgYmVjb21lIGxhc3Qgb25lXCIsIC0+XG4gICAgICAgIHNldFxuICAgICAgICAgIHRleHRDOiBcIlwiXCJcbiAgICAgICAgICB8MDogbGluZTBcbiAgICAgICAgICB8MTogbGluZTFcbiAgICAgICAgICBcIlwiXCJcblxuICAgICAgICBlbnN1cmUgY3Vyc29yOiBbWzAsIDBdLCBbMSwgMF1dXG4gICAgICAgIGV4cGVjdChlZGl0b3IuZ2V0TGFzdEN1cnNvcigpLmdldEJ1ZmZlclBvc2l0aW9uKCkpLnRvRXF1YWwoWzEsIDBdKVxuXG4gICAgZGVzY3JpYmUgXCJ3aXRoICEgY3Vyc29yXCIsIC0+XG4gICAgICBpdCBcImxhc3QgY3Vyc29yIGJlY29tZSAhIG9uZVwiLCAtPlxuICAgICAgICBzZXQgdGV4dEM6IFwifDAxMnwzNDV8Njc4XCJcbiAgICAgICAgZW5zdXJlIHRleHRDOiBcInwwMTJ8MzQ1fDY3OFwiXG4gICAgICAgIGVuc3VyZSBjdXJzb3I6IFtbMCwgMF0sIFswLCAzXSwgWzAsIDZdXVxuICAgICAgICBleHBlY3QoZWRpdG9yLmdldExhc3RDdXJzb3IoKS5nZXRCdWZmZXJQb3NpdGlvbigpKS50b0VxdWFsKFswLCA2XSlcblxuICAgICAgICBzZXQgdGV4dEM6IFwiITAxMnwzNDV8Njc4XCJcbiAgICAgICAgZW5zdXJlIHRleHRDOiBcIiEwMTJ8MzQ1fDY3OFwiXG4gICAgICAgIGVuc3VyZSBjdXJzb3I6IFtbMCwgM10sIFswLCA2XSwgWzAsIDBdXVxuICAgICAgICBleHBlY3QoZWRpdG9yLmdldExhc3RDdXJzb3IoKS5nZXRCdWZmZXJQb3NpdGlvbigpKS50b0VxdWFsKFswLCAwXSlcblxuICAgICAgICBzZXQgdGV4dEM6IFwifDAxMiEzNDV8Njc4XCJcbiAgICAgICAgZW5zdXJlIHRleHRDOiBcInwwMTIhMzQ1fDY3OFwiXG4gICAgICAgIGVuc3VyZSBjdXJzb3I6IFtbMCwgMF0sIFswLCA2XSwgWzAsIDNdXVxuICAgICAgICBleHBlY3QoZWRpdG9yLmdldExhc3RDdXJzb3IoKS5nZXRCdWZmZXJQb3NpdGlvbigpKS50b0VxdWFsKFswLCAzXSlcblxuICAgICAgICBzZXQgdGV4dEM6IFwifDAxMnwzNDUhNjc4XCJcbiAgICAgICAgZW5zdXJlIHRleHRDOiBcInwwMTJ8MzQ1ITY3OFwiXG4gICAgICAgIGVuc3VyZSBjdXJzb3I6IFtbMCwgMF0sIFswLCAzXSwgWzAsIDZdXVxuICAgICAgICBleHBlY3QoZWRpdG9yLmdldExhc3RDdXJzb3IoKS5nZXRCdWZmZXJQb3NpdGlvbigpKS50b0VxdWFsKFswLCA2XSlcblxuICAgIGRlc2NyaWJlIFwid2l0aG91dCAhIGN1cnNvclwiLCAtPlxuICAgICAgYmVmb3JlRWFjaCAtPlxuICAgICAgICBzZXRcbiAgICAgICAgICB0ZXh0QzogXCJcIlwiXG4gICAgICAgICAgfGFifGNkZXxmZ1xuICAgICAgICAgIGhpfGprbG1uXG4gICAgICAgICAgb3BxcnN0dVxcblxuICAgICAgICAgIFwiXCJcIlxuXG4gICAgICAgIGVuc3VyZVxuICAgICAgICAgIHRleHQ6IFwiXCJcIlxuICAgICAgICAgIGFiY2RlZmdcbiAgICAgICAgICBoaWprbG1uXG4gICAgICAgICAgb3BxcnN0dVxcblxuICAgICAgICAgIFwiXCJcIlxuICAgICAgICAgIGN1cnNvcjogW1swLCAwXSwgWzAsIDJdLCBbMCwgNV0sIFsxLCAyXV1cblxuICAgICAgaXQgXCJ0b2dnbGUgYW5kIG1vdmUgcmlnaHRcIiwgLT5cbiAgICAgICAgZW5zdXJlICd+JyxcbiAgICAgICAgICB0ZXh0QzogXCJcIlwiXG4gICAgICAgICAgQXxiQ3xkZUZ8Z1xuICAgICAgICAgIGhpSnxrbG1uXG4gICAgICAgICAgb3BxcnN0dVxcblxuICAgICAgICAgIFwiXCJcIlxuXG4gICAgICAgIGVuc3VyZVxuICAgICAgICAgIHRleHQ6IFwiXCJcIlxuICAgICAgICAgIEFiQ2RlRmdcbiAgICAgICAgICBoaUprbG1uXG4gICAgICAgICAgb3BxcnN0dVxcblxuICAgICAgICAgIFwiXCJcIlxuICAgICAgICAgIGN1cnNvcjogW1swLCAxXSwgWzAsIDNdLCBbMCwgNl0sIFsxLCAzXV1cbiJdfQ==
