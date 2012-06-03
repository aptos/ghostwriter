$(function () {

  App.Model.Expense = Backbone.Model.extend();

  App.View.ExpenseView = Backbone.View.extend({
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
      $("#unpaidTimecards").empty();
      var category = 'miscellaneous';
      this.updateAvailableVendors();
      if (type == 'Expense') {
        $('.expense').show();
      } else if (type == 'Deposit') {
        category = 'deposit';
        $('.expense').hide();
      } else if (type == 'Paycheck'){
        category = 'labor';
        var timecardTotal = this.timecardDetails();
      };
      this.el.dialog({
        modal: true,
        title: (this.model.isNew() ? 'New' : 'Edit') + ' ' + type,
        buttons: buttons,
        open: this.open
      });
      if (this.model.isNew()) {
        this.$('select[name=category]').val(category);
        if(timecardTotal){
          this.$('input[name=amount]').val(timecardTotal);
        }
      }
      return this;
    },
    timecardDetails: function() {
      console.info('timecardDetails')
      var unpaidTimecardList = timecards_view.unpaidTimecards();
      var timecardTotal = 0.0;
      var id_list = [];
      if (unpaidTimecardList.length){
        _.each(unpaidTimecardList, function(timecard){
          id_list.push(timecard._id);
          timecardTotal = timecardTotal + timecard.payment;
          $("#unpaidTimecards").append(
            "<tr class='timecard_row' id=" +
            timecard._id + ">" +
            "<td>" + timecard.title + "</td>" +
            "<td>" + formatDate(timecard.start) + "</td></tr>");
        });
      }
      this.model.id_list = id_list;
      return timecardTotal;
    },
    updateAvailableVendors: function() {
      // Setup autocomplete list from vendor list in the collection
      var attrs = _.pluck(this.collection.models,'attributes');
      var vendors = _.pluck(attrs,'vendor');
      vendors = _.uniq(vendors);
      $( "#vendor" ).autocomplete({
        source: vendors
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
      if (this.model.id_list) {
        timecards_view.payTimecards(this.model.id_list);
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
});