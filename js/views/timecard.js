$(function () {

  App.Model.Timecard = Backbone.Model.extend();

  App.View.TimecardView = Backbone.View.extend({
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
      var supervisor_payment = config.rates['supervisor'] * this.$("input[name=supervisor_hours]").val();
      var worker_payment = config.rates['worker'] * this.$('input[name=worker_hours]').val() * this.$('input[name=worker_count]').val();
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
      var startDate = formatDate(this_model.get('start'));
      this.$('#start').text(startDate);
      this.$(":input").each( function(){
        $(this).val(this_model.get($(this).attr('name')))
      });
      $(":input[name='paid']").prop("checked", this_model.get('paid'))
      this.updatePaid();
    },
    save: function() {
      var supervisor_payment = config.rates['supervisor'] * this.$(':input[name=supervisor_hours]').val();
      var worker_payment = config.rates['worker'] * this.$(':input[name=worker_hours]').val() * this.$(':input[name=worker_count]').val();
      var payment = supervisor_payment + worker_payment;
      this.model.set({
        'title': config.jobs[this.$(':input[name=job]').val()] + ":" + config.locations[this.$(':input[name=location]').val()],
        'color': config.colors[this.$(':input[name=job]').val()],
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

});