$(function(){
  Backbone.couch_connector.config.db_name = "ghostwriter";
  Backbone.couch_connector.config.ddoc_name = "ghostwriter";
  Backbone.couch_connector.config.global_changes = false;

  var Event = Backbone.Model.extend();

  var Events = Backbone.Collection.extend({
    db : {
      view : "byCollection",
      changes : false
    },
    url : Backbone.couch_connector.config.db_name,
    model: Event
  });

  var Expense = Backbone.Model.extend();

  var Expenses = Backbone.Collection.extend({
    db : {
      view : "byCollection",
      changes : false
    },
    url : Backbone.couch_connector.config.db_name,
    model: Expense
  });

  var ExpensesView = Backbone.View.extend({
    el: $('#expenseTable'),
    expenseHeaders: _.template($('#expenseTableTemplate').html()),
    initialize: function(){
      _.bindAll(this);
    },
    render: function(){
      this.el.html(this.expenseHeaders()),
      this.el.dataTable( {
        });
    }
  });

  var EventsView = Backbone.View.extend({
    initialize: function(){
      _.bindAll(this);
      this.collection.bind('reset', this.addAll);
      this.collection.bind('add', this.addOne);
      this.collection.bind('change', this.change);
      this.collection.bind('destroy', this.destroy);
      this.collection.bind('all', this.test);

      this.eventView = new EventView();
    },
    test: function(data){
      console.info(data);
    },
    render: function() {
      this.el.fullCalendar({
        header: {
          left: 'prev,next today',
          center: 'title',
          right: 'month,basicWeek,basicDay'
        },
        selectable: true,
        selectHelper: true,
        editable: true,
        ignoreTimezone: false,
        select: this.select,
        eventClick: this.eventClick,
        eventDrop: this.eventDropOrResize,
        eventResize: this.eventDropOrResize
      });
    },
    addAll: function() {
      this.el.fullCalendar('addEventSource', this.collection.toJSON());
    },
    addOne: function(event) {
      this.el.fullCalendar('renderEvent', event.toJSON());
    },
    select: function(startDate, endDate) {
      this.eventView.collection = this.collection;
      this.eventView.model = new Event({
        start: startDate,
        end: endDate
      });
      this.eventView.render();
    },
    eventClick: function(fcEvent) {
      this.eventView.model = this.collection.get(fcEvent._id);
      this.eventView.render();
    },
    change: function(event) {
      // Look up the underlying event in the calendar and update its details from the model
      var fcEvent = this.el.fullCalendar('clientEvents', event.get('_id'))[0];
      fcEvent.title = event.get('title');
      fcEvent.location = event.get('location');
      fcEvent.job = event.get('job');
      fcEvent.supervisor_hours = event.get('supervisor_hours');
      fcEvent.worker_hours = event.get('worker_hours');
      fcEvent.worker_count = event.get('worker_count');
      fcEvent.payment = event.get('payment');
      fcEvent.paid = event.get('paid');
      fcEvent.color = window.config.colors[event.get('job')];
      this.el.fullCalendar('updateEvent', fcEvent);
    },
    eventDropOrResize: function(fcEvent) {
      // Lookup the model that has the ID of the event and update its attributes
      this.collection.get(fcEvent._id).save({
        start: fcEvent.start,
        end: fcEvent.end
      });
    },
    destroy: function(event) {
      this.el.fullCalendar('removeEvents', event.id);
    }
  });

  var EventView = Backbone.View.extend({
    el: $('#eventDialog'),
    templateForm: _.template($('#timesheetFormTemplate').html()),
    events: {
      "change input[name=supervisor_hours]" :"updatePayment",
      "change input[name=worker_hours]" :"updatePayment",
      "change input[name=worker_count]" :"updatePayment",
      "change input[name=paid]" :"updatePaid"
    },
    initialize: function() {
      _.bindAll(this);
    },
    updatePayment: function() {
      var supervisor_payment = window.config.rates['supervisor'] * this.$("input[name=supervisor_hours]").val();
      var worker_payment = window.config.rates['worker'] * this.$('input[name=worker_hours]').val() * this.$('input[name=worker_count]').val();
      var payment = supervisor_payment + worker_payment;
      this.model.set({
        'payment': payment
      });
      this.$('input[name=payment]').val(payment);
    },
    updatePaid: function() {
      var pay_span = ($('input[name=paid]').is(':checked')) ? '(paid)' : '(unpaid)';
      $("input[name=paid] + span").text(pay_span);
    },
    render: function() {
      var buttons = {
        'Ok': this.save
      };
      if (!this.model.isNew()) {
        _.extend(buttons, {
          'Delete': this.destroy
        });
      }
      _.extend(buttons, {
        'Cancel': this.close
      });
      $("#timesheet").html(this.templateForm());

      this.el.dialog({
        modal: true,
        title: (this.model.isNew() ? 'New' : 'Edit') + ' Timecard',
        buttons: buttons,
        open: this.open
      });
      return this;
    },
    open: function() {
      var this_model = this.model
      this.$(":input").each( function(){
        $(this).val(this_model.get($(this).attr('name')))
      });
      $(":input[name='paid']").prop("checked", this_model.get('paid'))
      this.updatePaid();
    },
    save: function() {
      var supervisor_payment = window.config.rates['supervisor'] * this.$(':input[name=supervisor_hours]').val();
      var worker_payment = window.config.rates['worker'] * this.$(':input[name=worker_hours]').val() * this.$(':input[name=worker_count]').val();
      var payment = supervisor_payment + worker_payment;
      this.model.set({
        'title': window.config.jobs[this.$(':input[name=job]').val()] + ":" + window.config.locations[this.$(':input[name=location]').val()],
        'color': window.config.colors[this.$(':input[name=job]').val()],
        'location': this.$(':input[name=location]').val(),
        'job': this.$(':input[name=job]').val(),
        'supervisor_hours': this.$(':input[name=supervisor_hours]').val(),
        'worker_hours': this.$(':input[name=worker_hours]').val(),
        'worker_count': this.$(':input[name=worker_count]').val(),
        'paid': this.$(':input[name=paid]').is(':checked'),
        'payment': payment
      });
            
      if (this.model.isNew()) {
        this.collection.create(this.model, {
          success: this.close
        });
      } else {
        this.model.save({}, {
          success: this.close
        });
      }
    },
    close: function() {
      this.el.dialog('close');
    },
    destroy: function() {
      this.model.destroy({
        success: this.close
      });
    }
  });

  $.getJSON("configuration", function(configData){
    window.config = configData;

    $( "#tabs" ).tabs();

    var events = new Events();
    new EventsView({
      el: $("#timesheets"),
      collection: events
    }).render();
    events.fetch({
      success: function(data){
        console.info(data)
      }
    });

    var expenses = new Expenses();
    new ExpensesView({
      el: $("#expenseTable"),
      collection: expenses
    }).render();
    expenses.fetch({
      success: function(data){
        console.info(data)
      }
    });
    
  });
});