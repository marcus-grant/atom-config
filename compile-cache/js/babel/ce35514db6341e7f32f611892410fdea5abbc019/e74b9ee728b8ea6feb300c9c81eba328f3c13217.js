var _slicedToArray = (function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i['return']) _i['return'](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError('Invalid attempt to destructure non-iterable instance'); } }; })();

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj['default'] = obj; return newObj; } }

var _path = require('path');

var Path = _interopRequireWildcard(_path);

var _srcWorkerHelpers = require('../src/worker-helpers');

var Helpers = _interopRequireWildcard(_srcWorkerHelpers);

'use babel';

var getFixturesPath = function getFixturesPath(path) {
  return Path.join(__dirname, 'fixtures', path);
};

var globalNodePath = process.platform === 'win32' ? Path.join(getFixturesPath('global-eslint'), 'lib') : getFixturesPath('global-eslint');

describe('Worker Helpers', function () {
  describe('findESLintDirectory', function () {
    it('returns an object with path and type keys', function () {
      var modulesDir = Path.join(getFixturesPath('local-eslint'), 'node_modules');
      var foundEslint = Helpers.findESLintDirectory(modulesDir, {});
      expect(typeof foundEslint === 'object').toBe(true);
      expect(foundEslint.path).toBeDefined();
      expect(foundEslint.type).toBeDefined();
    });

    it('finds a local eslint when useGlobalEslint is false', function () {
      var modulesDir = Path.join(getFixturesPath('local-eslint'), 'node_modules');
      var foundEslint = Helpers.findESLintDirectory(modulesDir, { useGlobalEslint: false });
      var expectedEslintPath = Path.join(getFixturesPath('local-eslint'), 'node_modules', 'eslint');
      expect(foundEslint.path).toEqual(expectedEslintPath);
      expect(foundEslint.type).toEqual('local project');
    });

    it('does not find a local eslint when useGlobalEslint is true', function () {
      var modulesDir = Path.join(getFixturesPath('local-eslint'), 'node_modules');
      var config = { useGlobalEslint: true, globalNodePath: globalNodePath };
      var foundEslint = Helpers.findESLintDirectory(modulesDir, config);
      var expectedEslintPath = Path.join(getFixturesPath('local-eslint'), 'node_modules', 'eslint');
      expect(foundEslint.path).not.toEqual(expectedEslintPath);
      expect(foundEslint.type).not.toEqual('local project');
    });

    it('finds a global eslint when useGlobalEslint is true and a valid globalNodePath is provided', function () {
      var modulesDir = Path.join(getFixturesPath('local-eslint'), 'node_modules');
      var config = { useGlobalEslint: true, globalNodePath: globalNodePath };
      var foundEslint = Helpers.findESLintDirectory(modulesDir, config);
      var expectedEslintPath = process.platform === 'win32' ? Path.join(globalNodePath, 'node_modules', 'eslint') : Path.join(globalNodePath, 'lib', 'node_modules', 'eslint');
      expect(foundEslint.path).toEqual(expectedEslintPath);
      expect(foundEslint.type).toEqual('global');
    });

    it('falls back to the packaged eslint when no local eslint is found', function () {
      var modulesDir = 'not/a/real/path';
      var config = { useGlobalEslint: false };
      var foundEslint = Helpers.findESLintDirectory(modulesDir, config);
      var expectedBundledPath = Path.join(__dirname, '..', 'node_modules', 'eslint');
      expect(foundEslint.path).toEqual(expectedBundledPath);
      expect(foundEslint.type).toEqual('bundled fallback');
    });
  });

  describe('getESLintInstance && getESLintFromDirectory', function () {
    it('tries to find an indirect local eslint using an absolute path', function () {
      var path = Path.join(getFixturesPath('indirect-local-eslint'), 'testing', 'eslint', 'node_modules');
      var eslint = Helpers.getESLintInstance('', {
        useGlobalEslint: false,
        advancedLocalNodeModules: path
      });
      expect(eslint).toBe('located');
    });

    it('tries to find an indirect local eslint using a relative path', function () {
      var path = Path.join(getFixturesPath('indirect-local-eslint'), 'testing', 'eslint', 'node_modules');

      var _atom$project$relativizePath = atom.project.relativizePath(path);

      var _atom$project$relativizePath2 = _slicedToArray(_atom$project$relativizePath, 2);

      var projectPath = _atom$project$relativizePath2[0];
      var relativePath = _atom$project$relativizePath2[1];

      var eslint = Helpers.getESLintInstance('', {
        useGlobalEslint: false,
        advancedLocalNodeModules: relativePath
      }, projectPath);

      expect(eslint).toBe('located');
    });

    it('tries to find a local eslint', function () {
      var eslint = Helpers.getESLintInstance(getFixturesPath('local-eslint'), {});
      expect(eslint).toBe('located');
    });

    it('cries if local eslint is not found', function () {
      expect(function () {
        Helpers.getESLintInstance(getFixturesPath('files', {}));
      }).toThrow();
    });

    it('tries to find a global eslint if config is specified', function () {
      var eslint = Helpers.getESLintInstance(getFixturesPath('local-eslint'), {
        useGlobalEslint: true,
        globalNodePath: globalNodePath
      });
      expect(eslint).toBe('located');
    });

    it('cries if global eslint is not found', function () {
      expect(function () {
        Helpers.getESLintInstance(getFixturesPath('local-eslint'), {
          useGlobalEslint: true,
          globalNodePath: getFixturesPath('files')
        });
      }).toThrow();
    });

    it('tries to find a local eslint with nested node_modules', function () {
      var fileDir = Path.join(getFixturesPath('local-eslint'), 'lib', 'foo.js');
      var eslint = Helpers.getESLintInstance(fileDir, {});
      expect(eslint).toBe('located');
    });
  });

  describe('getConfigPath', function () {
    it('finds .eslintrc', function () {
      var fileDir = getFixturesPath(Path.join('configs', 'no-ext'));
      var expectedPath = Path.join(fileDir, '.eslintrc');
      expect(Helpers.getConfigPath(fileDir)).toBe(expectedPath);
    });

    it('finds .eslintrc.yaml', function () {
      var fileDir = getFixturesPath(Path.join('configs', 'yaml'));
      var expectedPath = Path.join(fileDir, '.eslintrc.yaml');
      expect(Helpers.getConfigPath(fileDir)).toBe(expectedPath);
    });

    it('finds .eslintrc.yml', function () {
      var fileDir = getFixturesPath(Path.join('configs', 'yml'));
      var expectedPath = Path.join(fileDir, '.eslintrc.yml');
      expect(Helpers.getConfigPath(fileDir)).toBe(expectedPath);
    });

    it('finds .eslintrc.js', function () {
      var fileDir = getFixturesPath(Path.join('configs', 'js'));
      var expectedPath = Path.join(fileDir, '.eslintrc.js');
      expect(Helpers.getConfigPath(fileDir)).toBe(expectedPath);
    });

    it('finds .eslintrc.json', function () {
      var fileDir = getFixturesPath(Path.join('configs', 'json'));
      var expectedPath = Path.join(fileDir, '.eslintrc.json');
      expect(Helpers.getConfigPath(fileDir)).toBe(expectedPath);
    });

    it('finds package.json with an eslintConfig property', function () {
      var fileDir = getFixturesPath(Path.join('configs', 'package-json'));
      var expectedPath = Path.join(fileDir, 'package.json');
      expect(Helpers.getConfigPath(fileDir)).toBe(expectedPath);
    });

    it('ignores package.json with no eslintConfig property', function () {
      var fileDir = getFixturesPath(Path.join('configs', 'package-json', 'nested'));
      var expectedPath = getFixturesPath(Path.join('configs', 'package-json', 'package.json'));
      expect(Helpers.getConfigPath(fileDir)).toBe(expectedPath);
    });
  });

  describe('getRelativePath', function () {
    it('return path relative of ignore file if found', function () {
      var fixtureDir = getFixturesPath('eslintignore');
      var fixtureFile = Path.join(fixtureDir, 'ignored.js');
      var relativePath = Helpers.getRelativePath(fixtureDir, fixtureFile, {});
      var expectedPath = Path.relative(Path.join(__dirname, '..'), fixtureFile);
      expect(relativePath).toBe(expectedPath);
    });

    it('does not return path relative to ignore file if config overrides it', function () {
      var fixtureDir = getFixturesPath('eslintignore');
      var fixtureFile = Path.join(fixtureDir, 'ignored.js');
      var relativePath = Helpers.getRelativePath(fixtureDir, fixtureFile, { disableEslintIgnore: true });
      expect(relativePath).toBe('ignored.js');
    });
  });
});
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9ob21lL21hcmN1cy8uYXRvbS9wYWNrYWdlcy9saW50ZXItZXNsaW50L3NwZWMvd29ya2VyLWhlbHBlcnMtc3BlYy5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7O29CQUVzQixNQUFNOztJQUFoQixJQUFJOztnQ0FDUyx1QkFBdUI7O0lBQXBDLE9BQU87O0FBSG5CLFdBQVcsQ0FBQTs7QUFLWCxJQUFNLGVBQWUsR0FBRyxTQUFsQixlQUFlLENBQUcsSUFBSTtTQUFJLElBQUksQ0FBQyxJQUFJLENBQUMsU0FBUyxFQUFFLFVBQVUsRUFBRSxJQUFJLENBQUM7Q0FBQSxDQUFBOztBQUd0RSxJQUFNLGNBQWMsR0FBRyxPQUFPLENBQUMsUUFBUSxLQUFLLE9BQU8sR0FDakQsSUFBSSxDQUFDLElBQUksQ0FBQyxlQUFlLENBQUMsZUFBZSxDQUFDLEVBQUUsS0FBSyxDQUFDLEdBQ2xELGVBQWUsQ0FBQyxlQUFlLENBQUMsQ0FBQTs7QUFFbEMsUUFBUSxDQUFDLGdCQUFnQixFQUFFLFlBQU07QUFDL0IsVUFBUSxDQUFDLHFCQUFxQixFQUFFLFlBQU07QUFDcEMsTUFBRSxDQUFDLDJDQUEyQyxFQUFFLFlBQU07QUFDcEQsVUFBTSxVQUFVLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBQyxlQUFlLENBQUMsY0FBYyxDQUFDLEVBQUUsY0FBYyxDQUFDLENBQUE7QUFDN0UsVUFBTSxXQUFXLEdBQUcsT0FBTyxDQUFDLG1CQUFtQixDQUFDLFVBQVUsRUFBRSxFQUFFLENBQUMsQ0FBQTtBQUMvRCxZQUFNLENBQUMsT0FBTyxXQUFXLEtBQUssUUFBUSxDQUFDLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFBO0FBQ2xELFlBQU0sQ0FBQyxXQUFXLENBQUMsSUFBSSxDQUFDLENBQUMsV0FBVyxFQUFFLENBQUE7QUFDdEMsWUFBTSxDQUFDLFdBQVcsQ0FBQyxJQUFJLENBQUMsQ0FBQyxXQUFXLEVBQUUsQ0FBQTtLQUN2QyxDQUFDLENBQUE7O0FBRUYsTUFBRSxDQUFD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QUFDOUUsVUFBTSxVQUFVLEdBQUcsZUFBZSxDQUFDLGNBQWMsQ0FBQyxDQUFBO0FBQ2xELFVBQU0sV0FBVyxHQUFHLElBQUksQ0FBQyxJQUFJLENBQUMsVUFBVSxFQUFFLFlBQVksQ0FBQyxDQUFBO0FBQ3ZELFVBQU0sWUFBWSxHQUNoQixPQUFPLENBQUMsZUFBZSxDQUFDLFVBQVUsRUFBRSxXQUFXLEVBQUUsRUFBRSxtQkFBbUIsRUFBRSxJQUFJLEVBQUUsQ0FBQyxDQUFBO0FBQ2pGLFlBQU0sQ0FBQyxZQUFZLENBQUMsQ0FBQyxJQUFJLENBQUMsWUFBWSxDQUFDLENBQUE7S0FDeEMsQ0FBQyxDQUFBO0dBQ0gsQ0FBQyxDQUFBO0NBQ0gsQ0FBQyxDQUFBIiwiZmlsZSI6Ii9ob21lL21hcmN1cy8uYXRvbS9wYWNrYWdlcy9saW50ZXItZXNsaW50L3NwZWMvd29ya2VyLWhlbHBlcnMtc3BlYy5qcyIsInNvdXJjZXNDb250ZW50IjpbIid1c2UgYmFiZWwnXG5cbmltcG9ydCAqIGFzIFBhdGggZnJvbSAncGF0aCdcbmltcG9ydCAqIGFzIEhlbHBlcnMgZnJvbSAnLi4vc3JjL3dvcmtlci1oZWxwZXJzJ1xuXG5jb25zdCBnZXRGaXh0dXJlc1BhdGggPSBwYXRoID0+IFBhdGguam9pbihfX2Rpcm5hbWUsICdmaXh0dXJlcycsIHBhdGgpXG5cblxuY29uc3QgZ2xvYmFsTm9kZVBhdGggPSBwcm9jZXNzLnBsYXRmb3JtID09PSAnd2luMzInID9cbiAgUGF0aC5qb2luKGdldEZpeHR1cmVzUGF0aCgnZ2xvYmFsLWVzbGludCcpLCAnbGliJykgOlxuICBnZXRGaXh0dXJlc1BhdGgoJ2dsb2JhbC1lc2xpbnQnKVxuXG5kZXNjcmliZSgnV29ya2VyIEhlbHBlcnMnLCAoKSA9PiB7XG4gIGRlc2NyaWJlKCdmaW5kRVNMaW50RGlyZWN0b3J5JywgKCkgPT4ge1xuICAgIGl0KCdyZXR1cm5zIGFuIG9iamVjdCB3aXRoIHBhdGggYW5kIHR5cGUga2V5cycsICgpID0+IHtcbiAgICAgIGNvbnN0IG1vZHVsZXNEaXIgPSBQYXRoLmpvaW4oZ2V0Rml4dHVyZXNQYXRoKCdsb2NhbC1lc2xpbnQnKSwgJ25vZGVfbW9kdWxlcycpXG4gICAgICBjb25zdCBmb3VuZEVzbGludCA9IEhlbHBlcnMuZmluZEVTTGludERpcmVjdG9yeShtb2R1bGVzRGlyLCB7fSlcbiAgICAgIGV4cGVjdCh0eXBlb2YgZm91bmRFc2xpbnQgPT09ICdvYmplY3QnKS50b0JlKHRydWUpXG4gICAgICBleHBlY3QoZm91bmRFc2xpbnQucGF0aCkudG9CZURlZmluZWQoKVxuICAgICAgZXhwZWN0KGZvdW5kRXNsaW50LnR5cGUpLnRvQmVEZWZpbmVkKClcbiAgICB9KVxuXG4gICAgaXQoJ2ZpbmRzIGEgbG9jYWwgZXNsaW50IHdoZW4gdXNlR2xvYmFsRXNsaW50IGlzIGZhbHNlJywgKCkgPT4ge1xuICAgICAgY29uc3QgbW9kdWxlc0RpciA9IFBhdGguam9pbihnZXRGaXh0dXJlc1BhdGgoJ2xvY2FsLWVzbGludCcpLCAnbm9kZV9tb2R1bGVzJylcbiAgICAgIGNvbnN0IGZvdW5kRXNsaW50ID0gSGVscGVycy5maW5kRVNMaW50RGlyZWN0b3J5KG1vZHVsZXNEaXIsIHsgdXNlR2xvYmFsRXNsaW50OiBmYWxzZSB9KVxuICAgICAgY29uc3QgZXhwZWN0ZWRFc2xpbnRQYXRoID0gUGF0aC5qb2luKGdldEZpeHR1cmVzUGF0aCgnbG9jYWwtZXNsaW50JyksICdub2RlX21vZHVsZXMnLCAnZXNsaW50JylcbiAgICAgIGV4cGVjdChmb3VuZEVzbGludC5wYXRoKS50b0VxdWFsKGV4cGVjdGVkRXNsaW50UGF0aClcbiAgICAgIGV4cGVjdChmb3VuZEVzbGludC50eXBlKS50b0VxdWFsKCdsb2NhbCBwcm9qZWN0JylcbiAgICB9KVxuXG4gICAgaXQoJ2RvZXMgbm90IGZpbmQgYSBsb2NhbCBlc2xpbnQgd2hlbiB1c2VHbG9iYWxFc2xpbnQgaXMgdHJ1ZScsICgpID0+IHtcbiAgICAgIGNvbnN0IG1vZHVsZXNEaXIgPSBQYXRoLmpvaW4oZ2V0Rml4dHVyZXNQYXRoKCdsb2NhbC1lc2xpbnQnKSwgJ25vZGVfbW9kdWxlcycpXG4gICAgICBjb25zdCBjb25maWcgPSB7IHVzZUdsb2JhbEVzbGludDogdHJ1ZSwgZ2xvYmFsTm9kZVBhdGggfVxuICAgICAgY29uc3QgZm91bmRFc2xpbnQgPSBIZWxwZXJzLmZpbmRFU0xpbnREaXJlY3RvcnkobW9kdWxlc0RpciwgY29uZmlnKVxuICAgICAgY29uc3QgZXhwZWN0ZWRFc2xpbnRQYXRoID0gUGF0aC5qb2luKGdldEZpeHR1cmVzUGF0aCgnbG9jYWwtZXNsaW50JyksICdub2RlX21vZHVsZXMnLCAnZXNsaW50JylcbiAgICAgIGV4cGVjdChmb3VuZEVzbGludC5wYXRoKS5ub3QudG9FcXVhbChleHBlY3RlZEVzbGludFBhdGgpXG4gICAgICBleHBlY3QoZm91bmRFc2xpbnQudHlwZSkubm90LnRvRXF1YWwoJ2xvY2FsIHByb2plY3QnKVxuICAgIH0pXG5cbiAgICBpdCgnZmluZHMgYSBnbG9iYWwgZXNsaW50IHdoZW4gdXNlR2xvYmFsRXNsaW50IGlzIHRydWUgYW5kIGEgdmFsaWQgZ2xvYmFsTm9kZVBhdGggaXMgcHJvdmlkZWQnLCAoKSA9PiB7XG4gICAgICBjb25zdCBtb2R1bGVzRGlyID0gUGF0aC5qb2luKGdldEZpeHR1cmVzUGF0aCgnbG9jYWwtZXNsaW50JyksICdub2RlX21vZHVsZXMnKVxuICAgICAgY29uc3QgY29uZmlnID0geyB1c2VHbG9iYWxFc2xpbnQ6IHRydWUsIGdsb2JhbE5vZGVQYXRoIH1cbiAgICAgIGNvbnN0IGZvdW5kRXNsaW50ID0gSGVscGVycy5maW5kRVNMaW50RGlyZWN0b3J5KG1vZHVsZXNEaXIsIGNvbmZpZylcbiAgICAgIGNvbnN0IGV4cGVjdGVkRXNsaW50UGF0aCA9IHByb2Nlc3MucGxhdGZvcm0gPT09ICd3aW4zMidcbiAgICAgICAgPyBQYXRoLmpvaW4oZ2xvYmFsTm9kZVBhdGgsICdub2RlX21vZHVsZXMnLCAnZXNsaW50JylcbiAgICAgICAgOiBQYXRoLmpvaW4oZ2xvYmFsTm9kZVBhdGgsICdsaWInLCAnbm9kZV9tb2R1bGVzJywgJ2VzbGludCcpXG4gICAgICBleHBlY3QoZm91bmRFc2xpbnQucGF0aCkudG9FcXVhbChleHBlY3RlZEVzbGludFBhdGgpXG4gICAgICBleHBlY3QoZm91bmRFc2xpbnQudHlwZSkudG9FcXVhbCgnZ2xvYmFsJylcbiAgICB9KVxuXG4gICAgaXQoJ2ZhbGxzIGJhY2sgdG8gdGhlIHBhY2thZ2VkIGVzbGludCB3aGVuIG5vIGxvY2FsIGVzbGludCBpcyBmb3VuZCcsICgpID0+IHtcbiAgICAgIGNvbnN0IG1vZHVsZXNEaXIgPSAnbm90L2EvcmVhbC9wYXRoJ1xuICAgICAgY29uc3QgY29uZmlnID0geyB1c2VHbG9iYWxFc2xpbnQ6IGZhbHNlIH1cbiAgICAgIGNvbnN0IGZvdW5kRXNsaW50ID0gSGVscGVycy5maW5kRVNMaW50RGlyZWN0b3J5KG1vZHVsZXNEaXIsIGNvbmZpZylcbiAgICAgIGNvbnN0IGV4cGVjdGVkQnVuZGxlZFBhdGggPSBQYXRoLmpvaW4oX19kaXJuYW1lLCAnLi4nLCAnbm9kZV9tb2R1bGVzJywgJ2VzbGludCcpXG4gICAgICBleHBlY3QoZm91bmRFc2xpbnQucGF0aCkudG9FcXVhbChleHBlY3RlZEJ1bmRsZWRQYXRoKVxuICAgICAgZXhwZWN0KGZvdW5kRXNsaW50LnR5cGUpLnRvRXF1YWwoJ2J1bmRsZWQgZmFsbGJhY2snKVxuICAgIH0pXG4gIH0pXG5cbiAgZGVzY3JpYmUoJ2dldEVTTGludEluc3RhbmNlICYmIGdldEVTTGludEZyb21EaXJlY3RvcnknLCAoKSA9PiB7XG4gICAgaXQoJ3RyaWVzIHRvIGZpbmQgYW4gaW5kaXJlY3QgbG9jYWwgZXNsaW50IHVzaW5nIGFuIGFic29sdXRlIHBhdGgnLCAoKSA9PiB7XG4gICAgICBjb25zdCBwYXRoID0gUGF0aC5qb2luKFxuICAgICAgICBnZXRGaXh0dXJlc1BhdGgoJ2luZGlyZWN0LWxvY2FsLWVzbGludCcpLCAndGVzdGluZycsICdlc2xpbnQnLCAnbm9kZV9tb2R1bGVzJylcbiAgICAgIGNvbnN0IGVzbGludCA9IEhlbHBlcnMuZ2V0RVNMaW50SW5zdGFuY2UoJycsIHtcbiAgICAgICAgdXNlR2xvYmFsRXNsaW50OiBmYWxzZSxcbiAgICAgICAgYWR2YW5jZWRMb2NhbE5vZGVNb2R1bGVzOiBwYXRoXG4gICAgICB9KVxuICAgICAgZXhwZWN0KGVzbGludCkudG9CZSgnbG9jYXRlZCcpXG4gICAgfSlcblxuICAgIGl0KCd0cmllcyB0byBmaW5kIGFuIGluZGlyZWN0IGxvY2FsIGVzbGludCB1c2luZyBhIHJlbGF0aXZlIHBhdGgnLCAoKSA9PiB7XG4gICAgICBjb25zdCBwYXRoID0gUGF0aC5qb2luKFxuICAgICAgICBnZXRGaXh0dXJlc1BhdGgoJ2luZGlyZWN0LWxvY2FsLWVzbGludCcpLCAndGVzdGluZycsICdlc2xpbnQnLCAnbm9kZV9tb2R1bGVzJylcbiAgICAgIGNvbnN0IFtwcm9qZWN0UGF0aCwgcmVsYXRpdmVQYXRoXSA9IGF0b20ucHJvamVjdC5yZWxhdGl2aXplUGF0aChwYXRoKVxuXG4gICAgICBjb25zdCBlc2xpbnQgPSBIZWxwZXJzLmdldEVTTGludEluc3RhbmNlKCcnLCB7XG4gICAgICAgIHVzZUdsb2JhbEVzbGludDogZmFsc2UsXG4gICAgICAgIGFkdmFuY2VkTG9jYWxOb2RlTW9kdWxlczogcmVsYXRpdmVQYXRoXG4gICAgICB9LCBwcm9qZWN0UGF0aClcblxuICAgICAgZXhwZWN0KGVzbGludCkudG9CZSgnbG9jYXRlZCcpXG4gICAgfSlcblxuICAgIGl0KCd0cmllcyB0byBmaW5kIGEgbG9jYWwgZXNsaW50JywgKCkgPT4ge1xuICAgICAgY29uc3QgZXNsaW50ID0gSGVscGVycy5nZXRFU0xpbnRJbnN0YW5jZShnZXRGaXh0dXJlc1BhdGgoJ2xvY2FsLWVzbGludCcpLCB7fSlcbiAgICAgIGV4cGVjdChlc2xpbnQpLnRvQmUoJ2xvY2F0ZWQnKVxuICAgIH0pXG5cbiAgICBpdCgnY3JpZXMgaWYgbG9jYWwgZXNsaW50IGlzIG5vdCBmb3VuZCcsICgpID0+IHtcbiAgICAgIGV4cGVjdCgoKSA9PiB7XG4gICAgICAgIEhlbHBlcnMuZ2V0RVNMaW50SW5zdGFuY2UoZ2V0Rml4dHVyZXNQYXRoKCdmaWxlcycsIHt9KSlcbiAgICAgIH0pLnRvVGhyb3coKVxuICAgIH0pXG5cbiAgICBpdCgndHJpZXMgdG8gZmluZCBhIGdsb2JhbCBlc2xpbnQgaWYgY29uZmlnIGlzIHNwZWNpZmllZCcsICgpID0+IHtcbiAgICAgIGNvbnN0IGVzbGludCA9IEhlbHBlcnMuZ2V0RVNMaW50SW5zdGFuY2UoZ2V0Rml4dHVyZXNQYXRoKCdsb2NhbC1lc2xpbnQnKSwge1xuICAgICAgICB1c2VHbG9iYWxFc2xpbnQ6IHRydWUsXG4gICAgICAgIGdsb2JhbE5vZGVQYXRoXG4gICAgICB9KVxuICAgICAgZXhwZWN0KGVzbGludCkudG9CZSgnbG9jYXRlZCcpXG4gICAgfSlcblxuICAgIGl0KCdjcmllcyBpZiBnbG9iYWwgZXNsaW50IGlzIG5vdCBmb3VuZCcsICgpID0+IHtcbiAgICAgIGV4cGVjdCgoKSA9PiB7XG4gICAgICAgIEhlbHBlcnMuZ2V0RVNMaW50SW5zdGFuY2UoZ2V0Rml4dHVyZXNQYXRoKCdsb2NhbC1lc2xpbnQnKSwge1xuICAgICAgICAgIHVzZUdsb2JhbEVzbGludDogdHJ1ZSxcbiAgICAgICAgICBnbG9iYWxOb2RlUGF0aDogZ2V0Rml4dHVyZXNQYXRoKCdmaWxlcycpXG4gICAgICAgIH0pXG4gICAgICB9KS50b1Rocm93KClcbiAgICB9KVxuXG4gICAgaXQoJ3RyaWVzIHRvIGZpbmQgYSBsb2NhbCBlc2xpbnQgd2l0aCBuZXN0ZWQgbm9kZV9tb2R1bGVzJywgKCkgPT4ge1xuICAgICAgY29uc3QgZmlsZURpciA9IFBhdGguam9pbihnZXRGaXh0dXJlc1BhdGgoJ2xvY2FsLWVzbGludCcpLCAnbGliJywgJ2Zvby5qcycpXG4gICAgICBjb25zdCBlc2xpbnQgPSBIZWxwZXJzLmdldEVTTGludEluc3RhbmNlKGZpbGVEaXIsIHt9KVxuICAgICAgZXhwZWN0KGVzbGludCkudG9CZSgnbG9jYXRlZCcpXG4gICAgfSlcbiAgfSlcblxuICBkZXNjcmliZSgnZ2V0Q29uZmlnUGF0aCcsICgpID0+IHtcbiAgICBpdCgnZmluZHMgLmVzbGludHJjJywgKCkgPT4ge1xuICAgICAgY29uc3QgZmlsZURpciA9IGdldEZpeHR1cmVzUGF0aChQYXRoLmpvaW4oJ2NvbmZpZ3MnLCAnbm8tZXh0JykpXG4gICAgICBjb25zdCBleHBlY3RlZFBhdGggPSBQYXRoLmpvaW4oZmlsZURpciwgJy5lc2xpbnRyYycpXG4gICAgICBleHBlY3QoSGVscGVycy5nZXRDb25maWdQYXRoKGZpbGVEaXIpKS50b0JlKGV4cGVjdGVkUGF0aClcbiAgICB9KVxuXG4gICAgaXQoJ2ZpbmRzIC5lc2xpbnRyYy55YW1sJywgKCkgPT4ge1xuICAgICAgY29uc3QgZmlsZURpciA9IGdldEZpeHR1cmVzUGF0aChQYXRoLmpvaW4oJ2NvbmZpZ3MnLCAneWFtbCcpKVxuICAgICAgY29uc3QgZXhwZWN0ZWRQYXRoID0gUGF0aC5qb2luKGZpbGVEaXIsICcuZXNsaW50cmMueWFtbCcpXG4gICAgICBleHBlY3QoSGVscGVycy5nZXRDb25maWdQYXRoKGZpbGVEaXIpKS50b0JlKGV4cGVjdGVkUGF0aClcbiAgICB9KVxuXG4gICAgaXQoJ2ZpbmRzIC5lc2xpbnRyYy55bWwnLCAoKSA9PiB7XG4gICAgICBjb25zdCBmaWxlRGlyID0gZ2V0Rml4dHVyZXNQYXRoKFBhdGguam9pbignY29uZmlncycsICd5bWwnKSlcbiAgICAgIGNvbnN0IGV4cGVjdGVkUGF0aCA9IFBhdGguam9pbihmaWxlRGlyLCAnLmVzbGludHJjLnltbCcpXG4gICAgICBleHBlY3QoSGVscGVycy5nZXRDb25maWdQYXRoKGZpbGVEaXIpKS50b0JlKGV4cGVjdGVkUGF0aClcbiAgICB9KVxuXG4gICAgaXQoJ2ZpbmRzIC5lc2xpbnRyYy5qcycsICgpID0+IHtcbiAgICAgIGNvbnN0IGZpbGVEaXIgPSBnZXRGaXh0dXJlc1BhdGgoUGF0aC5qb2luKCdjb25maWdzJywgJ2pzJykpXG4gICAgICBjb25zdCBleHBlY3RlZFBhdGggPSBQYXRoLmpvaW4oZmlsZURpciwgJy5lc2xpbnRyYy5qcycpXG4gICAgICBleHBlY3QoSGVscGVycy5nZXRDb25maWdQYXRoKGZpbGVEaXIpKS50b0JlKGV4cGVjdGVkUGF0aClcbiAgICB9KVxuXG4gICAgaXQoJ2ZpbmRzIC5lc2xpbnRyYy5qc29uJywgKCkgPT4ge1xuICAgICAgY29uc3QgZmlsZURpciA9IGdldEZpeHR1cmVzUGF0aChQYXRoLmpvaW4oJ2NvbmZpZ3MnLCAnanNvbicpKVxuICAgICAgY29uc3QgZXhwZWN0ZWRQYXRoID0gUGF0aC5qb2luKGZpbGVEaXIsICcuZXNsaW50cmMuanNvbicpXG4gICAgICBleHBlY3QoSGVscGVycy5nZXRDb25maWdQYXRoKGZpbGVEaXIpKS50b0JlKGV4cGVjdGVkUGF0aClcbiAgICB9KVxuXG4gICAgaXQoJ2ZpbmRzIHBhY2thZ2UuanNvbiB3aXRoIGFuIGVzbGludENvbmZpZyBwcm9wZXJ0eScsICgpID0+IHtcbiAgICAgIGNvbnN0IGZpbGVEaXIgPSBnZXRGaXh0dXJlc1BhdGgoUGF0aC5qb2luKCdjb25maWdzJywgJ3BhY2thZ2UtanNvbicpKVxuICAgICAgY29uc3QgZXhwZWN0ZWRQYXRoID0gUGF0aC5qb2luKGZpbGVEaXIsICdwYWNrYWdlLmpzb24nKVxuICAgICAgZXhwZWN0KEhlbHBlcnMuZ2V0Q29uZmlnUGF0aChmaWxlRGlyKSkudG9CZShleHBlY3RlZFBhdGgpXG4gICAgfSlcblxuICAgIGl0KCdpZ25vcmVzIHBhY2thZ2UuanNvbiB3aXRoIG5vIGVzbGludENvbmZpZyBwcm9wZXJ0eScsICgpID0+IHtcbiAgICAgIGNvbnN0IGZpbGVEaXIgPSBnZXRGaXh0dXJlc1BhdGgoUGF0aC5qb2luKCdjb25maWdzJywgJ3BhY2thZ2UtanNvbicsICduZXN0ZWQnKSlcbiAgICAgIGNvbnN0IGV4cGVjdGVkUGF0aCA9IGdldEZpeHR1cmVzUGF0aChQYXRoLmpvaW4oJ2NvbmZpZ3MnLCAncGFja2FnZS1qc29uJywgJ3BhY2thZ2UuanNvbicpKVxuICAgICAgZXhwZWN0KEhlbHBlcnMuZ2V0Q29uZmlnUGF0aChmaWxlRGlyKSkudG9CZShleHBlY3RlZFBhdGgpXG4gICAgfSlcbiAgfSlcblxuICBkZXNjcmliZSgnZ2V0UmVsYXRpdmVQYXRoJywgKCkgPT4ge1xuICAgIGl0KCdyZXR1cm4gcGF0aCByZWxhdGl2ZSBvZiBpZ25vcmUgZmlsZSBpZiBmb3VuZCcsICgpID0+IHtcbiAgICAgIGNvbnN0IGZpeHR1cmVEaXIgPSBnZXRGaXh0dXJlc1BhdGgoJ2VzbGludGlnbm9yZScpXG4gICAgICBjb25zdCBmaXh0dXJlRmlsZSA9IFBhdGguam9pbihmaXh0dXJlRGlyLCAnaWdub3JlZC5qcycpXG4gICAgICBjb25zdCByZWxhdGl2ZVBhdGggPSBIZWxwZXJzLmdldFJlbGF0aXZlUGF0aChmaXh0dXJlRGlyLCBmaXh0dXJlRmlsZSwge30pXG4gICAgICBjb25zdCBleHBlY3RlZFBhdGggPSBQYXRoLnJlbGF0aXZlKFBhdGguam9pbihfX2Rpcm5hbWUsICcuLicpLCBmaXh0dXJlRmlsZSlcbiAgICAgIGV4cGVjdChyZWxhdGl2ZVBhdGgpLnRvQmUoZXhwZWN0ZWRQYXRoKVxuICAgIH0pXG5cbiAgICBpdCgnZG9lcyBub3QgcmV0dXJuIHBhdGggcmVsYXRpdmUgdG8gaWdub3JlIGZpbGUgaWYgY29uZmlnIG92ZXJyaWRlcyBpdCcsICgpID0+IHtcbiAgICAgIGNvbnN0IGZpeHR1cmVEaXIgPSBnZXRGaXh0dXJlc1BhdGgoJ2VzbGludGlnbm9yZScpXG4gICAgICBjb25zdCBmaXh0dXJlRmlsZSA9IFBhdGguam9pbihmaXh0dXJlRGlyLCAnaWdub3JlZC5qcycpXG4gICAgICBjb25zdCByZWxhdGl2ZVBhdGggPVxuICAgICAgICBIZWxwZXJzLmdldFJlbGF0aXZlUGF0aChmaXh0dXJlRGlyLCBmaXh0dXJlRmlsZSwgeyBkaXNhYmxlRXNsaW50SWdub3JlOiB0cnVlIH0pXG4gICAgICBleHBlY3QocmVsYXRpdmVQYXRoKS50b0JlKCdpZ25vcmVkLmpzJylcbiAgICB9KVxuICB9KVxufSlcbiJdfQ==