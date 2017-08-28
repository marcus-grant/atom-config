Object.defineProperty(exports, '__esModule', {
  value: true
});
exports.getChunks = getChunks;
exports.getChunksByProjects = getChunksByProjects;
exports.mergeChange = mergeChange;
exports.calculateDecorations = calculateDecorations;

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _helpers = require('../helpers');

function getChunks(filePath, projectPath) {
  var toReturn = [];
  var chunks = filePath.split(_path2['default'].sep);
  while (chunks.length) {
    var currentPath = chunks.join(_path2['default'].sep);
    if (currentPath) {
      // This is required for when you open files outside of project window
      // and the last entry is '' because unix paths start with /
      toReturn.push(currentPath);
      if (currentPath === projectPath) {
        break;
      }
    }
    chunks.pop();
  }
  return toReturn;
}

function getChunksByProjects(filePath, projectPaths) {
  var matchingProjectPath = projectPaths.find(function (p) {
    return filePath.startsWith(p);
  });
  if (!matchingProjectPath) {
    return [filePath];
  }
  return getChunks(filePath, matchingProjectPath);
}

function mergeChange(change, filePath, severity) {
  if (!change[filePath]) {
    change[filePath] = {
      info: false,
      error: false,
      warning: false
    };
  }
  change[filePath][severity] = true;
}

