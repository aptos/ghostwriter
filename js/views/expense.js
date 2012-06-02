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

      if (type == 'Expense') {
        $('.expense').show();
        this.$('select[name=category]').val('miscellaneous');
        this.updateAvailableVendors();
      } else if (type == 'Deposit') {
        this.$('select[name=category]').val('deposit');
        $('.expense').hide();
      } else if (type == 'Paycheck'){
        this.$('select[name=category]').val('labor');
        var unpaidTimecardList = timecards_view.unpaidTimecards();
        if (unpaidTimecardList.length){
          _.each(unpaidTimecardList, function(timecard){
            $("#unpaidTimecards").append("<tr class='timecard_row'><td>" +
              timecard.title + "</td></tr>");
          });
        }
      };
      console.log(this.el.html())
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