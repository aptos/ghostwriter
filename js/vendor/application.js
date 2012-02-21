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
    events: {
      "change #supervisor_hours" :"updatePayment",
      "change #worker_hours" :"updatePayment",
      "change #worker_count" :"updatePayment"
    },
    initialize: function() {
      _.bindAll(this);
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
            
      this.el.dialog({
        modal: true,
        title: (this.model.isNew() ? 'New' : 'Edit') + ' Timecard',
        buttons: buttons,
        open: this.open
      });

      return this;
    },
    open: function() {
      this.$('#title').val(this.model.get('title'));
      this.$('#location').val(this.model.get('location'));
      this.$('#job').val(this.model.get('job'));
      this.$('#supervisor_hours').val(this.model.get('supervisor_hours'));
      this.$('#worker_hours').val(this.model.get('worker_hours'));
      this.$('#worker_count').val(this.model.get('worker_count'));
      this.$('#payment').val(this.model.get('payment'));
      this.$('#paid').prop("checked",(this.model.get('paid')));
    },
    save: function() {
      var supervisor_payment = window.config.rates['supervisor'] * this.$('#supervisor_hours').val();
      var worker_payment = window.config.rates['worker'] * this.$('#worker_hours').val() * this.$('#worker_count').val();
      var payment = supervisor_payment + worker_payment;
      this.model.set({
        'title': window.config.jobs[this.$('#job').val()] + ":" + window.config.locations[this.$('#location').val()],
        'location': this.$('#location').val(),
        'job': this.$('#job').val(),
        'supervisor_hours': this.$('#supervisor_hours').val(),
        'worker_hours': this.$('#worker_hours').val(),
        'worker_count': this.$('#worker_count').val(),
        'color': window.config.colors[this.$('#job').val()],
        'payment': payment,
        'paid': this.$('#paid').is(':checked')
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
    },
    updatePayment: function() {
      console.info('updatePayment')
      var supervisor_payment = window.config.rates['supervisor'] * this.$('#supervisor_hours').val();
      var worker_payment = window.config.rates['worker'] * this.$('#worker_hours').val() * this.$('#worker_count').val();
      var payment = supervisor_payment + worker_payment;
      this.model.set({
        'payment': payment
      });
      $('#payment').val(payment);
    }
  });

  $.getJSON("configuration", function(configData){
    window.config = configData;
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
    _.each(window.config.locations,function(value,key){
      $("#location").append("<option value='" + key + "'>" + value + "</option>");
    });
    _.each(window.config.jobs,function(value,key){
      $("#job").append("<option value='" + key + "'>" + value + "</option>");
    });
  });
});