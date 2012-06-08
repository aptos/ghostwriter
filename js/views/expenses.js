$(function () {

  App.Model.Expenses = Backbone.Collection.extend({
    db : {
      view : "expenses",
      changes : false
    },
    url : "/expenses",
    model: App.Model.Expense
  });

  App.View.ExpensesView = Backbone.View.extend({
    expense_table: $('#expenseTable'),
    expenseHeaders: _.template($('#expenseTableTemplate').html()),
    initialize: function(){
      _.bindAll(this);
      this.collection.bind('add', this.addOne);
      this.collection.bind('select', this.select);
      this.collection.bind('destroy', this.destroy);
      this.collection.bind('change', this.change);
      this.collection.bind('all', this.test);

      this.expenseView = new App.View.ExpenseView();
    },
    events: {
      'click #add-expense': 'newExpense',
      'click #add-deposit': 'newDeposit',
      'click #add-paycheck': 'newPaycheck',
      'hover #expenseTable tbody tr': 'select',
      'click #expenseTable tbody tr': 'edit'
    },
    test: function(data){
      console.info(data);
    },
    newExpense:function (event) {
      console.info("newExpense!")
      var expenseView = new App.View.ExpenseView();
      expenseView.collection = this.collection;
      expenseView.model = new App.Model.Expense();
      expenseView.render('Expense');
      return false;
    },
    newDeposit:function (event) {
      console.info("newDeposit!")
      var expenseView = new App.View.ExpenseView();
      expenseView.collection = this.collection;
      expenseView.model = new App.Model.Expense();
      expenseView.render('Deposit');
      return false;
    },
    newPaycheck:function (event) {
      console.info("newPaycheck!")
      var expenseView = new App.View.ExpenseView();
      expenseView.collection = this.collection;
      expenseView.model = new App.Model.Expense();
      expenseView.render('Paycheck');
      return false;
    },
    addOne: function(expense) {
      var expenseRow = [expense.attributes._id];
      _.each(config.expense_columns, function(value){
        if (value != 'id'  ){
          expenseRow.push(expense.attributes[value.toLowerCase()])
        }
      });
      $('#expenseTable').dataTable().fnAddData(expenseRow);
      this.updateBalance();
    },
    change: function(expense) {
      var expenseRow = [expense.attributes._id];
      _.each(config.expense_columns, function(value){
        if (value != 'id'  ){
          expenseRow.push(expense.attributes[value.toLowerCase()])
        }
      });
      $('#expenseTable').dataTable().fnUpdate(expenseRow, this.selected_row);
      this.updateBalance();
    },
    destroy: function() {
      this.expense_table.fnDeleteRow(this.selected_row);
    },
    updateBalance: function(){
      var expenses = 0.0,
      deposits = 0.0;
      _.each(this.collection.models, function(model){
        if(model.attributes.amount){
          if (model.attributes.category == 'deposit'){
            deposits = deposits + parseFloat(model.attributes.amount);
          } else {
            expenses = expenses + parseFloat(model.attributes.amount);
          }
        }
      });
      expenses = expenses.formatMoney();
      $('#expenses_total').text(expenses);
      deposits = deposits.formatMoney();
      $('#deposits_total').text(deposits);
    },
    select: function(e){
      var data = this.expense_table.fnGetData(e.currentTarget)
      if ( $(e.currentTarget).hasClass('row_selected') ) {
        $(e.currentTarget).removeClass('row_selected');
      }
      else {
        this.expense_table.$('tr.row_selected').removeClass('row_selected');
        $(e.currentTarget).addClass('row_selected');
      }
    },
    edit: function(e) {
      this.selected_row = e.currentTarget;
      var data = this.expense_table.fnGetData(e.currentTarget)
      this.expenseView.model = this.collection.get(data[0]);
      this.expenseView.render('Expense');
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
              if(key != '_rev') {
                row.push(value);
              }
            });
            myData.push(row);
          });
          viewScope.expense_table.dataTable({
            "aaData": myData,
            "aoColumnDefs": [
            {
              "bSearchable": false,
              "bVisible": false,
              "aTargets": [ 0 ]
            }
            ]
          });
          viewScope.updateBalance();
        }
      });
    }
  });
  
});
