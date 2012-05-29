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
      _.bindAll(this);
      this.collection.bind('add', this.addOne);
      this.collection.bind('select', this.select);
      this.collection.bind('all', this.test);

      this.expenseView = new ExpenseView();
    },
    events: {
      'click #add-expense': 'newExpense',
      'click #add-deposit': 'newDeposit',
      'click #add-paycheck': 'newPaycheck',
      'click #expenseTable tbody tr': 'select'
    },
    test: function(data){
      console.info(data);
    },
    newExpense:function (event) {
      console.info("newExpense!")
      var expenseView = new ExpenseView();
      expenseView.collection = this.collection;
      expenseView.model = new Expense();
      expenseView.render('Expense');
      return false;
    },
    newDeposit:function (event) {
      console.info("newDeposit!")
      var expenseView = new ExpenseView();
      expenseView.collection = this.collection;
      expenseView.model = new Expense();
      expenseView.render('Deposit');
      return false;
    },
    newPaycheck:function (event) {
      console.info("newPaycheck!")
      var expenseView = new ExpenseView();
      expenseView.collection = this.collection;
      expenseView.model = new Expense();
      expenseView.render('Paycheck');
      return false;
    },
    addOne: function(expense) {
      var expenseRow = [];
      $.each(expense.attributes, function(key, value){
        expenseRow.push(value);
      });
      $('#expenseTable').dataTable().fnAddData(expenseRow);
      this.updateBalance();
    },
    updateBalance: function(){
      var balance = 0.0;
      var amount = 0.0
      _.each(this.collection.models, function(model){
        if(model.attributes.amount){
          balance = balance + parseFloat(model.attributes.amount);
        }
      });
      balance = balance.formatMoney(2, '.', ',');
      $('#balance').text(balance)
    },
    select: function(e){
      console.info(e.currentTarget)
      if ( $(e.currentTarget).hasClass('row_selected') ) {
        $(e.currentTarget).removeClass('row_selected');
      }
      else {
        this.expense_table.$('tr.row_selected').removeClass('row_selected');
        $(e.currentTarget).addClass('row_selected');
      }
    },
    render: function(){
      var viewScope = this;
      var row = [];
      viewScope.expense_table.html(this.expenseHeaders());
      this.collection.fetch({
        success: function(data){
          var myData = [];
          _.each(data.models, function(model){
            row = []
            $.each(model.attributes, function(key,value){
              if(key != '_id' && key != '_rev') {
                row.push(value);
              }
            });
            myData.push(row);
          });
          viewScope.expense_table.dataTable({
            "aaData": myData
          });
          viewScope.updateBalance();
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
    render: function(type) {
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

      $( "#datepicker" ).datepicker();

      if (type == 'Expense') {
        $('.expense').show();
        this.$(':input[name=category]').val('Miscellaneous')
        this.updateAvailableVendors();
      } else if (type == 'Deposit') {
        this.$(':input[name=category]').val('Deposit')
        $('.expense').hide();
      } else if (type == 'Paycheck'){
        console.info("Paycheck")
        this.$(':input[name=category]').val('Labor')
      };

      this.el.dialog({
        modal: true,
        title: (this.model.isNew() ? 'New' : 'Edit') + ' ' + type,
        buttons: buttons,
        open: this.open
      });
      return this;
    },
    updateAvailableVendors: function() {
      // Setup autocomplete list from vendor list in the collection
      var availableVendors = [];
      var u = {};
      var vendor = '';
      _.each(this.collection.models, function(model){
        vendor = model.attributes.vendor
        if (vendor && !(vendor in u)){
          availableVendors.push(vendor);
          u[vendor] = 1;
        }
      });
      $( "#vendor" ).autocomplete({
        source: availableVendors
      });
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
    },
    unpaidTimecards: function() {
      console.info('unpaid timecards')
      _.each(this.collection.models, function(model){
        if(model.attributes.amount){
          console.info(model.attributes.payment, model.attributes.paid);
        }
      });
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
    formatDate: function(date){
      if(typeof(date) == 'string'){
        date = date.replace(/T.*/,'');
      }
      return date ;
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
      var startDate = this.formatDate(this_model.get('start'));
      this.$('#start').text(startDate);
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

  Number.prototype.formatMoney = function(c, d, t){
    var n = this, c = isNaN(c = Math.abs(c)) ? 2 : c, d = d == undefined ? "," : d, t = t == undefined ? "." : t, s = n < 0 ? "-" : "", i = parseInt(n = Math.abs(+n || 0).toFixed(c)) + "", j = (j = i.length) > 3 ? j % 3 : 0;
    return s + (j ? i.substr(0, j) + t : "") + i.substr(j).replace(/(\d{3})(?=\d)/g, "$1" + t) + (c ? d + Math.abs(n - i).toFixed(c).slice(2) : "");
  };

  $.getJSON("configuration", function(configData){
    window.config = configData;

    $( "#tabs" ).tabs();
    
    var expenses = new Expenses();
    var expensesView = new ExpensesView({
      collection: expenses
    });
    expensesView.render();

    var timecards = new Timecards();
    var timecardsView = new TimecardsView({
      el: $("#timecards"),
      collection: timecards
    });
    timecardsView.render();
    timecards.fetch();
  });
});