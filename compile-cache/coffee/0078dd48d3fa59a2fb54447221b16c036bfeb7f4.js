(function() {
  var $, BrowserPlusView, CompositeDisposable, View, fs, jQ, path, ref,
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

  CompositeDisposable = require('atom').CompositeDisposable;

  ref = require('atom-space-pen-views'), View = ref.View, $ = ref.$;

  $ = jQ = require('jquery');

  require('jquery-ui/autocomplete');

  path = require('path');

  require('JSON2');

  fs = require('fs');

  require('jstorage');

  window.bp = {};

  window.bp.js = $.extend({}, window.$.jStorage);

  RegExp.escape = function(s) {
    return s.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
  };

  module.exports = BrowserPlusView = (function(superClass) {
    extend(BrowserPlusView, superClass);

    function BrowserPlusView(model) {
      this.model = model;
      this.subscriptions = new CompositeDisposable;
      this.model.view = this;
      this.model.onDidDestroy((function(_this) {
        return function() {
          var base1;
          _this.subscriptions.dispose();
          return typeof (base1 = jQ(_this.url)).autocomplete === "function" ? base1.autocomplete('destroy') : void 0;
        };
      })(this));
      atom.notifications.onDidAddNotification(function(notification) {
        if (notification.type === 'info') {
          return setTimeout(function() {
            return notification.dismiss();
          }, 1000);
        }
      });
      BrowserPlusView.__super__.constructor.apply(this, arguments);
    }

    BrowserPlusView.content = function(params) {
      var hideURLBar, ref1, ref2, ref3, ref4, ref5, spinnerClass, url;
      url = params.url;
      spinnerClass = "fa fa-spinner";
      hideURLBar = '';
      if ((ref1 = params.opt) != null ? ref1.hideURLBar : void 0) {
        hideURLBar = 'hideURLBar';
      }
      if ((ref2 = params.opt) != null ? ref2.src : void 0) {
        params.src = BrowserPlusView.checkBase(params.opt.src, params.url);
        params.src = params.src.replace(/"/g, "'");
        if (!((ref3 = params.src) != null ? ref3.startsWith("data:text/html,") : void 0)) {
          params.src = "data:text/html," + params.src;
        }
        if (!url) {
          url = params.src;
        }
      }
      if ((ref4 = params.url) != null ? ref4.startsWith("browser-plus://") : void 0) {
        url = (ref5 = params.browserPlus) != null ? typeof ref5.getBrowserPlusUrl === "function" ? ref5.getBrowserPlusUrl(url) : void 0 : void 0;
        spinnerClass += " fa-custom";
      }
      return this.div({
        "class": 'browser-plus'
      }, (function(_this) {
        return function() {
          _this.div({
            "class": "url native-key-bindings " + hideURLBar,
            outlet: 'urlbar'
          }, function() {
            _this.div({
              "class": 'nav-btns-left'
            }, function() {
              _this.span({
                id: 'back',
                "class": 'mega-octicon octicon-arrow-left',
                outlet: 'back'
              });
              _this.span({
                id: 'forward',
                "class": 'mega-octicon octicon-arrow-right',
                outlet: 'forward'
              });
              _this.span({
                id: 'refresh',
                "class": 'mega-octicon octicon-sync',
                outlet: 'refresh'
              });
              _this.span({
                id: 'history',
                "class": 'mega-octicon octicon-book',
                outlet: 'history'
              });
              _this.span({
                id: 'fav',
                "class": 'mega-octicon octicon-star',
                outlet: 'fav'
              });
              _this.span({
                id: 'favList',
                "class": 'octicon octicon-arrow-down',
                outlet: 'favList'
              });
              return _this.a({
                "class": spinnerClass,
                outlet: 'spinner'
              });
            });
            _this.div({
              "class": 'nav-btns'
            }, function() {
              _this.div({
                "class": 'nav-btns-right'
              }, function() {
                _this.span({
                  id: 'newTab',
                  "class": 'octicon',
                  outlet: 'newTab'
                }, "\u2795");
                _this.span({
                  id: 'print',
                  "class": 'icon-browser-pluss icon-print',
                  outlet: 'print'
                });
                _this.span({
                  id: 'remember',
                  "class": 'mega-octicon octicon-pin',
                  outlet: 'remember'
                });
                _this.span({
                  id: 'live',
                  "class": 'mega-octicon octicon-zap',
                  outlet: 'live'
                });
                return _this.span({
                  id: 'devtool',
                  "class": 'mega-octicon octicon-tools',
                  outlet: 'devtool'
                });
              });
              return _this.div({
                "class": 'input-url'
              }, function() {
                return _this.input({
                  "class": "native-key-bindings",
                  type: 'text',
                  id: 'url',
                  outlet: 'url',
                  value: "" + params.url
                });
              });
            });
            return _this.input({
              id: 'find',
              "class": 'find find-hide',
              outlet: 'find'
            });
          });
          return _this.tag('webview', {
            "class": "native-key-bindings",
            outlet: 'htmlv',
            preload: "file:///" + params.browserPlus.resources + "/bp-client.js",
            plugins: 'on',
            src: "" + url,
            disablewebsecurity: 'on',
            allowfileaccessfromfiles: 'on',
            allowPointerLock: 'on'
          });
        };
      })(this));
    };

    BrowserPlusView.prototype.toggleURLBar = function() {
      return this.urlbar.toggle();
    };

    BrowserPlusView.prototype.initialize = function() {
      var base1, ref1, ref2, ref3, ref4, ref5, ref6, ref7, ref8, ref9, select, src;
      src = (function(_this) {
        return function(req, res) {
          var _, fav, pattern, searchUrl, urls;
          _ = require('lodash');
          pattern = RegExp("" + (RegExp.escape(req.term)), "i");
          fav = _.filter(window.bp.js.get('bp.fav'), function(fav) {
            return fav.url.match(pattern) || fav.title.match(pattern);
          });
          urls = _.pluck(fav, "url");
          res(urls);
          searchUrl = 'http://api.bing.com/osjson.aspx';
          return (function() {
            return jQ.ajax({
              url: searchUrl,
              dataType: 'json',
              data: {
                query: req.term,
                'web.count': 10
              },
              success: (function(_this) {
                return function(data) {
                  var dat, i, len, ref1, search;
                  urls = urls.slice(0, 11);
                  search = "http://www.google.com/search?as_q=";
                  ref1 = data[1].slice(0, 11);
                  for (i = 0, len = ref1.length; i < len; i++) {
                    dat = ref1[i];
                    urls.push({
                      label: dat,
                      value: search + dat
                    });
                  }
                  return res(urls);
                };
              })(this)
            });
          })();
        };
      })(this);
      select = (function(_this) {
        return function(event, ui) {
          return _this.goToUrl(ui.item.value);
        };
      })(this);
      if (typeof (base1 = jQ(this.url)).autocomplete === "function") {
        base1.autocomplete({
          source: src,
          minLength: 2,
          select: select
        });
      }
      this.subscriptions.add(atom.tooltips.add(this.back, {
        title: 'Back'
      }));
      this.subscriptions.add(atom.tooltips.add(this.forward, {
        title: 'Forward'
      }));
      this.subscriptions.add(atom.tooltips.add(this.refresh, {
        title: 'Refresh-f5/ctrl-f5'
      }));
      this.subscriptions.add(atom.tooltips.add(this.print, {
        title: 'Print'
      }));
      this.subscriptions.add(atom.tooltips.add(this.history, {
        title: 'History'
      }));
      this.subscriptions.add(atom.tooltips.add(this.favList, {
        title: 'View Favorites'
      }));
      this.subscriptions.add(atom.tooltips.add(this.fav, {
        title: 'Favoritize'
      }));
      this.subscriptions.add(atom.tooltips.add(this.live, {
        title: 'Live'
      }));
      this.subscriptions.add(atom.tooltips.add(this.remember, {
        title: 'Remember Position'
      }));
      this.subscriptions.add(atom.tooltips.add(this.newTab, {
        title: 'New Tab'
      }));
      this.subscriptions.add(atom.tooltips.add(this.devtool, {
        title: 'Dev Tools-f12'
      }));
      this.subscriptions.add(atom.commands.add('.browser-plus webview', {
        'browser-plus-view:goBack': (function(_this) {
          return function() {
            return _this.goBack();
          };
        })(this)
      }));
      this.subscriptions.add(atom.commands.add('.browser-plus webview', {
        'browser-plus-view:goForward': (function(_this) {
          return function() {
            return _this.goForward();
          };
        })(this)
      }));
      this.subscriptions.add(atom.commands.add('.browser-plus', {
        'browser-plus-view:toggleURLBar': (function(_this) {
          return function() {
            return _this.toggleURLBar();
          };
        })(this)
      }));
      this.liveOn = false;
      this.element.onkeydown = (function(_this) {
        return function() {
          return _this.keyHandler(arguments);
        };
      })(this);
      if (this.model.url.indexOf('file:///') >= 0) {
        this.checkFav();
      }
      if ((ref1 = this.htmlv[0]) != null) {
        ref1.addEventListener("permissionrequest", function(e) {
          return e.request.allow();
        });
      }
      if ((ref2 = this.htmlv[0]) != null) {
        ref2.addEventListener("console-message", (function(_this) {
          return function(e) {
            var base2, base3, base4, base5, base6, css, csss, data, i, indx, init, inits, j, js, jss, k, l, left, len, len1, len2, len3, menu, menus, ref10, ref11, ref12, ref13, ref14, ref15, ref16, ref17, ref18, ref19, ref3, ref4, ref5, ref6, ref7, ref8, ref9, top;
            if (e.message.includes('~browser-plus-position~') && _this.rememberOn) {
              data = e.message.replace('~browser-plus-position~', '');
              indx = data.indexOf(',');
              top = data.substr(0, indx);
              left = data.substr(indx + 1);
              _this.curPos = {
                "top": top,
                "left": left
              };
              _this.href = _this.url.val();
            }
            if (e.message.includes('~browser-plus-jquery~') || e.message.includes('~browser-plus-menu~')) {
              if (e.message.includes('~browser-plus-jquery~')) {
                if ((base2 = _this.model.browserPlus).jQueryJS == null) {
                  base2.jQueryJS = BrowserPlusView.getJQuery.call(_this);
                }
                if ((ref3 = _this.htmlv[0]) != null) {
                  ref3.executeJavaScript(_this.model.browserPlus.jQueryJS);
                }
              }
              if (_this.rememberOn) {
                if (_this.model.hashurl) {
                  _this.model.url = _this.model.hashurl;
                  _this.model.hashurl = void 0;
                  _this.url.val(_this.model.url);
                  if ((ref4 = _this.htmlv[0]) != null) {
                    ref4.executeJavaScript("location.href = '" + _this.model.url + "'");
                  }
                }
                if (_this.rememberOn && _this.model.url === _this.href) {
                  if ((ref5 = _this.htmlv[0]) != null) {
                    ref5.executeJavaScript("jQuery(window).scrollTop(" + _this.curPos.top + ");\njQuery(window).scrollLeft(" + _this.curPos.left + ");");
                  }
                }
              }
              if ((base3 = _this.model.browserPlus).jStorageJS == null) {
                base3.jStorageJS = BrowserPlusView.getJStorage.call(_this);
              }
              if ((ref6 = _this.htmlv[0]) != null) {
                ref6.executeJavaScript(_this.model.browserPlus.jStorageJS);
              }
              if ((base4 = _this.model.browserPlus).watchjs == null) {
                base4.watchjs = BrowserPlusView.getWatchjs.call(_this);
              }
              if ((ref7 = _this.htmlv[0]) != null) {
                ref7.executeJavaScript(_this.model.browserPlus.watchjs);
              }
              if ((base5 = _this.model.browserPlus).hotKeys == null) {
                base5.hotKeys = BrowserPlusView.getHotKeys.call(_this);
              }
              if ((ref8 = _this.htmlv[0]) != null) {
                ref8.executeJavaScript(_this.model.browserPlus.hotKeys);
              }
              if ((base6 = _this.model.browserPlus).notifyBar == null) {
                base6.notifyBar = BrowserPlusView.getNotifyBar.call(_this);
              }
              if ((ref9 = _this.htmlv[0]) != null) {
                ref9.executeJavaScript(_this.model.browserPlus.notifyBar);
              }
              if (inits = (ref10 = _this.model.browserPlus.plugins) != null ? ref10.onInit : void 0) {
                for (i = 0, len = inits.length; i < len; i++) {
                  init = inits[i];
                  if ((ref11 = _this.htmlv[0]) != null) {
                    ref11.executeJavaScript(init);
                  }
                }
              }
              if (jss = (ref12 = _this.model.browserPlus.plugins) != null ? ref12.jss : void 0) {
                for (j = 0, len1 = jss.length; j < len1; j++) {
                  js = jss[j];
                  if ((ref13 = _this.htmlv[0]) != null) {
                    ref13.executeJavaScript(BrowserPlusView.loadJS.call(_this, js, true));
                  }
                }
              }
              if (csss = (ref14 = _this.model.browserPlus.plugins) != null ? ref14.csss : void 0) {
                for (k = 0, len2 = csss.length; k < len2; k++) {
                  css = csss[k];
                  if ((ref15 = _this.htmlv[0]) != null) {
                    ref15.executeJavaScript(BrowserPlusView.loadCSS.call(_this, css, true));
                  }
                }
              }
              if (menus = (ref16 = _this.model.browserPlus.plugins) != null ? ref16.menus : void 0) {
                for (l = 0, len3 = menus.length; l < len3; l++) {
                  menu = menus[l];
                  if (menu.fn) {
                    menu.fn = menu.fn.toString();
                  }
                  if (menu.selectorFilter) {
                    menu.selectorFilter = menu.selectorFilter.toString();
                  }
                  if ((ref17 = _this.htmlv[0]) != null) {
                    ref17.executeJavaScript("browserPlus.menu(" + (JSON.stringify(menu)) + ")");
                  }
                }
              }
              if ((ref18 = _this.htmlv[0]) != null) {
                ref18.executeJavaScript(BrowserPlusView.loadCSS.call(_this, 'bp-style.css'));
              }
              return (ref19 = _this.htmlv[0]) != null ? ref19.executeJavaScript(BrowserPlusView.loadCSS.call(_this, 'jquery.notifyBar.css')) : void 0;
            }
          };
        })(this));
      }
      if ((ref3 = this.htmlv[0]) != null) {
        ref3.addEventListener("page-favicon-updated", (function(_this) {
          return function(e) {
            var _, fav, favIcon, favr, style, uri;
            _ = require('lodash');
            favr = window.bp.js.get('bp.fav');
            if (fav = _.find(favr, {
              'url': _this.model.url
            })) {
              fav.favIcon = e.favicons[0];
              window.bp.js.set('bp.fav', favr);
            }
            _this.model.iconName = Math.floor(Math.random() * 10000).toString();
            _this.model.favIcon = e.favicons[0];
            _this.model.updateIcon(e.favicons[0]);
            favIcon = window.bp.js.get('bp.favIcon');
            uri = _this.htmlv[0].getURL();
            if (!uri) {
              return;
            }
            favIcon[uri] = e.favicons[0];
            window.bp.js.set('bp.favIcon', favIcon);
            _this.model.updateIcon();
            style = document.createElement('style');
            style.type = 'text/css';
            style.innerHTML = ".title.icon.icon-" + _this.model.iconName + " {\n  background-size: 16px 16px;\n  background-repeat: no-repeat;\n  padding-left: 20px;\n  background-image: url('" + e.favicons[0] + "');\n  background-position-y: 50%;\n}";
            return document.getElementsByTagName('head')[0].appendChild(style);
          };
        })(this));
      }
      if ((ref4 = this.htmlv[0]) != null) {
        ref4.addEventListener("did-navigate-in-page", (function(_this) {
          return function(evt) {
            return _this.updatePageUrl(evt);
          };
        })(this));
      }
      if ((ref5 = this.htmlv[0]) != null) {
        ref5.addEventListener("did-navigate", (function(_this) {
          return function(evt) {
            return _this.updatePageUrl(evt);
          };
        })(this));
      }
      if ((ref6 = this.htmlv[0]) != null) {
        ref6.addEventListener("page-title-set", (function(_this) {
          return function(e) {
            var _, fav, favr, title, uri;
            _ = require('lodash');
            favr = window.bp.js.get('bp.fav');
            title = window.bp.js.get('bp.title');
            uri = _this.htmlv[0].getURL();
            if (!uri) {
              return;
            }
            title[uri] = e.title;
            window.bp.js.set('bp.title', title);
            if (fav = _.find(favr, {
              'url': _this.model.url
            })) {
              fav.title = e.title;
              window.bp.js.set('bp.fav', favr);
            }
            return _this.model.setTitle(e.title);
          };
        })(this));
      }
      this.devtool.on('click', (function(_this) {
        return function(evt) {
          return _this.toggleDevTool();
        };
      })(this));
      this.spinner.on('click', (function(_this) {
        return function(evt) {
          var ref7;
          return (ref7 = _this.htmlv[0]) != null ? ref7.stop() : void 0;
        };
      })(this));
      this.remember.on('click', (function(_this) {
        return function(evt) {
          _this.rememberOn = !_this.rememberOn;
          return _this.remember.toggleClass('active', _this.rememberOn);
        };
      })(this));
      this.print.on('click', (function(_this) {
        return function(evt) {
          var ref7;
          return (ref7 = _this.htmlv[0]) != null ? ref7.print() : void 0;
        };
      })(this));
      this.newTab.on('click', (function(_this) {
        return function(evt) {
          atom.workspace.open("browser-plus://blank");
          return _this.spinner.removeClass('fa-custom');
        };
      })(this));
      this.history.on('click', (function(_this) {
        return function(evt) {
          return atom.workspace.open("browser-plus://history", {
            split: 'left',
            searchAllPanes: true
          });
        };
      })(this));
      this.live.on('click', (function(_this) {
        return function(evt) {
          _this.liveOn = !_this.liveOn;
          _this.live.toggleClass('active', _this.liveOn);
          if (_this.liveOn) {
            _this.refreshPage();
            _this.liveSubscription = new CompositeDisposable;
            _this.liveSubscription.add(atom.workspace.observeTextEditors(function(editor) {
              return _this.liveSubscription.add(editor.onDidSave(function() {
                var timeout;
                timeout = atom.config.get('browser-plus.live');
                return setTimeout(function() {
                  return _this.refreshPage();
                }, timeout);
              }));
            }));
            return _this.model.onDidDestroy(function() {
              return _this.liveSubscription.dispose();
            });
          } else {
            return _this.liveSubscription.dispose();
          }
        };
      })(this));
      this.fav.on('click', (function(_this) {
        return function(evt) {
          var data, delCount, favs;
          favs = window.bp.js.get('bp.fav');
          if (_this.fav.hasClass('active')) {
            _this.removeFav(_this.model);
          } else {
            if (_this.model.orgURI) {
              return;
            }
            data = {
              url: _this.model.url,
              title: _this.model.title || _this.model.url,
              favIcon: _this.model.favIcon
            };
            favs.push(data);
            delCount = favs.length - atom.config.get('browser-plus.fav');
            if (delCount > 0) {
              favs.splice(0, delCount);
            }
            window.bp.js.set('bp.fav', favs);
          }
          return _this.fav.toggleClass('active');
        };
      })(this));
      if ((ref7 = this.htmlv[0]) != null) {
        ref7.addEventListener('new-window', function(e) {
          return atom.workspace.open(e.url, {
            split: 'left',
            searchAllPanes: true,
            openInSameWindow: false
          });
        });
      }
      if ((ref8 = this.htmlv[0]) != null) {
        ref8.addEventListener("did-start-loading", (function(_this) {
          return function() {
            var ref9;
            _this.spinner.removeClass('fa-custom');
            return (ref9 = _this.htmlv[0]) != null ? ref9.shadowRoot.firstChild.style.height = '95%' : void 0;
          };
        })(this));
      }
      if ((ref9 = this.htmlv[0]) != null) {
        ref9.addEventListener("did-stop-loading", (function(_this) {
          return function() {
            return _this.spinner.addClass('fa-custom');
          };
        })(this));
      }
      this.back.on('click', (function(_this) {
        return function(evt) {
          var ref10, ref11;
          if (((ref10 = _this.htmlv[0]) != null ? ref10.canGoBack() : void 0) && $( this).hasClass('active')) {
            return (ref11 = _this.htmlv[0]) != null ? ref11.goBack() : void 0;
          }
        };
      })(this));
      this.favList.on('click', (function(_this) {
        return function(evt) {
          var favList;
          favList = require('./fav-view');
          return new favList(window.bp.js.get('bp.fav'));
        };
      })(this));
      this.forward.on('click', (function(_this) {
        return function(evt) {
          var ref10, ref11;
          if (((ref10 = _this.htmlv[0]) != null ? ref10.canGoForward() : void 0) && $( this).hasClass('active')) {
            return (ref11 = _this.htmlv[0]) != null ? ref11.goForward() : void 0;
          }
        };
      })(this));
      this.url.on('click', (function(_this) {
        return function(evt) {
          return _this.url.select();
        };
      })(this));
      this.url.on('keypress', (function(_this) {
        return function(evt) {
          var URL, localhostPattern, ref10, url, urls;
          URL = require('url');
          if (evt.which === 13) {
            _this.url.blur();
            urls = URL.parse( this.value);
            url =  this.value;
            if (!url.startsWith('browser-plus://')) {
              if (url.indexOf(' ') >= 0) {
                url = "http://www.google.com/search?as_q=" + url;
              } else {
                localhostPattern = /^(http:\/\/)?localhost/i;
                if (url.search(localhostPattern) < 0 && url.indexOf('.') < 0) {
                  url = "http://www.google.com/search?as_q=" + url;
                } else {
                  if ((ref10 = urls.protocol) === 'http' || ref10 === 'https' || ref10 === 'file:') {
                    if (urls.protocol === 'file:') {
                      url = url.replace(/\\/g, "/");
                    } else {
                      url = URL.format(urls);
                    }
                  } else {
                    urls.protocol = 'http';
                    url = URL.format(urls);
                  }
                }
              }
            }
            return _this.goToUrl(url);
          }
        };
      })(this));
      return this.refresh.on('click', (function(_this) {
        return function(evt) {
          return _this.refreshPage();
        };
      })(this));
    };

    BrowserPlusView.prototype.updatePageUrl = function(evt) {
      var BrowserPlusModel, ref1, ref2, ref3, ref4, title, url;
      BrowserPlusModel = require('./browser-plus-model');
      url = evt.url;
      if (!BrowserPlusModel.checkUrl(url)) {
        url = atom.config.get('browser-plus.homepage') || "http://www.google.com";
        atom.notifications.addSuccess("Redirecting to " + url);
        if ((ref1 = this.htmlv[0]) != null) {
          ref1.executeJavaScript("location.href = '" + url + "'");
        }
        return;
      }
      if (url && url !== this.model.url && !((ref2 = this.url.val()) != null ? ref2.startsWith('browser-plus://') : void 0)) {
        this.url.val(url);
        this.model.url = url;
      }
      title = (ref3 = this.htmlv[0]) != null ? ref3.getTitle() : void 0;
      if (title) {
        if (title !== this.model.getTitle()) {
          this.model.setTitle(title);
        }
      } else {
        this.model.setTitle(url);
      }
      this.live.toggleClass('active', this.liveOn);
      if (!this.liveOn) {
        if ((ref4 = this.liveSubscription) != null) {
          ref4.dispose();
        }
      }
      this.checkNav();
      this.checkFav();
      return this.addHistory();
    };

    BrowserPlusView.prototype.refreshPage = function(url, ignorecache) {
      var pp, ref1, ref2, ref3, ref4, ref5;
      if (this.rememberOn) {
        if ((ref1 = this.htmlv[0]) != null) {
          ref1.executeJavaScript("var left, top;\ncurTop = jQuery(window).scrollTop();\ncurLeft = jQuery(window).scrollLeft();\nconsole.log(`~browser-plus-position~${curTop},${curLeft}`);");
        }
      }
      if (this.model.orgURI && (pp = atom.packages.getActivePackage('pp'))) {
        return pp.mainModule.compilePath(this.model.orgURI, this.model._id);
      } else {
        if (url) {
          this.model.url = url;
          this.url.val(url);
          return (ref2 = this.htmlv[0]) != null ? ref2.src = url : void 0;
        } else {
          if (this.ultraLiveOn && this.model.src) {
            if ((ref3 = this.htmlv[0]) != null) {
              ref3.src = this.model.src;
            }
          }
          if (ignorecache) {
            return (ref4 = this.htmlv[0]) != null ? ref4.reloadIgnoringCache() : void 0;
          } else {
            return (ref5 = this.htmlv[0]) != null ? ref5.reload() : void 0;
          }
        }
      }
    };

    BrowserPlusView.prototype.goToUrl = function(url) {
      var BrowserPlusModel, base1, base2, ref1;
      BrowserPlusModel = require('./browser-plus-model');
      if (!BrowserPlusModel.checkUrl(url)) {
        return;
      }
      if (typeof (base1 = jQ(this.url)).autocomplete === "function") {
        base1.autocomplete("close");
      }
      this.liveOn = false;
      this.live.toggleClass('active', this.liveOn);
      if (!this.liveOn) {
        if ((ref1 = this.liveSubscription) != null) {
          ref1.dispose();
        }
      }
      this.url.val(url);
      this.model.url = url;
      delete this.model.title;
      delete this.model.iconName;
      delete this.model.favIcon;
      this.model.setTitle(null);
      this.model.updateIcon(null);
      if (url.startsWith('browser-plus://')) {
        url = typeof (base2 = this.model.browserPlus).getBrowserPlusUrl === "function" ? base2.getBrowserPlusUrl(url) : void 0;
      }
      return this.htmlv.attr('src', url);
    };

    BrowserPlusView.prototype.keyHandler = function(evt) {
      switch (evt[0].keyIdentifier) {
        case "F12":
          return this.toggleDevTool();
        case "F5":
          if (evt[0].ctrlKey) {
            return this.refreshPage(void 0, true);
          } else {
            return this.refreshPage();
          }
          break;
        case "F10":
          return this.toggleURLBar();
        case "Left":
          if (evt[0].altKey) {
            return this.goBack();
          }
          break;
        case "Right":
          if (evt[0].altKey) {
            return this.goForward();
          }
      }
    };

    BrowserPlusView.prototype.removeFav = function(favorite) {
      var favr, favrs, i, idx, len;
      favrs = window.bp.js.get('bp.fav');
      for (idx = i = 0, len = favrs.length; i < len; idx = ++i) {
        favr = favrs[idx];
        if (favr.url === favorite.url) {
          favrs.splice(idx, 1);
          window.bp.js.set('bp.fav', favrs);
          return;
        }
      }
    };

    BrowserPlusView.prototype.setSrc = function(text) {
      var ref1, url;
      url = this.model.orgURI || this.model.url;
      text = BrowserPlusView.checkBase(text, url);
      this.model.src = "data:text/html," + text;
      return (ref1 = this.htmlv[0]) != null ? ref1.src = this.model.src : void 0;
    };

    BrowserPlusView.checkBase = function(text, url) {
      var $html, base, basePath, cheerio;
      cheerio = require('cheerio');
      $html = cheerio.load(text);
      basePath = path.dirname(url) + "/";
      if ($html('base').length) {
        return text;
      } else {
        if ($html('head').length) {
          base = "<base href='" + basePath + "' target='_blank'>";
          $html('head').prepend(base);
        } else {
          base = "<head><base href='" + basePath + "' target='_blank'></head>";
          $html('html').prepend(base);
        }
        return $html.html();
      }
    };

    BrowserPlusView.prototype.checkFav = function() {
      var favr, favrs, i, len, results;
      this.fav.removeClass('active');
      favrs = window.bp.js.get('bp.fav');
      results = [];
      for (i = 0, len = favrs.length; i < len; i++) {
        favr = favrs[i];
        if (favr.url === this.model.url) {
          results.push(this.fav.addClass('active'));
        } else {
          results.push(void 0);
        }
      }
      return results;
    };

    BrowserPlusView.prototype.toggleDevTool = function() {
      var open, ref1, ref2, ref3;
      open = (ref1 = this.htmlv[0]) != null ? ref1.isDevToolsOpened() : void 0;
      if (open) {
        if ((ref2 = this.htmlv[0]) != null) {
          ref2.closeDevTools();
        }
      } else {
        if ((ref3 = this.htmlv[0]) != null) {
          ref3.openDevTools();
        }
      }
      return $(this.devtool).toggleClass('active', !open);
    };

    BrowserPlusView.prototype.checkNav = function() {
      var ref1, ref2, ref3;
      $(this.forward).toggleClass('active', (ref1 = this.htmlv[0]) != null ? ref1.canGoForward() : void 0);
      $(this.back).toggleClass('active', (ref2 = this.htmlv[0]) != null ? ref2.canGoBack() : void 0);
      if ((ref3 = this.htmlv[0]) != null ? ref3.canGoForward() : void 0) {
        if (this.clearForward) {
          $(this.forward).toggleClass('active', false);
          return this.clearForward = false;
        } else {
          return $(this.forward).toggleClass('active', true);
        }
      }
    };

    BrowserPlusView.prototype.goBack = function() {
      return this.back.click();
    };

    BrowserPlusView.prototype.goForward = function() {
      return this.forward.click();
    };

    BrowserPlusView.prototype.addHistory = function() {
      var histToday, history, historyURL, obj, today, todayObj, url, yyyymmdd;
      url = this.htmlv[0].getURL().replace(/\\/g, "/");
      if (!url) {
        return;
      }
      historyURL = ("file:///" + this.model.browserPlus.resources + "history.html").replace(/\\/g, "/");
      if (url.startsWith('browser-plus://') || url.startsWith('data:text/html,') || url.startsWith(historyURL)) {
        return;
      }
      yyyymmdd = function() {
        var date, dd, mm, yyyy;
        date = new Date();
        yyyy = date.getFullYear().toString();
        mm = (date.getMonth() + 1).toString();
        dd = date.getDate().toString();
        return yyyy + (mm[1] ? mm : '0' + mm[0]) + (dd[1] ? dd : '0' + dd[0]);
      };
      today = yyyymmdd();
      history = window.bp.js.get('bp.history') || [];
      todayObj = history.find(function(ele, idx, arr) {
        if (ele[today]) {
          return true;
        }
      });
      if (!todayObj) {
        obj = {};
        histToday = [];
        obj[today] = histToday;
        history.unshift(obj);
      } else {
        histToday = todayObj[today];
      }
      histToday.unshift({
        date: new Date().toString(),
        uri: url
      });
      return window.bp.js.set('bp.history', history);
    };

    BrowserPlusView.prototype.getTitle = function() {
      return this.model.getTitle();
    };

    BrowserPlusView.prototype.serialize = function() {};

    BrowserPlusView.prototype.destroy = function() {
      var base1;
      if (typeof (base1 = jQ(this.url)).autocomplete === "function") {
        base1.autocomplete('destroy');
      }
      return this.subscriptions.dispose();
    };

    BrowserPlusView.getJQuery = function() {
      return fs.readFileSync(this.model.browserPlus.resources + "/jquery-2.1.4.min.js", 'utf-8');
    };

    BrowserPlusView.getEval = function() {
      return fs.readFileSync(this.model.browserPlus.resources + "/eval.js", 'utf-8');
    };

    BrowserPlusView.getJStorage = function() {
      return fs.readFileSync(this.model.browserPlus.resources + "/jstorage.min.js", 'utf-8');
    };

    BrowserPlusView.getWatchjs = function() {
      return fs.readFileSync(this.model.browserPlus.resources + "/watch.js", 'utf-8');
    };

    BrowserPlusView.getNotifyBar = function() {
      return fs.readFileSync(this.model.browserPlus.resources + "/jquery.notifyBar.js", 'utf-8');
    };

    BrowserPlusView.getHotKeys = function() {
      return fs.readFileSync(this.model.browserPlus.resources + "/jquery.hotkeys.min.js", 'utf-8');
    };

    BrowserPlusView.loadCSS = function(filename, fullpath) {
      var fpath;
      if (fullpath == null) {
        fullpath = false;
      }
      if (!fullpath) {
        fpath = "file:///" + (this.model.browserPlus.resources.replace(/\\/g, '/'));
        filename = "" + fpath + filename;
      }
      return "jQuery('head').append(jQuery('<link type=\"text/css\" rel=\"stylesheet\" href=\"" + filename + "\">'))";
    };

    BrowserPlusView.loadJS = function(filename, fullpath) {
      var fpath;
      if (fullpath == null) {
        fullpath = false;
      }
      if (!fullpath) {
        fpath = "file:///" + (this.model.browserPlus.resources.replace(/\\/g, '/'));
        filename = "" + fpath + filename;
      }
      return "jQuery('head').append(jQuery('<script type=\"text/javascript\" src=\"" + filename + "\">'))";
    };

    return BrowserPlusView;

  })(View);

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL2hvbWUvbWFyY3VzLy5hdG9tL3BhY2thZ2VzL2Jyb3dzZXItcGx1cy9saWIvYnJvd3Nlci1wbHVzLXZpZXcuY29mZmVlIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FBQUEsTUFBQSxnRUFBQTtJQUFBOzs7RUFBQyxzQkFBd0IsT0FBQSxDQUFRLE1BQVI7O0VBQ3pCLE1BQVcsT0FBQSxDQUFRLHNCQUFSLENBQVgsRUFBQyxlQUFELEVBQU07O0VBQ04sQ0FBQSxHQUFJLEVBQUEsR0FBSyxPQUFBLENBQVEsUUFBUjs7RUFDVCxPQUFBLENBQVEsd0JBQVI7O0VBQ0EsSUFBQSxHQUFPLE9BQUEsQ0FBUSxNQUFSOztFQUNQLE9BQUEsQ0FBUSxPQUFSOztFQUVBLEVBQUEsR0FBSyxPQUFBLENBQVEsSUFBUjs7RUFDTCxPQUFBLENBQVEsVUFBUjs7RUFDQSxNQUFNLENBQUMsRUFBUCxHQUFZOztFQUNaLE1BQU0sQ0FBQyxFQUFFLENBQUMsRUFBVixHQUFnQixDQUFDLENBQUMsTUFBRixDQUFTLEVBQVQsRUFBWSxNQUFNLENBQUMsQ0FBQyxDQUFDLFFBQXJCOztFQUVoQixNQUFNLENBQUMsTUFBUCxHQUFlLFNBQUMsQ0FBRDtXQUNiLENBQUMsQ0FBQyxPQUFGLENBQVUsd0JBQVYsRUFBb0MsTUFBcEM7RUFEYTs7RUFHZixNQUFNLENBQUMsT0FBUCxHQUNNOzs7SUFDUyx5QkFBQyxLQUFEO01BQUMsSUFBQyxDQUFBLFFBQUQ7TUFDWixJQUFDLENBQUEsYUFBRCxHQUFpQixJQUFJO01BQ3JCLElBQUMsQ0FBQSxLQUFLLENBQUMsSUFBUCxHQUFjO01BQ2QsSUFBQyxDQUFBLEtBQUssQ0FBQyxZQUFQLENBQW9CLENBQUEsU0FBQSxLQUFBO2VBQUEsU0FBQTtBQUNsQixjQUFBO1VBQUEsS0FBQyxDQUFBLGFBQWEsQ0FBQyxPQUFmLENBQUE7bUZBQ1EsQ0FBQyxhQUFjO1FBRkw7TUFBQSxDQUFBLENBQUEsQ0FBQSxJ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YUFHQSxrRkFBQSxHQUM2RSxRQUQ3RSxHQUNzRjtJQUw5RTs7SUFRVixlQUFDLENBQUEsTUFBRCxHQUFTLFNBQUMsUUFBRCxFQUFVLFFBQVY7QUFDUCxVQUFBOztRQURpQixXQUFTOztNQUMxQixJQUFBLENBQU8sUUFBUDtRQUNFLEtBQUEsR0FBUSxVQUFBLEdBQVUsQ0FBQyxJQUFDLENBQUEsS0FBSyxDQUFDLFdBQVcsQ0FBQyxTQUFTLENBQUMsT0FBN0IsQ0FBcUMsS0FBckMsRUFBMkMsR0FBM0MsQ0FBRDtRQUNsQixRQUFBLEdBQVcsRUFBQSxHQUFHLEtBQUgsR0FBVyxTQUZ4Qjs7YUFJQSx1RUFBQSxHQUNvRSxRQURwRSxHQUM2RTtJQU50RTs7OztLQTVpQm1CO0FBaEI5QiIsInNvdXJjZXNDb250ZW50IjpbIntDb21wb3NpdGVEaXNwb3NhYmxlfSAgPSByZXF1aXJlICdhdG9tJ1xue1ZpZXcsJH0gPSByZXF1aXJlICdhdG9tLXNwYWNlLXBlbi12aWV3cydcbiQgPSBqUSA9IHJlcXVpcmUgJ2pxdWVyeSdcbnJlcXVpcmUgJ2pxdWVyeS11aS9hdXRvY29tcGxldGUnXG5wYXRoID0gcmVxdWlyZSAncGF0aCdcbnJlcXVpcmUgJ0pTT04yJ1xuXG5mcyA9IHJlcXVpcmUgJ2ZzJ1xucmVxdWlyZSAnanN0b3JhZ2UnXG53aW5kb3cuYnAgPSB7fVxud2luZG93LmJwLmpzICA9ICQuZXh0ZW5kKHt9LHdpbmRvdy4kLmpTdG9yYWdlKVxuXG5SZWdFeHAuZXNjYXBlPSAocyktPlxuICBzLnJlcGxhY2UgL1stXFwvXFxcXF4kKis/LigpfFtcXF17fV0vZywgJ1xcXFwkJidcblxubW9kdWxlLmV4cG9ydHMgPVxuY2xhc3MgQnJvd3NlclBsdXNWaWV3IGV4dGVuZHMgVmlld1xuICBjb25zdHJ1Y3RvcjogKEBtb2RlbCktPlxuICAgIEBzdWJzY3JpcHRpb25zID0gbmV3IENvbXBvc2l0ZURpc3Bvc2FibGVcbiAgICBAbW9kZWwudmlldyA9IEBcbiAgICBAbW9kZWwub25EaWREZXN0cm95ID0+XG4gICAgICBAc3Vic2NyaXB0aW9ucy5kaXNwb3NlKClcbiAgICAgIGpRKEB1cmwpLmF1dG9jb21wbGV0ZT8oJ2Rlc3Ryb3knKVxuICAgIGF0b20ubm90aWZpY2F0aW9ucy5vbkRpZEFkZE5vdGlmaWNhdGlvbiAobm90aWZpY2F0aW9uKSAtPlxuICAgICAgaWYgbm90aWZpY2F0aW9uLnR5cGUgPT0gJ2luZm8nXG4gICAgICAgIHNldFRpbWVvdXQgKCkgLT5cbiAgICAgICAgICBub3RpZmljYXRpb24uZGlzbWlzcygpXG4gICAgICAgICwgMTAwMFxuICAgIHN1cGVyXG5cbiAgQGNvbnRlbnQ6IChwYXJhbXMpLT5cbiAgICB1cmwgID0gcGFyYW1zLnVybFxuICAgIHNwaW5uZXJDbGFzcyA9IFwiZmEgZmEtc3Bpbm5lclwiXG4gICAgaGlkZVVSTEJhciA9ICcnXG4gICAgaWYgcGFyYW1zLm9wdD8uaGlkZVVSTEJhclxuICAgICAgaGlkZVVSTEJhciA9ICdoaWRlVVJMQmFyJ1xuICAgIGlmIHBhcmFtcy5vcHQ/LnNyY1xuICAgICAgcGFyYW1zLnNyYyA9IEJyb3dzZXJQbHVzVmlldy5jaGVja0Jhc2UocGFyYW1zLm9wdC5zcmMscGFyYW1zLnVybClcbiAgICAgIHBhcmFtcy5zcmMgPSBwYXJhbXMuc3JjLnJlcGxhY2UoL1wiL2csXCInXCIpXG4gICAgICB1bmxlc3MgcGFyYW1zLnNyYz8uc3RhcnRzV2l0aCBcImRhdGE6dGV4dC9odG1sLFwiXG4gICAgICAgIHBhcmFtcy5zcmMgPSBcImRhdGE6dGV4dC9odG1sLCN7cGFyYW1zLnNyY31cIlxuICAgICAgdXJsID0gcGFyYW1zLnNyYyB1bmxlc3MgdXJsXG4gICAgaWYgcGFyYW1zLnVybD8uc3RhcnRzV2l0aCBcImJyb3dzZXItcGx1czovL1wiXG4gICAgICB1cmwgPSBwYXJhbXMuYnJvd3NlclBsdXM/LmdldEJyb3dzZXJQbHVzVXJsPyh1cmwpXG4gICAgICBzcGlubmVyQ2xhc3MgKz0gXCIgZmEtY3VzdG9tXCJcblxuICAgIEBkaXYgY2xhc3M6J2Jyb3dzZXItcGx1cycsID0+XG4gICAgICBAZGl2IGNsYXNzOlwidXJsIG5hdGl2ZS1rZXktYmluZGluZ3MgI3toaWRlVVJMQmFyfVwiLG91dGxldDondXJsYmFyJywgPT5cbiAgICAgICAgQGRpdiBjbGFzczogJ25hdi1idG5zLWxlZnQnLCA9PlxuICAgICAgICAgIEBzcGFuIGlkOidiYWNrJyxjbGFzczonbWVnYS1vY3RpY29uIG9jdGljb24tYXJyb3ctbGVmdCcsb3V0bGV0OiAnYmFjaydcbiAgICAgICAgICBAc3BhbiBpZDonZm9yd2FyZCcsY2xhc3M6J21lZ2Etb2N0aWNvbiBvY3RpY29uLWFycm93LXJpZ2h0JyxvdXRsZXQ6ICdmb3J3YXJkJ1xuICAgICAgICAgIEBzcGFuIGlkOidyZWZyZXNoJyxjbGFzczonbWVnYS1vY3RpY29uIG9jdGljb24tc3luYycsb3V0bGV0OiAncmVmcmVzaCdcbiAgICAgICAgICBAc3BhbiBpZDonaGlzdG9yeScsY2xhc3M6J21lZ2Etb2N0aWNvbiBvY3RpY29uLWJvb2snLG91dGxldDogJ2hpc3RvcnknXG4gICAgICAgICAgQHNwYW4gaWQ6J2ZhdicsY2xhc3M6J21lZ2Etb2N0aWNvbiBvY3RpY29uLXN0YXInLG91dGxldDogJ2ZhdidcbiAgICAgICAgICBAc3BhbiBpZDonZmF2TGlzdCcsIGNsYXNzOidvY3RpY29uIG9jdGljb24tYXJyb3ctZG93bicsb3V0bGV0OiAnZmF2TGlzdCdcbiAgICAgICAgICBAYSBjbGFzczpzcGlubmVyQ2xhc3MsIG91dGxldDogJ3NwaW5uZXInXG5cbiAgICAgICAgQGRpdiBjbGFzczonbmF2LWJ0bnMnLCA9PlxuICAgICAgICAgIEBkaXYgY2xhc3M6ICduYXYtYnRucy1yaWdodCcsID0+XG4gICAgICAgICAgICAjIEBzcGFuIGlkOidwZGYnLGNsYXNzOidtZWdhLW9jdGljb24gb2N0aWNvbi1maWxlLXBkZicsb3V0bGV0OiAncGRmJ1xuICAgICAgICAgICAgQHNwYW4gaWQ6J25ld1RhYicsIGNsYXNzOidvY3RpY29uJyxvdXRsZXQ6ICduZXdUYWInLCBcIlxcdTI3OTVcIlxuICAgICAgICAgICAgQHNwYW4gaWQ6J3ByaW50JyxjbGFzczonaWNvbi1icm93c2VyLXBsdXNzIGljb24tcHJpbnQnLG91dGxldDogJ3ByaW50J1xuICAgICAgICAgICAgQHNwYW4gaWQ6J3JlbWVtYmVyJyxjbGFzczonbWVnYS1vY3RpY29uIG9jdGljb24tcGluJyxvdXRsZXQ6J3JlbWVtYmVyJ1xuICAgICAgICAgICAgQHNwYW4gaWQ6J2xpdmUnLGNsYXNzOidtZWdhLW9jdGljb24gb2N0aWNvbi16YXAnLG91dGxldDonbGl2ZSdcbiAgICAgICAgICAgIEBzcGFuIGlkOidkZXZ0b29sJyxjbGFzczonbWVnYS1vY3RpY29uIG9jdGljb24tdG9vbHMnLG91dGxldDonZGV2dG9vbCdcblxuICAgICAgICAgIEBkaXYgY2xhc3M6J2lucHV0LXVybCcsID0+XG4gICAgICAgICAgICBAaW5wdXQgY2xhc3M6XCJuYXRpdmUta2V5LWJpbmRpbmdzXCIsIHR5cGU6J3RleHQnLGlkOid1cmwnLG91dGxldDondXJsJyx2YWx1ZTpcIiN7cGFyYW1zLnVybH1cIiAjI3tAdXJsfVwiXG4gICAgICAgIEBpbnB1dCBpZDonZmluZCcsY2xhc3M6J2ZpbmQgZmluZC1oaWRlJyxvdXRsZXQ6J2ZpbmQnXG4gICAgICBAdGFnICd3ZWJ2aWV3JyxjbGFzczpcIm5hdGl2ZS1rZXktYmluZGluZ3NcIixvdXRsZXQ6ICdodG1sdicgLHByZWxvYWQ6XCJmaWxlOi8vLyN7cGFyYW1zLmJyb3dzZXJQbHVzLnJlc291cmNlc30vYnAtY2xpZW50LmpzXCIsXG4gICAgICBwbHVnaW5zOidvbicsc3JjOlwiI3t1cmx9XCIsIGRpc2FibGV3ZWJzZWN1cml0eTonb24nLCBhbGxvd2ZpbGVhY2Nlc3Nmcm9tZmlsZXM6J29uJywgYWxsb3dQb2ludGVyTG9jazonb24nXG5cbiAgdG9nZ2xlVVJMQmFyOiAtPlxuICAgIEB1cmxiYXIudG9nZ2xlKClcblxuICBpbml0aWFsaXplOiAtPlxuICAgICAgc3JjID0gKHJlcSxyZXMpPT5cbiAgICAgICAgXyA9IHJlcXVpcmUgJ2xvZGFzaCdcbiAgICAgICAgIyBjaGVjayBmYXZvcml0ZXNcbiAgICAgICAgcGF0dGVybiA9IC8vL1xuICAgICAgICAgICAgICAgICAgICAje1JlZ0V4cC5lc2NhcGUgcmVxLnRlcm19XG4gICAgICAgICAgICAgICAgICAvLy9pXG4gICAgICAgIGZhdiA9IF8uZmlsdGVyIHdpbmRvdy5icC5qcy5nZXQoJ2JwLmZhdicpLChmYXYpLT5cbiAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gZmF2LnVybC5tYXRjaChwYXR0ZXJuKSBvciBmYXYudGl0bGUubWF0Y2gocGF0dGVybilcbiAgICAgICAgdXJscyA9IF8ucGx1Y2soZmF2LFwidXJsXCIpXG5cbiAgICAgICAgcmVzKHVybHMpXG4gICAgICAgIHNlYXJjaFVybCA9ICdodHRwOi8vYXBpLmJpbmcuY29tL29zanNvbi5hc3B4J1xuICAgICAgICBkbyAtPlxuICAgICAgICAgIGpRLmFqYXhcbiAgICAgICAgICAgICAgdXJsOiBzZWFyY2hVcmxcbiAgICAgICAgICAgICAgZGF0YVR5cGU6ICdqc29uJ1xuICAgICAgICAgICAgICBkYXRhOiB7cXVlcnk6cmVxLnRlcm0sICd3ZWIuY291bnQnOiAxMH1cbiAgICAgICAgICAgICAgc3VjY2VzczogKGRhdGEpPT5cbiAgICAgICAgICAgICAgICB1cmxzID0gdXJsc1swLi4xMF1cbiAgICAgICAgICAgICAgICBzZWFyY2ggPSBcImh0dHA6Ly93d3cuZ29vZ2xlLmNvbS9zZWFyY2g/YXNfcT1cIlxuICAgICAgICAgICAgICAgIGZvciBkYXQgaW4gZGF0YVsxXVswLi4xMF1cbiAgICAgICAgICAgICAgICAgIHVybHMucHVzaFxuICAgICAgICAgICAgICAgICAgICAgICAgbGFiZWw6IGRhdFxuICAgICAgICAgICAgICAgICAgICAgICAgdmFsdWU6IHNlYXJjaCtkYXRcbiAgICAgICAgICAgICAgICByZXModXJscylcblxuICAgICAgc2VsZWN0ID0gKGV2ZW50LHVpKT0+XG4gICAgICAgIEBnb1RvVXJsKHVpLml0ZW0udmFsdWUpXG5cbiAgICAgIGpRKEB1cmwpLmF1dG9jb21wbGV0ZT8oXG4gICAgICAgICAgc291cmNlOiBzcmNcbiAgICAgICAgICBtaW5MZW5ndGg6IDJcbiAgICAgICAgICBzZWxlY3Q6IHNlbGVjdClcbiAgICAgIEBzdWJzY3JpcHRpb25zLmFkZCBhdG9tLnRvb2x0aXBzLmFkZCBAYmFjaywgdGl0bGU6ICdCYWNrJ1xuICAgICAgQHN1YnNjcmlwdGlvbnMuYWRkIGF0b20udG9vbHRpcHMuYWRkIEBmb3J3YXJkLCB0aXRsZTogJ0ZvcndhcmQnXG4gICAgICBAc3Vic2NyaXB0aW9ucy5hZGQgYXRvbS50b29sdGlwcy5hZGQgQHJlZnJlc2gsIHRpdGxlOiAnUmVmcmVzaC1mNS9jdHJsLWY1J1xuICAgICAgQHN1YnNjcmlwdGlvbnMuYWRkIGF0b20udG9vbHRpcHMuYWRkIEBwcmludCwgdGl0bGU6ICdQcmludCdcbiAgICAgIEBzdWJzY3JpcHRpb25zLmFkZCBhdG9tLnRvb2x0aXBzLmFkZCBAaGlzdG9yeSwgdGl0bGU6ICdIaXN0b3J5J1xuICAgICAgQHN1YnNjcmlwdGlvbnMuYWRkIGF0b20udG9vbHRpcHMuYWRkIEBmYXZMaXN0LCB0aXRsZTogJ1ZpZXcgRmF2b3JpdGVzJ1xuICAgICAgQHN1YnNjcmlwdGlvbnMuYWRkIGF0b20udG9vbHRpcHMuYWRkIEBmYXYsIHRpdGxlOiAnRmF2b3JpdGl6ZSdcbiAgICAgIEBzdWJzY3JpcHRpb25zLmFkZCBhdG9tLnRvb2x0aXBzLmFkZCBAbGl2ZSwgdGl0bGU6ICdMaXZlJ1xuICAgICAgQHN1YnNjcmlwdGlvbnMuYWRkIGF0b20udG9vbHRpcHMuYWRkIEByZW1lbWJlciwgdGl0bGU6ICdSZW1lbWJlciBQb3NpdGlvbidcbiAgICAgIEBzdWJzY3JpcHRpb25zLmFkZCBhdG9tLnRvb2x0aXBzLmFkZCBAbmV3VGFiLCB0aXRsZTogJ05ldyBUYWInXG4gICAgICBAc3Vic2NyaXB0aW9ucy5hZGQgYXRvbS50b29sdGlwcy5hZGQgQGRldnRvb2wsIHRpdGxlOiAnRGV2IFRvb2xzLWYxMidcblxuICAgICAgQHN1YnNjcmlwdGlvbnMuYWRkIGF0b20uY29tbWFuZHMuYWRkICcuYnJvd3Nlci1wbHVzIHdlYnZpZXcnLCAnYnJvd3Nlci1wbHVzLXZpZXc6Z29CYWNrJzogPT4gQGdvQmFjaygpXG4gICAgICBAc3Vic2NyaXB0aW9ucy5hZGQgYXRvbS5jb21tYW5kcy5hZGQgJy5icm93c2VyLXBsdXMgd2VidmlldycsICdicm93c2VyLXBsdXMtdmlldzpnb0ZvcndhcmQnOiA9PiBAZ29Gb3J3YXJkKClcbiAgICAgIEBzdWJzY3JpcHRpb25zLmFkZCBhdG9tLmNvbW1hbmRzLmFkZCAnLmJyb3dzZXItcGx1cycsICdicm93c2VyLXBsdXMtdmlldzp0b2dnbGVVUkxCYXInOiA9PiBAdG9nZ2xlVVJMQmFyKClcblxuICAgICAgQGxpdmVPbiA9IGZhbHNlXG4gICAgICBAZWxlbWVudC5vbmtleWRvd24gPSA9PkBrZXlIYW5kbGVyKGFyZ3VtZW50cylcbiAgICAgIEBjaGVja0ZhdigpIGlmIEBtb2RlbC51cmwuaW5kZXhPZignZmlsZTovLy8nKSA+PSAwXG4gICAgICAjIEFycmF5Lm9ic2VydmUgQG1vZGVsLmJyb3dzZXJQbHVzLmZhdiwgKGVsZSk9PlxuICAgICAgIyAgIEBjaGVja0ZhdigpXG5cbiAgICAgIEBodG1sdlswXT8uYWRkRXZlbnRMaXN0ZW5lciBcInBlcm1pc3Npb25yZXF1ZXN0XCIsIChlKS0+XG4gICAgICAgIGUucmVxdWVzdC5hbGxvdygpXG5cbiAgICAgIEBodG1sdlswXT8uYWRkRXZlbnRMaXN0ZW5lciBcImNvbnNvbGUtbWVzc2FnZVwiLCAoZSk9PlxuICAgICAgICBpZiBlLm1lc3NhZ2UuaW5jbHVkZXMoJ35icm93c2VyLXBsdXMtcG9zaXRpb25+JykgYW5kIEByZW1lbWJlck9uXG4gICAgICAgICAgZGF0YSA9IGUubWVzc2FnZS5yZXBsYWNlKCd+YnJvd3Nlci1wbHVzLXBvc2l0aW9uficsJycpXG4gICAgICAgICAgaW5keCA9IGRhdGEuaW5kZXhPZignLCcpXG4gICAgICAgICAgdG9wID0gZGF0YS5zdWJzdHIoMCxpbmR4KVxuICAgICAgICAgIGxlZnQgPSBkYXRhLnN1YnN0cihpbmR4ICsgMSlcbiAgICAgICAgICBAY3VyUG9zID0ge1widG9wXCI6dG9wLFwibGVmdFwiOmxlZnR9XG4gICAgICAgICAgQGhyZWYgPSBAdXJsLnZhbCgpXG5cbiAgICAgICAgaWYgZS5tZXNzYWdlLmluY2x1ZGVzKCd+YnJvd3Nlci1wbHVzLWpxdWVyeX4nKSBvciBlLm1lc3NhZ2UuaW5jbHVkZXMoJ35icm93c2VyLXBsdXMtbWVudX4nKVxuICAgICAgICAgIGlmIGUubWVzc2FnZS5pbmNsdWRlcygnfmJyb3dzZXItcGx1cy1qcXVlcnl+JylcbiAgICAgICAgICAgIEBtb2RlbC5icm93c2VyUGx1cy5qUXVlcnlKUyA/PSBCcm93c2VyUGx1c1ZpZXcuZ2V0SlF1ZXJ5LmNhbGwgQFxuICAgICAgICAgICAgQGh0bWx2WzBdPy5leGVjdXRlSmF2YVNjcmlwdCBAbW9kZWwuYnJvd3NlclBsdXMualF1ZXJ5SlNcblxuICAgICAgICAgIGlmIEByZW1lbWJlck9uXG4gICAgICAgICAgICBpZiBAbW9kZWwuaGFzaHVybFxuICAgICAgICAgICAgICBAbW9kZWwudXJsID0gQG1vZGVsLmhhc2h1cmxcbiAgICAgICAgICAgICAgQG1vZGVsLmhhc2h1cmwgPSB1bmRlZmluZWRcbiAgICAgICAgICAgICAgQHVybC52YWwoQG1vZGVsLnVybClcbiAgICAgICAgICAgICAgQGh0bWx2WzBdPy5leGVjdXRlSmF2YVNjcmlwdCBcIlwiXCJcbiAgICAgICAgICAgICAgICAgIGxvY2F0aW9uLmhyZWYgPSAnI3tAbW9kZWwudXJsfSdcbiAgICAgICAgICAgICAgICAgIFwiXCJcIlxuICAgICAgICAgICAgaWYgQHJlbWVtYmVyT24gYW5kIEBtb2RlbC51cmwgaXMgQGhyZWZcbiAgICAgICAgICAgICAgQGh0bWx2WzBdPy5leGVjdXRlSmF2YVNjcmlwdCBcIlwiXCJcbiAgICAgICAgICAgICAgICBqUXVlcnkod2luZG93KS5zY3JvbGxUb3AoI3tAY3VyUG9zLnRvcH0pO1xuICAgICAgICAgICAgICAgIGpRdWVyeSh3aW5kb3cpLnNjcm9sbExlZnQoI3tAY3VyUG9zLmxlZnR9KTtcbiAgICAgICAgICAgICAgXCJcIlwiXG5cbiAgICAgICAgICBAbW9kZWwuYnJvd3NlclBsdXMualN0b3JhZ2VKUyA/PSBCcm93c2VyUGx1c1ZpZXcuZ2V0SlN0b3JhZ2UuY2FsbCBAXG4gICAgICAgICAgQGh0bWx2WzBdPy5leGVjdXRlSmF2YVNjcmlwdCBAbW9kZWwuYnJvd3NlclBsdXMualN0b3JhZ2VKU1xuXG4gICAgICAgICAgQG1vZGVsLmJyb3dzZXJQbHVzLndhdGNoanMgPz0gQnJvd3NlclBsdXNWaWV3LmdldFdhdGNoanMuY2FsbCBAXG4gICAgICAgICAgQGh0bWx2WzBdPy5leGVjdXRlSmF2YVNjcmlwdCBAbW9kZWwuYnJvd3NlclBsdXMud2F0Y2hqc1xuXG4gICAgICAgICAgQG1vZGVsLmJyb3dzZXJQbHVzLmhvdEtleXMgPz0gQnJvd3NlclBsdXNWaWV3LmdldEhvdEtleXMuY2FsbCBAXG4gICAgICAgICAgQGh0bWx2WzBdPy5leGVjdXRlSmF2YVNjcmlwdCBAbW9kZWwuYnJvd3NlclBsdXMuaG90S2V5c1xuXG4gICAgICAgICAgQG1vZGVsLmJyb3dzZXJQbHVzLm5vdGlmeUJhciA/PSBCcm93c2VyUGx1c1ZpZXcuZ2V0Tm90aWZ5QmFyLmNhbGwgQFxuICAgICAgICAgIEBodG1sdlswXT8uZXhlY3V0ZUphdmFTY3JpcHQgQG1vZGVsLmJyb3dzZXJQbHVzLm5vdGlmeUJhclxuICAgICAgICAgIGlmIGluaXRzID0gQG1vZGVsLmJyb3dzZXJQbHVzLnBsdWdpbnM/Lm9uSW5pdFxuICAgICAgICAgICAgZm9yIGluaXQgaW4gaW5pdHNcbiAgICAgICAgICAgICAgIyBpbml0ID0gXCIoI3tpbml0LnRvU3RyaW5nKCl9KSgpXCJcbiAgICAgICAgICAgICAgQGh0bWx2WzBdPy5leGVjdXRlSmF2YVNjcmlwdCBpbml0XG4gICAgICAgICAgaWYganNzID0gQG1vZGVsLmJyb3dzZXJQbHVzLnBsdWdpbnM/Lmpzc1xuICAgICAgICAgICAgZm9yIGpzIGluIGpzc1xuICAgICAgICAgICAgICBAaHRtbHZbMF0/LmV4ZWN1dGVKYXZhU2NyaXB0IEJyb3dzZXJQbHVzVmlldy5sb2FkSlMuY2FsbChALGpzLHRydWUpXG5cbiAgICAgICAgICBpZiBjc3NzID0gQG1vZGVsLmJyb3dzZXJQbHVzLnBsdWdpbnM/LmNzc3NcbiAgICAgICAgICAgIGZvciBjc3MgaW4gY3Nzc1xuICAgICAgICAgICAgICBAaHRtbHZbMF0/LmV4ZWN1dGVKYXZhU2NyaXB0IEJyb3dzZXJQbHVzVmlldy5sb2FkQ1NTLmNhbGwoQCxjc3MsdHJ1ZSlcblxuICAgICAgICAgIGlmIG1lbnVzID0gQG1vZGVsLmJyb3dzZXJQbHVzLnBsdWdpbnM/Lm1lbnVzXG4gICAgICAgICAgICBmb3IgbWVudSBpbiBtZW51c1xuICAgICAgICAgICAgICBtZW51LmZuID0gbWVudS5mbi50b1N0cmluZygpIGlmIG1lbnUuZm5cbiAgICAgICAgICAgICAgbWVudS5zZWxlY3RvckZpbHRlciA9IG1lbnUuc2VsZWN0b3JGaWx0ZXIudG9TdHJpbmcoKSBpZiBtZW51LnNlbGVjdG9yRmlsdGVyXG4gICAgICAgICAgICAgIEBodG1sdlswXT8uZXhlY3V0ZUphdmFTY3JpcHQgXCJicm93c2VyUGx1cy5tZW51KCN7SlNPTi5zdHJpbmdpZnkobWVudSl9KVwiXG5cbiAgICAgICAgICBAaHRtbHZbMF0/LmV4ZWN1dGVKYXZhU2NyaXB0IEJyb3dzZXJQbHVzVmlldy5sb2FkQ1NTLmNhbGwgQCwnYnAtc3R5bGUuY3NzJ1xuICAgICAgICAgIEBodG1sdlswXT8uZXhlY3V0ZUphdmFTY3JpcHQgQnJvd3NlclBsdXNWaWV3LmxvYWRDU1MuY2FsbCBALCdqcXVlcnkubm90aWZ5QmFyLmNzcydcblxuICAgICAgQGh0bWx2WzBdPy5hZGRFdmVudExpc3RlbmVyIFwicGFnZS1mYXZpY29uLXVwZGF0ZWRcIiwgKGUpPT5cbiAgICAgICAgXyA9IHJlcXVpcmUgJ2xvZGFzaCdcbiAgICAgICAgZmF2ciA9IHdpbmRvdy5icC5qcy5nZXQoJ2JwLmZhdicpXG4gICAgICAgIGlmIGZhdiA9IF8uZmluZCggZmF2cix7J3VybCc6QG1vZGVsLnVybH0gKVxuICAgICAgICAgIGZhdi5mYXZJY29uID0gZS5mYXZpY29uc1swXVxuICAgICAgICAgIHdpbmRvdy5icC5qcy5zZXQoJ2JwLmZhdicsZmF2cilcblxuICAgICAgICBAbW9kZWwuaWNvbk5hbWUgPSBNYXRoLmZsb29yKE1hdGgucmFuZG9tKCkqMTAwMDApLnRvU3RyaW5nKClcbiAgICAgICAgQG1vZGVsLmZhdkljb24gPSBlLmZhdmljb25zWzBdXG4gICAgICAgIEBtb2RlbC51cGRhdGVJY29uIGUuZmF2aWNvbnNbMF1cbiAgICAgICAgZmF2SWNvbiA9IHdpbmRvdy5icC5qcy5nZXQoJ2JwLmZhdkljb24nKVxuICAgICAgICB1cmkgPSBAaHRtbHZbMF0uZ2V0VVJMKClcbiAgICAgICAgcmV0dXJuIHVubGVzcyB1cmlcbiAgICAgICAgZmF2SWNvblt1cmldID0gZS5mYXZpY29uc1swXVxuICAgICAgICB3aW5kb3cuYnAuanMuc2V0KCdicC5mYXZJY29uJyxmYXZJY29uKVxuICAgICAgICBAbW9kZWwudXBkYXRlSWNvbigpXG4gICAgICAgIHN0eWxlID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnc3R5bGUnKVxuICAgICAgICBzdHlsZS50eXBlID0gJ3RleHQvY3NzJ1xuICAgICAgICBzdHlsZS5pbm5lckhUTUwgPSBcIlwiXCJcbiAgICAgICAgICAgIC50aXRsZS5pY29uLmljb24tI3tAbW9kZWwuaWNvbk5hbWV9IHtcbiAgICAgICAgICAgICAgYmFja2dyb3VuZC1zaXplOiAxNnB4IDE2cHg7XG4gICAgICAgICAgICAgIGJhY2tncm91bmQtcmVwZWF0OiBuby1yZXBlYXQ7XG4gICAgICAgICAgICAgIHBhZGRpbmctbGVmdDogMjBweDtcbiAgICAgICAgICAgICAgYmFja2dyb3VuZC1pbWFnZTogdXJsKCcje2UuZmF2aWNvbnNbMF19Jyk7XG4gICAgICAgICAgICAgIGJhY2tncm91bmQtcG9zaXRpb24teTogNTAlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIFwiXCJcIlxuICAgICAgICBkb2N1bWVudC5nZXRFbGVtZW50c0J5VGFnTmFtZSgnaGVhZCcpWzBdLmFwcGVuZENoaWxkKHN0eWxlKVxuXG4gICAgICBAaHRtbHZbMF0/LmFkZEV2ZW50TGlzdGVuZXIgXCJkaWQtbmF2aWdhdGUtaW4tcGFnZVwiLCAoZXZ0KT0+XG4gICAgICAgIEB1cGRhdGVQYWdlVXJsKGV2dCk7XG5cbiAgICAgIEBodG1sdlswXT8uYWRkRXZlbnRMaXN0ZW5lciBcImRpZC1uYXZpZ2F0ZVwiLCAoZXZ0KT0+XG4gICAgICAgIEB1cGRhdGVQYWdlVXJsKGV2dCk7XG5cbiAgICAgIEBodG1sdlswXT8uYWRkRXZlbnRMaXN0ZW5lciBcInBhZ2UtdGl0bGUtc2V0XCIsIChlKT0+XG4gICAgICAgICMgQG1vZGVsLmJyb3dzZXJQbHVzLnRpdGxlW0Btb2RlbC51cmxdID0gZS50aXRsZVxuICAgICAgICBfID0gcmVxdWlyZSAnbG9kYXNoJ1xuICAgICAgICBmYXZyID0gd2luZG93LmJwLmpzLmdldCgnYnAuZmF2JylcbiAgICAgICAgdGl0bGUgPSB3aW5kb3cuYnAuanMuZ2V0KCdicC50aXRsZScpXG4gICAgICAgIHVyaSA9IEBodG1sdlswXS5nZXRVUkwoKVxuICAgICAgICByZXR1cm4gdW5sZXNzIHVyaVxuICAgICAgICB0aXRsZVt1cmldID0gZS50aXRsZVxuICAgICAgICB3aW5kb3cuYnAuanMuc2V0KCdicC50aXRsZScsdGl0bGUpXG4gICAgICAgIGlmIGZhdiAgPSBfLmZpbmQoIGZhdnIseyd1cmwnOkBtb2RlbC51cmx9IClcbiAgICAgICAgICBmYXYudGl0bGUgPSBlLnRpdGxlXG4gICAgICAgICAgd2luZG93LmJwLmpzLnNldCgnYnAuZmF2JyxmYXZyKVxuICAgICAgICBAbW9kZWwuc2V0VGl0bGUoZS50aXRsZSlcblxuICAgICAgQGRldnRvb2wub24gJ2NsaWNrJywgKGV2dCk9PlxuICAgICAgICBAdG9nZ2xlRGV2VG9vbCgpXG5cbiAgICAgIEBzcGlubmVyLm9uICdjbGljaycsIChldnQpPT5cbiAgICAgICAgQGh0bWx2WzBdPy5zdG9wKClcblxuICAgICAgQHJlbWVtYmVyLm9uICdjbGljaycsIChldnQpPT5cbiAgICAgICAgQHJlbWVtYmVyT24gPSAhQHJlbWVtYmVyT25cbiAgICAgICAgQHJlbWVtYmVyLnRvZ2dsZUNsYXNzKCdhY3RpdmUnLEByZW1lbWJlck9uKVxuXG4gICAgICBAcHJpbnQub24gJ2NsaWNrJywgKGV2dCk9PlxuICAgICAgICBAaHRtbHZbMF0/LnByaW50KClcblxuICAgICAgQG5ld1RhYi5vbiAnY2xpY2snLCAoZXZ0KT0+XG4gICAgICAgIGF0b20ud29ya3NwYWNlLm9wZW4gXCJicm93c2VyLXBsdXM6Ly9ibGFua1wiXG4gICAgICAgIEBzcGlubmVyLnJlbW92ZUNsYXNzICdmYS1jdXN0b20nXG5cbiAgICAgIEBoaXN0b3J5Lm9uICdjbGljaycsIChldnQpPT5cbiAgICAgICAgIyBhdG9tLndvcmtzcGFjZS5vcGVuIFwiZmlsZTovLy8je0Btb2RlbC5icm93c2VyUGx1cy5yZXNvdXJjZXN9aGlzdG9yeS5odG1sXCIgLCB7c3BsaXQ6ICdsZWZ0JyxzZWFyY2hBbGxQYW5lczp0cnVlfVxuICAgICAgICBhdG9tLndvcmtzcGFjZS5vcGVuIFwiYnJvd3Nlci1wbHVzOi8vaGlzdG9yeVwiICwge3NwbGl0OiAnbGVmdCcsc2VhcmNoQWxsUGFuZXM6dHJ1ZX1cblxuICAgICAgIyBAcGRmLm9uICdjbGljaycsIChldnQpPT5cbiAgICAgICMgICBAaHRtbHZbMF0/LnByaW50VG9QREYge30sIChkYXRhLGVyciktPlxuXG4gICAgICBAbGl2ZS5vbiAnY2xpY2snLCAoZXZ0KT0+XG4gICAgICAgICMgcmV0dXJuIGlmIEBtb2RlbC5zcmNcbiAgICAgICAgQGxpdmVPbiA9ICFAbGl2ZU9uXG4gICAgICAgIEBsaXZlLnRvZ2dsZUNsYXNzKCdhY3RpdmUnLEBsaXZlT24pXG4gICAgICAgIGlmIEBsaXZlT25cbiAgICAgICAgICBAcmVmcmVzaFBhZ2UoKVxuICAgICAgICAgIEBsaXZlU3Vic2NyaXB0aW9uID0gbmV3IENvbXBvc2l0ZURpc3Bvc2FibGVcbiAgICAgICAgICBAbGl2ZVN1YnNjcmlwdGlvbi5hZGQgYXRvbS53b3Jrc3BhY2Uub2JzZXJ2ZVRleHRFZGl0b3JzIChlZGl0b3IpPT5cbiAgICAgICAgICAgICAgICAgIEBsaXZlU3Vic2NyaXB0aW9uLmFkZCBlZGl0b3Iub25EaWRTYXZlID0+XG4gICAgICAgICAgICAgICAgICAgICAgICB0aW1lb3V0ID0gYXRvbS5jb25maWcuZ2V0KCdicm93c2VyLXBsdXMubGl2ZScpXG4gICAgICAgICAgICAgICAgICAgICAgICBzZXRUaW1lb3V0ID0+XG4gICAgICAgICAgICAgICAgICAgICAgICAgIEByZWZyZXNoUGFnZSgpXG4gICAgICAgICAgICAgICAgICAgICAgICAsIHRpbWVvdXRcbiAgICAgICAgICBAbW9kZWwub25EaWREZXN0cm95ID0+XG4gICAgICAgICAgICBAbGl2ZVN1YnNjcmlwdGlvbi5kaXNwb3NlKClcbiAgICAgICAgZWxzZVxuICAgICAgICAgIEBsaXZlU3Vic2NyaXB0aW9uLmRpc3Bvc2UoKVxuXG5cbiAgICAgIEBmYXYub24gJ2NsaWNrJywoZXZ0KT0+XG4gICAgICAgICMgcmV0dXJuIGlmIEBtb2RlbC5zcmNcbiAgICAgICAgIyByZXR1cm4gaWYgQGh0bWx2WzBdPy5nZXRVcmwoKS5zdGFydHNXaXRoKCdkYXRhOnRleHQvaHRtbCwnKVxuICAgICAgICAjIHJldHVybiBpZiBAbW9kZWwudXJsLnN0YXJ0c1dpdGggJ2Jyb3dzZXItcGx1czonXG4gICAgICAgIGZhdnMgPSB3aW5kb3cuYnAuanMuZ2V0KCdicC5mYXYnKVxuICAgICAgICBpZiBAZmF2Lmhhc0NsYXNzKCdhY3RpdmUnKVxuICAgICAgICAgIEByZW1vdmVGYXYoQG1vZGVsKVxuICAgICAgICBlbHNlXG4gICAgICAgICAgcmV0dXJuIGlmIEBtb2RlbC5vcmdVUklcbiAgICAgICAgICBkYXRhID0ge1xuICAgICAgICAgICAgdXJsOiBAbW9kZWwudXJsXG4gICAgICAgICAgICB0aXRsZTogQG1vZGVsLnRpdGxlIG9yIEBtb2RlbC51cmxcbiAgICAgICAgICAgIGZhdkljb246IEBtb2RlbC5mYXZJY29uXG4gICAgICAgICAgfVxuICAgICAgICAgIGZhdnMucHVzaCBkYXRhXG4gICAgICAgICAgZGVsQ291bnQgPSBmYXZzLmxlbmd0aCAtIGF0b20uY29uZmlnLmdldCAnYnJvd3Nlci1wbHVzLmZhdidcbiAgICAgICAgICBmYXZzLnNwbGljZSAwLCBkZWxDb3VudCBpZiBkZWxDb3VudCA+IDBcbiAgICAgICAgICB3aW5kb3cuYnAuanMuc2V0KCdicC5mYXYnLGZhdnMpXG4gICAgICAgIEBmYXYudG9nZ2xlQ2xhc3MgJ2FjdGl2ZSdcblxuICAgICAgQGh0bWx2WzBdPy5hZGRFdmVudExpc3RlbmVyICduZXctd2luZG93JywgKGUpLT5cbiAgICAgICAgYXRvbS53b3Jrc3BhY2Uub3BlbiBlLnVybCwge3NwbGl0OiAnbGVmdCcsc2VhcmNoQWxsUGFuZXM6dHJ1ZSxvcGVuSW5TYW1lV2luZG93OmZhbHNlfVxuXG4gICAgICBAaHRtbHZbMF0/LmFkZEV2ZW50TGlzdGVuZXIgXCJkaWQtc3RhcnQtbG9hZGluZ1wiLCA9PlxuICAgICAgICBAc3Bpbm5lci5yZW1vdmVDbGFzcyAnZmEtY3VzdG9tJ1xuICAgICAgICBAaHRtbHZbMF0/LnNoYWRvd1Jvb3QuZmlyc3RDaGlsZC5zdHlsZS5oZWlnaHQgPSAnOTUlJ1xuXG4gICAgICBAaHRtbHZbMF0/LmFkZEV2ZW50TGlzdGVuZXIgXCJkaWQtc3RvcC1sb2FkaW5nXCIsID0+XG4gICAgICAgIEBzcGlubmVyLmFkZENsYXNzICdmYS1jdXN0b20nXG5cbiAgICAgIEBiYWNrLm9uICdjbGljaycsIChldnQpPT5cbiAgICAgICAgaWYgQGh0bWx2WzBdPy5jYW5Hb0JhY2soKSBhbmQgJChgIHRoaXNgKS5oYXNDbGFzcygnYWN0aXZlJylcbiAgICAgICAgICBAaHRtbHZbMF0/LmdvQmFjaygpXG5cbiAgICAgIEBmYXZMaXN0Lm9uICdjbGljaycsIChldnQpPT5cbiAgICAgICAgZmF2TGlzdCA9IHJlcXVpcmUgJy4vZmF2LXZpZXcnXG4gICAgICAgIG5ldyBmYXZMaXN0IHdpbmRvdy5icC5qcy5nZXQoJ2JwLmZhdicpXG5cbiAgICAgIEBmb3J3YXJkLm9uICdjbGljaycsIChldnQpPT5cbiAgICAgICAgaWYgQGh0bWx2WzBdPy5jYW5Hb0ZvcndhcmQoKSBhbmQgJChgIHRoaXNgKS5oYXNDbGFzcygnYWN0aXZlJylcbiAgICAgICAgICBAaHRtbHZbMF0/LmdvRm9yd2FyZCgpXG5cbiAgICAgIEB1cmwub24gJ2NsaWNrJywoZXZ0KT0+XG4gICAgICAgIEB1cmwuc2VsZWN0KClcblxuICAgICAgQHVybC5vbiAna2V5cHJlc3MnLChldnQpPT5cbiAgICAgICAgVVJMID0gcmVxdWlyZSAndXJsJ1xuICAgICAgICBpZiBldnQud2hpY2ggaXMgMTNcbiAgICAgICAgICBAdXJsLmJsdXIoKVxuICAgICAgICAgIHVybHMgPSBVUkwucGFyc2UoYCB0aGlzLnZhbHVlYClcbiAgICAgICAgICB1cmwgPSBgIHRoaXMudmFsdWVgXG4gICAgICAgICAgdW5sZXNzIHVybC5zdGFydHNXaXRoKCdicm93c2VyLXBsdXM6Ly8nKVxuICAgICAgICAgICAgaWYgdXJsLmluZGV4T2YoJyAnKSA+PSAwXG4gICAgICAgICAgICAgIHVybCA9IFwiaHR0cDovL3d3dy5nb29nbGUuY29tL3NlYXJjaD9hc19xPSN7dXJsfVwiXG4gICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgIGxvY2FsaG9zdFBhdHRlcm4gPSAvLy9eXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKGh0dHA6Ly8pP1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGxvY2FsaG9zdFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vL2lcbiAgICAgICAgICAgICAgaWYgdXJsLnNlYXJjaChsb2NhbGhvc3RQYXR0ZXJuKSA8IDAgICBhbmQgdXJsLmluZGV4T2YoJy4nKSA8IDBcbiAgICAgICAgICAgICAgICB1cmwgPSBcImh0dHA6Ly93d3cuZ29vZ2xlLmNvbS9zZWFyY2g/YXNfcT0je3VybH1cIlxuICAgICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgaWYgdXJscy5wcm90b2NvbCBpbiBbJ2h0dHAnLCdodHRwcycsJ2ZpbGU6J11cbiAgICAgICAgICAgICAgICAgIGlmIHVybHMucHJvdG9jb2wgaXMgJ2ZpbGU6J1xuICAgICAgICAgICAgICAgICAgICB1cmwgPSB1cmwucmVwbGFjZSgvXFxcXC9nLFwiL1wiKVxuICAgICAgICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgICAgICB1cmwgPSBVUkwuZm9ybWF0KHVybHMpXG4gICAgICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgICAgdXJscy5wcm90b2NvbCA9ICdodHRwJ1xuICAgICAgICAgICAgICAgICAgdXJsID0gVVJMLmZvcm1hdCh1cmxzKVxuICAgICAgICAgIEBnb1RvVXJsKHVybClcblxuICAgICAgQHJlZnJlc2gub24gJ2NsaWNrJywgKGV2dCk9PlxuICAgICAgICBAcmVmcmVzaFBhZ2UoKVxuXG4gICAgICAjIEBtb2JpbGUub24gJ2NsaWNrJywgKGV2dCk9PlxuICAgICAgIyAgIEBodG1sdlswXT8uc2V0VXNlckFnZW50KFwiTW96aWxsYS81LjAgKExpbnV4OyBBbmRyb2lkIDYuMDsgTmV4dXMgNSBCdWlsZC9NUkE1OE4pIEFwcGxlV2ViS2l0LzUzNy4zNiAoS0hUTUwsIGxpa2UgR2Vja28pIENocm9tZS82MS4wLjMxMzQuMCBNb2JpbGUgU2FmYXJpLzUzNy4zNlwiKVxuXG4gIHVwZGF0ZVBhZ2VVcmw6IChldnQpIC0+XG4gICAgICBCcm93c2VyUGx1c01vZGVsID0gcmVxdWlyZSAnLi9icm93c2VyLXBsdXMtbW9kZWwnXG4gICAgICB1cmwgPSBldnQudXJsXG4gICAgICB1bmxlc3MgQnJvd3NlclBsdXNNb2RlbC5jaGVja1VybCh1cmwpXG4gICAgICAgIHVybCA9IGF0b20uY29uZmlnLmdldCgnYnJvd3Nlci1wbHVzLmhvbWVwYWdlJykgb3IgXCJodHRwOi8vd3d3Lmdvb2dsZS5jb21cIlxuICAgICAgICBhdG9tLm5vdGlmaWNhdGlvbnMuYWRkU3VjY2VzcyhcIlJlZGlyZWN0aW5nIHRvICN7dXJsfVwiKVxuICAgICAgICBAaHRtbHZbMF0/LmV4ZWN1dGVKYXZhU2NyaXB0IFwibG9jYXRpb24uaHJlZiA9ICcje3VybH0nXCJcbiAgICAgICAgcmV0dXJuXG4gICAgICBpZiB1cmwgYW5kIHVybCBpc250IEBtb2RlbC51cmwgYW5kIG5vdCBAdXJsLnZhbCgpPy5zdGFydHNXaXRoICdicm93c2VyLXBsdXM6Ly8nXG4gICAgICAgIEB1cmwudmFsIHVybFxuICAgICAgICBAbW9kZWwudXJsID0gdXJsXG4gICAgICB0aXRsZSA9IEBodG1sdlswXT8uZ2V0VGl0bGUoKVxuICAgICAgaWYgdGl0bGVcbiAgICAgICAgIyBAbW9kZWwuYnJvd3NlclBsdXMudGl0bGVbQG1vZGVsLnVybF0gPSB0aXRsZVxuICAgICAgICBAbW9kZWwuc2V0VGl0bGUodGl0bGUpIGlmIHRpdGxlIGlzbnQgQG1vZGVsLmdldFRpdGxlKClcbiAgICAgIGVsc2VcbiAgICAgICAgIyBAbW9kZWwuYnJvd3NlclBsdXMudGl0bGVbQG1vZGVsLnVybF0gPSB1cmxcbiAgICAgICAgQG1vZGVsLnNldFRpdGxlKHVybClcblxuICAgICAgQGxpdmUudG9nZ2xlQ2xhc3MgJ2FjdGl2ZScsQGxpdmVPblxuICAgICAgQGxpdmVTdWJzY3JpcHRpb24/LmRpc3Bvc2UoKSB1bmxlc3MgQGxpdmVPblxuICAgICAgQGNoZWNrTmF2KClcbiAgICAgIEBjaGVja0ZhdigpXG4gICAgICBAYWRkSGlzdG9yeSgpXG5cbiAgcmVmcmVzaFBhZ2U6ICh1cmwsaWdub3JlY2FjaGUpLT5cbiAgICAgICMgaHRtbHYgPSBAbW9kZWwudmlldy5odG1sdlswXVxuICAgICAgaWYgQHJlbWVtYmVyT25cbiAgICAgICAgQGh0bWx2WzBdPy5leGVjdXRlSmF2YVNjcmlwdCBcIlwiXCJcbiAgICAgICAgICB2YXIgbGVmdCwgdG9wO1xuICAgICAgICAgIGN1clRvcCA9IGpRdWVyeSh3aW5kb3cpLnNjcm9sbFRvcCgpO1xuICAgICAgICAgIGN1ckxlZnQgPSBqUXVlcnkod2luZG93KS5zY3JvbGxMZWZ0KCk7XG4gICAgICAgICAgY29uc29sZS5sb2coYH5icm93c2VyLXBsdXMtcG9zaXRpb25+JHtjdXJUb3B9LCR7Y3VyTGVmdH1gKTtcbiAgICAgICAgXCJcIlwiXG4gICAgICBpZiBAbW9kZWwub3JnVVJJIGFuZCBwcCA9IGF0b20ucGFja2FnZXMuZ2V0QWN0aXZlUGFja2FnZSgncHAnKVxuICAgICAgICBwcC5tYWluTW9kdWxlLmNvbXBpbGVQYXRoKEBtb2RlbC5vcmdVUkksQG1vZGVsLl9pZClcbiAgICAgIGVsc2VcbiAgICAgICAgaWYgdXJsXG4gICAgICAgICAgQG1vZGVsLnVybCA9IHVybFxuICAgICAgICAgIEB1cmwudmFsIHVybFxuICAgICAgICAgIEBodG1sdlswXT8uc3JjID0gdXJsXG4gICAgICAgIGVsc2VcbiAgICAgICAgICBpZiBAdWx0cmFMaXZlT24gYW5kIEBtb2RlbC5zcmNcbiAgICAgICAgICAgIEBodG1sdlswXT8uc3JjID0gQG1vZGVsLnNyY1xuICAgICAgICAgIGlmIGlnbm9yZWNhY2hlXG4gICAgICAgICAgICBAaHRtbHZbMF0/LnJlbG9hZElnbm9yaW5nQ2FjaGUoKVxuICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgIEBodG1sdlswXT8ucmVsb2FkKClcblxuICBnb1RvVXJsOiAodXJsKS0+XG4gICAgICBCcm93c2VyUGx1c01vZGVsID0gcmVxdWlyZSAnLi9icm93c2VyLXBsdXMtbW9kZWwnXG4gICAgICByZXR1cm4gdW5sZXNzIEJyb3dzZXJQbHVzTW9kZWwuY2hlY2tVcmwodXJsKVxuICAgICAgalEoQHVybCkuYXV0b2NvbXBsZXRlPyhcImNsb3NlXCIpXG4gICAgICBAbGl2ZU9uID0gZmFsc2VcbiAgICAgIEBsaXZlLnRvZ2dsZUNsYXNzICdhY3RpdmUnLEBsaXZlT25cbiAgICAgIEBsaXZlU3Vic2NyaXB0aW9uPy5kaXNwb3NlKCkgdW5sZXNzIEBsaXZlT25cbiAgICAgIEB1cmwudmFsIHVybFxuICAgICAgQG1vZGVsLnVybCA9IHVybFxuICAgICAgZGVsZXRlIEBtb2RlbC50aXRsZVxuICAgICAgZGVsZXRlIEBtb2RlbC5pY29uTmFtZVxuICAgICAgZGVsZXRlIEBtb2RlbC5mYXZJY29uXG4gICAgICBAbW9kZWwuc2V0VGl0bGUobnVsbClcbiAgICAgIEBtb2RlbC51cGRhdGVJY29uKG51bGwpXG4gICAgICBpZiB1cmwuc3RhcnRzV2l0aCgnYnJvd3Nlci1wbHVzOi8vJylcbiAgICAgICAgdXJsID0gQG1vZGVsLmJyb3dzZXJQbHVzLmdldEJyb3dzZXJQbHVzVXJsPyh1cmwpXG4gICAgICBAaHRtbHYuYXR0ciAnc3JjJyx1cmxcblxuICBrZXlIYW5kbGVyOiAoZXZ0KS0+XG4gICAgc3dpdGNoIGV2dFswXS5rZXlJZGVudGlmaWVyXG4gICAgICB3aGVuICBcIkYxMlwiXG4gICAgICAgIEB0b2dnbGVEZXZUb29sKClcbiAgICAgIHdoZW4gXCJGNVwiXG4gICAgICAgIGlmIGV2dFswXS5jdHJsS2V5XG4gICAgICAgICAgQHJlZnJlc2hQYWdlKHVuZGVmaW5lZCx0cnVlKVxuICAgICAgICBlbHNlXG4gICAgICAgICAgQHJlZnJlc2hQYWdlKClcbiAgICAgIHdoZW4gXCJGMTBcIlxuICAgICAgICBAdG9nZ2xlVVJMQmFyKClcbiAgICAgIHdoZW4gXCJMZWZ0XCJcbiAgICAgICAgQGdvQmFjaygpIGlmIGV2dFswXS5hbHRLZXlcblxuICAgICAgd2hlbiBcIlJpZ2h0XCJcbiAgICAgICAgQGdvRm9yd2FyZCgpIGlmIGV2dFswXS5hbHRLZXlcblxuICByZW1vdmVGYXY6IChmYXZvcml0ZSktPlxuICAgIGZhdnJzID0gd2luZG93LmJwLmpzLmdldCgnYnAuZmF2JylcbiAgICBmb3IgZmF2cixpZHggaW4gZmF2cnNcbiAgICAgIGlmIGZhdnIudXJsIGlzIGZhdm9yaXRlLnVybFxuICAgICAgICBmYXZycy5zcGxpY2UgaWR4LDFcbiAgICAgICAgd2luZG93LmJwLmpzLnNldCgnYnAuZmF2JyxmYXZycylcbiAgICAgICAgcmV0dXJuXG5cbiAgc2V0U3JjOiAodGV4dCktPlxuICAgIHVybCA9IEBtb2RlbC5vcmdVUkkgb3IgQG1vZGVsLnVybFxuICAgIHRleHQgPSBCcm93c2VyUGx1c1ZpZXcuY2hlY2tCYXNlKHRleHQsdXJsKVxuICAgIEBtb2RlbC5zcmMgPSBcImRhdGE6dGV4dC9odG1sLCN7dGV4dH1cIlxuICAgIEBodG1sdlswXT8uc3JjID0gQG1vZGVsLnNyY1xuXG4gIEBjaGVja0Jhc2U6ICh0ZXh0LHVybCktPlxuICAgIGNoZWVyaW8gPSByZXF1aXJlICdjaGVlcmlvJ1xuICAgICRodG1sID0gY2hlZXJpby5sb2FkKHRleHQpXG4gICAgIyBiYXNlUGF0aCA9IGF0b20ucHJvamVjdC5nZXRQYXRocygpWzBdK1wiL1wiXG4gICAgYmFzZVBhdGggPSBwYXRoLmRpcm5hbWUodXJsKStcIi9cIlxuICAgIGlmICRodG1sKCdiYXNlJykubGVuZ3RoXG4gICAgICB0ZXh0XG4gICAgZWxzZVxuICAgICAgaWYgJGh0bWwoJ2hlYWQnKS5sZW5ndGhcbiAgICAgICAgYmFzZSAgPSBcIjxiYXNlIGhyZWY9JyN7YmFzZVBhdGh9JyB0YXJnZXQ9J19ibGFuayc+XCJcbiAgICAgICAgJGh0bWwoJ2hlYWQnKS5wcmVwZW5kKGJhc2UpXG4gICAgICBlbHNlXG4gICAgICAgIGJhc2UgID0gXCI8aGVhZD48YmFzZSBocmVmPScje2Jhc2VQYXRofScgdGFyZ2V0PSdfYmxhbmsnPjwvaGVhZD5cIlxuICAgICAgICAkaHRtbCgnaHRtbCcpLnByZXBlbmQoYmFzZSlcbiAgICAgICRodG1sLmh0bWwoKVxuXG4gIGNoZWNrRmF2OiAtPlxuICAgIEBmYXYucmVtb3ZlQ2xhc3MgJ2FjdGl2ZSdcbiAgICBmYXZycyA9IHdpbmRvdy5icC5qcy5nZXQoJ2JwLmZhdicpXG4gICAgZm9yIGZhdnIgaW4gZmF2cnNcbiAgICAgIGlmIGZhdnIudXJsIGlzIEBtb2RlbC51cmxcbiAgICAgICAgQGZhdi5hZGRDbGFzcyAnYWN0aXZlJ1xuXG4gIHRvZ2dsZURldlRvb2w6IC0+XG4gICAgb3BlbiA9IEBodG1sdlswXT8uaXNEZXZUb29sc09wZW5lZCgpXG4gICAgaWYgb3BlblxuICAgICAgQGh0bWx2WzBdPy5jbG9zZURldlRvb2xzKClcbiAgICBlbHNlXG4gICAgICBAaHRtbHZbMF0/Lm9wZW5EZXZUb29scygpXG5cbiAgICAkKEBkZXZ0b29sKS50b2dnbGVDbGFzcyAnYWN0aXZlJywgIW9wZW5cblxuICBjaGVja05hdjogLT5cbiAgICAgICQoQGZvcndhcmQpLnRvZ2dsZUNsYXNzICdhY3RpdmUnLEBodG1sdlswXT8uY2FuR29Gb3J3YXJkKClcbiAgICAgICQoQGJhY2spLnRvZ2dsZUNsYXNzICdhY3RpdmUnLEBodG1sdlswXT8uY2FuR29CYWNrKClcbiAgICAgIGlmIEBodG1sdlswXT8uY2FuR29Gb3J3YXJkKClcbiAgICAgICAgaWYgQGNsZWFyRm9yd2FyZFxuICAgICAgICAgICQoQGZvcndhcmQpLnRvZ2dsZUNsYXNzICdhY3RpdmUnLGZhbHNlXG4gICAgICAgICAgQGNsZWFyRm9yd2FyZCA9IGZhbHNlXG4gICAgICAgIGVsc2VcbiAgICAgICAgICAkKEBmb3J3YXJkKS50b2dnbGVDbGFzcyAnYWN0aXZlJyx0cnVlXG5cbiAgZ29CYWNrOiAtPlxuICAgIEBiYWNrLmNsaWNrKClcblxuICBnb0ZvcndhcmQ6IC0+XG4gICAgQGZvcndhcmQuY2xpY2soKVxuXG4gIGFkZEhpc3Rvcnk6IC0+XG4gICAgdXJsID0gQGh0bWx2WzBdLmdldFVSTCgpLnJlcGxhY2UoL1xcXFwvZyxcIi9cIilcbiAgICByZXR1cm4gdW5sZXNzIHVybFxuICAgIGhpc3RvcnlVUkwgPSBcImZpbGU6Ly8vI3tAbW9kZWwuYnJvd3NlclBsdXMucmVzb3VyY2VzfWhpc3RvcnkuaHRtbFwiLnJlcGxhY2UoL1xcXFwvZyxcIi9cIilcbiAgICByZXR1cm4gaWYgdXJsLnN0YXJ0c1dpdGgoJ2Jyb3dzZXItcGx1czovLycpIG9yIHVybC5zdGFydHNXaXRoKCdkYXRhOnRleHQvaHRtbCwnKSBvciB1cmwuc3RhcnRzV2l0aCBoaXN0b3J5VVJMXG4gICAgeXl5eW1tZGQgPSAtPlxuICAgICAgZGF0ZSA9IG5ldyBEYXRlKClcbiAgICAgIHl5eXkgPSBkYXRlLmdldEZ1bGxZZWFyKCkudG9TdHJpbmcoKVxuICAgICAgbW0gPSAoZGF0ZS5nZXRNb250aCgpICsgMSkudG9TdHJpbmcoKVxuICAgICAgIyBnZXRNb250aCgpIGlzIHplcm8tYmFzZWRcbiAgICAgIGRkID0gZGF0ZS5nZXREYXRlKCkudG9TdHJpbmcoKVxuICAgICAgeXl5eSArIChpZiBtbVsxXSB0aGVuIG1tIGVsc2UgJzAnICsgbW1bMF0pICsgKGlmIGRkWzFdIHRoZW4gZGQgZWxzZSAnMCcgKyBkZFswXSlcbiAgICB0b2RheSA9IHl5eXltbWRkKClcbiAgICBoaXN0b3J5ID0gd2luZG93LmJwLmpzLmdldCgnYnAuaGlzdG9yeScpIG9yIFtdXG4gICAgIyByZXR1cm4gdW5sZXNzIGhpc3Rvcnkgb3IgaGlzdG9yeS5sZW5ndGggPSAwXG4gICAgdG9kYXlPYmogPSBoaXN0b3J5LmZpbmQgKGVsZSxpZHgsYXJyKS0+XG4gICAgICByZXR1cm4gdHJ1ZSBpZiBlbGVbdG9kYXldXG4gICAgdW5sZXNzIHRvZGF5T2JqXG4gICAgICBvYmogPSB7fVxuICAgICAgaGlzdFRvZGF5ID0gW11cbiAgICAgIG9ialt0b2RheV0gPSBoaXN0VG9kYXlcbiAgICAgIGhpc3RvcnkudW5zaGlmdCBvYmpcbiAgICBlbHNlXG4gICAgICBoaXN0VG9kYXkgPSB0b2RheU9ialt0b2RheV1cbiAgICBoaXN0VG9kYXkudW5zaGlmdCBkYXRlOiAobmV3IERhdGUoKS50b1N0cmluZygpKSx1cmk6IHVybFxuICAgIHdpbmRvdy5icC5qcy5zZXQoJ2JwLmhpc3RvcnknLGhpc3RvcnkpXG5cbiAgZ2V0VGl0bGU6IC0+XG4gICAgQG1vZGVsLmdldFRpdGxlKClcblxuICBzZXJpYWxpemU6IC0+XG5cbiAgZGVzdHJveTogLT5cbiAgICBqUShAdXJsKS5hdXRvY29tcGxldGU/KCdkZXN0cm95JylcbiAgICBAc3Vic2NyaXB0aW9ucy5kaXNwb3NlKClcblxuICBAZ2V0SlF1ZXJ5OiAtPlxuICAgIGZzLnJlYWRGaWxlU3luYyBcIiN7QG1vZGVsLmJyb3dzZXJQbHVzLnJlc291cmNlc30vanF1ZXJ5LTIuMS40Lm1pbi5qc1wiLCd1dGYtOCdcblxuICBAZ2V0RXZhbDogLT5cbiAgICBmcy5yZWFkRmlsZVN5bmMgXCIje0Btb2RlbC5icm93c2VyUGx1cy5yZXNvdXJjZXN9L2V2YWwuanNcIiwndXRmLTgnXG5cbiAgQGdldEpTdG9yYWdlOiAtPlxuICAgIGZzLnJlYWRGaWxlU3luYyBcIiN7QG1vZGVsLmJyb3dzZXJQbHVzLnJlc291cmNlc30vanN0b3JhZ2UubWluLmpzXCIsJ3V0Zi04J1xuXG4gIEBnZXRXYXRjaGpzOiAtPlxuICAgIGZzLnJlYWRGaWxlU3luYyBcIiN7QG1vZGVsLmJyb3dzZXJQbHVzLnJlc291cmNlc30vd2F0Y2guanNcIiwndXRmLTgnXG5cbiAgQGdldE5vdGlmeUJhcjogLT5cbiAgICBmcy5yZWFkRmlsZVN5bmMgXCIje0Btb2RlbC5icm93c2VyUGx1cy5yZXNvdXJjZXN9L2pxdWVyeS5ub3RpZnlCYXIuanNcIiwndXRmLTgnXG5cbiAgQGdldEhvdEtleXM6IC0+XG4gICAgZnMucmVhZEZpbGVTeW5jIFwiI3tAbW9kZWwuYnJvd3NlclBsdXMucmVzb3VyY2VzfS9qcXVlcnkuaG90a2V5cy5taW4uanNcIiwndXRmLTgnXG5cbiAgQGxvYWRDU1M6IChmaWxlbmFtZSxmdWxscGF0aD1mYWxzZSktPlxuICAgIHVubGVzcyBmdWxscGF0aFxuICAgICAgZnBhdGggPSBcImZpbGU6Ly8vI3tAbW9kZWwuYnJvd3NlclBsdXMucmVzb3VyY2VzLnJlcGxhY2UoL1xcXFwvZywnLycpfVwiXG4gICAgICBmaWxlbmFtZSA9IFwiI3tmcGF0aH0je2ZpbGVuYW1lfVwiXG4gICAgXCJcIlwiXG4gICAgalF1ZXJ5KCdoZWFkJykuYXBwZW5kKGpRdWVyeSgnPGxpbmsgdHlwZT1cInRleHQvY3NzXCIgcmVsPVwic3R5bGVzaGVldFwiIGhyZWY9XCIje2ZpbGVuYW1lfVwiPicpKVxuICAgIFwiXCJcIlxuXG4gIEBsb2FkSlM6IChmaWxlbmFtZSxmdWxscGF0aD1mYWxzZSktPlxuICAgIHVubGVzcyBmdWxscGF0aFxuICAgICAgZnBhdGggPSBcImZpbGU6Ly8vI3tAbW9kZWwuYnJvd3NlclBsdXMucmVzb3VyY2VzLnJlcGxhY2UoL1xcXFwvZywnLycpfVwiXG4gICAgICBmaWxlbmFtZSA9IFwiI3tmcGF0aH0je2ZpbGVuYW1lfVwiXG5cbiAgICBcIlwiXCJcbiAgICBqUXVlcnkoJ2hlYWQnKS5hcHBlbmQoalF1ZXJ5KCc8c2NyaXB0IHR5cGU9XCJ0ZXh0L2phdmFzY3JpcHRcIiBzcmM9XCIje2ZpbGVuYW1lfVwiPicpKVxuICAgIFwiXCJcIlxuIl19
