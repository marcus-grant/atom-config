Object.defineProperty(exports, '__esModule', {
  value: true
});

/**
 * Send a job to the worker and return the results
 * @param  {Task} worker The worker Task to use
 * @param  {Object} config Configuration for the job to send to the worker
 * @return {Object|String|Error}        The data returned from the worker
 */

var sendJob = _asyncToGenerator(function* (worker, config) {
  // Ensure the worker is started
  startWorker(worker);
  // Expand the config with a unique ID to emit on
  // NOTE: Jobs _must_ have a unique ID as they are completely async and results
  // can arrive back in any order.
  config.emitKey = (0, _cryptoRandomString2['default'])(10);

  return new Promise(function (resolve, reject) {
    var errSub = worker.on('task:error', function () {
      // Re-throw errors from the task
      var error = new Error(arguments[0]);
      // Set the stack to the one given to us by the worker
      error.stack = arguments[1];
      reject(error);
    });
    var responseSub = worker.on(config.emitKey, function (data) {
      errSub.dispose();
      responseSub.dispose();
      resolve(data);
    });
    // Send the job on to the worker
    try {
      worker.send(config);
    } catch (e) {
      console.error(e);
    }
  });
});

exports.sendJob = sendJob;
exports.showError = showError;

var getDebugInfo = _asyncToGenerator(function* (worker) {
  var textEditor = atom.workspace.getActiveTextEditor();
  var filePath = undefined;
  var editorScopes = undefined;
  if (atom.workspace.isTextEditor(textEditor)) {
    filePath = textEditor.getPath();
    editorScopes = textEditor.getLastCursor().getScopeDescriptor().getScopesArray();
  } else {
    // Somehow this can be called with no active TextEditor, impossible I know...
    filePath = 'unknown';
    editorScopes = ['unknown'];
  }
  var packagePath = atom.packages.resolvePackagePath('linter-eslint');
  var linterEslintMeta = undefined;
  if (packagePath === undefined) {
    // Apparently for some users the package path fails to resolve
    linterEslintMeta = { version: 'unknown!' };
  } else {
    // eslint-disable-next-line import/no-dynamic-require
    linterEslintMeta = require((0, _path.join)(packagePath, 'package.json'));
  }
  var config = atom.config.get('linter-eslint');
  var hoursSinceRestart = Math.round(process.uptime() / 3600 * 10) / 10;
  var returnVal = undefined;
  try {
    var response = yield sendJob(worker, {
      type: 'debug',
      config: config,
      filePath: filePath
    });
    returnVal = {
      atomVersion: atom.getVersion(),
      linterEslintVersion: linterEslintMeta.version,
      linterEslintConfig: config,
      // eslint-disable-next-line import/no-dynamic-require
      eslintVersion: require((0, _path.join)(response.path, 'package.json')).version,
      hoursSinceRestart: hoursSinceRestart,
      platform: process.platform,
      eslintType: response.type,
      eslintPath: response.path,
      editorScopes: editorScopes
    };
  } catch (error) {
    atom.notifications.addError('' + error);
  }
  return returnVal;
});

exports.getDebugInfo = getDebugInfo;

var generateDebugString = _asyncToGenerator(function* (worker) {
  var debug = yield getDebugInfo(worker);
  var details = ['Atom version: ' + debug.atomVersion, 'linter-eslint version: ' + debug.linterEslintVersion, 'ESLint version: ' + debug.eslintVersion, 'Hours since last Atom restart: ' + debug.hoursSinceRestart, 'Platform: ' + debug.platform, 'Using ' + debug.eslintType + ' ESLint from: ' + debug.eslintPath, 'Current file\'s scopes: ' + JSON.stringify(debug.editorScopes, null, 2), 'linter-eslint configuration: ' + JSON.stringify(debug.linterEslintConfig, null, 2)];
  return details.join('\n');
});

exports.generateDebugString = generateDebugString;

/**
 * Given a raw response from ESLint, this processes the messages into a format
 * compatible with the Linter API.
 * @param  {Object}     response   The raw response from ESLint
 * @param  {TextEditor} textEditor The Atom::TextEditor of the file the messages belong to
 * @param  {bool}       showRule   Whether to show the rule in the messages
 * @param  {Object}     worker     The current Worker Task to send Debug jobs to
 * @return {Promise}               The messages transformed into Linter messages
 */

var processESLintMessages = _asyncToGenerator(function* (response, textEditor, showRule, worker) {
  return Promise.all(response.map(_asyncToGenerator(function* (_ref) {
    var fatal = _ref.fatal;
    var originalMessage = _ref.message;
    var line = _ref.line;
    var severity = _ref.severity;
    var ruleId = _ref.ruleId;
    var column = _ref.column;
    var fix = _ref.fix;
    var endLine = _ref.endLine;
    var endColumn = _ref.endColumn;

    var message = fatal ? originalMessage.split('\n')[0] : originalMessage;
    var filePath = textEditor.getPath();
    var textBuffer = textEditor.getBuffer();
    var linterFix = null;
    if (fix) {
      var fixRange = new _atom.Range(textBuffer.positionForCharacterIndex(fix.range[0]), textBuffer.positionForCharacterIndex(fix.range[1]));
      linterFix = {
        position: fixRange,
        replaceWith: fix.text
      };
    }
    var msgCol = undefined;
    var msgEndLine = undefined;
    var msgEndCol = undefined;
    var eslintFullRange = false;

    /*
     Note: ESLint positions are 1-indexed, while Atom expects 0-indexed,
     positions. We are subtracting 1 from these values here so we don't have to
     keep doing so in later uses.
     */
    var msgLine = line - 1;
    if (typeof endColumn !== 'undefined' && typeof endLine !== 'undefined') {
      eslintFullRange = true;
      // Here we always want the column to be a number
      msgCol = Math.max(0, column - 1);
      msgEndLine = endLine - 1;
      msgEndCol = endColumn - 1;
    } else {
      // We want msgCol to remain undefined if it was initially so
      // `generateRange` will give us a range over the entire line
      msgCol = typeof column !== 'undefined' ? column - 1 : column;
    }

    var ret = undefined;
    var range = undefined;
    try {
      if (eslintFullRange) {
        validatePoint(textEditor, msgLine, msgCol);
        validatePoint(textEditor, msgEndLine, msgEndCol);
        range = [[msgLine, msgCol], [msgEndLine, msgEndCol]];
      } else {
        range = (0, _atomLinter.generateRange)(textEditor, msgLine, msgCol);
      }
      ret = {
        severity: severity === 1 ? 'warning' : 'error',
        location: {
          file: filePath,
          position: range
        }
      };

      if (ruleId) {
        ret.url = (0, _eslintRuleDocumentation2['default'])(ruleId).url;
      }

      var ruleAppendix = showRule ? ' (' + (ruleId || 'Fatal') + ')' : '';
      ret.excerpt = '' + message + ruleAppendix;

      if (linterFix) {
        ret.solutions = [linterFix];
      }
    } catch (err) {
      if (!err.message.startsWith('Line number ') && !err.message.startsWith('Column start ')) {
        // This isn't an invalid point error from `generateRange`, re-throw it
        throw err;
      }
      ret = yield generateInvalidTrace(msgLine, msgCol, msgEndLine, msgEndCol, eslintFullRange, filePath, textEditor, ruleId, message, worker);
    }

    return ret;
  })));
});

exports.processESLintMessages = processESLintMessages;

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { var callNext = step.bind(null, 'next'); var callThrow = step.bind(null, 'throw'); function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { Promise.resolve(value).then(callNext, callThrow); } } callNext(); }); }; }

var _path = require('path');

var _eslintRuleDocumentation = require('eslint-rule-documentation');

var _eslintRuleDocumentation2 = _interopRequireDefault(_eslintRuleDocumentation);

