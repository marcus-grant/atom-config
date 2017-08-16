(function() {
  var BufferedProcess, DESCRIPTION, ForkGistIdInputView, GitHubApi, PackageManager, REMOVE_KEYS, SyncSettings, _, fs, ref,
    hasProp = {}.hasOwnProperty;

  BufferedProcess = require('atom').BufferedProcess;

  fs = require('fs');

  _ = require('underscore-plus');

  ref = [], GitHubApi = ref[0], PackageManager = ref[1];

  ForkGistIdInputView = null;

  DESCRIPTION = 'Atom configuration storage operated by http://atom.io/packages/sync-settings';

  REMOVE_KEYS = ['sync-settings.gistId', 'sync-settings.personalAccessToken', 'sync-settings._analyticsUserId', 'sync-settings._lastBackupHash'];

  SyncSettings = {
    config: require('./config.coffee'),
    activate: function() {
      return setImmediate((function(_this) {
        return function() {
          var mandatorySettingsApplied;
          if (GitHubApi == null) {
            GitHubApi = require('github');
          }
          if (PackageManager == null) {
            PackageManager = require('./package-manager');
          }
          atom.commands.add('atom-workspace', "sync-settings:backup", function() {
            return _this.backup();
          });
          atom.commands.add('atom-workspace', "sync-settings:restore", function() {
            return _this.restore();
          });
          atom.commands.add('atom-workspace', "sync-settings:view-backup", function() {
            return _this.viewBackup();
          });
          atom.commands.add('atom-workspace', "sync-settings:check-backup", function() {
            return _this.checkForUpdate();
          });
          atom.commands.add('atom-workspace', "sync-settings:fork", function() {
            return _this.inputForkGistId();
          });
          mandatorySettingsApplied = _this.checkMandatorySettings();
          if (atom.config.get('sync-settings.checkForUpdatedBackup') && mandatorySettingsApplied) {
            return _this.checkForUpdate();
          }
        };
      })(this));
    },
    deactivate: function() {
      var ref1;
      return (ref1 = this.inputView) != null ? ref1.destroy() : void 0;
    },
    serialize: function() {},
    getGistId: function() {
      var gistId;
      gistId = atom.config.get('sync-settings.gistId');
      if (gistId) {
        gistId = gistId.trim();
      }
      return gistId;
    },
    getPersonalAccessToken: function() {
      var token;
      token = process.env.GITHUB_TOKEN || atom.config.get('sync-settings.personalAccessToken');
      if (token) {
        token = token.trim();
      }
      return token;
    },
    checkMandatorySettings: function() {
      var missingSettings;
      missingSettings = [];
      if (!this.getGistId()) {
        missingSettings.push("Gist ID");
      }
      if (!this.getPersonalAccessToken()) {
        missingSettings.push("GitHub personal access token");
      }
      if (missingSettings.length) {
        this.notifyMissingMandatorySettings(missingSettings);
      }
      return missingSettings.length === 0;
    },
    checkForUpdate: function(cb) {
      if (cb == null) {
        cb = null;
      }
      if (this.getGistId()) {
        console.debug('checking latest backup...');
        return this.createClient().gists.get({
          id: this.getGistId()
        }, (function(_this) {
          return function(err, res) {
            var SyntaxError, message, ref1, ref2;
            if (err) {
              console.error("error while retrieving the gist. does it exists?", err);
              try {
                message = JSON.parse(err.message).message;
                if (message === 'Not Found') {
                  message = 'Gist ID Not Found';
                }
              } catch (error1) {
                SyntaxError = error1;
                message = err.message;
              }
              atom.notifications.addError("sync-settings: Error retrieving your settings. (" + message + ")");
              return typeof cb === "function" ? cb() : void 0;
            }
            if ((res != null ? (ref1 = res.history) != null ? (ref2 = ref1[0]) != null ? ref2.version : void 0 : void 0 : void 0) == null) {
              console.error("could not interpret result:", res);
              atom.notifications.addError("sync-settings: Error retrieving your settings.");
              return typeof cb === "function" ? cb() : void 0;
            }
            console.debug("latest backup version " + res.history[0].version);
            if (res.history[0].version !== atom.config.get('sync-settings._lastBackupHash')) {
              _this.notifyNewerBackup();
            } else if (!atom.config.get('sync-settings.quietUpdateCheck')) {
              _this.notifyBackupUptodate();
            }
            return typeof cb === "function" ? cb() : void 0;
          };
        })(this));
      } else {
        return this.notifyMissingMandatorySettings(["Gist ID"]);
      }
    },
    notifyNewerBackup: function() {
      var notification, workspaceElement;
      workspaceElement = atom.views.getView(atom.workspace);
      return notification = atom.notifications.addWarning("sync-settings: Your settings are out of date.", {
        dismissable: true,
        buttons: [
          {
            text: "Backup",
            onDidClick: function() {
              atom.commands.dispatch(workspaceElement, "sync-settings:backup");
              return notification.dismiss();
            }
          }, {
            text: "View backup",
            onDidClick: function() {
              return atom.commands.dispatch(workspaceElement, "sync-settings:view-backup");
            }
          }, {
            text: "Restore",
            onDidClick: function() {
              atom.commands.dispatch(workspaceElement, "sync-settings:restore");
              return notification.dismiss();
            }
          }, {
            text: "Dismiss",
            onDidClick: function() {
              return notification.dismiss();
            }
          }
        ]
      });
    },
    notifyBackupUptodate: function() {
      return atom.notifications.addSuccess("sync-settings: Latest backup is already applied.");
    },
    notifyMissingMandatorySettings: function(missingSettings) {
      var context, errorMsg, notification;
      context = this;
      errorMsg = "sync-settings: Mandatory settings missing: " + missingSettings.join(', ');
      return notification = atom.notifications.addError(errorMsg, {
        dismissable: true,
        buttons: [
          {
            text: "Package settings",
            onDidClick: function() {
              context.goToPackageSettings();
              return notification.dismiss();
            }
          }
        ]
      });
    },
    backup: function(cb) {
      var cmtend, cmtstart, ext, file, files, initPath, j, len, path, ref1, ref2, ref3, ref4, ref5, ref6, ref7;
      if (cb == null) {
        cb = null;
      }
      files = {};
      if (atom.config.get('sync-settings.syncSettings')) {
        files["settings.json"] = {
          content: this.getFilteredSettings()
        };
      }
      if (atom.config.get('sync-settings.syncPackages')) {
        files["packages.json"] = {
          content: JSON.stringify(this.getPackages(), null, '\t')
        };
      }
      if (atom.config.get('sync-settings.syncKeymap')) {
        files["keymap.cson"] = {
          content: (ref1 = this.fileContent(atom.keymaps.getUserKeymapPath())) != null ? ref1 : "# keymap file (not found)"
        };
      }
      if (atom.config.get('sync-settings.syncStyles')) {
        files["styles.less"] = {
          content: (ref2 = this.fileContent(atom.styles.getUserStyleSheetPath())) != null ? ref2 : "// styles file (not found)"
        };
      }
      if (atom.config.get('sync-settings.syncInit')) {
        initPath = atom.getUserInitScriptPath();
        path = require('path');
        files[path.basename(initPath)] = {
          content: (ref3 = this.fileContent(initPath)) != null ? ref3 : "# initialization file (not found)"
        };
      }
      if (atom.config.get('sync-settings.syncSnippets')) {
        files["snippets.cson"] = {
          content: (ref4 = this.fileContent(atom.config.configDirPath + "/snippets.cson")) != null ? ref4 : "# snippets file (not found)"
        };
      }
      ref6 = (ref5 = atom.config.get('sync-settings.extraFiles')) != null ? ref5 : [];
      for (j = 0, len = ref6.length; j < len; j++) {
        file = ref6[j];
        ext = file.slice(file.lastIndexOf(".")).toLowerCase();
        cmtstart = "#";
        if (ext === ".less" || ext === ".scss" || ext === ".js") {
          cmtstart = "//";
        }
        if (ext === ".css") {
          cmtstart = "/*";
        }
        cmtend = "";
        if (ext === ".css") {
          cmtend = "*/";
        }
        files[file] = {
          content: (ref7 = this.fileContent(atom.config.configDirPath + ("/" + file))) != null ? ref7 : cmtstart + " " + file + " (not found) " + cmtend
        };
      }
      return this.createClient().gists.edit({
        id: this.getGistId(),
        description: atom.config.get('sync-settings.gistDescription'),
        files: files
      }, function(err, res) {
        var SyntaxError, message;
        if (err) {
          console.error("error backing up data: " + err.message, err);
          try {
            message = JSON.parse(err.message).message;
            if (message === 'Not Found') {
              message = 'Gist ID Not Found';
            }
          } catch (error1) {
            SyntaxError = error1;
            message = err.message;
          }
          atom.notifications.addError("sync-settings: Error backing up your settings. (" + message + ")");
        } else {
          atom.config.set('sync-settings._lastBackupHash', res.history[0].version);
          atom.notifications.addSuccess("sync-settings: Your settings were successfully backed up. <br/><a href='" + res.html_url + "'>Click here to open your Gist.</a>");
        }
        return typeof cb === "function" ? cb(err, res) : void 0;
      });
    },
    viewBackup: function() {
      var Shell, gistId;
      Shell = require('shell');
      gistId = this.getGistId();
      return Shell.openExternal("https://gist.github.com/" + gistId);
    },
    getPackages: function() {
      var apmInstallSource, i, metadata, name, packages, ref1, theme, version;
      packages = [];
      ref1 = this._getAvailablePackageMetadataWithoutDuplicates();
      for (i in ref1) {
        metadata = ref1[i];
        name = metadata.name, version = metadata.version, theme = metadata.theme, apmInstallSource = metadata.apmInstallSource;
        packages.push({
          name: name,
          version: version,
          theme: theme,
          apmInstallSource: apmInstallSource
        });
      }
      return _.sortBy(packages, 'name');
    },
    _getAvailablePackageMetadataWithoutDuplicates: function() {
      var i, j, len, package_metadata, packages, path, path2metadata, pkg_name, pkg_path, ref1, ref2;
      path2metadata = {};
      package_metadata = atom.packages.getAvailablePackageMetadata();
      ref1 = atom.packages.getAvailablePackagePaths();
      for (i = j = 0, len = ref1.length; j < len; i = ++j) {
        path = ref1[i];
        path2metadata[fs.realpathSync(path)] = package_metadata[i];
      }
      packages = [];
      ref2 = atom.packages.getAvailablePackageNames();
      for (i in ref2) {
        pkg_name = ref2[i];
        pkg_path = atom.packages.resolvePackagePath(pkg_name);
        if (path2metadata[pkg_path]) {
          packages.push(path2metadata[pkg_path]);
        } else {
          console.error('could not correlate package name, path, and metadata');
        }
      }
      return packages;
    },
    restore: function(cb) {
      if (cb == null) {
        cb = null;
      }
      return this.createClient().gists.get({
        id: this.getGistId()
      }, (function(_this) {
        return function(err, res) {
          var SyntaxError, callbackAsync, file, filename, message, ref1;
          if (err) {
            console.error("error while retrieving the gist. does it exists?", err);
            try {
              message = JSON.parse(err.message).message;
              if (message === 'Not Found') {
                message = 'Gist ID Not Found';
              }
            } catch (error1) {
              SyntaxError = error1;
              message = err.message;
            }
            atom.notifications.addError("sync-settings: Error retrieving your settings. (" + message + ")");
            return;
          }
          callbackAsync = false;
          ref1 = res.files;
          for (filename in ref1) {
            if (!hasProp.call(ref1, filename)) continue;
            file = ref1[filename];
            switch (filename) {
              case 'settings.json':
                if (atom.config.get('sync-settings.syncSettings')) {
                  _this.applySettings('', JSON.parse(file.content));
                }
                break;
              case 'packages.json':
                if (atom.config.get('sync-settings.syncPackages')) {
                  callbackAsync = true;
                  _this.installMissingPackages(JSON.parse(file.content), cb);
                  if (atom.config.get('sync-settings.removeObsoletePackage')) {
                    _this.removeObsoletePackages(JSON.parse(file.content), cb);
                  }
                }
                break;
              case 'keymap.cson':
                if (atom.config.get('sync-settings.syncKeymap')) {
                  fs.writeFileSync(atom.keymaps.getUserKeymapPath(), file.content);
                }
                break;
              case 'styles.less':
                if (atom.config.get('sync-settings.syncStyles')) {
                  fs.writeFileSync(atom.styles.getUserStyleSheetPath(), file.content);
                }
                break;
              case 'init.coffee':
                if (atom.config.get('sync-settings.syncInit')) {
                  fs.writeFileSync(atom.config.configDirPath + "/init.coffee", file.content);
                }
                break;
              case 'init.js':
                if (atom.config.get('sync-settings.syncInit')) {
                  fs.writeFileSync(atom.config.configDirPath + "/init.js", file.content);
                }
                break;
              case 'snippets.cson':
                if (atom.config.get('sync-settings.syncSnippets')) {
                  fs.writeFileSync(atom.config.configDirPath + "/snippets.cson", file.content);
                }
                break;
              default:
                fs.writeFileSync(atom.config.configDirPath + "/" + filename, file.content);
            }
          }
          atom.config.set('sync-settings._lastBackupHash', res.history[0].version);
          atom.notifications.addSuccess("sync-settings: Your settings were successfully synchronized.");
          if (!callbackAsync) {
            return typeof cb === "function" ? cb() : void 0;
          }
        };
      })(this));
    },
    createClient: function() {
      var github, token;
      token = this.getPersonalAccessToken();
      console.debug("Creating GitHubApi client with token = " + token);
      github = new GitHubApi({
        version: '3.0.0',
        protocol: 'https'
      });
      github.authenticate({
        type: 'oauth',
        token: token
      });
      return github;
    },
    getFilteredSettings: function() {
      var blacklistedKey, blacklistedKeys, j, len, ref1, settings;
      settings = JSON.parse(JSON.stringify(atom.config.settings));
      blacklistedKeys = REMOVE_KEYS.concat((ref1 = atom.config.get('sync-settings.blacklistedKeys')) != null ? ref1 : []);
      for (j = 0, len = blacklistedKeys.length; j < len; j++) {
        blacklistedKey = blacklistedKeys[j];
        blacklistedKey = blacklistedKey.split(".");
        this._removeProperty(settings, blacklistedKey);
      }
      return JSON.stringify(settings, null, '\t');
    },
    _removeProperty: function(obj, key) {
      var currentKey, lastKey;
      lastKey = key.length === 1;
      currentKey = key.shift();
      if (!lastKey && _.isObject(obj[currentKey]) && !_.isArray(obj[currentKey])) {
        return this._removeProperty(obj[currentKey], key);
      } else {
        return delete obj[currentKey];
      }
    },
    goToPackageSettings: function() {
      return atom.workspace.open("atom://config/packages/sync-settings");
    },
    applySettings: function(pref, settings) {
      var colorKeys, isColor, key, keyPath, results, value, valueKeys;
      results = [];
      for (key in settings) {
        value = settings[key];
        keyPath = pref + "." + key;
        isColor = false;
        if (_.isObject(value)) {
          valueKeys = Object.keys(value);
          colorKeys = ['alpha', 'blue', 'green', 'red'];
          isColor = _.isEqual(_.sortBy(valueKeys), colorKeys);
        }
        if (_.isObject(value) && !_.isArray(value) && !isColor) {
          results.push(this.applySettings(keyPath, value));
        } else {
          console.debug("config.set " + keyPath.slice(1) + "=" + value);
          results.push(atom.config.set(keyPath.slice(1), value));
        }
      }
      return results;
    },
    removeObsoletePackages: function(remaining_packages, cb) {
      var concurrency, failed, i, installed_packages, j, k, keep_installed_package, len, notifications, obsolete_packages, p, pkg, ref1, removeNextPackage, results, succeeded;
      installed_packages = this.getPackages();
      obsolete_packages = [];
      for (j = 0, len = installed_packages.length; j < len; j++) {
        pkg = installed_packages[j];
        keep_installed_package = (function() {
          var k, len1, results;
          results = [];
          for (k = 0, len1 = remaining_packages.length; k < len1; k++) {
            p = remaining_packages[k];
            if (p.name === pkg.name) {
              results.push(p);
            }
          }
          return results;
        })();
        if (keep_installed_package.length === 0) {
          obsolete_packages.push(pkg);
        }
      }
      if (obsolete_packages.length === 0) {
        atom.notifications.addInfo("Sync-settings: no packages to remove");
        return typeof cb === "function" ? cb() : void 0;
      }
      notifications = {};
      succeeded = [];
      failed = [];
      removeNextPackage = (function(_this) {
        return function() {
          var count, failedStr, i;
          if (obsolete_packages.length > 0) {
            pkg = obsolete_packages.shift();
            i = succeeded.length + failed.length + Object.keys(notifications).length + 1;
            count = i + obsolete_packages.length;
            notifications[pkg.name] = atom.notifications.addInfo("Sync-settings: removing " + pkg.name + " (" + i + "/" + count + ")", {
              dismissable: true
            });
            return (function(pkg) {
              return _this.removePackage(pkg, function(error) {
                notifications[pkg.name].dismiss();
                delete notifications[pkg.name];
                if (error != null) {
                  failed.push(pkg.name);
                  atom.notifications.addWarning("Sync-settings: failed to remove " + pkg.name);
                } else {
                  succeeded.push(pkg.name);
                }
                return removeNextPackage();
              });
            })(pkg);
          } else if (Object.keys(notifications).length === 0) {
            if (failed.length === 0) {
              atom.notifications.addSuccess("Sync-settings: finished removing " + succeeded.length + " packages");
            } else {
              failed.sort();
              failedStr = failed.join(', ');
              atom.notifications.addWarning("Sync-settings: finished removing packages (" + failed.length + " failed: " + failedStr + ")", {
                dismissable: true
              });
            }
            return typeof cb === "function" ? cb() : void 0;
          }
        };
      })(this);
      concurrency = Math.min(obsolete_packages.length, 8);
      results = [];
      for (i = k = 0, ref1 = concurrency; 0 <= ref1 ? k < ref1 : k > ref1; i = 0 <= ref1 ? ++k : --k) {
        results.push(removeNextPackage());
      }
      return results;
    },
    removePackage: function(pack, cb) {
      var packageManager, type;
      type = pack.theme ? 'theme' : 'package';
      console.info("Removing " + type + " " + pack.name + "...");
      packageManager = new PackageManager();
      return packageManager.uninstall(pack, function(error) {
        var ref1;
        if (error != null) {
          console.error("Removing " + type + " " + pack.name + " failed", (ref1 = error.stack) != null ? ref1 : error, error.stderr);
        } else {
          console.info("Removing " + type + " " + pack.name);
        }
        return typeof cb === "function" ? cb(error) : void 0;
      });
    },
    installMissingPackages: function(packages, cb) {
      var available_package, available_packages, concurrency, failed, i, installNextPackage, j, k, len, missing_packages, notifications, p, pkg, ref1, results, succeeded;
      available_packages = this.getPackages();
      missing_packages = [];
      for (j = 0, len = packages.length; j < len; j++) {
        pkg = packages[j];
        available_package = (function() {
          var k, len1, results;
          results = [];
          for (k = 0, len1 = available_packages.length; k < len1; k++) {
            p = available_packages[k];
            if (p.name === pkg.name) {
              results.push(p);
            }
          }
          return results;
        })();
        if (available_package.length === 0) {
          missing_packages.push(pkg);
        } else if (!(!!pkg.apmInstallSource === !!available_package[0].apmInstallSource)) {
          missing_packages.push(pkg);
        }
      }
      if (missing_packages.length === 0) {
        atom.notifications.addInfo("Sync-settings: no packages to install");
        return typeof cb === "function" ? cb() : void 0;
      }
      notifications = {};
      succeeded = [];
      failed = [];
      installNextPackage = (function(_this) {
        return function() {
          var count, failedStr, i;
          if (missing_packages.length > 0) {
            pkg = missing_packages.shift();
            i = succeeded.length + failed.length + Object.keys(notifications).length + 1;
            count = i + missing_packages.length;
            notifications[pkg.name] = atom.notifications.addInfo("Sync-settings: installing " + pkg.name + " (" + i + "/" + count + ")", {
              dismissable: true
            });
            return (function(pkg) {
              return _this.installPackage(pkg, function(error) {
                notifications[pkg.name].dismiss();
                delete notifications[pkg.name];
                if (error != null) {
                  failed.push(pkg.name);
                  atom.notifications.addWarning("Sync-settings: failed to install " + pkg.name);
                } else {
                  succeeded.push(pkg.name);
                }
                return installNextPackage();
              });
            })(pkg);
          } else if (Object.keys(notifications).length === 0) {
            if (failed.length === 0) {
              atom.notifications.addSuccess("Sync-settings: finished installing " + succeeded.length + " packages");
            } else {
              failed.sort();
              failedStr = failed.join(', ');
              atom.notifications.addWarning("Sync-settings: finished installing packages (" + failed.length + " failed: " + failedStr + ")", {
                dismissable: true
              });
            }
            return typeof cb === "function" ? cb() : void 0;
          }
        };
      })(this);
      concurrency = Math.min(missing_packages.length, 8);
      results = [];
      for (i = k = 0, ref1 = concurrency; 0 <= ref1 ? k < ref1 : k > ref1; i = 0 <= ref1 ? ++k : --k) {
        results.push(installNextPackage());
      }
      return results;
    },
    installPackage: function(pack, cb) {
      var packageManager, type;
      type = pack.theme ? 'theme' : 'package';
      console.info("Installing " + type + " " + pack.name + "...");
      packageManager = new PackageManager();
      return packageManager.install(pack, function(error) {
        var ref1;
        if (error != null) {
          console.error("Installing " + type + " " + pack.name + " failed", (ref1 = error.stack) != null ? ref1 : error, error.stderr);
        } else {
          console.info("Installed " + type + " " + pack.name);
        }
        return typeof cb === "function" ? cb(error) : void 0;
      });
    },
    fileContent: function(filePath) {
      var e;
      try {
        return fs.readFileSync(filePath, {
          encoding: 'utf8'
        }) || null;
      } catch (error1) {
        e = error1;
        console.error("Error reading file " + filePath + ". Probably doesn't exist.", e);
        return null;
      }
    },
    inputForkGistId: function() {
      if (ForkGistIdInputView == null) {
        ForkGistIdInputView = require('./fork-gistid-input-view');
      }
      this.inputView = new ForkGistIdInputView();
      return this.inputView.setCallbackInstance(this);
    },
    forkGistId: function(forkId) {
      return this.createClient().gists.fork({
        id: forkId
      }, function(err, res) {
        var SyntaxError, message;
        if (err) {
          try {
            message = JSON.parse(err.message).message;
            if (message === "Not Found") {
              message = "Gist ID Not Found";
            }
          } catch (error1) {
            SyntaxError = error1;
            message = err.message;
          }
          atom.notifications.addError("sync-settings: Error forking settings. (" + message + ")");
          return typeof cb === "function" ? cb() : void 0;
        }
        if (res.id) {
          atom.config.set("sync-settings.gistId", res.id);
          atom.notifications.addSuccess("sync-settings: Forked successfully to the new Gist ID " + res.id + " which has been saved to your config.");
        } else {
          atom.notifications.addError("sync-settings: Error forking settings");
        }
        return typeof cb === "function" ? cb() : void 0;
      });
    }
  };

  module.exports = SyncSettings;

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL2hvbWUvbWFyY3VzLy5hdG9tL3BhY2thZ2VzL3N5bmMtc2V0dGluZ3MvbGliL3N5bmMtc2V0dGluZ3MuY29mZmVlIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUNBO0FBQUEsTUFBQSxtSEFBQTtJQUFBOztFQUFDLGtCQUFtQixPQUFBLENBQVEsTUFBUjs7RUFDcEIsRUFBQSxHQUFLLE9BQUEsQ0FBUSxJQUFSOztFQUNMLENBQUEsR0FBSSxPQUFBLENBQVEsaUJBQVI7O0VBQ0osTUFBOEIsRUFBOUIsRUFBQyxrQkFBRCxFQUFZOztFQUNaLG1CQUFBLEdBQXNCOztFQUd0QixXQUFBLEdBQWM7O0VBQ2QsV0FBQSxHQUFjLENBQ1osc0JBRFksRUFFWixtQ0FGWSxFQUdaLGdDQUhZLEVBSVosK0JBSlk7O0VBT2QsWUFBQSxHQUNFO0lBQUEsTUFBQSxFQUFRLE9BQUEsQ0FBUSxpQkFBUixDQUFSO0lBRUEsUUFBQSxFQUFVLFNBQUE7YUFFUixZQUFBLENBQWEsQ0FBQSxTQUFBLEtBQUE7ZUFBQSxTQUFBO0FBRVgsY0FBQTs7WUFBQSxZQUFhLE9BQUEsQ0FBUSxRQUFSOzs7WUFDYixpQkFBa0IsT0FBQSxDQUFRLG1CQUFSOztVQUVsQixJQUFJLENBQUMsUUFBUSxDQUFDLEdBQWQsQ0FBa0IsZ0JBQWxCLEVBQW9DLHNCQUFwQyxFQUE0RCxTQUFBO21CQUMxRCxLQUFDLENBQUEsTUFBRCxDQUFBO1VBRDBELENBQTVEO1VBRUEsSUFBSSxDQUFDLFFBQVEsQ0FBQyxHQUFkLENBQWtCLGdCQUFsQixFQUFvQyx1QkFBcEMsRUFBNkQsU0FBQTttQkFDM0QsS0FBQyxDQUFBLE9BQUQsQ0FBQTtVQUQyRCxDQUE3RDtVQUVBLElBQUksQ0FBQyxRQUFRLENBQUMsR0FBZCxDQUFrQixnQkFBbEIsRUFBb0MsMkJBQXBDLEVBQWlFLFNBQUE7bUJBQy9ELEtBQUMsQ0FBQSxVQUFELENBQUE7VUFEK0QsQ0FBakU7VUFFQSxJQUFJLENB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QW5CLENBQThCLHdEQUFBLEdBQTJELEdBQUcsQ0FBQyxFQUEvRCxHQUFvRSx1Q0FBbEcsRUFGRjtTQUFBLE1BQUE7VUFJRSxJQUFJLENBQUMsYUFBYSxDQUFDLFFBQW5CLENBQTRCLHVDQUE1QixFQUpGOzswQ0FNQTtNQWhCQSxDQUZGO0lBRFUsQ0F4YVo7OztFQTZiRixNQUFNLENBQUMsT0FBUCxHQUFpQjtBQTdjakIiLCJzb3VyY2VzQ29udGVudCI6WyIjIGltcG9ydHNcbntCdWZmZXJlZFByb2Nlc3N9ID0gcmVxdWlyZSAnYXRvbSdcbmZzID0gcmVxdWlyZSAnZnMnXG5fID0gcmVxdWlyZSAndW5kZXJzY29yZS1wbHVzJ1xuW0dpdEh1YkFwaSwgUGFja2FnZU1hbmFnZXJdID0gW11cbkZvcmtHaXN0SWRJbnB1dFZpZXcgPSBudWxsXG5cbiMgY29uc3RhbnRzXG5ERVNDUklQVElPTiA9ICdBdG9tIGNvbmZpZ3VyYXRpb24gc3RvcmFnZSBvcGVyYXRlZCBieSBodHRwOi8vYXRvbS5pby9wYWNrYWdlcy9zeW5jLXNldHRpbmdzJ1xuUkVNT1ZFX0tFWVMgPSBbXG4gICdzeW5jLXNldHRpbmdzLmdpc3RJZCcsXG4gICdzeW5jLXNldHRpbmdzLnBlcnNvbmFsQWNjZXNzVG9rZW4nLFxuICAnc3luYy1zZXR0aW5ncy5fYW5hbHl0aWNzVXNlcklkJywgICMga2VlcCBsZWdhY3kga2V5IGluIGJsYWNrbGlzdFxuICAnc3luYy1zZXR0aW5ncy5fbGFzdEJhY2t1cEhhc2gnLFxuXVxuXG5TeW5jU2V0dGluZ3MgPVxuICBjb25maWc6IHJlcXVpcmUoJy4vY29uZmlnLmNvZmZlZScpXG5cbiAgYWN0aXZhdGU6IC0+XG4gICAgIyBzcGVlZHVwIGFjdGl2YXRpb24gYnkgYXN5bmMgaW5pdGlhbGl6aW5nXG4gICAgc2V0SW1tZWRpYXRlID0+XG4gICAgICAjIGFjdHVhbCBpbml0aWFsaXphdGlvbiBhZnRlciBhdG9tIGhhcyBsb2FkZWRcbiAgICAgIEdpdEh1YkFwaSA/PSByZXF1aXJlICdnaXRodWInXG4gICAgICBQYWNrYWdlTWFuYWdlciA/PSByZXF1aXJlICcuL3BhY2thZ2UtbWFuYWdlcidcblxuICAgICAgYXRvbS5jb21tYW5kcy5hZGQgJ2F0b20td29ya3NwYWNlJywgXCJzeW5jLXNldHRpbmdzOmJhY2t1cFwiLCA9PlxuICAgICAgICBAYmFja3VwKClcbiAgICAgIGF0b20uY29tbWFuZHMuYWRkICdhdG9tLXdvcmtzcGFjZScsIFwic3luYy1zZXR0aW5nczpyZXN0b3JlXCIsID0+XG4gICAgICAgIEByZXN0b3JlKClcbiAgICAgIGF0b20uY29tbWFuZHMuYWRkICdhdG9tLXdvcmtzcGFjZScsIFwic3luYy1zZXR0aW5nczp2aWV3LWJhY2t1cFwiLCA9PlxuICAgICAgICBAdmlld0JhY2t1cCgpXG4gICAgICBhdG9tLmNvbW1hbmRzLmFkZCAnYXRvbS13b3Jrc3BhY2UnLCBcInN5bmMtc2V0dGluZ3M6Y2hlY2stYmFja3VwXCIsID0+XG4gICAgICAgIEBjaGVja0ZvclVwZGF0ZSgpXG4gICAgICBhdG9tLmNvbW1hbmRzLmFkZCAnYXRvbS13b3Jrc3BhY2UnLCBcInN5bmMtc2V0dGluZ3M6Zm9ya1wiLCA9PlxuICAgICAgICBAaW5wdXRGb3JrR2lzdElkKClcblxuICAgICAgbWFuZGF0b3J5U2V0dGluZ3NBcHBsaWVkID0gQGNoZWNrTWFuZGF0b3J5U2V0dGluZ3MoKVxuICAgICAgQGNoZWNrRm9yVXBkYXRlKCkgaWYgYXRvbS5jb25maWcuZ2V0KCdzeW5jLXNldHRpbmdzLmNoZWNrRm9yVXBkYXRlZEJhY2t1cCcpIGFuZCBtYW5kYXRvcnlTZXR0aW5nc0FwcGxpZWRcblxuICBkZWFjdGl2YXRlOiAtPlxuICAgIEBpbnB1dFZpZXc/LmRlc3Ryb3koKVxuXG4gIHNlcmlhbGl6ZTogLT5cblxuICBnZXRHaXN0SWQ6IC0+XG4gICAgZ2lzdElkID0gYXRvbS5jb25maWcuZ2V0ICdzeW5jLXNldHRpbmdzLmdpc3RJZCdcbiAgICBpZiBnaXN0SWRcbiAgICAgIGdpc3RJZCA9IGdpc3RJZC50cmltKClcbiAgICByZXR1cm4gZ2lzdElkXG5cbiAgZ2V0UGVyc29uYWxBY2Nlc3NUb2tlbjogLT5cbiAgICB0b2tlbiA9IHByb2Nlc3MuZW52LkdJVEhVQl9UT0tFTiBvciBhdG9tLmNvbmZpZy5nZXQgJ3N5bmMtc2V0dGluZ3MucGVyc29uYWxBY2Nlc3NUb2tlbidcbiAgICBpZiB0b2tlblxuICAgICAgdG9rZW4gPSB0b2tlbi50cmltKClcbiAgICByZXR1cm4gdG9rZW5cblxuICBjaGVja01hbmRhdG9yeVNldHRpbmdzOiAtPlxuICAgIG1pc3NpbmdTZXR0aW5ncyA9IFtdXG4gICAgaWYgbm90IEBnZXRHaXN0SWQoKVxuICAgICAgbWlzc2luZ1NldHRpbmdzLnB1c2goXCJHaXN0IElEXCIpXG4gICAgaWYgbm90IEBnZXRQZXJzb25hbEFjY2Vzc1Rva2VuKClcbiAgICAgIG1pc3NpbmdTZXR0aW5ncy5wdXNoKFwiR2l0SHViIHBlcnNvbmFsIGFjY2VzcyB0b2tlblwiKVxuICAgIGlmIG1pc3NpbmdTZXR0aW5ncy5sZW5ndGhcbiAgICAgIEBub3RpZnlNaXNzaW5nTWFuZGF0b3J5U2V0dGluZ3MobWlzc2luZ1NldHRpbmdzKVxuICAgIHJldHVybiBtaXNzaW5nU2V0dGluZ3MubGVuZ3RoIGlzIDBcblxuICBjaGVja0ZvclVwZGF0ZTogKGNiPW51bGwpIC0+XG4gICAgaWYgQGdldEdpc3RJZCgpXG4gICAgICBjb25zb2xlLmRlYnVnKCdjaGVja2luZyBsYXRlc3QgYmFja3VwLi4uJylcbiAgICAgIEBjcmVhdGVDbGllbnQoKS5naXN0cy5nZXRcbiAgICAgICAgaWQ6IEBnZXRHaXN0SWQoKVxuICAgICAgLCAoZXJyLCByZXMpID0+XG4gICAgICAgIGlmIGVyclxuICAgICAgICAgIGNvbnNvbGUuZXJyb3IgXCJlcnJvciB3aGlsZSByZXRyaWV2aW5nIHRoZSBnaXN0LiBkb2VzIGl0IGV4aXN0cz9cIiwgZXJyXG4gICAgICAgICAgdHJ5XG4gICAgICAgICAgICBtZXNzYWdlID0gSlNPTi5wYXJzZShlcnIubWVzc2FnZSkubWVzc2FnZVxuICAgICAgICAgICAgbWVzc2FnZSA9ICdHaXN0IElEIE5vdCBGb3VuZCcgaWYgbWVzc2FnZSBpcyAnTm90IEZvdW5kJ1xuICAgICAgICAgIGNhdGNoIFN5bnRheEVycm9yXG4gICAgICAgICAgICBtZXNzYWdlID0gZXJyLm1lc3NhZ2VcbiAgICAgICAgICBhdG9tLm5vdGlmaWNhdGlvbnMuYWRkRXJyb3IgXCJzeW5jLXNldHRpbmdzOiBFcnJvciByZXRyaWV2aW5nIHlvdXIgc2V0dGluZ3MuIChcIittZXNzYWdlK1wiKVwiXG4gICAgICAgICAgcmV0dXJuIGNiPygpXG5cbiAgICAgICAgaWYgbm90IHJlcz8uaGlzdG9yeT9bMF0/LnZlcnNpb24/XG4gICAgICAgICAgY29uc29sZS5lcnJvciBcImNvdWxkIG5vdCBpbnRlcnByZXQgcmVzdWx0OlwiLCByZXNcbiAgICAgICAgICBhdG9tLm5vdGlmaWNhdGlvbnMuYWRkRXJyb3IgXCJzeW5jLXNldHRpbmdzOiBFcnJvciByZXRyaWV2aW5nIHlvdXIgc2V0dGluZ3MuXCJcbiAgICAgICAgICByZXR1cm4gY2I/KClcblxuICAgICAgICBjb25zb2xlLmRlYnVnKFwibGF0ZXN0IGJhY2t1cCB2ZXJzaW9uICN7cmVzLmhpc3RvcnlbMF0udmVyc2lvbn1cIilcbiAgICAgICAgaWYgcmVzLmhpc3RvcnlbMF0udmVyc2lvbiBpc250IGF0b20uY29uZmlnLmdldCgnc3luYy1zZXR0aW5ncy5fbGFzdEJhY2t1cEhhc2gnKVxuICAgICAgICAgIEBub3RpZnlOZXdlckJhY2t1cCgpXG4gICAgICAgIGVsc2UgaWYgbm90IGF0b20uY29uZmlnLmdldCgnc3luYy1zZXR0aW5ncy5xdWlldFVwZGF0ZUNoZWNrJylcbiAgICAgICAgICBAbm90aWZ5QmFja3VwVXB0b2RhdGUoKVxuXG4gICAgICAgIGNiPygpXG4gICAgZWxzZVxuICAgICAgQG5vdGlmeU1pc3NpbmdNYW5kYXRvcnlTZXR0aW5ncyhbXCJHaXN0IElEXCJdKVxuXG4gIG5vdGlmeU5ld2VyQmFja3VwOiAtPlxuICAgICMgd2UgbmVlZCB0aGUgYWN0dWFsIGVsZW1lbnQgZm9yIGRpc3BhdGNoaW5nIG9uIGl0XG4gICAgd29ya3NwYWNlRWxlbWVudCA9IGF0b20udmlld3MuZ2V0VmlldyhhdG9tLndvcmtzcGFjZSlcbiAgICBub3RpZmljYXRpb24gPSBhdG9tLm5vdGlmaWNhdGlvbnMuYWRkV2FybmluZyBcInN5bmMtc2V0dGluZ3M6IFlvdXIgc2V0dGluZ3MgYXJlIG91dCBvZiBkYXRlLlwiLFxuICAgICAgZGlzbWlzc2FibGU6IHRydWVcbiAgICAgIGJ1dHRvbnM6IFt7XG4gICAgICAgIHRleHQ6IFwiQmFja3VwXCJcbiAgICAgICAgb25EaWRDbGljazogLT5cbiAgICAgICAgICBhdG9tLmNvbW1hbmRzLmRpc3BhdGNoIHdvcmtzcGFjZUVsZW1lbnQsIFwic3luYy1zZXR0aW5nczpiYWNrdXBcIlxuICAgICAgICAgIG5vdGlmaWNhdGlvbi5kaXNtaXNzKClcbiAgICAgIH0sIHtcbiAgICAgICAgdGV4dDogXCJWaWV3IGJhY2t1cFwiXG4gICAgICAgIG9uRGlkQ2xpY2s6IC0+XG4gICAgICAgICAgYXRvbS5jb21tYW5kcy5kaXNwYXRjaCB3b3Jrc3BhY2VFbGVtZW50LCBcInN5bmMtc2V0dGluZ3M6dmlldy1iYWNrdXBcIlxuICAgICAgfSwge1xuICAgICAgICB0ZXh0OiBcIlJlc3RvcmVcIlxuICAgICAgICBvbkRpZENsaWNrOiAtPlxuICAgICAgICAgIGF0b20uY29tbWFuZHMuZGlzcGF0Y2ggd29ya3NwYWNlRWxlbWVudCwgXCJzeW5jLXNldHRpbmdzOnJlc3RvcmVcIlxuICAgICAgICAgIG5vdGlmaWNhdGlvbi5kaXNtaXNzKClcbiAgICAgIH0sIHtcbiAgICAgICAgdGV4dDogXCJEaXNtaXNzXCJcbiAgICAgICAgb25EaWRDbGljazogLT4gbm90aWZpY2F0aW9uLmRpc21pc3MoKVxuICAgICAgfV1cblxuICBub3RpZnlCYWNrdXBVcHRvZGF0ZTogLT5cbiAgICBhdG9tLm5vdGlmaWNhdGlvbnMuYWRkU3VjY2VzcyBcInN5bmMtc2V0dGluZ3M6IExhdGVzdCBiYWNrdXAgaXMgYWxyZWFkeSBhcHBsaWVkLlwiXG5cblxuICBub3RpZnlNaXNzaW5nTWFuZGF0b3J5U2V0dGluZ3M6IChtaXNzaW5nU2V0dGluZ3MpIC0+XG4gICAgY29udGV4dCA9IHRoaXNcbiAgICBlcnJvck1zZyA9IFwic3luYy1zZXR0aW5nczogTWFuZGF0b3J5IHNldHRpbmdzIG1pc3Npbmc6IFwiICsgbWlzc2luZ1NldHRpbmdzLmpvaW4oJywgJylcblxuICAgIG5vdGlmaWNhdGlvbiA9IGF0b20ubm90aWZpY2F0aW9ucy5hZGRFcnJvciBlcnJvck1zZyxcbiAgICAgIGRpc21pc3NhYmxlOiB0cnVlXG4gICAgICBidXR0b25zOiBbe1xuICAgICAgICB0ZXh0OiBcIlBhY2thZ2Ugc2V0dGluZ3NcIlxuICAgICAgICBvbkRpZENsaWNrOiAtPlxuICAgICAgICAgICAgY29udGV4dC5nb1RvUGFja2FnZVNldHRpbmdzKClcbiAgICAgICAgICAgIG5vdGlmaWNhdGlvbi5kaXNtaXNzKClcbiAgICAgIH1dXG5cbiAgYmFja3VwOiAoY2I9bnVsbCkgLT5cbiAgICBmaWxlcyA9IHt9XG4gICAgaWYgYXRvbS5jb25maWcuZ2V0KCdzeW5jLXNldHRpbmdzLnN5bmNTZXR0aW5ncycpXG4gICAgICBmaWxlc1tcInNldHRpbmdzLmpzb25cIl0gPSBjb250ZW50OiBAZ2V0RmlsdGVyZWRTZXR0aW5ncygpXG4gICAgaWYgYXRvbS5jb25maWcuZ2V0KCdzeW5jLXNldHRpbmdzLnN5bmNQYWNrYWdlcycpXG4gICAgICBmaWxlc1tcInBhY2thZ2VzLmpzb25cIl0gPSBjb250ZW50OiBKU09OLnN0cmluZ2lmeShAZ2V0UGFja2FnZXMoKSwgbnVsbCwgJ1xcdCcpXG4gICAgaWYgYXRvbS5jb25maWcuZ2V0KCdzeW5jLXNldHRpbmdzLnN5bmNLZXltYXAnKVxuICAgICAgZmlsZXNbXCJrZXltYXAuY3NvblwiXSA9IGNvbnRlbnQ6IChAZmlsZUNvbnRlbnQgYXRvbS5rZXltYXBzLmdldFVzZXJLZXltYXBQYXRoKCkpID8gXCIjIGtleW1hcCBmaWxlIChub3QgZm91bmQpXCJcbiAgICBpZiBhdG9tLmNvbmZpZy5nZXQoJ3N5bmMtc2V0dGluZ3Muc3luY1N0eWxlcycpXG4gICAgICBmaWxlc1tcInN0eWxlcy5sZXNzXCJdID0gY29udGVudDogKEBmaWxlQ29udGVudCBhdG9tLnN0eWxlcy5nZXRVc2VyU3R5bGVTaGVldFBhdGgoKSkgPyBcIi8vIHN0eWxlcyBmaWxlIChub3QgZm91bmQpXCJcbiAgICBpZiBhdG9tLmNvbmZpZy5nZXQoJ3N5bmMtc2V0dGluZ3Muc3luY0luaXQnKVxuICAgICAgaW5pdFBhdGggPSBhdG9tLmdldFVzZXJJbml0U2NyaXB0UGF0aCgpXG4gICAgICBwYXRoID0gcmVxdWlyZSgncGF0aCcpXG4gICAgICBmaWxlc1twYXRoLmJhc2VuYW1lKGluaXRQYXRoKV0gPSBjb250ZW50OiAoQGZpbGVDb250ZW50IGluaXRQYXRoKSA/IFwiIyBpbml0aWFsaXphdGlvbiBmaWxlIChub3QgZm91bmQpXCJcbiAgICBpZiBhdG9tLmNvbmZpZy5nZXQoJ3N5bmMtc2V0dGluZ3Muc3luY1NuaXBwZXRzJylcbiAgICAgIGZpbGVzW1wic25pcHBldHMuY3NvblwiXSA9IGNvbnRlbnQ6IChAZmlsZUNvbnRlbnQgYXRvbS5jb25maWcuY29uZmlnRGlyUGF0aCArIFwiL3NuaXBwZXRzLmNzb25cIikgPyBcIiMgc25pcHBldHMgZmlsZSAobm90IGZvdW5kKVwiXG5cbiAgICBmb3IgZmlsZSBpbiBhdG9tLmNvbmZpZy5nZXQoJ3N5bmMtc2V0dGluZ3MuZXh0cmFGaWxlcycpID8gW11cbiAgICAgIGV4dCA9IGZpbGUuc2xpY2UoZmlsZS5sYXN0SW5kZXhPZihcIi5cIikpLnRvTG93ZXJDYXNlKClcbiAgICAgIGNtdHN0YXJ0ID0gXCIjXCJcbiAgICAgIGNtdHN0YXJ0ID0gXCIvL1wiIGlmIGV4dCBpbiBbXCIubGVzc1wiLCBcIi5zY3NzXCIsIFwiLmpzXCJdXG4gICAgICBjbXRzdGFydCA9IFwiLypcIiBpZiBleHQgaW4gW1wiLmNzc1wiXVxuICAgICAgY210ZW5kID0gXCJcIlxuICAgICAgY210ZW5kID0gXCIqL1wiIGlmIGV4dCBpbiBbXCIuY3NzXCJdXG4gICAgICBmaWxlc1tmaWxlXSA9XG4gICAgICAgIGNvbnRlbnQ6IChAZmlsZUNvbnRlbnQgYXRvbS5jb25maWcuY29uZmlnRGlyUGF0aCArIFwiLyN7ZmlsZX1cIikgPyBcIiN7Y210c3RhcnR9ICN7ZmlsZX0gKG5vdCBmb3VuZCkgI3tjbXRlbmR9XCJcblxuICAgIEBjcmVhdGVDbGllbnQoKS5naXN0cy5lZGl0XG4gICAgICBpZDogQGdldEdpc3RJZCgpXG4gICAgICBkZXNjcmlwdGlvbjogYXRvbS5jb25maWcuZ2V0ICdzeW5jLXNldHRpbmdzLmdpc3REZXNjcmlwdGlvbidcbiAgICAgIGZpbGVzOiBmaWxlc1xuICAgICwgKGVyciwgcmVzKSAtPlxuICAgICAgaWYgZXJyXG4gICAgICAgIGNvbnNvbGUuZXJyb3IgXCJlcnJvciBiYWNraW5nIHVwIGRhdGE6IFwiK2Vyci5tZXNzYWdlLCBlcnJcbiAgICAgICAgdHJ5XG4gICAgICAgICAgbWVzc2FnZSA9IEpTT04ucGFyc2UoZXJyLm1lc3NhZ2UpLm1lc3NhZ2VcbiAgICAgICAgICBtZXNzYWdlID0gJ0dpc3QgSUQgTm90IEZvdW5kJyBpZiBtZXNzYWdlIGlzICdOb3QgRm91bmQnXG4gICAgICAgIGNhdGNoIFN5bnRheEVycm9yXG4gICAgICAgICAgbWVzc2FnZSA9IGVyci5tZXNzYWdlXG4gICAgICAgIGF0b20ubm90aWZpY2F0aW9ucy5hZGRFcnJvciBcInN5bmMtc2V0dGluZ3M6IEVycm9yIGJhY2tpbmcgdXAgeW91ciBzZXR0aW5ncy4gKFwiK21lc3NhZ2UrXCIpXCJcbiAgICAgIGVsc2VcbiAgICAgICAgYXRvbS5jb25maWcuc2V0KCdzeW5jLXNldHRpbmdzLl9sYXN0QmFja3VwSGFzaCcsIHJlcy5oaXN0b3J5WzBdLnZlcnNpb24pXG4gICAgICAgIGF0b20ubm90aWZpY2F0aW9ucy5hZGRTdWNjZXNzIFwic3luYy1zZXR0aW5nczogWW91ciBzZXR0aW5ncyB3ZXJlIHN1Y2Nlc3NmdWxseSBiYWNrZWQgdXAuIDxici8+PGEgaHJlZj0nXCIrcmVzLmh0bWxfdXJsK1wiJz5DbGljayBoZXJlIHRvIG9wZW4geW91ciBHaXN0LjwvYT5cIlxuICAgICAgY2I/KGVyciwgcmVzKVxuXG4gIHZpZXdCYWNrdXA6IC0+XG4gICAgU2hlbGwgPSByZXF1aXJlICdzaGVsbCdcbiAgICBnaXN0SWQgPSBAZ2V0R2lzdElkKClcbiAgICBTaGVsbC5vcGVuRXh0ZXJuYWwgXCJodHRwczovL2dpc3QuZ2l0aHViLmNvbS8je2dpc3RJZH1cIlxuXG4gIGdldFBhY2thZ2VzOiAtPlxuICAgIHBhY2thZ2VzID0gW11cbiAgICBmb3IgaSwgbWV0YWRhdGEgb2YgQF9nZXRBdmFpbGFibGVQYWNrYWdlTWV0YWRhdGFXaXRob3V0RHVwbGljYXRlcygpXG4gICAgICB7bmFtZSwgdmVyc2lvbiwgdGhlbWUsIGFwbUluc3RhbGxTb3VyY2V9ID0gbWV0YWRhdGFcbiAgICAgIHBhY2thZ2VzLnB1c2goe25hbWUsIHZlcnNpb24sIHRoZW1lLCBhcG1JbnN0YWxsU291cmNlfSlcbiAgICBfLnNvcnRCeShwYWNrYWdlcywgJ25hbWUnKVxuXG4gIF9nZXRBdmFpbGFibGVQYWNrYWdlTWV0YWRhdGFXaXRob3V0RHVwbGljYXRlczogLT5cbiAgICBwYXRoMm1ldGFkYXRhID0ge31cbiAgICBwYWNrYWdlX21ldGFkYXRhID0gYXRvbS5wYWNrYWdlcy5nZXRBdmFpbGFibGVQYWNrYWdlTWV0YWRhdGEoKVxuICAgIGZvciBwYXRoLCBpIGluIGF0b20ucGFja2FnZXMuZ2V0QXZhaWxhYmxlUGFja2FnZVBhdGhzKClcbiAgICAgIHBhdGgybWV0YWRhdGFbZnMucmVhbHBhdGhTeW5jKHBhdGgpXSA9IHBhY2thZ2VfbWV0YWRhdGFbaV1cblxuICAgIHBhY2thZ2VzID0gW11cbiAgICBmb3IgaSwgcGtnX25hbWUgb2YgYXRvbS5wYWNrYWdlcy5nZXRBdmFpbGFibGVQYWNrYWdlTmFtZXMoKVxuICAgICAgcGtnX3BhdGggPSBhdG9tLnBhY2thZ2VzLnJlc29sdmVQYWNrYWdlUGF0aChwa2dfbmFtZSlcbiAgICAgIGlmIHBhdGgybWV0YWRhdGFbcGtnX3BhdGhdXG4gICAgICAgIHBhY2thZ2VzLnB1c2gocGF0aDJtZXRhZGF0YVtwa2dfcGF0aF0pXG4gICAgICBlbHNlXG4gICAgICAgIGNvbnNvbGUuZXJyb3IoJ2NvdWxkIG5vdCBjb3JyZWxhdGUgcGFja2FnZSBuYW1lLCBwYXRoLCBhbmQgbWV0YWRhdGEnKVxuICAgIHBhY2thZ2VzXG5cbiAgcmVzdG9yZTogKGNiPW51bGwpIC0+XG4gICAgQGNyZWF0ZUNsaWVudCgpLmdpc3RzLmdldFxuICAgICAgaWQ6IEBnZXRHaXN0SWQoKVxuICAgICwgKGVyciwgcmVzKSA9PlxuICAgICAgaWYgZXJyXG4gICAgICAgIGNvbnNvbGUuZXJyb3IgXCJlcnJvciB3aGlsZSByZXRyaWV2aW5nIHRoZSBnaXN0LiBkb2VzIGl0IGV4aXN0cz9cIiwgZXJyXG4gICAgICAgIHRyeVxuICAgICAgICAgIG1lc3NhZ2UgPSBKU09OLnBhcnNlKGVyci5tZXNzYWdlKS5tZXNzYWdlXG4gICAgICAgICAgbWVzc2FnZSA9ICdHaXN0IElEIE5vdCBGb3VuZCcgaWYgbWVzc2FnZSBpcyAnTm90IEZvdW5kJ1xuICAgICAgICBjYXRjaCBTeW50YXhFcnJvclxuICAgICAgICAgIG1lc3NhZ2UgPSBlcnIubWVzc2FnZVxuICAgICAgICBhdG9tLm5vdGlmaWNhdGlvbnMuYWRkRXJyb3IgXCJzeW5jLXNldHRpbmdzOiBFcnJvciByZXRyaWV2aW5nIHlvdXIgc2V0dGluZ3MuIChcIittZXNzYWdlK1wiKVwiXG4gICAgICAgIHJldHVyblxuXG4gICAgICBjYWxsYmFja0FzeW5jID0gZmFsc2VcblxuICAgICAgZm9yIG93biBmaWxlbmFtZSwgZmlsZSBvZiByZXMuZmlsZXNcbiAgICAgICAgc3dpdGNoIGZpbGVuYW1lXG4gICAgICAgICAgd2hlbiAnc2V0dGluZ3MuanNvbidcbiAgICAgICAgICAgIEBhcHBseVNldHRpbmdzICcnLCBKU09OLnBhcnNlKGZpbGUuY29udGVudCkgaWYgYXRvbS5jb25maWcuZ2V0KCdzeW5jLXNldHRpbmdzLnN5bmNTZXR0aW5ncycpXG5cbiAgICAgICAgICB3aGVuICdwYWNrYWdlcy5qc29uJ1xuICAgICAgICAgICAgaWYgYXRvbS5jb25maWcuZ2V0KCdzeW5jLXNldHRpbmdzLnN5bmNQYWNrYWdlcycpXG4gICAgICAgICAgICAgIGNhbGxiYWNrQXN5bmMgPSB0cnVlXG4gICAgICAgICAgICAgIEBpbnN0YWxsTWlzc2luZ1BhY2thZ2VzIEpTT04ucGFyc2UoZmlsZS5jb250ZW50KSwgY2JcbiAgICAgICAgICAgICAgaWYgYXRvbS5jb25maWcuZ2V0KCdzeW5jLXNldHRpbmdzLnJlbW92ZU9ic29sZXRlUGFja2FnZScpXG4gICAgICAgICAgICAgICAgQHJlbW92ZU9ic29sZXRlUGFja2FnZXMgSlNPTi5wYXJzZShmaWxlLmNvbnRlbnQpLCBjYlxuXG4gICAgICAgICAgd2hlbiAna2V5bWFwLmNzb24nXG4gICAgICAgICAgICBmcy53cml0ZUZpbGVTeW5jIGF0b20ua2V5bWFwcy5nZXRVc2VyS2V5bWFwUGF0aCgpLCBmaWxlLmNvbnRlbnQgaWYgYXRvbS5jb25maWcuZ2V0KCdzeW5jLXNldHRpbmdzLnN5bmNLZXltYXAnKVxuXG4gICAgICAgICAgd2hlbiAnc3R5bGVzLmxlc3MnXG4gICAgICAgICAgICBmcy53cml0ZUZpbGVTeW5jIGF0b20uc3R5bGVzLmdldFVzZXJTdHlsZVNoZWV0UGF0aCgpLCBmaWxlLmNvbnRlbnQgaWYgYXRvbS5jb25maWcuZ2V0KCdzeW5jLXNldHRpbmdzLnN5bmNTdHlsZXMnKVxuXG4gICAgICAgICAgd2hlbiAnaW5pdC5jb2ZmZWUnXG4gICAgICAgICAgICBmcy53cml0ZUZpbGVTeW5jIGF0b20uY29uZmlnLmNvbmZpZ0RpclBhdGggKyBcIi9pbml0LmNvZmZlZVwiLCBmaWxlLmNvbnRlbnQgaWYgYXRvbS5jb25maWcuZ2V0KCdzeW5jLXNldHRpbmdzLnN5bmNJbml0JylcblxuICAgICAgICAgIHdoZW4gJ2luaXQuanMnXG4gICAgICAgICAgICBmcy53cml0ZUZpbGVTeW5jIGF0b20uY29uZmlnLmNvbmZpZ0RpclBhdGggKyBcIi9pbml0LmpzXCIsIGZpbGUuY29udGVudCBpZiBhdG9tLmNvbmZpZy5nZXQoJ3N5bmMtc2V0dGluZ3Muc3luY0luaXQnKVxuXG4gICAgICAgICAgd2hlbiAnc25pcHBldHMuY3NvbidcbiAgICAgICAgICAgIGZzLndyaXRlRmlsZVN5bmMgYXRvbS5jb25maWcuY29uZmlnRGlyUGF0aCArIFwiL3NuaXBwZXRzLmNzb25cIiwgZmlsZS5jb250ZW50IGlmIGF0b20uY29uZmlnLmdldCgnc3luYy1zZXR0aW5ncy5zeW5jU25pcHBldHMnKVxuXG4gICAgICAgICAgZWxzZSBmcy53cml0ZUZpbGVTeW5jIFwiI3thdG9tLmNvbmZpZy5jb25maWdEaXJQYXRofS8je2ZpbGVuYW1lfVwiLCBmaWxlLmNvbnRlbnRcblxuICAgICAgYXRvbS5jb25maWcuc2V0KCdzeW5jLXNldHRpbmdzLl9sYXN0QmFja3VwSGFzaCcsIHJlcy5oaXN0b3J5WzBdLnZlcnNpb24pXG5cbiAgICAgIGF0b20ubm90aWZpY2F0aW9ucy5hZGRTdWNjZXNzIFwic3luYy1zZXR0aW5nczogWW91ciBzZXR0aW5ncyB3ZXJlIHN1Y2Nlc3NmdWxseSBzeW5jaHJvbml6ZWQuXCJcblxuICAgICAgY2I/KCkgdW5sZXNzIGNhbGxiYWNrQXN5bmNcblxuICBjcmVhdGVDbGllbnQ6IC0+XG4gICAgdG9rZW4gPSBAZ2V0UGVyc29uYWxBY2Nlc3NUb2tlbigpXG4gICAgY29uc29sZS5kZWJ1ZyBcIkNyZWF0aW5nIEdpdEh1YkFwaSBjbGllbnQgd2l0aCB0b2tlbiA9ICN7dG9rZW59XCJcbiAgICBnaXRodWIgPSBuZXcgR2l0SHViQXBpXG4gICAgICB2ZXJzaW9uOiAnMy4wLjAnXG4gICAgICAjIGRlYnVnOiB0cnVlXG4gICAgICBwcm90b2NvbDogJ2h0dHBzJ1xuICAgIGdpdGh1Yi5hdXRoZW50aWNhdGVcbiAgICAgIHR5cGU6ICdvYXV0aCdcbiAgICAgIHRva2VuOiB0b2tlblxuICAgIGdpdGh1YlxuXG4gIGdldEZpbHRlcmVkU2V0dGluZ3M6IC0+XG4gICAgIyBfLmNsb25lKCkgZG9lc24ndCBkZWVwIGNsb25lIHRodXMgd2UgYXJlIHVzaW5nIEpTT04gcGFyc2UgdHJpY2tcbiAgICBzZXR0aW5ncyA9IEpTT04ucGFyc2UoSlNPTi5zdHJpbmdpZnkoYXRvbS5jb25maWcuc2V0dGluZ3MpKVxuICAgIGJsYWNrbGlzdGVkS2V5cyA9IFJFTU9WRV9LRVlTLmNvbmNhdChhdG9tLmNvbmZpZy5nZXQoJ3N5bmMtc2V0dGluZ3MuYmxhY2tsaXN0ZWRLZXlzJykgPyBbXSlcbiAgICBmb3IgYmxhY2tsaXN0ZWRLZXkgaW4gYmxhY2tsaXN0ZWRLZXlzXG4gICAgICBibGFja2xpc3RlZEtleSA9IGJsYWNrbGlzdGVkS2V5LnNwbGl0KFwiLlwiKVxuICAgICAgQF9yZW1vdmVQcm9wZXJ0eShzZXR0aW5ncywgYmxhY2tsaXN0ZWRLZXkpXG4gICAgcmV0dXJuIEpTT04uc3RyaW5naWZ5KHNldHRpbmdzLCBudWxsLCAnXFx0JylcblxuICBfcmVtb3ZlUHJvcGVydHk6IChvYmosIGtleSkgLT5cbiAgICBsYXN0S2V5ID0ga2V5Lmxlbmd0aCBpcyAxXG4gICAgY3VycmVudEtleSA9IGtleS5zaGlmdCgpXG5cbiAgICBpZiBub3QgbGFzdEtleSBhbmQgXy5pc09iamVjdChvYmpbY3VycmVudEtleV0pIGFuZCBub3QgXy5pc0FycmF5KG9ialtjdXJyZW50S2V5XSlcbiAgICAgIEBfcmVtb3ZlUHJvcGVydHkob2JqW2N1cnJlbnRLZXldLCBrZXkpXG4gICAgZWxzZVxuICAgICAgZGVsZXRlIG9ialtjdXJyZW50S2V5XVxuXG4gIGdvVG9QYWNrYWdlU2V0dGluZ3M6IC0+XG4gICAgYXRvbS53b3Jrc3BhY2Uub3BlbihcImF0b206Ly9jb25maWcvcGFja2FnZXMvc3luYy1zZXR0aW5nc1wiKVxuXG4gIGFwcGx5U2V0dGluZ3M6IChwcmVmLCBzZXR0aW5ncykgLT5cbiAgICBmb3Iga2V5LCB2YWx1ZSBvZiBzZXR0aW5nc1xuICAgICAga2V5UGF0aCA9IFwiI3twcmVmfS4je2tleX1cIlxuICAgICAgaXNDb2xvciA9IGZhbHNlXG4gICAgICBpZiBfLmlzT2JqZWN0KHZhbHVlKVxuICAgICAgICB2YWx1ZUtleXMgPSBPYmplY3Qua2V5cyh2YWx1ZSlcbiAgICAgICAgY29sb3JLZXlzID0gWydhbHBoYScsICdibHVlJywgJ2dyZWVuJywgJ3JlZCddXG4gICAgICAgIGlzQ29sb3IgPSBfLmlzRXF1YWwoXy5zb3J0QnkodmFsdWVLZXlzKSwgY29sb3JLZXlzKVxuICAgICAgaWYgXy5pc09iamVjdCh2YWx1ZSkgYW5kIG5vdCBfLmlzQXJyYXkodmFsdWUpIGFuZCBub3QgaXNDb2xvclxuICAgICAgICBAYXBwbHlTZXR0aW5ncyBrZXlQYXRoLCB2YWx1ZVxuICAgICAgZWxzZVxuICAgICAgICBjb25zb2xlLmRlYnVnIFwiY29uZmlnLnNldCAje2tleVBhdGhbMS4uLl19PSN7dmFsdWV9XCJcbiAgICAgICAgYXRvbS5jb25maWcuc2V0IGtleVBhdGhbMS4uLl0sIHZhbHVlXG5cbiAgcmVtb3ZlT2Jzb2xldGVQYWNrYWdlczogKHJlbWFpbmluZ19wYWNrYWdlcywgY2IpIC0+XG4gICAgaW5zdGFsbGVkX3BhY2thZ2VzID0gQGdldFBhY2thZ2VzKClcbiAgICBvYnNvbGV0ZV9wYWNrYWdlcyA9IFtdXG4gICAgZm9yIHBrZyBpbiBpbnN0YWxsZWRfcGFja2FnZXNcbiAgICAgIGtlZXBfaW5zdGFsbGVkX3BhY2thZ2UgPSAocCBmb3IgcCBpbiByZW1haW5pbmdfcGFja2FnZXMgd2hlbiBwLm5hbWUgaXMgcGtnLm5hbWUpXG4gICAgICBpZiBrZWVwX2luc3RhbGxlZF9wYWNrYWdlLmxlbmd0aCBpcyAwXG4gICAgICAgIG9ic29sZXRlX3BhY2thZ2VzLnB1c2gocGtnKVxuICAgIGlmIG9ic29sZXRlX3BhY2thZ2VzLmxlbmd0aCBpcyAwXG4gICAgICBhdG9tLm5vdGlmaWNhdGlvbnMuYWRkSW5mbyBcIlN5bmMtc2V0dGluZ3M6IG5vIHBhY2thZ2VzIHRvIHJlbW92ZVwiXG4gICAgICByZXR1cm4gY2I/KClcblxuICAgIG5vdGlmaWNhdGlvbnMgPSB7fVxuICAgIHN1Y2NlZWRlZCA9IFtdXG4gICAgZmFpbGVkID0gW11cbiAgICByZW1vdmVOZXh0UGFja2FnZSA9ID0+XG4gICAgICBpZiBvYnNvbGV0ZV9wYWNrYWdlcy5sZW5ndGggPiAwXG4gICAgICAgICMgc3RhcnQgcmVtb3ZpbmcgbmV4dCBwYWNrYWdlXG4gICAgICAgIHBrZyA9IG9ic29sZXRlX3BhY2thZ2VzLnNoaWZ0KClcbiAgICAgICAgaSA9IHN1Y2NlZWRlZC5sZW5ndGggKyBmYWlsZWQubGVuZ3RoICsgT2JqZWN0LmtleXMobm90aWZpY2F0aW9ucykubGVuZ3RoICsgMVxuICAgICAgICBjb3VudCA9IGkgKyBvYnNvbGV0ZV9wYWNrYWdlcy5sZW5ndGhcbiAgICAgICAgbm90aWZpY2F0aW9uc1twa2cubmFtZV0gPSBhdG9tLm5vdGlmaWNhdGlvbnMuYWRkSW5mbyBcIlN5bmMtc2V0dGluZ3M6IHJlbW92aW5nICN7cGtnLm5hbWV9ICgje2l9LyN7Y291bnR9KVwiLCB7ZGlzbWlzc2FibGU6IHRydWV9XG4gICAgICAgIGRvIChwa2cpID0+XG4gICAgICAgICAgQHJlbW92ZVBhY2thZ2UgcGtnLCAoZXJyb3IpIC0+XG4gICAgICAgICAgICAjIHJlbW92YWwgb2YgcGFja2FnZSBmaW5pc2hlZFxuICAgICAgICAgICAgbm90aWZpY2F0aW9uc1twa2cubmFtZV0uZGlzbWlzcygpXG4gICAgICAgICAgICBkZWxldGUgbm90aWZpY2F0aW9uc1twa2cubmFtZV1cbiAgICAgICAgICAgIGlmIGVycm9yP1xuICAgICAgICAgICAgICBmYWlsZWQucHVzaChwa2cubmFtZSlcbiAgICAgICAgICAgICAgYXRvbS5ub3RpZmljYXRpb25zLmFkZFdhcm5pbmcgXCJTeW5jLXNldHRpbmdzOiBmYWlsZWQgdG8gcmVtb3ZlICN7cGtnLm5hbWV9XCJcbiAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgc3VjY2VlZGVkLnB1c2gocGtnLm5hbWUpXG4gICAgICAgICAgICAjIHRyaWdnZXIgbmV4dCBwYWNrYWdlXG4gICAgICAgICAgICByZW1vdmVOZXh0UGFja2FnZSgpXG4gICAgICBlbHNlIGlmIE9iamVjdC5rZXlzKG5vdGlmaWNhdGlvbnMpLmxlbmd0aCBpcyAwXG4gICAgICAgICMgbGFzdCBwYWNrYWdlIHJlbW92YWwgZmluaXNoZWRcbiAgICAgICAgaWYgZmFpbGVkLmxlbmd0aCBpcyAwXG4gICAgICAgICAgYXRvbS5ub3RpZmljYXRpb25zLmFkZFN1Y2Nlc3MgXCJTeW5jLXNldHRpbmdzOiBmaW5pc2hlZCByZW1vdmluZyAje3N1Y2NlZWRlZC5sZW5ndGh9IHBhY2thZ2VzXCJcbiAgICAgICAgZWxzZVxuICAgICAgICAgIGZhaWxlZC5zb3J0KClcbiAgICAgICAgICBmYWlsZWRTdHIgPSBmYWlsZWQuam9pbignLCAnKVxuICAgICAgICAgIGF0b20ubm90aWZpY2F0aW9ucy5hZGRXYXJuaW5nIFwiU3luYy1zZXR0aW5nczogZmluaXNoZWQgcmVtb3ZpbmcgcGFja2FnZXMgKCN7ZmFpbGVkLmxlbmd0aH0gZmFpbGVkOiAje2ZhaWxlZFN0cn0pXCIsIHtkaXNtaXNzYWJsZTogdHJ1ZX1cbiAgICAgICAgY2I/KClcbiAgICAjIHN0YXJ0IGFzIG1hbnkgcGFja2FnZSByZW1vdmFsIGluIHBhcmFsbGVsIGFzIGRlc2lyZWRcbiAgICBjb25jdXJyZW5jeSA9IE1hdGgubWluIG9ic29sZXRlX3BhY2thZ2VzLmxlbmd0aCwgOFxuICAgIGZvciBpIGluIFswLi4uY29uY3VycmVuY3ldXG4gICAgICByZW1vdmVOZXh0UGFja2FnZSgpXG5cbiAgcmVtb3ZlUGFja2FnZTogKHBhY2ssIGNiKSAtPlxuICAgIHR5cGUgPSBpZiBwYWNrLnRoZW1lIHRoZW4gJ3RoZW1lJyBlbHNlICdwYWNrYWdlJ1xuICAgIGNvbnNvbGUuaW5mbyhcIlJlbW92aW5nICN7dHlwZX0gI3twYWNrLm5hbWV9Li4uXCIpXG4gICAgcGFja2FnZU1hbmFnZXIgPSBuZXcgUGFja2FnZU1hbmFnZXIoKVxuICAgIHBhY2thZ2VNYW5hZ2VyLnVuaW5zdGFsbCBwYWNrLCAoZXJyb3IpIC0+XG4gICAgICBpZiBlcnJvcj9cbiAgICAgICAgY29uc29sZS5lcnJvcihcIlJlbW92aW5nICN7dHlwZX0gI3twYWNrLm5hbWV9IGZhaWxlZFwiLCBlcnJvci5zdGFjayA/IGVycm9yLCBlcnJvci5zdGRlcnIpXG4gICAgICBlbHNlXG4gICAgICAgIGNvbnNvbGUuaW5mbyhcIlJlbW92aW5nICN7dHlwZX0gI3twYWNrLm5hbWV9XCIpXG4gICAgICBjYj8oZXJyb3IpXG5cbiAgaW5zdGFsbE1pc3NpbmdQYWNrYWdlczogKHBhY2thZ2VzLCBjYikgLT5cbiAgICBhdmFpbGFibGVfcGFja2FnZXMgPSBAZ2V0UGFja2FnZXMoKVxuICAgIG1pc3NpbmdfcGFja2FnZXMgPSBbXVxuICAgIGZvciBwa2cgaW4gcGFja2FnZXNcbiAgICAgIGF2YWlsYWJsZV9wYWNrYWdlID0gKHAgZm9yIHAgaW4gYXZhaWxhYmxlX3BhY2thZ2VzIHdoZW4gcC5uYW1lIGlzIHBrZy5uYW1lKVxuICAgICAgaWYgYXZhaWxhYmxlX3BhY2thZ2UubGVuZ3RoIGlzIDBcbiAgICAgICAgIyBtaXNzaW5nIGlmIG5vdCB5ZXQgaW5zdGFsbGVkXG4gICAgICAgIG1pc3NpbmdfcGFja2FnZXMucHVzaChwa2cpXG4gICAgICBlbHNlIGlmIG5vdCghIXBrZy5hcG1JbnN0YWxsU291cmNlIGlzICEhYXZhaWxhYmxlX3BhY2thZ2VbMF0uYXBtSW5zdGFsbFNvdXJjZSlcbiAgICAgICAgIyBvciBpbnN0YWxsZWQgYnV0IHdpdGggZGlmZmVyZW50IGFwbSBpbnN0YWxsIHNvdXJjZVxuICAgICAgICBtaXNzaW5nX3BhY2thZ2VzLnB1c2gocGtnKVxuICAgIGlmIG1pc3NpbmdfcGFja2FnZXMubGVuZ3RoIGlzIDBcbiAgICAgIGF0b20ubm90aWZpY2F0aW9ucy5hZGRJbmZvIFwiU3luYy1zZXR0aW5nczogbm8gcGFja2FnZXMgdG8gaW5zdGFsbFwiXG4gICAgICByZXR1cm4gY2I/KClcblxuICAgIG5vdGlmaWNhdGlvbnMgPSB7fVxuICAgIHN1Y2NlZWRlZCA9IFtdXG4gICAgZmFpbGVkID0gW11cbiAgICBpbnN0YWxsTmV4dFBhY2thZ2UgPSA9PlxuICAgICAgaWYgbWlzc2luZ19wYWNrYWdlcy5sZW5ndGggPiAwXG4gICAgICAgICMgc3RhcnQgaW5zdGFsbGluZyBuZXh0IHBhY2thZ2VcbiAgICAgICAgcGtnID0gbWlzc2luZ19wYWNrYWdlcy5zaGlmdCgpXG4gICAgICAgIGkgPSBzdWNjZWVkZWQubGVuZ3RoICsgZmFpbGVkLmxlbmd0aCArIE9iamVjdC5rZXlzKG5vdGlmaWNhdGlvbnMpLmxlbmd0aCArIDFcbiAgICAgICAgY291bnQgPSBpICsgbWlzc2luZ19wYWNrYWdlcy5sZW5ndGhcbiAgICAgICAgbm90aWZpY2F0aW9uc1twa2cubmFtZV0gPSBhdG9tLm5vdGlmaWNhdGlvbnMuYWRkSW5mbyBcIlN5bmMtc2V0dGluZ3M6IGluc3RhbGxpbmcgI3twa2cubmFtZX0gKCN7aX0vI3tjb3VudH0pXCIsIHtkaXNtaXNzYWJsZTogdHJ1ZX1cbiAgICAgICAgZG8gKHBrZykgPT5cbiAgICAgICAgICBAaW5zdGFsbFBhY2thZ2UgcGtnLCAoZXJyb3IpIC0+XG4gICAgICAgICAgICAjIGluc3RhbGxhdGlvbiBvZiBwYWNrYWdlIGZpbmlzaGVkXG4gICAgICAgICAgICBub3RpZmljYXRpb25zW3BrZy5uYW1lXS5kaXNtaXNzKClcbiAgICAgICAgICAgIGRlbGV0ZSBub3RpZmljYXRpb25zW3BrZy5uYW1lXVxuICAgICAgICAgICAgaWYgZXJyb3I/XG4gICAgICAgICAgICAgIGZhaWxlZC5wdXNoKHBrZy5uYW1lKVxuICAgICAgICAgICAgICBhdG9tLm5vdGlmaWNhdGlvbnMuYWRkV2FybmluZyBcIlN5bmMtc2V0dGluZ3M6IGZhaWxlZCB0byBpbnN0YWxsICN7cGtnLm5hbWV9XCJcbiAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgc3VjY2VlZGVkLnB1c2gocGtnLm5hbWUpXG4gICAgICAgICAgICAjIHRyaWdnZXIgbmV4dCBwYWNrYWdlXG4gICAgICAgICAgICBpbnN0YWxsTmV4dFBhY2thZ2UoKVxuICAgICAgZWxzZSBpZiBPYmplY3Qua2V5cyhub3RpZmljYXRpb25zKS5sZW5ndGggaXMgMFxuICAgICAgICAjIGxhc3QgcGFja2FnZSBpbnN0YWxsYXRpb24gZmluaXNoZWRcbiAgICAgICAgaWYgZmFpbGVkLmxlbmd0aCBpcyAwXG4gICAgICAgICAgYXRvbS5ub3RpZmljYXRpb25zLmFkZFN1Y2Nlc3MgXCJTeW5jLXNldHRpbmdzOiBmaW5pc2hlZCBpbnN0YWxsaW5nICN7c3VjY2VlZGVkLmxlbmd0aH0gcGFja2FnZXNcIlxuICAgICAgICBlbHNlXG4gICAgICAgICAgZmFpbGVkLnNvcnQoKVxuICAgICAgICAgIGZhaWxlZFN0ciA9IGZhaWxlZC5qb2luKCcsICcpXG4gICAgICAgICAgYXRvbS5ub3RpZmljYXRpb25zLmFkZFdhcm5pbmcgXCJTeW5jLXNldHRpbmdzOiBmaW5pc2hlZCBpbnN0YWxsaW5nIHBhY2thZ2VzICgje2ZhaWxlZC5sZW5ndGh9IGZhaWxlZDogI3tmYWlsZWRTdHJ9KVwiLCB7ZGlzbWlzc2FibGU6IHRydWV9XG4gICAgICAgIGNiPygpXG4gICAgIyBzdGFydCBhcyBtYW55IHBhY2thZ2UgaW5zdGFsbGF0aW9ucyBpbiBwYXJhbGxlbCBhcyBkZXNpcmVkXG4gICAgY29uY3VycmVuY3kgPSBNYXRoLm1pbiBtaXNzaW5nX3BhY2thZ2VzLmxlbmd0aCwgOFxuICAgIGZvciBpIGluIFswLi4uY29uY3VycmVuY3ldXG4gICAgICBpbnN0YWxsTmV4dFBhY2thZ2UoKVxuXG4gIGluc3RhbGxQYWNrYWdlOiAocGFjaywgY2IpIC0+XG4gICAgdHlwZSA9IGlmIHBhY2sudGhlbWUgdGhlbiAndGhlbWUnIGVsc2UgJ3BhY2thZ2UnXG4gICAgY29uc29sZS5pbmZvKFwiSW5zdGFsbGluZyAje3R5cGV9ICN7cGFjay5uYW1lfS4uLlwiKVxuICAgIHBhY2thZ2VNYW5hZ2VyID0gbmV3IFBhY2thZ2VNYW5hZ2VyKClcbiAgICBwYWNrYWdlTWFuYWdlci5pbnN0YWxsIHBhY2ssIChlcnJvcikgLT5cbiAgICAgIGlmIGVycm9yP1xuICAgICAgICBjb25zb2xlLmVycm9yKFwiSW5zdGFsbGluZyAje3R5cGV9ICN7cGFjay5uYW1lfSBmYWlsZWRcIiwgZXJyb3Iuc3RhY2sgPyBlcnJvciwgZXJyb3Iuc3RkZXJyKVxuICAgICAgZWxzZVxuICAgICAgICBjb25zb2xlLmluZm8oXCJJbnN0YWxsZWQgI3t0eXBlfSAje3BhY2submFtZX1cIilcbiAgICAgIGNiPyhlcnJvcilcblxuICBmaWxlQ29udGVudDogKGZpbGVQYXRoKSAtPlxuICAgIHRyeVxuICAgICAgcmV0dXJuIGZzLnJlYWRGaWxlU3luYyhmaWxlUGF0aCwge2VuY29kaW5nOiAndXRmOCd9KSBvciBudWxsXG4gICAgY2F0Y2ggZVxuICAgICAgY29uc29sZS5lcnJvciBcIkVycm9yIHJlYWRpbmcgZmlsZSAje2ZpbGVQYXRofS4gUHJvYmFibHkgZG9lc24ndCBleGlzdC5cIiwgZVxuICAgICAgbnVsbFxuXG4gIGlucHV0Rm9ya0dpc3RJZDogLT5cbiAgICBGb3JrR2lzdElkSW5wdXRWaWV3ID89IHJlcXVpcmUgJy4vZm9yay1naXN0aWQtaW5wdXQtdmlldydcbiAgICBAaW5wdXRWaWV3ID0gbmV3IEZvcmtHaXN0SWRJbnB1dFZpZXcoKVxuICAgIEBpbnB1dFZpZXcuc2V0Q2FsbGJhY2tJbnN0YW5jZSh0aGlzKVxuXG4gIGZvcmtHaXN0SWQ6IChmb3JrSWQpIC0+XG4gICAgQGNyZWF0ZUNsaWVudCgpLmdpc3RzLmZvcmtcbiAgICAgIGlkOiBmb3JrSWRcbiAgICAsIChlcnIsIHJlcykgLT5cbiAgICAgIGlmIGVyclxuICAgICAgICB0cnlcbiAgICAgICAgICBtZXNzYWdlID0gSlNPTi5wYXJzZShlcnIubWVzc2FnZSkubWVzc2FnZVxuICAgICAgICAgIG1lc3NhZ2UgPSBcIkdpc3QgSUQgTm90IEZvdW5kXCIgaWYgbWVzc2FnZSBpcyBcIk5vdCBGb3VuZFwiXG4gICAgICAgIGNhdGNoIFN5bnRheEVycm9yXG4gICAgICAgICAgbWVzc2FnZSA9IGVyci5tZXNzYWdlXG4gICAgICAgIGF0b20ubm90aWZpY2F0aW9ucy5hZGRFcnJvciBcInN5bmMtc2V0dGluZ3M6IEVycm9yIGZvcmtpbmcgc2V0dGluZ3MuIChcIittZXNzYWdlK1wiKVwiXG4gICAgICAgIHJldHVybiBjYj8oKVxuXG4gICAgICBpZiByZXMuaWRcbiAgICAgICAgYXRvbS5jb25maWcuc2V0IFwic3luYy1zZXR0aW5ncy5naXN0SWRcIiwgcmVzLmlkXG4gICAgICAgIGF0b20ubm90aWZpY2F0aW9ucy5hZGRTdWNjZXNzIFwic3luYy1zZXR0aW5nczogRm9ya2VkIHN1Y2Nlc3NmdWxseSB0byB0aGUgbmV3IEdpc3QgSUQgXCIgKyByZXMuaWQgKyBcIiB3aGljaCBoYXMgYmVlbiBzYXZlZCB0byB5b3VyIGNvbmZpZy5cIlxuICAgICAgZWxzZVxuICAgICAgICBhdG9tLm5vdGlmaWNhdGlvbnMuYWRkRXJyb3IgXCJzeW5jLXNldHRpbmdzOiBFcnJvciBmb3JraW5nIHNldHRpbmdzXCJcblxuICAgICAgY2I/KClcblxubW9kdWxlLmV4cG9ydHMgPSBTeW5jU2V0dGluZ3NcbiJdfQ==
