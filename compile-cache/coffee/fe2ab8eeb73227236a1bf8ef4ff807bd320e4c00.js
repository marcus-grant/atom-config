(function() {
  var slice = [].slice;

  module.exports = {
    setConfig: function(keyPath, value) {
      var base;
      if (this.originalConfigs == null) {
        this.originalConfigs = {};
      }
      if ((base = this.originalConfigs)[keyPath] == null) {
        base[keyPath] = atom.config.isDefault(keyPath) ? null : atom.config.get(keyPath);
      }
      return atom.config.set(keyPath, value);
    },
    restoreConfigs: function() {
      var keyPath, ref, results, value;
      if (this.originalConfigs) {
        ref = this.originalConfigs;
        results = [];
        for (keyPath in ref) {
          value = ref[keyPath];
          results.push(atom.config.set(keyPath, value));
        }
        return results;
      }
    },
    callAsync: function(timeout, async, next) {
      var done, nextArgs, ref;
      if (typeof timeout === 'function') {
        ref = [timeout, async], async = ref[0], next = ref[1];
        timeout = 5000;
      }
      done = false;
      nextArgs = null;
      runs(function() {
        return async(function() {
          var args;
          args = 1 <= arguments.length ? slice.call(arguments, 0) : [];
          done = true;
          return nextArgs = args;
        });
      });
      waitsFor(function() {
        return done;
      }, null, timeout);
      if (next != null) {
        return runs(function() {
          return next.apply(this, nextArgs);
        });
      }
    }
  };

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL2hvbWUvbWFyY3VzLy5hdG9tL3BhY2thZ2VzL3N5bmMtc2V0dGluZ3Mvc3BlYy9zcGVjLWhlbHBlcnMuY29mZmVlIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FBQUEsTUFBQTs7RUFBQSxNQUFNLENBQUMsT0FBUCxHQUNFO0lBQUEsU0FBQSxFQUFXLFNBQUMsT0FBRCxFQUFVLEtBQVY7QUFDVCxVQUFBOztRQUFBLElBQUMsQ0FBQSxrQkFBbUI7OztZQUNILENBQUEsT0FBQSxJQUFlLElBQUksQ0FBQyxNQUFNLENBQUMsU0FBWixDQUFzQixPQUF0QixDQUFILEdBQXNDLElBQXRDLEdBQWdELElBQUksQ0FBQyxNQUFNLENBQUMsR0FBWixDQUFnQixPQUFoQjs7YUFDN0UsSUFBSSxDQUFDLE1BQU0sQ0FBQyxHQUFaLENBQWdCLE9BQWhCLEVBQXlCLEtBQXpCO0lBSFMsQ0FBWDtJQUtBLGNBQUEsRUFBZ0IsU0FBQTtBQUNkLFVBQUE7TUFBQSxJQUFHLElBQUMsQ0FBQSxlQUFKO0FBQ0U7QUFBQTthQUFBLGNBQUE7O3VCQUNFLElBQUksQ0FBQyxNQUFNLENBQUMsR0FBWixDQUFnQixPQUFoQixFQUF5QixLQUF6QjtBQURGO3VCQURGOztJQURjLENBTGhCO0lBVUEsU0FBQSxFQUFXLFNBQUMsT0FBRCxFQUFVLEtBQVYsRUFBaUIsSUFBakI7QUFDVCxVQUFBO01BQUEsSUFBRyxPQUFPLE9BQVAsS0FBa0IsVUFBckI7UUFDRSxNQUFnQixDQUFDLE9BQUQsRUFBVSxLQUFWLENBQWhCLEVBQUMsY0FBRCxFQUFRO1FBQ1IsT0FBQSxHQUFVLEtBRlo7O01BR0EsSUFBQSxHQUFPO01BQ1AsUUFBQSxHQUFXO01BRVgsSUFBQSxDQUFLLFNBQUE7ZUFDSCxLQUFBLENBQU0sU0FBQTtBQUNKLGNBQUE7VUFESztVQUNMLElBQUEsR0FBTztpQkFDUCxRQUFBLEdBQVc7UUFGUCxDQUFOO01BREcsQ0FBTDtNQU1BLFFBQUEsQ0FBUyxTQUFBO2VBQ1A7TUFETyxDQUFULEVBRUUsSUFGRixFQUVRLE9BRlI7TUFJQSxJQUFHLFlBQUg7ZUFDRSxJQUFBLENBQUssU0FBQTtpQkFDSCxJQUFJLENBQUMsS0FBTCxDQUFXLElBQVgsRUFBaUIsUUFBakI7UUFERyxDQUFMLEVBREY7O0lBakJTLENBVlg7O0FBREYiLCJzb3VyY2VzQ29udGVudCI6WyJtb2R1bGUuZXhwb3J0cyA9XG4gIHNldENvbmZpZzogKGtleVBhdGgsIHZhbHVlKSAtPlxuICAgIEBvcmlnaW5hbENvbmZpZ3MgPz0ge31cbiAgICBAb3JpZ2luYWxDb25maWdzW2tleVBhdGhdID89IGlmIGF0b20uY29uZmlnLmlzRGVmYXVsdCBrZXlQYXRoIHRoZW4gbnVsbCBlbHNlIGF0b20uY29uZmlnLmdldCBrZXlQYXRoXG4gICAgYXRvbS5jb25maWcuc2V0IGtleVBhdGgsIHZhbHVlXG5cbiAgcmVzdG9yZUNvbmZpZ3M6IC0+XG4gICAgaWYgQG9yaWdpbmFsQ29uZmlnc1xuICAgICAgZm9yIGtleVBhdGgsIHZhbHVlIG9mIEBvcmlnaW5hbENvbmZpZ3NcbiAgICAgICAgYXRvbS5jb25maWcuc2V0IGtleVBhdGgsIHZhbHVlXG5cbiAgY2FsbEFzeW5jOiAodGltZW91dCwgYXN5bmMsIG5leHQpIC0+XG4gICAgaWYgdHlwZW9mIHRpbWVvdXQgaXMgJ2Z1bmN0aW9uJ1xuICAgICAgW2FzeW5jLCBuZXh0XSA9IFt0aW1lb3V0LCBhc3luY11cbiAgICAgIHRpbWVvdXQgPSA1MDAwXG4gICAgZG9uZSA9IGZhbHNlXG4gICAgbmV4dEFyZ3MgPSBudWxsXG5cbiAgICBydW5zIC0+XG4gICAgICBhc3luYyAoYXJncy4uLikgLT5cbiAgICAgICAgZG9uZSA9IHRydWVcbiAgICAgICAgbmV4dEFyZ3MgPSBhcmdzXG5cblxuICAgIHdhaXRzRm9yIC0+XG4gICAgICBkb25lXG4gICAgLCBudWxsLCB0aW1lb3V0XG5cbiAgICBpZiBuZXh0P1xuICAgICAgcnVucyAtPlxuICAgICAgICBuZXh0LmFwcGx5KHRoaXMsIG5leHRBcmdzKVxuIl19
