function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { var callNext = step.bind(null, 'next'); var callThrow = step.bind(null, 'throw'); function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { Promise.resolve(value).then(callNext, callThrow); } } callNext(); }); }; }

// eslint-disable-next-line import/no-extraneous-dependencies, import/extensions

var _atom = require('atom');

// Dependencies
// NOTE: We are not directly requiring these in order to reduce the time it
// takes to require this file as that causes delays in Atom loading this package
'use babel';var path = undefined;
var helpers = undefined;
var workerHelpers = undefined;
var isConfigAtHomeRoot = undefined;

// Configuration
var scopes = [];
var showRule = undefined;
var lintHtmlFiles = undefined;
var ignoredRulesWhenModified = undefined;
var ignoredRulesWhenFixing = undefined;
var disableWhenNoEslintConfig = undefined;

// Internal variables
var idleCallbacks = new Set();

// Internal functions
var idsToIgnoredRules = function idsToIgnoredRules(ruleIds) {
  return ruleIds.reduce(function (ids, id) {
    ids[id] = 0; // 0 is the severity to turn off a rule
    return ids;
  }, {});
};

// Worker still hasn't initialized, since the queued idle callbacks are
// done in order, waiting on a newly queued idle callback will ensure that
// the worker has been initialized
var waitOnIdle = _asyncToGenerator(function* () {
  return new Promise(function (resolve) {
    var callbackID = window.requestIdleCallback(function () {
      idleCallbacks['delete'](callbackID);
      resolve();
    });
    idleCallbacks.add(callbackID);
  });
});