function calculateDecorations(decorateOnTreeView, messages) {
  var toReturn = {};
  var projectPaths = atom.project.getPaths();
  messages.forEach(function (message) {
    var filePath = (0, _helpers.$file)(message);
    if (filePath) {
      var chunks = decorateOnTreeView === 'Files' ? [filePath] : getChunksByProjects(filePath, projectPaths);
      chunks.forEach(function (chunk) {
        return mergeChange(toReturn, chunk, message.severity);
      });
    }
  });
  return toReturn;
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9ob21lL21hcmN1cy8uYXRvbS9wYWNrYWdlcy9saW50ZXItdWktZGVmYXVsdC9saWIvdHJlZS12aWV3L2hlbHBlcnMuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7OztvQkFFaUIsTUFBTTs7Ozt1QkFDRCxZQUFZOztBQUczQixTQUFTLFNBQVMsQ0FBQyxRQUFnQixFQUFFLFdBQW1CLEVBQWlCO0FBQzlFLE1BQU0sUUFBUSxHQUFHLEVBQUUsQ0FBQTtBQUNuQixNQUFNLE1BQU0sR0FBRyxRQUFRLENBQUMsS0FBSyxDQUFDLGtCQUFLLEdBQUcsQ0FBQyxDQUFBO0FBQ3ZDLFNBQU8sTUFBTSxDQUFDLE1BQU0sRUFBRTtBQUNwQixRQUFNLFdBQVcsR0FBRyxNQUFNLENBQUMsSUFBSSxDQUFDLGtCQUFLLEdBQUcsQ0FBQyxDQUFBO0FBQ3pDLFFBQUksV0FBVyxFQUFFOzs7QUFHZixjQUFRLENBQUMsSUFBSSxDQUFDLFdBQVcsQ0FBQyxDQUFBO0FBQzFCLFVBQUksV0FBVyxLQUFLLFdBQVcsRUFBRTtBQUMvQixjQUFLO09BQ047S0FDRjtBQUNELFVBQU0sQ0FBQyxHQUFHLEVBQUUsQ0FBQTtHQUNiO0FBQ0QsU0FBTyxRQUFRLENBQUE7Q0FDaEI7O0FBRU0sU0FBUyxtQkFBbUIsQ0FBQyxRQUFnQixFQUFFLFlBQTJCLEVBQWlCO0FBQ2hHLE1BQU0sbUJBQW1CLEdBQUcsWUFBWSxDQUFDLElBQUksQ0FBQyxVQUFBLENBQUM7V0FBSSxRQUFRLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQztHQUFBLENBQUMsQ0FBQTtBQUMxRSxNQUFJLENBQUMsbUJBQW1CLEVBQUU7QUFDeEIsV0FBTyxDQUFDLFFBQVEsQ0FBQyxDQUFBO0dBQ2xCO0FBQ0QsU0FBTyxTQUFTLENBQUMsUUFBUSxFQUFFLG1CQUFtQixDQUFDLENBQUE7Q0FDaEQ7O0FBRU0sU0FBUyxXQUFXLENBQUMsTUFBYyxFQUFFLFFBQWdCLEVBQUUsUUFBZ0IsRUFBUTtBQUNwRixNQUFJLENBQUMsTUFBTSxDQUFDLFFBQVEsQ0FBQyxFQUFFO0FBQ3JCLFVBQU0sQ0FBQyxRQUFRLENBQUMsR0FBRztBQUNqQixVQUFJLEVBQUUsS0FBSztBQUNYLFdBQUssRUFBRSxLQUFLO0FBQ1osYUFBTyxFQUFFLEtBQUs7S0FDZixDQUFBO0dBQ0Y7QUFDRCxRQUFNLENBQUMsUUFBUSxDQUFDLENBQUMsUUFBUSxDQUFDLEdBQUcsSUFBSSxDQUFBO0NBQ2xDOztBQUVNLFNBQVMsb0JBQW9CLENBQUMsa0JBQXFELEVBQUUsUUFBOEIsRUFBVTtBQUNsSSxNQUFNLFFBQVEsR0FBRyxFQUFFLENBQUE7QUFDbkIsTUFBTSxZQUEyQixHQUFHLElBQUksQ0FBQyxPQUFPLENBQUMsUUFBUSxFQUFFLENBQUE7QUFDM0QsVUFBUSxDQUFDLE9BQU8sQ0FBQyxVQUFTLE9BQU8sRUFBRTtBQUNqQyxRQUFNLFFBQVEsR0FBRyxvQkFBTSxPQUFPLENBQUMsQ0FBQTtBQUMvQixRQUFJLFFBQVEsRUFBRTtBQUNaLFVBQU0sTUFBTSxHQUFHLGtCQUFrQixLQUFLLE9BQU8sR0FBRyxDQUFDLFFBQVEsQ0FBQyxHQUFHLG1CQUFtQixDQUFDLFFBQVEsRUFBRSxZQUFZLENBQUMsQ0FBQTtBQUN4RyxZQUFNLENBQUMsT0FBTyxDQUFDLFVBQUEsS0FBSztlQUFJLFdBQVcsQ0FBQyxRQUFRLEVBQUUsS0FBSyxFQUFFLE9BQU8sQ0FBQyxRQUFRLENBQUM7T0FBQSxDQUFDLENBQUE7S0FDeEU7R0FDRixDQUFDLENBQUE7QUFDRixTQUFPLFFBQVEsQ0FBQTtDQUNoQiIsImZpbGUiOiIvaG9tZS9tYXJjdXMvLmF0b20vcGFja2FnZXMvbGludGVyLXVpLWRlZmF1bHQvbGliL3RyZWUtdmlldy9oZWxwZXJzLmpzIiwic291cmNlc0NvbnRlbnQiOlsiLyogQGZsb3cgKi9cblxuaW1wb3J0IFBhdGggZnJvbSAncGF0aCdcbmltcG9ydCB7ICRmaWxlIH0gZnJvbSAnLi4vaGVscGVycydcbmltcG9ydCB0eXBlIHsgTGludGVyTWVzc2FnZSB9IGZyb20gJy4uL3R5cGVzJ1xuXG5leHBvcnQgZnVuY3Rpb24gZ2V0Q2h1bmtzKGZpbGVQYXRoOiBzdHJpbmcsIHByb2plY3RQYXRoOiBzdHJpbmcpOiBBcnJheTxzdHJpbmc+IHtcbiAgY29uc3QgdG9SZXR1cm4gPSBbXVxuICBjb25zdCBjaHVua3MgPSBmaWxlUGF0aC5zcGxpdChQYXRoLnNlcClcbiAgd2hpbGUgKGNodW5rcy5sZW5ndGgpIHtcbiAgICBjb25zdCBjdXJyZW50UGF0aCA9IGNodW5rcy5qb2luKFBhdGguc2VwKVxuICAgIGlmIChjdXJyZW50UGF0aCkge1xuICAgICAgLy8gVGhpcyBpcyByZXF1aXJlZCBmb3Igd2hlbiB5b3Ugb3BlbiBmaWxlcyBvdXRzaWRlIG9mIHByb2plY3Qgd2luZG93XG4gICAgICAvLyBhbmQgdGhlIGxhc3QgZW50cnkgaXMgJycgYmVjYXVzZSB1bml4IHBhdGhzIHN0YXJ0IHdpdGggL1xuICAgICAgdG9SZXR1cm4ucHVzaChjdXJyZW50UGF0aClcbiAgICAgIGlmIChjdXJyZW50UGF0aCA9PT0gcHJvamVjdFBhdGgpIHtcbiAgICAgICAgYnJlYWtcbiAgICAgIH1cbiAgICB9XG4gICAgY2h1bmtzLnBvcCgpXG4gIH1cbiAgcmV0dXJuIHRvUmV0dXJuXG59XG5cbmV4cG9ydCBmdW5jdGlvbiBnZXRDaHVua3NCeVByb2plY3RzKGZpbGVQYXRoOiBzdHJpbmcsIHByb2plY3RQYXRoczogQXJyYXk8c3RyaW5nPik6IEFycmF5PHN0cmluZz4ge1xuICBjb25zdCBtYXRjaGluZ1Byb2plY3RQYXRoID0gcHJvamVjdFBhdGhzLmZpbmQocCA9PiBmaWxlUGF0aC5zdGFydHNXaXRoKHApKVxuICBpZiAoIW1hdGNoaW5nUHJvamVjdFBhdGgpIHtcbiAgICByZXR1cm4gW2ZpbGVQYXRoXVxuICB9XG4gIHJldHVybiBnZXRDaHVua3MoZmlsZVBhdGgsIG1hdGNoaW5nUHJvamVjdFBhdGgpXG59XG5cbmV4cG9ydCBmdW5jdGlvbiBtZXJnZUNoYW5nZShjaGFuZ2U6IE9iamVjdCwgZmlsZVBhdGg6IHN0cmluZywgc2V2ZXJpdHk6IHN0cmluZyk6IHZvaWQge1xuICBpZiAoIWNoYW5nZVtmaWxlUGF0aF0pIHtcbiAgICBjaGFuZ2VbZmlsZVBhdGhdID0ge1xuICAgICAgaW5mbzogZmFsc2UsXG4gICAgICBlcnJvcjogZmFsc2UsXG4gICAgICB3YXJuaW5nOiBmYWxzZSxcbiAgICB9XG4gIH1cbiAgY2hhbmdlW2ZpbGVQYXRoXVtzZXZlcml0eV0gPSB0cnVlXG59XG5cbmV4cG9ydCBmdW5jdGlvbiBjYWxjdWxhdGVEZWNvcmF0aW9ucyhkZWNvcmF0ZU9uVHJlZVZpZXc6ICdGaWxlcyBhbmQgRGlyZWN0b3JpZXMnIHwgJ0ZpbGVzJywgbWVzc2FnZXM6IEFycmF5PExpbnRlck1lc3NhZ2U+KTogT2JqZWN0IHtcbiAgY29uc3QgdG9SZXR1cm4gPSB7fVxuICBjb25zdCBwcm9qZWN0UGF0aHM6IEFycmF5PHN0cmluZz4gPSBhdG9tLnByb2plY3QuZ2V0UGF0aHMoKVxuICBtZXNzYWdlcy5mb3JFYWNoKGZ1bmN0aW9uKG1lc3NhZ2UpIHtcbiAgICBjb25zdCBmaWxlUGF0aCA9ICRmaWxlKG1lc3NhZ2UpXG4gICAgaWYgKGZpbGVQYXRoKSB7XG4gICAgICBjb25zdCBjaHVua3MgPSBkZWNvcmF0ZU9uVHJlZVZpZXcgPT09ICdGaWxlcycgPyBbZmlsZVBhdGhdIDogZ2V0Q2h1bmtzQnlQcm9qZWN0cyhmaWxlUGF0aCwgcHJvamVjdFBhdGhzKVxuICAgICAgY2h1bmtzLmZvckVhY2goY2h1bmsgPT4gbWVyZ2VDaGFuZ2UodG9SZXR1cm4sIGNodW5rLCBtZXNzYWdlLnNldmVyaXR5KSlcbiAgICB9XG4gIH0pXG4gIHJldHVybiB0b1JldHVyblxufVxuIl19