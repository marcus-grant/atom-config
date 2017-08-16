(function() {
  (function() {
    var __slice_, vm;
    RegExp.escape = function(s) {
      return s.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
    };
    vm = void 0;
    __slice_ = [].slice;
    vm = require("vm");
    exports.allowUnsafeEval = function(fn) {
      var previousEval;
      previousEval = void 0;
      previousEval = global["eval"];
      try {
        global["eval"] = function(source) {
          return vm.runInThisContext(source);
        };
        return fn();
      } finally {
        global["eval"] = previousEval;
      }
    };
    exports.allowUnsafeNewFunction = function(fn) {
      var previousFunction;
      previousFunction = void 0;
      previousFunction = global.Function;
      try {
        global.Function = exports.Function;
        return fn();
      } finally {
        global.Function = previousFunction;
      }
    };
    exports.allowUnsafe = function(fn) {
      var previousEval, previousFunction;
      previousEval = void 0;
      previousFunction = void 0;
      previousFunction = global.Function;
      previousEval = global["eval"];
      try {
        global.Function = exports.Function;
        global["eval"] = function(source) {
          return vm.runInThisContext(source);
        };
        return fn();
      } finally {
        global["eval"] = previousEval;
        global.Function = previousFunction;
      }
    };
    exports.Function = function() {
      var _i, _j, _len, body, paramList, paramLists, params;
      body = void 0;
      paramList = void 0;
      paramLists = void 0;
      params = void 0;
      _i = void 0;
      _j = void 0;
      _len = void 0;
      paramLists = (2 <= arguments.length ? __slice_.call(arguments, 0, _i = arguments.length - 1) : (_i = 0, []));
      body = arguments[_i++];
      params = [];
      _j = 0;
      _len = paramLists.length;
      while (_j < _len) {
        paramList = paramLists[_j];
        if (typeof paramList === "string") {
          paramList = paramList.split(/\s*,\s*/);
        }
        params.push.apply(params, paramList);
        _j++;
      }
      return vm.runInThisContext("(function(" + (params.join(", ")) + ") {\n  " + body + "\n})");
    };
  }).call(this);

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL2hvbWUvbWFyY3VzLy5hdG9tL3BhY2thZ2VzL2Jyb3dzZXItcGx1cy9saWIvZXZhbC5jb2ZmZWUiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7RUFBQSxDQUFDLFNBQUE7QUFDQSxRQUFBO0lBQUEsTUFBTSxDQUFDLE1BQVAsR0FBZSxTQUFDLENBQUQ7YUFDZCxDQUFDLENBQUMsT0FBRixDQUFVLHdCQUFWLEVBQW9DLE1BQXBDO0lBRGM7SUFFZixFQUFBLEdBQUs7SUFDTCxRQUFBLEdBQVcsRUFBRSxDQUFDO0lBQ2QsRUFBQSxHQUFLLE9BQUEsQ0FBUSxJQUFSO0lBQ0wsT0FBTyxDQUFDLGVBQVIsR0FBMEIsU0FBQyxFQUFEO0FBQ3pCLFVBQUE7TUFBQSxZQUFBLEdBQWU7TUFDZixZQUFBLEdBQWUsTUFBTyxDQUFBLE1BQUE7QUFDdEI7UUFDQyxNQUFPLENBQUEsTUFBQSxDQUFQLEdBQWlCLFNBQUMsTUFBRDtpQkFDaEIsRUFBRSxDQUFDLGdCQUFILENBQW9CLE1BQXBCO1FBRGdCO0FBR2pCLGVBQU8sRUFBQSxDQUFBLEVBSlI7T0FBQTtRQU1DLE1BQU8sQ0FBQSxNQUFBLENBQVAsR0FBaUIsYUFObEI7O0lBSHlCO0lBWTFCLE9BQU8sQ0FBQyxzQkFBUixHQUFpQyxTQUFDLEVBQUQ7QUFDaEMsVUFBQTtNQUFBLGdCQUFBLEdBQW1CO01BQ25CLGdCQUFBLEdBQW1CLE1BQU0sQ0FBQztBQUMxQjtRQUNDLE1BQU0sQ0FBQyxRQUFQLEdBQWtCLE9BQU8sQ0FBQztBQUMxQixlQUFPLEVBQUEsQ0FBQSxFQUZSO09BQUE7UUFJQyxNQUFNLENBQUMsUUFBUCxHQUFrQixpQkFKbkI7O0lBSGdDO0lBVWpDLE9BQU8sQ0FBQyxXQUFSLEdBQXNCLFNBQUMsRUFBRDtBQUNyQixVQUFBO01BQUEsWUFBQSxHQUFlO01BQ2YsZ0JBQUEsR0FBbUI7TUFDbkIsZ0JBQUEsR0FBbUIsTUFBTSxDQUFDO01BQzFCLFlBQUEsR0FBZSxNQUFPLENBQUEsTUFBQTtBQUN0QjtRQUNDLE1BQU0sQ0FBQyxRQUFQLEdBQWtCLE9BQU8sQ0FBQztRQUMxQixNQUFPLENBQUEsTUFBQSxDQUFQLEdBQWlCLFNBQUMsTUFBRDtpQkFDaEIsRUFBRSxDQUFDLGdCQUFILENBQW9CLE1BQXBCO1FBRGdCO0FBR2pCLGVBQU8sRUFBQSxDQUFBLEVBTFI7T0FBQTtRQU9DLE1BQU8sQ0FBQSxNQUFBLENBQVAsR0FBaUI7UUFDakIsTUFBTSxDQUFDLFFBQVAsR0FBa0IsaUJBUm5COztJQUxxQjtJQWdCdEIsT0FBTyxDQUFDLFFBQVIsR0FBbUIsU0FBQTtBQUNsQixVQUFBO01BQUEsSUFBQSxHQUFPO01BQ1AsU0FBQSxHQUFZO01BQ1osVUFBQSxHQUFhO01BQ2IsTUFBQSxHQUFTO01BQ1QsRUFBQSxHQUFLO01BQ0wsRUFBQSxHQUFLO01BQ0wsSUFBQSxHQUFPO01BQ1AsVUFBQSxHQUFhLENBQUksQ0FBQSxJQUFLLFNBQVMsQ0FBQyxNQUFsQixHQUE4QixRQUFRLENBQUMsSUFBVCxDQUFjLFNBQWQsRUFBeUIsQ0FBekIsRUFBNEIsRUFBQSxHQUFLLFNBQVMsQ0FBQyxNQUFWLEdBQW1CLENBQXBELENBQTlCLEdBQTBGLENBQUMsRUFBQSxHQUFLLENBQUwsRUFDekcsRUFEd0csQ0FBM0Y7TUFHYixJQUFBLEdBQU8sU0FBVSxDQUFBLEVBQUEsRUFBQTtNQUVqQixNQUFBLEdBQVM7TUFDVCxFQUFBLEdBQUs7TUFDTCxJQUFBLEdBQU8sVUFBVSxDQUFDO0FBRWxCLGFBQU0sRUFBQSxHQUFLLElBQVg7UUFDQyxTQUFBLEdBQVksVUFBVyxDQUFBLEVBQUE7UUFDdkIsSUFBMEMsT0FBTyxTQUFQLEtBQW9CLFFBQTlEO1VBQUEsU0FBQSxHQUFZLFNBQVMsQ0FBQyxLQUFWLENBQWdCLFNBQWhCLEVBQVo7O1FBQ0EsTUFBTSxDQUFDLElBQUksQ0FBQyxLQUFaLENBQWtCLE1BQWxCLEVBQTBCLFNBQTFCO1FBQ0EsRUFBQTtNQUpEO2FBS0EsRUFBRSxDQUFDLGdCQUFILENBQW9CLFlBQUEsR0FBZSxDQUFDLE1BQU0sQ0FBQyxJQUFQLENBQVksSUFBWixDQUFELENBQWYsR0FBcUMsU0FBckMsR0FBaUQsSUFBakQsR0FBd0QsTUFBNUU7SUF0QmtCO0VBNUNuQixDQUFELENBcUVDLENBQUMsSUFyRUYsQ0FxRU8sSUFyRVA7QUFBQSIsInNvdXJjZXNDb250ZW50IjpbIigtPlxuXHRSZWdFeHAuZXNjYXBlPSAocyktPlxuXHRcdHMucmVwbGFjZSAvWy1cXC9cXFxcXiQqKz8uKCl8W1xcXXt9XS9nLCAnXFxcXCQmJ1xuXHR2bSA9IHVuZGVmaW5lZFxuXHRfX3NsaWNlXyA9IFtdLnNsaWNlXG5cdHZtID0gcmVxdWlyZShcInZtXCIpXG5cdGV4cG9ydHMuYWxsb3dVbnNhZmVFdmFsID0gKGZuKSAtPlxuXHRcdHByZXZpb3VzRXZhbCA9IHVuZGVmaW5lZFxuXHRcdHByZXZpb3VzRXZhbCA9IGdsb2JhbFtcImV2YWxcIl1cblx0XHR0cnlcblx0XHRcdGdsb2JhbFtcImV2YWxcIl0gPSAoc291cmNlKSAtPlxuXHRcdFx0XHR2bS5ydW5JblRoaXNDb250ZXh0IHNvdXJjZVxuXG5cdFx0XHRyZXR1cm4gZm4oKVxuXHRcdGZpbmFsbHlcblx0XHRcdGdsb2JhbFtcImV2YWxcIl0gPSBwcmV2aW91c0V2YWxcblx0XHRyZXR1cm5cblxuXHRleHBvcnRzLmFsbG93VW5zYWZlTmV3RnVuY3Rpb24gPSAoZm4pIC0+XG5cdFx0cHJldmlvdXNGdW5jdGlvbiA9IHVuZGVmaW5lZFxuXHRcdHByZXZpb3VzRnVuY3Rpb24gPSBnbG9iYWwuRnVuY3Rpb25cblx0XHR0cnlcblx0XHRcdGdsb2JhbC5GdW5jdGlvbiA9IGV4cG9ydHMuRnVuY3Rpb25cblx0XHRcdHJldHVybiBmbigpXG5cdFx0ZmluYWxseVxuXHRcdFx0Z2xvYmFsLkZ1bmN0aW9uID0gcHJldmlvdXNGdW5jdGlvblxuXHRcdHJldHVyblxuXG5cdGV4cG9ydHMuYWxsb3dVbnNhZmUgPSAoZm4pIC0+XG5cdFx0cHJldmlvdXNFdmFsID0gdW5kZWZpbmVkXG5cdFx0cHJldmlvdXNGdW5jdGlvbiA9IHVuZGVmaW5lZFxuXHRcdHByZXZpb3VzRnVuY3Rpb24gPSBnbG9iYWwuRnVuY3Rpb25cblx0XHRwcmV2aW91c0V2YWwgPSBnbG9iYWxbXCJldmFsXCJdXG5cdFx0dHJ5XG5cdFx0XHRnbG9iYWwuRnVuY3Rpb24gPSBleHBvcnRzLkZ1bmN0aW9uXG5cdFx0XHRnbG9iYWxbXCJldmFsXCJdID0gKHNvdXJjZSkgLT5cblx0XHRcdFx0dm0ucnVuSW5UaGlzQ29udGV4dCBzb3VyY2VcblxuXHRcdFx0cmV0dXJuIGZuKClcblx0XHRmaW5hbGx5XG5cdFx0XHRnbG9iYWxbXCJldmFsXCJdID0gcHJldmlvdXNFdmFsXG5cdFx0XHRnbG9iYWwuRnVuY3Rpb24gPSBwcmV2aW91c0Z1bmN0aW9uXG5cdFx0cmV0dXJuXG5cblx0ZXhwb3J0cy5GdW5jdGlvbiA9IC0+XG5cdFx0Ym9keSA9IHVuZGVmaW5lZFxuXHRcdHBhcmFtTGlzdCA9IHVuZGVmaW5lZFxuXHRcdHBhcmFtTGlzdHMgPSB1bmRlZmluZWRcblx0XHRwYXJhbXMgPSB1bmRlZmluZWRcblx0XHRfaSA9IHVuZGVmaW5lZFxuXHRcdF9qID0gdW5kZWZpbmVkXG5cdFx0X2xlbiA9IHVuZGVmaW5lZFxuXHRcdHBhcmFtTGlzdHMgPSAoaWYgMiA8PSBhcmd1bWVudHMubGVuZ3RoIHRoZW4gX19zbGljZV8uY2FsbChhcmd1bWVudHMsIDAsIF9pID0gYXJndW1lbnRzLmxlbmd0aCAtIDEpIGVsc2UgKF9pID0gMFxuXHRcdFtdXG5cdFx0KSlcblx0XHRib2R5ID0gYXJndW1lbnRzW19pKytdXG5cblx0XHRwYXJhbXMgPSBbXVxuXHRcdF9qID0gMFxuXHRcdF9sZW4gPSBwYXJhbUxpc3RzLmxlbmd0aFxuXG5cdFx0d2hpbGUgX2ogPCBfbGVuXG5cdFx0XHRwYXJhbUxpc3QgPSBwYXJhbUxpc3RzW19qXVxuXHRcdFx0cGFyYW1MaXN0ID0gcGFyYW1MaXN0LnNwbGl0KC9cXHMqLFxccyovKVx0aWYgdHlwZW9mIHBhcmFtTGlzdCBpcyBcInN0cmluZ1wiXG5cdFx0XHRwYXJhbXMucHVzaC5hcHBseSBwYXJhbXMsIHBhcmFtTGlzdFxuXHRcdFx0X2orK1xuXHRcdHZtLnJ1bkluVGhpc0NvbnRleHQgXCIoZnVuY3Rpb24oXCIgKyAocGFyYW1zLmpvaW4oXCIsIFwiKSkgKyBcIikge1xcbiAgXCIgKyBib2R5ICsgXCJcXG59KVwiXG5cblx0cmV0dXJuXG4pLmNhbGwgdGhpc1xuIl19
