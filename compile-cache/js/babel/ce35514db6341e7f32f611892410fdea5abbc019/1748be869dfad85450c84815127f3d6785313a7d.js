var getNotification = _asyncToGenerator(function* (expectedMessage) {
  return new Promise(function (resolve) {
    var notificationSub = undefined;
    var newNotification = function newNotification(notification) {
      if (notification.getMessage() !== expectedMessage) {
        // As the specs execute asynchronously, it's possible a notification
        // from a different spec was grabbed, if the message doesn't match what
        // is expected simply return and keep waiting for the next message.
        return;
      }
      // Dispose of the notificaiton subscription
      notificationSub.dispose();
      resolve(notification);
    };
    // Subscribe to Atom's notifications
    notificationSub = atom.notifications.onDidAddNotification(newNotification);
  });
});

var makeFixes = _asyncToGenerator(function* (textEditor) {
  return new Promise(_asyncToGenerator(function* (resolve) {
    // Subscribe to the file reload event
    var editorReloadSub = textEditor.getBuffer().onDidReload(_asyncToGenerator(function* () {
      editorReloadSub.dispose();
      // File has been reloaded in Atom, notification checking will happen
      // async either way, but should already be finished at this point
      resolve();
    }));

    // Now that all the required subscriptions are active, send off a fix request
    atom.commands.dispatch(atom.views.getView(textEditor), 'linter-eslint:fix-file');
    var expectedMessage = 'Linter-ESLint: Fix complete.';
    var notification = yield getNotification(expectedMessage);

    expect(notification.getMessage()).toBe(expectedMessage);
    expect(notification.getType()).toBe('success');
  }));
});

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj['default'] = obj; return newObj; } }

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { var callNext = step.bind(null, 'next'); var callThrow = step.bind(null, 'throw'); function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { Promise.resolve(value).then(callNext, callThrow); } } callNext(); }); }; }

var _path = require('path');

var path = _interopRequireWildcard(_path);

var _fs = require('fs');

var fs = _interopRequireWildcard(_fs);

var _os = require('os');

var _rimraf = require('rimraf');

var _rimraf2 = _interopRequireDefault(_rimraf);

// eslint-disable-next-line no-unused-vars

var _jasmineFix = require('jasmine-fix');

var _srcMain = require('../src/main');

var _srcMain2 = _interopRequireDefault(_srcMain);

'use babel';

var fixturesDir = path.join(__dirname, 'fixtures');

var goodPath = path.join(fixturesDir, 'files', 'good.js');
var badPath = path.join(fixturesDir, 'files', 'bad.js');
var badInlinePath = path.join(fixturesDir, 'files', 'badInline.js');
var emptyPath = path.join(fixturesDir, 'files', 'empty.js');
var fixPath = path.join(fixturesDir, 'files', 'fix.js');
var cachePath = path.join(fixturesDir, 'files', '.eslintcache');
var configPath = path.join(fixturesDir, 'configs', '.eslintrc.yml');
var importingpath = path.join(fixturesDir, 'import-resolution', 'nested', 'importing.js');
var badImportPath = path.join(fixturesDir, 'import-resolution', 'nested', 'badImport.js');
var ignoredPath = path.join(fixturesDir, 'eslintignore', 'ignored.js');
var modifiedIgnorePath = path.join(fixturesDir, 'modified-ignore-rule', 'foo.js');
var modifiedIgnoreSpacePath = path.join(fixturesDir, 'modified-ignore-rule', 'foo-space.js');
var endRangePath = path.join(fixturesDir, 'end-range', 'no-unreachable.js');
var badCachePath = path.join(fixturesDir, 'badCache');

/**
 * Async helper to copy a file from one place to another on the filesystem.
 * @param  {string} fileToCopyPath  Path of the file to be copied
 * @param  {string} destinationDir  Directory to paste the file into
 * @return {string}                 Full path of the file in copy destination
 */
function copyFileToDir(fileToCopyPath, destinationDir) {
  return new Promise(function (resolve) {
    var destinationPath = path.join(destinationDir, path.basename(fileToCopyPath));
    var ws = fs.createWriteStream(destinationPath);
    ws.on('close', function () {
      return resolve(destinationPath);
    });
    fs.createReadStream(fileToCopyPath).pipe(ws);
  });
}

/**
 * Utility helper to copy a file into the OS temp directory.
 *
 * @param  {string} fileToCopyPath  Path of the file to be copied
 * @return {string}                 Full path of the file in copy destination
 */
function copyFileToTempDir(fileToCopyPath) {
  return new Promise(_asyncToGenerator(function* (resolve) {
    var tempFixtureDir = fs.mkdtempSync((0, _os.tmpdir)() + path.sep);
    resolve((yield copyFileToDir(fileToCopyPath, tempFixtureDir)));
  }));
}

