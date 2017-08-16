(function() {
  document.addEventListener('DOMContentLoaded', function() {
    window.browserPlus = {};
    browserPlus.menu = function(menu) {
      var submenu;
      if (!browserPlus.contextMenu) {
        browserPlus.contextMenu = jQuery("<ul id='bp-menu'></ul>");
        jQuery('body').append(browserPlus.contextMenu);
        browserPlus.contextMenu.hide();
        jQuery('body').on('contextmenu', function(e) {
          var maxHeight, maxWidth, positionX, positionY;
          if (!browserPlus.contextMenu.has('li').length) {
            return false;
          }
          browserPlus.contextMenu.css({
            top: 'auto',
            left: 'auto',
            bottom: 'auto',
            right: 'auto'
          });
          browserPlus.contextMenu.css({
            left: e.pageX,
            top: e.pageY
          });
          maxHeight = e.clientY + browserPlus.contextMenu.outerHeight();
          if (maxHeight > jQuery(window).height()) {
            positionY = e.pageY - browserPlus.contextMenu.outerHeight() - 10;
          } else {
            positionY = e.pageY + 10;
          }
          maxWidth = e.clientX + browserPlus.contextMenu.outerWidth();
          if (maxWidth > jQuery(window).width() + 10) {
            positionX = e.pageX - browserPlus.contextMenu.outerWidth() - 10;
          } else {
            positionX = e.pageX;
          }
          browserPlus.contextMenu.css({
            top: positionY,
            left: positionX
          });
          browserPlus.contextMenu.show();
          jQuery('body').one('click', function() {
            var children;
            browserPlus.contextMenu.hide();
            children = browserPlus.contextMenu.children('.bp-selector');
            children.off('click');
            return children.remove();
          });
          return false;
        });
      }
      if (menu.name) {
        if (menu.selector) {
          jQuery('body').on('contextmenu', menu.selector, function(e) {
            var submenu;
            if (jQuery('#bp-menu').is(':visible')) {
              return true;
            }
            if (browserPlus.contextMenu.children("[data-bpid='" + menu._id + "']").length) {
              return true;
            }
            if (menu.selectorFilter) {
              if (!eval("(" + menu.selectorFilter + ").bind(this)()")) {
                return true;
              }
            }
            submenu = jQuery("<li class='bp-selector' data-bpid = '" + menu._id + "'> " + menu.name + " </li>");
            submenu.on('click', eval('(' + menu.fn + ').bind(this)'));
            return browserPlus.contextMenu.append(submenu);
          });
        } else {
          submenu = jQuery('<li>' + menu.name + '</li>');
          submenu.on('click', eval('(' + menu.fn + ').bind(this)'));
          browserPlus.contextMenu.append(submenu);
        }
      }
      if (menu.event) {
        if (menu.selector) {
          jQuery('body').on(menu.event, menu.selector, eval('(' + menu.fn + ')'));
        } else {
          jQuery('body').on(menu.event, eval('(' + menu.fn + ')'));
        }
      } else if (menu.ctrlkey) {
        menu.keytype = menu.keytype || 'keyup';
        jQuery('body').on(menu.keytype, menu.selector, menu.ctrlkey, eval('(' + menu.fn + ')'));
      }
    };
    if (typeof jQuery === 'undefined') {
      return console.log('~browser-plus-jquery~');
    } else {
      return console.log('~browser-plus-menu~');
    }
  });

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL2hvbWUvbWFyY3VzLy5hdG9tL3BhY2thZ2VzL2Jyb3dzZXItcGx1cy9yZXNvdXJjZXMvYnAtY2xpZW50LmNvZmZlZSJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtFQUFBLFFBQVEsQ0FBQyxnQkFBVCxDQUEwQixrQkFBMUIsRUFBOEMsU0FBQTtJQUM1QyxNQUFNLENBQUMsV0FBUCxHQUFxQjtJQUdyQixXQUFXLENBQUMsSUFBWixHQUFtQixTQUFDLElBQUQ7QUFDakIsVUFBQTtNQUFBLElBQUcsQ0FBQyxXQUFXLENBQUMsV0FBaEI7UUFDRSxXQUFXLENBQUMsV0FBWixHQUEwQixNQUFBLENBQU8sd0JBQVA7UUFDMUIsTUFBQSxDQUFPLE1BQVAsQ0FBYyxDQUFDLE1BQWYsQ0FBc0IsV0FBVyxDQUFDLFdBQWxDO1FBQ0EsV0FBVyxDQUFDLFdBQVcsQ0FBQyxJQUF4QixDQUFBO1FBQ0EsTUFBQSxDQUFPLE1BQVAsQ0FBYyxDQUFDLEVBQWYsQ0FBa0IsYUFBbEIsRUFBaUMsU0FBQyxDQUFEO0FBQy9CLGNBQUE7VUFBQSxJQUFHLENBQUMsV0FBVyxDQUFDLFdBQVcsQ0FBQyxHQUF4QixDQUE0QixJQUE1QixDQUFpQyxDQUFDLE1BQXRDO0FBQ0UsbUJBQU8sTUFEVDs7VUFFQSxXQUFXLENBQUMsV0FBVyxDQUFDLEdBQXhCLENBQ0U7WUFBQSxHQUFBLEVBQUssTUFBTDtZQUNBLElBQUEsRUFBTSxNQUROO1lBRUEsTUFBQSxFQUFRLE1BRlI7WUFHQSxLQUFBLEVBQU8sTUFIUDtXQURGO1VBS0EsV0FBVyxDQUFDLFdBQVcsQ0FBQyxHQUF4QixDQUE0QjtZQUFFLElBQUEsRUFBTSxDQUFDLENBQUMsS0FBVjtZQUFrQixHQUFBLEVBQUssQ0FBQyxDQUFDLEtBQXpCO1dBQTVCO1VBQ0EsU0FBQSxHQUFZLENBQUMsQ0FBQyxPQUFGLEdBQVksV0FBVyxDQUFDLFdBQVcsQ0FBQyxXQUF4QixDQUFBO1VBQ3hCLElBQUcs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QSxDQUFPLE1BQVAsQ0FBYyxDQUFDLEVBQWYsQ0FBa0IsSUFBSSxDQUFDLEtBQXZCLEVBQThCLElBQUksQ0FBQyxRQUFuQyxFQUE2QyxJQUFBLENBQUssR0FBQSxHQUFNLElBQUksQ0FBQyxFQUFYLEdBQWdCLEdBQXJCLENBQTdDLEVBREY7U0FBQSxNQUFBO1VBR0UsTUFBQSxDQUFPLE1BQVAsQ0FBYyxDQUFDLEVBQWYsQ0FBa0IsSUFBSSxDQUFDLEtBQXZCLEVBQThCLElBQUEsQ0FBSyxHQUFBLEdBQU0sSUFBSSxDQUFDLEVBQVgsR0FBZ0IsR0FBckIsQ0FBOUIsRUFIRjtTQURGO09BQUEsTUFLSyxJQUFHLElBQUksQ0FBQyxPQUFSO1FBQ0gsSUFBSSxDQUFDLE9BQUwsR0FBZSxJQUFJLENBQUMsT0FBTCxJQUFnQjtRQUUvQixNQUFBLENBQU8sTUFBUCxDQUFjLENBQUMsRUFBZixDQUFrQixJQUFJLENBQUMsT0FBdkIsRUFBZ0MsSUFBSSxDQUFDLFFBQXJDLEVBQStDLElBQUksQ0FBQyxPQUFwRCxFQUE2RCxJQUFBLENBQUssR0FBQSxHQUFNLElBQUksQ0FBQyxFQUFYLEdBQWdCLEdBQXJCLENBQTdELEVBSEc7O0lBbERZO0lBMkRuQixJQUFHLE9BQU8sTUFBUCxLQUFpQixXQUFwQjthQUNFLE9BQU8sQ0FBQyxHQUFSLENBQVksdUJBQVosRUFERjtLQUFBLE1BQUE7YUFHRSxPQUFPLENBQUMsR0FBUixDQUFZLHFCQUFaLEVBSEY7O0VBL0Q0QyxDQUE5QztBQUFBIiwic291cmNlc0NvbnRlbnQiOlsiZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lciAnRE9NQ29udGVudExvYWRlZCcsIC0+XG4gIHdpbmRvdy5icm93c2VyUGx1cyA9IHt9XG4gICMgd2luZG93Lm9uaGFzaGNoYW5nZSA9IChldnQpLT5cbiAgIyAgIGNvbnNvbGUubG9nICd+YnJvd3Nlci1wbHVzLWhyZWZjaGFuZ2V+JyArIGV2dC5uZXdVUkxcbiAgYnJvd3NlclBsdXMubWVudSA9IChtZW51KSAtPlxuICAgIGlmICFicm93c2VyUGx1cy5jb250ZXh0TWVudVxuICAgICAgYnJvd3NlclBsdXMuY29udGV4dE1lbnUgPSBqUXVlcnkoXCI8dWwgaWQ9J2JwLW1lbnUnPjwvdWw+XCIpXG4gICAgICBqUXVlcnkoJ2JvZHknKS5hcHBlbmQgYnJvd3NlclBsdXMuY29udGV4dE1lbnVcbiAgICAgIGJyb3dzZXJQbHVzLmNvbnRleHRNZW51LmhpZGUoKVxuICAgICAgalF1ZXJ5KCdib2R5Jykub24gJ2NvbnRleHRtZW51JywgKGUpIC0+XG4gICAgICAgIGlmICFicm93c2VyUGx1cy5jb250ZXh0TWVudS5oYXMoJ2xpJykubGVuZ3RoXG4gICAgICAgICAgcmV0dXJuIGZhbHNlXG4gICAgICAgIGJyb3dzZXJQbHVzLmNvbnRleHRNZW51LmNzc1xuICAgICAgICAgIHRvcDogJ2F1dG8nXG4gICAgICAgICAgbGVmdDogJ2F1dG8nXG4gICAgICAgICAgYm90dG9tOiAnYXV0bydcbiAgICAgICAgICByaWdodDogJ2F1dG8nXG4gICAgICAgIGJyb3dzZXJQbHVzLmNvbnRleHRNZW51LmNzcyh7IGxlZnQ6IGUucGFnZVggLCB0b3A6IGUucGFnZVl9KVxuICAgICAgICBtYXhIZWlnaHQgPSBlLmNsaWVudFkgKyBicm93c2VyUGx1cy5jb250ZXh0TWVudS5vdXRlckhlaWdodCgpXG4gICAgICAgIGlmIG1heEhlaWdodCA+IGpRdWVyeSh3aW5kb3cpLmhlaWdodCgpXG4gICAgICAgICAgcG9zaXRpb25ZID0gZS5wYWdlWSAtIGJyb3dzZXJQbHVzLmNvbnRleHRNZW51Lm91dGVySGVpZ2h0KCkgLSAxMFxuICAgICAgICBlbHNlXG4gICAgICAgICAgcG9zaXRpb25ZID0gZS5wYWdlWSArIDEwXG4gICAgICAgIG1heFdpZHRoID0gZS5jbGllbnRYICsgYnJvd3NlclBsdXMuY29udGV4dE1lbnUub3V0ZXJXaWR0aCgpXG4gICAgICAgIGlmIG1heFdpZHRoID4galF1ZXJ5KHdpbmRvdykud2lkdGgoKSArIDEwXG4gICAgICAgICAgcG9zaXRpb25YID0gZS5wYWdlWCAtIGJyb3dzZXJQbHVzLmNvbnRleHRNZW51Lm91dGVyV2lkdGgoKSAtIDEwXG4gICAgICAgIGVsc2VcbiAgICAgICAgICBwb3NpdGlvblggPSBlLnBhZ2VYXG4gICAgICAgIGJyb3dzZXJQbHVzLmNvbnRleHRNZW51LmNzcyh7dG9wOnBvc2l0aW9uWSxsZWZ0OnBvc2l0aW9uWH0pXG4gICAgICAgIGJyb3dzZXJQbHVzLmNvbnRleHRNZW51LnNob3coKVxuICAgICAgICBqUXVlcnkoJ2JvZHknKS5vbmUgJ2NsaWNrJywgLT5cbiAgICAgICAgICBicm93c2VyUGx1cy5jb250ZXh0TWVudS5oaWRlKClcbiAgICAgICAgICBjaGlsZHJlbiA9IGJyb3dzZXJQbHVzLmNvbnRleHRNZW51LmNoaWxkcmVuKCcuYnAtc2VsZWN0b3InKVxuICAgICAgICAgIGNoaWxkcmVuLm9mZiAnY2xpY2snXG4gICAgICAgICAgY2hpbGRyZW4ucmVtb3ZlKClcbiAgICAgICAgZmFsc2VcbiAgICBpZiBtZW51Lm5hbWVcbiAgICAgIGlmIG1lbnUuc2VsZWN0b3JcbiAgICAgICAgalF1ZXJ5KCdib2R5Jykub24gJ2NvbnRleHRtZW51JywgbWVudS5zZWxlY3RvciwgKGUpIC0+XG4gICAgICAgICAgcmV0dXJuIHRydWUgaWYgalF1ZXJ5KCcjYnAtbWVudScpLmlzKCc6dmlzaWJsZScpXG4gICAgICAgICAgcmV0dXJuIHRydWUgaWYgYnJvd3NlclBsdXMuY29udGV4dE1lbnUuY2hpbGRyZW4oXCJbZGF0YS1icGlkPScje21lbnUuX2lkfSddXCIpLmxlbmd0aFxuICAgICAgICAgIHJldHVybiB0cnVlIHVubGVzcyBldmFsKFwiKCN7bWVudS5zZWxlY3RvckZpbHRlcn0pLmJpbmQodGhpcykoKVwiKSBpZiBtZW51LnNlbGVjdG9yRmlsdGVyXG4gICAgICAgICAgc3VibWVudSA9IGpRdWVyeShcIjxsaSBjbGFzcz0nYnAtc2VsZWN0b3InIGRhdGEtYnBpZCA9ICcje21lbnUuX2lkfSc+ICN7bWVudS5uYW1lfSA8L2xpPlwiKVxuICAgICAgICAgIHN1Ym1lbnUub24gJ2NsaWNrJywgZXZhbCgnKCcgKyBtZW51LmZuICsgJykuYmluZCh0aGlzKScpXG4gICAgICAgICAgYnJvd3NlclBsdXMuY29udGV4dE1lbnUuYXBwZW5kIHN1Ym1lbnVcbiAgICAgIGVsc2VcbiAgICAgICAgc3VibWVudSA9IGpRdWVyeSgnPGxpPicgKyBtZW51Lm5hbWUgKyAnPC9saT4nKVxuICAgICAgICBzdWJtZW51Lm9uICdjbGljaycsIGV2YWwoJygnICsgbWVudS5mbiArICcpLmJpbmQodGhpcyknKVxuICAgICAgICBicm93c2VyUGx1cy5jb250ZXh0TWVudS5hcHBlbmQgc3VibWVudVxuICAgIGlmIG1lbnUuZXZlbnRcbiAgICAgIGlmIG1lbnUuc2VsZWN0b3JcbiAgICAgICAgalF1ZXJ5KCdib2R5Jykub24gbWVudS5ldmVudCwgbWVudS5zZWxlY3RvciwgZXZhbCgnKCcgKyBtZW51LmZuICsgJyknKVxuICAgICAgZWxzZVxuICAgICAgICBqUXVlcnkoJ2JvZHknKS5vbiBtZW51LmV2ZW50LCBldmFsKCcoJyArIG1lbnUuZm4gKyAnKScpXG4gICAgZWxzZSBpZiBtZW51LmN0cmxrZXlcbiAgICAgIG1lbnUua2V5dHlwZSA9IG1lbnUua2V5dHlwZSBvciAna2V5dXAnXG4gICAgICAjIGlmKGN0cmxrZXkuaGFzKCdtb3VzZXdoZWVsdXAnKSlcbiAgICAgIGpRdWVyeSgnYm9keScpLm9uIG1lbnUua2V5dHlwZSwgbWVudS5zZWxlY3RvciwgbWVudS5jdHJsa2V5LCBldmFsKCcoJyArIG1lbnUuZm4gKyAnKScpXG4gICAgcmV0dXJuXG5cbiAgIyBpZiBsb2NhdGlvbi5ocmVmLnN0YXJ0c1dpdGgoJ2RhdGE6dGV4dC9odG1sLCcpXG4gICMgZWxzZVxuICAjICAgY29uc29sZS5sb2cgJ35icm93c2VyLXBsdXMtaHJlZn4nICsgbG9jYXRpb24uaHJlZiArICcgJyArIGRvY3VtZW50LnRpdGxlXG4gIGlmIHR5cGVvZiBqUXVlcnkgPT0gJ3VuZGVmaW5lZCdcbiAgICBjb25zb2xlLmxvZyAnfmJyb3dzZXItcGx1cy1qcXVlcnl+J1xuICBlbHNlXG4gICAgY29uc29sZS5sb2cgJ35icm93c2VyLXBsdXMtbWVudX4nXG4iXX0=
