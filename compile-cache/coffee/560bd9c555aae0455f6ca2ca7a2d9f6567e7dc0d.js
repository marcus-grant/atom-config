(function() {
  var ActivateNormalModeOnce, Base, BlockwiseOtherEnd, CopyFromLineAbove, CopyFromLineBelow, FoldAll, FoldCurrentRow, FoldCurrentRowRecursively, FoldCurrentRowRecursivelyBase, FoldNextIndentLevel, InsertLastInserted, InsertMode, InsertRegister, Mark, MiscCommand, NextTab, Point, PreviousTab, Range, Redo, ReplaceModeBackspace, ReverseSelections, ScrollCursor, ScrollCursorToBottom, ScrollCursorToBottomLeave, ScrollCursorToLeft, ScrollCursorToMiddle, ScrollCursorToMiddleLeave, ScrollCursorToRight, ScrollCursorToTop, ScrollCursorToTopLeave, ScrollDown, ScrollUp, ScrollWithoutChangingCursorPosition, ToggleFold, ToggleFoldRecursively, Undo, UnfoldAll, UnfoldCurrentRow, UnfoldCurrentRowRecursively, UnfoldNextIndentLevel, _, findRangeContainsPoint, getFoldInfoByKind, getFoldRowRangesContainedByFoldStartsAtRow, humanizeBufferRange, isLeadingWhiteSpaceRange, isLinewiseRange, isSingleLineRange, limitNumber, moveCursorRight, ref, ref1, setBufferRow, sortRanges,
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty,
    indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

  ref = require('atom'), Range = ref.Range, Point = ref.Point;

  Base = require('./base');

  _ = require('underscore-plus');

  ref1 = require('./utils'), moveCursorRight = ref1.moveCursorRight, isLinewiseRange = ref1.isLinewiseRange, setBufferRow = ref1.setBufferRow, sortRanges = ref1.sortRanges, findRangeContainsPoint = ref1.findRangeContainsPoint, isSingleLineRange = ref1.isSingleLineRange, isLeadingWhiteSpaceRange = ref1.isLeadingWhiteSpaceRange, humanizeBufferRange = ref1.humanizeBufferRange, getFoldInfoByKind = ref1.getFoldInfoByKind, limitNumber = ref1.limitNumber, getFoldRowRangesContainedByFoldStartsAtRow = ref1.getFoldRowRangesContainedByFoldStartsAtRow;

  MiscCommand = (function(superClass) {
    extend(MiscCommand, superClass);

    MiscCommand.extend(false);

    MiscCommand.operationKind = 'misc-command';

    function MiscCommand() {
      MiscCommand.__super__.constructor.apply(this, arguments);
      this.initialize();
    }

    return MiscCommand;

  })(Base);

  Mark = (function(superClass) {
    extend(Mark, superClass);

    function Mark() {
      return Mark.__super__.constructor.apply(this, arguments);
    }

    Mark.extend();

    Mark.prototype.requireInput = true;

    Mark.prototype.initialize = function() {
      this.focusInput();
      return Mark.__super__.initialize.apply(this, arguments);
    };

    Mark.prototype.execute = function() {
      this.vimState.mark.set(this.input, this.editor.getCursorBufferPosition());
      return this.activateMode('normal');
    };

    return Mark;

  })(MiscCommand);

  ReverseSelections = (function(superClass) {
    extend(ReverseSelections, superClass);

    function ReverseSelections() {
      return ReverseSelections.__super__.constructor.apply(this, arguments);
    }

    ReverseSelections.extend();

    ReverseSelections.prototype.execute = function() {
      this.swrap.setReversedState(this.editor, !this.editor.getLastSelection().isReversed());
      if (this.isMode('visual', 'blockwise')) {
        return this.getLastBlockwiseSelection().autoscroll();
      }
    };

    return ReverseSelections;

  })(MiscCommand);

  BlockwiseOtherEnd = (function(superClass) {
    extend(BlockwiseOtherEnd, superClass);

    function BlockwiseOtherEnd() {
      return BlockwiseOtherEnd.__super__.constructor.apply(this, arguments);
    }

    BlockwiseOtherEnd.extend();

    BlockwiseOtherEnd.prototype.execute = function() {
      var blockwiseSelection, i, len, ref2;
      ref2 = this.getBlockwiseSelections();
      for (i = 0, len = ref2.length; i < len; i++) {
        blockwiseSelection = ref2[i];
        blockwiseSelection.reverse();
      }
      return BlockwiseOtherEnd.__super__.execute.apply(this, arguments);
    };

    return BlockwiseOtherEnd;

  })(ReverseSelections);

  Undo = (function(superClass) {
    extend(Undo, superClass);

    function Undo() {
      return Undo.__super__.constructor.apply(this, arguments);
    }

    Undo.extend();

    Undo.prototype.setCursorPosition = function(arg) {
      var changedRange, lastCursor, newRanges, oldRanges, strategy;
      newRanges = arg.newRanges, oldRanges = arg.oldRanges, strategy = arg.strategy;
      lastCursor = this.editor.getLastCursor();
      if (strategy === 'smart') {
        changedRange = findRangeContainsPoint(newRanges, lastCursor.getBufferPosition());
      } else {
        changedRange = sortRanges(newRanges.concat(oldRanges))[0];
      }
      if (changedRange != null) {
        if (isLinewiseRange(changedRange)) {
          return setBufferRow(lastCursor, changedRange.start.row);
        } else {
          return lastCursor.setBufferPosition(changedRange.start);
        }
      }
    };

    Undo.prototype.mutateWithTrackChanges = function() {
      var disposable, newRanges, oldRanges;
      newRanges = [];
      oldRanges = [];
      disposable = this.editor.getBuffer().onDidChange(function(arg) {
        var newRange, oldRange;
        newRange = arg.newRange, oldRange = arg.oldRange;
        if (newRange.isEmpty()) {
          return oldRanges.push(oldRange);
        } else {
          return newRanges.push(newRange);
        }
      });
      this.mutate();
      disposable.dispose();
      return {
        newRanges: newRanges,
        oldRanges: oldRanges
      };
    };

    Undo.prototype.flashChanges = function(arg) {
      var isMultipleSingleLineRanges, newRanges, oldRanges;
      newRanges = arg.newRanges, oldRanges = arg.oldRanges;
      isMultipleSingleLineRanges = function(ranges) {
        return ranges.length > 1 && ranges.every(isSingleLineRange);
      };
      if (newRanges.length > 0) {
        if (this.isMultipleAndAllRangeHaveSameColumnAndConsecutiveRows(newRanges)) {
          return;
        }
        newRanges = newRanges.map((function(_this) {
          return function(range) {
            return humanizeBufferRange(_this.editor, range);
          };
        })(this));
        newRanges = this.filterNonLeadingWhiteSpaceRange(newRanges);
        if (isMultipleSingleLineRanges(newRanges)) {
          return this.flash(newRanges, {
            type: 'undo-redo-multiple-changes'
          });
        } else {
          return this.flash(newRanges, {
            type: 'undo-redo'
          });
        }
      } else {
        if (this.isMultipleAndAllRangeHaveSameColumnAndConsecutiveRows(oldRanges)) {
          return;
        }
        if (isMultipleSingleLineRanges(oldRanges)) {
          oldRanges = this.filterNonLeadingWhiteSpaceRange(oldRanges);
          return this.flash(oldRanges, {
            type: 'undo-redo-multiple-delete'
          });
        }
      }
    };

    Undo.prototype.filterNonLeadingWhiteSpaceRange = function(ranges) {
      return ranges.filter((function(_this) {
        return function(range) {
          return !isLeadingWhiteSpaceRange(_this.editor, range);
        };
      })(this));
    };

    Undo.prototype.isMultipleAndAllRangeHaveSameColumnAndConsecutiveRows = function(ranges) {
      var end, endColumn, i, len, previousRow, range, ref2, ref3, ref4, start, startColumn;
      if (ranges.length <= 1) {
        return false;
      }
      ref2 = ranges[0], (ref3 = ref2.start, startColumn = ref3.column), (ref4 = ref2.end, endColumn = ref4.column);
      previousRow = null;
      for (i = 0, len = ranges.length; i < len; i++) {
        range = ranges[i];
        start = range.start, end = range.end;
        if (!((start.column === startColumn) && (end.column === endColumn))) {
          return false;
        }
        if ((previousRow != null) && (previousRow + 1 !== start.row)) {
          return false;
        }
        previousRow = start.row;
      }
      return true;
      return ranges.every(function(arg) {
        var end, start;
        start = arg.start, end = arg.end;
        return (start.column === startColumn) && (end.column === endColumn);
      });
    };

    Undo.prototype.flash = function(flashRanges, options) {
      if (options.timeout == null) {
        options.timeout = 500;
      }
      return this.onDidFinishOperation((function(_this) {
        return function() {
          return _this.vimState.flash(flashRanges, options);
        };
      })(this));
    };

    Undo.prototype.execute = function() {
      var i, len, newRanges, oldRanges, ref2, ref3, selection, strategy;
      ref2 = this.mutateWithTrackChanges(), newRanges = ref2.newRanges, oldRanges = ref2.oldRanges;
      ref3 = this.editor.getSelections();
      for (i = 0, len = ref3.length; i < len; i++) {
        selection = ref3[i];
        selection.clear();
      }
      if (this.getConfig('setCursorToStartOfChangeOnUndoRedo')) {
        strategy = this.getConfig('setCursorToStartOfChangeOnUndoRedoStrategy');
        this.setCursorPosition({
          newRanges: newRanges,
          oldRanges: oldRanges,
          strategy: strategy
        });
        this.vimState.clearSelections();
      }
      if (this.getConfig('flashOnUndoRedo')) {
        this.flashChanges({
          newRanges: newRanges,
          oldRanges: oldRanges
        });
      }
      return this.activateMode('normal');
    };

    Undo.prototype.mutate = function() {
      return this.editor.undo();
    };

    return Undo;

  })(MiscCommand);

  Redo = (function(superClass) {
    extend(Redo, superClass);

    function Redo() {
      return Redo.__super__.constructor.apply(this, arguments);
    }

    Redo.extend();

    Redo.prototype.mutate = function() {
      return this.editor.redo();
    };

    return Redo;

  })(Undo);

  FoldCurrentRow = (function(superClass) {
    extend(FoldCurrentRow, superClass);

    function FoldCurrentRow() {
      return FoldCurrentRow.__super__.constructor.apply(this, arguments);
    }

    FoldCurrentRow.extend();

    FoldCurrentRow.prototype.execute = function() {
      var i, len, ref2, results, row, selection;
      ref2 = this.editor.getSelections();
      results = [];
      for (i = 0, len = ref2.length; i < len; i++) {
        selection = ref2[i];
        row = this.getCursorPositionForSelection(selection).row;
        results.push(this.editor.foldBufferRow(row));
      }
      return results;
    };

    return FoldCurrentRow;

  })(MiscCommand);

  UnfoldCurrentRow = (function(superClass) {
    extend(UnfoldCurrentRow, superClass);

    function UnfoldCurrentRow() {
      return UnfoldCurrentRow.__super__.constructor.apply(this, arguments);
    }

    UnfoldCurrentRow.extend();

    UnfoldCurrentRow.prototype.execute = function() {
      var i, len, ref2, results, row, selection;
      ref2 = this.editor.getSelections();
      results = [];
      for (i = 0, len = ref2.length; i < len; i++) {
        selection = ref2[i];
        row = this.getCursorPositionForSelection(selection).row;
        results.push(this.editor.unfoldBufferRow(row));
      }
      return results;
    };

    return UnfoldCurrentRow;

  })(MiscCommand);

  ToggleFold = (function(superClass) {
    extend(ToggleFold, superClass);

    function ToggleFold() {
      return ToggleFold.__super__.constructor.apply(this, arguments);
    }

    ToggleFold.extend();

    ToggleFold.prototype.execute = function() {
      var point;
      point = this.editor.getCursorBufferPosition();
      return this.editor.toggleFoldAtBufferRow(point.row);
    };

    return ToggleFold;

  })(MiscCommand);

  FoldCurrentRowRecursivelyBase = (function(superClass) {
    extend(FoldCurrentRowRecursivelyBase, superClass);

    function FoldCurrentRowRecursivelyBase() {
      return FoldCurrentRowRecursivelyBase.__super__.constructor.apply(this, arguments);
    }

    FoldCurrentRowRecursivelyBase.extend(false);

    FoldCurrentRowRecursivelyBase.prototype.foldRecursively = function(row) {
      var i, len, ref2, results, rowRanges, startRows;
      rowRanges = getFoldRowRangesContainedByFoldStartsAtRow(this.editor, row);
      if (rowRanges != null) {
        startRows = rowRanges.map(function(rowRange) {
          return rowRange[0];
        });
        ref2 = startRows.reverse();
        results = [];
        for (i = 0, len = ref2.length; i < len; i++) {
          row = ref2[i];
          if (!this.editor.isFoldedAtBufferRow(row)) {
            results.push(this.editor.foldBufferRow(row));
          }
        }
        return results;
      }
    };

    FoldCurrentRowRecursivelyBase.prototype.unfoldRecursively = function(row) {
      var i, len, results, rowRanges, startRows;
      rowRanges = getFoldRowRangesContainedByFoldStartsAtRow(this.editor, row);
      if (rowRanges != null) {
        startRows = rowRanges.map(function(rowRange) {
          return rowRange[0];
        });
        results = [];
        for (i = 0, len = startRows.length; i < len; i++) {
          row = startRows[i];
          if (this.editor.isFoldedAtBufferRow(row)) {
            results.push(this.editor.unfoldBufferRow(row));
          }
        }
        return results;
      }
    };

    FoldCurrentRowRecursivelyBase.prototype.foldRecursivelyForAllSelections = function() {
      var i, len, ref2, results, selection;
      ref2 = this.editor.getSelectionsOrderedByBufferPosition().reverse();
      results = [];
      for (i = 0, len = ref2.length; i < len; i++) {
        selection = ref2[i];
        results.push(this.foldRecursively(this.getCursorPositionForSelection(selection).row));
      }
      return results;
    };

    FoldCurrentRowRecursivelyBase.prototype.unfoldRecursivelyForAllSelections = function() {
      var i, len, ref2, results, selection;
      ref2 = this.editor.getSelectionsOrderedByBufferPosition();
      results = [];
      for (i = 0, len = ref2.length; i < len; i++) {
        selection = ref2[i];
        results.push(this.unfoldRecursively(this.getCursorPositionForSelection(selection).row));
      }
      return results;
    };

    return FoldCurrentRowRecursivelyBase;

  })(MiscCommand);

  FoldCurrentRowRecursively = (function(superClass) {
    extend(FoldCurrentRowRecursively, superClass);

    function FoldCurrentRowRecursively() {
      return FoldCurrentRowRecursively.__super__.constructor.apply(this, arguments);
    }

    FoldCurrentRowRecursively.extend();

    FoldCurrentRowRecursively.prototype.execute = function() {
      return this.foldRecursivelyForAllSelections();
    };

    return FoldCurrentRowRecursively;

  })(FoldCurrentRowRecursivelyBase);

  UnfoldCurrentRowRecursively = (function(superClass) {
    extend(UnfoldCurrentRowRecursively, superClass);

    function UnfoldCurrentRowRecursively() {
      return UnfoldCurrentRowRecursively.__super__.constructor.apply(this, arguments);
    }

    UnfoldCurrentRowRecursively.extend();

    UnfoldCurrentRowRecursively.prototype.execute = function() {
      return this.unfoldRecursivelyForAllSelections();
    };

    return UnfoldCurrentRowRecursively;

  })(FoldCurrentRowRecursivelyBase);

  ToggleFoldRecursively = (function(superClass) {
    extend(ToggleFoldRecursively, superClass);

    function ToggleFoldRecursively() {
      return ToggleFoldRecursively.__super__.constructor.apply(this, arguments);
    }

    ToggleFoldRecursively.extend();

    ToggleFoldRecursively.prototype.execute = function() {
      var row;
      row = this.getCursorPositionForSelection(this.editor.getLastSelection()).row;
      if (this.editor.isFoldedAtBufferRow(row)) {
        return this.unfoldRecursivelyForAllSelections();
      } else {
        return this.foldRecursivelyForAllSelections();
      }
    };

    return ToggleFoldRecursively;

  })(FoldCurrentRowRecursivelyBase);

  UnfoldAll = (function(superClass) {
    extend(UnfoldAll, superClass);

    function UnfoldAll() {
      return UnfoldAll.__super__.constructor.apply(this, arguments);
    }

    UnfoldAll.extend();

    UnfoldAll.prototype.execute = function() {
      return this.editor.unfoldAll();
    };

    return UnfoldAll;

  })(MiscCommand);

  FoldAll = (function(superClass) {
    extend(FoldAll, superClass);

    function FoldAll() {
      return FoldAll.__super__.constructor.apply(this, arguments);
    }

    FoldAll.extend();

    FoldAll.prototype.execute = function() {
      var allFold, endRow, i, indent, len, ref2, ref3, results, startRow;
      allFold = getFoldInfoByKind(this.editor).allFold;
      if (allFold != null) {
        this.editor.unfoldAll();
        ref2 = allFold.rowRangesWithIndent;
        results = [];
        for (i = 0, len = ref2.length; i < len; i++) {
          ref3 = ref2[i], indent = ref3.indent, startRow = ref3.startRow, endRow = ref3.endRow;
          if (indent <= this.getConfig('maxFoldableIndentLevel')) {
            results.push(this.editor.foldBufferRowRange(startRow, endRow));
          } else {
            results.push(void 0);
          }
        }
        return results;
      }
    };

    return FoldAll;

  })(MiscCommand);

  UnfoldNextIndentLevel = (function(superClass) {
    extend(UnfoldNextIndentLevel, superClass);

    function UnfoldNextIndentLevel() {
      return UnfoldNextIndentLevel.__super__.constructor.apply(this, arguments);
    }

    UnfoldNextIndentLevel.extend();

    UnfoldNextIndentLevel.prototype.execute = function() {
      var count, folded, i, indent, j, len, minIndent, ref2, ref3, results, results1, rowRangesWithIndent, startRow, targetIndents;
      folded = getFoldInfoByKind(this.editor).folded;
      if (folded != null) {
        minIndent = folded.minIndent, rowRangesWithIndent = folded.rowRangesWithIndent;
        count = limitNumber(this.getCount() - 1, {
          min: 0
        });
        targetIndents = (function() {
          results = [];
          for (var i = minIndent, ref2 = minIndent + count; minIndent <= ref2 ? i <= ref2 : i >= ref2; minIndent <= ref2 ? i++ : i--){ results.push(i); }
          return results;
        }).apply(this);
        results1 = [];
        for (j = 0, len = rowRangesWithIndent.length; j < len; j++) {
          ref3 = rowRangesWithIndent[j], indent = ref3.indent, startRow = ref3.startRow;
          if (indexOf.call(targetIndents, indent) >= 0) {
            results1.push(this.editor.unfoldBufferRow(startRow));
          } else {
            results1.push(void 0);
          }
        }
        return results1;
      }
    };

    return UnfoldNextIndentLevel;

  })(MiscCommand);

  FoldNextIndentLevel = (function(superClass) {
    extend(FoldNextIndentLevel, superClass);

    function FoldNextIndentLevel() {
      return FoldNextIndentLevel.__super__.constructor.apply(this, arguments);
    }

    FoldNextIndentLevel.extend();

    FoldNextIndentLevel.prototype.execute = function() {
      var allFold, count, endRow, fromLevel, i, indent, j, len, maxFoldable, ref2, ref3, ref4, results, results1, startRow, targetIndents, unfolded;
      ref2 = getFoldInfoByKind(this.editor), unfolded = ref2.unfolded, allFold = ref2.allFold;
      if (unfolded != null) {
        this.editor.unfoldAll();
        maxFoldable = this.getConfig('maxFoldableIndentLevel');
        fromLevel = Math.min(unfolded.maxIndent, maxFoldable);
        count = limitNumber(this.getCount() - 1, {
          min: 0
        });
        fromLevel = limitNumber(fromLevel - count, {
          min: 0
        });
        targetIndents = (function() {
          results = [];
          for (var i = fromLevel; fromLevel <= maxFoldable ? i <= maxFoldable : i >= maxFoldable; fromLevel <= maxFoldable ? i++ : i--){ results.push(i); }
          return results;
        }).apply(this);
        ref3 = allFold.rowRangesWithIndent;
        results1 = [];
        for (j = 0, len = ref3.length; j < len; j++) {
          ref4 = ref3[j], indent = ref4.indent, startRow = ref4.startRow, endRow = ref4.endRow;
          if (indexOf.call(targetIndents, indent) >= 0) {
            results1.push(this.editor.foldBufferRowRange(startRow, endRow));
          } else {
            results1.push(void 0);
          }
        }
        return results1;
      }
    };

    return FoldNextIndentLevel;

  })(MiscCommand);

  ReplaceModeBackspace = (function(superClass) {
    extend(ReplaceModeBackspace, superClass);

    function ReplaceModeBackspace() {
      return ReplaceModeBackspace.__super__.constructor.apply(this, arguments);
    }

    ReplaceModeBackspace.commandScope = 'atom-text-editor.vim-mode-plus.insert-mode.replace';

    ReplaceModeBackspace.extend();

    ReplaceModeBackspace.prototype.execute = function() {
      var char, i, len, ref2, results, selection;
      ref2 = this.editor.getSelections();
      results = [];
      for (i = 0, len = ref2.length; i < len; i++) {
        selection = ref2[i];
        char = this.vimState.modeManager.getReplacedCharForSelection(selection);
        if (char != null) {
          selection.selectLeft();
          if (!selection.insertText(char).isEmpty()) {
            results.push(selection.cursor.moveLeft());
          } else {
            results.push(void 0);
          }
        } else {
          results.push(void 0);
        }
      }
      return results;
    };

    return ReplaceModeBackspace;

  })(MiscCommand);

  ScrollWithoutChangingCursorPosition = (function(superClass) {
    extend(ScrollWithoutChangingCursorPosition, superClass);

    function ScrollWithoutChangingCursorPosition() {
      return ScrollWithoutChangingCursorPosition.__super__.constructor.apply(this, arguments);
    }

    ScrollWithoutChangingCursorPosition.extend(false);

    ScrollWithoutChangingCursorPosition.prototype.scrolloff = 2;

    ScrollWithoutChangingCursorPosition.prototype.cursorPixel = null;

    ScrollWithoutChangingCursorPosition.prototype.getFirstVisibleScreenRow = function() {
      return this.editorElement.getFirstVisibleScreenRow();
    };

    ScrollWithoutChangingCursorPosition.prototype.getLastVisibleScreenRow = function() {
      return this.editorElement.getLastVisibleScreenRow();
    };

    ScrollWithoutChangingCursorPosition.prototype.getLastScreenRow = function() {
      return this.editor.getLastScreenRow();
    };

    ScrollWithoutChangingCursorPosition.prototype.getCursorPixel = function() {
      var point;
      point = this.editor.getCursorScreenPosition();
      return this.editorElement.pixelPositionForScreenPosition(point);
    };

    return ScrollWithoutChangingCursorPosition;

  })(MiscCommand);

  ScrollDown = (function(superClass) {
    extend(ScrollDown, superClass);

    function ScrollDown() {
      return ScrollDown.__super__.constructor.apply(this, arguments);
    }

    ScrollDown.extend();

    ScrollDown.prototype.execute = function() {
      var column, count, newFirstRow, newPoint, offset, oldFirstRow, ref2, row;
      count = this.getCount();
      oldFirstRow = this.editor.getFirstVisibleScreenRow();
      this.editor.setFirstVisibleScreenRow(oldFirstRow + count);
      newFirstRow = this.editor.getFirstVisibleScreenRow();
      offset = 2;
      ref2 = this.editor.getCursorScreenPosition(), row = ref2.row, column = ref2.column;
      if (row < (newFirstRow + offset)) {
        newPoint = [row + count, column];
        return this.editor.setCursorScreenPosition(newPoint, {
          autoscroll: false
        });
      }
    };

    return ScrollDown;

  })(ScrollWithoutChangingCursorPosition);

  ScrollUp = (function(superClass) {
    extend(ScrollUp, superClass);

    function ScrollUp() {
      return ScrollUp.__super__.constructor.apply(this, arguments);
    }

    ScrollUp.extend();

    ScrollUp.prototype.execute = function() {
      var column, count, newLastRow, newPoint, offset, oldFirstRow, ref2, row;
      count = this.getCount();
      oldFirstRow = this.editor.getFirstVisibleScreenRow();
      this.editor.setFirstVisibleScreenRow(oldFirstRow - count);
      newLastRow = this.editor.getLastVisibleScreenRow();
      offset = 2;
      ref2 = this.editor.getCursorScreenPosition(), row = ref2.row, column = ref2.column;
      if (row >= (newLastRow - offset)) {
        newPoint = [row - count, column];
        return this.editor.setCursorScreenPosition(newPoint, {
          autoscroll: false
        });
      }
    };

    return ScrollUp;

  })(ScrollWithoutChangingCursorPosition);

  ScrollCursor = (function(superClass) {
    extend(ScrollCursor, superClass);

    function ScrollCursor() {
      return ScrollCursor.__super__.constructor.apply(this, arguments);
    }

    ScrollCursor.extend(false);

    ScrollCursor.prototype.execute = function() {
      if (typeof this.moveToFirstCharacterOfLine === "function") {
        this.moveToFirstCharacterOfLine();
      }
      if (this.isScrollable()) {
        return this.editorElement.setScrollTop(this.getScrollTop());
      }
    };

    ScrollCursor.prototype.moveToFirstCharacterOfLine = function() {
      return this.editor.moveToFirstCharacterOfLine();
    };

    ScrollCursor.prototype.getOffSetPixelHeight = function(lineDelta) {
      if (lineDelta == null) {
        lineDelta = 0;
      }
      return this.editor.getLineHeightInPixels() * (this.scrolloff + lineDelta);
    };

    return ScrollCursor;

  })(ScrollWithoutChangingCursorPosition);

  ScrollCursorToTop = (function(superClass) {
    extend(ScrollCursorToTop, superClass);

    function ScrollCursorToTop() {
      return ScrollCursorToTop.__super__.constructor.apply(this, arguments);
    }

    ScrollCursorToTop.extend();

    ScrollCursorToTop.prototype.isScrollable = function() {
      return this.getLastVisibleScreenRow() !== this.getLastScreenRow();
    };

    ScrollCursorToTop.prototype.getScrollTop = function() {
      return this.getCursorPixel().top - this.getOffSetPixelHeight();
    };

    return ScrollCursorToTop;

  })(ScrollCursor);

  ScrollCursorToTopLeave = (function(superClass) {
    extend(ScrollCursorToTopLeave, superClass);

    function ScrollCursorToTopLeave() {
      return ScrollCursorToTopLeave.__super__.constructor.apply(this, arguments);
    }

    ScrollCursorToTopLeave.extend();

    ScrollCursorToTopLeave.prototype.moveToFirstCharacterOfLine = null;

    return ScrollCursorToTopLeave;

  })(ScrollCursorToTop);

  ScrollCursorToBottom = (function(superClass) {
    extend(ScrollCursorToBottom, superClass);

    function ScrollCursorToBottom() {
      return ScrollCursorToBottom.__super__.constructor.apply(this, arguments);
    }

    ScrollCursorToBottom.extend();

    ScrollCursorToBottom.prototype.isScrollable = function() {
      return this.getFirstVisibleScreenRow() !== 0;
    };

    ScrollCursorToBottom.prototype.getScrollTop = function() {
      return this.getCursorPixel().top - (this.editorElement.getHeight() - this.getOffSetPixelHeight(1));
    };

    return ScrollCursorToBottom;

  })(ScrollCursor);

  ScrollCursorToBottomLeave = (function(superClass) {
    extend(ScrollCursorToBottomLeave, superClass);

    function ScrollCursorToBottomLeave() {
      return ScrollCursorToBottomLeave.__super__.constructor.apply(this, arguments);
    }

    ScrollCursorToBottomLeave.extend();

    ScrollCursorToBottomLeave.prototype.moveToFirstCharacterOfLine = null;

    return ScrollCursorToBottomLeave;

  })(ScrollCursorToBottom);

  ScrollCursorToMiddle = (function(superClass) {
    extend(ScrollCursorToMiddle, superClass);

    function ScrollCursorToMiddle() {
      return ScrollCursorToMiddle.__super__.constructor.apply(this, arguments);
    }

    ScrollCursorToMiddle.extend();

    ScrollCursorToMiddle.prototype.isScrollable = function() {
      return true;
    };

    ScrollCursorToMiddle.prototype.getScrollTop = function() {
      return this.getCursorPixel().top - (this.editorElement.getHeight() / 2);
    };

    return ScrollCursorToMiddle;

  })(ScrollCursor);

  ScrollCursorToMiddleLeave = (function(superClass) {
    extend(ScrollCursorToMiddleLeave, superClass);

    function ScrollCursorToMiddleLeave() {
      return ScrollCursorToMiddleLeave.__super__.constructor.apply(this, arguments);
    }

    ScrollCursorToMiddleLeave.extend();

    ScrollCursorToMiddleLeave.prototype.moveToFirstCharacterOfLine = null;

    return ScrollCursorToMiddleLeave;

  })(ScrollCursorToMiddle);

  ScrollCursorToLeft = (function(superClass) {
    extend(ScrollCursorToLeft, superClass);

    function ScrollCursorToLeft() {
      return ScrollCursorToLeft.__super__.constructor.apply(this, arguments);
    }

    ScrollCursorToLeft.extend();

    ScrollCursorToLeft.prototype.execute = function() {
      return this.editorElement.setScrollLeft(this.getCursorPixel().left);
    };

    return ScrollCursorToLeft;

  })(ScrollWithoutChangingCursorPosition);

  ScrollCursorToRight = (function(superClass) {
    extend(ScrollCursorToRight, superClass);

    function ScrollCursorToRight() {
      return ScrollCursorToRight.__super__.constructor.apply(this, arguments);
    }

    ScrollCursorToRight.extend();

    ScrollCursorToRight.prototype.execute = function() {
      return this.editorElement.setScrollRight(this.getCursorPixel().left);
    };

    return ScrollCursorToRight;

  })(ScrollCursorToLeft);

  InsertMode = (function(superClass) {
    extend(InsertMode, superClass);

    function InsertMode() {
      return InsertMode.__super__.constructor.apply(this, arguments);
    }

    InsertMode.commandScope = 'atom-text-editor.vim-mode-plus.insert-mode';

    return InsertMode;

  })(MiscCommand);

  ActivateNormalModeOnce = (function(superClass) {
    extend(ActivateNormalModeOnce, superClass);

    function ActivateNormalModeOnce() {
      return ActivateNormalModeOnce.__super__.constructor.apply(this, arguments);
    }

    ActivateNormalModeOnce.extend();

    ActivateNormalModeOnce.prototype.thisCommandName = ActivateNormalModeOnce.getCommandName();

    ActivateNormalModeOnce.prototype.execute = function() {
      var cursor, cursorsToMoveRight, disposable, i, len;
      cursorsToMoveRight = this.editor.getCursors().filter(function(cursor) {
        return !cursor.isAtBeginningOfLine();
      });
      this.vimState.activate('normal');
      for (i = 0, len = cursorsToMoveRight.length; i < len; i++) {
        cursor = cursorsToMoveRight[i];
        moveCursorRight(cursor);
      }
      return disposable = atom.commands.onDidDispatch((function(_this) {
        return function(arg) {
          var type;
          type = arg.type;
          if (type === _this.thisCommandName) {
            return;
          }
          disposable.dispose();
          disposable = null;
          return _this.vimState.activate('insert');
        };
      })(this));
    };

    return ActivateNormalModeOnce;

  })(InsertMode);

  InsertRegister = (function(superClass) {
    extend(InsertRegister, superClass);

    function InsertRegister() {
      return InsertRegister.__super__.constructor.apply(this, arguments);
    }

    InsertRegister.extend();

    InsertRegister.prototype.requireInput = true;

    InsertRegister.prototype.initialize = function() {
      InsertRegister.__super__.initialize.apply(this, arguments);
      return this.focusInput();
    };

    InsertRegister.prototype.execute = function() {
      return this.editor.transact((function(_this) {
        return function() {
          var i, len, ref2, results, selection, text;
          ref2 = _this.editor.getSelections();
          results = [];
          for (i = 0, len = ref2.length; i < len; i++) {
            selection = ref2[i];
            text = _this.vimState.register.getText(_this.input, selection);
            results.push(selection.insertText(text));
          }
          return results;
        };
      })(this));
    };

    return InsertRegister;

  })(InsertMode);

  InsertLastInserted = (function(superClass) {
    extend(InsertLastInserted, superClass);

    function InsertLastInserted() {
      return InsertLastInserted.__super__.constructor.apply(this, arguments);
    }

    InsertLastInserted.extend();

    InsertLastInserted.description = "Insert text inserted in latest insert-mode.\nEquivalent to *i_CTRL-A* of pure Vim";

    InsertLastInserted.prototype.execute = function() {
      var text;
      text = this.vimState.register.getText('.');
      return this.editor.insertText(text);
    };

    return InsertLastInserted;

  })(InsertMode);

  CopyFromLineAbove = (function(superClass) {
    extend(CopyFromLineAbove, superClass);

    function CopyFromLineAbove() {
      return CopyFromLineAbove.__super__.constructor.apply(this, arguments);
    }

    CopyFromLineAbove.extend();

    CopyFromLineAbove.description = "Insert character of same-column of above line.\nEquivalent to *i_CTRL-Y* of pure Vim";

    CopyFromLineAbove.prototype.rowDelta = -1;

    CopyFromLineAbove.prototype.execute = function() {
      var translation;
      translation = [this.rowDelta, 0];
      return this.editor.transact((function(_this) {
        return function() {
          var i, len, point, range, ref2, results, selection, text;
          ref2 = _this.editor.getSelections();
          results = [];
          for (i = 0, len = ref2.length; i < len; i++) {
            selection = ref2[i];
            point = selection.cursor.getBufferPosition().translate(translation);
            if (point.row < 0) {
              continue;
            }
            range = Range.fromPointWithDelta(point, 0, 1);
            if (text = _this.editor.getTextInBufferRange(range)) {
              results.push(selection.insertText(text));
            } else {
              results.push(void 0);
            }
          }
          return results;
        };
      })(this));
    };

    return CopyFromLineAbove;

  })(InsertMode);

  CopyFromLineBelow = (function(superClass) {
    extend(CopyFromLineBelow, superClass);

    function CopyFromLineBelow() {
      return CopyFromLineBelow.__super__.constructor.apply(this, arguments);
    }

    CopyFromLineBelow.extend();

    CopyFromLineBelow.description = "Insert character of same-column of above line.\nEquivalent to *i_CTRL-E* of pure Vim";

    CopyFromLineBelow.prototype.rowDelta = +1;

    return CopyFromLineBelow;

  })(CopyFromLineAbove);

  NextTab = (function(superClass) {
    extend(NextTab, superClass);

    function NextTab() {
      return NextTab.__super__.constructor.apply(this, arguments);
    }

    NextTab.extend();

    NextTab.prototype.defaultCount = 0;

    NextTab.prototype.execute = function() {
      var count, pane;
      count = this.getCount();
      pane = atom.workspace.paneForItem(this.editor);
      if (count) {
        return pane.activateItemAtIndex(count - 1);
      } else {
        return pane.activateNextItem();
      }
    };

    return NextTab;

  })(MiscCommand);

  PreviousTab = (function(superClass) {
    extend(PreviousTab, superClass);

    function PreviousTab() {
      return PreviousTab.__super__.constructor.apply(this, arguments);
    }

    PreviousTab.extend();

    PreviousTab.prototype.execute = function() {
      var pane;
      pane = atom.workspace.paneForItem(this.editor);
      return pane.activatePreviousItem();
    };

    return PreviousTab;

  })(MiscCommand);

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL2hvbWUvbWFyY3VzLy5hdG9tL3BhY2thZ2VzL3ZpbS1tb2RlLXBsdXMvbGliL21pc2MtY29tbWFuZC5jb2ZmZWUiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUFBQSxNQUFBLDQ3QkFBQTtJQUFBOzs7O0VBQUEsTUFBaUIsT0FBQSxDQUFRLE1BQVIsQ0FBakIsRUFBQyxpQkFBRCxFQUFROztFQUNSLElBQUEsR0FBTyxPQUFBLENBQVEsUUFBUjs7RUFDUCxDQUFBLEdBQUksT0FBQSxDQUFRLGlCQUFSOztFQUVKLE9BWUksT0FBQSxDQUFRLFNBQVIsQ0FaSixFQUNFLHNDQURGLEVBRUUsc0NBRkYsRUFHRSxnQ0FIRixFQUlFLDRCQUpGLEVBS0Usb0RBTEYsRUFNRSwwQ0FORixFQU9FLHdEQVBGLEVBUUUsOENBUkYsRUFTRSwwQ0FURixFQVVFLDhCQVZGLEVBV0U7O0VBR0k7OztJQUNKLFdBQUMsQ0FBQSxNQUFELENBQVEsS0FBUjs7SUFDQSxXQUFDLENBQUEsYUFBRCxHQUFnQjs7SUFDSCxxQkFBQTtNQUNYLDhDQUFBLFNBQUE7TUFDQSxJQUFDLENBQUEsVUFBRCxDQUFBO0lBRlc7Ozs7S0FIVzs7RUFPcEI7Ozs7Ozs7SUFDSixJQUFDLENBQUEsTUFBRCxDQUFBOzttQkFDQSxZQUFBLEdBQWM7O21CQUNkLFVBQUEsR0FBWSxTQUFBO01BQ1YsSUFBQyxDQUFBLFVBQUQsQ0FBQTthQUNBLHNDQUFBLFNBQUE7SUFGVTs7bUJBSVosT0FBQSxHQUFTLFNBQUE7TUFDUCxJQUFDLENBQUEsUUFBUSxDQUFDLElBQUksQ0FBQyxHQUFmLENBQW1CLElBQUMsQ0FBQSxLQUFwQixFQUEyQixJQUFDLENBQUEsTUFBTSxDQUFDLHVCQUFSLENBQUEsQ0FBM0I7YUFDQSxJQUFDLENBQUEsWUFBRCxDQUFjLFFBQWQ7SUFGTzs7OztLQVBROztFQVdiOzs7Ozs7O0lBQ0osaUJBQUMsQ0FBQSxNQUFELENBQUE7O2dDQUNBLE9B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LENBQUMsVUFBVixDQUFxQixJQUFyQixHQURGO2FBQUEsTUFBQTttQ0FBQTs7QUFKRjs7UUFEZTtNQUFBLENBQUEsQ0FBQSxDQUFBLElBQUEsQ0FBakI7SUFGTzs7OztLQVJxQjs7RUFrQjFCOzs7Ozs7O0lBQ0osaUJBQUMsQ0FBQSxNQUFELENBQUE7O0lBQ0EsaUJBQUMsQ0FBQSxXQUFELEdBQWM7O2dDQUlkLFFBQUEsR0FBVSxDQUFDOzs7O0tBTm1COztFQVExQjs7Ozs7OztJQUNKLE9BQUMsQ0FBQSxNQUFELENBQUE7O3NCQUNBLFlBQUEsR0FBYzs7c0JBQ2QsT0FBQSxHQUFTLFNBQUE7QUFDUCxVQUFBO01BQUEsS0FBQSxHQUFRLElBQUMsQ0FBQSxRQUFELENBQUE7TUFDUixJQUFBLEdBQU8sSUFBSSxDQUFDLFNBQVMsQ0FBQyxXQUFmLENBQTJCLElBQUMsQ0FBQSxNQUE1QjtNQUNQLElBQUcsS0FBSDtlQUNFLElBQUksQ0FBQyxtQkFBTCxDQUF5QixLQUFBLEdBQVEsQ0FBakMsRUFERjtPQUFBLE1BQUE7ZUFHRSxJQUFJLENBQUMsZ0JBQUwsQ0FBQSxFQUhGOztJQUhPOzs7O0tBSFc7O0VBV2hCOzs7Ozs7O0lBQ0osV0FBQyxDQUFBLE1BQUQsQ0FBQTs7MEJBQ0EsT0FBQSxHQUFTLFNBQUE7QUFDUCxVQUFBO01BQUEsSUFBQSxHQUFPLElBQUksQ0FBQyxTQUFTLENBQUMsV0FBZixDQUEyQixJQUFDLENBQUEsTUFBNUI7YUFDUCxJQUFJLENBQUMsb0JBQUwsQ0FBQTtJQUZPOzs7O0tBRmU7QUFsZjFCIiwic291cmNlc0NvbnRlbnQiOlsie1JhbmdlLCBQb2ludH0gPSByZXF1aXJlICdhdG9tJ1xuQmFzZSA9IHJlcXVpcmUgJy4vYmFzZSdcbl8gPSByZXF1aXJlICd1bmRlcnNjb3JlLXBsdXMnXG5cbntcbiAgbW92ZUN1cnNvclJpZ2h0XG4gIGlzTGluZXdpc2VSYW5nZVxuICBzZXRCdWZmZXJSb3dcbiAgc29ydFJhbmdlc1xuICBmaW5kUmFuZ2VDb250YWluc1BvaW50XG4gIGlzU2luZ2xlTGluZVJhbmdlXG4gIGlzTGVhZGluZ1doaXRlU3BhY2VSYW5nZVxuICBodW1hbml6ZUJ1ZmZlclJhbmdlXG4gIGdldEZvbGRJbmZvQnlLaW5kXG4gIGxpbWl0TnVtYmVyXG4gIGdldEZvbGRSb3dSYW5nZXNDb250YWluZWRCeUZvbGRTdGFydHNBdFJvd1xufSA9IHJlcXVpcmUgJy4vdXRpbHMnXG5cbmNsYXNzIE1pc2NDb21tYW5kIGV4dGVuZHMgQmFzZVxuICBAZXh0ZW5kKGZhbHNlKVxuICBAb3BlcmF0aW9uS2luZDogJ21pc2MtY29tbWFuZCdcbiAgY29uc3RydWN0b3I6IC0+XG4gICAgc3VwZXJcbiAgICBAaW5pdGlhbGl6ZSgpXG5cbmNsYXNzIE1hcmsgZXh0ZW5kcyBNaXNjQ29tbWFuZFxuICBAZXh0ZW5kKClcbiAgcmVxdWlyZUlucHV0OiB0cnVlXG4gIGluaXRpYWxpemU6IC0+XG4gICAgQGZvY3VzSW5wdXQoKVxuICAgIHN1cGVyXG5cbiAgZXhlY3V0ZTogLT5cbiAgICBAdmltU3RhdGUubWFyay5zZXQoQGlucHV0LCBAZWRpdG9yLmdldEN1cnNvckJ1ZmZlclBvc2l0aW9uKCkpXG4gICAgQGFjdGl2YXRlTW9kZSgnbm9ybWFsJylcblxuY2xhc3MgUmV2ZXJzZVNlbGVjdGlvbnMgZXh0ZW5kcyBNaXNjQ29tbWFuZFxuICBAZXh0ZW5kKClcbiAgZXhlY3V0ZTogLT5cbiAgICBAc3dyYXAuc2V0UmV2ZXJzZWRTdGF0ZShAZWRpdG9yLCBub3QgQGVkaXRvci5nZXRMYXN0U2VsZWN0aW9uKCkuaXNSZXZlcnNlZCgpKVxuICAgIGlmIEBpc01vZGUoJ3Zpc3VhbCcsICdibG9ja3dpc2UnKVxuICAgICAgQGdldExhc3RCbG9ja3dpc2VTZWxlY3Rpb24oKS5hdXRvc2Nyb2xsKClcblxuY2xhc3MgQmxvY2t3aXNlT3RoZXJFbmQgZXh0ZW5kcyBSZXZlcnNlU2VsZWN0aW9uc1xuICBAZXh0ZW5kKClcbiAgZXhlY3V0ZTogLT5cbiAgICBmb3IgYmxvY2t3aXNlU2VsZWN0aW9uIGluIEBnZXRCbG9ja3dpc2VTZWxlY3Rpb25zKClcbiAgICAgIGJsb2Nrd2lzZVNlbGVjdGlvbi5yZXZlcnNlKClcbiAgICBzdXBlclxuXG5jbGFzcyBVbmRvIGV4dGVuZHMgTWlzY0NvbW1hbmRcbiAgQGV4dGVuZCgpXG5cbiAgc2V0Q3Vyc29yUG9zaXRpb246ICh7bmV3UmFuZ2VzLCBvbGRSYW5nZXMsIHN0cmF0ZWd5fSkgLT5cbiAgICBsYXN0Q3Vyc29yID0gQGVkaXRvci5nZXRMYXN0Q3Vyc29yKCkgIyBUaGlzIGlzIHJlc3RvcmVkIGN1cnNvclxuXG4gICAgaWYgc3RyYXRlZ3kgaXMgJ3NtYXJ0J1xuICAgICAgY2hhbmdlZFJhbmdlID0gZmluZFJhbmdlQ29udGFpbnNQb2ludChuZXdSYW5nZXMsIGxhc3RDdXJzb3IuZ2V0QnVmZmVyUG9zaXRpb24oKSlcbiAgICBlbHNlXG4gICAgICBjaGFuZ2VkUmFuZ2UgPSBzb3J0UmFuZ2VzKG5ld1Jhbmdlcy5jb25jYXQob2xkUmFuZ2VzKSlbMF1cblxuICAgIGlmIGNoYW5nZWRSYW5nZT9cbiAgICAgIGlmIGlzTGluZXdpc2VSYW5nZShjaGFuZ2VkUmFuZ2UpXG4gICAgICAgIHNldEJ1ZmZlclJvdyhsYXN0Q3Vyc29yLCBjaGFuZ2VkUmFuZ2Uuc3RhcnQucm93KVxuICAgICAgZWxzZVxuICAgICAgICBsYXN0Q3Vyc29yLnNldEJ1ZmZlclBvc2l0aW9uKGNoYW5nZWRSYW5nZS5zdGFydClcblxuICBtdXRhdGVXaXRoVHJhY2tDaGFuZ2VzOiAtPlxuICAgIG5ld1JhbmdlcyA9IFtdXG4gICAgb2xkUmFuZ2VzID0gW11cblxuICAgICMgQ29sbGVjdCBjaGFuZ2VkIHJhbmdlIHdoaWxlIG11dGF0aW5nIHRleHQtc3RhdGUgYnkgZm4gY2FsbGJhY2suXG4gICAgZGlzcG9zYWJsZSA9IEBlZGl0b3IuZ2V0QnVmZmVyKCkub25EaWRDaGFuZ2UgKHtuZXdSYW5nZSwgb2xkUmFuZ2V9KSAtPlxuICAgICAgaWYgbmV3UmFuZ2UuaXNFbXB0eSgpXG4gICAgICAgIG9sZFJhbmdlcy5wdXNoKG9sZFJhbmdlKSAjIFJlbW92ZSBvbmx5XG4gICAgICBlbHNlXG4gICAgICAgIG5ld1Jhbmdlcy5wdXNoKG5ld1JhbmdlKVxuXG4gICAgQG11dGF0ZSgpXG5cbiAgICBkaXNwb3NhYmxlLmRpc3Bvc2UoKVxuICAgIHtuZXdSYW5nZXMsIG9sZFJhbmdlc31cblxuICBmbGFzaENoYW5nZXM6ICh7bmV3UmFuZ2VzLCBvbGRSYW5nZXN9KSAtPlxuICAgIGlzTXVsdGlwbGVTaW5nbGVMaW5lUmFuZ2VzID0gKHJhbmdlcykgLT5cbiAgICAgIHJhbmdlcy5sZW5ndGggPiAxIGFuZCByYW5nZXMuZXZlcnkoaXNTaW5nbGVMaW5lUmFuZ2UpXG5cbiAgICBpZiBuZXdSYW5nZXMubGVuZ3RoID4gMFxuICAgICAgcmV0dXJuIGlmIEBpc011bHRpcGxlQW5kQWxsUmFuZ2VIYXZlU2FtZUNvbHVtbkFuZENvbnNlY3V0aXZlUm93cyhuZXdSYW5nZXMpXG4gICAgICBuZXdSYW5nZXMgPSBuZXdSYW5nZXMubWFwIChyYW5nZSkgPT4gaHVtYW5pemVCdWZmZXJSYW5nZShAZWRpdG9yLCByYW5nZSlcbiAgICAgIG5ld1JhbmdlcyA9IEBmaWx0ZXJOb25MZWFkaW5nV2hpdGVTcGFjZVJhbmdlKG5ld1JhbmdlcylcblxuICAgICAgaWYgaXNNdWx0aXBsZVNpbmdsZUxpbmVSYW5nZXMobmV3UmFuZ2VzKVxuICAgICAgICBAZmxhc2gobmV3UmFuZ2VzLCB0eXBlOiAndW5kby1yZWRvLW11bHRpcGxlLWNoYW5nZXMnKVxuICAgICAgZWxzZVxuICAgICAgICBAZmxhc2gobmV3UmFuZ2VzLCB0eXBlOiAndW5kby1yZWRvJylcbiAgICBlbHNlXG4gICAgICByZXR1cm4gaWYgQGlzTXVsdGlwbGVBbmRBbGxSYW5nZUhhdmVTYW1lQ29sdW1uQW5kQ29uc2VjdXRpdmVSb3dzKG9sZFJhbmdlcylcblxuICAgICAgaWYgaXNNdWx0aXBsZVNpbmdsZUxpbmVSYW5nZXMob2xkUmFuZ2VzKVxuICAgICAgICBvbGRSYW5nZXMgPSBAZmlsdGVyTm9uTGVhZGluZ1doaXRlU3BhY2VSYW5nZShvbGRSYW5nZXMpXG4gICAgICAgIEBmbGFzaChvbGRSYW5nZXMsIHR5cGU6ICd1bmRvLXJlZG8tbXVsdGlwbGUtZGVsZXRlJylcblxuICBmaWx0ZXJOb25MZWFkaW5nV2hpdGVTcGFjZVJhbmdlOiAocmFuZ2VzKSAtPlxuICAgIHJhbmdlcy5maWx0ZXIgKHJhbmdlKSA9PlxuICAgICAgbm90IGlzTGVhZGluZ1doaXRlU3BhY2VSYW5nZShAZWRpdG9yLCByYW5nZSlcblxuICAjIFtUT0RPXSBJbXByb3ZlIGZ1cnRoZXIgYnkgY2hlY2tpbmcgb2xkVGV4dCwgbmV3VGV4dD9cbiAgIyBbUHVycG9zZSBvZiB0aGlzIGlzIGZ1bmN0aW9uXVxuICAjIFN1cHByZXNzIGZsYXNoIHdoZW4gdW5kby9yZWRvaW5nIHRvZ2dsZS1jb21tZW50IHdoaWxlIGZsYXNoaW5nIHVuZG8vcmVkbyBvZiBvY2N1cnJlbmNlIG9wZXJhdGlvbi5cbiAgIyBUaGlzIGh1cmlzdGljIGFwcHJvYWNoIG5ldmVyIGJlIHBlcmZlY3QuXG4gICMgVWx0aW1hdGVseSBjYW5ubm90IGRpc3Rpbmd1aXNoIG9jY3VycmVuY2Ugb3BlcmF0aW9uLlxuICBpc011bHRpcGxlQW5kQWxsUmFuZ2VIYXZlU2FtZUNvbHVtbkFuZENvbnNlY3V0aXZlUm93czogKHJhbmdlcykgLT5cbiAgICByZXR1cm4gZmFsc2UgaWYgcmFuZ2VzLmxlbmd0aCA8PSAxXG5cbiAgICB7c3RhcnQ6IHtjb2x1bW46IHN0YXJ0Q29sdW1ufSwgZW5kOiB7Y29sdW1uOiBlbmRDb2x1bW59fSA9IHJhbmdlc1swXVxuICAgIHByZXZpb3VzUm93ID0gbnVsbFxuICAgIGZvciByYW5nZSBpbiByYW5nZXNcbiAgICAgIHtzdGFydCwgZW5kfSA9IHJhbmdlXG4gICAgICB1bmxlc3MgKChzdGFydC5jb2x1bW4gaXMgc3RhcnRDb2x1bW4pIGFuZCAoZW5kLmNvbHVtbiBpcyBlbmRDb2x1bW4pKVxuICAgICAgICByZXR1cm4gZmFsc2VcblxuICAgICAgaWYgcHJldmlvdXNSb3c/IGFuZCAocHJldmlvdXNSb3cgKyAxIGlzbnQgc3RhcnQucm93KVxuICAgICAgICByZXR1cm4gZmFsc2VcbiAgICAgIHByZXZpb3VzUm93ID0gc3RhcnQucm93XG4gICAgcmV0dXJuIHRydWVcblxuICAgIHJhbmdlcy5ldmVyeSAoe3N0YXJ0LCBlbmR9KSAtPlxuICAgICAgKHN0YXJ0LmNvbHVtbiBpcyBzdGFydENvbHVtbikgYW5kIChlbmQuY29sdW1uIGlzIGVuZENvbHVtbilcblxuICBmbGFzaDogKGZsYXNoUmFuZ2VzLCBvcHRpb25zKSAtPlxuICAgIG9wdGlvbnMudGltZW91dCA/PSA1MDBcbiAgICBAb25EaWRGaW5pc2hPcGVyYXRpb24gPT5cbiAgICAgIEB2aW1TdGF0ZS5mbGFzaChmbGFzaFJhbmdlcywgb3B0aW9ucylcblxuICBleGVjdXRlOiAtPlxuICAgIHtuZXdSYW5nZXMsIG9sZFJhbmdlc30gPSBAbXV0YXRlV2l0aFRyYWNrQ2hhbmdlcygpXG5cbiAgICBmb3Igc2VsZWN0aW9uIGluIEBlZGl0b3IuZ2V0U2VsZWN0aW9ucygpXG4gICAgICBzZWxlY3Rpb24uY2xlYXIoKVxuXG4gICAgaWYgQGdldENvbmZpZygnc2V0Q3Vyc29yVG9TdGFydE9mQ2hhbmdlT25VbmRvUmVkbycpXG4gICAgICBzdHJhdGVneSA9IEBnZXRDb25maWcoJ3NldEN1cnNvclRvU3RhcnRPZkNoYW5nZU9uVW5kb1JlZG9TdHJhdGVneScpXG4gICAgICBAc2V0Q3Vyc29yUG9zaXRpb24oe25ld1Jhbmdlcywgb2xkUmFuZ2VzLCBzdHJhdGVneX0pXG4gICAgICBAdmltU3RhdGUuY2xlYXJTZWxlY3Rpb25zKClcblxuICAgIGlmIEBnZXRDb25maWcoJ2ZsYXNoT25VbmRvUmVkbycpXG4gICAgICBAZmxhc2hDaGFuZ2VzKHtuZXdSYW5nZXMsIG9sZFJhbmdlc30pXG5cbiAgICBAYWN0aXZhdGVNb2RlKCdub3JtYWwnKVxuXG4gIG11dGF0ZTogLT5cbiAgICBAZWRpdG9yLnVuZG8oKVxuXG5jbGFzcyBSZWRvIGV4dGVuZHMgVW5kb1xuICBAZXh0ZW5kKClcbiAgbXV0YXRlOiAtPlxuICAgIEBlZGl0b3IucmVkbygpXG5cbiMgemNcbmNsYXNzIEZvbGRDdXJyZW50Um93IGV4dGVuZHMgTWlzY0NvbW1hbmRcbiAgQGV4dGVuZCgpXG4gIGV4ZWN1dGU6IC0+XG4gICAgZm9yIHNlbGVjdGlvbiBpbiBAZWRpdG9yLmdldFNlbGVjdGlvbnMoKVxuICAgICAge3Jvd30gPSBAZ2V0Q3Vyc29yUG9zaXRpb25Gb3JTZWxlY3Rpb24oc2VsZWN0aW9uKVxuICAgICAgQGVkaXRvci5mb2xkQnVmZmVyUm93KHJvdylcblxuIyB6b1xuY2xhc3MgVW5mb2xkQ3VycmVudFJvdyBleHRlbmRzIE1pc2NDb21tYW5kXG4gIEBleHRlbmQoKVxuICBleGVjdXRlOiAtPlxuICAgIGZvciBzZWxlY3Rpb24gaW4gQGVkaXRvci5nZXRTZWxlY3Rpb25zKClcbiAgICAgIHtyb3d9ID0gQGdldEN1cnNvclBvc2l0aW9uRm9yU2VsZWN0aW9uKHNlbGVjdGlvbilcbiAgICAgIEBlZGl0b3IudW5mb2xkQnVmZmVyUm93KHJvdylcblxuIyB6YVxuY2xhc3MgVG9nZ2xlRm9sZCBleHRlbmRzIE1pc2NDb21tYW5kXG4gIEBleHRlbmQoKVxuICBleGVjdXRlOiAtPlxuICAgIHBvaW50ID0gQGVkaXRvci5nZXRDdXJzb3JCdWZmZXJQb3NpdGlvbigpXG4gICAgQGVkaXRvci50b2dnbGVGb2xkQXRCdWZmZXJSb3cocG9pbnQucm93KVxuXG4jIEJhc2Ugb2YgekMsIHpPLCB6QVxuY2xhc3MgRm9sZEN1cnJlbnRSb3dSZWN1cnNpdmVseUJhc2UgZXh0ZW5kcyBNaXNjQ29tbWFuZFxuICBAZXh0ZW5kKGZhbHNlKVxuXG4gIGZvbGRSZWN1cnNpdmVseTogKHJvdykgLT5cbiAgICByb3dSYW5nZXMgPSBnZXRGb2xkUm93UmFuZ2VzQ29udGFpbmVkQnlGb2xkU3RhcnRzQXRSb3coQGVkaXRvciwgcm93KVxuICAgIGlmIHJvd1Jhbmdlcz9cbiAgICAgIHN0YXJ0Um93cyA9IHJvd1Jhbmdlcy5tYXAgKHJvd1JhbmdlKSAtPiByb3dSYW5nZVswXVxuICAgICAgZm9yIHJvdyBpbiBzdGFydFJvd3MucmV2ZXJzZSgpIHdoZW4gbm90IEBlZGl0b3IuaXNGb2xkZWRBdEJ1ZmZlclJvdyhyb3cpXG4gICAgICAgIEBlZGl0b3IuZm9sZEJ1ZmZlclJvdyhyb3cpXG5cbiAgdW5mb2xkUmVjdXJzaXZlbHk6IChyb3cpIC0+XG4gICAgcm93UmFuZ2VzID0gZ2V0Rm9sZFJvd1Jhbmdlc0NvbnRhaW5lZEJ5Rm9sZFN0YXJ0c0F0Um93KEBlZGl0b3IsIHJvdylcbiAgICBpZiByb3dSYW5nZXM/XG4gICAgICBzdGFydFJvd3MgPSByb3dSYW5nZXMubWFwIChyb3dSYW5nZSkgLT4gcm93UmFuZ2VbMF1cbiAgICAgIGZvciByb3cgaW4gc3RhcnRSb3dzIHdoZW4gQGVkaXRvci5pc0ZvbGRlZEF0QnVmZmVyUm93KHJvdylcbiAgICAgICAgQGVkaXRvci51bmZvbGRCdWZmZXJSb3cocm93KVxuXG4gIGZvbGRSZWN1cnNpdmVseUZvckFsbFNlbGVjdGlvbnM6IC0+XG4gICAgZm9yIHNlbGVjdGlvbiBpbiBAZWRpdG9yLmdldFNlbGVjdGlvbnNPcmRlcmVkQnlCdWZmZXJQb3NpdGlvbigpLnJldmVyc2UoKVxuICAgICAgQGZvbGRSZWN1cnNpdmVseShAZ2V0Q3Vyc29yUG9zaXRpb25Gb3JTZWxlY3Rpb24oc2VsZWN0aW9uKS5yb3cpXG5cbiAgdW5mb2xkUmVjdXJzaXZlbHlGb3JBbGxTZWxlY3Rpb25zOiAtPlxuICAgIGZvciBzZWxlY3Rpb24gaW4gQGVkaXRvci5nZXRTZWxlY3Rpb25zT3JkZXJlZEJ5QnVmZmVyUG9zaXRpb24oKVxuICAgICAgQHVuZm9sZFJlY3Vyc2l2ZWx5KEBnZXRDdXJzb3JQb3NpdGlvbkZvclNlbGVjdGlvbihzZWxlY3Rpb24pLnJvdylcblxuIyB6Q1xuY2xhc3MgRm9sZEN1cnJlbnRSb3dSZWN1cnNpdmVseSBleHRlbmRzIEZvbGRDdXJyZW50Um93UmVjdXJzaXZlbHlCYXNlXG4gIEBleHRlbmQoKVxuICBleGVjdXRlOiAtPlxuICAgIEBmb2xkUmVjdXJzaXZlbHlGb3JBbGxTZWxlY3Rpb25zKClcblxuIyB6T1xuY2xhc3MgVW5mb2xkQ3VycmVudFJvd1JlY3Vyc2l2ZWx5IGV4dGVuZHMgRm9sZEN1cnJlbnRSb3dSZWN1cnNpdmVseUJhc2VcbiAgQGV4dGVuZCgpXG4gIGV4ZWN1dGU6IC0+XG4gICAgQHVuZm9sZFJlY3Vyc2l2ZWx5Rm9yQWxsU2VsZWN0aW9ucygpXG5cbiMgekFcbmNsYXNzIFRvZ2dsZUZvbGRSZWN1cnNpdmVseSBleHRlbmRzIEZvbGRDdXJyZW50Um93UmVjdXJzaXZlbHlCYXNlXG4gIEBleHRlbmQoKVxuICBleGVjdXRlOiAtPlxuICAgIHJvdyA9IEBnZXRDdXJzb3JQb3NpdGlvbkZvclNlbGVjdGlvbihAZWRpdG9yLmdldExhc3RTZWxlY3Rpb24oKSkucm93XG4gICAgaWYgQGVkaXRvci5pc0ZvbGRlZEF0QnVmZmVyUm93KHJvdylcbiAgICAgIEB1bmZvbGRSZWN1cnNpdmVseUZvckFsbFNlbGVjdGlvbnMoKVxuICAgIGVsc2VcbiAgICAgIEBmb2xkUmVjdXJzaXZlbHlGb3JBbGxTZWxlY3Rpb25zKClcblxuIyB6UlxuY2xhc3MgVW5mb2xkQWxsIGV4dGVuZHMgTWlzY0NvbW1hbmRcbiAgQGV4dGVuZCgpXG4gIGV4ZWN1dGU6IC0+XG4gICAgQGVkaXRvci51bmZvbGRBbGwoKVxuXG4jIHpNXG5jbGFzcyBGb2xkQWxsIGV4dGVuZHMgTWlzY0NvbW1hbmRcbiAgQGV4dGVuZCgpXG4gIGV4ZWN1dGU6IC0+XG4gICAge2FsbEZvbGR9ID0gZ2V0Rm9sZEluZm9CeUtpbmQoQGVkaXRvcilcbiAgICBpZiBhbGxGb2xkP1xuICAgICAgQGVkaXRvci51bmZvbGRBbGwoKVxuICAgICAgZm9yIHtpbmRlbnQsIHN0YXJ0Um93LCBlbmRSb3d9IGluIGFsbEZvbGQucm93UmFuZ2VzV2l0aEluZGVudFxuICAgICAgICBpZiBpbmRlbnQgPD0gQGdldENvbmZpZygnbWF4Rm9sZGFibGVJbmRlbnRMZXZlbCcpXG4gICAgICAgICAgQGVkaXRvci5mb2xkQnVmZmVyUm93UmFuZ2Uoc3RhcnRSb3csIGVuZFJvdylcblxuIyB6clxuY2xhc3MgVW5mb2xkTmV4dEluZGVudExldmVsIGV4dGVuZHMgTWlzY0NvbW1hbmRcbiAgQGV4dGVuZCgpXG4gIGV4ZWN1dGU6IC0+XG4gICAge2ZvbGRlZH0gPSBnZXRGb2xkSW5mb0J5S2luZChAZWRpdG9yKVxuICAgIGlmIGZvbGRlZD9cbiAgICAgIHttaW5JbmRlbnQsIHJvd1Jhbmdlc1dpdGhJbmRlbnR9ID0gZm9sZGVkXG4gICAgICBjb3VudCA9IGxpbWl0TnVtYmVyKEBnZXRDb3VudCgpIC0gMSwgbWluOiAwKVxuICAgICAgdGFyZ2V0SW5kZW50cyA9IFttaW5JbmRlbnQuLihtaW5JbmRlbnQgKyBjb3VudCldXG4gICAgICBmb3Ige2luZGVudCwgc3RhcnRSb3d9IGluIHJvd1Jhbmdlc1dpdGhJbmRlbnRcbiAgICAgICAgaWYgaW5kZW50IGluIHRhcmdldEluZGVudHNcbiAgICAgICAgICBAZWRpdG9yLnVuZm9sZEJ1ZmZlclJvdyhzdGFydFJvdylcblxuIyB6bVxuY2xhc3MgRm9sZE5leHRJbmRlbnRMZXZlbCBleHRlbmRzIE1pc2NDb21tYW5kXG4gIEBleHRlbmQoKVxuICBleGVjdXRlOiAtPlxuICAgIHt1bmZvbGRlZCwgYWxsRm9sZH0gPSBnZXRGb2xkSW5mb0J5S2luZChAZWRpdG9yKVxuICAgIGlmIHVuZm9sZGVkP1xuICAgICAgIyBGSVhNRTogV2h5IEkgbmVlZCB1bmZvbGRBbGwoKT8gV2h5IGNhbid0IEkganVzdCBmb2xkIG5vbi1mb2xkZWQtZm9sZCBvbmx5P1xuICAgICAgIyBVbmxlc3MgdW5mb2xkQWxsKCkgaGVyZSwgQGVkaXRvci51bmZvbGRBbGwoKSBkZWxldGUgZm9sZE1hcmtlciBidXQgZmFpbFxuICAgICAgIyB0byByZW5kZXIgdW5mb2xkZWQgcm93cyBjb3JyZWN0bHkuXG4gICAgICAjIEkgYmVsaWV2ZSB0aGlzIGlzIGJ1ZyBvZiB0ZXh0LWJ1ZmZlcidzIG1hcmtlckxheWVyIHdoaWNoIGFzc3VtZSBmb2xkcyBhcmVcbiAgICAgICMgY3JlYXRlZCAqKmluLW9yZGVyKiogZnJvbSB0b3Atcm93IHRvIGJvdHRvbS1yb3cuXG4gICAgICBAZWRpdG9yLnVuZm9sZEFsbCgpXG5cbiAgICAgIG1heEZvbGRhYmxlID0gQGdldENvbmZpZygnbWF4Rm9sZGFibGVJbmRlbnRMZXZlbCcpXG4gICAgICBmcm9tTGV2ZWwgPSBNYXRoLm1pbih1bmZvbGRlZC5tYXhJbmRlbnQsIG1heEZvbGRhYmxlKVxuICAgICAgY291bnQgPSBsaW1pdE51bWJlcihAZ2V0Q291bnQoKSAtIDEsIG1pbjogMClcbiAgICAgIGZyb21MZXZlbCA9IGxpbWl0TnVtYmVyKGZyb21MZXZlbCAtIGNvdW50LCBtaW46IDApXG4gICAgICB0YXJnZXRJbmRlbnRzID0gW2Zyb21MZXZlbC4ubWF4Rm9sZGFibGVdXG5cbiAgICAgIGZvciB7aW5kZW50LCBzdGFydFJvdywgZW5kUm93fSBpbiBhbGxGb2xkLnJvd1Jhbmdlc1dpdGhJbmRlbnRcbiAgICAgICAgaWYgaW5kZW50IGluIHRhcmdldEluZGVudHNcbiAgICAgICAgICBAZWRpdG9yLmZvbGRCdWZmZXJSb3dSYW5nZShzdGFydFJvdywgZW5kUm93KVxuXG5jbGFzcyBSZXBsYWNlTW9kZUJhY2tzcGFjZSBleHRlbmRzIE1pc2NDb21tYW5kXG4gIEBjb21tYW5kU2NvcGU6ICdhdG9tLXRleHQtZWRpdG9yLnZpbS1tb2RlLXBsdXMuaW5zZXJ0LW1vZGUucmVwbGFjZSdcbiAgQGV4dGVuZCgpXG4gIGV4ZWN1dGU6IC0+XG4gICAgZm9yIHNlbGVjdGlvbiBpbiBAZWRpdG9yLmdldFNlbGVjdGlvbnMoKVxuICAgICAgIyBjaGFyIG1pZ2h0IGJlIGVtcHR5LlxuICAgICAgY2hhciA9IEB2aW1TdGF0ZS5tb2RlTWFuYWdlci5nZXRSZXBsYWNlZENoYXJGb3JTZWxlY3Rpb24oc2VsZWN0aW9uKVxuICAgICAgaWYgY2hhcj9cbiAgICAgICAgc2VsZWN0aW9uLnNlbGVjdExlZnQoKVxuICAgICAgICB1bmxlc3Mgc2VsZWN0aW9uLmluc2VydFRleHQoY2hhcikuaXNFbXB0eSgpXG4gICAgICAgICAgc2VsZWN0aW9uLmN1cnNvci5tb3ZlTGVmdCgpXG5cbmNsYXNzIFNjcm9sbFdpdGhvdXRDaGFuZ2luZ0N1cnNvclBvc2l0aW9uIGV4dGVuZHMgTWlzY0NvbW1hbmRcbiAgQGV4dGVuZChmYWxzZSlcbiAgc2Nyb2xsb2ZmOiAyICMgYXRvbSBkZWZhdWx0LiBCZXR0ZXIgdG8gdXNlIGVkaXRvci5nZXRWZXJ0aWNhbFNjcm9sbE1hcmdpbigpP1xuICBjdXJzb3JQaXhlbDogbnVsbFxuXG4gIGdldEZpcnN0VmlzaWJsZVNjcmVlblJvdzogLT5cbiAgICBAZWRpdG9yRWxlbWVudC5nZXRGaXJzdFZpc2libGVTY3JlZW5Sb3coKVxuXG4gIGdldExhc3RWaXNpYmxlU2NyZWVuUm93OiAtPlxuICAgIEBlZGl0b3JFbGVtZW50LmdldExhc3RWaXNpYmxlU2NyZWVuUm93KClcblxuICBnZXRMYXN0U2NyZWVuUm93OiAtPlxuICAgIEBlZGl0b3IuZ2V0TGFzdFNjcmVlblJvdygpXG5cbiAgZ2V0Q3Vyc29yUGl4ZWw6IC0+XG4gICAgcG9pbnQgPSBAZWRpdG9yLmdldEN1cnNvclNjcmVlblBvc2l0aW9uKClcbiAgICBAZWRpdG9yRWxlbWVudC5waXhlbFBvc2l0aW9uRm9yU2NyZWVuUG9zaXRpb24ocG9pbnQpXG5cbiMgY3RybC1lIHNjcm9sbCBsaW5lcyBkb3dud2FyZHNcbmNsYXNzIFNjcm9sbERvd24gZXh0ZW5kcyBTY3JvbGxXaXRob3V0Q2hhbmdpbmdDdXJzb3JQb3NpdGlvblxuICBAZXh0ZW5kKClcblxuICBleGVjdXRlOiAtPlxuICAgIGNvdW50ID0gQGdldENvdW50KClcbiAgICBvbGRGaXJzdFJvdyA9IEBlZGl0b3IuZ2V0Rmlyc3RWaXNpYmxlU2NyZWVuUm93KClcbiAgICBAZWRpdG9yLnNldEZpcnN0VmlzaWJsZVNjcmVlblJvdyhvbGRGaXJzdFJvdyArIGNvdW50KVxuICAgIG5ld0ZpcnN0Um93ID0gQGVkaXRvci5nZXRGaXJzdFZpc2libGVTY3JlZW5Sb3coKVxuXG4gICAgb2Zmc2V0ID0gMlxuICAgIHtyb3csIGNvbHVtbn0gPSBAZWRpdG9yLmdldEN1cnNvclNjcmVlblBvc2l0aW9uKClcbiAgICBpZiByb3cgPCAobmV3Rmlyc3RSb3cgKyBvZmZzZXQpXG4gICAgICBuZXdQb2ludCA9IFtyb3cgKyBjb3VudCwgY29sdW1uXVxuICAgICAgQGVkaXRvci5zZXRDdXJzb3JTY3JlZW5Qb3NpdGlvbihuZXdQb2ludCwgYXV0b3Njcm9sbDogZmFsc2UpXG5cbiMgY3RybC15IHNjcm9sbCBsaW5lcyB1cHdhcmRzXG5jbGFzcyBTY3JvbGxVcCBleHRlbmRzIFNjcm9sbFdpdGhvdXRDaGFuZ2luZ0N1cnNvclBvc2l0aW9uXG4gIEBleHRlbmQoKVxuXG4gIGV4ZWN1dGU6IC0+XG4gICAgY291bnQgPSBAZ2V0Q291bnQoKVxuICAgIG9sZEZpcnN0Um93ID0gQGVkaXRvci5nZXRGaXJzdFZpc2libGVTY3JlZW5Sb3coKVxuICAgIEBlZGl0b3Iuc2V0Rmlyc3RWaXNpYmxlU2NyZWVuUm93KG9sZEZpcnN0Um93IC0gY291bnQpXG4gICAgbmV3TGFzdFJvdyA9IEBlZGl0b3IuZ2V0TGFzdFZpc2libGVTY3JlZW5Sb3coKVxuXG4gICAgb2Zmc2V0ID0gMlxuICAgIHtyb3csIGNvbHVtbn0gPSBAZWRpdG9yLmdldEN1cnNvclNjcmVlblBvc2l0aW9uKClcbiAgICBpZiByb3cgPj0gKG5ld0xhc3RSb3cgLSBvZmZzZXQpXG4gICAgICBuZXdQb2ludCA9IFtyb3cgLSBjb3VudCwgY29sdW1uXVxuICAgICAgQGVkaXRvci5zZXRDdXJzb3JTY3JlZW5Qb3NpdGlvbihuZXdQb2ludCwgYXV0b3Njcm9sbDogZmFsc2UpXG5cbiMgU2Nyb2xsV2l0aG91dENoYW5naW5nQ3Vyc29yUG9zaXRpb24gd2l0aG91dCBDdXJzb3IgUG9zaXRpb24gY2hhbmdlLlxuIyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5jbGFzcyBTY3JvbGxDdXJzb3IgZXh0ZW5kcyBTY3JvbGxXaXRob3V0Q2hhbmdpbmdDdXJzb3JQb3NpdGlvblxuICBAZXh0ZW5kKGZhbHNlKVxuICBleGVjdXRlOiAtPlxuICAgIEBtb3ZlVG9GaXJzdENoYXJhY3Rlck9mTGluZT8oKVxuICAgIGlmIEBpc1Njcm9sbGFibGUoKVxuICAgICAgQGVkaXRvckVsZW1lbnQuc2V0U2Nyb2xsVG9wIEBnZXRTY3JvbGxUb3AoKVxuXG4gIG1vdmVUb0ZpcnN0Q2hhcmFjdGVyT2ZMaW5lOiAtPlxuICAgIEBlZGl0b3IubW92ZVRvRmlyc3RDaGFyYWN0ZXJPZkxpbmUoKVxuXG4gIGdldE9mZlNldFBpeGVsSGVpZ2h0OiAobGluZURlbHRhPTApIC0+XG4gICAgQGVkaXRvci5nZXRMaW5lSGVpZ2h0SW5QaXhlbHMoKSAqIChAc2Nyb2xsb2ZmICsgbGluZURlbHRhKVxuXG4jIHogZW50ZXJcbmNsYXNzIFNjcm9sbEN1cnNvclRvVG9wIGV4dGVuZHMgU2Nyb2xsQ3Vyc29yXG4gIEBleHRlbmQoKVxuICBpc1Njcm9sbGFibGU6IC0+XG4gICAgQGdldExhc3RWaXNpYmxlU2NyZWVuUm93KCkgaXNudCBAZ2V0TGFzdFNjcmVlblJvdygpXG5cbiAgZ2V0U2Nyb2xsVG9wOiAtPlxuICAgIEBnZXRDdXJzb3JQaXhlbCgpLnRvcCAtIEBnZXRPZmZTZXRQaXhlbEhlaWdodCgpXG5cbiMgenRcbmNsYXNzIFNjcm9sbEN1cnNvclRvVG9wTGVhdmUgZXh0ZW5kcyBTY3JvbGxDdXJzb3JUb1RvcFxuICBAZXh0ZW5kKClcbiAgbW92ZVRvRmlyc3RDaGFyYWN0ZXJPZkxpbmU6IG51bGxcblxuIyB6LVxuY2xhc3MgU2Nyb2xsQ3Vyc29yVG9Cb3R0b20gZXh0ZW5kcyBTY3JvbGxDdXJzb3JcbiAgQGV4dGVuZCgpXG4gIGlzU2Nyb2xsYWJsZTogLT5cbiAgICBAZ2V0Rmlyc3RWaXNpYmxlU2NyZWVuUm93KCkgaXNudCAwXG5cbiAgZ2V0U2Nyb2xsVG9wOiAtPlxuICAgIEBnZXRDdXJzb3JQaXhlbCgpLnRvcCAtIChAZWRpdG9yRWxlbWVudC5nZXRIZWlnaHQoKSAtIEBnZXRPZmZTZXRQaXhlbEhlaWdodCgxKSlcblxuIyB6YlxuY2xhc3MgU2Nyb2xsQ3Vyc29yVG9Cb3R0b21MZWF2ZSBleHRlbmRzIFNjcm9sbEN1cnNvclRvQm90dG9tXG4gIEBleHRlbmQoKVxuICBtb3ZlVG9GaXJzdENoYXJhY3Rlck9mTGluZTogbnVsbFxuXG4jIHouXG5jbGFzcyBTY3JvbGxDdXJzb3JUb01pZGRsZSBleHRlbmRzIFNjcm9sbEN1cnNvclxuICBAZXh0ZW5kKClcbiAgaXNTY3JvbGxhYmxlOiAtPlxuICAgIHRydWVcblxuICBnZXRTY3JvbGxUb3A6IC0+XG4gICAgQGdldEN1cnNvclBpeGVsKCkudG9wIC0gKEBlZGl0b3JFbGVtZW50LmdldEhlaWdodCgpIC8gMilcblxuIyB6elxuY2xhc3MgU2Nyb2xsQ3Vyc29yVG9NaWRkbGVMZWF2ZSBleHRlbmRzIFNjcm9sbEN1cnNvclRvTWlkZGxlXG4gIEBleHRlbmQoKVxuICBtb3ZlVG9GaXJzdENoYXJhY3Rlck9mTGluZTogbnVsbFxuXG4jIEhvcml6b250YWwgU2Nyb2xsV2l0aG91dENoYW5naW5nQ3Vyc29yUG9zaXRpb25cbiMgLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuIyB6c1xuY2xhc3MgU2Nyb2xsQ3Vyc29yVG9MZWZ0IGV4dGVuZHMgU2Nyb2xsV2l0aG91dENoYW5naW5nQ3Vyc29yUG9zaXRpb25cbiAgQGV4dGVuZCgpXG5cbiAgZXhlY3V0ZTogLT5cbiAgICBAZWRpdG9yRWxlbWVudC5zZXRTY3JvbGxMZWZ0KEBnZXRDdXJzb3JQaXhlbCgpLmxlZnQpXG5cbiMgemVcbmNsYXNzIFNjcm9sbEN1cnNvclRvUmlnaHQgZXh0ZW5kcyBTY3JvbGxDdXJzb3JUb0xlZnRcbiAgQGV4dGVuZCgpXG5cbiAgZXhlY3V0ZTogLT5cbiAgICBAZWRpdG9yRWxlbWVudC5zZXRTY3JvbGxSaWdodChAZ2V0Q3Vyc29yUGl4ZWwoKS5sZWZ0KVxuXG4jIGluc2VydC1tb2RlIHNwZWNpZmljIGNvbW1hbmRzXG4jIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbmNsYXNzIEluc2VydE1vZGUgZXh0ZW5kcyBNaXNjQ29tbWFuZFxuICBAY29tbWFuZFNjb3BlOiAnYXRvbS10ZXh0LWVkaXRvci52aW0tbW9kZS1wbHVzLmluc2VydC1tb2RlJ1xuXG5jbGFzcyBBY3RpdmF0ZU5vcm1hbE1vZGVPbmNlIGV4dGVuZHMgSW5zZXJ0TW9kZVxuICBAZXh0ZW5kKClcbiAgdGhpc0NvbW1hbmROYW1lOiBAZ2V0Q29tbWFuZE5hbWUoKVxuXG4gIGV4ZWN1dGU6IC0+XG4gICAgY3Vyc29yc1RvTW92ZVJpZ2h0ID0gQGVkaXRvci5nZXRDdXJzb3JzKCkuZmlsdGVyIChjdXJzb3IpIC0+IG5vdCBjdXJzb3IuaXNBdEJlZ2lubmluZ09mTGluZSgpXG4gICAgQHZpbVN0YXRlLmFjdGl2YXRlKCdub3JtYWwnKVxuICAgIG1vdmVDdXJzb3JSaWdodChjdXJzb3IpIGZvciBjdXJzb3IgaW4gY3Vyc29yc1RvTW92ZVJpZ2h0XG4gICAgZGlzcG9zYWJsZSA9IGF0b20uY29tbWFuZHMub25EaWREaXNwYXRjaCAoe3R5cGV9KSA9PlxuICAgICAgcmV0dXJuIGlmIHR5cGUgaXMgQHRoaXNDb21tYW5kTmFtZVxuICAgICAgZGlzcG9zYWJsZS5kaXNwb3NlKClcbiAgICAgIGRpc3Bvc2FibGUgPSBudWxsXG4gICAgICBAdmltU3RhdGUuYWN0aXZhdGUoJ2luc2VydCcpXG5cbmNsYXNzIEluc2VydFJlZ2lzdGVyIGV4dGVuZHMgSW5zZXJ0TW9kZVxuICBAZXh0ZW5kKClcbiAgcmVxdWlyZUlucHV0OiB0cnVlXG5cbiAgaW5pdGlhbGl6ZTogLT5cbiAgICBzdXBlclxuICAgIEBmb2N1c0lucHV0KClcblxuICBleGVjdXRlOiAtPlxuICAgIEBlZGl0b3IudHJhbnNhY3QgPT5cbiAgICAgIGZvciBzZWxlY3Rpb24gaW4gQGVkaXRvci5nZXRTZWxlY3Rpb25zKClcbiAgICAgICAgdGV4dCA9IEB2aW1TdGF0ZS5yZWdpc3Rlci5nZXRUZXh0KEBpbnB1dCwgc2VsZWN0aW9uKVxuICAgICAgICBzZWxlY3Rpb24uaW5zZXJ0VGV4dCh0ZXh0KVxuXG5jbGFzcyBJbnNlcnRMYXN0SW5zZXJ0ZWQgZXh0ZW5kcyBJbnNlcnRNb2RlXG4gIEBleHRlbmQoKVxuICBAZGVzY3JpcHRpb246IFwiXCJcIlxuICBJbnNlcnQgdGV4dCBpbnNlcnRlZCBpbiBsYXRlc3QgaW5zZXJ0LW1vZGUuXG4gIEVxdWl2YWxlbnQgdG8gKmlfQ1RSTC1BKiBvZiBwdXJlIFZpbVxuICBcIlwiXCJcbiAgZXhlY3V0ZTogLT5cbiAgICB0ZXh0ID0gQHZpbVN0YXRlLnJlZ2lzdGVyLmdldFRleHQoJy4nKVxuICAgIEBlZGl0b3IuaW5zZXJ0VGV4dCh0ZXh0KVxuXG5jbGFzcyBDb3B5RnJvbUxpbmVBYm92ZSBleHRlbmRzIEluc2VydE1vZGVcbiAgQGV4dGVuZCgpXG4gIEBkZXNjcmlwdGlvbjogXCJcIlwiXG4gIEluc2VydCBjaGFyYWN0ZXIgb2Ygc2FtZS1jb2x1bW4gb2YgYWJvdmUgbGluZS5cbiAgRXF1aXZhbGVudCB0byAqaV9DVFJMLVkqIG9mIHB1cmUgVmltXG4gIFwiXCJcIlxuICByb3dEZWx0YTogLTFcblxuICBleGVjdXRlOiAtPlxuICAgIHRyYW5zbGF0aW9uID0gW0Byb3dEZWx0YSwgMF1cbiAgICBAZWRpdG9yLnRyYW5zYWN0ID0+XG4gICAgICBmb3Igc2VsZWN0aW9uIGluIEBlZGl0b3IuZ2V0U2VsZWN0aW9ucygpXG4gICAgICAgIHBvaW50ID0gc2VsZWN0aW9uLmN1cnNvci5nZXRCdWZmZXJQb3NpdGlvbigpLnRyYW5zbGF0ZSh0cmFuc2xhdGlvbilcbiAgICAgICAgY29udGludWUgaWYgcG9pbnQucm93IDwgMFxuICAgICAgICByYW5nZSA9IFJhbmdlLmZyb21Qb2ludFdpdGhEZWx0YShwb2ludCwgMCwgMSlcbiAgICAgICAgaWYgdGV4dCA9IEBlZGl0b3IuZ2V0VGV4dEluQnVmZmVyUmFuZ2UocmFuZ2UpXG4gICAgICAgICAgc2VsZWN0aW9uLmluc2VydFRleHQodGV4dClcblxuY2xhc3MgQ29weUZyb21MaW5lQmVsb3cgZXh0ZW5kcyBDb3B5RnJvbUxpbmVBYm92ZVxuICBAZXh0ZW5kKClcbiAgQGRlc2NyaXB0aW9uOiBcIlwiXCJcbiAgSW5zZXJ0IGNoYXJhY3RlciBvZiBzYW1lLWNvbHVtbiBvZiBhYm92ZSBsaW5lLlxuICBFcXVpdmFsZW50IHRvICppX0NUUkwtRSogb2YgcHVyZSBWaW1cbiAgXCJcIlwiXG4gIHJvd0RlbHRhOiArMVxuXG5jbGFzcyBOZXh0VGFiIGV4dGVuZHMgTWlzY0NvbW1hbmRcbiAgQGV4dGVuZCgpXG4gIGRlZmF1bHRDb3VudDogMFxuICBleGVjdXRlOiAtPlxuICAgIGNvdW50ID0gQGdldENvdW50KClcbiAgICBwYW5lID0gYXRvbS53b3Jrc3BhY2UucGFuZUZvckl0ZW0oQGVkaXRvcilcbiAgICBpZiBjb3VudFxuICAgICAgcGFuZS5hY3RpdmF0ZUl0ZW1BdEluZGV4KGNvdW50IC0gMSlcbiAgICBlbHNlXG4gICAgICBwYW5lLmFjdGl2YXRlTmV4dEl0ZW0oKVxuXG5jbGFzcyBQcmV2aW91c1RhYiBleHRlbmRzIE1pc2NDb21tYW5kXG4gIEBleHRlbmQoKVxuICBleGVjdXRlOiAtPlxuICAgIHBhbmUgPSBhdG9tLndvcmtzcGFjZS5wYW5lRm9ySXRlbShAZWRpdG9yKVxuICAgIHBhbmUuYWN0aXZhdGVQcmV2aW91c0l0ZW0oKVxuIl19