describe('The eslint provider for Linter', function () {
  var linterProvider = _srcMain2['default'].provideLinter();
  var lint = linterProvider.lint;

  (0, _jasmineFix.beforeEach)(_asyncToGenerator(function* () {
    atom.config.set('linter-eslint.disableFSCache', false);
    atom.config.set('linter-eslint.disableEslintIgnore', true);

    // Activate the JavaScript language so Atom knows what the files are
    yield atom.packages.activatePackage('language-javascript');
    // Activate the provider
    yield atom.packages.activatePackage('linter-eslint');
  }));

  describe('checks bad.js and', function () {
    var editor = null;
    (0, _jasmineFix.beforeEach)(_asyncToGenerator(function* () {
      editor = yield atom.workspace.open(badPath);
    }));

    (0, _jasmineFix.it)('verifies the messages', _asyncToGenerator(function* () {
      var messages = yield lint(editor);
      expect(messages.length).toBe(2);

      var expected0 = "'foo' is not defined. (no-undef)";
      var expected0Url = 'http://eslint.org/docs/rules/no-undef';
      var expected1 = 'Extra semicolon. (semi)';
      var expected1Url = 'http://eslint.org/docs/rules/semi';

      expect(messages[0].severity).toBe('error');
      expect(messages[0].excerpt).toBe(expected0);
      expect(messages[0].url).toBe(expected0Url);
      expect(messages[0].location.file).toBe(badPath);
      expect(messages[0].location.position).toEqual([[0, 0], [0, 3]]);
      expect(messages[0].solutions).not.toBeDefined();

      expect(messages[1].severity).toBe('error');
      expect(messages[1].excerpt).toBe(expected1);
      expect(messages[1].url).toBe(expected1Url);
      expect(messages[1].location.file).toBe(badPath);
      expect(messages[1].location.position).toEqual([[0, 8], [0, 9]]);
      expect(messages[1].solutions.length).toBe(1);
      expect(messages[1].solutions[0].position).toEqual([[0, 6], [0, 9]]);
      expect(messages[1].solutions[0].replaceWith).toBe('42');
    }));
  });

  (0, _jasmineFix.it)('finds nothing wrong with an empty file', _asyncToGenerator(function* () {
    var editor = yield atom.workspace.open(emptyPath);
    var messages = yield lint(editor);

    expect(messages.length).toBe(0);
  }));

  (0, _jasmineFix.it)('finds nothing wrong with a valid file', _asyncToGenerator(function* () {
    var editor = yield atom.workspace.open(goodPath);
    var messages = yield lint(editor);

    expect(messages.length).toBe(0);
  }));

  (0, _jasmineFix.it)('reports the fixes for fixable errors', _asyncToGenerator(function* () {
    var editor = yield atom.workspace.open(fixPath);
    var messages = yield lint(editor);

    expect(messages[0].solutions[0].position).toEqual([[0, 10], [1, 8]]);
    expect(messages[0].solutions[0].replaceWith).toBe('6\nfunction');

    expect(messages[1].solutions[0].position).toEqual([[2, 0], [2, 1]]);
    expect(messages[1].solutions[0].replaceWith).toBe('  ');
  }));

  describe('when resolving import paths using eslint-plugin-import', function () {
    (0, _jasmineFix.it)('correctly resolves imports from parent', _asyncToGenerator(function* () {
      var editor = yield atom.workspace.open(importingpath);
      var messages = yield lint(editor);

      expect(messages.length).toBe(0);
    }));

    (0, _jasmineFix.it)('shows a message for an invalid import', _asyncToGenerator(function* () {
      var editor = yield atom.workspace.open(badImportPath);
      var messages = yield lint(editor);
      var expected = "Unable to resolve path to module '../nonexistent'. (import/no-unresolved)";
      var expectedUrl = 'https://github.com/benmosher/eslint-plugin-import/blob/master/docs/rules/no-unresolved.md';

      expect(messages.length).toBe(1);
      expect(messages[0].severity).toBe('error');
      expect(messages[0].excerpt).toBe(expected);
      expect(messages[0].url).toBe(expectedUrl);
      expect(messages[0].location.file).toBe(badImportPath);
      expect(messages[0].location.position).toEqual([[0, 24], [0, 39]]);
      expect(messages[0].solutions).not.toBeDefined();
    }));
  });

  describe('when a file is specified in an .eslintignore file', function () {
    (0, _jasmineFix.beforeEach)(function () {
      atom.config.set('linter-eslint.disableEslintIgnore', false);
    });

    (0, _jasmineFix.it)('will not give warnings when linting the file', _asyncToGenerator(function* () {
      var editor = yield atom.workspace.open(ignoredPath);
      var messages = yield lint(editor);

      expect(messages.length).toBe(0);
    }));

    (0, _jasmineFix.it)('will not give warnings when autofixing the file', _asyncToGenerator(function* () {
      var editor = yield atom.workspace.open(ignoredPath);
      atom.commands.dispatch(atom.views.getView(editor), 'linter-eslint:fix-file');
      var expectedMessage = 'Linter-ESLint: Fix complete.';
      var notification = yield getNotification(expectedMessage);

      expect(notification.getMessage()).toBe(expectedMessage);
    }));
  });

  describe('fixes errors', function () {
    var firstLint = _asyncToGenerator(function* (textEditor) {
      var messages = yield lint(textEditor);
      // The original file has two errors
      expect(messages.length).toBe(2);
    });

    var editor = undefined;
    var tempDir = undefined;

    (0, _jasmineFix.beforeEach)(_asyncToGenerator(function* () {
      // Copy the file to a temporary folder
      var tempFixturePath = yield copyFileToTempDir(fixPath);
      editor = yield atom.workspace.open(tempFixturePath);
      tempDir = path.dirname(tempFixturePath);
      // Copy the config to the same temporary directory
      yield copyFileToDir(configPath, tempDir);
    }));

    afterEach(function () {
      // Remove the temporary directory
      _rimraf2['default'].sync(tempDir);
    });

    (0, _jasmineFix.it)('should fix linting errors', _asyncToGenerator(function* () {
      yield firstLint(editor);
      yield makeFixes(editor);
      var messagesAfterFixing = yield lint(editor);

      expect(messagesAfterFixing.length).toBe(0);
    }));

    // NOTE: This actually works, but if both specs in this describe() are enabled
    // a bug within Atom is somewhat reliably triggered, so this needs to stay
    // disabled for now
    xit('should not fix linting errors for rules that are disabled with rulesToDisableWhileFixing', _asyncToGenerator(function* () {
      atom.config.set('linter-eslint.rulesToDisableWhileFixing', ['semi']);

      yield firstLint(editor);
      yield makeFixes(editor);
      var messagesAfterFixing = yield lint(editor);
      var expected = 'Extra semicolon. (semi)';
      var expectedUrl = 'http://eslint.org/docs/rules/semi';

      expect(messagesAfterFixing.length).toBe(1);
      expect(messagesAfterFixing[0].excerpt).toBe(expected);
      expect(messagesAfterFixing[0].url).toBe(expectedUrl);
    }));
  });

  describe('when an eslint cache file is present', function () {
    var editor = undefined;
    var tempDir = undefined;

    (0, _jasmineFix.beforeEach)(_asyncToGenerator(function* () {
      // Copy the file to a temporary folder
      var tempFixturePath = yield copyFileToTempDir(fixPath);
      editor = yield atom.workspace.open(tempFixturePath);
      tempDir = path.dirname(tempFixturePath);
      // Copy the config to the same temporary directory
      yield copyFileToDir(configPath, tempDir);
    }));

    afterEach(function () {
      // Remove the temporary directory
      _rimraf2['default'].sync(tempDir);
    });

    (0, _jasmineFix.it)('does not delete the cache file when performing fixes', _asyncToGenerator(function* () {
      var tempCacheFile = yield copyFileToDir(cachePath, tempDir);
      var checkCachefileExists = function checkCachefileExists() {
        fs.statSync(tempCacheFile);
      };
      expect(checkCachefileExists).not.toThrow();
      yield makeFixes(editor);
      expect(checkCachefileExists).not.toThrow();
    }));
  });

  describe('Ignores specified rules when editing', function () {
    var expected = 'Trailing spaces not allowed. (no-trailing-spaces)';
    var expectedUrl = 'http://eslint.org/docs/rules/no-trailing-spaces';

    (0, _jasmineFix.it)('does nothing on saved files', _asyncToGenerator(function* () {
      atom.config.set('linter-eslint.rulesToSilenceWhileTyping', ['no-trailing-spaces']);
      var editor = yield atom.workspace.open(modifiedIgnoreSpacePath);
      var messages = yield lint(editor);

      expect(messages.length).toBe(1);
      expect(messages[0].severity).toBe('error');
      expect(messages[0].excerpt).toBe(expected);
      expect(messages[0].url).toBe(expectedUrl);
      expect(messages[0].location.file).toBe(modifiedIgnoreSpacePath);
      expect(messages[0].location.position).toEqual([[0, 9], [0, 10]]);
    }));

    (0, _jasmineFix.it)('works when the file is modified', _asyncToGenerator(function* () {
      var editor = yield atom.workspace.open(modifiedIgnorePath);

      // Verify no error before
      var firstMessages = yield lint(editor);
      expect(firstMessages.length).toBe(0);

      // Insert a space into the editor
      editor.getBuffer().insert([0, 9], ' ');

      // Verify the space is showing an error
      var messages = yield lint(editor);
      expect(messages.length).toBe(1);
      expect(messages[0].severity).toBe('error');
      expect(messages[0].excerpt).toBe(expected);
      expect(messages[0].url).toBe(expectedUrl);
      expect(messages[0].location.file).toBe(modifiedIgnorePath);
      expect(messages[0].location.position).toEqual([[0, 9], [0, 10]]);

      // Enable the option under test
      atom.config.set('linter-eslint.rulesToSilenceWhileTyping', ['no-trailing-spaces']);

      // Check the lint results
      var newMessages = yield lint(editor);
      expect(newMessages.length).toBe(0);
    }));
  });

  describe('prints debugging information with the `debug` command', function () {
    var editor = undefined;
    var expectedMessage = 'linter-eslint debugging information';
    (0, _jasmineFix.beforeEach)(_asyncToGenerator(function* () {
      editor = yield atom.workspace.open(goodPath);
    }));

    (0, _jasmineFix.it)('shows an info notification', _asyncToGenerator(function* () {
      atom.commands.dispatch(atom.views.getView(editor), 'linter-eslint:debug');
      var notification = yield getNotification(expectedMessage);

      expect(notification.getMessage()).toBe(expectedMessage);
      expect(notification.getType()).toEqual('info');
    }));

    (0, _jasmineFix.it)('includes debugging information in the details', _asyncToGenerator(function* () {
      atom.commands.dispatch(atom.views.getView(editor), 'linter-eslint:debug');
      var notification = yield getNotification(expectedMessage);
      var detail = notification.getDetail();

      expect(detail.includes('Atom version: ' + atom.getVersion())).toBe(true);
      expect(detail.includes('linter-eslint version:')).toBe(true);
      expect(detail.includes('Platform: ' + process.platform)).toBe(true);
      expect(detail.includes('linter-eslint configuration:')).toBe(true);
      expect(detail.includes('Using local project ESLint')).toBe(true);
    }));
  });

  (0, _jasmineFix.it)('handles ranges in messages', _asyncToGenerator(function* () {
    var editor = yield atom.workspace.open(endRangePath);
    var messages = yield lint(editor);
    var expected = 'Unreachable code. (no-unreachable)';
    var expectedUrl = 'http://eslint.org/docs/rules/no-unreachable';

    expect(messages[0].severity).toBe('error');
    expect(messages[0].excerpt).toBe(expected);
    expect(messages[0].url).toBe(expectedUrl);
    expect(messages[0].location.file).toBe(endRangePath);
    expect(messages[0].location.position).toEqual([[5, 2], [6, 15]]);
  }));

  describe('when setting `disableWhenNoEslintConfig` is false', function () {
    var editor = undefined;
    var tempFixtureDir = undefined;

    (0, _jasmineFix.beforeEach)(_asyncToGenerator(function* () {
      atom.config.set('linter-eslint.disableWhenNoEslintConfig', false);

      var tempFilePath = yield copyFileToTempDir(badInlinePath);
      editor = yield atom.workspace.open(tempFilePath);
      tempFixtureDir = path.dirname(tempFilePath);
    }));

    afterEach(function () {
      _rimraf2['default'].sync(tempFixtureDir);
    });

    (0, _jasmineFix.it)('errors when no config file is found', _asyncToGenerator(function* () {
      var didError = undefined;
      var gotLintingErrors = undefined;

      try {
        var messages = yield lint(editor);
        // Older versions of ESLint will report an error
        // (or if current user running tests has a config in their home directory)
        var expected = "'foo' is not defined. (no-undef)";
        var expectedUrl = 'http://eslint.org/docs/rules/no-undef';
        expect(messages.length).toBe(1);
        expect(messages[0].excerpt).toBe(expected);
        expect(messages[0].url).toBe(expectedUrl);
        gotLintingErrors = true;
      } catch (err) {
        // Newer versions of ESLint will throw an exception
        expect(err.message).toBe('No ESLint configuration found.');
        didError = true;
      }

      expect(didError || gotLintingErrors).toBe(true);
    }));
  });

  describe('when `disableWhenNoEslintConfig` is true', function () {
    var editor = undefined;
    var tempFixtureDir = undefined;

    (0, _jasmineFix.beforeEach)(_asyncToGenerator(function* () {
      atom.config.set('linter-eslint.disableWhenNoEslintConfig', true);

      var tempFilePath = yield copyFileToTempDir(badInlinePath);
      editor = yield atom.workspace.open(tempFilePath);
      tempFixtureDir = path.dirname(tempFilePath);
    }));

    afterEach(function () {
      _rimraf2['default'].sync(tempFixtureDir);
    });

    (0, _jasmineFix.it)('does not report errors when no config file is found', _asyncToGenerator(function* () {
      var messages = yield lint(editor);

      expect(messages.length).toBe(0);
    }));
  });

  describe('lets ESLint handle configuration', function () {
    (0, _jasmineFix.it)('works when the cache fails', _asyncToGenerator(function* () {
      // Ensure the cache is enabled, since we will be taking advantage of
      // a failing in it's operation
      atom.config.set('linter-eslint.disableFSCache', false);
      var fooPath = path.join(badCachePath, 'temp', 'foo.js');
      var newConfigPath = path.join(badCachePath, 'temp', '.eslintrc.js');
      var editor = yield atom.workspace.open(fooPath);
      function undefMsg(varName) {
        return '\'' + varName + '\' is not defined. (no-undef)';
      }
      var expectedUrl = 'http://eslint.org/docs/rules/no-undef';

      // Trigger a first lint to warm up the cache with the first config result
      var messages = yield lint(editor);
      expect(messages.length).toBe(2);
      expect(messages[0].severity).toBe('error');
      expect(messages[0].excerpt).toBe(undefMsg('console'));
      expect(messages[0].url).toBe(expectedUrl);
      expect(messages[0].location.file).toBe(fooPath);
      expect(messages[0].location.position).toEqual([[1, 2], [1, 9]]);
      expect(messages[1].severity).toBe('error');
      expect(messages[1].excerpt).toBe(undefMsg('bar'));
      expect(messages[1].url).toBe(expectedUrl);
      expect(messages[1].location.file).toBe(fooPath);
      expect(messages[1].location.position).toEqual([[1, 14], [1, 17]]);

      // Write the new configuration file
      var newConfig = {
        env: {
          browser: true
        }
      };
      var configContents = 'module.exports = ' + JSON.stringify(newConfig, null, 2) + '\n';
      fs.writeFileSync(newConfigPath, configContents);

      // Lint again, ESLint should recognise the new configuration
      // The cached config results are still pointing at the _parent_ file. ESLint
      // would partially handle this situation if the config file was specified
      // from the cache.
      messages = yield lint(editor);
      expect(messages.length).toBe(1);
      expect(messages[0].severity).toBe('error');
      expect(messages[0].excerpt).toBe(undefMsg('bar'));
      expect(messages[0].url).toBe(expectedUrl);
      expect(messages[0].location.file).toBe(fooPath);
      expect(messages[0].location.position).toEqual([[1, 14], [1, 17]]);

      // Update the configuration
      newConfig.rules = {
        'no-undef': 'off'
      };
      configContents = 'module.exports = ' + JSON.stringify(newConfig, null, 2) + '\n';
      fs.writeFileSync(newConfigPath, configContents);

      // Lint again, if the cache was specifying the file ESLint at this point
      // would fail to update the configuration fully, and would still report a
      // no-undef error.
      messages = yield lint(editor);
      expect(messages.length).toBe(0);

      // Delete the temporary configuration file
      fs.unlinkSync(newConfigPath);
    }));
  });

  describe('works with HTML files', function () {
    var embeddedScope = 'source.js.embedded.html';
    var scopes = linterProvider.grammarScopes;

    (0, _jasmineFix.it)('adds the HTML scope when the setting is enabled', function () {
      expect(scopes.includes(embeddedScope)).toBe(false);
      atom.config.set('linter-eslint.lintHtmlFiles', true);
      expect(scopes.includes(embeddedScope)).toBe(true);
      atom.config.set('linter-eslint.lintHtmlFiles', false);
      expect(scopes.includes(embeddedScope)).toBe(false);
    });

    (0, _jasmineFix.it)('keeps the HTML scope with custom scopes', function () {
      expect(scopes.includes(embeddedScope)).toBe(false);
      atom.config.set('linter-eslint.lintHtmlFiles', true);
      expect(scopes.includes(embeddedScope)).toBe(true);
      atom.config.set('linter-eslint.scopes', ['foo.bar']);
      expect(scopes.includes(embeddedScope)).toBe(true);
    });
  });

  describe('handles the Show Rule ID in Messages option', function () {
    var expectedUrl = 'https://github.com/benmosher/eslint-plugin-import/blob/master/docs/rules/no-unresolved.md';

    (0, _jasmineFix.it)('shows the rule ID when enabled', _asyncToGenerator(function* () {
      atom.config.set('linter-eslint.showRuleIdInMessage', true);
      var editor = yield atom.workspace.open(badImportPath);
      var messages = yield lint(editor);
      var expected = "Unable to resolve path to module '../nonexistent'. (import/no-unresolved)";

      expect(messages.length).toBe(1);
      expect(messages[0].severity).toBe('error');
      expect(messages[0].excerpt).toBe(expected);
      expect(messages[0].url).toBe(expectedUrl);
      expect(messages[0].location.file).toBe(badImportPath);
      expect(messages[0].location.position).toEqual([[0, 24], [0, 39]]);
      expect(messages[0].solutions).not.toBeDefined();
    }));

    (0, _jasmineFix.it)("doesn't show the rule ID when disabled", _asyncToGenerator(function* () {
      atom.config.set('linter-eslint.showRuleIdInMessage', false);
      var editor = yield atom.workspace.open(badImportPath);
      var messages = yield lint(editor);
      var expected = "Unable to resolve path to module '../nonexistent'.";

      expect(messages.length).toBe(1);
      expect(messages[0].severity).toBe('error');
      expect(messages[0].excerpt).toBe(expected);
      expect(messages[0].url).toBe(expectedUrl);
      expect(messages[0].location.file).toBe(badImportPath);
      expect(messages[0].location.position).toEqual([[0, 24], [0, 39]]);
      expect(messages[0].solutions).not.toBeDefined();
    }));
  });
});
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9ob21lL21hcmN1cy8uYXRvbS9wYWNrYWdlcy9saW50ZXItZXNsaW50L3NwZWMvbGludGVyLWVzbGludC1zcGVjLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJJQTJEZSxlQUFlLHFCQUE5QixXQUErQixlQUFlLEVBQUU7QUFDOUMsU0FBTyxJQUFJLE9BQU8sQ0FBQyxVQUFDLE9BQU8sRUFBSztBQUM5QixRQUFJLGVBQWUsWUFBQSxDQUFBO0FBQ25CLFFBQU0sZUFBZSxHQUFHLFNBQWxCLGVBQWUsQ0FBSSxZQUFZLEVBQUs7QUFDeEMsVUFBSSxZQUFZLENBQUMsVUFBVSxFQUFFLEtBQUssZUFBZSxFQUFFOzs7O0FBSWpELGVBQU07T0FDUDs7QUFFRCxxQkFBZSxDQUFDLE9BQU8sRUFBRSxDQUFBO0FBQ3pCLGFBQU8sQ0FBQyxZQUFZLENBQUMsQ0FBQTtLQUN0QixDQUFBOztBQUVELG1CQUFlLEdBQUcsSUFBSSxDQUFDLGFBQWEsQ0FBQyxvQkFBb0IsQ0FBQyxlQUFlLENBQUMsQ0FBQTtHQUMzRSxDQUFDLENBQUE7Q0FDSDs7SUFFYyxTQUFTLHFCQUF4QixXQUF5QixVQUFVLEVBQUU7QUFDbkMsU0FBTyxJQUFJLE9BQU8sbUJBQUMsV0FBTyxPQUFPLEVBQUs7O0FBRXBDLFFBQU0sZUFBZSxHQUFHLFVBQVUsQ0FBQyxTQUFTLEVBQUUsQ0FBQyxXQUFXLG1CQUFDLGFBQVk7QUFDckUscUJBQWUsQ0FBQyxPQUFPLEVBQUUsQ0FBQTs7O0FBR3pCLGFBQU8sRUFBRSxDQUFBO0tBQ1YsRUFBQyxDQUFBOzs7QUFHRixRQUFJLENBQUMsUUFBUSxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxVQUFVLENBQUMsRUFBRSx3QkFBd0IsQ0FBQyxDQUFBO0FBQ2hGLFFBQU0sZUFBZSxHQUFHLDhCQUE4QixDQUFBO0FBQ3RELFFBQU0sWUFBWSxHQUFHLE1BQU0sZUFBZSxDQUFDLGVBQWUsQ0FBQyxDQUFBOztBQUUzRCxVQUFNLENBQUMs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QyxRQUFRLENBQUMsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRSxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUE7QUFDakUsWUFBTSxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUMsQ0FBQyxTQUFTLENBQUMsQ0FBQyxHQUFHLENBQUMsV0FBVyxFQUFFLENBQUE7S0FDaEQsRUFBQyxDQUFBO0dBQ0gsQ0FBQyxDQUFBO0NBQ0gsQ0FBQyxDQUFBIiwiZmlsZSI6Ii9ob21lL21hcmN1cy8uYXRvbS9wYWNrYWdlcy9saW50ZXItZXNsaW50L3NwZWMvbGludGVyLWVzbGludC1zcGVjLmpzIiwic291cmNlc0NvbnRlbnQiOlsiJ3VzZSBiYWJlbCdcblxuaW1wb3J0ICogYXMgcGF0aCBmcm9tICdwYXRoJ1xuaW1wb3J0ICogYXMgZnMgZnJvbSAnZnMnXG5pbXBvcnQgeyB0bXBkaXIgfSBmcm9tICdvcydcbmltcG9ydCByaW1yYWYgZnJvbSAncmltcmFmJ1xuLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIG5vLXVudXNlZC12YXJzXG5pbXBvcnQgeyBiZWZvcmVFYWNoLCBpdCwgZml0IH0gZnJvbSAnamFzbWluZS1maXgnXG5pbXBvcnQgbGludGVyRXNsaW50IGZyb20gJy4uL3NyYy9tYWluJ1xuXG5jb25zdCBmaXh0dXJlc0RpciA9IHBhdGguam9pbihfX2Rpcm5hbWUsICdmaXh0dXJlcycpXG5cbmNvbnN0IGdvb2RQYXRoID0gcGF0aC5qb2luKGZpeHR1cmVzRGlyLCAnZmlsZXMnLCAnZ29vZC5qcycpXG5jb25zdCBiYWRQYXRoID0gcGF0aC5qb2luKGZpeHR1cmVzRGlyLCAnZmlsZXMnLCAnYmFkLmpzJylcbmNvbnN0IGJhZElubGluZVBhdGggPSBwYXRoLmpvaW4oZml4dHVyZXNEaXIsICdmaWxlcycsICdiYWRJbmxpbmUuanMnKVxuY29uc3QgZW1wdHlQYXRoID0gcGF0aC5qb2luKGZpeHR1cmVzRGlyLCAnZmlsZXMnLCAnZW1wdHkuanMnKVxuY29uc3QgZml4UGF0aCA9IHBhdGguam9pbihmaXh0dXJlc0RpciwgJ2ZpbGVzJywgJ2ZpeC5qcycpXG5jb25zdCBjYWNoZVBhdGggPSBwYXRoLmpvaW4oZml4dHVyZXNEaXIsICdmaWxlcycsICcuZXNsaW50Y2FjaGUnKVxuY29uc3QgY29uZmlnUGF0aCA9IHBhdGguam9pbihmaXh0dXJlc0RpciwgJ2NvbmZpZ3MnLCAnLmVzbGludHJjLnltbCcpXG5jb25zdCBpbXBvcnRpbmdwYXRoID0gcGF0aC5qb2luKGZpeHR1cmVzRGlyLFxuICAnaW1wb3J0LXJlc29sdXRpb24nLCAnbmVzdGVkJywgJ2ltcG9ydGluZy5qcycpXG5jb25zdCBiYWRJbXBvcnRQYXRoID0gcGF0aC5qb2luKGZpeHR1cmVzRGlyLFxuICAnaW1wb3J0LXJlc29sdXRpb24nLCAnbmVzdGVkJywgJ2JhZEltcG9ydC5qcycpXG5jb25zdCBpZ25vcmVkUGF0aCA9IHBhdGguam9pbihmaXh0dXJlc0RpciwgJ2VzbGludGlnbm9yZScsICdpZ25vcmVkLmpzJylcbmNvbnN0IG1vZGlmaWVkSWdub3JlUGF0aCA9IHBhdGguam9pbihmaXh0dXJlc0RpcixcbiAgJ21vZGlmaWVkLWlnbm9yZS1ydWxlJywgJ2Zvby5qcycpXG5jb25zdCBtb2RpZmllZElnbm9yZVNwYWNlUGF0aCA9IHBhdGguam9pbihmaXh0dXJlc0RpcixcbiAgJ21vZGlmaWVkLWlnbm9yZS1ydWxlJywgJ2Zvby1zcGFjZS5qcycpXG5jb25zdCBlbmRSYW5nZVBhdGggPSBwYXRoLmpvaW4oZml4dHVyZXNEaXIsICdlbmQtcmFuZ2UnLCAnbm8tdW5yZWFjaGFibGUuanMnKVxuY29uc3QgYmFkQ2FjaGVQYXRoID0gcGF0aC5qb2luKGZpeHR1cmVzRGlyLCAnYmFkQ2FjaGUnKVxuXG4vKipcbiAqIEFzeW5jIGhlbHBlciB0byBjb3B5IGEgZmlsZSBmcm9tIG9uZSBwbGFjZSB0byBhbm90aGVyIG9uIHRoZSBmaWxlc3lzdGVtLlxuICogQHBhcmFtICB7c3RyaW5nfSBmaWxlVG9Db3B5UGF0aCAgUGF0aCBvZiB0aGUgZmlsZSB0byBiZSBjb3BpZWRcbiAqIEBwYXJhbSAge3N0cmluZ30gZGVzdGluYXRpb25EaXIgIERpcmVjdG9yeSB0byBwYXN0ZSB0aGUgZmlsZSBpbnRvXG4gKiBAcmV0dXJuIHtzdHJpbmd9ICAgICAgICAgICAgICAgICBGdWxsIHBhdGggb2YgdGhlIGZpbGUgaW4gY29weSBkZXN0aW5hdGlvblxuICovXG5mdW5jdGlvbiBjb3B5RmlsZVRvRGlyKGZpbGVUb0NvcHlQYXRoLCBkZXN0aW5hdGlvbkRpcikge1xuICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUpID0+IHtcbiAgICBjb25zdCBkZXN0aW5hdGlvblBhdGggPSBwYXRoLmpvaW4oZGVzdGluYXRpb25EaXIsIHBhdGguYmFzZW5hbWUoZmlsZVRvQ29weVBhdGgpKVxuICAgIGNvbnN0IHdzID0gZnMuY3JlYXRlV3JpdGVTdHJlYW0oZGVzdGluYXRpb25QYXRoKVxuICAgIHdzLm9uKCdjbG9zZScsICgpID0+IHJlc29sdmUoZGVzdGluYXRpb25QYXRoKSlcbiAgICBmcy5jcmVhdGVSZWFkU3RyZWFtKGZpbGVUb0NvcHlQYXRoKS5waXBlKHdzKVxuICB9KVxufVxuXG4vKipcbiAqIFV0aWxpdHkgaGVscGVyIHRvIGNvcHkgYSBmaWxlIGludG8gdGhlIE9TIHRlbXAgZGlyZWN0b3J5LlxuICpcbiAqIEBwYXJhbSAge3N0cmluZ30gZmlsZVRvQ29weVBhdGggIFBhdGggb2YgdGhlIGZpbGUgdG8gYmUgY29waWVkXG4gKiBAcmV0dXJuIHtzdHJpbmd9ICAgICAgICAgICAgICAgICBGdWxsIHBhdGggb2YgdGhlIGZpbGUgaW4gY29weSBkZXN0aW5hdGlvblxuICovXG5mdW5jdGlvbiBjb3B5RmlsZVRvVGVtcERpcihmaWxlVG9Db3B5UGF0aCkge1xuICByZXR1cm4gbmV3IFByb21pc2UoYXN5bmMgKHJlc29sdmUpID0+IHtcbiAgICBjb25zdCB0ZW1wRml4dHVyZURpciA9IGZzLm1rZHRlbXBTeW5jKHRtcGRpcigpICsgcGF0aC5zZXApXG4gICAgcmVzb2x2ZShhd2FpdCBjb3B5RmlsZVRvRGlyKGZpbGVUb0NvcHlQYXRoLCB0ZW1wRml4dHVyZURpcikpXG4gIH0pXG59XG5cbmFzeW5jIGZ1bmN0aW9uIGdldE5vdGlmaWNhdGlvbihleHBlY3RlZE1lc3NhZ2UpIHtcbiAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlKSA9PiB7XG4gICAgbGV0IG5vdGlmaWNhdGlvblN1YlxuICAgIGNvbnN0IG5ld05vdGlmaWNhdGlvbiA9IChub3RpZmljYXRpb24pID0+IHtcbiAgICAgIGlmIChub3RpZmljYXRpb24uZ2V0TWVzc2FnZSgpICE9PSBleHBlY3RlZE1lc3NhZ2UpIHtcbiAgICAgICAgLy8gQXMgdGhlIHNwZWNzIGV4ZWN1dGUgYXN5bmNocm9ub3VzbHksIGl0J3MgcG9zc2libGUgYSBub3RpZmljYXRpb25cbiAgICAgICAgLy8gZnJvbSBhIGRpZmZlcmVudCBzcGVjIHdhcyBncmFiYmVkLCBpZiB0aGUgbWVzc2FnZSBkb2Vzbid0IG1hdGNoIHdoYXRcbiAgICAgICAgLy8gaXMgZXhwZWN0ZWQgc2ltcGx5IHJldHVybiBhbmQga2VlcCB3YWl0aW5nIGZvciB0aGUgbmV4dCBtZXNzYWdlLlxuICAgICAgICByZXR1cm5cbiAgICAgIH1cbiAgICAgIC8vIERpc3Bvc2Ugb2YgdGhlIG5vdGlmaWNhaXRvbiBzdWJzY3JpcHRpb25cbiAgICAgIG5vdGlmaWNhdGlvblN1Yi5kaXNwb3NlKClcbiAgICAgIHJlc29sdmUobm90aWZpY2F0aW9uKVxuICAgIH1cbiAgICAvLyBTdWJzY3JpYmUgdG8gQXRvbSdzIG5vdGlmaWNhdGlvbnNcbiAgICBub3RpZmljYXRpb25TdWIgPSBhdG9tLm5vdGlmaWNhdGlvbnMub25EaWRBZGROb3RpZmljYXRpb24obmV3Tm90aWZpY2F0aW9uKVxuICB9KVxufVxuXG5hc3luYyBmdW5jdGlvbiBtYWtlRml4ZXModGV4dEVkaXRvcikge1xuICByZXR1cm4gbmV3IFByb21pc2UoYXN5bmMgKHJlc29sdmUpID0+IHtcbiAgICAvLyBTdWJzY3JpYmUgdG8gdGhlIGZpbGUgcmVsb2FkIGV2ZW50XG4gICAgY29uc3QgZWRpdG9yUmVsb2FkU3ViID0gdGV4dEVkaXRvci5nZXRCdWZmZXIoKS5vbkRpZFJlbG9hZChhc3luYyAoKSA9PiB7XG4gICAgICBlZGl0b3JSZWxvYWRTdWIuZGlzcG9zZSgpXG4gICAgICAvLyBGaWxlIGhhcyBiZWVuIHJlbG9hZGVkIGluIEF0b20sIG5vdGlmaWNhdGlvbiBjaGVja2luZyB3aWxsIGhhcHBlblxuICAgICAgLy8gYXN5bmMgZWl0aGVyIHdheSwgYnV0IHNob3VsZCBhbHJlYWR5IGJlIGZpbmlzaGVkIGF0IHRoaXMgcG9pbnRcbiAgICAgIHJlc29sdmUoKVxuICAgIH0pXG5cbiAgICAvLyBOb3cgdGhhdCBhbGwgdGhlIHJlcXVpcmVkIHN1YnNjcmlwdGlvbnMgYXJlIGFjdGl2ZSwgc2VuZCBvZmYgYSBmaXggcmVxdWVzdFxuICAgIGF0b20uY29tbWFuZHMuZGlzcGF0Y2goYXRvbS52aWV3cy5nZXRWaWV3KHRleHRFZGl0b3IpLCAnbGludGVyLWVzbGludDpmaXgtZmlsZScpXG4gICAgY29uc3QgZXhwZWN0ZWRNZXNzYWdlID0gJ0xpbnRlci1FU0xpbnQ6IEZpeCBjb21wbGV0ZS4nXG4gICAgY29uc3Qgbm90aWZpY2F0aW9uID0gYXdhaXQgZ2V0Tm90aWZpY2F0aW9uKGV4cGVjdGVkTWVzc2FnZSlcblxuICAgIGV4cGVjdChub3RpZmljYXRpb24uZ2V0TWVzc2FnZSgpKS50b0JlKGV4cGVjdGVkTWVzc2FnZSlcbiAgICBleHBlY3Qobm90aWZpY2F0aW9uLmdldFR5cGUoKSkudG9CZSgnc3VjY2VzcycpXG4gIH0pXG59XG5cbmRlc2NyaWJlKCdUaGUgZXNsaW50IHByb3ZpZGVyIGZvciBMaW50ZXInLCAoKSA9PiB7XG4gIGNvbnN0IGxpbnRlclByb3ZpZGVyID0gbGludGVyRXNsaW50LnByb3ZpZGVMaW50ZXIoKVxuICBjb25zdCBsaW50ID0gbGludGVyUHJvdmlkZXIubGludFxuXG4gIGJlZm9yZUVhY2goYXN5bmMgKCkgPT4ge1xuICAgIGF0b20uY29uZmlnLnNldCgnbGludGVyLWVzbGludC5kaXNhYmxlRlNDYWNoZScsIGZhbHNlKVxuICAgIGF0b20uY29uZmlnLnNldCgnbGludGVyLWVzbGludC5kaXNhYmxlRXNsaW50SWdub3JlJywgdHJ1ZSlcblxuICAgIC8vIEFjdGl2YXRlIHRoZSBKYXZhU2NyaXB0IGxhbmd1YWdlIHNvIEF0b20ga25vd3Mgd2hhdCB0aGUgZmlsZXMgYXJlXG4gICAgYXdhaXQgYXRvbS5wYWNrYWdlcy5hY3RpdmF0ZVBhY2thZ2UoJ2xhbmd1YWdlLWphdmFzY3JpcHQnKVxuICAgIC8vIEFjdGl2YXRlIHRoZSBwcm92aWRlclxuICAgIGF3YWl0IGF0b20ucGFja2FnZXMuYWN0aXZhdGVQYWNrYWdlKCdsaW50ZXItZXNsaW50JylcbiAgfSlcblxuICBkZXNjcmliZSgnY2hlY2tzIGJhZC5qcyBhbmQnLCAoKSA9PiB7XG4gICAgbGV0IGVkaXRvciA9IG51bGxcbiAgICBiZWZvcmVFYWNoKGFzeW5jICgpID0+IHtcbiAgICAgIGVkaXRvciA9IGF3YWl0IGF0b20ud29ya3NwYWNlLm9wZW4oYmFkUGF0aClcbiAgICB9KVxuXG4gICAgaXQoJ3ZlcmlmaWVzIHRoZSBtZXNzYWdlcycsIGFzeW5jICgpID0+IHtcbiAgICAgIGNvbnN0IG1lc3NhZ2VzID0gYXdhaXQgbGludChlZGl0b3IpXG4gICAgICBleHBlY3QobWVzc2FnZXMubGVuZ3RoKS50b0JlKDIpXG5cbiAgICAgIGNvbnN0IGV4cGVjdGVkMCA9IFwiJ2ZvbycgaXMgbm90IGRlZmluZWQuIChuby11bmRlZilcIlxuICAgICAgY29uc3QgZXhwZWN0ZWQwVXJsID0gJ2h0dHA6Ly9lc2xpbnQub3JnL2RvY3MvcnVsZXMvbm8tdW5kZWYnXG4gICAgICBjb25zdCBleHBlY3RlZDEgPSAnRXh0cmEgc2VtaWNvbG9uLiAoc2VtaSknXG4gICAgICBjb25zdCBleHBlY3RlZDFVcmwgPSAnaHR0cDovL2VzbGludC5vcmcvZG9jcy9ydWxlcy9zZW1pJ1xuXG4gICAgICBleHBlY3QobWVzc2FnZXNbMF0uc2V2ZXJpdHkpLnRvQmUoJ2Vycm9yJylcbiAgICAgIGV4cGVjdChtZXNzYWdlc1swXS5leGNlcnB0KS50b0JlKGV4cGVjdGVkMClcbiAgICAgIGV4cGVjdChtZXNzYWdlc1swXS51cmwpLnRvQmUoZXhwZWN0ZWQwVXJsKVxuICAgICAgZXhwZWN0KG1lc3NhZ2VzWzBdLmxvY2F0aW9uLmZpbGUpLnRvQmUoYmFkUGF0aClcbiAgICAgIGV4cGVjdChtZXNzYWdlc1swXS5sb2NhdGlvbi5wb3NpdGlvbikudG9FcXVhbChbWzAsIDBdLCBbMCwgM11dKVxuICAgICAgZXhwZWN0KG1lc3NhZ2VzWzBdLnNvbHV0aW9ucykubm90LnRvQmVEZWZpbmVkKClcblxuICAgICAgZXhwZWN0KG1lc3NhZ2VzWzFdLnNldmVyaXR5KS50b0JlKCdlcnJvcicpXG4gICAgICBleHBlY3QobWVzc2FnZXNbMV0uZXhjZXJwdCkudG9CZShleHBlY3RlZDEpXG4gICAgICBleHBlY3QobWVzc2FnZXNbMV0udXJsKS50b0JlKGV4cGVjdGVkMVVybClcbiAgICAgIGV4cGVjdChtZXNzYWdlc1sxXS5sb2NhdGlvbi5maWxlKS50b0JlKGJhZFBhdGgpXG4gICAgICBleHBlY3QobWVzc2FnZXNbMV0ubG9jYXRpb24ucG9zaXRpb24pLnRvRXF1YWwoW1swLCA4XSwgWzAsIDldXSlcbiAgICAgIGV4cGVjdChtZXNzYWdlc1sxXS5zb2x1dGlvbnMubGVuZ3RoKS50b0JlKDEpXG4gICAgICBleHBlY3QobWVzc2FnZXNbMV0uc29sdXRpb25zWzBdLnBvc2l0aW9uKS50b0VxdWFsKFtbMCwgNl0sIFswLCA5XV0pXG4gICAgICBleHBlY3QobWVzc2FnZXNbMV0uc29sdXRpb25zWzBdLnJlcGxhY2VXaXRoKS50b0JlKCc0MicpXG4gICAgfSlcbiAgfSlcblxuICBpdCgnZmluZHMgbm90aGluZyB3cm9uZyB3aXRoIGFuIGVtcHR5IGZpbGUnLCBhc3luYyAoKSA9PiB7XG4gICAgY29uc3QgZWRpdG9yID0gYXdhaXQgYXRvbS53b3Jrc3BhY2Uub3BlbihlbXB0eVBhdGgpXG4gICAgY29uc3QgbWVzc2FnZXMgPSBhd2FpdCBsaW50KGVkaXRvcilcblxuICAgIGV4cGVjdChtZXNzYWdlcy5sZW5ndGgpLnRvQmUoMClcbiAgfSlcblxuICBpdCgnZmluZHMgbm90aGluZyB3cm9uZyB3aXRoIGEgdmFsaWQgZmlsZScsIGFzeW5jICgpID0+IHtcbiAgICBjb25zdCBlZGl0b3IgPSBhd2FpdCBhdG9tLndvcmtzcGFjZS5vcGVuKGdvb2RQYXRoKVxuICAgIGNvbnN0IG1lc3NhZ2VzID0gYXdhaXQgbGludChlZGl0b3IpXG5cbiAgICBleHBlY3QobWVzc2FnZXMubGVuZ3RoKS50b0JlKDApXG4gIH0pXG5cbiAgaXQoJ3JlcG9ydHMgdGhlIGZpeGVzIGZvciBmaXhhYmxlIGVycm9ycycsIGFzeW5jICgpID0+IHtcbiAgICBjb25zdCBlZGl0b3IgPSBhd2FpdCBhdG9tLndvcmtzcGFjZS5vcGVuKGZpeFBhdGgpXG4gICAgY29uc3QgbWVzc2FnZXMgPSBhd2FpdCBsaW50KGVkaXRvcilcblxuICAgIGV4cGVjdChtZXNzYWdlc1swXS5zb2x1dGlvbnNbMF0ucG9zaXRpb24pLnRvRXF1YWwoW1swLCAxMF0sIFsxLCA4XV0pXG4gICAgZXhwZWN0KG1lc3NhZ2VzWzBdLnNvbHV0aW9uc1swXS5yZXBsYWNlV2l0aCkudG9CZSgnNlxcbmZ1bmN0aW9uJylcblxuICAgIGV4cGVjdChtZXNzYWdlc1sxXS5zb2x1dGlvbnNbMF0ucG9zaXRpb24pLnRvRXF1YWwoW1syLCAwXSwgWzIsIDFdXSlcbiAgICBleHBlY3QobWVzc2FnZXNbMV0uc29sdXRpb25zWzBdLnJlcGxhY2VXaXRoKS50b0JlKCcgICcpXG4gIH0pXG5cbiAgZGVzY3JpYmUoJ3doZW4gcmVzb2x2aW5nIGltcG9ydCBwYXRocyB1c2luZyBlc2xpbnQtcGx1Z2luLWltcG9ydCcsICgpID0+IHtcbiAgICBpdCgnY29ycmVjdGx5IHJlc29sdmVzIGltcG9ydHMgZnJvbSBwYXJlbnQnLCBhc3luYyAoKSA9PiB7XG4gICAgICBjb25zdCBlZGl0b3IgPSBhd2FpdCBhdG9tLndvcmtzcGFjZS5vcGVuKGltcG9ydGluZ3BhdGgpXG4gICAgICBjb25zdCBtZXNzYWdlcyA9IGF3YWl0IGxpbnQoZWRpdG9yKVxuXG4gICAgICBleHBlY3QobWVzc2FnZXMubGVuZ3RoKS50b0JlKDApXG4gICAgfSlcblxuICAgIGl0KCdzaG93cyBhIG1lc3NhZ2UgZm9yIGFuIGludmFsaWQgaW1wb3J0JywgYXN5bmMgKCkgPT4ge1xuICAgICAgY29uc3QgZWRpdG9yID0gYXdhaXQgYXRvbS53b3Jrc3BhY2Uub3BlbihiYWRJbXBvcnRQYXRoKVxuICAgICAgY29uc3QgbWVzc2FnZXMgPSBhd2FpdCBsaW50KGVkaXRvcilcbiAgICAgIGNvbnN0IGV4cGVjdGVkID0gXCJVbmFibGUgdG8gcmVzb2x2ZSBwYXRoIHRvIG1vZHVsZSAnLi4vbm9uZXhpc3RlbnQnLiAoaW1wb3J0L25vLXVucmVzb2x2ZWQpXCJcbiAgICAgIGNvbnN0IGV4cGVjdGVkVXJsID0gJ2h0dHBzOi8vZ2l0aHViLmNvbS9iZW5tb3NoZXIvZXNsaW50LXBsdWdpbi1pbXBvcnQvYmxvYi9tYXN0ZXIvZG9jcy9ydWxlcy9uby11bnJlc29sdmVkLm1kJ1xuXG4gICAgICBleHBlY3QobWVzc2FnZXMubGVuZ3RoKS50b0JlKDEpXG4gICAgICBleHBlY3QobWVzc2FnZXNbMF0uc2V2ZXJpdHkpLnRvQmUoJ2Vycm9yJylcbiAgICAgIGV4cGVjdChtZXNzYWdlc1swXS5leGNlcnB0KS50b0JlKGV4cGVjdGVkKVxuICAgICAgZXhwZWN0KG1lc3NhZ2VzWzBdLnVybCkudG9CZShleHBlY3RlZFVybClcbiAgICAgIGV4cGVjdChtZXNzYWdlc1swXS5sb2NhdGlvbi5maWxlKS50b0JlKGJhZEltcG9ydFBhdGgpXG4gICAgICBleHBlY3QobWVzc2FnZXNbMF0ubG9jYXRpb24ucG9zaXRpb24pLnRvRXF1YWwoW1swLCAyNF0sIFswLCAzOV1dKVxuICAgICAgZXhwZWN0KG1lc3NhZ2VzWzBdLnNvbHV0aW9ucykubm90LnRvQmVEZWZpbmVkKClcbiAgICB9KVxuICB9KVxuXG4gIGRlc2NyaWJlKCd3aGVuIGEgZmlsZSBpcyBzcGVjaWZpZWQgaW4gYW4gLmVzbGludGlnbm9yZSBmaWxlJywgKCkgPT4ge1xuICAgIGJlZm9yZUVhY2goKCkgPT4ge1xuICAgICAgYXRvbS5jb25maWcuc2V0KCdsaW50ZXItZXNsaW50LmRpc2FibGVFc2xpbnRJZ25vcmUnLCBmYWxzZSlcbiAgICB9KVxuXG4gICAgaXQoJ3dpbGwgbm90IGdpdmUgd2FybmluZ3Mgd2hlbiBsaW50aW5nIHRoZSBmaWxlJywgYXN5bmMgKCkgPT4ge1xuICAgICAgY29uc3QgZWRpdG9yID0gYXdhaXQgYXRvbS53b3Jrc3BhY2Uub3BlbihpZ25vcmVkUGF0aClcbiAgICAgIGNvbnN0IG1lc3NhZ2VzID0gYXdhaXQgbGludChlZGl0b3IpXG5cbiAgICAgIGV4cGVjdChtZXNzYWdlcy5sZW5ndGgpLnRvQmUoMClcbiAgICB9KVxuXG4gICAgaXQoJ3dpbGwgbm90IGdpdmUgd2FybmluZ3Mgd2hlbiBhdXRvZml4aW5nIHRoZSBmaWxlJywgYXN5bmMgKCkgPT4ge1xuICAgICAgY29uc3QgZWRpdG9yID0gYXdhaXQgYXRvbS53b3Jrc3BhY2Uub3BlbihpZ25vcmVkUGF0aClcbiAgICAgIGF0b20uY29tbWFuZHMuZGlzcGF0Y2goYXRvbS52aWV3cy5nZXRWaWV3KGVkaXRvciksICdsaW50ZXItZXNsaW50OmZpeC1maWxlJylcbiAgICAgIGNvbnN0IGV4cGVjdGVkTWVzc2FnZSA9ICdMaW50ZXItRVNMaW50OiBGaXggY29tcGxldGUuJ1xuICAgICAgY29uc3Qgbm90aWZpY2F0aW9uID0gYXdhaXQgZ2V0Tm90aWZpY2F0aW9uKGV4cGVjdGVkTWVzc2FnZSlcblxuICAgICAgZXhwZWN0KG5vdGlmaWNhdGlvbi5nZXRNZXNzYWdlKCkpLnRvQmUoZXhwZWN0ZWRNZXNzYWdlKVxuICAgIH0pXG4gIH0pXG5cbiAgZGVzY3JpYmUoJ2ZpeGVzIGVycm9ycycsICgpID0+IHtcbiAgICBsZXQgZWRpdG9yXG4gICAgbGV0IHRlbXBEaXJcblxuICAgIGJlZm9yZUVhY2goYXN5bmMgKCkgPT4ge1xuICAgICAgLy8gQ29weSB0aGUgZmlsZSB0byBhIHRlbXBvcmFyeSBmb2xkZXJcbiAgICAgIGNvbnN0IHRlbXBGaXh0dXJlUGF0aCA9IGF3YWl0IGNvcHlGaWxlVG9UZW1wRGlyKGZpeFBhdGgpXG4gICAgICBlZGl0b3IgPSBhd2FpdCBhdG9tLndvcmtzcGFjZS5vcGVuKHRlbXBGaXh0dXJlUGF0aClcbiAgICAgIHRlbXBEaXIgPSBwYXRoLmRpcm5hbWUodGVtcEZpeHR1cmVQYXRoKVxuICAgICAgLy8gQ29weSB0aGUgY29uZmlnIHRvIHRoZSBzYW1lIHRlbXBvcmFyeSBkaXJlY3RvcnlcbiAgICAgIGF3YWl0IGNvcHlGaWxlVG9EaXIoY29uZmlnUGF0aCwgdGVtcERpcilcbiAgICB9KVxuXG4gICAgYWZ0ZXJFYWNoKCgpID0+IHtcbiAgICAgIC8vIFJlbW92ZSB0aGUgdGVtcG9yYXJ5IGRpcmVjdG9yeVxuICAgICAgcmltcmFmLnN5bmModGVtcERpcilcbiAgICB9KVxuXG4gICAgYXN5bmMgZnVuY3Rpb24gZmlyc3RMaW50KHRleHRFZGl0b3IpIHtcbiAgICAgIGNvbnN0IG1lc3NhZ2VzID0gYXdhaXQgbGludCh0ZXh0RWRpdG9yKVxuICAgICAgLy8gVGhlIG9yaWdpbmFsIGZpbGUgaGFzIHR3byBlcnJvcnNcbiAgICAgIGV4cGVjdChtZXNzYWdlcy5sZW5ndGgpLnRvQmUoMilcbiAgICB9XG5cbiAgICBpdCgnc2hvdWxkIGZpeCBsaW50aW5nIGVycm9ycycsIGFzeW5jICgpID0+IHtcbiAgICAgIGF3YWl0IGZpcnN0TGludChlZGl0b3IpXG4gICAgICBhd2FpdCBtYWtlRml4ZXMoZWRpdG9yKVxuICAgICAgY29uc3QgbWVzc2FnZXNBZnRlckZpeGluZyA9IGF3YWl0IGxpbnQoZWRpdG9yKVxuXG4gICAgICBleHBlY3QobWVzc2FnZXNBZnRlckZpeGluZy5sZW5ndGgpLnRvQmUoMClcbiAgICB9KVxuXG4gICAgLy8gTk9URTogVGhpcyBhY3R1YWxseSB3b3JrcywgYnV0IGlmIGJvdGggc3BlY3MgaW4gdGhpcyBkZXNjcmliZSgpIGFyZSBlbmFibGVkXG4gICAgLy8gYSBidWcgd2l0aGluIEF0b20gaXMgc29tZXdoYXQgcmVsaWFibHkgdHJpZ2dlcmVkLCBzbyB0aGlzIG5lZWRzIHRvIHN0YXlcbiAgICAvLyBkaXNhYmxlZCBmb3Igbm93XG4gICAgeGl0KCdzaG91bGQgbm90IGZpeCBsaW50aW5nIGVycm9ycyBmb3IgcnVsZXMgdGhhdCBhcmUgZGlzYWJsZWQgd2l0aCBydWxlc1RvRGlzYWJsZVdoaWxlRml4aW5nJywgYXN5bmMgKCkgPT4ge1xuICAgICAgYXRvbS5jb25maWcuc2V0KCdsaW50ZXItZXNsaW50LnJ1bGVzVG9EaXNhYmxlV2hpbGVGaXhpbmcnLCBbJ3NlbWknXSlcblxuICAgICAgYXdhaXQgZmlyc3RMaW50KGVkaXRvcilcbiAgICAgIGF3YWl0IG1ha2VGaXhlcyhlZGl0b3IpXG4gICAgICBjb25zdCBtZXNzYWdlc0FmdGVyRml4aW5nID0gYXdhaXQgbGludChlZGl0b3IpXG4gICAgICBjb25zdCBleHBlY3RlZCA9ICdFeHRyYSBzZW1pY29sb24uIChzZW1pKSdcbiAgICAgIGNvbnN0IGV4cGVjdGVkVXJsID0gJ2h0dHA6Ly9lc2xpbnQub3JnL2RvY3MvcnVsZXMvc2VtaSdcblxuICAgICAgZXhwZWN0KG1lc3NhZ2VzQWZ0ZXJGaXhpbmcubGVuZ3RoKS50b0JlKDEpXG4gICAgICBleHBlY3QobWVzc2FnZXNBZnRlckZpeGluZ1swXS5leGNlcnB0KS50b0JlKGV4cGVjdGVkKVxuICAgICAgZXhwZWN0KG1lc3NhZ2VzQWZ0ZXJGaXhpbmdbMF0udXJsKS50b0JlKGV4cGVjdGVkVXJsKVxuICAgIH0pXG4gIH0pXG5cbiAgZGVzY3JpYmUoJ3doZW4gYW4gZXNsaW50IGNhY2hlIGZpbGUgaXMgcHJlc2VudCcsICgpID0+IHtcbiAgICBsZXQgZWRpdG9yXG4gICAgbGV0IHRlbXBEaXJcblxuICAgIGJlZm9yZUVhY2goYXN5bmMgKCkgPT4ge1xuICAgICAgLy8gQ29weSB0aGUgZmlsZSB0byBhIHRlbXBvcmFyeSBmb2xkZXJcbiAgICAgIGNvbnN0IHRlbXBGaXh0dXJlUGF0aCA9IGF3YWl0IGNvcHlGaWxlVG9UZW1wRGlyKGZpeFBhdGgpXG4gICAgICBlZGl0b3IgPSBhd2FpdCBhdG9tLndvcmtzcGFjZS5vcGVuKHRlbXBGaXh0dXJlUGF0aClcbiAgICAgIHRlbXBEaXIgPSBwYXRoLmRpcm5hbWUodGVtcEZpeHR1cmVQYXRoKVxuICAgICAgLy8gQ29weSB0aGUgY29uZmlnIHRvIHRoZSBzYW1lIHRlbXBvcmFyeSBkaXJlY3RvcnlcbiAgICAgIGF3YWl0IGNvcHlGaWxlVG9EaXIoY29uZmlnUGF0aCwgdGVtcERpcilcbiAgICB9KVxuXG4gICAgYWZ0ZXJFYWNoKCgpID0+IHtcbiAgICAgIC8vIFJlbW92ZSB0aGUgdGVtcG9yYXJ5IGRpcmVjdG9yeVxuICAgICAgcmltcmFmLnN5bmModGVtcERpcilcbiAgICB9KVxuXG4gICAgaXQoJ2RvZXMgbm90IGRlbGV0ZSB0aGUgY2FjaGUgZmlsZSB3aGVuIHBlcmZvcm1pbmcgZml4ZXMnLCBhc3luYyAoKSA9PiB7XG4gICAgICBjb25zdCB0ZW1wQ2FjaGVGaWxlID0gYXdhaXQgY29weUZpbGVUb0RpcihjYWNoZVBhdGgsIHRlbXBEaXIpXG4gICAgICBjb25zdCBjaGVja0NhY2hlZmlsZUV4aXN0cyA9ICgpID0+IHtcbiAgICAgICAgZnMuc3RhdFN5bmModGVtcENhY2hlRmlsZSlcbiAgICAgIH1cbiAgICAgIGV4cGVjdChjaGVja0NhY2hlZmlsZUV4aXN0cykubm90LnRvVGhyb3coKVxuICAgICAgYXdhaXQgbWFrZUZpeGVzKGVkaXRvcilcbiAgICAgIGV4cGVjdChjaGVja0NhY2hlZmlsZUV4aXN0cykubm90LnRvVGhyb3coKVxuICAgIH0pXG4gIH0pXG5cbiAgZGVzY3JpYmUoJ0lnbm9yZXMgc3BlY2lmaWVkIHJ1bGVzIHdoZW4gZWRpdGluZycsICgpID0+IHtcbiAgICBjb25zdCBleHBlY3RlZCA9ICdUcmFpbGluZyBzcGFjZXMgbm90IGFsbG93ZWQuIChuby10cmFpbGluZy1zcGFjZXMpJ1xuICAgIGNvbnN0IGV4cGVjdGVkVXJsID0gJ2h0dHA6Ly9lc2xpbnQub3JnL2RvY3MvcnVsZXMvbm8tdHJhaWxpbmctc3BhY2VzJ1xuXG4gICAgaXQoJ2RvZXMgbm90aGluZyBvbiBzYXZlZCBmaWxlcycsIGFzeW5jICgpID0+IHtcbiAgICAgIGF0b20uY29uZmlnLnNldCgnbGludGVyLWVzbGludC5ydWxlc1RvU2lsZW5jZVdoaWxlVHlwaW5nJywgWyduby10cmFpbGluZy1zcGFjZXMnXSlcbiAgICAgIGNvbnN0IGVkaXRvciA9IGF3YWl0IGF0b20ud29ya3NwYWNlLm9wZW4obW9kaWZpZWRJZ25vcmVTcGFjZVBhdGgpXG4gICAgICBjb25zdCBtZXNzYWdlcyA9IGF3YWl0IGxpbnQoZWRpdG9yKVxuXG4gICAgICBleHBlY3QobWVzc2FnZXMubGVuZ3RoKS50b0JlKDEpXG4gICAgICBleHBlY3QobWVzc2FnZXNbMF0uc2V2ZXJpdHkpLnRvQmUoJ2Vycm9yJylcbiAgICAgIGV4cGVjdChtZXNzYWdlc1swXS5leGNlcnB0KS50b0JlKGV4cGVjdGVkKVxuICAgICAgZXhwZWN0KG1lc3NhZ2VzWzBdLnVybCkudG9CZShleHBlY3RlZFVybClcbiAgICAgIGV4cGVjdChtZXNzYWdlc1swXS5sb2NhdGlvbi5maWxlKS50b0JlKG1vZGlmaWVkSWdub3JlU3BhY2VQYXRoKVxuICAgICAgZXhwZWN0KG1lc3NhZ2VzWzBdLmxvY2F0aW9uLnBvc2l0aW9uKS50b0VxdWFsKFtbMCwgOV0sIFswLCAxMF1dKVxuICAgIH0pXG5cbiAgICBpdCgnd29ya3Mgd2hlbiB0aGUgZmlsZSBpcyBtb2RpZmllZCcsIGFzeW5jICgpID0+IHtcbiAgICAgIGNvbnN0IGVkaXRvciA9IGF3YWl0IGF0b20ud29ya3NwYWNlLm9wZW4obW9kaWZpZWRJZ25vcmVQYXRoKVxuXG4gICAgICAvLyBWZXJpZnkgbm8gZXJyb3IgYmVmb3JlXG4gICAgICBjb25zdCBmaXJzdE1lc3NhZ2VzID0gYXdhaXQgbGludChlZGl0b3IpXG4gICAgICBleHBlY3QoZmlyc3RNZXNzYWdlcy5sZW5ndGgpLnRvQmUoMClcblxuICAgICAgLy8gSW5zZXJ0IGEgc3BhY2UgaW50byB0aGUgZWRpdG9yXG4gICAgICBlZGl0b3IuZ2V0QnVmZmVyKCkuaW5zZXJ0KFswLCA5XSwgJyAnKVxuXG4gICAgICAvLyBWZXJpZnkgdGhlIHNwYWNlIGlzIHNob3dpbmcgYW4gZXJyb3JcbiAgICAgIGNvbnN0IG1lc3NhZ2VzID0gYXdhaXQgbGludChlZGl0b3IpXG4gICAgICBleHBlY3QobWVzc2FnZXMubGVuZ3RoKS50b0JlKDEpXG4gICAgICBleHBlY3QobWVzc2FnZXNbMF0uc2V2ZXJpdHkpLnRvQmUoJ2Vycm9yJylcbiAgICAgIGV4cGVjdChtZXNzYWdlc1swXS5leGNlcnB0KS50b0JlKGV4cGVjdGVkKVxuICAgICAgZXhwZWN0KG1lc3NhZ2VzWzBdLnVybCkudG9CZShleHBlY3RlZFVybClcbiAgICAgIGV4cGVjdChtZXNzYWdlc1swXS5sb2NhdGlvbi5maWxlKS50b0JlKG1vZGlmaWVkSWdub3JlUGF0aClcbiAgICAgIGV4cGVjdChtZXNzYWdlc1swXS5sb2NhdGlvbi5wb3NpdGlvbikudG9FcXVhbChbWzAsIDldLCBbMCwgMTBdXSlcblxuICAgICAgLy8gRW5hYmxlIHRoZSBvcHRpb24gdW5kZXIgdGVzdFxuICAgICAgYXRvbS5jb25maWcuc2V0KCdsaW50ZXItZXNsaW50LnJ1bGVzVG9TaWxlbmNlV2hpbGVUeXBpbmcnLCBbJ25vLXRyYWlsaW5nLXNwYWNlcyddKVxuXG4gICAgICAvLyBDaGVjayB0aGUgbGludCByZXN1bHRzXG4gICAgICBjb25zdCBuZXdNZXNzYWdlcyA9IGF3YWl0IGxpbnQoZWRpdG9yKVxuICAgICAgZXhwZWN0KG5ld01lc3NhZ2VzLmxlbmd0aCkudG9CZSgwKVxuICAgIH0pXG4gIH0pXG5cbiAgZGVzY3JpYmUoJ3ByaW50cyBkZWJ1Z2dpbmcgaW5mb3JtYXRpb24gd2l0aCB0aGUgYGRlYnVnYCBjb21tYW5kJywgKCkgPT4ge1xuICAgIGxldCBlZGl0b3JcbiAgICBjb25zdCBleHBlY3RlZE1lc3NhZ2UgPSAnbGludGVyLWVzbGludCBkZWJ1Z2dpbmcgaW5mb3JtYXRpb24nXG4gICAgYmVmb3JlRWFjaChhc3luYyAoKSA9PiB7XG4gICAgICBlZGl0b3IgPSBhd2FpdCBhdG9tLndvcmtzcGFjZS5vcGVuKGdvb2RQYXRoKVxuICAgIH0pXG5cbiAgICBpdCgnc2hvd3MgYW4gaW5mbyBub3RpZmljYXRpb24nLCBhc3luYyAoKSA9PiB7XG4gICAgICBhdG9tLmNvbW1hbmRzLmRpc3BhdGNoKGF0b20udmlld3MuZ2V0VmlldyhlZGl0b3IpLCAnbGludGVyLWVzbGludDpkZWJ1ZycpXG4gICAgICBjb25zdCBub3RpZmljYXRpb24gPSBhd2FpdCBnZXROb3RpZmljYXRpb24oZXhwZWN0ZWRNZXNzYWdlKVxuXG4gICAgICBleHBlY3Qobm90aWZpY2F0aW9uLmdldE1lc3NhZ2UoKSkudG9CZShleHBlY3RlZE1lc3NhZ2UpXG4gICAgICBleHBlY3Qobm90aWZpY2F0aW9uLmdldFR5cGUoKSkudG9FcXVhbCgnaW5mbycpXG4gICAgfSlcblxuICAgIGl0KCdpbmNsdWRlcyBkZWJ1Z2dpbmcgaW5mb3JtYXRpb24gaW4gdGhlIGRldGFpbHMnLCBhc3luYyAoKSA9PiB7XG4gICAgICBhdG9tLmNvbW1hbmRzLmRpc3BhdGNoKGF0b20udmlld3MuZ2V0VmlldyhlZGl0b3IpLCAnbGludGVyLWVzbGludDpkZWJ1ZycpXG4gICAgICBjb25zdCBub3RpZmljYXRpb24gPSBhd2FpdCBnZXROb3RpZmljYXRpb24oZXhwZWN0ZWRNZXNzYWdlKVxuICAgICAgY29uc3QgZGV0YWlsID0gbm90aWZpY2F0aW9uLmdldERldGFpbCgpXG5cbiAgICAgIGV4cGVjdChkZXRhaWwuaW5jbHVkZXMoYEF0b20gdmVyc2lvbjogJHthdG9tLmdldFZlcnNpb24oKX1gKSkudG9CZSh0cnVlKVxuICAgICAgZXhwZWN0KGRldGFpbC5pbmNsdWRlcygnbGludGVyLWVzbGludCB2ZXJzaW9uOicpKS50b0JlKHRydWUpXG4gICAgICBleHBlY3QoZGV0YWlsLmluY2x1ZGVzKGBQbGF0Zm9ybTogJHtwcm9jZXNzLnBsYXRmb3JtfWApKS50b0JlKHRydWUpXG4gICAgICBleHBlY3QoZGV0YWlsLmluY2x1ZGVzKCdsaW50ZXItZXNsaW50IGNvbmZpZ3VyYXRpb246JykpLnRvQmUodHJ1ZSlcbiAgICAgIGV4cGVjdChkZXRhaWwuaW5jbHVkZXMoJ1VzaW5nIGxvY2FsIHByb2plY3QgRVNMaW50JykpLnRvQmUodHJ1ZSlcbiAgICB9KVxuICB9KVxuXG4gIGl0KCdoYW5kbGVzIHJhbmdlcyBpbiBtZXNzYWdlcycsIGFzeW5jICgpID0+IHtcbiAgICBjb25zdCBlZGl0b3IgPSBhd2FpdCBhdG9tLndvcmtzcGFjZS5vcGVuKGVuZFJhbmdlUGF0aClcbiAgICBjb25zdCBtZXNzYWdlcyA9IGF3YWl0IGxpbnQoZWRpdG9yKVxuICAgIGNvbnN0IGV4cGVjdGVkID0gJ1VucmVhY2hhYmxlIGNvZGUuIChuby11bnJlYWNoYWJsZSknXG4gICAgY29uc3QgZXhwZWN0ZWRVcmwgPSAnaHR0cDovL2VzbGludC5vcmcvZG9jcy9ydWxlcy9uby11bnJlYWNoYWJsZSdcblxuICAgIGV4cGVjdChtZXNzYWdlc1swXS5zZXZlcml0eSkudG9CZSgnZXJyb3InKVxuICAgIGV4cGVjdChtZXNzYWdlc1swXS5leGNlcnB0KS50b0JlKGV4cGVjdGVkKVxuICAgIGV4cGVjdChtZXNzYWdlc1swXS51cmwpLnRvQmUoZXhwZWN0ZWRVcmwpXG4gICAgZXhwZWN0KG1lc3NhZ2VzWzBdLmxvY2F0aW9uLmZpbGUpLnRvQmUoZW5kUmFuZ2VQYXRoKVxuICAgIGV4cGVjdChtZXNzYWdlc1swXS5sb2NhdGlvbi5wb3NpdGlvbikudG9FcXVhbChbWzUsIDJdLCBbNiwgMTVdXSlcbiAgfSlcblxuICBkZXNjcmliZSgnd2hlbiBzZXR0aW5nIGBkaXNhYmxlV2hlbk5vRXNsaW50Q29uZmlnYCBpcyBmYWxzZScsICgpID0+IHtcbiAgICBsZXQgZWRpdG9yXG4gICAgbGV0IHRlbXBGaXh0dXJlRGlyXG5cbiAgICBiZWZvcmVFYWNoKGFzeW5jICgpID0+IHtcbiAgICAgIGF0b20uY29uZmlnLnNldCgnbGludGVyLWVzbGludC5kaXNhYmxlV2hlbk5vRXNsaW50Q29uZmlnJywgZmFsc2UpXG5cbiAgICAgIGNvbnN0IHRlbXBGaWxlUGF0aCA9IGF3YWl0IGNvcHlGaWxlVG9UZW1wRGlyKGJhZElubGluZVBhdGgpXG4gICAgICBlZGl0b3IgPSBhd2FpdCBhdG9tLndvcmtzcGFjZS5vcGVuKHRlbXBGaWxlUGF0aClcbiAgICAgIHRlbXBGaXh0dXJlRGlyID0gcGF0aC5kaXJuYW1lKHRlbXBGaWxlUGF0aClcbiAgICB9KVxuXG4gICAgYWZ0ZXJFYWNoKCgpID0+IHtcbiAgICAgIHJpbXJhZi5zeW5jKHRlbXBGaXh0dXJlRGlyKVxuICAgIH0pXG5cbiAgICBpdCgnZXJyb3JzIHdoZW4gbm8gY29uZmlnIGZpbGUgaXMgZm91bmQnLCBhc3luYyAoKSA9PiB7XG4gICAgICBsZXQgZGlkRXJyb3JcbiAgICAgIGxldCBnb3RMaW50aW5nRXJyb3JzXG5cbiAgICAgIHRyeSB7XG4gICAgICAgIGNvbnN0IG1lc3NhZ2VzID0gYXdhaXQgbGludChlZGl0b3IpXG4gICAgICAgIC8vIE9sZGVyIHZlcnNpb25zIG9mIEVTTGludCB3aWxsIHJlcG9ydCBhbiBlcnJvclxuICAgICAgICAvLyAob3IgaWYgY3VycmVudCB1c2VyIHJ1bm5pbmcgdGVzdHMgaGFzIGEgY29uZmlnIGluIHRoZWlyIGhvbWUgZGlyZWN0b3J5KVxuICAgICAgICBjb25zdCBleHBlY3RlZCA9IFwiJ2ZvbycgaXMgbm90IGRlZmluZWQuIChuby11bmRlZilcIlxuICAgICAgICBjb25zdCBleHBlY3RlZFVybCA9ICdodHRwOi8vZXNsaW50Lm9yZy9kb2NzL3J1bGVzL25vLXVuZGVmJ1xuICAgICAgICBleHBlY3QobWVzc2FnZXMubGVuZ3RoKS50b0JlKDEpXG4gICAgICAgIGV4cGVjdChtZXNzYWdlc1swXS5leGNlcnB0KS50b0JlKGV4cGVjdGVkKVxuICAgICAgICBleHBlY3QobWVzc2FnZXNbMF0udXJsKS50b0JlKGV4cGVjdGVkVXJsKVxuICAgICAgICBnb3RMaW50aW5nRXJyb3JzID0gdHJ1ZVxuICAgICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICAgIC8vIE5ld2VyIHZlcnNpb25zIG9mIEVTTGludCB3aWxsIHRocm93IGFuIGV4Y2VwdGlvblxuICAgICAgICBleHBlY3QoZXJyLm1lc3NhZ2UpLnRvQmUoJ05vIEVTTGludCBjb25maWd1cmF0aW9uIGZvdW5kLicpXG4gICAgICAgIGRpZEVycm9yID0gdHJ1ZVxuICAgICAgfVxuXG4gICAgICBleHBlY3QoZGlkRXJyb3IgfHwgZ290TGludGluZ0Vycm9ycykudG9CZSh0cnVlKVxuICAgIH0pXG4gIH0pXG5cbiAgZGVzY3JpYmUoJ3doZW4gYGRpc2FibGVXaGVuTm9Fc2xpbnRDb25maWdgIGlzIHRydWUnLCAoKSA9PiB7XG4gICAgbGV0IGVkaXRvclxuICAgIGxldCB0ZW1wRml4dHVyZURpclxuXG4gICAgYmVmb3JlRWFjaChhc3luYyAoKSA9PiB7XG4gICAgICBhdG9tLmNvbmZpZy5zZXQoJ2xpbnRlci1lc2xpbnQuZGlzYWJsZVdoZW5Ob0VzbGludENvbmZpZycsIHRydWUpXG5cbiAgICAgIGNvbnN0IHRlbXBGaWxlUGF0aCA9IGF3YWl0IGNvcHlGaWxlVG9UZW1wRGlyKGJhZElubGluZVBhdGgpXG4gICAgICBlZGl0b3IgPSBhd2FpdCBhdG9tLndvcmtzcGFjZS5vcGVuKHRlbXBGaWxlUGF0aClcbiAgICAgIHRlbXBGaXh0dXJlRGlyID0gcGF0aC5kaXJuYW1lKHRlbXBGaWxlUGF0aClcbiAgICB9KVxuXG4gICAgYWZ0ZXJFYWNoKCgpID0+IHtcbiAgICAgIHJpbXJhZi5zeW5jKHRlbXBGaXh0dXJlRGlyKVxuICAgIH0pXG5cbiAgICBpdCgnZG9lcyBub3QgcmVwb3J0IGVycm9ycyB3aGVuIG5vIGNvbmZpZyBmaWxlIGlzIGZvdW5kJywgYXN5bmMgKCkgPT4ge1xuICAgICAgY29uc3QgbWVzc2FnZXMgPSBhd2FpdCBsaW50KGVkaXRvcilcblxuICAgICAgZXhwZWN0KG1lc3NhZ2VzLmxlbmd0aCkudG9CZSgwKVxuICAgIH0pXG4gIH0pXG5cbiAgZGVzY3JpYmUoJ2xldHMgRVNMaW50IGhhbmRsZSBjb25maWd1cmF0aW9uJywgKCkgPT4ge1xuICAgIGl0KCd3b3JrcyB3aGVuIHRoZSBjYWNoZSBmYWlscycsIGFzeW5jICgpID0+IHtcbiAgICAgIC8vIEVuc3VyZSB0aGUgY2FjaGUgaXMgZW5hYmxlZCwgc2luY2Ugd2Ugd2lsbCBiZSB0YWtpbmcgYWR2YW50YWdlIG9mXG4gICAgICAvLyBhIGZhaWxpbmcgaW4gaXQncyBvcGVyYXRpb25cbiAgICAgIGF0b20uY29uZmlnLnNldCgnbGludGVyLWVzbGludC5kaXNhYmxlRlNDYWNoZScsIGZhbHNlKVxuICAgICAgY29uc3QgZm9vUGF0aCA9IHBhdGguam9pbihiYWRDYWNoZVBhdGgsICd0ZW1wJywgJ2Zvby5qcycpXG4gICAgICBjb25zdCBuZXdDb25maWdQYXRoID0gcGF0aC5qb2luKGJhZENhY2hlUGF0aCwgJ3RlbXAnLCAnLmVzbGludHJjLmpzJylcbiAgICAgIGNvbnN0IGVkaXRvciA9IGF3YWl0IGF0b20ud29ya3NwYWNlLm9wZW4oZm9vUGF0aClcbiAgICAgIGZ1bmN0aW9uIHVuZGVmTXNnKHZhck5hbWUpIHtcbiAgICAgICAgcmV0dXJuIGAnJHt2YXJOYW1lfScgaXMgbm90IGRlZmluZWQuIChuby11bmRlZilgXG4gICAgICB9XG4gICAgICBjb25zdCBleHBlY3RlZFVybCA9ICdodHRwOi8vZXNsaW50Lm9yZy9kb2NzL3J1bGVzL25vLXVuZGVmJ1xuXG4gICAgICAvLyBUcmlnZ2VyIGEgZmlyc3QgbGludCB0byB3YXJtIHVwIHRoZSBjYWNoZSB3aXRoIHRoZSBmaXJzdCBjb25maWcgcmVzdWx0XG4gICAgICBsZXQgbWVzc2FnZXMgPSBhd2FpdCBsaW50KGVkaXRvcilcbiAgICAgIGV4cGVjdChtZXNzYWdlcy5sZW5ndGgpLnRvQmUoMilcbiAgICAgIGV4cGVjdChtZXNzYWdlc1swXS5zZXZlcml0eSkudG9CZSgnZXJyb3InKVxuICAgICAgZXhwZWN0KG1lc3NhZ2VzWzBdLmV4Y2VycHQpLnRvQmUodW5kZWZNc2coJ2NvbnNvbGUnKSlcbiAgICAgIGV4cGVjdChtZXNzYWdlc1swXS51cmwpLnRvQmUoZXhwZWN0ZWRVcmwpXG4gICAgICBleHBlY3QobWVzc2FnZXNbMF0ubG9jYXRpb24uZmlsZSkudG9CZShmb29QYXRoKVxuICAgICAgZXhwZWN0KG1lc3NhZ2VzWzBdLmxvY2F0aW9uLnBvc2l0aW9uKS50b0VxdWFsKFtbMSwgMl0sIFsxLCA5XV0pXG4gICAgICBleHBlY3QobWVzc2FnZXNbMV0uc2V2ZXJpdHkpLnRvQmUoJ2Vycm9yJylcbiAgICAgIGV4cGVjdChtZXNzYWdlc1sxXS5leGNlcnB0KS50b0JlKHVuZGVmTXNnKCdiYXInKSlcbiAgICAgIGV4cGVjdChtZXNzYWdlc1sxXS51cmwpLnRvQmUoZXhwZWN0ZWRVcmwpXG4gICAgICBleHBlY3QobWVzc2FnZXNbMV0ubG9jYXRpb24uZmlsZSkudG9CZShmb29QYXRoKVxuICAgICAgZXhwZWN0KG1lc3NhZ2VzWzFdLmxvY2F0aW9uLnBvc2l0aW9uKS50b0VxdWFsKFtbMSwgMTRdLCBbMSwgMTddXSlcblxuICAgICAgLy8gV3JpdGUgdGhlIG5ldyBjb25maWd1cmF0aW9uIGZpbGVcbiAgICAgIGNvbnN0IG5ld0NvbmZpZyA9IHtcbiAgICAgICAgZW52OiB7XG4gICAgICAgICAgYnJvd3NlcjogdHJ1ZSxcbiAgICAgICAgfSxcbiAgICAgIH1cbiAgICAgIGxldCBjb25maWdDb250ZW50cyA9IGBtb2R1bGUuZXhwb3J0cyA9ICR7SlNPTi5zdHJpbmdpZnkobmV3Q29uZmlnLCBudWxsLCAyKX1cXG5gXG4gICAgICBmcy53cml0ZUZpbGVTeW5jKG5ld0NvbmZpZ1BhdGgsIGNvbmZpZ0NvbnRlbnRzKVxuXG4gICAgICAvLyBMaW50IGFnYWluLCBFU0xpbnQgc2hvdWxkIHJlY29nbmlzZSB0aGUgbmV3IGNvbmZpZ3VyYXRpb25cbiAgICAgIC8vIFRoZSBjYWNoZWQgY29uZmlnIHJlc3VsdHMgYXJlIHN0aWxsIHBvaW50aW5nIGF0IHRoZSBfcGFyZW50XyBmaWxlLiBFU0xpbnRcbiAgICAgIC8vIHdvdWxkIHBhcnRpYWxseSBoYW5kbGUgdGhpcyBzaXR1YXRpb24gaWYgdGhlIGNvbmZpZyBmaWxlIHdhcyBzcGVjaWZpZWRcbiAgICAgIC8vIGZyb20gdGhlIGNhY2hlLlxuICAgICAgbWVzc2FnZXMgPSBhd2FpdCBsaW50KGVkaXRvcilcbiAgICAgIGV4cGVjdChtZXNzYWdlcy5sZW5ndGgpLnRvQmUoMSlcbiAgICAgIGV4cGVjdChtZXNzYWdlc1swXS5zZXZlcml0eSkudG9CZSgnZXJyb3InKVxuICAgICAgZXhwZWN0KG1lc3NhZ2VzWzBdLmV4Y2VycHQpLnRvQmUodW5kZWZNc2coJ2JhcicpKVxuICAgICAgZXhwZWN0KG1lc3NhZ2VzWzBdLnVybCkudG9CZShleHBlY3RlZFVybClcbiAgICAgIGV4cGVjdChtZXNzYWdlc1swXS5sb2NhdGlvbi5maWxlKS50b0JlKGZvb1BhdGgpXG4gICAgICBleHBlY3QobWVzc2FnZXNbMF0ubG9jYXRpb24ucG9zaXRpb24pLnRvRXF1YWwoW1sxLCAxNF0sIFsxLCAxN11dKVxuXG4gICAgICAvLyBVcGRhdGUgdGhlIGNvbmZpZ3VyYXRpb25cbiAgICAgIG5ld0NvbmZpZy5ydWxlcyA9IHtcbiAgICAgICAgJ25vLXVuZGVmJzogJ29mZicsXG4gICAgICB9XG4gICAgICBjb25maWdDb250ZW50cyA9IGBtb2R1bGUuZXhwb3J0cyA9ICR7SlNPTi5zdHJpbmdpZnkobmV3Q29uZmlnLCBudWxsLCAyKX1cXG5gXG4gICAgICBmcy53cml0ZUZpbGVTeW5jKG5ld0NvbmZpZ1BhdGgsIGNvbmZpZ0NvbnRlbnRzKVxuXG4gICAgICAvLyBMaW50IGFnYWluLCBpZiB0aGUgY2FjaGUgd2FzIHNwZWNpZnlpbmcgdGhlIGZpbGUgRVNMaW50IGF0IHRoaXMgcG9pbnRcbiAgICAgIC8vIHdvdWxkIGZhaWwgdG8gdXBkYXRlIHRoZSBjb25maWd1cmF0aW9uIGZ1bGx5LCBhbmQgd291bGQgc3RpbGwgcmVwb3J0IGFcbiAgICAgIC8vIG5vLXVuZGVmIGVycm9yLlxuICAgICAgbWVzc2FnZXMgPSBhd2FpdCBsaW50KGVkaXRvcilcbiAgICAgIGV4cGVjdChtZXNzYWdlcy5sZW5ndGgpLnRvQmUoMClcblxuICAgICAgLy8gRGVsZXRlIHRoZSB0ZW1wb3JhcnkgY29uZmlndXJhdGlvbiBmaWxlXG4gICAgICBmcy51bmxpbmtTeW5jKG5ld0NvbmZpZ1BhdGgpXG4gICAgfSlcbiAgfSlcblxuICBkZXNjcmliZSgnd29ya3Mgd2l0aCBIVE1MIGZpbGVzJywgKCkgPT4ge1xuICAgIGNvbnN0IGVtYmVkZGVkU2NvcGUgPSAnc291cmNlLmpzLmVtYmVkZGVkLmh0bWwnXG4gICAgY29uc3Qgc2NvcGVzID0gbGludGVyUHJvdmlkZXIuZ3JhbW1hclNjb3Blc1xuXG4gICAgaXQoJ2FkZHMgdGhlIEhUTUwgc2NvcGUgd2hlbiB0aGUgc2V0dGluZyBpcyBlbmFibGVkJywgKCkgPT4ge1xuICAgICAgZXhwZWN0KHNjb3Blcy5pbmNsdWRlcyhlbWJlZGRlZFNjb3BlKSkudG9CZShmYWxzZSlcbiAgICAgIGF0b20uY29uZmlnLnNldCgnbGludGVyLWVzbGludC5saW50SHRtbEZpbGVzJywgdHJ1ZSlcbiAgICAgIGV4cGVjdChzY29wZXMuaW5jbHVkZXMoZW1iZWRkZWRTY29wZSkpLnRvQmUodHJ1ZSlcbiAgICAgIGF0b20uY29uZmlnLnNldCgnbGludGVyLWVzbGludC5saW50SHRtbEZpbGVzJywgZmFsc2UpXG4gICAgICBleHBlY3Qoc2NvcGVzLmluY2x1ZGVzKGVtYmVkZGVkU2NvcGUpKS50b0JlKGZhbHNlKVxuICAgIH0pXG5cbiAgICBpdCgna2VlcHMgdGhlIEhUTUwgc2NvcGUgd2l0aCBjdXN0b20gc2NvcGVzJywgKCkgPT4ge1xuICAgICAgZXhwZWN0KHNjb3Blcy5pbmNsdWRlcyhlbWJlZGRlZFNjb3BlKSkudG9CZShmYWxzZSlcbiAgICAgIGF0b20uY29uZmlnLnNldCgnbGludGVyLWVzbGludC5saW50SHRtbEZpbGVzJywgdHJ1ZSlcbiAgICAgIGV4cGVjdChzY29wZXMuaW5jbHVkZXMoZW1iZWRkZWRTY29wZSkpLnRvQmUodHJ1ZSlcbiAgICAgIGF0b20uY29uZmlnLnNldCgnbGludGVyLWVzbGludC5zY29wZXMnLCBbJ2Zvby5iYXInXSlcbiAgICAgIGV4cGVjdChzY29wZXMuaW5jbHVkZXMoZW1iZWRkZWRTY29wZSkpLnRvQmUodHJ1ZSlcbiAgICB9KVxuICB9KVxuXG4gIGRlc2NyaWJlKCdoYW5kbGVzIHRoZSBTaG93IFJ1bGUgSUQgaW4gTWVzc2FnZXMgb3B0aW9uJywgKCkgPT4ge1xuICAgIGNvbnN0IGV4cGVjdGVkVXJsID0gJ2h0dHBzOi8vZ2l0aHViLmNvbS9iZW5tb3NoZXIvZXNsaW50LXBsdWdpbi1pbXBvcnQvYmxvYi9tYXN0ZXIvZG9jcy9ydWxlcy9uby11bnJlc29sdmVkLm1kJ1xuXG4gICAgaXQoJ3Nob3dzIHRoZSBydWxlIElEIHdoZW4gZW5hYmxlZCcsIGFzeW5jICgpID0+IHtcbiAgICAgIGF0b20uY29uZmlnLnNldCgnbGludGVyLWVzbGludC5zaG93UnVsZUlkSW5NZXNzYWdlJywgdHJ1ZSlcbiAgICAgIGNvbnN0IGVkaXRvciA9IGF3YWl0IGF0b20ud29ya3NwYWNlLm9wZW4oYmFkSW1wb3J0UGF0aClcbiAgICAgIGNvbnN0IG1lc3NhZ2VzID0gYXdhaXQgbGludChlZGl0b3IpXG4gICAgICBjb25zdCBleHBlY3RlZCA9IFwiVW5hYmxlIHRvIHJlc29sdmUgcGF0aCB0byBtb2R1bGUgJy4uL25vbmV4aXN0ZW50Jy4gKGltcG9ydC9uby11bnJlc29sdmVkKVwiXG5cbiAgICAgIGV4cGVjdChtZXNzYWdlcy5sZW5ndGgpLnRvQmUoMSlcbiAgICAgIGV4cGVjdChtZXNzYWdlc1swXS5zZXZlcml0eSkudG9CZSgnZXJyb3InKVxuICAgICAgZXhwZWN0KG1lc3NhZ2VzWzBdLmV4Y2VycHQpLnRvQmUoZXhwZWN0ZWQpXG4gICAgICBleHBlY3QobWVzc2FnZXNbMF0udXJsKS50b0JlKGV4cGVjdGVkVXJsKVxuICAgICAgZXhwZWN0KG1lc3NhZ2VzWzBdLmxvY2F0aW9uLmZpbGUpLnRvQmUoYmFkSW1wb3J0UGF0aClcbiAgICAgIGV4cGVjdChtZXNzYWdlc1swXS5sb2NhdGlvbi5wb3NpdGlvbikudG9FcXVhbChbWzAsIDI0XSwgWzAsIDM5XV0pXG4gICAgICBleHBlY3QobWVzc2FnZXNbMF0uc29sdXRpb25zKS5ub3QudG9CZURlZmluZWQoKVxuICAgIH0pXG5cbiAgICBpdChcImRvZXNuJ3Qgc2hvdyB0aGUgcnVsZSBJRCB3aGVuIGRpc2FibGVkXCIsIGFzeW5jICgpID0+IHtcbiAgICAgIGF0b20uY29uZmlnLnNldCgnbGludGVyLWVzbGludC5zaG93UnVsZUlkSW5NZXNzYWdlJywgZmFsc2UpXG4gICAgICBjb25zdCBlZGl0b3IgPSBhd2FpdCBhdG9tLndvcmtzcGFjZS5vcGVuKGJhZEltcG9ydFBhdGgpXG4gICAgICBjb25zdCBtZXNzYWdlcyA9IGF3YWl0IGxpbnQoZWRpdG9yKVxuICAgICAgY29uc3QgZXhwZWN0ZWQgPSBcIlVuYWJsZSB0byByZXNvbHZlIHBhdGggdG8gbW9kdWxlICcuLi9ub25leGlzdGVudCcuXCJcblxuICAgICAgZXhwZWN0KG1lc3NhZ2VzLmxlbmd0aCkudG9CZSgxKVxuICAgICAgZXhwZWN0KG1lc3NhZ2VzWzBdLnNldmVyaXR5KS50b0JlKCdlcnJvcicpXG4gICAgICBleHBlY3QobWVzc2FnZXNbMF0uZXhjZXJwdCkudG9CZShleHBlY3RlZClcbiAgICAgIGV4cGVjdChtZXNzYWdlc1swXS51cmwpLnRvQmUoZXhwZWN0ZWRVcmwpXG4gICAgICBleHBlY3QobWVzc2FnZXNbMF0ubG9jYXRpb24uZmlsZSkudG9CZShiYWRJbXBvcnRQYXRoKVxuICAgICAgZXhwZWN0KG1lc3NhZ2VzWzBdLmxvY2F0aW9uLnBvc2l0aW9uKS50b0VxdWFsKFtbMCwgMjRdLCBbMCwgMzldXSlcbiAgICAgIGV4cGVjdChtZXNzYWdlc1swXS5zb2x1dGlvbnMpLm5vdC50b0JlRGVmaW5lZCgpXG4gICAgfSlcbiAgfSlcbn0pXG4iXX0=