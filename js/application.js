$(function(){
  Backbone.couch_connector.config.db_name = "ghostwriter";
  Backbone.couch_connector.config.ddoc_name = "ghostwriter";
  Backbone.couch_connector.config.global_changes = false;

  var Timecard = Backbone.Model.extend();

  var Timecards = Backbone.Collection.extend({
    db : {
      view : "timecards",
      changes : false
    },
    url : "/timecards",
    model: Timecard
  });

  var Expense = Backbone.Model.extend();

  var Expenses = Backbone.Collection.extend({
    db : {
      view : "expenses",
      changes : false
    },
    url : "/expenses",
    model: Expense
  });

  var ExpensesView = Backbone.View.extend({
    el: $('#expenses'),
    expense_table: $('#expenseTable'),
    expenseHeaders: _.template($('#expenseTableTemplate').html()),
    initialize: function(){
      _.bindAll(this, 'newExpense');
      this.collection.bind('add', this.addOne);
      this.collection.bind('all', this.test);

      this.expenseView = new ExpenseView();
    },
    events: {
        'click #add-expense': 'newExpense'
    },
    test: function(data){
      console.info(data);
    },
    newExpense:function (event) {
        console.info("newExpense!")
        var expenseView = new ExpenseView();
        expenseView.collection = this.collection;
        expenseView.model = new Expense();
        expenseView.render();
        return false;
    },
    addOne: function(expense) {
      console.info(expense.attributes)
      var expenseRow = [];
      _.each(expense.attributes, function(value){
            expenseRow.push(value);
          });
      $('#expenseTable').dataTable().fnAddData(expenseRow);
    },
    render: function(){
      var viewScope = this;
      viewScope.expense_table.html(this.expenseHeaders());
      this.collection.fetch({
        success: function(data){
          var myData = [];
          _.each(data.models, function(value){
            myData.push(value.attributes);
          });
          viewScope.expense_table.dataTable({
            "aaData": myData
          });
        }
      });
    }
  });

  var ExpenseView = Backbone.View.extend({
    el: $('#expenseDialog'),
    templateForm: _.template($('#expenseFormTemplate').html()),
    events: {
    },
    initialize: function() {
      _.bindAll(this);
    },
    render: function() {
      console.info(this.collection)
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
      $("#expense").html(this.templateForm());

      this.el.dialog({
        modal: true,
        title: (this.model.isNew() ? 'New' : 'Edit') + ' Expense',
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
    },
    save: function() {
      this.model.set({
        'date': this.$(':input[name=date]').val(),
        'vendor': this.$(':input[name=vendor]').val(),
        'category': this.$(':input[name=category]').val(),
        'description': this.$(':input[name=description]').val(),
        'account': this.$(':input[name=account]').val(),
        'amount': this.$(':input[name=amount]').val()
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

  var TimecardsView = Backbone.View.extend({
    initialize: function(){
      _.bindAll(this);
      this.collection.bind('reset', this.addAll);
      this.collection.bind('add', this.addOne);
      this.collection.bind('change', this.change);
      this.collection.bind('destroy', this.destroy);
      this.collection.bind('all', this.test);

      this.timecardView = new TimecardView();
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
      this.timecardView.model = new Timecard({
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
      fcEvent.color = window.config.colors[timecard.get('job')];
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
    }
  });

  var TimecardView = Backbone.View.extend({
    el: $('#timecardDialog'),
    templateForm: _.template($('#timecardFormTemplate').html()),
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
      $("#timecard").html(this.templateForm());

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

    var timecards = new Timecards();
    new TimecardsView({
      el: $("#timecards"),
      collection: timecards
    }).render();

    var expenses = new Expenses();
    new ExpensesView({
      collection: expenses
    }).render();
  });
});