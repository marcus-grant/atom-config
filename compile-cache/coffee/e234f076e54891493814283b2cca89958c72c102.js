(function() {
  var $, CompositeDisposable, ForkGistIdInputView, TextEditorView, View, oldView, ref,
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

  CompositeDisposable = require('atom').CompositeDisposable;

  ref = require('atom-space-pen-views'), $ = ref.$, TextEditorView = ref.TextEditorView, View = ref.View;

  oldView = null;

  module.exports = ForkGistIdInputView = (function(superClass) {
    extend(ForkGistIdInputView, superClass);

    function ForkGistIdInputView() {
      return ForkGistIdInputView.__super__.constructor.apply(this, arguments);
    }

    ForkGistIdInputView.content = function() {
      return this.div({
        "class": 'command-palette'
      }, (function(_this) {
        return function() {
          return _this.subview('selectEditor', new TextEditorView({
            mini: true,
            placeholderText: 'Gist ID to fork'
          }));
        };
      })(this));
    };

    ForkGistIdInputView.prototype.initialize = function() {
      if (oldView != null) {
        oldView.destroy();
      }
      oldView = this;
      this.disposables = new CompositeDisposable;
      this.disposables.add(atom.commands.add('atom-text-editor', 'core:confirm', (function(_this) {
        return function() {
          return _this.confirm();
        };
      })(this)));
      this.disposables.add(atom.commands.add('atom-text-editor', 'core:cancel', (function(_this) {
        return function() {
          return _this.destroy();
        };
      })(this)));
      return this.attach();
    };

    ForkGistIdInputView.prototype.destroy = function() {
      this.disposables.dispose();
      return this.detach();
    };

    ForkGistIdInputView.prototype.attach = function() {
      if (this.panel == null) {
        this.panel = atom.workspace.addModalPanel({
          item: this
        });
      }
      this.panel.show();
      return this.selectEditor.focus();
    };

    ForkGistIdInputView.prototype.detach = function() {
      this.panel.destroy();
      return ForkGistIdInputView.__super__.detach.apply(this, arguments);
    };

    ForkGistIdInputView.prototype.confirm = function() {
      var gistId;
      gistId = this.selectEditor.getText();
      this.callbackInstance.forkGistId(gistId);
      return this.destroy();
    };

    ForkGistIdInputView.prototype.setCallbackInstance = function(callbackInstance) {
      return this.callbackInstance = callbackInstance;
    };

    return ForkGistIdInputView;

  })(View);

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL2hvbWUvbWFyY3VzLy5hdG9tL3BhY2thZ2VzL3N5bmMtc2V0dGluZ3MvbGliL2ZvcmstZ2lzdGlkLWlucHV0LXZpZXcuY29mZmVlIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FBQUEsTUFBQSwrRUFBQTtJQUFBOzs7RUFBQyxzQkFBdUIsT0FBQSxDQUFRLE1BQVI7O0VBQ3hCLE1BQTRCLE9BQUEsQ0FBUSxzQkFBUixDQUE1QixFQUFDLFNBQUQsRUFBSSxtQ0FBSixFQUFvQjs7RUFFcEIsT0FBQSxHQUFVOztFQUVWLE1BQU0sQ0FBQyxPQUFQLEdBQ1E7Ozs7Ozs7SUFDSixtQkFBQyxDQUFBLE9BQUQsR0FBVSxTQUFBO2FBQ1IsSUFBQyxDQUFBLEdBQUQsQ0FBSztRQUFBLENBQUEsS0FBQSxDQUFBLEVBQU8saUJBQVA7T0FBTCxFQUErQixDQUFBLFNBQUEsS0FBQTtlQUFBLFNBQUE7aUJBQzdCLEtBQUMsQ0FBQSxPQUFELENBQVMsY0FBVCxFQUE2QixJQUFBLGNBQUEsQ0FBZTtZQUFBLElBQUEsRUFBTSxJQUFOO1lBQVksZUFBQSxFQUFpQixpQkFBN0I7V0FBZixDQUE3QjtRQUQ2QjtNQUFBLENBQUEsQ0FBQSxDQUFBLElBQUEsQ0FBL0I7SUFEUTs7a0NBSVYsVUFBQSxHQUFZLFNBQUE7O1FBQ1YsT0FBTyxDQUFFLE9BQVQsQ0FBQTs7TUFDQSxPQUFBLEdBQVU7TUFFVixJQUFDLENBQUEsV0FBRCxHQUFlLElBQUk7TUFDbkIsSUFBQyxDQUFBLFdBQVcsQ0FBQyxHQUFiLENBQWlCLElBQUksQ0FBQyxRQUFRLENBQUMsR0FBZCxDQUFrQixrQkFBbEIsRUFBc0MsY0FBdEMsRUFBc0QsQ0FBQSxTQUFBLEtBQUE7ZUFBQSxTQUFBO2lCQUFHLEtBQUMsQ0FBQSxPQUFELENBQUE7UUFBSDtNQUFBLENBQUEsQ0FBQSxDQUFBLElBQUEsQ0FBdEQsQ0FBakI7TUFDQSxJQUFDLENBQUEsV0FBVyxDQUFDLEdBQWIsQ0FBaUIsSUFBSSxDQUFDLFFBQVEsQ0FBQyxHQUFkLENBQWtCLGtCQUFsQixFQUFzQyxhQUF0QyxFQUFxRCxDQUFBLFNBQUEsS0FBQTtlQUFBLFNBQUE7aUJBQUcsS0FBQyxDQUFBLE9BQUQsQ0FBQTtRQUFIO01BQUEsQ0FBQSxDQUFBLENBQUEsSUFBQSxDQUFyRCxDQUFqQjthQUNBLElBQUMsQ0FBQSxNQUFELENBQUE7SUFQVTs7a0NBU1osT0FBQSxHQUFTLFNBQUE7TUFDUCxJQUFDLENBQUEsV0FBVyxDQUFDLE9BQWIsQ0FBQTthQUNBLElBQUMsQ0FBQSxNQUFELENBQUE7SUFGTzs7a0NBSVQsTUFBQSxHQUFRLFNBQUE7O1FBQ04sSUFBQyxDQUFBLFFBQVMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxhQUFmLENBQTZCO1VBQUEsSUFBQSxFQUFNLElBQU47U0FBN0I7O01BQ1YsSUFBQyxDQUFBLEtBQUssQ0FBQyxJQUFQLENBQUE7YUFDQSxJQUFDLENBQUEsWUFBWSxDQUFDLEtBQWQsQ0FBQTtJQUhNOztrQ0FLUixNQUFBLEdBQVEsU0FBQTtNQUNOLElBQUMsQ0FBQSxLQUFLLENBQUMsT0FBUCxDQUFBO2FBQ0EsaURBQUEsU0FBQTtJQUZNOztrQ0FJUixPQUFBLEdBQVMsU0FBQTtBQUNQLFVBQUE7TUFBQSxNQUFBLEdBQVMsSUFBQyxDQUFBLFlBQVksQ0FBQyxPQUFkLENBQUE7TUFDVCxJQUFDLENBQUEsZ0JBQWdCLENBQUMsVUFBbEIsQ0FBNkIsTUFBN0I7YUFDQSxJQUFDLENBQUEsT0FBRCxDQUFBO0lBSE87O2tDQUtULG1CQUFBLEdBQXFCLFNBQUMsZ0JBQUQ7YUFDbkIsSUFBQyxDQUFBLGdCQUFELEdBQW9CO0lBREQ7Ozs7S0FoQ1c7QUFOcEMiLCJzb3VyY2VzQ29udGVudCI6WyJ7Q29tcG9zaXRlRGlzcG9zYWJsZX0gPSByZXF1aXJlICdhdG9tJ1xueyQsIFRleHRFZGl0b3JWaWV3LCBWaWV3fSA9IHJlcXVpcmUgJ2F0b20tc3BhY2UtcGVuLXZpZXdzJ1xuXG5vbGRWaWV3ID0gbnVsbFxuXG5tb2R1bGUuZXhwb3J0cyA9XG4gIGNsYXNzIEZvcmtHaXN0SWRJbnB1dFZpZXcgZXh0ZW5kcyBWaWV3XG4gICAgQGNvbnRlbnQ6IC0+XG4gICAgICBAZGl2IGNsYXNzOiAnY29tbWFuZC1wYWxldHRlJywgPT5cbiAgICAgICAgQHN1YnZpZXcgJ3NlbGVjdEVkaXRvcicsIG5ldyBUZXh0RWRpdG9yVmlldyhtaW5pOiB0cnVlLCBwbGFjZWhvbGRlclRleHQ6ICdHaXN0IElEIHRvIGZvcmsnKVxuXG4gICAgaW5pdGlhbGl6ZTogLT5cbiAgICAgIG9sZFZpZXc/LmRlc3Ryb3koKVxuICAgICAgb2xkVmlldyA9IHRoaXNcblxuICAgICAgQGRpc3Bvc2FibGVzID0gbmV3IENvbXBvc2l0ZURpc3Bvc2FibGVcbiAgICAgIEBkaXNwb3NhYmxlcy5hZGQgYXRvbS5jb21tYW5kcy5hZGQgJ2F0b20tdGV4dC1lZGl0b3InLCAnY29yZTpjb25maXJtJywgPT4gQGNvbmZpcm0oKVxuICAgICAgQGRpc3Bvc2FibGVzLmFkZCBhdG9tLmNvbW1hbmRzLmFkZCAnYXRvbS10ZXh0LWVkaXRvcicsICdjb3JlOmNhbmNlbCcsID0+IEBkZXN0cm95KClcbiAgICAgIEBhdHRhY2goKVxuXG4gICAgZGVzdHJveTogLT5cbiAgICAgIEBkaXNwb3NhYmxlcy5kaXNwb3NlKClcbiAgICAgIEBkZXRhY2goKVxuXG4gICAgYXR0YWNoOiAtPlxuICAgICAgQHBhbmVsID89IGF0b20ud29ya3NwYWNlLmFkZE1vZGFsUGFuZWwoaXRlbTogdGhpcylcbiAgICAgIEBwYW5lbC5zaG93KClcbiAgICAgIEBzZWxlY3RFZGl0b3IuZm9jdXMoKVxuXG4gICAgZGV0YWNoOiAtPlxuICAgICAgQHBhbmVsLmRlc3Ryb3koKVxuICAgICAgc3VwZXJcblxuICAgIGNvbmZpcm06IC0+XG4gICAgICBnaXN0SWQgPSBAc2VsZWN0RWRpdG9yLmdldFRleHQoKVxuICAgICAgQGNhbGxiYWNrSW5zdGFuY2UuZm9ya0dpc3RJZChnaXN0SWQpXG4gICAgICBAZGVzdHJveSgpXG5cbiAgICBzZXRDYWxsYmFja0luc3RhbmNlOiAoY2FsbGJhY2tJbnN0YW5jZSkgLT5cbiAgICAgIEBjYWxsYmFja0luc3RhbmNlID0gY2FsbGJhY2tJbnN0YW5jZVxuIl19
