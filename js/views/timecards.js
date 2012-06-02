$(function () {

  App.Model.Timecards = Backbone.Collection.extend({
    db : {
      view : "timecards",
      changes : false
    },
    url : "/timecards",
    model: App.Model.Timecard
  });

  App.View.TimecardsView = Backbone.View.extend({
    initialize: function(){
      _.bindAll(this);
      this.collection.bind('reset', this.addAll);
      this.collection.bind('add', this.addOne);
      this.collection.bind('change', this.change);
      this.collection.bind('destroy', this.destroy);
      this.collection.bind('all', this.test);

      this.timecardView = new App.View.TimecardView();
    },
    test: function(data){
      console.info(data);
    },
    render: function() {
      this.el.fullCalendar({
        header: {
          left: 'prev,next today',
          center: 'title',
          right: 'month,basicWeek'
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
    addOne: function(timecard) {
      this.el.fullCalendar('renderEvent', timecard.toJSON());
    },
    select: function(startDate, endDate) {
      this.timecardView.collection = this.collection;
      this.timecardView.model = new App.Model.Timecard({
        start: startDate,
        end: endDate
      });
      this.timecardView.render();
    },
    eventClick: function(fcEvent) {
      this.timecardView.model = this.collection.get(fcEvent._id);
      this.timecardView.render();
    },
    change: function(timecard) {
      // Look up the underlying event in the calendar and update its details from the model
      var fcEvent = this.el.fullCalendar('clientEvents', timecard.get('_id'))[0];
      fcEvent.title = timecard.get('title');
      fcEvent.location = timecard.get('location');
      fcEvent.job = timecard.get('job');
      fcEvent.supervisor_hours = timecard.get('supervisor_hours');
      fcEvent.worker_hours = timecard.get('worker_hours');
      fcEvent.worker_count = timecard.get('worker_count');
      fcEvent.payment = timecard.get('payment');
      fcEvent.paid = timecard.get('paid');
      fcEvent.color = config.colors[timecard.get('job')];
      this.el.fullCalendar('updateEvent', fcEvent);
    },
    eventDropOrResize: function(fcEvent) {
      // Lookup the model that has the ID of the event and update its attributes
      this.collection.get(fcEvent._id).save({
        start: fcEvent.start,
        end: fcEvent.end
      });
    },
    destroy: function(timecard) {
      this.el.fullCalendar('removeEvents', timecard.id);
    },
    unpaidTimecards: function(pay) {
      console.info('unpaid timecards')
      var unpaidTimecardList = [];
      _.each(this.collection.models, function(model){
        if(!model.attributes.paid){
          unpaidTimecardList.push(model.attributes);
        }
      });
      return unpaidTimecardList;
    }
  });

});