module.exports = {
  activate: function activate() {
    var _this = this;

    var callbackID = undefined;
    var installLinterEslintDeps = function installLinterEslintDeps() {
      idleCallbacks['delete'](callbackID);
      if (!atom.inSpecMode()) {
        require('atom-package-deps').install('linter-eslint');
      }
    };
    callbackID = window.requestIdleCallback(installLinterEslintDeps);
    idleCallbacks.add(callbackID);

    this.subscriptions = new _atom.CompositeDisposable();
    this.worker = null;

    var embeddedScope = 'source.js.embedded.html';
    this.subscriptions.add(atom.config.observe('linter-eslint.lintHtmlFiles', function (value) {
      lintHtmlFiles = value;
      if (lintHtmlFiles) {
        scopes.push(embeddedScope);
      } else if (scopes.indexOf(embeddedScope) !== -1) {
        scopes.splice(scopes.indexOf(embeddedScope), 1);
      }
    }));

    this.subscriptions.add(atom.config.observe('linter-eslint.scopes', function (value) {
      // Remove any old scopes
      scopes.splice(0, scopes.length);
      // Add the current scopes
      Array.prototype.push.apply(scopes, value);
      // Ensure HTML linting still works if the setting is updated
      if (lintHtmlFiles && !scopes.includes(embeddedScope)) {
        scopes.push(embeddedScope);
      }
    }));

    this.subscriptions.add(atom.workspace.observeTextEditors(function (editor) {
      editor.onDidSave(_asyncToGenerator(function* () {
        var validScope = editor.getCursors().some(function (cursor) {
          return cursor.getScopeDescriptor().getScopesArray().some(function (scope) {
            return scopes.includes(scope);
          });
        });
        if (validScope && atom.config.get('linter-eslint.fixOnSave')) {
          yield _this.fixJob(true);
        }
      }));
    }));

    this.subscriptions.add(atom.commands.add('atom-text-editor', {
      'linter-eslint:debug': _asyncToGenerator(function* () {
        if (!helpers) {
          helpers = require('./helpers');
        }
        if (!_this.worker) {
          yield waitOnIdle();
        }
        var debugString = yield helpers.generateDebugString(_this.worker);
        var notificationOptions = { detail: debugString, dismissable: true };
        atom.notifications.addInfo('linter-eslint debugging information', notificationOptions);
      })
    }));

    this.subscriptions.add(atom.commands.add('atom-text-editor', {
      'linter-eslint:fix-file': _asyncToGenerator(function* () {
        yield _this.fixJob();
      })
    }));

    this.subscriptions.add(atom.config.observe('linter-eslint.showRuleIdInMessage', function (value) {
      showRule = value;
    }));

    this.subscriptions.add(atom.config.observe('linter-eslint.disableWhenNoEslintConfig', function (value) {
      disableWhenNoEslintConfig = value;
    }));

    this.subscriptions.add(atom.config.observe('linter-eslint.rulesToSilenceWhileTyping', function (ids) {
      ignoredRulesWhenModified = idsToIgnoredRules(ids);
    }));

    this.subscriptions.add(atom.config.observe('linter-eslint.rulesToDisableWhileFixing', function (ids) {
      ignoredRulesWhenFixing = idsToIgnoredRules(ids);
    }));

    var initializeESLintWorker = function initializeESLintWorker() {
      _this.worker = new _atom.Task(require.resolve('./worker.js'));
    };
    // Initialize the worker during an idle time
    window.requestIdleCallback(initializeESLintWorker);
  },

  deactivate: function deactivate() {
    if (this.worker !== null) {
      this.worker.terminate();
      this.worker = null;
    }
    idleCallbacks.forEach(function (callbackID) {
      return window.cancelIdleCallback(callbackID);
    });
    idleCallbacks.clear();
    this.subscriptions.dispose();
  },

  provideLinter: function provideLinter() {
    var _this2 = this;

    return {
      name: 'ESLint',
      grammarScopes: scopes,
      scope: 'file',
      lintsOnChange: true,
      lint: _asyncToGenerator(function* (textEditor) {
        var text = textEditor.getText();
        if (text.length === 0) {
          return [];
        }
        var filePath = textEditor.getPath();

        var rules = {};
        if (textEditor.isModified() && Object.keys(ignoredRulesWhenModified).length > 0) {
          rules = ignoredRulesWhenModified;
        }

        if (!helpers) {
          helpers = require('./helpers');
        }

        if (!_this2.worker) {
          yield waitOnIdle();
        }

        var response = yield helpers.sendJob(_this2.worker, {
          type: 'lint',
          contents: text,
          config: atom.config.get('linter-eslint'),
          rules: rules,
          filePath: filePath,
          projectPath: atom.project.relativizePath(filePath)[0] || ''
        });

        if (textEditor.getText() !== text) {
          /*
             The editor text has been modified since the lint was triggered,
             as we can't be sure that the results will map properly back to
             the new contents, simply return `null` to tell the
             `provideLinter` consumer not to update the saved results.
           */
          return null;
        }
        return helpers.processESLintMessages(response, textEditor, showRule, _this2.worker);
      })
    };
  },

  fixJob: _asyncToGenerator(function* () {
    var isSave = arguments.length <= 0 || arguments[0] === undefined ? false : arguments[0];

    var textEditor = atom.workspace.getActiveTextEditor();

    if (!textEditor || textEditor.isModified()) {
      // Abort for invalid or unsaved text editors
      var message = 'Linter-ESLint: Please save before fixing';
      atom.notifications.addError(message);
    }

    if (!path) {
      path = require('path');
    }
    if (!isConfigAtHomeRoot) {
      isConfigAtHomeRoot = require('./is-config-at-home-root');
    }
    if (!workerHelpers) {
      workerHelpers = require('./worker-helpers');
    }

    var filePath = textEditor.getPath();
    var fileDir = path.dirname(filePath);
    var projectPath = atom.project.relativizePath(filePath)[0];

    // Get the text from the editor, so we can use executeOnText
    var text = textEditor.getText();
    // Do not try to make fixes on an empty file
    if (text.length === 0) {
      return;
    }

    // Do not try to fix if linting should be disabled
    var configPath = workerHelpers.getConfigPath(fileDir);
    var noProjectConfig = configPath === null || isConfigAtHomeRoot(configPath);
    if (noProjectConfig && disableWhenNoEslintConfig) {
      return;
    }

    var rules = {};
    if (Object.keys(ignoredRulesWhenFixing).length > 0) {
      rules = ignoredRulesWhenFixing;
    }

    if (!helpers) {
      helpers = require('./helpers');
    }
    if (!this.worker) {
      yield waitOnIdle();
    }

    try {
      var response = yield helpers.sendJob(this.worker, {
        type: 'fix',
        config: atom.config.get('linter-eslint'),
        contents: text,
        rules: rules,
        filePath: filePath,
        projectPath: projectPath
      });
      if (!isSave) {
        atom.notifications.addSuccess(response);
      }
    } catch (err) {
      atom.notifications.addWarning(err.message);
    }
  })
};
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9ob21lL21hcmN1cy8uYXRvbS9wYWNrYWdlcy9saW50ZXItZXNsaW50L3NyYy9tYWluLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7b0JBRzBDLE1BQU07Ozs7O0FBSGhELFdBQVcsQ0FBQSxBQVFYLElBQUksSUFBSSxZQUFBLENBQUE7QUFDUixJQUFJLE9BQU8sWUFBQSxDQUFBO0FBQ1gsSUFBSSxhQUFhLFlBQUEsQ0FBQTtBQUNqQixJQUFJLGtCQUFrQixZQUFBLENBQUE7OztBQUd0QixJQUFNLE1BQU0sR0FBRyxFQUFFLENBQUE7QUFDakIsSUFBSSxRQUFRLFlBQUEsQ0FBQTtBQUNaLElBQUksYUFBYSxZQUFBLENBQUE7QUFDakIsSUFBSSx3QkFBd0IsWUFBQSxDQUFBO0FBQzVCLElBQUksc0JBQXNCLFlBQUEsQ0FBQTtBQUMxQixJQUFJLHlCQUF5QixZQUFBLENBQUE7OztBQUc3QixJQUFNLGFBQWEsR0FBRyxJQUFJLEdBQUcsRUFBRSxDQUFBOzs7QUFHL0IsSUFBTSxpQkFBaUIsR0FBRyxTQUFwQixpQkFBaUIsQ0FBRyxPQUFPO1NBQy9CLE9BQU8sQ0FBQyxNQUFNLENBQUMsVUFBQyxHQUFHLEVBQUUsRUFBRSxFQUFLO0FBQzFCLE9BQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxDQUFDLENBQUE7QUFDWCxXQUFPLEdBQUcsQ0FBQTtHQUNYLEVBQUUsRUFBRSxDQUFDO0NBQUEsQ0FBQTs7Ozs7QUFLUixJQUFNLFVBQVUscUJBQUc7U0FDakIsSUFBSSxPQUFPLENBQUMsVUFBQyxPQUFPLEVBQUs7QUFDdkIsUUFBTSxVQUFVLEdBQUcsTUFBTSxDQUFDLG1CQUFtQixDQUFDLFlBQU07QUFDbEQsbUJBQWEsVUFBTyxDQUFDLFVBQVUsQ0FBQyxDQUFBO0FBQ2hDLGFBQU8sRUFBRSxDQUFBO0tBQ1YsQ0FBQyxDQUFBO0FBQ0YsaUJBQWEsQ0FBQyxHQUFHLENBQUMsVUFBVSxDQUFDLENBQUE7R0FDOUIsQ0FBQztDQUFBLENBQUEsQ0FBQTs7QUFFSixN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SyxHQUFHLEVBQUUsQ0FBQTtBQUNkLFFBQUksTUFBTSxDQUFDLElBQUksQ0FBQyxzQkFBc0IsQ0FBQyxDQUFDLE1BQU0sR0FBRyxDQUFDLEVBQUU7QUFDbEQsV0FBSyxHQUFHLHNCQUFzQixDQUFBO0tBQy9COztBQUVELFFBQUksQ0FBQyxPQUFPLEVBQUU7QUFDWixhQUFPLEdBQUcsT0FBTyxDQUFDLFdBQVcsQ0FBQyxDQUFBO0tBQy9CO0FBQ0QsUUFBSSxDQUFDLElBQUksQ0FBQyxNQUFNLEVBQUU7QUFDaEIsWUFBTSxVQUFVLEVBQUUsQ0FBQTtLQUNuQjs7QUFFRCxRQUFJO0FBQ0YsVUFBTSxRQUFRLEdBQUcsTUFBTSxPQUFPLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxNQUFNLEVBQUU7QUFDbEQsWUFBSSxFQUFFLEtBQUs7QUFDWCxjQUFNLEVBQUUsSUFBSSxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsZUFBZSxDQUFDO0FBQ3hDLGdCQUFRLEVBQUUsSUFBSTtBQUNkLGFBQUssRUFBTCxLQUFLO0FBQ0wsZ0JBQVEsRUFBUixRQUFRO0FBQ1IsbUJBQVcsRUFBWCxXQUFXO09BQ1osQ0FBQyxDQUFBO0FBQ0YsVUFBSSxDQUFDLE1BQU0sRUFBRTtBQUNYLFlBQUksQ0FBQyxhQUFhLENBQUMsVUFBVSxDQUFDLFFBQVEsQ0FBQyxDQUFBO09BQ3hDO0tBQ0YsQ0FBQyxPQUFPLEdBQUcsRUFBRTtBQUNaLFVBQUksQ0FBQyxhQUFhLENBQUMsVUFBVSxDQUFDLEdBQUcsQ0FBQyxPQUFPLENBQUMsQ0FBQTtLQUMzQztHQUNGLENBQUE7Q0FDRixDQUFBIiwiZmlsZSI6Ii9ob21lL21hcmN1cy8uYXRvbS9wYWNrYWdlcy9saW50ZXItZXNsaW50L3NyYy9tYWluLmpzIiwic291cmNlc0NvbnRlbnQiOlsiJ3VzZSBiYWJlbCdcblxuLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIGltcG9ydC9uby1leHRyYW5lb3VzLWRlcGVuZGVuY2llcywgaW1wb3J0L2V4dGVuc2lvbnNcbmltcG9ydCB7IENvbXBvc2l0ZURpc3Bvc2FibGUsIFRhc2sgfSBmcm9tICdhdG9tJ1xuXG4vLyBEZXBlbmRlbmNpZXNcbi8vIE5PVEU6IFdlIGFyZSBub3QgZGlyZWN0bHkgcmVxdWlyaW5nIHRoZXNlIGluIG9yZGVyIHRvIHJlZHVjZSB0aGUgdGltZSBpdFxuLy8gdGFrZXMgdG8gcmVxdWlyZSB0aGlzIGZpbGUgYXMgdGhhdCBjYXVzZXMgZGVsYXlzIGluIEF0b20gbG9hZGluZyB0aGlzIHBhY2thZ2VcbmxldCBwYXRoXG5sZXQgaGVscGVyc1xubGV0IHdvcmtlckhlbHBlcnNcbmxldCBpc0NvbmZpZ0F0SG9tZVJvb3RcblxuLy8gQ29uZmlndXJhdGlvblxuY29uc3Qgc2NvcGVzID0gW11cbmxldCBzaG93UnVsZVxubGV0IGxpbnRIdG1sRmlsZXNcbmxldCBpZ25vcmVkUnVsZXNXaGVuTW9kaWZpZWRcbmxldCBpZ25vcmVkUnVsZXNXaGVuRml4aW5nXG5sZXQgZGlzYWJsZVdoZW5Ob0VzbGludENvbmZpZ1xuXG4vLyBJbnRlcm5hbCB2YXJpYWJsZXNcbmNvbnN0IGlkbGVDYWxsYmFja3MgPSBuZXcgU2V0KClcblxuLy8gSW50ZXJuYWwgZnVuY3Rpb25zXG5jb25zdCBpZHNUb0lnbm9yZWRSdWxlcyA9IHJ1bGVJZHMgPT5cbiAgcnVsZUlkcy5yZWR1Y2UoKGlkcywgaWQpID0+IHtcbiAgICBpZHNbaWRdID0gMCAvLyAwIGlzIHRoZSBzZXZlcml0eSB0byB0dXJuIG9mZiBhIHJ1bGVcbiAgICByZXR1cm4gaWRzXG4gIH0sIHt9KVxuXG4vLyBXb3JrZXIgc3RpbGwgaGFzbid0IGluaXRpYWxpemVkLCBzaW5jZSB0aGUgcXVldWVkIGlkbGUgY2FsbGJhY2tzIGFyZVxuLy8gZG9uZSBpbiBvcmRlciwgd2FpdGluZyBvbiBhIG5ld2x5IHF1ZXVlZCBpZGxlIGNhbGxiYWNrIHdpbGwgZW5zdXJlIHRoYXRcbi8vIHRoZSB3b3JrZXIgaGFzIGJlZW4gaW5pdGlhbGl6ZWRcbmNvbnN0IHdhaXRPbklkbGUgPSBhc3luYyAoKSA9PlxuICBuZXcgUHJvbWlzZSgocmVzb2x2ZSkgPT4ge1xuICAgIGNvbnN0IGNhbGxiYWNrSUQgPSB3aW5kb3cucmVxdWVzdElkbGVDYWxsYmFjaygoKSA9PiB7XG4gICAgICBpZGxlQ2FsbGJhY2tzLmRlbGV0ZShjYWxsYmFja0lEKVxuICAgICAgcmVzb2x2ZSgpXG4gICAgfSlcbiAgICBpZGxlQ2FsbGJhY2tzLmFkZChjYWxsYmFja0lEKVxuICB9KVxuXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgYWN0aXZhdGUoKSB7XG4gICAgbGV0IGNhbGxiYWNrSURcbiAgICBjb25zdCBpbnN0YWxsTGludGVyRXNsaW50RGVwcyA9ICgpID0+IHtcbiAgICAgIGlkbGVDYWxsYmFja3MuZGVsZXRlKGNhbGxiYWNrSUQpXG4gICAgICBpZiAoIWF0b20uaW5TcGVjTW9kZSgpKSB7XG4gICAgICAgIHJlcXVpcmUoJ2F0b20tcGFja2FnZS1kZXBzJykuaW5zdGFsbCgnbGludGVyLWVzbGludCcpXG4gICAgICB9XG4gICAgfVxuICAgIGNhbGxiYWNrSUQgPSB3aW5kb3cucmVxdWVzdElkbGVDYWxsYmFjayhpbnN0YWxsTGludGVyRXNsaW50RGVwcylcbiAgICBpZGxlQ2FsbGJhY2tzLmFkZChjYWxsYmFja0lEKVxuXG4gICAgdGhpcy5zdWJzY3JpcHRpb25zID0gbmV3IENvbXBvc2l0ZURpc3Bvc2FibGUoKVxuICAgIHRoaXMud29ya2VyID0gbnVsbFxuXG4gICAgY29uc3QgZW1iZWRkZWRTY29wZSA9ICdzb3VyY2UuanMuZW1iZWRkZWQuaHRtbCdcbiAgICB0aGlzLnN1YnNjcmlwdGlvbnMuYWRkKGF0b20uY29uZmlnLm9ic2VydmUoJ2xpbnRlci1lc2xpbnQubGludEh0bWxGaWxlcycsXG4gICAgICAodmFsdWUpID0+IHtcbiAgICAgICAgbGludEh0bWxGaWxlcyA9IHZhbHVlXG4gICAgICAgIGlmIChsaW50SHRtbEZpbGVzKSB7XG4gICAgICAgICAgc2NvcGVzLnB1c2goZW1iZWRkZWRTY29wZSlcbiAgICAgICAgfSBlbHNlIGlmIChzY29wZXMuaW5kZXhPZihlbWJlZGRlZFNjb3BlKSAhPT0gLTEpIHtcbiAgICAgICAgICBzY29wZXMuc3BsaWNlKHNjb3Blcy5pbmRleE9mKGVtYmVkZGVkU2NvcGUpLCAxKVxuICAgICAgICB9XG4gICAgICB9KVxuICAgIClcblxuICAgIHRoaXMuc3Vic2NyaXB0aW9ucy5hZGQoXG4gICAgICBhdG9tLmNvbmZpZy5vYnNlcnZlKCdsaW50ZXItZXNsaW50LnNjb3BlcycsICh2YWx1ZSkgPT4ge1xuICAgICAgICAvLyBSZW1vdmUgYW55IG9sZCBzY29wZXNcbiAgICAgICAgc2NvcGVzLnNwbGljZSgwLCBzY29wZXMubGVuZ3RoKVxuICAgICAgICAvLyBBZGQgdGhlIGN1cnJlbnQgc2NvcGVzXG4gICAgICAgIEFycmF5LnByb3RvdHlwZS5wdXNoLmFwcGx5KHNjb3BlcywgdmFsdWUpXG4gICAgICAgIC8vIEVuc3VyZSBIVE1MIGxpbnRpbmcgc3RpbGwgd29ya3MgaWYgdGhlIHNldHRpbmcgaXMgdXBkYXRlZFxuICAgICAgICBpZiAobGludEh0bWxGaWxlcyAmJiAhc2NvcGVzLmluY2x1ZGVzKGVtYmVkZGVkU2NvcGUpKSB7XG4gICAgICAgICAgc2NvcGVzLnB1c2goZW1iZWRkZWRTY29wZSlcbiAgICAgICAgfVxuICAgICAgfSlcbiAgICApXG5cbiAgICB0aGlzLnN1YnNjcmlwdGlvbnMuYWRkKGF0b20ud29ya3NwYWNlLm9ic2VydmVUZXh0RWRpdG9ycygoZWRpdG9yKSA9PiB7XG4gICAgICBlZGl0b3Iub25EaWRTYXZlKGFzeW5jICgpID0+IHtcbiAgICAgICAgY29uc3QgdmFsaWRTY29wZSA9IGVkaXRvci5nZXRDdXJzb3JzKCkuc29tZShjdXJzb3IgPT5cbiAgICAgICAgICBjdXJzb3IuZ2V0U2NvcGVEZXNjcmlwdG9yKCkuZ2V0U2NvcGVzQXJyYXkoKS5zb21lKHNjb3BlID0+XG4gICAgICAgICAgICBzY29wZXMuaW5jbHVkZXMoc2NvcGUpKSlcbiAgICAgICAgaWYgKHZhbGlkU2NvcGUgJiYgYXRvbS5jb25maWcuZ2V0KCdsaW50ZXItZXNsaW50LmZpeE9uU2F2ZScpKSB7XG4gICAgICAgICAgYXdhaXQgdGhpcy5maXhKb2IodHJ1ZSlcbiAgICAgICAgfVxuICAgICAgfSlcbiAgICB9KSlcblxuICAgIHRoaXMuc3Vic2NyaXB0aW9ucy5hZGQoYXRvbS5jb21tYW5kcy5hZGQoJ2F0b20tdGV4dC1lZGl0b3InLCB7XG4gICAgICAnbGludGVyLWVzbGludDpkZWJ1Zyc6IGFzeW5jICgpID0+IHtcbiAgICAgICAgaWYgKCFoZWxwZXJzKSB7XG4gICAgICAgICAgaGVscGVycyA9IHJlcXVpcmUoJy4vaGVscGVycycpXG4gICAgICAgIH1cbiAgICAgICAgaWYgKCF0aGlzLndvcmtlcikge1xuICAgICAgICAgIGF3YWl0IHdhaXRPbklkbGUoKVxuICAgICAgICB9XG4gICAgICAgIGNvbnN0IGRlYnVnU3RyaW5nID0gYXdhaXQgaGVscGVycy5nZW5lcmF0ZURlYnVnU3RyaW5nKHRoaXMud29ya2VyKVxuICAgICAgICBjb25zdCBub3RpZmljYXRpb25PcHRpb25zID0geyBkZXRhaWw6IGRlYnVnU3RyaW5nLCBkaXNtaXNzYWJsZTogdHJ1ZSB9XG4gICAgICAgIGF0b20ubm90aWZpY2F0aW9ucy5hZGRJbmZvKCdsaW50ZXItZXNsaW50IGRlYnVnZ2luZyBpbmZvcm1hdGlvbicsIG5vdGlmaWNhdGlvbk9wdGlvbnMpXG4gICAgICB9XG4gICAgfSkpXG5cbiAgICB0aGlzLnN1YnNjcmlwdGlvbnMuYWRkKGF0b20uY29tbWFuZHMuYWRkKCdhdG9tLXRleHQtZWRpdG9yJywge1xuICAgICAgJ2xpbnRlci1lc2xpbnQ6Zml4LWZpbGUnOiBhc3luYyAoKSA9PiB7XG4gICAgICAgIGF3YWl0IHRoaXMuZml4Sm9iKClcbiAgICAgIH1cbiAgICB9KSlcblxuICAgIHRoaXMuc3Vic2NyaXB0aW9ucy5hZGQoYXRvbS5jb25maWcub2JzZXJ2ZSgnbGludGVyLWVzbGludC5zaG93UnVsZUlkSW5NZXNzYWdlJyxcbiAgICAgICh2YWx1ZSkgPT4ge1xuICAgICAgICBzaG93UnVsZSA9IHZhbHVlXG4gICAgICB9KVxuICAgIClcblxuICAgIHRoaXMuc3Vic2NyaXB0aW9ucy5hZGQoYXRvbS5jb25maWcub2JzZXJ2ZSgnbGludGVyLWVzbGludC5kaXNhYmxlV2hlbk5vRXNsaW50Q29uZmlnJyxcbiAgICAgICh2YWx1ZSkgPT4ge1xuICAgICAgICBkaXNhYmxlV2hlbk5vRXNsaW50Q29uZmlnID0gdmFsdWVcbiAgICAgIH0pXG4gICAgKVxuXG4gICAgdGhpcy5zdWJzY3JpcHRpb25zLmFkZChhdG9tLmNvbmZpZy5vYnNlcnZlKCdsaW50ZXItZXNsaW50LnJ1bGVzVG9TaWxlbmNlV2hpbGVUeXBpbmcnLCAoaWRzKSA9PiB7XG4gICAgICBpZ25vcmVkUnVsZXNXaGVuTW9kaWZpZWQgPSBpZHNUb0lnbm9yZWRSdWxlcyhpZHMpXG4gICAgfSkpXG5cbiAgICB0aGlzLnN1YnNjcmlwdGlvbnMuYWRkKGF0b20uY29uZmlnLm9ic2VydmUoJ2xpbnRlci1lc2xpbnQucnVsZXNUb0Rpc2FibGVXaGlsZUZpeGluZycsIChpZHMpID0+IHtcbiAgICAgIGlnbm9yZWRSdWxlc1doZW5GaXhpbmcgPSBpZHNUb0lnbm9yZWRSdWxlcyhpZHMpXG4gICAgfSkpXG5cbiAgICBjb25zdCBpbml0aWFsaXplRVNMaW50V29ya2VyID0gKCkgPT4ge1xuICAgICAgdGhpcy53b3JrZXIgPSBuZXcgVGFzayhyZXF1aXJlLnJlc29sdmUoJy4vd29ya2VyLmpzJykpXG4gICAgfVxuICAgIC8vIEluaXRpYWxpemUgdGhlIHdvcmtlciBkdXJpbmcgYW4gaWRsZSB0aW1lXG4gICAgd2luZG93LnJlcXVlc3RJZGxlQ2FsbGJhY2soaW5pdGlhbGl6ZUVTTGludFdvcmtlcilcbiAgfSxcblxuICBkZWFjdGl2YXRlKCkge1xuICAgIGlmICh0aGlzLndvcmtlciAhPT0gbnVsbCkge1xuICAgICAgdGhpcy53b3JrZXIudGVybWluYXRlKClcbiAgICAgIHRoaXMud29ya2VyID0gbnVsbFxuICAgIH1cbiAgICBpZGxlQ2FsbGJhY2tzLmZvckVhY2goY2FsbGJhY2tJRCA9PiB3aW5kb3cuY2FuY2VsSWRsZUNhbGxiYWNrKGNhbGxiYWNrSUQpKVxuICAgIGlkbGVDYWxsYmFja3MuY2xlYXIoKVxuICAgIHRoaXMuc3Vic2NyaXB0aW9ucy5kaXNwb3NlKClcbiAgfSxcblxuICBwcm92aWRlTGludGVyKCkge1xuICAgIHJldHVybiB7XG4gICAgICBuYW1lOiAnRVNMaW50JyxcbiAgICAgIGdyYW1tYXJTY29wZXM6IHNjb3BlcyxcbiAgICAgIHNjb3BlOiAnZmlsZScsXG4gICAgICBsaW50c09uQ2hhbmdlOiB0cnVlLFxuICAgICAgbGludDogYXN5bmMgKHRleHRFZGl0b3IpID0+IHtcbiAgICAgICAgY29uc3QgdGV4dCA9IHRleHRFZGl0b3IuZ2V0VGV4dCgpXG4gICAgICAgIGlmICh0ZXh0Lmxlbmd0aCA9PT0gMCkge1xuICAgICAgICAgIHJldHVybiBbXVxuICAgICAgICB9XG4gICAgICAgIGNvbnN0IGZpbGVQYXRoID0gdGV4dEVkaXRvci5nZXRQYXRoKClcblxuICAgICAgICBsZXQgcnVsZXMgPSB7fVxuICAgICAgICBpZiAodGV4dEVkaXRvci5pc01vZGlmaWVkKCkgJiYgT2JqZWN0LmtleXMoaWdub3JlZFJ1bGVzV2hlbk1vZGlmaWVkKS5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgcnVsZXMgPSBpZ25vcmVkUnVsZXNXaGVuTW9kaWZpZWRcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICghaGVscGVycykge1xuICAgICAgICAgIGhlbHBlcnMgPSByZXF1aXJlKCcuL2hlbHBlcnMnKVxuICAgICAgICB9XG5cbiAgICAgICAgaWYgKCF0aGlzLndvcmtlcikge1xuICAgICAgICAgIGF3YWl0IHdhaXRPbklkbGUoKVxuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgcmVzcG9uc2UgPSBhd2FpdCBoZWxwZXJzLnNlbmRKb2IodGhpcy53b3JrZXIsIHtcbiAgICAgICAgICB0eXBlOiAnbGludCcsXG4gICAgICAgICAgY29udGVudHM6IHRleHQsXG4gICAgICAgICAgY29uZmlnOiBhdG9tLmNvbmZpZy5nZXQoJ2xpbnRlci1lc2xpbnQnKSxcbiAgICAgICAgICBydWxlcyxcbiAgICAgICAgICBmaWxlUGF0aCxcbiAgICAgICAgICBwcm9qZWN0UGF0aDogYXRvbS5wcm9qZWN0LnJlbGF0aXZpemVQYXRoKGZpbGVQYXRoKVswXSB8fCAnJ1xuICAgICAgICB9KVxuXG4gICAgICAgIGlmICh0ZXh0RWRpdG9yLmdldFRleHQoKSAhPT0gdGV4dCkge1xuICAgICAgICAgIC8qXG4gICAgICAgICAgICAgVGhlIGVkaXRvciB0ZXh0IGhhcyBiZWVuIG1vZGlmaWVkIHNpbmNlIHRoZSBsaW50IHdhcyB0cmlnZ2VyZWQsXG4gICAgICAgICAgICAgYXMgd2UgY2FuJ3QgYmUgc3VyZSB0aGF0IHRoZSByZXN1bHRzIHdpbGwgbWFwIHByb3Blcmx5IGJhY2sgdG9cbiAgICAgICAgICAgICB0aGUgbmV3IGNvbnRlbnRzLCBzaW1wbHkgcmV0dXJuIGBudWxsYCB0byB0ZWxsIHRoZVxuICAgICAgICAgICAgIGBwcm92aWRlTGludGVyYCBjb25zdW1lciBub3QgdG8gdXBkYXRlIHRoZSBzYXZlZCByZXN1bHRzLlxuICAgICAgICAgICAqL1xuICAgICAgICAgIHJldHVybiBudWxsXG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGhlbHBlcnMucHJvY2Vzc0VTTGludE1lc3NhZ2VzKHJlc3BvbnNlLCB0ZXh0RWRpdG9yLCBzaG93UnVsZSwgdGhpcy53b3JrZXIpXG4gICAgICB9XG4gICAgfVxuICB9LFxuXG4gIGFzeW5jIGZpeEpvYihpc1NhdmUgPSBmYWxzZSkge1xuICAgIGNvbnN0IHRleHRFZGl0b3IgPSBhdG9tLndvcmtzcGFjZS5nZXRBY3RpdmVUZXh0RWRpdG9yKClcblxuICAgIGlmICghdGV4dEVkaXRvciB8fCB0ZXh0RWRpdG9yLmlzTW9kaWZpZWQoKSkge1xuICAgICAgLy8gQWJvcnQgZm9yIGludmFsaWQgb3IgdW5zYXZlZCB0ZXh0IGVkaXRvcnNcbiAgICAgIGNvbnN0IG1lc3NhZ2UgPSAnTGludGVyLUVTTGludDogUGxlYXNlIHNhdmUgYmVmb3JlIGZpeGluZydcbiAgICAgIGF0b20ubm90aWZpY2F0aW9ucy5hZGRFcnJvcihtZXNzYWdlKVxuICAgIH1cblxuICAgIGlmICghcGF0aCkge1xuICAgICAgcGF0aCA9IHJlcXVpcmUoJ3BhdGgnKVxuICAgIH1cbiAgICBpZiAoIWlzQ29uZmlnQXRIb21lUm9vdCkge1xuICAgICAgaXNDb25maWdBdEhvbWVSb290ID0gcmVxdWlyZSgnLi9pcy1jb25maWctYXQtaG9tZS1yb290JylcbiAgICB9XG4gICAgaWYgKCF3b3JrZXJIZWxwZXJzKSB7XG4gICAgICB3b3JrZXJIZWxwZXJzID0gcmVxdWlyZSgnLi93b3JrZXItaGVscGVycycpXG4gICAgfVxuXG4gICAgY29uc3QgZmlsZVBhdGggPSB0ZXh0RWRpdG9yLmdldFBhdGgoKVxuICAgIGNvbnN0IGZpbGVEaXIgPSBwYXRoLmRpcm5hbWUoZmlsZVBhdGgpXG4gICAgY29uc3QgcHJvamVjdFBhdGggPSBhdG9tLnByb2plY3QucmVsYXRpdml6ZVBhdGgoZmlsZVBhdGgpWzBdXG5cbiAgICAvLyBHZXQgdGhlIHRleHQgZnJvbSB0aGUgZWRpdG9yLCBzbyB3ZSBjYW4gdXNlIGV4ZWN1dGVPblRleHRcbiAgICBjb25zdCB0ZXh0ID0gdGV4dEVkaXRvci5nZXRUZXh0KClcbiAgICAvLyBEbyBub3QgdHJ5IHRvIG1ha2UgZml4ZXMgb24gYW4gZW1wdHkgZmlsZVxuICAgIGlmICh0ZXh0Lmxlbmd0aCA9PT0gMCkge1xuICAgICAgcmV0dXJuXG4gICAgfVxuXG4gICAgLy8gRG8gbm90IHRyeSB0byBmaXggaWYgbGludGluZyBzaG91bGQgYmUgZGlzYWJsZWRcbiAgICBjb25zdCBjb25maWdQYXRoID0gd29ya2VySGVscGVycy5nZXRDb25maWdQYXRoKGZpbGVEaXIpXG4gICAgY29uc3Qgbm9Qcm9qZWN0Q29uZmlnID0gKGNvbmZpZ1BhdGggPT09IG51bGwgfHwgaXNDb25maWdBdEhvbWVSb290KGNvbmZpZ1BhdGgpKVxuICAgIGlmIChub1Byb2plY3RDb25maWcgJiYgZGlzYWJsZVdoZW5Ob0VzbGludENvbmZpZykge1xuICAgICAgcmV0dXJuXG4gICAgfVxuXG4gICAgbGV0IHJ1bGVzID0ge31cbiAgICBpZiAoT2JqZWN0LmtleXMoaWdub3JlZFJ1bGVzV2hlbkZpeGluZykubGVuZ3RoID4gMCkge1xuICAgICAgcnVsZXMgPSBpZ25vcmVkUnVsZXNXaGVuRml4aW5nXG4gICAgfVxuXG4gICAgaWYgKCFoZWxwZXJzKSB7XG4gICAgICBoZWxwZXJzID0gcmVxdWlyZSgnLi9oZWxwZXJzJylcbiAgICB9XG4gICAgaWYgKCF0aGlzLndvcmtlcikge1xuICAgICAgYXdhaXQgd2FpdE9uSWRsZSgpXG4gICAgfVxuXG4gICAgdHJ5IHtcbiAgICAgIGNvbnN0IHJlc3BvbnNlID0gYXdhaXQgaGVscGVycy5zZW5kSm9iKHRoaXMud29ya2VyLCB7XG4gICAgICAgIHR5cGU6ICdmaXgnLFxuICAgICAgICBjb25maWc6IGF0b20uY29uZmlnLmdldCgnbGludGVyLWVzbGludCcpLFxuICAgICAgICBjb250ZW50czogdGV4dCxcbiAgICAgICAgcnVsZXMsXG4gICAgICAgIGZpbGVQYXRoLFxuICAgICAgICBwcm9qZWN0UGF0aFxuICAgICAgfSlcbiAgICAgIGlmICghaXNTYXZlKSB7XG4gICAgICAgIGF0b20ubm90aWZpY2F0aW9ucy5hZGRTdWNjZXNzKHJlc3BvbnNlKVxuICAgICAgfVxuICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgYXRvbS5ub3RpZmljYXRpb25zLmFkZFdhcm5pbmcoZXJyLm1lc3NhZ2UpXG4gICAgfVxuICB9LFxufVxuIl19