var _atomLinter = require('atom-linter');

var _cryptoRandomString = require('crypto-random-string');

var _cryptoRandomString2 = _interopRequireDefault(_cryptoRandomString);

// eslint-disable-next-line import/no-extraneous-dependencies, import/extensions

var _atom = require('atom');

/**
 * Start the worker process if it hasn't already been started
 * @param  {Task} worker The worker process reference to act on
 * @return {undefined}
 */
'use babel';

var startWorker = function startWorker(worker) {
  if (worker.started) {
    // Worker start request has already been sent
    return;
  }
  // Send empty arguments as we don't use them in the worker
  worker.start([]);
  // NOTE: Modifies the Task of the worker, but it's the only clean way to track this
  worker.started = true;
};
function showError(givenMessage) {
  var givenDetail = arguments.length <= 1 || arguments[1] === undefined ? null : arguments[1];

  var detail = undefined;
  var message = undefined;
  if (message instanceof Error) {
    detail = message.stack;
    message = message.message;
  } else {
    detail = givenDetail;
    message = givenMessage;
  }
  atom.notifications.addError('[Linter-ESLint] ' + message, {
    detail: detail,
    dismissable: true
  });
}

function validatePoint(textEditor, line, col) {
  var buffer = textEditor.getBuffer();
  // Clip the given point to a valid one, and check if it equals the original
  if (!buffer.clipPosition([line, col]).isEqual([line, col])) {
    throw new Error(line + ':' + col + ' isn\'t a valid point!');
  }
}

