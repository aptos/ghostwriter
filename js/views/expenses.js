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
      this.collection.bind('all', this.test);

      this.expenseView = new App.View.ExpenseView();
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
      
      console.info("newExpense!1123")
      
      var expenseView = new App.View.ExpenseView();
      expenseView.collection = this.collection;
      expenseView.model = new App.Model.Expense();
      console.log(expenseView.el)
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

  Number.prototype.formatMoney = function(c, d, t){
    var n = this, c = isNaN(c = Math.abs(c)) ? 2 : c, d = d == undefined ? "," : d, t = t == undefined ? "." : t, s = n < 0 ? "-" : "", i = parseInt(n = Math.abs(+n || 0).toFixed(c)) + "", j = (j = i.length) > 3 ? j % 3 : 0;
    return s + (j ? i.substr(0, j) + t : "") + i.substr(j).replace(/(\d{3})(?=\d)/g, "$1" + t) + (c ? d + Math.abs(n - i).toFixed(c).slice(2) : "");
  };
  
});
