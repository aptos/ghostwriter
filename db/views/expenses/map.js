function(doc) {
  if (doc.collection == "expenses") {
    emit(doc.id, [doc.date, doc.vendor, doc.category, doc.description, doc.account, doc.amount]);
  }
};