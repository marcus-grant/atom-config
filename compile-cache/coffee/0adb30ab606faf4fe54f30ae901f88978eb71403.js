(function() {
  var scopesByFenceName;

  scopesByFenceName = {
    'sh': 'source.shell',
    'bash': 'source.shell',
    'c': 'source.c',
    'c++': 'source.cpp',
    'cpp': 'source.cpp',
    'coffee': 'source.coffee',
    'coffeescript': 'source.coffee',
    'coffee-script': 'source.coffee',
    'cs': 'source.cs',
    'csharp': 'source.cs',
    'css': 'source.css',
    'scss': 'source.css.scss',
    'sass': 'source.sass',
    'erlang': 'source.erl',
    'go': 'source.go',
    'html': 'text.html.basic',
    'java': 'source.java',
    'js': 'source.js',
    'javascript': 'source.js',
    'json': 'source.json',
    'less': 'source.less',
    'mustache': 'text.html.mustache',
    'objc': 'source.objc',
    'objective-c': 'source.objc',
    'php': 'text.html.php',
    'py': 'source.python',
    'python': 'source.python',
    'rb': 'source.ruby',
    'ruby': 'source.ruby',
    'text': 'text.plain',
    'toml': 'source.toml',
    'xml': 'text.xml',
    'yaml': 'source.yaml',
    'yml': 'source.yaml'
  };

  module.exports = {
    scopeForFenceName: function(fenceName) {
      var ref;
      return (ref = scopesByFenceName[fenceName]) != null ? ref : "source." + fenceName;
    }
  };

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL2hvbWUvbWFyY3VzLy5hdG9tL3BhY2thZ2VzL21hcmtkb3duLXByZXZpZXctcGx1cy9saWIvZXh0ZW5zaW9uLWhlbHBlci5jb2ZmZWUiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUFBQSxNQUFBOztFQUFBLGlCQUFBLEdBQ0U7SUFBQSxJQUFBLEVBQU0sY0FBTjtJQUNBLE1BQUEsRUFBUSxjQURSO0lBRUEsR0FBQSxFQUFLLFVBRkw7SUFHQSxLQUFBLEVBQU8sWUFIUDtJQUlBLEtBQUEsRUFBTyxZQUpQO0lBS0EsUUFBQSxFQUFVLGVBTFY7SUFNQSxjQUFBLEVBQWdCLGVBTmhCO0lBT0EsZUFBQSxFQUFpQixlQVBqQjtJQVFBLElBQUEsRUFBTSxXQVJOO0lBU0EsUUFBQSxFQUFVLFdBVFY7SUFVQSxLQUFBLEVBQU8sWUFWUDtJQVdBLE1BQUEsRUFBUSxpQkFYUjtJQVlBLE1BQUEsRUFBUSxhQVpSO0lBYUEsUUFBQSxFQUFVLFlBYlY7SUFjQSxJQUFBLEVBQU0sV0FkTjtJQWVBLE1BQUEsRUFBUSxpQkFmUjtJQWdCQSxNQUFBLEVBQVEsYUFoQlI7SUFpQkEsSUFBQSxFQUFNLFdBakJOO0lBa0JBLFlBQUEsRUFBYyxXQWxCZDtJQW1CQSxNQUFBLEVBQVEsYUFuQlI7SUFvQkEsTUFBQSxFQUFRLGFBcEJSO0lBcUJBLFVBQUEsRUFBWSxvQkFyQlo7SUFzQkEsTUFBQSxFQUFRLGFBdEJSO0lBdUJBLGFBQUEsRUFBZSxhQXZCZjtJQXdCQSxLQUFBLEVBQU8sZUF4QlA7SUF5QkEsSUFBQSxFQUFNLGVBekJOO0lBMEJBLFFBQUEsRUFBVSxlQTFCVjtJQTJCQSxJQUFBLEVBQU0sYUEzQk47SUE0QkEsTUFBQSxFQUFRLGFBNUJSO0lBNkJBLE1BQUEsRUFBUSxZQTdCUjtJQThCQSxNQUFBLEVBQVEsYUE5QlI7SUErQkEsS0FBQSxFQUFPLFVBL0JQO0lBZ0NBLE1BQUEsRUFBUSxhQWhDUjtJQWlDQSxLQUFBLEVBQU8sYUFqQ1A7OztFQW1DRixNQUFNLENBQUMsT0FBUCxHQUNFO0lBQUEsaUJBQUEsRUFBbUIsU0FBQyxTQUFEO0FBQ2pCLFVBQUE7a0VBQStCLFNBQUEsR0FBVTtJQUR4QixDQUFuQjs7QUFyQ0YiLCJzb3VyY2VzQ29udGVudCI6WyJzY29wZXNCeUZlbmNlTmFtZSA9XG4gICdzaCc6ICdzb3VyY2Uuc2hlbGwnXG4gICdiYXNoJzogJ3NvdXJjZS5zaGVsbCdcbiAgJ2MnOiAnc291cmNlLmMnXG4gICdjKysnOiAnc291cmNlLmNwcCdcbiAgJ2NwcCc6ICdzb3VyY2UuY3BwJ1xuICAnY29mZmVlJzogJ3NvdXJjZS5jb2ZmZWUnXG4gICdjb2ZmZWVzY3JpcHQnOiAnc291cmNlLmNvZmZlZSdcbiAgJ2NvZmZlZS1zY3JpcHQnOiAnc291cmNlLmNvZmZlZSdcbiAgJ2NzJzogJ3NvdXJjZS5jcydcbiAgJ2NzaGFycCc6ICdzb3VyY2UuY3MnXG4gICdjc3MnOiAnc291cmNlLmNzcydcbiAgJ3Njc3MnOiAnc291cmNlLmNzcy5zY3NzJ1xuICAnc2Fzcyc6ICdzb3VyY2Uuc2FzcydcbiAgJ2VybGFuZyc6ICdzb3VyY2UuZXJsJ1xuICAnZ28nOiAnc291cmNlLmdvJ1xuICAnaHRtbCc6ICd0ZXh0Lmh0bWwuYmFzaWMnXG4gICdqYXZhJzogJ3NvdXJjZS5qYXZhJ1xuICAnanMnOiAnc291cmNlLmpzJ1xuICAnamF2YXNjcmlwdCc6ICdzb3VyY2UuanMnXG4gICdqc29uJzogJ3NvdXJjZS5qc29uJ1xuICAnbGVzcyc6ICdzb3VyY2UubGVzcydcbiAgJ211c3RhY2hlJzogJ3RleHQuaHRtbC5tdXN0YWNoZSdcbiAgJ29iamMnOiAnc291cmNlLm9iamMnXG4gICdvYmplY3RpdmUtYyc6ICdzb3VyY2Uub2JqYydcbiAgJ3BocCc6ICd0ZXh0Lmh0bWwucGhwJ1xuICAncHknOiAnc291cmNlLnB5dGhvbidcbiAgJ3B5dGhvbic6ICdzb3VyY2UucHl0aG9uJ1xuICAncmInOiAnc291cmNlLnJ1YnknXG4gICdydWJ5JzogJ3NvdXJjZS5ydWJ5J1xuICAndGV4dCc6ICd0ZXh0LnBsYWluJ1xuICAndG9tbCc6ICdzb3VyY2UudG9tbCdcbiAgJ3htbCc6ICd0ZXh0LnhtbCdcbiAgJ3lhbWwnOiAnc291cmNlLnlhbWwnXG4gICd5bWwnOiAnc291cmNlLnlhbWwnXG5cbm1vZHVsZS5leHBvcnRzID1cbiAgc2NvcGVGb3JGZW5jZU5hbWU6IChmZW5jZU5hbWUpIC0+XG4gICAgc2NvcGVzQnlGZW5jZU5hbWVbZmVuY2VOYW1lXSA/IFwic291cmNlLiN7ZmVuY2VOYW1lfVwiXG4iXX0=
