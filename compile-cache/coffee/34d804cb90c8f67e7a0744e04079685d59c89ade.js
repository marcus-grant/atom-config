(function() {
  var TextData, getVimState, ref,
    slice = [].slice;

  ref = require('./spec-helper'), getVimState = ref.getVimState, TextData = ref.TextData;

  describe("Visual Blockwise", function() {
    var blockTexts, editor, editorElement, ensure, ensureBlockwiseSelection, keystroke, ref1, selectBlockwise, selectBlockwiseReversely, set, textAfterDeleted, textAfterInserted, textData, textInitial, vimState;
    ref1 = [], set = ref1[0], ensure = ref1[1], keystroke = ref1[2], editor = ref1[3], editorElement = ref1[4], vimState = ref1[5];
    textInitial = "01234567890123456789\n1-------------------\n2----A---------B----\n3----***********---\n4----+++++++++++--\n5----C---------D-\n6-------------------";
    textAfterDeleted = "01234567890123456789\n1-------------------\n2----\n3----\n4----\n5----\n6-------------------";
    textAfterInserted = "01234567890123456789\n1-------------------\n2----!!!\n3----!!!\n4----!!!\n5----!!!\n6-------------------";
    blockTexts = ['56789012345', '-----------', 'A---------B', '***********', '+++++++++++', 'C---------D', '-----------'];
    textData = new TextData(textInitial);
    selectBlockwise = function() {
      set({
        cursor: [2, 5]
      });
      return ensure('v 3 j 1 0 l ctrl-v', {
        mode: ['visual', 'blockwise'],
        selectedBufferRange: [[[2, 5], [2, 16]], [[3, 5], [3, 16]], [[4, 5], [4, 16]], [[5, 5], [5, 16]]],
        selectedText: blockTexts.slice(2, 6)
      });
    };
    selectBlockwiseReversely = function() {
      set({
        cursor: [2, 15]
      });
      return ensure('v 3 j 1 0 h ctrl-v', {
        mode: ['visual', 'blockwise'],
        selectedBufferRange: [[[2, 5], [2, 16]], [[3, 5], [3, 16]], [[4, 5], [4, 16]], [[5, 5], [5, 16]]],
        selectedText: blockTexts.slice(2, 6)
      });
    };
    ensureBlockwiseSelection = function(o) {
      var bs, first, head, i, j, k, last, len, len1, others, ref2, results, s, selections, tail;
      selections = editor.getSelectionsOrderedByBufferPosition();
      if (selections.length === 1) {
        first = last = selections[0];
      } else {
        first = selections[0], others = 3 <= selections.length ? slice.call(selections, 1, i = selections.length - 1) : (i = 1, []), last = selections[i++];
      }
      head = (function() {
        switch (o.head) {
          case 'top':
            return first;
          case 'bottom':
            return last;
        }
      })();
      bs = vimState.getLastBlockwiseSelection();
      expect(bs.getHeadSelection()).toBe(head);
      tail = (function() {
        switch (o.tail) {
          case 'top':
            return first;
          case 'bottom':
            return last;
        }
      })();
      expect(bs.getTailSelection()).toBe(tail);
      ref2 = others != null ? others : [];
      for (j = 0, len = ref2.length; j < len; j++) {
        s = ref2[j];
        expect(bs.getHeadSelection()).not.toBe(s);
        expect(bs.getTailSelection()).not.toBe(s);
      }
      if (o.reversed != null) {
        expect(bs.isReversed()).toBe(o.reversed);
      }
      if (o.headReversed != null) {
        results = [];
        for (k = 0, len1 = selections.length; k < len1; k++) {
          s = selections[k];
          results.push(expect(s.isReversed()).toBe(o.headReversed));
        }
        return results;
      }
    };
    beforeEach(function() {
      getVimState(function(state, vimEditor) {
        vimState = state;
        editor = vimState.editor, editorElement = vimState.editorElement;
        return set = vimEditor.set, ensure = vimEditor.ensure, keystroke = vimEditor.keystroke, vimEditor;
      });
      return runs(function() {
        return set({
          text: textInitial
        });
      });
    });
    describe("j", function() {
      beforeEach(function() {
        set({
          cursor: [3, 5]
        });
        return ensure('v 1 0 l ctrl-v', {
          selectedText: blockTexts[3],
          mode: ['visual', 'blockwise']
        });
      });
      it("add selection to down direction", function() {
        ensure('j', {
          selectedText: blockTexts.slice(3, 5)
        });
        return ensure('j', {
          selectedText: blockTexts.slice(3, 6)
        });
      });
      it("delete selection when blocwise is reversed", function() {
        ensure('3 k', {
          selectedTextOrdered: blockTexts.slice(0, 4)
        });
        ensure('j', {
          selectedTextOrdered: blockTexts.slice(1, 4)
        });
        return ensure('2 j', {
          selectedTextOrdered: blockTexts[3]
        });
      });
      return it("keep tail row when reversed status changed", function() {
        ensure('j', {
          selectedText: blockTexts.slice(3, 5)
        });
        return ensure('2 k', {
          selectedTextOrdered: blockTexts.slice(2, 4)
        });
      });
    });
    describe("k", function() {
      beforeEach(function() {
        set({
          cursor: [3, 5]
        });
        return ensure('v 1 0 l ctrl-v', {
          selectedText: blockTexts[3],
          mode: ['visual', 'blockwise']
        });
      });
      it("add selection to up direction", function() {
        ensure('k', {
          selectedTextOrdered: blockTexts.slice(2, 4)
        });
        return ensure('k', {
          selectedTextOrdered: blockTexts.slice(1, 4)
        });
      });
      return it("delete selection when blocwise is reversed", function() {
        ensure('3 j', {
          selectedTextOrdered: blockTexts.slice(3, 7)
        });
        ensure('k', {
          selectedTextOrdered: blockTexts.slice(3, 6)
        });
        return ensure('2 k', {
          selectedTextOrdered: blockTexts[3]
        });
      });
    });
    describe("C", function() {
      var ensureChange;
      ensureChange = function() {
        ensure('C', {
          mode: 'insert',
          cursor: [[2, 5], [3, 5], [4, 5], [5, 5]],
          text: textAfterDeleted
        });
        editor.insertText("!!!");
        return ensure({
          mode: 'insert',
          cursor: [[2, 8], [3, 8], [4, 8], [5, 8]],
          text: textAfterInserted
        });
      };
      it("change-to-last-character-of-line for each selection", function() {
        selectBlockwise();
        return ensureChange();
      });
      return it("[selection reversed] change-to-last-character-of-line for each selection", function() {
        selectBlockwiseReversely();
        return ensureChange();
      });
    });
    describe("D", function() {
      var ensureDelete;
      ensureDelete = function() {
        return ensure('D', {
          text: textAfterDeleted,
          cursor: [2, 4],
          mode: 'normal'
        });
      };
      it("delete-to-last-character-of-line for each selection", function() {
        selectBlockwise();
        return ensureDelete();
      });
      return it("[selection reversed] delete-to-last-character-of-line for each selection", function() {
        selectBlockwiseReversely();
        return ensureDelete();
      });
    });
    describe("I", function() {
      beforeEach(function() {
        return selectBlockwise();
      });
      return it("enter insert mode with each cursors position set to start of selection", function() {
        keystroke('I');
        editor.insertText("!!!");
        return ensure({
          text: "01234567890123456789\n1-------------------\n2----!!!A---------B----\n3----!!!***********---\n4----!!!+++++++++++--\n5----!!!C---------D-\n6-------------------",
          cursor: [[2, 8], [3, 8], [4, 8], [5, 8]],
          mode: 'insert'
        });
      });
    });
    describe("A", function() {
      beforeEach(function() {
        return selectBlockwise();
      });
      return it("enter insert mode with each cursors position set to end of selection", function() {
        keystroke('A');
        editor.insertText("!!!");
        return ensure({
          text: "01234567890123456789\n1-------------------\n2----A---------B!!!----\n3----***********!!!---\n4----+++++++++++!!!--\n5----C---------D!!!-\n6-------------------",
          cursor: [[2, 19], [3, 19], [4, 19], [5, 19]]
        });
      });
    });
    describe("o and O keybinding", function() {
      beforeEach(function() {
        return selectBlockwise();
      });
      describe('o', function() {
        return it("change blockwiseHead to opposite side and reverse selection", function() {
          keystroke('o');
          ensureBlockwiseSelection({
            head: 'top',
            tail: 'bottom',
            headReversed: true
          });
          keystroke('o');
          return ensureBlockwiseSelection({
            head: 'bottom',
            tail: 'top',
            headReversed: false
          });
        });
      });
      return describe('capital O', function() {
        return it("reverse each selection", function() {
          keystroke('O');
          ensureBlockwiseSelection({
            head: 'bottom',
            tail: 'top',
            headReversed: true
          });
          keystroke('O');
          return ensureBlockwiseSelection({
            head: 'bottom',
            tail: 'top',
            headReversed: false
          });
        });
      });
    });
    describe("shift from characterwise to blockwise", function() {
      describe("when selection is not reversed", function() {
        beforeEach(function() {
          set({
            cursor: [2, 5]
          });
          return ensure('v', {
            selectedText: 'A',
            mode: ['visual', 'characterwise']
          });
        });
        it('case-1', function() {
          ensure('3 j ctrl-v', {
            mode: ['visual', 'blockwise'],
            selectedTextOrdered: ['A', '*', '+', 'C']
          });
          return ensureBlockwiseSelection({
            head: 'bottom',
            tail: 'top',
            headReversed: false
          });
        });
        it('case-2', function() {
          ensure('h 3 j ctrl-v', {
            mode: ['visual', 'blockwise'],
            selectedTextOrdered: ['-A', '-*', '-+', '-C']
          });
          return ensureBlockwiseSelection({
            head: 'bottom',
            tail: 'top',
            headReversed: true
          });
        });
        it('case-3', function() {
          ensure('2 h 3 j ctrl-v', {
            mode: ['visual', 'blockwise'],
            selectedTextOrdered: ['--A', '--*', '--+', '--C']
          });
          return ensureBlockwiseSelection({
            head: 'bottom',
            tail: 'top',
            headReversed: true
          });
        });
        it('case-4', function() {
          ensure('l 3 j ctrl-v', {
            mode: ['visual', 'blockwise'],
            selectedTextOrdered: ['A-', '**', '++', 'C-']
          });
          return ensureBlockwiseSelection({
            head: 'bottom',
            tail: 'top',
            headReversed: false
          });
        });
        return it('case-5', function() {
          ensure('2 l 3 j ctrl-v', {
            mode: ['visual', 'blockwise'],
            selectedTextOrdered: ['A--', '***', '+++', 'C--']
          });
          return ensureBlockwiseSelection({
            head: 'bottom',
            tail: 'top',
            headReversed: false
          });
        });
      });
      return describe("when selection is reversed", function() {
        beforeEach(function() {
          set({
            cursor: [5, 5]
          });
          return ensure('v', {
            selectedText: 'C',
            mode: ['visual', 'characterwise']
          });
        });
        it('case-1', function() {
          ensure('3 k ctrl-v', {
            mode: ['visual', 'blockwise'],
            selectedTextOrdered: ['A', '*', '+', 'C']
          });
          return ensureBlockwiseSelection({
            head: 'top',
            tail: 'bottom',
            headReversed: true
          });
        });
        it('case-2', function() {
          ensure('h 3 k ctrl-v', {
            mode: ['visual', 'blockwise'],
            selectedTextOrdered: ['-A', '-*', '-+', '-C']
          });
          return ensureBlockwiseSelection({
            head: 'top',
            tail: 'bottom',
            headReversed: true
          });
        });
        it('case-3', function() {
          ensure('2 h 3 k ctrl-v', {
            mode: ['visual', 'blockwise'],
            selectedTextOrdered: ['--A', '--*', '--+', '--C']
          });
          return ensureBlockwiseSelection({
            head: 'top',
            tail: 'bottom',
            headReversed: true
          });
        });
        it('case-4', function() {
          ensure('l 3 k ctrl-v', {
            mode: ['visual', 'blockwise'],
            selectedTextOrdered: ['A-', '**', '++', 'C-']
          });
          return ensureBlockwiseSelection({
            head: 'top',
            tail: 'bottom',
            headReversed: false
          });
        });
        return it('case-5', function() {
          ensure('2 l 3 k ctrl-v', {
            mode: ['visual', 'blockwise'],
            selectedTextOrdered: ['A--', '***', '+++', 'C--']
          });
          return ensureBlockwiseSelection({
            head: 'top',
            tail: 'bottom',
            headReversed: false
          });
        });
      });
    });
    describe("shift from blockwise to characterwise", function() {
      var ensureCharacterwiseWasRestored, preserveSelection;
      preserveSelection = function() {
        var cursor, mode, selectedBufferRange, selectedText;
        selectedText = editor.getSelectedText();
        selectedBufferRange = editor.getSelectedBufferRange();
        cursor = editor.getCursorBufferPosition();
        mode = [vimState.mode, vimState.submode];
        return {
          selectedText: selectedText,
          selectedBufferRange: selectedBufferRange,
          cursor: cursor,
          mode: mode
        };
      };
      ensureCharacterwiseWasRestored = function(keystroke) {
        var characterwiseState;
        ensure(keystroke, {
          mode: ['visual', 'characterwise']
        });
        characterwiseState = preserveSelection();
        ensure('ctrl-v', {
          mode: ['visual', 'blockwise']
        });
        return ensure('v', characterwiseState);
      };
      describe("when selection is not reversed", function() {
        beforeEach(function() {
          return set({
            cursor: [2, 5]
          });
        });
        it('case-1', function() {
          return ensureCharacterwiseWasRestored('v');
        });
        it('case-2', function() {
          return ensureCharacterwiseWasRestored('v 3 j');
        });
        it('case-3', function() {
          return ensureCharacterwiseWasRestored('v h 3 j');
        });
        it('case-4', function() {
          return ensureCharacterwiseWasRestored('v 2 h 3 j');
        });
        it('case-5', function() {
          return ensureCharacterwiseWasRestored('v l 3 j');
        });
        return it('case-6', function() {
          return ensureCharacterwiseWasRestored('v 2 l 3 j');
        });
      });
      return describe("when selection is reversed", function() {
        beforeEach(function() {
          return set({
            cursor: [5, 5]
          });
        });
        it('case-1', function() {
          return ensureCharacterwiseWasRestored('v');
        });
        it('case-2', function() {
          return ensureCharacterwiseWasRestored('v 3 k');
        });
        it('case-3', function() {
          return ensureCharacterwiseWasRestored('v h 3 k');
        });
        it('case-4', function() {
          return ensureCharacterwiseWasRestored('v 2 h 3 k');
        });
        it('case-5', function() {
          return ensureCharacterwiseWasRestored('v l 3 k');
        });
        it('case-6', function() {
          return ensureCharacterwiseWasRestored('v 2 l 3 k');
        });
        return it('case-7', function() {
          set({
            cursor: [5, 0]
          });
          return ensureCharacterwiseWasRestored('v 5 l 3 k');
        });
      });
    });
    describe("keep goalColumn", function() {
      describe("when passing through blank row", function() {
        beforeEach(function() {
          return set({
            text: "012345678\n\nABCDEFGHI\n"
          });
        });
        it("when [reversed = false, headReversed = false]", function() {
          set({
            cursor: [0, 3]
          });
          ensure("ctrl-v l l l", {
            cursor: [[0, 7]],
            selectedTextOrdered: ["3456"]
          });
          ensureBlockwiseSelection({
            head: 'bottom',
            tail: 'top',
            reversed: false,
            headReversed: false
          });
          ensure("j", {
            cursor: [[0, 0], [1, 0]],
            selectedTextOrdered: ["0123", ""]
          });
          ensureBlockwiseSelection({
            head: 'bottom',
            tail: 'top',
            reversed: false,
            headReversed: true
          });
          ensure("j", {
            cursor: [[0, 7], [1, 0], [2, 7]],
            selectedTextOrdered: ["3456", "", "DEFG"]
          });
          return ensureBlockwiseSelection({
            head: 'bottom',
            tail: 'top',
            reversed: false,
            headReversed: false
          });
        });
        it("when [reversed = true, headReversed = true]", function() {
          set({
            cursor: [2, 6]
          });
          ensure("ctrl-v h h h", {
            cursor: [[2, 3]],
            selectedTextOrdered: ["DEFG"]
          });
          ensureBlockwiseSelection({
            head: 'top',
            tail: 'bottom',
            reversed: true,
            headReversed: true
          });
          ensure("k", {
            cursor: [[1, 0], [2, 0]],
            selectedTextOrdered: ["", "ABCDEFG"]
          });
          ensureBlockwiseSelection({
            head: 'top',
            tail: 'bottom',
            reversed: true,
            headReversed: true
          });
          ensure("k", {
            cursor: [[0, 3], [1, 0], [2, 3]],
            selectedTextOrdered: ["3456", "", "DEFG"]
          });
          return ensureBlockwiseSelection({
            head: 'top',
            tail: 'bottom',
            reversed: true,
            headReversed: true
          });
        });
        it("when [reversed = false, headReversed = true]", function() {
          set({
            cursor: [0, 6]
          });
          ensure("ctrl-v h h h", {
            cursor: [[0, 3]],
            selectedTextOrdered: ["3456"]
          });
          ensureBlockwiseSelection({
            head: 'bottom',
            tail: 'top',
            reversed: true,
            headReversed: true
          });
          ensure("j", {
            cursor: [[0, 0], [1, 0]],
            selectedTextOrdered: ["0123456", ""]
          });
          ensureBlockwiseSelection({
            head: 'bottom',
            tail: 'top',
            reversed: false,
            headReversed: true
          });
          ensure("j", {
            cursor: [[0, 3], [1, 0], [2, 3]],
            selectedTextOrdered: ["3456", "", "DEFG"]
          });
          return ensureBlockwiseSelection({
            head: 'bottom',
            tail: 'top',
            reversed: false,
            headReversed: true
          });
        });
        return it("when [reversed = true, headReversed = false]", function() {
          set({
            cursor: [2, 3]
          });
          ensure("ctrl-v l l l", {
            cursor: [[2, 7]],
            selectedTextOrdered: ["DEFG"]
          });
          ensureBlockwiseSelection({
            head: 'top',
            tail: 'bottom',
            reversed: false,
            headReversed: false
          });
          ensure("k", {
            cursor: [[1, 0], [2, 0]],
            selectedTextOrdered: ["", "ABCD"]
          });
          ensureBlockwiseSelection({
            head: 'top',
            tail: 'bottom',
            reversed: true,
            headReversed: true
          });
          ensure("k", {
            cursor: [[0, 7], [1, 0], [2, 7]],
            selectedTextOrdered: ["3456", "", "DEFG"]
          });
          return ensureBlockwiseSelection({
            head: 'top',
            tail: 'bottom',
            reversed: true,
            headReversed: false
          });
        });
      });
      return describe("when head cursor position is less than original goal column", function() {
        beforeEach(function() {
          return set({
            text: "012345678901234567890123\n       xxx01234\n012345678901234567890123\n"
          });
        });
        describe("[tailColumn < headColum], goalColumn isnt Infinity", function() {
          it("shrinks block till head column by keeping goalColumn", function() {
            set({
              cursor: [0, 10]
            });
            ensure("ctrl-v 1 0 l", {
              selectedTextOrdered: ["01234567890"],
              cursor: [[0, 21]]
            });
            ensure("j", {
              selectedTextOrdered: ["012345", "01234"],
              cursor: [[0, 16], [1, 15]]
            });
            return ensure("j", {
              selectedTextOrdered: ["01234567890", "01234", "01234567890"],
              cursor: [[0, 21], [1, 15], [2, 21]]
            });
          });
          return it("shrinks block till head column by keeping goalColumn", function() {
            set({
              cursor: [2, 10]
            });
            ensure("ctrl-v 1 0 l", {
              selectedTextOrdered: ["01234567890"],
              cursor: [[2, 21]]
            });
            ensure("k", {
              selectedTextOrdered: ["01234", "012345"],
              cursor: [[1, 15], [2, 16]]
            });
            return ensure("k", {
              selectedTextOrdered: ["01234567890", "01234", "01234567890"],
              cursor: [[0, 21], [1, 15], [2, 21]]
            });
          });
        });
        describe("[tailColumn < headColum], goalColumn is Infinity", function() {
          it("keep each member selection selected till end-of-line( No shrink )", function() {
            set({
              cursor: [0, 10]
            });
            ensure("ctrl-v $", {
              selectedTextOrdered: ["01234567890123"],
              cursor: [[0, 24]]
            });
            ensure("j", {
              selectedTextOrdered: ["01234567890123", "01234"],
              cursor: [[0, 24], [1, 15]]
            });
            return ensure("j", {
              selectedTextOrdered: ["01234567890123", "01234", "01234567890123"],
              cursor: [[0, 24], [1, 15], [2, 24]]
            });
          });
          return it("keep each member selection selected till end-of-line( No shrink )", function() {
            set({
              cursor: [2, 10]
            });
            ensure("ctrl-v $", {
              selectedTextOrdered: ["01234567890123"],
              cursor: [[2, 24]]
            });
            ensure("k", {
              selectedTextOrdered: ["01234", "01234567890123"],
              cursor: [[1, 15], [2, 24]]
            });
            return ensure("k", {
              selectedTextOrdered: ["01234567890123", "01234", "01234567890123"],
              cursor: [[0, 24], [1, 15], [2, 24]]
            });
          });
        });
        describe("[tailColumn > headColum], goalColumn isnt Infinity", function() {
          it("Respect actual head column over goalColumn", function() {
            set({
              cursor: [0, 20]
            });
            ensure("ctrl-v l l", {
              selectedTextOrdered: ["012"],
              cursor: [[0, 23]]
            });
            ensure("j", {
              selectedTextOrdered: ["567890", ""],
              cursor: [[0, 15], [1, 15]]
            });
            return ensure("j", {
              selectedTextOrdered: ["012", "", "012"],
              cursor: [[0, 23], [1, 15], [2, 23]]
            });
          });
          return it("Respect actual head column over goalColumn", function() {
            set({
              cursor: [2, 20]
            });
            ensure("ctrl-v l l", {
              selectedTextOrdered: ["012"],
              cursor: [[2, 23]]
            });
            ensure("k", {
              selectedTextOrdered: ["", "567890"],
              cursor: [[1, 15], [2, 15]]
            });
            return ensure("k", {
              selectedTextOrdered: ["012", "", "012"],
              cursor: [[0, 23], [1, 15], [2, 23]]
            });
          });
        });
        return describe("[tailColumn > headColum], goalColumn is Infinity", function() {
          it("Respect actual head column over goalColumn", function() {
            set({
              cursor: [0, 20]
            });
            ensure("ctrl-v $", {
              selectedTextOrdered: ["0123"],
              cursor: [[0, 24]]
            });
            ensure("j", {
              selectedTextOrdered: ["567890", ""],
              cursor: [[0, 15], [1, 15]]
            });
            return ensure("j", {
              selectedTextOrdered: ["0123", "", "0123"],
              cursor: [[0, 24], [1, 15], [2, 24]]
            });
          });
          return it("Respect actual head column over goalColumn", function() {
            set({
              cursor: [2, 20]
            });
            ensure("ctrl-v $", {
              selectedTextOrdered: ["0123"],
              cursor: [[2, 24]]
            });
            ensure("k", {
              selectedTextOrdered: ["", "567890"],
              cursor: [[1, 15], [2, 15]]
            });
            return ensure("k", {
              selectedTextOrdered: ["0123", "", "0123"],
              cursor: [[0, 24], [1, 15], [2, 24]]
            });
          });
        });
      });
    });
    return describe("gv feature", function() {
      var ensureRestored, preserveSelection;
      preserveSelection = function() {
        var cursor, mode, s, selectedBufferRangeOrdered, selectedTextOrdered, selections;
        selections = editor.getSelectionsOrderedByBufferPosition();
        selectedTextOrdered = (function() {
          var i, len, results;
          results = [];
          for (i = 0, len = selections.length; i < len; i++) {
            s = selections[i];
            results.push(s.getText());
          }
          return results;
        })();
        selectedBufferRangeOrdered = (function() {
          var i, len, results;
          results = [];
          for (i = 0, len = selections.length; i < len; i++) {
            s = selections[i];
            results.push(s.getBufferRange());
          }
          return results;
        })();
        cursor = (function() {
          var i, len, results;
          results = [];
          for (i = 0, len = selections.length; i < len; i++) {
            s = selections[i];
            results.push(s.getHeadScreenPosition());
          }
          return results;
        })();
        mode = [vimState.mode, vimState.submode];
        return {
          selectedTextOrdered: selectedTextOrdered,
          selectedBufferRangeOrdered: selectedBufferRangeOrdered,
          cursor: cursor,
          mode: mode
        };
      };
      ensureRestored = function(keystroke, spec) {
        var preserved;
        ensure(keystroke, spec);
        preserved = preserveSelection();
        ensure('escape j j', {
          mode: 'normal',
          selectedText: ''
        });
        return ensure('g v', preserved);
      };
      describe("linewise selection", function() {
        beforeEach(function() {
          return set({
            cursor: [2, 0]
          });
        });
        describe("immediately after V", function() {
          return it('restore previous selection', function() {
            return ensureRestored('V', {
              selectedText: textData.getLines([2]),
              mode: ['visual', 'linewise']
            });
          });
        });
        describe("selection is not reversed", function() {
          return it('restore previous selection', function() {
            return ensureRestored('V j', {
              selectedText: textData.getLines([2, 3]),
              mode: ['visual', 'linewise']
            });
          });
        });
        return describe("selection is reversed", function() {
          return it('restore previous selection', function() {
            return ensureRestored('V k', {
              selectedText: textData.getLines([1, 2]),
              mode: ['visual', 'linewise']
            });
          });
        });
      });
      describe("characterwise selection", function() {
        beforeEach(function() {
          return set({
            cursor: [2, 0]
          });
        });
        describe("immediately after v", function() {
          return it('restore previous selection', function() {
            return ensureRestored('v', {
              selectedText: "2",
              mode: ['visual', 'characterwise']
            });
          });
        });
        describe("selection is not reversed", function() {
          return it('restore previous selection', function() {
            return ensureRestored('v j', {
              selectedText: "2----A---------B----\n3",
              mode: ['visual', 'characterwise']
            });
          });
        });
        return describe("selection is reversed", function() {
          return it('restore previous selection', function() {
            return ensureRestored('v k', {
              selectedText: "1-------------------\n2",
              mode: ['visual', 'characterwise']
            });
          });
        });
      });
      return describe("blockwise selection", function() {
        describe("immediately after ctrl-v", function() {
          beforeEach(function() {
            return set({
              cursor: [2, 0]
            });
          });
          return it('restore previous selection', function() {
            return ensureRestored('ctrl-v', {
              selectedText: "2",
              mode: ['visual', 'blockwise']
            });
          });
        });
        describe("selection is not reversed", function() {
          it('restore previous selection case-1', function() {
            set({
              cursor: [2, 5]
            });
            keystroke('ctrl-v 1 0 l');
            return ensureRestored('3 j', {
              selectedText: blockTexts.slice(2, 6),
              mode: ['visual', 'blockwise']
            });
          });
          return it('restore previous selection case-2', function() {
            set({
              cursor: [5, 5]
            });
            keystroke('ctrl-v 1 0 l');
            return ensureRestored('3 k', {
              selectedTextOrdered: blockTexts.slice(2, 6),
              mode: ['visual', 'blockwise']
            });
          });
        });
        return describe("selection is reversed", function() {
          it('restore previous selection case-1', function() {
            set({
              cursor: [2, 15]
            });
            keystroke('ctrl-v 1 0 h');
            return ensureRestored('3 j', {
              selectedText: blockTexts.slice(2, 6),
              mode: ['visual', 'blockwise']
            });
          });
          return it('restore previous selection case-2', function() {
            set({
              cursor: [5, 15]
            });
            keystroke('ctrl-v 1 0 h');
            return ensureRestored('3 k', {
              selectedTextOrdered: blockTexts.slice(2, 6),
              mode: ['visual', 'blockwise']
            });
          });
        });
      });
    });
  });

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL2hvbWUvbWFyY3VzLy5hdG9tL3BhY2thZ2VzL3ZpbS1tb2RlLXBsdXMvc3BlYy92aXN1YWwtYmxvY2t3aXNlLXNwZWMuY29mZmVlIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FBQUEsTUFBQSwwQkFBQTtJQUFBOztFQUFBLE1BQTBCLE9BQUEsQ0FBUSxlQUFSLENBQTFCLEVBQUMsNkJBQUQsRUFBYzs7RUFFZCxRQUFBLENBQVMsa0JBQVQsRUFBNkIsU0FBQTtBQUMzQixRQUFBO0lBQUEsT0FBNEQsRUFBNUQsRUFBQyxhQUFELEVBQU0sZ0JBQU4sRUFBYyxtQkFBZCxFQUF5QixnQkFBekIsRUFBaUMsdUJBQWpDLEVBQWdEO0lBQ2hELFdBQUEsR0FBYztJQVVkLGdCQUFBLEdBQW1CO0lBVW5CLGlCQUFBLEdBQW9CO0lBVXBCLFVBQUEsR0FBYSxDQUNYLGFBRFcsRUFFWCxhQUZXLEVBR1gsYUFIVyxFQUlYLGFBSlcsRUFLWCxhQUxXLEVBTVgsYUFOVyxFQU9YLGFBUFc7SUFVYixRQUFBLEdBQWUsSUFBQSxRQUFBLENBQVMsV0FBVDtJQUVmLGVBQUEsR0FBa0IsU0FBQTtNQUNoQixHQUFBLENBQUk7UUFBQSxNQUFBLEVBQVEsQ0FBQyxDQUFELEVBQUksQ0FBSixDQUFSO09BQUo7YUFDQSxNQUFBLENBQU8sb0JBQVAsRUFDRTtRQUFBLElBQUEsRUFBTSxDQUFDLFFBQUQsRUFBVyxXQUFYLENBQU47UUFDQSxtQkFBQSxFQUFxQixDQUNuQixDQUFDLENBQUMsQ0FBRCxFQUFJLENBQUosQ0FBRCxFQUFTLENBQUMsQ0FBRCxFQUFJLEVBQUosQ0FBVCxDQURtQixFQUVuQixDQUFDLENBQUMsQ0FBRCxFQUFJLENBQUosQ0FBRCxFQUFTLENBQUMsQ0FBRCxFQUFJLEVBQUosQ0FBVCxDQUZtQixFQUduQixDQUFDLENBQUMsQ0FBRCxFQUFJLENBQUosQ0FBRCxFQUFTLENBQUMsQ0FBRCxFQUFJLEVBQUosQ0FBVCxD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c0MsQ0FBeEM7aUJBTUEsRUFBQSxDQUFHLG1DQUFILEVBQXdDLFNBQUE7WUFDdEMsR0FBQSxDQUFJO2NBQUEsTUFBQSxFQUFRLENBQUMsQ0FBRCxFQUFJLEVBQUosQ0FBUjthQUFKO1lBQ0EsU0FBQSxDQUFVLGNBQVY7bUJBQ0EsY0FBQSxDQUFlLEtBQWYsRUFDRTtjQUFBLG1CQUFBLEVBQXFCLFVBQVcsWUFBaEM7Y0FDQSxJQUFBLEVBQU0sQ0FBQyxRQUFELEVBQVcsV0FBWCxDQUROO2FBREY7VUFIc0MsQ0FBeEM7UUFQZ0MsQ0FBbEM7TUFyQjhCLENBQWhDO0lBM0RxQixDQUF2QjtFQTdmMkIsQ0FBN0I7QUFGQSIsInNvdXJjZXNDb250ZW50IjpbIntnZXRWaW1TdGF0ZSwgVGV4dERhdGF9ID0gcmVxdWlyZSAnLi9zcGVjLWhlbHBlcidcblxuZGVzY3JpYmUgXCJWaXN1YWwgQmxvY2t3aXNlXCIsIC0+XG4gIFtzZXQsIGVuc3VyZSwga2V5c3Ryb2tlLCBlZGl0b3IsIGVkaXRvckVsZW1lbnQsIHZpbVN0YXRlXSA9IFtdXG4gIHRleHRJbml0aWFsID0gXCJcIlwiXG4gICAgMDEyMzQ1Njc4OTAxMjM0NTY3ODlcbiAgICAxLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgIDItLS0tQS0tLS0tLS0tLUItLS0tXG4gICAgMy0tLS0qKioqKioqKioqKi0tLVxuICAgIDQtLS0tKysrKysrKysrKystLVxuICAgIDUtLS0tQy0tLS0tLS0tLUQtXG4gICAgNi0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICBcIlwiXCJcblxuICB0ZXh0QWZ0ZXJEZWxldGVkID0gXCJcIlwiXG4gICAgMDEyMzQ1Njc4OTAxMjM0NTY3ODlcbiAgICAxLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgIDItLS0tXG4gICAgMy0tLS1cbiAgICA0LS0tLVxuICAgIDUtLS0tXG4gICAgNi0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICBcIlwiXCJcblxuICB0ZXh0QWZ0ZXJJbnNlcnRlZCA9IFwiXCJcIlxuICAgIDAxMjM0NTY3ODkwMTIzNDU2Nzg5XG4gICAgMS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICAyLS0tLSEhIVxuICAgIDMtLS0tISEhXG4gICAgNC0tLS0hISFcbiAgICA1LS0tLSEhIVxuICAgIDYtLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgXCJcIlwiXG5cbiAgYmxvY2tUZXh0cyA9IFtcbiAgICAnNTY3ODkwMTIzNDUnICMgMFxuICAgICctLS0tLS0tLS0tLScgIyAxXG4gICAgJ0EtLS0tLS0tLS1CJyAjIDJcbiAgICAnKioqKioqKioqKionICMgM1xuICAgICcrKysrKysrKysrKycgIyA0XG4gICAgJ0MtLS0tLS0tLS1EJyAjIDVcbiAgICAnLS0tLS0tLS0tLS0nICMgNlxuICBdXG5cbiAgdGV4dERhdGEgPSBuZXcgVGV4dERhdGEodGV4dEluaXRpYWwpXG5cbiAgc2VsZWN0QmxvY2t3aXNlID0gLT5cbiAgICBzZXQgY3Vyc29yOiBbMiwgNV1cbiAgICBlbnN1cmUgJ3YgMyBqIDEgMCBsIGN0cmwtdicsXG4gICAgICBtb2RlOiBbJ3Zpc3VhbCcsICdibG9ja3dpc2UnXVxuICAgICAgc2VsZWN0ZWRCdWZmZXJSYW5nZTogW1xuICAgICAgICBbWzIsIDVdLCBbMiwgMTZdXVxuICAgICAgICBbWzMsIDVdLCBbMywgMTZdXVxuICAgICAgICBbWzQsIDVdLCBbNCwgMTZdXVxuICAgICAgICBbWzUsIDVdLCBbNSwgMTZdXVxuICAgICAgXVxuICAgICAgc2VsZWN0ZWRUZXh0OiBibG9ja1RleHRzWzIuLjVdXG5cbiAgc2VsZWN0QmxvY2t3aXNlUmV2ZXJzZWx5ID0gLT5cbiAgICBzZXQgY3Vyc29yOiBbMiwgMTVdXG4gICAgZW5zdXJlICd2IDMgaiAxIDAgaCBjdHJsLXYnLFxuICAgICAgbW9kZTogWyd2aXN1YWwnLCAnYmxvY2t3aXNlJ11cbiAgICAgIHNlbGVjdGVkQnVmZmVyUmFuZ2U6IFtcbiAgICAgICAgW1syLCA1XSwgWzIsIDE2XV1cbiAgICAgICAgW1szLCA1XSwgWzMsIDE2XV1cbiAgICAgICAgW1s0LCA1XSwgWzQsIDE2XV1cbiAgICAgICAgW1s1LCA1XSwgWzUsIDE2XV1cbiAgICAgIF1cbiAgICAgIHNlbGVjdGVkVGV4dDogYmxvY2tUZXh0c1syLi41XVxuXG4gIGVuc3VyZUJsb2Nrd2lzZVNlbGVjdGlvbiA9IChvKSAtPlxuICAgIHNlbGVjdGlvbnMgPSBlZGl0b3IuZ2V0U2VsZWN0aW9uc09yZGVyZWRCeUJ1ZmZlclBvc2l0aW9uKClcbiAgICBpZiBzZWxlY3Rpb25zLmxlbmd0aCBpcyAxXG4gICAgICBmaXJzdCA9IGxhc3QgPSBzZWxlY3Rpb25zWzBdXG4gICAgZWxzZVxuICAgICAgW2ZpcnN0LCBvdGhlcnMuLi4sIGxhc3RdID0gc2VsZWN0aW9uc1xuXG4gICAgaGVhZCA9IHN3aXRjaCBvLmhlYWRcbiAgICAgIHdoZW4gJ3RvcCcgdGhlbiBmaXJzdFxuICAgICAgd2hlbiAnYm90dG9tJyB0aGVuIGxhc3RcbiAgICBicyA9IHZpbVN0YXRlLmdldExhc3RCbG9ja3dpc2VTZWxlY3Rpb24oKVxuXG4gICAgZXhwZWN0KGJzLmdldEhlYWRTZWxlY3Rpb24oKSkudG9CZSBoZWFkXG4gICAgdGFpbCA9IHN3aXRjaCBvLnRhaWxcbiAgICAgIHdoZW4gJ3RvcCcgdGhlbiBmaXJzdFxuICAgICAgd2hlbiAnYm90dG9tJyB0aGVuIGxhc3RcbiAgICBleHBlY3QoYnMuZ2V0VGFpbFNlbGVjdGlvbigpKS50b0JlIHRhaWxcblxuICAgIGZvciBzIGluIG90aGVycyA/IFtdXG4gICAgICBleHBlY3QoYnMuZ2V0SGVhZFNlbGVjdGlvbigpKS5ub3QudG9CZSBzXG4gICAgICBleHBlY3QoYnMuZ2V0VGFpbFNlbGVjdGlvbigpKS5ub3QudG9CZSBzXG5cbiAgICBpZiBvLnJldmVyc2VkP1xuICAgICAgZXhwZWN0KGJzLmlzUmV2ZXJzZWQoKSkudG9CZSBvLnJldmVyc2VkXG5cbiAgICBpZiBvLmhlYWRSZXZlcnNlZD9cbiAgICAgIGZvciBzIGluIHNlbGVjdGlvbnNcbiAgICAgICAgZXhwZWN0KHMuaXNSZXZlcnNlZCgpKS50b0JlIG8uaGVhZFJldmVyc2VkXG5cbiAgYmVmb3JlRWFjaCAtPlxuICAgIGdldFZpbVN0YXRlIChzdGF0ZSwgdmltRWRpdG9yKSAtPlxuICAgICAgdmltU3RhdGUgPSBzdGF0ZVxuICAgICAge2VkaXRvciwgZWRpdG9yRWxlbWVudH0gPSB2aW1TdGF0ZVxuICAgICAge3NldCwgZW5zdXJlLCBrZXlzdHJva2V9ID0gdmltRWRpdG9yXG5cbiAgICBydW5zIC0+XG4gICAgICBzZXQgdGV4dDogdGV4dEluaXRpYWxcblxuICBkZXNjcmliZSBcImpcIiwgLT5cbiAgICBiZWZvcmVFYWNoIC0+XG4gICAgICBzZXQgY3Vyc29yOiBbMywgNV1cbiAgICAgIGVuc3VyZSAndiAxIDAgbCBjdHJsLXYnLFxuICAgICAgICBzZWxlY3RlZFRleHQ6IGJsb2NrVGV4dHNbM11cbiAgICAgICAgbW9kZTogWyd2aXN1YWwnLCAnYmxvY2t3aXNlJ11cblxuICAgIGl0IFwiYWRkIHNlbGVjdGlvbiB0byBkb3duIGRpcmVjdGlvblwiLCAtPlxuICAgICAgZW5zdXJlICdqJywgc2VsZWN0ZWRUZXh0OiBibG9ja1RleHRzWzMuLjRdXG4gICAgICBlbnN1cmUgJ2onLCBzZWxlY3RlZFRleHQ6IGJsb2NrVGV4dHNbMy4uNV1cblxuICAgIGl0IFwiZGVsZXRlIHNlbGVjdGlvbiB3aGVuIGJsb2N3aXNlIGlzIHJldmVyc2VkXCIsIC0+XG4gICAgICBlbnN1cmUgJzMgaycsIHNlbGVjdGVkVGV4dE9yZGVyZWQ6IGJsb2NrVGV4dHNbMC4uM11cbiAgICAgIGVuc3VyZSAnaicsIHNlbGVjdGVkVGV4dE9yZGVyZWQ6IGJsb2NrVGV4dHNbMS4uM11cbiAgICAgIGVuc3VyZSAnMiBqJywgc2VsZWN0ZWRUZXh0T3JkZXJlZDogYmxvY2tUZXh0c1szXVxuXG4gICAgaXQgXCJrZWVwIHRhaWwgcm93IHdoZW4gcmV2ZXJzZWQgc3RhdHVzIGNoYW5nZWRcIiwgLT5cbiAgICAgIGVuc3VyZSAnaicsIHNlbGVjdGVkVGV4dDogYmxvY2tUZXh0c1szLi40XVxuICAgICAgZW5zdXJlICcyIGsnLCBzZWxlY3RlZFRleHRPcmRlcmVkOiBibG9ja1RleHRzWzIuLjNdXG5cbiAgZGVzY3JpYmUgXCJrXCIsIC0+XG4gICAgYmVmb3JlRWFjaCAtPlxuICAgICAgc2V0IGN1cnNvcjogWzMsIDVdXG4gICAgICBlbnN1cmUgJ3YgMSAwIGwgY3RybC12JyxcbiAgICAgICAgc2VsZWN0ZWRUZXh0OiBibG9ja1RleHRzWzNdXG4gICAgICAgIG1vZGU6IFsndmlzdWFsJywgJ2Jsb2Nrd2lzZSddXG5cbiAgICBpdCBcImFkZCBzZWxlY3Rpb24gdG8gdXAgZGlyZWN0aW9uXCIsIC0+XG4gICAgICBlbnN1cmUgJ2snLCBzZWxlY3RlZFRleHRPcmRlcmVkOiBibG9ja1RleHRzWzIuLjNdXG4gICAgICBlbnN1cmUgJ2snLCBzZWxlY3RlZFRleHRPcmRlcmVkOiBibG9ja1RleHRzWzEuLjNdXG5cbiAgICBpdCBcImRlbGV0ZSBzZWxlY3Rpb24gd2hlbiBibG9jd2lzZSBpcyByZXZlcnNlZFwiLCAtPlxuICAgICAgZW5zdXJlICczIGonLCBzZWxlY3RlZFRleHRPcmRlcmVkOiBibG9ja1RleHRzWzMuLjZdXG4gICAgICBlbnN1cmUgJ2snLCBzZWxlY3RlZFRleHRPcmRlcmVkOiBibG9ja1RleHRzWzMuLjVdXG4gICAgICBlbnN1cmUgJzIgaycsIHNlbGVjdGVkVGV4dE9yZGVyZWQ6IGJsb2NrVGV4dHNbM11cblxuICAjIEZJWE1FIGFkZCBDLCBEIHNwZWMgZm9yIHNlbGVjdEJsb2Nrd2lzZVJldmVyc2VseSgpIHNpdHVhdGlvblxuICBkZXNjcmliZSBcIkNcIiwgLT5cbiAgICBlbnN1cmVDaGFuZ2UgPSAtPlxuICAgICAgZW5zdXJlICdDJyxcbiAgICAgICAgbW9kZTogJ2luc2VydCdcbiAgICAgICAgY3Vyc29yOiBbWzIsIDVdLCBbMywgNV0sIFs0LCA1XSwgWzUsIDVdIF1cbiAgICAgICAgdGV4dDogdGV4dEFmdGVyRGVsZXRlZFxuICAgICAgZWRpdG9yLmluc2VydFRleHQoXCIhISFcIilcbiAgICAgIGVuc3VyZVxuICAgICAgICBtb2RlOiAnaW5zZXJ0J1xuICAgICAgICBjdXJzb3I6IFtbMiwgOF0sIFszLCA4XSwgWzQsIDhdLCBbNSwgOF1dXG4gICAgICAgIHRleHQ6IHRleHRBZnRlckluc2VydGVkXG5cbiAgICBpdCBcImNoYW5nZS10by1sYXN0LWNoYXJhY3Rlci1vZi1saW5lIGZvciBlYWNoIHNlbGVjdGlvblwiLCAtPlxuICAgICAgc2VsZWN0QmxvY2t3aXNlKClcbiAgICAgIGVuc3VyZUNoYW5nZSgpXG5cbiAgICBpdCBcIltzZWxlY3Rpb24gcmV2ZXJzZWRdIGNoYW5nZS10by1sYXN0LWNoYXJhY3Rlci1vZi1saW5lIGZvciBlYWNoIHNlbGVjdGlvblwiLCAtPlxuICAgICAgc2VsZWN0QmxvY2t3aXNlUmV2ZXJzZWx5KClcbiAgICAgIGVuc3VyZUNoYW5nZSgpXG5cbiAgZGVzY3JpYmUgXCJEXCIsIC0+XG4gICAgZW5zdXJlRGVsZXRlID0gLT5cbiAgICAgIGVuc3VyZSAnRCcsXG4gICAgICAgIHRleHQ6IHRleHRBZnRlckRlbGV0ZWRcbiAgICAgICAgY3Vyc29yOiBbMiwgNF1cbiAgICAgICAgbW9kZTogJ25vcm1hbCdcblxuICAgIGl0IFwiZGVsZXRlLXRvLWxhc3QtY2hhcmFjdGVyLW9mLWxpbmUgZm9yIGVhY2ggc2VsZWN0aW9uXCIsIC0+XG4gICAgICBzZWxlY3RCbG9ja3dpc2UoKVxuICAgICAgZW5zdXJlRGVsZXRlKClcbiAgICBpdCBcIltzZWxlY3Rpb24gcmV2ZXJzZWRdIGRlbGV0ZS10by1sYXN0LWNoYXJhY3Rlci1vZi1saW5lIGZvciBlYWNoIHNlbGVjdGlvblwiLCAtPlxuICAgICAgc2VsZWN0QmxvY2t3aXNlUmV2ZXJzZWx5KClcbiAgICAgIGVuc3VyZURlbGV0ZSgpXG5cbiAgZGVzY3JpYmUgXCJJXCIsIC0+XG4gICAgYmVmb3JlRWFjaCAtPlxuICAgICAgc2VsZWN0QmxvY2t3aXNlKClcbiAgICBpdCBcImVudGVyIGluc2VydCBtb2RlIHdpdGggZWFjaCBjdXJzb3JzIHBvc2l0aW9uIHNldCB0byBzdGFydCBvZiBzZWxlY3Rpb25cIiwgLT5cbiAgICAgIGtleXN0cm9rZSAnSSdcbiAgICAgIGVkaXRvci5pbnNlcnRUZXh0IFwiISEhXCJcbiAgICAgIGVuc3VyZVxuICAgICAgICB0ZXh0OiBcIlwiXCJcbiAgICAgICAgICAwMTIzNDU2Nzg5MDEyMzQ1Njc4OVxuICAgICAgICAgIDEtLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgICAgICAgMi0tLS0hISFBLS0tLS0tLS0tQi0tLS1cbiAgICAgICAgICAzLS0tLSEhISoqKioqKioqKioqLS0tXG4gICAgICAgICAgNC0tLS0hISErKysrKysrKysrKy0tXG4gICAgICAgICAgNS0tLS0hISFDLS0tLS0tLS0tRC1cbiAgICAgICAgICA2LS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgICAgICAgIFwiXCJcIlxuICAgICAgICBjdXJzb3I6IFtcbiAgICAgICAgICAgIFsyLCA4XSxcbiAgICAgICAgICAgIFszLCA4XSxcbiAgICAgICAgICAgIFs0LCA4XSxcbiAgICAgICAgICAgIFs1LCA4XSxcbiAgICAgICAgICBdXG4gICAgICAgIG1vZGU6ICdpbnNlcnQnXG5cbiAgZGVzY3JpYmUgXCJBXCIsIC0+XG4gICAgYmVmb3JlRWFjaCAtPlxuICAgICAgc2VsZWN0QmxvY2t3aXNlKClcbiAgICBpdCBcImVudGVyIGluc2VydCBtb2RlIHdpdGggZWFjaCBjdXJzb3JzIHBvc2l0aW9uIHNldCB0byBlbmQgb2Ygc2VsZWN0aW9uXCIsIC0+XG4gICAgICBrZXlzdHJva2UgJ0EnXG4gICAgICBlZGl0b3IuaW5zZXJ0VGV4dCBcIiEhIVwiXG4gICAgICBlbnN1cmVcbiAgICAgICAgdGV4dDogXCJcIlwiXG4gICAgICAgICAgMDEyMzQ1Njc4OTAxMjM0NTY3ODlcbiAgICAgICAgICAxLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgICAgICAgIDItLS0tQS0tLS0tLS0tLUIhISEtLS0tXG4gICAgICAgICAgMy0tLS0qKioqKioqKioqKiEhIS0tLVxuICAgICAgICAgIDQtLS0tKysrKysrKysrKyshISEtLVxuICAgICAgICAgIDUtLS0tQy0tLS0tLS0tLUQhISEtXG4gICAgICAgICAgNi0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICAgICAgICBcIlwiXCJcbiAgICAgICAgY3Vyc29yOiBbXG4gICAgICAgICAgICBbMiwgMTldLFxuICAgICAgICAgICAgWzMsIDE5XSxcbiAgICAgICAgICAgIFs0LCAxOV0sXG4gICAgICAgICAgICBbNSwgMTldLFxuICAgICAgICAgIF1cblxuICBkZXNjcmliZSBcIm8gYW5kIE8ga2V5YmluZGluZ1wiLCAtPlxuICAgIGJlZm9yZUVhY2ggLT5cbiAgICAgIHNlbGVjdEJsb2Nrd2lzZSgpXG5cbiAgICBkZXNjcmliZSAnbycsIC0+XG4gICAgICBpdCBcImNoYW5nZSBibG9ja3dpc2VIZWFkIHRvIG9wcG9zaXRlIHNpZGUgYW5kIHJldmVyc2Ugc2VsZWN0aW9uXCIsIC0+XG4gICAgICAgIGtleXN0cm9rZSAnbydcbiAgICAgICAgZW5zdXJlQmxvY2t3aXNlU2VsZWN0aW9uIGhlYWQ6ICd0b3AnLCB0YWlsOiAnYm90dG9tJywgaGVhZFJldmVyc2VkOiB0cnVlXG5cbiAgICAgICAga2V5c3Ryb2tlICdvJ1xuICAgICAgICBlbnN1cmVCbG9ja3dpc2VTZWxlY3Rpb24gaGVhZDogJ2JvdHRvbScsIHRhaWw6ICd0b3AnLCBoZWFkUmV2ZXJzZWQ6IGZhbHNlXG4gICAgZGVzY3JpYmUgJ2NhcGl0YWwgTycsIC0+XG4gICAgICBpdCBcInJldmVyc2UgZWFjaCBzZWxlY3Rpb25cIiwgLT5cbiAgICAgICAga2V5c3Ryb2tlICdPJ1xuICAgICAgICBlbnN1cmVCbG9ja3dpc2VTZWxlY3Rpb24gaGVhZDogJ2JvdHRvbScsIHRhaWw6ICd0b3AnLCBoZWFkUmV2ZXJzZWQ6IHRydWVcbiAgICAgICAga2V5c3Ryb2tlICdPJ1xuICAgICAgICBlbnN1cmVCbG9ja3dpc2VTZWxlY3Rpb24gaGVhZDogJ2JvdHRvbScsIHRhaWw6ICd0b3AnLCBoZWFkUmV2ZXJzZWQ6IGZhbHNlXG5cbiAgZGVzY3JpYmUgXCJzaGlmdCBmcm9tIGNoYXJhY3Rlcndpc2UgdG8gYmxvY2t3aXNlXCIsIC0+XG4gICAgZGVzY3JpYmUgXCJ3aGVuIHNlbGVjdGlvbiBpcyBub3QgcmV2ZXJzZWRcIiwgLT5cbiAgICAgIGJlZm9yZUVhY2ggLT5cbiAgICAgICAgc2V0IGN1cnNvcjogWzIsIDVdXG4gICAgICAgIGVuc3VyZSAndicsXG4gICAgICAgICAgc2VsZWN0ZWRUZXh0OiAnQSdcbiAgICAgICAgICBtb2RlOiBbJ3Zpc3VhbCcsICdjaGFyYWN0ZXJ3aXNlJ11cblxuICAgICAgaXQgJ2Nhc2UtMScsIC0+XG4gICAgICAgIGVuc3VyZSAnMyBqIGN0cmwtdicsXG4gICAgICAgICAgbW9kZTogWyd2aXN1YWwnLCAnYmxvY2t3aXNlJ11cbiAgICAgICAgICBzZWxlY3RlZFRleHRPcmRlcmVkOiBbXG4gICAgICAgICAgICAnQSdcbiAgICAgICAgICAgICcqJ1xuICAgICAgICAgICAgJysnXG4gICAgICAgICAgICAnQydcbiAgICAgICAgICBdXG4gICAgICAgIGVuc3VyZUJsb2Nrd2lzZVNlbGVjdGlvbiBoZWFkOiAnYm90dG9tJywgdGFpbDogJ3RvcCcsIGhlYWRSZXZlcnNlZDogZmFsc2VcblxuICAgICAgaXQgJ2Nhc2UtMicsIC0+XG4gICAgICAgIGVuc3VyZSAnaCAzIGogY3RybC12JyxcbiAgICAgICAgICBtb2RlOiBbJ3Zpc3VhbCcsICdibG9ja3dpc2UnXVxuICAgICAgICAgIHNlbGVjdGVkVGV4dE9yZGVyZWQ6IFtcbiAgICAgICAgICAgICctQSdcbiAgICAgICAgICAgICctKidcbiAgICAgICAgICAgICctKydcbiAgICAgICAgICAgICctQydcbiAgICAgICAgICBdXG4gICAgICAgIGVuc3VyZUJsb2Nrd2lzZVNlbGVjdGlvbiBoZWFkOiAnYm90dG9tJywgdGFpbDogJ3RvcCcsIGhlYWRSZXZlcnNlZDogdHJ1ZVxuXG4gICAgICBpdCAnY2FzZS0zJywgLT5cbiAgICAgICAgZW5zdXJlICcyIGggMyBqIGN0cmwtdicsXG4gICAgICAgICAgbW9kZTogWyd2aXN1YWwnLCAnYmxvY2t3aXNlJ11cbiAgICAgICAgICBzZWxlY3RlZFRleHRPcmRlcmVkOiBbXG4gICAgICAgICAgICAnLS1BJ1xuICAgICAgICAgICAgJy0tKidcbiAgICAgICAgICAgICctLSsnXG4gICAgICAgICAgICAnLS1DJ1xuICAgICAgICAgIF1cbiAgICAgICAgZW5zdXJlQmxvY2t3aXNlU2VsZWN0aW9uIGhlYWQ6ICdib3R0b20nLCB0YWlsOiAndG9wJywgaGVhZFJldmVyc2VkOiB0cnVlXG5cbiAgICAgIGl0ICdjYXNlLTQnLCAtPlxuICAgICAgICBlbnN1cmUgJ2wgMyBqIGN0cmwtdicsXG4gICAgICAgICAgbW9kZTogWyd2aXN1YWwnLCAnYmxvY2t3aXNlJ11cbiAgICAgICAgICBzZWxlY3RlZFRleHRPcmRlcmVkOiBbXG4gICAgICAgICAgICAnQS0nXG4gICAgICAgICAgICAnKionXG4gICAgICAgICAgICAnKysnXG4gICAgICAgICAgICAnQy0nXG4gICAgICAgICAgXVxuICAgICAgICBlbnN1cmVCbG9ja3dpc2VTZWxlY3Rpb24gaGVhZDogJ2JvdHRvbScsIHRhaWw6ICd0b3AnLCBoZWFkUmV2ZXJzZWQ6IGZhbHNlXG4gICAgICBpdCAnY2FzZS01JywgLT5cbiAgICAgICAgZW5zdXJlICcyIGwgMyBqIGN0cmwtdicsXG4gICAgICAgICAgbW9kZTogWyd2aXN1YWwnLCAnYmxvY2t3aXNlJ11cbiAgICAgICAgICBzZWxlY3RlZFRleHRPcmRlcmVkOiBbXG4gICAgICAgICAgICAnQS0tJ1xuICAgICAgICAgICAgJyoqKidcbiAgICAgICAgICAgICcrKysnXG4gICAgICAgICAgICAnQy0tJ1xuICAgICAgICAgIF1cbiAgICAgICAgZW5zdXJlQmxvY2t3aXNlU2VsZWN0aW9uIGhlYWQ6ICdib3R0b20nLCB0YWlsOiAndG9wJywgaGVhZFJldmVyc2VkOiBmYWxzZVxuXG4gICAgZGVzY3JpYmUgXCJ3aGVuIHNlbGVjdGlvbiBpcyByZXZlcnNlZFwiLCAtPlxuICAgICAgYmVmb3JlRWFjaCAtPlxuICAgICAgICBzZXQgY3Vyc29yOiBbNSwgNV1cbiAgICAgICAgZW5zdXJlICd2JyxcbiAgICAgICAgICBzZWxlY3RlZFRleHQ6ICdDJ1xuICAgICAgICAgIG1vZGU6IFsndmlzdWFsJywgJ2NoYXJhY3Rlcndpc2UnXVxuXG4gICAgICBpdCAnY2FzZS0xJywgLT5cbiAgICAgICAgZW5zdXJlICczIGsgY3RybC12JyxcbiAgICAgICAgICBtb2RlOiBbJ3Zpc3VhbCcsICdibG9ja3dpc2UnXVxuICAgICAgICAgIHNlbGVjdGVkVGV4dE9yZGVyZWQ6IFtcbiAgICAgICAgICAgICdBJ1xuICAgICAgICAgICAgJyonXG4gICAgICAgICAgICAnKydcbiAgICAgICAgICAgICdDJ1xuICAgICAgICAgIF1cbiAgICAgICAgZW5zdXJlQmxvY2t3aXNlU2VsZWN0aW9uIGhlYWQ6ICd0b3AnLCB0YWlsOiAnYm90dG9tJywgaGVhZFJldmVyc2VkOiB0cnVlXG5cbiAgICAgIGl0ICdjYXNlLTInLCAtPlxuICAgICAgICBlbnN1cmUgJ2ggMyBrIGN0cmwtdicsXG4gICAgICAgICAgbW9kZTogWyd2aXN1YWwnLCAnYmxvY2t3aXNlJ11cbiAgICAgICAgICBzZWxlY3RlZFRleHRPcmRlcmVkOiBbXG4gICAgICAgICAgICAnLUEnXG4gICAgICAgICAgICAnLSonXG4gICAgICAgICAgICAnLSsnXG4gICAgICAgICAgICAnLUMnXG4gICAgICAgICAgXVxuICAgICAgICBlbnN1cmVCbG9ja3dpc2VTZWxlY3Rpb24gaGVhZDogJ3RvcCcsIHRhaWw6ICdib3R0b20nLCBoZWFkUmV2ZXJzZWQ6IHRydWVcblxuICAgICAgaXQgJ2Nhc2UtMycsIC0+XG4gICAgICAgIGVuc3VyZSAnMiBoIDMgayBjdHJsLXYnLFxuICAgICAgICAgIG1vZGU6IFsndmlzdWFsJywgJ2Jsb2Nrd2lzZSddXG4gICAgICAgICAgc2VsZWN0ZWRUZXh0T3JkZXJlZDogW1xuICAgICAgICAgICAgJy0tQSdcbiAgICAgICAgICAgICctLSonXG4gICAgICAgICAgICAnLS0rJ1xuICAgICAgICAgICAgJy0tQydcbiAgICAgICAgICBdXG4gICAgICAgIGVuc3VyZUJsb2Nrd2lzZVNlbGVjdGlvbiBoZWFkOiAndG9wJywgdGFpbDogJ2JvdHRvbScsIGhlYWRSZXZlcnNlZDogdHJ1ZVxuXG4gICAgICBpdCAnY2FzZS00JywgLT5cbiAgICAgICAgZW5zdXJlICdsIDMgayBjdHJsLXYnLFxuICAgICAgICAgIG1vZGU6IFsndmlzdWFsJywgJ2Jsb2Nrd2lzZSddXG4gICAgICAgICAgc2VsZWN0ZWRUZXh0T3JkZXJlZDogW1xuICAgICAgICAgICAgJ0EtJ1xuICAgICAgICAgICAgJyoqJ1xuICAgICAgICAgICAgJysrJ1xuICAgICAgICAgICAgJ0MtJ1xuICAgICAgICAgIF1cbiAgICAgICAgZW5zdXJlQmxvY2t3aXNlU2VsZWN0aW9uIGhlYWQ6ICd0b3AnLCB0YWlsOiAnYm90dG9tJywgaGVhZFJldmVyc2VkOiBmYWxzZVxuXG4gICAgICBpdCAnY2FzZS01JywgLT5cbiAgICAgICAgZW5zdXJlICcyIGwgMyBrIGN0cmwtdicsXG4gICAgICAgICAgbW9kZTogWyd2aXN1YWwnLCAnYmxvY2t3aXNlJ11cbiAgICAgICAgICBzZWxlY3RlZFRleHRPcmRlcmVkOiBbXG4gICAgICAgICAgICAnQS0tJ1xuICAgICAgICAgICAgJyoqKidcbiAgICAgICAgICAgICcrKysnXG4gICAgICAgICAgICAnQy0tJ1xuICAgICAgICAgIF1cbiAgICAgICAgZW5zdXJlQmxvY2t3aXNlU2VsZWN0aW9uIGhlYWQ6ICd0b3AnLCB0YWlsOiAnYm90dG9tJywgaGVhZFJldmVyc2VkOiBmYWxzZVxuXG4gIGRlc2NyaWJlIFwic2hpZnQgZnJvbSBibG9ja3dpc2UgdG8gY2hhcmFjdGVyd2lzZVwiLCAtPlxuICAgIHByZXNlcnZlU2VsZWN0aW9uID0gLT5cbiAgICAgIHNlbGVjdGVkVGV4dCA9IGVkaXRvci5nZXRTZWxlY3RlZFRleHQoKVxuICAgICAgc2VsZWN0ZWRCdWZmZXJSYW5nZSA9IGVkaXRvci5nZXRTZWxlY3RlZEJ1ZmZlclJhbmdlKClcbiAgICAgIGN1cnNvciA9IGVkaXRvci5nZXRDdXJzb3JCdWZmZXJQb3NpdGlvbigpXG4gICAgICBtb2RlID0gW3ZpbVN0YXRlLm1vZGUsIHZpbVN0YXRlLnN1Ym1vZGVdXG4gICAgICB7c2VsZWN0ZWRUZXh0LCBzZWxlY3RlZEJ1ZmZlclJhbmdlLCBjdXJzb3IsIG1vZGV9XG5cbiAgICBlbnN1cmVDaGFyYWN0ZXJ3aXNlV2FzUmVzdG9yZWQgPSAoa2V5c3Ryb2tlKSAtPlxuICAgICAgZW5zdXJlIGtleXN0cm9rZSwgbW9kZTogWyd2aXN1YWwnLCAnY2hhcmFjdGVyd2lzZSddXG4gICAgICBjaGFyYWN0ZXJ3aXNlU3RhdGUgPSBwcmVzZXJ2ZVNlbGVjdGlvbigpXG4gICAgICBlbnN1cmUgJ2N0cmwtdicsIG1vZGU6IFsndmlzdWFsJywgJ2Jsb2Nrd2lzZSddXG4gICAgICBlbnN1cmUgJ3YnLCBjaGFyYWN0ZXJ3aXNlU3RhdGVcblxuICAgIGRlc2NyaWJlIFwid2hlbiBzZWxlY3Rpb24gaXMgbm90IHJldmVyc2VkXCIsIC0+XG4gICAgICBiZWZvcmVFYWNoIC0+XG4gICAgICAgIHNldCBjdXJzb3I6IFsyLCA1XVxuICAgICAgaXQgJ2Nhc2UtMScsIC0+IGVuc3VyZUNoYXJhY3Rlcndpc2VXYXNSZXN0b3JlZCgndicpXG4gICAgICBpdCAnY2FzZS0yJywgLT4gZW5zdXJlQ2hhcmFjdGVyd2lzZVdhc1Jlc3RvcmVkKCd2IDMgaicpXG4gICAgICBpdCAnY2FzZS0zJywgLT4gZW5zdXJlQ2hhcmFjdGVyd2lzZVdhc1Jlc3RvcmVkKCd2IGggMyBqJylcbiAgICAgIGl0ICdjYXNlLTQnLCAtPiBlbnN1cmVDaGFyYWN0ZXJ3aXNlV2FzUmVzdG9yZWQoJ3YgMiBoIDMgaicpXG4gICAgICBpdCAnY2FzZS01JywgLT4gZW5zdXJlQ2hhcmFjdGVyd2lzZVdhc1Jlc3RvcmVkKCd2IGwgMyBqJylcbiAgICAgIGl0ICdjYXNlLTYnLCAtPiBlbnN1cmVDaGFyYWN0ZXJ3aXNlV2FzUmVzdG9yZWQoJ3YgMiBsIDMgaicpXG4gICAgZGVzY3JpYmUgXCJ3aGVuIHNlbGVjdGlvbiBpcyByZXZlcnNlZFwiLCAtPlxuICAgICAgYmVmb3JlRWFjaCAtPlxuICAgICAgICBzZXQgY3Vyc29yOiBbNSwgNV1cbiAgICAgIGl0ICdjYXNlLTEnLCAtPiBlbnN1cmVDaGFyYWN0ZXJ3aXNlV2FzUmVzdG9yZWQoJ3YnKVxuICAgICAgaXQgJ2Nhc2UtMicsIC0+IGVuc3VyZUNoYXJhY3Rlcndpc2VXYXNSZXN0b3JlZCgndiAzIGsnKVxuICAgICAgaXQgJ2Nhc2UtMycsIC0+IGVuc3VyZUNoYXJhY3Rlcndpc2VXYXNSZXN0b3JlZCgndiBoIDMgaycpXG4gICAgICBpdCAnY2FzZS00JywgLT4gZW5zdXJlQ2hhcmFjdGVyd2lzZVdhc1Jlc3RvcmVkKCd2IDIgaCAzIGsnKVxuICAgICAgaXQgJ2Nhc2UtNScsIC0+IGVuc3VyZUNoYXJhY3Rlcndpc2VXYXNSZXN0b3JlZCgndiBsIDMgaycpXG4gICAgICBpdCAnY2FzZS02JywgLT4gZW5zdXJlQ2hhcmFjdGVyd2lzZVdhc1Jlc3RvcmVkKCd2IDIgbCAzIGsnKVxuICAgICAgaXQgJ2Nhc2UtNycsIC0+IHNldCBjdXJzb3I6IFs1LCAwXTsgZW5zdXJlQ2hhcmFjdGVyd2lzZVdhc1Jlc3RvcmVkKCd2IDUgbCAzIGsnKVxuXG4gIGRlc2NyaWJlIFwia2VlcCBnb2FsQ29sdW1uXCIsIC0+XG4gICAgZGVzY3JpYmUgXCJ3aGVuIHBhc3NpbmcgdGhyb3VnaCBibGFuayByb3dcIiwgLT5cbiAgICAgIGJlZm9yZUVhY2ggLT5cbiAgICAgICAgc2V0XG4gICAgICAgICAgdGV4dDogXCJcIlwiXG4gICAgICAgICAgMDEyMzQ1Njc4XG5cbiAgICAgICAgICBBQkNERUZHSElcXG5cbiAgICAgICAgICBcIlwiXCJcblxuICAgICAgaXQgXCJ3aGVuIFtyZXZlcnNlZCA9IGZhbHNlLCBoZWFkUmV2ZXJzZWQgPSBmYWxzZV1cIiwgLT5cbiAgICAgICAgc2V0IGN1cnNvcjogWzAsIDNdXG4gICAgICAgIGVuc3VyZSBcImN0cmwtdiBsIGwgbFwiLCBjdXJzb3I6IFtbMCwgN11dLCBzZWxlY3RlZFRleHRPcmRlcmVkOiBbXCIzNDU2XCJdXG4gICAgICAgIGVuc3VyZUJsb2Nrd2lzZVNlbGVjdGlvbiBoZWFkOiAnYm90dG9tJywgdGFpbDogJ3RvcCcsIHJldmVyc2VkOiBmYWxzZSwgaGVhZFJldmVyc2VkOiBmYWxzZVxuXG4gICAgICAgIGVuc3VyZSBcImpcIiwgY3Vyc29yOiBbWzAsIDBdLCBbMSwgMF1dLCBzZWxlY3RlZFRleHRPcmRlcmVkOiBbXCIwMTIzXCIsIFwiXCJdXG4gICAgICAgIGVuc3VyZUJsb2Nrd2lzZVNlbGVjdGlvbiBoZWFkOiAnYm90dG9tJywgdGFpbDogJ3RvcCcsIHJldmVyc2VkOiBmYWxzZSwgaGVhZFJldmVyc2VkOiB0cnVlXG5cbiAgICAgICAgZW5zdXJlIFwialwiLCBjdXJzb3I6IFtbMCwgN10sIFsxLCAwXSwgWzIsIDddXSwgc2VsZWN0ZWRUZXh0T3JkZXJlZDogW1wiMzQ1NlwiLCBcIlwiLCBcIkRFRkdcIl1cbiAgICAgICAgZW5zdXJlQmxvY2t3aXNlU2VsZWN0aW9uIGhlYWQ6ICdib3R0b20nLCB0YWlsOiAndG9wJywgcmV2ZXJzZWQ6IGZhbHNlLCBoZWFkUmV2ZXJzZWQ6IGZhbHNlXG5cbiAgICAgIGl0IFwid2hlbiBbcmV2ZXJzZWQgPSB0cnVlLCBoZWFkUmV2ZXJzZWQgPSB0cnVlXVwiLCAtPlxuICAgICAgICBzZXQgY3Vyc29yOiBbMiwgNl1cbiAgICAgICAgZW5zdXJlIFwiY3RybC12IGggaCBoXCIsIGN1cnNvcjogW1syLCAzXV0sIHNlbGVjdGVkVGV4dE9yZGVyZWQ6IFtcIkRFRkdcIl1cbiAgICAgICAgZW5zdXJlQmxvY2t3aXNlU2VsZWN0aW9uIGhlYWQ6ICd0b3AnLCB0YWlsOiAnYm90dG9tJywgcmV2ZXJzZWQ6IHRydWUsIGhlYWRSZXZlcnNlZDogdHJ1ZVxuXG4gICAgICAgIGVuc3VyZSBcImtcIiwgY3Vyc29yOiBbWzEsIDBdLCBbMiwgMF1dLCBzZWxlY3RlZFRleHRPcmRlcmVkOiBbXCJcIiwgXCJBQkNERUZHXCJdXG4gICAgICAgIGVuc3VyZUJsb2Nrd2lzZVNlbGVjdGlvbiBoZWFkOiAndG9wJywgdGFpbDogJ2JvdHRvbScsIHJldmVyc2VkOiB0cnVlLCBoZWFkUmV2ZXJzZWQ6IHRydWVcblxuICAgICAgICBlbnN1cmUgXCJrXCIsIGN1cnNvcjogW1swLCAzXSwgWzEsIDBdLCBbMiwgM11dLCBzZWxlY3RlZFRleHRPcmRlcmVkOiBbXCIzNDU2XCIsIFwiXCIsIFwiREVGR1wiXVxuICAgICAgICBlbnN1cmVCbG9ja3dpc2VTZWxlY3Rpb24gaGVhZDogJ3RvcCcsIHRhaWw6ICdib3R0b20nLCByZXZlcnNlZDogdHJ1ZSwgaGVhZFJldmVyc2VkOiB0cnVlXG5cbiAgICAgIGl0IFwid2hlbiBbcmV2ZXJzZWQgPSBmYWxzZSwgaGVhZFJldmVyc2VkID0gdHJ1ZV1cIiwgLT5cbiAgICAgICAgc2V0IGN1cnNvcjogWzAsIDZdXG4gICAgICAgIGVuc3VyZSBcImN0cmwtdiBoIGggaFwiLCBjdXJzb3I6IFtbMCwgM11dLCBzZWxlY3RlZFRleHRPcmRlcmVkOiBbXCIzNDU2XCJdXG4gICAgICAgIGVuc3VyZUJsb2Nrd2lzZVNlbGVjdGlvbiBoZWFkOiAnYm90dG9tJywgdGFpbDogJ3RvcCcsIHJldmVyc2VkOiB0cnVlLCBoZWFkUmV2ZXJzZWQ6IHRydWVcblxuICAgICAgICBlbnN1cmUgXCJqXCIsIGN1cnNvcjogW1swLCAwXSwgWzEsIDBdXSwgc2VsZWN0ZWRUZXh0T3JkZXJlZDogW1wiMDEyMzQ1NlwiLCBcIlwiXVxuICAgICAgICBlbnN1cmVCbG9ja3dpc2VTZWxlY3Rpb24gaGVhZDogJ2JvdHRvbScsIHRhaWw6ICd0b3AnLCByZXZlcnNlZDogZmFsc2UsIGhlYWRSZXZlcnNlZDogdHJ1ZVxuXG4gICAgICAgIGVuc3VyZSBcImpcIiwgY3Vyc29yOiBbWzAsIDNdLCBbMSwgMF0sIFsyLCAzXV0sIHNlbGVjdGVkVGV4dE9yZGVyZWQ6IFtcIjM0NTZcIiwgXCJcIiwgXCJERUZHXCJdXG4gICAgICAgIGVuc3VyZUJsb2Nrd2lzZVNlbGVjdGlvbiBoZWFkOiAnYm90dG9tJywgdGFpbDogJ3RvcCcsIHJldmVyc2VkOiBmYWxzZSwgaGVhZFJldmVyc2VkOiB0cnVlXG5cbiAgICAgIGl0IFwid2hlbiBbcmV2ZXJzZWQgPSB0cnVlLCBoZWFkUmV2ZXJzZWQgPSBmYWxzZV1cIiwgLT5cbiAgICAgICAgc2V0IGN1cnNvcjogWzIsIDNdXG4gICAgICAgIGVuc3VyZSBcImN0cmwtdiBsIGwgbFwiLCBjdXJzb3I6IFtbMiwgN11dLCBzZWxlY3RlZFRleHRPcmRlcmVkOiBbXCJERUZHXCJdXG4gICAgICAgIGVuc3VyZUJsb2Nrd2lzZVNlbGVjdGlvbiBoZWFkOiAndG9wJywgdGFpbDogJ2JvdHRvbScsIHJldmVyc2VkOiBmYWxzZSwgaGVhZFJldmVyc2VkOiBmYWxzZVxuXG4gICAgICAgIGVuc3VyZSBcImtcIiwgY3Vyc29yOiBbWzEsIDBdLCBbMiwgMF1dLCBzZWxlY3RlZFRleHRPcmRlcmVkOiBbXCJcIiwgXCJBQkNEXCJdXG4gICAgICAgIGVuc3VyZUJsb2Nrd2lzZVNlbGVjdGlvbiBoZWFkOiAndG9wJywgdGFpbDogJ2JvdHRvbScsIHJldmVyc2VkOiB0cnVlLCBoZWFkUmV2ZXJzZWQ6IHRydWVcblxuICAgICAgICBlbnN1cmUgXCJrXCIsIGN1cnNvcjogW1swLCA3XSwgWzEsIDBdLCBbMiwgN11dLCBzZWxlY3RlZFRleHRPcmRlcmVkOiAgW1wiMzQ1NlwiLCBcIlwiLCBcIkRFRkdcIl1cbiAgICAgICAgZW5zdXJlQmxvY2t3aXNlU2VsZWN0aW9uIGhlYWQ6ICd0b3AnLCB0YWlsOiAnYm90dG9tJywgcmV2ZXJzZWQ6IHRydWUsIGhlYWRSZXZlcnNlZDogZmFsc2VcblxuICAgIGRlc2NyaWJlIFwid2hlbiBoZWFkIGN1cnNvciBwb3NpdGlvbiBpcyBsZXNzIHRoYW4gb3JpZ2luYWwgZ29hbCBjb2x1bW5cIiwgLT5cbiAgICAgIGJlZm9yZUVhY2ggLT5cbiAgICAgICAgc2V0XG4gICAgICAgICAgdGV4dDogXCJcIlwiXG4gICAgICAgICAgMDEyMzQ1Njc4OTAxMjM0NTY3ODkwMTIzXG4gICAgICAgICAgICAgICAgIHh4eDAxMjM0XG4gICAgICAgICAgMDEyMzQ1Njc4OTAxMjM0NTY3ODkwMTIzXFxuXG4gICAgICAgICAgXCJcIlwiXG5cbiAgICAgIGRlc2NyaWJlIFwiW3RhaWxDb2x1bW4gPCBoZWFkQ29sdW1dLCBnb2FsQ29sdW1uIGlzbnQgSW5maW5pdHlcIiwgLT5cbiAgICAgICAgaXQgXCJzaHJpbmtzIGJsb2NrIHRpbGwgaGVhZCBjb2x1bW4gYnkga2VlcGluZyBnb2FsQ29sdW1uXCIsIC0+XG4gICAgICAgICAgc2V0IGN1cnNvcjogWzAsIDEwXSAjIGosIGsgbW90aW9uIGtlZXAgZ29hbENvbHVtbiBzbyBzdGFydGluZyBgMTBgIGNvbHVtbiBtZWFucyBnb2FsQ29sdW1uIGlzIDEwLlxuICAgICAgICAgIGVuc3VyZSBcImN0cmwtdiAxIDAgbFwiLCBzZWxlY3RlZFRleHRPcmRlcmVkOiBbXCIwMTIzNDU2Nzg5MFwiXSwgY3Vyc29yOiBbWzAsIDIxXV1cbiAgICAgICAgICBlbnN1cmUgXCJqXCIsIHNlbGVjdGVkVGV4dE9yZGVyZWQ6IFtcIjAxMjM0NVwiLCBcIjAxMjM0XCJdLCBjdXJzb3I6IFtbMCwgMTZdLCBbMSwgMTVdXVxuICAgICAgICAgIGVuc3VyZSBcImpcIiwgc2VsZWN0ZWRUZXh0T3JkZXJlZDogW1wiMDEyMzQ1Njc4OTBcIiwgXCIwMTIzNFwiLCBcIjAxMjM0NTY3ODkwXCJdLCBjdXJzb3I6IFtbMCwgMjFdLCBbMSwgMTVdLCBbMiwgMjFdXVxuICAgICAgICBpdCBcInNocmlua3MgYmxvY2sgdGlsbCBoZWFkIGNvbHVtbiBieSBrZWVwaW5nIGdvYWxDb2x1bW5cIiwgLT5cbiAgICAgICAgICBzZXQgY3Vyc29yOiBbMiwgMTBdXG4gICAgICAgICAgZW5zdXJlIFwiY3RybC12IDEgMCBsXCIsIHNlbGVjdGVkVGV4dE9yZGVyZWQ6IFtcIjAxMjM0NTY3ODkwXCJdLCBjdXJzb3I6IFtbMiwgMjFdXVxuICAgICAgICAgIGVuc3VyZSBcImtcIiwgc2VsZWN0ZWRUZXh0T3JkZXJlZDogW1wiMDEyMzRcIiwgXCIwMTIzNDVcIl0sIGN1cnNvcjogW1sxLCAxNV0sIFsyLCAxNl1dXG4gICAgICAgICAgZW5zdXJlIFwia1wiLCBzZWxlY3RlZFRleHRPcmRlcmVkOiBbXCIwMTIzNDU2Nzg5MFwiLCBcIjAxMjM0XCIsIFwiMDEyMzQ1Njc4OTBcIl0sIGN1cnNvcjogW1swLCAyMV0sIFsxLCAxNV0sIFsyLCAyMV1dXG4gICAgICBkZXNjcmliZSBcIlt0YWlsQ29sdW1uIDwgaGVhZENvbHVtXSwgZ29hbENvbHVtbiBpcyBJbmZpbml0eVwiLCAtPlxuICAgICAgICBpdCBcImtlZXAgZWFjaCBtZW1iZXIgc2VsZWN0aW9uIHNlbGVjdGVkIHRpbGwgZW5kLW9mLWxpbmUoIE5vIHNocmluayApXCIsIC0+XG4gICAgICAgICAgc2V0IGN1cnNvcjogWzAsIDEwXSAjICQgbW90aW9uIHNldCBnb2FsQ29sdW1uIHRvIEluZmluaXR5XG4gICAgICAgICAgZW5zdXJlIFwiY3RybC12ICRcIiwgc2VsZWN0ZWRUZXh0T3JkZXJlZDogW1wiMDEyMzQ1Njc4OTAxMjNcIl0sIGN1cnNvcjogW1swLCAyNF1dXG4gICAgICAgICAgZW5zdXJlIFwialwiLCBzZWxlY3RlZFRleHRPcmRlcmVkOiBbXCIwMTIzNDU2Nzg5MDEyM1wiLCBcIjAxMjM0XCJdLCBjdXJzb3I6IFtbMCwgMjRdLCBbMSwgMTVdXVxuICAgICAgICAgIGVuc3VyZSBcImpcIiwgc2VsZWN0ZWRUZXh0T3JkZXJlZDogW1wiMDEyMzQ1Njc4OTAxMjNcIiwgXCIwMTIzNFwiLCBcIjAxMjM0NTY3ODkwMTIzXCJdLCBjdXJzb3I6IFtbMCwgMjRdLCBbMSwgMTVdLCBbMiwgMjRdXVxuICAgICAgICBpdCBcImtlZXAgZWFjaCBtZW1iZXIgc2VsZWN0aW9uIHNlbGVjdGVkIHRpbGwgZW5kLW9mLWxpbmUoIE5vIHNocmluayApXCIsIC0+XG4gICAgICAgICAgc2V0IGN1cnNvcjogWzIsIDEwXVxuICAgICAgICAgIGVuc3VyZSBcImN0cmwtdiAkXCIsIHNlbGVjdGVkVGV4dE9yZGVyZWQ6IFtcIjAxMjM0NTY3ODkwMTIzXCJdLCBjdXJzb3I6IFtbMiwgMjRdXVxuICAgICAgICAgIGVuc3VyZSBcImtcIiwgc2VsZWN0ZWRUZXh0T3JkZXJlZDogW1wiMDEyMzRcIiwgXCIwMTIzNDU2Nzg5MDEyM1wiXSwgY3Vyc29yOiBbWzEsIDE1XSwgWzIsIDI0XV1cbiAgICAgICAgICBlbnN1cmUgXCJrXCIsIHNlbGVjdGVkVGV4dE9yZGVyZWQ6IFtcIjAxMjM0NTY3ODkwMTIzXCIsIFwiMDEyMzRcIiwgXCIwMTIzNDU2Nzg5MDEyM1wiXSwgY3Vyc29yOiBbWzAsIDI0XSwgWzEsIDE1XSwgWzIsIDI0XV1cbiAgICAgIGRlc2NyaWJlIFwiW3RhaWxDb2x1bW4gPiBoZWFkQ29sdW1dLCBnb2FsQ29sdW1uIGlzbnQgSW5maW5pdHlcIiwgLT5cbiAgICAgICAgaXQgXCJSZXNwZWN0IGFjdHVhbCBoZWFkIGNvbHVtbiBvdmVyIGdvYWxDb2x1bW5cIiwgLT5cbiAgICAgICAgICBzZXQgY3Vyc29yOiBbMCwgMjBdICMgaiwgayBtb3Rpb24ga2VlcCBnb2FsQ29sdW1uIHNvIHN0YXJ0aW5nIGAxMGAgY29sdW1uIG1lYW5zIGdvYWxDb2x1bW4gaXMgMTAuXG4gICAgICAgICAgZW5zdXJlIFwiY3RybC12IGwgbFwiLCBzZWxlY3RlZFRleHRPcmRlcmVkOiBbXCIwMTJcIl0sIGN1cnNvcjogW1swLCAyM11dXG4gICAgICAgICAgZW5zdXJlIFwialwiLCBzZWxlY3RlZFRleHRPcmRlcmVkOiBbXCI1Njc4OTBcIiwgXCJcIl0sIGN1cnNvcjogW1swLCAxNV0sIFsxLCAxNV1dXG4gICAgICAgICAgZW5zdXJlIFwialwiLCBzZWxlY3RlZFRleHRPcmRlcmVkOiBbXCIwMTJcIiwgXCJcIiwgXCIwMTJcIl0sIGN1cnNvcjogW1swLCAyM10sIFsxLCAxNV0sIFsyLCAyM11dXG4gICAgICAgIGl0IFwiUmVzcGVjdCBhY3R1YWwgaGVhZCBjb2x1bW4gb3ZlciBnb2FsQ29sdW1uXCIsIC0+XG4gICAgICAgICAgc2V0IGN1cnNvcjogWzIsIDIwXSAjIGosIGsgbW90aW9uIGtlZXAgZ29hbENvbHVtbiBzbyBzdGFydGluZyBgMTBgIGNvbHVtbiBtZWFucyBnb2FsQ29sdW1uIGlzIDEwLlxuICAgICAgICAgIGVuc3VyZSBcImN0cmwtdiBsIGxcIiwgc2VsZWN0ZWRUZXh0T3JkZXJlZDogW1wiMDEyXCJdLCBjdXJzb3I6IFtbMiwgMjNdXVxuICAgICAgICAgIGVuc3VyZSBcImtcIiwgc2VsZWN0ZWRUZXh0T3JkZXJlZDogW1wiXCIsIFwiNTY3ODkwXCJdLCBjdXJzb3I6IFtbMSwgMTVdLCBbMiwgMTVdXVxuICAgICAgICAgIGVuc3VyZSBcImtcIiwgc2VsZWN0ZWRUZXh0T3JkZXJlZDogW1wiMDEyXCIsIFwiXCIsIFwiMDEyXCJdLCBjdXJzb3I6IFtbMCwgMjNdLCBbMSwgMTVdLCBbMiwgMjNdXVxuICAgICAgZGVzY3JpYmUgXCJbdGFpbENvbHVtbiA+IGhlYWRDb2x1bV0sIGdvYWxDb2x1bW4gaXMgSW5maW5pdHlcIiwgLT5cbiAgICAgICAgaXQgXCJSZXNwZWN0IGFjdHVhbCBoZWFkIGNvbHVtbiBvdmVyIGdvYWxDb2x1bW5cIiwgLT5cbiAgICAgICAgICBzZXQgY3Vyc29yOiBbMCwgMjBdICMgaiwgayBtb3Rpb24ga2VlcCBnb2FsQ29sdW1uIHNvIHN0YXJ0aW5nIGAxMGAgY29sdW1uIG1lYW5zIGdvYWxDb2x1bW4gaXMgMTAuXG4gICAgICAgICAgZW5zdXJlIFwiY3RybC12ICRcIiwgc2VsZWN0ZWRUZXh0T3JkZXJlZDogW1wiMDEyM1wiXSwgY3Vyc29yOiBbWzAsIDI0XV1cbiAgICAgICAgICBlbnN1cmUgXCJqXCIsIHNlbGVjdGVkVGV4dE9yZGVyZWQ6IFtcIjU2Nzg5MFwiLCBcIlwiXSwgY3Vyc29yOiBbWzAsIDE1XSwgWzEsIDE1XV1cbiAgICAgICAgICBlbnN1cmUgXCJqXCIsIHNlbGVjdGVkVGV4dE9yZGVyZWQ6IFtcIjAxMjNcIiwgXCJcIiwgXCIwMTIzXCJdLCBjdXJzb3I6IFtbMCwgMjRdLCBbMSwgMTVdLCBbMiwgMjRdXVxuICAgICAgICBpdCBcIlJlc3BlY3QgYWN0dWFsIGhlYWQgY29sdW1uIG92ZXIgZ29hbENvbHVtblwiLCAtPlxuICAgICAgICAgIHNldCBjdXJzb3I6IFsyLCAyMF0gIyBqLCBrIG1vdGlvbiBrZWVwIGdvYWxDb2x1bW4gc28gc3RhcnRpbmcgYDEwYCBjb2x1bW4gbWVhbnMgZ29hbENvbHVtbiBpcyAxMC5cbiAgICAgICAgICBlbnN1cmUgXCJjdHJsLXYgJFwiLCBzZWxlY3RlZFRleHRPcmRlcmVkOiBbXCIwMTIzXCJdLCBjdXJzb3I6IFtbMiwgMjRdXVxuICAgICAgICAgIGVuc3VyZSBcImtcIiwgc2VsZWN0ZWRUZXh0T3JkZXJlZDogW1wiXCIsIFwiNTY3ODkwXCJdLCBjdXJzb3I6IFtbMSwgMTVdLCBbMiwgMTVdXVxuICAgICAgICAgIGVuc3VyZSBcImtcIiwgc2VsZWN0ZWRUZXh0T3JkZXJlZDogW1wiMDEyM1wiLCBcIlwiLCBcIjAxMjNcIl0sIGN1cnNvcjogW1swLCAyNF0sIFsxLCAxNV0sIFsyLCAyNF1dXG5cbiAgIyBbRklYTUVdIG5vdCBhcHByb3ByaWF0ZSBwdXQgaGVyZSwgcmUtY29uc2lkZXIgYWxsIHNwZWMgZmlsZSBsYXlvdXQgbGF0ZXIuXG4gIGRlc2NyaWJlIFwiZ3YgZmVhdHVyZVwiLCAtPlxuICAgIHByZXNlcnZlU2VsZWN0aW9uID0gLT5cbiAgICAgIHNlbGVjdGlvbnMgPSBlZGl0b3IuZ2V0U2VsZWN0aW9uc09yZGVyZWRCeUJ1ZmZlclBvc2l0aW9uKClcbiAgICAgIHNlbGVjdGVkVGV4dE9yZGVyZWQgPSAocy5nZXRUZXh0KCkgZm9yIHMgaW4gc2VsZWN0aW9ucylcbiAgICAgIHNlbGVjdGVkQnVmZmVyUmFuZ2VPcmRlcmVkID0gKHMuZ2V0QnVmZmVyUmFuZ2UoKSBmb3IgcyBpbiBzZWxlY3Rpb25zKVxuICAgICAgY3Vyc29yID0gKHMuZ2V0SGVhZFNjcmVlblBvc2l0aW9uKCkgZm9yIHMgaW4gc2VsZWN0aW9ucylcbiAgICAgIG1vZGUgPSBbdmltU3RhdGUubW9kZSwgdmltU3RhdGUuc3VibW9kZV1cbiAgICAgIHtzZWxlY3RlZFRleHRPcmRlcmVkLCBzZWxlY3RlZEJ1ZmZlclJhbmdlT3JkZXJlZCwgY3Vyc29yLCBtb2RlfVxuXG4gICAgZW5zdXJlUmVzdG9yZWQgPSAoa2V5c3Ryb2tlLCBzcGVjKSAtPlxuICAgICAgZW5zdXJlIGtleXN0cm9rZSwgc3BlY1xuICAgICAgcHJlc2VydmVkID0gcHJlc2VydmVTZWxlY3Rpb24oKVxuICAgICAgZW5zdXJlICdlc2NhcGUgaiBqJywgbW9kZTogJ25vcm1hbCcsIHNlbGVjdGVkVGV4dDogJydcbiAgICAgIGVuc3VyZSAnZyB2JywgcHJlc2VydmVkXG5cbiAgICBkZXNjcmliZSBcImxpbmV3aXNlIHNlbGVjdGlvblwiLCAtPlxuICAgICAgYmVmb3JlRWFjaCAtPlxuICAgICAgICBzZXQgY3Vyc29yOiBbMiwgMF1cbiAgICAgIGRlc2NyaWJlIFwiaW1tZWRpYXRlbHkgYWZ0ZXIgVlwiLCAtPlxuICAgICAgICBpdCAncmVzdG9yZSBwcmV2aW91cyBzZWxlY3Rpb24nLCAtPlxuICAgICAgICAgIGVuc3VyZVJlc3RvcmVkICdWJyxcbiAgICAgICAgICAgIHNlbGVjdGVkVGV4dDogdGV4dERhdGEuZ2V0TGluZXMoWzJdKVxuICAgICAgICAgICAgbW9kZTogWyd2aXN1YWwnLCAnbGluZXdpc2UnXVxuICAgICAgZGVzY3JpYmUgXCJzZWxlY3Rpb24gaXMgbm90IHJldmVyc2VkXCIsIC0+XG4gICAgICAgIGl0ICdyZXN0b3JlIHByZXZpb3VzIHNlbGVjdGlvbicsIC0+XG4gICAgICAgICAgZW5zdXJlUmVzdG9yZWQgJ1YgaicsXG4gICAgICAgICAgICBzZWxlY3RlZFRleHQ6IHRleHREYXRhLmdldExpbmVzKFsyLCAzXSlcbiAgICAgICAgICAgIG1vZGU6IFsndmlzdWFsJywgJ2xpbmV3aXNlJ11cbiAgICAgIGRlc2NyaWJlIFwic2VsZWN0aW9uIGlzIHJldmVyc2VkXCIsIC0+XG4gICAgICAgIGl0ICdyZXN0b3JlIHByZXZpb3VzIHNlbGVjdGlvbicsIC0+XG4gICAgICAgICAgZW5zdXJlUmVzdG9yZWQgJ1YgaycsXG4gICAgICAgICAgICBzZWxlY3RlZFRleHQ6IHRleHREYXRhLmdldExpbmVzKFsxLCAyXSlcbiAgICAgICAgICAgIG1vZGU6IFsndmlzdWFsJywgJ2xpbmV3aXNlJ11cblxuICAgIGRlc2NyaWJlIFwiY2hhcmFjdGVyd2lzZSBzZWxlY3Rpb25cIiwgLT5cbiAgICAgIGJlZm9yZUVhY2ggLT5cbiAgICAgICAgc2V0IGN1cnNvcjogWzIsIDBdXG4gICAgICBkZXNjcmliZSBcImltbWVkaWF0ZWx5IGFmdGVyIHZcIiwgLT5cbiAgICAgICAgaXQgJ3Jlc3RvcmUgcHJldmlvdXMgc2VsZWN0aW9uJywgLT5cbiAgICAgICAgICBlbnN1cmVSZXN0b3JlZCAndicsXG4gICAgICAgICAgICBzZWxlY3RlZFRleHQ6IFwiMlwiXG4gICAgICAgICAgICBtb2RlOiBbJ3Zpc3VhbCcsICdjaGFyYWN0ZXJ3aXNlJ11cbiAgICAgIGRlc2NyaWJlIFwic2VsZWN0aW9uIGlzIG5vdCByZXZlcnNlZFwiLCAtPlxuICAgICAgICBpdCAncmVzdG9yZSBwcmV2aW91cyBzZWxlY3Rpb24nLCAtPlxuICAgICAgICAgIGVuc3VyZVJlc3RvcmVkICd2IGonLFxuICAgICAgICAgICAgc2VsZWN0ZWRUZXh0OiBcIlwiXCJcbiAgICAgICAgICAgIDItLS0tQS0tLS0tLS0tLUItLS0tXG4gICAgICAgICAgICAzXG4gICAgICAgICAgICBcIlwiXCJcbiAgICAgICAgICAgIG1vZGU6IFsndmlzdWFsJywgJ2NoYXJhY3Rlcndpc2UnXVxuICAgICAgZGVzY3JpYmUgXCJzZWxlY3Rpb24gaXMgcmV2ZXJzZWRcIiwgLT5cbiAgICAgICAgaXQgJ3Jlc3RvcmUgcHJldmlvdXMgc2VsZWN0aW9uJywgLT5cbiAgICAgICAgICBlbnN1cmVSZXN0b3JlZCAndiBrJyxcbiAgICAgICAgICAgIHNlbGVjdGVkVGV4dDogXCJcIlwiXG4gICAgICAgICAgICAxLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgICAgICAgICAgMlxuICAgICAgICAgICAgXCJcIlwiXG4gICAgICAgICAgICBtb2RlOiBbJ3Zpc3VhbCcsICdjaGFyYWN0ZXJ3aXNlJ11cblxuICAgIGRlc2NyaWJlIFwiYmxvY2t3aXNlIHNlbGVjdGlvblwiLCAtPlxuICAgICAgZGVzY3JpYmUgXCJpbW1lZGlhdGVseSBhZnRlciBjdHJsLXZcIiwgLT5cbiAgICAgICAgYmVmb3JlRWFjaCAtPlxuICAgICAgICAgIHNldCBjdXJzb3I6IFsyLCAwXVxuICAgICAgICBpdCAncmVzdG9yZSBwcmV2aW91cyBzZWxlY3Rpb24nLCAtPlxuICAgICAgICAgIGVuc3VyZVJlc3RvcmVkICdjdHJsLXYnLFxuICAgICAgICAgICAgc2VsZWN0ZWRUZXh0OiBcIjJcIlxuICAgICAgICAgICAgbW9kZTogWyd2aXN1YWwnLCAnYmxvY2t3aXNlJ11cbiAgICAgIGRlc2NyaWJlIFwic2VsZWN0aW9uIGlzIG5vdCByZXZlcnNlZFwiLCAtPlxuICAgICAgICBpdCAncmVzdG9yZSBwcmV2aW91cyBzZWxlY3Rpb24gY2FzZS0xJywgLT5cbiAgICAgICAgICBzZXQgY3Vyc29yOiBbMiwgNV1cbiAgICAgICAgICBrZXlzdHJva2UgJ2N0cmwtdiAxIDAgbCdcbiAgICAgICAgICBlbnN1cmVSZXN0b3JlZCAnMyBqJyxcbiAgICAgICAgICAgIHNlbGVjdGVkVGV4dDogYmxvY2tUZXh0c1syLi41XVxuICAgICAgICAgICAgbW9kZTogWyd2aXN1YWwnLCAnYmxvY2t3aXNlJ11cbiAgICAgICAgaXQgJ3Jlc3RvcmUgcHJldmlvdXMgc2VsZWN0aW9uIGNhc2UtMicsIC0+XG4gICAgICAgICAgc2V0IGN1cnNvcjogWzUsIDVdXG4gICAgICAgICAga2V5c3Ryb2tlICdjdHJsLXYgMSAwIGwnXG4gICAgICAgICAgZW5zdXJlUmVzdG9yZWQgJzMgaycsXG4gICAgICAgICAgICBzZWxlY3RlZFRleHRPcmRlcmVkOiBibG9ja1RleHRzWzIuLjVdXG4gICAgICAgICAgICBtb2RlOiBbJ3Zpc3VhbCcsICdibG9ja3dpc2UnXVxuICAgICAgZGVzY3JpYmUgXCJzZWxlY3Rpb24gaXMgcmV2ZXJzZWRcIiwgLT5cbiAgICAgICAgaXQgJ3Jlc3RvcmUgcHJldmlvdXMgc2VsZWN0aW9uIGNhc2UtMScsIC0+XG4gICAgICAgICAgc2V0IGN1cnNvcjogWzIsIDE1XVxuICAgICAgICAgIGtleXN0cm9rZSAnY3RybC12IDEgMCBoJ1xuICAgICAgICAgIGVuc3VyZVJlc3RvcmVkICczIGonLFxuICAgICAgICAgICAgc2VsZWN0ZWRUZXh0OiBibG9ja1RleHRzWzIuLjVdXG4gICAgICAgICAgICBtb2RlOiBbJ3Zpc3VhbCcsICdibG9ja3dpc2UnXVxuICAgICAgICBpdCAncmVzdG9yZSBwcmV2aW91cyBzZWxlY3Rpb24gY2FzZS0yJywgLT5cbiAgICAgICAgICBzZXQgY3Vyc29yOiBbNSwgMTVdXG4gICAgICAgICAga2V5c3Ryb2tlICdjdHJsLXYgMSAwIGgnXG4gICAgICAgICAgZW5zdXJlUmVzdG9yZWQgJzMgaycsXG4gICAgICAgICAgICBzZWxlY3RlZFRleHRPcmRlcmVkOiBibG9ja1RleHRzWzIuLjVdXG4gICAgICAgICAgICBtb2RlOiBbJ3Zpc3VhbCcsICdibG9ja3dpc2UnXVxuIl19
