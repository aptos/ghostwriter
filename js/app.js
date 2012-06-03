$(function(){

  $.getJSON("configuration", function(configData){
    config = configData;
    App = {
      View: {},
      Model: {}
    };

    var my_scripts = [
      'js/vendor/backbone-couchdb.js',
    'js/vendor/jquery.couch.js',
    'js/vendor/jquery-ui-1.8.13.custom.min.js',
    'js/vendor/fullcalendar.min.js',
    'js/vendor/jquery.dataTables.min.js',
    'js/views/expense.js',
    'js/views/expenses.js',
    'js/views/timecard.js',
    'js/views/timecards.js',
    'js/common.js'
    ];

    App.get_script = function(scripts, cb){

      $.ajaxSetup({
        cache:false
      })
      /* enhance $.getScript to handle mutiple scripts */
      var getScript = $.getScript;

      var length = scripts.length
      var deferreds = []

      for (var idx = 0 ; idx < length; idx++ ) {
        deferreds.push(
          getScript( scripts[ idx ] )
          );
      }

      $.when.apply( null, deferreds ).then(function() {
        cb && cb();
      }, function(e){
        console.log('LOAD SCRIPTS ERROR');
        console.log(arguments);
      });

    }

// Start the App
    App.get_script(my_scripts, function() {
      console.info('loading completssse!')
      Backbone.couch_connector.config.db_name = "ghostwriter";
      Backbone.couch_connector.config.ddoc_name = "ghostwriter";
      Backbone.couch_connector.config.global_changes = false;


      timecards = new App.Model.Timecards();
      timecards_view = new App.View.TimecardsView({
        el: $("#timecards"),
        collection: timecards
      });
      timecards_view.render();
      timecards.fetch();

      expenses = new App.Model.Expenses();
      expenses_view = new App.View.ExpensesView({
        el: $('#expenses'),
        collection: expenses,
        timecards: timecards_view
      });
      expenses_view.render();
      
      $( "#tabs" ).tabs();
    });
  });
});