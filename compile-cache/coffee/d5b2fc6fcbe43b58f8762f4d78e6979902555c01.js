(function() {
  var MarkdownPreviewView, _, fs, imageRegister, isMarkdownPreviewView, path, pathWatcher, pathWatcherPath, refreshImages, srcClosure;

  fs = require('fs-plus');

  _ = require('lodash');

  path = require('path');

  pathWatcherPath = path.join(atom.packages.resourcePath, '/node_modules/pathwatcher/lib/main');

  pathWatcher = require(pathWatcherPath);

  imageRegister = {};

  MarkdownPreviewView = null;

  isMarkdownPreviewView = function(object) {
    if (MarkdownPreviewView == null) {
      MarkdownPreviewView = require('./markdown-preview-view');
    }
    return object instanceof MarkdownPreviewView;
  };

  refreshImages = _.debounce((function(src) {
    var item, j, len, ref;
    if (atom.workspace != null) {
      ref = atom.workspace.getPaneItems();
      for (j = 0, len = ref.length; j < len; j++) {
        item = ref[j];
        if (isMarkdownPreviewView(item)) {
          item.refreshImages(src);
        }
      }
    }
  }), 250);

  srcClosure = function(src) {
    return function(event, path) {
      if (event === 'change' && fs.isFileSync(src)) {
        imageRegister[src].version = Date.now();
      } else {
        imageRegister[src].watcher.close();
        delete imageRegister[src];
      }
      refreshImages(src);
    };
  };

  module.exports = {
    removeFile: function(file) {
      return imageRegister = _.mapValues(imageRegister, function(image) {
        image.files = _.without(image.files, file);
        image.files = _.filter(image.files, fs.isFileSync);
        if (_.isEmpty(image.files)) {
          image.watched = false;
          image.watcher.close();
        }
        return image;
      });
    },
    getVersion: function(image, file) {
      var files, i, version;
      i = _.get(imageRegister, image, {});
      if (_.isEmpty(i)) {
        if (fs.isFileSync(image)) {
          version = Date.now();
          imageRegister[image] = {
            path: image,
            watched: true,
            files: [file],
            version: version,
            watcher: pathWatcher.watch(image, srcClosure(image))
          };
          return version;
        } else {
          return false;
        }
      }
      files = _.get(i, 'files');
      if (!_.contains(files, file)) {
        imageRegister[image].files.push(file);
      }
      version = _.get(i, 'version');
      if (!version && fs.isFileSync(image)) {
        version = Date.now();
        imageRegister[image].version = version;
      }
      return version;
    }
  };

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL2hvbWUvbWFyY3VzLy5hdG9tL3BhY2thZ2VzL21hcmtkb3duLXByZXZpZXctcGx1cy9saWIvaW1hZ2Utd2F0Y2gtaGVscGVyLmNvZmZlZSJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQUFBLE1BQUE7O0VBQUEsRUFBQSxHQUFLLE9BQUEsQ0FBUSxTQUFSOztFQUNMLENBQUEsR0FBSSxPQUFBLENBQVEsUUFBUjs7RUFDSixJQUFBLEdBQU8sT0FBQSxDQUFRLE1BQVI7O0VBQ1AsZUFBQSxHQUFrQixJQUFJLENBQUMsSUFBTCxDQUFVLElBQUksQ0FBQyxRQUFRLENBQUMsWUFBeEIsRUFBc0Msb0NBQXRDOztFQUNsQixXQUFBLEdBQWMsT0FBQSxDQUFRLGVBQVI7O0VBRWQsYUFBQSxHQUFnQjs7RUFFaEIsbUJBQUEsR0FBc0I7O0VBQ3RCLHFCQUFBLEdBQXdCLFNBQUMsTUFBRDs7TUFDdEIsc0JBQXVCLE9BQUEsQ0FBUSx5QkFBUjs7V0FDdkIsTUFBQSxZQUFrQjtFQUZJOztFQUl4QixhQUFBLEdBQWdCLENBQUMsQ0FBQyxRQUFGLENBQVcsQ0FBQyxTQUFDLEdBQUQ7QUFDMUIsUUFBQTtJQUFBLElBQUcsc0JBQUg7QUFDRTtBQUFBLFdBQUEscUNBQUE7O1FBQ0UsSUFBRyxxQkFBQSxDQUFzQixJQUF0QixDQUFIO1VBRUUsSUFBSSxDQUFDLGFBQUwsQ0FBbUIsR0FBbkIsRUFGRjs7QUFERixPQURGOztFQUQwQixDQUFELENBQVgsRUFNTCxHQU5LOztFQVFoQixVQUFBLEdBQWEsU0FBQyxHQUFEO0FBQ1gsV0FBTyxTQUFDLEtBQUQsRUFBUSxJQUFSO01BQ0wsSUFBRyxLQUFBLEtBQVMsUUFBVCxJQUFzQixFQUFFLENBQUMsVUFBSCxDQUFjLEdBQWQsQ0FBekI7UUFDRSxhQUFjLENBQUEsR0FBQSxDQUFJLENBQUMsT0FBbkIsR0FBNkIsSUFBSSxDQUFDLEdBQUwsQ0FBQSxFQUQvQjtPQUFBLE1BQUE7UUFHRSxhQUFjLENBQUEsR0FBQSxDQUFJLENBQUMsT0FBTyxDQUFDLEtBQTNCLENBQUE7UUFDQSxPQUFPLGFBQWMsQ0FBQSxHQUFBLEVBSnZCOztNQUtBLGFBQUEsQ0FBYyxHQUFkO0lBTks7RUFESTs7RUFVYixNQUFNLENBQUMsT0FBUCxHQUNFO0lBQUEsVUFBQSxFQUFZLFNBQUMsSUFBRDthQUVWLGFBQUEsR0FBZ0IsQ0FBQyxDQUFDLFNBQUYsQ0FBWSxhQUFaLEVBQTJCLFNBQUMsS0FBRDtRQUN6QyxLQUFLLENBQUMsS0FBTixHQUFjLENBQUMsQ0FBQyxPQUFGLENBQVUsS0FBSyxDQUFDLEtBQWhCLEVBQXVCLElBQXZCO1FBQ2QsS0FBSyxDQUFDLEtBQU4sR0FBYyxDQUFDLENBQUMsTUFBRixDQUFTLEtBQUssQ0FBQyxLQUFmLEVBQXNCLEVBQUUsQ0FBQyxVQUF6QjtRQUNkLElBQUcsQ0FBQyxDQUFDLE9BQUYsQ0FBVSxLQUFLLENBQUMsS0FBaEIsQ0FBSDtVQUNFLEtBQUssQ0FBQyxPQUFOLEdBQWdCO1VBQ2hCLEtBQUssQ0FBQyxPQUFPLENBQUMsS0FBZCxDQUFBLEVBRkY7O2VBR0E7TUFOeUMsQ0FBM0I7SUFGTixDQUFaO0lBVUEsVUFBQSxFQUFZLFNBQUMsS0FBRCxFQUFRLElBQVI7QUFDVixVQUFBO01BQUEsQ0FBQSxHQUFJLENBQUMsQ0FBQyxHQUFGLENBQU0sYUFBTixFQUFxQixLQUFyQixFQUE0QixFQUE1QjtNQUNKLElBQUcsQ0FBQyxDQUFDLE9BQUYsQ0FBVSxDQUFWLENBQUg7UUFDRSxJQUFHLEVBQUUsQ0FBQyxVQUFILENBQWMsS0FBZCxDQUFIO1VBQ0UsT0FBQSxHQUFVLElBQUksQ0FBQyxHQUFMLENBQUE7VUFDVixhQUFjLENBQUEsS0FBQSxDQUFkLEdBQXVCO1lBQ3JCLElBQUEsRUFBTSxLQURlO1lBRXJCLE9BQUEsRUFBUyxJQUZZO1lBR3JCLEtBQUEsRUFBTyxDQUFDLElBQUQsQ0FIYztZQUlyQixPQUFBLEVBQVMsT0FKWTtZQUtyQixPQUFBLEVBQVMsV0FBVyxDQUFDLEtBQVosQ0FBa0IsS0FBbEIsRUFBeUIsVUFBQSxDQUFXLEtBQVgsQ0FBekIsQ0FMWTs7QUFPdkIsaUJBQU8sUUFUVDtTQUFBLE1BQUE7QUFXRSxpQkFBTyxNQVhUO1NBREY7O01BY0EsS0FBQSxHQUFRLENBQUMsQ0FBQyxHQUFGLENBQU0sQ0FBTixFQUFTLE9BQVQ7TUFDUixJQUFHLENBQUksQ0FBQyxDQUFDLFFBQUYsQ0FBVyxLQUFYLEVBQWtCLElBQWxCLENBQVA7UUFDRSxhQUFjLENBQUEsS0FBQSxDQUFNLENBQUMsS0FBSyxDQUFDLElBQTNCLENBQWdDLElBQWhDLEVBREY7O01BR0EsT0FBQSxHQUFVLENBQUMsQ0FBQyxHQUFGLENBQU0sQ0FBTixFQUFTLFNBQVQ7TUFDVixJQUFHLENBQUksT0FBSixJQUFnQixFQUFFLENBQUMsVUFBSCxDQUFjLEtBQWQsQ0FBbkI7UUFDRSxPQUFBLEdBQVUsSUFBSSxDQUFDLEdBQUwsQ0FBQTtRQUNWLGFBQWMsQ0FBQSxLQUFBLENBQU0sQ0FBQyxPQUFyQixHQUErQixRQUZqQzs7YUFHQTtJQXhCVSxDQVZaOztBQWhDRiIsInNvdXJjZXNDb250ZW50IjpbImZzID0gcmVxdWlyZSAnZnMtcGx1cydcbl8gPSByZXF1aXJlICdsb2Rhc2gnXG5wYXRoID0gcmVxdWlyZSAncGF0aCdcbnBhdGhXYXRjaGVyUGF0aCA9IHBhdGguam9pbihhdG9tLnBhY2thZ2VzLnJlc291cmNlUGF0aCwgJy9ub2RlX21vZHVsZXMvcGF0aHdhdGNoZXIvbGliL21haW4nKVxucGF0aFdhdGNoZXIgPSByZXF1aXJlIHBhdGhXYXRjaGVyUGF0aFxuXG5pbWFnZVJlZ2lzdGVyID0ge31cblxuTWFya2Rvd25QcmV2aWV3VmlldyA9IG51bGwgIyBEZWZlciB1bnRpbCB1c2VkXG5pc01hcmtkb3duUHJldmlld1ZpZXcgPSAob2JqZWN0KSAtPlxuICBNYXJrZG93blByZXZpZXdWaWV3ID89IHJlcXVpcmUgJy4vbWFya2Rvd24tcHJldmlldy12aWV3J1xuICBvYmplY3QgaW5zdGFuY2VvZiBNYXJrZG93blByZXZpZXdWaWV3XG5cbnJlZnJlc2hJbWFnZXMgPSBfLmRlYm91bmNlKCgoc3JjKSAtPlxuICBpZiBhdG9tLndvcmtzcGFjZT9cbiAgICBmb3IgaXRlbSBpbiBhdG9tLndvcmtzcGFjZS5nZXRQYW5lSXRlbXMoKVxuICAgICAgaWYgaXNNYXJrZG93blByZXZpZXdWaWV3KGl0ZW0pXG4gICAgICAgICMgVE9ETzogY2hlY2sgYWdhaW5zdCBpbWFnZVJlZ2lzdGVyW3NyY10udmVyc2lvbi5maWxlc1xuICAgICAgICBpdGVtLnJlZnJlc2hJbWFnZXMoc3JjKVxuICByZXR1cm4pLCAyNTApXG5cbnNyY0Nsb3N1cmUgPSAoc3JjKSAtPlxuICByZXR1cm4gKGV2ZW50LCBwYXRoKSAtPlxuICAgIGlmIGV2ZW50IGlzICdjaGFuZ2UnIGFuZCBmcy5pc0ZpbGVTeW5jKHNyYylcbiAgICAgIGltYWdlUmVnaXN0ZXJbc3JjXS52ZXJzaW9uID0gRGF0ZS5ub3coKVxuICAgIGVsc2VcbiAgICAgIGltYWdlUmVnaXN0ZXJbc3JjXS53YXRjaGVyLmNsb3NlKClcbiAgICAgIGRlbGV0ZSBpbWFnZVJlZ2lzdGVyW3NyY11cbiAgICByZWZyZXNoSW1hZ2VzKHNyYylcbiAgICByZXR1cm5cblxubW9kdWxlLmV4cG9ydHMgPVxuICByZW1vdmVGaWxlOiAoZmlsZSkgLT5cblxuICAgIGltYWdlUmVnaXN0ZXIgPSBfLm1hcFZhbHVlcyBpbWFnZVJlZ2lzdGVyLCAoaW1hZ2UpIC0+XG4gICAgICBpbWFnZS5maWxlcyA9IF8ud2l0aG91dCBpbWFnZS5maWxlcywgZmlsZVxuICAgICAgaW1hZ2UuZmlsZXMgPSBfLmZpbHRlciBpbWFnZS5maWxlcywgZnMuaXNGaWxlU3luY1xuICAgICAgaWYgXy5pc0VtcHR5IGltYWdlLmZpbGVzXG4gICAgICAgIGltYWdlLndhdGNoZWQgPSBmYWxzZVxuICAgICAgICBpbWFnZS53YXRjaGVyLmNsb3NlKClcbiAgICAgIGltYWdlXG5cbiAgZ2V0VmVyc2lvbjogKGltYWdlLCBmaWxlKSAtPlxuICAgIGkgPSBfLmdldChpbWFnZVJlZ2lzdGVyLCBpbWFnZSwge30pXG4gICAgaWYgXy5pc0VtcHR5KGkpXG4gICAgICBpZiBmcy5pc0ZpbGVTeW5jIGltYWdlXG4gICAgICAgIHZlcnNpb24gPSBEYXRlLm5vdygpXG4gICAgICAgIGltYWdlUmVnaXN0ZXJbaW1hZ2VdID0ge1xuICAgICAgICAgIHBhdGg6IGltYWdlLFxuICAgICAgICAgIHdhdGNoZWQ6IHRydWUsXG4gICAgICAgICAgZmlsZXM6IFtmaWxlXVxuICAgICAgICAgIHZlcnNpb246IHZlcnNpb24sXG4gICAgICAgICAgd2F0Y2hlcjogcGF0aFdhdGNoZXIud2F0Y2goaW1hZ2UsIHNyY0Nsb3N1cmUoaW1hZ2UpKVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiB2ZXJzaW9uXG4gICAgICBlbHNlXG4gICAgICAgIHJldHVybiBmYWxzZVxuXG4gICAgZmlsZXMgPSBfLmdldChpLCAnZmlsZXMnKVxuICAgIGlmIG5vdCBfLmNvbnRhaW5zKGZpbGVzLCBmaWxlKVxuICAgICAgaW1hZ2VSZWdpc3RlcltpbWFnZV0uZmlsZXMucHVzaCBmaWxlXG5cbiAgICB2ZXJzaW9uID0gXy5nZXQoaSwgJ3ZlcnNpb24nKVxuICAgIGlmIG5vdCB2ZXJzaW9uIGFuZCBmcy5pc0ZpbGVTeW5jIGltYWdlXG4gICAgICB2ZXJzaW9uID0gRGF0ZS5ub3coKVxuICAgICAgaW1hZ2VSZWdpc3RlcltpbWFnZV0udmVyc2lvbiA9IHZlcnNpb25cbiAgICB2ZXJzaW9uXG4iXX0=
