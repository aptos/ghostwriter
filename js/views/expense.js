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
        this.$(':input[name=category]').val('Miscellaneous')
        this.updateAvailableVendors();
      } else if (type == 'Deposit') {
        this.$(':input[name=category]').val('Deposit')
        $('.expense').hide();
      } else if (type == 'Paycheck'){
        console.info("Paycheck")
        var list = timecards_view.unpaidTimecards();
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
});