var generateInvalidTrace = _asyncToGenerator(function* (msgLine, msgCol, msgEndLine, msgEndCol, eslintFullRange, filePath, textEditor, ruleId, message, worker) {
  var errMsgRange = msgLine + 1 + ':' + msgCol;
  if (eslintFullRange) {
    errMsgRange += ' - ' + (msgEndLine + 1) + ':' + (msgEndCol + 1);
  }
  var rangeText = 'Requested ' + (eslintFullRange ? 'start point' : 'range') + ': ' + errMsgRange;
  var issueURL = 'https://github.com/AtomLinter/linter-eslint/issues/new';
  var titleText = 'Invalid position given by \'' + ruleId + '\'';
  var title = encodeURIComponent(titleText);
  var body = encodeURIComponent(['ESLint returned a point that did not exist in the document being edited.', 'Rule: `' + ruleId + '`', rangeText, '', '', '<!-- If at all possible, please include code to reproduce this issue! -->', '', '', 'Debug information:', '```json', JSON.stringify((yield getDebugInfo(worker)), null, 2), '```'].join('\n'));

  var location = {
    file: filePath,
    position: (0, _atomLinter.generateRange)(textEditor, 0)
  };
  var newIssueURL = issueURL + '?title=' + title + '&body=' + body;

  return {
    severity: 'error',
    excerpt: titleText + '. See the description for details. ' + 'Click the URL to open a new issue!',
    url: newIssueURL,
    location: location,
    description: rangeText + '\nOriginal message: ' + message
  };
});
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9ob21lL21hcmN1cy8uYXRvbS9wYWNrYWdlcy9saW50ZXItZXNsaW50L3NyYy9oZWxwZXJzLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7O0lBZ0NzQixPQUFPLHFCQUF0QixXQUF1QixNQUFNLEVBQUUsTUFBTSxFQUFFOztBQUU1QyxhQUFXLENBQUMsTUFBTSxDQUFDLENBQUE7Ozs7QUFJbkIsUUFBTSxDQUFDLE9BQU8sR0FBRyxxQ0FBbUIsRUFBRSxDQUFDLENBQUE7O0FBRXZDLFNBQU8sSUFBSSxPQUFPLENBQUMsVUFBQyxPQUFPLEVBQUUsTUFBTSxFQUFLO0FBQ3RDLFFBQU0sTUFBTSxHQUFHLE1BQU0sQ0FBQyxFQUFFLENBQUMsWUFBWSxFQUFFLFlBQVk7O0FBRWpELFVBQU0sS0FBSyxHQUFHLElBQUksS0FBSyxDQUFDLFVBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQTs7QUFFL0IsV0FBSyxDQUFDLEtBQUssR0FBRyxVQUFJLENBQUMsQ0FBQyxDQUFBO0FBQ3BCLFlBQU0sQ0FBQyxLQUFLLENBQUMsQ0FBQTtLQUNkLENBQUMsQ0FBQTtBQUNGLFFBQU0sV0FBVyxHQUFHLE1BQU0sQ0FBQyxFQUFFLENBQUMsTUFBTSxDQUFDLE9BQU8sRUFBRSxVQUFDLElBQUksRUFBSztBQUN0RCxZQUFNLENBQUMsT0FBTyxFQUFFLENBQUE7QUFDaEIsaUJBQVcsQ0FBQyxPQUFPLEVBQUUsQ0FBQTtBQUNyQixhQUFPLENBQUMsSUFBSSxDQUFDLENBQUE7S0FDZCxDQUFDLENBQUE7O0FBRUYsUUFBSTtBQUNGLFlBQU0sQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUE7S0FDcEIsQ0FBQyxPQUFPLENBQUMsRUFBRTtBQUNWLGFBQU8sQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUE7S0FDakI7R0FDRixDQUFDLENBQUE7Q0FDSDs7Ozs7SUEwQnFCLFlBQVkscUJBQTNCLFdBQTRCLE1BQU0sRUFBRTtBQUN6QyxNQUFNLFVBQVUsR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLG1CQUFtQixFQUFFLENBQUE7QUFDdkQsTUFBSSxRQUFRLFlBQUEsQ0FBQTtBQUNaLE1BQUksWUFBWSxZQUFBLENBQUE7QUFDaEIsTUFBSSxJQUFJLENBQUMsU0FBUyxDQUFDLFlBQVksQ0FBQyxVQUFVLENBQUMsRUFBRTtBQUMzQyxZQUFRLEdBQUcsVUFBVSxDQUFDLE9BQU8sRUFBRSxDQUFBO0FBQy9CLGdCQUFZLEdBQUcsVUFBVSxDQUFDLGFBQWEsRUFBRSxDQUFDLGtCQUFrQixFQUFFLENBQUMsY0FBYyxFQUFFLENBQUE7R0FDaEYsTUFBTTs7QUFFTCxZQUFRLEdBQUcsU0FBUyxDQUFBO0FBQ3BCLGdCQUFZLEdBQUcsQ0FBQyxTQUFTLENBQUMsQ0FBQTtHQUMzQjtBQUNELE1BQU0sV0FBVyxHQUFHLElBQUksQ0FBQyxRQUFRLENBQUMsa0JBQWtCLENBQUMsZUFBZSxDQUFDLENBQUE7QUFDckUsTUFBSSxnQkFBZ0IsWUFBQSxDQUFBO0FBQ3BCLE1BQUksV0FBVyxLQUFLLFNBQVMsRUFBRTs7QUFFN0Isb0JBQWdCLEdBQUcsRUFBRSxPQUFPLEVBQUUsVUFBVSxFQUFFLENBQUE7R0FDM0MsTUFBTTs7QUFFTCxvQkFBZ0IsR0FBRyxPQUFPLENBQUMsZ0JBQUssV0FBVyxFQUFFLGNBQWMsQ0FBQyxDQUFDLENBQUE7R0FDOUQ7QUFDRCxNQUFNLE1BQU0sR0FBRyxJQUFJLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxlQUFlLENBQUMsQ0FBQTtBQUMvQyxNQUFNLGlCQUFpQixHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsQUFBQyxPQUFPLENBQUMsTUFBTSxFQUFFLEdBQUcsSUFBSSxHQUFJLEVBQUUsQ0FBQyxHQUFHLEVBQUUsQ0FBQTtBQUN6RSxNQUFJLFNBQVMsWUFBQSxDQUFBO0FBQ2IsTUFBSTtBQUNGLFFBQU0sUUFBUSxHQUFHLE1BQU0sT0FBTyxDQUFDLE1BQU0sRUFBRTtBQUNyQyxVQUFJLEVBQUUsT0FBTztBQUNiLFlBQU0sRUFBTixNQUFNO0FBQ04sY0FBUSxFQUFSLFFBQVE7S0FDVCxDQUFDLENBQUE7QUFDRixhQUFTLEdBQUc7QUFDVixpQkFBVyxFQUFFLElBQUksQ0FBQyxVQUFVLEVBQUU7QUFDOUIseUJBQW1CLEVBQUUsZ0JBQWdCLENBQUMsT0FBTztBQUM3Qyx3QkFBa0IsRUFBRSxNQUFNOztBQUUxQixtQkFBYSxFQUFFLE9BQU8sQ0FBQyxnQkFBSyxRQUFRLENBQUMsSUFBSSxFQUFFLGNBQWMsQ0FBQyxDQUFDLENBQUMsT0FBTztBQUNuRSx1QkFBaUIsRUFBakIsaUJBQWlCO0FBQ2pCLGNBQVEsRUFBRSxPQUFPLENBQUMsUUFBUTtBQUMxQixnQkFBVSxFQUFFLFFBQVEsQ0FBQyxJQUFJO0FBQ3pCLGdCQUFVLEVBQUUsUUFBUSxDQUFDLElBQUk7QUFDekIsa0JBQVksRUFBWixZQUFZO0tBQ2IsQ0FBQTtHQUNGLENBQUMsT0FBTyxLQUFLLEVBQUU7QUFDZCxRQUFJLENBQUMsYUFBYSxDQUFDLFFBQVEsTUFBSSxLQUFLLENBQUcsQ0FBQTtHQUN4QztBQUNELFNBQU8sU0FBUyxDQUFBO0NBQ2pCOzs7O0lBRXFCLG1CQUFtQixxQkFBbEMsV0FBbUMsTUFBTSxFQUFFO0FBQ2hELE1BQU0sS0FBSyxHQUFHLE1BQU0sWUFBWSxDQUFDLE1BQU0sQ0FBQyxDQUFBO0FBQ3hDLE1BQU0sT0FBTyxHQUFHLG9CQUNHLEtBQUssQ0FBQyxXQUFXLDhCQUNSLEtBQUssQ0FBQyxtQkFBbUIsdUJBQ2hDLEtBQUssQ0FBQyxhQUFhLHNDQUNKLEtBQUssQ0FBQyxpQkFBaUIsaUJBQzVDLEtBQUssQ0FBQyxRQUFRLGFBQ2xCLEtBQUssQ0FBQyxVQUFVLHNCQUFpQixLQUFLLENBQUMsVUFBVSwrQkFDaEMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxLQUFLLENBQUMsWUFBWSxFQUFFLElBQUksRUFBRSxDQUFDLENBQUMsb0NBQ3JDLElBQUksQ0FBQyxTQUFTLENBQUMsS0FBSyxDQUFDLGtCQUFrQixFQUFFLElBQUksRUFBRSxDQUFDLENBQUMsQ0FDbEYsQ0FBQTtBQUNELFNBQU8sT0FBTyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQTtDQUMxQjs7Ozs7Ozs7Ozs7Ozs7SUFvRHFCLHFCQUFxQixxQkFBcEMsV0FBcUMsUUFBUSxFQUFFLFVBQVUsRUFBRSxRQUFRLEVBQUUsTUFBTSxFQUFFO0FBQ2xGLFNBQU8sT0FBTyxDQUFDLEdBQUcsQ0FBQyxRQUFRLENBQUMsR0FBRyxtQkFBQyxXQUFPLElBRXRDLEVBQUs7UUFESixLQUFLLEdBRGdDLElBRXRDLENBREMsS0FBSztRQUFXLGVBQWUsR0FETSxJQUV0QyxDQURRLE9BQU87UUFBbUIsSUFBSSxHQURBLElBRXRDLENBRGtDLElBQUk7UUFBRSxRQUFRLEdBRFYsSUFFdEMsQ0FEd0MsUUFBUTtRQUFFLE1BQU0sR0FEbEIsSUFFdEMsQ0FEa0QsTUFBTTtRQUFFLE1BQU0sR0FEMUIsSUFFdEMsQ0FEMEQsTUFBTTtRQUFFLEdBQUcsR0FEL0IsSUFFdEMsQ0FEa0UsR0FBRztRQUFFLE9BQU8sR0FEeEMsSUFFdEMsQ0FEdUUsT0FBTztRQUFFLFNBQVMsR0FEbkQsSUFFdEMsQ0FEZ0YsU0FBUzs7QUFFeEYsUUFBTSxPQUFPLEdBQUcsS0FBSyxHQUFHLGVBQWUsQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsZUFBZSxDQUFBO0FBQ3hFLFFBQU0sUUFBUSxHQUFHLFVBQVUsQ0FBQyxPQUFPLEVBQUUsQ0FBQTtBQUNyQyxRQUFNLFVBQVUsR0FBRyxVQUFVLENBQUMsU0FBUyxFQUFFLENBQUE7QUFDekMsUUFBSSxTQUFTLEdBQUcsSUFBSSxDQUFBO0FBQ3BCLFFBQUksR0FBRyxFQUFFO0FBQ1AsVUFBTSxRQUFRLEdBQUcsZ0JBQ2YsVUFBVSxDQUFDLHlCQUF5QixDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFDbEQsVUFBVSxDQUFDLHlCQUF5QixDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FDbkQsQ0FBQTtBQUNELGVBQVMsR0FBRztBQUNWLGdCQUFRLEVBQUUsUUFBUTtBQUNsQixtQkFBVyxFQUFFLEdBQUcsQ0FBQyxJQUFJO09BQ3RCLENBQUE7S0FDRjtBQUNELFFBQUksTUFBTSxZQUFBLENBQUE7QUFDVixRQUFJLFVBQVUsWUFBQSxDQUFBO0FBQ2QsUUFBSSxTQUFTLFlBQUEsQ0FBQTtBQUNiLFFBQUksZUFBZSxHQUFHLEtBQUssQ0FBQTs7Ozs7OztBQU8zQixRQUFNLE9BQU8sR0FBRyxJQUFJLEdBQUcsQ0FBQyxDQUFBO0FBQ3hCLFFBQUksT0FBTyxTQUFTLEtBQUssV0FBVyxJQUFJLE9BQU8sT0FBTyxLQUFLLFdBQVcsRUFBRTtBQUN0RSxxQkFBZSxHQUFHLElBQUksQ0FBQTs7QUFFdEIsWUFBTSxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQyxFQUFFLE1BQU0sR0FBRyxDQUFDLENBQUMsQ0FBQTtBQUNoQyxnQkFBVSxHQUFHLE9BQU8sR0FBRyxDQUFDLENBQUE7QUFDeEIsZUFBUyxHQUFHLFNBQVMsR0FBRyxDQUFDLENBQUE7S0FDMUIsTUFBTTs7O0FBR0wsWUFBTSxHQUFHLE9BQU8sTUFBTSxLQUFLLFdBQVcsR0FBRyxNQUFNLEdBQUcsQ0FBQyxHQUFHLE1BQU0sQ0FBQTtLQUM3RDs7QUFFRCxRQUFJLEdBQUcsWUFBQSxDQUFBO0FBQ1AsUUFBSSxLQUFLLFlBQUEsQ0FBQTtBQUNULFFBQUk7QUFDRixVQUFJLGVBQWUsRUFBRTtBQUNuQixxQkFBYSxDQUFDLFVBQVUsRUFBRSxPQUFPLEVBQUUsTUFBTSxDQUFDLENBQUE7QUFDMUMscUJBQWEsQ0FBQyxVQUFVLEVBQUUsVUFBVSxFQUFFLFNBQVMsQ0FBQyxDQUFBO0FBQ2hELGFBQUssR0FBRyxDQUFDLENBQUMsT0FBTyxFQUFFLE1BQU0sQ0FBQyxFQUFFLENBQUMsVUFBVSxFQUFFLFNBQVMsQ0FBQyxDQUFDLENBQUE7T0FDckQsTUFBTTtBQUNMLGFBQUssR0FBRywrQkFBYyxVQUFVLEVBQUUsT0FBTyxFQUFFLE1BQU0sQ0FBQyxDQUFBO09BQ25EO0FBQ0QsU0FBRyxHQUFHO0FBQ0osZ0JBQVEsRUFBRSxRQUFRLEtBQUssQ0FBQyxHQUFHLFNBQVMsR0FBRyxPQUFPO0FBQzlDLGdCQUFRLEVBQUU7QUFDUixjQUFJLEVBQUUsUUFBUTtBQUNkLGtCQUFRLEVBQUUsS0FBSztTQUNoQjtPQUNGLENBQUE7O0FBRUQsVUFBSSxNQUFNLEVBQUU7QUFDVixXQUFHLENBQUMsR0FBRyxHQUFHLDBDQUFRLE1BQU0sQ0FBQyxDQUFDLEdBQUcsQ0FBQTtPQUM5Qjs7QUFFRCxVQUFNLFlBQVksR0FBRyxRQUFRLFdBQVEsTUFBTSxJQUFJLE9BQU8sQ0FBQSxTQUFNLEVBQUUsQ0FBQTtBQUM5RCxTQUFHLENBQUMsT0FBTyxRQUFNLE9BQU8sR0FBRyxZQUFZLEFBQUUsQ0FBQTs7QUFFekMsVUFBSSxTQUFTLEVBQUU7QUFDYixXQUFHLENBQUMsU0FBUyxHQUFHLENBQUMsU0FBUyxDQUFDLENBQUE7T0FDNUI7S0FDRixDQUFDLE9BQU8sR0FBRyxFQUFFO0FBQ1osVUFBSSxDQUFDLEdBQUcsQ0FBQyxPQUFPLENBQUMsVUFBVSxDQUFDLGNBQWMsQ0FBQyxJQUN6QyxDQUFDLEdBQUcsQ0FBQyxPQUFPLENBQUMsVUFBVSxDQUFDLGVBQWUsQ0FBQyxFQUN4Qzs7QUFFQSxjQUFNLEdBQUcsQ0FBQTtPQUNWO0FBQ0QsU0FBRyxHQUFHLE1BQU0sb0JBQW9CLENBQzlCLE9BQU8sRUFBRSxNQUFNLEVBQUUsVUFBVSxFQUFFLFNBQVMsRUFDdEMsZUFBZSxFQUFFLFFBQVEsRUFBRSxVQUFVLEVBQUUsTUFBTSxFQUFFLE9BQU8sRUFBRSxNQUFNLENBQy9ELENBQUE7S0FDRjs7QUFFRCxXQUFPLEdBQUcsQ0FBQTtHQUNYLEVBQUMsQ0FBQyxDQUFBO0NBQ0o7Ozs7Ozs7O29CQXpSb0IsTUFBTTs7dUNBQ1AsMkJBQTJCOzs7OzBCQUNqQixhQUFhOztrQ0FDWixzQkFBc0I7Ozs7OztvQkFHL0IsTUFBTTs7Ozs7OztBQVI1QixXQUFXLENBQUE7O0FBZVgsSUFBTSxXQUFXLEdBQUcsU0FBZCxXQUFXLENBQUksTUFBTSxFQUFLO0FBQzlCLE1BQUksTUFBTSxDQUFDLE9BQU8sRUFBRTs7QUFFbEIsV0FBTTtHQUNQOztBQUVELFFBQU0sQ0FBQyxLQUFLLENBQUMsRUFBRSxDQUFDLENBQUE7O0FBRWhCLFFBQU0sQ0FBQyxPQUFPLEdBQUcsSUFBSSxDQUFBO0NBQ3RCLENBQUE7QUFzQ00sU0FBUyxTQUFTLENBQUMsWUFBWSxFQUFzQjtNQUFwQixXQUFXLHlEQUFHLElBQUk7O0FBQ3hELE1BQUksTUFBTSxZQUFBLENBQUE7QUFDVixNQUFJLE9BQU8sWUFBQSxDQUFBO0FBQ1gsTUFBSSxPQUFPLFlBQVksS0FBSyxFQUFFO0FBQzVCLFVBQU0sR0FBRyxPQUFPLENBQUMsS0FBSyxDQUFBO0FBQ3RCLFdBQU8sR0FBRyxPQUFPLENBQUMsT0FBTyxDQUFBO0dBQzFCLE1BQU07QUFDTCxVQUFNLEdBQUcsV0FBVyxDQUFBO0FBQ3BCLFdBQU8sR0FBRyxZQUFZLENBQUE7R0FDdkI7QUFDRCxNQUFJLENBQUMsYUFBYSxDQUFDLFFBQVEsc0JBQW9CLE9BQU8sRUFBSTtBQUN4RCxVQUFNLEVBQU4sTUFBTTtBQUNOLGVBQVcsRUFBRSxJQUFJO0dBQ2xCLENBQUMsQ0FBQTtDQUNIOztBQUVELFNBQVMsYUFBYSxDQUFDLFVBQVUsRUFBRSxJQUFJLEVBQUUsR0FBRyxFQUFFO0FBQzVDLE1BQU0sTUFBTSxHQUFHLFVBQVUsQ0FBQyxTQUFTLEVBQUUsQ0FBQTs7QUFFckMsTUFBSSxDQUFDLE1BQU0sQ0FBQyxZQUFZLENBQUMsQ0FBQyxJQUFJLEVBQUUsR0FBRyxDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUMsQ0FBQyxJQUFJLEVBQUUsR0FBRyxDQUFDLENBQUMsRUFBRTtBQUMxRCxVQUFNLElBQUksS0FBSyxDQUFJLElBQUksU0FBSSxHQUFHLDRCQUF3QixDQUFBO0dBQ3ZEO0NBQ0Y7O0FBaUVELElBQU0sb0JBQW9CLHFCQUFHLFdBQzNCLE9BQU8sRUFBRSxNQUFNLEVBQUUsVUFBVSxFQUFFLFNBQVMsRUFDdEMsZUFBZSxFQUFFLFFBQVEsRUFBRSxVQUFVLEVBQUUsTUFBTSxFQUFFLE9BQU8sRUFBRSxNQUFNLEVBQzNEO0FBQ0gsTUFBSSxXQUFXLEdBQU0sT0FBTyxHQUFHLENBQUMsU0FBSSxNQUFNLEFBQUUsQ0FBQTtBQUM1QyxNQUFJLGVBQWUsRUFBRTtBQUNuQixlQUFXLGFBQVUsVUFBVSxHQUFHLENBQUMsQ0FBQSxVQUFJLFNBQVMsR0FBRyxDQUFDLENBQUEsQUFBRSxDQUFBO0dBQ3ZEO0FBQ0QsTUFBTSxTQUFTLG1CQUFnQixlQUFlLEdBQUcsYUFBYSxHQUFHLE9BQU8sQ0FBQSxVQUFLLFdBQVcsQUFBRSxDQUFBO0FBQzFGLE1BQU0sUUFBUSxHQUFHLHdEQUF3RCxDQUFBO0FBQ3pFLE1BQU0sU0FBUyxvQ0FBaUMsTUFBTSxPQUFHLENBQUE7QUFDekQsTUFBTSxLQUFLLEdBQUcsa0JBQWtCLENBQUMsU0FBUyxDQUFDLENBQUE7QUFDM0MsTUFBTSxJQUFJLEdBQUcsa0JBQWtCLENBQUMsQ0FDOUIsMEVBQTBFLGNBQy9ELE1BQU0sUUFDakIsU0FBUyxFQUNULEVBQUUsRUFBRSxFQUFFLEVBQ04sMkVBQTJFLEVBQzNFLEVBQUUsRUFBRSxFQUFFLEVBQ04sb0JBQW9CLEVBQ3BCLFNBQVMsRUFDVCxJQUFJLENBQUMsU0FBUyxFQUFDLE1BQU0sWUFBWSxDQUFDLE1BQU0sQ0FBQyxDQUFBLEVBQUUsSUFBSSxFQUFFLENBQUMsQ0FBQyxFQUNuRCxLQUFLLENBQ04sQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQTs7QUFFYixNQUFNLFFBQVEsR0FBRztBQUNmLFFBQUksRUFBRSxRQUFRO0FBQ2QsWUFBUSxFQUFFLCtCQUFjLFVBQVUsRUFBRSxDQUFDLENBQUM7R0FDdkMsQ0FBQTtBQUNELE1BQU0sV0FBVyxHQUFNLFFBQVEsZUFBVSxLQUFLLGNBQVMsSUFBSSxBQUFFLENBQUE7O0FBRTdELFNBQU87QUFDTCxZQUFRLEVBQUUsT0FBTztBQUNqQixXQUFPLEVBQUUsQUFBRyxTQUFTLDJDQUNuQixvQ0FBb0M7QUFDdEMsT0FBRyxFQUFFLFdBQVc7QUFDaEIsWUFBUSxFQUFSLFFBQVE7QUFDUixlQUFXLEVBQUssU0FBUyw0QkFBdUIsT0FBTyxBQUFFO0dBQzFELENBQUE7Q0FDRixDQUFBLENBQUEiLCJmaWxlIjoiL2hvbWUvbWFyY3VzLy5hdG9tL3BhY2thZ2VzL2xpbnRlci1lc2xpbnQvc3JjL2hlbHBlcnMuanMiLCJzb3VyY2VzQ29udGVudCI6WyIndXNlIGJhYmVsJ1xuXG5pbXBvcnQgeyBqb2luIH0gZnJvbSAncGF0aCdcbmltcG9ydCBydWxlVVJJIGZyb20gJ2VzbGludC1ydWxlLWRvY3VtZW50YXRpb24nXG5pbXBvcnQgeyBnZW5lcmF0ZVJhbmdlIH0gZnJvbSAnYXRvbS1saW50ZXInXG5pbXBvcnQgY3J5cHRvUmFuZG9tU3RyaW5nIGZyb20gJ2NyeXB0by1yYW5kb20tc3RyaW5nJ1xuXG4vLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgaW1wb3J0L25vLWV4dHJhbmVvdXMtZGVwZW5kZW5jaWVzLCBpbXBvcnQvZXh0ZW5zaW9uc1xuaW1wb3J0IHsgUmFuZ2UgfSBmcm9tICdhdG9tJ1xuXG4vKipcbiAqIFN0YXJ0IHRoZSB3b3JrZXIgcHJvY2VzcyBpZiBpdCBoYXNuJ3QgYWxyZWFkeSBiZWVuIHN0YXJ0ZWRcbiAqIEBwYXJhbSAge1Rhc2t9IHdvcmtlciBUaGUgd29ya2VyIHByb2Nlc3MgcmVmZXJlbmNlIHRvIGFjdCBvblxuICogQHJldHVybiB7dW5kZWZpbmVkfVxuICovXG5jb25zdCBzdGFydFdvcmtlciA9ICh3b3JrZXIpID0+IHtcbiAgaWYgKHdvcmtlci5zdGFydGVkKSB7XG4gICAgLy8gV29ya2VyIHN0YXJ0IHJlcXVlc3QgaGFzIGFscmVhZHkgYmVlbiBzZW50XG4gICAgcmV0dXJuXG4gIH1cbiAgLy8gU2VuZCBlbXB0eSBhcmd1bWVudHMgYXMgd2UgZG9uJ3QgdXNlIHRoZW0gaW4gdGhlIHdvcmtlclxuICB3b3JrZXIuc3RhcnQoW10pXG4gIC8vIE5PVEU6IE1vZGlmaWVzIHRoZSBUYXNrIG9mIHRoZSB3b3JrZXIsIGJ1dCBpdCdzIHRoZSBvbmx5IGNsZWFuIHdheSB0byB0cmFjayB0aGlzXG4gIHdvcmtlci5zdGFydGVkID0gdHJ1ZVxufVxuXG4vKipcbiAqIFNlbmQgYSBqb2IgdG8gdGhlIHdvcmtlciBhbmQgcmV0dXJuIHRoZSByZXN1bHRzXG4gKiBAcGFyYW0gIHtUYXNrfSB3b3JrZXIgVGhlIHdvcmtlciBUYXNrIHRvIHVzZVxuICogQHBhcmFtICB7T2JqZWN0fSBjb25maWcgQ29uZmlndXJhdGlvbiBmb3IgdGhlIGpvYiB0byBzZW5kIHRvIHRoZSB3b3JrZXJcbiAqIEByZXR1cm4ge09iamVjdHxTdHJpbmd8RXJyb3J9ICAgICAgICBUaGUgZGF0YSByZXR1cm5lZCBmcm9tIHRoZSB3b3JrZXJcbiAqL1xuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIHNlbmRKb2Iod29ya2VyLCBjb25maWcpIHtcbiAgLy8gRW5zdXJlIHRoZSB3b3JrZXIgaXMgc3RhcnRlZFxuICBzdGFydFdvcmtlcih3b3JrZXIpXG4gIC8vIEV4cGFuZCB0aGUgY29uZmlnIHdpdGggYSB1bmlxdWUgSUQgdG8gZW1pdCBvblxuICAvLyBOT1RFOiBKb2JzIF9tdXN0XyBoYXZlIGEgdW5pcXVlIElEIGFzIHRoZXkgYXJlIGNvbXBsZXRlbHkgYXN5bmMgYW5kIHJlc3VsdHNcbiAgLy8gY2FuIGFycml2ZSBiYWNrIGluIGFueSBvcmRlci5cbiAgY29uZmlnLmVtaXRLZXkgPSBjcnlwdG9SYW5kb21TdHJpbmcoMTApXG5cbiAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICBjb25zdCBlcnJTdWIgPSB3b3JrZXIub24oJ3Rhc2s6ZXJyb3InLCAoLi4uZXJyKSA9PiB7XG4gICAgICAvLyBSZS10aHJvdyBlcnJvcnMgZnJvbSB0aGUgdGFza1xuICAgICAgY29uc3QgZXJyb3IgPSBuZXcgRXJyb3IoZXJyWzBdKVxuICAgICAgLy8gU2V0IHRoZSBzdGFjayB0byB0aGUgb25lIGdpdmVuIHRvIHVzIGJ5IHRoZSB3b3JrZXJcbiAgICAgIGVycm9yLnN0YWNrID0gZXJyWzFdXG4gICAgICByZWplY3QoZXJyb3IpXG4gICAgfSlcbiAgICBjb25zdCByZXNwb25zZVN1YiA9IHdvcmtlci5vbihjb25maWcuZW1pdEtleSwgKGRhdGEpID0+IHtcbiAgICAgIGVyclN1Yi5kaXNwb3NlKClcbiAgICAgIHJlc3BvbnNlU3ViLmRpc3Bvc2UoKVxuICAgICAgcmVzb2x2ZShkYXRhKVxuICAgIH0pXG4gICAgLy8gU2VuZCB0aGUgam9iIG9uIHRvIHRoZSB3b3JrZXJcbiAgICB0cnkge1xuICAgICAgd29ya2VyLnNlbmQoY29uZmlnKVxuICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgIGNvbnNvbGUuZXJyb3IoZSlcbiAgICB9XG4gIH0pXG59XG5cbmV4cG9ydCBmdW5jdGlvbiBzaG93RXJyb3IoZ2l2ZW5NZXNzYWdlLCBnaXZlbkRldGFpbCA9IG51bGwpIHtcbiAgbGV0IGRldGFpbFxuICBsZXQgbWVzc2FnZVxuICBpZiAobWVzc2FnZSBpbnN0YW5jZW9mIEVycm9yKSB7XG4gICAgZGV0YWlsID0gbWVzc2FnZS5zdGFja1xuICAgIG1lc3NhZ2UgPSBtZXNzYWdlLm1lc3NhZ2VcbiAgfSBlbHNlIHtcbiAgICBkZXRhaWwgPSBnaXZlbkRldGFpbFxuICAgIG1lc3NhZ2UgPSBnaXZlbk1lc3NhZ2VcbiAgfVxuICBhdG9tLm5vdGlmaWNhdGlvbnMuYWRkRXJyb3IoYFtMaW50ZXItRVNMaW50XSAke21lc3NhZ2V9YCwge1xuICAgIGRldGFpbCxcbiAgICBkaXNtaXNzYWJsZTogdHJ1ZVxuICB9KVxufVxuXG5mdW5jdGlvbiB2YWxpZGF0ZVBvaW50KHRleHRFZGl0b3IsIGxpbmUsIGNvbCkge1xuICBjb25zdCBidWZmZXIgPSB0ZXh0RWRpdG9yLmdldEJ1ZmZlcigpXG4gIC8vIENsaXAgdGhlIGdpdmVuIHBvaW50IHRvIGEgdmFsaWQgb25lLCBhbmQgY2hlY2sgaWYgaXQgZXF1YWxzIHRoZSBvcmlnaW5hbFxuICBpZiAoIWJ1ZmZlci5jbGlwUG9zaXRpb24oW2xpbmUsIGNvbF0pLmlzRXF1YWwoW2xpbmUsIGNvbF0pKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKGAke2xpbmV9OiR7Y29sfSBpc24ndCBhIHZhbGlkIHBvaW50IWApXG4gIH1cbn1cblxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGdldERlYnVnSW5mbyh3b3JrZXIpIHtcbiAgY29uc3QgdGV4dEVkaXRvciA9IGF0b20ud29ya3NwYWNlLmdldEFjdGl2ZVRleHRFZGl0b3IoKVxuICBsZXQgZmlsZVBhdGhcbiAgbGV0IGVkaXRvclNjb3Blc1xuICBpZiAoYXRvbS53b3Jrc3BhY2UuaXNUZXh0RWRpdG9yKHRleHRFZGl0b3IpKSB7XG4gICAgZmlsZVBhdGggPSB0ZXh0RWRpdG9yLmdldFBhdGgoKVxuICAgIGVkaXRvclNjb3BlcyA9IHRleHRFZGl0b3IuZ2V0TGFzdEN1cnNvcigpLmdldFNjb3BlRGVzY3JpcHRvcigpLmdldFNjb3Blc0FycmF5KClcbiAgfSBlbHNlIHtcbiAgICAvLyBTb21laG93IHRoaXMgY2FuIGJlIGNhbGxlZCB3aXRoIG5vIGFjdGl2ZSBUZXh0RWRpdG9yLCBpbXBvc3NpYmxlIEkga25vdy4uLlxuICAgIGZpbGVQYXRoID0gJ3Vua25vd24nXG4gICAgZWRpdG9yU2NvcGVzID0gWyd1bmtub3duJ11cbiAgfVxuICBjb25zdCBwYWNrYWdlUGF0aCA9IGF0b20ucGFja2FnZXMucmVzb2x2ZVBhY2thZ2VQYXRoKCdsaW50ZXItZXNsaW50JylcbiAgbGV0IGxpbnRlckVzbGludE1ldGFcbiAgaWYgKHBhY2thZ2VQYXRoID09PSB1bmRlZmluZWQpIHtcbiAgICAvLyBBcHBhcmVudGx5IGZvciBzb21lIHVzZXJzIHRoZSBwYWNrYWdlIHBhdGggZmFpbHMgdG8gcmVzb2x2ZVxuICAgIGxpbnRlckVzbGludE1ldGEgPSB7IHZlcnNpb246ICd1bmtub3duIScgfVxuICB9IGVsc2Uge1xuICAgIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBpbXBvcnQvbm8tZHluYW1pYy1yZXF1aXJlXG4gICAgbGludGVyRXNsaW50TWV0YSA9IHJlcXVpcmUoam9pbihwYWNrYWdlUGF0aCwgJ3BhY2thZ2UuanNvbicpKVxuICB9XG4gIGNvbnN0IGNvbmZpZyA9IGF0b20uY29uZmlnLmdldCgnbGludGVyLWVzbGludCcpXG4gIGNvbnN0IGhvdXJzU2luY2VSZXN0YXJ0ID0gTWF0aC5yb3VuZCgocHJvY2Vzcy51cHRpbWUoKSAvIDM2MDApICogMTApIC8gMTBcbiAgbGV0IHJldHVyblZhbFxuICB0cnkge1xuICAgIGNvbnN0IHJlc3BvbnNlID0gYXdhaXQgc2VuZEpvYih3b3JrZXIsIHtcbiAgICAgIHR5cGU6ICdkZWJ1ZycsXG4gICAgICBjb25maWcsXG4gICAgICBmaWxlUGF0aFxuICAgIH0pXG4gICAgcmV0dXJuVmFsID0ge1xuICAgICAgYXRvbVZlcnNpb246IGF0b20uZ2V0VmVyc2lvbigpLFxuICAgICAgbGludGVyRXNsaW50VmVyc2lvbjogbGludGVyRXNsaW50TWV0YS52ZXJzaW9uLFxuICAgICAgbGludGVyRXNsaW50Q29uZmlnOiBjb25maWcsXG4gICAgICAvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgaW1wb3J0L25vLWR5bmFtaWMtcmVxdWlyZVxuICAgICAgZXNsaW50VmVyc2lvbjogcmVxdWlyZShqb2luKHJlc3BvbnNlLnBhdGgsICdwYWNrYWdlLmpzb24nKSkudmVyc2lvbixcbiAgICAgIGhvdXJzU2luY2VSZXN0YXJ0LFxuICAgICAgcGxhdGZvcm06IHByb2Nlc3MucGxhdGZvcm0sXG4gICAgICBlc2xpbnRUeXBlOiByZXNwb25zZS50eXBlLFxuICAgICAgZXNsaW50UGF0aDogcmVzcG9uc2UucGF0aCxcbiAgICAgIGVkaXRvclNjb3BlcyxcbiAgICB9XG4gIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgYXRvbS5ub3RpZmljYXRpb25zLmFkZEVycm9yKGAke2Vycm9yfWApXG4gIH1cbiAgcmV0dXJuIHJldHVyblZhbFxufVxuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gZ2VuZXJhdGVEZWJ1Z1N0cmluZyh3b3JrZXIpIHtcbiAgY29uc3QgZGVidWcgPSBhd2FpdCBnZXREZWJ1Z0luZm8od29ya2VyKVxuICBjb25zdCBkZXRhaWxzID0gW1xuICAgIGBBdG9tIHZlcnNpb246ICR7ZGVidWcuYXRvbVZlcnNpb259YCxcbiAgICBgbGludGVyLWVzbGludCB2ZXJzaW9uOiAke2RlYnVnLmxpbnRlckVzbGludFZlcnNpb259YCxcbiAgICBgRVNMaW50IHZlcnNpb246ICR7ZGVidWcuZXNsaW50VmVyc2lvbn1gLFxuICAgIGBIb3VycyBzaW5jZSBsYXN0IEF0b20gcmVzdGFydDogJHtkZWJ1Zy5ob3Vyc1NpbmNlUmVzdGFydH1gLFxuICAgIGBQbGF0Zm9ybTogJHtkZWJ1Zy5wbGF0Zm9ybX1gLFxuICAgIGBVc2luZyAke2RlYnVnLmVzbGludFR5cGV9IEVTTGludCBmcm9tOiAke2RlYnVnLmVzbGludFBhdGh9YCxcbiAgICBgQ3VycmVudCBmaWxlJ3Mgc2NvcGVzOiAke0pTT04uc3RyaW5naWZ5KGRlYnVnLmVkaXRvclNjb3BlcywgbnVsbCwgMil9YCxcbiAgICBgbGludGVyLWVzbGludCBjb25maWd1cmF0aW9uOiAke0pTT04uc3RyaW5naWZ5KGRlYnVnLmxpbnRlckVzbGludENvbmZpZywgbnVsbCwgMil9YFxuICBdXG4gIHJldHVybiBkZXRhaWxzLmpvaW4oJ1xcbicpXG59XG5cbmNvbnN0IGdlbmVyYXRlSW52YWxpZFRyYWNlID0gYXN5bmMgKFxuICBtc2dMaW5lLCBtc2dDb2wsIG1zZ0VuZExpbmUsIG1zZ0VuZENvbCxcbiAgZXNsaW50RnVsbFJhbmdlLCBmaWxlUGF0aCwgdGV4dEVkaXRvciwgcnVsZUlkLCBtZXNzYWdlLCB3b3JrZXJcbikgPT4ge1xuICBsZXQgZXJyTXNnUmFuZ2UgPSBgJHttc2dMaW5lICsgMX06JHttc2dDb2x9YFxuICBpZiAoZXNsaW50RnVsbFJhbmdlKSB7XG4gICAgZXJyTXNnUmFuZ2UgKz0gYCAtICR7bXNnRW5kTGluZSArIDF9OiR7bXNnRW5kQ29sICsgMX1gXG4gIH1cbiAgY29uc3QgcmFuZ2VUZXh0ID0gYFJlcXVlc3RlZCAke2VzbGludEZ1bGxSYW5nZSA/ICdzdGFydCBwb2ludCcgOiAncmFuZ2UnfTogJHtlcnJNc2dSYW5nZX1gXG4gIGNvbnN0IGlzc3VlVVJMID0gJ2h0dHBzOi8vZ2l0aHViLmNvbS9BdG9tTGludGVyL2xpbnRlci1lc2xpbnQvaXNzdWVzL25ldydcbiAgY29uc3QgdGl0bGVUZXh0ID0gYEludmFsaWQgcG9zaXRpb24gZ2l2ZW4gYnkgJyR7cnVsZUlkfSdgXG4gIGNvbnN0IHRpdGxlID0gZW5jb2RlVVJJQ29tcG9uZW50KHRpdGxlVGV4dClcbiAgY29uc3QgYm9keSA9IGVuY29kZVVSSUNvbXBvbmVudChbXG4gICAgJ0VTTGludCByZXR1cm5lZCBhIHBvaW50IHRoYXQgZGlkIG5vdCBleGlzdCBpbiB0aGUgZG9jdW1lbnQgYmVpbmcgZWRpdGVkLicsXG4gICAgYFJ1bGU6IFxcYCR7cnVsZUlkfVxcYGAsXG4gICAgcmFuZ2VUZXh0LFxuICAgICcnLCAnJyxcbiAgICAnPCEtLSBJZiBhdCBhbGwgcG9zc2libGUsIHBsZWFzZSBpbmNsdWRlIGNvZGUgdG8gcmVwcm9kdWNlIHRoaXMgaXNzdWUhIC0tPicsXG4gICAgJycsICcnLFxuICAgICdEZWJ1ZyBpbmZvcm1hdGlvbjonLFxuICAgICdgYGBqc29uJyxcbiAgICBKU09OLnN0cmluZ2lmeShhd2FpdCBnZXREZWJ1Z0luZm8od29ya2VyKSwgbnVsbCwgMiksXG4gICAgJ2BgYCdcbiAgXS5qb2luKCdcXG4nKSlcblxuICBjb25zdCBsb2NhdGlvbiA9IHtcbiAgICBmaWxlOiBmaWxlUGF0aCxcbiAgICBwb3NpdGlvbjogZ2VuZXJhdGVSYW5nZSh0ZXh0RWRpdG9yLCAwKSxcbiAgfVxuICBjb25zdCBuZXdJc3N1ZVVSTCA9IGAke2lzc3VlVVJMfT90aXRsZT0ke3RpdGxlfSZib2R5PSR7Ym9keX1gXG5cbiAgcmV0dXJuIHtcbiAgICBzZXZlcml0eTogJ2Vycm9yJyxcbiAgICBleGNlcnB0OiBgJHt0aXRsZVRleHR9LiBTZWUgdGhlIGRlc2NyaXB0aW9uIGZvciBkZXRhaWxzLiBgICtcbiAgICAgICdDbGljayB0aGUgVVJMIHRvIG9wZW4gYSBuZXcgaXNzdWUhJyxcbiAgICB1cmw6IG5ld0lzc3VlVVJMLFxuICAgIGxvY2F0aW9uLFxuICAgIGRlc2NyaXB0aW9uOiBgJHtyYW5nZVRleHR9XFxuT3JpZ2luYWwgbWVzc2FnZTogJHttZXNzYWdlfWBcbiAgfVxufVxuXG4vKipcbiAqIEdpdmVuIGEgcmF3IHJlc3BvbnNlIGZyb20gRVNMaW50LCB0aGlzIHByb2Nlc3NlcyB0aGUgbWVzc2FnZXMgaW50byBhIGZvcm1hdFxuICogY29tcGF0aWJsZSB3aXRoIHRoZSBMaW50ZXIgQVBJLlxuICogQHBhcmFtICB7T2JqZWN0fSAgICAgcmVzcG9uc2UgICBUaGUgcmF3IHJlc3BvbnNlIGZyb20gRVNMaW50XG4gKiBAcGFyYW0gIHtUZXh0RWRpdG9yfSB0ZXh0RWRpdG9yIFRoZSBBdG9tOjpUZXh0RWRpdG9yIG9mIHRoZSBmaWxlIHRoZSBtZXNzYWdlcyBiZWxvbmcgdG9cbiAqIEBwYXJhbSAge2Jvb2x9ICAgICAgIHNob3dSdWxlICAgV2hldGhlciB0byBzaG93IHRoZSBydWxlIGluIHRoZSBtZXNzYWdlc1xuICogQHBhcmFtICB7T2JqZWN0fSAgICAgd29ya2VyICAgICBUaGUgY3VycmVudCBXb3JrZXIgVGFzayB0byBzZW5kIERlYnVnIGpvYnMgdG9cbiAqIEByZXR1cm4ge1Byb21pc2V9ICAgICAgICAgICAgICAgVGhlIG1lc3NhZ2VzIHRyYW5zZm9ybWVkIGludG8gTGludGVyIG1lc3NhZ2VzXG4gKi9cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBwcm9jZXNzRVNMaW50TWVzc2FnZXMocmVzcG9uc2UsIHRleHRFZGl0b3IsIHNob3dSdWxlLCB3b3JrZXIpIHtcbiAgcmV0dXJuIFByb21pc2UuYWxsKHJlc3BvbnNlLm1hcChhc3luYyAoe1xuICAgIGZhdGFsLCBtZXNzYWdlOiBvcmlnaW5hbE1lc3NhZ2UsIGxpbmUsIHNldmVyaXR5LCBydWxlSWQsIGNvbHVtbiwgZml4LCBlbmRMaW5lLCBlbmRDb2x1bW5cbiAgfSkgPT4ge1xuICAgIGNvbnN0IG1lc3NhZ2UgPSBmYXRhbCA/IG9yaWdpbmFsTWVzc2FnZS5zcGxpdCgnXFxuJylbMF0gOiBvcmlnaW5hbE1lc3NhZ2VcbiAgICBjb25zdCBmaWxlUGF0aCA9IHRleHRFZGl0b3IuZ2V0UGF0aCgpXG4gICAgY29uc3QgdGV4dEJ1ZmZlciA9IHRleHRFZGl0b3IuZ2V0QnVmZmVyKClcbiAgICBsZXQgbGludGVyRml4ID0gbnVsbFxuICAgIGlmIChmaXgpIHtcbiAgICAgIGNvbnN0IGZpeFJhbmdlID0gbmV3IFJhbmdlKFxuICAgICAgICB0ZXh0QnVmZmVyLnBvc2l0aW9uRm9yQ2hhcmFjdGVySW5kZXgoZml4LnJhbmdlWzBdKSxcbiAgICAgICAgdGV4dEJ1ZmZlci5wb3NpdGlvbkZvckNoYXJhY3RlckluZGV4KGZpeC5yYW5nZVsxXSlcbiAgICAgIClcbiAgICAgIGxpbnRlckZpeCA9IHtcbiAgICAgICAgcG9zaXRpb246IGZpeFJhbmdlLFxuICAgICAgICByZXBsYWNlV2l0aDogZml4LnRleHRcbiAgICAgIH1cbiAgICB9XG4gICAgbGV0IG1zZ0NvbFxuICAgIGxldCBtc2dFbmRMaW5lXG4gICAgbGV0IG1zZ0VuZENvbFxuICAgIGxldCBlc2xpbnRGdWxsUmFuZ2UgPSBmYWxzZVxuXG4gICAgLypcbiAgICAgTm90ZTogRVNMaW50IHBvc2l0aW9ucyBhcmUgMS1pbmRleGVkLCB3aGlsZSBBdG9tIGV4cGVjdHMgMC1pbmRleGVkLFxuICAgICBwb3NpdGlvbnMuIFdlIGFyZSBzdWJ0cmFjdGluZyAxIGZyb20gdGhlc2UgdmFsdWVzIGhlcmUgc28gd2UgZG9uJ3QgaGF2ZSB0b1xuICAgICBrZWVwIGRvaW5nIHNvIGluIGxhdGVyIHVzZXMuXG4gICAgICovXG4gICAgY29uc3QgbXNnTGluZSA9IGxpbmUgLSAxXG4gICAgaWYgKHR5cGVvZiBlbmRDb2x1bW4gIT09ICd1bmRlZmluZWQnICYmIHR5cGVvZiBlbmRMaW5lICE9PSAndW5kZWZpbmVkJykge1xuICAgICAgZXNsaW50RnVsbFJhbmdlID0gdHJ1ZVxuICAgICAgLy8gSGVyZSB3ZSBhbHdheXMgd2FudCB0aGUgY29sdW1uIHRvIGJlIGEgbnVtYmVyXG4gICAgICBtc2dDb2wgPSBNYXRoLm1heCgwLCBjb2x1bW4gLSAxKVxuICAgICAgbXNnRW5kTGluZSA9IGVuZExpbmUgLSAxXG4gICAgICBtc2dFbmRDb2wgPSBlbmRDb2x1bW4gLSAxXG4gICAgfSBlbHNlIHtcbiAgICAgIC8vIFdlIHdhbnQgbXNnQ29sIHRvIHJlbWFpbiB1bmRlZmluZWQgaWYgaXQgd2FzIGluaXRpYWxseSBzb1xuICAgICAgLy8gYGdlbmVyYXRlUmFuZ2VgIHdpbGwgZ2l2ZSB1cyBhIHJhbmdlIG92ZXIgdGhlIGVudGlyZSBsaW5lXG4gICAgICBtc2dDb2wgPSB0eXBlb2YgY29sdW1uICE9PSAndW5kZWZpbmVkJyA/IGNvbHVtbiAtIDEgOiBjb2x1bW5cbiAgICB9XG5cbiAgICBsZXQgcmV0XG4gICAgbGV0IHJhbmdlXG4gICAgdHJ5IHtcbiAgICAgIGlmIChlc2xpbnRGdWxsUmFuZ2UpIHtcbiAgICAgICAgdmFsaWRhdGVQb2ludCh0ZXh0RWRpdG9yLCBtc2dMaW5lLCBtc2dDb2wpXG4gICAgICAgIHZhbGlkYXRlUG9pbnQodGV4dEVkaXRvciwgbXNnRW5kTGluZSwgbXNnRW5kQ29sKVxuICAgICAgICByYW5nZSA9IFtbbXNnTGluZSwgbXNnQ29sXSwgW21zZ0VuZExpbmUsIG1zZ0VuZENvbF1dXG4gICAgICB9IGVsc2Uge1xuICAgICAgICByYW5nZSA9IGdlbmVyYXRlUmFuZ2UodGV4dEVkaXRvciwgbXNnTGluZSwgbXNnQ29sKVxuICAgICAgfVxuICAgICAgcmV0ID0ge1xuICAgICAgICBzZXZlcml0eTogc2V2ZXJpdHkgPT09IDEgPyAnd2FybmluZycgOiAnZXJyb3InLFxuICAgICAgICBsb2NhdGlvbjoge1xuICAgICAgICAgIGZpbGU6IGZpbGVQYXRoLFxuICAgICAgICAgIHBvc2l0aW9uOiByYW5nZVxuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIGlmIChydWxlSWQpIHtcbiAgICAgICAgcmV0LnVybCA9IHJ1bGVVUkkocnVsZUlkKS51cmxcbiAgICAgIH1cblxuICAgICAgY29uc3QgcnVsZUFwcGVuZGl4ID0gc2hvd1J1bGUgPyBgICgke3J1bGVJZCB8fCAnRmF0YWwnfSlgIDogJydcbiAgICAgIHJldC5leGNlcnB0ID0gYCR7bWVzc2FnZX0ke3J1bGVBcHBlbmRpeH1gXG5cbiAgICAgIGlmIChsaW50ZXJGaXgpIHtcbiAgICAgICAgcmV0LnNvbHV0aW9ucyA9IFtsaW50ZXJGaXhdXG4gICAgICB9XG4gICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICBpZiAoIWVyci5tZXNzYWdlLnN0YXJ0c1dpdGgoJ0xpbmUgbnVtYmVyICcpICYmXG4gICAgICAgICFlcnIubWVzc2FnZS5zdGFydHNXaXRoKCdDb2x1bW4gc3RhcnQgJylcbiAgICAgICkge1xuICAgICAgICAvLyBUaGlzIGlzbid0IGFuIGludmFsaWQgcG9pbnQgZXJyb3IgZnJvbSBgZ2VuZXJhdGVSYW5nZWAsIHJlLXRocm93IGl0XG4gICAgICAgIHRocm93IGVyclxuICAgICAgfVxuICAgICAgcmV0ID0gYXdhaXQgZ2VuZXJhdGVJbnZhbGlkVHJhY2UoXG4gICAgICAgIG1zZ0xpbmUsIG1zZ0NvbCwgbXNnRW5kTGluZSwgbXNnRW5kQ29sLFxuICAgICAgICBlc2xpbnRGdWxsUmFuZ2UsIGZpbGVQYXRoLCB0ZXh0RWRpdG9yLCBydWxlSWQsIG1lc3NhZ2UsIHdvcmtlclxuICAgICAgKVxuICAgIH1cblxuICAgIHJldHVybiByZXRcbiAgfSkpXG59XG4iXX0=